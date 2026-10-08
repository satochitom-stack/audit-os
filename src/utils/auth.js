// ระบบยืนยันตัวตนและการจัดการสิทธิ์ผู้ใช้งานหลายระดับ (Multi-Tenant RBAC & Subscription Billing)
// สถาปัตยกรรมเฉพาะสำหรับ "ผู้ตรวจสอบภายใน อปท." (Internal Auditor Workbench) และ "ผู้ดูแลระบบกลาง" (Super Admin Backoffice)
// รองรับการแยกข้อมูลของแต่ละ User เป็นเอกเทศ (Multi-Tenant Isolation) และคลังเอกสารกลาง

import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';

const USERS_KEY = 'ia_auth_users';
const SESSION_KEY = 'ia_auth_session';
const OLD_ACCOUNT_KEY = 'ia_auth_account';
export const LAST_USERNAME_KEY = 'ia_last_username';
export const PENDING_USERS_KEY = 'ia_pending_users';
export const SETTINGS_KEY = 'ia_system_settings';
export const PAYMENTS_KEY = 'ia_billing_payments';

export const ENTERPRISE_ROLES = [
  { id: 'admin', label: 'ผู้ดูแลระบบส่วนกลาง (Super Admin)', desc: 'จัดการระบบหลังบ้าน, ควบคุมสมาชิก, ตรวจสอบการชำระเงิน และตั้งค่าระบบ' },
  { id: 'auditor', label: 'ผู้ตรวจสอบภายใน อปท. (Internal Auditor)', desc: 'เข้าใช้งานเครื่องมือปฏิบัติงานตรวจสอบภายใน 12 ขั้นตอนครบวงจร' }
];

export const MEMBERSHIP_PLANS = {
  trial: {
    id: 'trial',
    name: 'ทดลองใช้งานฟรี (Free Trial 30 วัน)',
    price: 0,
    priceLabel: 'ฟรี 30 วัน',
    durationDays: 30,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
  },
  monthly: {
    id: 'monthly',
    name: 'สมาชิกรายเดือน (Monthly)',
    price: 299,
    priceLabel: '฿299 / เดือน',
    durationDays: 30,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
  },
  annual: {
    id: 'annual',
    name: 'สมาชิกรายปี (Annual - แนะนำ)',
    price: 2990,
    priceLabel: '฿2,990 / ปี',
    durationDays: 365,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
  }
};

export function getSystemSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    trialDays: 30,
    monthlyPrice: 299,
    annualPrice: 2990,
    bankName: 'ธนาคารกรุงไทย',
    bankAccountNo: '123-4-56789-0',
    bankAccountName: 'ผู้ดูแลระบบ Audit-OS',
    promptPayNo: '081-234-5678',
    announcement: 'ยินดีต้อนรับสู่ Audit-OS ระบบบริหารงานตรวจสอบภายใน อปท. ประจำปีงบประมาณ พ.ศ. 2569'
  };
}

export function saveSystemSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getPaymentRecords() {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

export function savePaymentRecords(records) {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(records));
}

// -------------------------------------------------------------
// Multi-Tenant Isolated Storage Helpers
// -------------------------------------------------------------
export function getTenantStorageKey(baseKey, userOrSession) {
  const username = typeof userOrSession === 'string'
    ? userOrSession
    : userOrSession?.username || (typeof getSession === 'function' ? getSession()?.username : null);

  if (!username || username.toLowerCase() === 'admin') {
    return `${baseKey}_tenant_admin`;
  }
  return `${baseKey}_tenant_${username.toLowerCase()}`;
}

export function loadTenantData(baseKey, defaultVal, userOrSession) {
  try {
    const key = getTenantStorageKey(baseKey, userOrSession);
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    // Backward compatibility fallback to unprefixed baseKey
    const legacy = localStorage.getItem(baseKey);
    if (legacy !== null) {
      return JSON.parse(legacy);
    }
  } catch (e) {
    console.warn(`Error loading tenant data for ${baseKey}:`, e);
  }
  return defaultVal;
}

export function saveTenantData(baseKey, value, userOrSession) {
  try {
    const key = getTenantStorageKey(baseKey, userOrSession);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving tenant data for ${baseKey}:`, e);
  }
}

// -------------------------------------------------------------
// Departments list
// -------------------------------------------------------------
export const DEFAULT_DEPARTMENTS = [
  'สำนักปลัด',
  'กองคลัง',
  'กองช่าง',
  'กองการศึกษา',
  'กองสวัสดิการสังคม',
  'กองสาธารณสุขและสิ่งแวดล้อม',
  'หน่วยตรวจสอบภายใน'
];

const DEPARTMENTS_KEY = 'ia_departments';

export function getDepartments() {
  try {
    const raw = localStorage.getItem(DEPARTMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return [...DEFAULT_DEPARTMENTS];
}

export function saveDepartments(departments) {
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
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

export function updateDepartment(oldName, newName) {
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();
  if (!cleanNew) throw new Error('กรุณาระบุชื่อสำนัก/กองใหม่');
  const depts = getDepartments();
  const idx = depts.findIndex((d) => d.toLowerCase() === cleanOld.toLowerCase());
  if (idx === -1) throw new Error('ไม่พบสำนัก/กองเดิมในระบบ');
  depts[idx] = cleanNew;
  saveDepartments(depts);
  return depts;
}

export function deleteDepartment(name) {
  const clean = name.trim();
  if (clean === 'หน่วยตรวจสอบภายใน') {
    throw new Error('ไม่สามารถลบ "หน่วยตรวจสอบภายใน" ได้');
  }
  const depts = getDepartments();
  const updated = depts.filter((d) => d.toLowerCase() !== clean.toLowerCase());
  saveDepartments(updated);
  return updated;
}

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

// -------------------------------------------------------------
// Menu Identifiers for Internal Auditor 12-Step Lifecycle
// -------------------------------------------------------------
export const ALL_MENU_IDS = [
  { id: 'audit-risk', label: '1. ประเมินความเสี่ยง SOFCK', icon: 'ShieldAlert', desc: 'ขั้นตอนที่ 1: วิเคราะห์เกณฑ์ SOFCK 5 ด้าน และจัดทำผังความเสี่ยง (Audit Universe)' },
  { id: 'strategic-plan', label: '2. แผนระยะยาว 3 ปี & คน-วัน', icon: 'Calendar', desc: 'ขั้นตอนที่ 2: คำนวณวันทำการตรวจสอบ (Man-Day Capacity) และจัดทำแผน 3 ปี' },
  { id: 'planning', label: '3. แผนตรวจสอบประจำปี & ขออนุมัติ', icon: 'FileText', desc: 'ขั้นตอนที่ 3: แผนการตรวจสอบประจำปี บันทึกขออนุมัตินายก และกฎบัตร' },
  { id: 'engagement-plan', label: '4. แผนปฏิบัติงาน & แนวตรวจ ว 614', icon: 'Sparkles', desc: 'ขั้นตอนที่ 4: แผนปฏิบัติงานเฉพาะเรื่อง วัตถุประสงค์ ขอบเขต และแนวการตรวจ' },
  { id: 'opening-meeting', label: '5. ประชุมเปิดการตรวจสอบ', icon: 'Users', desc: 'ขั้นตอนที่ 5: หนังสือแจ้งเข้าตรวจล่วงหน้า และบันทึกรายงานการประชุมเปิดตรวจ' },
  { id: 'execution', label: '6. กระดาษทำการ 6 ภารกิจ & ช่าง', icon: 'ClipboardCheck', desc: 'ขั้นตอนที่ 6: กระดาษทำการตรวจรับเงิน, บัญชี, พัสดุ, หลักประกัน, เบิกจ่าย, รถยนต์, และงานช่าง' },
  { id: 'closing-meeting', label: '7. ประชุมปิดการตรวจสอบ', icon: 'CheckCircle2', desc: 'ขั้นตอนที่ 7: สรุปข้อตรวจพบเบื้องต้น รับฟังคำชี้แจง และบันทึกรายงานปิดตรวจ' },
  { id: 'reporting', label: '8. รายงานผลการตรวจสอบ & สรุป', icon: 'FileSpreadsheet', desc: 'ขั้นตอนที่ 8: รายงานผลตามมาตรฐาน 5 องค์ประกอบ และบันทึกเสนอนายก อปท.' },
  { id: 'tracking-register', label: '9. ทะเบียนคุม & ติดตามผล 30 วัน', icon: 'Clock', desc: 'ขั้นตอนที่ 9: ทะเบียนคุมการปฏิบัติตามข้อเสนอแนะ และหนังสือติดตามผลครบ 30 วัน' },
  { id: 'central-hub', label: '10. คลังเอกสารกลาง & ระเบียบ', icon: 'BookOpen', desc: 'ขั้นตอนที่ 10: คลังระเบียบ กฎหมาย สไลด์หลักสูตรทอง 2569 และตัวอย่างกระดาษทำการ' },
  { id: 'audit-toolkits', label: '11. เครื่องมือช่วยคำนวณ & สุ่มตัวอย่าง', icon: 'Wrench', desc: 'ขั้นตอนที่ 11: คำนวณ Factor F, ค่าปรับจัดซื้อจัดจ้าง, สุ่มตัวอย่างทางสถิติ' },
  { id: 'backoffice', label: '12. ระบบหลังบ้าน Super Admin', icon: 'Settings', desc: 'ขั้นตอนที่ 12: จัดการสมาชิกผู้ตรวจสอบ อนุมัติสิทธิ์ และควบคุมค่าสมาชิกรายเดือน/รายปี (ADMIN Only)' }
];

export const DEFAULT_DEPT_PERMISSIONS = ALL_MENU_IDS.map((m) => m.id).filter((id) => id !== 'backoffice');

export const DEFAULT_INITIAL_USERS = [
  {
    username: 'admin',
    displayName: 'ผู้ดูแลระบบส่วนกลาง (Super Admin)',
    position: 'ผู้ดูแลระบบระบบตรวจสอบภายใน',
    department: 'หน่วยตรวจสอบกลาง',
    organization: 'Audit-OS แพลตฟอร์มกลาง',
    province: 'ส่วนกลาง',
    phone: '081-234-5678',
    role: 'admin',
    passwordText: 'admin',
    permissions: ALL_MENU_IDS.map((m) => m.id),
    canManageUsers: true,
    plan: 'lifetime',
    status: 'active',
    createdAt: Date.now()
  },
  {
    username: 'auditor',
    displayName: 'ผู้ตรวจสอบภายใน (ตัวอย่าง)',
    position: 'นักวิชาการตรวจสอบภายในชำนาญการ',
    department: 'หน่วยตรวจสอบภายใน',
    organization: 'องค์การบริหารส่วนตำบลต้นแบบ',
    province: 'อุบลราชธานี',
    phone: '089-876-5432',
    role: 'auditor',
    passwordText: '1234',
    permissions: ALL_MENU_IDS.map((m) => m.id).filter((id) => id !== 'backoffice'),
    canManageUsers: false,
    plan: 'annual',
    status: 'active',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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
// Auto-Repair & Migration
// -------------------------------------------------------------
export function autoRepairDataLinkages() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    let users = raw ? JSON.parse(raw) : [];

    // Purge obsolete executive and municipal department logins (mayor, palat, office, finance, etc.)
    const obsoleteUsernames = ['mayor', 'palat', 'office', 'finance', 'engineering', 'education', 'welfare', 'cdc_charoen', 'cdc_fangthoeng', 'health', 'guest'];
    users = users.filter((u) => !obsoleteUsernames.includes(u.username?.toLowerCase()));

    // Ensure Super Admin exists
    let admin = users.find((u) => u.username === 'admin');
    if (!admin) {
      admin = { ...DEFAULT_INITIAL_USERS[0] };
      users.unshift(admin);
    } else {
      admin.role = 'admin';
      admin.canManageUsers = true;
      admin.permissions = ALL_MENU_IDS.map((m) => m.id);
      if (!admin.passwordText) admin.passwordText = 'admin';
    }

    // Ensure Demo Auditor exists
    let demoAuditor = users.find((u) => u.username === 'auditor');
    if (!demoAuditor) {
      demoAuditor = { ...DEFAULT_INITIAL_USERS[1] };
      users.push(demoAuditor);
    } else {
      demoAuditor.role = 'auditor';
      demoAuditor.permissions = ALL_MENU_IDS.map((m) => m.id).filter((id) => id !== 'backoffice');
    }

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Update active session if necessary
    const sess = getSession();
    if (sess) {
      if (sess.username === 'admin') {
        sess.role = 'admin';
        sess.permissions = ALL_MENU_IDS.map((m) => m.id);
        localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      } else if (sess.username === 'auditor') {
        sess.role = 'auditor';
        sess.permissions = ALL_MENU_IDS.map((m) => m.id).filter((id) => id !== 'backoffice');
        localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      }
    }
  } catch (e) {
    console.error('autoRepairDataLinkages error:', e);
  }
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
        return users;
      }
    }
  } catch (e) {
    console.error(e);
  }
  saveUsers(DEFAULT_INITIAL_USERS);
  return DEFAULT_INITIAL_USERS;
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUserByUsername(username) {
  const users = getUsers();
  return users.find((u) => u.username?.toLowerCase() === username?.trim().toLowerCase()) || null;
}

export async function addUser({ username, displayName, organization, province, position, role = 'auditor', password, plan = 'annual' }) {
  const users = getUsers();
  const cleanUsername = username.trim().toLowerCase();
  if (users.some((u) => u.username?.toLowerCase() === cleanUsername)) {
    throw new Error(`ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว`);
  }

  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const durationDays = plan === 'monthly' ? 30 : plan === 'trial' ? 14 : 365;

  const newUser = {
    username: cleanUsername,
    displayName: displayName.trim(),
    organization: organization?.trim() || 'อปท.',
    province: province?.trim() || '',
    position: position?.trim() || 'นักวิชาการตรวจสอบภายใน',
    department: 'หน่วยตรวจสอบภายใน',
    role: role || 'auditor',
    salt,
    hash,
    passwordText: password,
    permissions: ALL_MENU_IDS.map((m) => m.id).filter((id) => id !== 'backoffice'),
    canManageUsers: role === 'admin',
    plan,
    status: 'active',
    expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: Date.now()
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export async function updateUser(username, updates) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.username?.toLowerCase() === username.toLowerCase());
  if (idx === -1) throw new Error('ไม่พบผู้ใช้งานนี้ในระบบ');

  const { newPassword, ...restUpdates } = updates;
  const user = { ...users[idx], ...restUpdates };

  if (newPassword) {
    user.salt = generateSalt();
    user.hash = await hashPassword(newPassword, user.salt);
    user.passwordText = newPassword;
  }

  users[idx] = user;
  saveUsers(users);

  // If updating current session, refresh
  const cur = getSession();
  if (cur?.username?.toLowerCase() === username.toLowerCase()) {
    startSession(user, cur.remember);
  }

  return user;
}

export function deleteUser(username) {
  const clean = username.trim().toLowerCase();
  if (clean === 'admin') throw new Error('ไม่สามารถลบบัญชี Super Admin ได้');
  const users = getUsers();
  const updated = users.filter((u) => u.username?.toLowerCase() !== clean);
  saveUsers(updated);
  return updated;
}

// -------------------------------------------------------------
// Subscription & Member Management Functions
// -------------------------------------------------------------
export function checkUserSubscription(user) {
  if (!user) return { expired: false, daysRemaining: 0, isTrial: false, planName: 'ทั่วไป' };
  if (user.role === 'admin' || user.username === 'admin') {
    return { expired: false, daysRemaining: 9999, isLifetime: true, isTrial: false, planName: 'Super Admin' };
  }
  if (user.plan === 'lifetime') {
    return { expired: false, daysRemaining: 9999, isLifetime: true, isTrial: false, planName: 'ตลอดชีพ (Lifetime)' };
  }
  if (user.status === 'suspended') {
    return { expired: true, daysRemaining: 0, isSuspended: true, reason: 'บัญชีถูกระงับสิทธิ์การใช้งาน', planName: 'ระงับสิทธิ์' };
  }
  if (!user.expiresAt) {
    return { expired: false, daysRemaining: 30, isTrial: user.plan === 'trial', planName: 'สมาชิก' };
  }
  const expiryTime = new Date(user.expiresAt).getTime();
  const now = Date.now();
  const diffMs = expiryTime - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;
  return {
    expired: isExpired,
    daysRemaining,
    expiresAt: user.expiresAt,
    isTrial: user.plan === 'trial',
    planName: user.plan === 'trial' ? 'ทดลองใช้ฟรี 30 วัน' : user.plan === 'annual' ? 'สมาชิกรายปี' : 'สมาชิกรายเดือน'
  };
}

export function extendMemberSubscription(username, extraDays = 30, planId = 'monthly') {
  const users = getUsers();
  const idx = users.findIndex((u) => u.username?.toLowerCase() === username.toLowerCase());
  if (idx === -1) throw new Error('ไม่พบสมาชิกนี้ในระบบ');

  const user = users[idx];
  if (extraDays === 'lifetime' || planId === 'lifetime') {
    users[idx] = {
      ...user,
      plan: 'lifetime',
      status: 'active',
      expiresAt: null
    };
    saveUsers(users);
    return users[idx];
  }

  const now = Date.now();
  let baseTime = now;
  if (user.expiresAt && new Date(user.expiresAt).getTime() > now) {
    baseTime = new Date(user.expiresAt).getTime();
  }

  const numDays = Number(extraDays) || 30;
  const newExpiry = new Date(baseTime + numDays * 24 * 60 * 60 * 1000).toISOString();
  users[idx] = {
    ...user,
    plan: planId || user.plan || 'monthly',
    status: 'active',
    expiresAt: newExpiry
  };

  saveUsers(users);
  return users[idx];
}

// -------------------------------------------------------------
// Registrations Workflow (Instant 30-Day Free Trial - No Waiting for Approval)
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
  return getPendingUsers();
}

export async function registerUser({ username, displayName, organization, province, position, department, phone, email, plan = 'trial', password }) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanOrg = organization ? organization.trim() : '';
  const cleanDisplayName = displayName.trim();

  if (!cleanUsername) throw new Error('กรุณาระบุชื่อผู้ใช้งาน');
  if (!cleanDisplayName) throw new Error('กรุณาระบุชื่อ-นามสกุล');
  if (!cleanOrg) throw new Error('กรุณาระบุองค์กรปกครองส่วนท้องถิ่น (อปท.)');
  if (!password || password.length < 4) throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');

  const existingUsers = getUsers();
  if (existingUsers.some((u) => u.username?.toLowerCase() === cleanUsername)) {
    throw new Error(`ชื่อผู้ใช้ "${cleanUsername}" มีอยู่ในระบบแล้ว`);
  }

  const salt = generateSalt();
  const hash = await hashPassword(password, salt);

  // Instant 30-day Free Trial without waiting for Admin approval
  const trialDurationDays = 30;
  const expiresAt = new Date(Date.now() + trialDurationDays * 24 * 60 * 60 * 1000).toISOString();

  const newUser = {
    username: cleanUsername,
    displayName: cleanDisplayName,
    organization: cleanOrg,
    province: province?.trim() || '',
    position: position?.trim() || 'นักวิชาการตรวจสอบภายใน',
    department: department?.trim() || 'หน่วยตรวจสอบภายใน',
    phone: phone?.trim() || '',
    email: email?.trim() || `${cleanUsername}@ia-os.local`,
    role: 'auditor',
    salt,
    hash,
    passwordText: password,
    permissions: ALL_MENU_IDS.map((m) => m.id).filter((id) => id !== 'backoffice'),
    canManageUsers: false,
    plan: 'trial',
    status: 'active',
    trialDays: 30,
    expiresAt,
    registeredAt: Date.now(),
    createdAt: Date.now()
  };

  existingUsers.push(newUser);
  saveUsers(existingUsers);

  // Keep a record in registration log
  const pendingList = getPendingUsers();
  pendingList.unshift({
    id: 'reg_' + Date.now(),
    username: cleanUsername,
    displayName: cleanDisplayName,
    organization: cleanOrg,
    province: province?.trim() || '',
    position: newUser.position,
    department: newUser.department,
    email: newUser.email,
    requestedPlan: 'trial',
    status: 'active_trial',
    expiresAt,
    requestedAt: Date.now()
  });
  savePendingUsers(pendingList);

  return newUser;
}

export function approveMemberRegistration(pendingId, planId = 'annual', durationDays = 365) {
  const pendingList = getPendingUsers();
  const idx = pendingList.findIndex((p) => p.id === pendingId || p.username === pendingId);
  if (idx === -1) throw new Error('ไม่พบคำขอลงทะเบียนนี้');

  const pending = pendingList[idx];
  const users = getUsers();
  const existingIdx = users.findIndex((u) => u.username?.toLowerCase() === pending.username?.toLowerCase());

  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const newUser = {
    username: pending.username,
    displayName: pending.displayName,
    organization: pending.organization,
    department: 'หน่วยตรวจสอบภายใน',
    position: pending.position || 'นักวิชาการตรวจสอบภายใน',
    province: pending.province || '',
    phone: pending.phone || '',
    role: 'auditor',
    salt: pending.salt,
    hash: pending.hash,
    passwordText: pending.passwordText,
    permissions: ALL_MENU_IDS.map((m) => m.id).filter((id) => id !== 'backoffice'),
    canManageUsers: false,
    plan: planId,
    status: 'active',
    expiresAt,
    createdAt: Date.now()
  };

  if (existingIdx !== -1) {
    users[existingIdx] = newUser;
  } else {
    users.push(newUser);
  }
  saveUsers(users);

  pendingList.splice(idx, 1);
  savePendingUsers(pendingList);

  return newUser;
}

export function rejectMemberRegistration(pendingId) {
  const pendingList = getPendingUsers();
  const filtered = pendingList.filter((p) => p.id !== pendingId && p.username !== pendingId);
  savePendingUsers(filtered);
}

// -------------------------------------------------------------
// Authentication & Verification
// -------------------------------------------------------------
export async function verifyLogin(username, password) {
  const trimmed = username ? username.trim().toLowerCase() : '';
  if (!trimmed) return null;

  // 1. Super Admin shortcut check
  if (trimmed === 'admin') {
    const users = getUsers();
    let adminUser = users.find((u) => u.username === 'admin');
    if (!adminUser) {
      adminUser = { ...DEFAULT_INITIAL_USERS[0] };
      users.unshift(adminUser);
      saveUsers(users);
    }
    if (password === 'admin' || password === 'admin1234' || password === 'admin123' || password === adminUser.passwordText) {
      return adminUser;
    }
    if (adminUser.salt && adminUser.hash) {
      const h = await hashPassword(password, adminUser.salt);
      if (h === adminUser.hash) return adminUser;
    }
  }

  // 2. Demo Auditor shortcut check
  if (trimmed === 'auditor') {
    const users = getUsers();
    let auditorUser = users.find((u) => u.username === 'auditor');
    if (!auditorUser) {
      auditorUser = { ...DEFAULT_INITIAL_USERS[1] };
      users.push(auditorUser);
      saveUsers(users);
    }
    if (password === '1234' || password === auditorUser.passwordText) {
      return auditorUser;
    }
    if (auditorUser.salt && auditorUser.hash) {
      const h = await hashPassword(password, auditorUser.salt);
      if (h === auditorUser.hash) return auditorUser;
    }
  }

  // 3. Registered Auditor lookup
  const user = getUserByUsername(trimmed);
  if (user) {
    if (user.status === 'suspended') {
      throw new Error('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
    }
    if (user.passwordText && user.passwordText === password) {
      return user;
    }
    if (user.salt && user.hash) {
      const h = await hashPassword(password, user.salt);
      if (h === user.hash) return user;
    }
  }

  // 4. Pending check to show informative message
  const pendingList = getPendingUsers();
  const pendingMatch = pendingList.find((p) => p.username?.toLowerCase() === trimmed);
  if (pendingMatch) {
    throw new Error('คำขอลงทะเบียนของท่านอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ (ADMIN)');
  }

  return null;
}

export function startSession(user, remember = true, isImpersonating = false) {
  const orgName = user.organization || 'อบต.ต้นแบบ';
  const session = {
    username: user.username,
    displayName: user.displayName,
    organization: orgName,
    department: user.department || 'หน่วยตรวจสอบภายใน',
    position: user.position || 'นักวิชาการตรวจสอบภายใน',
    role: user.role || 'auditor',
    permissions: user.permissions || ALL_MENU_IDS.map((m) => m.id).filter((id) => id !== 'backoffice'),
    canManageUsers: user.role === 'admin',
    plan: user.plan || 'annual',
    expiresAt: user.expiresAt || null,
    remember: !!remember,
    isImpersonating: !!isImpersonating,
    loginAt: Date.now()
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Sync org name to profile
  if (orgName) {
    try {
      const rawOrg = localStorage.getItem('ia_org_profile');
      const parsedOrg = rawOrg ? JSON.parse(rawOrg) : {};
      const updatedOrg = { ...parsedOrg, name: orgName };
      localStorage.setItem('ia_org_profile', JSON.stringify(updatedOrg));
      window.dispatchEvent(new CustomEvent('ia-org-profile-changed', { detail: updatedOrg }));
    } catch (_) {}
  }

  return session;
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);

    const users = getUsers();
    const currentUser = users.find(
      (u) => (u.username || '').toLowerCase() === (session.username || '').toLowerCase()
    );

    if (currentUser) {
      session.role = currentUser.role;
      session.organization = currentUser.organization;
      session.permissions = currentUser.permissions || [];
      session.plan = currentUser.plan;
      session.expiresAt = currentUser.expiresAt;
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

export function switchSessionTo(username, isImpersonating = true) {
  const user = getUserByUsername(username);
  if (!user) return null;
  return startSession(user, true, isImpersonating);
}

export function loginAsGuest() {
  const users = getUsers();
  let auditorUser = users.find((u) => u.username === 'auditor');
  if (!auditorUser) {
    auditorUser = DEFAULT_INITIAL_USERS[1];
  }
  return startSession(auditorUser, false);
}

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

// Backward-compatible shims for legacy callers
export function approvePendingUser(id, assignedPlan = 'annual') {
  return approveMemberRegistration(id, assignedPlan);
}

export function rejectPendingUser(id) {
  return rejectMemberRegistration(id);
}

export function updateUserPermissions(username, permissions) {
  return updateUser(username, { permissions });
}

export function resetUsersToDefault() {
  saveUsers(DEFAULT_INITIAL_USERS);
  return DEFAULT_INITIAL_USERS;
}
