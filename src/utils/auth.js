// ระบบยืนยันตัวตนและการจัดการสิทธิ์ผู้ใช้งานหลายระดับ (Multi-User Role-Based Access Control - RBAC)
// รองรับบัญชี ADMIN (หน่วยตรวจสอบภายใน) และ USER (รายกอง/สำนัก)
// จัดเก็บใน LocalStorage ปลอดภัย และพร้อมสำหรับการเชื่อมต่อ Cloud Database ต่อไป

import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';

const USERS_KEY = 'ia_auth_users';
const SESSION_KEY = 'ia_auth_session';
const OLD_ACCOUNT_KEY = 'ia_auth_account';
export const LAST_USERNAME_KEY = 'ia_last_username';
export const PENDING_USERS_KEY = 'ia_pending_users';

export const ENTERPRISE_ROLES = [
  { id: 'admin', label: 'ผู้ตรวจสอบภายใน (Super Admin)', desc: 'จัดการระบบ, กำหนดสิทธิ์, ตรวจสอบและเข้าถึงทุกโมดูล' },
  { id: 'executive', label: 'ผู้บริหาร (Executive - นายก/ปลัด)', desc: 'ดูข้อมูลภาพรวมทุกกอง, ให้ข้อสั่งการ และรับทราบรายงาน' },
  { id: 'dept_head', label: 'หัวหน้าสำนัก / ผู้อำนวยการกอง (Dept Head)', desc: 'บริหารจัดการข้อมูลภายในกองตนเอง และส่งรายงานการควบคุม' },
  { id: 'staff', label: 'เจ้าหน้าที่ผู้ปฏิบัติงาน (Staff)', desc: 'บันทึกข้อมูลและแบบประเมินความเสี่ยงประจำวัน' },
  { id: 'guest', label: 'ผู้เยี่ยมชมทั่วไป (Guest / Public)', desc: 'เข้าชมแดชบอร์ดสรุปและข้อมูลทั่วไปตามที่ผู้ดูแลระบบอนุญาต' }
];

export function getLastUsername() {
  try {
    const saved = localStorage.getItem(LAST_USERNAME_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    console.error(e);
  }
  return 'admin';
}

export function setLastUsername(username) {
  try {
    if (username) {
      localStorage.setItem(LAST_USERNAME_KEY, username.trim().toLowerCase());
    }
  } catch (e) {
    console.error(e);
  }
}

export const DEFAULT_DEPARTMENTS = [
  'หน่วยตรวจสอบภายใน',
  'สำนักปลัด',
  'กองคลัง',
  'กองช่าง',
  'กองการศึกษา',
  'กองสวัสดิการสังคม',
  'ศพด.วัดเจริญทัศน์',
  'ศพด.บ้านฝางเทิง'
];

const DEPARTMENTS_KEY = 'ia_departments';

export function getDepartments() {
  try {
    const raw = localStorage.getItem(DEPARTMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Clean out legacy/subdivision entries that are not standalone main departments
        const obsolete = [
          'กองสาธารณสุขและสิ่งแวดล้อม',
          'งานสาธารณสุขและสิ่งแวดล้อม',
          'งานสาธารณสุข'
        ];
        let cleaned = parsed.filter((d) => !obsolete.includes(d));
        DEFAULT_DEPARTMENTS.forEach((dept) => {
          if (!cleaned.includes(dept)) {
            cleaned.push(dept);
          }
        });

        // Enforce official hierarchy: สำนักปลัด -> กองคลัง -> กองช่าง -> กองการศึกษา -> กองสวัสดิการสังคม
        cleaned.sort((a, b) => {
          const idxA = DEFAULT_DEPARTMENTS.indexOf(a);
          const idxB = DEFAULT_DEPARTMENTS.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b, 'th');
        });

        saveDepartments(cleaned);
        return cleaned;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [...DEFAULT_DEPARTMENTS];
}

export function saveDepartments(departments) {
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
  try {
    window.dispatchEvent(new Event('ia-departments-changed'));
  } catch (e) {
    console.error(e);
  }
}

export function addDepartment(name) {
  const clean = name.trim();
  if (!clean) throw new Error('กรุณาระบุชื่อสำนัก/กอง');
  const depts = getDepartments();
  if (depts.some((d) => d.toLowerCase() === clean.toLowerCase())) {
    throw new Error(`สำนัก/กอง "${clean}" มีอยู่ในระบบแล้ว`);
  }
  depts.push(clean);
  saveDepartments(depts);
  return depts;
}

export function cascadeDepartmentRenameToStorage(oldName, cleanNew) {
  if (!oldName || !cleanNew || oldName.trim() === cleanNew.trim()) return;
  const from = oldName.trim();
  const to = cleanNew.trim();

  // 1. ia_audit_universe_by_year
  try {
    const raw = localStorage.getItem('ia_audit_universe_by_year');
    if (raw) {
      const data = JSON.parse(raw);
      let changed = false;
      Object.keys(data).forEach((year) => {
        if (Array.isArray(data[year])) {
          data[year].forEach((act) => {
            if (act.department === from) {
              act.department = to;
              changed = true;
            }
          });
        }
      });
      if (changed) {
        localStorage.setItem('ia_audit_universe_by_year', JSON.stringify(data));
      }
    }
  } catch (e) {
    console.error('Cascade error (audit universe):', e);
  }

  // 2. ia_annual_plans_by_year
  try {
    const raw = localStorage.getItem('ia_annual_plans_by_year');
    if (raw) {
      const data = JSON.parse(raw);
      let changed = false;
      Object.keys(data).forEach((year) => {
        if (Array.isArray(data[year])) {
          data[year].forEach((plan) => {
            if (plan.department === from) {
              plan.department = to;
              changed = true;
            }
          });
        }
      });
      if (changed) {
        localStorage.setItem('ia_annual_plans_by_year', JSON.stringify(data));
      }
    }
  } catch (e) {
    console.error('Cascade error (annual plans):', e);
  }

  // 3. ia_engagement_plans_by_year
  try {
    const raw = localStorage.getItem('ia_engagement_plans_by_year');
    if (raw) {
      const data = JSON.parse(raw);
      let changed = false;
      Object.keys(data).forEach((year) => {
        if (Array.isArray(data[year])) {
          data[year].forEach((plan) => {
            if (plan.department === from) {
              plan.department = to;
              changed = true;
            }
            if (plan.targetDepartment === from) {
              plan.targetDepartment = to;
              changed = true;
            }
          });
        }
      });
      if (changed) {
        localStorage.setItem('ia_engagement_plans_by_year', JSON.stringify(data));
      }
    }
  } catch (e) {
    console.error('Cascade error (engagement plans):', e);
  }

  // 4. ia_working_papers_by_year
  try {
    const raw = localStorage.getItem('ia_working_papers_by_year');
    if (raw) {
      const data = JSON.parse(raw);
      let changed = false;
      Object.keys(data).forEach((year) => {
        if (Array.isArray(data[year])) {
          data[year].forEach((wp) => {
            if (wp.department === from) {
              wp.department = to;
              changed = true;
            }
          });
        }
      });
      if (changed) {
        localStorage.setItem('ia_working_papers_by_year', JSON.stringify(data));
      }
    }
  } catch (e) {
    console.error('Cascade error (working papers):', e);
  }
}

export function autoRepairDataLinkages() {
  try {
    const depts = getDepartments();
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return;
    const users = JSON.parse(raw);
    if (!Array.isArray(users) || users.length === 0) return;

    const DEPT_PERMS_V4_KEY = 'ia_dept_perms_v4_twomenus';
    const isDeptPermsSynced = localStorage.getItem(DEPT_PERMS_V4_KEY) === 'synced';
    const SPRINT3_SYNC_KEY = 'ia_sprint3_workspaces_v1';
    const isSprint3Synced = localStorage.getItem(SPRINT3_SYNC_KEY) === 'synced';
    const SPRINT4_5_SYNC_KEY = 'ia_sprint4_5_sync_v3';
    const isSprint4_5Synced = localStorage.getItem(SPRINT4_5_SYNC_KEY) === 'synced';

    let usersChanged = false;
    users.forEach((u) => {
      // 1. Admin display name: change to หน่วยตรวจสอบฯ
      if (u.role === 'admin' || u.username === 'admin') {
        if (u.displayName === 'นายศุภมงคล ธรรมพิทักษ์' || !u.displayName) {
          u.displayName = 'หน่วยตรวจสอบฯ';
          usersChanged = true;
        }
      }

      // 2. Health -> กองสวัสดิการสังคม
      if (u.username === 'health') {
        if (u.department === 'กองสาธารณสุขและสิ่งแวดล้อม' || u.displayName === 'กองสาธารณสุขและสิ่งแวดล้อม' || (u.department === 'กองสวัสดิการสังคม' && u.displayName !== 'กองสวัสดิการสังคม')) {
          u.department = 'กองสวัสดิการสังคม';
          u.displayName = 'กองสวัสดิการสังคม';
          u.position = 'ผู้อำนวยการกองสวัสดิการสังคม / เจ้าหน้าที่';
          usersChanged = true;
        }
      }
      if (u.department === 'กองสาธารณสุขและสิ่งแวดล้อม') {
        u.department = 'กองสวัสดิการสังคม';
        if (u.displayName === 'กองสาธารณสุขและสิ่งแวดล้อม') {
          u.displayName = 'กองสวัสดิการสังคม';
        }
        usersChanged = true;
      }

      // 3. Generic department sync
      if (u.role !== 'admin') {
        if (DEFAULT_DEPARTMENTS.includes(u.displayName) && u.department && u.displayName !== u.department) {
          if (!depts.includes(u.displayName)) {
            cascadeDepartmentRenameToStorage(u.displayName, u.department);
            u.displayName = u.department;
            usersChanged = true;
          }
        }
      }

      // 4. Migrate 'control-risk' to 'internal-control' and 'risk-management'
      if (Array.isArray(u.permissions) && u.permissions.includes('control-risk')) {
        const set = new Set(u.permissions.filter((p) => p !== 'control-risk'));
        set.add('internal-control');
        set.add('risk-management');
        u.permissions = Array.from(set);
        usersChanged = true;
      }

      // 5. Ensure admin has audit-toolkits permission
      if (u.role === 'admin' || u.username === 'admin') {
        if (!u.permissions?.includes('audit-toolkits')) {
          u.permissions = [...(u.permissions || []), 'audit-toolkits'];
          usersChanged = true;
        }
      }

      // 6. Reset base default permissions for department users to the 4 essential menus:
      // 1. หน้าภาพรวม (public-overview)
      // 2. การบริหารความเสี่ยงองค์กร (risk-management)
      // 3. คลังระเบียบและกฎหมาย (knowledge)
      // 4. แบบฟอร์มมาตรฐาน (forms)
      // All other menus are granted exclusively by ADMIN in the Permission Matrix.
      const BASE4_SYNC_KEY = 'ia_dept_perms_base4_v2';
      const isBase4Synced = localStorage.getItem(BASE4_SYNC_KEY) === 'synced';
      if (!isBase4Synced) {
        users.forEach((u) => {
          if (u.role !== 'admin' && u.role !== 'executive' && u.role !== 'guest') {
            u.permissions = [...DEFAULT_DEPT_PERMISSIONS];
            usersChanged = true;
          }
        });
        localStorage.setItem(BASE4_SYNC_KEY, 'synced');
      }

      // 6.1 Remove obsolete 'dept-workspaces' and ensure CDC menus are available for admin/executive
      if (Array.isArray(u.permissions)) {
        if (u.permissions.includes('dept-workspaces')) {
          u.permissions = u.permissions.filter((p) => p !== 'dept-workspaces');
          usersChanged = true;
        }
        if (u.role === 'admin' || u.role === 'executive') {
          if (!u.permissions.includes('dept-cdc-charoen')) {
            u.permissions.push('dept-cdc-charoen');
            usersChanged = true;
          }
          if (!u.permissions.includes('dept-cdc-fangthoeng')) {
            u.permissions.push('dept-cdc-fangthoeng');
            usersChanged = true;
          }
        }
      }
    });

    // 7. Ensure Executive accounts exist (ผู้บริหาร & ปลัด อปท.) and สำนักปลัด is distinct
    const executivePerms = ['executive-dashboard', 'dashboard', 'central-calendar', 'audit-risk', 'planning', 'engagement-plan', 'execution', 'audit-toolkits', 'reporting', 'dept-office', 'dept-finance', 'dept-tech', 'dept-education', 'dept-welfare', 'dept-cdc-charoen', 'dept-cdc-fangthoeng', 'internal-control', 'risk-management', 'lpa', 'knowledge', 'forms'];
    
    // 7.1 Ensure mayor (ผู้บริหาร) exists
    if (!users.some((u) => u.username === 'mayor')) {
      users.push({
        username: 'mayor',
        displayName: 'ผู้บริหารสูงสุด (นายก อปท.)',
        position: 'นายกองค์กรปกครองส่วนท้องถิ่น / คณะผู้บริหาร',
        department: 'ผู้บริหาร',
        role: 'executive',
        passwordText: '1234',
        permissions: executivePerms,
        canManageUsers: false,
        createdAt: Date.now()
      });
      usersChanged = true;
    } else {
      const mayor = users.find((u) => u.username === 'mayor');
      if (mayor && (!mayor.permissions?.includes('execution') || !mayor.permissions?.includes('audit-toolkits'))) {
        mayor.permissions = executivePerms;
        usersChanged = true;
      }
    }

    // 7.2 Update palat to be ปลัด อปท. (Executive)
    const palatIdx = users.findIndex((u) => u.username === 'palat');
    if (palatIdx !== -1) {
      if (users[palatIdx].displayName === 'สำนักปลัด' || users[palatIdx].role !== 'executive' || !users[palatIdx].permissions?.includes('execution')) {
        users[palatIdx].displayName = 'ปลัด อปท.';
        users[palatIdx].position = 'ปลัดองค์กรปกครองส่วนท้องถิ่น';
        users[palatIdx].department = 'สำนักปลัด';
        users[palatIdx].role = 'executive';
        users[palatIdx].permissions = executivePerms;
        usersChanged = true;
      }
    } else {
      users.push({
        username: 'palat',
        displayName: 'ปลัด อปท.',
        position: 'ปลัดองค์กรปกครองส่วนท้องถิ่น',
        department: 'สำนักปลัด',
        role: 'executive',
        passwordText: '1234',
        permissions: executivePerms,
        canManageUsers: false,
        createdAt: Date.now()
      });
      usersChanged = true;
    }

    // 7.3 Ensure สำนักปลัด has its own auditee user (office)
    if (!users.some((u) => u.username === 'office' || (u.department === 'สำนักปลัด' && u.role === 'user'))) {
      users.push({
        username: 'office',
        displayName: 'สำนักปลัด',
        position: 'หัวหน้าสำนักปลัด / เจ้าหน้าที่สำนักปลัด',
        department: 'สำนักปลัด',
        role: 'user',
        passwordText: '1234',
        permissions: [...DEFAULT_DEPT_PERMISSIONS],
        canManageUsers: false,
        createdAt: Date.now()
      });
      usersChanged = true;
    }

    // 7.4 Ensure ศพด.วัดเจริญทัศน์ user exists
    if (!users.some((u) => u.username === 'cdc_charoen' || (u.department === 'ศพด.วัดเจริญทัศน์' && u.role === 'user'))) {
      users.push({
        username: 'cdc_charoen',
        displayName: 'ศพด.วัดเจริญทัศน์',
        position: 'หัวหน้าศูนย์พัฒนาเด็กเล็กวัดเจริญทัศน์ / ครูผู้ดูแลเด็ก',
        department: 'ศพด.วัดเจริญทัศน์',
        role: 'user',
        passwordText: '1234',
        permissions: [...DEFAULT_DEPT_PERMISSIONS],
        canManageUsers: false,
        createdAt: Date.now()
      });
      usersChanged = true;
    }

    // 7.5 Ensure ศพด.บ้านฝางเทิง user exists
    if (!users.some((u) => u.username === 'cdc_fangthoeng' || (u.department === 'ศพด.บ้านฝางเทิง' && u.role === 'user'))) {
      users.push({
        username: 'cdc_fangthoeng',
        displayName: 'ศพด.บ้านฝางเทิง',
        position: 'หัวหน้าศูนย์พัฒนาเด็กเล็กบ้านฝางเทิง / ครูผู้ดูแลเด็ก',
        department: 'ศพด.บ้านฝางเทิง',
        role: 'user',
        passwordText: '1234',
        permissions: [...DEFAULT_DEPT_PERMISSIONS],
        canManageUsers: false,
        createdAt: Date.now()
      });
      usersChanged = true;
    }

    // 7.6 Ensure welfare user exists
    if (!users.some((u) => u.username === 'welfare' || (u.department === 'กองสวัสดิการสังคม' && u.role === 'user'))) {
      users.push({
        username: 'welfare',
        displayName: 'กองสวัสดิการสังคม',
        position: 'ผู้อำนวยการกองสวัสดิการสังคม / เจ้าหน้าที่',
        department: 'กองสวัสดิการสังคม',
        role: 'user',
        passwordText: '1234',
        permissions: [...DEFAULT_DEPT_PERMISSIONS],
        canManageUsers: false,
        createdAt: Date.now()
      });
      usersChanged = true;
    }

    // 7.7 Merge public health into สำนักปลัด and remove standalone health account
    const healthUserIndex = users.findIndex((u) => u.username === 'health');
    if (healthUserIndex !== -1) {
      users.splice(healthUserIndex, 1);
      usersChanged = true;
    }
    users.forEach((u) => {
      if (u.department === 'งานสาธารณสุขและสิ่งแวดล้อม' || u.department === 'กองสาธารณสุขและสิ่งแวดล้อม' || u.department === 'งานสาธารณสุข') {
        u.department = 'สำนักปลัด';
        usersChanged = true;
      }
    });

    // 7.8 Ensure education user exists with default base permissions
    const eduUser = users.find((u) => u.username === 'education' || u.department === 'กองการศึกษา');
    if (!eduUser) {
      users.push({
        username: 'education',
        displayName: 'กองการศึกษา',
        position: 'ผู้อำนวยการกองการศึกษา / นักวิชาการศึกษา',
        department: 'กองการศึกษา',
        role: 'user',
        passwordText: '1234',
        permissions: [...DEFAULT_DEPT_PERMISSIONS],
        canManageUsers: false,
        createdAt: Date.now()
      });
      usersChanged = true;
    }

    cascadeDepartmentRenameToStorage('กองสาธารณสุขและสิ่งแวดล้อม', 'กองสวัสดิการสังคม');

    // 8. Ensure Guest user exists with default 'dashboard' permission
    const guestUser = users.find((u) => u.username === 'guest' || u.role === 'guest');
    if (!guestUser) {
      users.push({
        username: 'guest',
        displayName: 'ผู้เยี่ยมชม (Guest)',
        position: 'ผู้เยี่ยมชมทั่วไป / ประชาชน',
        department: 'ผู้เยี่ยมชม',
        role: 'guest',
        passwordText: '',
        permissions: ['dashboard'],
        canManageUsers: false,
        createdAt: Date.now()
      });
      usersChanged = true;
    } else {
      if (guestUser.role !== 'guest') {
        guestUser.role = 'guest';
        usersChanged = true;
      }
      if (!Array.isArray(guestUser.permissions) || guestUser.permissions.length === 0) {
        guestUser.permissions = ['dashboard'];
        usersChanged = true;
      }
    }

    // Also repair orgProfile auditorName if stored as former developer name
    try {
      const rawProfile = localStorage.getItem('ia_org_profile');
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile);
        if (parsed && (parsed.auditorName === 'นายศุภมงคล ธรรมพิทักษ์' || !parsed.auditorName)) {
          parsed.auditorName = 'หน่วยตรวจสอบภายใน';
          localStorage.setItem('ia_org_profile', JSON.stringify(parsed));
        }
      }
    } catch (_) {}

    if (usersChanged) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // Also repair active session
    const currentSession = getSession();
    if (currentSession) {
      let sessChanged = false;
      if (currentSession.username === 'admin' && (currentSession.displayName === 'นายศุภมงคล ธรรมพิทักษ์' || !currentSession.displayName)) {
        currentSession.displayName = 'หน่วยตรวจสอบฯ';
        sessChanged = true;
      }
      if (Array.isArray(currentSession.permissions) && currentSession.permissions.includes('control-risk')) {
        const set = new Set(currentSession.permissions.filter((p) => p !== 'control-risk'));
        set.add('internal-control');
        set.add('risk-management');
        currentSession.permissions = Array.from(set);
        sessChanged = true;
      }
      const SESS_BASE4_KEY = 'ia_dept_session_base4_v2';
      if (localStorage.getItem(SESS_BASE4_KEY) !== 'synced') {
        if (currentSession.role !== 'admin' && currentSession.role !== 'executive' && currentSession.role !== 'guest') {
          currentSession.permissions = [...DEFAULT_DEPT_PERMISSIONS];
          sessChanged = true;
        }
        localStorage.setItem(SESS_BASE4_KEY, 'synced');
      }
      if (sessChanged) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
      }
    }

    // 9. Systematic purge of mock/sample data across entire system (ia_purge_dummy_data_v2026_strict_clean_v5)
    const PURGE_MOCK_KEY = 'ia_purge_dummy_data_v2026_strict_clean_v5';
    if (localStorage.getItem(PURGE_MOCK_KEY) !== 'purged') {
      try {
        // Directives
        const rawDir = localStorage.getItem('ia_executive_directives');
        if (rawDir) {
          const list = JSON.parse(rawDir);
          if (Array.isArray(list)) {
            const realDir = list.filter((d) => !['DIR-2569-001', 'DIR-2569-002', 'DIR-2569-003'].includes(d.code) && !['DIR-2569-001', 'DIR-2569-002', 'DIR-2569-003'].includes(d.id));
            localStorage.setItem('ia_executive_directives', JSON.stringify(realDir));
          }
        }

        // CAPA Findings (Unconditional strict purge of all dummy/sample findings)
        const rawCapa = localStorage.getItem('ia_capa_findings_by_year');
        if (rawCapa) {
          const parsed = JSON.parse(rawCapa);
          const sampleCapaIds = [
            'CAPA-OAG-69-01', 'CAPA-IA-69-01', 'CAPA-INSP-69-01', 'CAPA-FIN-69-01', 'CAPA-ENG-69-01',
            'CAPA-2569-001', 'CAPA-2569-002', 'CAPA-2569-003'
          ];
          Object.keys(parsed).forEach((yr) => {
            if (Array.isArray(parsed[yr])) {
              parsed[yr] = parsed[yr].filter(
                (c) => !sampleCapaIds.includes(c.id) &&
                       !sampleCapaIds.includes(c.code) &&
                       !c.id?.startsWith('CAPA-IA-') &&
                       !c.id?.startsWith('CAPA-INSP-') &&
                       !c.id?.startsWith('CAPA-OAG-') &&
                       !c.title?.includes('งบกระทบยอดเงินฝาก') &&
                       !c.title?.includes('แผนที่ภาษี') &&
                       !c.title?.includes('ค่าเบี้ยยังชีพ') &&
                       !c.title?.includes('ค่าปรับ')
              );
            }
          });
          localStorage.setItem('ia_capa_findings_by_year', JSON.stringify(parsed));
        }

        // Internal Controls
        const rawIc = localStorage.getItem('ia_internal_controls_by_year');
        if (rawIc) {
          const parsed = JSON.parse(rawIc);
          Object.keys(parsed).forEach((yr) => {
            if (parsed[yr]?.pk4?.some((p) => p.id === 'PK4-01' || p.department === 'สำนักปลัด')) {
              parsed[yr] = { pk1: { status: 'ยังไม่ได้รับรอง', docNo: '', signDate: '', signer: '', position: '' }, pk4: [], pk5: [] };
            }
          });
          localStorage.setItem('ia_internal_controls_by_year', JSON.stringify(parsed));
        }


        // Department Workspaces
        const rawOffice = localStorage.getItem('ia_dept_office_data');
        if (rawOffice && (rawOffice.includes('VEH-01') || rawOffice.includes('กค-1234'))) {
          localStorage.setItem('ia_dept_office_data', JSON.stringify({ vehicleBookings: [], complaints: [] }));
        }

        const rawFin = localStorage.getItem('ia_dept_finance_data');
        if (rawFin && (rawFin.includes('CN-69-01') || rawFin.includes('LN-69-01'))) {
          localStorage.setItem('ia_dept_finance_data', JSON.stringify({ contractManagement: [], advanceLoans: [], inventoryCheck: [] }));
        }

        const rawTech = localStorage.getItem('ia_dept_tech_data');
        if (rawTech && (rawTech.includes('BP-69-001') || rawTech.includes('PRJ-69-01'))) {
          localStorage.setItem('ia_dept_tech_data', JSON.stringify({ buildingPermits: [], infrastructureProjects: [], waterMaintenance: [] }));
        }

        const rawEdu = localStorage.getItem('ia_dept_education_data');
        if (rawEdu && (rawEdu.includes('LCH-69-01') || rawEdu.includes('CDC-ATT-01'))) {
          localStorage.setItem('ia_dept_education_data', JSON.stringify({ schoolLunch: [], cdcAttendance: [], subsidies: [] }));
        }

        const rawWel = localStorage.getItem('ia_dept_welfare_data');
        if (rawWel && (rawWel.includes('WEL-69-001') || rawWel.includes('EMG-69-01'))) {
          localStorage.setItem('ia_dept_welfare_data', JSON.stringify({ allowanceRecipients: [], emergencyAssistance: [], medicalDevices: [] }));
        }

        const rawHealth = localStorage.getItem('ia_dept_health_data');
        if (rawHealth && (rawHealth.includes('WR-01') || rawHealth.includes('SAN-69-01'))) {
          localStorage.setItem('ia_dept_health_data', JSON.stringify({ wasteRoutes: [], healthSanitation: [], pesticideControls: [] }));
        }

        const rawPubHealth = localStorage.getItem('ia_dept_public_health_data');
        if (rawPubHealth) {
          try {
            const parsedPub = JSON.parse(rawPubHealth);
            if (!parsedPub || !Array.isArray(parsedPub.wasteManagement) || rawPubHealth.includes('village-1')) {
              localStorage.setItem('ia_dept_public_health_data', JSON.stringify({
                summary: {
                  wasteBinsRegistered: 0,
                  monthlyWasteFeeEstimate: 0,
                  foggingCampaignsCompleted: 0,
                  rabiesVaccinatedAnimals: 0
                },
                wasteManagement: [],
                diseaseControl: [],
                foodSanitation: []
              }));
            }
          } catch (e) {
            localStorage.removeItem('ia_dept_public_health_data');
          }
        }

        // Central Calendar Events
        const rawEvents = localStorage.getItem('ia_central_calendar_events');
        if (rawEvents && (rawEvents.includes('EVT-01') || rawEvents.includes('EVT-02'))) {
          localStorage.setItem('ia_central_calendar_events', JSON.stringify([]));
        }

        // Annual Plans
        const rawAp = localStorage.getItem('ia_annual_plans_by_year');
        if (rawAp) {
          const parsed = JSON.parse(rawAp);
          let apChanged = false;
          Object.keys(parsed).forEach((yr) => {
            if (Array.isArray(parsed[yr])) {
              const filtered = parsed[yr].filter((p) => !['AP-2569-001', 'AP-2569-002'].includes(p.id));
              if (filtered.length !== parsed[yr].length) {
                parsed[yr] = filtered;
                apChanged = true;
              }
            }
          });
          if (apChanged) {
            localStorage.setItem('ia_annual_plans_by_year', JSON.stringify(parsed));
          }
        }

        localStorage.setItem(PURGE_MOCK_KEY, 'purged');
      } catch (err) {
        console.error('Error during purge of mock data:', err);
      }
    }
  } catch (e) {
    console.error('autoRepairDataLinkages error:', e);
  }
}

export function updateDepartment(oldName, newName) {
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();
  if (!cleanNew) throw new Error('กรุณาระบุชื่อสำนัก/กองใหม่');
  const depts = getDepartments();
  const idx = depts.findIndex((d) => d.toLowerCase() === cleanOld.toLowerCase());
  if (idx === -1) throw new Error('ไม่พบสำนัก/กองเดิมในระบบ');

  if (cleanNew.toLowerCase() !== cleanOld.toLowerCase() && depts.some((d) => d.toLowerCase() === cleanNew.toLowerCase())) {
    throw new Error(`ชื่อสำนัก/กอง "${cleanNew}" มีอยู่ในระบบแล้ว`);
  }
  depts[idx] = cleanNew;
  saveDepartments(depts);

  // Update existing users belonging to oldName or displaying oldName
  const users = getUsers();
  let changed = false;
  users.forEach((u) => {
    const isOldDept = u.department?.toLowerCase() === cleanOld.toLowerCase();
    const isOldDisplay = u.displayName?.toLowerCase() === cleanOld.toLowerCase();

    if (isOldDept || isOldDisplay) {
      u.department = cleanNew;
      // Also update displayName if it was the department name or contains it
      if (isOldDisplay || (u.displayName && u.displayName.includes(cleanOld))) {
        u.displayName = u.displayName ? u.displayName.replaceAll(cleanOld, cleanNew) : cleanNew;
      }
      if (u.position && u.position.includes(cleanOld)) {
        u.position = u.position.replaceAll(cleanOld, cleanNew);
      }
      changed = true;
    }
  });
  if (changed) {
    saveUsers(users);
  }

  // Update current session if matching
  try {
    const currentSession = getSession();
    if (currentSession) {
      let sessChanged = false;
      if (currentSession.department?.toLowerCase() === cleanOld.toLowerCase()) {
        currentSession.department = cleanNew;
        sessChanged = true;
      }
      if (currentSession.displayName?.toLowerCase() === cleanOld.toLowerCase() || (currentSession.displayName && currentSession.displayName.includes(cleanOld))) {
        currentSession.displayName = currentSession.displayName.replaceAll(cleanOld, cleanNew);
        sessChanged = true;
      }
      if (sessChanged) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
      }
    }
  } catch (e) {
    console.error(e);
  }

  // Cascade to audit universe, annual plans, engagement plans, working papers
  cascadeDepartmentRenameToStorage(cleanOld, cleanNew);

  return depts;
}

export function deleteDepartment(name) {
  const clean = name.trim();
  if (clean === 'หน่วยตรวจสอบภายใน') {
    throw new Error('ไม่สามารถลบ "หน่วยตรวจสอบภายใน" ได้');
  }
  const users = getUsers();
  const activeUsers = users.filter((u) => u.department === clean);
  if (activeUsers.length > 0) {
    throw new Error(`ไม่สามารถลบ "${clean}" ได้ เนื่องจากมีผู้ใช้งาน ${activeUsers.length} บัญชีสังกัดอยู่ (กรุณาย้ายสังกัดผู้ใช้ก่อน)`);
  }
  const depts = getDepartments();
  const updated = depts.filter((d) => d.toLowerCase() !== clean.toLowerCase());
  saveDepartments(updated);
  return updated;
}

const DEFAULT_SESSION_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

export const ALL_MENU_IDS = [
  { id: 'public-overview', label: 'ภาพรวม', icon: 'Globe', desc: 'ภาพรวมองค์กร อปท. การให้บริการประชาชน ข้อมูลสาธารณะ และช่องทางติดต่อ' },
  { id: 'executive-dashboard', label: 'แดชบอร์ดผู้บริหาร', icon: 'LayoutDashboard', desc: 'แดชบอร์ดภาพรวมการเงิน ผลการตรวจ การสั่งการ และนาฬิกานับถอยหลังกฎหมาย' },
  { id: 'dashboard', label: 'แดชบอร์ดตรวจสอบภายใน', icon: 'ShieldAlert', desc: 'แดชบอร์ดสรุปและปฏิทินงานตรวจสอบ' },
  { id: 'central-calendar', label: 'ปฏิทินปฏิบัติงานส่วนกลาง', icon: 'CalendarDays', desc: 'ปฏิทินบูรณาการร่วมทุกสำนัก/กอง และกำหนดการตรวจ' },
  { id: 'audit-risk', label: 'การประเมินความเสี่ยง', icon: 'ShieldAlert', desc: 'วิเคราะห์ SOFCK และจัดลำดับความเสี่ยง 21 กิจกรรม' },
  { id: 'planning', label: 'แผน & นโยบายตรวจ', icon: 'FileText', desc: 'แผนการตรวจสอบประจำปีและกฎบัตร' },
  { id: 'engagement-plan', label: 'แผนปฏิบัติงานตรวจ (ว 614)', icon: 'Sparkles', desc: 'แผนปฏิบัติงานรายกิจกรรมและแนวการตรวจด้วย AI' },
  { id: 'execution', label: 'ปฏิบัติการตรวจ & กระดาษทำการ', icon: 'ClipboardCheck', desc: 'ลงมือตรวจจริง สุ่มตรวจ และบันทึกกระดาษทำการ' },
  { id: 'audit-toolkits', label: 'เครื่องมือช่วยตรวจเชิงเทคนิค (ปี 70)', icon: 'Wrench', desc: 'เครื่องมือคำนวณราคากลาง Factor F, ค่าปรับ, ค่าธรรมเนียมอาคาร และข้อบัญญัติ' },
  { id: 'reporting', label: 'รายงาน & ติดตามผล (CAPA)', icon: 'FileSpreadsheet', desc: 'รายงานผลการตรวจสอบและติดตามข้อเสนอแนะ' },
  { id: 'dept-office', label: 'สำนักปลัด', icon: 'Building2', desc: 'งานสารบรรณ ทะเบียนคุมรถและน้ำมัน แผนพัฒนาท้องถิ่น เรื่องร้องเรียน และงานสาธารณสุขและสิ่งแวดล้อม' },
  { id: 'dept-finance', label: 'กองคลัง', icon: 'BadgeDollarSign', desc: 'ทะเบียนคุมสัญญา คำนวณค่าปรับ ตรวจสอบพัสดุประจำปี และลูกหนี้เงินยืม' },
  { id: 'dept-tech', label: 'กองช่าง', icon: 'HardHat', desc: 'คำนวณราคากลาง Factor F & ปร.5 ทะเบียนคุมงานก่อสร้าง และขออนุญาตอาคาร 45 วัน' },
  { id: 'dept-education', label: 'กองการศึกษา', icon: 'GraduationCap', desc: 'ทะเบียนอาหารกลางวัน นมโรงเรียน พัสดุสื่อการเรียนการสอน และ ศพด.' },
  { id: 'dept-welfare', label: 'กองสวัสดิการสังคม', icon: 'HeartHandshake', desc: 'ทะเบียนคุมเบี้ยยังชีพผู้สูงอายุ 4 ขั้นบันได คนพิการ ผู้ป่วยเอดส์ และสงเคราะห์' },
  { id: 'dept-cdc-charoen', label: 'ศพด.วัดเจริญทัศน์', icon: 'Baby', desc: 'พื้นที่ทำงานศูนย์พัฒนาเด็กเล็กวัดเจริญทัศน์ ทะเบียนเด็ก อาหารกลางวัน นม และพัฒนาการ' },
  { id: 'dept-cdc-fangthoeng', label: 'ศพด.บ้านฝางเทิง', icon: 'Baby', desc: 'พื้นที่ทำงานศูนย์พัฒนาเด็กเล็กบ้านฝางเทิง ทะเบียนเด็ก อาหารกลางวัน นม และพัฒนาการ' },
  { id: 'internal-control', label: 'การควบคุมภายใน', icon: 'ShieldCheck', desc: 'บันทึกแบบ ปค.1, ปค.4, ปค.5 ตามหลักเกณฑ์ กค. พ.ศ. 2561 ของแต่ละกอง' },
  { id: 'risk-management', label: 'การบริหารความเสี่ยง', icon: 'AlertTriangle', desc: 'บันทึกแบบ บส.1 - บส.5 และ Matrix ระดับความเสี่ยง 5x5 ของแต่ละกอง' },
  { id: 'lpa', label: 'เตรียมรับประเมิน LPA', icon: 'Award', desc: 'เช็กลิสต์และหลักฐานเตรียมรับประเมิน LPA' },
  { id: 'knowledge', label: 'คลังระเบียบและกฎหมาย', icon: 'BookOpen', desc: 'สืบค้นระเบียบกระทรวงมหาดไทย พ.ร.บ. และหนังสือสั่งการ' },
  { id: 'forms', label: 'แบบฟอร์มมาตรฐาน', icon: 'FileSpreadsheet', desc: 'เปิดดูและดาวน์โหลดแบบฟอร์ม บส.1-5 ตาม ว 3482, ปค. และเอกสารตรวจสอบ' },
  { id: 'users', label: 'จัดการผู้ใช้งาน & กำหนดสิทธิ์', icon: 'Users', desc: 'จัดการบัญชีกองและกำหนดสิทธิ์การมองเห็นเมนู (ADMIN Only)' }
];

export const DEFAULT_DEPT_PERMISSIONS = [
  'public-overview',
  'risk-management',
  'knowledge',
  'forms'
];

export const DEFAULT_INITIAL_USERS = [
  {
    username: 'admin',
    displayName: 'หน่วยตรวจสอบฯ',
    position: 'นักวิชาการตรวจสอบภายในปฏิบัติการ',
    department: 'หน่วยตรวจสอบภายใน',
    role: 'admin',
    passwordText: 'admin123',
    permissions: ALL_MENU_IDS.map((m) => m.id),
    canManageUsers: true,
    createdAt: Date.now()
  },
  {
    username: 'mayor',
    displayName: 'ผู้บริหารสูงสุด (นายก อปท.)',
    position: 'นายกองค์กรปกครองส่วนท้องถิ่น / คณะผู้บริหาร',
    department: 'ผู้บริหาร',
    role: 'executive',
    permissions: ['executive-dashboard', 'dashboard', 'central-calendar', 'audit-risk', 'planning', 'engagement-plan', 'execution', 'audit-toolkits', 'reporting', 'dept-office', 'dept-finance', 'dept-tech', 'dept-education', 'dept-welfare', 'dept-cdc-charoen', 'dept-cdc-fangthoeng', 'internal-control', 'risk-management', 'lpa', 'knowledge', 'forms'],
    canManageUsers: false,
    createdAt: Date.now()
  },
  {
    username: 'palat',
    displayName: 'ปลัด อปท.',
    position: 'ปลัดองค์กรปกครองส่วนท้องถิ่น',
    department: 'สำนักปลัด',
    role: 'executive',
    passwordText: '1234',
    permissions: ['executive-dashboard', 'dashboard', 'central-calendar', 'audit-risk', 'planning', 'engagement-plan', 'execution', 'audit-toolkits', 'reporting', 'dept-office', 'dept-finance', 'dept-tech', 'dept-education', 'dept-welfare', 'dept-cdc-charoen', 'dept-cdc-fangthoeng', 'internal-control', 'risk-management', 'lpa', 'knowledge', 'forms'],
    canManageUsers: false,
    createdAt: Date.now()
  },
  {
    username: 'office',
    displayName: 'สำนักปลัด',
    position: 'หัวหน้าสำนักปลัด / เจ้าหน้าที่สำนักปลัด',
    department: 'สำนักปลัด',
    role: 'user',
    passwordText: '1234',
    permissions: [...DEFAULT_DEPT_PERMISSIONS],
    canManageUsers: false,
    createdAt: Date.now()
  },
  {
    username: 'finance',
    displayName: 'กองคลัง',
    position: 'ผู้อำนวยการกองคลัง / เจ้าหน้าที่กองคลัง',
    department: 'กองคลัง',
    role: 'user',
    passwordText: '1234',
    permissions: [...DEFAULT_DEPT_PERMISSIONS],
    canManageUsers: false,
    createdAt: Date.now()
  },
  {
    username: 'engineering',
    displayName: 'กองช่าง',
    position: 'ผู้อำนวยการกองช่าง / นายช่าง',
    department: 'กองช่าง',
    role: 'user',
    passwordText: '1234',
    permissions: [...DEFAULT_DEPT_PERMISSIONS],
    canManageUsers: false,
    createdAt: Date.now()
  },
  {
    username: 'education',
    displayName: 'กองการศึกษา',
    position: 'ผู้อำนวยการกองการศึกษา / นักวิชาการศึกษา',
    department: 'กองการศึกษา',
    role: 'user',
    passwordText: '1234',
    permissions: [...DEFAULT_DEPT_PERMISSIONS],
    canManageUsers: false,
    createdAt: Date.now()
  },
  {
    username: 'welfare',
    displayName: 'กองสวัสดิการสังคม',
    position: 'ผู้อำนวยการกองสวัสดิการสังคม / เจ้าหน้าที่',
    department: 'กองสวัสดิการสังคม',
    role: 'user',
    passwordText: '1234',
    permissions: [...DEFAULT_DEPT_PERMISSIONS],
    canManageUsers: false,
    createdAt: Date.now()
  },
  {
    username: 'cdc_charoen',
    displayName: 'ศพด.วัดเจริญทัศน์',
    position: 'หัวหน้าศูนย์พัฒนาเด็กเล็กวัดเจริญทัศน์ / ครูผู้ดูแลเด็ก',
    department: 'ศพด.วัดเจริญทัศน์',
    role: 'user',
    passwordText: '1234',
    permissions: [...DEFAULT_DEPT_PERMISSIONS],
    canManageUsers: false,
    createdAt: Date.now()
  },
  {
    username: 'cdc_fangthoeng',
    displayName: 'ศพด.บ้านฝางเทิง',
    position: 'หัวหน้าศูนย์พัฒนาเด็กเล็กบ้านฝางเทิง / ครูผู้ดูแลเด็ก',
    department: 'ศพด.บ้านฝางเทิง',
    role: 'user',
    passwordText: '1234',
    permissions: [...DEFAULT_DEPT_PERMISSIONS],
    canManageUsers: false,
    createdAt: Date.now()
  },
  {
    username: 'guest',
    displayName: 'ผู้เยี่ยมชม (Guest)',
    position: 'ผู้เยี่ยมชมทั่วไป / ประชาชน',
    department: 'ผู้เยี่ยมชม',
    role: 'guest',
    passwordText: '',
    permissions: ['public-overview'],
    canManageUsers: false,
    createdAt: Date.now()
  }
];

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}::${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

// -------------------------------------------------------------
// User Management Functions
// -------------------------------------------------------------

export function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const users = JSON.parse(raw);
      if (Array.isArray(users) && users.length > 0) {
        let changed = false;
        users.forEach((u) => {
          // 1. Admin display name: change to หน่วยตรวจสอบฯ
          if (u.role === 'admin' || u.username === 'admin') {
            if (u.displayName === 'นายศุภมงคล ธรรมพิทักษ์' || !u.displayName) {
              u.displayName = 'หน่วยตรวจสอบฯ';
              changed = true;
            }
          }
          // 2. Health -> กองสวัสดิการสังคม
          if (u.username === 'health') {
            if (u.department === 'กองสาธารณสุขและสิ่งแวดล้อม' || u.displayName === 'กองสาธารณสุขและสิ่งแวดล้อม' || (u.department === 'กองสวัสดิการสังคม' && u.displayName !== 'กองสวัสดิการสังคม')) {
              u.displayName = 'กองสวัสดิการสังคม';
              u.department = 'กองสวัสดิการสังคม';
              if (!u.position || u.position.includes('กองสาธารณสุข')) {
                u.position = 'ผู้อำนวยการกองสวัสดิการสังคม / เจ้าหน้าที่';
              }
              changed = true;
            }
          }
          if (u.department === 'กองสาธารณสุขและสิ่งแวดล้อม') {
            u.department = 'กองสวัสดิการสังคม';
            if (u.displayName === 'กองสาธารณสุขและสิ่งแวดล้อม') {
              u.displayName = 'กองสวัสดิการสังคม';
            }
            changed = true;
          }
          if (u.permissions && Array.isArray(u.permissions)) {
            // Strip executive-dashboard from non-admin / non-executive accounts
            if (u.role !== 'admin' && u.role !== 'executive' && u.permissions.includes('executive-dashboard')) {
              u.permissions = u.permissions.filter((p) => p !== 'executive-dashboard');
              changed = true;
            }
          }
        });
        if (changed) {
          saveUsers(users);
        }
        return users;
      }
    }

    // Auto-seed default users and check if there's an existing legacy single account
    const initialUsers = [...DEFAULT_INITIAL_USERS];
    const oldAccountRaw = localStorage.getItem(OLD_ACCOUNT_KEY);
    if (oldAccountRaw) {
      try {
        const old = JSON.parse(oldAccountRaw);
        if (old?.username) {
          const adminIdx = initialUsers.findIndex((u) => u.username === 'admin');
          if (adminIdx !== -1) {
            initialUsers[adminIdx].username = old.username;
            initialUsers[adminIdx].salt = old.salt;
            initialUsers[adminIdx].hash = old.hash;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    saveUsers(initialUsers);
    return initialUsers;
  } catch (e) {
    console.error(e);
    return DEFAULT_INITIAL_USERS;
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  try {
    window.dispatchEvent(new Event('ia-departments-changed'));
  } catch (e) {
    console.error(e);
  }
}

export function getUserByUsername(username) {
  const users = getUsers();
  return users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase()) || null;
}

export async function addUser({ username, displayName, position, department, role, password, permissions }) {
  const users = getUsers();
  const cleanUsername = username.trim().toLowerCase();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    throw new Error(`ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว`);
  }
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const newUser = {
    username: cleanUsername,
    displayName: displayName.trim(),
    position: position?.trim() || '',
    department: department?.trim() || 'หน่วยงานทั่วไป',
    role: role || 'user',
    salt,
    hash,
    passwordText: password, // For easy admin viewing/recovery in local system
    permissions: permissions || [...DEFAULT_DEPT_PERMISSIONS],
    canManageUsers: role === 'admin',
    createdAt: Date.now()
  };
  users.push(newUser);
  saveUsers(users);

  // Sync to Cloud Supabase profiles
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const cleanPos = position?.trim() || '';
      const cloudPosition = cleanPos ? `${cleanPos}:::cred:${salt}:${hash}` : `:::cred:${salt}:${hash}`;
      await client.from('profiles').upsert({
        username: cleanUsername,
        display_name: displayName.trim(),
        department: department?.trim() || 'หน่วยงานทั่วไป',
        position: cloudPosition,
        role: role || 'user',
        status: 'active',
        permissions: permissions || [...DEFAULT_DEPT_PERMISSIONS],
        can_manage_users: role === 'admin',
        updated_at: new Date().toISOString()
      }, { onConflict: 'username' });
    } catch (e) {
      console.warn('Supabase addUser sync:', e);
    }
  }

  return newUser;
}

// -------------------------------------------------------------
// Pending User Registration & Approval Workflow
// -------------------------------------------------------------

export function getPendingUsers() {
  try {
    const raw = localStorage.getItem(PENDING_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function savePendingUsers(list) {
  localStorage.setItem(PENDING_USERS_KEY, JSON.stringify(list));
  try {
    window.dispatchEvent(new CustomEvent('ia-pending-users-changed'));
  } catch (e) {
    console.error(e);
  }
}

export async function pullPendingUsersFromCloud() {
  if (!isSupabaseConfigured()) return getPendingUsers();
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching pending users from cloud:', error);
      return getPendingUsers();
    }

    if (Array.isArray(data)) {
      const localList = getPendingUsers();
      const cloudPending = data.map((row) => {
        let pos = row.position || '';
        let salt = '';
        let hash = '';
        if (pos.includes(':::cred:')) {
          const parts = pos.split(':::cred:');
          pos = parts[0] || '';
          const credParts = (parts[1] || '').split(':');
          salt = credParts[0] || '';
          hash = credParts[1] || '';
        }
        const localMatch = localList.find((l) => l.username?.toLowerCase() === row.username?.toLowerCase());

        return {
          id: row.id || row.username,
          username: row.username,
          displayName: row.display_name,
          department: row.department,
          position: pos,
          role: row.role || 'staff',
          email: `${row.username}@local.ia-os`,
          salt: salt || localMatch?.salt || '',
          hash: hash || localMatch?.hash || '',
          passwordText: localMatch?.passwordText || '',
          requestedAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          status: 'pending'
        };
      });

      savePendingUsers(cloudPending);
      return cloudPending;
    }
  } catch (e) {
    console.warn('pullPendingUsersFromCloud failed:', e);
  }
  return getPendingUsers();
}

export async function registerUser({ username, displayName, organization, department, position, role = 'staff', password, email }) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanOrg = organization ? organization.trim() : '';
  const cleanDept = department ? department.trim() : 'หน่วยตรวจสอบภายใน';
  const cleanDisplayName = displayName.trim();
  const cleanPosition = position ? position.trim() : 'ผู้ตรวจสอบภายใน';

  if (!cleanUsername) throw new Error('กรุณาระบุชื่อผู้ใช้งาน');
  if (!cleanDisplayName) throw new Error('กรุณาระบุชื่อ-นามสกุล');
  if (!cleanOrg) throw new Error('กรุณาระบุองค์กรปกครองส่วนท้องถิ่น (อปท.) / หน่วยงานที่สังกัด');
  if (!password || password.length < 4) throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');

  const existingUsers = getUsers();
  if (existingUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
    throw new Error(`ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว`);
  }

  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const cloudPosition = cleanPosition ? `${cleanPosition}:::cred:${salt}:${hash}` : `:::cred:${salt}:${hash}`;

  let supabaseId = null;
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      // Check if user already exists in profiles
      const { data: existingProfile } = await client
        .from('profiles')
        .select('id, username, status')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingProfile) {
        if (existingProfile.status === 'pending') {
          throw new Error(`ชื่อผู้ใช้ "${username}" ได้ส่งคำขอลงทะเบียนไว้แล้ว (อยู่ระหว่างรอผู้ดูแลระบบอนุมัติ)`);
        } else {
          throw new Error(`ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว`);
        }
      }

      // Insert pending profile into Supabase
      const { data: inserted, error: insertError } = await client
        .from('profiles')
        .insert([{
          username: cleanUsername,
          display_name: cleanDisplayName,
          department: cleanDept,
          position: cloudPosition,
          role: role || 'staff',
          status: 'pending',
          permissions: [...DEFAULT_DEPT_PERMISSIONS],
          can_manage_users: role === 'admin'
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Supabase profile registration error:', insertError);
        throw new Error(`ส่งคำขอไปยังระบบคลาวด์ไม่สำเร็จ: ${insertError.message}`);
      }

      if (inserted?.id) {
        supabaseId = inserted.id;
      }
    } catch (err) {
      if (err.message && (err.message.includes('มีอยู่ในระบบแล้ว') || err.message.includes('ส่งคำขอลงทะเบียนไว้แล้ว'))) {
        throw err;
      }
      console.warn('Supabase registration sync warning:', err);
      throw new Error(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อคลาวด์เพื่อลงทะเบียน');
    }
  }

  const pendingList = getPendingUsers();
  const existingIdx = pendingList.findIndex((p) => p.username.toLowerCase() === cleanUsername);

  const pendingEntry = {
    id: supabaseId || 'pend_' + Date.now(),
    username: cleanUsername,
    displayName: cleanDisplayName,
    organization: cleanOrg,
    department: cleanDept,
    position: cleanPosition,
    role: role || 'staff',
    email: email || `${cleanUsername}@local.ia-os`,
    salt,
    hash,
    passwordText: password,
    requestedAt: Date.now(),
    status: 'pending'
  };

  if (existingIdx !== -1) {
    pendingList[existingIdx] = pendingEntry;
  } else {
    pendingList.push(pendingEntry);
  }
  savePendingUsers(pendingList);

  // If registering, also immediately update active orgProfile with this chosen organization
  if (cleanOrg) {
    try {
      const rawOrg = localStorage.getItem('ia_org_profile');
      const parsedOrg = rawOrg ? JSON.parse(rawOrg) : {};
      const updatedOrg = {
        ...parsedOrg,
        name: cleanOrg
      };
      localStorage.setItem('ia_org_profile', JSON.stringify(updatedOrg));
      window.dispatchEvent(new CustomEvent('ia-org-profile-changed', { detail: updatedOrg }));
    } catch (e) {
      console.warn(e);
    }
  }

  return pendingEntry;
}

export async function approvePendingUser(pendingId, approvedRole = null, customPermissions = null) {
  const pendingList = getPendingUsers();
  const idx = pendingList.findIndex((p) => p.id === pendingId || p.username === pendingId);
  if (idx === -1) throw new Error('ไม่พบรายการคำขอลงทะเบียนนี้');

  const pending = pendingList[idx];
  const targetRole = approvedRole || pending.role || 'staff';

  let permissions = customPermissions;
  if (!permissions) {
    if (targetRole === 'admin') {
      permissions = ALL_MENU_IDS.map((m) => m.id);
    } else if (targetRole === 'executive') {
      permissions = ['dashboard', 'audit-risk', 'planning', 'engagement-plan', 'execution', 'audit-toolkits', 'reporting', 'internal-control', 'risk-management', 'lpa', 'knowledge', 'forms'];
    } else {
      permissions = [...DEFAULT_DEPT_PERMISSIONS];
    }
  }

  const users = getUsers();
  const existingIdx = users.findIndex((u) => u.username.toLowerCase() === pending.username.toLowerCase());

  const newUser = {
    username: pending.username,
    displayName: pending.displayName,
    department: pending.department,
    position: pending.position,
    role: targetRole,
    salt: pending.salt,
    hash: pending.hash,
    passwordText: pending.passwordText,
    permissions,
    canManageUsers: targetRole === 'admin',
    createdAt: Date.now()
  };

  if (existingIdx !== -1) {
    users[existingIdx] = newUser;
  } else {
    users.push(newUser);
  }
  saveUsers(users);

  // If Supabase configured, update profile status to active in Cloud
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const cloudPosition = pending.position
        ? (pending.salt && pending.hash ? `${pending.position}:::cred:${pending.salt}:${pending.hash}` : pending.position)
        : (pending.salt && pending.hash ? `:::cred:${pending.salt}:${pending.hash}` : '');

      await client.from('profiles').update({
        status: 'active',
        role: targetRole,
        position: cloudPosition || pending.position,
        permissions,
        can_manage_users: targetRole === 'admin',
        updated_at: new Date().toISOString()
      }).eq('username', pending.username);
    } catch (e) {
      console.warn('Supabase profile activation sync:', e);
    }
  }

  // Remove from pending list
  pendingList.splice(idx, 1);
  savePendingUsers(pendingList);
  return newUser;
}

export async function rejectPendingUser(pendingId) {
  const pendingList = getPendingUsers();
  const pending = pendingList.find((p) => p.id === pendingId || p.username === pendingId);
  const filtered = pendingList.filter((p) => p.id !== pendingId && p.username !== pendingId);
  savePendingUsers(filtered);

  if (pending && isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      await client.from('profiles').delete().eq('username', pending.username);
    } catch (e) {
      console.warn('Supabase reject pending user error:', e);
    }
  }
}

export async function updateUser(username, updates) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) throw new Error('ไม่พบผู้ใช้งานนี้ในระบบ');

  const oldUsername = users[idx].username;
  let targetUsername = oldUsername;

  if (updates.newUsername) {
    const cleanNew = updates.newUsername.trim().toLowerCase();
    if (!cleanNew) {
      throw new Error('ชื่อผู้ใช้ (Username) ต้องไม่เว้นว่าง');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanNew)) {
      throw new Error('ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีดล่าง (_) เท่านั้น');
    }
    if (cleanNew !== oldUsername.toLowerCase()) {
      if (users.some((u, i) => i !== idx && u.username.toLowerCase() === cleanNew)) {
        throw new Error(`ชื่อผู้ใช้ "${updates.newUsername}" มีอยู่ในระบบแล้ว`);
      }
      targetUsername = cleanNew;
    }
  }

  const { newUsername, newPassword, ...restUpdates } = updates;
  const user = { ...users[idx], ...restUpdates, username: targetUsername };

  if (newPassword) {
    user.salt = generateSalt();
    user.hash = await hashPassword(newPassword, user.salt);
    user.passwordText = newPassword;
  }
  users[idx] = user;
  saveUsers(users);

  // If updating currently logged in user, refresh session
  const currentSession = getSession();
  if (currentSession?.username.toLowerCase() === oldUsername.toLowerCase()) {
    startSession(user, currentSession.remember);
  }

  // If the renamed user was the last remembered username, update it to targetUsername
  try {
    const lastUser = localStorage.getItem(LAST_USERNAME_KEY);
    if (lastUser && lastUser.toLowerCase() === oldUsername.toLowerCase()) {
      localStorage.setItem(LAST_USERNAME_KEY, targetUsername);
    }
  } catch (e) {
    console.error(e);
  }

  // Sync to Cloud Supabase profiles
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const cleanPos = user.position || '';
      const cloudPosition = cleanPos
        ? (user.salt && user.hash ? `${cleanPos}:::cred:${user.salt}:${user.hash}` : cleanPos)
        : (user.salt && user.hash ? `:::cred:${user.salt}:${user.hash}` : '');

      await client.from('profiles').upsert({
        username: targetUsername,
        display_name: user.displayName,
        department: user.department,
        position: cloudPosition,
        role: user.role || 'user',
        permissions: user.permissions || [],
        can_manage_users: user.role === 'admin',
        updated_at: new Date().toISOString()
      }, { onConflict: 'username' });

      if (targetUsername !== oldUsername) {
        await client.from('profiles').delete().eq('username', oldUsername);
      }
    } catch (e) {
      console.warn('Supabase updateUser sync:', e);
    }
  }

  return user;
}

export function updateUserPermissions(username, permissions) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return null;
  users[idx].permissions = permissions;
  saveUsers(users);

  const currentSession = getSession();
  if (currentSession?.username.toLowerCase() === username.toLowerCase()) {
    startSession(users[idx], currentSession.remember);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      client.from('profiles').update({
        permissions,
        updated_at: new Date().toISOString()
      }).eq('username', username).catch((e) => console.warn(e));
    } catch (e) {
      console.warn(e);
    }
  }

  return users[idx];
}

export function deleteUser(username) {
  const users = getUsers();
  const target = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (target?.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1) {
    throw new Error('ไม่สามารถลบบัญชีผู้ดูแลระบบ (ADMIN) คนสุดท้ายได้');
  }
  const updated = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
  saveUsers(updated);

  // If deleted user was the remembered username, clear it
  try {
    const lastUser = localStorage.getItem(LAST_USERNAME_KEY);
    if (lastUser && lastUser.toLowerCase() === username.toLowerCase()) {
      localStorage.removeItem(LAST_USERNAME_KEY);
    }
  } catch (e) {
    console.error(e);
  }

  if (isSupabaseConfigured() && target) {
    try {
      const client = getSupabaseClient();
      client.from('profiles').delete().eq('username', target.username).catch((e) => console.warn(e));
    } catch (e) {
      console.warn(e);
    }
  }
}

export function resetUsersToDefault() {
  saveUsers(DEFAULT_INITIAL_USERS);
  return DEFAULT_INITIAL_USERS;
}

// -------------------------------------------------------------
// Authentication & Session
// -------------------------------------------------------------

export async function verifyLogin(username, password) {
  const trimmed = username ? username.trim().toLowerCase() : '';
  if (trimmed === 'guest') {
    const users = getUsers();
    const guestUser = users.find((u) => u.username === 'guest' || u.role === 'guest');
    if (guestUser) return guestUser;
  }

  // If logging in with health, automatically map to office (สำนักปลัด)
  const lookupUser = trimmed === 'health' ? 'office' : username;
  const user = getUserByUsername(lookupUser);

  // 1. Check local users cache
  if (user) {
    if (user.hash && user.salt) {
      const hash = await hashPassword(password, user.salt);
      if (hash === user.hash) return user;
    }
    if (user.passwordText && user.passwordText === password) {
      return user;
    }
  }

  // 2. Cross-device check: Query Supabase Cloud if user was created or approved on another device
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data: cloudUser, error } = await client
        .from('profiles')
        .select('*')
        .eq('username', trimmed)
        .maybeSingle();

      if (cloudUser) {
        if (cloudUser.status === 'pending') {
          throw new Error('บัญชีนี้อยู่ระหว่างรอผู้ดูแลระบบ (ADMIN) อนุมัติการเข้าใช้งาน');
        }

        if (cloudUser.status === 'active') {
          let pos = cloudUser.position || '';
          let salt = '';
          let hash = '';
          if (pos.includes(':::cred:')) {
            const parts = pos.split(':::cred:');
            pos = parts[0] || '';
            const credParts = (parts[1] || '').split(':');
            salt = credParts[0] || '';
            hash = credParts[1] || '';
          }

          if (salt && hash) {
            const calculatedHash = await hashPassword(password, salt);
            if (calculatedHash === hash) {
              const users = getUsers();
              const validUser = {
                username: cloudUser.username,
                displayName: cloudUser.display_name,
                department: cloudUser.department,
                position: pos,
                role: cloudUser.role || 'staff',
                salt,
                hash,
                permissions: cloudUser.permissions || [...DEFAULT_DEPT_PERMISSIONS],
                canManageUsers: cloudUser.role === 'admin' || !!cloudUser.can_manage_users,
                createdAt: cloudUser.created_at ? new Date(cloudUser.created_at).getTime() : Date.now()
              };
              const idx = users.findIndex((u) => u.username.toLowerCase() === trimmed);
              if (idx !== -1) {
                users[idx] = validUser;
              } else {
                users.push(validUser);
              }
              saveUsers(users);
              return validUser;
            }
          }
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('รอผู้ดูแลระบบ')) {
        throw err;
      }
      console.warn('verifyLogin Supabase notice:', err);
    }
  }

  return null;
}

export function loginAsGuest() {
  const users = getUsers();
  let guestUser = users.find((u) => u.username === 'guest' || u.role === 'guest');
  if (!guestUser) {
    guestUser = {
      username: 'guest',
      displayName: 'ผู้เยี่ยมชม (Guest)',
      position: 'ผู้เยี่ยมชมทั่วไป / ประชาชน',
      department: 'ผู้เยี่ยมชม',
      role: 'guest',
      passwordText: '',
      permissions: ['public-overview'],
      canManageUsers: false,
      createdAt: Date.now()
    };
    users.push(guestUser);
    saveUsers(users);
  }
  guestUser.permissions = ['public-overview'];
  return startSession(guestUser, false);
}

export function startSession(user, remember = true, isImpersonating = false) {
  const orgName = user.organization || user.orgName || null;
  const session = {
    username: user.username,
    displayName: user.displayName,
    organization: orgName,
    department: user.department,
    position: user.position,
    role: user.role || 'user',
    permissions: user.permissions || [],
    canManageUsers: !!user.canManageUsers,
    remember: !!remember,
    isImpersonating: !!isImpersonating,
    expiresAt: remember ? null : Date.now() + DEFAULT_SESSION_MS,
    loginAt: Date.now()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  if (orgName) {
    try {
      const rawOrg = localStorage.getItem('ia_org_profile');
      const parsedOrg = rawOrg ? JSON.parse(rawOrg) : {};
      const updatedOrg = {
        ...parsedOrg,
        name: orgName
      };
      localStorage.setItem('ia_org_profile', JSON.stringify(updatedOrg));
      window.dispatchEvent(new CustomEvent('ia-org-profile-changed', { detail: updatedOrg }));
    } catch (e) {
      console.warn('Update orgProfile on startSession notice:', e);
    }
  }

  return session;
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    // Always synchronize live permissions, role, and department from the master users list
    // so any changes made by ADMIN in User Management take effect immediately across all sessions
    const users = getUsers();
    const currentUser = users.find(
      (u) => (u.username || '').toLowerCase() === (session.username || '').toLowerCase()
    );

    if (currentUser) {
      if (Array.isArray(currentUser.permissions)) {
        session.permissions = [...currentUser.permissions];
      }
      if (currentUser.role) {
        session.role = currentUser.role;
      }
      if (currentUser.department) {
        session.department = currentUser.department;
      }
      if (currentUser.organization) {
        session.organization = currentUser.organization;
      }
    } else if (session.role === 'guest') {
      const guestUser = users.find((u) => u.username === 'guest' || u.role === 'guest');
      if (guestUser && Array.isArray(guestUser.permissions)) {
        session.permissions = [...guestUser.permissions];
      }
    }

    if (session.permissions && Array.isArray(session.permissions)) {
      if (session.role !== 'admin' && session.role !== 'executive') {
        session.permissions = session.permissions.filter((p) => p !== 'executive-dashboard');
      }
    }
    return session;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getSession();
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// Quick switch session without needing password (useful for Admin previewing user views)
export function switchSessionTo(username, isImpersonating = true) {
  const user = getUserByUsername(username);
  if (!user) return null;
  return startSession(user, true, isImpersonating);
}

// Backward compatibility helpers for ChangePasswordModal
export function getAccount() {
  const session = getSession();
  if (session) {
    return getUserByUsername(session.username);
  }
  const users = getUsers();
  return users[0] || null;
}

export function hasAccount() {
  return getUsers().length > 0;
}

export async function changeCredentials(currentPassword, newUsername, newPassword) {
  const session = getSession();
  const usernameToChange = session ? session.username : 'admin';
  const user = getUserByUsername(usernameToChange);
  if (!user) throw new Error('ไม่พบบัญชีผู้ใช้งานในระบบ');

  const valid = await verifyLogin(user.username, currentPassword);
  if (!valid) throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');

  await updateUser(user.username, {
    displayName: newUsername || user.displayName,
    newPassword
  });
}

