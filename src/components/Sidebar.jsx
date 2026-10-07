import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  ClipboardCheck,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Users,
  Wrench,
  ChevronDown,
  ChevronRight,
  Calculator,
  Clock,
  HardHat,
  Building2,
  Car,
  BadgeDollarSign,
  GraduationCap,
  HeartHandshake,
  Activity,
  CalendarDays,
  Globe,
  Baby
} from 'lucide-react';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  session,
  activeToolkitTab = 'factor-f',
  setActiveToolkitTab,
  pendingCount = 0
}) {
  const isAdmin = session?.role === 'admin';
  const isExecutive = session?.role === 'executive';
  const userPermissions = session?.permissions || [];
  const [toolkitSubmenuOpen, setToolkitSubmenuOpen] = useState(true);

  // Grouped Menu Structure organized into 5 Professional Pillars + Department Workspaces
  const MENU_PILLARS = [
    {
      pillarId: 'pillar-1',
      pillarNumber: 'หมวดที่ 1',
      pillarTitle: 'การวางแผน & ภาพรวมองค์กร',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/60',
      activeClass: 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xs font-semibold',
      hoverClass: 'hover:bg-blue-50/80 hover:text-blue-700 dark:hover:bg-slate-800/80 dark:hover:text-blue-300',
      iconInactive: 'text-blue-600 dark:text-blue-400',
      items: [
        { id: 'executive-dashboard', label: 'แดชบอร์ดผู้บริหาร', icon: LayoutDashboard },
        { id: 'dashboard', label: 'แดชบอร์ดตรวจสอบภายใน', icon: ShieldAlert },
        { id: 'central-calendar', label: 'ปฏิทินปฏิบัติงานส่วนกลาง', icon: CalendarDays },
        { id: 'audit-risk', label: 'การประเมินความเสี่ยงแผน', icon: ShieldAlert },
        { id: 'planning', label: 'แผนการตรวจสอบประจำปี', icon: FileText },
        { id: 'engagement-plan', label: 'แผนปฏิบัติการตรวจสอบ (ทุกมิติ)', icon: Sparkles },
      ]
    },
    {
      pillarId: 'pillar-2',
      pillarNumber: 'หมวดที่ 2',
      pillarTitle: 'ปฏิบัติการตรวจ & เทคนิค',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/60',
      activeClass: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-xs font-semibold',
      hoverClass: 'hover:bg-amber-50/80 hover:text-amber-800 dark:hover:bg-slate-800/80 dark:hover:text-amber-300',
      iconInactive: 'text-amber-600 dark:text-amber-400',
      items: [
        { id: 'execution', label: 'กระดาษทำการตรวจสอบ', icon: ClipboardCheck },
        {
          id: 'audit-toolkits',
          label: 'เครื่องมือช่วยตรวจเชิงเทคนิค',
          icon: Wrench,
          hasSubmenu: true,
          subItems: [
            { toolId: 'factor-f', label: 'ราคากลาง & Factor F', icon: Calculator },
            { toolId: 'penalty', label: 'ค่าปรับจัดซื้อจัดจ้าง', icon: Clock },
            { toolId: 'ordinance', label: 'งานก่อสร้างตามข้อบัญญัติ', icon: HardHat },
            { toolId: 'permit', label: 'ค่าธรรมเนียมใบอนุญาต', icon: Building2 }
          ]
        }
      ]
    },
    {
      pillarId: 'pillar-3',
      pillarNumber: 'หมวดที่ 3',
      pillarTitle: 'รายงานผล & ติดตาม',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60',
      activeClass: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xs font-semibold',
      hoverClass: 'hover:bg-emerald-50/80 hover:text-emerald-800 dark:hover:bg-slate-800/80 dark:hover:text-emerald-300',
      iconInactive: 'text-emerald-600 dark:text-emerald-400',
      items: [
        { id: 'reporting', label: 'รายงานผล & ติดตามข้อทักท้วง (CAPA)', icon: FileSpreadsheet }
      ]
    },
    {
      pillarId: 'pillar-dept',
      pillarNumber: 'พื้นที่ทำงาน',
      pillarTitle: 'ส่วนราชการ & ศพด.',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/60',
      activeClass: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-xs font-semibold',
      hoverClass: 'hover:bg-purple-50/80 hover:text-purple-800 dark:hover:bg-slate-800/80 dark:hover:text-purple-300',
      iconInactive: 'text-purple-600 dark:text-purple-400',
      items: [
        { id: 'dept-office', label: 'สำนักปลัด', icon: Building2 },
        { id: 'dept-finance', label: 'กองคลัง', icon: BadgeDollarSign },
        { id: 'dept-tech', label: 'กองช่าง', icon: HardHat },
        { id: 'dept-education', label: 'กองการศึกษา', icon: GraduationCap },
        { id: 'dept-welfare', label: 'กองสวัสดิการสังคม', icon: HeartHandshake },
        { id: 'dept-cdc-charoen', label: 'ศพด.วัดเจริญทัศน์', icon: Baby },
        { id: 'dept-cdc-fangthoeng', label: 'ศพด.บ้านฝางเทิง', icon: Baby }
      ]
    },
    {
      pillarId: 'pillar-4',
      pillarNumber: 'หมวดที่ 4',
      pillarTitle: 'Risk & Control',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/60',
      activeClass: 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white shadow-xs font-semibold',
      hoverClass: 'hover:bg-rose-50/80 hover:text-rose-800 dark:hover:bg-slate-800/80 dark:hover:text-rose-300',
      iconInactive: 'text-rose-600 dark:text-rose-400',
      items: [
        { id: 'internal-control', label: 'การควบคุมภายใน (ปค.4/5)', icon: ShieldCheck },
        { id: 'risk-management', label: 'การบริหารความเสี่ยงองค์กร', icon: AlertTriangle },
        { id: 'lpa', label: 'เตรียมรับประเมิน LPA', icon: Award }
      ]
    },
    {
      pillarId: 'pillar-5',
      pillarNumber: 'หมวดที่ 5',
      pillarTitle: 'คลังระเบียบ & จัดการระบบ',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300/80 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700/80',
      activeClass: 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white shadow-xs font-semibold',
      hoverClass: 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/80 dark:hover:text-slate-200',
      iconInactive: 'text-slate-500 dark:text-slate-400',
      items: [
        { id: 'knowledge', label: 'คลังระเบียบและกฎหมาย', icon: BookOpen },
        { id: 'forms', label: 'แบบฟอร์มมาตรฐาน', icon: FileSpreadsheet },
        { id: 'users', label: 'จัดการผู้ใช้งาน & กำหนดสิทธิ์', icon: Users, adminOnly: true }
      ]
    }
  ];

  const canAccessItem = (item) => {
    // 1. ผู้ดูแลระบบ (ADMIN): เข้าถึงได้ทุกเมนู
    if (isAdmin) return true;

    // 2. เมนูสำหรับ ADMIN เท่านั้น (เช่น จัดการผู้ใช้งาน): ผู้ใช้อื่นมองไม่เห็นเด็ดขาด
    if (item.adminOnly) return false;

    // 3. แดชบอร์ดผู้บริหาร: สงวนเฉพาะ Admin และ Executive เท่านั้น
    if (item.id === 'executive-dashboard') {
      return isExecutive;
    }

    // 4. ผู้บริหาร (Executive): เข้าถึงแดชบอร์ดผู้บริหาร และเมนูที่ได้รับอนุญาต
    if (isExecutive) {
      if (item.id === 'executive-dashboard') return true;
      return userPermissions.includes(item.id);
    }

    // 5. หน้าภาพรวมสาธารณะ: เข้าถึงได้หากได้รับสิทธิ์ หรือเป็น guest
    if (item.id === 'public-overview') {
      return userPermissions.includes('public-overview') || session?.role === 'guest';
    }

    // 6. ตรวจสอบสิทธิ์อย่างเข้มงวดตามที่ ADMIN กำหนดไว้ในตารางสิทธิ์ (Strict RBAC):
    // แสดงเฉพาะเมนูที่มีรหัสอยู่ใน userPermissions ของผู้ใช้นั้น ๆ เท่านั้น
    return userPermissions.includes(item.id);
  };

  return (
    <aside className="w-68 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col shrink-0 h-full border-r border-slate-200/80 dark:border-slate-800 transition-colors overflow-hidden no-print print:hidden">
      {/* Sidebar Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-cyan-400 block font-mono">
            อบต.ฝางคำ
          </span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 tracking-tight flex items-center gap-1.5">
            <span>เมนูระบบปฏิบัติการ</span>
          </div>
        </div>
        {isAdmin ? (
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-black px-2 py-0.5 rounded-full shadow-2xs">
            👑 ADMIN
          </span>
        ) : isExecutive ? (
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/80 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full shadow-2xs">
            ⭐ EXEC
          </span>
        ) : session?.role === 'guest' ? (
          <span className="text-[10px] bg-purple-50 dark:bg-purple-950/80 border border-purple-200/80 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full shadow-2xs">
            👥 GUEST
          </span>
        ) : (
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full shadow-2xs">
            🏢 USER
          </span>
        )}
      </div>

      {/* Navigation Menu List */}
      <nav className="flex-1 p-2 space-y-2.5 overflow-y-auto custom-scrollbar min-h-0">
        {/* Top Quick Portal Card */}
        {isAdmin || isExecutive || session?.role === 'guest' ? (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
            <button
              onClick={() => setCurrentTab('welcome')}
              className={`flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'welcome'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">หน้าแรก</span>
            </button>

            <button
              onClick={() => setCurrentTab('public-overview')}
              className={`flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'public-overview'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">ภาพรวม</span>
            </button>
          </div>
        ) : (
          <div className="p-1 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
            <button
              onClick={() => setCurrentTab('public-overview')}
              className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'public-overview'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">หน้าภาพรวม</span>
            </button>
          </div>
        )}

        {/* 5 Grouped Pillars + Workspaces */}
        {MENU_PILLARS.map((pillar) => {
          const visibleItems = pillar.items.filter(canAccessItem);
          if (visibleItems.length === 0) return null;

          return (
            <div
              key={pillar.pillarId}
              className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-1.5 border border-slate-200/70 dark:border-slate-800/80 shadow-2xs space-y-1"
            >
              {/* Pillar Category Header */}
              <div className="px-1.5 pt-0.5 pb-1 flex items-center gap-1.5 border-b border-slate-200/50 dark:border-slate-800/60 min-w-0">
                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md border tracking-wide shrink-0 whitespace-nowrap ${pillar.badgeClass}`}>
                  {pillar.pillarNumber}
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate min-w-0">
                  {pillar.pillarTitle}
                </span>
              </div>

              {/* Items in this Pillar */}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  const hasSubmenu = Boolean(item.hasSubmenu && item.subItems);

                  return (
                    <div key={item.id} className="space-y-0.5">
                      <button
                        onClick={() => {
                          setCurrentTab(item.id);
                          if (hasSubmenu) {
                            setToolkitSubmenuOpen(true);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                          isActive
                            ? `${pillar.activeClass}`
                            : `text-slate-700 dark:text-slate-300 font-medium ${pillar.hoverClass}`
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : pillar.iconInactive}`} />
                          <span className="truncate text-left">{item.label}</span>
                        </div>

                        {item.id === 'users' && isAdmin && pendingCount > 0 && (
                          <span className="ml-auto shrink-0 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs animate-pulse ring-1 ring-white/20">
                            {pendingCount}
                          </span>
                        )}

                        {hasSubmenu && (
                          <div className="flex items-center space-x-1 shrink-0 ml-1">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setToolkitSubmenuOpen(!toolkitSubmenuOpen);
                              }}
                              className="p-0.5 hover:bg-white/20 rounded cursor-pointer"
                            >
                              {toolkitSubmenuOpen ? (
                                <ChevronDown className={`w-3 h-3 ${isActive ? 'text-white' : 'opacity-70'}`} />
                              ) : (
                                <ChevronRight className={`w-3 h-3 ${isActive ? 'text-white' : 'opacity-70'}`} />
                              )}
                            </span>
                          </div>
                        )}
                      </button>

                      {/* Sub-menu items (สำหรับเมนูเครื่องมือเชิงเทคนิค) */}
                      {hasSubmenu && toolkitSubmenuOpen && (
                        <div className="ml-3 pl-2.5 border-l-2 border-amber-300 dark:border-amber-700/60 space-y-0.5 py-0.5">
                          {item.subItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = currentTab === 'audit-toolkits' && activeToolkitTab === sub.toolId;

                            return (
                              <button
                                key={sub.toolId}
                                onClick={() => {
                                  setCurrentTab('audit-toolkits');
                                  if (setActiveToolkitTab) {
                                    setActiveToolkitTab(sub.toolId);
                                  }
                                }}
                                className={`w-full flex items-center space-x-2 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                  isSubActive
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <SubIcon className={`w-3 h-3 shrink-0 ${isSubActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                                <span className="truncate text-left">{sub.label}</span>
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
          );
        })}
      </nav>

      {/* User Info Card in Sidebar Bottom */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 space-y-1.5 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
            {isAdmin ? '👑' : '🏢'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {session?.displayName || session?.username || 'ผู้ใช้งาน'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {session?.department || 'สังกัดส่วนราชการ'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            <span>สิทธิ์: {isAdmin ? 'เต็มสิทธิ์ทุกเสาหลัก' : 'ตามที่ได้รับมอบหมาย'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
