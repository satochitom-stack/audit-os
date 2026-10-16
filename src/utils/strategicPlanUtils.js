/**
 * Audit OS — Strategic Multi-Year to Annual & Engagement Planning Integration
 * 
 * Provides unified data modeling, legacy adapters, and safe roll-forward logic:
 * - Adapts between `ia_strategic_plan` (years map) and `ia_strategic_activities_v2` (y1, y2, y3)
 * - Identifies candidates scheduled for a given fiscal year
 * - Prevents duplicates when rolling forward to Annual Plan
 * - Requires explicit auditor review/confirmation (non-destructive)
 */

/**
 * Normalizes strategic items from either schema format into canonical structure.
 * Canonical structure contains both `years` map and `y1`, `y2`, `y3` relative to `baseYear`.
 */
export const normalizeStrategicItem = (item, baseYear = '2569') => {
  if (!item || typeof item !== 'object') return null;
  const bYear = parseInt(baseYear, 10) || 2569;
  const y1Key = String(bYear);
  const y2Key = String(bYear + 1);
  const y3Key = String(bYear + 2);

  const name = item.name || item.activity || item.title || 'กิจกรรมตรวจสอบ';
  const department = item.department || 'หน่วยรับตรวจ';
  const riskLevel = item.riskLevel || 'ปานกลาง';
  const manDays = Number(item.manDays) || 15;
  const frequency = item.frequency || (item.y1 && item.y2 && item.y3 ? 'ทุกปี (Annual)' : 'ทุก 2 ปี (Bi-annual)');
  const responsibleAuditor = item.responsibleAuditor || item.auditor || 'หน่วยตรวจสอบภายใน';

  // Merge years map
  const existingYears = (item.years && typeof item.years === 'object') ? { ...item.years } : {};
  if ('y1' in item) existingYears[y1Key] = Boolean(item.y1);
  if ('y2' in item) existingYears[y2Key] = Boolean(item.y2);
  if ('y3' in item) existingYears[y3Key] = Boolean(item.y3);

  const y1Val = y1Key in existingYears ? Boolean(existingYears[y1Key]) : Boolean(item.y1);
  const y2Val = y2Key in existingYears ? Boolean(existingYears[y2Key]) : Boolean(item.y2);
  const y3Val = y3Key in existingYears ? Boolean(existingYears[y3Key]) : Boolean(item.y3);

  return {
    id: item.id || `STRAT-${Date.now()}`,
    name,
    activity: name,
    department,
    riskLevel,
    frequency,
    manDays,
    responsibleAuditor,
    years: existingYears,
    y1: y1Val,
    y2: y2Val,
    y3: y3Val
  };
};

/**
 * Normalizes a list of strategic items.
 */
export const normalizeStrategicPlan = (items = [], baseYear = '2569') => {
  if (!Array.isArray(items)) return [];
  return items.map((it) => normalizeStrategicItem(it, baseYear)).filter(Boolean);
};

/**
 * Load unified strategic plan checking both new and legacy storage keys.
 */
export const loadUnifiedStrategicPlan = (baseYear = '2569', defaultFallback = []) => {
  let loaded = null;
  try {
    if (typeof localStorage !== 'undefined') {
      const v2 = localStorage.getItem('ia_strategic_activities_v2');
      if (v2) {
        const parsed = JSON.parse(v2);
        if (Array.isArray(parsed) && parsed.length > 0) loaded = parsed;
      }
      if (!loaded) {
        const v1 = localStorage.getItem('ia_strategic_plan');
        if (v1) {
          const parsed = JSON.parse(v1);
          if (Array.isArray(parsed) && parsed.length > 0) loaded = parsed;
        }
      }
    }
  } catch (_) {}

  const source = loaded || defaultFallback;
  return normalizeStrategicPlan(source, baseYear);
};

/**
 * Saves unified strategic plan to both current and legacy compatible keys.
 */
export const saveUnifiedStrategicPlan = (items, baseYear = '2569') => {
  if (!Array.isArray(items)) return;
  const normalized = normalizeStrategicPlan(items, baseYear);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ia_strategic_plan', JSON.stringify(normalized));
      localStorage.setItem('ia_strategic_activities_v2', JSON.stringify(normalized));
    }
  } catch (e) {
    console.error('Failed to save strategic plan:', e);
  }
};

/**
 * Extracts candidate activities from strategic plan scheduled for a given fiscal year,
 * comparing with existing annual plans to identify already-planned items.
 */
export const getRollForwardCandidates = (strategicPlan = [], targetYear = '2569', existingAnnualPlans = []) => {
  const normStrategic = normalizeStrategicPlan(strategicPlan, targetYear);
  const tYearStr = String(targetYear);

  return normStrategic.map((item) => {
    // Check if scheduled in target year
    const isScheduled = Boolean(item.years && item.years[tYearStr]);

    // Check if duplicate exists in existingAnnualPlans
    const cleanItemName = (item.name || item.activity || '').trim().toLowerCase();
    const cleanDept = (item.department || '').trim().toLowerCase();

    const existingMatch = (existingAnnualPlans || []).find((ap) => {
      const apTitle = (ap.projectName || ap.title || ap.topic || ap.activity || '').trim().toLowerCase();
      const apDept = (ap.department || '').trim().toLowerCase();
      return (
        apTitle === cleanItemName ||
        (cleanDept && apDept === cleanDept && (apTitle.includes(cleanItemName) || cleanItemName.includes(apTitle)))
      );
    });

    return {
      strategicId: item.id,
      title: item.name || item.activity,
      department: item.department,
      riskLevel: item.riskLevel,
      manDays: item.manDays || 15,
      frequency: item.frequency,
      isScheduled,
      alreadyPlanned: Boolean(existingMatch),
      existingPlanId: existingMatch ? existingMatch.id : null,
      canRollForward: isScheduled && !existingMatch
    };
  });
};

/**
 * Executes roll-forward of confirmed candidates into annual audit plans.
 * Guarantees zero overwriting of existing plans and generates stable plan IDs.
 */
export const rollForwardToAnnualPlans = (
  candidates = [],
  selectedStrategicIds = [],
  existingAnnualPlans = [],
  targetYear = '2569',
  options = {}
) => {
  const { auditorName = 'หน่วยตรวจสอบภายใน' } = options;
  const currentPlans = Array.isArray(existingAnnualPlans) ? [...existingAnnualPlans] : [];
  const selectedSet = new Set(selectedStrategicIds);

  const toAdd = [];
  const yrSuffix = String(targetYear).slice(-2);

  candidates.forEach((cand) => {
    if (!selectedSet.has(cand.strategicId)) return;
    if (cand.alreadyPlanned) return; // Prevent double insertion

    const planIndex = currentPlans.length + toAdd.length + 1;
    const planId = `PLAN-${targetYear}-${String(planIndex).padStart(2, '0')}`;

    toAdd.push({
      id: planId,
      strategicId: cand.strategicId,
      projectName: cand.title,
      title: cand.title,
      department: cand.department,
      riskLevel: cand.riskLevel,
      quarter: 'ไตรมาส 1-2',
      manDays: cand.manDays || 20,
      auditor: auditorName,
      status: 'ร่างแผน',
      source: 'strategic_rollforward',
      fiscalYear: String(targetYear)
    });
  });

  return {
    updatedAnnualPlans: [...currentPlans, ...toAdd],
    addedCount: toAdd.length,
    addedPlans: toAdd
  };
};
