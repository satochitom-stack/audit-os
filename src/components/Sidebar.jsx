import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { MEMBERSHIP_PLANS, checkUserSubscription } from '../utils/auth';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  session,
  orgProfile,
  activeToolkitTab = 'factor-f',
  setActiveToolkitTab,
  pendingCount = 0,
  onShowExpiredModal
}) {
  const isAdmin = session?.role === 'admin';
  const subStatus = checkUserSubscription(session);
  const isExpired = subStatus.expired;
  const [toolkitSubmenuOpen, setToolkitSubmenuOpen] = useState(false);

  const planKey = session?.plan || 'annual';
  const planInfo = MEMBERSHIP_PLANS[planKey] || MEMBERSHIP_PLANS.annual;

  // 12-Step Lifecycle Sections strictly for Internal Auditors
  const LIFECYCLE_STEPS = [
    {
      groupTitle: 'ขั้นตอนที่ 1 - 4: การวางแผนตรวจสอบ',
      items: [
        { id: 'audit-risk', stepNum: '1', label: '1. การประเมินความเสี่ยง (Risk Assessment)', icon: ShieldAlert, desc: 'วิเคราะห์เกณฑ์ 5 ด้าน SOFCK และผังความเสี่ยง Universe' },
        { id: 'strategic-plan', stepNum: '2', label: '2. แผนระยะยาว 3 ปี (Strategic Plan)', icon: Calendar, desc: 'คำนวณวันทำการตรวจ และแผนหมุนเวียน 3 ปี' },
        { id: 'planning', stepNum: '3', label: '3. แผนการตรวจสอบประจำปี (Annual Audit Plan)', icon: FileText, desc: 'จัดทำแผนประจำปี บันทึกขอนายก และกฎบัตร' },
        { id: 'engagement-plan', stepNum: '4', label: '4. แผนการปฏิบัติงาน (Engagement Plan)', icon: Sparkles, desc: 'แผนการปฏิบัติงานรายโครงการและแนวการตรวจ' }
      ]
    },
    {
      groupTitle: 'ขั้นตอนที่ 5 - 7: การลงพื้นที่ตรวจสอบ',
      items: [
        { id: 'opening-meeting', stepNum: '5', label: '5. การประชุมเปิดการตรวจสอบ (Opening Meeting)', icon: Users, desc: 'หนังสือแจ้งล่วงหน้า และบันทึกรายงานเปิดตรวจ' },
        { id: 'execution', stepNum: '6', label: '6. กระดาษทำการตรวจสอบ (Working Papers)', icon: ClipboardCheck, desc: 'บันทึกการตรวจสอบ สุ่มตัวอย่าง และสรุปข้อตรวจพบ' },
        { id: 'closing-meeting', stepNum: '7', label: '7. การประชุมปิดการตรวจสอบ (Closing Meeting)', icon: CheckCircle2, desc: 'สรุปข้อตรวจพบเบื้องต้น และบันทึกปิดตรวจ' }
      ]
    },
    {
      groupTitle: 'ขั้นตอนที่ 8 - 10: รายงานผลและติดตาม',
      items: [
        { id: 'reporting', stepNum: '8', label: '8. รายงานผลการตรวจสอบ (Audit Reporting)', icon: FileSpreadsheet, desc: 'รายงาน 5 องค์ประกอบ และบันทึกข้อความเสนอนายก' },
        { id: 'tracking-register', stepNum: '9', label: '9. การติดตามผลการตรวจสอบ (Audit Follow-up)', icon: Clock, desc: 'ทะเบียนคุมข้อเสนอแนะ และบันทึกเตือน 30/60 วัน' },
        { id: 'audit-committee', stepNum: '10', label: '10. คณะกรรมการตรวจสอบ (Audit Committee)', icon: Award, desc: 'กฎบัตร ปฏิทิน 4 ไตรมาส ประเมิน 11 ด้าน & QAIP' }
      ]
    },
    {
      groupTitle: 'คลังความรู้ & เครื่องมือช่วยตรวจ',
      items: [
        { id: 'central-hub', stepNum: '11', label: '11. คลังเอกสารกลาง & ระเบียบ', icon: BookOpen, desc: 'ระเบียบ กฎหมาย สไลด์หลักสูตรทอง 2569 และตัวอย่าง' },
        {
          id: 'audit-toolkits',
          stepNum: '12',
          label: '12. เครื่องมือช่วยคำนวณเชิงเทคนิค',
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
            {isAdmin ? '👑 SUPER ADMIN CONSOLE' : '🛡️ AUDITOR WORKSPACE'}
          </span>
          {isAdmin ? (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950 border border-amber-300 shadow-2xs">
              👑 ROOT ADMIN
            </span>
          ) : isExpired ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> หมดอายุ (ล็อค)
            </span>
          ) : subStatus.isTrial ? (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 shadow-2xs inline-flex items-center space-x-1">
              <span>🌱 ฟรี 30 วัน</span> <span>({subStatus.daysRemaining} วัน)</span>
            </span>
          ) : subStatus.tier === 'VIP' ? (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white border border-blue-400/50 shadow-sm inline-flex items-center space-x-1">
              <span>⭐ VIP</span> <span>({subStatus.daysRemaining} วัน)</span>
            </span>
          ) : subStatus.tier === 'PREMIUM' ? (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-stone-950 border border-amber-200 shadow-md inline-flex items-center space-x-1">
              <span>👑 PREMIUM</span> <span>({subStatus.daysRemaining} วัน)</span>
            </span>
          ) : (
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${planInfo.badgeColor}`}>
              {planInfo.name.split(' ')[0]} {subStatus.isLifetime ? '(ตลอดชีพ)' : `(${subStatus.daysRemaining} วัน)`}
            </span>
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
                สิทธิ์ระดับสูงสุด • ใช้งานตลอดชีพ (Lifetime)
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
          </div>
        )}

        {/* Expired warning badge */}
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
        {/* Navigation to Welcome Page (หน้าแรก) */}
        <div>
          <button
            onClick={() => setCurrentTab('welcome')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
              currentTab === 'welcome'
                ? 'bg-stone-800 text-amber-100 shadow-xs border-l-4 border-amber-500'
                : 'bg-white dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/80 dark:border-stone-800'
            }`}
          >
            <span className="text-sm">🏠</span>
            <span>หน้าแรก (ภาพรวมระบบ)</span>
          </button>
        </div>

        {/* 12-Step Lifecycle Groups */}
        {LIFECYCLE_STEPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 px-2 tracking-wider uppercase">
              {group.groupTitle}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
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

        {/* Super Admin Backoffice Menu Item (Exclusive for Admin - Step 12 at bottom) */}
        {isAdmin && (
          <div className="space-y-1 pt-3 border-t border-stone-200/80 dark:border-stone-800">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 tracking-wider uppercase flex items-center justify-between">
              <span>ส่วนผู้ดูแลระบบกลาง</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>

            <button
              onClick={() => setCurrentTab('backoffice')}
              className={`w-full text-left p-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                currentTab === 'backoffice'
                  ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-stone-800 text-amber-100 shadow-md border-l-4 border-amber-400'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 border border-amber-200/80 dark:border-amber-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                <span>13. ระบบหลังบ้าน Super Admin</span>
              </div>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
        <div>Audit-OS for Local Government</div>
        <div className="text-[9px] text-slate-500">เวอร์ชัน 2.5 (SaaS Auditor Edition)</div>
      </div>
    </aside>
  );
}
