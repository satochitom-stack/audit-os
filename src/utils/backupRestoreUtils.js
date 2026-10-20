// src/utils/backupRestoreUtils.js
// Durable Safety Snapshot, Preflight Validation, Conflict Detection, and Recovery Utilities
// Built for Phase 6A Tenant Isolation & Data Loss Prevention

export const AUDIT_MODULE_METADATA = {
  orgProfile: { label: 'ข้อมูลองค์กรและโปรไฟล์ผู้ตรวจสอบ', isYearly: false },
  auditUniverseByYear: { label: 'จักรวาลการตรวจสอบ (Audit Universe)', isYearly: true, legacyKey: 'auditUniverse' },
  engagementPlansByYear: { label: 'แผนการปฏิบัติงานรายบุคคล (Engagement Plans)', isYearly: true, legacyKey: 'engagementPlans' },
  annualPlansByYear: { label: 'แผนการตรวจสอบประจำปี (Annual Plans)', isYearly: true, legacyKey: 'annualPlans' },
  workingPapersByYear: { label: 'กระดาษทำการ (Working Papers)', isYearly: true, legacyKey: 'workingPapers' },
  riskAssessmentsByYear: { label: 'การประเมินความเสี่ยง (Risk Assessments)', isYearly: true, legacyKey: 'riskAssessments' },
  internalControlsByYear: { label: 'การควบคุมภายใน (Internal Controls)', isYearly: true, legacyKey: 'internalControls' },
  riskManagementByYear: { label: 'การบริหารความเสี่ยง (Risk Management)', isYearly: true, legacyKey: 'riskManagement' },
  lpaIndicatorsByYear: { label: 'ตัวชี้วัด LPA (LPA Indicators)', isYearly: true, legacyKey: 'lpaIndicators' },
  auditCharterByYear: { label: 'กฎบัตรการตรวจสอบภายใน (Audit Charter)', isYearly: true, legacyKey: 'auditCharter' },
  strategicPlan: { label: 'แผนยุทธศาสตร์ 3 ปี (Strategic Plan)', isYearly: false },
  capaFindingsByYear: { label: 'ข้อสังเกตและทะเบียนติดตาม (CAPA & Findings)', isYearly: true, legacyKey: 'capaFindings' },
  riskFeedbackLinkagesByYear: { label: 'ความเชื่อมโยงข้อสังเกตสู่ความเสี่ยง (Risk Feedback)', isYearly: true }
};

// 25 MB max threshold for safety snapshot serialization
export const MAX_SNAPSHOT_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_RETAINED_SNAPSHOTS = 3;

const DB_NAME = 'AuditOS_SafetySnapshots';
const DB_VERSION = 1;
const STORE_NAME = 'tenant_safety_snapshots';

// Test hooks
let _forceSnapshotFailureForTest = false;
let _mockIndexedDB = null;
let _snapshotSeq = 0;

export function setForceSnapshotFailureForTest(shouldFail) {
  _forceSnapshotFailureForTest = Boolean(shouldFail);
}

export function setMockIndexedDBForTest(customIdb) {
  _mockIndexedDB = customIdb;
}

/**
 * Resolves the active IndexedDB implementation
 */
function getIDB() {
  if (_mockIndexedDB) return _mockIndexedDB;
  if (typeof window !== 'undefined' && window.indexedDB) return window.indexedDB;
  if (typeof global !== 'undefined' && global.indexedDB) return global.indexedDB;
  return null;
}

/**
 * Opens the IndexedDB database for safety snapshots
 */
export function openSnapshotDB() {
  return new Promise((resolve, reject) => {
    const idb = getIDB();
    if (!idb) {
      reject(new Error('IndexedDB is not available in the current runtime environment'));
      return;
    }

    const request = idb.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('tenantKey', 'tenantKey', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Validates the backup payload structure before applying any changes.
 * @param {any} payload
 * @returns {{ valid: boolean, error?: string, recognizedModules?: string[] }}
 */
export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      valid: false,
      error: 'ไฟล์สำรองข้อมูลไม่ถูกต้อง: โครงสร้างข้อมูลต้องเป็น JSON Object'
    };
  }

  const recognizedModules = [];
  for (const [key, meta] of Object.entries(AUDIT_MODULE_METADATA)) {
    if (payload[key] !== undefined || (meta.legacyKey && payload[meta.legacyKey] !== undefined)) {
      recognizedModules.push(key);
    }
  }

  if (recognizedModules.length === 0) {
    return {
      valid: false,
      error: 'ไฟล์สำรองข้อมูลไม่ถูกต้อง: ไม่พบข้อมูลการตรวจสอบภายในที่ระบบรองรับ'
    };
  }

  for (const modKey of recognizedModules) {
    const meta = AUDIT_MODULE_METADATA[modKey];
    const hasCurrentShape = payload[modKey] !== undefined;
    const hasLegacyShape = !hasCurrentShape && meta.legacyKey && payload[meta.legacyKey] !== undefined;
    const val = hasCurrentShape
      ? payload[modKey]
      : hasLegacyShape
      ? payload[meta.legacyKey]
      : undefined;

    if (meta.isYearly && val !== undefined) {
      // Current "*ByYear" modules must be an object keyed by fiscal year.
      // Older backups may store the legacy alias as a single-year array/object.
      const isLegacyArray = Boolean(hasLegacyShape && Array.isArray(val));
      if (val === null || typeof val !== 'object' || (!isLegacyArray && Array.isArray(val))) {
        return {
          valid: false,
          error: `โครงสร้างข้อมูลไม่ถูกต้องในโมดูล "${meta.label}" (ต้องเป็น Object แยกตามปีงบประมาณ)`
        };
      }

      // A fiscal-year map cannot contain scalar or null year entries.
      if (!isLegacyArray) {
        for (const [year, yearData] of Object.entries(val)) {
          if (yearData === null || typeof yearData !== 'object') {
            return {
              valid: false,
              error: `โครงสร้างข้อมูลไม่ถูกต้องในโมดูล "${meta.label}" ปี "${year}"`
            };
          }
        }
      }
    }
  }

  return {
    valid: true,
    recognizedModules
  };
}

/**
 * Checks if a module's dataset is considered non-empty in a tenant workspace.
 */
export function isModuleDataNonEmpty(modKey, data) {
  if (data === undefined || data === null) return false;

  const meta = AUDIT_MODULE_METADATA[modKey];
  if (!meta) return Boolean(data);

  if (modKey === 'orgProfile') {
    return Boolean(data && typeof data === 'object' && (data.name?.trim() || data.auditorName?.trim()));
  }

  if (meta.isYearly) {
    if (typeof data !== 'object') return false;
    for (const yr of Object.keys(data)) {
      const yrData = data[yr];
      if (Array.isArray(yrData) && yrData.length > 0) return true;
      if (yrData && typeof yrData === 'object' && !Array.isArray(yrData) && Object.keys(yrData).length > 0) return true;
    }
    return false;
  }

  if (Array.isArray(data)) {
    return data.length > 0;
  }

  return typeof data === 'object' ? Object.keys(data).length > 0 : Boolean(data);
}

/**
 * Detects whether the current active tenant contains existing data that would be replaced.
 */
export function detectImportConflicts(currentTenantData, backupPayload, session = null) {
  const affectedModules = [];
  const affectedYearsSet = new Set();

  for (const [modKey, meta] of Object.entries(AUDIT_MODULE_METADATA)) {
    const currentVal = currentTenantData ? currentTenantData[modKey] : undefined;
    const backupVal = backupPayload ? (backupPayload[modKey] || (meta.legacyKey ? backupPayload[meta.legacyKey] : undefined)) : undefined;

    const hasCurrent = isModuleDataNonEmpty(modKey, currentVal);
    const hasIncoming = isModuleDataNonEmpty(modKey, backupVal);

    if (hasCurrent && hasIncoming) {
      affectedModules.push(meta.label);

      if (meta.isYearly && typeof currentVal === 'object' && typeof backupVal === 'object') {
        const currentYears = Object.keys(currentVal || {});
        const backupYears = Object.keys(backupVal || {});
        for (const yr of backupYears) {
          if (currentYears.includes(yr)) {
            affectedYearsSet.add(yr);
          }
        }
      }
    }
  }

  const currentOrg = (session?.organization || currentTenantData?.orgProfile?.name || '').trim();
  const backupOrg = (backupPayload?.orgProfile?.name || '').trim();
  const orgMismatch = Boolean(currentOrg && backupOrg && currentOrg.toLowerCase() !== backupOrg.toLowerCase());

  const affectedYears = Array.from(affectedYearsSet).sort();
  const hasConflict = affectedModules.length > 0;

  let summaryParts = [];
  if (hasConflict) {
    summaryParts.push(`พบข้อมูลเดิมที่จะถูกเขียนทับใน ${affectedModules.length} โมดูล`);
    if (affectedYears.length > 0) {
      summaryParts.push(`ครอบคลุมปีงบประมาณ: ${affectedYears.join(', ')}`);
    }
  }
  if (orgMismatch) {
    summaryParts.push(`คำเตือน: ไฟล์สำรองมาจาก "${backupOrg}" ซึ่งไม่ตรงกับหน่วยงานที่กำลังใช้งาน ("${currentOrg}")`);
  }

  return {
    hasConflict,
    orgMismatch,
    backupOrg,
    currentOrg,
    affectedModules,
    affectedYears,
    summaryMessage: summaryParts.join(' | ')
  };
}

/**
 * Creates a durable, recoverable pre-import safety snapshot of the active tenant in IndexedDB.
 * Sequence:
 * 1. Check test hook failure.
 * 2. Validate payload size against MAX_SNAPSHOT_SIZE_BYTES.
 * 3. Write snapshot to IndexedDB.
 * 4. Read back and verify snapshot integrity.
 * 5. Safely prune older snapshots only after verification succeeds (never prune the only verified snapshot).
 */
export async function createTenantSafetySnapshot(currentTenantData, session = null) {
  if (_forceSnapshotFailureForTest) {
    return {
      success: false,
      error: 'Simulated snapshot storage failure (QuotaExceededError or forced fault)'
    };
  }

  const username = session?.username || session?.user?.username || 'anonymous';
  const tenantKey = username.toLowerCase();
  const timestamp = Date.now() + (++_snapshotSeq);
  const snapshotId = `SAFETY-SNAP-${tenantKey}-${timestamp}`;


  // Ensure platform-global datasets (users, departments, auth records) are NEVER stored in a Tenant Safety Snapshot
  const sanitizedTenantData = currentTenantData && typeof currentTenantData === 'object'
    ? { ...currentTenantData }
    : {};
  delete sanitizedTenantData.users;
  delete sanitizedTenantData.departments;
  delete sanitizedTenantData.platform_users;
  delete sanitizedTenantData.systemSettings;

  let serialized;
  try {
    serialized = JSON.stringify(sanitizedTenantData);
  } catch (serErr) {
    return {
      success: false,
      error: `Snapshot serialization failed: ${serErr.message}`
    };
  }

  let sizeBytes = null;
  try {
    if (typeof Buffer !== 'undefined' && typeof Buffer.byteLength === 'function') {
      sizeBytes = Buffer.byteLength(serialized, 'utf8');
    } else if (typeof Blob !== 'undefined') {
      sizeBytes = new Blob([serialized]).size;
    } else if (typeof TextEncoder !== 'undefined') {
      sizeBytes = new TextEncoder().encode(serialized).length;
    }
  } catch (calcErr) {
    return {
      success: false,
      error: `Snapshot size calculation failed: ${calcErr.message}`
    };
  }

  if (typeof sizeBytes !== 'number' || isNaN(sizeBytes)) {
    return {
      success: false,
      error: 'Snapshot size calculation failed: Environment does not support safe UTF-8 byte calculation'
    };
  }

  if (sizeBytes > MAX_SNAPSHOT_SIZE_BYTES) {
    return {
      success: false,
      error: `Snapshot payload size (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds maximum limit (${MAX_SNAPSHOT_SIZE_BYTES / (1024 * 1024)} MB)`
    };
  }

  const snapshotRecord = {
    id: snapshotId,
    tenantKey,
    username,
    organization: session?.organization || currentTenantData?.orgProfile?.name || '',
    timestamp,
    isoTime: new Date(timestamp).toISOString(),
    data: JSON.parse(serialized),
    sizeBytes
  };

  let db;
  try {
    db = await openSnapshotDB();
  } catch (dbErr) {
    return {
      success: false,
      error: `Cannot open durable snapshot storage (IndexedDB): ${dbErr.message}`
    };
  }

  // 1. Write new snapshot
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(snapshotRecord);
      req.onerror = () => reject(req.error || new Error('IndexedDB put failed'));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    });
  } catch (putErr) {
    db.close();
    return {
      success: false,
      error: `Failed to write snapshot to IndexedDB: ${putErr.message}`
    };
  }

  // 2. Read-back verification
  let verifiedRecord = null;
  try {
    verifiedRecord = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(snapshotId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('IndexedDB readback failed'));
    });
  } catch (readErr) {
    db.close();
    return {
      success: false,
      error: `Read-back verification query failed: ${readErr.message}`
    };
  }

  if (!verifiedRecord || verifiedRecord.id !== snapshotId || !verifiedRecord.data) {
    db.close();
    return {
      success: false,
      error: 'Read-back verification failed: Stored snapshot does not match input'
    };
  }

  // 3. Bounded Retention Pruning (Only executed after verification succeeds!)
  try {
    const allSnaps = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll ? store.getAll() : null;
      if (req) {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } else {
        // Fallback if getAll not supported
        resolve([verifiedRecord]);
      }
    });

    const tenantSnaps = allSnaps
      .filter((s) => s && s.tenantKey === tenantKey)
      .sort((a, b) => b.timestamp - a.timestamp);

    // If more than MAX_RETAINED_SNAPSHOTS, prune from the 4th onward
    if (tenantSnaps.length > MAX_RETAINED_SNAPSHOTS) {
      const toDelete = tenantSnaps.slice(MAX_RETAINED_SNAPSHOTS);
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        toDelete.forEach((snap) => {
          // Never delete the current verified snapshot
          if (snap.id !== snapshotId) {
            store.delete(snap.id);
          }
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false); // Non-fatal if pruning fails
      });
    }
  } catch (pruneErr) {
    console.warn('Snapshot retention pruning notice:', pruneErr);
  } finally {
    db.close();
  }

  return {
    success: true,
    snapshotId,
    timestamp,
    storageType: 'indexeddb_verified'
  };
}

/**
 * Retrieves the latest verified safety snapshot for the active tenant from IndexedDB.
 */
export async function getLatestSafetySnapshot(session = null) {
  const username = session?.username || session?.user?.username || 'anonymous';
  const tenantKey = username.toLowerCase();

  let db;
  try {
    db = await openSnapshotDB();
  } catch (err) {
    console.warn('Cannot open IndexedDB for snapshot query:', err);
    return null;
  }

  try {
    const allSnaps = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      if (store.getAll) {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } else {
        resolve([]);
      }
    });

    const tenantSnaps = allSnaps
      .filter((s) => s && s.tenantKey === tenantKey)
      .sort((a, b) => b.timestamp - a.timestamp);

    return tenantSnaps.length > 0 ? tenantSnaps[0] : null;
  } catch (err) {
    console.warn('Failed to retrieve safety snapshot from IndexedDB:', err);
    return null;
  } finally {
    db.close();
  }
}

/**
 * Restores the most recent valid pre-import safety snapshot for the active tenant.
 * Validates payload structure and invokes applyCallback.
 */
export async function restoreLatestSafetySnapshot({ session, applyCallback }) {
  const latestSnap = await getLatestSafetySnapshot(session);
  if (!latestSnap || !latestSnap.data) {
    return {
      success: false,
      reason: 'no_snapshot',
      error: 'ไม่พบจุดสำรองข้อมูลก่อนนำเข้าสำหรับผู้ใช้งานนี้'
    };
  }

  const validation = validateBackupPayload(latestSnap.data);
  if (!validation.valid) {
    return {
      success: false,
      reason: 'corrupt_snapshot',
      error: `ข้อมูลจุดสำรองเสียหาย: ${validation.error}`
    };
  }

  if (typeof applyCallback === 'function') {
    applyCallback(latestSnap.data);
  }

  return {
    success: true,
    snapshotId: latestSnap.id,
    timestamp: latestSnap.timestamp,
    isoTime: latestSnap.isoTime,
    restoredModules: validation.recognizedModules
  };
}

/**
 * Orchestrates a safe import workflow with strict preflight verification.
 */
export async function orchestrateSafeImport({
  backupPayload,
  currentTenantData,
  session,
  confirmCallback,
  applyImportCallback
}) {
  // Step 1: Validate payload
  const validation = validateBackupPayload(backupPayload);
  if (!validation.valid) {
    return {
      success: false,
      reason: 'invalid_payload',
      error: validation.error
    };
  }

  // Step 2: Detect conflicts
  const conflictInfo = detectImportConflicts(currentTenantData, backupPayload, session);

  // Step 3: Require explicit confirmation if conflicts or org mismatch exist
  if (conflictInfo.hasConflict || conflictInfo.orgMismatch) {
    if (typeof confirmCallback === 'function') {
      const confirmed = await confirmCallback({ conflictInfo });
      if (!confirmed) {
        return {
          success: false,
          reason: 'cancelled',
          conflictInfo
        };
      }
    }
  }

  // Step 4: Create durable safety snapshot in IndexedDB
  const snapshotResult = await createTenantSafetySnapshot(currentTenantData, session);
  if (!snapshotResult.success) {
    return {
      success: false,
      reason: 'snapshot_failed',
      error: snapshotResult.error || 'Failed to create durable safety snapshot'
    };
  }

  // Step 5: Validation, confirmation, and snapshot all succeeded -> apply changes
  if (typeof applyImportCallback === 'function') {
    applyImportCallback(backupPayload);
  }

  return {
    success: true,
    reason: 'applied',
    snapshotId: snapshotResult.snapshotId,
    conflictInfo
  };
}

/**
 * Applies a validated backup or snapshot payload into tenant state setters.
 * Strictly guarantees that platform-global datasets (users, departments, auth records)
 * are NEVER touched or overwritten, even if present in the payload or called by an admin session.
 *
 * @param {object} validatedPayload - Validated JSON backup or snapshot payload
 * @param {object} setters - Map of state setters
 * @param {object} [options] - Contextual options like selectedYear
 * @returns {string[]} List of applied module keys
 */
export function applyTenantImportPayload(validatedPayload, setters = {}, options = {}) {
  if (!validatedPayload || typeof validatedPayload !== 'object') return [];
  const selectedYear = options.selectedYear || '2569';
  const appliedModules = [];

  // Platform-global datasets (users, departments) are strictly ignored and never applied to tenant workspace
  if (validatedPayload.orgProfile && typeof setters.setOrgProfile === 'function') {
    setters.setOrgProfile(validatedPayload.orgProfile);
    appliedModules.push('orgProfile');
  }
  if (validatedPayload.fiscalYears && typeof setters.setFiscalYears === 'function') {
    setters.setFiscalYears(validatedPayload.fiscalYears);
    appliedModules.push('fiscalYears');
  }
  if (typeof setters.setAuditUniverseByYear === 'function') {
    if (validatedPayload.auditUniverseByYear) {
      setters.setAuditUniverseByYear(validatedPayload.auditUniverseByYear);
      appliedModules.push('auditUniverseByYear');
    } else if (validatedPayload.auditUniverse) {
      setters.setAuditUniverseByYear({ [selectedYear]: validatedPayload.auditUniverse });
      appliedModules.push('auditUniverseByYear');
    }
  }
  if (typeof setters.setEngagementPlansByYear === 'function') {
    if (validatedPayload.engagementPlansByYear) {
      setters.setEngagementPlansByYear(validatedPayload.engagementPlansByYear);
      appliedModules.push('engagementPlansByYear');
    } else if (validatedPayload.engagementPlans) {
      setters.setEngagementPlansByYear({ [selectedYear]: validatedPayload.engagementPlans });
      appliedModules.push('engagementPlansByYear');
    }
  }
  if (typeof setters.setAnnualPlansByYear === 'function') {
    if (validatedPayload.annualPlansByYear) {
      setters.setAnnualPlansByYear(validatedPayload.annualPlansByYear);
      appliedModules.push('annualPlansByYear');
    } else if (validatedPayload.annualPlans) {
      setters.setAnnualPlansByYear({ [selectedYear]: validatedPayload.annualPlans });
      appliedModules.push('annualPlansByYear');
    }
  }
  if (typeof setters.setWorkingPapersByYear === 'function') {
    if (validatedPayload.workingPapersByYear) {
      setters.setWorkingPapersByYear(validatedPayload.workingPapersByYear);
      appliedModules.push('workingPapersByYear');
    } else if (validatedPayload.workingPapers) {
      setters.setWorkingPapersByYear({ [selectedYear]: validatedPayload.workingPapers });
      appliedModules.push('workingPapersByYear');
    }
  }
  if (typeof setters.setRiskAssessmentsByYear === 'function') {
    if (validatedPayload.riskAssessmentsByYear) {
      setters.setRiskAssessmentsByYear(validatedPayload.riskAssessmentsByYear);
      appliedModules.push('riskAssessmentsByYear');
    } else if (validatedPayload.riskAssessments) {
      setters.setRiskAssessmentsByYear({ [selectedYear]: validatedPayload.riskAssessments });
      appliedModules.push('riskAssessmentsByYear');
    }
  }
  if (typeof setters.setInternalControlsByYear === 'function') {
    if (validatedPayload.internalControlsByYear) {
      setters.setInternalControlsByYear(validatedPayload.internalControlsByYear);
      appliedModules.push('internalControlsByYear');
    } else if (validatedPayload.internalControls) {
      setters.setInternalControlsByYear({ [selectedYear]: validatedPayload.internalControls });
      appliedModules.push('internalControlsByYear');
    }
  }
  if (typeof setters.setRiskManagementByYear === 'function') {
    if (validatedPayload.riskManagementByYear) {
      setters.setRiskManagementByYear(validatedPayload.riskManagementByYear);
      appliedModules.push('riskManagementByYear');
    } else if (validatedPayload.riskManagement) {
      setters.setRiskManagementByYear({ [selectedYear]: validatedPayload.riskManagement });
      appliedModules.push('riskManagementByYear');
    }
  }
  if (typeof setters.setLpaIndicatorsByYear === 'function') {
    if (validatedPayload.lpaIndicatorsByYear) {
      setters.setLpaIndicatorsByYear(validatedPayload.lpaIndicatorsByYear);
      appliedModules.push('lpaIndicatorsByYear');
    } else if (validatedPayload.lpaIndicators) {
      setters.setLpaIndicatorsByYear({ [selectedYear]: validatedPayload.lpaIndicators });
      appliedModules.push('lpaIndicatorsByYear');
    }
  }
  if (typeof setters.setAuditCharterByYear === 'function') {
    if (validatedPayload.auditCharterByYear) {
      setters.setAuditCharterByYear(validatedPayload.auditCharterByYear);
      appliedModules.push('auditCharterByYear');
    } else if (validatedPayload.auditCharter) {
      setters.setAuditCharterByYear({ [selectedYear]: validatedPayload.auditCharter });
      appliedModules.push('auditCharterByYear');
    }
  }
  if (validatedPayload.strategicPlan && Array.isArray(validatedPayload.strategicPlan) && typeof setters.setStrategicPlan === 'function') {
    setters.setStrategicPlan(validatedPayload.strategicPlan);
    appliedModules.push('strategicPlan');
  }
  if (typeof setters.setCapaFindingsByYear === 'function') {
    if (validatedPayload.capaFindingsByYear) {
      setters.setCapaFindingsByYear(validatedPayload.capaFindingsByYear);
      appliedModules.push('capaFindingsByYear');
    } else if (validatedPayload.capaFindings) {
      setters.setCapaFindingsByYear({ [selectedYear]: validatedPayload.capaFindings });
      appliedModules.push('capaFindingsByYear');
    }
  }
  if (validatedPayload.riskFeedbackLinkagesByYear && typeof setters.setRiskFeedbackLinkagesByYear === 'function') {
    setters.setRiskFeedbackLinkagesByYear(validatedPayload.riskFeedbackLinkagesByYear);
    appliedModules.push('riskFeedbackLinkagesByYear');
  }

  return appliedModules;
}
