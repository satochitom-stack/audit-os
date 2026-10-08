import React from 'react';
import {
  FileText,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ClipboardList,
  FolderOpen,
  CalendarDays,
  ChevronRight,
  Plus,
  Settings,
  UserCheck,
  Wrench
} from 'lucide-react';

export default function DashboardView({
  orgProfile,
  selectedYear = '2569',
  annualPlans = [],
  workingPapers = [],
  lpaIndicators = [],
  riskAssessments = [],
  setCurrentTab,
  setSelectedWp,
  onOpenSettings,
  session,
  onLogout
}) {
  const completedPlans = annualPlans.filter((p) => p.status === 'completed').length;
  const inProgressPlans = annualPlans.filter((p) => p.status === 'in_progress').length;
  const pendingPlans = annualPlans.filter((p) => p.status === 'pending').length;

  const totalLpaScore = lpaIndicators.reduce((acc, curr) => acc + curr.score, 0);
  const maxLpaScore = lpaIndicators.reduce((acc, curr) => acc + curr.maxScore, 0) || 25;
  const lpaPercent = Math.round((totalLpaScore / maxLpaScore) * 100) || 0;

  const highRisks = riskAssessments.filter(
    (r) => r.level === 'สูงมาก' || r.level === 'สูง'
  ).length;

  const hasAuditorName = Boolean(orgProfile.auditorName?.trim());
  const orgDisplayName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';

  return (
    <div className="space-y-6">
      {/* Guest Mode Informational Banner */}
      {session?.role === 'guest' && (
        <div className="bg-gradient-to-r from-stone-100 via-amber-50/40 to-stone-100 dark:from-stone-900 dark:via-stone-850 dark:to-stone-900 border border-amber-300/40 dark:border-amber-900/50 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              👥
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                  ยินดีต้อนรับสู่โหมดผู้เยี่ยมชม (Guest View)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                  บุคคลภายนอก
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                คุณกำลังรับชมภาพรวมผลการดำเนินงานและสถิติงานตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>🔑 เข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่</span>
            </button>
          )}
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-2xl p-5 sm:p-6 text-stone-100 shadow-sm border border-stone-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full px-3 py-1 text-xs font-bold mb-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ปีงบประมาณ พ.ศ. {selectedYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-100">
              ระบบงานตรวจสอบภายใน {orgDisplayName}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
              {hasAuditorName ? (
                <>ผู้ตรวจสอบภายใน: <strong className="text-amber-200 font-bold">{orgProfile.auditorName}</strong> ({orgProfile.auditorPosition})</>
              ) : (
                <span className="text-amber-400 font-medium">
                  ⚠️ ยังไม่ได้ตั้งชื่อผู้ตรวจสอบภายใน กรุณากดปุ่มตั้งค่าเพื่อระบุชื่อของท่าน
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!hasAuditorName && (
              <button
                onClick={onOpenSettings}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>ตั้งชื่อผู้ตรวจสอบ</span>
              </button>
            )}
            <button
              onClick={() => setCurrentTab('execution')}
              className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <ClipboardList className="w-4 h-4 text-amber-200" />
              <span>เปิดกระดาษทำการ</span>
            </button>
            <button
              onClick={() => setCurrentTab('reporting')}
              className="bg-stone-800 hover:bg-stone-750 border border-stone-700 text-amber-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>สรุปรายงานผล</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Plans */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">แผนตรวจสอบประจำปี</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{annualPlans.length}</span>
            <span className="text-xs text-stone-500 dark:text-stone-400">โครงการตามแผน</span>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400">
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3 mr-1" /> เสร็จสิ้น {completedPlans}
            </span>
            <span className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
              <Clock className="w-3 h-3 mr-1" /> กำลังตรวจ {inProgressPlans}
            </span>
            <span className="text-stone-400 dark:text-stone-500">รอตรวจ {pendingPlans}</span>
          </div>
        </div>

        {/* Card 2: LPA Readiness */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">ความพร้อมรับตรวจ LPA</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalLpaScore}/{maxLpaScore}</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {lpaPercent}%
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 flex justify-between items-center">
            <span>ตัวชี้วัดด้านที่ 1 (ตัวชี้วัด 1-5)</span>
            <button
              onClick={() => setCurrentTab('lpa')}
              className="text-amber-800 dark:text-amber-400 font-medium hover:underline flex items-center cursor-pointer"
            >
              ประเมินตนเอง <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Internal Control */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">กระดาษทำการมาตรฐาน</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{workingPapers.length}</span>
            <span className="text-xs text-stone-500 dark:text-stone-400">เรื่องตรวจพร้อมใช้งาน</span>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 flex justify-between items-center">
            <span>KTB, เช่าบ้าน, จัดซื้อ, อาหารกลางวัน ฯลฯ</span>
            <button
              onClick={() => setCurrentTab('execution')}
              className="text-amber-800 dark:text-amber-400 font-medium hover:underline flex items-center cursor-pointer"
            >
              เข้าตรวจ <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: High Risk Items */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">การประเมินความเสี่ยง</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{highRisks}</span>
            <span className="text-xs text-stone-500 dark:text-stone-400">กิจกรรมเสี่ยงสูง</span>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 flex justify-between items-center">
            <span>เกณฑ์ SOFCK เพื่อจัดทำแผน</span>
            <button
              onClick={() => setCurrentTab('audit-risk')}
              className="text-amber-800 dark:text-amber-400 font-medium hover:underline flex items-center cursor-pointer"
            >
              ประเมินความเสี่ยง <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Audit Projects & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Annual Audit Plan Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                สถานะการปฏิบัติงานตามแผนตรวจสอบประจำปี {selectedYear}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                ติดตามความก้าวหน้าโครงการตรวจสอบทั้ง 4 ไตรมาส
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('planning')}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>{annualPlans.length > 0 ? 'ดูแผนทั้งหมด' : '+ เพิ่มโครงการในแผน'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {annualPlans.length === 0 ? (
            <div className="text-center py-10 px-6 bg-stone-50/70 dark:bg-stone-850/40 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200">
                ยังไม่มีโครงการในแผนประจำปี {selectedYear}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                เริ่มต้นเพิ่มโครงการตรวจสอบจริงของ อปท. ของท่าน เพื่อกำหนดงวดเวลา งบประมาณ และติดตามความก้าวหน้า
              </p>
              <button
                onClick={() => setCurrentTab('planning')}
                className="mt-2 bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center space-x-2 cursor-pointer shadow-md shadow-amber-900/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มโครงการตรวจสอบตามแผน</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {annualPlans.map((plan) => {
                const isCompleted = plan.status === 'completed';
                const isInProgress = plan.status === 'in_progress';
                return (
                  <div
                    key={plan.id}
                    className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-900/60 hover:bg-amber-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                          {plan.id}
                        </span>
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                          {plan.department}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            plan.riskLevel === 'สูงมาก'
                              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                              : plan.riskLevel === 'สูง'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          เสี่ยง{plan.riskLevel}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                        {plan.title}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center space-x-3">
                        <span>{plan.quarter}</span>
                        {plan.period && (
                          <>
                            <span>•</span>
                            <span>{plan.period}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isInProgress
                                ? 'bg-amber-600'
                                : 'bg-stone-300 dark:bg-stone-700'
                            }`}
                            style={{ width: `${plan.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300 w-8 text-right">
                          {plan.progress}%
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedWp(workingPapers[0]?.id || 'WP-KTB-01');
                          setCurrentTab('execution');
                        }}
                        className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>เข้าตรวจ</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Quick Working Papers & Reference Directives */}
        <div className="space-y-4">
          {/* Quick Access to Working Paper */}
          <div className="bg-gradient-to-br from-stone-50 via-white to-white dark:from-stone-850 dark:via-stone-900 dark:to-stone-900 rounded-2xl p-5 shadow-xs border border-stone-200/80 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-900/60 relative overflow-hidden transition-all">
            <div className="relative z-10">
              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-800 dark:text-amber-400 mb-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                </div>
                <span>กระดาษทำการตรวจสอบมาตรฐาน ({workingPapers.length} เรื่อง)</span>
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-tight">
                {workingPapers[0]?.topic || 'ระบบตรวจสอบภายใน'}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                พร้อมเกณฑ์ตรวจสอบตามระเบียบกระทรวงมหาดไทย ระบบสุ่มตรวจฎีกา และส่งออก Excel
              </p>
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  {workingPapers[0]?.department}
                </span>
                <button
                  onClick={() => {
                    setSelectedWp(workingPapers[0]?.id || 'WP-KTB-01');
                    setCurrentTab('execution');
                  }}
                  className="bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  เปิดกระดาษทำการ
                </button>
              </div>
            </div>
          </div>

          {/* Quick Access to Technical Audit Toolkits */}
          <div className="bg-gradient-to-br from-amber-50/30 via-white to-white dark:from-stone-850 dark:via-stone-900 dark:to-stone-900 rounded-2xl p-5 shadow-xs border border-amber-200/60 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-800 relative overflow-hidden transition-all">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                </div>
                <span>เสาหลักที่ 2: เครื่องมือช่วยตรวจเชิงเทคนิค</span>
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
                เครื่องมือคำนวณราคากลาง & ค่าปรับจัดซื้อจัดจ้าง
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                4 โมดูลเฉพาะทางสำหรับปี 2570: Factor F, ค่าปรับ, ข้อบัญญัติ, และค่าธรรมเนียมอาคาร
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  4 เครื่องมือพร้อมใช้
                </span>
                <button
                  onClick={() => setCurrentTab('audit-toolkits')}
                  className="bg-stone-850 hover:bg-stone-800 text-amber-200 border border-amber-600/30 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span>เปิดเครื่องมือ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Key Directives Alert */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-stone-800 dark:text-stone-200 mb-3">
              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                <FolderOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              </div>
              <span>หนังสือสั่งการและระเบียบมาตรฐาน</span>
            </div>
            <div className="space-y-2.5">
              <div
                onClick={() => setCurrentTab('central-hub')}
                className="p-3 rounded-xl bg-stone-50/80 hover:bg-amber-50/60 dark:bg-stone-850/80 dark:hover:bg-stone-800/80 border border-stone-200/70 hover:border-amber-300 dark:border-stone-700 dark:hover:border-amber-700/40 transition-all shadow-2xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                    หนังสือ ว 119 (จัดงานประเพณี)
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 transition-colors" />
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">
                  หลักเกณฑ์การเบิกจ่ายงานเทศกาลและประเพณีท้องถิ่น
                </div>
              </div>

              <div
                onClick={() => setCurrentTab('central-hub')}
                className="p-3 rounded-xl bg-stone-50/80 hover:bg-amber-50/60 dark:bg-stone-850/80 dark:hover:bg-stone-800/80 border border-stone-200/70 hover:border-amber-300 dark:border-stone-700 dark:hover:border-amber-700/40 transition-all shadow-2xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                    หนังสือ ว 257 (หลักเกณฑ์ยืมเงิน)
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 transition-colors" />
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">
                  กำหนดส่งใช้เงินยืมภายใน 30 วันนับแต่วันสิ้นสุดโครงการ
                </div>
              </div>

              <div
                onClick={() => setCurrentTab('central-hub')}
                className="p-3 rounded-xl bg-stone-50/80 hover:bg-amber-50/60 dark:bg-stone-850/80 dark:hover:bg-stone-800/80 border border-stone-200/70 hover:border-amber-300 dark:border-stone-700 dark:hover:border-amber-700/40 transition-all shadow-2xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                    หนังสือ ว 11807 (เดินทางไปราชการ)
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 transition-colors" />
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">
                  วิธีปฏิบัติการเบิกค่าเดินทางฉบับปรับปรุง พ.ย. 67
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
