import React from 'react';
import PageHeaderBanner from './PageHeaderBanner';
import {
  Building,
  Calendar,
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
  Wrench,
  ShieldAlert,
  ClipboardCheck,
  Search,
  ExternalLink,
  BookOpen,
  Sparkles,
  MessageSquarePlus,
  Target,
  FileCheck2,
  Shield,
  Layers,
  ArrowUpRight,
  CreditCard
} from 'lucide-react';
import AuditLifecycleStepper from './AuditLifecycleStepper';

export default function DashboardView({
  orgProfile = {},
  selectedYear = '2569',
  annualPlans = [],
  workingPapers = [],
  lpaIndicators = [],
  riskAssessments = [],
  auditUniverse = [],
  setCurrentTab,
  setSelectedWp,
  onOpenSettings,
  session,
  onLogout,
  onOpenFeedback,
  onOpenPackageModal
}) {
  // Compute Annual Plans stats
  const completedPlans = annualPlans.filter((p) => p.status === 'completed').length;
  const inProgressPlans = annualPlans.filter((p) => p.status === 'in_progress').length;
  const pendingPlans = annualPlans.filter((p) => p.status === 'pending').length;
  const avgProgress = annualPlans.length > 0
    ? Math.round(annualPlans.reduce((acc, p) => acc + (p.progress || 0), 0) / annualPlans.length)
    : 0;

  // Compute LPA Readiness stats
  const totalLpaScore = lpaIndicators.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const maxLpaScore = lpaIndicators.reduce((acc, curr) => acc + (curr.maxScore || 0), 0) || 25;
  const lpaPercent = Math.round((totalLpaScore / maxLpaScore) * 100) || 0;

  // Compute Risk Assessment & Universe stats (prefer live auditUniverse, fallback to riskAssessments)
  const activeUniverse = auditUniverse && auditUniverse.length > 0 ? auditUniverse : riskAssessments;
  const totalUniverseCount = activeUniverse.length;
  const highRisks = activeUniverse.filter(
    (r) => r.level === 'สูงมาก' || r.level === 'สูง'
  ).length;
  const mediumRisks = activeUniverse.filter((r) => r.level === 'ปานกลาง').length;
  const lowRisks = activeUniverse.filter((r) => r.level === 'ต่ำ').length;
  const plannedCount = activeUniverse.filter((r) => r.includedInPlan).length;

  const hasAuditorName = Boolean(orgProfile?.auditorName?.trim());
  const orgDisplayName = orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น';

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
                คุณกำลังรับชมภาพรวมผลการดำเนินงานและสถิติงานตรวจสอบภายใน {orgDisplayName}
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

      {/* Page Header Banner (Strictly no buttons inside) */}
      <PageHeaderBanner
        title={`แดชบอร์ดตรวจสอบภายใน (Audit Cockpit)`}
        orgName={orgDisplayName}
        auditorName={`ผู้ตรวจสอบ: ${orgProfile?.auditorName ? `${orgProfile.auditorName} (${orgProfile.auditorPosition || 'ผู้ตรวจสอบภายใน'})` : 'หน่วยตรวจสอบภายใน'}`}
        year={selectedYear}
        badges={['ศูนย์ควบคุม & ติดตามผลการตรวจสอบรอบปี']}
      />

      {/* QUICK COMMAND ACTION BAR (ทางลัดปฏิบัติการด่วน 1 คลิก) */}
      <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-amber-600" />
            <span>ทางลัดการดำเนินงานตรวจสอบด่วน (Quick Navigation)</span>
          </span>
          <span className="text-[11px] text-stone-400">ปีงบประมาณ พ.ศ. {selectedYear}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <button
            onClick={() => setCurrentTab('audit-risk')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-amber-500/10 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/70 dark:border-stone-700 text-center transition-all cursor-pointer group shadow-2xs"
          >
            <div className="text-base mb-1 group-hover:scale-110 transition-transform">🎯</div>
            <div className="text-[11px] font-bold truncate">1. ประเมินความเสี่ยง</div>
          </button>

          <button
            onClick={() => setCurrentTab('strategic-plan')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-amber-500/10 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/70 dark:border-stone-700 text-center transition-all cursor-pointer group shadow-2xs"
          >
            <div className="text-base mb-1 group-hover:scale-110 transition-transform">📅</div>
            <div className="text-[11px] font-bold truncate">2. แผนระยะยาว</div>
          </button>

          <button
            onClick={() => setCurrentTab('planning')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-amber-500/10 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/70 dark:border-stone-700 text-center transition-all cursor-pointer group shadow-2xs"
          >
            <div className="text-base mb-1 group-hover:scale-110 transition-transform">📋</div>
            <div className="text-[11px] font-bold truncate">3. แผนประจำปี</div>
          </button>

          <button
            onClick={() => setCurrentTab('execution')}
            className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white border border-amber-500/30 text-center transition-all cursor-pointer group shadow-xs"
          >
            <div className="text-base mb-1 group-hover:scale-110 transition-transform">📝</div>
            <div className="text-[11px] font-bold truncate">6. กระดาษทำการ</div>
          </button>

          <button
            onClick={() => setCurrentTab('reporting')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-amber-500/10 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/70 dark:border-stone-700 text-center transition-all cursor-pointer group shadow-2xs"
          >
            <div className="text-base mb-1 group-hover:scale-110 transition-transform">📊</div>
            <div className="text-[11px] font-bold truncate">8. รายงานผลตรวจ</div>
          </button>

          <button
            onClick={() => setCurrentTab('internal-control')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-amber-500/10 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/70 dark:border-stone-700 text-center transition-all cursor-pointer group shadow-2xs"
          >
            <div className="text-base mb-1 group-hover:scale-110 transition-transform">🛡️</div>
            <div className="text-[11px] font-bold truncate">ปค. 1-6 ควบคุมภายใน</div>
          </button>

          <button
            onClick={() => setCurrentTab('central-hub')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-amber-500/10 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/70 dark:border-stone-700 text-center transition-all cursor-pointer group shadow-2xs"
          >
            <div className="text-base mb-1 group-hover:scale-110 transition-transform">📚</div>
            <div className="text-[11px] font-bold truncate">คลังเอกสารกลาง</div>
          </button>

          <button
            onClick={() => {
              if (onOpenFeedback) onOpenFeedback();
            }}
            className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-center transition-all cursor-pointer group shadow-2xs"
          >
            <div className="text-base mb-1 group-hover:scale-110 transition-transform">💡</div>
            <div className="text-[11px] font-bold truncate">เสนอแนะ ADMIN</div>
          </button>
        </div>
      </div>

      {/* CORE 4 AUDIT METRICS STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Annual Plans */}
        <div
          onClick={() => setCurrentTab('planning')}
          className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                แผนการตรวจสอบประจำปี {selectedYear}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
                {annualPlans.length}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">โครงการตามแผน</span>
              {annualPlans.length > 0 && (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full ml-auto">
                  ก้าวหน้า {avgProgress}%
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ✓ เสร็จ {completedPlans}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              ⏳ กำลังตรวจ {inProgressPlans}
            </span>
            <span className="text-stone-400">
              รอตรวจ {pendingPlans}
            </span>
          </div>
        </div>

        {/* Card 2: Risk Assessment & Audit Universe */}
        <div
          onClick={() => setCurrentTab('audit-risk')}
          className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                ประเมินความเสี่ยง SOFCK
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
                {totalUniverseCount}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">กิจกรรมใน Universe</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              🔴 เสี่ยงสูง {highRisks}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              🟡 ปานกลาง {mediumRisks}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              🟢 ต่ำ {lowRisks}
            </span>
          </div>
        </div>

        {/* Card 3: Working Papers */}
        <div
          onClick={() => setCurrentTab('execution')}
          className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                กระดาษทำการตรวจสอบ
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
                {workingPapers.length}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">เรื่องตรวจพร้อมใช้งาน</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
            <span>KTB, พัสดุ, อาหารกลางวัน</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center">
              เข้าตรวจ <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: LPA Readiness */}
        <div
          onClick={() => setCurrentTab('lpa')}
          className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                ความพร้อมรับตรวจ LPA ด้าน 1
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {totalLpaScore}/{maxLpaScore}
              </span>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full ml-auto">
                {lpaPercent}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
            <span>ตัวชี้วัด 1 - 5 (สถ.)</span>
            <span className="text-blue-700 dark:text-blue-400 font-bold flex items-center">
              ประเมินตนเอง <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* End-to-End Audit Lifecycle Stepper Navigator */}
      <AuditLifecycleStepper
        currentTab="dashboard"
        setCurrentTab={setCurrentTab}
      />

      {/* MAIN TWO-COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Audit Projects Tracker & Key Focus */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Annual Audit Plans Progress */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  สถานะการปฏิบัติงานตามแผนตรวจสอบประจำปี {selectedYear}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  ติดตามโครงการตรวจสอบทั้ง 4 ไตรมาส พร้อมปุ่มเข้าสู่กระดาษทำการ
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('planning')}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
              >
                <span>{annualPlans.length > 0 ? 'ดูแผนและพิมพ์' : '+ จัดทำแผนประจำปี'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {annualPlans.length > 0 ? (
              <div className="space-y-3">
                {annualPlans.map((plan) => {
                  const isCompleted = plan.status === 'completed';
                  const isInProgress = plan.status === 'in_progress';
                  return (
                    <div
                      key={plan.id}
                      className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-900/60 hover:bg-amber-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
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
                              style={{ width: `${plan.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 w-8 text-right font-mono">
                            {plan.progress || 0}%
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            if (setSelectedWp && workingPapers.length > 0) {
                              setSelectedWp(workingPapers[0]?.id || 'WP-KTB-01');
                            }
                            setCurrentTab('execution');
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <span>เข้าตรวจ</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 px-6 bg-stone-50/70 dark:bg-stone-850/40 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  ยังไม่มีโครงการในแผนประจำปี {selectedYear}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                  เริ่มต้นคัดเลือกกิจกรรมความเสี่ยงสูงจาก Audit Universe เพื่อจัดทำแผนการตรวจสอบประจำปีของ {orgDisplayName}
                </p>
                <button
                  onClick={() => setCurrentTab('planning')}
                  className="bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center space-x-2 cursor-pointer shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>จัดทำแผนการตรวจสอบประจำปีทันที</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Critical Audit Checkpoints for Local Government */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  จุดเฝ้าระวังและข้อทักท้วงสำคัญตามระเบียบใหม่ของ อปท.
                </h3>
              </div>
              <button
                onClick={() => setCurrentTab('central-hub')}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>คลังระเบียบ สถ.</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setCurrentTab('execution')}
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 bg-stone-50/50 dark:bg-stone-850/50 space-y-1.5 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    💳 ระบบ KTB Corporate Online & e-LAAS
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded font-bold">
                    ระเบียบ มท. 2566
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  ตรวจสอบการอนุมัติโอนเงินแบบ Dual Control, การพิมพ์หลักฐานการจ่ายเงิน และการจัดทำงบกระทบยอดเงินฝากธนาคารทุกสิ้นเดือน
                </p>
              </div>

              <div
                onClick={() => setCurrentTab('execution')}
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 bg-stone-50/50 dark:bg-stone-850/50 space-y-1.5 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    🏗️ การตรวจรับพัสดุและค่าปรับงานก่อสร้าง
                  </span>
                  <span className="text-[10px] text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded font-bold">
                    พ.ร.บ. พัสดุฯ 2560
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  ตรวจสอบสมุดจดบันทึกประจำวันของช่างควบคุมงาน, ผลทดสอบคอนกรีต, และการคิดค่าปรับร้อยละ 0.1 หรือ 0.2 ต่อวัน
                </p>
              </div>

              <div
                onClick={() => setCurrentTab('execution')}
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 bg-stone-50/50 dark:bg-stone-850/50 space-y-1.5 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    🏠 สิทธิการเบิกจ่ายค่าเช่าบ้านข้าราชการ
                  </span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded font-bold">
                    ฉบับที่ 5 พ.ศ. 2565
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  ตรวจสอบการมีเคหสถานของตนเองหรือคู่สมรส, การกู้เงินชำระราคาบ้าน และหลักฐานการหักบัญชีเงินกู้จริง
                </p>
              </div>

              <div
                onClick={() => setCurrentTab('reporting')}
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 bg-stone-50/50 dark:bg-stone-850/50 space-y-1.5 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    ⏱️ การติดตามข้อเสนอแนะรอบ 30 & 60 วัน
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-bold">
                    เกณฑ์ กค. 2561
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  ติดตามผลการปฏิบัติตามข้อเสนอแนะของผู้บริหาร และบันทึกข้อความเร่งรัดเมื่อพ้นกำหนดเวลา 60 วัน
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Org Profile, Deadlines & User Feedback Card */}
        <div className="space-y-6">
          {/* Box 1: Local Government Profile Information */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-600" />
                <span>ข้อมูลหน่วยรับตรวจ</span>
              </span>
              <button
                onClick={onOpenSettings}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>แก้ไข</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-stone-400 text-[11px] block">ชื่อหน่วยงาน อปท.</span>
                <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  {orgProfile?.name || 'ยังไม่ระบุชื่อ อปท.'}
                </span>
                <span className="text-[11px] text-stone-500 block">
                  {orgProfile?.district || 'อำเภอ...'} {orgProfile?.province || 'จังหวัด...'}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-400">ผู้ตรวจสอบ:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {orgProfile?.auditorName || 'ยังไม่ระบุชื่อ'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">ตำแหน่ง:</span>
                  <span className="text-stone-600 dark:text-stone-300">
                    {orgProfile?.auditorPosition || 'ผู้ตรวจสอบภายใน'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">นายก อปท.:</span>
                  <span className="text-stone-600 dark:text-stone-300">
                    {orgProfile?.approverName || 'ยังไม่ระบุ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Official Compliance Timelines (ปฏิทินงานตามระเบียบ) */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                กำหนดการสำคัญตามระเบียบตรวจสอบภายใน
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-300">
                    📅 ขออนุมัติแผนประจำปี
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">ภายใน ก.ย.</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  ต้องเสนอขออนุมัติต่อนายก อปท. ก่อนเริ่มปีงบประมาณใหม่
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">
                    🛡️ รายงาน ปค. 6 (สอบทาน)
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">ภายใน 60 วัน</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  ส่งรายงานการสอบทานการควบคุมภายในภายใน 60 วันหลังสิ้นปีงบ
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    📑 ติดตามข้อเสนอแนะ
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">รอบ 30/60 วัน</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  ติดตามผลการปรับปรุงของหน่วยรับตรวจตามกำหนดเวลา
                </p>
              </div>
            </div>
          </div>

          {/* Box 3: MEMBERSHIP STATUS & RENEWAL (สำหรับผู้ใช้ตรวจสอบภายใน) */}
          {session?.role !== 'admin' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-850 to-amber-950 text-white border border-amber-600/30 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>สิทธิ์การใช้งาน & การสนับสนุนระบบ</span>
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                  {session?.plan === 'annual' ? '👑 PREMIUM' : session?.plan === 'monthly' ? '⭐ VIP' : session?.plan === 'lifetime' ? '💎 LIFETIME' : '🌱 ฟรี 30 วัน'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                สนับสนุนระบบเพื่อปลดล็อกทุกกระดาษทำการ และเข้าถึงคลังเอกสารระเบียบปฏิบัติงาน อปท. ได้ตลอดเวลา
              </p>
              <button
                type="button"
                onClick={onOpenPackageModal}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-amber-950/30 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>ดูแพ็กเกจ & สนับสนุนระบบ</span>
              </button>
            </div>
          )}

          {/* Box 4: USER FEEDBACK CALLOUT (ส่งข้อเสนอแนะถึง ADMIN) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-yellow-500/10 border border-amber-500/30 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <MessageSquarePlus className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                ต้องการฟังก์ชันเพิ่มหรือพบปัญหา?
              </h3>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              เสนอความคิดเห็น แจ้งข้อผิดพลาด หรือขอเพิ่มแบบฟอร์มตรวจสอบของ อปท. ได้โดยตรงถึง ADMIN เพื่อพัฒนาในเวอร์ชันถัดไป
            </p>
            <button
              onClick={() => {
                if (onOpenFeedback) onOpenFeedback();
              }}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>💡 ส่งข้อเสนอแนะถึง ADMIN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
