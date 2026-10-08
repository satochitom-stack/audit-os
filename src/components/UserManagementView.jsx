import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Key,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  Lock,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  CheckSquare,
  Square,
  Save,
  Cloud,
  Database,
  ExternalLink,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Upload,
  Download
} from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from '../data/supabaseSchemaSql';
import ConfirmModal from './ConfirmModal';
import {
  ALL_MENU_IDS,
  getUsers,
  saveUsers,
  addUser,
  updateUser,
  updateUserPermissions,
  deleteUser,
  resetUsersToDefault,
  switchSessionTo,
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getPendingUsers,
  pullPendingUsersFromCloud,
  approvePendingUser,
  rejectPendingUser,
  ENTERPRISE_ROLES
} from '../utils/auth';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  getSupabaseClient
} from '../services/supabaseClient';
import { cloudSyncService } from '../services/cloudSyncService';

export default function UserManagementView({ currentSession, onSwitchSession, onRefreshUser, initialTab = 'matrix' }) {
  const [users, setUsers] = useState(() => getUsers());
  const [departments, setDepartments] = useState(() => getDepartments());
  const [pendingUsers, setPendingUsers] = useState(() => getPendingUsers());
  const [activeTab, setActiveTab] = useState(initialTab); // 'matrix', 'accounts', 'departments', 'pending', 'cloud'
  const [toastMessage, setToastMessage] = useState('');

  // Supabase Cloud Configuration States
  const [cloudUrl, setCloudUrl] = useState(() => getSupabaseConfig().url);
  const [cloudAnonKey, setCloudAnonKey] = useState(() => getSupabaseConfig().anonKey);
  const [isCloudConfigured, setIsCloudConfigured] = useState(() => isSupabaseConfigured());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); // { success: boolean, message: string }
  const [copiedSql, setCopiedSql] = useState(false);

  // Pending user role selection map { [pendingId]: role }
  const [selectedPendingRoles, setSelectedPendingRoles] = useState({});

  // Confirm Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    type: 'danger',
    onConfirm: () => {}
  });

  const openConfirmModal = (config) => {
    setConfirmModalConfig({
      isOpen: true,
      confirmText: 'ยืนยัน',
      type: 'danger',
      ...config
    });
  };

  const closeConfirmModal = () => {
    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // New/Edit User Form
  const [formUsername, setFormUsername] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formDepartment, setFormDepartment] = useState('กองคลัง');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptName, setCustomDeptName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formPermissions, setFormPermissions] = useState(['public-overview', 'risk-management', 'knowledge', 'forms']);
  const [formError, setFormError] = useState('');

  // Department Tab States
  const [newDeptInput, setNewDeptInput] = useState('');
  const [editingDeptOldName, setEditingDeptOldName] = useState(null);
  const [editingDeptNewName, setEditingDeptNewName] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const refreshList = async () => {
    const cloudPending = await pullPendingUsersFromCloud();
    setUsers(getUsers());
    setDepartments(getDepartments());
    setPendingUsers(cloudPending || getPendingUsers());
    setIsCloudConfigured(isSupabaseConfigured());
    if (onRefreshUser) onRefreshUser();
  };

  useEffect(() => {
    // Initial fetch of pending users from Supabase Cloud on mount
    pullPendingUsersFromCloud().then((list) => {
      if (Array.isArray(list)) setPendingUsers(list);
    });

    const handlePendingChange = () => setPendingUsers(getPendingUsers());
    const handleCloudChange = () => {
      setIsCloudConfigured(isSupabaseConfigured());
      setCloudUrl(getSupabaseConfig().url);
      setCloudAnonKey(getSupabaseConfig().anonKey);
    };
    window.addEventListener('ia-pending-users-changed', handlePendingChange);
    window.addEventListener('ia-supabase-config-changed', handleCloudChange);

    // Supabase Realtime channel for live updates when someone registers
    let channel = null;
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        channel = client
          .channel('usermgmt-profiles-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            pullPendingUsersFromCloud().then((list) => {
              if (Array.isArray(list)) setPendingUsers(list);
            });
          })
          .subscribe();
      }
    }

    return () => {
      window.removeEventListener('ia-pending-users-changed', handlePendingChange);
      window.removeEventListener('ia-supabase-config-changed', handleCloudChange);
      if (channel && isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) client.removeChannel(channel);
      }
    };
  }, []);

  const handleApproveUser = (pending) => {
    const roleToAssign = selectedPendingRoles[pending.id] || pending.role || 'staff';
    openConfirmModal({
      title: 'อนุมัติการเข้าใช้งาน',
      message: `ยืนยันการอนุมัติบัญชี "${pending.displayName}" (@${pending.username}) สังกัด "${pending.department}" ในบทบาท "${roleToAssign}" ใช่หรือไม่? ผู้ใช้จะสามารถเข้าสู่ระบบและปฏิบัติงานได้ทันที`,
      confirmText: 'อนุมัติผู้ใช้งาน',
      type: 'info',
      onConfirm: async () => {
        try {
          await approvePendingUser(pending.id, roleToAssign);
          await refreshList();
          showToast(`✓ อนุมัติผู้ใช้งาน @${pending.username} เรียบร้อยแล้ว`);
        } catch (err) {
          showToast(`เกิดข้อผิดพลาด: ${err.message}`);
        }
      }
    });
  };

  const handleRejectUser = (pending) => {
    openConfirmModal({
      title: 'ปฏิเสธคำขอลงทะเบียน',
      message: `คุณต้องการปฏิเสธคำขอลงทะเบียนของ "${pending.displayName}" (@${pending.username}) ใช่หรือไม่?`,
      confirmText: 'ปฏิเสธคำขอ',
      type: 'danger',
      onConfirm: async () => {
        try {
          await rejectPendingUser(pending.id);
          await refreshList();
          showToast(`ปฏิเสธคำขอของ @${pending.username} แล้ว`);
        } catch (err) {
          showToast(`เกิดข้อผิดพลาด: ${err.message}`);
        }
      }
    });
  };

  const handleTestCloudConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await testSupabaseConnection(cloudUrl, cloudAnonKey);
      setConnectionStatus(res);
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(`เชื่อมต่อไม่สำเร็จ: ${res.message}`);
      }
    } catch (err) {
      setConnectionStatus({ success: false, message: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveCloudConfig = async () => {
    if (!cloudUrl.trim() || !cloudAnonKey.trim()) {
      showToast('กรุณาระบุทั้ง Project URL และ Anon Key');
      return;
    }
    setTestingConnection(true);
    const res = await testSupabaseConnection(cloudUrl, cloudAnonKey);
    setTestingConnection(false);
    setConnectionStatus(res);

    if (res.success) {
      saveSupabaseConfig(cloudUrl, cloudAnonKey);
      setIsCloudConfigured(true);
      showToast('✓ บันทึกการเชื่อมต่อ Supabase เรียบร้อยแล้ว!');
    } else {
      openConfirmModal({
        title: 'ยืนยันบันทึกแม้การทดสอบไม่ผ่าน',
        message: `ระบบทดสอบเชื่อมต่อไปยัง Supabase ไม่สำเร็จ (${res.message}) ต้องการบันทึกข้อมูลนี้ไว้หรือไม่?`,
        confirmText: 'บันทึกต่อไป',
        type: 'danger',
        onConfirm: () => {
          saveSupabaseConfig(cloudUrl, cloudAnonKey);
          setIsCloudConfigured(true);
          showToast('บันทึกการตั้งค่าแล้ว');
        }
      });
    }
  };

  const handleDisconnectCloud = () => {
    openConfirmModal({
      title: 'ยกเลิกการเชื่อมต่อ Cloud',
      message: 'ต้องการตัดการเชื่อมต่อจาก Supabase และสลับกลับไปใช้โหมด Local Storage ในเครื่องใช่หรือไม่?',
      confirmText: 'ตัดการเชื่อมต่อ',
      type: 'danger',
      onConfirm: () => {
        saveSupabaseConfig('', '');
        setCloudUrl('');
        setCloudAnonKey('');
        setIsCloudConfigured(false);
        setConnectionStatus(null);
        showToast('สลับกลับสู่โหมด Local Storage แล้ว');
      }
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    showToast('📋 คัดลอกสคริปต์ SQL เรียบร้อยแล้ว! นำไปวางใน SQL Editor บน Supabase ได้ทันที');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleUploadAllToCloudFromUsers = async () => {
    try {
      showToast('กำลังเตรียมข้อมูลและอัปโหลดขึ้น Supabase...');
      const saved = localStorage.getItem('ia_risk_management_by_year');
      const rmData = saved ? JSON.parse(saved) : {};
      const res = await cloudSyncService.pushAllRiskManagement(rmData);
      showToast(`✓ อัปโหลดข้อมูลแบบ บส. ทุกกองขึ้น Supabase สำเร็จแล้ว (${res.count} รายการ)! ทุกเครื่องจะเห็นข้อมูลนี้ทันที`);
    } catch (e) {
      showToast(`อัปโหลดไม่สำเร็จ: ${e.message}`, 'error');
    }
  };

  const handlePullAllFromCloudFromUsers = async () => {
    try {
      showToast('กำลังดึงข้อมูลจาก Supabase...');
      const cloudData = await cloudSyncService.pullAllRiskManagement();
      if (cloudData && Object.keys(cloudData).length > 0) {
        const saved = localStorage.getItem('ia_risk_management_by_year');
        const local = saved ? JSON.parse(saved) : {};
        const merged = { ...local, ...cloudData };
        localStorage.setItem('ia_risk_management_by_year', JSON.stringify(merged));
        showToast('✓ ดึงข้อมูลล่าสุดจาก Supabase และบันทึกลงในเครื่องเรียบร้อยแล้ว!');
        if (onRefreshUser) onRefreshUser();
      } else {
        showToast('ไม่พบข้อมูลบน Cloud หรือข้อมูลเป็นปัจจุบันอยู่แล้ว');
      }
    } catch (e) {
      showToast(`ดึงข้อมูลไม่สำเร็จ: ${e.message}`, 'error');
    }
  };

  // Pending permissions map { [username]: string[] } to prevent auto-saving on click
  const [pendingPermissions, setPendingPermissions] = useState({});

  // Check if there are unsaved permission changes
  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(pendingPermissions).some((uname) => {
      const target = users.find((u) => (u.username || '').toLowerCase() === (uname || '').toLowerCase());
      if (!target) return false;
      const orig = [...(target.permissions || [])].sort();
      const curr = [...pendingPermissions[uname]].sort();
      if (orig.length !== curr.length) return true;
      return orig.some((val, i) => val !== curr[i]);
    });
  }, [pendingPermissions, users]);

  const modifiedUsersCount = useMemo(() => {
    return Object.keys(pendingPermissions).filter((uname) => {
      const target = users.find((u) => (u.username || '').toLowerCase() === (uname || '').toLowerCase());
      if (!target) return false;
      const orig = [...(target.permissions || [])].sort();
      const curr = [...pendingPermissions[uname]].sort();
      if (orig.length !== curr.length) return true;
      return orig.some((val, i) => val !== curr[i]);
    }).length;
  }, [pendingPermissions, users]);

  // Toggle permission for a user (stages change, does not auto-save)
  const handleTogglePermission = (username, menuId) => {
    const target = users.find((u) => (u.username || '').toLowerCase() === (username || '').toLowerCase());
    if (!target) return;
    if (target.role === 'admin' && menuId === 'users') {
      showToast('⚠️ ไม่สามารถปิดสิทธิ์เมนูผู้ดูแลระบบของบัญชี ADMIN ได้');
      return;
    }

    const currentPerms = pendingPermissions[target.username] !== undefined
      ? pendingPermissions[target.username]
      : (target.permissions || []);

    let updatedPerms = [];
    if (currentPerms.includes(menuId)) {
      updatedPerms = currentPerms.filter((id) => id !== menuId);
    } else {
      updatedPerms = [...currentPerms, menuId];
    }

    setPendingPermissions((prev) => ({
      ...prev,
      [target.username]: updatedPerms
    }));
  };

  // Quick Preset Permissions (also stages to pendingPermissions)
  const handleApplyPreset = (username, presetType) => {
    const target = users.find((u) => (u.username || '').toLowerCase() === (username || '').toLowerCase());
    if (!target) return;

    let perms = [];
    if (presetType === 'all') {
      perms = ALL_MENU_IDS.map((m) => m.id);
    } else if (presetType === 'base_dept') {
      perms = ['public-overview', 'risk-management', 'knowledge', 'forms'];
    } else if (presetType === 'control_only') {
      perms = ['public-overview', 'internal-control', 'risk-management', 'knowledge', 'forms'];
    } else if (presetType === 'control_lpa') {
      perms = ['public-overview', 'internal-control', 'risk-management', 'lpa', 'knowledge', 'forms'];
    } else if (presetType === 'read_only') {
      perms = ['public-overview', 'knowledge', 'forms'];
    }

    setPendingPermissions((prev) => ({
      ...prev,
      [target.username]: perms
    }));
    showToast(`ปรับชุดสิทธิ์ของ "${target.displayName || username}" แล้ว (กดปุ่ม "บันทึกการแก้ไขสิทธิ์" เพื่อยืนยัน)`);
  };

  // Save all pending permissions with confirmation
  const handleSavePermissions = () => {
    if (!hasUnsavedChanges) {
      showToast('ไม่มีการเปลี่ยนแปลงสิทธิ์ที่ต้องบันทึก');
      return;
    }

    openConfirmModal({
      title: 'ยืนยันการบันทึกการกำหนดสิทธิ์',
      message: `คุณต้องการบันทึกการกำหนดสิทธิ์การมองเห็นเมนูของ ${modifiedUsersCount} บัญชีกอง/ผู้ใช้งาน ตามที่แก้ไขใช่หรือไม่? การเปลี่ยนแปลงจะมีผลกับการเข้าใช้งานทันที`,
      confirmText: 'ยืนยันและบันทึกสิทธิ์',
      type: 'info',
      onConfirm: () => {
        Object.keys(pendingPermissions).forEach((uname) => {
          updateUserPermissions(uname, pendingPermissions[uname]);
        });
        setPendingPermissions({});
        refreshList();
        showToast(`บันทึกการกำหนดสิทธิ์ของ ${modifiedUsersCount} บัญชีผู้ใช้เรียบร้อยแล้ว`);
      }
    });
  };

  // Discard pending permission changes
  const handleCancelPermissions = () => {
    setPendingPermissions({});
    showToast('ยกเลิกการเปลี่ยนแปลงสิทธิ์ทั้งหมดแล้ว');
  };

  // Switch to preview view as this user
  const handleImpersonate = (username) => {
    openConfirmModal({
      title: 'สลับมุมมองเข้าใช้งาน',
      message: `คุณต้องการสลับมุมมองเข้าใช้งานในฐานะ "${username}" ใช่หรือไม่? (คุณสามารถสลับกลับมาเป็น ADMIN ได้ที่แถบด้านบน)`,
      confirmText: 'สลับมุมมอง',
      type: 'info',
      onConfirm: () => {
        const sess = switchSessionTo(username);
        if (sess && onSwitchSession) {
          onSwitchSession(sess);
        }
      }
    });
  };

  // Open Edit User
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormDisplayName(user.displayName);
    setFormDepartment(user.department || 'กองคลัง');
    setIsCustomDept(false);
    setCustomDeptName('');
    setFormPosition(user.position || '');
    setFormRole(user.role);
    setFormPassword('');
    setFormPermissions(user.permissions || []);
    setFormError('');
    setShowAddModal(true);
  };

  // Open Add User
  const handleOpenAdd = (defaultDept = null) => {
    setEditingUser(null);
    setFormUsername('');
    setFormDisplayName('');
    setFormDepartment(defaultDept || (departments.length > 1 ? departments[1] : departments[0] || 'กองคลัง'));
    setIsCustomDept(false);
    setCustomDeptName('');
    setFormPosition('');
    setFormRole('user');
    setFormPassword('');
    setFormPermissions(['public-overview', 'risk-management', 'knowledge', 'forms']);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    let chosenDept = formDepartment;
    if (isCustomDept) {
      const cleanCustom = customDeptName.trim();
      if (!cleanCustom) {
        setFormError('กรุณาระบุชื่อสำนัก/กองใหม่');
        return;
      }
      try {
        const updated = addDepartment(cleanCustom);
        setDepartments(updated);
        chosenDept = cleanCustom;
      } catch {
        chosenDept = cleanCustom;
      }
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.username, {
          newUsername: formUsername.trim(),
          displayName: formDisplayName,
          department: chosenDept,
          position: formPosition,
          role: formRole,
          newPassword: formPassword || undefined,
          permissions: formPermissions
        });
        showToast(`บันทึกข้อมูล "${formDisplayName}" สำเร็จ`);
      } else {
        await addUser({
          username: formUsername,
          displayName: formDisplayName,
          department: chosenDept,
          position: formPosition,
          role: formRole,
          password: formPassword || '1234',
          permissions: formPermissions
        });
        showToast(`เพิ่มผู้ใช้งาน "${formUsername}" สำเร็จ`);
      }
      setShowAddModal(false);
      refreshList();
    } catch (err) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Department Management Handlers
  const handleAddDeptSubmit = (e) => {
    e.preventDefault();
    const clean = newDeptInput.trim();
    if (!clean) return;
    try {
      const updated = addDepartment(clean);
      setDepartments(updated);
      setNewDeptInput('');
      showToast(`เพิ่มสำนัก/กอง "${clean}" สำเร็จ`);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleStartEditDept = (dept) => {
    setEditingDeptOldName(dept);
    setEditingDeptNewName(dept);
  };

  const handleSaveEditDept = (oldName) => {
    const clean = editingDeptNewName.trim();
    if (!clean) return;
    try {
      const updated = updateDepartment(oldName, clean);
      setDepartments(updated);
      setEditingDeptOldName(null);
      refreshList();
      showToast(`เปลี่ยนชื่อกองเป็น "${clean}" สำเร็จ (เชื่อมโยงและอัปเดตบัญชีผู้ใช้และข้อมูลทั้งหมดแล้ว)`);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleDeleteDept = (dept) => {
    openConfirmModal({
      title: 'ยืนยันการลบสำนัก / กอง',
      message: `คุณต้องการลบสำนัก/กอง "${dept}" ออกจากระบบใช่หรือไม่? ข้อมูลการตั้งค่าของกองนี้จะถูกนำออกจากระบบ`,
      confirmText: 'ลบสำนัก/กองนี้',
      type: 'danger',
      onConfirm: () => {
        try {
          const updated = deleteDepartment(dept);
          setDepartments(updated);
          showToast(`ลบสำนัก/กอง "${dept}" สำเร็จ`);
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
        }
      }
    });
  };

  const handleDelete = (username) => {
    if (username === 'admin' || username === 'guest') {
      showToast('⚠️ ไม่สามารถลบบัญชีระบบ (ADMIN หรือ ผู้เยี่ยมชม) ได้');
      return;
    }

    openConfirmModal({
      title: 'ยืนยันการลบบัญชีผู้ใช้งาน',
      message: `คุณต้องการลบบัญชีผู้ใช้งาน "${username}" ใช่หรือไม่? ข้อมูลและสิทธิ์การเข้าถึงทั้งหมดของบัญชีนี้จะถูกนำออกจากระบบ`,
      confirmText: 'ลบบัญชีผู้ใช้นี้',
      type: 'danger',
      onConfirm: () => {
        try {
          deleteUser(username);
          refreshList();
          showToast(`ลบบัญชี "${username}" สำเร็จ`);
        } catch (err) {
          showToast(`⚠️ ${err.message}`);
        }
      }
    });
  };

  const handleResetDefaults = () => {
    openConfirmModal({
      title: 'รีเซ็ตบัญชีและสิทธิ์เป็นค่าเริ่มต้น',
      message: 'คุณต้องการรีเซ็ตบัญชีผู้ใช้และสิทธิ์การมองเห็นเมนูทั้งหมดกลับเป็นค่าเริ่มต้นตามโครงสร้าง 6 กองหลัก ใช่หรือไม่?',
      confirmText: 'รีเซ็ตเป็นค่าเริ่มต้น',
      type: 'warning',
      onConfirm: () => {
        resetUsersToDefault();
        refreshList();
        showToast('รีเซ็ตข้อมูลผู้ใช้งานและสิทธิ์เป็นค่าเริ่มต้นแล้ว');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Sleek Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 dark:bg-slate-950/90 text-white px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 border border-slate-700/60 dark:border-slate-800 text-xs font-bold animate-slide-up ring-1 ring-white/10">
          {toastMessage.startsWith('⚠️') ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="tracking-wide">{toastMessage.replace(/^⚠️\s*/, '')}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 px-3 py-0.5 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>ระบบกำหนดสิทธิ์การเข้าถึงเมนู (Role-Based Access Control)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            จัดการผู้ใช้งาน & กำหนดสิทธิ์เมนูรายกอง
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            ผู้ตรวจสอบภายใน (ADMIN) สามารถเปิด-ปิดเมนูที่แต่ละกองจะมองเห็นและปฏิบัติงานได้ เพื่อความปลอดภัย
            และแบ่งแยกบทบาทการทำงานระหว่างผู้ตรวจสอบกับหน่วยรับตรวจอย่างชัดเจน
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มผู้ใช้งาน / กองใหม่</span>
          </button>
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-700 dark:text-stone-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="รีเซ็ตสิทธิ์เป็นค่าเริ่มต้น"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>รีเซ็ตสิทธิ์เริ่มต้น</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-medium">ผู้ใช้งานในระบบทั้งหมด</div>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              {users.length} <span className="text-xs font-normal text-stone-400">บัญชี</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-medium">ผู้ดูแลระบบ (ADMIN)</div>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-400 mt-1">
              {users.filter((u) => u.role === 'admin').length}{' '}
              <span className="text-xs font-normal text-stone-400">บัญชี</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-medium">บัญชีสำนัก/กอง (USERS)</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {users.filter((u) => u.role === 'user').length}{' '}
              <span className="text-xs font-normal text-stone-400">กอง</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-medium">สำนัก / กอง ในระบบ</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {departments.length} <span className="text-xs font-normal text-stone-400">สำนัก/กอง</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 space-x-2 sm:space-x-4 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'border-amber-600 text-amber-800 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>กำหนดสิทธิ์รายเมนู (Matrix)</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'border-amber-600 text-amber-800 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>บัญชีผู้ใช้งาน ({users.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('pending');
            pullPendingUsersFromCloud().then((list) => {
              if (Array.isArray(list)) setPendingUsers(list);
            });
          }}
          className={`pb-3 px-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-800 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>คำขอรออนุมัติ</span>
          {pendingUsers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'departments'
              ? 'border-amber-600 text-amber-800 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>สำนัก / กอง ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`pb-3 px-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cloud'
              ? 'border-amber-600 text-amber-800 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>เชื่อมต่อ Cloud (Supabase)</span>
          {isCloudConfigured ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600 inline-block"></span>
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: เมทริกซ์กำหนดสิทธิ์รายเมนู (Permission Matrix Table)
      ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>ตารางกำหนดการมองเห็นเมนูของแต่ละกอง</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                คลิกที่ช่อง Checkbox เพื่อเปิดหรือปิดสิทธิ์ของเมนูนั้นๆ แล้วกดปุ่ม <strong>"บันทึกการแก้ไขสิทธิ์"</strong> เพื่อยืนยัน
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-slate-500 hidden xl:flex items-center space-x-3 mr-2">
                <span className="flex items-center space-x-1">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> = มองเห็นและใช้งานได้
                </span>
                <span className="flex items-center space-x-1">
                  <Square className="w-3.5 h-3.5 text-slate-400" /> = ซ่อนเมนูนี้
                </span>
              </div>

              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleCancelPermissions}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  ยกเลิกการแก้ไข
                </button>
              )}

              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={!hasUnsavedChanges}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer ${
                  hasUnsavedChanges
                    ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-amber-900/20 ring-2 ring-amber-500/40 animate-pulse'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed shadow-none'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไขสิทธิ์ {hasUnsavedChanges ? `(${modifiedUsersCount} กอง)` : ''}</span>
              </button>
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="font-bold">มีการแก้ไขสิทธิ์ของ {modifiedUsersCount} กองที่ยังไม่ได้บันทึก:</span>
                <span className="text-slate-600 dark:text-slate-300">กรุณากดปุ่ม <strong>"บันทึกการแก้ไขสิทธิ์"</strong> เพื่อยืนยันและให้มีผลในระบบ</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCancelPermissions}
                  className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white underline cursor-pointer"
                >
                  คืนค่าเดิม
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  ยืนยันบันทึก
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto overflow-y-auto max-h-[72vh] min-h-[380px] relative border-t border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 shadow-xs">
                <tr className="text-slate-700 dark:text-slate-200 font-bold">
                  <th className="py-3 px-4 w-52 sticky left-0 top-0 bg-slate-100 dark:bg-slate-800 z-30 font-bold border-b border-r border-slate-200 dark:border-slate-700 shadow-xs">
                    ผู้ใช้งาน / สำนัก-กอง
                  </th>
                  {ALL_MENU_IDS.map((menu) => (
                    <th key={menu.id} className="py-3 px-2 text-center min-w-28 font-medium sticky top-0 bg-slate-100 dark:bg-slate-800 z-20 border-b border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-700 dark:text-slate-200">{menu.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">({menu.id})</div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-36 sticky top-0 bg-slate-100 dark:bg-slate-800 z-20 border-b border-slate-200 dark:border-slate-700">
                    การกระทำ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => {
                  const isAdmin = user.role === 'admin';
                  const userPerms = pendingPermissions[user.username] !== undefined
                    ? pendingPermissions[user.username]
                    : (user.permissions || []);
                  const isCurrent = Boolean(currentSession?.username && user?.username && currentSession.username.toLowerCase() === user.username.toLowerCase());
                  
                  const isUserModified = pendingPermissions[user.username] !== undefined && (() => {
                    const orig = [...(user.permissions || [])].sort();
                    const curr = [...pendingPermissions[user.username]].sort();
                    if (orig.length !== curr.length) return true;
                    return orig.some((val, idx) => val !== curr[idx]);
                  })();

                  return (
                    <tr
                      key={user.username}
                      className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors ${
                        isUserModified
                          ? 'bg-amber-50/30 dark:bg-amber-950/20'
                          : isCurrent ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* User Info Column */}
                      <td className={`py-3 px-4 sticky left-0 z-10 border-b border-r border-slate-200 dark:border-slate-800 transition-colors ${
                        isUserModified
                          ? 'bg-amber-50 dark:bg-amber-950'
                          : isCurrent
                          ? 'bg-blue-50 dark:bg-slate-900'
                          : 'bg-white dark:bg-slate-900'
                      }`}>
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              isAdmin
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : user.role === 'guest'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {isAdmin ? '👑' : user.role === 'guest' ? '👥' : '🏢'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 dark:text-slate-100 truncate flex items-center space-x-1">
                              <span>{user.displayName || user.username}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 rounded font-normal">
                                  คุณ
                                </span>
                              )}
                              {user.role === 'guest' && (
                                <span className="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold">
                                  ผู้เยี่ยมชม
                                </span>
                              )}
                              {isUserModified && (
                                <span className="text-[9px] bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 px-1 py-0.2 rounded font-medium">
                                  รอการบันทึก
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              @{user.username} ({user.department})
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Menu Checkboxes */}
                      {ALL_MENU_IDS.map((menu) => {
                        const hasPermission = isAdmin || userPerms.includes(menu.id);
                        const isMenuLockedForAdmin = isAdmin;

                        return (
                          <td key={menu.id} className="py-3 px-2 text-center border-b border-slate-100 dark:border-slate-800">
                            {isMenuLockedForAdmin ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold" title="ผู้ดูแลระบบมีสิทธิ์ทุกเมนู">
                                ✓
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(user.username, menu.id)}
                                className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-all cursor-pointer ${
                                  hasPermission
                                    ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                                title={`${hasPermission ? 'คลิกเพื่อปิดสิทธิ์' : 'คลิกเพื่อเปิดสิทธิ์'} เมนู ${menu.label} (ต้องกดบันทึกเพื่อยืนยัน)`}
                              >
                                {hasPermission ? '✓' : ''}
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* Actions Column */}
                      <td className="py-3 px-3 text-center border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleImpersonate(user.username)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                            title="สลับไปทดสอบดูหน้าจอในมุมมองของกองนี้"
                          >
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span>ทดสอบมุมมอง</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Sticky Action Bar when there are unsaved changes */}
          {hasUnsavedChanges && (
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="font-bold">มีการแก้ไขสิทธิ์ของ {modifiedUsersCount} กองที่ยังไม่ได้บันทึก</span>
                <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">(คลิกปุ่มด้านขวาเพื่อยืนยันการบันทึก)</span>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCancelPermissions}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิกการแก้ไข
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center space-x-2 cursor-pointer ring-2 ring-blue-500/30"
                >
                  <Save className="w-4 h-4" />
                  <span>ยืนยันบันทึกการแก้ไข ({modifiedUsersCount} กอง)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: รายชื่อและจัดการบัญชีผู้ใช้ (Account List & Password Reset)
      ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const isAdmin = user.role === 'admin';
            const isGuest = user.role === 'guest' || user.username === 'guest';
            return (
              <div
                key={user.username}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ${
                        isAdmin
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : isGuest
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {isAdmin ? '👑' : isGuest ? '👥' : '🏢'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {user.displayName || user.username}
                      </h4>
                      <div className="text-xs text-slate-400 font-mono">@{user.username}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isAdmin
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : isGuest
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {isAdmin ? 'ผู้ดูแลระบบ (ADMIN)' : isGuest ? 'ผู้เยี่ยมชม (GUEST)' : 'ผู้ใช้งาน (USER)'}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div><strong>สังกัด:</strong> {user.department}</div>
                  {user.position && <div><strong>ตำแหน่ง:</strong> {user.position}</div>}
                  <div className="flex items-center space-x-1.5 pt-1">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      <strong>รหัสผ่าน:</strong>{' '}
                      {isGuest ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          ไม่ต้องใช้รหัสผ่าน (เข้าชมได้ทันที)
                        </span>
                      ) : (
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {user.passwordText || '••••••••'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <strong>สิทธิ์เมนู:</strong>{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {isAdmin ? 'ทุกเมนู (100%)' : `${user.permissions?.length || 0} เมนู`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => handleImpersonate(user.username)}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isGuest ? 'ทดสอบมุมมองผู้เยี่ยมชม' : 'เข้าสู่ระบบเป็นบัญชีนี้'}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(user)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="แก้ไขข้อมูล/สิทธิ์"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!isAdmin && !isGuest && (
                      <button
                        type="button"
                        onClick={() => handleDelete(user.username)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800"
                        title="ลบบัญชีผู้ใช้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          TAB 3: จัดการสำนัก / กอง (Departments Management)
      ========================================================================= */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* Add Department Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>เพิ่มสำนัก / กอง ใหม่ในระบบ</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              กำหนดชื่อกองใหม่ตามโครงสร้าง อปท. (เช่น กองสวัสดิการสังคม, กองการเจ้าหน้าที่, หรือหน่วยงานเฉพาะกิจ) เพื่อผูกกับบัญชีผู้ใช้และกำหนดสิทธิ์
            </p>
            <form onSubmit={handleAddDeptSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <input
                type="text"
                required
                value={newDeptInput}
                onChange={(e) => setNewDeptInput(e.target.value)}
                placeholder="ระบุชื่อสำนักหรือกองใหม่ เช่น กองสวัสดิการสังคม..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มกองใหม่</span>
              </button>
            </form>
          </div>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const deptUsers = users.filter((u) => u.department === dept);
              const isAuditDept = dept === 'หน่วยตรวจสอบภายใน';
              const isEditing = editingDeptOldName === dept;

              return (
                <div
                  key={dept}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between relative"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                            isAuditDept
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          }`}
                        >
                          {isAuditDept ? '👑' : '🏢'}
                        </div>

                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editingDeptNewName}
                              onChange={(e) => setEditingDeptNewName(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-800 border border-blue-500 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full"
                              autoFocus
                            />
                            <div className="flex items-center space-x-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleSaveEditDept(dept)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                              >
                                บันทึก
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingDeptOldName(null)}
                                className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {dept}
                            </h4>
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                                deptUsers.length > 0
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {deptUsers.length > 0
                                ? `${deptUsers.length} บัญชีผู้ใช้งาน`
                                : 'ยังไม่มีผู้ใช้งานสังกัด'}
                            </span>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditDept(dept)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            title="แก้ไขชื่อสำนัก/กอง"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!isAuditDept && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDept(dept)}
                              disabled={deptUsers.length > 0}
                              className={`p-1.5 rounded-lg transition-all ${
                                deptUsers.length > 0
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer'
                              }`}
                              title={
                                deptUsers.length > 0
                                  ? `ไม่สามารถลบได้ เนื่องจากมีผู้ใช้งานสังกัดอยู่ ${deptUsers.length} คน`
                                  : 'ลบสำนัก/กองนี้'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Member Avatars / List */}
                    {deptUsers.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                          ผู้ใช้งานในสังกัด:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {deptUsers.map((u) => (
                            <span
                              key={u.username}
                              className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] px-2 py-0.5 rounded-md font-mono"
                            >
                              <span>{u.role === 'admin' ? '👑' : '👤'}</span>
                              <span>@{u.username}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenAdd(dept)}
                      className="w-full text-center py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ เพิ่มผู้ใช้งานสังกัดกองนี้</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: คำขอรออนุมัติ (Pending Approvals Workflow)
      ========================================================================= */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-amber-500" />
                <span>คำขอลงทะเบียนเข้าใช้งานระบบ (รออนุมัติโดย ADMIN)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {pendingUsers.length} รายการ
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                บุคลากรที่ลงทะเบียนผ่านหน้าแรกจะปรากฏในรายการนี้ ผู้ดูแลระบบสามารถตรวจสอบสังกัด กำหนดบทบาทที่เหมาะสม และกดอนุมัติเพื่อให้สามารถเข้าสู่ระบบได้ทันที
              </p>
            </div>
            <button
              type="button"
              onClick={refreshList}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเฟรชข้อมูล</span>
            </button>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                ไม่มีคำขอรออนุมัติในขณะนี้
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                ทุกคำขอได้รับการอนุมัติหรือจัดการเรียบร้อยแล้ว เมื่อมีบุคลากรใหม่กดลงทะเบียนจากหน้าเข้าสู่ระบบ รายการจะถูกส่งมาแสดงที่นี่โดยอัตโนมัติ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map((pending) => {
                const assignedRole = selectedPendingRoles[pending.id] || pending.role || 'staff';
                const roleObj = ENTERPRISE_ROLES.find((r) => r.id === assignedRole) || ENTERPRISE_ROLES[3];

                return (
                  <div
                    key={pending.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                            👤
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-1.5">
                              <span>{pending.displayName}</span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              @{pending.username} • {pending.email || 'ไม่มีอีเมล'}
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>รออนุมัติ</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">สังกัด / กอง:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {pending.department || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">ตำแหน่ง:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {pending.position || '-'}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-400 block text-[10px]">วันที่ส่งคำขอ:</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {pending.requestedAt ? new Date(pending.requestedAt).toLocaleString('th-TH') : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Role Assignment Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>กำหนดบทบาทในการใช้งาน:</span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">
                            {roleObj.label.split('(')[0]}
                          </span>
                        </label>
                        <select
                          value={assignedRole}
                          onChange={(e) =>
                            setSelectedPendingRoles((prev) => ({
                              ...prev,
                              [pending.id]: e.target.value
                            }))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                        >
                          {ENTERPRISE_ROLES.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {roleObj.desc}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApproveUser(pending)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>อนุมัติการใช้งาน (Activate)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectUser(pending)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer"
                        title="ปฏิเสธคำขอนี้"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: เชื่อมต่อ Cloud (Supabase PostgreSQL Integration)
      ========================================================================= */}
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                    isCloudConfigured
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                      สถานะการเชื่อมต่อฐานข้อมูล Cloud (Supabase)
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCloudConfigured
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {isCloudConfigured ? '🟢 ออนไลน์ (Connected)' : '⚪ ออฟไลน์ (Local Mode)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isCloudConfigured
                      ? 'ระบบเชื่อมต่อกับคลาวด์ดาต้าเบส Supabase แล้ว ข้อมูลสิทธิ์และผู้ใช้งานจะถูกซิงก์แบบเรียลไทม์ระหว่างอุปกรณ์'
                      : 'ระบบกำลังทำงานในโหมดจัดเก็บข้อมูลในเครื่อง (LocalStorage) ไม่ต้องใช้อินเทอร์เน็ต สามารถเชื่อมต่อ Supabase ได้ทุกเมื่อที่ต้องการใช้งานหลายคน'}
                  </p>
                </div>
              </div>

              {isCloudConfigured && (
                <button
                  type="button"
                  onClick={handleDisconnectCloud}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 rounded-xl transition-all cursor-pointer shrink-0 border border-rose-200 dark:border-rose-900/50"
                >
                  ตัดการเชื่อมต่อ Cloud
                </button>
              )}
            </div>
          </div>

          {/* Connection Setup Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>กำหนดค่าการเชื่อมต่อ (Supabase API Credentials)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                นำ Project URL และ Anon Key จากหน้า Project Settings บน Supabase ของท่านมากรอกที่นี่
              </p>
            </div>

            <div className="space-y-3 max-w-3xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL:
                </label>
                <input
                  type="text"
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Anon Public API Key:
                </label>
                <input
                  type="password"
                  value={cloudAnonKey}
                  onChange={(e) => setCloudAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {connectionStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                    connectionStatus.success
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  }`}
                >
                  {connectionStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{connectionStatus.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleTestCloudConnection}
                  disabled={testingConnection || !cloudUrl.trim() || !cloudAnonKey.trim()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'กำลังทดสอบการเชื่อมต่อ...' : 'ทดสอบการเชื่อมต่อ'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCloudConfig}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกและเปิดใช้งาน Cloud</span>
                </button>

                {isCloudConfigured && (
                  <>
                    <button
                      type="button"
                      onClick={handleUploadAllToCloudFromUsers}
                      className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                      title="ส่งข้อมูลแบบ บส. ทุกกองในเครื่องขึ้น Supabase (เหมาะสำหรับเปิดระบบใหม่)"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ส่งข้อมูลในเครื่องขึ้น Cloud ทั้งหมด</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePullAllFromCloudFromUsers}
                      className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                      title="ดึงข้อมูลล่าสุดจาก Supabase Cloud มาบันทึกลงในเครื่อง"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ดึงข้อมูลจาก Cloud ลงเครื่อง</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Setup Guide & One-Click SQL Schema */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>คู่มือเริ่มต้นใช้งาน Supabase (ฟรีตลอดชีพ) ใน 3 ขั้นตอน</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  หากยังไม่เคยสมัคร Supabase สามารถทำตามขั้นตอนนี้ได้ง่ายๆ ภายใน 3 นาที
                </p>
              </div>

              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <span>เปิดเว็บไซต์ Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
                <div className="font-bold text-emerald-400">1. สมัครและสร้าง Project</div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  เข้าสู่ระบบ Supabase ด้วยบัญชี GitHub หรือ Google แล้วกด <strong>"New project"</strong> ตั้งชื่อโปรเจกต์ (เช่น ia-os-local) และเลือก Region เป็น <strong>Singapore</strong>
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
                <div className="font-bold text-blue-400">2. ติดตั้งโครงสร้างฐานข้อมูล</div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  ไปที่เมนู <strong>SQL Editor</strong> ทางซ้ายมือ กดปุ่ม <strong>"+ New query"</strong> นำสคริปต์ SQL ด้านล่างนี้ไปวางแล้วกดปุ่ม <strong>RUN</strong>
                </p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
                <div className="font-bold text-amber-400">3. คัดลอก API Keys</div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  ไปที่ <strong>Project Settings</strong> (ไอคอนฟันเฟืองล่างซ้าย) &rarr; เมนู <strong>API</strong> คัดลอก <strong>Project URL</strong> และ <strong>anon / public key</strong> มากรอกในช่องด้านบน
                </p>
              </div>
            </div>

            {/* SQL Script Box with Copy Button */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  สคริปต์ SQL สำหรับสร้างตารางอัตโนมัติ (Copy & Run in Supabase SQL Editor):
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    copiedSql
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? '✓ คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกสคริปต์ SQL ทั้งหมด'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-48 overflow-y-auto custom-scrollbar select-all">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: เพิ่ม / แก้ไข ผู้ใช้งาน
      ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {editingUser ? `แก้ไขข้อมูลผู้ใช้: @${editingUser.username}` : 'เพิ่มบัญชีผู้ใช้งาน / สำนัก-กองใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อผู้ใช้ (Username):
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="เช่น finance, clerk..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {editingUser && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      * สามารถเปลี่ยนชื่อล็อกอินได้
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสผ่าน (Password):
                  </label>
                  <input
                    type="text"
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? 'เว้นว่างถ้าไม่เปลี่ยน' : 'รหัสผ่าน'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อแสดงผล / กอง:
                </label>
                <input
                  type="text"
                  required
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder="เช่น กองคลัง (นางบุณณดา ผงผ่าน)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      สำนัก / กอง:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDept(!isCustomDept);
                        setCustomDeptName('');
                      }}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-[10px] font-semibold cursor-pointer"
                    >
                      {isCustomDept ? '← เลือกจากรายการ' : '+ กำหนดกองใหม่'}
                    </button>
                  </div>
                  {isCustomDept ? (
                    <input
                      type="text"
                      required
                      value={customDeptName}
                      onChange={(e) => setCustomDeptName(e.target.value)}
                      placeholder="ระบุชื่อสำนัก/กองใหม่..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={formDepartment}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__NEW__') {
                          setIsCustomDept(true);
                          setCustomDeptName('');
                        } else {
                          // Auto update displayName if it was empty, matched previous department or another department name
                          if (!formDisplayName.trim() || formDisplayName === formDepartment || departments.includes(formDisplayName)) {
                            setFormDisplayName(val);
                          }
                          setFormDepartment(val);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      <option value="__NEW__">✍️ + กำหนดชื่อสำนัก/กองใหม่...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    บทบาท (Role):
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                  >
                    <option value="user">ผู้ใช้งานประจำกอง (USER)</option>
                    <option value="admin">ผู้ดูแลระบบ (ADMIN)</option>
                  </select>
                </div>
              </div>

              {/* Menu Permissions selection */}
              {formRole !== 'admin' && (
                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    เลือกเมนูที่อนุญาตให้ผู้ใช้นี้เข้าถึงได้:
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                    {ALL_MENU_IDS.filter((m) => m.id !== 'users').map((menu) => {
                      const checked = formPermissions.includes(menu.id);
                      return (
                        <label
                          key={menu.id}
                          className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setFormPermissions(formPermissions.filter((id) => id !== menu.id));
                              } else {
                                setFormPermissions([...formPermissions, menu.id]);
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate">{menu.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  {editingUser ? 'บันทึกการแก้ไข' : 'สร้างผู้ใช้งาน'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Elegant Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        type={confirmModalConfig.type}
        onConfirm={confirmModalConfig.onConfirm}
        onClose={closeConfirmModal}
      />
    </div>
  );
}
