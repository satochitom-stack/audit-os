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
  Award,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const AUDIT_LIFECYCLE_PHASES = [
  {
    phaseId: 1,
    phaseName: 'ระยะที่ 1: การวางแผนการตรวจสอบ (Audit Planning Phase)',
    shortName: '1. การวางแผน',
    desc: 'สำรวจข้อมูลเบื้องต้น ประเมินความเสี่ยง จัดทำแผนระยะยาว แผนประจำปี และแผนปฏิบัติงานรายกิจกรรม',
    color: 'amber',
    steps: [
      {
        id: 'audit-risk',
        stepNum: 1,
        title: 'ประเมินความเสี่ยง SOFCK & Universe',
        subtitle: 'วิเคราะห์เกณฑ์ 5 ด้าน และผังจักรวาลการตรวจสอบ',
        icon: ShieldAlert,
        deliverables: ['ผังจักรวาลการตรวจสอบ (Audit Universe)', 'ตารางวิเคราะห์ความเสี่ยง 5 มิติ (SOFCK)', 'เกณฑ์จัดลำดับความสำคัญของความเสี่ยง'],
        regulations: 'หลักเกณฑ์กระทรวงการคลังฯ พ.ศ. 2561-2566 ข้อ 16 / คู่มือ สป.กค. ก.ย. 2568 หน้า 35-48'
      },
      {
        id: 'strategic-plan',
        stepNum: 2,
        title: 'แผนระยะยาว 3 ปี & การคำนวณคน-วัน',
        subtitle: 'คำนวณวันทำการตรวจสอบ และแผนหมุนเวียน 3 ปี',
        icon: Calendar,
        deliverables: ['ตารางคำนวณวันทำการของผู้ตรวจสอบ (คน-วัน / Person-Days)', 'กรอบแผนการตรวจสอบระยะยาว 3 ปี', 'การกระจายภารกิจตามรอบความเสี่ยง'],
        regulations: 'ระเบียบ มท. 2545 ข้อ 14 / หลักเกณฑ์ กค. ข้อ 17'
      },
      {
        id: 'planning',
        stepNum: 3,
        title: 'แผนการตรวจสอบประจำปี & กฎบัตร',
        subtitle: 'จัดทำแผนประจำปี บันทึกเสนอนายก และกฎบัตรตรวจสอบ',
        icon: FileText,
        deliverables: ['กฎบัตรการตรวจสอบภายใน (Audit Charter)', 'ร่างแผนการตรวจสอบประจำปี (Annual Audit Plan)', 'บันทึกข้อความขออนุมัติแผนเสนอนายก อปท. (ภายใน ก.ย.)'],
        regulations: 'ระเบียบ มท. 2545 ข้อ 15 / หลักเกณฑ์ กค. ข้อ 18 (ต้องอนุมัติก่อนเริ่มปีงบประมาณ)'
      },
      {
        id: 'engagement-plan',
        stepNum: 4,
        title: 'แผนปฏิบัติการรายภารกิจ & แนวตรวจ ว 614',
        subtitle: 'แผนปฏิบัติงานรายกิจกรรมและแนวการตรวจมาตรฐาน',
        icon: Sparkles,
        deliverables: ['แผนปฏิบัติงานรายภารกิจ (Engagement Plan)', 'แนวการตรวจสอบตามหนังสือ ว 614', 'แบบสำรวจข้อมูลเบื้องต้นและขอบเขตการตรวจ'],
        regulations: 'หลักเกณฑ์ กค. ข้อ 20 / หนังสือสั่งการกระทรวงมหาดไทย ว 614'
      }
    ]
  },
  {
    phaseId: 2,
    phaseName: 'ระยะที่ 2: การลงพื้นที่ปฏิบัติงานตรวจสอบ (Audit Execution Phase)',
    shortName: '2. ลงพื้นที่ตรวจ',
    desc: 'ประชุมเปิดตรวจ ดำเนินการตรวจสอบตามกระดาษทำการ รวบรวมหลักฐาน สรุปข้อตรวจพบ และประชุมปิดตรวจ',
    color: 'stone',
    steps: [
      {
        id: 'opening-meeting',
        stepNum: 5,
        title: 'การประชุมเปิดการตรวจสอบ (Opening Meeting)',
        subtitle: 'หนังสือแจ้งล่วงหน้า และบันทึกรายงานเปิดตรวจ',
        icon: Users,
        deliverables: ['หนังสือแจ้งการเข้าตรวจสอบล่วงหน้า (อย่างน้อย 7 วันทำการ)', 'วาระการประชุมเปิดตรวจและรายชื่อผู้เข้าร่วม', 'บันทึกรายงานการประชุมเปิดตรวจ'],
        regulations: 'คู่มือการปฏิบัติงาน สป.กค. ก.ย. 2568 หน้า 55-62 / ว 614'
      },
      {
        id: 'execution',
        stepNum: 6,
        title: 'กระดาษทำการ 6 ภารกิจ & งานช่าง',
        subtitle: 'บันทึกหลักฐานการตรวจ รับเงิน บัญชี พัสดุ สัญญา รถ ช่าง',
        icon: ClipboardCheck,
        deliverables: ['กระดาษทำการตรวจสอบ (Working Papers: WP)', 'การสุ่มตัวอย่างเอกสารหลักฐาน (Sampling & Audit Test)', 'เอกสารประกอบและหลักฐานเชิงประจักษ์'],
        regulations: 'หลักเกณฑ์ กค. ข้อ 22 / คู่มือ สป.กค. ก.ย. 2568 หน้า 63-95'
      },
      {
        id: 'closing-meeting',
        stepNum: 7,
        title: 'การประชุมปิดการตรวจสอบ (Closing Meeting)',
        subtitle: 'สรุปข้อตรวจพบเบื้องต้น และบันทึกรับทราบผล',
        icon: CheckCircle2,
        deliverables: ['ใบรับทราบข้อตรวจพบและข้อเสนอแนะเบื้องต้น', 'บันทึกรายงานการประชุมปิดตรวจร่วมกับหน่วยรับตรวจ', 'ข้อตกลงแนวทางแก้ไขและผู้รับผิดชอบ'],
        regulations: 'หลักเกณฑ์ กค. ข้อ 23 / คู่มือ สป.กค. ก.ย. 2568 หน้า 96-105'
      }
    ]
  },
  {
    phaseId: 3,
    phaseName: 'ระยะที่ 3: รายงานผล ติดตามผล & การกำกับดูแล (Reporting & Follow-up Phase)',
    shortName: '3. รายงาน & กำกับ',
    desc: 'รายงานผล 5 องค์ประกอบ ติดตามผล 30/60 วัน และกลไกคณะกรรมการตรวจสอบตามคู่มือ ส.ค. 2568',
    color: 'emerald',
    steps: [
      {
        id: 'reporting',
        stepNum: 8,
        title: 'รายงานผลการตรวจสอบ & เสนอผู้บริหาร',
        subtitle: 'รายงาน 5 องค์ประกอบ บันทึกเสนอนายก และรายงานประจำปี',
        icon: FileSpreadsheet,
        deliverables: ['รายงานผลการตรวจสอบภายในฉบับสมบูรณ์ (5 องค์ประกอบ)', 'บันทึกรายงานเสนอนายก อปท. (ภายใน 2 เดือน)', 'รายงานผลการตรวจสอบประจำปี (Annual Audit Report)'],
        regulations: 'ระเบียบ มท. 2545 ข้อ 20 / หลักเกณฑ์ กค. ข้อ 24-27'
      },
      {
        id: 'tracking-register',
        stepNum: 9,
        title: 'ทะเบียนคุม & ติดตามผล 30/60 วัน (Follow-up)',
        subtitle: 'ทะเบียนคุมข้อเสนอแนะ และหนังสือแจ้งเตือนกำหนดเวลา',
        icon: Clock,
        deliverables: ['ทะเบียนคุมการปฏิบัติตามข้อเสนอแนะ (Follow-up Register)', 'ระบบนับถอยหลังกำหนดเวลา (30 วัน มท. / 60 วัน กค.)', 'บันทึกข้อความติดตามผลเมื่อครบกำหนด'],
        regulations: 'ระเบียบ มท. 2545 ข้อ 21 (30 วัน) / หลักเกณฑ์ กค. (60 วัน)'
      },
      {
        id: 'audit-committee',
        stepNum: 10,
        title: 'คณะกรรมการตรวจสอบ & การประกันคุณภาพ QAIP',
        subtitle: 'ปฏิทิน 4 ไตรมาส ประเมินตนเอง 11 ด้าน และประกันคุณภาพ',
        icon: Award,
        deliverables: ['กฎบัตรคณะกรรมการตรวจสอบ (Audit Committee Charter)', 'ปฏิทินและบันทึกการประชุม 4 ไตรมาส (Checklist 40 ข้อ)', 'แบบประเมินตนเอง 11 ด้าน (คู่มือ ส.ค. 2568) & QAIP'],
        regulations: 'คู่มือคณะกรรมการตรวจสอบสำหรับหน่วยงานของรัฐ (กรมบัญชีกลาง ส.ค. 2568)'
      }
    ]
  }
];

export default function AuditLifecycleStepper({
  currentTab = 'welcome',
  setCurrentTab,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Flatten all steps for easy index lookup
  const allSteps = AUDIT_LIFECYCLE_PHASES.flatMap((p) => p.steps);
  const currentStep = allSteps.find((s) => s.id === currentTab);
  const currentStepNum = currentStep ? currentStep.stepNum : 0;

  return (
    <div
      className={`bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-5 sm:p-6 border border-amber-500/20 dark:border-stone-800 shadow-xs backdrop-blur-xs transition-all print:hidden ${className}`}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/15 dark:border-stone-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-600/15 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold text-base shrink-0 border border-amber-500/30 shadow-2xs">
            🔄
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 tracking-tight">
                แผนผังกระบวนการตรวจสอบครบวงจร (Audit Lifecycle Stepper)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                10 ขั้นตอนมาตรฐาน (กค. & มท.)
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              นำทางผู้ปฏิบัติงานตั้งแต่ขั้นตอนแรก (ประเมินความเสี่ยง) จนถึงขั้นตอนสุดท้าย (รายงาน ติดตามผล และคณะกรรมการตรวจสอบ)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-amber-900 dark:text-amber-200 bg-white/70 hover:bg-white dark:bg-stone-800/80 dark:hover:bg-stone-750 px-3 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-700 shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-all"
          >
            <span>{isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียดทุกขั้นตอน'}</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3 Phases Segment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
        {AUDIT_LIFECYCLE_PHASES.map((phase) => {
          const isPhaseActive = phase.steps.some((s) => s.id === currentTab);
          const completedCount = phase.steps.filter((s) => s.stepNum < currentStepNum).length;

          return (
            <div
              key={phase.phaseId}
              className={`rounded-2xl p-3.5 transition-all border ${
                isPhaseActive
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400/80 dark:border-amber-700/80 shadow-xs'
                  : 'bg-white/60 dark:bg-stone-900/40 border-stone-200/70 dark:border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  {phase.shortName}
                </span>
                {isPhaseActive && (
                  <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white animate-pulse">
                    <span>กำลังทำงาน</span>
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 line-clamp-1 mb-1">
                {phase.phaseName}
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug line-clamp-2 mb-2.5">
                {phase.desc}
              </p>

              {/* Step pills */}
              <div className="flex flex-wrap gap-1.5">
                {phase.steps.map((st) => {
                  const isCurrent = currentTab === st.id;
                  const Icon = st.icon;

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setCurrentTab && setCurrentTab(st.id)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-stone-900 text-amber-200 shadow-xs border border-amber-400/60 scale-102'
                          : 'bg-white/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-amber-100/70 hover:text-amber-900 dark:hover:bg-amber-950/60 border border-stone-200/70 dark:border-stone-700'
                      }`}
                      title={`${st.stepNum}. ${st.title} (คลิกเพื่อเปิด)`}
                    >
                      <Icon className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{st.stepNum}. {st.title.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded view: full step-by-step deliverable cards */}
      {isExpanded && (
        <div className="mt-5 pt-4 border-t border-amber-500/15 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>คู่มือแนวทางปฏิบัติและผลงานที่ต้องจัดทำในแต่ละขั้นตอน (Deliverables Checklist)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allSteps.map((step) => {
              const Icon = step.icon;
              const isCurrent = currentTab === step.id;

              return (
                <div
                  key={step.id}
                  className={`rounded-2xl p-4 transition-all border flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-500/60 shadow-sm'
                      : 'bg-white/70 dark:bg-stone-850/60 border-stone-200/70 dark:border-stone-800 hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                        {step.stepNum}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                          เปิดอยู่
                        </span>
                      )}
                    </div>

                    <div className="flex items-start space-x-2">
                      <Icon className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                          {step.title}
                        </h5>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                      <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                        ผลงาน / เอกสารที่ต้องจัดทำ:
                      </div>
                      <ul className="space-y-1">
                        {step.deliverables.map((d, dIdx) => (
                          <li key={dIdx} className="text-[11px] text-stone-600 dark:text-stone-300 flex items-start space-x-1.5">
                            <span className="text-amber-600 shrink-0">•</span>
                            <span className="leading-tight">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 truncate max-w-[170px]" title={step.regulations}>
                      📜 {step.regulations.split('/')[0]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentTab && setCurrentTab(step.id)}
                      className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:text-amber-900 flex items-center space-x-1 cursor-pointer hover:underline"
                    >
                      <span>ไปที่หน้านี้</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
