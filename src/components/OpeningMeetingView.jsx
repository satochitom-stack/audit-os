import React, { useState, useEffect, useMemo } from 'react';
import PageHeaderBanner from './PageHeaderBanner';
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
  Award,
  ClipboardList,
  FileCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import { DLA_OPENING_MEETING_DATA } from '../data/dlaStandardTemplates';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import OfficialThaiMemo from './OfficialThaiMemo';
import {
  exportDataToExcel,
  exportThaiMemoToWord,
  exportDocumentToWord
} from '../utils/documentExportUtils';
import { toThaiDigits, formatSarabanDate } from '../utils/sarabanUtils';
import {
  loadOpeningMeeting,
  saveOpeningMeeting,
  createInitialOpeningMeeting
} from '../utils/meetingSyncUtils';
import { getTodayDate } from '../utils/followupSyncUtils';

export default function OpeningMeetingView({
  selectedYear = '2569',
  orgProfile = {},
  annualPlans = [],
  engagementPlans = [],
  session = null
}) {
  const isNonAdminUser = session?.role !== 'admin' && session?.username?.toLowerCase() !== 'admin';
  const effectiveAuditorName = isNonAdminUser
    ? (session?.displayName || (orgProfile?.auditorName && orgProfile.auditorName.toUpperCase() !== 'ADMIN' && !orgProfile.auditorName.includes('Super Admin') ? orgProfile.auditorName : 'ผู้ตรวจสอบภายใน'))
    : (orgProfile?.auditorName || session?.displayName || 'ผู้ดูแลระบบส่วนกลาง (Super Admin)');
  const effectiveAuditorPosition = isNonAdminUser
    ? (session?.position || (orgProfile?.auditorPosition && !orgProfile.auditorPosition.includes('Platform Root') && !orgProfile.auditorPosition.includes('ผู้ดูแลระบบ') ? orgProfile.auditorPosition : 'นักวิชาการตรวจสอบภายใน'))
    : (orgProfile?.auditorPosition || session?.position || 'ผู้ดูแลระบบระบบตรวจสอบภายใน (Platform Root)');

  // Combine engagement plans and annual plans for scoping
  const combinedPlans = useMemo(() => {
    const list = [];
    const seen = new Set();

    if (Array.isArray(engagementPlans) && engagementPlans.length > 0) {
      engagementPlans.forEach((ep) => {
        if (ep && ep.id && !seen.has(ep.id)) {
          seen.add(ep.id);
          list.push({
            id: ep.id,
            projectName: ep.title || ep.projectName || ep.activityName || 'แผนปฏิบัติการตรวจสอบ',
            department: ep.department || 'หน่วยรับตรวจ',
            auditor: ep.auditorName || ep.auditor || effectiveAuditorName,
            source: 'engagement',
            typeLabel: 'แผนปฏิบัติการ (Engagement Plan)'
          });
        }
      });
    }

    if (Array.isArray(annualPlans) && annualPlans.length > 0) {
      annualPlans.forEach((ap) => {
        if (ap && ap.id && !seen.has(ap.id)) {
          seen.add(ap.id);
          list.push({
            id: ap.id,
            projectName: ap.projectName || ap.title || ap.topic || 'แผนการตรวจสอบประจำปี',
            department: ap.department || 'หน่วยรับตรวจ',
            auditor: ap.auditor || effectiveAuditorName,
            source: 'annual',
            typeLabel: 'แผนประจำปี (Annual Plan)'
          });
        }
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'PLAN-01',
        projectName: 'การตรวจสอบการรับเงินและนำส่งเงิน',
        department: 'กองคลัง',
        auditor: effectiveAuditorName,
        source: 'default',
        typeLabel: 'แผนเริ่มต้น'
      });
    }
    return list;
  }, [annualPlans, engagementPlans, effectiveAuditorName]);

  const [selectedPlanId, setSelectedPlanId] = useState(() => combinedPlans[0]?.id || '');
  const currentPlan = combinedPlans.find((p) => p.id === selectedPlanId) || combinedPlans[0];

  const [activeSubTab, setActiveSubTab] = useState('minutes'); // 'notice', 'minutes'

  // Persistent meeting data state scoped by (selectedYear, currentPlan.id)
  const [meetingData, setMeetingData] = useState(() => {
    return loadOpeningMeeting(selectedYear, currentPlan, {
      auditorName: effectiveAuditorName,
      auditorPosition: effectiveAuditorPosition,
      year: selectedYear
    }, session);
  });

  // Reload when plan or year changes
  useEffect(() => {
    if (currentPlan) {
      const loaded = loadOpeningMeeting(selectedYear, currentPlan, {
        auditorName: effectiveAuditorName,
        auditorPosition: effectiveAuditorPosition,
        year: selectedYear
      });
      setMeetingData(loaded);
    }
  }, [selectedYear, selectedPlanId, session?.username]);

  // Save helper
  const updateMeetingData = (updater) => {
    setMeetingData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (currentPlan?.id) {
        saveOpeningMeeting(selectedYear, currentPlan.id, next, session);
      }
      return next;
    });
  };

  // Attendees management
  const [newAttendee, setNewAttendee] = useState({ name: '', position: '', role: 'หน่วยรับตรวจ' });
  const handleAddAttendee = () => {
    if (!newAttendee.name.trim()) return;
    updateMeetingData((prev) => ({
      ...prev,
      attendees: [...(prev.attendees || []), { ...newAttendee }]
    }));
    setNewAttendee({ name: '', position: '', role: 'หน่วยรับตรวจ' });
  };

  const handleRemoveAttendee = (index) => {
    updateMeetingData((prev) => ({
      ...prev,
      attendees: (prev.attendees || []).filter((_, i) => i !== index)
    }));
  };

  // Requested Documents management
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');

  const handleToggleDocStatus = (docId) => {
    const today = getTodayDate();
    updateMeetingData((prev) => ({
      ...prev,
      requestedDocuments: (prev.requestedDocuments || []).map((doc) => {
        if (doc.id === docId) {
          const nextStatus = doc.status === 'received' ? 'pending' : 'received';
          return {
            ...doc,
            status: nextStatus,
            receivedDate: nextStatus === 'received' ? (doc.receivedDate || today) : ''
          };
        }
        return doc;
      })
    }));
  };

  const handleUpdateDocField = (docId, field, value) => {
    updateMeetingData((prev) => ({
      ...prev,
      requestedDocuments: (prev.requestedDocuments || []).map((doc) => {
        if (doc.id === docId) {
          return { ...doc, [field]: value };
        }
        return doc;
      })
    }));
  };

  const handleAddRequestedDoc = () => {
    if (!newDocTitle.trim()) return;
    const newDoc = {
      id: `DOC-${Date.now().toString().slice(-4)}`,
      title: newDocTitle.trim(),
      status: 'pending',
      receivedDate: '',
      notes: newDocNotes.trim()
    };
    updateMeetingData((prev) => ({
      ...prev,
      requestedDocuments: [...(prev.requestedDocuments || []), newDoc]
    }));
    setNewDocTitle('');
    setNewDocNotes('');
  };

  const handleRemoveRequestedDoc = (docId) => {
    updateMeetingData((prev) => ({
      ...prev,
      requestedDocuments: (prev.requestedDocuments || []).filter((doc) => doc.id !== docId)
    }));
  };

  // Load DLA Template
  const handleLoadDlaOpeningMeeting = () => {
    updateMeetingData((prev) => ({
      ...prev,
      meetingDate: '2568-10-15',
      meetingTime: DLA_OPENING_MEETING_DATA.time || '09:30 น.',
      meetingLocation: DLA_OPENING_MEETING_DATA.location || 'ห้องประชุมกองคลัง',
      attendees: (DLA_OPENING_MEETING_DATA.attendees || []).map((a) => ({
        name: a.name,
        position: a.position,
        role: a.role || 'ผู้เข้าร่วมประชุม'
      })),
      agendas: (DLA_OPENING_MEETING_DATA.agendas || []).map((ag) => ({
        title: `${ag.agenda}: ${ag.title}`,
        details: ag.details
      }))
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    try {
      const meetingDate = meetingData.meetingDate || getTodayDate();
      const meetingTime = meetingData.meetingTime || '09:30 น.';
      const meetingLocation = meetingData.meetingLocation || '';
      const docRefNo = meetingData.docRefNo || `มท 0808/${selectedYear}/ว...`;
      const attendees = meetingData.attendees || [];
      const agendas = meetingData.agendas || [];
      const requestedDocs = meetingData.requestedDocuments || [];

      if (activeSubTab === 'notice') {
        exportThaiMemoToWord({
          agency: `หน่วยตรวจสอบภายใน ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}`,
          phone: orgProfile?.phone || '',
          docNumber: toThaiDigits(docRefNo),
          docDate: formatSarabanDate(meetingDate),
          subject: `ขอเชิญร่วมประชุมเปิดการตรวจสอบ (Opening Meeting) โครงการ ${currentPlan.projectName}`,
          to: `ผู้อำนวยการ${currentPlan.department || 'หน่วยรับตรวจ'}`,
          contentParagraphs: [
            `๑. เรื่องเดิม: ตามที่ นายก${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} ได้อนุมัติแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. ${toThaiDigits(selectedYear)} เรียบร้อยแล้วนั้น`,
            `๒. ข้อเท็จจริง: หน่วยตรวจสอบภายใน กำหนดจะเข้าปฏิบัติงานตรวจสอบโครงการ ${currentPlan.projectName} จึงขอเชิญท่านและเจ้าหน้าที่ผู้เกี่ยวข้องร่วมประชุมเปิดการตรวจสอบ (Opening Meeting) ในวันที่ ${formatSarabanDate(meetingDate)} เวลา ${toThaiDigits(meetingTime)} ณ ${meetingLocation}`,
            `๓. ข้อพิจารณาและข้อเสนอ: ในการประชุมดังกล่าวจะมีการชี้แจงวัตถุประสงค์ ขอบเขต และขั้นตอนการตรวจสอบ รวมถึงการประสานงานขอรับเอกสารหลักฐานที่เกี่ยวข้อง เพื่อสร้างความเข้าใจร่วมกัน จึงเรียนมาเพื่อโปรดเข้าร่วมประชุมตามกำหนดเวลาดังกล่าว\n\nจึงเรียนมาเพื่อโปรดพิจารณา`
          ],
          signatoryName: effectiveAuditorName,
          signatoryPosition: effectiveAuditorPosition,
          signatoryRole: 'หัวหน้าทีมตรวจสอบ',
          palatReviewText: 'ทราบและเห็นควรแจ้งหน่วยรับตรวจเข้าร่วมประชุม',
          executiveOrderText: 'ทราบ มอบหมายหน่วยรับตรวจเข้าร่วมประชุมตามกำหนด',
          orgName: orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น',
          fileName: `หนังสือเชิญประชุมเปิดตรวจ_${currentPlan.id || 'PLAN'}_${orgProfile?.name || 'อปท'}`
        });
      } else {
        const attendeesHtml = attendees
          .map(
            (a, i) =>
              `<tr><td style="text-align: center; border: 1pt solid #000; padding: 4pt;">${i + 1}</td><td style="border: 1pt solid #000; padding: 4pt; font-weight: bold;">${a.name}</td><td style="border: 1pt solid #000; padding: 4pt;">${a.position}</td><td style="border: 1pt solid #000; padding: 4pt;">${a.role}</td></tr>`
          )
          .join('');

        const docsHtml = requestedDocs
          .map(
            (d, i) =>
              `<tr><td style="text-align: center; border: 1pt solid #000; padding: 4pt;">${i + 1}</td><td style="border: 1pt solid #000; padding: 4pt;">${d.title}</td><td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${d.status === 'received' ? 'ได้รับแล้ว' : 'รอส่งมอบ'}</td><td style="border: 1pt solid #000; padding: 4pt;">${d.notes || '-'}</td></tr>`
          )
          .join('');

        const agendasHtml = agendas
          .map(
            (ag) => `
          <div style="margin-bottom: 10pt;">
            <p style="font-weight: bold; margin: 0 0 2pt 0;">${ag.title}</p>
            <p style="text-indent: 1.5cm; margin: 0; text-align: justify;">${ag.details}</p>
          </div>
        `
          )
          .join('');

        const content = `
          <div style="text-align: center; margin-bottom: 16pt;">
            <h2 style="font-size: 18pt; font-weight: bold; margin: 0;">รายงานการประชุมเปิดการตรวจสอบ (Opening Meeting)</h2>
            <div style="font-size: 16pt; font-weight: bold; margin-top: 4pt;">โครงการ: ${currentPlan.projectName}</div>
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

          <h3 style="font-size: 15pt; font-weight: bold; margin-bottom: 6pt;">รายการเอกสารหลักฐานที่ขอรับตรวจ</h3>
          <table class="table-bordered" style="width: 100%; border: 1pt solid #000; border-collapse: collapse; font-size: 13pt; margin-bottom: 14pt;">
            <thead>
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <th style="border: 1pt solid #000; padding: 4pt; width: 8%;">ที่</th>
                <th style="border: 1pt solid #000; padding: 4pt; width: 50%;">รายการเอกสาร</th>
                <th style="border: 1pt solid #000; padding: 4pt; width: 20%;">สถานะการรับมอบ</th>
                <th style="border: 1pt solid #000; padding: 4pt; width: 22%;">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${docsHtml}
            </tbody>
          </table>

          <h3 style="font-size: 15pt; font-weight: bold; margin-bottom: 6pt;">สาระสำคัญและวาระการประชุม</h3>
          <div style="font-size: 14pt; line-height: 1.4;">
            ${agendasHtml}
          </div>

          <div style="margin-top: 30pt; text-align: right; padding-right: 40pt;">
            <p style="margin: 0;">(ลงชื่อ)........................................................ผู้บันทึกรายงานการประชุม</p>
            <p style="margin: 4pt 0 0 0; font-weight: bold;">(${effectiveAuditorName})</p>
            <p style="margin: 2pt 0 0 0;">${effectiveAuditorPosition}</p>
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
      const attendees = meetingData.attendees || [];
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

  const attendees = meetingData.attendees || [];
  const requestedDocs = meetingData.requestedDocuments || [];
  const agendas = meetingData.agendas || [];

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        title="การประชุมเปิดการตรวจสอบ (Opening Meeting)"
        orgName={orgProfile?.name}
        auditorName={`ผู้ตรวจสอบ: ${effectiveAuditorName}`}
        year={selectedYear}
      />

      {/* Select Project & Action Controls Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 sm:p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-300 shrink-0">
              โครงการ / แผน:
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold max-w-sm text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer truncate"
            >
              {combinedPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.typeLabel}] {p.projectName} ({p.department})
                </option>
              ))}
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
            wordSubtitle={`รายงานการประชุมเปิดตรวจโครงการ ${currentPlan.projectName} (คู่มือ สถ. หน้า ๕๐)`}
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
              โครงการ: {currentPlan.projectName}
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
                value={meetingData.meetingDate || ''}
                onChange={(e) => updateMeetingData({ meetingDate: e.target.value })}
                className="bg-transparent font-bold print:border-none text-stone-850 dark:text-stone-100"
              />
            </div>
            <div>
              <span className="text-stone-400 font-medium">เวลา: </span>
              <input
                type="text"
                value={meetingData.meetingTime || ''}
                onChange={(e) => updateMeetingData({ meetingTime: e.target.value })}
                className="bg-transparent font-bold w-24 print:border-none text-stone-850 dark:text-stone-100"
              />
            </div>
            <div>
              <span className="text-stone-400 font-medium">สถานที่: </span>
              <input
                type="text"
                value={meetingData.meetingLocation || ''}
                onChange={(e) => updateMeetingData({ meetingLocation: e.target.value })}
                className="bg-transparent font-bold w-full print:border-none text-stone-850 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-2">
              <Users className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>ผู้เข้าร่วมการประชุม ({attendees.length} ท่าน)</span>
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
                          className="text-stone-300 hover:text-rose-500 cursor-pointer"
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

          {/* Requested Documents Checklist Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>รายการเอกสาร/หลักฐานที่ขอรับตรวจ (Requested Documents Checklist)</span>
              </h3>
              <span className="text-xs text-stone-500">
                ได้รับแล้ว {requestedDocs.filter((d) => d.status === 'received').length} / {requestedDocs.length} รายการ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
                <thead className="bg-stone-100/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">สถานะ</th>
                    <th className="py-2.5 px-3">รายการเอกสารที่ขอ</th>
                    <th className="py-2.5 px-3 w-36">วันที่รับมอบ</th>
                    <th className="py-2.5 px-3">หมายเหตุ / ขอบเขต</th>
                    <th className="py-2.5 px-3 w-12 print:hidden text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {requestedDocs.map((doc, idx) => {
                    const isReceived = doc.status === 'received';
                    return (
                      <tr
                        key={doc.id || idx}
                        className={`transition-colors ${
                          isReceived
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/50'
                            : 'hover:bg-stone-50/80 dark:hover:bg-stone-800/40'
                        }`}
                      >
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleDocStatus(doc.id)}
                            className="cursor-pointer inline-flex items-center justify-center p-0.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                            title={isReceived ? 'คลิกเพื่อเปลี่ยนเป็น รอส่งมอบ' : 'คลิกเพื่อเปลี่ยนเป็น ได้รับแล้ว'}
                          >
                            {isReceived ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-400 hover:text-stone-600" />
                            )}
                          </button>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={doc.title}
                            onChange={(e) => handleUpdateDocField(doc.id, 'title', e.target.value)}
                            className={`w-full bg-transparent font-medium border-b border-transparent focus:border-amber-400 outline-none ${
                              isReceived ? 'line-through text-stone-500' : 'text-stone-900 dark:text-stone-100'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="date"
                            value={doc.receivedDate || ''}
                            onChange={(e) => handleUpdateDocField(doc.id, 'receivedDate', e.target.value)}
                            disabled={!isReceived}
                            className="w-full bg-transparent text-stone-700 dark:text-stone-300 font-medium text-xs disabled:opacity-40"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={doc.notes || ''}
                            placeholder="ระบุช่วงเวลาหรือหมายเหตุ..."
                            onChange={(e) => handleUpdateDocField(doc.id, 'notes', e.target.value)}
                            className="w-full bg-transparent text-stone-600 dark:text-stone-400 border-b border-transparent focus:border-amber-400 outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-center print:hidden">
                          <button
                            onClick={() => handleRemoveRequestedDoc(doc.id)}
                            className="text-stone-300 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Document Request Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
              <input
                type="text"
                placeholder="ระบุเอกสาร/หลักฐานที่ขอรับตรวจเพิ่ม..."
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex-2 min-w-[200px] text-stone-850 dark:text-stone-100"
              />
              <input
                type="text"
                placeholder="หมายเหตุ / เงื่อนไข (เช่น สุ่มตรวจย้อนหลัง 3 เดือน)..."
                value={newDocNotes}
                onChange={(e) => setNewDocNotes(e.target.value)}
                className="text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex-1 min-w-[160px] text-stone-850 dark:text-stone-100"
              />
              <button
                onClick={handleAddRequestedDoc}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ขอเอกสารเพิ่ม</span>
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
                      updateMeetingData({ agendas: updated });
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
              <div>({effectiveAuditorName})<br />ตำแหน่ง {effectiveAuditorPosition}</div>
            </div>
            <div className="space-y-12">
              <div>ลงชื่อ........................................................หัวหน้าหน่วยรับตรวจ</div>
              <div>(........................................................)<br />ผู้อำนวยการ{currentPlan.department || 'หน่วยรับตรวจ'}</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: OFFICIAL NOTICE MEMO */}
      {activeSubTab === 'notice' && (
        <OfficialThaiMemo
          agency={`หน่วยตรวจสอบภายใน ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}`}
          phone={orgProfile?.phone || ''}
          docNumber={meetingData.docRefNo || `มท 0808/${selectedYear}/ว...`}
          date={meetingData.meetingDate || getTodayDate()}
          subject={`ขอเชิญร่วมประชุมเปิดการตรวจสอบ (Opening Meeting) ภารกิจ "${currentPlan.projectName}"`}
          to={`ผู้อำนวยการ${currentPlan.department || 'หน่วยรับตรวจ'}`}
          signatory={{
            name: effectiveAuditorName,
            position: effectiveAuditorPosition,
            role: 'หัวหน้าทีมตรวจสอบ'
          }}
          showReviewBoxes={false}
        >
          <p style={{ textIndent: '2.5cm' }} className="m-0 text-justify">
            {toThaiDigits(`๑. เรื่องเดิม: ตามที่ นายก${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} ได้อนุมัติแผนการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. ${selectedYear} เรียบร้อยแล้วนั้น หน่วยตรวจสอบภายในมีกำหนดเข้าปฏิบัติงานตรวจสอบในภารกิจ "${currentPlan.projectName}" สังกัด${currentPlan.department || 'หน่วยรับตรวจ'} ตั้งแต่วันที่ ${meetingData.meetingDate || getTodayDate()} เป็นต้นไป`)}
          </p>
          <p style={{ textIndent: '2.5cm' }} className="m-0 text-justify">
            {toThaiDigits(`๒. ข้อเท็จจริง: ในการนี้ เพื่อให้การตรวจสอบเป็นไปด้วยความเรียบร้อยและมีประสิทธิภาพ จึงขอความร่วมมือท่านจัดเตรียมเอกสารหลักฐานที่เกี่ยวข้อง และขอเชิญร่วมประชุมเปิดการตรวจสอบ (Opening Meeting) ในวันที่ ${meetingData.meetingDate || getTodayDate()} เวลา ${meetingData.meetingTime || '09:30 น.'} ณ ${meetingData.meetingLocation || ''}`)}
          </p>
          <p style={{ textIndent: '2.5cm' }} className="m-0 text-justify">
            {toThaiDigits(`๓. ข้อพิจารณา: จึงเรียนมาเพื่อโปรดทราบและเข้าร่วมการประชุมเปิดการตรวจสอบตามวัน เวลา และสถานที่ดังกล่าวข้างต้น`)}
          </p>
        </OfficialThaiMemo>
      )}
    </div>
  );
}
