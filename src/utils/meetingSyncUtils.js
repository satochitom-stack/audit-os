/**
 * Audit OS — Opening & Closing Meeting Persistence Utilities
 * 
 * Provides persistent storage management, engagement scoping, document request tracking,
 * and working paper finding extraction for Opening and Closing Meetings.
 * 
 * Complies with Phase 3 specifications:
 * - Scoped by engagement ID + fiscal year (preventing cross-engagement pollution)
 * - Load/save persists across refresh and tab switching
 * - Opening meeting links to engagement plan and document requests
 * - Closing meeting pulls findings from related working papers with editable minutes
 */

import { getTodayDate } from './followupSyncUtils.js';
import { loadTenantData, saveTenantData } from './tenantStorageUtils.js';

export const getOpeningMeetingStorageKey = (year, planId) => {
  return `ia_opening_meeting_${year || '2569'}_${planId || 'default'}`;
};

export const getClosingMeetingStorageKey = (year, planId) => {
  return `ia_closing_meeting_${year || '2569'}_${planId || 'default'}`;
};

/**
 * Creates default initial structure for Opening Meeting of an engagement.
 */
export const createInitialOpeningMeeting = (plan, options = {}) => {
  const { auditorName = 'ผู้ตรวจสอบภายใน', auditorPosition = 'นักวิชาการตรวจสอบภายใน', year = '2569' } = options;
  const today = getTodayDate();
  const dept = plan?.department || 'หน่วยรับตรวจ';
  const projectName = plan?.projectName || plan?.title || 'งานตรวจสอบภายใน';

  return {
    planId: plan?.id || 'PLAN-01',
    year: String(year),
    meetingDate: today,
    meetingTime: '09:30 น.',
    meetingLocation: `ห้องประชุม${dept} / สำนักงาน อปท.`,
    docRefNo: `มท 0808/${year}/ว...`,
    projectName,
    department: dept,
    auditor: plan?.auditor || auditorName,
    attendees: [
      { name: auditorName, position: auditorPosition, role: 'ประธานการประชุม (ผู้ตรวจสอบภายใน)' },
      { name: `ผู้อำนวยการ${dept}`, position: `ผู้อำนวยการ${dept}`, role: 'หน่วยรับตรวจ' },
      { name: 'เจ้าหน้าที่ผู้รับผิดชอบงาน', position: 'นักวิชาการ / เจ้าพนักงาน', role: 'ผู้ประสานงานหลัก' }
    ],
    requestedDocuments: [
      { id: 'DOC-01', title: 'ฎีกาเบิกจ่ายเงินและเอกสารประกอบการเบิกจ่าย', status: 'pending', receivedDate: '', notes: 'สุ่มตรวจย้อนหลัง 6 เดือน' },
      { id: 'DOC-02', title: 'ทะเบียนคุมเงินงบประมาณ / เงินนอกงบประมาณ', status: 'pending', receivedDate: '', notes: 'รายงาน e-LAAS ล่าสุด' },
      { id: 'DOC-03', title: 'สมุดเงินสดและรายงานเงินคงเหลือประจำวัน', status: 'pending', receivedDate: '', notes: 'ยอด ณ สิ้นเดือนล่าสุด' },
      { id: 'DOC-04', title: 'งบกระทบยอดเงินฝากธนาคารทุกบัญชี', status: 'pending', receivedDate: '', notes: 'พร้อมใบแจ้งยอด (Bank Statement)' }
    ],
    agendas: [
      {
        title: 'วาระที่ 1: ชี้แจงวัตถุประสงค์และขอบเขตการตรวจสอบ',
        details: `ชี้แจงวัตถุประสงค์การตรวจสอบภารกิจ "${projectName}" เพื่อให้มั่นใจว่าการปฏิบัติงานเป็นไปตามระเบียบกฎหมายและมีระบบการควบคุมภายในที่เหมาะสม มิใช่การจับผิด แต่เป็นการช่วยเหลือแนะนำแนวทางปฏิบัติที่ถูกต้อง`
      },
      {
        title: 'วาระที่ 2: ชี้แจงระยะเวลาและวิธีการตรวจสอบ',
        details: 'กำหนดระยะเวลาการตรวจสอบภาคสนาม การสัมภาษณ์เจ้าหน้าที่ การสุ่มตรวจเอกสารหลักฐาน และการสังเกตการณ์การปฏิบัติงาน'
      },
      {
        title: 'วาระที่ 3: ข้อตกลงการประสานงานและการส่งมอบเอกสาร',
        details: 'ตกลงรายชื่อผู้ประสานงานหลัก และกำหนดเวลาส่งมอบเอกสารหลักฐาน (ฎีกา, ทะเบียนคุม, รายงาน) ภายใน 3 วันทำการ'
      },
      {
        title: 'วาระที่ 4: รับฟังความคิดเห็นและปัญหาอุปสรรคจากหน่วยรับตรวจ',
        details: 'เปิดโอกาสให้หน่วยรับตรวจแจ้งข้อจำกัด ปัญหาอุปสรรคในการปฏิบัติงาน หรือประเด็นที่ประสงค์จะขอคำปรึกษาจากผู้ตรวจสอบภายใน'
      }
    ],
    notes: '',
    updatedAt: today
  };
};

/**
 * Loads saved opening meeting or falls back to initialized data.
 */
export const loadOpeningMeeting = (year, plan, options = {}, session = null) => {
  if (!plan) return createInitialOpeningMeeting(null, options);
  const key = getOpeningMeetingStorageKey(year, plan.id);
  try {
    const parsed = loadTenantData(key, null, session);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        ...createInitialOpeningMeeting(plan, options),
        ...parsed,
        planId: plan.id,
        year: String(year)
      };
    }
  } catch (_) {}
  return createInitialOpeningMeeting(plan, options);
};

/**
 * Saves opening meeting to localStorage scoped by engagement ID and year.
 */
export const saveOpeningMeeting = (year, planId, data, session = null) => {
  if (!planId) return;
  const key = getOpeningMeetingStorageKey(year, planId);
  try {
    saveTenantData(key, { ...data, updatedAt: getTodayDate() }, session);
  } catch (e) {
    console.error('Failed to save opening meeting:', e);
  }
};

/**
 * Extracts preliminary findings from working papers related to an engagement.
 */
export const extractFindingsFromWorkingPapers = (workingPapers = [], planId) => {
  if (!Array.isArray(workingPapers)) return [];

  const relatedWps = workingPapers.filter(
    (wp) => wp.auditPlanId === planId || wp.planId === planId || !planId
  );

  return relatedWps
    .filter((wp) => wp.finding && (wp.finding.condition || wp.finding.criteria || wp.topic))
    .map((wp, idx) => ({
      id: wp.id || `WP-FIND-${idx + 1}`,
      wpId: wp.id,
      topic: wp.topic || wp.activity || 'ข้อตรวจพบจากการตรวจสอบ',
      condition: wp.finding?.condition || wp.result || '',
      criteria: wp.criteria || wp.finding?.criteria || '',
      cause: wp.finding?.cause || '',
      effect: wp.finding?.effect || '',
      recommendation: wp.finding?.recommendation || '',
      auditeeFeedback: 'ยอมรับข้อตรวจพบและพร้อมปรับปรุงแก้ไข',
      agreement: wp.finding?.recommendation
        ? `หน่วยรับตรวจจะดำเนินการตามข้อเสนอแนะ: ${wp.finding.recommendation}`
        : 'อยู่ระหว่างดำเนินการตามข้อตกลงร่วมกัน',
      status: 'เห็นชอบร่วมกัน'
    }));
};

/**
 * Creates default initial structure for Closing Meeting of an engagement.
 */
export const createInitialClosingMeeting = (plan, workingPapers = [], options = {}) => {
  const { auditorName = 'ผู้ตรวจสอบภายใน', auditorPosition = 'นักวิชาการตรวจสอบภายใน', year = '2569' } = options;
  const today = getTodayDate();
  const dept = plan?.department || 'หน่วยรับตรวจ';
  const projectName = plan?.projectName || plan?.title || 'งานตรวจสอบภายใน';

  const extractedFindings = extractFindingsFromWorkingPapers(workingPapers, plan?.id);

  const defaultFindings = extractedFindings.length > 0
    ? extractedFindings
    : [
        {
          id: 'FIND-01',
          topic: `ข้อตรวจพบเบื้องต้นในภารกิจ ${projectName}`,
          condition: 'พบข้อบกพร่องด้านการควบคุมภายในและเอกสารหลักฐานบางส่วนยังไม่สมบูรณ์',
          criteria: 'ระเบียบ มท. และหนังสือสั่งการที่เกี่ยวข้อง',
          cause: 'เจ้าหน้าที่ผู้ปฏิบัติงานยังขาดความชัดเจนในแนวทางปฏิบัติ',
          effect: 'อาจมีความเสี่ยงต่อความถูกต้องของรายงาน',
          recommendation: 'เห็นควรกำชับเจ้าหน้าที่ให้ถือปฏิบัติตามระเบียบโดยเคร่งครัด',
          auditeeFeedback: 'ยอมรับข้อตรวจพบและชี้แจงสาเหตุ',
          agreement: 'จะดำเนินการปรับปรุงแก้ไขให้แล้วเสร็จภายในกรอบเวลาที่ตกลงกัน',
          status: 'เห็นชอบร่วมกัน'
        }
      ];

  return {
    planId: plan?.id || 'PLAN-01',
    year: String(year),
    meetingDate: today,
    meetingTime: '13:30 น.',
    meetingLocation: `ห้องประชุม${dept} / สำนักงาน อปท.`,
    docRefNo: `มท 0808/${year}/ว...`,
    projectName,
    department: dept,
    auditor: plan?.auditor || auditorName,
    attendees: [
      { name: auditorName, position: auditorPosition, role: 'ผู้ตรวจสอบภายใน' },
      { name: `ผู้อำนวยการ${dept}`, position: `ผู้อำนวยการ${dept}`, role: 'หัวหน้าหน่วยรับตรวจ' },
      { name: 'เจ้าหน้าที่ผู้รับผิดชอบงาน', position: 'นักวิชาการ / เจ้าพนักงาน', role: 'ผู้ประสานงานหลัก' }
    ],
    findings: defaultFindings,
    conclusion: 'การประชุมปิดตรวจดำเนินไปด้วยความเรียบร้อย หน่วยรับตรวจรับทราบและเห็นชอบร่วมกันในข้อตรวจพบเบื้องต้น',
    nextSteps: 'ผู้ตรวจสอบภายในจะจัดทำรายงานผลการตรวจสอบภายในฉบับสมบูรณ์เสนอผู้บริหารเพื่อโปรดพิจารณาสั่งการต่อไป',
    updatedAt: today
  };
};

/**
 * Loads saved closing meeting or falls back to initialized data.
 */
export const loadClosingMeeting = (year, plan, workingPapers = [], options = {}, session = null) => {
  if (!plan) return createInitialClosingMeeting(null, workingPapers, options);
  const key = getClosingMeetingStorageKey(year, plan.id);
  try {
    const parsed = loadTenantData(key, null, session);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        ...createInitialClosingMeeting(plan, workingPapers, options),
        ...parsed,
        planId: plan.id,
        year: String(year)
      };
    }
  } catch (_) {}
  return createInitialClosingMeeting(plan, workingPapers, options);
};

/**
 * Saves closing meeting to localStorage scoped by engagement ID and year.
 */
export const saveClosingMeeting = (year, planId, data, session = null) => {
  if (!planId) return;
  const key = getClosingMeetingStorageKey(year, planId);
  try {
    saveTenantData(key, { ...data, updatedAt: getTodayDate() }, session)
  } catch (e) {
    console.error('Failed to save closing meeting:', e);
  }
};
