/**
 * Audit OS — CAPA & Follow-up Integration Utilities
 * 
 * Provides pure, deterministic data reconciliation, date calculation,
 * and two-way status synchronization between CAPA Findings (ia_capa_findings_by_year)
 * and the Audit Follow-Up Register (ia_followup_register_${selectedYear}).
 * 
 * Complies with DLA internal audit lifecycle rules, preserving legacy data,
 * preventing duplicate records, and maintaining complete audit trails.
 */

// Parse date-only strings without timezone shifts. Support both Gregorian
// dates from HTML date inputs (e.g. 2026-10-16) and legacy Buddhist dates
// (e.g. 2569-10-16). Keep the input format when adding days.
export const parseDateOnly = (dateStr) => {
  if (typeof dateStr !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;

  const inputYear = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const isBuddhistYear = inputYear >= 2400 && inputYear <= 2700;
  const year = isBuddhistYear ? inputYear - 543 : inputYear;
  const date = new Date(Date.UTC(year, month - 1, day));

  // Reject impossible dates rather than silently normalizing them.
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { date, isBuddhistYear };
};

export const formatDateOnly = (date, isBuddhistYear) => {
  const year = date.getUTCFullYear() + (isBuddhistYear ? 543 : 0);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Add calendar days while preserving whether the input uses Buddhist or Gregorian years.
export const addDays = (dateStr, days) => {
  const parsed = parseDateOnly(dateStr);
  if (!parsed || !Number.isFinite(days)) return dateStr;

  const date = new Date(parsed.date.getTime());
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return formatDateOnly(date, parsed.isBuddhistYear);
};

// Return remaining calendar days using local "today" and a timezone-safe date-only comparison.
export const calculateDaysRemaining = (deadlineStr) => {
  const parsedDeadline = parseDateOnly(deadlineStr);
  if (!parsedDeadline) return 0;

  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parsedDeadline.date.getTime() - today) / 86400000);
};

export const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Standardize source name and label
 */
export const getSourceMeta = (source) => {
  switch (source) {
    case 'oag':
      return {
        key: 'oag',
        label: 'สตง.',
        fullName: 'สำนักงานการตรวจเงินแผ่นดิน (สตง.)',
        color: 'rose'
      };
    case 'inspector':
      return {
        key: 'inspector',
        label: 'ผู้ตรวจราชการ',
        fullName: 'ผู้ตรวจราชการกระทรวงมหาดไทย/จังหวัด',
        color: 'purple'
      };
    case 'external':
      return {
        key: 'external',
        label: 'หน่วยงานภายนอก',
        fullName: 'หน่วยงานตรวจสอบภายนอกอื่นๆ',
        color: 'indigo'
      };
    case 'internal':
    default:
      return {
        key: 'internal',
        label: 'ตรวจสอบภายใน',
        fullName: 'หน่วยตรวจสอบภายใน อปท.',
        color: 'blue'
      };
  }
};

/**
 * Creates an audit trail history entry
 */
export const createFollowupHistoryEntry = ({
  action = 'status_update',
  fromStatus = '',
  toStatus = '',
  changedBy = 'ผู้ตรวจสอบภายใน',
  note = '',
  evidence = '',
  date = getTodayDate()
} = {}) => ({
  id: `HIST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  timestamp: new Date().toISOString(),
  date: date || getTodayDate(),
  action,
  fromStatus,
  toStatus,
  changedBy: changedBy || 'ผู้ตรวจสอบภายใน',
  note: note || '',
  evidence: evidence || ''
});

/**
 * Reconciles stored follow-up register items with CAPA findings.
 * 
 * - Preserves existing manual/legacy register items.
 * - Prevents duplicates by matching findingId === capa.id OR id === capa.id.
 * - Enriches matched items with CAPA details (condition, criteria, cause, effect, evidence).
 * - Creates new register items for newly tracked CAPA findings.
 * - Never modifies user-edited follow-up fields (regime, deadlineDays, deadlineBasis, custom progress).
 * 
 * @param {Array} storedRegister - Items loaded from localStorage ia_followup_register_${selectedYear}
 * @param {Array} capaFindings - Items from CAPA ia_capa_findings_by_year[selectedYear]
 * @param {Object} options - { auditorName, selectedYear, defaultItems }
 * @returns {Array} Reconciled register items
 */
export const reconcileFollowupRegister = (storedRegister, capaFindings = [], options = {}) => {
  const { auditorName = 'ผู้ตรวจสอบภายใน', defaultItems = [] } = options;
  const today = getTodayDate();

  const hasStored = Array.isArray(storedRegister) && storedRegister.length > 0;
  const hasCapa = Array.isArray(capaFindings) && capaFindings.length > 0;

  // Base list to work from
  let result = [];
  if (hasStored) {
    result = storedRegister.map(item => ({ ...item }));
  } else if (!hasCapa && defaultItems.length > 0) {
    return defaultItems.map(item => ({ ...item }));
  }

  if (!hasCapa) {
    return result;
  }

  capaFindings.forEach((capa) => {
    if (!capa || !capa.id) return;

    // Check if finding is already in the follow-up register
    const matchIndex = result.findIndex(
      (item) => (item.findingId && item.findingId === capa.id) || item.id === capa.id
    );

    const sourceMeta = getSourceMeta(capa.source);
    const capaIsClosed = capa.status === 'verified_closed' || capa.status === 'completed';

    if (matchIndex !== -1) {
      // Existing item found: enrich with CAPA details while preserving user-edited follow-up fields
      const existing = result[matchIndex];
      result[matchIndex] = {
        ...existing,
        findingId: capa.id,
        source: existing.source || capa.source || 'internal',
        sourceName: existing.sourceName || capa.sourceName || sourceMeta.fullName,
        severity: existing.severity || capa.severity || 'medium',
        title: existing.title || capa.title || 'ข้อค้นพบจากการตรวจสอบ',
        department: existing.department || capa.department || 'หน่วยรับตรวจ',
        responsiblePerson: existing.responsiblePerson || capa.responsiblePerson || '',
        condition: existing.condition || capa.condition || '',
        criteria: existing.criteria || capa.criteria || '',
        cause: existing.cause || capa.cause || '',
        effect: existing.effect || capa.effect || '',
        correctiveAction: existing.correctiveAction || capa.correctiveAction || '',
        preventiveAction: existing.preventiveAction || capa.preventiveAction || '',
        evidenceDocs: existing.evidenceDocs || capa.evidenceDocs || '',
        recommendation: existing.recommendation || capa.recommendation || capa.correctiveAction || capa.title || '',
        orderDate: existing.orderDate || capa.orderDate || capa.receivedDate || today,
        // If the follow-up item was never touched and capa has verified_closed, sync status
        status: existing.status || (capaIsClosed ? 'completed' : 'in_progress'),
        history: Array.isArray(existing.history) ? existing.history : []
      };
    } else {
      // New finding in CAPA not yet in follow-up register: create new linked record
      const orderDate = capa.orderDate || capa.receivedDate || today;
      const days = 30;
      const deadlineDate = addDays(orderDate, days);
      const initialStatus = capaIsClosed ? 'completed' : (capa.status === 'overdue' ? 'overdue' : 'in_progress');

      const newItem = {
        id: capa.id.startsWith('CAPA-') ? capa.id : `CAPA-FOLLOW-${capa.id}`,
        findingId: capa.id,
        source: capa.source || 'internal',
        sourceName: capa.sourceName || sourceMeta.fullName,
        title: capa.title || 'ข้อค้นพบจากการตรวจสอบ',
        department: capa.department || 'หน่วยรับตรวจ',
        responsiblePerson: capa.responsiblePerson || '',
        severity: capa.severity || 'medium',
        condition: capa.condition || '',
        criteria: capa.criteria || '',
        cause: capa.cause || '',
        effect: capa.effect || '',
        correctiveAction: capa.correctiveAction || '',
        preventiveAction: capa.preventiveAction || '',
        evidenceDocs: capa.evidenceDocs || '',
        recommendation: capa.recommendation || capa.correctiveAction || capa.title || '',
        reportedDate: capa.receivedDate || orderDate,
        orderDate: orderDate,
        regime: 'agency_defined',
        deadlineDays: days,
        deadlineBasis: 'กำหนดตามแผนการปรับปรุงของหน่วยรับตรวจ',
        deadlineDate: deadlineDate,
        status: initialStatus,
        progressNotes: capa.correctiveAction
          ? `แผนแก้ไข: ${capa.correctiveAction}`
          : 'อยู่ระหว่างหน่วยรับตรวจดำเนินการปรับปรุงแก้ไข',
        history: [
          createFollowupHistoryEntry({
            action: 'linked_from_capa',
            fromStatus: '',
            toStatus: initialStatus,
            changedBy: auditorName,
            note: 'เชื่อมโยงอัตโนมัติจากทะเบียนข้อค้นพบ CAPA',
            date: orderDate
          })
        ],
        updatedAt: today
      };

      result.push(newItem);
    }
  });

  return result;
};

/**
 * Synchronize status changes from Follow-up item back to CAPA findings list.
 * 
 * @param {Array} capaFindings - Current CAPA findings list
 * @param {string} targetId - Finding ID (e.g. CAPA-OAG-69-01)
 * @param {string} newFollowupStatus - New follow-up status ('completed', 'in_progress', 'overdue', 'urgent')
 * @param {Object} details - { note, auditorName, date }
 * @returns {Array} Updated CAPA findings list
 */
export const syncFollowupStatusToCapa = (capaFindings = [], targetId, newFollowupStatus, details = {}) => {
  if (!Array.isArray(capaFindings) || !targetId) return capaFindings;
  const today = details.date || getTodayDate();

  return capaFindings.map((capa) => {
    if (capa.id === targetId || (capa.findingId && capa.findingId === targetId)) {
      const isCompleted = newFollowupStatus === 'completed';
      const updatedStatus = isCompleted ? 'verified_closed' : 'in_progress';

      return {
        ...capa,
        status: updatedStatus,
        verifiedDate: isCompleted ? (capa.verifiedDate || today) : '',
        progressNotes: details.note
          ? (capa.progressNotes ? `${capa.progressNotes}\n[${today}] ${details.note}` : `[${today}] ${details.note}`)
          : capa.progressNotes
      };
    }
    return capa;
  });
};

/**
 * Creates a CAPA finding model from a newly added follow-up item.
 * Enables two-way authoring so findings added in follow-up appear in CAPA.
 */
export const createCapaFromFollowupItem = (item, selectedYear = '2569') => {
  const yearSuffix = (selectedYear || '2569').slice(-2);
  const today = getTodayDate();
  const sourceMeta = getSourceMeta(item.source || 'internal');

  return {
    id: item.findingId || item.id || `CAPA-IA-${yearSuffix}-${Date.now().toString().slice(-4)}`,
    source: item.source || 'internal',
    sourceName: item.sourceName || sourceMeta.fullName,
    title: item.title,
    department: item.department,
    responsiblePerson: item.responsiblePerson || `ผู้อำนวยการ${item.department}`,
    severity: item.severity || 'medium',
    receivedDate: item.orderDate || item.reportedDate || today,
    orderDate: item.orderDate || today,
    dueDate: item.deadlineDate || addDays(item.orderDate || today, item.deadlineDays || 30),
    condition: item.condition || item.title,
    criteria: item.criteria || 'ระเบียบและแนวทางปฏิบัติที่เกี่ยวข้อง',
    cause: item.cause || 'อยู่ระหว่างติดตามผลการตรวจสอบ',
    effect: item.effect || 'อาจส่งผลต่อการควบคุมภายในและการบริหารจัดการ',
    correctiveAction: item.correctiveAction || item.progressNotes || '',
    preventiveAction: item.preventiveAction || '',
    evidenceDocs: item.evidenceDocs || '',
    status: item.status === 'completed' ? 'verified_closed' : 'in_progress',
    verifiedDate: item.status === 'completed' ? today : '',
    auditorOpinion: item.recommendation || '',
    recommendation: item.recommendation || '',
    executiveOrder: `สั่งการเมื่อ ${item.orderDate || today}`
  };
};
