import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Building,
  FileSpreadsheet,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Check,
  ClipboardCheck,
  ArrowRight
} from 'lucide-react';
import { DLA_CLOSING_MEETING_DATA } from '../data/dlaStandardTemplates';

export default function ClosingMeetingView({
  selectedYear = '2569',
  orgProfile = {},
  annualPlans = [],
  workingPapers = [],
  onNavigateToTab
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(() => annualPlans[0]?.id || '');
  const currentPlan = annualPlans.find((p) => p.id === selectedPlanId) || annualPlans[0] || {
    id: 'PLAN-01',
    projectName: 'การตรวจสอบการรับเงินและนำส่งเงิน',
    department: 'กองคลัง',
    auditor: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'
  };

  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('13:30 น.');
  const [meetingLocation, setMeetingLocation] = useState('ห้องประชุมกองคลัง / สำนักงาน อปท.');

  // Preliminary Findings discussed in Closing Meeting
  const [findings, setFindings] = useState([
    {
      id: 'FIND-01',
      topic: 'การจัดทำงบกระทบยอดเงินฝากธนาคารล่าช้า',
      condition: 'พบว่างบกระทบยอดเงินฝากธนาคารสำหรับบัญชีเงินฝากกระแสรายวันของ อปท. ยังไม่ได้จัดทำเป็นประจำทุกสิ้นเดือน ทำให้ไม่ทราบยอดเงินคงเหลือที่แท้จริง',
      criteria: 'ระเบียบ มท. ว่าด้วยการรับเงินฯ พ.ศ. 2566 ข้อ 94 และหนังสือสั่งการ กค ว 23',
      auditeeFeedback: 'ยอมรับข้อตรวจพบ เนื่องจากเจ้าหน้าที่ผู้รับผิดชอบเพิ่งได้รับการบรรจุแต่งตั้งใหม่ ยังขาดความชำนาญในระบบ e-LAAS',
      agreement: 'กองคลังจะเร่งรัดจัดทำงบกระทบยอดเงินฝากธนาคารย้อนหลังให้แล้วเสร็จภายใน 15 วันทำการ',
      status: 'เห็นชอบร่วมกัน'
    },
    {
      id: 'FIND-02',
      topic: 'การลงบันทึกการใช้รถยนต์ส่วนกลางไม่ครบถ้วน',
      condition: 'พบว่าสมุดบันทึกประจำรถยนต์ส่วนกลางบางคัน ไม่ได้ลงเลขกิโลเมตรเริ่มต้นและสิ้นสุด ทำให้ไม่สามารถตรวจสอบอัตราสิ้นเปลืองน้ำมันเชื้อเพลิงได้',
      criteria: 'ระเบียบกระทรวงมหาดไทยว่าด้วยการใช้และรักษารถยนต์ของ อปท. พ.ศ. 2548 ข้อ 19',
      auditeeFeedback: 'พนักงานขับรถได้ชี้แจงว่าช่วงเกิดเหตุมีภารกิจเร่งด่วน จึงลงบันทึกตกหล่น',
      agreement: 'สำนักปลัดจะกำชับพนักงานขับรถทุกคนให้บันทึกเลขไมล์ทุกครั้งก่อนและหลังใช้รถอย่างเคร่งครัด',
      status: 'เห็นชอบร่วมกัน'
    }
  ]);

  const [newFinding, setNewFinding] = useState({
    topic: '',
    condition: '',
    criteria: '',
    auditeeFeedback: '',
    agreement: ''
  });

  const handleAddFinding = () => {
    if (!newFinding.topic.trim()) return;
    setFindings([
      ...findings,
      {
        id: `FIND-${Date.now().toString().slice(-4)}`,
        ...newFinding,
        status: 'เห็นชอบร่วมกัน'
      }
    ]);
    setNewFinding({
      topic: '',
      condition: '',
      criteria: '',
      auditeeFeedback: '',
      agreement: ''
    });
  };

  const handleRemoveFinding = (id) => {
    setFindings(findings.filter((f) => f.id !== id));
  };

  const handleLoadDlaClosingMeeting = () => {
    setMeetingDate('2568-11-29');
    setMeetingTime(DLA_CLOSING_MEETING_DATA.time || '14.00 น.');
    setMeetingLocation(DLA_CLOSING_MEETING_DATA.location || 'ห้องประชุมกองคลัง');
    setFindings(
      (DLA_CLOSING_MEETING_DATA.findingsSummary || []).map((f, idx) => ({
        id: `FIND-DLA-${idx + 1}`,
        topic: f.issue,
        condition: f.detail,
        criteria: 'ระเบียบ มท. ว่าด้วยการรับเงินฯ พ.ศ. 2547 และที่แก้ไขเพิ่มเติม ข้อ 12',
        auditeeFeedback: f.auditeeExplanation,
        agreement: f.agreedResolution,
        status: 'เห็นชอบร่วมกัน'
      }))
    );
  };

  const handlePullFindingsFromWorkingPapers = () => {
    const pulled = [];
    workingPapers.forEach((wp) => {
      if (wp.finding?.condition) {
        pulled.push({
          id: `FIND-${wp.id}`,
          topic: wp.topic,
          condition: wp.finding.condition,
          criteria: Array.isArray(wp.criteria) ? wp.criteria.join(', ') : (wp.criteria || ''),
          auditeeFeedback: 'หน่วยรับตรวจรับทราบข้อสังเกตและชี้แจงข้อเท็จจริงตามสภาพงาน',
          agreement: wp.finding.recommendation || 'หน่วยรับตรวจตกลงดำเนินการปรับปรุงแก้ไขตามข้อเสนอแนะภายใน 30 วัน',
          status: 'เห็นชอบร่วมกัน'
        });
      }
    });

    if (pulled.length === 0) {
      alert('ยังไม่พบข้อตรวจพบที่บันทึกไว้ในกระดาษทำการ (ขั้นที่ 6) กรุณาบันทึกข้อตรวจพบในกระดาษทำการก่อน หรือกดโหลดตัวอย่าง สถ.');
      return;
    }

    setFindings(pulled);
    alert(`ดึงข้อตรวจพบจากกระดาษทำการจำนวน ${pulled.length} โครงการ เรียบร้อยแล้ว`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs print:hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>ขั้นตอนที่ 7 ของกระบวนการตรวจสอบภายใน อปท.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              การประชุมปิดการตรวจสอบ (Closing Meeting)
            </h1>
            <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              การสรุปข้อตรวจพบเบื้องต้น รับฟังข้อเท็จจริงและคำชี้แจงจากหน่วยรับตรวจ และตกลงแนวทางแก้ไขร่วมกันก่อนจัดทำรายงานผลการตรวจสอบฉบับสมบูรณ์เสนอผู้บริหาร
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={handlePullFindingsFromWorkingPapers}
              className="bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="ดึงข้อตรวจพบจากกระดาษทำการ (ขั้นที่ 6) เข้าสู่วาระการประชุมปิดตรวจ"
            >
              <ClipboardCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>📥 ดึงข้อตรวจพบจากกระดาษทำการ (ขั้น 6)</span>
            </button>
            <button
              onClick={handleLoadDlaClosingMeeting}
              className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="โหลดตัวอย่างรายงานการประชุมปิดการตรวจสอบตามคู่มือ สถ. หน้า 52"
            >
              <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>📥 โหลดตัวอย่าง สถ. (หน้า 52)</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-white/80 hover:bg-white dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span>พิมพ์</span>
            </button>
          </div>
        </div>
      </div>

      {/* Select Project Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-stone-600 dark:text-stone-300 shrink-0">
            เลือกโครงการตรวจสอบ:
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold max-w-md text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {annualPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName || p.title || p.topic} ({p.department || 'หน่วยรับตรวจ'})
              </option>
            ))}
            {annualPlans.length === 0 && (
              <option value="PLAN-01">การตรวจสอบการรับเงินและนำส่งเงิน (กองคลัง)</option>
            )}
          </select>
        </div>
      </div>

      {/* Meeting Document Body */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        <div className="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            รายงานการประชุมปิดการตรวจสอบ (Closing Meeting Minutes)
          </h2>
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            โครงการ: {currentPlan.projectName || currentPlan.topic || 'การตรวจสอบภายใน'}
          </div>
          <div className="text-xs text-slate-500">
            หน่วยรับตรวจ: {currentPlan.department || 'หน่วยรับตรวจ'} {orgProfile?.name || 'อปท.'} ประจำปีงบประมาณ พ.ศ. {selectedYear}
          </div>
        </div>

        {/* Meeting metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-400 font-medium">วันที่ปิดตรวจ: </span>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="bg-transparent font-bold print:border-none"
            />
          </div>
          <div>
            <span className="text-slate-400 font-medium">เวลา: </span>
            <input
              type="text"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="bg-transparent font-bold w-24 print:border-none"
            />
          </div>
          <div>
            <span className="text-slate-400 font-medium">สถานที่: </span>
            <input
              type="text"
              value={meetingLocation}
              onChange={(e) => setMeetingLocation(e.target.value)}
              className="bg-transparent font-bold w-full print:border-none"
            />
          </div>
        </div>

        {/* Preliminary Findings Discussion Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>สรุปประเด็นข้อตรวจพบเบื้องต้นและข้อตกลงร่วมกัน ({findings.length} ประเด็น)</span>
            </h3>
          </div>

          <div className="space-y-4">
            {findings.map((f, idx) => (
              <div
                key={f.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{f.topic}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFinding(f.id)}
                    className="text-slate-300 hover:text-rose-500 print:hidden"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <div className="text-slate-400 font-bold">สภาพข้อเท็จจริงที่ตรวจพบ (Condition):</div>
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed">{f.condition}</div>
                    <div className="text-[11px] text-blue-600 font-medium pt-1">เกณฑ์อ้างอิง: {f.criteria}</div>
                  </div>

                  <div className="space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                    <div className="text-emerald-800 dark:text-emerald-300 font-bold">คำชี้แจงของหน่วยรับตรวจ (Auditee Response):</div>
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed">{f.auditeeFeedback}</div>
                    <div className="text-emerald-700 dark:text-emerald-400 font-bold pt-1">
                      ข้อตกลงแนวทางแก้ไข: {f.agreement}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add finding box */}
          <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/30 space-y-3 text-xs print:hidden">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>+ เพิ่มประเด็นข้อตรวจพบเพื่อร่วมหารือในที่ประชุมปิดตรวจ</span>
            </div>

            <input
              type="text"
              placeholder="หัวข้อประเด็นตรวจพบ..."
              value={newFinding.topic}
              onChange={(e) => setNewFinding({ ...newFinding, topic: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                rows={2}
                placeholder="สภาพข้อเท็จจริงที่ตรวจพบ (Condition)..."
                value={newFinding.condition}
                onChange={(e) => setNewFinding({ ...newFinding, condition: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <textarea
                rows={2}
                placeholder="คำชี้แจงของหน่วยรับตรวจ / ข้อตกลงแก้ไข..."
                value={newFinding.auditeeFeedback}
                onChange={(e) =>
                  setNewFinding({
                    ...newFinding,
                    auditeeFeedback: e.target.value,
                    agreement: e.target.value
                  })
                }
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <button
              onClick={handleAddFinding}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกประเด็นข้อตรวจพบ</span>
            </button>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
          <div className="space-y-12">
            <div>ลงชื่อ........................................................ผู้ตรวจสอบภายใน</div>
            <div>({orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})<br />ตำแหน่ง {orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}</div>
          </div>
          <div className="space-y-12">
            <div>ลงชื่อ........................................................หัวหน้าหน่วยรับตรวจ</div>
            <div>(........................................................)<br />ผู้อำนวยการ{currentPlan.department || 'หน่วยรับตรวจ'}</div>
          </div>
        </div>

        {/* Workflow Navigation */}
        {onNavigateToTab && (
          <div className="pt-6 border-t border-stone-200/60 dark:border-stone-800 flex justify-end print:hidden">
            <button
              onClick={() => onNavigateToTab('reporting')}
              className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>นำข้อสรุปไปจัดทำรายงานผลการตรวจสอบ (ขั้นที่ 8)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
