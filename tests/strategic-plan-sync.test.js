import assert from 'node:assert/strict';
import {
  normalizeStrategicItem,
  normalizeStrategicPlan,
  getRollForwardCandidates,
  rollForwardToAnnualPlans,
  loadUnifiedStrategicPlan,
  saveUnifiedStrategicPlan
} from '../src/utils/strategicPlanUtils.js';

console.log('🧪 Starting Strategic Plan to Annual Plan Integration Unit Tests...');

// -------------------------------------------------------------
// Test 1: Normalize Legacy y1/y2/y3 to Canonical Schema
// -------------------------------------------------------------
{
  const legacyItem = {
    id: 'ST-01',
    name: 'การรับเงินและการนำส่งเงิน (e-LAAS)',
    department: 'กองคลัง',
    riskLevel: 'สูง',
    y1: true,
    y2: true,
    y3: false,
    manDays: 20
  };

  const norm = normalizeStrategicItem(legacyItem, '2569');
  assert.equal(norm.id, 'ST-01');
  assert.equal(norm.name, 'การรับเงินและการนำส่งเงิน (e-LAAS)');
  assert.equal(norm.activity, norm.name);
  assert.equal(norm.y1, true);
  assert.equal(norm.y2, true);
  assert.equal(norm.y3, false);
  assert.equal(norm.years['2569'], true);
  assert.equal(norm.years['2570'], true);
  assert.equal(norm.years['2571'], false);

  console.log('  ✅ Test 1 Passed: Normalize Legacy y1/y2/y3 to Canonical Schema');
}

// -------------------------------------------------------------
// Test 2: Normalize Years Map Schema to Relative y1/y2/y3
// -------------------------------------------------------------
{
  const mapItem = {
    id: 'STRAT-05',
    department: 'สำนักปลัด',
    activity: 'การบริหารงานบุคคล',
    riskLevel: 'สูง',
    years: { '2568': true, '2569': false, '2570': true, '2571': false }
  };

  const norm2569 = normalizeStrategicItem(mapItem, '2569');
  assert.equal(norm2569.y1, false, 'In 2569, y1 should be false');
  assert.equal(norm2569.y2, true, 'In 2570, y2 should be true');
  assert.equal(norm2569.y3, false, 'In 2571, y3 should be false');

  const norm2570 = normalizeStrategicItem(mapItem, '2570');
  assert.equal(norm2570.y1, true, 'In 2570 base, y1 should be true');
  assert.equal(norm2570.y2, false, 'In 2571, y2 should be false');

  console.log('  ✅ Test 2 Passed: Normalize Years Map Schema to Relative y1/y2/y3');
}

// -------------------------------------------------------------
// Test 3: Candidate Extraction & Duplicate Detection
// -------------------------------------------------------------
{
  const strategicPlan = [
    {
      id: 'ST-01',
      name: 'การรับเงินและการนำส่งเงิน (e-LAAS)',
      department: 'กองคลัง',
      years: { '2569': true, '2570': false }
    },
    {
      id: 'ST-02',
      name: 'การจัดทำราคากลาง Factor F',
      department: 'กองช่าง',
      years: { '2569': true, '2570': true }
    },
    {
      id: 'ST-03',
      name: 'การใช้และรักษารถยนต์ส่วนกลาง',
      department: 'สำนักปลัด',
      years: { '2569': false, '2570': true }
    }
  ];

  const existingAnnualPlans = [
    {
      id: 'PLAN-01',
      projectName: 'การรับเงินและการนำส่งเงิน (e-LAAS)',
      department: 'กองคลัง'
    }
  ];

  const candidates2569 = getRollForwardCandidates(strategicPlan, '2569', existingAnnualPlans);
  assert.equal(candidates2569.length, 3);

  // ST-01 is scheduled in 2569, but already planned in existingAnnualPlans
  const c1 = candidates2569.find((c) => c.strategicId === 'ST-01');
  assert.equal(c1.isScheduled, true);
  assert.equal(c1.alreadyPlanned, true);
  assert.equal(c1.canRollForward, false);

  // ST-02 is scheduled and NOT planned yet
  const c2 = candidates2569.find((c) => c.strategicId === 'ST-02');
  assert.equal(c2.isScheduled, true);
  assert.equal(c2.alreadyPlanned, false);
  assert.equal(c2.canRollForward, true);

  // ST-03 is NOT scheduled in 2569
  const c3 = candidates2569.find((c) => c.strategicId === 'ST-03');
  assert.equal(c3.isScheduled, false);
  assert.equal(c3.canRollForward, false);

  console.log('  ✅ Test 3 Passed: Candidate Extraction & Duplicate Detection');
}

// -------------------------------------------------------------
// Test 4: Roll-Forward Execution Without Overwriting
// -------------------------------------------------------------
{
  const existingAnnualPlans = [
    {
      id: 'PLAN-EXISTING-01',
      projectName: 'งานตรวจสอบเดิม',
      department: 'กองสาธารณสุข'
    }
  ];

  const candidates = [
    {
      strategicId: 'ST-02',
      title: 'การจัดทำราคากลาง Factor F',
      department: 'กองช่าง',
      riskLevel: 'สูง',
      manDays: 30,
      alreadyPlanned: false
    },
    {
      strategicId: 'ST-01',
      title: 'งานที่ซ้ำเดิม',
      department: 'กองคลัง',
      alreadyPlanned: true // Already planned
    }
  ];

  const result = rollForwardToAnnualPlans(
    candidates,
    ['ST-02', 'ST-01'], // user selected both
    existingAnnualPlans,
    '2569',
    { auditorName: 'ผู้ตรวจสอบภายใน' }
  );

  assert.equal(result.addedCount, 1, 'Only non-duplicate candidate should be added');
  assert.equal(result.updatedAnnualPlans.length, 2, 'Should keep existing plan and append 1 new plan');
  assert.equal(result.updatedAnnualPlans[0].id, 'PLAN-EXISTING-01', 'Existing plan must be preserved untouched');
  assert.equal(result.updatedAnnualPlans[1].id, 'PLAN-2569-02');
  assert.equal(result.updatedAnnualPlans[1].projectName, 'การจัดทำราคากลาง Factor F');
  assert.equal(result.updatedAnnualPlans[1].source, 'strategic_rollforward');

  console.log('  ✅ Test 4 Passed: Roll-Forward Execution Without Overwriting');
}

// -------------------------------------------------------------
// Test 5: Storage Load & Save Compatibility Roundtrip
// -------------------------------------------------------------
{
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  const sampleItems = [
    { id: 'ST-01', name: 'ตรวจสอบ e-LAAS', department: 'กองคลัง', y1: true, y2: true, y3: false }
  ];

  saveUnifiedStrategicPlan(sampleItems, '2569');

  // Verify it saved to both keys for backward compatibility
  assert.ok(storage.has('ia_strategic_plan'));
  assert.ok(storage.has('ia_strategic_activities_v2'));

  const loaded = loadUnifiedStrategicPlan('2569');
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].name, 'ตรวจสอบ e-LAAS');
  assert.equal(loaded[0].years['2569'], true);

  console.log('  ✅ Test 5 Passed: Storage Load & Save Compatibility Roundtrip');
}

console.log('\n🎉 ALL STRATEGIC TO ANNUAL PLAN INTEGRATION TESTS PASSED!\n');
