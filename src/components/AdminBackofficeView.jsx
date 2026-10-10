import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  CreditCard,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Calendar,
  Building,
  Phone,
  Mail,
  DollarSign,
  TrendingUp,
  Award,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Radio,
  Send,
  MoreVertical,
  Pin,
  Upload,
  Crown,
  Star,
  Zap,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Bell,
  Image as ImageIcon
} from 'lucide-react';
import {
  getUsers,
  saveUsers,
  pullUsersFromCloud,
  subscribeToCloudUsers,
  getPendingUsers,
  savePendingUsers,
  MEMBERSHIP_PLANS,
  getPaymentRecords,
  savePaymentRecords,
  getSystemSettings,
  saveSystemSettings,
  saveBroadcastAnnouncement,
  approveMemberRegistration,
  rejectMemberRegistration,
  extendMemberSubscription,
  updateUser,
  deleteUser
} from '../utils/auth';
import { broadcastSystemUpdate, APP_VERSION } from '../utils/versionCheck';

export default function AdminBackofficeView({ currentSession, session, onSwitchToWorkbench, onRefreshUser }) {
  const activeSession = session || currentSession;

  // 3 Primary Tabs from user's system + Billing audit tab
  // 'overview' = ภาพรวมระบบ (Dashboard & Analytics)
  // 'users' = จัดการผู้ใช้งาน (User Management & Broadcast)
  // 'pricing_qr' = ตั้งค่าแพ็กเกจและ QR (Pricing & PromptPay QR)
  // 'billing' = บันทึกรายได้ & ประวัติชำระเงิน
  const [activeTab, setActiveTab] = useState('overview');

  const [users, setUsers] = useState(() => getUsers());
  const [pendingUsers, setPendingUsers] = useState(() => getPendingUsers());
  const [payments, setPayments] = useState(() => getPaymentRecords());
  const [settings, setSettings] = useState(() => getSystemSettings());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Pinned Users stored in localStorage
  const [pinnedUsernames, setPinnedUsernames] = useState(() => {
    try {
      const raw = localStorage.getItem('ia_admin_pinned_users');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Action Dropdown state (3 dots ⋮)
  const [openActionUsername, setOpenActionUsername] = useState(null);
  const actionMenuRef = useRef(null);

  // Broadcast Announcement state
  const [broadcastText, setBroadcastText] = useState(() => settings.announcement || '');
  const [isBroadcastActive, setIsBroadcastActive] = useState(() => settings.broadcastActive !== false);

  // Modals
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const [showChangeTierModal, setShowChangeTierModal] = useState(false);
  const [tierTargetUser, setTierTargetUser] = useState(null);
  const [selectedNewTier, setSelectedNewTier] = useState('monthly');
  const [tierDurationDays, setTierDurationDays] = useState(30);

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    username: '',
    plan: 'annual',
    amount: '2990',
    method: 'พร้อมเพย์ / โอนเงินธนาคาร',
    refNo: '',
    date: new Date().toISOString().split('T')[0],
    note: 'ชำระค่าสมาชิกรายปี',
    autoExtend: true
  });

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastVer, setBroadcastVer] = useState(APP_VERSION);
  const [broadcastTitle, setBroadcastTitle] = useState('Audit-OS อัปเดตเวอร์ชันใหม่');
  const [broadcastDesc, setBroadcastDesc] = useState('ระบบได้รับการอัปเดตฟังก์ชันและปรับปรุงประสิทธิภาพล่าสุดเรียบร้อยแล้ว');
  const [broadcastSummary, setBroadcastSummary] = useState('ปรับปรุงระบบกระดาษทำการ และการจัดการสมาชิก อปท.');
  const [isBroadcastExpanded, setIsBroadcastExpanded] = useState(false);

  // File upload input ref for custom QR
  const qrFileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const reloadData = async () => {
    try {
      const cloudUsers = await pullUsersFromCloud();
      if (cloudUsers) setUsers(cloudUsers);
      else setUsers(getUsers());
    } catch (_) {
      setUsers(getUsers());
    }
    setPendingUsers(getPendingUsers());
    setPayments(getPaymentRecords());
    const s = getSystemSettings();
    setSettings(s);
    setBroadcastText(s.announcement || '');
    setIsBroadcastActive(s.broadcastActive !== false);
    showToast('รีเฟรชข้อมูลระบบล่าสุดจากคลาวด์เรียบร้อยแล้ว');
  };

  // Realtime Cloud Firestore sync for Users list
  useEffect(() => {
    pullUsersFromCloud().then((cloudUsers) => {
      if (cloudUsers) setUsers(cloudUsers);
    });
    const unsub = subscribeToCloudUsers((cloudUsers) => {
      if (cloudUsers) setUsers(cloudUsers);
    });
    return () => unsub();
  }, []);

  // Close 3-dots action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionUsername(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Metrics: Exclude admin account from client/tenant membership statistics
  const metrics = useMemo(() => {
    const regularAuditors = users.filter((u) => u.role !== 'admin' && u.username?.toLowerCase() !== 'admin');
    const adminAccounts = users.filter((u) => u.role === 'admin' || u.username?.toLowerCase() === 'admin');
    const now = Date.now();

    const activeAuditors = regularAuditors.filter((u) => {
      if (u.status === 'suspended') return false;
      if (!u.expiresAt) return true;
      return new Date(u.expiresAt).getTime() > now;
    });

    const freeTrialCount = regularAuditors.filter((u) => (u.plan === 'trial' || !u.plan)).length;
    const vipCount = regularAuditors.filter((u) => u.plan === 'monthly').length;
    const premiumCount = regularAuditors.filter((u) => u.plan === 'annual' || u.plan === 'lifetime').length;

    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalAuditors: regularAuditors.length,
      activeAuditors: activeAuditors.length,
      adminCount: adminAccounts.length,
      freeTrialCount,
      vipCount,
      premiumCount,
      totalRevenue
    };
  }, [users, payments]);

  // Filtered and sorted members
  const filteredMembers = useMemo(() => {
    return users
      .filter((u) => u.role !== 'admin' && u.username?.toLowerCase() !== 'admin')
      .filter((u) => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          (u.displayName || '').toLowerCase().includes(q) ||
          (u.organization || '').toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q) ||
          (u.province || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q);

        if (!matchSearch) return false;

        const now = Date.now();
        const isExpired = u.expiresAt && new Date(u.expiresAt).getTime() <= now;
        const isExpiringSoon =
          u.expiresAt &&
          new Date(u.expiresAt).getTime() > now &&
          new Date(u.expiresAt).getTime() - now < 7 * 24 * 60 * 60 * 1000;

        if (statusFilter === 'active') return u.status !== 'suspended' && !isExpired;
        if (statusFilter === 'expiring') return isExpiringSoon;
        if (statusFilter === 'expired') return isExpired;
        if (statusFilter === 'suspended') return u.status === 'suspended';
        if (statusFilter === 'trial') return u.plan === 'trial' || !u.plan;
        if (statusFilter === 'monthly') return u.plan === 'monthly';
        if (statusFilter === 'annual') return u.plan === 'annual';
        return true;
      })
      .sort((a, b) => {
        // Pinned users appear first
        const isPinnedA = pinnedUsernames.includes(a.username);
        const isPinnedB = pinnedUsernames.includes(b.username);
        if (isPinnedA && !isPinnedB) return -1;
        if (!isPinnedA && isPinnedB) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [users, searchTerm, statusFilter, pinnedUsernames]);

  // Combined list with ADMIN pinned permanently at index 0
  const displayedUsers = useMemo(() => {
    const adminUser = users.find((u) => u.role === 'admin' || u.username?.toLowerCase() === 'admin');
    if (!adminUser) return filteredMembers;

    // Check if search query matches admin or is blank
    const q = searchTerm.toLowerCase();
    const adminMatchesSearch = !q ||
      'admin'.includes(q) ||
      (adminUser.displayName || '').toLowerCase().includes(q) ||
      (adminUser.organization || '').toLowerCase().includes(q) ||
      (adminUser.email || '').toLowerCase().includes(q) ||
      'ผู้ดูแลระบบ'.includes(q);

    // Admin matches when viewing all or active
    const adminMatchesStatus = statusFilter === 'all' || statusFilter === 'active';

    if (adminMatchesSearch && adminMatchesStatus) {
      // ADMIN is ALWAYS pinned at index 0 permanently, never pushed down by newly registered members!
      return [adminUser, ...filteredMembers];
    }
    return filteredMembers;
  }, [users, filteredMembers, searchTerm, statusFilter]);

  // Toggle Pin User
  const handleTogglePin = (username) => {
    let next;
    if (pinnedUsernames.includes(username)) {
      next = pinnedUsernames.filter((u) => u !== username);
      showToast(`ยกเลิกปักหมุดผู้ใช้ @${username}`);
    } else {
      next = [username, ...pinnedUsernames];
      showToast(`📌 ปักหมุดผู้ใช้ @${username} ไว้บนสุดแล้ว`);
    }
    setPinnedUsernames(next);
    localStorage.setItem('ia_admin_pinned_users', JSON.stringify(next));
    setOpenActionUsername(null);
  };

  // Toggle Suspend / Lock
  const handleToggleSuspend = (user) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const actionLabel = newStatus === 'suspended' ? 'ล็อกบัญชี (ระงับสิทธิ์)' : 'ปลดล็อกบัญชี (เปิดสิทธิ์)';
    if (!window.confirm(`ต้องการ${actionLabel} บัญชี @${user.username} หรือไม่?`)) return;

    try {
      updateUser(user.username, { status: newStatus });
      reloadData();
      showToast(`${actionLabel} @${user.username} เรียบร้อยแล้ว`);
      setOpenActionUsername(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // Force Expire Trial Now
  const handleExpireNow = (user) => {
    if (!window.confirm(`ต้องการสิ้นสุดสิทธิ์การใช้งานของ @${user.username} ทันทีหรือไม่?`)) return;
    try {
      updateUser(user.username, { expiresAt: new Date(Date.now() - 1000).toISOString() });
      reloadData();
      showToast(`⛔ สิ้นสุดสิทธิ์ของ @${user.username} ทันทีแล้ว`);
      setOpenActionUsername(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // Quick Extend
  const handleQuickExtend = (username, days, planId) => {
    try {
      extendMemberSubscription(username, days, planId);
      reloadData();
      showToast(`ต่ออายุสมาชิกให้ผู้ใช้ @${username} เพิ่มอีก ${days} วัน เรียบร้อยแล้ว`);
      setOpenActionUsername(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete User Permanently
  const handleDeleteUser = (user) => {
    if (!window.confirm(`⚠️ คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ "${user.displayName}" (@${user.username}) อย่างถาวร? ข้อมูลทั้งหมดจะไม่สามารถกู้คืนได้`)) return;
    try {
      deleteUser(user.username);
      reloadData();
      showToast(`ลบบัญชี @${user.username} ออกจากระบบเรียบร้อยแล้ว`);
      setOpenActionUsername(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // Open Change Tier Modal
  const handleOpenChangeTier = (user) => {
    setTierTargetUser(user);
    const p = user.plan || 'trial';
    setSelectedNewTier(p);
    setTierDurationDays(p === 'monthly' ? 30 : p === 'annual' ? 365 : 30);
    setShowChangeTierModal(true);
    setOpenActionUsername(null);
  };

  // Submit Change Tier
  const handleSaveChangeTier = () => {
    if (!tierTargetUser) return;
    try {
      if (selectedNewTier === 'lifetime') {
        updateUser(tierTargetUser.username, {
          plan: 'lifetime',
          status: 'active',
          expiresAt: null
        });
      } else {
        const newExpiry = new Date(Date.now() + tierDurationDays * 86400000).toISOString();
        updateUser(tierTargetUser.username, {
          plan: selectedNewTier,
          status: 'active',
          expiresAt: newExpiry
        });
      }
      setShowChangeTierModal(false);
      setTierTargetUser(null);
      reloadData();
      showToast(`ปรับระดับสมาชิกของ @${tierTargetUser.username} เป็น ${MEMBERSHIP_PLANS[selectedNewTier]?.name || selectedNewTier} เรียบร้อยแล้ว!`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Broadcast Announcement
  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) {
      alert('กรุณากรอกข้อความประกาศ');
      return;
    }
    saveBroadcastAnnouncement(broadcastText.trim(), isBroadcastActive);
    showToast('🚀 ส่งประกาศข่าวสารไปยังแบนเนอร์หน้าบ้านของผู้ใช้ทุกคนเรียบร้อยแล้ว!');
  };

  // Toggle Broadcast Active
  const handleToggleBroadcastActive = () => {
    const next = !isBroadcastActive;
    setIsBroadcastActive(next);
    saveBroadcastAnnouncement(broadcastText, next);
    showToast(next ? 'เปิดแสดงประกาศหน้าบ้านแล้ว' : 'ปิดซ่อนแถบประกาศหน้าบ้านแล้ว');
  };

  // Handle QR Code Upload
  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพเกิน 1.5 MB กรุณาเลือกรูปภาพที่มีขนาดเล็กลง');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        const updated = { ...settings, qrCodeImage: dataUrl };
        setSettings(updated);
        saveSystemSettings(updated);
        showToast('อัปโหลดรูปภาพ PromptPay QR Code เรียบร้อยแล้ว!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetQr = () => {
    const updated = { ...settings, qrCodeImage: '' };
    setSettings(updated);
    saveSystemSettings(updated);
    showToast('รีเซ็ตรูปภาพ QR Code เป็นค่ามาตรฐานเรียบร้อยแล้ว');
  };

  // Save Settings & Pricing
  const handleSaveSettingsAndPricing = (e) => {
    e.preventDefault();
    saveSystemSettings(settings);
    showToast('💾 บันทึกการตั้งค่ารับเงินและอัปเดตแพ็กเกจหน้าสมัครสมาชิกเรียบร้อยแล้ว!');
  };

  // Submit Payment Record
  const handleAddPaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentForm.username || !paymentForm.amount) {
      alert('กรุณาเลือกสมาชิกและระบุจำนวนเงิน');
      return;
    }

    const targetUser = users.find((u) => u.username === paymentForm.username);
    const newRecord = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      username: paymentForm.username,
      memberName: targetUser?.displayName || paymentForm.username,
      organization: targetUser?.organization || 'อปท.',
      plan: paymentForm.plan,
      amount: parseFloat(paymentForm.amount) || 0,
      method: paymentForm.method,
      refNo: paymentForm.refNo || `TRX-${Date.now().toString().slice(-4)}`,
      paidAt: paymentForm.date,
      note: paymentForm.note,
      createdAt: Date.now()
    };

    const currentPayments = getPaymentRecords();
    const updated = [newRecord, ...currentPayments];
    savePaymentRecords(updated);

    if (paymentForm.autoExtend) {
      const days = paymentForm.plan === 'monthly' ? 30 : 365;
      extendMemberSubscription(paymentForm.username, days, paymentForm.plan);
    }

    setShowAddPaymentModal(false);
    reloadData();
    showToast(`บันทึกการชำระเงิน ${Number(paymentForm.amount).toLocaleString()} บาท เรียบร้อยแล้ว`);
  };

  // Helper to render luxury badges based on the 3 tiers
  const renderLuxuryTierBadge = (user) => {
    const planKey = user.plan || 'trial';
    const now = Date.now();
    const isExpired = user.expiresAt && new Date(user.expiresAt).getTime() <= now;
    const daysLeft = user.expiresAt
      ? Math.max(0, Math.ceil((new Date(user.expiresAt).getTime() - now) / 86400000))
      : 0;

    if (user.role === 'admin' || user.username?.toLowerCase() === 'admin' || user.plan === 'admin') {
      return (
        <div className="inline-flex flex-col items-start gap-1">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-stone-950 border border-amber-200 shadow-md shadow-amber-500/40 tracking-wider">
            <span>👑</span>
            <span className="tracking-wide font-black">ADMIN</span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold ml-1">
            สถานะพิเศษ (ถาวร • ไม่จำกัดเวลา)
          </span>
        </div>
      );
    }

    if (user.status === 'suspended') {
      return (
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          <span>🔒</span>
          <span>ระงับการใช้งาน</span>
        </div>
      );
    }

    if (isExpired) {
      return (
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          <span>▲</span>
          <span>หมดอายุแล้ว</span>
        </div>
      );
    }

    if (planKey === 'annual') {
      return (
        <div className="inline-flex flex-col items-start gap-1">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-stone-950 border border-amber-200 shadow-md shadow-amber-500/35 tracking-wider">
            <span>👑</span>
            <span>PREMIUM ★ (รายปี)</span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold ml-1">
            เหลืออีก {daysLeft} วัน
          </span>
        </div>
      );
    }

    if (planKey === 'monthly') {
      return (
        <div className="inline-flex flex-col items-start gap-1">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white border border-blue-400/60 shadow-md shadow-indigo-600/30 tracking-wide">
            <span className="text-yellow-300 text-xs">⭐</span>
            <span>VIP (รายเดือน)</span>
          </div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold ml-1">
            เหลืออีก {daysLeft} วัน
          </span>
        </div>
      );
    }

    if (planKey === 'lifetime') {
      return (
        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-purple-700 via-pink-600 to-purple-800 text-white border border-purple-300 shadow-md">
          <span>💎</span>
          <span>LIFETIME VIP (ตลอดชีพ)</span>
        </div>
      );
    }

    // Default: ฟรี 30 วัน (ค่าเริ่มต้น)
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
          <span className="text-emerald-500">🌱</span>
          <span>ฟรี 30 วัน (ค่าเริ่มต้น)</span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium ml-1">
          Trial เหลือ {daysLeft} วัน ({user.expiresAt ? new Date(user.expiresAt).toLocaleDateString('th-TH') : '-'})
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-amber-200 border border-amber-500/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 animate-in fade-in slide-in-from-top-3 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header: เรียบง่าย สะอาดตา ไม่มีกรอบใหญ่ เหลือเฉพาะหัวข้อและปุ่มเครื่องมือ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            ระบบดูแลหลังบ้าน (Admin Dashboard)
          </h1>
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>LIVE SYSTEM</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={reloadData}
            className="bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="ดึงข้อมูลล่าสุด"
          >
            <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
            <span>ดึงข้อมูลล่าสุด</span>
          </button>

          {onSwitchToWorkbench && (
            <button
              onClick={onSwitchToWorkbench}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-600/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>เข้าสู่หน้าตรวจ (Workbench)</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation (Matching user's screenshots 1, 2, 3) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-1.5 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-stone-900 to-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ภาพรวมระบบ</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-stone-900 to-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการผู้ใช้งาน ({filteredMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing_qr')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'pricing_qr'
              ? 'bg-gradient-to-r from-stone-900 to-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ตั้งค่าแพ็กเกจและ QR</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-gradient-to-r from-stone-900 to-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>ประวัติชำระเงิน ({payments.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ภาพรวมระบบ (DASHBOARD & ANALYTICS - Image 1)                     */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 6 KPI Metric Cards matching user's Image 1 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Card 1: ผู้ลงทะเบียนทั้งหมด */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">ผู้ลงทะเบียนทั้งหมด</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                {metrics.totalAuditors} <span className="text-xs font-normal text-stone-500">บัญชี</span>
              </div>
            </div>

            {/* Card 2: สตรีมมิ่งออนไลน์ */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">สตรีมมิ่งออนไลน์</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                <span>1</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">ออนไลน์</span>
              </div>
            </div>

            {/* Card 3: สมาชิก FREE 30 วัน */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">สมาชิก FREE (30วัน)</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center">
                  <span className="text-sm">🌱</span>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-stone-800 dark:text-stone-200">
                {metrics.freeTrialCount} <span className="text-xs font-normal text-stone-500">บัญชี</span>
              </div>
            </div>

            {/* Card 4: สมาชิก VIP (รายเดือน) */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">สมาชิก VIP (รายเดือน)</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center justify-center">
                  <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-400">
                {metrics.vipCount} <span className="text-xs font-normal text-stone-500">บัญชี</span>
              </div>
            </div>

            {/* Card 5: สมาชิก PREMIUM (รายปี) */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">สมาชิก PREMIUM</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                {metrics.premiumCount} <span className="text-xs font-normal text-stone-500">บัญชี</span>
              </div>
            </div>

            {/* Card 6: ยอดชำระสมาชิกสะสม */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">ยอดชำระสะสม</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                ฿{metrics.totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 2 Analytical Trend Charts matching user's Image 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: รายงานรายรับค่าสมัครสมาชิกสะสม */}
            <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight">
                    รายงานรายรับค่าสมัครสมาชิกสะสม (ESTIMATED SALES REVENUE)
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    ยอดชำระสะสมคำนวณจากสถานะบัญชีและราคาแพ็กเกจปัจจุบัน
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>

              {/* Chart Visual */}
              <div className="h-48 w-full flex flex-col justify-end relative pt-4">
                <svg className="w-full h-36 overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.5" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.5" />
                  <line x1="0" y1="90" x2="400" y2="90" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.5" />
                  {/* Area fill */}
                  <path
                    d="M 0,105 Q 80,95 160,80 T 280,50 T 400,30 L 400,120 L 0,120 Z"
                    fill="url(#revenueGrad)"
                  />
                  {/* Trend line */}
                  <path
                    d="M 0,105 Q 80,95 160,80 T 280,50 T 400,30"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Data points */}
                  <circle cx="160" cy="80" r="4" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
                  <circle cx="280" cy="50" r="4" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
                  <circle cx="400" cy="30" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                </svg>

                <div className="flex justify-between text-[11px] text-stone-400 font-medium pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span>มิ.ย.</span>
                  <span>ก.ค.</span>
                  <span>ส.ค.</span>
                  <span>ก.ย.</span>
                  <span className="font-bold text-amber-600">ต.ค. (ปัจจุบัน)</span>
                </div>
              </div>
            </div>

            {/* Chart 2: อัตราการเติบโตของสมาชิกผู้ใช้ */}
            <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight">
                    อัตราการเติบโตของสมาชิกผู้ใช้ (AUDITOR REGISTRATIONS TREND)
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    แสดงจำนวนสถิติผู้สมัครใช้งานระบบทั้งหมดรวมแอดมินและผู้ใช้งานทั่วไป
                  </p>
                </div>
                <Radio className="w-4 h-4 text-blue-600" />
              </div>

              {/* Chart Visual */}
              <div className="h-48 w-full flex flex-col justify-end relative pt-4">
                <svg className="w-full h-36 overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.5" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.5" />
                  <line x1="0" y1="90" x2="400" y2="90" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.5" />
                  {/* Area fill */}
                  <path
                    d="M 0,110 Q 100,85 200,60 T 320,40 T 400,20 L 400,120 L 0,120 Z"
                    fill="url(#growthGrad)"
                  />
                  {/* Trend line */}
                  <path
                    d="M 0,110 Q 100,85 200,60 T 320,40 T 400,20"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Data points */}
                  <circle cx="200" cy="60" r="4" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="2" />
                  <circle cx="320" cy="40" r="4" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="2" />
                  <circle cx="400" cy="20" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                </svg>

                <div className="flex justify-between text-[11px] text-stone-400 font-medium pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span>มิ.ย.</span>
                  <span>ก.ค.</span>
                  <span>ส.ค.</span>
                  <span>ก.ย.</span>
                  <span className="font-bold text-blue-600">ต.ค. (ปัจจุบัน)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: จัดการผู้ใช้งาน (USER MANAGEMENT & BROADCAST - Image 2)           */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top Section: ((o)) ระบบประกาศข่าวสารหลังบ้าน (Broadcast / Announcement) - Collapsible */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden transition-all duration-300">
            {/* Header toggle bar */}
            <div
              onClick={() => setIsBroadcastExpanded(!isBroadcastExpanded)}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50/70 dark:hover:bg-stone-850 transition-colors select-none"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black text-sm shrink-0 border border-amber-300/60 dark:border-amber-800/60 shadow-xs">
                  <Megaphone className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-black text-xs">((o))</span>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                      ระบบประกาศข่าวสารหลังบ้าน (Broadcast / Announcement)
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isBroadcastActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {isBroadcastActive ? '● กำลังเปิดแสดงผลหน้าบ้าน' : '○ ปิดการแสดงผล'}
                    </span>
                  </div>
                  {!isBroadcastExpanded && (
                    <p className="text-xs text-stone-500 mt-1 truncate max-w-xl">
                      {broadcastText ? `ข้อความประกาศ: "${broadcastText}"` : 'คลิกเพื่อเปิดกล่องพิมพ์และส่งประกาศข่าวสารไปยังแถบแบนเนอร์หน้าบ้าน'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBroadcastExpanded(!isBroadcastExpanded);
                  }}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all cursor-pointer"
                >
                  <span>{isBroadcastExpanded ? 'ย่อ/ซ่อนกล่องประกาศ' : 'คลิกเปิดกล่องประกาศ'}</span>
                </button>
                <div className={`p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-transform duration-300 ${isBroadcastExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Expandable Slide-out Form */}
            {isBroadcastExpanded && (
              <div className="p-5 sm:p-6 pt-2 border-t border-stone-100 dark:border-stone-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-stone-500">
                    พิมพ์ข้อความเพื่อประกาศข่าวสารหรือระเบียบต่าง ๆ ไปยังแถบแบนเนอร์ด้านบนสุดหน้าเว็บของผู้ใช้ทุกคนในระบบแบบเรียลไทม์
                  </p>
                  <button
                    type="button"
                    onClick={handleToggleBroadcastActive}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer self-start sm:self-auto ${
                      isBroadcastActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {isBroadcastActive ? '● เปิดแสดงผล (คลิกเพื่อปิด)' : '○ ปิดการแสดงผล (คลิกเพื่อเปิด)'}
                  </button>
                </div>

                <form onSubmit={handleBroadcastSubmit} className="space-y-3">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      placeholder="พิมพ์ข้อความประกาศ เช่น '📢 แจ้งเตือน: อัปเดตระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างฯ พ.ศ. 2569 พร้อมเปิดให้ดาวน์โหลดแบบฟอร์มตรวจสอบพัสดุใหม่แล้ว!'"
                      className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100 leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-stone-400">
                      {isBroadcastActive ? '✨ แถบประกาศจะแสดงอยู่ด้านบนสุดของหน้าตรวจของสมาชิกทุกคนทันที' : '⏸️ ประกาศนี้ถูกปิดซ่อนไว้ชั่วคราว'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsBroadcastExpanded(false)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                      >
                        ย่อเก็บ
                      </button>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-600/30 flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>กดส่งประกาศ 🚀</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* System Update Broadcast (เหมือนระบบร้านคำก้อมวัสดุ) */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/80 dark:bg-stone-850/80 p-3.5 rounded-2xl border border-stone-200/60 dark:border-stone-800">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-amber-500 text-sm">✨</span>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        แจ้งเตือนอัปเดตเวอร์ชันใหม่ (แบบระบบร้านคำก้อมวัสดุ)
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        ส่งป๊อปอัปแจ้งเตือนสีเข้มขรึม พร้อมข้อความยืนยันความปลอดภัยบน Cloud ไปยังหน้าจอผู้ใช้งานทุกคน
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('audit-system-update-detected', {
                            detail: {
                              title: 'ระบบมีการอัปเดตเวอร์ชันใหม่!',
                              description: 'ทางทีมงานได้ทำการอัปเดตและปรับปรุงฟีเจอร์ใหม่เรียบร้อยแล้ว ข้อมูลทั้งหมดของคุณปลอดภัยในระบบ Cloud สามารถคลิกปุ่มด้านขวาเพื่อเริ่มใช้งานเวอร์ชันใหม่ได้ทันที'
                            }
                          })
                        );
                        showToast('👁️ เปิดแสดงตัวอย่างการแจ้งเตือนอัปเดตแล้ว');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      ดูตัวอย่าง
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await broadcastSystemUpdate({
                          title: 'ระบบมีการอัปเดตเวอร์ชันใหม่!',
                          description: 'ทางทีมงานได้ทำการอัปเดตและปรับปรุงฟีเจอร์ใหม่เรียบร้อยแล้ว ข้อมูลทั้งหมดของคุณปลอดภัยในระบบ Cloud สามารถคลิกปุ่มด้านขวาเพื่อเริ่มใช้งานเวอร์ชันใหม่ได้ทันที'
                        });
                        showToast('🚀 ส่งสัญญาณแจ้งเตือนอัปเดตไปยังผู้ใช้ทุกคนผ่าน Cloud เรียบร้อยแล้ว!');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>🚀 ส่งสัญญาณอัปเดต</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Members Table Card matching user's Image 2 */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    รายชื่อและสถานะของผู้ใช้ในระบบ
                  </h2>
                  <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                    {filteredMembers.length} ท่าน
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  ทะเบียนสมาชิกผู้ตรวจสอบภายใน อปท. (ไม่รวมผู้ดูแลระบบ ADMIN ที่ปักหมุดถาวร) สามารถปรับระดับ ต่ออายุ ล็อกบัญชี หรือลบได้โดยตรง
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, อปท., จังหวัด, อีเมล..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 w-56"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-hidden"
                >
                  <option value="all">ระดับ & สถานะทั้งหมด</option>
                  <option value="trial">🌱 ฟรี 30 วัน (ค่าเริ่มต้น)</option>
                  <option value="monthly">⭐ VIP (รายเดือน)</option>
                  <option value="annual">👑 PREMIUM (รายปี)</option>
                  <option value="active">ใช้งานได้ปกติ</option>
                  <option value="expiring">ใกล้หมดอายุ (&lt; 7 วัน)</option>
                  <option value="expired">หมดอายุแล้ว</option>
                  <option value="suspended">ถูกระงับสิทธิ์ / ล็อกบัญชี</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/80 text-stone-500 border-b border-stone-200 dark:border-stone-700 font-bold">
                    <th className="py-3 px-3">ชื่อผู้ใช้ (Username)</th>
                    <th className="py-3 px-3">อีเมล / เบอร์โทร</th>
                    <th className="py-3 px-3">สังกัด อปท.</th>
                    <th className="py-3 px-3">สถานะเชื่อมต่อ</th>
                    <th className="py-3 px-3">สถานะบัญชี</th>
                    <th className="py-3 px-3">ประเภท / หมดอายุสมาชิก</th>
                    <th className="py-3 px-3 text-right">สิทธิ์การใช้งาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {displayedUsers.map((u) => {
                    const isAdmin = u.role === 'admin' || u.username?.toLowerCase() === 'admin';
                    const isPinned = isAdmin || pinnedUsernames.includes(u.username);
                    const isSuspended = u.status === 'suspended';
                    const isMenuOpen = openActionUsername === u.username;

                    return (
                      <tr
                        key={u.username}
                        className={`transition-colors ${
                          isAdmin
                            ? 'bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-300/40 dark:border-amber-800/40 font-medium'
                            : isPinned
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-stone-800/50'
                            : 'hover:bg-amber-50/30 dark:hover:bg-stone-800/40'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2">
                            {isPinned && (
                              <span
                                className="text-amber-500 text-xs shrink-0"
                                title={isAdmin ? 'ปักหมุดบัญชีผู้ดูแลระบบสูงสุดไว้บนสุดถาวร' : 'ปักหมุดแล้ว'}
                              >
                                📌
                              </span>
                            )}
                            <div>
                              <div className="font-mono font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-1.5">
                                {isAdmin ? (
                                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-2 py-0.5 rounded-md text-xs font-black shadow-xs">
                                    ADMIN
                                  </span>
                                ) : null}
                                <span className={isAdmin ? 'text-amber-900 dark:text-amber-200 font-black' : ''}>
                                  @{u.username}
                                </span>
                                {u.passwordText && (
                                  <span className="text-[10px] text-stone-400 font-mono">(รหัส: {u.passwordText})</span>
                                )}
                              </div>
                              <div className={`text-[11px] font-semibold ${isAdmin ? 'text-amber-900 dark:text-amber-300 font-bold' : 'text-amber-800 dark:text-amber-400'}`}>
                                {u.displayName}
                              </div>
                              <div className="text-[10px] text-stone-400">
                                {u.position || (isAdmin ? 'ผู้ดูแลระบบระบบตรวจสอบภายใน (Platform Root)' : 'นักวิชาการตรวจสอบภายใน')}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-stone-700 dark:text-stone-300 font-mono text-[11px]">
                            {u.email || `${u.username}@ia-os.local`}
                          </div>
                          {u.phone && (
                            <div className="text-[10px] text-stone-400 font-mono">
                              📞 {u.phone}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className={`font-semibold ${isAdmin ? 'text-amber-900 dark:text-amber-200 font-bold' : 'text-stone-800 dark:text-stone-200'}`}>
                            {u.organization || (isAdmin ? 'ศูนย์ควบคุมแพลตฟอร์มส่วนกลาง (Audit-OS Cloud)' : 'อปท.ต้นแบบ')}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {u.province ? `จ.${u.province}` : (isAdmin ? 'ส่วนกลาง' : 'ไม่ระบุจังหวัด')}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {/* Connection Status matching Image 2 */}
                          <div className="inline-flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                              ● Online
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {isSuspended ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              SUSPENDED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ACTIVE
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {renderLuxuryTierBadge(u)}
                        </td>

                        {/* Action Menu (3 dots ⋮) matching Image 2 */}
                        <td className="py-3 px-3 text-right relative">
                          <div className="inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionUsername(isMenuOpen ? null : u.username);
                              }}
                              className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer transition-all border border-stone-200 dark:border-stone-700 shadow-2xs"
                              title="คลิกเพื่อจัดการ"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu matching Image 2 */}
                            {isMenuOpen && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-0 top-10 z-50 w-56 bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-stone-700 p-1.5 space-y-1 text-left animate-in fade-in slide-in-from-top-2"
                              >
                                {isAdmin ? (
                                  <>
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-amber-400 border-b border-stone-800 flex items-center space-x-1">
                                      <span>👑 สิทธิ์ผู้ดูแลระบบสูงสุด (ADMIN)</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMember(u);
                                        setShowEditMemberModal(true);
                                        setOpenActionUsername(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-amber-200 cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                      <span>แก้ไขข้อมูล / รหัสผ่าน Admin</span>
                                    </button>
                                    {onSwitchToWorkbench && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionUsername(null);
                                          onSwitchToWorkbench();
                                        }}
                                        className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-emerald-200 cursor-pointer"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>เข้าสู่หน้าตรวจ (Workbench)</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePin(u.username)}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-amber-200 cursor-pointer"
                                    >
                                      <Pin className="w-3.5 h-3.5 text-amber-400" />
                                      <span>{isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดสมาชิก (Pin)'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenChangeTier(u)}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-blue-200 cursor-pointer"
                                    >
                                      <Award className="w-3.5 h-3.5 text-blue-400" />
                                      <span>ปรับระดับสมาชิก (Tier)</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleQuickExtend(u.username, 30, 'monthly')}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-emerald-200 cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>ต่ออายุ +30 วัน (VIP)</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleQuickExtend(u.username, 365, 'annual')}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-yellow-200 cursor-pointer"
                                    >
                                      <Crown className="w-3.5 h-3.5 text-yellow-400" />
                                      <span>ต่ออายุ +1 ปี (PREMIUM)</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleSuspend(u)}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-stone-300 cursor-pointer"
                                    >
                                      {isSuspended ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                                      <span>{isSuspended ? 'ปลดล็อกบัญชี' : 'ล็อกบัญชี (Lock)'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleExpireNow(u)}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-rose-300 cursor-pointer"
                                    >
                                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                                      <span>สิ้นสุด Trial ทันที (Expire Now)</span>
                                    </button>

                                    <div className="border-t border-stone-800 my-1" />

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMember(u);
                                        setShowEditMemberModal(true);
                                        setOpenActionUsername(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-stone-200 cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                                      <span>แก้ไขข้อมูล / รหัสผ่าน</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(u)}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-rose-950/60 flex items-center space-x-2 text-rose-400 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                      <span>ลบบัญชีถาวร</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ตั้งค่าแพ็กเกจและ QR (PACKAGES & QR SETTINGS - Image 3)            */}
      {/* ========================================================================= */}
      {activeTab === 'pricing_qr' && (
        <form onSubmit={handleSaveSettingsAndPricing} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: ตั้งค่า PromptPay และ QR Code matching Image 3 */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
              <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
                  ตั้งค่า PromptPay และ QR Code
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    หมายเลขพร้อมเพย์ (PROMPTPAY ID)
                  </label>
                  <input
                    type="text"
                    value={settings.promptPayNo || '0619614953'}
                    onChange={(e) => setSettings({ ...settings, promptPayNo: e.target.value })}
                    placeholder="เช่น 0619614953"
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono font-black text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    ชื่อผู้รับเงิน / บัญชี (RECEIVER ACCOUNT NAME)
                  </label>
                  <input
                    type="text"
                    value={settings.bankAccountName || 'นายทุมมงคล ธรรมพิทักษ์'}
                    onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                    placeholder="เช่น นายทุมมงคล ธรรมพิทักษ์"
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    รูปภาพคิวอาร์โค้ดใหม่ (CUSTOM QR CODE IMAGE)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={qrFileInputRef}
                      onChange={handleQrUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => qrFileInputRef.current?.click()}
                      className="flex-1 bg-stone-800 hover:bg-stone-750 text-amber-200 border border-amber-500/30 px-3 py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{settings.qrCodeImage ? 'เปลี่ยนรูปภาพ QR Code' : 'เลือกรูปภาพ QR Code'}</span>
                    </button>
                    {settings.qrCodeImage && (
                      <button
                        type="button"
                        onClick={handleResetQr}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl font-bold cursor-pointer transition-all"
                      >
                        รีเซ็ต
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    * แนะนำขนาดไม่เกิน 800 KB ระบบจะทำการแปลงเป็นรูปภาพฝังในระบบให้ทันที หากยังไม่มีรูปภาพ ระบบจะจำลองกราฟิกพร้อมเพย์ทางการให้อัตโนมัติ
                  </p>
                </div>

                {/* Live PromptPay Preview Card matching user's Image 3 */}
                <div className="pt-2">
                  <div className="text-center font-bold text-stone-500 text-[11px] mb-2">
                    ตัวอย่าง QR CODE และใบชำระเงินจริง
                  </div>

                  <div className="max-w-xs mx-auto bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden text-stone-900">
                    {/* PromptPay Official Header Bar */}
                    <div className="bg-[#003b70] text-white p-3 text-center space-y-0.5">
                      <div className="text-xs font-black tracking-widest uppercase">PROMPTPAY</div>
                      <div className="text-[10px] opacity-80">พร้อมเพย์ • ชำระเงินสะดวก ทันที</div>
                    </div>

                    <div className="p-4 text-center space-y-3">
                      <div className="w-40 h-40 mx-auto bg-stone-50 border-2 border-stone-900 rounded-xl p-2 flex items-center justify-center shadow-inner">
                        {settings.qrCodeImage ? (
                          <img
                            src={settings.qrCodeImage}
                            alt="PromptPay QR Code"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="text-center space-y-1">
                            <div className="text-3xl">📱</div>
                            <div className="font-mono text-xs font-black text-stone-800 tracking-wider">
                              {settings.promptPayNo || '0619614953'}
                            </div>
                            <div className="text-[9px] text-stone-400">สแกนผ่านแอปธนาคารทุกแห่ง</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 pt-1 border-t border-stone-100">
                        <div className="font-mono font-black text-sm text-stone-900 tracking-wider">
                          {settings.promptPayNo || '0619614953'}
                        </div>
                        <div className="text-xs font-bold text-stone-700">
                          {settings.bankAccountName || 'นายทุมมงคล ธรรมพิทักษ์'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          สแกน QR เพื่อโอนชำระเงินค่าบริการ Audit-OS
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: ระบบจัดการข้อมูลแพ็กเกจราคาหน้าบ้าน matching Image 3 */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
              <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
                  ระบบจัดการข้อมูลแพ็กเกจราคาหน้าบ้าน
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. สมาชิกฟรี 30 วัน */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      <span>🌱</span> <span>ฟรี 30 วัน (ค่าเริ่มต้น)</span>
                    </span>
                    <span className="text-xs font-black text-emerald-600">ฟรี 30 วัน</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    ผู้ตรวจสอบภายในทุกคนที่ลงทะเบียนใหม่จะได้รับสิทธิ์ทดลองใช้งาน 30 วันนี้อัตโนมัติ โดยไม่ต้องรอการอนุมัติ
                  </p>
                </div>

                {/* 2. แพ็กเกจรายเดือน (MONTHLY VIP) */}
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-xs">
                      <span>⭐</span> <span>แพ็กเกจรายเดือน (MONTHLY VIP)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ชื่อแพ็กเกจ</label>
                      <input
                        type="text"
                        value="Monthly VIP"
                        disabled
                        className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ราคา (บาท)</label>
                      <input
                        type="number"
                        value={settings.monthlyPrice || 299}
                        onChange={(e) => setSettings({ ...settings, monthlyPrice: parseFloat(e.target.value) || 299 })}
                        className="w-full p-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-stone-800 font-bold text-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                      รายละเอียดสิทธิประโยชน์ (หนึ่งรายการต่อหนึ่งบรรทัด)
                    </label>
                    <textarea
                      rows={3}
                      value={settings.vipBenefits || ''}
                      onChange={(e) => setSettings({ ...settings, vipBenefits: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 leading-relaxed font-sans"
                    />
                  </div>
                </div>

                {/* 3. แพ็กเกจรายปี (ANNUAL PREMIUM) */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-xs">
                      <span>👑</span> <span>แพ็กเกจรายปี (ANNUAL PREMIUM)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ชื่อแพ็กเกจ</label>
                      <input
                        type="text"
                        value="Annual Premium"
                        disabled
                        className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ราคา (บาท)</label>
                      <input
                        type="number"
                        value={settings.annualPrice || 2990}
                        onChange={(e) => setSettings({ ...settings, annualPrice: parseFloat(e.target.value) || 2990 })}
                        className="w-full p-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 font-black text-amber-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                      รายละเอียดสิทธิประโยชน์ (หนึ่งรายการต่อหนึ่งบรรทัด)
                    </label>
                    <textarea
                      rows={3}
                      value={settings.premiumBenefits || ''}
                      onChange={(e) => setSettings({ ...settings, premiumBenefits: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-amber-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกตั้งค่ารับเงินและอัปเดตแพ็กเกจหน้าสมัครสมาชิก 💾</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ประวัติชำระเงิน (BILLING & TRANSACTIONS)                           */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <span>บันทึกรายได้ & ประวัติการชำระเงิน</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  รวม ฿{metrics.totalRevenue.toLocaleString()}
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                บันทึกการรับชำระค่าสมาชิกรายเดือนและรายปี พร้อมต่ออายุอัตโนมัติ
              </p>
            </div>

            <button
              onClick={() => {
                setPaymentForm({
                  username: users.find((u) => u.role !== 'admin')?.username || '',
                  plan: 'annual',
                  amount: '2990',
                  method: 'พร้อมเพย์ / โอนเงินธนาคาร',
                  refNo: `TRX-${Date.now().toString().slice(-4)}`,
                  date: new Date().toISOString().split('T')[0],
                  note: 'ชำระค่าสมาชิกรายปี',
                  autoExtend: true
                });
                setShowAddPaymentModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกการรับชำระเงิน</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/80 text-stone-500 border-b border-stone-200 dark:border-stone-700 font-bold">
                  <th className="py-3 px-3">เลขที่ใบเสร็จ</th>
                  <th className="py-3 px-3">สมาชิกผู้ตรวจสอบ</th>
                  <th className="py-3 px-3">แพ็กเกจ</th>
                  <th className="py-3 px-3 text-right">จำนวนเงิน</th>
                  <th className="py-3 px-3">ช่องทางชำระ</th>
                  <th className="py-3 px-3">วันที่</th>
                  <th className="py-3 px-3">บันทึกช่วยจำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-stone-400">
                      ยังไม่มีประวัติการชำระเงินในระบบ
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-stone-700 dark:text-stone-300">
                        {p.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900 dark:text-stone-100">{p.memberName || p.username}</div>
                        <div className="text-[10px] text-stone-400">@{p.username} • {p.organization}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {p.plan === 'monthly' ? 'VIP รายเดือน' : 'PREMIUM รายปี'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 text-sm">
                        ฿{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-stone-600 dark:text-stone-300">{p.method}</td>
                      <td className="py-3 px-3 text-stone-500">{p.paidAt}</td>
                      <td className="py-3 px-3 text-stone-500 max-w-xs truncate">{p.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE TIER (ปรับระดับสมาชิก 3 ระดับ)                               */}
      {/* ========================================================================= */}
      {showChangeTierModal && tierTargetUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 space-y-5 border border-stone-200 dark:border-stone-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
                  ปรับระดับสมาชิก: @{tierTargetUser.username}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangeTierModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl space-y-1">
                <div><strong>ชื่อผู้ตรวจ:</strong> {tierTargetUser.displayName}</div>
                <div><strong>สังกัด:</strong> {tierTargetUser.organization}</div>
              </div>

              <div>
                <label className="block font-bold mb-1.5 text-stone-700 dark:text-stone-300">
                  เลือกระดับสมาชิกใหม่
                </label>
                <div className="space-y-2">
                  <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedNewTier === 'trial'
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="tier"
                        value="trial"
                        checked={selectedNewTier === 'trial'}
                        onChange={() => {
                          setSelectedNewTier('trial');
                          setTierDurationDays(30);
                        }}
                      />
                      <div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">🌱 ฟรี 30 วัน (ค่าเริ่มต้น)</div>
                        <div className="text-[11px] text-stone-500">ทดลองใช้งานฟรี 30 วัน</div>
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedNewTier === 'monthly'
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="tier"
                        value="monthly"
                        checked={selectedNewTier === 'monthly'}
                        onChange={() => {
                          setSelectedNewTier('monthly');
                          setTierDurationDays(30);
                        }}
                      />
                      <div>
                        <div className="font-bold text-indigo-700 dark:text-indigo-400">⭐ VIP (รายเดือน)</div>
                        <div className="text-[11px] text-stone-500">ปลดล็อกทุกกระดาษทำการ (30 วัน)</div>
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedNewTier === 'annual'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="tier"
                        value="annual"
                        checked={selectedNewTier === 'annual'}
                        onChange={() => {
                          setSelectedNewTier('annual');
                          setTierDurationDays(365);
                        }}
                      />
                      <div>
                        <div className="font-bold text-amber-600 dark:text-amber-400">👑 PREMIUM (รายปี)</div>
                        <div className="text-[11px] text-stone-500">ระดับสูงสุด พร้อมคลังระเบียบทอง 2569 (365 วัน)</div>
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedNewTier === 'lifetime'
                      ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="tier"
                        value="lifetime"
                        checked={selectedNewTier === 'lifetime'}
                        onChange={() => {
                          setSelectedNewTier('lifetime');
                          setTierDurationDays(9999);
                        }}
                      />
                      <div>
                        <div className="font-bold text-purple-700 dark:text-purple-400">💎 LIFETIME VIP (ตลอดชีพ)</div>
                        <div className="text-[11px] text-stone-500">ไม่จำกัดวันหมดอายุ (ถาวร)</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {selectedNewTier !== 'lifetime' && (
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    จำนวนวันอายุการใช้งานนับจากวันนี้ (วัน)
                  </label>
                  <input
                    type="number"
                    value={tierDurationDays}
                    onChange={(e) => setTierDurationDays(parseInt(e.target.value) || 30)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono font-bold"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    หมดอายุประมาณ: {new Date(Date.now() + tierDurationDays * 86400000).toLocaleDateString('th-TH')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowChangeTierModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-stone-400 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveChangeTier}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                บันทึกการปรับระดับ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT MEMBER / PASSWORD                                            */}
      {/* ========================================================================= */}
      {showEditMemberModal && editingMember && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <span>แก้ไขข้อมูล: @{editingMember.username}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditMemberModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  updateUser(editingMember.username, editingMember);
                  setShowEditMemberModal(false);
                  reloadData();
                  showToast(`อัปเดตข้อมูล @${editingMember.username} เรียบร้อยแล้ว`);
                } catch (err) {
                  alert(err.message);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={editingMember.displayName || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, displayName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">สังกัด อปท.</label>
                <input
                  type="text"
                  value={editingMember.organization || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, organization: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  value={editingMember.position || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, position: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">รหัสผ่านใหม่ (ระบุเมื่อต้องการเปลี่ยน)</label>
                <input
                  type="text"
                  value={editingMember.newPassword || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, newPassword: e.target.value })}
                  placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowEditMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PAYMENT                                                        */}
      {/* ========================================================================= */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-100 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>บันทึกการรับชำระเงินใหม่</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPaymentModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">เลือกสมาชิกผู้ตรวจสอบ</label>
                <select
                  value={paymentForm.username}
                  onChange={(e) => setPaymentForm({ ...paymentForm, username: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  required
                >
                  <option value="">-- เลือกสมาชิก --</option>
                  {users
                    .filter((u) => u.role !== 'admin')
                    .map((u) => (
                      <option key={u.username} value={u.username}>
                        {u.displayName} ({u.organization || 'อบต.'}) - @{u.username}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">แพ็กเกจ</label>
                  <select
                    value={paymentForm.plan}
                    onChange={(e) => {
                      const p = e.target.value;
                      setPaymentForm({
                        ...paymentForm,
                        plan: p,
                        amount: p === 'monthly' ? (settings.monthlyPrice || 299).toString() : (settings.annualPrice || 2990).toString()
                      });
                    }}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  >
                    <option value="annual">PREMIUM รายปี (฿{settings.annualPrice || 2990})</option>
                    <option value="monthly">VIP รายเดือน (฿{settings.monthlyPrice || 299})</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-black text-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">ช่องทางการชำระ</label>
                  <input
                    type="text"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">วันที่ชำระ</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">บันทึกช่วยจำ / เลขที่อ้างอิง</label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  placeholder="เช่น สลิปโอนเงิน กสิกรไทย 14:30 น."
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentForm.autoExtend}
                    onChange={(e) => setPaymentForm({ ...paymentForm, autoExtend: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    ต่ออายุสมาชิกโดยอัตโนมัติ (+{paymentForm.plan === 'monthly' ? '30 วัน' : '1 ปี'})
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการชำระเงิน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
