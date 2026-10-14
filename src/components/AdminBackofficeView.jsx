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
  KeyRound,
  Image as ImageIcon,
  MessageSquarePlus,
  MessageCircle
} from 'lucide-react';
import {
  getUsers,
  saveUsers,
  pullUsersFromCloud,
  subscribeToCloudUsers,
  getPendingUsers,
  savePendingUsers,
  clearPendingUsers,
  dismissPendingUser,
  getMembershipPlans,
  MEMBERSHIP_PLANS,
  getPaymentRecords,
  savePaymentRecords,
  getSystemSettings,
  saveSystemSettings,
  saveBroadcastAnnouncement,
  approveMemberRegistration,
  rejectMemberRegistration,
  extendMemberSubscription,
  setMemberExactExpiryDate,
  getSubscriptionCountdown,
  resetUserPassword,
  updateUser,
  deleteUser,
  addUser
} from '../utils/auth';
import { broadcastSystemUpdate, APP_VERSION } from '../utils/versionCheck';
import {
  getUserFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
  clearAllFeedbacks,
  subscribeToFeedbacks,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES
} from '../utils/feedbackUtils';
import { luxuryConfirm, luxuryAlert } from './LuxuryModal';

export default function AdminBackofficeView({
  currentSession,
  session,
  activeTab: controlledActiveTab,
  onTabChange,
  onSwitchToWorkbench,
  onRefreshUser
}) {
  const activeSession = session || currentSession;

  // 6 Primary Tabs for Super Admin Console
  // 'overview' = ภาพรวมระบบ (Dashboard & Analytics)
  // 'users' = จัดการผู้ใช้งาน (User Management & Directory)
  // 'pricing_qr' = ตั้งค่าแพ็กเกจและ QR (Pricing & PromptPay QR)
  // 'billing' = บันทึกรายได้ & ประวัติชำระเงิน
  // 'feedbacks' = กล่องข้อเสนอแนะ & แจ้งต่ออายุ
  // 'system' = ประกาศระบบ & สำรองข้อมูล
  const [internalActiveTab, setInternalActiveTab] = useState(controlledActiveTab || 'overview');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = (tab) => {
    setInternalActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [users, setUsers] = useState(() => getUsers());
  const [pendingUsers, setPendingUsers] = useState(() => getPendingUsers());
  const [payments, setPayments] = useState(() => getPaymentRecords());
  const [settings, setSettings] = useState(() => getSystemSettings());

  // Manual Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    displayName: '',
    organization: '',
    province: '',
    position: 'นักวิชาการตรวจสอบภายใน',
    plan: 'annual',
    password: ''
  });
  const [addUserError, setAddUserError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // User Feedbacks State
  const [feedbacks, setFeedbacks] = useState(() => getUserFeedbacks());
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [adminReplyTexts, setAdminReplyTexts] = useState({});

  useEffect(() => {
    const handleFbUpdate = () => setFeedbacks(getUserFeedbacks());
    window.addEventListener('ia_feedbacks_updated', handleFbUpdate);
    const unsubscribe = subscribeToFeedbacks((latest) => {
      setFeedbacks(latest);
    });
    return () => {
      window.removeEventListener('ia_feedbacks_updated', handleFbUpdate);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const pendingFeedbackCount = feedbacks.filter((f) => f.status === 'pending').length;

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (feedbackStatusFilter !== 'all' && f.status !== feedbackStatusFilter) return false;
      if (feedbackCategoryFilter !== 'all' && f.category !== feedbackCategoryFilter) return false;
      if (!feedbackSearch.trim()) return true;
      const q = feedbackSearch.toLowerCase();
      return (
        (f.title || '').toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q) ||
        (f.userName || '').toLowerCase().includes(q) ||
        (f.orgName || '').toLowerCase().includes(q)
      );
    });
  }, [feedbacks, feedbackStatusFilter, feedbackCategoryFilter, feedbackSearch]);

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
  const [customExpiryDate, setCustomExpiryDate] = useState('');

  // Live Membership Countdown Timer (ticks every second)
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Admin Reset Password Modal
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordTargetUser, setResetPasswordTargetUser] = useState(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    username: '',
    plan: 'annual',
    amount: '200',
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

  // Sync pending users and system settings when changed
  useEffect(() => {
    const handlePendingChanged = () => {
      setPendingUsers(getPendingUsers());
    };
    const handleSettingsChanged = (e) => {
      if (e.detail) setSettings(e.detail);
      else setSettings(getSystemSettings());
    };
    window.addEventListener('ia-pending-users-changed', handlePendingChanged);
    window.addEventListener('ia-settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('ia-pending-users-changed', handlePendingChanged);
      window.removeEventListener('ia-settings-changed', handleSettingsChanged);
    };
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

  // Dynamic 5-Month Real Data Trend Charts calculation
  const chartData = useMemo(() => {
    const THAI_MONTHS_SHORT = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const now = new Date();
    const months = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      months.push({
        label: THAI_MONTHS_SHORT[d.getMonth()] + (i === 0 ? ' (ปัจจุบัน)' : ''),
        shortLabel: THAI_MONTHS_SHORT[d.getMonth()],
        isCurrent: i === 0,
        timestamp: endOfMonth.getTime()
      });
    }

    const parseDateMs = (val) => {
      if (!val) return null;
      if (typeof val === 'number') return val;
      const t = new Date(val).getTime();
      return isNaN(t) ? null : t;
    };

    // 1. Cumulative Auditor Registrations Trend
    const regularAuditors = users.filter((u) => u.role !== 'admin' && u.username?.toLowerCase() !== 'admin');
    const userPoints = months.map((m) => {
      return regularAuditors.filter((u) => {
        const uTime = parseDateMs(u.createdAt) || parseDateMs(u.registeredAt) || Date.now();
        return uTime <= m.timestamp;
      }).length;
    });

    // 2. Cumulative Revenue Trend (from payment records)
    const revenuePoints = months.map((m) => {
      return payments.reduce((sum, p) => {
        const pTime = parseDateMs(p.paidAt) || parseDateMs(p.createdAt) || parseDateMs(p.date) || Date.now();
        if (pTime <= m.timestamp) {
          return sum + (Number(p.amount) || 0);
        }
        return sum;
      }, 0);
    });

    // Helper to calculate SVG coordinates and smooth paths
    const buildPath = (values, baselineY = 100, topY = 25) => {
      const maxVal = Math.max(...values, 1);
      const range = baselineY - topY; // 75px
      const xCoords = [35, 118, 200, 282, 365];

      const points = values.map((val, idx) => {
        const y = Math.max(...values) === 0
          ? baselineY
          : baselineY - (val / maxVal) * range;
        return { x: xCoords[idx], y, val };
      });

      // Build smooth cubic Bezier path
      let linePath = `M ${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
      }

      const last = points[points.length - 1];
      const first = points[0];
      const areaPath = `${linePath} L ${last.x},115 L ${first.x},115 Z`;

      return { points, linePath, areaPath, maxVal };
    };

    return {
      months,
      users: {
        values: userPoints,
        ...buildPath(userPoints),
        currentTotal: regularAuditors.length
      },
      revenue: {
        values: revenuePoints,
        ...buildPath(revenuePoints),
        currentTotal: payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      }
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
  const handleToggleSuspend = async (user) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const actionLabel = newStatus === 'suspended' ? 'ล็อกบัญชี (ระงับสิทธิ์)' : 'ปลดล็อกบัญชี (เปิดสิทธิ์)';
    const confirmed = await luxuryConfirm({
      title: `ยืนยัน${actionLabel}`,
      message: `คุณต้องการ${actionLabel} การเข้าใช้งานของบัญชีนี้หรือไม่?`,
      itemTitle: `@${user.username} (${user.displayName || 'ผู้ใช้งาน'})`,
      confirmText: actionLabel,
      variant: newStatus === 'suspended' ? 'danger' : 'warning'
    });
    if (!confirmed) return;

    try {
      updateUser(user.username, { status: newStatus });
      reloadData();
      showToast(`${actionLabel} @${user.username} เรียบร้อยแล้ว`);
      setOpenActionUsername(null);
    } catch (err) {
      luxuryAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, variant: 'danger' });
    }
  };

  // Force Expire Trial Now
  const handleExpireNow = async (user) => {
    const confirmed = await luxuryConfirm({
      title: 'ยืนยันการสิ้นสุดสิทธิ์ทันที',
      message: `ต้องการปรับให้ระยะเวลาการใช้งานของบัญชีนี้หมดอายุทันทีหรือไม่?`,
      itemTitle: `@${user.username} (${user.displayName || 'ผู้ใช้งาน'})`,
      confirmText: 'สิ้นสุดสิทธิ์ทันที',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      updateUser(user.username, { expiresAt: new Date(Date.now() - 1000).toISOString() });
      reloadData();
      showToast(`⛔ สิ้นสุดสิทธิ์ของ @${user.username} ทันทีแล้ว`);
      setOpenActionUsername(null);
    } catch (err) {
      luxuryAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, variant: 'danger' });
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
      luxuryAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, variant: 'danger' });
    }
  };

  // Delete User Permanently
  const handleDeleteUser = async (user) => {
    const confirmed = await luxuryConfirm({
      title: 'ยืนยันการลบบัญชีผู้ใช้งานอย่างถาวร',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้นี้ออกจากระบบ?',
      itemTitle: `${user.displayName} (@${user.username})`,
      subMessage: '⚠️ คำเตือน: ข้อมูลบัญชี สิทธิ์การเข้าถึง และประวัติทั้งหมดจะไม่สามารถกู้คืนได้',
      confirmText: 'ลบบัญชีถาวร',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      deleteUser(user.username);
      reloadData();
      showToast(`ลบบัญชี @${user.username} ออกจากระบบเรียบร้อยแล้ว`);
      setOpenActionUsername(null);
    } catch (err) {
      luxuryAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, variant: 'danger' });
    }
  };

  // Open Change Tier Modal
  const handleOpenChangeTier = (user) => {
    setTierTargetUser(user);
    const p = user.plan || 'trial';
    setSelectedNewTier(p);
    const defaultDays = p === 'monthly' ? 30 : p === 'annual' ? 365 : 30;
    
    // Default to standard package duration from today
    const d = new Date(Date.now() + defaultDays * 86400000);
    setTierDurationDays(defaultDays);
    setCustomExpiryDate(d.toISOString().split('T')[0]);
    
    setShowChangeTierModal(true);
    setOpenActionUsername(null);
  };

  // Helper when clicking a tier radio button in Change Tier modal
  const handleSelectTier = (tier) => {
    setSelectedNewTier(tier);
    if (tier === 'lifetime') {
      setTierDurationDays(9999);
      setCustomExpiryDate('');
      return;
    }
    const days = tier === 'monthly' ? 30 : tier === 'annual' ? 365 : (settings.trialDays || 30);
    setTierDurationDays(days);
    const d = new Date(Date.now() + days * 86400000);
    setCustomExpiryDate(d.toISOString().split('T')[0]);
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
        let newExpiry;
        if (customExpiryDate) {
          newExpiry = new Date(`${customExpiryDate}T23:59:59.999Z`).toISOString();
        } else {
          newExpiry = new Date(Date.now() + tierDurationDays * 86400000).toISOString();
        }
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

  // Admin Reset Password Handlers
  const handleOpenResetPassword = (user) => {
    setResetPasswordTargetUser(user);
    setAdminNewPassword('');
    setAdminConfirmPassword('');
    setResetPasswordError('');
    setShowResetPasswordModal(true);
    setOpenActionUsername(null);
  };

  const handleSaveResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!resetPasswordTargetUser) return;
    setResetPasswordError('');

    if (!adminNewPassword) {
      setResetPasswordError('กรุณากรอกรหัสผ่านใหม่');
      return;
    }
    if (adminNewPassword.length < 4) {
      setResetPasswordError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      setResetPasswordError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      await resetUserPassword(resetPasswordTargetUser.username, adminNewPassword);
      setShowResetPasswordModal(false);
      setResetPasswordTargetUser(null);
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      reloadData();
      showToast(`🔑 รีเซ็ตรหัสผ่านใหม่ให้กับ @${resetPasswordTargetUser.username} เรียบร้อยแล้ว`);
    } catch (err) {
      setResetPasswordError(err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    }
  };

  // Pending User Management Handlers
  const handleClearAllPending = async () => {
    const confirmed = await luxuryConfirm({
      title: 'ยืนยันการล้างคำขอลงทะเบียน',
      message: 'คุณต้องการรับทราบและล้างการแจ้งเตือนคำขอลงทะเบียนทั้งหมดใช่หรือไม่?',
      confirmText: 'ล้างคำขอทั้งหมด',
      variant: 'warning'
    });
    if (!confirmed) return;

    clearPendingUsers();
    setPendingUsers([]);
    showToast('🧹 ล้างการแจ้งเตือนคำขอลงทะเบียนทั้งหมดเรียบร้อยแล้ว');
  };

  const handleDismissPending = (id, displayName) => {
    dismissPendingUser(id);
    setPendingUsers(getPendingUsers());
    showToast(`รับทราบคำขอของ ${displayName || id} และปิดการแจ้งเตือนแล้ว`);
  };

  const handleQuickUpgradePending = (pendingUser, tier = 'annual') => {
    try {
      const days = tier === 'annual' ? 365 : tier === 'monthly' ? 30 : 9999;
      approveMemberRegistration(pendingUser.id, tier, days);
      setPendingUsers(getPendingUsers());
      setUsers(getUsers());
      showToast(`อนุมัติและปรับระดับสมาชิก ${pendingUser.displayName || pendingUser.username} เรียบร้อยแล้ว!`);
    } catch (err) {
      luxuryAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, variant: 'danger' });
    }
  };

  // Submit Broadcast Announcement
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) {
      await luxuryAlert({
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกข้อความประกาศก่อนบันทึกและส่งกระจายเสียง',
        variant: 'warning'
      });
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
      const days = paymentForm.plan === 'monthly' ? 30 : paymentForm.plan === 'lifetime' ? 9999 : 365;
      extendMemberSubscription(paymentForm.username, days, paymentForm.plan);
    }

    setShowAddPaymentModal(false);
    reloadData();
    showToast(`บันทึกการชำระเงิน ${Number(paymentForm.amount).toLocaleString()} บาท เรียบร้อยแล้ว`);
  };

  // Submit Manual Add User by Admin
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setAddUserError('');
    if (!newUserForm.username.trim() || !newUserForm.displayName.trim() || !newUserForm.password.trim()) {
      setAddUserError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }
    try {
      await addUser({
        username: newUserForm.username.trim(),
        displayName: newUserForm.displayName.trim(),
        organization: newUserForm.organization.trim() || 'อปท.',
        province: newUserForm.province.trim() || '',
        position: newUserForm.position.trim() || 'นักวิชาการตรวจสอบภายใน',
        plan: newUserForm.plan,
        password: newUserForm.password.trim()
      });
      setShowAddUserModal(false);
      setNewUserForm({
        username: '',
        displayName: '',
        organization: '',
        province: '',
        position: 'นักวิชาการตรวจสอบภายใน',
        plan: 'annual',
        password: ''
      });
      reloadData();
      showToast(`✨ เพิ่มสมาชิกใหม่ @${newUserForm.username} เรียบร้อยแล้ว`);
    } catch (err) {
      setAddUserError(err.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน');
    }
  };

  // Export Super Admin System Full JSON Backup
  const handleExportSuperAdminBackup = () => {
    const backupData = {
      system: 'Audit-OS Platform Full Backup',
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: activeSession?.username || 'admin',
      users: getUsers(),
      pendingUsers: getPendingUsers(),
      payments: getPaymentRecords(),
      settings: getSystemSettings(),
      feedbacks: getUserFeedbacks()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AuditOS_SuperAdmin_FullBackup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📦 ดาวน์โหลดไฟล์สำรองข้อมูล Super Admin เรียบร้อยแล้ว');
  };

  // Import / Restore Super Admin System JSON Backup
  const handleImportSuperAdminBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.users && !parsed.settings) {
          await luxuryAlert({
            title: 'ไฟล์สำรองไม่ถูกต้อง',
            message: 'ไม่พบโครงสร้างข้อมูลของระบบ Audit-OS ในไฟล์ที่เลือก กรุณาตรวจสอบไฟล์สำรอง JSON',
            variant: 'warning'
          });
          return;
        }
        const confirmed = await luxuryConfirm({
          title: 'ยืนยันการกู้คืนฐานข้อมูลสำรอง',
          message: 'การกู้คืนข้อมูลจะนำเข้าข้อมูลสมาชิก การตั้งค่า และประวัติการชำระเงินเข้าสู่ระบบ',
          subMessage: '⚠️ คำเตือน: ข้อมูลระบบปัจจุบันจะถูกปรับปรุงตามไฟล์สำรอง โปรดตรวจสอบความถูกต้อง',
          confirmText: 'กู้คืนข้อมูลทันที',
          variant: 'warning'
        });
        if (!confirmed) return;

        if (Array.isArray(parsed.users)) saveUsers(parsed.users);
        if (Array.isArray(parsed.pendingUsers)) savePendingUsers(parsed.pendingUsers);
        if (Array.isArray(parsed.payments)) savePaymentRecords(parsed.payments);
        if (parsed.settings) saveSystemSettings(parsed.settings);
        if (Array.isArray(parsed.feedbacks)) {
          localStorage.setItem('ia_user_feedbacks', JSON.stringify(parsed.feedbacks));
          window.dispatchEvent(new CustomEvent('ia_feedbacks_updated'));
        }
        reloadData();
        showToast('✅ กู้คืนข้อมูลระบบ Super Admin จากไฟล์สำรองเรียบร้อยแล้ว');
      } catch (err) {
        luxuryAlert({
          title: 'อ่านไฟล์สำรองไม่สำเร็จ',
          message: 'ไม่สามารถอ่านไฟล์ JSON สำรองได้: ' + err.message,
          variant: 'danger'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Helper to render luxury badges based on the 3 tiers with LIVE COUNTDOWN
  const renderLuxuryTierBadge = (user) => {
    const planKey = user.plan || 'trial';
    const countdown = getSubscriptionCountdown(user, currentTime);
    const expiryFormatted = user.expiresAt ? new Date(user.expiresAt).toLocaleDateString('th-TH') : '-';

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

    if (countdown.isExpired) {
      return (
        <div className="inline-flex flex-col items-start gap-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <span>▲</span>
            <span>หมดอายุแล้ว</span>
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium ml-1">
            สิ้นสุดเมื่อ {expiryFormatted}
          </span>
        </div>
      );
    }

    if (planKey === 'annual') {
      return (
        <div className="inline-flex flex-col items-start gap-1">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-stone-950 border border-amber-200 shadow-md shadow-amber-500/35 tracking-wider">
            <span>👑</span>
            <span>{settings.annualPlanName || 'PREMIUM ★ (รายปี)'}</span>
          </div>
          <div className="inline-flex items-center space-x-1 text-[10px] text-amber-700 dark:text-amber-400 font-bold ml-1" title={`วันหมดอายุ: ${user.expiresAt ? new Date(user.expiresAt).toLocaleString('th-TH') : '-'}`}>
            <Clock className="w-3 h-3 text-amber-600 shrink-0 animate-pulse" />
            <span>⏱️ เหลือ: {countdown.text}</span>
          </div>
        </div>
      );
    }

    if (planKey === 'monthly') {
      return (
        <div className="inline-flex flex-col items-start gap-1">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white border border-blue-400/60 shadow-md shadow-indigo-600/30 tracking-wide">
            <span className="text-yellow-300 text-xs">⭐</span>
            <span>{settings.monthlyPlanName || 'VIP (รายเดือน)'}</span>
          </div>
          <div className="inline-flex items-center space-x-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold ml-1" title={`วันหมดอายุ: ${user.expiresAt ? new Date(user.expiresAt).toLocaleString('th-TH') : '-'}`}>
            <Clock className="w-3 h-3 text-indigo-500 shrink-0 animate-pulse" />
            <span>⏱️ เหลือ: {countdown.text}</span>
          </div>
        </div>
      );
    }

    if (planKey === 'lifetime') {
      return (
        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-purple-700 via-pink-600 to-purple-800 text-white border border-purple-300 shadow-md">
          <span>💎</span>
          <span>{settings.lifetimePlanName || 'LIFETIME VIP (ตลอดชีพ)'}</span>
        </div>
      );
    }

    // Default: ฟรี 30 วัน (ค่าเริ่มต้น)
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
          <span className="text-emerald-500">🌱</span>
          <span>{settings.trialPlanName || 'ฟรี 30 วัน (ค่าเริ่มต้น)'}</span>
        </div>
        <div className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium ml-1" title={`วันหมดอายุ: ${user.expiresAt ? new Date(user.expiresAt).toLocaleString('th-TH') : '-'}`}>
          <Clock className="w-3 h-3 text-emerald-600 shrink-0 animate-pulse" />
          <span>⏱️ เหลือ: {countdown.text}</span>
        </div>
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

      {/* Sub-tab Navigation (Overview, Users, Pricing & QR, Billing) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-1.5 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
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
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
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
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
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
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-gradient-to-r from-stone-900 to-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>ประวัติชำระเงิน ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('feedbacks')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'feedbacks'
              ? 'bg-gradient-to-r from-stone-900 to-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>ข้อเสนอแนะ {pendingFeedbackCount > 0 ? `(${pendingFeedbackCount} ใหม่)` : `(${feedbacks.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'system'
              ? 'bg-gradient-to-r from-stone-900 to-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>ประกาศระบบ & สำรองข้อมูล</span>
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

          {/* 2 Analytical Trend Charts dynamically calculated from real database */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: รายงานรายรับค่าสมัครสมาชิกสะสม */}
            <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight">
                      รายงานรายรับค่าสมัครสมาชิกสะสม (ESTIMATED SALES REVENUE)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                      ข้อมูลจริง ({payments.length} รายการ)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    ยอดชำระสะสมคำนวณจากประวัติการชำระเงินจริงในระบบ 5 เดือนย้อนหลัง
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    รวม ฿{chartData.revenue.currentTotal.toLocaleString()}
                  </span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
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
                  <line x1="0" y1="25" x2="400" y2="25" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.4" />
                  <line x1="0" y1="62" x2="400" y2="62" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.4" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.6" />

                  {/* Dynamic Area fill */}
                  <path
                    d={chartData.revenue.areaPath}
                    fill="url(#revenueGrad)"
                  />
                  {/* Dynamic Trend line */}
                  <path
                    d={chartData.revenue.linePath}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Real Data points & Value tags */}
                  {chartData.revenue.points.map((pt, idx) => (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={idx === 4 ? 6 : 4.5}
                        fill="#f59e0b"
                        stroke={idx === 4 ? "#ffffff" : "#78350f"}
                        strokeWidth={idx === 4 ? 2.5 : 1.5}
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 8}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-stone-700 dark:fill-stone-300 pointer-events-none"
                      >
                        ฿{pt.val.toLocaleString()}
                      </text>
                    </g>
                  ))}
                </svg>

                <div className="flex justify-between text-[11px] text-stone-400 font-medium pt-2 border-t border-stone-100 dark:border-stone-800 px-3">
                  {chartData.months.map((m, idx) => (
                    <span
                      key={idx}
                      className={m.isCurrent ? "font-bold text-amber-600 dark:text-amber-400" : ""}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 2: อัตราการเติบโตของสมาชิกผู้ใช้ */}
            <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight">
                      อัตราการเติบโตของสมาชิกผู้ใช้ (AUDITOR REGISTRATIONS TREND)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                      ข้อมูลจริง ({chartData.users.currentTotal} บัญชี)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    แสดงสถิติจำนวนผู้สมัครใช้งานจริงในระบบสะสมตามเดือนที่ลงทะเบียน
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    รวม {chartData.users.currentTotal} บัญชี
                  </span>
                  <Radio className="w-4 h-4 text-blue-600" />
                </div>
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
                  <line x1="0" y1="25" x2="400" y2="25" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.4" />
                  <line x1="0" y1="62" x2="400" y2="62" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.4" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.6" />

                  {/* Dynamic Area fill */}
                  <path
                    d={chartData.users.areaPath}
                    fill="url(#growthGrad)"
                  />
                  {/* Dynamic Trend line */}
                  <path
                    d={chartData.users.linePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Real Data points & Value tags */}
                  {chartData.users.points.map((pt, idx) => (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={idx === 4 ? 6 : 4.5}
                        fill="#3b82f6"
                        stroke={idx === 4 ? "#ffffff" : "#1e3a8a"}
                        strokeWidth={idx === 4 ? 2.5 : 1.5}
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 8}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-stone-700 dark:fill-stone-300 pointer-events-none"
                      >
                        {pt.val} บัญชี
                      </text>
                    </g>
                  ))}
                </svg>

                <div className="flex justify-between text-[11px] text-stone-400 font-medium pt-2 border-t border-stone-100 dark:border-stone-800 px-3">
                  {chartData.months.map((m, idx) => (
                    <span
                      key={idx}
                      className={m.isCurrent ? "font-bold text-blue-600 dark:text-blue-400" : ""}
                    >
                      {m.label}
                    </span>
                  ))}
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
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black transition-all shadow-sm shadow-amber-600/20 cursor-pointer flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                      <span>ส่งสัญญาณอัปเดต</span>
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

                <button
                  type="button"
                  onClick={() => {
                    setNewUserForm({
                      username: '',
                      displayName: '',
                      organization: '',
                      province: '',
                      position: 'นักวิชาการตรวจสอบภายใน',
                      plan: 'annual',
                      password: ''
                    });
                    setAddUserError('');
                    setShowAddUserModal(true);
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-1.5 px-3.5 rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มผู้ใช้งานใหม่</span>
                </button>
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
                                      onClick={() => handleOpenResetPassword(u)}
                                      className="w-full px-3 py-2 text-xs rounded-xl hover:bg-stone-800 flex items-center space-x-2 text-amber-300 cursor-pointer"
                                    >
                                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                                      <span>รีเซ็ตรหัสผ่านใหม่ (Reset)</span>
                                    </button>

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
                                      <span>แก้ไขข้อมูลสมาชิก</span>
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
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
                    ระบบจัดการข้อมูลแพ็กเกจราคาหน้าบ้าน
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    กำหนดรายละเอียดสิทธิประโยชน์ส่วนกลาง และปรับแต่งชื่อ-ราคาของแต่ละแพ็กเกจ
                  </p>
                </div>
              </div>

              {/* 1 กรอบรายละเอียดสิทธิประโยชน์รวมด้านบนสุด */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-850/60 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>รายละเอียดสิทธิประโยชน์ของระบบ (หนึ่งรายการต่อหนึ่งบรรทัด)</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 font-bold">
                    กรอบรายละเอียดส่วนกลาง
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={settings.platformBenefits || settings.systemBenefits || settings.trialBenefits || settings.premiumBenefits || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings({
                      ...settings,
                      platformBenefits: val,
                      systemBenefits: val,
                      trialBenefits: val,
                      vipBenefits: val,
                      premiumBenefits: val,
                      lifetimeBenefits: val
                    });
                  }}
                  placeholder="เช่น:&#10;### 🤝 สนับสนุนการพัฒนา Audit-OS&#10;**หากระบบนี้ช่วยให้งานของพี่ๆ ง่ายขึ้น สามารถร่วมสนับสนุนค่าใช้จ่ายในการดูแลและพัฒนาระบบได้ตามแพ็กเกจที่กำหนดเลยนะครับ"
                  className="w-full p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-850 text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-sans focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-inner"
                />
                <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80">
                  * ข้อความในกรอบนี้จะถูกใช้เป็นรายละเอียดสิทธิประโยชน์หลักของระบบสำหรับทุกแพ็กเกจ ทำให้การบริหารจัดการง่ายและไม่ซ้ำซ้อน
                </p>
              </div>

              {/* รายการแพ็กเกจ เรียงต่อลงมา โดยไม่มีกรอบรายละเอียดซ้ำอีก */}
              <div className="space-y-3 text-xs">
                {/* 1. สมาชิกฟรี 30 วัน */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      <span>🌱</span> <span>{settings.trialPlanName || 'ฟรี 30 วัน (ค่าเริ่มต้น)'}</span>
                    </span>
                    <span className="text-xs font-black text-emerald-600">ฟรี {settings.trialDays || 30} วัน (อัตโนมัติ)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ชื่อแพ็กเกจทดลองใช้</label>
                      <input
                        type="text"
                        value={settings.trialPlanName || ''}
                        onChange={(e) => setSettings({ ...settings, trialPlanName: e.target.value })}
                        placeholder="เช่น ฟรี 30 วัน (ค่าเริ่มต้น)"
                        className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-stone-800 dark:text-stone-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ระยะเวลาทดลอง (วัน)</label>
                      <input
                        type="number"
                        value={settings.trialDays || 30}
                        onChange={(e) => setSettings({ ...settings, trialDays: parseInt(e.target.value) || 30 })}
                        className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-emerald-600 text-xs"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-500">
                    ผู้ตรวจสอบภายในทุกคนที่ลงทะเบียนใหม่จะได้รับสิทธิ์ทดลองใช้งานนี้อัตโนมัติทันที 30 วัน โดยไม่ต้องรอการอนุมัติ
                  </p>
                </div>

                {/* 2. แพ็กเกจรายเดือน (VIP) */}
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-xs">
                      <span>⭐</span> <span>{settings.monthlyPlanName || 'VIP (รายเดือน)'}</span>
                    </span>
                    <span className="text-xs font-bold text-blue-600">ต่ออายุทุก 30 วัน</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ชื่อแพ็กเกจ</label>
                      <input
                        type="text"
                        value={settings.monthlyPlanName || ''}
                        onChange={(e) => setSettings({ ...settings, monthlyPlanName: e.target.value })}
                        placeholder="เช่น VIP (รายเดือน)"
                        className="w-full p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-stone-800 font-bold text-blue-700 dark:text-blue-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ราคา (บาท)</label>
                      <input
                        type="number"
                        value={settings.monthlyPrice || 60}
                        onChange={(e) => setSettings({ ...settings, monthlyPrice: parseFloat(e.target.value) || 60 })}
                        className="w-full p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-stone-800 font-bold text-blue-600 text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 3. แพ็กเกจรายปี (PREMIUM) */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-xs">
                      <span>👑</span> <span>{settings.annualPlanName || 'PREMIUM (รายปี)'}</span>
                    </span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">รายปี (365 วัน)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ชื่อแพ็กเกจ</label>
                      <input
                        type="text"
                        value={settings.annualPlanName || ''}
                        onChange={(e) => setSettings({ ...settings, annualPlanName: e.target.value })}
                        placeholder="เช่น PREMIUM (รายปี)"
                        className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-850 font-bold text-amber-700 dark:text-amber-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ราคา (บาท)</label>
                      <input
                        type="number"
                        value={settings.annualPrice || 200}
                        onChange={(e) => setSettings({ ...settings, annualPrice: parseFloat(e.target.value) || 200 })}
                        className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-850 font-black text-amber-600 text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 4. แพ็กเกจตลอดชีพ (LIFETIME VIP) */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-purple-700 to-pink-700 text-white shadow-xs">
                      <span>💎</span> <span>{settings.lifetimePlanName || 'LIFETIME VIP (ตลอดชีพ)'}</span>
                    </span>
                    <span className="text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                      <span>⭐ แนะนำ คุ้มค่าที่สุด (ถาวร)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ชื่อแพ็กเกจ</label>
                      <input
                        type="text"
                        value={settings.lifetimePlanName || ''}
                        onChange={(e) => setSettings({ ...settings, lifetimePlanName: e.target.value })}
                        placeholder="เช่น LIFETIME VIP (ตลอดชีพ)"
                        className="w-full p-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-stone-800 font-bold text-purple-700 dark:text-purple-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">ราคา (บาท)</label>
                      <input
                        type="number"
                        value={settings.lifetimePrice || 590}
                        onChange={(e) => setSettings({ ...settings, lifetimePrice: parseFloat(e.target.value) || 590 })}
                        className="w-full p-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-stone-800 font-black text-purple-600 text-xs"
                        required
                      />
                    </div>
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
                  amount: '200',
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
      {/* TAB 5: ข้อเสนอแนะจากผู้ใช้งาน (USER FEEDBACK & SUGGESTIONS)                */}
      {/* ========================================================================= */}
      {activeTab === 'feedbacks' && (
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                  <MessageSquarePlus className="w-5 h-5 text-amber-600" />
                  <span>ข้อเสนอแนะ & ความคิดเห็นจากผู้ใช้งาน อปท.</span>
                  <span className="text-xs bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                    ทั้งหมด {feedbacks.length} รายการ
                  </span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  รับฟังเสียงจากผู้ตรวจสอบภายในทั่วประเทศ เพื่อนำมาพัฒนาฟีเจอร์และปรับปรุงระบบให้ตรงจุด
                </p>
              </div>

              {pendingFeedbackCount > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center space-x-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>มี {pendingFeedbackCount} ข้อเสนอแนะรอการตรวจสอบ</span>
                </div>
              )}
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-700 space-y-1">
                <span className="text-[11px] text-stone-400 font-semibold">ข้อเสนอแนะทั้งหมด</span>
                <div className="text-xl font-black text-stone-900 dark:text-stone-100">{feedbacks.length}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1">
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">รอดำเนินการ</span>
                <div className="text-xl font-black text-amber-800 dark:text-amber-300">
                  {feedbacks.filter((f) => f.status === 'pending').length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1">
                <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">กำลังพิจารณา / พัฒนา</span>
                <div className="text-xl font-black text-blue-800 dark:text-blue-300">
                  {feedbacks.filter((f) => f.status === 'reviewing' || f.status === 'developing').length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">ดำเนินการแล้ว</span>
                <div className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                  {feedbacks.filter((f) => f.status === 'completed').length}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={feedbackStatusFilter}
                  onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                  className="p-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                >
                  <option value="all">ทุกสถานะ</option>
                  {FEEDBACK_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>

                <select
                  value={feedbackCategoryFilter}
                  onChange={(e) => setFeedbackCategoryFilter(e.target.value)}
                  className="p-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  {FEEDBACK_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>

                {feedbacks.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = await luxuryConfirm({
                        title: 'ยืนยันล้างข้อเสนอแนะทั้งหมด',
                        message: `คุณต้องการลบข้อเสนอแนะทั้งหมด ${feedbacks.length} รายการออกจากระบบหรือไม่?`,
                        subMessage: '⚠️ ข้อมูลข้อเสนอแนะทั้งหมดจะถูกลบถาวรออกจากระบบส่วนกลาง และจะไม่ถูกโหลดกลับมาซ้ำอีก',
                        confirmText: 'ล้างข้อมูลทั้งหมดทันที',
                        cancelText: 'ยกเลิก',
                        variant: 'danger'
                      });
                      if (!confirmed) return;
                      const remaining = await clearAllFeedbacks();
                      setFeedbacks(remaining);
                      showToast(`ล้างข้อเสนอแนะทั้งหมดเรียบร้อยแล้ว`);
                    }}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="ล้างข้อเสนอแนะทั้งหมด"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>ล้างทั้งหมด</span>
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="ค้นหาข้อเสนอแนะ, ผู้ส่ง, อปท..."
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>
            </div>
          </div>

          {/* Feedbacks Cards List */}
          <div className="space-y-4">
            {filteredFeedbacks.map((item) => {
              const catObj = FEEDBACK_CATEGORIES.find((c) => c.id === item.category);
              const stObj = FEEDBACK_STATUSES.find((s) => s.id === item.status) || FEEDBACK_STATUSES[0];

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${catObj?.badgeColor || 'bg-stone-100'}`}>
                        {catObj?.label || item.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${stObj.badgeColor}`}>
                        {stObj.label}
                      </span>
                      {item.priority === 'urgent' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                          🔴 เร่งด่วน
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400 font-mono">
                        {item.createdDateTh}
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 flex items-center space-x-2">
                      <span className="font-bold text-stone-800 dark:text-stone-200">{item.userName}</span>
                      <span>•</span>
                      <span>{item.orgName}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = await luxuryConfirm({
                            title: 'ยืนยันการลบข้อเสนอแนะ',
                            message: 'คุณต้องการลบรายการข้อเสนอแนะนี้ออกจากระบบหรือไม่?',
                            itemTitle: item.title,
                            subMessage: '⚠️ ข้อเสนอแนะนี้จะถูกลบถาวรออกจากระบบส่วนกลาง และจะไม่ถูกโหลดกลับมาซ้ำอีก',
                            confirmText: 'ลบข้อเสนอแนะทันที',
                            cancelText: 'ยกเลิก',
                            variant: 'danger'
                          });
                          if (!confirmed) return;
                          const remaining = await deleteFeedback(item.id);
                          setFeedbacks(remaining);
                          showToast('ลบข้อเสนอแนะเรียบร้อยแล้ว');
                        }}
                        className="text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60 px-2.5 py-1 rounded-xl flex items-center gap-1 text-xs font-bold transition-all shadow-xs cursor-pointer ml-1"
                        title="ลบข้อเสนอแนะนี้ออกจากระบบ"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 leading-snug">
                      {item.title}
                    </h3>
                    <div className="p-4 rounded-2xl bg-stone-50/60 dark:bg-stone-850/60 border border-stone-200/60 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                      {item.description}
                    </div>
                    {item.expectedBenefit && (
                      <div className="text-xs text-stone-500 dark:text-stone-400">
                        <strong>💡 ประโยชน์ที่คาดหวัง:</strong> {item.expectedBenefit}
                      </div>
                    )}
                  </div>

                  {/* Admin Response Box & Status Controls */}
                  <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-amber-600" />
                        <span>การพิจารณา & ตอบกลับจาก ADMIN:</span>
                      </span>

                      {/* Status Select */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-stone-500 font-semibold">ปรับสถานะ:</span>
                        <select
                          value={item.status}
                          onChange={async (e) => {
                            const updated = await updateFeedbackStatus(item.id, e.target.value, item.adminNote);
                            setFeedbacks(updated);
                            showToast('อัปเดตสถานะข้อเสนอแนะเรียบร้อยแล้ว');
                          }}
                          className="p-1.5 rounded-xl text-xs border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 font-bold text-amber-950 dark:text-amber-200"
                        >
                          {FEEDBACK_STATUSES.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Reply Note Textarea */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={adminReplyTexts[item.id] !== undefined ? adminReplyTexts[item.id] : (item.adminNote || '')}
                        onChange={(e) => setAdminReplyTexts({ ...adminReplyTexts, [item.id]: e.target.value })}
                        placeholder="พิมพ์ข้อความตอบกลับ หรือผลการพิจารณาให้ผู้ใช้เห็น..."
                        className="flex-1 p-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const note = adminReplyTexts[item.id] !== undefined ? adminReplyTexts[item.id] : item.adminNote;
                          const updated = await updateFeedbackStatus(item.id, item.status, note);
                          setFeedbacks(updated);
                          showToast('บันทึกการตอบกลับเรียบร้อยแล้ว ผู้ใช้จะเห็นทันที');
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs shrink-0 cursor-pointer"
                      >
                        บันทึกตอบกลับ
                      </button>
                    </div>

                    {item.adminRepliedAt && (
                      <div className="text-[10px] text-stone-400">
                        ตอบกลับล่าสุดเมื่อ: {item.adminRepliedAt}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {feedbacks.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
                <MessageSquarePlus className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">
                  ยังไม่มีข้อเสนอแนะจากผู้ใช้งาน
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  เมื่อสมาชิกผู้ตรวจสอบส่งความคิดเห็น จะปรากฏในหน้านี้ทันที
                </p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
                <Search className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-stone-700 dark:text-stone-200">
                  ไม่พบข้อเสนอแนะที่ตรงกับเงื่อนไขการค้นหา
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  ลองปรับเปลี่ยนคำค้นหาหรือเลือกตัวกรองสถานะอื่น
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ประกาศระบบ & สำรองข้อมูล (SYSTEM BROADCAST & CLOUD BACKUP)           */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Card 1: ระบบกระจายข่าวประกาศส่วนกลาง (Real-time Broadcast Announcement) */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                  <Megaphone className="w-5 h-5 text-amber-600" />
                  <span>ระบบกระจายข่าวประกาศส่วนกลาง (Real-time Broadcast Banner)</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  ส่งข้อความประกาศด่วนวิ่งบนแถบหัวเว็บของผู้ใช้งานทุก อปท. ทั่วประเทศทันทีแบบ Real-time
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleBroadcastActive}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isBroadcastActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isBroadcastActive ? 'bg-emerald-500 animate-ping' : 'bg-stone-400'}`} />
                  <span>{isBroadcastActive ? '🟢 เปิดแสดงหน้าบ้าน' : '⚪ ปิดซ่อนประกาศ'}</span>
                </button>
              </div>
            </div>

            {/* Quick Template Preset Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                ข้อความประกาศสำเร็จรูป (คลิกเพื่อใส่ข้อความรวดเร็ว):
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'ยินดีต้อนรับสู่ระบบตรวจสอบภายใน อปท. (Audit-OS) แพลตฟอร์มบริหารจัดการงานตรวจสอบมาตรฐาน สถ.',
                  'แจ้งเปิดระบบบันทึกแผนการตรวจสอบ และกระดาษทำการ ประจำปีงบประมาณ 2569 ครบทั้ง 11 ขั้นตอนแล้ว',
                  'แจ้งปิดปรับปรุงระบบและสำรองข้อมูลประจำสัปดาห์ คืนนี้เวลา 23:00 - 00:00 น. ขออภัยในความไม่สะดวก',
                  'เปิดรับฟังข้อเสนอแนะและฟังก์ชันใหม่จากผู้ตรวจสอบทุกท่านแล้ววันนี้ ผ่านเมนูด้านซ้าย "เสนอแนะ / แจ้งปัญหา"'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBroadcastText(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors text-left"
                  >
                    💡 {preset.slice(0, 45)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleBroadcastSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ข้อความประกาศที่จะแสดง (Broadcast Text)
                </label>
                <textarea
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="พิมพ์ข้อความประกาศ เช่น แจ้งปรับปรุงระบบ, เปิดให้ใช้งานฟีเจอร์ใหม่, ระเบียบกระทรวงการคลังฉบับล่าสุด..."
                  className="w-full p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-xs text-stone-900 dark:text-stone-100 min-h-[80px]"
                />
              </div>

              {/* Preview Banner */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-amber-100 text-xs border border-amber-500/40 flex items-center justify-between shadow-inner">
                <div className="flex items-center space-x-2 truncate">
                  <span className="inline-flex items-center space-x-1 bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0">
                    📢 ประกาศระบบส่วนกลาง
                  </span>
                  <span className="truncate font-medium">{broadcastText || 'ตัวอย่างข้อความประกาศจะแสดงในแถบนี้'}</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold shrink-0 ml-2">ตัวอย่างหน้าบ้าน</span>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>🚀 ส่งประกาศข่าวสารไปยังแบนเนอร์หน้าบ้านทันที</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: ระบบแจ้งเตือนอัปเดตเวอร์ชัน และ สำรองข้อมูลส่วนกลาง */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: แจ้งเตือนอัปเดตเวอร์ชัน Push Update */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    แจ้งเตือนอัปเดตเวอร์ชัน (Push Update)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  v{APP_VERSION}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                ส่งสัญญาณแจ้งเตือนกล่องป๊อปอัปให้ผู้ใช้งานทุกคนที่กำลังออนไลน์ กดปุ่มรีเฟรชหน้าเว็บเพื่อรับเวอร์ชันใหม่ทันที โดยไม่ต้องรอรีเฟรชเอง
              </p>

              <button
                type="button"
                onClick={() => setShowBroadcastModal(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>🚀 เปิดกล่องยิงแจ้งเตือนอัปเดตเวอร์ชัน (Broadcast Modal)</span>
              </button>
            </div>

            {/* Box 2: สำรองและกู้คืนฐานข้อมูล Super Admin JSON */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    สำรองและกู้คืนฐานข้อมูลระบบส่วนกลาง (Full JSON)
                  </h3>
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                ดาวน์โหลดข้อมูลระบบทั้งหมด (ผู้ใช้งาน, ประวัติชำระเงิน, ข้อเสนอแนะ, และการตั้งค่าระบบ) เป็นไฟล์ JSON ก้อนเดียว เพื่อความปลอดภัย 100%
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportSuperAdminBackup}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 rotate-180" />
                  <span>📦 ดาวน์โหลดไฟล์สำรอง</span>
                </button>

                <label className="py-2.5 px-3 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>📥 กู้คืนจากไฟล์สำรอง</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSuperAdminBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: ศูนย์ตรวจสุขภาพและสถานะเซิร์ฟเวอร์ระบบ (Health & Diagnostics) */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  ศูนย์ตรวจสุขภาพและสถานะการเชื่อมต่อ Cloud (System Health & Cloud Diagnostics)
                </h3>
              </div>
              <button
                type="button"
                onClick={reloadData}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ตรวจสอบสถานะใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-semibold">Google Sheets BYOD</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  ● Data Sovereignty
                </div>
                <div className="text-[10px] text-stone-400 truncate">บันทึกบน Google Drive ผู้ใช้ 100%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-semibold">Firebase Firestore</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  ● Multi-Tenant Ready
                </div>
                <div className="text-[10px] text-stone-400 truncate">auditos-prod-cloud</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-semibold">สมาชิกในระบบ</span>
                  <span className="text-[10px] text-amber-600 font-bold">Total</span>
                </div>
                <div className="text-sm font-black text-stone-900 dark:text-stone-100">
                  {users.length} บัญชี
                </div>
                <div className="text-[10px] text-stone-400 truncate">คำขอรออนุมัติ: {pendingUsers.length}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-semibold">แคชระบบ (LocalStorage)</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Normal</span>
                </div>
                <div className="text-sm font-black text-stone-900 dark:text-stone-100">
                  ~{(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB
                </div>
                <div className="text-[10px] text-stone-400 truncate">ความจุคงเหลือ &gt; 90%</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await luxuryConfirm({
                    title: 'ล้างแคชส่วนกลาง (Stale Cache)',
                    message: 'คุณต้องการล้างแคชส่วนที่ไม่ได้ใช้งานและดึงข้อมูลใหม่ล่าสุดจากคลาวด์หรือไม่?',
                    subMessage: 'ℹ️ ข้อมูลบัญชีผู้ใช้ สิทธิ์ และการตั้งค่าหลักจะไม่สูญหาย',
                    confirmText: 'ล้างแคชทันที',
                    variant: 'warning'
                  });
                  if (!confirmed) return;
                  sessionStorage.clear();
                  showToast('🧹 ล้างแคชตกค้างเรียบร้อยแล้ว');
                }}
                className="text-xs font-semibold text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 py-1 px-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                🧹 ล้างแคชที่ตกค้างในเบราว์เซอร์
              </button>
            </div>
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
                        onChange={() => handleSelectTier('trial')}
                      />
                      <div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">🌱 {settings.trialPlanName || 'ฟรี 30 วัน (ค่าเริ่มต้น)'}</div>
                        <div className="text-[11px] text-stone-500">ทดลองใช้งานฟรี {settings.trialDays || 30} วัน</div>
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
                        onChange={() => handleSelectTier('monthly')}
                      />
                      <div>
                        <div className="font-bold text-indigo-700 dark:text-indigo-400">⭐ {settings.monthlyPlanName || 'VIP (รายเดือน)'}</div>
                        <div className="text-[11px] text-stone-500">ปลดล็อกทุกกระดาษทำการ (30 วัน) • ฿{Number(settings.monthlyPrice || 60).toLocaleString()}</div>
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
                        onChange={() => handleSelectTier('annual')}
                      />
                      <div>
                        <div className="font-bold text-amber-600 dark:text-amber-400">👑 {settings.annualPlanName || 'PREMIUM (รายปี)'}</div>
                        <div className="text-[11px] text-stone-500">ระดับสูงสุด พร้อมคลังระเบียบทอง 2569 (365 วัน) • ฿{Number(settings.annualPrice || 200).toLocaleString()}</div>
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
                        onChange={() => handleSelectTier('lifetime')}
                      />
                      <div>
                        <div className="font-bold text-purple-700 dark:text-purple-400">💎 {settings.lifetimePlanName || 'LIFETIME VIP (ตลอดชีพ)'}</div>
                        <div className="text-[11px] text-stone-500">ไม่จำกัดวันหมดอายุ (ถาวร) • ฿{Number(settings.lifetimePrice || 590).toLocaleString()}</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {selectedNewTier !== 'lifetime' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-stone-700 dark:text-stone-300">
                        📅 กำหนดวันที่หมดอายุสมาชิก
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const days = selectedNewTier === 'monthly' ? 30 : selectedNewTier === 'annual' ? 365 : (settings.trialDays || 30);
                            setTierDurationDays(days);
                            const d = new Date(Date.now() + days * 86400000);
                            setCustomExpiryDate(d.toISOString().split('T')[0]);
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300/80 cursor-pointer"
                          title="คำนวณวันหมดอายุใหม่นับจากวันนี้ตามระยะเวลาของแพ็กเกจที่เลือก"
                        >
                          ⚡ รีเซ็ตเริ่มวันนี้ ({selectedNewTier === 'monthly' ? '30 วัน' : selectedNewTier === 'annual' ? '365 วัน' : '30 วัน'})
                        </button>
                        {tierTargetUser?.expiresAt && new Date(tierTargetUser.expiresAt).getTime() > Date.now() && (
                          <button
                            type="button"
                            onClick={() => {
                              const extra = selectedNewTier === 'monthly' ? 30 : selectedNewTier === 'annual' ? 365 : 30;
                              const curTime = new Date(tierTargetUser.expiresAt).getTime();
                              const newTime = curTime + extra * 86400000;
                              const totalDays = Math.ceil((newTime - Date.now()) / 86400000);
                              setTierDurationDays(totalDays);
                              setCustomExpiryDate(new Date(newTime).toISOString().split('T')[0]);
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300 cursor-pointer"
                            title="บวกเวลาเพิ่มต่อจากวันหมดอายุเดิมของสมาชิก"
                          >
                            ➕ บวกต่อจากเดิม
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 mb-1 block">
                          เลือกวันที่หมดอายุโดยตรง:
                        </span>
                        <input
                          type="date"
                          value={customExpiryDate}
                          onChange={(e) => {
                            setCustomExpiryDate(e.target.value);
                            if (e.target.value) {
                              const diff = new Date(e.target.value + 'T23:59:59').getTime() - Date.now();
                              setTierDurationDays(Math.max(1, Math.ceil(diff / 86400000)));
                            }
                          }}
                          className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 font-bold text-amber-900 dark:text-amber-200"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 mb-1 block">
                          หรือระบุจำนวนวันคงเหลือ (วัน):
                        </span>
                        <input
                          type="number"
                          value={tierDurationDays}
                          onChange={(e) => {
                            const days = parseInt(e.target.value) || 1;
                            setTierDurationDays(days);
                            const d = new Date(Date.now() + days * 86400000);
                            setCustomExpiryDate(d.toISOString().split('T')[0]);
                          }}
                          className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                    <span>⏱️ วันที่หมดอายุ: {customExpiryDate ? new Date(customExpiryDate).toLocaleDateString('th-TH') : '-'}</span>
                    <span className="font-bold">({tierDurationDays} วันคงเหลือ)</span>
                  </div>
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

              {editingMember.role !== 'admin' && (
                <div>
                  <label className="block font-bold mb-1">📅 กำหนดวันหมดอายุสมาชิก (เลือกวันที่ในปฏิทิน)</label>
                  <input
                    type="date"
                    value={editingMember.expiresAt ? editingMember.expiresAt.split('T')[0] : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingMember({
                        ...editingMember,
                        expiresAt: val ? new Date(`${val}T23:59:59.999Z`).toISOString() : null
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    {editingMember.expiresAt ? `หมดอายุ: ${new Date(editingMember.expiresAt).toLocaleDateString('th-TH')}` : 'ไม่จำกัดเวลา (ตลอดชีพ)'}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">รหัสผ่านใหม่ (ระบุเมื่อต้องการเปลี่ยน)</label>
                <input
                  type="password"
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
      {/* MODAL: ADMIN RESET USER PASSWORD                                         */}
      {/* ========================================================================= */}
      {showResetPasswordModal && resetPasswordTargetUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>รีเซ็ตรหัสผ่านใหม่: @{resetPasswordTargetUser.username}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              <p className="font-bold flex items-center space-x-1">
                <span>🔒 ความเป็นส่วนตัวและความปลอดภัย</span>
              </p>
              <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                ระบบจะไม่แสดงรหัสผ่านเดิมของผู้ใช้งาน (ผู้ดูแลระบบไม่สามารถเห็นรหัสผ่านเดิมได้) ท่านสามารถตั้งรหัสผ่านใหม่เพื่อส่งมอบให้ผู้ใช้งานได้ทันที
              </p>
            </div>

            {resetPasswordError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
                {resetPasswordError}
              </div>
            )}

            <form onSubmit={handleSaveResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">รหัสผ่านใหม่ *</label>
                <input
                  type="password"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="กำหนดรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">ยืนยันรหัสผ่านใหม่ *</label>
                <input
                  type="password"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกรหัสผ่านใหม่</span>
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
                      let amt = (settings.annualPrice || 200).toString();
                      if (p === 'monthly') amt = (settings.monthlyPrice || 60).toString();
                      else if (p === 'lifetime') amt = (settings.lifetimePrice || 590).toString();
                      setPaymentForm({
                        ...paymentForm,
                        plan: p,
                        amount: amt
                      });
                    }}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  >
                    <option value="annual">{settings.annualPlanName || 'PREMIUM (รายปี)'} (฿{Number(settings.annualPrice || 200).toLocaleString()})</option>
                    <option value="monthly">{settings.monthlyPlanName || 'VIP (รายเดือน)'} (฿{Number(settings.monthlyPrice || 60).toLocaleString()})</option>
                    <option value="lifetime">{settings.lifetimePlanName || 'LIFETIME VIP (ตลอดชีพ)'} (฿{Number(settings.lifetimePrice || 590).toLocaleString()})</option>
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

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW USER BY ADMIN (สร้างบัญชีผู้ใช้โดยตรง)                      */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-stone-200 dark:border-stone-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
                    เพิ่มผู้ใช้งานใหม่โดยตรง (Manual Provision)
                  </h3>
                  <p className="text-[11px] text-stone-500">สร้างบัญชีผู้ใช้งานใหม่ให้สมาชิก อปท. ได้ทันทีโดยไม่ต้องรอลงทะเบียน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addUserError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    ชื่อผู้ใช้ (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="เช่น audit_korat"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    รหัสผ่านเริ่มต้น <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="เช่น pass1234"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                  ชื่อ-นามสกุล / ชื่อผู้แสดงผล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUserForm.displayName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })}
                  placeholder="เช่น นายสมชาย หมายมั่น"
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    สังกัด อปท. (เทศบาล/อบต./อบจ.)
                  </label>
                  <input
                    type="text"
                    value={newUserForm.organization}
                    onChange={(e) => setNewUserForm({ ...newUserForm, organization: e.target.value })}
                    placeholder="เช่น องค์การบริหารส่วนตำบลเมืองเก่า"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    จังหวัด
                  </label>
                  <input
                    type="text"
                    value={newUserForm.province}
                    onChange={(e) => setNewUserForm({ ...newUserForm, province: e.target.value })}
                    placeholder="เช่น นครราชสีมา"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    ตำแหน่ง
                  </label>
                  <input
                    type="text"
                    value={newUserForm.position}
                    onChange={(e) => setNewUserForm({ ...newUserForm, position: e.target.value })}
                    placeholder="เช่น นักวิชาการตรวจสอบภายในชำนาญการ"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-stone-700 dark:text-stone-300">
                    ระดับแพ็กเกจสมาชิกเริ่มต้น
                  </label>
                  <select
                    value={newUserForm.plan}
                    onChange={(e) => setNewUserForm({ ...newUserForm, plan: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
                  >
                    <option value="trial">🌱 ฟรี 30 วัน (ค่าเริ่มต้น)</option>
                    <option value="monthly">⭐ VIP (รายเดือน 30 วัน)</option>
                    <option value="annual">👑 PREMIUM (รายปี 365 วัน)</option>
                    <option value="lifetime">💎 LIFETIME VIP (ตลอดชีพ)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกและสร้างบัญชี</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
