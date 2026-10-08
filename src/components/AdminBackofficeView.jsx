import React, { useState, useMemo, useEffect } from 'react';
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
  BadgeAlert
} from 'lucide-react';
import {
  getUsers,
  saveUsers,
  getPendingUsers,
  savePendingUsers,
  MEMBERSHIP_PLANS,
  getPaymentRecords,
  savePaymentRecords,
  getSystemSettings,
  saveSystemSettings,
  approveMemberRegistration,
  rejectMemberRegistration,
  extendMemberSubscription,
  updateUser
} from '../utils/auth';

export default function AdminBackofficeView({ currentSession, onSwitchToWorkbench, onRefreshUser }) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'members', 'billing', 'settings'
  const [users, setUsers] = useState(() => getUsers());
  const [pendingUsers, setPendingUsers] = useState(() => getPendingUsers());
  const [payments, setPayments] = useState(() => getPaymentRecords());
  const [settings, setSettings] = useState(() => getSystemSettings());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedPending, setSelectedPending] = useState(null);
  const [approvePlan, setApprovePlan] = useState('annual');
  const [approveDurationDays, setApproveDurationDays] = useState(365);

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

  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => {
    setUsers(getUsers());
    setPendingUsers(getPendingUsers());
    setPayments(getPaymentRecords());
    setSettings(getSystemSettings());
  };

  // Metrics
  const metrics = useMemo(() => {
    const auditorUsers = users.filter((u) => u.role === 'auditor');
    const now = Date.now();
    const activeAuditors = auditorUsers.filter((u) => {
      if (u.status === 'suspended') return false;
      if (!u.expiresAt) return true;
      return new Date(u.expiresAt).getTime() > now;
    });

    const expiringSoon = auditorUsers.filter((u) => {
      if (u.status === 'suspended') return false;
      if (!u.expiresAt) return false;
      const diff = new Date(u.expiresAt).getTime() - now;
      return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
    });

    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalAuditors: auditorUsers.length,
      activeAuditors: activeAuditors.length,
      pendingCount: pendingUsers.length,
      expiringSoonCount: expiringSoon.length,
      totalRevenue
    };
  }, [users, pendingUsers, payments]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return users
      .filter((u) => u.role !== 'admin')
      .filter((u) => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          (u.displayName || '').toLowerCase().includes(q) ||
          (u.organization || '').toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q) ||
          (u.province || '').toLowerCase().includes(q);

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
        return true;
      });
  }, [users, searchTerm, statusFilter]);

  // Handle Approve Registration
  const handleOpenApprove = (pending) => {
    setSelectedPending(pending);
    const plan = pending.requestedPlan || 'annual';
    setApprovePlan(plan);
    setApproveDurationDays(plan === 'monthly' ? 30 : plan === 'trial' ? 14 : 365);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedPending) return;
    try {
      approveMemberRegistration(selectedPending.id || selectedPending.username, approvePlan, approveDurationDays);
      setShowApproveModal(false);
      setSelectedPending(null);
      reloadData();
      showToast(`อนุมัติผู้ใช้งาน ${selectedPending.displayName} เข้าสู่ระบบเรียบร้อยแล้ว!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = (pending) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอของ "${pending.displayName}"?`)) return;
    try {
      rejectMemberRegistration(pending.id || pending.username);
      reloadData();
      showToast(`ปฏิเสธคำขอลงทะเบียนของ ${pending.displayName} เรียบร้อยแล้ว`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Quick Extend Subscription
  const handleQuickExtend = (username, days, planId) => {
    try {
      extendMemberSubscription(username, days, planId);
      reloadData();
      showToast(`ต่ออายุสมาชิกให้ผู้ใช้ @${username} เพิ่มอีก ${days} วัน เรียบร้อยแล้ว`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle Suspend Status
  const handleToggleSuspend = (user) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const actionLabel = newStatus === 'suspended' ? 'ระงับการใช้งาน' : 'ปลดการระงับ';
    if (!window.confirm(`ต้องการ${actionLabel} บัญชี @${user.username} หรือไม่?`)) return;

    try {
      updateUser(user.username, { status: newStatus });
      reloadData();
      showToast(`${actionLabel} @${user.username} เรียบร้อยแล้ว`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Payment Submit
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

    // Auto-extend membership
    if (paymentForm.autoExtend) {
      const days = paymentForm.plan === 'monthly' ? 30 : 365;
      extendMemberSubscription(paymentForm.username, days, paymentForm.plan);
    }

    setShowAddPaymentModal(false);
    reloadData();
    showToast(`บันทึกการชำระเงิน ${Number(paymentForm.amount).toLocaleString()} บาท เรียบร้อยแล้ว`);
  };

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveSystemSettings(settings);
    showToast('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Role Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SUPER ADMIN CONSOLE</span>
              <span className="text-white">●</span>
              <span>ระบบหลังบ้านควบคุมส่วนกลาง</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ระบบหลังบ้านจัดการสมาชิก & ค่าบริการ (Audit-OS)
            </h1>
            <p className="text-indigo-200/80 text-sm max-w-2xl">
              ควบคุมดูแลสมาชิกผู้ตรวจสอบภายใน อปท. ทั่วประเทศ อนุมัติการเข้าใช้งาน ตรวจสอบการชำระค่าสมาชิกรายเดือน/รายปี และกำหนดทิศทางระบบกลาง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onSwitchToWorkbench && (
              <button
                onClick={onSwitchToWorkbench}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>เข้าสู่พื้นที่ทำงานตรวจสอบ (Workbench)</span>
              </button>
            )}
            <button
              onClick={reloadData}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center space-x-1.5 cursor-pointer border border-slate-700"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">สมาชิกตรวจสอบภายในทั้งหมด</div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{metrics.totalAuditors} <span className="text-xs font-normal text-slate-500">ท่าน</span></div>
            <div className="text-[11px] text-emerald-600 font-medium">ใช้งานอยู่ {metrics.activeAuditors} ท่าน</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0 relative">
            <Clock className="w-6 h-6" />
            {metrics.pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {metrics.pendingCount}
              </span>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">คำขอสมัครสมาชิกรออนุมัติ</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.pendingCount} <span className="text-xs font-normal text-slate-500">รายการ</span></div>
            <div className="text-[11px] text-slate-500">รอเปิดสิทธิ์การใช้งาน</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center shrink-0">
            <BadgeAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">สมาชิกใกล้หมดอายุ (&lt; 7 วัน)</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.expiringSoonCount} <span className="text-xs font-normal text-slate-500">ท่าน</span></div>
            <div className="text-[11px] text-slate-500">ต้องแจ้งเตือนต่ออายุ</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">รายได้สะสมค่าบริการ</div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              ฿{metrics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">จาก {payments.length} รายการรับชำระ</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>คำขอสมัครใหม่ ({pendingUsers.length})</span>
          {pendingUsers.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'members'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ทะเบียนสมาชิก & การต่ออายุ ({users.filter((u) => u.role !== 'admin').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>บันทึกรายได้ & การชำระเงิน ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ตั้งค่าแพ็กเกจ & บัญชีรับเงิน</span>
        </button>
      </div>

      {/* TAB 1: PENDING REGISTRATIONS */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <span>คำขอสมัครสมาชิกจากผู้ตรวจสอบภายใน อปท.</span>
                <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                  รออนุมัติ {pendingUsers.length} รายการ
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                เมื่อท่านกด "อนุมัติ" สมาชิกจะสามารถล็อกอินเข้าใช้งานระบบและเริ่มจัดทำกระดาษทำการของ อปท. ตนเองได้ทันที
              </p>
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">ไม่มีคำขอสมาชิกรอการอนุมัติในขณะนี้</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                เมื่อมีผู้ตรวจสอบภายในกดลงทะเบียนจากหน้าเข้าสู่ระบบ รายชื่อจะปรากฏในหน้านี้เพื่อให้ท่านอนุมัติ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map((pending) => {
                const planKey = pending.requestedPlan || 'annual';
                const planInfo = MEMBERSHIP_PLANS[planKey] || MEMBERSHIP_PLANS.annual;
                return (
                  <div
                    key={pending.id || pending.username}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-amber-400 transition-all space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {pending.displayName}
                        </div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-1">
                          <Building className="w-3.5 h-3.5" />
                          <span>{pending.organization || 'ไม่ระบุ อปท.'}</span>
                          {pending.province && <span>({pending.province})</span>}
                        </div>
                        <div className="text-xs text-slate-500">
                          ตำแหน่ง: {pending.position || 'นักวิชาการตรวจสอบภายใน'}
                        </div>
                      </div>

                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${planInfo.badgeColor}`}>
                        {planInfo.name} ({planInfo.priceLabel})
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">ชื่อผู้ใช้งาน (Username):</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">@{pending.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">เบอร์โทรศัพท์ / LINE:</span>
                        <span className="font-semibold">{pending.phone || pending.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">วันที่สมัคร:</span>
                        <span>{new Date(pending.requestedAt || Date.now()).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>

                    {pending.slipUrl && (
                      <div className="text-xs text-blue-600 underline cursor-pointer">
                        ดูหลักฐานการโอนเงิน (สลิป)
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => handleOpenApprove(pending)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>อนุมัติ & กำหนดวันหมดอายุ</span>
                      </button>

                      <button
                        onClick={() => handleReject(pending)}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>ปฏิเสธ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE AUDITOR MEMBERS */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                ทะเบียนสมาชิกผู้ตรวจสอบภายใน & การต่ออายุ
              </h2>
              <p className="text-xs text-slate-500">
                รายชื่อผู้ตรวจสอบภายใน อปท. ทั้งหมดในระบบ สามารถต่ออายุสมาชิก ระงับ หรือแก้ไขสิทธิ์ได้โดยตรง
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อปท., จังหวัด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="active">ใช้งานได้ปกติ</option>
                <option value="expiring">ใกล้หมดอายุ (&lt; 7 วัน)</option>
                <option value="expired">หมดอายุแล้ว</option>
                <option value="suspended">ถูกระงับสิทธิ์</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700 font-bold">
                  <th className="py-3 px-3">ผู้ตรวจสอบ / อปท.</th>
                  <th className="py-3 px-3">ชื่อผู้ใช้ (Username)</th>
                  <th className="py-3 px-3">แพ็กเกจสมาชิก</th>
                  <th className="py-3 px-3">วันหมดอายุ</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.map((u) => {
                  const now = Date.now();
                  const isExpired = u.expiresAt && new Date(u.expiresAt).getTime() <= now;
                  const isExpiringSoon =
                    u.expiresAt &&
                    new Date(u.expiresAt).getTime() > now &&
                    new Date(u.expiresAt).getTime() - now < 7 * 24 * 60 * 60 * 1000;
                  const isSuspended = u.status === 'suspended';

                  const planKey = u.plan || (u.expiresAt ? 'annual' : 'trial');
                  const planInfo = MEMBERSHIP_PLANS[planKey] || MEMBERSHIP_PLANS.annual;

                  let statusBadge = (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <span>●</span> <span>ใช้งานได้</span>
                    </span>
                  );
                  if (isSuspended) {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                        <span>■</span> <span>ระงับการใช้งาน</span>
                      </span>
                    );
                  } else if (isExpired) {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        <span>▲</span> <span>หมดอายุ</span>
                      </span>
                    );
                  } else if (isExpiringSoon) {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        <span>●</span> <span>ใกล้หมดอายุ</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={u.username} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{u.displayName}</div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                          {u.organization || 'อบต.ต้นแบบ'} {u.province ? `(${u.province})` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400">{u.position || 'นักวิชาการตรวจสอบภายใน'}</div>
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        @{u.username}
                        {u.passwordText && (
                          <div className="text-[10px] text-slate-400 font-mono">รหัส: {u.passwordText}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${planInfo.badgeColor}`}>
                          {planInfo.name}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {u.expiresAt ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold">{new Date(u.expiresAt).toLocaleDateString('th-TH')}</div>
                            <div className="text-[10px] text-slate-400">
                              {isExpired
                                ? 'หมดอายุแล้ว'
                                : `เหลืออีก ${Math.ceil((new Date(u.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24))} วัน`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">ตลอดชีพ</span>
                        )}
                      </td>

                      <td className="py-3 px-3">{statusBadge}</td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleQuickExtend(u.username, 30, 'monthly')}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                            title="ต่ออายุ +30 วัน"
                          >
                            +30 วัน
                          </button>

                          <button
                            onClick={() => handleQuickExtend(u.username, 365, 'annual')}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                            title="ต่ออายุ +1 ปี"
                          >
                            +1 ปี
                          </button>

                          <button
                            onClick={() => handleQuickExtend(u.username, 'lifetime', 'lifetime')}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                            title="ปลดล็อคตลอดชีพ (ไม่จำกัดวัน)"
                          >
                            ตลอดชีพ
                          </button>

                          <button
                            onClick={() => handleToggleSuspend(u)}
                            className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                              isSuspended
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={isSuspended ? 'ปลดการระงับ' : 'ระงับสิทธิ์'}
                          >
                            {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BILLING & PAYMENT LOGS */}
      {activeTab === 'billing' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <span>บันทึกรายได้ & ประวัติการชำระเงิน</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  รวม ฿{metrics.totalRevenue.toLocaleString()}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกการรับชำระเงินใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700 font-bold">
                  <th className="py-3 px-3">รหัสรายการ</th>
                  <th className="py-3 px-3">สมาชิก / อปท.</th>
                  <th className="py-3 px-3">แพ็กเกจ</th>
                  <th className="py-3 px-3">จำนวนเงิน</th>
                  <th className="py-3 px-3">ช่องทาง</th>
                  <th className="py-3 px-3">วันที่ชำระ</th>
                  <th className="py-3 px-3">บันทึกช่วยจำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      ยังไม่มีรายการรับชำระเงิน กด "+ บันทึกการรับชำระเงินใหม่" เพื่อเริ่มต้น
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {p.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{p.memberName}</div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400">{p.organization}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {p.plan === 'monthly' ? 'รายเดือน' : p.plan === 'annual' ? 'รายปี' : p.plan}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-700 dark:text-emerald-400 text-sm">
                        ฿{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{p.method}</td>
                      <td className="py-3 px-3 text-slate-500">{p.paidAt}</td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{p.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM SETTINGS & PRICING */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-3xl">
          <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              <span>ตั้งค่าแพ็กเกจราคา & บัญชีรับโอนเงินของ Super Admin</span>
            </h2>
            <p className="text-xs text-slate-500">
              ข้อมูลที่ระบุในส่วนนี้จะถูกแสดงในหน้าลงทะเบียนและหน้าต่ออายุของสมาชิกผู้ตรวจสอบภายใน
            </p>
          </div>

          {/* Pricing settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5">
              <Award className="w-4 h-4" />
              <span>1. กำหนดอัตราค่าสมาชิก</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ทดลองใช้งานฟรี (วัน)
                </label>
                <input
                  type="number"
                  value={settings.trialDays || 14}
                  onChange={(e) => setSettings({ ...settings, trialDays: parseInt(e.target.value) || 14 })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ค่าสมาชิกรายเดือน (บาท)
                </label>
                <input
                  type="number"
                  value={settings.monthlyPrice || 299}
                  onChange={(e) => setSettings({ ...settings, monthlyPrice: parseFloat(e.target.value) || 299 })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ค่าสมาชิกรายปี (บาท)
                </label>
                <input
                  type="number"
                  value={settings.annualPrice || 2990}
                  onChange={(e) => setSettings({ ...settings, annualPrice: parseFloat(e.target.value) || 2990 })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Banking settings */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4" />
              <span>2. บัญชีธนาคารสำหรับรับโอนเงินค่าสมาชิก</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ชื่อธนาคาร
                </label>
                <input
                  type="text"
                  value={settings.bankName || 'ธนาคารกรุงไทย'}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  placeholder="เช่น ธนาคารกรุงไทย / กสิกรไทย"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  เลขที่บัญชี
                </label>
                <input
                  type="text"
                  value={settings.bankAccountNo || '123-4-56789-0'}
                  onChange={(e) => setSettings({ ...settings, bankAccountNo: e.target.value })}
                  placeholder="เลขที่บัญชีรับเงิน"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ชื่อบัญชี
                </label>
                <input
                  type="text"
                  value={settings.bankAccountName || 'ผู้ดูแลระบบ Audit-OS'}
                  onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                  placeholder="ชื่อบัญชีรับโอน"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  เบอร์พร้อมเพย์ (PromptPay)
                </label>
                <input
                  type="text"
                  value={settings.promptPayNo || ''}
                  onChange={(e) => setSettings({ ...settings, promptPayNo: e.target.value })}
                  placeholder="เช่น เบอร์โทรศัพท์ หรือเลขบัตรประชาชน"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* System Announcement */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>3. ประกาศระบบแจ้งเตือนสมาชิก (System Announcement)</span>
            </h3>
            <textarea
              rows={3}
              value={settings.announcement || ''}
              onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
              placeholder="ข้อความประกาศที่จะแสดงให้ผู้ตรวจสอบภายในทุกคนเห็น เช่น อัปเดตระเบียบใหม่ หรือแจ้งเตือนต่ออายุสมาชิก..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการตั้งค่าระบบ</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL: APPROVE REGISTRATION */}
      {showApproveModal && selectedPending && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>อนุมัติสมาชิก: {selectedPending.displayName}</span>
              </h3>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1">
                <div><strong>สังกัด อปท.:</strong> {selectedPending.organization}</div>
                <div><strong>ตำแหน่ง:</strong> {selectedPending.position}</div>
                <div><strong>Username:</strong> @{selectedPending.username}</div>
              </div>

              <div>
                <label className="block font-semibold mb-1">เลือกแพ็กเกจสมาชิก</label>
                <select
                  value={approvePlan}
                  onChange={(e) => {
                    const p = e.target.value;
                    setApprovePlan(p);
                    setApproveDurationDays(p === 'monthly' ? 30 : p === 'trial' ? 14 : 365);
                  }}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="annual">สมาชิกรายปี (365 วัน - ฿2,990)</option>
                  <option value="monthly">สมาชิกรายเดือน (30 วัน - ฿299)</option>
                  <option value="trial">ทดลองใช้งานฟรี (14 วัน)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">จำนวนวันอายุการใช้งาน (วัน)</label>
                <input
                  type="number"
                  value={approveDurationDays}
                  onChange={(e) => setApproveDurationDays(parseInt(e.target.value) || 30)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
                <span className="text-[11px] text-slate-400">
                  หมดอายุประมาณ: {new Date(Date.now() + approveDurationDays * 86400000).toLocaleDateString('th-TH')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmApprove}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันอนุมัติ & เปิดใช้งานทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PAYMENT */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>บันทึกการรับชำระเงินใหม่</span>
              </h3>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
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
                        amount: p === 'monthly' ? '299' : '2990'
                      });
                    }}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="annual">รายปี (฿2,990)</option>
                    <option value="monthly">รายเดือน (฿299)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-black text-emerald-600"
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
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">วันที่ชำระ</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
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
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
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
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    ต่ออายุสมาชิกโดยอัตโนมัติ (+{paymentForm.plan === 'monthly' ? '30 วัน' : '1 ปี'})
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
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
