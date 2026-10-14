import React, { useMemo } from 'react';
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
  ShieldAlert,
  ClipboardCheck,
  Search,
  Sparkles,
  MessageSquarePlus,
  Target,
  Shield,
  Layers,
  CreditCard,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DashboardView({
  orgProfile = {},
  selectedYear = '2569',
  annualPlans = [],
  workingPapers = [],
  lpaIndicators = [],
  riskAssessments = [],
  auditUniverse = [],
  capaFindings = [],
  setCurrentTab,
  setSelectedWp,
  onOpenSettings,
  session,
  onLogout,
  onOpenFeedback,
  onOpenPackageModal
}) {
  // 1. Compute Annual Plans stats
  const totalPlans = annualPlans.length;
  const completedPlans = annualPlans.filter((p) => p.status === 'completed' || p.progress === 100).length;
  const inProgressPlans = annualPlans.filter(
    (p) => (p.status === 'in_progress' || (p.progress > 0 && p.progress < 100)) && p.status !== 'completed'
  ).length;
  const pendingPlans = annualPlans.filter(
    (p) => (p.status === 'pending' || !p.status) && (p.progress === 0 || !p.progress)
  ).length;
  const avgProgress = totalPlans > 0
    ? Math.round(annualPlans.reduce((acc, p) => acc + (p.progress || 0), 0) / totalPlans)
    : 0;

  // 2. Compute Current Fiscal Quarter in Thailand (Oct = Q1, Jan = Q2, Apr = Q3, Jul = Q4)
  const currentFiscalQuarter = useMemo(() => {
    const month = new Date().getMonth() + 1; // 1 - 12
    if (month >= 10 && month <= 12) return 1;
    if (month >= 1 && month <= 3) return 2;
    if (month >= 4 && month <= 6) return 3;
    return 4;
  }, []);

  // 3. Compute Quarterly Distribution
  const quarterlyData = useMemo(() => {
    const quarters = [
      { q: 1, label: 'ไตรมาส 1', months: 'ต.ค. - ธ.ค.', key: 'ไตรมาส 1' },
      { q: 2, label: 'ไตรมาส 2', months: 'ม.ค. - มี.ค.', key: 'ไตรมาส 2' },
      { q: 3, label: 'ไตรมาส 3', months: 'เม.ย. - มิ.ย.', key: 'ไตรมาส 3' },
      { q: 4, label: 'ไตรมาส 4', months: 'ก.ค. - ก.ย.', key: 'ไตรมาส 4' }
    ];

    return quarters.map((item) => {
      const qPlans = annualPlans.filter((p) =>
        (p.quarter && p.quarter.includes(item.label)) ||
        (p.quarter && p.quarter.includes(`Q${item.q}`)) ||
        (p.period && p.period.includes(item.months.split(' ')[0]))
      );
      const qTotal = qPlans.length;
      const qCompleted = qPlans.filter((p) => p.status === 'completed' || p.progress === 100).length;
      const qInProgress = qPlans.filter((p) => p.status === 'in_progress' || (p.progress > 0 && p.progress < 100)).length;
      const qAvg = qTotal > 0
        ? Math.round(qPlans.reduce((sum, p) => sum + (p.progress || 0), 0) / qTotal)
        : 0;

      return {
        ...item,
        total: qTotal,
        completed: qCompleted,
        inProgress: qInProgress,
        progress: qAvg,
        isCurrent: item.q === currentFiscalQuarter
      };
    });
  }, [annualPlans, currentFiscalQuarter]);

  // 4. Compute LPA Readiness stats
  const totalLpaScore = lpaIndicators.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const maxLpaScore = lpaIndicators.reduce((acc, curr) => acc + (curr.maxScore || 0), 0) || 25;
  const lpaPercent = Math.round((totalLpaScore / maxLpaScore) * 100) || 0;

  // 5. Compute Risk Assessment & Universe stats
  const activeUniverse = auditUniverse && auditUniverse.length > 0 ? auditUniverse : riskAssessments;
  const totalUniverseCount = activeUniverse.length;
  const highRisks = activeUniverse.filter((r) => r.level === 'สูงมาก' || r.level === 'สูง').length;
  const mediumRisks = activeUniverse.filter((r) => r.level === 'ปานกลาง').length;
  const lowRisks = activeUniverse.filter((r) => r.level === 'ต่ำ').length;

  const highRiskCovered = activeUniverse.filter(
    (r) => (r.level === 'สูงมาก' || r.level === 'สูง') &&
      (r.includedInPlan || annualPlans.some((p) => p.title?.includes(r.name) || p.topic?.includes(r.name)))
  ).length;
  const highRiskCoveragePercent = highRisks > 0 ? Math.round((highRiskCovered / highRisks) * 100) : 100;

  // 6. Compute Findings & Actions Stats (CAPA)
  const findingsStats = useMemo(() => {
    const list = capaFindings && capaFindings.length > 0 ? capaFindings : [];
    const total = list.length;
    const resolved = list.filter((f) => f.status === 'completed' || f.status === 'resolved').length;
    const inProgress = list.filter((f) => f.status === 'in_progress').length;
    const overdue = list.filter((f) => f.status === 'overdue' || f.status === 'urgent').length;
    const pending = list.filter((f) => f.status === 'pending' || !f.status).length;
    const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, resolved, inProgress, overdue, pending, resolveRate };
  }, [capaFindings]);

  // 7. Auditor identity logic
  const isNonAdminUser = session?.role !== 'admin' && session?.username?.toLowerCase() !== 'admin';
  const effectiveAuditorName = isNonAdminUser
    ? (session?.displayName || (orgProfile?.auditorName && orgProfile.auditorName.toUpperCase() !== 'ADMIN' && !orgProfile.auditorName.includes('Super Admin') ? orgProfile.auditorName : 'ผู้ตรวจสอบภายใน'))
    : (orgProfile?.auditorName || session?.displayName || 'ผู้ดูแลระบบส่วนกลาง (Super Admin)');
  const effectiveAuditorPosition = isNonAdminUser
    ? (session?.position || (orgProfile?.auditorPosition && !orgProfile.auditorPosition.includes('Platform Root') && !orgProfile.auditorPosition.includes('ผู้ดูแลระบบ') ? orgProfile.auditorPosition : 'นักวิชาการตรวจสอบภายในปฏิบัติการ'))
    : (orgProfile?.auditorPosition || session?.position || 'ผู้ดูแลระบบระบบตรวจสอบภายใน (Platform Root)');

  const orgDisplayName = orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น';

  // 8. Lifecycle Stages Execution Tracker
  const stage1Complete = totalPlans > 0;
  const stage1Progress = stage1Complete ? 100 : (totalUniverseCount > 0 ? 60 : 20);
  const stage2Progress = avgProgress;
  const stage3Progress = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  // 9. Donut Chart Geometry Math
  const circumference = 2 * Math.PI * 65; // ~408.4
  const cPercent = totalPlans > 0 ? (completedPlans / totalPlans) : 0;
  const ipPercent = totalPlans > 0 ? (inProgressPlans / totalPlans) : 0;
  const pPercent = totalPlans > 0 ? (pendingPlans / totalPlans) : (totalPlans === 0 ? 1 : 0);

  const strokeDashCompleted = `${cPercent * circumference} ${circumference}`;
  const strokeDashInProgress = `${ipPercent * circumference} ${circumference}`;
  const strokeOffsetInProgress = -(cPercent * circumference);
  const strokeDashPending = `${pPercent * circumference} ${circumference}`;
  const strokeOffsetPending = -((cPercent + ipPercent) * circumference);

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

      {/* Page Header Banner (Strictly no buttons inside - UI Guardrails compliant) */}
      <PageHeaderBanner
        title={`แดชบอร์ดสรุปผลการปฏิบัติงานตรวจสอบภายใน (Audit Cockpit)`}
        orgName={orgDisplayName}
        auditorName={`ผู้ตรวจสอบ: ${effectiveAuditorName} (${effectiveAuditorPosition})`}
        year={selectedYear}
        badges={[
          'สรุปผลการปฏิบัติงานรอบปี',
          `ไตรมาสปัจจุบัน: ไตรมาส ${currentFiscalQuarter}`,
          'ศูนย์ควบคุม & ติดตามความก้าวหน้า'
        ]}
      />

      {/* ANNUAL AUDIT HEALTH & STATUS SUB-BAR */}
      <div className="bg-white dark:bg-stone-900 px-5 py-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <span>สถานะภาพรวมการตรวจสอบ ประจำปีงบประมาณ พ.ศ. {selectedYear}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                avgProgress >= 80
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : avgProgress > 0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
              }`}>
                {avgProgress >= 80 ? '● เป็นไปตามเป้าหมาย' : avgProgress > 0 ? '● อยู่ระหว่างการตรวจสอบ' : '● เริ่มต้นปีงบประมาณ'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              ความก้าวหน้าเฉลี่ยทั้งระบบอยู่ที่ <span className="font-bold text-amber-700 dark:text-amber-400">{avgProgress}%</span> จากทั้งหมด {totalPlans} โครงการตามแผน
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setCurrentTab('planning')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>ดูแผนประจำปี</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (setSelectedWp && workingPapers.length > 0) {
                setSelectedWp(workingPapers[0]?.id || 'WP-KTB-01');
              }
              setCurrentTab('execution');
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>เข้ากระดาษทำการ</span>
          </button>
        </div>
      </div>

      {/* VISUAL CHARTS & ANALYTICS SECTION (นำกราฟและสัดส่วนขึ้นมาอยู่ด้านบนของกรอบแผนการตรวจ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Quarterly Audit Progress Bar Chart (Col span 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  ความคืบหน้าการตรวจสอบรายไตรมาส (Quarterly Audit Progress)
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  เปรียบเทียบผลงานการเข้าตรวจจริงเทียบกับแผนทั้ง 4 ไตรมาส
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="flex items-center gap-1 font-medium text-stone-600 dark:text-stone-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-600"></span> ก้าวหน้า %
              </span>
              <span className="flex items-center gap-1 font-medium text-stone-600 dark:text-stone-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-stone-200 dark:bg-stone-700"></span> เป้าหมาย
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="pt-2">
            <div className="h-56 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="barGradCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="barGradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#e5e7eb" strokeDasharray="3 3" opacity="0.6" />
                <text x="32" y="24" fill="#9ca3af" fontSize="10" textAnchor="end">100%</text>

                <line x1="40" y1="80" x2="480" y2="80" stroke="#e5e7eb" strokeDasharray="3 3" opacity="0.6" />
                <text x="32" y="84" fill="#9ca3af" fontSize="10" textAnchor="end">50%</text>

                <line x1="40" y1="140" x2="480" y2="140" stroke="#e5e7eb" strokeDasharray="3 3" opacity="0.6" />
                <text x="32" y="144" fill="#9ca3af" fontSize="10" textAnchor="end">0%</text>

                {/* 4 Quarterly Bars */}
                {quarterlyData.map((qd, idx) => {
                  const x = 70 + idx * 105;
                  const barWidth = 48;
                  const maxHeight = 120; // 20 to 140
                  const barHeight = Math.max(8, (qd.progress / 100) * maxHeight);
                  const barY = 140 - barHeight;
                  const isFinished = qd.progress === 100;

                  return (
                    <g key={qd.q} className="transition-all duration-500">
                      {/* Background Placeholder Bar */}
                      <rect
                        x={x}
                        y="20"
                        width={barWidth}
                        height={maxHeight}
                        rx="6"
                        fill="currentColor"
                        className="text-stone-100 dark:text-stone-800"
                        opacity="0.8"
                      />

                      {/* Actual Progress Bar */}
                      <rect
                        x={x}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        rx="6"
                        fill={isFinished ? 'url(#barGradCompleted)' : (qd.isCurrent ? 'url(#barGradCurrent)' : '#d97706')}
                        opacity={qd.progress > 0 ? '1' : '0.2'}
                      />

                      {/* Percentage Badge on top */}
                      <text
                        x={x + barWidth / 2}
                        y={barY - 6}
                        fill={qd.progress > 0 ? '#b45309' : '#9ca3af'}
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {qd.progress}%
                      </text>

                      {/* Quarter Label */}
                      <text
                        x={x + barWidth / 2}
                        y="160"
                        fill="currentColor"
                        className="text-stone-800 dark:text-stone-200"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {qd.label}
                      </text>

                      {/* Month range and projects count */}
                      <text
                        x={x + barWidth / 2}
                        y="176"
                        fill="#9ca3af"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {qd.months}
                      </text>

                      {/* Current Quarter Marker */}
                      {qd.isCurrent && (
                        <text
                          x={x + barWidth / 2}
                          y="192"
                          fill="#d97706"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          ● ไตรมาสปัจจุบัน
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Quarterly Summary Footer */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-stone-100 dark:border-stone-800 text-center text-xs">
              {quarterlyData.map((qd) => (
                <div key={qd.q} className={`p-2 rounded-xl ${qd.isCurrent ? 'bg-amber-500/10 dark:bg-amber-500/20' : 'bg-stone-50 dark:bg-stone-850'}`}>
                  <div className="font-bold text-stone-700 dark:text-stone-300">
                    {qd.total} โครงการ
                  </div>
                  <div className="text-[10px] text-stone-500">
                    เสร็จ {qd.completed} / กำลังตรวจ {qd.inProgress}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Status Donut & Risk Coverage (Col span 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  สัดส่วนสถานะโครงการตรวจสอบ
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  โครงสร้างความคืบหน้าของโครงการทั้งหมด
                </p>
              </div>
            </div>

            {/* Donut Chart & Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-4">
              {/* SVG Donut */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r="65"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="transparent"
                    className="text-stone-100 dark:text-stone-800"
                  />

                  {/* Completed Arc (Emerald) */}
                  {completedPlans > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      stroke="#10b981"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={strokeDashCompleted}
                      strokeDashoffset="0"
                      className="transition-all duration-700"
                    />
                  )}

                  {/* In Progress Arc (Amber) */}
                  {inProgressPlans > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      stroke="#f59e0b"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={strokeDashInProgress}
                      strokeDashoffset={strokeOffsetInProgress}
                      className="transition-all duration-700"
                    />
                  )}

                  {/* Pending Arc (Stone/Slate) */}
                  {pendingPlans > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      stroke="#9ca3af"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={strokeDashPending}
                      strokeDashoffset={strokeOffsetPending}
                      className="transition-all duration-700"
                    />
                  )}
                </svg>

                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-stone-900 dark:text-stone-100">
                    {avgProgress}%
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                    ความสำเร็จเฉลี่ย
                  </span>
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-2 text-xs w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start space-x-3 p-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-stone-700 dark:text-stone-300">ตรวจเสร็จแล้ว:</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {completedPlans} ({totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-start space-x-3 p-1.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="font-bold text-stone-700 dark:text-stone-300">กำลังตรวจ:</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {inProgressPlans} ({totalPlans > 0 ? Math.round((inProgressPlans / totalPlans) * 100) : 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-start space-x-3 p-1.5 rounded-lg bg-stone-50 dark:bg-stone-850">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-400"></span>
                    <span className="font-bold text-stone-700 dark:text-stone-300">รอเข้าตรวจ:</span>
                  </div>
                  <span className="font-mono font-bold text-stone-600 dark:text-stone-400">
                    {pendingPlans} ({totalPlans > 0 ? Math.round((pendingPlans / totalPlans) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Profile & Plan Coverage Progress */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>การครอบคลุมจุดเสี่ยงสูงในแผน (Risk Coverage)</span>
              </span>
              <span className="font-mono font-bold text-rose-600">
                {highRiskCovered}/{highRisks} เรื่อง ({highRiskCoveragePercent}%)
              </span>
            </div>
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${highRiskCoveragePercent}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-500">
              {highRiskCoveragePercent === 100
                ? '✓ ครอบคลุมกิจกรรมความเสี่ยงสูงครบถ้วน 100% ตามหลักเกณฑ์กระทรวงการคลัง'
                : `ยังมีกิจกรรมความเสี่ยงสูงอีก ${highRisks - highRiskCovered} กิจกรรมที่ยังไม่ได้บรรจุในแผน`}
            </p>
          </div>
        </div>
      </div>

      {/* CORE 4 AUDIT EXECUTIVE SUMMARY METRICS (กรอบแผนการตรวจ และตัวชี้วัดสำคัญ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Annual Plans Execution */}
        <div
          onClick={() => setCurrentTab('planning')}
          className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                แผนตรวจสอบประจำปี {selectedYear}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
                  {totalPlans}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">โครงการ</span>
              </div>
              <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                ก้าวหน้า {avgProgress}%
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${avgProgress}%` }}
              />
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

        {/* Metric 2: Audit Findings & CAPA Actions */}
        <div
          onClick={() => setCurrentTab('follow-up')}
          className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                ข้อตรวจพบ & การปรับปรุง (CAPA)
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
                  {findingsStats.total}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">ข้อตรวจพบ</span>
              </div>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                findingsStats.resolveRate >= 80
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              }`}>
                แก้ไขแล้ว {findingsStats.resolveRate}%
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${findingsStats.resolveRate}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ✓ แก้แล้ว {findingsStats.resolved}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              ⏳ กำลังแก้ {findingsStats.inProgress}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {findingsStats.overdue > 0 ? `⚠️ เกินกำหนด ${findingsStats.overdue}` : `รอแก้ ${findingsStats.pending}`}
            </span>
          </div>
        </div>

        {/* Metric 3: Risk Universe & Coverage */}
        <div
          onClick={() => setCurrentTab('audit-risk')}
          className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                ประเมินความเสี่ยง & Universe
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
                  {totalUniverseCount}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">กิจกรรมใน Universe</span>
              </div>
              <span className="text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full">
                เสี่ยงสูง {highRisks}
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${highRiskCoveragePercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              🔴 สูง {highRisks}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              🟡 กลาง {mediumRisks}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              🟢 ต่ำ {lowRisks}
            </span>
          </div>
        </div>

        {/* Metric 4: LPA Readiness & Internal Control */}
        <div
          onClick={() => setCurrentTab('lpa')}
          className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                ความพร้อมรับตรวจ LPA ด้าน 1
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {totalLpaScore}/{maxLpaScore}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">คะแนนประเมิน</span>
              </div>
              <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
                {lpaPercent}%
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${lpaPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
            <span>เกณฑ์ สถ. ตัวชี้วัด 1 - 5</span>
            <span className="text-blue-700 dark:text-blue-400 font-bold flex items-center">
              ประเมินตนเอง <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* STREAMLINED AUDIT LIFECYCLE PROGRESS TRACKER (แสดงความก้าวหน้ากระบวนการตรวจสอบ 3 ระยะจริง) */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                เส้นทางความคืบหน้ากระบวนการตรวจสอบรอบปี (Annual Audit Lifecycle Progress)
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                ติดตามขั้นตอนการดำเนินงานตั้งแต่การวางแผน การลงพื้นที่ จนถึงการรายงานและติดตามผล
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg">
            ปีงบประมาณ พ.ศ. {selectedYear}
          </span>
        </div>

        {/* 3 Step Connected Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Phase 1: Planning */}
          <div
            onClick={() => setCurrentTab('planning')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
              stage1Complete
                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 hover:border-amber-500'
                : 'bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                ระยะที่ 1: การวางแผน
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                stage1Complete ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-stone-200 text-stone-700'
              }`}>
                {stage1Complete ? '✓ อนุมัติแผนแล้ว' : 'อยู่ระหว่างจัดทำ'}
              </span>
            </div>
            <div className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-2">
              ประเมินความเสี่ยง & จัดทำแผนประจำปี
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
              กฎบัตร, Universe {totalUniverseCount} กิจกรรม, และแผนตรวจสอบ {totalPlans} โครงการ
            </p>
            <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stage1Progress}%` }}
              />
            </div>
          </div>

          {/* Phase 2: Fieldwork Execution */}
          <div
            onClick={() => setCurrentTab('execution')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
              inProgressPlans > 0 || completedPlans > 0
                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 hover:border-amber-500'
                : 'bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                ระยะที่ 2: การลงพื้นที่ตรวจ
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                avgProgress >= 50
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                  : avgProgress > 0
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                  : 'bg-stone-200 text-stone-700'
              }`}>
                {avgProgress > 0 ? `กำลังตรวจ (${avgProgress}%)` : 'รอดำเนินการ'}
              </span>
            </div>
            <div className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-2">
              เปิดตรวจ, บันทึกกระดาษทำการ & ปิดตรวจ
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
              ตรวจแล้ว {completedPlans} โครงการ, กำลังตรวจ {inProgressPlans} โครงการ จากทั้งหมด {totalPlans} โครงการ
            </p>
            <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stage2Progress}%` }}
              />
            </div>
          </div>

          {/* Phase 3: Reporting & Follow-up */}
          <div
            onClick={() => setCurrentTab('reporting')}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
              completedPlans > 0
                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 hover:border-amber-500'
                : 'bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                ระยะที่ 3: รายงาน & ติดตาม
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                completedPlans > 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                  : 'bg-stone-200 text-stone-700'
              }`}>
                {completedPlans > 0 ? `เสร็จ ${completedPlans} รายงาน` : 'รอดำเนินการ'}
              </span>
            </div>
            <div className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-2">
              รายงานผลเสนอนายก & ติดตาม 30/60 วัน
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
              สรุปข้อตรวจพบ {findingsStats.total} รายการ, แก้ไขเสร็จสิ้น {findingsStats.resolved} รายการ
            </p>
            <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stage3Progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED PROJECT EXECUTION TABLE & CRITICAL ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Audit Projects Tracker (ตารางสรุปสถานะโครงการตามแผน) */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <span>สถานะการปฏิบัติงานรายโครงการตามแผนตรวจสอบประจำปี</span>
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                สรุปความก้าวหน้าโครงการ และปุ่มทางลัดเข้าสู่กระดาษทำการของแต่ละเรื่อง
              </p>
            </div>

            <button
              onClick={() => setCurrentTab('planning')}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>{totalPlans > 0 ? 'ดูแผนและพิมพ์' : '+ จัดทำแผนประจำปี'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {totalPlans > 0 ? (
            <div className="space-y-2.5">
              {annualPlans.map((plan) => {
                const isCompleted = plan.status === 'completed' || plan.progress === 100;
                const isInProgress = plan.status === 'in_progress' || (plan.progress > 0 && plan.progress < 100);

                return (
                  <div
                    key={plan.id}
                    className="p-3.5 rounded-xl border border-stone-200/70 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                          {plan.id}
                        </span>
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
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
                          เสี่ยง{plan.riskLevel || 'ปานกลาง'}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {plan.quarter}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {plan.title}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isInProgress
                                ? 'bg-amber-500'
                                : 'bg-stone-300 dark:bg-stone-700'
                            }`}
                            style={{ width: `${plan.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 w-8 text-right">
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
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all flex items-center space-x-1 cursor-pointer shrink-0"
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
            <div className="text-center py-8 px-6 bg-stone-50/70 dark:bg-stone-850/40 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-200">
                ยังไม่มีโครงการในแผนการตรวจสอบประจำปี {selectedYear}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                เริ่มต้นคัดเลือกกิจกรรมความเสี่ยงสูงจาก Universe เพื่อจัดทำแผนการตรวจสอบของ {orgDisplayName}
              </p>
              <button
                onClick={() => setCurrentTab('planning')}
                className="bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center space-x-2 cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>จัดทำแผนการตรวจสอบประจำปีทันที</span>
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Column: Key Deadlines & Org Profile Summary */}
        <div className="space-y-6">
          {/* Box 1: Compliance Timelines (ปฏิทินงานตามระเบียบ อปท.) */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>กำหนดการสำคัญตามระเบียบ</span>
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded font-bold">
                มท. & กค.
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700/60 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200 text-[11px]">
                    📅 ขออนุมัติแผนประจำปี
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">ก่อน 1 ต.ค.</span>
                </div>
                <p className="text-[10px] text-stone-500">
                  เสนอขออนุมัติต่อนายก อปท. ก่อนเริ่มปีงบประมาณ
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700/60 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                    🛡️ รายงาน ปค. 6 (สอบทาน)
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">ภายใน 60 วัน</span>
                </div>
                <p className="text-[10px] text-stone-500">
                  ส่งรายงานสอบทานการควบคุมภายในหลังสิ้นปีงบ
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700/60 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800 dark:text-blue-300 text-[11px]">
                    📑 ติดตามข้อเสนอแนะ
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">รอบ 30/60 วัน</span>
                </div>
                <p className="text-[10px] text-stone-500">
                  ติดตามผลการปรับปรุงของหน่วยรับตรวจตามกำหนด
                </p>
              </div>
            </div>
          </div>

          {/* Box 2: Org Profile Summary */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
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

            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                {orgDisplayName}
              </div>
              <div className="text-[11px] text-stone-500">
                {orgProfile?.district || 'อำเภอ...'} {orgProfile?.province || 'จังหวัด...'}
              </div>
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-between text-[11px]">
                <span className="text-stone-400">ผู้ตรวจสอบ:</span>
                <span className="font-bold text-stone-700 dark:text-stone-300 truncate max-w-[150px]">
                  {effectiveAuditorName}
                </span>
              </div>
            </div>
          </div>

          {/* Box 3: Support & Feedback */}
          {session?.role !== 'admin' && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-850 to-amber-950 text-white border border-amber-600/30 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>สนับสนุนระบบ Audit-OS</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                  {session?.plan === 'annual' ? '👑 PREMIUM' : session?.plan === 'lifetime' ? '💎 LIFETIME' : '⭐ สมาชิก'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                ร่วมสนับสนุนเพื่อการพัฒนาฟังก์ชันตรวจสอบของ อปท. อย่างต่อเนื่อง
              </p>
              <button
                type="button"
                onClick={onOpenPackageModal}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-black py-2 px-3 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>ดูแพ็กเกจ & สนับสนุนระบบ</span>
              </button>
            </div>
          )}

          {/* Box 4: Send Feedback to Admin */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/50 dark:border-amber-800/40 space-y-2">
            <div className="flex items-center space-x-2">
              <MessageSquarePlus className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                เสนอแนะหรือขอฟังก์ชันเพิ่ม
              </h4>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              แจ้งข้อผิดพลาดหรือเสนอแนะแบบฟอร์มตรวจสอบของ อปท. ได้โดยตรงถึง ADMIN
            </p>
            <button
              onClick={() => {
                if (onOpenFeedback) onOpenFeedback();
              }}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>💡 ส่งข้อเสนอแนะถึง ADMIN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
