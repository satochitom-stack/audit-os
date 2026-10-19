// src/utils/riskFeedbackUtils.js
// ระบบเชื่อมโยงผลการตรวจสอบเดิมและข้อทักท้วงเข้าสู่จักรวาลการตรวจสอบ (Risk Feedback Loop)
// รองรับ Multi-Tenant (แยกตาม orgId / user tenant) และแยกตามปีงบประมาณอย่างสมบูรณ์

export function getTenantStorageKey(baseKey, session = null) {
  const username = typeof session === 'string'
    ? session
    : session?.username;
  if (username && username.toLowerCase() !== 'admin') {
    return `${baseKey}_tenant_${username.toLowerCase()}`;
  }
  return baseKey;
}

export function loadTenantData(baseKey, defaultVal = null, session = null) {
  try {
    const key = getTenantStorageKey(baseKey, session);
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    const legacy = localStorage.getItem(baseKey);
    if (legacy !== null) {
      return JSON.parse(legacy);
    }
  } catch (e) {
    console.warn('Failed to load tenant data:', e);
  }
  return defaultVal;
}

export function saveTenantData(baseKey, val, session = null) {
  try {
    const key = getTenantStorageKey(baseKey, session);
    const jsonStr = JSON.stringify(val);
    localStorage.setItem(key, jsonStr);
    if (key !== baseKey) {
      localStorage.setItem(baseKey, jsonStr);
    }
  } catch (e) {
    console.warn('Failed to save tenant data:', e);
  }
}

export const RISK_FEEDBACK_STORAGE_KEY = 'ia_risk_feedback_linkages_by_year';

/**
 * โหลดข้อมูลความเชื่อมโยง Risk Feedback ทั้งหมดของ Tenant
 * @param {object} session - Session ผู้ใช้งานปัจจุบัน
 * @returns {Record<string, Array>} ข้อมูลความเชื่อมโยงแยกตามปีเป้าหมาย (targetYear)
 */
export function loadAllRiskFeedbackLinkages(session = null) {
  try {
    const tenantSaved = loadTenantData(RISK_FEEDBACK_STORAGE_KEY, null, session);
    if (tenantSaved && typeof tenantSaved === 'object') {
      return tenantSaved;
    }
    const legacy = localStorage.getItem(RISK_FEEDBACK_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('Failed to load risk feedback linkages:', err);
  }
  return { '2569': [], '2570': [] };
}

/**
 * โหลดข้อมูลความเชื่อมโยงเฉพาะปีงบประมาณเป้าหมาย (Target Fiscal Year)
 * @param {string} targetYear - ปีงบประมาณเป้าหมาย เช่น '2569'
 * @param {object} session - Session ผู้ใช้งานปัจจุบัน
 * @returns {Array} รายการความเชื่อมโยงในปีนั้น
 */
export function loadRiskFeedbackLinkages(targetYear = '2569', session = null) {
  const all = loadAllRiskFeedbackLinkages(session);
  return Array.isArray(all[targetYear]) ? all[targetYear] : [];
}

/**
 * บันทึกข้อมูลความเชื่อมโยงเฉพาะปีงบประมาณเป้าหมาย
 * @param {string} targetYear - ปีงบประมาณเป้าหมาย
 * @param {Array} linkagesForYear - รายการความเชื่อมโยงของปีนั้น
 * @param {object} session - Session ผู้ใช้งานปัจจุบัน
 */
export function saveRiskFeedbackLinkages(targetYear = '2569', linkagesForYear = [], session = null) {
  try {
    const all = { ...loadAllRiskFeedbackLinkages(session) };
    all[targetYear] = Array.isArray(linkagesForYear) ? linkagesForYear : [];
    saveTenantData(RISK_FEEDBACK_STORAGE_KEY, all, session);
    localStorage.setItem(RISK_FEEDBACK_STORAGE_KEY, JSON.stringify(all));
    return all;
  } catch (err) {
    console.warn('Failed to save risk feedback linkages:', err);
    return null;
  }
}

/**
 * สร้างและเพิ่มความเชื่อมโยงข้อทักท้วงเดิมเข้าสู่กิจกรรมใน Audit Universe
 * ป้องกันการเพิ่มรายการซ้ำซ้อน (Duplicate Protection)
 * ข้อกำหนดสำคัญ: ไม่มีการแก้ไขคะแนน S/O/F/C/K ของกิจกรรมโดยอัตโนมัติ
 * 
 * @param {Array} currentLinkages - รายการความเชื่อมโยงเดิม
 * @param {object} payload - ข้อมูลที่ต้องการเชื่อมโยง
 * @returns {{ success: boolean, reason?: string, linkages: Array, newLinkage?: object }}
 */
export function addRiskFeedbackLinkage(currentLinkages = [], payload = {}) {
  const {
    universeId,
    universeActivity = '',
    sourceType = 'capa', // 'capa' | 'followup'
    sourceYear = '2568',
    targetYear = '2569',
    issueId,
    issueTitle = '',
    department = '',
    status = '',
    recommendation = '',
    notes = ''
  } = payload;

  if (!universeId || !issueId) {
    return { success: false, reason: 'missing_identifiers', linkages: currentLinkages };
  }

  // ป้องกันการเชื่อมโยงรายการเดิมซ้ำในกิจกรรมเดียวกัน
  const isDuplicate = currentLinkages.some(
    (item) => item.universeId === universeId && item.issueId === issueId
  );

  if (isDuplicate) {
    return { success: false, reason: 'duplicate', linkages: currentLinkages };
  }

  const newLinkage = {
    id: `RFL-${targetYear}-${Date.now().toString().slice(-6)}`,
    universeId,
    universeActivity,
    sourceType,
    sourceYear: String(sourceYear),
    targetYear: String(targetYear),
    issueId,
    issueTitle,
    department,
    status: status || 'pending',
    recommendation,
    notes,
    linkedAt: new Date().toISOString()
  };

  const updated = [newLinkage, ...currentLinkages];
  return { success: true, linkages: updated, newLinkage };
}

/**
 * ยกเลิกความเชื่อมโยง (Unlink) จากกิจกรรม
 * @param {Array} currentLinkages - รายการความเชื่อมโยงเดิม
 * @param {string} linkageId - รหัสความเชื่อมโยงที่ต้องการลบ
 * @returns {{ success: boolean, linkages: Array }}
 */
export function removeRiskFeedbackLinkage(currentLinkages = [], linkageId = '') {
  if (!linkageId) return { success: false, linkages: currentLinkages };
  const updated = currentLinkages.filter((item) => item.id !== linkageId);
  return { success: true, linkages: updated };
}

/**
 * ดึงรายการข้อทักท้วงเดิม/ข้อสังเกตที่มีอยู่เพื่อนำมาเป็นตัวเลือกในการเชื่อมโยง
 * รองรับทั้ง CAPA Findings และ Follow-up Register พร้อมกรองตามปีต้นทางและสำนัก/กอง
 * 
 * @param {object} params
 * @param {string} params.sourceYear - ปีงบประมาณต้นทาง
 * @param {object} params.capaFindingsByYear - แผนที่ CAPA findings แยกตามปี
 * @param {Array} params.followupRegisterItems - รายการในทะเบียนติดตามผล
 * @param {string} params.departmentFilter - กรองตามแผนก/กอง (ค่าเริ่มต้น 'all')
 * @returns {Array} รายการข้อทักท้วงพร้อมเชื่อมโยง
 */
export function getAvailableSourceIssues({
  sourceYear = '2568',
  capaFindingsByYear = {},
  followupRegisterItems = [],
  departmentFilter = 'all'
}) {
  const issues = [];
  const seenIds = new Set();

  // 1. รวบรวมจาก capaFindingsByYear ตามปีต้นทาง
  const capaList = Array.isArray(capaFindingsByYear?.[sourceYear])
    ? capaFindingsByYear[sourceYear]
    : [];

  capaList.forEach((c) => {
    if (!c || !c.id) return;
    if (departmentFilter !== 'all' && c.department !== departmentFilter) return;
    if (!seenIds.has(c.id)) {
      seenIds.add(c.id);
      issues.push({
        issueId: c.id,
        issueTitle: c.title || c.topic || 'ข้อทักท้วงตรวจสอบ',
        sourceType: 'capa',
        sourceYear: String(sourceYear),
        department: c.department || '',
        status: c.status || 'pending',
        recommendation: c.recommendation || '',
        reportedDate: c.reportedDate || c.date || ''
      });
    }
  });

  // 2. รวบรวมจาก Follow-up Register (ตรวจจากพารามิเตอร์หรือ LocalStorage ประจำปีนั้น)
  let followList = Array.isArray(followupRegisterItems) ? followupRegisterItems : [];
  if (followList.length === 0) {
    try {
      const saved = localStorage.getItem(`ia_followup_register_${sourceYear}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) followList = parsed;
      }
    } catch (_) {}
  }

  followList.forEach((f) => {
    if (!f || !f.id) return;
    if (departmentFilter !== 'all' && f.department !== departmentFilter) return;
    if (!seenIds.has(f.id)) {
      seenIds.add(f.id);
      issues.push({
        issueId: f.id,
        issueTitle: f.title || 'ข้อสังเกตการติดตามผล',
        sourceType: 'followup',
        sourceYear: String(sourceYear),
        department: f.department || '',
        status: f.status || 'in_progress',
        recommendation: f.recommendation || '',
        reportedDate: f.reportedDate || ''
      });
    }
  });

  return issues;
}

/**
 * ตรวจสอบความถูกต้องว่าคะแนน S/O/F/C/K ไม่ถูกเปลี่ยนแปลงอัตโนมัติ
 * @param {object} beforeItem - กิจกรรมก่อนเชื่อมโยง
 * @param {object} afterItem - กิจกรรมหลังเชื่อมโยง
 * @returns {boolean} true ถ้าคะแนนทุกมิติยังคงเดิมทุกประการ
 */
export function verifyScoresUntouched(beforeItem, afterItem) {
  if (!beforeItem || !afterItem) return false;
  return (
    Number(beforeItem.sScore ?? beforeItem.s ?? 0) === Number(afterItem.sScore ?? afterItem.s ?? 0) &&
    Number(beforeItem.oScore ?? beforeItem.o ?? 0) === Number(afterItem.oScore ?? afterItem.o ?? 0) &&
    Number(beforeItem.fScore ?? beforeItem.f ?? 0) === Number(afterItem.fScore ?? afterItem.f ?? 0) &&
    Number(beforeItem.cScore ?? beforeItem.c ?? 0) === Number(afterItem.cScore ?? afterItem.c ?? 0) &&
    Number(beforeItem.kScore ?? beforeItem.k ?? 0) === Number(afterItem.kScore ?? afterItem.k ?? 0)
  );
}
