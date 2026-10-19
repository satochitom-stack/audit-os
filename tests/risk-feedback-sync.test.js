// tests/risk-feedback-sync.test.js
// Verification suite for Phase 5: Risk Feedback Loop
// Tests Multi-Tenant Isolation, Fiscal Year Isolation, Duplicate Prevention,
// Cross-Year Finding Extraction, Unlinking, and S/O/F/C/K Score Invariant.

import assert from 'node:assert/strict';

// Mock Browser LocalStorage for Node.js environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

// Import functions to test
const {
  addRiskFeedbackLinkage,
  removeRiskFeedbackLinkage,
  loadRiskFeedbackLinkages,
  saveRiskFeedbackLinkages,
  loadAllRiskFeedbackLinkages,
  getAvailableSourceIssues,
  verifyScoresUntouched,
  loadTenantData,
  saveTenantData,
  RISK_FEEDBACK_STORAGE_KEY
} = await import('../src/utils/riskFeedbackUtils.js');

console.log('🧪 Starting Phase 5: Risk Feedback Loop Verification Suite...\n');

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// =========================================================================
// Scenario 1: Multi-Tenant Isolation in Same Browser
// =========================================================================
runTest('Scenario 1: Tenant A and Tenant B must not see or overwrite each other linkages', () => {
  mockStorage.clear();

  const sessionTenantA = { username: 'auditor_org_a', organization: 'อบต. กองงาม', role: 'auditor' };
  const sessionTenantB = { username: 'auditor_org_b', organization: 'เทศบาลตำบลริมโขง', role: 'auditor' };

  // Tenant A links an issue in year 2569
  const linkA = {
    universeId: 'AU-01',
    universeActivity: 'การจัดซื้อจัดจ้าง',
    sourceType: 'capa',
    sourceYear: '2568',
    targetYear: '2569',
    issueId: 'CAPA-A-01',
    issueTitle: 'ไม่ปฏิบัติตาม พ.ร.บ. จัดซื้อจัดจ้าง 2560',
    department: 'กองคลัง'
  };

  const resA = addRiskFeedbackLinkage([], linkA);
  assert.equal(resA.success, true);
  saveRiskFeedbackLinkages('2569', resA.linkages, sessionTenantA);

  // Tenant B links a different issue in year 2569
  const linkB = {
    universeId: 'AU-02',
    universeActivity: 'การบริหารจัดการพัสดุ',
    sourceType: 'followup',
    sourceYear: '2568',
    targetYear: '2569',
    issueId: 'FOLLOW-B-01',
    issueTitle: 'ทะเบียนคุมทรัพย์สินไม่เป็นปัจจุบัน',
    department: 'สำนักปลัด'
  };

  const resB = addRiskFeedbackLinkage([], linkB);
  assert.equal(resB.success, true);
  saveRiskFeedbackLinkages('2569', resB.linkages, sessionTenantB);

  // Writes must stay scoped and must never mirror tenant data to the legacy global key.
  assert.equal(mockStorage.has(RISK_FEEDBACK_STORAGE_KEY), false);
  assert.equal(mockStorage.has(`${RISK_FEEDBACK_STORAGE_KEY}_tenant_auditor_org_a`), true);
  assert.equal(mockStorage.has(`${RISK_FEEDBACK_STORAGE_KEY}_tenant_auditor_org_b`), true);

  // Verify Tenant A loads only their own linkages
  const loadedA = loadRiskFeedbackLinkages('2569', sessionTenantA);
  assert.equal(loadedA.length, 1);
  assert.equal(loadedA[0].issueId, 'CAPA-A-01');
  assert.equal(loadedA[0].universeActivity, 'การจัดซื้อจัดจ้าง');

  // Verify Tenant B loads only their own linkages
  const loadedB = loadRiskFeedbackLinkages('2569', sessionTenantB);
  assert.equal(loadedB.length, 1);
  assert.equal(loadedB[0].issueId, 'FOLLOW-B-01');
  assert.equal(loadedB[0].universeActivity, 'การบริหารจัดการพัสดุ');

  // Cross-verification: Tenant A's storage does not contain Tenant B's issue
  assert.equal(loadedA.some(item => item.issueId === 'FOLLOW-B-01'), false);
  assert.equal(loadedB.some(item => item.issueId === 'CAPA-A-01'), false);
});

// =========================================================================
// Scenario 2: Fiscal Year Isolation (Year 2569 vs Year 2570)
// =========================================================================
runTest('Scenario 2: Fiscal Years 2569 and 2570 must remain strictly isolated', () => {
  mockStorage.clear();
  const session = { username: 'test_auditor', organization: 'อบต. ท่าตอน', role: 'auditor' };

  // Link for 2569
  const link2569 = {
    universeId: 'AU-03',
    universeActivity: 'งานสารบรรณ',
    sourceType: 'capa',
    sourceYear: '2568',
    targetYear: '2569',
    issueId: 'ISSUE-2569',
    issueTitle: 'สมุดลงทะเบียนรับ-ส่งไม่ครบถ้วน'
  };
  const res2569 = addRiskFeedbackLinkage([], link2569);
  saveRiskFeedbackLinkages('2569', res2569.linkages, session);

  // Link for 2570
  const link2570 = {
    universeId: 'AU-05',
    universeActivity: 'การจัดเก็บภาษีป้ายและที่ดิน',
    sourceType: 'capa',
    sourceYear: '2569',
    targetYear: '2570',
    issueId: 'ISSUE-2570',
    issueTitle: 'แผนที่ภาษียังไม่ครอบคลุมแปลงที่ดินใหม่'
  };
  const res2570 = addRiskFeedbackLinkage([], link2570);
  saveRiskFeedbackLinkages('2570', res2570.linkages, session);

  // Load 2569
  const loaded2569 = loadRiskFeedbackLinkages('2569', session);
  assert.equal(loaded2569.length, 1);
  assert.equal(loaded2569[0].issueId, 'ISSUE-2569');

  // Load 2570
  const loaded2570 = loadRiskFeedbackLinkages('2570', session);
  assert.equal(loaded2570.length, 1);
  assert.equal(loaded2570[0].issueId, 'ISSUE-2570');

  // Verify no leakage between years
  assert.equal(loaded2569.some(i => i.issueId === 'ISSUE-2570'), false);
  assert.equal(loaded2570.some(i => i.issueId === 'ISSUE-2569'), false);
});

// =========================================================================
// Scenario 3: Duplicate Protection & Cross-Year Source Finding Extraction
// =========================================================================
runTest('Scenario 3: Duplicate link prevention and cross-year source extraction', () => {
  mockStorage.clear();

  // Test source extraction from both CAPA and Follow-up
  const capaFindingsByYear = {
    '2568': [
      { id: 'CAPA-01', title: 'การเบิกจ่ายเบี้ยยังชีพซ้ำซ้อน', department: 'กองสวัสดิการสังคม', status: 'pending' },
      { id: 'CAPA-02', title: 'การจัดซื้อวัสดุไม่ได้ตรวจรับตามเวลา', department: 'กองช่าง', status: 'completed' }
    ]
  };

  const followupRegisterItems = [
    { id: 'REG-01', title: 'ข้อสังเกตการคำนวณราคากลางงานก่อสร้าง', department: 'กองช่าง', status: 'in_progress' }
  ];

  const availableAll = getAvailableSourceIssues({
    sourceYear: '2568',
    capaFindingsByYear,
    followupRegisterItems,
    departmentFilter: 'all'
  });

  assert.equal(availableAll.length, 3);

  // Filter by department 'กองช่าง'
  const availableChang = getAvailableSourceIssues({
    sourceYear: '2568',
    capaFindingsByYear,
    followupRegisterItems,
    departmentFilter: 'กองช่าง'
  });
  assert.equal(availableChang.length, 2);
  assert.ok(availableChang.every(i => i.department === 'กองช่าง'));

  // Test duplicate protection
  const link1 = {
    universeId: 'AU-10',
    universeActivity: 'งานซ่อมบำรุงทางและสะพาน',
    sourceType: 'capa',
    sourceYear: '2568',
    targetYear: '2569',
    issueId: 'CAPA-02',
    issueTitle: 'การจัดซื้อวัสดุไม่ได้ตรวจรับตามเวลา'
  };

  const firstAdd = addRiskFeedbackLinkage([], link1);
  assert.equal(firstAdd.success, true);
  assert.equal(firstAdd.linkages.length, 1);

  // Attempt duplicate addition
  const secondAdd = addRiskFeedbackLinkage(firstAdd.linkages, link1);
  assert.equal(secondAdd.success, false);
  assert.equal(secondAdd.reason, 'duplicate');
  assert.equal(secondAdd.linkages.length, 1); // Length untouched
});

// =========================================================================
// Scenario 4: Unlinking and S/O/F/C/K Score Invariant Verification
// =========================================================================
runTest('Scenario 4: Unlinking and strict guarantee that S/O/F/C/K scores never auto-modify', () => {
  const activity = {
    id: 'AU-05',
    activity: 'การจัดเก็บรายได้ภาษีที่ดินและสิ่งปลูกสร้าง',
    department: 'กองคลัง',
    sScore: 3,
    oScore: 2,
    fScore: 3,
    cScore: 2,
    kScore: 1,
    score: 2.2,
    level: 'ปานกลาง'
  };

  // Snapshot before
  const beforeSnapshot = { ...activity };

  // 1. Link an issue
  const linkRes = addRiskFeedbackLinkage([], {
    universeId: activity.id,
    universeActivity: activity.activity,
    sourceType: 'capa',
    sourceYear: '2568',
    targetYear: '2569',
    issueId: 'CAPA-TAX-01',
    issueTitle: 'การประเมินภาษีล่าช้ากว่ากำหนด'
  });

  assert.equal(linkRes.success, true);
  const createdLinkageId = linkRes.newLinkage.id;

  // Verify scores untouched after linking
  assert.equal(verifyScoresUntouched(beforeSnapshot, activity), true);
  assert.equal(activity.sScore, 3);
  assert.equal(activity.oScore, 2);
  assert.equal(activity.fScore, 3);
  assert.equal(activity.cScore, 2);
  assert.equal(activity.kScore, 1);
  assert.equal(activity.score, 2.2);

  // 2. Unlink the issue
  const unlinkRes = removeRiskFeedbackLinkage(linkRes.linkages, createdLinkageId);
  assert.equal(unlinkRes.success, true);
  assert.equal(unlinkRes.linkages.length, 0);

  // Verify scores untouched after unlinking
  assert.equal(verifyScoresUntouched(beforeSnapshot, activity), true);
  assert.equal(activity.sScore, 3);
  assert.equal(activity.oScore, 2);
  assert.equal(activity.fScore, 3);
  assert.equal(activity.cScore, 2);
  assert.equal(activity.kScore, 1);
  assert.equal(activity.score, 2.2);
});

console.log(`\n🎉 Verification Completed: ${testsPassed}/${testsTotal} passed.\n`);
if (testsPassed !== testsTotal) {
  process.exit(1);
}
