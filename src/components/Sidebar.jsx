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
  DollarSign
} from 'lucide-react';
import { MEMBERSHIP_PLANS } from '../utils/auth';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  session,
  orgProfile,
  activeToolkitTab = 'factor-f',
  setActiveToolkitTab,
  pendingCount = 0
}) {
  const isAdmin = session?.role === 'admin';
  const [toolkitSubmenuOpen, setToolkitSubmenuOpen] = useState(false);

  const planKey = session?.plan || 'annual';
  const planInfo = MEMBERSHIP_PLANS[planKey] || MEMBERSHIP_PLANS.annual;

  // 12-Step Lifecycle Sections strictly for Internal Auditors
  const LIFECYCLE_STEPS = [
    {
      groupTitle: 'ขั้นตอนที่ 1 - 4: การวางแผนตรวจสอบ',
      items: [
        { id: 'audit-risk', stepNum: '1', label: '1. ประเมินความเสี่ยง SOFCK', icon: ShieldAlert, desc: 'วิเคราะห์เกณฑ์ 5 ด้าน และผังความเสี่ยง Universe' },
        { id: 'strategic-plan', stepNum: '2', label: '2. แผนระยะยาว 3 ปี & คน-วัน', icon: Calendar, desc: 'คำนวณวันทำการตรวจ และแผนหมุนเวียน 3 ปี' },
        { id: 'planning', stepNum: '3', label: '3. แผนตรวจสอบประจำปี & ขออนุมัติ', icon: FileText, desc: 'จัดทำแผนประจำปี บันทึกขอนายก และกฎบัตร' },
        { id: 'engagement-plan', stepNum: '4', label: '4. แผนปฏิบัติงาน & แนวตรวจ ว 614', icon: Sparkles, desc: 'แผนปฏิบัติงานรายกิจกรรมและแนวการตรวจ' }
      ]
    },
    {
      groupTitle: 'ขั้นตอนที่ 5 - 7: การลงพื้นที่ตรวจสอบ',
      items: [
        { id: 'opening-meeting', stepNum: '5', label: '5. การประชุมเปิดการตรวจสอบ', icon: Users, desc: 'หนังสือแจ้งล่วงหน้า และบันทึกรายงานเปิดตรวจ' },
        { id: 'execution', stepNum: '6', label: '6. กระดาษทำการ 6 ภารกิจ & ช่าง', icon: ClipboardCheck, desc: 'รับเงิน, บัญชี, พัสดุ, สัญญา, เบิกจ่าย, รถ, ช่าง' },
        { id: 'closing-meeting', stepNum: '7', label: '7. การประชุมปิดการตรวจสอบ', icon: CheckCircle2, desc: 'สรุปข้อตรวจพบเบื้องต้น และบันทึกปิดตรวจ' }
      ]
    },
    {
      groupTitle: 'ขั้นตอนที่ 8 - 9: รายงานผลและติดตาม',
      items: [
        { id: 'reporting', stepNum: '8', label: '8. รายงานผลการตรวจสอบ & สรุป', icon: FileSpreadsheet, desc: 'รายงาน 5 องค์ประกอบ และบันทึกเสนอนายก' },
        { id: 'tracking-register', stepNum: '9', label: '9. ทะเบียนคุม & ติดตามผล 30 วัน', icon: Clock, desc: 'ทะเบียนคุมข้อเสนอแนะ และหนังสือเตือน 30 วัน' }
      ]
    },
    {
      groupTitle: 'คลังความรู้ & เครื่องมือช่วยตรวจ',
      items: [
        { id: 'central-hub', stepNum: '10', label: '10. คลังเอกสารกลาง & ระเบียบ', icon: BookOpen, desc: 'ระเบียบ กฎหมาย สไลด์หลักสูตรทอง 2569 และตัวอย่าง' },
        {
          id: 'audit-toolkits',
          stepNum: '11',
          label: '11. เครื่องมือช่วยคำนวณเชิงเทคนิค',
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
    <aside className="w-64 sm:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 select-none print:hidden shadow-xs">
      {/* User Org Card Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            {isAdmin ? '👑 SUPER ADMIN WORKSPACE' : '🛡️ AUDITOR WORKSPACE'}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isAdmin ? 'bg-amber-100 text-amber-800 border-amber-300' : planInfo.badgeColor}`}>
            {isAdmin ? 'ผู้ดูแลระบบ' : planInfo.name.split(' ')[0]}
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
            {session?.organization || orgProfile?.name || 'องค์การบริหารส่วนตำบลต้นแบบ'}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">
            {session?.displayName || 'ผู้ตรวจสอบภายใน'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {session?.position || 'นักวิชาการตรวจสอบภายใน'}
          </div>
        </div>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {/* Super Admin Backoffice Menu Item (Exclusive for Admin) */}
        {isAdmin && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 tracking-wider uppercase flex items-center justify-between">
              <span>ส่วนผู้ดูแลระบบกลาง</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>

            <button
              onClick={() => setCurrentTab('backoffice')}
              className={`w-full text-left p-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                currentTab === 'backoffice'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 border border-amber-200/80 dark:border-amber-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                <span>12. ระบบหลังบ้าน Super Admin</span>
              </div>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* 12-Step Lifecycle Groups */}
        {LIFECYCLE_STEPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 tracking-wider uppercase">
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
                        setCurrentTab(item.id);
                        if (item.hasSubmenu) {
                          setToolkitSubmenuOpen(!toolkitSubmenuOpen);
                        }
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.hasSubmenu && (
                        <div className="p-0.5">
                          {toolkitSubmenuOpen ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                      )}
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
                                setCurrentTab('audit-toolkits');
                                if (setActiveToolkitTab) setActiveToolkitTab(sub.toolId);
                              }}
                              className={`w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-2 cursor-pointer ${
                                isSubActive
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <SubIcon className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{sub.label}</span>
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
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
        <div>Audit-OS for Local Government</div>
        <div className="text-[9px] text-slate-500">เวอร์ชัน 2.5 (SaaS Auditor Edition)</div>
      </div>
    </aside>
  );
}
