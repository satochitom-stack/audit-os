import assert from 'node:assert/strict';
import {
  parseDateOnly,
  formatDateOnly,
  addDays,
  calculateDaysRemaining,
  reconcileFollowupRegister,
  syncFollowupStatusToCapa,
  createCapaFromFollowupItem,
  createFollowupHistoryEntry,
  loadFollowupRegister,
  saveFollowupRegister
} from '../src/utils/followupSyncUtils.js';

const followupStorage = new Map();
global.localStorage = {
  getItem: (key) => (followupStorage.has(key) ? followupStorage.get(key) : null),
  setItem: (key, value) => followupStorage.set(key, String(value)),
  removeItem: (key) => followupStorage.delete(key),
  clear: () => followupStorage.clear()
};

console.log('🧪 Starting CAPA & Follow-up Integration Unit Tests...');

// -------------------------------------------------------------
// Test 1: Date parsing, Buddhist vs Gregorian, and addition
// -------------------------------------------------------------
{
  const beParsed = parseDateOnly('2569-01-10');
  assert.equal(beParsed.isBuddhistYear, true);
  assert.equal(beParsed.date.getUTCFullYear(), 2026);

  const ceParsed = parseDateOnly('2026-01-10');
  assert.equal(beParsed.isBuddhistYear, true);
  assert.equal(ceParsed.date.getUTCFullYear(), 2026);

  // Buddhist addition preserves Buddhist era
  const beAdded = addDays('2569-01-10', 30);
  assert.equal(beAdded, '2569-02-09');

  // Gregorian addition preserves Gregorian era
  const ceAdded = addDays('2026-01-10', 30);
  assert.equal(ceAdded, '2026-02-09');

  // Invalid dates return null / input string
  assert.equal(parseDateOnly('2569-13-01'), null);
  assert.equal(parseDateOnly('2026-02-31'), null);
  assert.equal(addDays('invalid-date', 30), 'invalid-date');

  console.log('  ✅ Test 1 Passed: Date parsing, eras, and addition');
}

// -------------------------------------------------------------
// Test 2: Reconcile empty register with defaultItems fallback
// -------------------------------------------------------------
{
  const defaultItems = [
    { id: 'DEF-1', title: 'Default Finding', department: 'กองคลัง', status: 'in_progress' }
  ];
  const reconciled = reconcileFollowupRegister(null, [], { defaultItems });
  assert.equal(reconciled.length, 1);
  assert.equal(reconciled[0].id, 'DEF-1');
  console.log('  ✅ Test 2 Passed: Empty register falls back to defaultItems');
}

// -------------------------------------------------------------
// Test 3: Auto-populate CAPA findings into Follow-up Register with Stable IDs
// -------------------------------------------------------------
{
  const capaFindings = [
    {
      id: 'CAPA-OAG-69-01',
      source: 'oag',
      sourceName: 'สำนักงานการตรวจเงินแผ่นดิน (สตง.)',
      title: 'การจัดทำงบกระทบยอดเงินฝากธนาคารล่าช้า',
      department: 'กองคลัง',
      severity: 'high',
      receivedDate: '2569-01-10',
      condition: 'พบการจัดทำงบกระทบยอดค้าง 3 เดือน',
      criteria: 'ระเบียบ มท. ว่าด้วยการรับเงิน พ.ศ. 2547',
      cause: 'เจ้าหน้าที่ขาดความเข้าใจ',
      effect: 'เสี่ยงต่อข้อผิดพลาดทางบัญชี',
      correctiveAction: 'เร่งรัดจัดทำงบกระทบยอดทุกบัญชี',
      recommendation: 'ให้กองคลังเร่งรัดจัดทำงบกระทบยอดเงินฝากธนาคาร',
      status: 'in_progress'
    }
  ];

  const reconciled = reconcileFollowupRegister([], capaFindings, {
    auditorName: 'ทดสอบ ผู้ตรวจ',
    selectedYear: '2569'
  });

  assert.equal(reconciled.length, 1);
  const item = reconciled[0];
  assert.equal(item.id, 'CAPA-OAG-69-01');
  assert.equal(item.findingId, 'CAPA-OAG-69-01');
  assert.equal(item.source, 'oag');
  assert.equal(item.department, 'กองคลัง');
  assert.equal(item.regime, 'agency_defined');
  assert.equal(item.deadlineDays, 30);
  assert.equal(item.deadlineDate, '2569-02-09');
  assert.equal(item.status, 'in_progress');
  assert.equal(item.condition, 'พบการจัดทำงบกระทบยอดค้าง 3 เดือน');
  assert.equal(item.history.length, 1);
  assert.equal(item.history[0].action, 'linked_from_capa');

  console.log('  ✅ Test 3 Passed: Auto-populate CAPA findings into Follow-up Register');
}

// -------------------------------------------------------------
// Test 4: Duplicate Prevention & Idempotency
// -------------------------------------------------------------
{
  const capaFindings = [
    {
      id: 'CAPA-OAG-69-01',
      title: 'การจัดทำงบกระทบยอดเงินฝากธนาคารล่าช้า',
      department: 'กองคลัง',
      status: 'in_progress'
    }
  ];

  // First run
  const run1 = reconcileFollowupRegister([], capaFindings);
  assert.equal(run1.length, 1);

  // User customized deadline in follow-up register
  run1[0].deadlineDays = 45;
  run1[0].deadlineBasis = 'มติที่ประชุมสภา อปท.';
  run1[0].deadlineDate = '2569-02-24';
  run1[0].progressNotes = 'บันทึกความคืบหน้าระหว่างตรวจ';

  // Second run with existing register and same CAPA
  const run2 = reconcileFollowupRegister(run1, capaFindings);
  assert.equal(run2.length, 1, 'Must not duplicate item');
  assert.equal(run2[0].deadlineDays, 45, 'Must preserve customized deadlineDays');
  assert.equal(run2[0].deadlineBasis, 'มติที่ประชุมสภา อปท.', 'Must preserve customized deadlineBasis');
  assert.equal(run2[0].progressNotes, 'บันทึกความคืบหน้าระหว่างตรวจ', 'Must preserve progress notes');

  // Third run
  const run3 = reconcileFollowupRegister(run2, capaFindings);
  assert.equal(run3.length, 1, 'Must remain exactly 1 item across multiple runs');

  console.log('  ✅ Test 4 Passed: Duplicate Prevention and Idempotency');
}

// -------------------------------------------------------------
// Test 5: Legacy Compatibility (Preserves existing legacy items)
// -------------------------------------------------------------
{
  const legacyRegister = [
    {
      id: 'CAPA-FOLLOW-LEGACY-01',
      title: 'ข้อค้นพบเดิมในระบบที่ไม่มีใน CAPA',
      department: 'กองช่าง',
      status: 'overdue',
      deadlineDate: '2568-12-31'
    }
  ];

  const capaFindings = [
    {
      id: 'CAPA-NEW-01',
      title: 'ข้อค้นพบใหม่จาก CAPA',
      department: 'สำนักปลัด',
      status: 'in_progress'
    }
  ];

  const reconciled = reconcileFollowupRegister(legacyRegister, capaFindings);
  assert.equal(reconciled.length, 2, 'Must contain both legacy item and new CAPA item');
  assert.ok(reconciled.some((i) => i.id === 'CAPA-FOLLOW-LEGACY-01'), 'Legacy item must be retained');
  assert.ok(reconciled.some((i) => i.id === 'CAPA-NEW-01'), 'New CAPA item must be added');

  console.log('  ✅ Test 5 Passed: Legacy Compatibility');
}

// -------------------------------------------------------------
// Test 6: Two-way Status Sync (Follow-up -> CAPA)
// -------------------------------------------------------------
{
  const capaFindings = [
    {
      id: 'CAPA-OAG-69-01',
      title: 'การจัดทำงบกระทบยอดเงินฝากธนาคารล่าช้า',
      status: 'in_progress',
      verifiedDate: ''
    }
  ];

  // When auditor completes follow-up, sync to CAPA
  const synced = syncFollowupStatusToCapa(capaFindings, 'CAPA-OAG-69-01', 'completed', {
    note: 'ตรวจสอบพยานหลักฐานและใบเสร็จแล้วเสร็จ',
    date: '2569-03-01'
  });

  assert.equal(synced[0].status, 'verified_closed');
  assert.equal(synced[0].verifiedDate, '2569-03-01');
  assert.ok(synced[0].progressNotes.includes('ตรวจสอบพยานหลักฐาน'));

  // When auditor changes back to in_progress
  const reopened = syncFollowupStatusToCapa(synced, 'CAPA-OAG-69-01', 'in_progress');
  assert.equal(reopened[0].status, 'in_progress');
  assert.equal(reopened[0].verifiedDate, '');

  console.log('  ✅ Test 6 Passed: Two-way Status Sync');
}

// -------------------------------------------------------------
// Test 7: Converting Follow-up item to CAPA model
// -------------------------------------------------------------
{
  const followItem = {
    id: 'CAPA-FOLLOW-8888',
    title: 'การจัดทำผังเมืองรวมขาดการมีส่วนร่วม',
    department: 'กองช่าง',
    orderDate: '2569-02-15',
    deadlineDays: 45,
    recommendation: 'จัดประชุมรับฟังความคิดเห็นประชาชน',
    status: 'in_progress'
  };

  const capaModel = createCapaFromFollowupItem(followItem, '2569');
  assert.equal(capaModel.id, 'CAPA-FOLLOW-8888');
  assert.equal(capaModel.department, 'กองช่าง');
  assert.equal(capaModel.title, 'การจัดทำผังเมืองรวมขาดการมีส่วนร่วม');
  assert.equal(capaModel.status, 'in_progress');
  assert.equal(capaModel.recommendation, 'จัดประชุมรับฟังความคิดเห็นประชาชน');

  console.log('  ✅ Test 7 Passed: Convert Follow-up item to CAPA model');
}

// -------------------------------------------------------------
// Test 8: Follow-up register persistence is tenant-scoped
// -------------------------------------------------------------
{
  followupStorage.clear();
  const tenantA = { username: 'auditor_a', role: 'auditor' };
  const tenantB = { username: 'auditor_b', role: 'auditor' };
  saveFollowupRegister('2569', [{ id: 'A-1', title: 'Finding A' }], tenantA);
  saveFollowupRegister('2569', [{ id: 'B-1', title: 'Finding B' }], tenantB);

  assert.equal(loadFollowupRegister('2569', [], tenantA)[0].id, 'A-1');
  assert.equal(loadFollowupRegister('2569', [], tenantB)[0].id, 'B-1');
  assert.equal(followupStorage.has('ia_followup_register_2569'), false);
  console.log('  ✅ Test 8 Passed: Follow-up Tenant Isolation');
}

console.log('\n🎉 ALL CAPA & FOLLOW-UP INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
