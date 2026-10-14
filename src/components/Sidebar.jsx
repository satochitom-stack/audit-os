import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Calendar,
  FileText,
  Sparkles,
  Users,
  ClipboardCheck,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  BookOpen,
  Wrench,
  Settings,
  Calculator,
  ChevronDown,
  ChevronRight,
  HardHat,
  Building2,
  Layers,
  Award,
  ShieldCheck,
  DollarSign,
  Lock,
  LayoutGrid,
  MessageSquarePlus,
  CreditCard,
  TrendingUp,
  Megaphone,
  Crown,
  Shield,
  ArrowRight,
  Radio,
  FileCode2,
  Home
} from 'lucide-react';
import { MEMBERSHIP_PLANS, checkUserSubscription } from '../utils/auth';
import { getUserFeedbacks } from '../utils/feedbackUtils';
import { getGoogleSheetsConfig } from '../services/googleSheetsSyncService';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  session,
  orgProfile,
  activeToolkitTab = 'factor-f',
  setActiveToolkitTab,
  pendingCount = 0,
  onShowExpiredModal,
  onOpenFeedback,
  onOpenPackageModal,
  onOpenCloudSync,
  adminSubTab = 'overview',
  setAdminSubTab,
  adminWorkspaceMode = 'admin',
  setAdminWorkspaceMode
}) {
  const isAdmin = session?.role === 'admin';
  const subStatus = checkUserSubscription(session);
  const isExpired = subStatus.expired;
  const [toolkitSubmenuOpen, setToolkitSubmenuOpen] = useState(false);

  // Google Sheets BYOD Config State
  const [sheetsConfig, setSheetsConfig] = useState(() => getGoogleSheetsConfig(session));
  useEffect(() => {
    const handleSheetsUpdate = () => setSheetsConfig(getGoogleSheetsConfig(session));
    window.addEventListener('ia-google-sheets-config-changed', handleSheetsUpdate);
    return () => window.removeEventListener('ia-google-sheets-config-changed', handleSheetsUpdate);
  }, [session]);

  // Real-time Feedbacks counter for Admin badge
  const [feedbacks, setFeedbacks] = useState(() => getUserFeedbacks());
  useEffect(() => {
    const handleFbUpdate = () => setFeedbacks(getUserFeedbacks());
    window.addEventListener('ia_feedbacks_updated', handleFbUpdate);
    return () => window.removeEventListener('ia_feedbacks_updated', handleFbUpdate);
  }, []);
  const pendingFeedbackCount = feedbacks.filter((f) => f.status === 'pending').length;

  const planKey = session?.plan || 'annual';
  const planInfo = MEMBERSHIP_PLANS[planKey] || MEMBERSHIP_PLANS.annual;

  // 7 Exclusive Super Admin Menu Sections (Dedicated Super Admin Console)
  const ADMIN_STEPS = [
    {
      id: 'backoffice-overview',
      subTab: 'overview',
      targetTab: 'backoffice',
      label: 'ภาพรวมระบบ (Platform Overview)',
      icon: TrendingUp,
      desc: 'สถิติสมาชิก รายรับสะสม และกิจกรรม'
    },
    {
      id: 'backoffice-users',
      subTab: 'users',
      targetTab: 'backoffice',
      label: 'จัดการสมาชิก & สิทธิ์ (User Hub)',
      icon: Users,
      badge: pendingCount > 0 ? `${pendingCount} คำขอ` : null,
      badgeColor: 'bg-amber-500 text-stone-950 font-black',
      desc: 'อนุมัติ ปรับระดับ VIP/PREMIUM จัดการรหัสผ่าน'
    },
    {
      id: 'backoffice-pricing',
      subTab: 'pricing_qr',
      targetTab: 'backoffice',
      label: 'ตั้งค่าแพ็กเกจ & บัญชีรับเงิน',
      icon: Settings,
      desc: 'ราคาแพ็กเกจ เลขบัญชี และ PromptPay QR'
    },
    {
      id: 'backoffice-billing',
      subTab: 'billing',
      targetTab: 'backoffice',
      label: 'ทะเบียนรายรับ & ประวัติชำระเงิน',
      icon: DollarSign,
      desc: 'บันทึกการรับเงิน ออกใบเสร็จ ตรวจสอบสลิป'
    },
    {
      id: 'backoffice-feedbacks',
      subTab: 'feedbacks',
      targetTab: 'backoffice',
      label: 'กล่องข้อเสนอแนะ & แจ้งต่ออายุ',
      icon: MessageSquarePlus,
      badge: pendingFeedbackCount > 0 ? `${pendingFeedbackCount} ใหม่` : null,
      badgeColor: 'bg-emerald-500 text-white font-black',
      desc: 'รับฟังความคิดเห็นจาก User เพื่อพัฒนาระบบ'
    },
    {
      id: 'central-hub',
      subTab: null,
      targetTab: 'central-hub',
      label: 'จัดการคลังเอกสารแม่แบบกลาง',
      icon: BookOpen,
      desc: 'อัปโหลดและจัดการเอกสารกลางสำหรับทุก อปท.'
    },
    {
      id: 'backoffice-system',
      subTab: 'system',
      targetTab: 'backoffice',
      label: 'ประกาศระบบ & สำรองข้อมูล',
      icon: Megaphone,
      desc: 'แบนเนอร์ประกาศ Realtime และ JSON Backup'
    }
  ];

  // Navigation Menu Sections for Internal Auditors (11 Lifecycle Steps)
  const LIFECYCLE_STEPS = [
    {
      groupTitle: 'การวางแผนตรวจสอบ',
      items: [
        { id: 'audit-risk', label: 'การประเมินความเสี่ยง (Risk Assessment)', icon: ShieldAlert, desc: 'วิเคราะห์เกณฑ์ 5 ด้าน SOFCK และผังความเสี่ยง Universe' },
        { id: 'strategic-plan', label: 'แผนระยะยาว (Strategic Plan)', icon: Calendar, desc: 'คำนวณวันทำการตรวจ และแผนหมุนเวียน' },
        { id: 'planning', label: 'แผนการตรวจสอบประจำปี (Annual Audit Plan)', icon: FileText, desc: 'จัดทำแผนประจำปี บันทึกขอนายก และกฎบัตร' },
        { id: 'engagement-plan', label: 'แผนการปฏิบัติงาน (Engagement Plan)', icon: Sparkles, desc: 'แผนการปฏิบัติงานรายโครงการและแนวการตรวจ' }
      ]
    },
    {
      groupTitle: 'การลงพื้นที่ตรวจสอบ',
      items: [
        { id: 'opening-meeting', label: 'การประชุมเปิดการตรวจสอบ (Opening Meeting)', icon: Users, desc: 'หนังสือแจ้งล่วงหน้า และบันทึกรายงานเปิดตรวจ' },
        { id: 'execution', label: 'กระดาษทำการตรวจสอบ (Working Papers)', icon: ClipboardCheck, desc: 'บันทึกการตรวจสอบ สุ่มตัวอย่าง และสรุปข้อตรวจพบ' },
        { id: 'closing-meeting', label: 'การประชุมปิดการตรวจสอบ (Closing Meeting)', icon: CheckCircle2, desc: 'สรุปข้อตรวจพบเบื้องต้น และบันทึกปิดตรวจ' }
      ]
    },
    {
      groupTitle: 'รายงานผลและติดตาม',
      items: [
        { id: 'reporting', label: 'รายงานผลการตรวจสอบ (Audit Reporting)', icon: FileSpreadsheet, desc: 'รายงาน 5 องค์ประกอบ และบันทึกข้อความเสนอนายก' },
        { id: 'tracking-register', label: 'การติดตามผลการตรวจสอบ (Audit Follow-up)', icon: Clock, desc: 'ทะเบียนคุมข้อเสนอแนะ และบันทึกเตือน 30/60 วัน' },
        { id: 'audit-committee', label: 'คณะกรรมการตรวจสอบ (Audit Committee)', icon: Award, desc: 'กฎบัตร ปฏิทิน 4 ไตรมาส ประเมิน 11 ด้าน & QAIP' }
      ]
    },
    {
      groupTitle: 'งานควบคุมภายใน & บริหารความเสี่ยง',
      items: [
        { id: 'internal-control', label: 'การควบคุมภายใน (แบบ ปค. 1, 4, 5, 6)', icon: ShieldCheck, desc: 'แบบประเมินและรายงานการควบคุมภายใน ตามมาตรฐานกระทรวงการคลัง' },
        { id: 'risk-management', label: 'การบริหารความเสี่ยง (แบบ บส. 1 - 5)', icon: Layers, desc: 'แบบ บส. 1 - 5 ตามหนังสือสั่งการ ว 3482 (5 สำนัก/กอง)' },
        { id: 'lpa', label: 'การประเมินประสิทธิภาพ LPA ด้าน 1', icon: Award, desc: 'เกณฑ์ชี้วัดมาตรฐานความโปร่งใสและตรวจสอบภายใน อปท.' }
      ]
    },
    {
      groupTitle: 'คลังความรู้ & เครื่องมือช่วยตรวจ',
      items: [
        { id: 'forms', label: 'บันทึก/คำสั่ง', icon: FileText, desc: 'ชุดบันทึกข้อความและคำสั่งตามระเบียบงานสารบรรณ' },
        { id: 'central-hub', label: 'คลังเอกสารกลาง & ระเบียบ', icon: BookOpen, desc: 'ระเบียบ กฎหมาย สไลด์หลักสูตรทอง 2569 และตัวอย่าง' },
        {
          id: 'audit-toolkits',
          label: 'เครื่องมือช่วยคำนวณเชิงเทคนิค',
          icon: Wrench,
          hasSubmenu: true,
          subItems: [
            { toolId: 'factor-f', label: 'ราคากลาง Factor F & ปร.5', icon: Calculator },
            { toolId: 'penalty', label: 'คำนวณค่าปรับจัดซื้อจัดจ้าง', icon: Clock },
            { toolId: 'ordinance', label: 'งานก่อสร้างตามข้อบัญญัติ', icon: HardHat },
            { toolId: 'permit', label: 'ค่าธรรมเนียมใบอนุญาตอาคาร', icon: Building2 }
          ]
        }
      ]
    }
  ];

  return (
    <aside className="w-64 sm:w-72 bg-[#faf9f6] dark:bg-[#1a1e28] border-r border-stone-200/90 dark:border-stone-800 flex flex-col h-full shrink-0 select-none print:hidden shadow-xs">
      {/* User Org Card Header */}
      <div className="p-4 border-b border-stone-200/70 dark:border-stone-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 tracking-wider uppercase">
            {isAdmin ? (adminWorkspaceMode === 'admin' ? 'SUPER ADMIN CONSOLE' : 'AUDITOR WORKSPACE (PREVIEW)') : 'AUDITOR WORKSPACE'}
          </span>
          {isAdmin ? (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950 border border-amber-300 shadow-2xs">
              ROOT ADMIN
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenPackageModal}
              title="คลิกเพื่อดูแพ็กเกจ & สนับสนุนระบบ"
              className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            >
              {isExpired ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> หมดอายุ (ล็อค)
                </span>
              ) : subStatus.isTrial ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 shadow-2xs inline-flex items-center space-x-1">
                  <span>ฟรี 30 วัน</span>
                </span>
              ) : subStatus.tier === 'VIP' ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white border border-blue-400/50 shadow-sm inline-flex items-center space-x-1">
                  <span>VIP</span>
                </span>
              ) : subStatus.tier === 'PREMIUM' ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-stone-950 border border-amber-200 shadow-md inline-flex items-center space-x-1">
                  <span>PREMIUM</span>
                </span>
              ) : (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${planInfo.badgeColor}`}>
                  {planInfo.name.split(' ')[0]} {subStatus.isLifetime ? '(ตลอดชีพ)' : ''}
                </span>
              )}
            </button>
          )}
        </div>

        {isAdmin ? (
          <div className="space-y-0.5">
            <div className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
              Audit-OS แพลตฟอร์มกลาง
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-400 font-bold truncate">
              ผู้ดูแลระบบส่วนกลาง (Super Admin)
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
              ศูนย์ควบคุมระบบ & บริหารจัดการสิทธิ์
            </div>
            <div className="pt-1">
              <span className="inline-block text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                สิทธิ์ระดับสูงสุด • บริหารจัดการทั้งระบบ
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
              {session?.organization || orgProfile?.name || 'องค์การบริหารส่วนตำบลต้นแบบ'}
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold truncate">
              {session?.displayName || 'ผู้ตรวจสอบภายใน'}
            </div>
            <div className="text-[10px] text-stone-400 truncate">
              {session?.position || 'นักวิชาการตรวจสอบภายใน'}
            </div>
            <button
              type="button"
              onClick={onOpenPackageModal}
              className="mt-2 w-full py-1.5 px-2 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>สนับสนุนระบบ</span>
            </button>
          </div>
        )}

        {/* Expired warning badge for auditor */}
        {isExpired && !isAdmin && (
          <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
            <Lock className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">หมดอายุทดลองใช้ 30 วัน</p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400">
                ล็อคเมนูขั้นตอนการตรวจสอบ
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">

        {/* ========================================================================= */}
        {/* CASE 1: SUPER ADMIN IN ADMIN CONSOLE MODE (รูปแบบที่ 1 เฉพาะ ADMIN)      */}
        {/* ========================================================================= */}
        {isAdmin && adminWorkspaceMode === 'admin' ? (
          <div className="space-y-3">
            {/* Admin Header Title */}
            <div className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent rounded-lg border-l-3 border-amber-500 text-[11px] font-black text-amber-950 dark:text-amber-200 tracking-wide uppercase flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>เมนูบริหารจัดการระบบ (ADMIN)</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>

            {/* 7 Admin Dedicated Menu Items */}
            <div className="space-y-1">
              {ADMIN_STEPS.map((item) => {
                const Icon = item.icon;
                const isActive = item.targetTab === 'backoffice'
                  ? (currentTab === 'backoffice' && adminSubTab === item.subTab)
                  : (currentTab === item.targetTab);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentTab(item.targetTab);
                      if (item.subTab && setAdminSubTab) {
                        setAdminSubTab(item.subTab);
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-stone-900 to-amber-950 text-amber-200 shadow-md font-bold border-l-4 border-amber-400 ring-1 ring-amber-500/30'
                        : 'bg-white dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 hover:bg-amber-50/70 dark:hover:bg-amber-950/30 hover:text-amber-900 dark:hover:text-amber-200 border border-stone-200/80 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-stone-500 dark:text-stone-400'}`} />
                      <div className="truncate">
                        <div className="truncate font-bold text-xs">{item.label}</div>
                      </div>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ml-1 shrink-0 ${item.badgeColor || 'bg-amber-500 text-stone-950'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Switch to Auditor Workspace button at bottom */}
            <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 space-y-2">
              <div className="px-1 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                พื้นที่ปฏิบัติงานตรวจสอบ (WORKSPACE)
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setAdminWorkspaceMode) setAdminWorkspaceMode('auditor');
                  setCurrentTab('dashboard');
                }}
                className="w-full text-left p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer bg-gradient-to-r from-stone-800 via-stone-900 to-amber-950 text-amber-200 hover:from-stone-700 hover:to-amber-900 border border-amber-500/30 shadow-md group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-xs text-amber-100 truncate">
                      สลับไปพื้นที่ตรวจ (Auditor View)
                    </div>
                    <div className="text-[10px] text-stone-400 font-normal truncate">
                      ดูและทดสอบ 11 ขั้นตอนของ อปท.
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE 2: AUDITOR WORKSPACE (REGULAR AUDITOR OR ADMIN IN PREVIEW MODE)     */
          /* ========================================================================= */
          <>
            {/* Top Return to Admin Banner if Admin is in Auditor mode */}
            {isAdmin && adminWorkspaceMode === 'auditor' && (
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-transparent border border-amber-500/40 space-y-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1">
                    <span>โหมดทดสอบพื้นที่ตรวจ</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono font-bold border border-amber-500/30">
                    AUDITOR VIEW
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (setAdminWorkspaceMode) setAdminWorkspaceMode('admin');
                    setCurrentTab('backoffice');
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>กลับสู่ศูนย์ควบคุม Super Admin</span>
                </button>
              </div>
            )}

            {/* Navigation to Welcome & Cockpit Dashboard */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setCurrentTab('welcome')}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                  currentTab === 'welcome'
                    ? 'bg-stone-800 text-amber-100 shadow-xs border-l-4 border-amber-500'
                    : 'bg-white dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Home className="w-4 h-4 text-amber-500 shrink-0" />
                <span>หน้าแรก (ภาพรวมระบบ)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isExpired && !isAdmin) {
                    if (onShowExpiredModal) onShowExpiredModal();
                    else setCurrentTab('welcome');
                    return;
                  }
                  setCurrentTab('dashboard');
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-stone-800 text-amber-100 shadow-xs border-l-4 border-amber-500'
                    : 'bg-white dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-amber-500 shrink-0" />
                <span>แดชบอร์ดตรวจสอบ (Audit Cockpit)</span>
              </button>
            </div>

            {/* Lifecycle & Knowledge Groups (11 Steps) */}
            {LIFECYCLE_STEPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5 pt-2 first:pt-0">
                <div className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent rounded-lg border-l-3 border-amber-500 text-[11px] font-black text-amber-950 dark:text-amber-200 tracking-wide uppercase flex items-center justify-between shadow-2xs">
                  <span>{group.groupTitle}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 dark:bg-amber-400/70 shrink-0"></span>
                </div>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;

                    return (
                      <div key={item.id} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (isExpired && !isAdmin) {
                              if (onShowExpiredModal) onShowExpiredModal();
                              else setCurrentTab('welcome');
                              return;
                            }
                            setCurrentTab(item.id);
                            if (item.hasSubmenu) {
                              setToolkitSubmenuOpen(!toolkitSubmenuOpen);
                            }
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isActive
                              ? 'bg-stone-800 text-amber-100 shadow-xs font-bold border-l-4 border-amber-500'
                              : isExpired && !isAdmin
                              ? 'text-stone-400 dark:text-stone-600 opacity-60 hover:bg-stone-100 dark:hover:bg-stone-900'
                              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : isExpired && !isAdmin ? 'text-stone-400' : 'text-stone-400 dark:text-stone-500'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {isExpired && !isAdmin ? (
                            <Lock className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0 ml-1" />
                          ) : item.hasSubmenu ? (
                            <div className="p-0.5">
                              {toolkitSubmenuOpen ? (
                                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                              )}
                            </div>
                          ) : null}
                        </button>

                        {/* Submenu for Technical Toolkits */}
                        {item.hasSubmenu && toolkitSubmenuOpen && (
                          <div className="pl-6 space-y-0.5 pt-0.5">
                            {item.subItems.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive = isActive && activeToolkitTab === sub.toolId;

                              return (
                                <button
                                  key={sub.toolId}
                                  type="button"
                                  onClick={() => {
                                    if (isExpired && !isAdmin) {
                                      if (onShowExpiredModal) onShowExpiredModal();
                                      else setCurrentTab('welcome');
                                      return;
                                    }
                                    setCurrentTab('audit-toolkits');
                                    if (setActiveToolkitTab) setActiveToolkitTab(sub.toolId);
                                  }}
                                  className={`w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] font-medium transition-all flex items-center justify-between cursor-pointer ${
                                    isSubActive
                                      ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold border-l-2 border-amber-600'
                                      : isExpired && !isAdmin
                                      ? 'text-stone-400 opacity-60'
                                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 truncate">
                                    <SubIcon className="w-3 h-3 text-stone-400" />
                                    <span className="truncate">{sub.label}</span>
                                  </div>
                                  {isExpired && !isAdmin && <Lock className="w-2.5 h-2.5 text-stone-400 shrink-0 ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Google Sheets BYOD Button in Sidebar */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  if (onOpenCloudSync) onOpenCloudSync();
                }}
                className="w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/20 hover:border-emerald-500/40 shadow-2xs group"
              >
                <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs truncate flex items-center gap-1.5">
                    <span>ฐานข้อมูล Google Sheets</span>
                    {sheetsConfig.webAppUrl && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 font-normal truncate">
                    {sheetsConfig.webAppUrl ? 'ซิงค์ลง Google Drive แล้ว' : '100% Data Sovereignty ของ อปท.'}
                  </div>
                </div>
              </button>
            </div>

            {/* User Feedback & Suggestions button */}
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onOpenFeedback) onOpenFeedback();
                }}
                className="w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/20 hover:border-amber-500/40 shadow-2xs group"
              >
                <span className="p-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 group-hover:scale-110 transition-transform">
                  <MessageSquarePlus className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs truncate">เสนอแนะ / แจ้งปัญหา</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 font-normal truncate">ส่งตรงถึง ADMIN เพื่อพัฒนาระบบ</div>
                </div>
              </button>
            </div>

            {/* Bottom Return to Super Admin Button for Admin */}
            {isAdmin && adminWorkspaceMode === 'auditor' && (
              <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    if (setAdminWorkspaceMode) setAdminWorkspaceMode('admin');
                    setCurrentTab('backoffice');
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-600 via-amber-700 to-stone-800 text-amber-100 shadow-md flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-all"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>กลับสู่ศูนย์ควบคุม Super Admin</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-stone-200/60 dark:border-stone-800 text-[10px] text-stone-400 text-center">
        <div>Audit-OS for Local Government</div>
        <div className="text-[9px] text-stone-500">เวอร์ชัน 2.7 (ระบบสนับสนุนงานตรวจสอบ อปท.)</div>
      </div>
    </aside>
  );
}
