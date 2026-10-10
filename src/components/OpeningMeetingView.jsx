import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Building,
  FileText,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Info,
  Check,
  Send,
  MessageSquare,
  Award
} from 'lucide-react';
import { DLA_OPENING_MEETING_DATA } from '../data/dlaStandardTemplates';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import OfficialThaiMemo from './OfficialThaiMemo';
import {
  exportDataToExcel,
  exportThaiMemoToWord,
  exportDocumentToWord
} from '../utils/documentExportUtils';

export default function OpeningMeetingView({
  selectedYear = '2569',
  orgProfile = {},
  annualPlans = []
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(() => annualPlans[0]?.id || '');
  const currentPlan = annualPlans.find((p) => p.id === selectedPlanId) || annualPlans[0] || {
    id: 'PLAN-01',
    projectName: 'การตรวจสอบการรับเงินและนำส่งเงิน',
    department: 'กองคลัง',
    auditor: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'
  };

  const [activeSubTab, setActiveSubTab] = useState('minutes'); // 'notice', 'minutes'
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('09:30 น.');
  const [meetingLocation, setMeetingLocation] = useState('ห้องประชุมกองคลัง / สำนักงาน อปท.');
  const [docRefNo, setDocRefNo] = useState(`มท 0808/${selectedYear}/ว...`);

  // Attendees list
  const [attendees, setAttendees] = useState([
    { name: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน', position: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน', role: 'ประธานการประชุม (ผู้ตรวจสอบภายใน)' },
    { name: 'หัวหน้าหน่วยรับตรวจ', position: 'ผู้อำนวยการกอง', role: 'หน่วยรับตรวจ' },
    { name: 'เจ้าหน้าที่ผู้รับผิดชอบงาน', position: 'นักวิชาการ / เจ้าพนักงาน', role: 'ผู้ประสานงานหลัก' }
  ]);

  const [newAttendee, setNewAttendee] = useState({ name: '', position: '', role: 'หน่วยรับตรวจ' });

  // Agendas
  const [agendas, setAgendas] = useState([
    {
      title: 'วาระที่ 1: ชี้แจงวัตถุประสงค์และขอบเขตการตรวจสอบ',
      details: `ชี้แจงวัตถุประสงค์การตรวจสอบภารกิจ "${currentPlan.projectName || 'งานตรวจสอบ'}" เพื่อให้มั่นใจว่าการปฏิบัติงานเป็นไปตามระเบียบกฎหมายและมีระบบการควบคุมภายในที่เหมาะสม มิใช่การจับผิด แต่เป็นการช่วยเหลือแนะนำแนวทางปฏิบัติที่ถูกต้อง`
    },
    {
      title: 'วาระที่ 2: ชี้แจงระยะเวลาและวิธีการตรวจสอบ',
      details: 'กำหนดระยะเวลาการตรวจสอบภาคสนาม การสัมภาษณ์เจ้าหน้าที่ การสุ่มตรวจเอกสารหลักฐาน และการสังเกตการณ์การปฏิบัติงาน'
    },
    {
      title: 'วาระที่ 3: ข้อตกลงการประสานงานและการส่งมอบเอกสาร',
      details: 'ตกลงรายชื่อผู้ประสานงานหลัก และกำหนดเวลาส่งมอบเอกสารหลักฐาน (ฎีกา, ทะเบียนคุม, รายงาน) ภายใน 3 วันทำการ'
    },
    {
      title: 'วาระที่ 4: รับฟังความคิดเห็นและปัญหาอุปสรรคจากหน่วยรับตรวจ',
      details: 'เปิดโอกาสให้หน่วยรับตรวจแจ้งข้อจำกัด ปัญหาอุปสรรคในการปฏิบัติงาน หรือประเด็นที่ประสงค์จะขอคำปรึกษาจากผู้ตรวจสอบภายใน'
    }
  ]);

  const handleAddAttendee = () => {
    if (!newAttendee.name.trim()) return;
    setAttendees([...attendees, { ...newAttendee }]);
    setNewAttendee({ name: '', position: '', role: 'หน่วยรับตรวจ' });
  };

  const handleRemoveAttendee = (index) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleLoadDlaOpeningMeeting = () => {
    setMeetingDate('2568-10-15');
    setMeetingTime(DLA_OPENING_MEETING_DATA.time || '09.30 น.');
    setMeetingLocation(DLA_OPENING_MEETING_DATA.location || 'ห้องประชุมกองคลัง');
    setAttendees(DLA_OPENING_MEETING_DATA.attendees.map(a => ({
      name: a.name,
      position: a.position,
      role: a.role || 'ผู้เข้าร่วมประชุม'
    })));
    setAgendas(DLA_OPENING_MEETING_DATA.agendas.map(ag => ({
      title: `${ag.agenda}: ${ag.title}`,
      details: ag.details
    })));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    try {
      if (activeSubTab === 'notice') {
        exportThaiMemoToWord({
          agency: `หน่วยตรวจสอบภายใน ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}`,
          phone: orgProfile?.phone || '',
          docNumber: `อบ ๗๘๔๐๘/เปิดตรวจ`,
          docDate: `${meetingDate}`,
          subject: `ขอเชิญร่วมประชุมเปิดการตรวจสอบ (Opening Meeting) โครงการ ${currentPlan.projectName || currentPlan.topic || 'การตรวจสอบภายใน'}`,
          to: `หัวหน้า${currentPlan.department || 'หน่วยรับตรวจ'}`,
          contentParagraphs: [
            `<strong>๑. เรื่องเดิม:</strong> ตามที่ นายก${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} ได้อนุมัติแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. ${selectedYear} นั้น`,
            `<strong>๒. ข้อเท็จจริง:</strong> หน่วยตรวจสอบภายใน กำหนดจะเข้าปฏิบัติงานตรวจสอบโครงการ <strong>${currentPlan.projectName || currentPlan.topic}</strong> จึงขอเชิญท่านและเจ้าหน้าที่ผู้เกี่ยวข้องร่วมประชุมเปิดการตรวจสอบ (Opening Meeting) ในวันที่ <strong>${meetingDate}</strong> เวลา <strong>${meetingTime}</strong> ณ <strong>${meetingLocation}</strong>`,
            `<strong>๓. ข้อพิจารณาและข้อเสนอ:</strong> ในการประชุมดังกล่าวจะมีการชี้แจงวัตถุประสงค์ ขอบเขต และขั้นตอนการตรวจสอบ เพื่อสร้างความเข้าใจร่วมกัน จึงเรียนมาเพื่อโปรดเข้าร่วมประชุมตามกำหนดเวลาดังกล่าว<br/><br/>` +
            `จึงเรียนมาเพื่อโปรดพิจารณา`
          ],
          signatoryName: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน',
          signatoryPosition: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายในชำนาญการ',
          signatoryRole: 'หัวหน้าทีมตรวจสอบ',
          palatReviewText: 'ทราบและเห็นควรแจ้งหน่วยรับตรวจเข้าร่วมประชุม',
          executiveOrderText: 'ทราบ มอบหมายหน่วยรับตรวจเข้าร่วมประชุมตามกำหนด',
          orgName: orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น',
          fileName: `หนังสือเชิญประชุมเปิดตรวจ_${currentPlan.id || 'PLAN'}_${orgProfile?.name || 'อปท'}`
        });
      } else {
        const attendeesHtml = attendees.map((a, i) => `<tr><td style="text-align: center; border: 1pt solid #000; padding: 4pt;">${i + 1}</td><td style="border: 1pt solid #000; padding: 4pt; font-weight: bold;">${a.name}</td><td style="border: 1pt solid #000; padding: 4pt;">${a.position}</td><td style="border: 1pt solid #000; padding: 4pt;">${a.role}</td></tr>`).join('');
        const agendasHtml = agendas.map((ag) => `
          <div style="margin-bottom: 10pt;">
            <p style="font-weight: bold; margin: 0 0 2pt 0;">${ag.title}</p>
            <p style="text-indent: 1.5cm; margin: 0; text-align: justify;">${ag.details}</p>
          </div>
        `).join('');

        const content = `
          <div style="text-align: center; margin-bottom: 16pt;">
            <h2 style="font-size: 18pt; font-weight: bold; margin: 0;">รายงานการประชุมเปิดการตรวจสอบ (Opening Meeting)</h2>
            <div style="font-size: 16pt; font-weight: bold; margin-top: 4pt;">โครงการ: ${currentPlan.projectName || currentPlan.topic || 'การตรวจสอบภายใน'}</div>
            <div style="font-size: 14pt; margin-top: 2pt;">หน่วยตรวจสอบภายใน ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</div>
            <div style="font-size: 13pt; margin-top: 4pt;">ประชุมเมื่อวันที่ ${meetingDate} เวลา ${meetingTime} ณ ${meetingLocation}</div>
          </div>
          <h3 style="font-size: 15pt; font-weight: bold; margin-bottom: 6pt;">ผู้เข้าร่วมประชุม</h3>
          <table class="table-bordered" style="width: 100%; border: 1pt solid #000; border-collapse: collapse; font-size: 13pt; margin-bottom: 14pt;">
            <thead>
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <th style="border: 1pt solid #000; padding: 4pt; width: 8%;">ที่</th>
                <th style="border: 1pt solid #000; padding: 4pt; width: 35%;">ชื่อ - สกุล</th>
                <th style="border: 1pt solid #000; padding: 4pt; width: 32%;">ตำแหน่ง</th>
                <th style="border: 1pt solid #000; padding: 4pt; width: 25%;">สถานะในที่ประชุม</th>
              </tr>
            </thead>
            <tbody>
              ${attendeesHtml}
            </tbody>
          </table>
          <h3 style="font-size: 15pt; font-weight: bold; margin-bottom: 6pt;">สาระสำคัญและวาระการประชุม</h3>
          <div style="font-size: 14pt; line-height: 1.4;">
            ${agendasHtml}
          </div>
          <div style="margin-top: 30pt; text-align: right; padding-right: 40pt;">
            <p style="margin: 0;">(ลงชื่อ)........................................................ผู้บันทึกรายงานการประชุม</p>
            <p style="margin: 4pt 0 0 0; font-weight: bold;">(${orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})</p>
            <p style="margin: 2pt 0 0 0;">${orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}</p>
          </div>
        `;

        exportDocumentToWord({
          title: `รายงานการประชุมเปิดตรวจ_${currentPlan.id || 'PLAN'}`,
          htmlContent: content,
          fileName: `รายงานการประชุมเปิดการตรวจสอบ_สถ_${currentPlan.id || 'PLAN'}_${orgProfile?.name || 'อปท'}`
        });
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด Word');
    }
  };

  const handleDownloadExcel = () => {
    try {
      const headers = ['ลำดับ', 'ชื่อ - สกุล', 'ตำแหน่ง', 'สถานะการประชุม'];
      const rows = attendees.map((a, i) => [i + 1, a.name, a.position, a.role]);
      exportDataToExcel({
        sheetName: 'ผู้เข้าร่วมประชุม',
        headers,
        rows,
        fileName: `รายชื่อผู้เข้าร่วมประชุมเปิดตรวจ_${currentPlan.id || 'PLAN'}_${orgProfile?.name || 'อปท'}`,
        colWidths: [8, 30, 30, 24]
      });
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-7 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs print:hidden">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Building className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>ผู้ตรวจสอบ: {orgProfile?.auditorName || 'หน่วยตรวจสอบภายใน'}</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>ปีงบประมาณ พ.ศ. {selectedYear}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            การประชุมเปิดการตรวจสอบ (Opening Meeting)
          </h1>
        </div>
      </div>

      {/* Select Project & Action Controls Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 sm:p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-300 shrink-0">
              โครงการ:
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold max-w-xs text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer truncate"
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

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveSubTab('minutes')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'minutes'
                  ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                  : 'bg-stone-100/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 border border-transparent'
              }`}
            >
              รายงานประชุม (Minutes)
            </button>
            <button
              onClick={() => setActiveSubTab('notice')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'notice'
                  ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                  : 'bg-stone-100/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-200/80 border border-transparent'
              }`}
            >
              หนังสือแจ้งเข้าตรวจ (Notice)
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          <button
            onClick={handleLoadDlaOpeningMeeting}
            className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="โหลดตัวอย่างรายงานการประชุมเปิดการตรวจสอบตามคู่มือ สถ. หน้า 50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>📥 โหลดตัวอย่าง สถ. (หน้า 50)</span>
          </button>
          <OfficialDocActionToolbar
            onDownloadWord={handleDownloadWord}
            wordTitle="รายงานการประชุมเปิดตรวจ / หนังสือแจ้ง (.doc)"
            wordSubtitle={`รายงานการประชุมเปิดตรวจโครงการ ${currentPlan.projectName || 'ตรวจสอบ'} (คู่มือ สถ. หน้า ๕๐)`}
            onDownloadExcel={handleDownloadExcel}
            excelTitle="รายชื่อผู้เข้าร่วมประชุม (.xlsx)"
            excelSubtitle="บัญชีรายชื่อผู้เข้าร่วมประชุมเปิดการตรวจและหน่วยรับตรวจ"
            onPrint={handlePrint}
            pdfTitle="พิมพ์รายงานการประชุมเปิดตรวจ / PDF"
            pdfSubtitle="พิมพ์รายงานการประชุมเปิดการตรวจสอบและใบลงชื่อ (A4)"
          />
        </div>
      </div>

      {/* VIEW: MEETING MINUTES */}
      {activeSubTab === 'minutes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Header of Minutes */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              รายงานการประชุมเปิดการตรวจสอบ (Opening Meeting)
            </h2>
            <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              โครงการ: {currentPlan.projectName || currentPlan.topic || 'การตรวจสอบภายใน'}
            </div>
            <div className="text-xs text-slate-500">
              หน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} ประจำปีงบประมาณ พ.ศ. {selectedYear}
            </div>
          </div>

          {/* Meeting Details Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 dark:bg-stone-850/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 text-xs">
            <div>
              <span className="text-stone-400 font-medium">วันที่ประชุม: </span>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="bg-transparent font-bold print:border-none text-stone-850 dark:text-stone-100"
              />
            </div>
            <div>
              <span className="text-stone-400 font-medium">เวลา: </span>
              <input
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="bg-transparent font-bold w-24 print:border-none text-stone-850 dark:text-stone-100"
              />
            </div>
            <div>
              <span className="text-stone-400 font-medium">สถานที่: </span>
              <input
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                className="bg-transparent font-bold w-full print:border-none text-stone-850 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-2">
              <Users className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>ผู้เข้าร่วมการประชุม</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
                <thead className="bg-stone-100/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                    <th className="py-2.5 px-3">ชื่อ - สกุล</th>
                    <th className="py-2.5 px-3">ตำแหน่ง</th>
                    <th className="py-2.5 px-3">บทบาทในการประชุม</th>
                    <th className="py-2.5 px-3 w-12 print:hidden text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {attendees.map((a, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40">
                      <td className="py-2 px-3 text-center font-bold text-stone-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold">{a.name}</td>
                      <td className="py-2 px-3 text-stone-600 dark:text-stone-400">{a.position}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                          {a.role}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center print:hidden">
                        <button
                          onClick={() => handleRemoveAttendee(idx)}
                          className="text-stone-300 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Attendee Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
              <input
                type="text"
                placeholder="ชื่อ-สกุล"
                value={newAttendee.name}
                onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                className="text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex-1 min-w-[140px] text-stone-850 dark:text-stone-100"
              />
              <input
                type="text"
                placeholder="ตำแหน่ง"
                value={newAttendee.position}
                onChange={(e) => setNewAttendee({ ...newAttendee, position: e.target.value })}
                className="text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex-1 min-w-[140px] text-stone-850 dark:text-stone-100"
              />
              <input
                type="text"
                placeholder="บทบาท (เช่น ผู้ประสานงาน)"
                value={newAttendee.role}
                onChange={(e) => setNewAttendee({ ...newAttendee, role: e.target.value })}
                className="text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 w-36 text-stone-850 dark:text-stone-100"
              />
              <button
                onClick={handleAddAttendee}
                className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มผู้เข้าร่วม</span>
              </button>
            </div>
          </div>

          {/* Agendas & Discussions */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>ประเด็นสาระสำคัญในการประชุม (Agendas & Discussions)</span>
            </h3>

            <div className="space-y-3">
              {agendas.map((agenda, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 bg-stone-50/60 dark:bg-stone-850/40 space-y-2"
                >
                  <div className="font-bold text-xs text-stone-800 dark:text-amber-300">
                    {agenda.title}
                  </div>
                  <textarea
                    rows={2}
                    value={agenda.details}
                    onChange={(e) => {
                      const updated = [...agendas];
                      updated[idx].details = e.target.value;
                      setAgendas(updated);
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 leading-relaxed text-stone-850 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
            <div className="space-y-12">
              <div>ลงชื่อ........................................................ประธานการประชุม</div>
              <div>({orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})<br />ตำแหน่ง {orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}</div>
            </div>
            <div className="space-y-12">
              <div>ลงชื่อ........................................................หัวหน้าหน่วยรับตรวจ</div>
              <div>(........................................................)<br />ผู้อำนวยการ{currentPlan.department || 'หน่วยรับตรวจ'}</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: OFFICIAL NOTICE LETTER */}
      {activeSubTab === 'notice' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0">
          <div className="text-center font-bold text-base text-slate-900 dark:text-slate-100 border-b pb-3 border-slate-200">
            บันทึกข้อความ (หนังสือแจ้งเข้าตรวจสอบล่วงหน้า)
          </div>

          <div className="text-xs space-y-2 text-slate-800 dark:text-slate-200">
            <div className="flex justify-between">
              <div><strong>ส่วนราชการ:</strong> หน่วยตรวจสอบภายใน {orgProfile?.name || 'อปท.'}</div>
              <div><strong>โทร:</strong> {orgProfile?.phone || '-'}</div>
            </div>
            <div className="flex justify-between">
              <div><strong>ที่:</strong> <input type="text" value={docRefNo} onChange={(e) => setDocRefNo(e.target.value)} className="font-mono bg-transparent" /></div>
              <div><strong>วันที่:</strong> {new Date().toLocaleDateString('th-TH')}</div>
            </div>
            <div>
              <strong>เรื่อง:</strong> แจ้งเข้าปฏิบัติงานตรวจสอบภายในประจำปีงบประมาณ พ.ศ. {selectedYear}
            </div>
            <div className="pt-2">
              <strong>เรียน:</strong> ผู้อำนวยการ{currentPlan.department || 'หน่วยรับตรวจ'}
            </div>
          </div>

          <div className="text-xs space-y-3 leading-relaxed text-slate-700 dark:text-slate-300 text-justify">
            <p className="indent-8">
              ตามที่ นายก{orgProfile?.name || 'อปท.'} ได้อนุมัติแผนการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. {selectedYear} เรียบร้อยแล้วนั้น หน่วยตรวจสอบภายในมีกำหนดเข้าปฏิบัติงานตรวจสอบในภารกิจ "{currentPlan.projectName || currentPlan.topic || 'งานตรวจสอบ'}" สังกัด{currentPlan.department || 'หน่วยรับตรวจ'} ระหว่างวันที่ {meetingDate} เป็นต้นไป
            </p>
            <p className="indent-8">
              ในการนี้ เพื่อให้การตรวจสอบเป็นไปด้วยความเรียบร้อยและมีประสิทธิภาพ จึงขอความร่วมมือท่านจัดเตรียมเอกสารหลักฐานที่เกี่ยวข้อง และขอเชิญร่วมการประชุมเปิดการตรวจสอบ (Opening Meeting) ในวันที่ {meetingDate} เวลา {meetingTime} ณ {meetingLocation}
            </p>
            <p className="indent-8">
              จึงเรียนมาเพื่อโปรดทราบและพิจารณาให้ความร่วมมือ
            </p>
          </div>

          <div className="pt-10 text-center text-xs space-y-12 ml-auto w-64">
            <div>(ลงชื่อ)........................................................</div>
            <div>
              ({orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})<br />
              {orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}<br />
              หน่วยตรวจสอบภายใน {orgProfile?.name || 'อปท.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
