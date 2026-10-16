import assert from 'node:assert/strict';
import {
  getOpeningMeetingStorageKey,
  getClosingMeetingStorageKey,
  createInitialOpeningMeeting,
  createInitialClosingMeeting,
  extractFindingsFromWorkingPapers
} from '../src/utils/meetingSyncUtils.js';

console.log('🧪 Starting Opening & Closing Meeting Persistence Unit Tests...');

// -------------------------------------------------------------
// Test 1: Storage Keys Scoping
// -------------------------------------------------------------
{
  const openKey1 = getOpeningMeetingStorageKey('2569', 'PLAN-01');
  const openKey2 = getOpeningMeetingStorageKey('2569', 'PLAN-02');
  const openKeyNextYear = getOpeningMeetingStorageKey('2570', 'PLAN-01');

  assert.equal(openKey1, 'ia_opening_meeting_2569_PLAN-01');
  assert.equal(openKey2, 'ia_opening_meeting_2569_PLAN-02');
  assert.equal(openKeyNextYear, 'ia_opening_meeting_2570_PLAN-01');
  assert.notEqual(openKey1, openKey2, 'Keys must differ by engagement plan ID');
  assert.notEqual(openKey1, openKeyNextYear, 'Keys must differ by fiscal year');

  const closeKey1 = getClosingMeetingStorageKey('2569', 'PLAN-01');
  assert.equal(closeKey1, 'ia_closing_meeting_2569_PLAN-01');

  console.log('  ✅ Test 1 Passed: Storage Keys Scoping');
}

// -------------------------------------------------------------
// Test 2: Initial Opening Meeting Structure & Document Requests
// -------------------------------------------------------------
{
  const plan = {
    id: 'PLAN-01',
    projectName: 'ตรวจสอบการเบิกจ่ายเงินงบประมาณ',
    department: 'กองคลัง',
    auditor: 'นายผู้ตรวจ รอบคอบ'
  };

  const meeting = createInitialOpeningMeeting(plan, {
    year: '2569',
    auditorName: 'นายผู้ตรวจ รอบคอบ',
    auditorPosition: 'นักวิชาการตรวจสอบภายในชำนาญการ'
  });

  assert.equal(meeting.planId, 'PLAN-01');
  assert.equal(meeting.year, '2569');
  assert.equal(meeting.department, 'กองคลัง');
  assert.equal(meeting.projectName, 'ตรวจสอบการเบิกจ่ายเงินงบประมาณ');
  assert.ok(Array.isArray(meeting.requestedDocuments), 'Must include requestedDocuments');
  assert.ok(meeting.requestedDocuments.length >= 4, 'Must have at least 4 standard document requests');
  assert.equal(meeting.requestedDocuments[0].status, 'pending');
  assert.ok(Array.isArray(meeting.attendees), 'Must include attendees list');
  assert.ok(Array.isArray(meeting.agendas), 'Must include agendas');
  assert.equal(meeting.agendas.length, 4);

  console.log('  ✅ Test 2 Passed: Initial Opening Meeting Structure & Document Requests');
}

// -------------------------------------------------------------
// Test 3: Extract Findings from Working Papers
// -------------------------------------------------------------
{
  const workingPapers = [
    {
      id: 'WP-01',
      auditPlanId: 'PLAN-01',
      topic: 'การจัดทำงบกระทบยอดเงินฝากธนาคาร',
      finding: {
        condition: 'พบว่างบกระทบยอดเงินฝากธนาคารค้างจัดทำ 2 เดือน',
        criteria: 'ระเบียบ มท. ว่าด้วยการรับเงินฯ พ.ศ. 2566 ข้อ 94',
        cause: 'เจ้าหน้าที่เพิ่งได้รับการบรรจุแต่งตั้ง',
        effect: 'ไม่ทราบยอดเงินฝากที่แท้จริง',
        recommendation: 'ให้เร่งรัดจัดทำงบกระทบยอดให้เป็นปัจจุบัน'
      }
    },
    {
      id: 'WP-02',
      auditPlanId: 'PLAN-02',
      topic: 'การควบคุมพัสดุและครุภัณฑ์',
      finding: {
        condition: 'ทะเบียนคุมพัสดุไม่เป็นปัจจุบัน',
        criteria: 'ระเบียบพัสดุ',
        recommendation: 'ปรับปรุงทะเบียนคุม'
      }
    }
  ];

  // For PLAN-01: should extract only WP-01
  const findingsPlan1 = extractFindingsFromWorkingPapers(workingPapers, 'PLAN-01');
  assert.equal(findingsPlan1.length, 1);
  assert.equal(findingsPlan1[0].id, 'WP-01');
  assert.equal(findingsPlan1[0].topic, 'การจัดทำงบกระทบยอดเงินฝากธนาคาร');
  assert.equal(findingsPlan1[0].condition, 'พบว่างบกระทบยอดเงินฝากธนาคารค้างจัดทำ 2 เดือน');

  // For PLAN-02: should extract only WP-02
  const findingsPlan2 = extractFindingsFromWorkingPapers(workingPapers, 'PLAN-02');
  assert.equal(findingsPlan2.length, 1);
  assert.equal(findingsPlan2[0].id, 'WP-02');

  console.log('  ✅ Test 3 Passed: Extract Findings from Working Papers scoped by Plan ID');
}

// -------------------------------------------------------------
// Test 4: Initial Closing Meeting Structure
// -------------------------------------------------------------
{
  const plan = {
    id: 'PLAN-01',
    projectName: 'ตรวจสอบการเบิกจ่ายเงินงบประมาณ',
    department: 'กองคลัง'
  };

  const workingPapers = [
    {
      id: 'WP-01',
      auditPlanId: 'PLAN-01',
      topic: 'งบกระทบยอดค้าง',
      finding: {
        condition: 'ค้างจัดทำ 2 เดือน',
        criteria: 'ระเบียบ มท.',
        recommendation: 'เร่งรัดจัดทำ'
      }
    }
  ];

  const closing = createInitialClosingMeeting(plan, workingPapers, {
    year: '2569',
    auditorName: 'ผู้ตรวจสอบ'
  });

  assert.equal(closing.planId, 'PLAN-01');
  assert.equal(closing.year, '2569');
  assert.equal(closing.findings.length, 1);
  assert.equal(closing.findings[0].topic, 'งบกระทบยอดค้าง');
  assert.equal(closing.findings[0].status, 'เห็นชอบร่วมกัน');
  assert.ok(closing.conclusion.length > 0);
  assert.ok(closing.nextSteps.length > 0);

  console.log('  ✅ Test 4 Passed: Initial Closing Meeting Structure');
}

// -------------------------------------------------------------
// Test 5: Opening Meeting Save & Load Roundtrip with Document Requests
// -------------------------------------------------------------
{
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  const plan = { id: 'ENG-FIN-01', projectName: 'ตรวจการเงิน', department: 'กองคลัง' };
  const initial = createInitialOpeningMeeting(plan, { year: '2569' });

  // Update document request status
  initial.requestedDocuments[0].status = 'received';
  initial.requestedDocuments[0].receivedDate = '2026-10-16';
  initial.requestedDocuments[0].notes = 'รับมอบครบ 6 เดือนแล้ว';

  const { saveOpeningMeeting, loadOpeningMeeting } = await import('../src/utils/meetingSyncUtils.js');

  saveOpeningMeeting('2569', plan.id, initial);

  const loaded = loadOpeningMeeting('2569', plan);
  assert.equal(loaded.planId, 'ENG-FIN-01');
  assert.equal(loaded.requestedDocuments[0].status, 'received');
  assert.equal(loaded.requestedDocuments[0].receivedDate, '2026-10-16');
  assert.equal(loaded.requestedDocuments[0].notes, 'รับมอบครบ 6 เดือนแล้ว');
  assert.equal(loaded.requestedDocuments[1].status, 'pending');

  console.log('  ✅ Test 5 Passed: Opening Meeting Save & Load Roundtrip with Document Requests');
}

// -------------------------------------------------------------
// Test 6: Closing Meeting Save & Load Roundtrip with Custom Agreed Actions
// -------------------------------------------------------------
{
  const plan = { id: 'ENG-FIN-01', projectName: 'ตรวจการเงิน', department: 'กองคลัง' };
  const { saveClosingMeeting, loadClosingMeeting } = await import('../src/utils/meetingSyncUtils.js');

  const closingData = {
    planId: plan.id,
    year: '2569',
    meetingDate: '2026-10-20',
    meetingTime: '14:00 น.',
    meetingLocation: 'ห้องประชุมกองคลัง',
    findings: [
      {
        id: 'FIND-01',
        topic: 'งบกระทบยอดเงินฝากล่าช้า',
        condition: 'ค้างจัดทำ 2 เดือน',
        criteria: 'ระเบียบ มท. 2566',
        auditeeFeedback: 'เจ้าหน้าที่เพิ่งรับตำแหน่งใหม่',
        agreement: 'จะจัดทำให้เสร็จภายใน 15 วัน',
        status: 'เห็นชอบร่วมกัน'
      }
    ],
    conclusion: 'หน่วยรับตรวจรับทราบข้อสังเกตและยินดีแก้ไข',
    nextSteps: 'จัดส่งรายงานผลสมบูรณ์ให้นายกฯ สั่งการ'
  };

  saveClosingMeeting('2569', plan.id, closingData);

  const loaded = loadClosingMeeting('2569', plan);
  assert.equal(loaded.planId, 'ENG-FIN-01');
  assert.equal(loaded.findings.length, 1);
  assert.equal(loaded.findings[0].agreement, 'จะจัดทำให้เสร็จภายใน 15 วัน');
  assert.equal(loaded.conclusion, 'หน่วยรับตรวจรับทราบข้อสังเกตและยินดีแก้ไข');

  console.log('  ✅ Test 6 Passed: Closing Meeting Save & Load Roundtrip with Custom Agreed Actions');
}

// -------------------------------------------------------------
// Test 7: Multi-Engagement Isolation (No Cross-Plan Pollution)
// -------------------------------------------------------------
{
  const { loadOpeningMeeting, saveOpeningMeeting } = await import('../src/utils/meetingSyncUtils.js');

  const planA = { id: 'PLAN-A', projectName: 'งาน A', department: 'สำนักปลัด' };
  const planB = { id: 'PLAN-B', projectName: 'งาน B', department: 'กองช่าง' };

  saveOpeningMeeting('2569', planA.id, {
    planId: planA.id,
    meetingLocation: 'ห้องประชุมสำนักปลัด'
  });

  saveOpeningMeeting('2569', planB.id, {
    planId: planB.id,
    meetingLocation: 'ห้องประชุมกองช่าง'
  });

  const loadedA = loadOpeningMeeting('2569', planA);
  const loadedB = loadOpeningMeeting('2569', planB);

  assert.equal(loadedA.meetingLocation, 'ห้องประชุมสำนักปลัด');
  assert.equal(loadedB.meetingLocation, 'ห้องประชุมกองช่าง');
  assert.notEqual(loadedA.meetingLocation, loadedB.meetingLocation, 'Plans must not cross-contaminate');

  // Check different year for same plan
  const loadedNextYear = loadOpeningMeeting('2570', planA);
  assert.notEqual(loadedNextYear.meetingLocation, 'ห้องประชุมสำนักปลัด', 'Different year must have its own isolated record');

  console.log('  ✅ Test 7 Passed: Multi-Engagement & Multi-Year Isolation');
}

console.log('\n🎉 ALL OPENING & CLOSING MEETING PERSISTENCE TESTS PASSED!\n');

