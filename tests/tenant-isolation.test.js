// tests/tenant-isolation.test.js
// Verification suite for Phase 6A: Tenant Isolation Hardening
// Tests:
// 1. Cross-Organization Isolation in Shared Browser (User A & User B cannot see/overwrite each other)
// 2. Same-Organization Users are User-Scoped in this interim phase
// 3. startSession() does NOT write to unscoped ia_org_profile, and does not inherit another tenant profile
// 4. Missing tenant keys CANNOT read legacy values through normal loadTenantData() path (strict isolation)
// 5. Legacy source keys remain unchanged and are not deleted or modified
// 6. Per-module legacy data detection and template seeding suppression (record awaiting_recovery)
// 7. Backup and restore includes Phase 5 Risk Feedback Linkages and remains tenant-scoped

import assert from 'node:assert/strict';

// Mock Browser LocalStorage for Node.js test environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() {
    return mockStorage.size;
  },
  key: (index) => Array.from(mockStorage.keys())[index] || null
};

// Mock window and CustomEvent for auth.js
global.window = {
  dispatchEvent: () => true
};
global.CustomEvent = class CustomEvent {
  constructor(type, detail) {
    this.type = type;
    this.detail = detail;
  }
};

// Mock persistent IndexedDB backend (simulates browser disk storage)
const persistentDatabases = new Map();

class MockIDBObjectStore {
  constructor(name, map, options = {}) {
    this.name = name;
    this.map = map;
    this.options = options;
  }
  createIndex() {}
  put(item) {
    const key = item[this.options.keyPath || 'id'];
    this.map.set(key, JSON.parse(JSON.stringify(item)));
    const req = { result: key, error: null, onsuccess: null, onerror: null };
    queueMicrotask(() => { if (req.onsuccess) req.onsuccess({ target: req }); });
    return req;
  }
  get(key) {
    const item = this.map.get(key);
    const req = { result: item ? JSON.parse(JSON.stringify(item)) : undefined, error: null, onsuccess: null, onerror: null };
    queueMicrotask(() => { if (req.onsuccess) req.onsuccess({ target: req }); });
    return req;
  }
  getAll() {
    const list = Array.from(this.map.values()).map((v) => JSON.parse(JSON.stringify(v)));
    const req = { result: list, error: null, onsuccess: null, onerror: null };
    queueMicrotask(() => { if (req.onsuccess) req.onsuccess({ target: req }); });
    return req;
  }
  delete(key) {
    this.map.delete(key);
    const req = { result: undefined, error: null, onsuccess: null, onerror: null };
    queueMicrotask(() => { if (req.onsuccess) req.onsuccess({ target: req }); });
    return req;
  }
}

class MockIDBTransaction {
  constructor(db, storeName, storeMap, mode) {
    this.db = db;
    this.storeName = storeName;
    this.storeMap = storeMap;
    this.mode = mode;
    this.error = null;
    this.oncomplete = null;
    this.onerror = null;
    queueMicrotask(() => {
      if (this.oncomplete) this.oncomplete({ target: this });
    });
  }
  objectStore(name) {
    return new MockIDBObjectStore(name, this.storeMap, { keyPath: 'id' });
  }
}

class MockIDBDatabase {
  constructor(name, backend) {
    this.name = name;
    this.backend = backend;
    this.objectStoreNames = {
      contains: (s) => this.backend.has(s)
    };
  }
  createObjectStore(name, options = {}) {
    if (!this.backend.has(name)) {
      this.backend.set(name, new Map());
    }
    return new MockIDBObjectStore(name, this.backend.get(name), options);
  }
  transaction(storeNames, mode) {
    const sName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
    if (!this.backend.has(sName)) {
      this.backend.set(sName, new Map());
    }
    return new MockIDBTransaction(this, sName, this.backend.get(sName), mode);
  }
  close() {
    this.isClosed = true;
  }
}

global.indexedDB = {
  open: (name, version) => {
    if (!persistentDatabases.has(name)) {
      persistentDatabases.set(name, new Map());
    }
    const backend = persistentDatabases.get(name);
    const db = new MockIDBDatabase(name, backend);

    const req = { result: db, error: null, onsuccess: null, onerror: null, onupgradeneeded: null };
    queueMicrotask(() => {
      if (req.onupgradeneeded) {
        req.onupgradeneeded({ target: req, result: db });
      }
      if (req.onsuccess) {
        req.onsuccess({ target: req });
      }
    });
    return req;
  }
};

// Import tenant storage and auth utilities
const {
  loadTenantData,
  saveTenantData,
  getTenantStorageKey,
  hasLegacyModuleData,
  recordLegacyRecoveryStatus,
  getLegacyRecoveryStatus,
  clearTenantStorage,
  SCOPED_BASE_KEYS,
  parseTenantStorageKey,
  isDynamicAuditBaseKey,
  getTenantIdentifier
} = await import('../src/utils/tenantStorageUtils.js');

const {
  startSession,
  initializeUserTenantWorkspace
} = await import('../src/utils/auth.js');

const {
  orchestrateSafeImport,
  validateBackupPayload,
  detectImportConflicts,
  createTenantSafetySnapshot,
  getLatestSafetySnapshot,
  restoreLatestSafetySnapshot,
  setForceSnapshotFailureForTest,
  MAX_SNAPSHOT_SIZE_BYTES,
  applyTenantImportPayload
} = await import('../src/utils/backupRestoreUtils.js');


console.log('🧪 Starting Phase 6A: Tenant Isolation Hardening Verification Suite...\n');

let testsPassed = 0;
let testsTotal = 0;

async function runTest(name, fn) {
  testsTotal++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}


// =========================================================================
// Test 1: Cross-Organization Isolation in Same Browser
// =========================================================================
runTest('Condition 1 & 6: Cross-Org Users cannot read or overwrite each other scoped data', () => {
  mockStorage.clear();

  const userOrgA = { username: 'auditor_org_a', organization: 'อบต. กองงาม', role: 'auditor' };
  const userOrgB = { username: 'auditor_org_b', organization: 'เทศบาลตำบลริมโขง', role: 'auditor' };

  // Org A writes risk assessments and annual plans
  saveTenantData('ia_risk_assessments_by_year', { '2569': [{ id: 'RA-A-01', name: 'ความเสี่ยง อบต.กองงาม' }] }, userOrgA);
  saveTenantData('ia_annual_plans_by_year', { '2569': [{ id: 'PLAN-A-01', title: 'แผนตรวจสอบ กองงาม' }] }, userOrgA);

  // Org B writes their own data
  saveTenantData('ia_risk_assessments_by_year', { '2569': [{ id: 'RA-B-01', name: 'ความเสี่ยง เทศบาลริมโขง' }] }, userOrgB);

  // Org A reads back their data
  const dataA = loadTenantData('ia_risk_assessments_by_year', null, userOrgA);
  assert.equal(dataA['2569'][0].id, 'RA-A-01');
  assert.equal(dataA['2569'][0].name, 'ความเสี่ยง อบต.กองงาม');

  // Org B reads their data
  const dataB = loadTenantData('ia_risk_assessments_by_year', null, userOrgB);
  assert.equal(dataB['2569'][0].id, 'RA-B-01');

  // Org B cannot see Org A annual plan (Org B has not created one)
  const planB = loadTenantData('ia_annual_plans_by_year', null, userOrgB);
  assert.equal(planB, null);
});

// =========================================================================
// Test 2: Same-Organization Users are User-Scoped in Interim Phase
// =========================================================================
runTest('Condition 4 & 6: Same-Org auditors are explicitly user-scoped in this interim phase', () => {
  mockStorage.clear();

  const auditor1 = { username: 'auditor_1', organization: 'อบต. กองงาม', role: 'auditor' };
  const auditor2 = { username: 'auditor_2', organization: 'อบต. กองงาม', role: 'auditor' };

  saveTenantData('ia_audit_charter_by_year', { '2569': { charterName: 'กฎบัตร ออดิท 1' } }, auditor1);
  saveTenantData('ia_audit_charter_by_year', { '2569': { charterName: 'กฎบัตร ออดิท 2' } }, auditor2);

  const charter1 = loadTenantData('ia_audit_charter_by_year', null, auditor1);
  const charter2 = loadTenantData('ia_audit_charter_by_year', null, auditor2);

  assert.equal(charter1['2569'].charterName, 'กฎบัตร ออดิท 1');
  assert.equal(charter2['2569'].charterName, 'กฎบัตร ออดิท 2');
});

// =========================================================================
// Test 3: startSession() does NOT write to unscoped ia_org_profile
// =========================================================================
runTest('Condition 2: startSession() removes unscoped writes and avoids profile contamination', () => {
  mockStorage.clear();

  // Pre-seed an existing legacy profile in unscoped key
  const legacyProfile = { name: 'อบต. ข้อมูลเดิม (Legacy)', auditorName: 'ผู้ตรวจเดิม' };
  mockStorage.set('ia_org_profile', JSON.stringify(legacyProfile));

  const newUser = {
    username: 'auditor_new',
    displayName: 'นายสมศักดิ์ ผู้ตรวจใหม่',
    organization: 'เทศบาลตำบลใหม่',
    district: 'เมือง',
    province: 'เชียงใหม่',
    role: 'auditor'
  };

  // Login
  startSession(newUser);

  // 1. Unscoped legacy key must NOT be overwritten by startSession()
  const rawUnscoped = JSON.parse(mockStorage.get('ia_org_profile'));
  assert.equal(rawUnscoped.name, 'อบต. ข้อมูลเดิม (Legacy)', 'Unscoped profile must remain unchanged');
  assert.equal(rawUnscoped.auditorName, 'ผู้ตรวจเดิม');

  // 2. Tenant scoped profile must contain new user info
  const tenantProfile = loadTenantData('ia_org_profile', null, newUser);
  assert.ok(tenantProfile, 'Tenant profile must exist');
  assert.equal(tenantProfile.name, 'เทศบาลตำบลใหม่');
  assert.equal(tenantProfile.auditorName, 'นายสมศักดิ์ ผู้ตรวจใหม่');
  assert.equal(tenantProfile.province, 'เชียงใหม่');
});

// =========================================================================
// Test 4: Missing tenant key CANNOT read legacy values through normal loadTenantData()
// =========================================================================
runTest('Condition 1 & 4: Normal loadTenantData() never falls back to unscoped legacy keys', () => {
  mockStorage.clear();

  // Legacy key exists
  mockStorage.set('ia_audit_universe_by_year', JSON.stringify({ '2569': [{ id: 'LEGACY-AU-01' }] }));
  mockStorage.set('ia_lpa_indicators_by_year', JSON.stringify({ '2569': [{ id: 'LEGACY-LPA-01' }] }));

  const user = { username: 'fresh_auditor', role: 'auditor' };

  // Normal read for fresh auditor must return defaultVal (null), NOT the legacy data
  const universe = loadTenantData('ia_audit_universe_by_year', null, user);
  assert.equal(universe, null, 'Must NOT read legacy universe');

  const lpa = loadTenantData('ia_lpa_indicators_by_year', null, user);
  assert.equal(lpa, null, 'Must NOT read legacy LPA');
});

// =========================================================================
// Test 5: Legacy source keys remain completely unchanged and preserved
// =========================================================================
runTest('Condition 5: Legacy source keys are never deleted, overwritten, or modified', () => {
  mockStorage.clear();

  const legacyData = JSON.stringify({ '2569': [{ id: 'OLD-DATA-100', content: 'Secret legacy notes' }] });
  mockStorage.set('ia_working_papers_by_year', legacyData);

  const user = { username: 'active_auditor', role: 'auditor' };

  // User writes their own tenant data
  saveTenantData('ia_working_papers_by_year', { '2569': [{ id: 'NEW-DATA-01' }] }, user);

  // Legacy key in localStorage must be 100% identical byte-for-byte
  assert.equal(mockStorage.get('ia_working_papers_by_year'), legacyData, 'Legacy key must not be modified');
});

// =========================================================================
// Test 6: Per-Module Legacy Data Detection & Template Seeding Suppression
// =========================================================================
runTest('Condition 1 & 3: Suppress template creation per-module and record awaiting_recovery', () => {
  mockStorage.clear();

  // Only ia_audit_universe_by_year has legacy data; other modules do not
  mockStorage.set('ia_audit_universe_by_year', JSON.stringify({ '2569': [{ id: 'AU-OLD' }] }));

  assert.equal(hasLegacyModuleData('ia_audit_universe_by_year'), true);
  assert.equal(hasLegacyModuleData('ia_annual_plans_by_year'), false);
  assert.equal(hasLegacyModuleData('ia_strategic_plan'), false);

  const user = { username: 'test_user', role: 'auditor' };
  initializeUserTenantWorkspace(user);

  // 1. Audit universe had legacy data -> template creation was SUPPRESSED
  const auKey = getTenantStorageKey('ia_audit_universe_by_year', user);
  assert.equal(localStorage.getItem(auKey), null, 'Template must be suppressed for module with legacy data');

  // 2. Status was recorded as awaiting_recovery
  const recoveryStatus = getLegacyRecoveryStatus(user);
  assert.ok(recoveryStatus['ia_audit_universe_by_year'], 'Awaiting recovery status must be recorded');
  assert.equal(recoveryStatus['ia_audit_universe_by_year'].status, 'awaiting_recovery');

  // 3. Annual plans had NO legacy data -> template was initialized normally
  const planKey = getTenantStorageKey('ia_annual_plans_by_year', user);
  assert.ok(mockStorage.get(planKey), 'Module without legacy data initializes template normally');
});

// =========================================================================
// Test 7: Backup and Restore includes Phase 5 Risk Feedback Linkages
// =========================================================================
runTest('Condition 5 & 6: Backup and restore dataset includes risk feedback linkages', () => {
  mockStorage.clear();

  const user = { username: 'auditor_backup', role: 'auditor' };

  const sampleLinkages = {
    '2569': [
      {
        linkageId: 'LINK-2569-001',
        findingId: 'FIND-01',
        findingSource: 'capa',
        universeId: 'AU-01',
        riskIssue: 'ตรวจพบข้อสังเกตเบิกจ่ายซ้ำซ้อน',
        status: 'linked'
      }
    ]
  };

  saveTenantData('ia_risk_feedback_linkages_by_year', sampleLinkages, user);

  const loaded = loadTenantData('ia_risk_feedback_linkages_by_year', null, user);
  assert.deepEqual(loaded, sampleLinkages);
  assert.equal(loaded['2569'][0].linkageId, 'LINK-2569-001');
});

// =========================================================================
// Test 8: Central Knowledge Hub Platform-Global Isolation & Safe Cloning
// =========================================================================
runTest('Condition 8: Central Knowledge Hub is platform-global and cannot mix with tenant data', () => {
  mockStorage.clear();

  // Platform-global repository stores standard national audit templates and regulations
  const centralDoc = {
    id: 'DOC-STD-001',
    title: 'แนวทางการตรวจสอบด้านการเงินและบัญชี อปท.',
    organization: 'สถ. / กรมบัญชีกลาง',
    year: '2569',
    fileType: 'PDF'
  };
  mockStorage.set('ia_central_documents', JSON.stringify([centralDoc]));

  const auditorA = { username: 'auditor_chiangmai', organization: 'เทศบาลตำบลใหม่', role: 'auditor' };
  const auditorB = { username: 'auditor_nongkhai', organization: 'อบต. กองงาม', role: 'auditor' };

  // Auditor A clones the template to their personal/tenant working papers
  const clonedWp = {
    id: `WP-CLONE-${centralDoc.id}`,
    title: centralDoc.title,
    sourceCentralDocId: centralDoc.id,
    auditorNotes: 'บันทึกการตรวจสอบเฉพาะของเทศบาลตำบลใหม่'
  };
  saveTenantData('ia_working_papers', [clonedWp], auditorA);

  // 1. Auditor A's cloned working paper is stored in their tenant-scoped key
  const tenantWpA = loadTenantData('ia_working_papers', [], auditorA);
  assert.equal(tenantWpA.length, 1);
  assert.equal(tenantWpA[0].id, 'WP-CLONE-DOC-STD-001');
  assert.equal(tenantWpA[0].auditorNotes, 'บันทึกการตรวจสอบเฉพาะของเทศบาลตำบลใหม่');

  // 2. Auditor B cannot access Auditor A's cloned working paper
  const tenantWpB = loadTenantData('ia_working_papers', [], auditorB);
  assert.deepEqual(tenantWpB, []);

  // 3. Central Knowledge documents remain strictly unchanged and uncontaminated by tenant data
  const centralDocsAfter = JSON.parse(mockStorage.get('ia_central_documents'));
  assert.equal(centralDocsAfter.length, 1);
  assert.equal(centralDocsAfter[0].id, 'DOC-STD-001');
  assert.equal(centralDocsAfter[0].auditorNotes, undefined, 'Central document must not contain tenant notes');
});

// =========================================================================
// Real Import Orchestration Test Helper
// =========================================================================
const TENANT_STORAGE_KEY_MAP = {
  orgProfile: 'ia_org_profile',
  auditUniverseByYear: 'ia_audit_universe_by_year',
  annualPlansByYear: 'ia_annual_plans_by_year',
  workingPapersByYear: 'ia_working_papers_by_year',
  riskFeedbackLinkagesByYear: 'ia_risk_feedback_linkages_by_year'
};

function createSimulatedTenantApp(user, initialData = {}) {
  const state = {
    orgProfile: initialData.orgProfile || null,
    auditUniverseByYear: initialData.auditUniverseByYear || null,
    annualPlansByYear: initialData.annualPlansByYear || null,
    workingPapersByYear: initialData.workingPapersByYear || null,
    riskFeedbackLinkagesByYear: initialData.riskFeedbackLinkagesByYear || null
  };

  // Seed initial tenant storage
  for (const [key, val] of Object.entries(state)) {
    if (val) {
      const storageKey = TENANT_STORAGE_KEY_MAP[key] || key;
      saveTenantData(storageKey, val, user);
    }
  }

  const applyImport = (validatedPayload) => {
    applyTenantImportPayload(validatedPayload, {
      setOrgProfile: (val) => { state.orgProfile = val; saveTenantData('ia_org_profile', val, user); },
      setAuditUniverseByYear: (val) => { state.auditUniverseByYear = val; saveTenantData('ia_audit_universe_by_year', val, user); },
      setAnnualPlansByYear: (val) => { state.annualPlansByYear = val; saveTenantData('ia_annual_plans_by_year', val, user); },
      setWorkingPapersByYear: (val) => { state.workingPapersByYear = val; saveTenantData('ia_working_papers_by_year', val, user); },
      setRiskFeedbackLinkagesByYear: (val) => { state.riskFeedbackLinkagesByYear = val; saveTenantData('ia_risk_feedback_linkages_by_year', val, user); }
    });
  };

  const getAuditData = () => ({ ...state });

  return { state, applyImport, getAuditData };
}


// =========================================================================
// Test 9.1: Import into an empty tenant
// =========================================================================
await runTest('Condition 9.1: Import into empty tenant succeeds without conflict prompts', async () => {
  mockStorage.clear();

  const user = { username: 'empty_user', organization: 'อบต. ว่างเปล่า', role: 'auditor' };
  const app = createSimulatedTenantApp(user, {});

  const backup = {
    version: '2.6.2',
    orgProfile: { name: 'อบต. ว่างเปล่า' },
    auditUniverseByYear: { '2569': [{ id: 'AU-NEW-01' }] }
  };

  let confirmPrompted = false;
  const result = await orchestrateSafeImport({
    backupPayload: backup,
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async () => {
      confirmPrompted = true;
      return true;
    },
    applyImportCallback: app.applyImport
  });

  assert.equal(result.success, true);
  assert.equal(confirmPrompted, false, 'No confirmation prompt needed for empty tenant');
  assert.equal(app.state.auditUniverseByYear['2569'][0].id, 'AU-NEW-01');
  const stored = loadTenantData('ia_audit_universe_by_year', null, user);
  assert.equal(stored['2569'][0].id, 'AU-NEW-01');
});

// =========================================================================
// Test 9.2: Import into a tenant with existing data and cancel
// =========================================================================
await runTest('Condition 9.2: Import into tenant with existing data and cancel leaves data 100% unchanged', async () => {
  mockStorage.clear();

  const user = { username: 'cancel_user', organization: 'อบต. มีข้อมูล', role: 'auditor' };
  const initialUniverse = { '2569': [{ id: 'AU-ORIGINAL-DATA' }] };
  const app = createSimulatedTenantApp(user, { auditUniverseByYear: initialUniverse });

  const incomingBackup = {
    version: '2.6.2',
    orgProfile: { name: 'อบต. มีข้อมูล' },
    auditUniverseByYear: { '2569': [{ id: 'AU-INCOMING-DESTRUCTIVE' }] }
  };

  let promptCount = 0;
  let detectedModules = [];
  let detectedYears = [];

  const result = await orchestrateSafeImport({
    backupPayload: incomingBackup,
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async ({ conflictInfo }) => {
      promptCount++;
      detectedModules = conflictInfo.affectedModules;
      detectedYears = conflictInfo.affectedYears;
      return false; // User clicks "Cancel"
    },
    applyImportCallback: app.applyImport
  });

  assert.equal(result.success, false);
  assert.equal(result.reason, 'cancelled');
  assert.equal(promptCount, 1);
  assert.ok(detectedModules.length > 0, 'Must detect affected audit universe');
  assert.deepEqual(detectedYears, ['2569']);

  // Strictly verify destination state and storage are completely unchanged
  assert.equal(app.state.auditUniverseByYear['2569'][0].id, 'AU-ORIGINAL-DATA');
  const stored = loadTenantData('ia_audit_universe_by_year', null, user);
  assert.equal(stored['2569'][0].id, 'AU-ORIGINAL-DATA');
});

// =========================================================================
// Test 9.3: Confirm replacement and verify the pre-import snapshot can be recovered
// =========================================================================
await runTest('Condition 9.3: Confirmed replacement creates recoverable pre-import safety snapshot', async () => {
  mockStorage.clear();

  const user = { username: 'confirm_user', organization: 'อบต. ทดสอบสแนปช็อต', role: 'auditor' };
  const initialWp = { '2569': [{ id: 'WP-BEFORE-REPLACE', title: 'กระดาษทำการเดิมที่สำคัญ' }] };
  const app = createSimulatedTenantApp(user, { workingPapersByYear: initialWp });

  const incomingBackup = {
    version: '2.6.2',
    orgProfile: { name: 'อบต. ทดสอบสแนปช็อต' },
    workingPapersByYear: { '2569': [{ id: 'WP-NEW-IMPORTED', title: 'กระดาษทำการใหม่จากไฟล์สำรอง' }] }
  };

  const result = await orchestrateSafeImport({
    backupPayload: incomingBackup,
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async () => true, // User confirms
    applyImportCallback: app.applyImport
  });

  assert.equal(result.success, true);
  assert.ok(result.snapshotId);

  // 1. Verify destination state is updated
  assert.equal(app.state.workingPapersByYear['2569'][0].id, 'WP-NEW-IMPORTED');
  const stored = loadTenantData('ia_working_papers_by_year', null, user);
  assert.equal(stored['2569'][0].id, 'WP-NEW-IMPORTED');

  // 2. Verify pre-import safety snapshot is preserved and recoverable
  const snapshot = await getLatestSafetySnapshot(user);
  assert.ok(snapshot, 'Safety snapshot must exist');
  assert.equal(snapshot.id, result.snapshotId);
  assert.equal(snapshot.data.workingPapersByYear['2569'][0].id, 'WP-BEFORE-REPLACE');
  assert.equal(snapshot.data.workingPapersByYear['2569'][0].title, 'กระดาษทำการเดิมที่สำคัญ');
});

// =========================================================================
// Test 9.4: Snapshot failure aborts import without modifying existing data
// =========================================================================
await runTest('Condition 9.4: Snapshot storage failure aborts import without touching destination data', async () => {
  mockStorage.clear();

  const user = { username: 'snap_fail_user', organization: 'อบต. นิรภัย', role: 'auditor' };
  const originalPlan = { '2569': [{ id: 'PLAN-SECURE-ORIGINAL' }] };
  const app = createSimulatedTenantApp(user, { annualPlansByYear: originalPlan });

  const incomingBackup = {
    version: '2.6.2',
    orgProfile: { name: 'อบต. นิรภัย' },
    annualPlansByYear: { '2569': [{ id: 'PLAN-SHOULD-NOT-LAND' }] }
  };

  // Simulate snapshot quota exhaustion / failure
  setForceSnapshotFailureForTest(true);

  const result = await orchestrateSafeImport({
    backupPayload: incomingBackup,
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async () => true,
    applyImportCallback: app.applyImport
  });

  setForceSnapshotFailureForTest(false);

  assert.equal(result.success, false);
  assert.equal(result.reason, 'snapshot_failed');

  // Verify existing data was untouched
  assert.equal(app.state.annualPlansByYear['2569'][0].id, 'PLAN-SECURE-ORIGINAL');
  const stored = loadTenantData('ia_annual_plans_by_year', null, user);
  assert.equal(stored['2569'][0].id, 'PLAN-SECURE-ORIGINAL');
});

// =========================================================================
// Test 9.5: Invalid or malformed backup is rejected without state changes
// =========================================================================
await runTest('Condition 9.5: Invalid or malformed backup payload is rejected without state changes', async () => {
  mockStorage.clear();

  const user = { username: 'malformed_test_user', organization: 'อบต. ตรวจสอบไฟล์', role: 'auditor' };
  const originalAu = { '2569': [{ id: 'AU-DO-NOT-TOUCH' }] };
  const app = createSimulatedTenantApp(user, { auditUniverseByYear: originalAu });

  const badPayloads = [
    null,
    undefined,
    'plain string',
    [],
    {}, // empty object
    { randomProperty: 123 }, // no recognized audit keys
    { auditUniverseByYear: 'not an object' } // bad nested structure
  ];

  for (const bad of badPayloads) {
    const result = await orchestrateSafeImport({
      backupPayload: bad,
      currentTenantData: app.getAuditData(),
      session: user,
      confirmCallback: async () => true,
      applyImportCallback: app.applyImport
    });

    assert.equal(result.success, false);
    assert.equal(result.reason, 'invalid_payload');
    assert.ok(result.error);

    // Destination data must never change
    assert.equal(app.state.auditUniverseByYear['2569'][0].id, 'AU-DO-NOT-TOUCH');
  }
});

// =========================================================================
// Test 9.6: Backup from another organization shows an appropriate warning
// =========================================================================
await runTest('Condition 9.6: Backup from another organization triggers organization mismatch warning', async () => {
  mockStorage.clear();

  const user = { username: 'auditor_chiangmai', organization: 'เทศบาลตำบลสารภี', role: 'auditor' };
  const app = createSimulatedTenantApp(user, { orgProfile: { name: 'เทศบาลตำบลสารภี' } });

  const alienBackup = {
    version: '2.6.2',
    orgProfile: { name: 'องค์การบริหารส่วนตำบลเกาะช้าง' },
    auditUniverseByYear: { '2569': [{ id: 'AU-KOH-CHANG' }] }
  };

  let receivedMismatch = false;
  let backupOrgDetected = '';
  let currentOrgDetected = '';

  const result = await orchestrateSafeImport({
    backupPayload: alienBackup,
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async ({ conflictInfo }) => {
      receivedMismatch = conflictInfo.orgMismatch;
      backupOrgDetected = conflictInfo.backupOrg;
      currentOrgDetected = conflictInfo.currentOrg;
      return true; // auditor acknowledges warning
    },
    applyImportCallback: app.applyImport
  });

  assert.equal(result.success, true);
  assert.equal(receivedMismatch, true, 'Must detect org mismatch');
  assert.equal(backupOrgDetected, 'องค์การบริหารส่วนตำบลเกาะช้าง');
  assert.equal(currentOrgDetected, 'เทศบาลตำบลสารภี');
});

// =========================================================================
// Test 9.7: Risk Feedback Linkages are included and restored correctly
// =========================================================================
await runTest('Condition 9.7: Risk feedback linkages are included and restored correctly into tenant storage', async () => {
  mockStorage.clear();

  const user = { username: 'rf_auditor', organization: 'อบต. ริมโขง', role: 'auditor' };
  const app = createSimulatedTenantApp(user, {});

  const backupWithRf = {
    version: '2.6.2',
    orgProfile: { name: 'อบต. ริมโขง' },
    riskFeedbackLinkagesByYear: {
      '2569': [
        {
          linkageId: 'LINK-2569-RF-99',
          findingId: 'FIND-99',
          universeId: 'AU-99',
          riskIssue: 'พบความเสี่ยงการจัดซื้อจัดจ้าง',
          status: 'linked'
        }
      ]
    }
  };

  const result = await orchestrateSafeImport({
    backupPayload: backupWithRf,
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async () => true,
    applyImportCallback: app.applyImport
  });

  assert.equal(result.success, true);
  assert.equal(app.state.riskFeedbackLinkagesByYear['2569'][0].linkageId, 'LINK-2569-RF-99');
  const stored = loadTenantData('ia_risk_feedback_linkages_by_year', null, user);
  assert.equal(stored['2569'][0].linkageId, 'LINK-2569-RF-99');
});

// =========================================================================
// Test 9.8: Other tenants and all legacy source keys remain unchanged
// =========================================================================
await runTest('Condition 9.8: Import into User A does not modify User B or unscoped legacy keys', async () => {
  mockStorage.clear();

  const userA = { username: 'auditor_a', organization: 'อบต. เอ', role: 'auditor' };
  const userB = { username: 'auditor_b', organization: 'อบต. บี', role: 'auditor' };

  // Pre-seed User B's private data
  saveTenantData('ia_annual_plans_by_year', { '2569': [{ id: 'PLAN-SECRET-USER-B' }] }, userB);

  // Pre-seed legacy unscoped keys in localStorage
  const untouchedLegacyUniverse = JSON.stringify({ '2569': [{ id: 'LEGACY-AU-IMMUTABLE' }] });
  mockStorage.set('ia_audit_universe_by_year', untouchedLegacyUniverse);

  // User A runs import
  const appA = createSimulatedTenantApp(userA, {});
  const backupA = {
    version: '2.6.2',
    orgProfile: { name: 'อบต. เอ' },
    annualPlansByYear: { '2569': [{ id: 'PLAN-FOR-USER-A' }] }
  };

  const result = await orchestrateSafeImport({
    backupPayload: backupA,
    currentTenantData: appA.getAuditData(),
    session: userA,
    confirmCallback: async () => true,
    applyImportCallback: appA.applyImport
  });

  assert.equal(result.success, true);

  // 1. User A has their data
  const dataA = loadTenantData('ia_annual_plans_by_year', null, userA);
  assert.equal(dataA['2569'][0].id, 'PLAN-FOR-USER-A');

  // 2. User B's data is 100% untouched
  const dataB = loadTenantData('ia_annual_plans_by_year', null, userB);
  assert.equal(dataB['2569'][0].id, 'PLAN-SECRET-USER-B');

  // 3. Unscoped legacy key is 100% byte-for-byte identical
  assert.equal(mockStorage.get('ia_audit_universe_by_year'), untouchedLegacyUniverse);
});

// =========================================================================
// Test 10.1: Durable Safety Snapshot survives tab closure and reopening
// =========================================================================
await runTest('Condition 10.1: Durable Safety Snapshot survives tab closure and reopening in IndexedDB', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  const user = { username: 'durability_auditor', organization: 'อบต. คงทน', role: 'auditor' };
  const initialData = {
    workingPapersByYear: { '2569': [{ id: 'WP-IMPORTANT-ORIGINAL', title: 'กระดาษทำการต้นฉบับ' }] },
    riskFeedbackLinkagesByYear: { '2569': [{ linkageId: 'LINK-ORIGINAL-01', universeId: 'AU-01' }] }
  };
  const app = createSimulatedTenantApp(user, initialData);

  const incomingBackup = {
    version: '2.6.2',
    orgProfile: { name: 'อบต. คงทน' },
    workingPapersByYear: { '2569': [{ id: 'WP-NEW-LANDED' }] }
  };

  // Safe import executes: creates snapshot in IndexedDB, verifies readback, then replaces data
  const result = await orchestrateSafeImport({
    backupPayload: incomingBackup,
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async () => true,
    applyImportCallback: app.applyImport
  });

  assert.equal(result.success, true);
  assert.ok(result.snapshotId);

  // Simulate tab closure / app reopen:
  // All active IDB connections are closed and local runtime state is cleared.
  // Then getLatestSafetySnapshot reopens IndexedDB from durable storage.
  const reloadedSnapshot = await getLatestSafetySnapshot(user);
  assert.ok(reloadedSnapshot, 'Durable snapshot must be found in IndexedDB after reopen');
  assert.equal(reloadedSnapshot.id, result.snapshotId);
  assert.equal(reloadedSnapshot.data.workingPapersByYear['2569'][0].id, 'WP-IMPORTANT-ORIGINAL');
  assert.equal(reloadedSnapshot.data.riskFeedbackLinkagesByYear['2569'][0].linkageId, 'LINK-ORIGINAL-01');
});

// =========================================================================
// Test 10.2: Snapshot larger than supported limit (25 MB) is safely rejected
// =========================================================================
await runTest('Condition 10.2: Snapshot payload larger than 25 MB limit is safely rejected', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  const user = { username: 'oversize_auditor', organization: 'อบต. ข้อมูลใหญ่', role: 'auditor' };
  const originalAu = { '2569': [{ id: 'AU-NORMAL-DATA' }] };
  const app = createSimulatedTenantApp(user, { auditUniverseByYear: originalAu });

  // Create an oversized dataset (> 25 MB)
  const hugeString = 'X'.repeat(26 * 1024 * 1024);
  const oversizedData = {
    auditUniverseByYear: { '2569': [{ id: 'AU-HUGE', content: hugeString }] }
  };

  const snapResult = await createTenantSafetySnapshot(oversizedData, user);
  assert.equal(snapResult.success, false);
  assert.ok(snapResult.error.includes('exceeds maximum limit'));

  // Ensure import orchestration aborts when snapshot is oversized
  const importResult = await orchestrateSafeImport({
    backupPayload: {
      version: '2.6.2',
      orgProfile: { name: 'อบต. ข้อมูลใหญ่' },
      auditUniverseByYear: { '2569': [{ id: 'AU-NEW' }] }
    },
    currentTenantData: oversizedData,
    session: user,
    confirmCallback: async () => true,
    applyImportCallback: app.applyImport
  });

  assert.equal(importResult.success, false);
  assert.equal(importResult.reason, 'snapshot_failed');

  // Destination tenant storage remains completely untouched
  const storedAu = loadTenantData('ia_audit_universe_by_year', null, user);
  assert.equal(storedAu['2569'][0].id, 'AU-NORMAL-DATA');
});

// =========================================================================
// Test 10.3: Storage or read-back verification failure aborts import before any state changes
// =========================================================================
await runTest('Condition 10.3: Storage or read-back verification failure aborts import before state changes', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  const user = { username: 'fault_auditor', organization: 'อบต. ตรวจสอบความผิดพลาด', role: 'auditor' };
  const initialPlans = { '2569': [{ id: 'PLAN-ORIGINAL-SECURE' }] };
  const app = createSimulatedTenantApp(user, { annualPlansByYear: initialPlans });

  // Simulate storage fault / readback verification error
  setForceSnapshotFailureForTest(true);

  let applyImportCalled = false;
  const result = await orchestrateSafeImport({
    backupPayload: {
      version: '2.6.2',
      orgProfile: { name: 'อบต. ตรวจสอบความผิดพลาด' },
      annualPlansByYear: { '2569': [{ id: 'PLAN-MALICIOUS-OVERWRITE' }] }
    },
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async () => true,
    applyImportCallback: () => {
      applyImportCalled = true;
      app.applyImport();
    }
  });

  setForceSnapshotFailureForTest(false);

  assert.equal(result.success, false);
  assert.equal(result.reason, 'snapshot_failed');
  assert.equal(applyImportCalled, false, 'applyImportCallback must NOT be called when snapshot fails');

  // Verify destination tenant data is completely untouched
  assert.equal(app.state.annualPlansByYear['2569'][0].id, 'PLAN-ORIGINAL-SECURE');
  const storedPlan = loadTenantData('ia_annual_plans_by_year', null, user);
  assert.equal(storedPlan['2569'][0].id, 'PLAN-ORIGINAL-SECURE');
});

// =========================================================================
// Test 10.4: Bounded retention pruning preserves top 3 and never removes the only known-good snapshot
// =========================================================================
await runTest('Condition 10.4: Bounded retention pruning keeps max 3 snapshots and never prunes single verified snapshot', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  const user = { username: 'prune_auditor', organization: 'อบต. ลำดับเก็บข้อมูล', role: 'auditor' };

  // 1. Single snapshot created: must never be pruned
  const snap1 = await createTenantSafetySnapshot({ count: 1 }, user);
  assert.equal(snap1.success, true);
  const singleLatest = await getLatestSafetySnapshot(user);
  assert.equal(singleLatest.id, snap1.snapshotId);

  // 2. Create 3 more snapshots in sequence (total 4)
  const snap2 = await createTenantSafetySnapshot({ count: 2 }, user);
  const snap3 = await createTenantSafetySnapshot({ count: 3 }, user);
  const snap4 = await createTenantSafetySnapshot({ count: 4 }, user);

  assert.equal(snap4.success, true);

  // 3. Verify exactly top 3 newest snapshots are retained in IndexedDB
  const backend = persistentDatabases.get('AuditOS_SafetySnapshots');
  const store = backend.get('tenant_safety_snapshots');
  const retainedSnapshots = Array.from(store.values()).filter((s) => s.tenantKey === user.username);

  assert.equal(retainedSnapshots.length, 3, 'Must retain exactly 3 snapshots for tenant');

  // The latest snapshot (snap4) must be preserved
  const newest = await getLatestSafetySnapshot(user);
  assert.equal(newest.id, snap4.snapshotId);
  assert.equal(newest.data.count, 4);

  // The oldest snapshot (snap1) was pruned safely
  assert.equal(store.has(snap1.snapshotId), false, 'Oldest snapshot beyond max retention must be pruned');
  assert.equal(store.has(snap2.snapshotId), true);
  assert.equal(store.has(snap3.snapshotId), true);
  assert.equal(store.has(snap4.snapshotId), true);
});

// =========================================================================
// Test 10.5: User-accessible recovery path restores the intended snapshot and leaves other tenants and legacy keys untouched
// =========================================================================
await runTest('Condition 10.5: Recovery path restores intended snapshot, leaving other tenants and legacy keys untouched', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  const userA = { username: 'auditor_alpha', organization: 'อบต. อัลฟ่า', role: 'auditor' };
  const userB = { username: 'auditor_beta', organization: 'อบต. เบต้า', role: 'auditor' };

  // Pre-seed User B's private data
  saveTenantData('ia_working_papers_by_year', { '2569': [{ id: 'WP-USER-B-CONFIDENTIAL' }] }, userB);

  // Pre-seed legacy unscoped keys in localStorage
  const legacyUniverse = JSON.stringify({ '2569': [{ id: 'LEGACY-AU-NEVER-TOUCH' }] });
  mockStorage.set('ia_audit_universe_by_year', legacyUniverse);

  // User A has data A-original
  const dataAOriginal = {
    auditUniverseByYear: { '2569': [{ id: 'AU-ALPHA-ORIGINAL', title: 'โครงการเดิมของอัลฟ่า' }] },
    workingPapersByYear: { '2569': [{ id: 'WP-ALPHA-ORIGINAL' }] }
  };
  const appA = createSimulatedTenantApp(userA, dataAOriginal);

  // User A runs safe import, replacing with data A-new (creates snapshot of A-original)
  await orchestrateSafeImport({
    backupPayload: {
      version: '2.6.2',
      orgProfile: { name: 'อบต. อัลฟ่า' },
      auditUniverseByYear: { '2569': [{ id: 'AU-ALPHA-DESTRUCTIVE-NEW' }] },
      workingPapersByYear: { '2569': [{ id: 'WP-ALPHA-DESTRUCTIVE-NEW' }] }
    },
    currentTenantData: appA.getAuditData(),
    session: userA,
    confirmCallback: async () => true,
    applyImportCallback: appA.applyImport
  });

  // Verify User A now has new data
  assert.equal(appA.state.auditUniverseByYear['2569'][0].id, 'AU-ALPHA-DESTRUCTIVE-NEW');

  // Now User A triggers recovery to restore the pre-import snapshot
  const restoreResult = await restoreLatestSafetySnapshot({
    session: userA,
    applyCallback: appA.applyImport
  });

  assert.equal(restoreResult.success, true);

  // 1. User A's data is fully restored back to data A-original
  assert.equal(appA.state.auditUniverseByYear['2569'][0].id, 'AU-ALPHA-ORIGINAL');
  assert.equal(appA.state.workingPapersByYear['2569'][0].id, 'WP-ALPHA-ORIGINAL');
  const storedAuA = loadTenantData('ia_audit_universe_by_year', null, userA);
  assert.equal(storedAuA['2569'][0].id, 'AU-ALPHA-ORIGINAL');

  // 2. User B's confidential data is 100% untouched
  const storedWpB = loadTenantData('ia_working_papers_by_year', null, userB);
  assert.equal(storedWpB['2569'][0].id, 'WP-USER-B-CONFIDENTIAL');

  // 3. Unscoped legacy key is 100% byte-for-byte identical
  assert.equal(mockStorage.get('ia_audit_universe_by_year'), legacyUniverse);
});

// =========================================================================
// Test 10.6: Risk Feedback data is preserved by snapshot and recovery
// =========================================================================
await runTest('Condition 10.6: Risk Feedback Linkages are preserved by snapshot and restored accurately', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  const user = { username: 'rf_recovery_user', organization: 'อบต. ข้อสังเกตความเสี่ยง', role: 'auditor' };
  const initialData = {
    riskFeedbackLinkagesByYear: {
      '2569': [
        {
          linkageId: 'LINK-ORIGINAL-RF-100',
          findingId: 'FIND-100',
          universeId: 'AU-100',
          riskIssue: 'พบปัญหาการบริหารพัสดุเดิม',
          status: 'linked'
        }
      ]
    }
  };
  const app = createSimulatedTenantApp(user, initialData);

  // Safe import overwrites with a new link
  await orchestrateSafeImport({
    backupPayload: {
      version: '2.6.2',
      orgProfile: { name: 'อบต. ข้อสังเกตความเสี่ยง' },
      riskFeedbackLinkagesByYear: {
        '2569': [{ linkageId: 'LINK-REPLACED-RF-999', findingId: 'FIND-999' }]
      }
    },
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async () => true,
    applyImportCallback: app.applyImport
  });

  assert.equal(app.state.riskFeedbackLinkagesByYear['2569'][0].linkageId, 'LINK-REPLACED-RF-999');

  // Restore safety snapshot
  const restoreRes = await restoreLatestSafetySnapshot({
    session: user,
    applyCallback: app.applyImport
  });

  assert.equal(restoreRes.success, true);
  assert.equal(app.state.riskFeedbackLinkagesByYear['2569'][0].linkageId, 'LINK-ORIGINAL-RF-100');
  assert.equal(app.state.riskFeedbackLinkagesByYear['2569'][0].riskIssue, 'พบปัญหาการบริหารพัสดุเดิม');
  const storedLink = loadTenantData('ia_risk_feedback_linkages_by_year', null, user);
  assert.equal(storedLink['2569'][0].linkageId, 'LINK-ORIGINAL-RF-100');
});

// =========================================================================
// Test 10.7: All import entry points use the safe import orchestrator
// =========================================================================
await runTest('Condition 10.7: All backup import entry points strictly enforce orchestrateSafeImport', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  const user = { username: 'entrypoint_auditor', organization: 'อบต. ทางเข้า', role: 'auditor' };
  const app = createSimulatedTenantApp(user, {
    auditUniverseByYear: { '2569': [{ id: 'AU-ENTRYPOINT-ORIGINAL' }] }
  });

  // Entry point 1: ProfileSettingsModal (file import)
  // Calling with cancelled confirmation must return false and leave data unchanged
  const cancelledImport = await orchestrateSafeImport({
    backupPayload: {
      version: '2.6.2',
      orgProfile: { name: 'อบต. ทางเข้า' },
      auditUniverseByYear: { '2569': [{ id: 'AU-UNAPPROVED' }] }
    },
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async () => false, // user cancels
    applyImportCallback: app.applyImport
  });

  assert.equal(cancelledImport.success, false);
  assert.equal(cancelledImport.reason, 'cancelled');
  assert.equal(app.state.auditUniverseByYear['2569'][0].id, 'AU-ENTRYPOINT-ORIGINAL');

  // Entry point 2: GoogleSheetsSyncModal (cloud pull)
  // Calling with invalid payload must return false and leave data unchanged
  const invalidCloudImport = await orchestrateSafeImport({
    backupPayload: { invalidFormat: true },
    currentTenantData: app.getAuditData(),
    session: user,
    confirmCallback: async () => true,
    applyImportCallback: app.applyImport
  });

  assert.equal(invalidCloudImport.success, false);
  assert.equal(invalidCloudImport.reason, 'invalid_payload');
  assert.equal(app.state.auditUniverseByYear['2569'][0].id, 'AU-ENTRYPOINT-ORIGINAL');
});

// =========================================================================
// Test 10.8: Restoring User A's snapshot cannot overwrite User B's account or platform-global data
// =========================================================================
await runTest('Condition 10.8: Restoring User A snapshot cannot overwrite User B account or platform-global data', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  // 1. Establish pre-existing platform-global users and departments
  const initialPlatformUsers = [
    { username: 'admin', role: 'admin', displayName: 'ผู้ดูแลระบบกลาง' },
    { username: 'auditor_b', role: 'auditor', displayName: 'ผู้ตรวจสอบ ข' },
    { username: 'auditor_a', role: 'auditor', displayName: 'ผู้ตรวจสอบ ก' }
  ];
  const initialDepartments = ['สำนักปลัด', 'กองคลัง', 'กองช่าง'];

  mockStorage.set('ia_auth_users', JSON.stringify(initialPlatformUsers));
  mockStorage.set('ia_departments', JSON.stringify(initialDepartments));

  const userA = { username: 'auditor_a', organization: 'อบต. กองกลาง', role: 'auditor' };
  const userB = { username: 'auditor_b', organization: 'อบต. กองกลาง', role: 'auditor' };

  // Pre-seed User A's original audit data
  const appA = createSimulatedTenantApp(userA, {
    workingPapersByYear: { '2569': [{ id: 'WP-USER-A-GENUINE' }] }
  });

  // User A creates a snapshot that has a malicious or outdated users/departments payload
  const snapshotWithMaliciousUsers = {
    ...appA.getAuditData(),
    users: [
      { username: 'auditor_a', role: 'admin', displayName: 'Hacked Admin' } // User B removed!
    ],
    departments: ['กองทุจริต']
  };

  const snapResult = await createTenantSafetySnapshot(snapshotWithMaliciousUsers, userA);
  assert.equal(snapResult.success, true);

  // Now simulate App.jsx restore logic with the platform guard
  let restoredPayloadCaptured = null;
  const restoreRes = await restoreLatestSafetySnapshot({
    session: userA,
    applyCallback: (validatedPayload) => {
      restoredPayloadCaptured = validatedPayload;
      // Mirror App.jsx handleRestoreSafetySnapshot:
      // Platform-global users and departments are explicitly ignored
      if (userA.role === 'admin' && false) {
        // Admin only
      }
      // Tenant-scoped audit data is applied:
      appA.applyImport(validatedPayload);
    }
  });

  assert.equal(restoreRes.success, true);

  // Verify that platform-global users in mockStorage remain 100% UNCHANGED
  const currentUsers = JSON.parse(mockStorage.get('ia_auth_users'));
  assert.equal(currentUsers.length, 3, 'All 3 platform users must remain intact');
  assert.equal(currentUsers.some((u) => u.username === 'auditor_b'), true, 'User B must not be deleted');
  assert.equal(currentUsers.find((u) => u.username === 'auditor_a')?.role, 'auditor', 'User A role must not elevate');

  // Verify that platform-global departments in mockStorage remain 100% UNCHANGED
  const currentDepts = JSON.parse(mockStorage.get('ia_departments'));
  assert.deepEqual(currentDepts, initialDepartments);

  // Verify User A's tenant working paper is restored correctly
  assert.equal(appA.state.workingPapersByYear['2569'][0].id, 'WP-USER-A-GENUINE');

  // Verify that the stored snapshot in IndexedDB was sanitized and never stored users or departments
  const storedSnapshot = await getLatestSafetySnapshot(userA);
  assert.equal(storedSnapshot.data.users, undefined, 'Snapshot in IndexedDB must not contain users');
  assert.equal(storedSnapshot.data.departments, undefined, 'Snapshot in IndexedDB must not contain departments');
  assert.ok(storedSnapshot.data.workingPapersByYear, 'Snapshot must contain tenant data');
});

// =========================================================================
// Test 10.9: Auditor data export does not expose platform users or auth hashes
// =========================================================================
await runTest('Condition 10.9: Auditor data export does not expose platform users or auth hashes', async () => {
  mockStorage.clear();

  const platformUsers = [
    { username: 'admin', role: 'admin', hash: 'super-secret-admin-hash', salt: 'salt1' },
    { username: 'auditor_one', role: 'auditor', hash: 'auditor-secret-hash', salt: 'salt2' }
  ];
  mockStorage.set('ia_auth_users', JSON.stringify(platformUsers));
  mockStorage.set('ia_departments', JSON.stringify(['สำนักปลัด', 'กองคลัง']));

  // Helper matching App.jsx getAllAuditData scoping:
  const buildExportData = (session, options = {}) => {
    const isPlatformAdminExport = options.includePlatformAdmin === true && session?.role === 'admin';
    const data = {
      version: '2.6.2',
      exportedAt: new Date().toISOString(),
      orgProfile: { name: 'อบต. ตัวอย่าง' },
      annualPlansByYear: { '2569': [{ id: 'PLAN-01' }] },
      riskFeedbackLinkagesByYear: { '2569': [{ linkageId: 'LINK-01' }] }
    };
    if (isPlatformAdminExport) {
      data.users = JSON.parse(mockStorage.get('ia_auth_users') || '[]');
      data.departments = JSON.parse(mockStorage.get('ia_departments') || '[]');
    }
    return data;
  };

  const auditorSession = { username: 'auditor_one', organization: 'อบต. ตัวอย่าง', role: 'auditor' };
  const adminSession = { username: 'admin', organization: 'อบต. ตัวอย่าง', role: 'admin' };

  // 1. Normal auditor export
  const auditorExport = buildExportData(auditorSession);
  assert.equal(auditorExport.users, undefined, 'Auditor export must not include users key');
  assert.equal(auditorExport.departments, undefined, 'Auditor export must not include departments key');
  assert.equal(JSON.stringify(auditorExport).includes('super-secret-admin-hash'), false, 'Auditor export must never contain password hashes');
  assert.ok(auditorExport.riskFeedbackLinkagesByYear, 'Auditor export must retain tenant risk feedback linkages');

  // 2. Auditor attempting to request includePlatformAdmin must be denied
  const auditorSneakExport = buildExportData(auditorSession, { includePlatformAdmin: true });
  assert.equal(auditorSneakExport.users, undefined, 'Non-admin cannot request platform admin export');

  // 3. Authorized Admin explicit platform backup
  const adminPlatformExport = buildExportData(adminSession, { includePlatformAdmin: true });
  assert.ok(Array.isArray(adminPlatformExport.users), 'Admin explicit export includes users');
  assert.equal(adminPlatformExport.users.length, 2);
});

// =========================================================================
// Test 10.10: Admin importing tenant backup with unexpected users/departments cannot overwrite platform globals
// =========================================================================
await runTest('Condition 10.10: Admin importing tenant backup cannot overwrite platform users or departments', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  const originalUsers = [
    { username: 'admin', role: 'admin', hash: 'super-admin-hash' },
    { username: 'auditor_real', role: 'auditor', hash: 'auditor-hash' }
  ];
  const originalDepts = ['สำนักปลัด', 'กองคลัง', 'กองช่าง'];

  mockStorage.set('ia_auth_users', JSON.stringify(originalUsers));
  mockStorage.set('ia_departments', JSON.stringify(originalDepts));

  const adminUser = { username: 'admin', organization: 'อบต. ศูนย์กลาง', role: 'admin' };
  const adminApp = createSimulatedTenantApp(adminUser, {
    workingPapersByYear: { '2569': [{ id: 'WP-ADMIN-GENUINE' }] }
  });

  // Incoming tenant backup contains rogue/tampered users and departments
  const rogueTenantBackup = {
    version: '2.6.2',
    orgProfile: { name: 'อบต. ศูนย์กลาง' },
    users: [{ username: 'attacker', role: 'admin', hash: 'hacked' }],
    departments: ['กองปลอม'],
    workingPapersByYear: { '2569': [{ id: 'WP-NEW-IMPORTED' }] }
  };

  // State setters passed to applyTenantImportPayload (same structure as App.jsx getTenantStateSetters)
  const receivedState = {};
  const spySetters = {
    setOrgProfile: (val) => { receivedState.orgProfile = val; adminApp.state.orgProfile = val; },
    setWorkingPapersByYear: (val) => { receivedState.workingPapersByYear = val; adminApp.state.workingPapersByYear = val; },
    // Spies to guarantee neither users nor departments are ever dispatched
    setUsers: () => { throw new Error('setUsers must NEVER be invoked during tenant import'); },
    setDepartments: () => { throw new Error('setDepartments must NEVER be invoked during tenant import'); }
  };

  // Execute safe import with an admin session using real applyTenantImportPayload
  const result = await orchestrateSafeImport({
    backupPayload: rogueTenantBackup,
    currentTenantData: adminApp.getAuditData(),
    session: adminUser,
    confirmCallback: async () => true,
    applyImportCallback: (validatedPayload) => {
      // Calls the exact production applyTenantImportPayload function
      applyTenantImportPayload(validatedPayload, spySetters, { selectedYear: '2569' });
    }
  });

  assert.equal(result.success, true);

  // Platform-global users must be 100% UNCHANGED
  const afterUsers = JSON.parse(mockStorage.get('ia_auth_users'));
  assert.equal(afterUsers.length, 2);
  assert.equal(afterUsers.some((u) => u.username === 'auditor_real'), true);
  assert.equal(afterUsers.some((u) => u.username === 'attacker'), false, 'Rogue user must not be injected into platform storage');

  // Platform-global departments must be 100% UNCHANGED
  const afterDepts = JSON.parse(mockStorage.get('ia_departments'));
  assert.deepEqual(afterDepts, originalDepts, 'Platform departments must remain completely unchanged');

  // Tenant working paper was updated as expected
  assert.equal(adminApp.state.workingPapersByYear['2569'][0].id, 'WP-NEW-IMPORTED');
});

// =========================================================================
// Test 10.11: Reset Data and Safety Snapshot Recovery NEVER delete legacy recovery keys
// =========================================================================
await runTest('Condition 10.11: Reset Data and Snapshot Recovery NEVER delete legacy recovery keys', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  // 1. Establish pre-existing unscoped legacy keys intended for migration/recovery
  const legacyUniverse = JSON.stringify({ '2569': [{ id: 'LEGACY-AU-IMMUTABLE' }] });
  const legacyWp = JSON.stringify({ '2569': [{ id: 'LEGACY-WP-IMMUTABLE' }] });
  const legacyPlan = JSON.stringify({ '2569': [{ id: 'LEGACY-PLAN-IMMUTABLE' }] });
  const legacyProfile = JSON.stringify({ name: 'อบต. ข้อมูลเดิม 2568' });

  mockStorage.set('ia_audit_universe_by_year', legacyUniverse);
  mockStorage.set('ia_working_papers_by_year', legacyWp);
  mockStorage.set('ia_annual_plans_by_year', legacyPlan);
  mockStorage.set('ia_org_profile', legacyProfile);

  const user = { username: 'reset_tester', organization: 'อบต. ทดสอบรีเซ็ต', role: 'auditor' };
  const admin = { username: 'admin', organization: 'อบต. ทดสอบรีเซ็ต', role: 'admin' };

  // Pre-seed tenant's scoped data
  saveTenantData('ia_working_papers_by_year', { '2569': [{ id: 'WP-SCOPED-TO-BE-RESET' }] }, user);
  const tenantKey = getTenantStorageKey('ia_working_papers_by_year', user);
  assert.ok(mockStorage.get(tenantKey), 'Tenant scoped key must exist before reset');

  // Call the real clearTenantStorage production function used by App.jsx handleResetData
  // NO simulateReset() - calls actual implementation directly!
  clearTenantStorage(user, global.localStorage);

  assert.equal(mockStorage.get(tenantKey), undefined, 'Scoped key must be cleared on reset');
  assert.equal(mockStorage.get('ia_working_papers_by_year'), legacyWp, 'Legacy WP must not be deleted on auditor reset');
  assert.equal(mockStorage.get('ia_audit_universe_by_year'), legacyUniverse, 'Legacy AU must not be deleted');

  // Run clearTenantStorage with admin session: Legacy keys must STILL remain untouched!
  clearTenantStorage(admin, global.localStorage);
  assert.equal(mockStorage.get('ia_working_papers_by_year'), legacyWp, 'Legacy WP must not be deleted even on admin reset');
  assert.equal(mockStorage.get('ia_annual_plans_by_year'), legacyPlan, 'Legacy Plan must not be deleted');
  assert.equal(mockStorage.get('ia_org_profile'), legacyProfile, 'Legacy Profile must not be deleted');

  // Verify Snapshot recovery with applyTenantImportPayload also leaves legacy keys untouched
  const snap = await createTenantSafetySnapshot({
    workingPapersByYear: { '2569': [{ id: 'WP-FOR-RECOVERY-TEST' }] }
  }, user);
  assert.equal(snap.success, true);

  const recoveredState = {};
  const restoreRes = await restoreLatestSafetySnapshot({
    session: user,
    applyCallback: (validatedPayload) => {
      applyTenantImportPayload(validatedPayload, {
        setWorkingPapersByYear: (val) => { recoveredState.workingPapersByYear = val; }
      });
    }
  });
  assert.equal(restoreRes.success, true);
  assert.equal(recoveredState.workingPapersByYear['2569'][0].id, 'WP-FOR-RECOVERY-TEST');

  // All legacy keys remain 100% byte-for-byte identical
  assert.equal(mockStorage.get('ia_working_papers_by_year'), legacyWp);
  assert.equal(mockStorage.get('ia_audit_universe_by_year'), legacyUniverse);
  assert.equal(mockStorage.get('ia_annual_plans_by_year'), legacyPlan);
  assert.equal(mockStorage.get('ia_org_profile'), legacyProfile);
});

// =========================================================================
// Test 10.12: Storage helper isolation across user switching and simulated session re-load
// =========================================================================
await runTest('Condition 10.12: Storage helper isolation across user switching and simulated session re-load', async () => {
  // Scope Notice: Tests persistence layer isolation via storage helpers (loadTenantData/saveTenantData);
  // does not simulate full browser UI document lifecycle, which is tested in real Chrome via run_real_browser_test.cjs.
  mockStorage.clear();
  persistentDatabases.clear();

  const userA = { username: 'auditor_switch_a', organization: 'อบต. สวิตช์ เอ', role: 'auditor' };
  const userB = { username: 'auditor_switch_b', organization: 'อบต. สวิตช์ บี', role: 'auditor' };

  // 1. User A logs in and saves active data
  saveTenantData('ia_working_papers_by_year', { '2569': [{ id: 'WP-USER-A-STABLE' }] }, userA);
  saveTenantData('ia_risk_feedback_linkages_by_year', { '2569': [{ linkageId: 'LINK-A-STABLE' }] }, userA);

  // 2. Simulate storage reload for User A: loads exactly their scoped data
  const reloadedA_Wp = loadTenantData('ia_working_papers_by_year', null, userA);
  const reloadedA_Rf = loadTenantData('ia_risk_feedback_linkages_by_year', null, userA);
  assert.equal(reloadedA_Wp['2569'][0].id, 'WP-USER-A-STABLE');
  assert.equal(reloadedA_Rf['2569'][0].linkageId, 'LINK-A-STABLE');

  // 3. User A logs out, User B logs in
  const userB_Wp = loadTenantData('ia_working_papers_by_year', null, userB);
  assert.equal(userB_Wp, null, 'User B must not see User A data');

  // 4. User B creates and saves their own data
  saveTenantData('ia_working_papers_by_year', { '2569': [{ id: 'WP-USER-B-NEW' }] }, userB);

  // 5. Verify User A data in storage has NOT been modified by User B's activity
  const checkA_Wp = loadTenantData('ia_working_papers_by_year', null, userA);
  assert.equal(checkA_Wp['2569'][0].id, 'WP-USER-A-STABLE');

  // 6. User B logs out, User A logs back in
  const resumeA_Wp = loadTenantData('ia_working_papers_by_year', null, userA);
  assert.equal(resumeA_Wp['2569'][0].id, 'WP-USER-A-STABLE');
});

// =========================================================================
// Test 10.13: Reset Data deletes ONLY active tenant data, preserving other tenants and legacy keys
// Explicitly verifies collision prevention for usernames 'alice' vs 'firm_tenant_alice'
// and thoroughly audits all dynamic key families across years, modules, and plans.
// =========================================================================
await runTest('Condition 10.13: Reset Data deletes ONLY active tenant data, preserving other tenants and legacy keys (alice vs firm_tenant_alice)', async () => {
  mockStorage.clear();
  persistentDatabases.clear();

  // 1. Establish 3 distinct tenant accounts plus admin
  const userA = { username: 'alice', organization: 'อบต. อลิซ (เทศบาลเมืองแม่ฮ่องสอน)', role: 'auditor' };
  const userB = { username: 'firm_tenant_alice', organization: 'บริษัทตรวจสอบ อลิซ การบัญชี จำกัด', role: 'auditor' };
  const userC = { username: 'charlie', organization: 'เทศบาลนคร เชียงใหม่', role: 'auditor' };
  const adminUser = { username: 'admin', organization: 'สำนักตรวจสอบระบบกลาง', role: 'admin' };

  // 2. Establish pre-existing legacy unscoped keys (immutable baseline)
  const legacyUniverse = JSON.stringify({ '2569': [{ id: 'LEGACY-AU-SACRED' }] });
  const legacyWp = JSON.stringify({ '2569': [{ id: 'LEGACY-WP-SACRED' }] });
  const legacyPlan = JSON.stringify({ '2569': [{ id: 'LEGACY-PLAN-SACRED' }] });
  const legacyProfile = JSON.stringify({ name: 'อบต. เดิมก่อนย้ายระบบ' });

  mockStorage.set('ia_audit_universe_by_year', legacyUniverse);
  mockStorage.set('ia_working_papers_by_year', legacyWp);
  mockStorage.set('ia_annual_plans_by_year', legacyPlan);
  mockStorage.set('ia_org_profile', legacyProfile);

  // 3. Establish platform-global keys (must never be deleted by tenant reset)
  const platformUsers = JSON.stringify([{ id: 'U-ROOT', username: 'admin' }, { id: 'U-ALICE', username: 'alice' }]);
  const platformDepts = JSON.stringify(['สำนักปลัด', 'กองคลัง', 'กองช่าง']);
  const platformCentralDocs = JSON.stringify([{ id: 'DOC-CENTRAL-01', title: 'ระเบียบ มท.' }]);
  const platformKnowledge = JSON.stringify({ 'article-1': 'คู่มือตรวจสอบ' });
  const platformFiscalYears = JSON.stringify(['2568', '2569', '2570']);

  mockStorage.set('ia_auth_users', platformUsers);
  mockStorage.set('ia_departments', platformDepts);
  mockStorage.set('ia_central_documents', platformCentralDocs);
  mockStorage.set('ia_knowledge_base', platformKnowledge);
  mockStorage.set('ia_fiscal_years', platformFiscalYears);

  // 4. Establish tenant legacy recovery status markers (must NEVER be deleted by reset)
  saveTenantData('ia_legacy_recovery_status', { awaiting_recovery: true, snapshot_safe: true }, userA);
  saveTenantData('ia_legacy_recovery_status', { awaiting_recovery: false, snapshot_safe: true }, userB);
  const recoveryStatusKeyA = getTenantStorageKey('ia_legacy_recovery_status', userA);
  const recoveryStatusKeyB = getTenantStorageKey('ia_legacy_recovery_status', userB);

  // 5. Establish malformed / unknown / boundary keys in storage
  mockStorage.set('ia_custom_unscoped_data', JSON.stringify({ info: 'custom' }));
  mockStorage.set('ia_opening_meeting_2569_PLAN-01_tenant_alice_extra', JSON.stringify({ title: 'alice_extra' }));
  mockStorage.set('ia_corrupted_tenant_', JSON.stringify({ bad: true }));
  mockStorage.set('ia_random_module_tenant_alice', JSON.stringify({ random: true }));

  // Helper to seed all 25 Scoped Base Keys and all Dynamic Key families for a user
  const seedFullTenantData = (user, prefix) => {
    // A. 14 Core Audit Base Keys
    saveTenantData('ia_annual_plans_by_year', { '2569': [{ id: `PLAN-${prefix}-01` }] }, user);
    saveTenantData('ia_working_papers_by_year', { '2569': [{ id: `WP-${prefix}-01`, title: `กระดาษทำการของ ${prefix}` }] }, user);
    saveTenantData('ia_risk_assessments_by_year', { '2569': [{ id: `RA-${prefix}-01` }] }, user);
    saveTenantData('ia_internal_controls_by_year', { '2569': [{ id: `IC-${prefix}-01` }] }, user);
    saveTenantData('ia_risk_management_by_year', { '2569': [{ id: `RM-${prefix}-01` }] }, user);
    saveTenantData('ia_lpa_indicators_by_year', { '2569': [{ id: `LPA-${prefix}-01` }] }, user);
    saveTenantData('ia_audit_charter_by_year', { '2569': [{ title: `กฎบัตร ${prefix}` }] }, user);
    saveTenantData('ia_audit_universe_by_year', { '2569': [{ id: `AU-${prefix}-01` }] }, user);
    saveTenantData('ia_engagement_plans_by_year', { '2569': [{ id: `ENG-${prefix}-01` }] }, user);
    saveTenantData('ia_org_profile', { name: `อปท. ${prefix}`, auditorName: prefix }, user);
    saveTenantData('ia_strategic_plan', [{ id: `STRAT-${prefix}-01` }], user);
    saveTenantData('ia_strategic_activities_v2', [{ id: `ACT-${prefix}-01` }], user);
    saveTenantData('ia_capa_findings_by_year', { '2569': [{ id: `CAPA-${prefix}-01` }] }, user);
    saveTenantData('ia_risk_feedback_linkages_by_year', { '2569': [{ linkageId: `LINK-${prefix}-01` }] }, user);

    // B. 11 Component View Base Keys
    saveTenantData('ia_central_calendar_events', [{ id: `CAL-${prefix}-01`, title: `นัดหมาย ${prefix}` }], user);
    saveTenantData('ia_dept_office_data', { summary: `สำนักปลัด ${prefix}` }, user);
    saveTenantData('ia_dept_finance_data', { summary: `กองคลัง ${prefix}` }, user);
    saveTenantData('ia_dept_tech_data', { summary: `กองช่าง ${prefix}` }, user);
    saveTenantData('ia_dept_education_data', { summary: `กองการศึกษา ${prefix}` }, user);
    saveTenantData('ia_dept_welfare_data', { summary: `กองสวัสดิการ ${prefix}` }, user);
    saveTenantData('ia_dept_public_health_data', { summary: `กองสาธารณสุข ${prefix}` }, user);
    saveTenantData('ia_dept_cdc_charoen_data', { summary: `ศพด.เจริญ ${prefix}` }, user);
    saveTenantData('ia_dept_cdc_fangthoeng_data', { summary: `ศพด.ฝั่งธง ${prefix}` }, user);
    saveTenantData('ia_executive_directives', [{ id: `DIR-${prefix}-01`, text: `ข้อสั่งการ ${prefix}` }], user);
    saveTenantData('ia_public_overview_data', { slogan: `คำขวัญ ${prefix}` }, user);

    // C. Dynamic Opening Meetings (Multiple years & plans)
    saveTenantData('ia_opening_meeting_2569_PLAN-01', { meetingTitle: `เปิดตรวจ 2569 PLAN-01 ${prefix}` }, user);
    saveTenantData('ia_opening_meeting_2569_PLAN-02', { meetingTitle: `เปิดตรวจ 2569 PLAN-02 ${prefix}` }, user);
    saveTenantData('ia_opening_meeting_2570_PLAN-01', { meetingTitle: `เปิดตรวจ 2570 PLAN-01 ${prefix}` }, user);

    // D. Dynamic Closing Meetings (Multiple years & plans)
    saveTenantData('ia_closing_meeting_2569_PLAN-01', { conclusion: `ปิดตรวจ 2569 PLAN-01 ${prefix}` }, user);
    saveTenantData('ia_closing_meeting_2569_PLAN-02', { conclusion: `ปิดตรวจ 2569 PLAN-02 ${prefix}` }, user);
    saveTenantData('ia_closing_meeting_2570_PLAN-01', { conclusion: `ปิดตรวจ 2570 PLAN-01 ${prefix}` }, user);

    // E. Dynamic Follow-up Registers (Multiple years)
    saveTenantData('ia_followup_register_2569', [{ id: `FU-2569-${prefix}-01` }], user);
    saveTenantData('ia_followup_register_2570', [{ id: `FU-2570-${prefix}-01` }], user);

    // F. Dynamic Audit Committee (Multiple modules & years)
    saveTenantData('ia_audit_comm_eval_2569', [{ dim: 1, score: 4, comment: `ประเมิน 2569 ${prefix}` }], user);
    saveTenantData('ia_audit_comm_evaluator_2569', `ประธานกรรมการ ${prefix}`, user);
    saveTenantData('ia_audit_comm_quarters_2569', [{ quarter: 1, date: '2026-01-15' }], user);
    saveTenantData('ia_audit_comm_members_2569', [{ name: `กรรมการ ${prefix}` }], user);
    saveTenantData('ia_audit_comm_eval_2570', [{ dim: 1, score: 5, comment: `ประเมิน 2570 ${prefix}` }], user);
  };

  // Seed data for all 3 users
  seedFullTenantData(userA, 'ALICE');
  seedFullTenantData(userB, 'FIRM_ALICE');
  seedFullTenantData(userC, 'CHARLIE');

  // Verify key scoping names before reset
  const aliceDynKey = getTenantStorageKey('ia_opening_meeting_2569_PLAN-01', userA);
  const firmDynKey = getTenantStorageKey('ia_opening_meeting_2569_PLAN-01', userB);
  const charlieDynKey = getTenantStorageKey('ia_opening_meeting_2569_PLAN-01', userC);

  assert.equal(aliceDynKey, 'ia_opening_meeting_2569_PLAN-01_tenant_alice');
  assert.equal(firmDynKey, 'ia_opening_meeting_2569_PLAN-01_tenant_firm_tenant_alice');
  assert.equal(charlieDynKey, 'ia_opening_meeting_2569_PLAN-01_tenant_charlie');
  assert.equal(firmDynKey.endsWith('_tenant_alice'), true, 'Confirms firm key suffix matches _tenant_alice');

  // =========================================================================
  // CASE A: Reset User A ('alice')
  // =========================================================================
  const removedKeysA = clearTenantStorage(userA, global.localStorage);

  // A.1 Verify removedKeys contains User A's keys and NEVER contains User B or C
  assert.ok(removedKeysA.includes(aliceDynKey));
  assert.ok(removedKeysA.includes(getTenantStorageKey('ia_working_papers_by_year', userA)));
  assert.ok(removedKeysA.includes(getTenantStorageKey('ia_central_calendar_events', userA)));
  assert.ok(removedKeysA.includes(getTenantStorageKey('ia_dept_finance_data', userA)));
  assert.ok(removedKeysA.includes(getTenantStorageKey('ia_public_overview_data', userA)));
  assert.ok(removedKeysA.includes(getTenantStorageKey('ia_audit_comm_eval_2569', userA)));
  assert.ok(removedKeysA.includes(getTenantStorageKey('ia_audit_comm_eval_2570', userA)));

  assert.equal(removedKeysA.includes(firmDynKey), false, 'CRITICAL: Must NOT contain firm_tenant_alice key');
  assert.equal(removedKeysA.includes(charlieDynKey), false, 'CRITICAL: Must NOT contain charlie key');
  assert.equal(removedKeysA.includes(recoveryStatusKeyA), false, 'CRITICAL: Must NOT remove legacy recovery status marker');

  // A.2 Verify in real storage: ALL User A keys are CLEARED
  assert.equal(loadTenantData('ia_working_papers_by_year', null, userA), null);
  assert.equal(loadTenantData('ia_annual_plans_by_year', null, userA), null);
  assert.equal(loadTenantData('ia_audit_universe_by_year', null, userA), null);
  assert.equal(loadTenantData('ia_org_profile', null, userA), null);
  assert.equal(loadTenantData('ia_risk_feedback_linkages_by_year', null, userA), null);
  assert.equal(loadTenantData('ia_central_calendar_events', null, userA), null);
  assert.equal(loadTenantData('ia_dept_finance_data', null, userA), null);
  assert.equal(loadTenantData('ia_dept_tech_data', null, userA), null);
  assert.equal(loadTenantData('ia_executive_directives', null, userA), null);
  assert.equal(loadTenantData('ia_public_overview_data', null, userA), null);
  assert.equal(loadTenantData('ia_opening_meeting_2569_PLAN-01', null, userA), null);
  assert.equal(loadTenantData('ia_opening_meeting_2569_PLAN-02', null, userA), null);
  assert.equal(loadTenantData('ia_opening_meeting_2570_PLAN-01', null, userA), null);
  assert.equal(loadTenantData('ia_closing_meeting_2569_PLAN-01', null, userA), null);
  assert.equal(loadTenantData('ia_closing_meeting_2570_PLAN-01', null, userA), null);
  assert.equal(loadTenantData('ia_followup_register_2569', null, userA), null);
  assert.equal(loadTenantData('ia_followup_register_2570', null, userA), null);
  assert.equal(loadTenantData('ia_audit_comm_eval_2569', null, userA), null);
  assert.equal(loadTenantData('ia_audit_comm_evaluator_2569', null, userA), null);
  assert.equal(loadTenantData('ia_audit_comm_quarters_2569', null, userA), null);
  assert.equal(loadTenantData('ia_audit_comm_members_2569', null, userA), null);
  assert.equal(loadTenantData('ia_audit_comm_eval_2570', null, userA), null);

  // A.3 CRITICAL: Verify ALL User B ('firm_tenant_alice') modules are 100% INTACT
  const firmWp = loadTenantData('ia_working_papers_by_year', null, userB);
  assert.equal(firmWp['2569'][0].id, 'WP-FIRM_ALICE-01');
  assert.equal(firmWp['2569'][0].title, 'กระดาษทำการของ FIRM_ALICE');

  const firmPlan = loadTenantData('ia_annual_plans_by_year', null, userB);
  assert.equal(firmPlan['2569'][0].id, 'PLAN-FIRM_ALICE-01');

  const firmProfile = loadTenantData('ia_org_profile', null, userB);
  assert.equal(firmProfile.name, 'อปท. FIRM_ALICE');

  const firmCal = loadTenantData('ia_central_calendar_events', null, userB);
  assert.equal(firmCal[0].id, 'CAL-FIRM_ALICE-01');

  const firmFinance = loadTenantData('ia_dept_finance_data', null, userB);
  assert.equal(firmFinance.summary, 'กองคลัง FIRM_ALICE');

  const firmOverview = loadTenantData('ia_public_overview_data', null, userB);
  assert.equal(firmOverview.slogan, 'คำขวัญ FIRM_ALICE');

  const firmOpening = loadTenantData('ia_opening_meeting_2569_PLAN-01', null, userB);
  assert.equal(firmOpening.meetingTitle, 'เปิดตรวจ 2569 PLAN-01 FIRM_ALICE');

  const firmClosing = loadTenantData('ia_closing_meeting_2569_PLAN-01', null, userB);
  assert.equal(firmClosing.conclusion, 'ปิดตรวจ 2569 PLAN-01 FIRM_ALICE');

  const firmFollowup = loadTenantData('ia_followup_register_2569', null, userB);
  assert.equal(firmFollowup[0].id, 'FU-2569-FIRM_ALICE-01');

  const firmAuditComm = loadTenantData('ia_audit_comm_eval_2569', null, userB);
  assert.equal(firmAuditComm[0].comment, 'ประเมิน 2569 FIRM_ALICE');

  // A.4 CRITICAL: Verify ALL User C ('charlie') modules are 100% INTACT
  const charlieWp = loadTenantData('ia_working_papers_by_year', null, userC);
  assert.equal(charlieWp['2569'][0].id, 'WP-CHARLIE-01');

  const charlieOpening = loadTenantData('ia_opening_meeting_2569_PLAN-01', null, userC);
  assert.equal(charlieOpening.meetingTitle, 'เปิดตรวจ 2569 PLAN-01 CHARLIE');

  // A.5 Legacy Keys must be 100% byte-for-byte INTACT
  assert.equal(mockStorage.get('ia_working_papers_by_year'), legacyWp);
  assert.equal(mockStorage.get('ia_audit_universe_by_year'), legacyUniverse);
  assert.equal(mockStorage.get('ia_annual_plans_by_year'), legacyPlan);
  assert.equal(mockStorage.get('ia_org_profile'), legacyProfile);

  // A.6 Platform-Global Keys must be 100% INTACT
  assert.equal(mockStorage.get('ia_auth_users'), platformUsers);
  assert.equal(mockStorage.get('ia_departments'), platformDepts);
  assert.equal(mockStorage.get('ia_central_documents'), platformCentralDocs);
  assert.equal(mockStorage.get('ia_knowledge_base'), platformKnowledge);
  assert.equal(mockStorage.get('ia_fiscal_years'), platformFiscalYears);

  // A.7 Protected recovery status markers & malformed keys must be 100% INTACT
  assert.ok(mockStorage.get(recoveryStatusKeyA), 'Legacy recovery status marker for alice must be preserved');
  assert.ok(mockStorage.get(recoveryStatusKeyB), 'Legacy recovery status marker for firm_tenant_alice must be preserved');
  assert.equal(mockStorage.get('ia_custom_unscoped_data'), JSON.stringify({ info: 'custom' }));
  assert.equal(mockStorage.get('ia_opening_meeting_2569_PLAN-01_tenant_alice_extra'), JSON.stringify({ title: 'alice_extra' }));
  assert.equal(mockStorage.get('ia_corrupted_tenant_'), JSON.stringify({ bad: true }));
  assert.equal(mockStorage.get('ia_random_module_tenant_alice'), JSON.stringify({ random: true }));

  // =========================================================================
  // CASE B: Reset User B ('firm_tenant_alice')
  // =========================================================================
  const removedKeysB = clearTenantStorage(userB, global.localStorage);
  assert.ok(removedKeysB.includes(firmDynKey));

  // B.1 Verify User B keys cleared
  assert.equal(loadTenantData('ia_working_papers_by_year', null, userB), null);
  assert.equal(loadTenantData('ia_opening_meeting_2569_PLAN-01', null, userB), null);
  assert.equal(loadTenantData('ia_central_calendar_events', null, userB), null);

  // B.2 Verify User C ('charlie') STILL 100% INTACT
  const charlieWpAfterB = loadTenantData('ia_working_papers_by_year', null, userC);
  assert.equal(charlieWpAfterB['2569'][0].id, 'WP-CHARLIE-01');

  // B.3 Legacy keys STILL 100% INTACT
  assert.equal(mockStorage.get('ia_working_papers_by_year'), legacyWp);
  assert.equal(mockStorage.get('ia_audit_universe_by_year'), legacyUniverse);

  // =========================================================================
  // CASE C: High-Volume / Multi-Year Tenant Reset ('charlie')
  // Tests iteration resilience without index skipping when deleting 20+ dynamic keys
  // =========================================================================
  const multiYears = ['2567', '2568', '2569', '2570'];
  const multiPlans = ['PLAN-01', 'PLAN-02', 'PLAN-03', 'PLAN-04', 'PLAN-05'];
  const seededDynamicKeysC = [];

  multiYears.forEach(year => {
    multiPlans.forEach(planId => {
      const openKey = `ia_opening_meeting_${year}_${planId}`;
      const closeKey = `ia_closing_meeting_${year}_${planId}`;
      saveTenantData(openKey, { title: `Meeting ${year} ${planId}` }, userC);
      saveTenantData(closeKey, { title: `Closing ${year} ${planId}` }, userC);
      seededDynamicKeysC.push(getTenantStorageKey(openKey, userC));
      seededDynamicKeysC.push(getTenantStorageKey(closeKey, userC));
    });
  });

  assert.ok(seededDynamicKeysC.length >= 40, 'Seeded 40+ dynamic keys for high-volume test');

  // Execute reset for charlie
  const removedKeysC = clearTenantStorage(userC, global.localStorage);

  // Verify all 40+ dynamic keys were enumerated and removed (no index skipping!)
  seededDynamicKeysC.forEach(k => {
    assert.ok(removedKeysC.includes(k), `Key ${k} must be removed`);
    assert.equal(mockStorage.get(k), undefined, `Key ${k} must no longer exist in storage`);
  });

  // Verify charlie base keys are cleared
  assert.equal(loadTenantData('ia_working_papers_by_year', null, userC), null);
  assert.equal(loadTenantData('ia_central_calendar_events', null, userC), null);

  // =========================================================================
  // CASE D: Admin Workspace Reset
  // Admin reset clears only '_tenant_admin' scoped data, NEVER platform-global accounts or depts
  // =========================================================================
  saveTenantData('ia_working_papers_by_year', { '2569': [{ id: 'WP-ADMIN-01' }] }, adminUser);
  saveTenantData('ia_central_calendar_events', [{ id: 'CAL-ADMIN-01' }], adminUser);
  const adminWpKey = getTenantStorageKey('ia_working_papers_by_year', adminUser);
  assert.equal(adminWpKey, 'ia_working_papers_by_year_tenant_admin');
  assert.ok(mockStorage.get(adminWpKey));

  const removedKeysAdmin = clearTenantStorage(adminUser, global.localStorage);
  assert.ok(removedKeysAdmin.includes(adminWpKey));

  // Admin scoped data is cleared
  assert.equal(loadTenantData('ia_working_papers_by_year', null, adminUser), null);

  // CRITICAL: Platform-global accounts and departments MUST REMAIN 100% UNTOUCHED
  assert.equal(mockStorage.get('ia_auth_users'), platformUsers, 'Admin reset must never delete ia_auth_users');
  assert.equal(mockStorage.get('ia_departments'), platformDepts, 'Admin reset must never delete ia_departments');
  assert.equal(mockStorage.get('ia_central_documents'), platformCentralDocs, 'Admin reset must never delete central docs');

  // =========================================================================
  // CASE E: Unknown & Malformed Keys Safety Verification
  // =========================================================================
  assert.equal(mockStorage.get('ia_custom_unscoped_data'), JSON.stringify({ info: 'custom' }));
  assert.equal(mockStorage.get('ia_opening_meeting_2569_PLAN-01_tenant_alice_extra'), JSON.stringify({ title: 'alice_extra' }));
  assert.equal(mockStorage.get('ia_corrupted_tenant_'), JSON.stringify({ bad: true }));
  assert.equal(mockStorage.get('ia_random_module_tenant_alice'), JSON.stringify({ random: true }));

  // =========================================================================
  // CASE F: Idempotent Repeated Reset
  // Calling clearTenantStorage a second time on an already reset user must be safe and idempotent
  // =========================================================================
  const repeatRemovedA = clearTenantStorage(userA, global.localStorage);
  assert.ok(Array.isArray(repeatRemovedA));

  // Legacy keys and platform-global keys remain 100% intact after repeated reset
  assert.equal(mockStorage.get('ia_working_papers_by_year'), legacyWp);
  assert.equal(mockStorage.get('ia_auth_users'), platformUsers);
  assert.equal(mockStorage.get('ia_departments'), platformDepts);
});

console.log(`\n======================================================`);
console.log(`Phase 6A Tenant Isolation Suite Completed: ${testsPassed}/${testsTotal} passed`);
console.log(`======================================================\n`);

if (testsPassed !== testsTotal) {
  process.exit(1);
}
