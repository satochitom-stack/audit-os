import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Download,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  Clock,
  ExternalLink,
  Layers,
  ChevronRight,
  Eye,
  Check,
  Printer
} from 'lucide-react';
import {
  DLA_RISK_CRITERIA_SOFCK,
  DLA_RISK_ASSESSMENT_16,
  DLA_RISK_SCALE,
  DLA_STRATEGIC_PLAN_3YEARS,
  DLA_ANNUAL_AUDIT_PLAN_DATA,
  DLA_CORE_WORKFLOWS_6,
  DLA_OPENING_MEETING_DATA,
  DLA_CLOSING_MEETING_DATA,
  DLA_FOLLOWUP_REGISTER_6,
  DLA_FOLLOWUP_MEMO_TEMPLATE,
  DLA_LEGAL_REFERENCES_LIST
} from '../data/dlaStandardTemplates';

export default function DlaTemplateModal({
  isOpen,
  onClose,
  onApplyRiskUniverse,
  onApplyStrategicPlan,
  onApplyAnnualPlan,
  onApplyEngagementPlans,
  onApplyWorkingPapers,
  onApplyFollowUp,
  onNavigateTab
}) {
  const [activeCategory, setActiveCategory] = useState('risk'); // 'risk', 'strategic', 'annual', 'engagement', 'wp', 'report', 'meeting', 'followup'
  const [selectedWorkflowIndex, setSelectedWorkflowIndex] = useState(0);
  const [appliedToast, setAppliedToast] = useState(null);

  if (!isOpen) return null;

  const showToast = (msg) => {
    setAppliedToast(msg);
    setTimeout(() => setAppliedToast(null), 3000);
  };

  const currentWorkflow = DLA_CORE_WORKFLOWS_6[selectedWorkflowIndex] || DLA_CORE_WORKFLOWS_6[0];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200/80 dark:border-stone-800 bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold text-lg shrink-0 border border-amber-500/30 shadow-2xs">
              🏛️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                  คลังเทมเพลตตัวอย่างตามคู่มือ กรมส่งเสริมการปกครองท้องถิ่น (สถ.)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 dark:bg-amber-900/60 dark:text-amber-200">
                  กองตรวจสอบระบบการเงินบัญชีท้องถิ่น
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                รวบรวมตัวอย่างจริงครบทั้ง 63 หน้า เพื่อให้ผู้ตรวจสอบภายใน อปท. นำไปใช้งาน ปรับแต่ง และพิมพ์ออกเป็นเอกสารราชการได้ทันที
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-stone-200/70 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Category Tabs & Right Content Panel */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Categories Sidebar */}
          <div className="w-full md:w-64 border-r border-stone-200/80 dark:border-stone-800 bg-[#faf9f6] dark:bg-stone-950/40 p-3 space-y-1 shrink-0 overflow-y-auto">
            <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 px-2 tracking-wider uppercase mb-1">
              หมวดหมู่เอกสารตัวอย่าง
            </div>

            <button
              onClick={() => setActiveCategory('risk')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                activeCategory === 'risk'
                  ? 'bg-stone-900 text-amber-200 shadow-xs border-l-4 border-amber-500'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>1. เกณฑ์ SOFCK & 16 กิจกรรม (น. 8-11)</span>
            </button>

            <button
              onClick={() => setActiveCategory('strategic')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                activeCategory === 'strategic'
                  ? 'bg-stone-900 text-amber-200 shadow-xs border-l-4 border-amber-500'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>2. แผนระยะยาว 3 ปี & คน-วัน (น. 12-14)</span>
            </button>

            <button
              onClick={() => setActiveCategory('annual')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                activeCategory === 'annual'
                  ? 'bg-stone-900 text-amber-200 shadow-xs border-l-4 border-amber-500'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>3. แผนตรวจสอบประจำปี 6 โครงการ (น. 16)</span>
            </button>

            <button
              onClick={() => setActiveCategory('engagement')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                activeCategory === 'engagement'
                  ? 'bg-stone-900 text-amber-200 shadow-xs border-l-4 border-amber-500'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>4. แผนปฏิบัติงาน 6 ภารกิจ (น. 10-45)</span>
            </button>

            <button
              onClick={() => setActiveCategory('wp')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                activeCategory === 'wp'
                  ? 'bg-stone-900 text-amber-200 shadow-xs border-l-4 border-amber-500'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>5. กระดาษทำการ 6 ภารกิจ (น. 12-47)</span>
            </button>

            <button
              onClick={() => setActiveCategory('report')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                activeCategory === 'report'
                  ? 'bg-stone-900 text-amber-200 shadow-xs border-l-4 border-amber-500'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>6. รายงานผล 5 องค์ประกอบ (น. 14-48)</span>
            </button>

            <button
              onClick={() => setActiveCategory('meeting')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                activeCategory === 'meeting'
                  ? 'bg-stone-900 text-amber-200 shadow-xs border-l-4 border-amber-500'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>7. การประชุมเปิด/ปิดตรวจ (น. 50-52)</span>
            </button>

            <button
              onClick={() => setActiveCategory('followup')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                activeCategory === 'followup'
                  ? 'bg-stone-900 text-amber-200 shadow-xs border-l-4 border-amber-500'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>8. ทะเบียนคุม & เตือน 30 วัน (น. 53-54)</span>
            </button>
          </div>

          {/* Right Main Content Viewer */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 bg-white dark:bg-stone-900">
            
            {/* Toast notice inside modal */}
            {appliedToast && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{appliedToast}</span>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 1: RISK ASSESSMENT */}
            {/* ==================================================== */}
            {activeCategory === 'risk' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      ตารางสรุปผลการวิเคราะห์ความเสี่ยง 16 กิจกรรม (หน้า 9)
                    </h4>
                    <p className="text-xs text-stone-500">
                      ช่วงคะแนนพิสัย 0.67: สูง (2.33 - 3.00), ปานกลาง (1.68 - 2.32), ต่ำ (1.00 - 1.67)
                    </p>
                  </div>
                  {onApplyRiskUniverse && (
                    <button
                      onClick={() => {
                        onApplyRiskUniverse();
                        showToast('นำเข้าชุดข้อมูลการประเมินความเสี่ยง 16 กิจกรรมเข้าสู่ระบบแล้ว');
                      }}
                      className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>นำเข้าข้อมูลนี้เข้าสู่ระบบประเมินความเสี่ยง</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
                    <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">ที่</th>
                        <th className="py-2.5 px-3">หน่วยงาน</th>
                        <th className="py-2.5 px-3">กิจกรรม</th>
                        <th className="py-2.5 px-2 text-center">S</th>
                        <th className="py-2.5 px-2 text-center">O</th>
                        <th className="py-2.5 px-2 text-center">F</th>
                        <th className="py-2.5 px-2 text-center">C</th>
                        <th className="py-2.5 px-2 text-center">K</th>
                        <th className="py-2.5 px-3 text-center">คะแนนเฉลี่ย</th>
                        <th className="py-2.5 px-3 text-center">ระดับ</th>
                        <th className="py-2.5 px-2 text-center">ลำดับ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {DLA_RISK_ASSESSMENT_16.map((item) => (
                        <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="py-2 px-3 text-center text-stone-400 font-bold">{item.order}</td>
                          <td className="py-2 px-3 font-semibold text-amber-800 dark:text-amber-300">{item.department}</td>
                          <td className="py-2 px-3 text-stone-900 dark:text-stone-100">{item.activity}</td>
                          <td className="py-2 px-2 text-center font-mono">{item.sScore}</td>
                          <td className="py-2 px-2 text-center font-mono">{item.oScore}</td>
                          <td className="py-2 px-2 text-center font-mono">{item.fScore}</td>
                          <td className="py-2 px-2 text-center font-mono">{item.cScore}</td>
                          <td className="py-2 px-2 text-center font-mono">{item.kScore}</td>
                          <td className="py-2 px-3 text-center font-bold text-stone-900 dark:text-stone-100 font-mono">{item.avgScore}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.riskLevel === 'สูง'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : item.riskLevel === 'ปานกลาง'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {item.riskLevel}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-stone-500 font-mono">{item.priority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 2: STRATEGIC PLAN 3 YEARS */}
            {/* ==================================================== */}
            {activeCategory === 'strategic' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      แผนการตรวจสอบระยะยาว 3 ปี & การคำนวณคน-วัน 590 วัน (หน้า 12-14)
                    </h4>
                    <p className="text-xs text-stone-500">
                      ปีที่ 1: 200 คน-วัน (6 กิจกรรม), ปีที่ 2: 180 คน-วัน (5 กิจกรรม), ปีที่ 3: 190 คน-วัน (5 กิจกรรม)
                    </p>
                  </div>
                  {onApplyStrategicPlan && (
                    <button
                      onClick={() => {
                        onApplyStrategicPlan();
                        showToast('นำเข้าแผนระยะยาว 3 ปีเข้าสู่ระบบแล้ว');
                      }}
                      className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>นำเข้าแผนระยะยาว 3 ปีนี้</span>
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs space-y-1.5">
                  <div className="font-bold text-amber-950 dark:text-amber-200">วัตถุประสงค์การตรวจสอบ 5 ข้อหลัก:</div>
                  <ul className="space-y-1 pl-4 list-disc text-stone-700 dark:text-stone-300">
                    {DLA_STRATEGIC_PLAN_3YEARS.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 space-y-2 text-xs">
                    <div className="font-bold text-amber-900 dark:text-amber-300 border-b pb-1">
                      {DLA_STRATEGIC_PLAN_3YEARS.year1.yearLabel} (200 คน-วัน)
                    </div>
                    <ul className="space-y-1">
                      {DLA_STRATEGIC_PLAN_3YEARS.year1.breakdown.map((b, i) => (
                        <li key={i} className="flex justify-between text-[11px]">
                          <span>{b.unit}: {b.activity}</span>
                          <span className="font-bold text-stone-600">{b.manDays} วัน</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 space-y-2 text-xs">
                    <div className="font-bold text-amber-900 dark:text-amber-300 border-b pb-1">
                      {DLA_STRATEGIC_PLAN_3YEARS.year2.yearLabel} (180 คน-วัน)
                    </div>
                    <ul className="space-y-1">
                      {DLA_STRATEGIC_PLAN_3YEARS.year2.breakdown.map((b, i) => (
                        <li key={i} className="flex justify-between text-[11px]">
                          <span>{b.unit}: {b.activity}</span>
                          <span className="font-bold text-stone-600">{b.manDays} วัน</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 space-y-2 text-xs">
                    <div className="font-bold text-amber-900 dark:text-amber-300 border-b pb-1">
                      {DLA_STRATEGIC_PLAN_3YEARS.year3.yearLabel} (190 คน-วัน)
                    </div>
                    <ul className="space-y-1">
                      {DLA_STRATEGIC_PLAN_3YEARS.year3.breakdown.map((b, i) => (
                        <li key={i} className="flex justify-between text-[11px]">
                          <span>{b.unit}: {b.activity}</span>
                          <span className="font-bold text-stone-600">{b.manDays} วัน</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 3: ANNUAL PLAN */}
            {/* ==================================================== */}
            {activeCategory === 'annual' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      แผนการตรวจสอบประจำปี 6 โครงการ (หน้า 16)
                    </h4>
                    <p className="text-xs text-stone-500">
                      กองคลัง 5 กิจกรรม + กองช่าง 1 กิจกรรม, งบดำเนินงาน 9,000 บาท
                    </p>
                  </div>
                  {onApplyAnnualPlan && (
                    <button
                      onClick={() => {
                        onApplyAnnualPlan();
                        showToast('นำเข้าแผนการตรวจสอบประจำปี 6 โครงการเข้าสู่ระบบแล้ว');
                      }}
                      className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>นำเข้าแผนประจำปีนี้</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {DLA_ANNUAL_AUDIT_PLAN_DATA.map((p, idx) => (
                    <div key={p.id} className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">{idx + 1}. {p.projectName}</div>
                        <div className="text-stone-500 text-[11px] mt-0.5">
                          {p.department} • {p.timing} • {p.auditor}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        <span className="font-mono text-stone-600">{p.manDays} คน-วัน</span>
                        <span className="font-bold text-amber-800 dark:text-amber-300">งบประมาณ {p.budget} บาท</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 4: ENGAGEMENT PLANS & AUDIT PROGRAMS */}
            {/* ==================================================== */}
            {activeCategory === 'engagement' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      แผนปฏิบัติการตรวจสอบ & แนวทางการตรวจ (Engagement Plan & Audit Program)
                    </h4>
                    <p className="text-xs text-stone-500">
                      ครอบคลุม 6 ภารกิจหลักมาตรฐานของ อปท. (หน้า 10, 16, 24, 31, 37, 45)
                    </p>
                  </div>
                  {onApplyEngagementPlans && (
                    <button
                      onClick={() => {
                        onApplyEngagementPlans();
                        showToast('นำเข้าแผนปฏิบัติการตรวจสอบ 6 ภารกิจเข้าสู่ระบบแล้ว');
                      }}
                      className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>นำเข้าทั้ง 6 แผนเข้าสู่ระบบ</span>
                    </button>
                  )}
                </div>

                {/* Workflow Selector Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {DLA_CORE_WORKFLOWS_6.map((wf, idx) => (
                    <button
                      key={wf.id}
                      onClick={() => setSelectedWorkflowIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedWorkflowIndex === idx
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {idx + 1}. {wf.activityName}
                    </button>
                  ))}
                </div>

                {/* Selected Workflow Detail Card */}
                <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-850/50 space-y-4 text-xs">
                  <div className="border-b pb-3">
                    <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {currentWorkflow.activityName} ({currentWorkflow.department})
                    </h5>
                    <div className="text-stone-500 text-[11px] mt-0.5">
                      ระยะเวลา: {currentWorkflow.auditPeriod} ({currentWorkflow.manDays} วันทำการ) • ผู้ตรวจ: {currentWorkflow.auditor}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-amber-900 dark:text-amber-300">ประเด็นและวัตถุประสงค์การตรวจสอบ:</div>
                    <ul className="space-y-1 pl-4 list-disc text-stone-700 dark:text-stone-300 text-[11px]">
                      {currentWorkflow.objectives.map((ob, i) => (
                        <li key={i}>{ob}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-amber-900 dark:text-amber-300">แนวทางการปฏิบัติงานตรวจสอบ ({currentWorkflow.auditProgram.length} วิธีการ):</div>
                    <div className="space-y-1">
                      {currentWorkflow.auditProgram.map((ap) => (
                        <div key={ap.step} className="p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 flex items-start justify-between gap-2 text-[11px]">
                          <span>{ap.step}. {ap.method}</span>
                          <span className="font-mono text-stone-400 shrink-0">{ap.wpRef}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 5: WORKING PAPERS */}
            {/* ==================================================== */}
            {activeCategory === 'wp' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      กระดาษทำการตรวจสอบมาตรฐาน (Working Papers)
                    </h4>
                    <p className="text-xs text-stone-500">
                      แบบฟอร์มการตรวจนับ ตรวจสอบเอกสาร และเช็คบ็อกซ์ตามระเบียบ (หน้า 12-47)
                    </p>
                  </div>
                  {onApplyWorkingPapers && (
                    <button
                      onClick={() => {
                        onApplyWorkingPapers();
                        showToast('นำเข้ากระดาษทำการ 6 ภารกิจเข้าสู่ระบบแล้ว');
                      }}
                      className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>นำเข้ากระดาษทำการ 6 ภารกิจนี้</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {DLA_CORE_WORKFLOWS_6.map((wf, idx) => (
                    <button
                      key={wf.id}
                      onClick={() => setSelectedWorkflowIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedWorkflowIndex === idx
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {wf.workingPaper.wpNo}: {wf.activityName}
                    </button>
                  ))}
                </div>

                <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 space-y-4 text-xs">
                  <div className="border-b pb-3">
                    <span className="font-mono text-xs font-black bg-stone-900 text-amber-300 px-2 py-0.5 rounded-md">
                      {currentWorkflow.workingPaper.wpNo}
                    </span>
                    <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-1">
                      {currentWorkflow.workingPaper.title}
                    </h5>
                    <div className="text-stone-500 text-[11px] mt-0.5">
                      {currentWorkflow.workingPaper.dateRange} • {currentWorkflow.workingPaper.fieldworkDates}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-stone-800 dark:text-stone-200">รายการตรวจสอบ & ผลการสุ่มตรวจ:</div>
                    <div className="space-y-1.5">
                      {currentWorkflow.workingPaper.checkpoints.map((cp, i) => (
                        <div key={i} className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <div>
                            <span className="font-semibold text-stone-700 dark:text-stone-300">{cp.section} - {cp.item}</span>
                            <div className="text-stone-500 text-[10px]">{cp.note}</div>
                          </div>
                          <span className="font-bold text-amber-800 dark:text-amber-300 self-start sm:self-auto">
                            [] {cp.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] space-y-1">
                    <div className="font-bold text-amber-900 dark:text-amber-200">สรุปผลการตรวจสอบในกระดาษทำการ:</div>
                    <p className="whitespace-pre-line text-stone-800 dark:text-stone-200 leading-relaxed">
                      {currentWorkflow.workingPaper.findingSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 6: AUDIT REPORT 5 COMPONENTS */}
            {/* ==================================================== */}
            {activeCategory === 'report' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      รายงานผลการตรวจสอบ 5 องค์ประกอบ (Audit Reports)
                    </h4>
                    <p className="text-xs text-stone-500">
                      ข้อตรวจพบ และข้อเสนอแนะที่สอดคล้องตามระเบียบกระทรวงมหาดไทย (หน้า 14-49)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {DLA_CORE_WORKFLOWS_6.map((wf, idx) => (
                    <button
                      key={wf.id}
                      onClick={() => setSelectedWorkflowIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedWorkflowIndex === idx
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      รายงาน: {wf.activityName}
                    </button>
                  ))}
                </div>

                <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 space-y-4 text-xs">
                  <div className="text-center border-b pb-3 space-y-1">
                    <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {currentWorkflow.auditReport.title}
                    </h5>
                    <div className="text-stone-500 text-[11px]">
                      หน่วยรับตรวจ: {currentWorkflow.auditReport.auditee} • ประจำปีงบประมาณ พ.ศ. {currentWorkflow.auditReport.fiscalYear}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-rose-800 dark:text-rose-300">ข้อตรวจพบ (Condition & Criteria):</div>
                    <p className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-stone-800 dark:text-stone-200 text-[11px] leading-relaxed whitespace-pre-line">
                      {currentWorkflow.auditReport.finding}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-emerald-800 dark:text-emerald-300">ข้อเสนอแนะ (Recommendation):</div>
                    <p className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-stone-800 dark:text-stone-200 text-[11px] leading-relaxed whitespace-pre-line">
                      {currentWorkflow.auditReport.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 7: OPENING & CLOSING MEETINGS */}
            {/* ==================================================== */}
            {activeCategory === 'meeting' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-stone-200 dark:border-stone-800">
                  <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                    รายงานการประชุมเปิดการตรวจสอบ & ปิดตรวจ (หน้า 50-52)
                  </h4>
                  <p className="text-xs text-stone-500">
                    ตัวอย่างบันทึกรายงานการประชุมเปิดตรวจ (16 ต.ค. 62) และปิดตรวจ (18 พ.ย. 63) กองคลัง
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 space-y-3 text-xs">
                    <div className="font-bold text-sm text-stone-900 dark:text-stone-100 border-b pb-1.5 flex items-center justify-between">
                      <span>การประชุมเปิดการตรวจสอบ (หน้า 50-51)</span>
                      <span className="text-[10px] text-amber-700 font-normal">วันที่ {DLA_OPENING_MEETING_DATA.meetingDate}</span>
                    </div>
                    <div className="text-[11px] space-y-1 text-stone-700 dark:text-stone-300">
                      <div><strong>หน่วยรับตรวจ:</strong> {DLA_OPENING_MEETING_DATA.auditee} ({DLA_OPENING_MEETING_DATA.activityName})</div>
                      <div><strong>ผู้เข้าประชุม:</strong> {DLA_OPENING_MEETING_DATA.attendees.map(a => `${a.name} (${a.position})`).join(', ')}</div>
                      <div><strong>มติที่ประชุม:</strong> ยืนยันความเหมาะสมของวัตถุประสงค์และขอบเขตการตรวจสอบ</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 space-y-3 text-xs">
                    <div className="font-bold text-sm text-stone-900 dark:text-stone-100 border-b pb-1.5 flex items-center justify-between">
                      <span>การประชุมปิดการตรวจสอบ (หน้า 52)</span>
                      <span className="text-[10px] text-amber-700 font-normal">วันที่ {DLA_CLOSING_MEETING_DATA.meetingDate}</span>
                    </div>
                    <div className="text-[11px] space-y-1 text-stone-700 dark:text-stone-300">
                      <div><strong>หน่วยรับตรวจ:</strong> {DLA_CLOSING_MEETING_DATA.auditee} ({DLA_CLOSING_MEETING_DATA.activityName})</div>
                      <div><strong>ข้อตรวจพบที่ชี้แจง:</strong> ใบเสร็จ e-LAAS ไม่แสดงยอดรวมในฉบับสุดท้าย และใบนำส่งเงินไม่มีลายมือชื่อ</div>
                      <div><strong>มติที่ประชุม:</strong> รับทราบผลการตรวจสอบ และจะดำเนินการแก้ไขตามข้อเสนอแนะ</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* VIEW 8: FOLLOW-UP REGISTER & MEMO */}
            {/* ==================================================== */}
            {activeCategory === 'followup' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      ทะเบียนคุมการดำเนินการตามข้อเสนอแนะ 6 กิจกรรม & หนังสือเตือน 30 วัน (หน้า 53-54)
                    </h4>
                    <p className="text-xs text-stone-500">
                      ตามระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2545 ข้อ 21
                    </p>
                  </div>
                  {onApplyFollowUp && (
                    <button
                      onClick={() => {
                        onApplyFollowUp();
                        showToast('นำเข้าทะเบียนคุม 6 กิจกรรมเข้าสู่ระบบแล้ว');
                      }}
                      className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>นำเข้าทะเบียนคุมนี้</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
                    <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200">
                      <tr>
                        <th className="py-2 px-2 text-center">ที่</th>
                        <th className="py-2 px-3">หน่วยงาน</th>
                        <th className="py-2 px-3">กิจกรรมที่ตรวจสอบ</th>
                        <th className="py-2 px-2.5">แจ้งรายงาน</th>
                        <th className="py-2 px-2.5">ครบกำหนด (30 วัน)</th>
                        <th className="py-2 px-2.5">วันที่รับรายงาน</th>
                        <th className="py-2 px-2.5">ผลการแก้ไข</th>
                        <th className="py-2 px-2.5">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {DLA_FOLLOWUP_REGISTER_6.map((r) => (
                        <tr key={r.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="py-2 px-2 text-center text-stone-400 font-bold">{r.order}</td>
                          <td className="py-2 px-3 font-semibold text-amber-800 dark:text-amber-300">{r.department}</td>
                          <td className="py-2 px-3 text-stone-900 dark:text-stone-100">{r.activity}</td>
                          <td className="py-2 px-2.5 font-mono text-[11px]">{r.reportDate}</td>
                          <td className="py-2 px-2.5 font-mono text-[11px] font-bold text-amber-700">{r.deadline30Days}</td>
                          <td className="py-2 px-2.5 font-mono text-[11px]">{r.receivedDate}</td>
                          <td className="py-2 px-2.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {r.result}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-stone-500 text-[11px]">{r.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs space-y-2">
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    ตัวอย่างหนังสือบันทึกข้อความติดตามผลครบ 30 วัน (หน้า 54):
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 text-[11px] leading-relaxed">
                    <strong>เรื่อง:</strong> {DLA_FOLLOWUP_MEMO_TEMPLATE.subject}<br />
                    <strong>เรียน:</strong> {DLA_FOLLOWUP_MEMO_TEMPLATE.to}<br />
                    "{DLA_FOLLOWUP_MEMO_TEMPLATE.bodyParagraph1}"<br />
                    "{DLA_FOLLOWUP_MEMO_TEMPLATE.bodyParagraph2}"
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500 flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>แนวทางปฏิบัติงานตรวจสอบภายใน สำหรับเจ้าหน้าที่ตรวจสอบภายใน ขององค์กรปกครองส่วนท้องถิ่น</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
