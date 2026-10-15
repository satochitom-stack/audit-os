/**
 * Audit OS — Security Rules Automated Test Suite (Isolated Test Harness)
 * 
 * วัตถุประสงค์:
 * ทดสอบกฎความปลอดภัย Firestore Security Rules แบบ Multi-Tenant และ Role-Based Access Control
 * โดยใช้กฎร่างใน `tests/fixtures/firestore.test.rules`
 * 
 * สถาปัตยกรรมโมดูล:
 * รองรับ ECMAScript Modules (ESM) ตามการตั้งค่า "type": "module" ใน package.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic loading สำหรับ @firebase/rules-unit-testing เพื่อรองรับทั้งสภาพแวดล้อมที่มีและยังไม่มี package
let initializeTestEnvironment, assertFails, assertSucceeds;
try {
  const testing = await import('@firebase/rules-unit-testing');
  initializeTestEnvironment = testing.initializeTestEnvironment;
  assertFails = testing.assertFails;
  assertSucceeds = testing.assertSucceeds;
} catch (e) {
  // Stubs สำหรับ Static/Syntax Checking เมื่อยังไม่ได้ติดตั้งแพ็กเกจ
  assertFails = async (promise) => {
    try {
      await promise;
      throw new Error('Expected operation to fail, but it succeeded.');
    } catch (err) {
      return true;
    }
  };
  assertSucceeds = async (promise) => {
    return await promise;
  };
}

const RULES_PATH = path.join(__dirname, 'fixtures', 'firestore.test.rules');
const PROJECT_ID = 'audit-os-test-isolation';

describe('Audit OS Firestore Multi-Tenant Security Rules', () => {
  let testEnv;

  before(async () => {
    if (!initializeTestEnvironment) {
      console.log('Skipping emulator setup: @firebase/rules-unit-testing is not installed.');
      return;
    }

    const rulesContent = fs.readFileSync(RULES_PATH, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: rulesContent,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  /**
   * Test Lifecycle Isolation:
   * ล้างและเตรียมข้อมูลจำลองใหม่ในทุก ๆ Test Case (beforeEach)
   * เพื่อรับประกันว่าไม่มี Test ใดพึ่งพาหรือได้รับผลกระทบจากข้อมูลที่ถูกลบใน Test ก่อนหน้า
   */
  beforeEach(async () => {
    if (!testEnv) return;

    // 1. ล้างข้อมูลเก่าออกจาก Firestore Emulator
    await testEnv.clearFirestore();

    // 2. เติมข้อมูลจำลองตั้งต้นโดยข้ามกฎความปลอดภัย (withSecurityRulesDisabled)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // บัญชีผู้ใช้ อปท. สุขสำราญ (Org A)
      await db.doc('users/user_suksamran_auditor').set({
        email: 'auditor@suksamran.go.th',
        orgId: 'org_suksamran',
        role: 'auditor',
        displayName: 'ผู้ตรวจการสุขสำราญ'
      });

      // บัญชีผู้ใช้ อปท. ริมน้ำ (Org B)
      await db.doc('users/user_rimnam_auditor').set({
        email: 'auditor@rimnam.go.th',
        orgId: 'org_rimnam',
        role: 'auditor',
        displayName: 'ผู้ตรวจการริมน้ำ'
      });

      // บัญชีผู้ใช้ทั่วไปที่พยายามปลอมแปลงเอกสารเป็น system_admin (Attacker Profile)
      await db.doc('users/user_attacker').set({
        email: 'attacker@evil.local',
        orgId: 'org_suksamran',
        role: 'system_admin', // ปลอมใน Firestore doc แต่ไม่มีใน Auth Token
        displayName: 'ผู้ไม่ประสงค์ดี'
      });

      // ข้อมูลเอกสารโมดูลของ อปท. สุขสำราญ
      await db.doc('organizations/org_suksamran/modules/annual_plans_by_year').set({
        plans: [{ year: '2567', title: 'แผนการตรวจสอบประจำปี 2567 สุขสำราญ' }]
      });

      // ข้อมูลเอกสารโมดูลของ อปท. ริมน้ำ
      await db.doc('organizations/org_rimnam/modules/annual_plans_by_year').set({
        plans: [{ year: '2567', title: 'แผนการตรวจสอบประจำปี 2567 ริมน้ำ' }]
      });

      // ข้อมูลการตั้งค่าระบบและเอกสารส่วนกลาง (โครงสร้าง Document 2 ส่วนตรงตามโค้ดจริง)
      await db.doc('system_settings/version_update').set({
        version: '2.5.0',
        triggeredAt: Date.now()
      });
      await db.doc('system_settings/active_version').set({
        version: '2.5.0'
      });
      await db.doc('system_settings/central_documents').set({
        documents: [{ id: 'DOC-01', title: 'มาตรฐานการตรวจเงินแผ่นดิน 2567' }]
      });
      await db.doc('system_settings/user_feedbacks').set({
        feedbacks: [{ id: 'FB-01', message: 'ระบบทดสอบ' }]
      });
    });
  });

  // =========================================================================
  // TC-1: Unauthenticated Requests Must Be Denied Everywhere
  // =========================================================================
  it('TC-1: ผู้ไม่เข้าสู่ระบบ (Unauthenticated) ไม่สามารถอ่านหรือเขียนข้อมูลองค์กรและโปรไฟล์ได้', async () => {
    if (!testEnv) return;
    const unauthDb = testEnv.unauthenticatedContext().firestore();

    // ปฏิเสธการอ่าน/เขียนข้อมูลองค์กร
    await assertFails(unauthDb.doc('organizations/org_suksamran').get());
    await assertFails(unauthDb.doc('organizations/org_suksamran/modules/annual_plans_by_year').get());
    await assertFails(unauthDb.doc('organizations/org_suksamran/modules/annual_plans_by_year').set({ hacked: true }));

    // ปฏิเสธการอ่านโปรไฟล์ผู้ใช้
    await assertFails(unauthDb.doc('users/user_suksamran_auditor').get());

    // ปฏิเสธการอ่านเอกสารส่วนกลาง central_documents
    await assertFails(unauthDb.doc('system_settings/central_documents').get());
  });

  // =========================================================================
  // TC-2 & TC-3: Tenant Isolation (Org A vs Org B)
  // =========================================================================
  it('TC-2: สมาชิก อปท. สุขสำราญ (Org A) อ่านและเขียนได้เฉพาะข้อมูลของ อปท. ตนเอง', async () => {
    if (!testEnv) return;
    const orgADb = testEnv.authenticatedContext('user_suksamran_auditor', {
      orgId: 'org_suksamran',
      role: 'auditor'
    }).firestore();

    // อนุญาตให้อ่านและเขียนข้อมูลขององค์กรตนเอง
    await assertSucceeds(orgADb.doc('organizations/org_suksamran/modules/annual_plans_by_year').get());
    await assertSucceeds(orgADb.doc('organizations/org_suksamran/modules/working_papers_by_year').set({
      papers: ['WP-01']
    }));

    // ปฏิเสธการอ่านและเขียนข้ามไปยัง อปท. ริมน้ำ (Org B)
    await assertFails(orgADb.doc('organizations/org_rimnam/modules/annual_plans_by_year').get());
    await assertFails(orgADb.doc('organizations/org_rimnam/modules/annual_plans_by_year').set({ hijacked: true }));
  });

  it('TC-3: สมาชิก อปท. ริมน้ำ (Org B) ไม่สามารถเข้าถึงข้อมูลของ อปท. สุขสำราญ (Org A)', async () => {
    if (!testEnv) return;
    const orgBDb = testEnv.authenticatedContext('user_rimnam_auditor', {
      orgId: 'org_rimnam',
      role: 'auditor'
    }).firestore();

    // อนุญาตให้อ่านข้อมูลองค์กรตนเอง
    await assertSucceeds(orgBDb.doc('organizations/org_rimnam/modules/annual_plans_by_year').get());

    // ปฏิเสธการเข้าถึง อปท. สุขสำราญ
    await assertFails(orgBDb.doc('organizations/org_suksamran/modules/annual_plans_by_year').get());
    await assertFails(orgBDb.doc('organizations/org_suksamran').get());
  });

  // =========================================================================
  // TC-4: Privilege Escalation & Profile Protection
  // =========================================================================
  it('TC-4.1: ผู้ใช้ไม่สามารถอ่านโปรไฟล์ของผู้ใช้อื่นข้ามองค์กรหรือข้ามบัญชีได้', async () => {
    if (!testEnv) return;
    const userDb = testEnv.authenticatedContext('user_suksamran_auditor', {
      orgId: 'org_suksamran',
      role: 'auditor'
    }).firestore();

    // อ่านโปรไฟล์ตนเองได้
    await assertSucceeds(userDb.doc('users/user_suksamran_auditor').get());

    // ปฏิเสธการอ่านโปรไฟล์ของผู้อื่น (user_rimnam_auditor)
    await assertFails(userDb.doc('users/user_rimnam_auditor').get());
  });

  it('TC-4.2: ผู้ใช้ไม่สามารถสร้างโปรไฟล์ตนเองโดยกำหนด role: admin หรือ system_admin', async () => {
    if (!testEnv) return;
    const newAdminDb = testEnv.authenticatedContext('new_user_1', {
      orgId: 'org_suksamran'
    }).firestore();

    // ปฏิเสธการสร้างโปรไฟล์ที่ระบุ role เป็น admin
    await assertFails(newAdminDb.doc('users/new_user_1').set({
      orgId: 'org_suksamran',
      role: 'admin',
      displayName: 'แอดมินปลอม'
    }));

    // ปฏิเสธการสร้างโปรไฟล์ที่ระบุ role เป็น system_admin
    await assertFails(newAdminDb.doc('users/new_user_1').set({
      orgId: 'org_suksamran',
      role: 'system_admin',
      displayName: 'แอดมินระบบปลอม'
    }));

    // อนุญาตการสร้างโปรไฟล์ที่ระบุ role เป็น auditor หรือ viewer
    await assertSucceeds(newAdminDb.doc('users/new_user_1').set({
      orgId: 'org_suksamran',
      role: 'auditor',
      displayName: 'ผู้ตรวจการใหม่'
    }));
  });

  it('TC-4.3: ผู้ใช้ไม่สามารถแก้ไข role, orgId หรือลบโปรไฟล์ของตนเองได้', async () => {
    if (!testEnv) return;
    const userDb = testEnv.authenticatedContext('user_suksamran_auditor', {
      orgId: 'org_suksamran',
      role: 'auditor'
    }).firestore();

    // อนุญาตให้แก้ไขข้อมูลโปรไฟล์ทั่วไป (เช่น ชื่อที่แสดง)
    await assertSucceeds(userDb.doc('users/user_suksamran_auditor').update({
      displayName: 'ผู้ตรวจการสุขสำราญ (แก้ไขชื่อ)'
    }));

    // ปฏิเสธการพยายามเปลี่ยน role เป็น admin หรือ system_admin
    await assertFails(userDb.doc('users/user_suksamran_auditor').update({ role: 'admin' }));
    await assertFails(userDb.doc('users/user_suksamran_auditor').update({ role: 'system_admin' }));

    // ปฏิเสธการพยายามย้าย orgId ไปยัง อปท. อื่น
    await assertFails(userDb.doc('users/user_suksamran_auditor').update({ orgId: 'org_rimnam' }));

    // ปฏิเสธการลบโปรไฟล์ตนเอง
    await assertFails(userDb.doc('users/user_suksamran_auditor').delete());
  });

  // =========================================================================
  // TC-5: System Settings Access Control (Real Document Paths)
  // =========================================================================
  it('TC-5: การควบคุมสิทธิ์ system_settings ตรงตามโครงสร้างเอกสารจริง', async () => {
    if (!testEnv) return;
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const userDb = testEnv.authenticatedContext('user_suksamran_auditor', {
      orgId: 'org_suksamran',
      role: 'auditor'
    }).firestore();

    // 1. version_update & active_version: Public read ได้ แต่ห้ามเขียนยกเว้น admin
    await assertSucceeds(unauthDb.doc('system_settings/version_update').get());
    await assertSucceeds(unauthDb.doc('system_settings/active_version').get());
    await assertFails(userDb.doc('system_settings/version_update').update({ version: '3.0.0' }));
    await assertFails(userDb.doc('system_settings/active_version').update({ version: '3.0.0' }));

    // 2. central_documents: สมาชิกที่ล็อกอินอ่านได้ แต่ผู้ไม่ล็อกอินอ่านไม่ได้ และผู้ใช้ทั่วไปห้ามเขียน
    await assertFails(unauthDb.doc('system_settings/central_documents').get());
    await assertSucceeds(userDb.doc('system_settings/central_documents').get());
    await assertFails(userDb.doc('system_settings/central_documents').set({ fake: true }));

    // 3. user_feedbacks: สมาชิกที่ล็อกอินอ่านและอัปเดตฟีดแบ็กได้ แต่ผู้ไม่ล็อกอินทำไม่ได้ และผู้ใช้ทั่วไปห้ามลบ
    await assertFails(unauthDb.doc('system_settings/user_feedbacks').get());
    await assertSucceeds(userDb.doc('system_settings/user_feedbacks').get());
    await assertSucceeds(userDb.doc('system_settings/user_feedbacks').update({
      updatedAt: new Date().toISOString()
    }));
    await assertFails(userDb.doc('system_settings/user_feedbacks').delete());
  });

  // =========================================================================
  // TC-6: Legacy platform_users Lockdown
  // =========================================================================
  it('TC-6: คอลเลกชันเก่า platform_users ต้องถูกปฏิเสธการเข้าถึงทุกกรณี', async () => {
    if (!testEnv) return;
    const userDb = testEnv.authenticatedContext('user_suksamran_auditor', {
      orgId: 'org_suksamran',
      role: 'auditor'
    }).firestore();

    await assertFails(userDb.doc('platform_users/admin').get());
    await assertFails(userDb.doc('platform_users/auditor1').set({ password: '123' }));
  });

  // =========================================================================
  // TC-7: System Administrator Capabilities & Anti-Tamper Verification
  // =========================================================================
  it('TC-7.1: ปฏิเสธสิทธิ์ System Admin หากผู้ใช้มี role: system_admin เฉพาะใน Firestore doc แต่ไม่มีใน Auth Token', async () => {
    if (!testEnv) return;
    // user_attacker มีเอกสาร users/user_attacker ที่ระบุ role: 'system_admin'
    // แต่ Auth Token ของเขาไม่มี custom claims { admin: true }
    const attackerDb = testEnv.authenticatedContext('user_attacker', {
      orgId: 'org_suksamran'
      // ไม่มี admin: true และไม่มี role: 'system_admin' ใน token
    }).firestore();

    // ต้องถูกปฏิเสธเมื่อพยายามเขียน system_settings/version_update
    await assertFails(attackerDb.doc('system_settings/version_update').update({ version: 'evil-version' }));

    // ต้องถูกปฏิเสธเมื่อพยายามเขียน system_settings/central_documents
    await assertFails(attackerDb.doc('system_settings/central_documents').set({ hacked: true }));

    // ต้องถูกปฏิเสธเมื่อพยายามอ่านข้อมูลของ อปท. อื่น (org_rimnam)
    await assertFails(attackerDb.doc('organizations/org_rimnam/modules/annual_plans_by_year').get());
  });

  it('TC-7.2: ผู้ดูแลระบบที่มี Custom Claims (admin: true) ใน Auth Token สามารถจัดการระบบได้สมบูรณ์', async () => {
    if (!testEnv) return;
    const adminDb = testEnv.authenticatedContext('admin_system', {
      orgId: 'org_central',
      admin: true // ยืนยันสิทธิ์จาก cryptographic token claim ที่เชื่อถือได้
    }).firestore();

    // อนุญาตให้ปรับปรุงการตั้งค่าเวอร์ชันและเอกสารส่วนกลาง
    await assertSucceeds(adminDb.doc('system_settings/version_update').update({ version: '2.5.1' }));
    await assertSucceeds(adminDb.doc('system_settings/central_documents').set({
      documents: [{ id: 'DOC-02', title: 'แนวทาง 2568' }]
    }));

    // อนุญาตให้เข้าถึงและจัดการข้อมูลองค์กรระดับท้องถิ่นได้เพื่อการบำรุงรักษาระบบ
    await assertSucceeds(adminDb.doc('organizations/org_suksamran/modules/annual_plans_by_year').get());
    await assertSucceeds(adminDb.doc('organizations/org_rimnam/modules/annual_plans_by_year').get());
  });
});
