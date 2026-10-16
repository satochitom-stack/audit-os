import React, { useState, useEffect, useMemo } from 'react';
import PageHeaderBanner from './PageHeaderBanner';
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
  ArrowRight,
  Award
} from 'lucide-react';
import { DLA_CLOSING_MEETING_DATA } from '../data/dlaStandardTemplates';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDocumentToWord, exportDataToExcel } from '../utils/documentExportUtils';
import { toThaiDigits, formatSarabanDate } from '../utils/sarabanUtils';
import {
  loadClosingMeeting,
  saveClosingMeeting,
  extractFindingsFromWorkingPapers,
  createInitialClosingMeeting
} from '../utils/meetingSyncUtils';
import { getTodayDate } from '../utils/followupSyncUtils';

export default function ClosingMeetingView({
  selectedYear = '2569',
  orgProfile = {},
  annualPlans = [],
  engagementPlans = [],
  workingPapers = [],
  session = null,
  onNavigateToTab
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

  // Persistent closing meeting data state scoped by (selectedYear, currentPlan.id)
  const [meetingData, setMeetingData] = useState(() => {
    return loadClosingMeeting(selectedYear, currentPlan, workingPapers, {
      auditorName: effectiveAuditorName,
      auditorPosition: effectiveAuditorPosition,
      year: selectedYear
    });
  });

  // Reload when plan or year changes
  useEffect(() => {
    if (currentPlan) {
      const loaded = loadClosingMeeting(selectedYear, currentPlan, workingPapers, {
        auditorName: effectiveAuditorName,
        auditorPosition: effectiveAuditorPosition,
        year: selectedYear
      });
      setMeetingData(loaded);
    }
  }, [selectedYear, selectedPlanId]);

  // Save helper
  const updateMeetingData = (updater) => {
    setMeetingData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (currentPlan?.id) {
        saveClosingMeeting(selectedYear, currentPlan.id, next);
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

  // Findings management
  const [newFinding, setNewFinding] = useState({
    topic: '',
    condition: '',
    criteria: '',
    auditeeFeedback: '',
    agreement: ''
  });

  const handleAddFinding = () => {
    if (!newFinding.topic.trim()) return;
    const item = {
      id: `FIND-${Date.now().toString().slice(-4)}`,
      topic: newFinding.topic.trim(),
      condition: newFinding.condition.trim(),
      criteria: newFinding.criteria.trim(),
      auditeeFeedback: newFinding.auditeeFeedback.trim() || 'ยอมรับข้อตรวจพบและพร้อมปรับปรุงแก้ไข',
      agreement: newFinding.agreement.trim() || 'ตกลงดำเนินการปรับปรุงแก้ไขตามข้อเสนอแนะ',
      status: 'เห็นชอบร่วมกัน'
    };
    updateMeetingData((prev) => ({
      ...prev,
      findings: [...(prev.findings || []), item]
    }));
    setNewFinding({
      topic: '',
      condition: '',
      criteria: '',
      auditeeFeedback: '',
      agreement: ''
    });
  };

  const handleUpdateFinding = (findingId, field, value) => {
    updateMeetingData((prev) => ({
      ...prev,
      findings: (prev.findings || []).map((f) => {
        if (f.id === findingId) {
          return { ...f, [field]: value };
        }
        return f;
      })
    }));
  };

  const handleRemoveFinding = (findingId) => {
    updateMeetingData((prev) => ({
      ...prev,
      findings: (prev.findings || []).filter((f) => f.id !== findingId)
    }));
  };

  // Load DLA Template
  const handleLoadDlaClosingMeeting = () => {
    const dlaFindings = (DLA_CLOSING_MEETING_DATA.findingsSummary || []).map((f, idx) => ({
      id: `FIND-DLA-${idx + 1}`,
      topic: f.issue,
      condition: f.detail,
      criteria: 'ระเบียบ มท. ว่าด้วยการรับเงินฯ พ.ศ. 2547 และที่แก้ไขเพิ่มเติม ข้อ 12',
      auditeeFeedback: f.auditeeExplanation,
      agreement: f.agreedResolution,
      status: 'เห็นชอบร่วมกัน'
    }));

    updateMeetingData((prev) => ({
      ...prev,
      meetingDate: '2568-11-29',
      meetingTime: DLA_CLOSING_MEETING_DATA.time || '14.00 น.',
      meetingLocation: DLA_CLOSING_MEETING_DATA.location || 'ห้องประชุมกองคลัง',
      findings: dlaFindings,
      conclusion: 'การประชุมปิดการตรวจสอบดำเนินไปด้วยความเรียบร้อย หน่วยรับตรวจยินดีนำข้อเสนอแนะไปปรับปรุงการปฏิบัติงาน',
      nextSteps: 'ผู้ตรวจสอบภายในจะนำข้อตกลงไปจัดทำรายงานผลการตรวจสอบภายในฉบับสมบูรณ์เสนอผู้บริหารเพื่อโปรดสั่งการต่อไป'
    }));
  };

  // Pull findings from working papers scoped to current plan
  const handlePullFindingsFromWorkingPapers = () => {
    const planFindings = extractFindingsFromWorkingPapers(workingPapers, currentPlan.id);

    if (planFindings.length > 0) {
      updateMeetingData((prev) => {
        const existingIds = new Set((prev.findings || []).map((f) => f.wpId || f.id));
        const newItems = planFindings.filter((pf) => !existingIds.has(pf.wpId || pf.id));
        return {
          ...prev,
          findings: [...(prev.findings || []), ...newItems]
        };
      });
      alert(`ดึงข้อตรวจพบจากกระดาษทำการของโครงการ ${currentPlan.projectName} เรียบร้อยแล้ว (${planFindings.length} รายการ)`);
      return;
    }

    // Fallback: check if there are any working papers with findings across other plans
    const allFindings = extractFindingsFromWorkingPapers(workingPapers, null);
    if (allFindings.length > 0) {
      const confirmAll = window.confirm(
        `ไม่พบข้อตรวจพบที่ระบุรหัสโครงการ ${currentPlan.id} โดยตรง แต่พบข้อตรวจพบในกระดาษทำการอื่นจำนวน ${allFindings.length} รายการ ท่านต้องการนำเข้าข้อตรวจพบทั้งหมดหรือไม่?`
      );
      if (confirmAll) {
        updateMeetingData((prev) => {
          const existingIds = new Set((prev.findings || []).map((f) => f.wpId || f.id));
          const newItems = allFindings.filter((pf) => !existingIds.has(pf.wpId || pf.id));
          return {
            ...prev,
            findings: [...(prev.findings || []), ...newItems]
          };
        });
        alert(`ดึงข้อตรวจพบจากกระดาษทำการเรียบร้อยแล้ว (${allFindings.length} รายการ)`);
      }
    } else {
      alert('ยังไม่พบข้อตรวจพบที่บันทึกไว้ในกระดาษทำการ (ขั้นที่ 6) กรุณาบันทึกข้อตรวจพบในกระดาษทำการก่อน หรือกดโหลดตัวอย่าง สถ.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    const orgName = toThaiDigits(orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น');
    const projName = toThaiDigits(currentPlan.projectName);
    const deptName = toThaiDigits(currentPlan.department || 'หน่วยรับตรวจ');
    const auditorName = toThaiDigits(effectiveAuditorName);
    const auditorPos = toThaiDigits(effectiveAuditorPosition);
    const meetingDate = meetingData.meetingDate || getTodayDate();
    const meetingTime = meetingData.meetingTime || '13:30 น.';
    const meetingLocation = meetingData.meetingLocation || '';
    const attendees = meetingData.attendees || [];
    const findings = meetingData.findings || [];

    const attendeesHtml = attendees
      .map(
        (a, i) =>
          `<li>${toThaiDigits(i + 1)}. ${toThaiDigits(a.name)} ตำแหน่ง ${toThaiDigits(a.position)} (${toThaiDigits(a.role)})</li>`
      )
      .join('');

    const bodyContent = `
      <div style="text-align: center; margin-bottom: 16pt;">
        <p style="margin: 0; font-size: 20pt; font-weight: bold; font-family: 'TH Sarabun PSK';">รายงานการประชุมปิดการตรวจสอบ (Closing Meeting Minutes)</p>
        <p style="margin: 4pt 0 0 0; font-size: 16pt; font-weight: bold; font-family: 'TH Sarabun PSK';">โครงการ: ${projName}</p>
        <p style="margin: 2pt 0 0 0; font-size: 16pt; font-family: 'TH Sarabun PSK';">หน่วยรับตรวจ: ${deptName} ${orgName}</p>
        <p style="margin: 2pt 0 0 0; font-size: 16pt; font-family: 'TH Sarabun PSK';">ประจำปีงบประมาณ พ.ศ. ${toThaiDigits(selectedYear)}</p>
      </div>
      <div style="border-top: 1pt solid black; margin-bottom: 14pt;"></div>

      <table style="width: 100%; border: none; font-size: 16pt; font-family: 'TH Sarabun PSK'; margin-bottom: 12pt;">
        <tr>
          <td style="width: 50%;"><strong>วัน/เดือน/ปี ที่ประชุม:</strong> ${formatSarabanDate(meetingDate, { isExternal: true })}</td>
          <td style="width: 50%;"><strong>เวลา:</strong> ${toThaiDigits(meetingTime)}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>สถานที่ประชุม:</strong> ${toThaiDigits(meetingLocation)}</td>
        </tr>
      </table>

      <p style="font-size: 16pt; font-weight: bold; font-family: 'TH Sarabun PSK'; margin-bottom: 4pt;">ผู้เข้าร่วมประชุม:</p>
      <ul style="margin-top: 0; margin-left: 20pt; font-size: 16pt; font-family: 'TH Sarabun PSK'; list-style-type: none; padding-left: 0;">
        ${attendeesHtml || `<li>๑. ${auditorName} ตำแหน่ง ${auditorPos} (ผู้ตรวจสอบภายใน)</li><li>๒. หัวหน้าหน่วยรับตรวจ และเจ้าหน้าที่ผู้รับผิดชอบงาน (${deptName})</li>`}
      </ul>

      <p style="font-size: 16pt; font-weight: bold; font-family: 'TH Sarabun PSK'; margin-top: 12pt; margin-bottom: 4pt;">วาระการประชุมและสรุปประเด็นข้อตรวจพบเบื้องต้น:</p>
      <p style="text-indent: 2.5cm; font-size: 16pt; font-family: 'TH Sarabun PSK'; line-height: 1.35; margin-bottom: 8pt; text-align: justify;">
        ผู้ตรวจสอบภายในได้ชี้แจงวัตถุประสงค์ของการประชุมปิดการตรวจสอบ เพื่อนำเสนอข้อเท็จจริงและข้อตรวจพบเบื้องต้นที่ได้จากการปฏิบัติงานตรวจสอบ พร้อมทั้งรับฟังคำชี้แจงและเหตุผลความจำเป็นจากหน่วยรับตรวจ เพื่อสร้างความเข้าใจที่ถูกต้องตรงกันและร่วมกันกำหนดแนวทางแก้ไขปรับปรุงที่เป็นไปได้ในทางปฏิบัติ ดังนี้
      </p>

      ${findings
        .map(
          (f, i) => `
      <div style="margin-bottom: 12pt; padding: 8pt; border: 1pt solid #ccc; font-family: 'TH Sarabun PSK';">
        <p style="margin: 0 0 4pt 0; font-size: 16pt; font-weight: bold;">ประเด็นที่ ${toThaiDigits(i + 1)}: ${toThaiDigits(f.topic)}</p>
        <p style="margin: 2pt 0; font-size: 16pt;"><strong>สภาพที่ตรวจพบ (Condition):</strong> ${toThaiDigits(f.condition || '-')}</p>
        <p style="margin: 2pt 0; font-size: 16pt;"><strong>เกณฑ์มาตรฐาน (Criteria):</strong> ${toThaiDigits(f.criteria || '-')}</p>
        <p style="margin: 2pt 0; font-size: 16pt;"><strong>คำชี้แจงของหน่วยรับตรวจ (Auditee Feedback):</strong> ${toThaiDigits(f.auditeeFeedback || '-')}</p>
        <p style="margin: 2pt 0; font-size: 16pt; color: #047857;"><strong>ข้อตกลงแนวทางแก้ไขร่วมกัน (Agreed Action):</strong> ${toThaiDigits(f.agreement || '-')}</p>
      </div>
      `
        )
        .join('')}

      <p style="text-indent: 2.5cm; font-size: 16pt; font-family: 'TH Sarabun PSK'; line-height: 1.35; margin-top: 14pt; margin-bottom: 8pt; text-align: justify;">
        <strong>ข้อสรุปการประชุม:</strong> ${toThaiDigits(meetingData.conclusion || 'การประชุมปิดการตรวจสอบดำเนินไปด้วยความเรียบร้อย หน่วยรับตรวจรับทราบและเห็นชอบร่วมกันในข้อตรวจพบเบื้องต้น')}
      </p>

      <p style="text-indent: 2.5cm; font-size: 16pt; font-family: 'TH Sarabun PSK'; line-height: 1.35; margin-top: 4pt; margin-bottom: 24pt; text-align: justify;">
        <strong>การดำเนินการขั้นต่อไป:</strong> ${toThaiDigits(meetingData.nextSteps || 'ฝ่ายตรวจสอบภายในจะนำข้อเท็จจริงและคำชี้แจงดังกล่าวไปประกอบการยกร่างรายงานผลการตรวจสอบภายในฉบับสมบูรณ์ เพื่อเสนอผู้บริหารท้องถิ่นพิจารณาสั่งการต่อไป')}
      </p>

      <table style="width: 100%; border: none; margin-top: 30pt; font-size: 16pt; font-family: 'TH Sarabun PSK';">
        <tr>
          <td style="width: 50%; text-align: center;">
            <p style="margin: 0;">(ลงชื่อ)........................................................</p>
            <p style="margin: 4pt 0 0 0; font-weight: bold;">(${auditorName})</p>
            <p style="margin: 2pt 0 0 0;">${auditorPos}</p>
            <p style="margin: 2pt 0 0 0;">ผู้บันทึกรายงานการประชุม</p>
          </td>
          <td style="width: 50%; text-align: center;">
            <p style="margin: 0;">(ลงชื่อ)........................................................</p>
            <p style="margin: 4pt 0 0 0; font-weight: bold;">(........................................................)</p>
            <p style="margin: 2pt 0 0 0;">ผู้อำนวยการ${deptName}</p>
            <p style="margin: 2pt 0 0 0;">ผู้รับรองรายงานการประชุม</p>
          </td>
        </tr>
      </table>
    `;

    exportDocumentToWord({
      title: 'รายงานการประชุมปิดการตรวจสอบ',
      htmlContent: bodyContent,
      fileName: `รายงานการประชุมปิดการตรวจสอบ_${projName}_${selectedYear}.doc`
    });
  };

  const handleDownloadExcel = () => {
    const findings = meetingData.findings || [];
    const headers = [
      'ที่',
      'ประเด็นข้อตรวจพบ',
      'เกณฑ์อ้างอิง (Criteria)',
      'สภาพที่ตรวจพบ (Condition)',
      'คำชี้แจงหน่วยรับตรวจ (Feedback)',
      'ข้อตกลงแนวทางแก้ไข (Agreement)'
    ];
    const rows = findings.map((f, i) => [
      i + 1,
      f.topic || '',
      f.criteria || '',
      f.condition || '',
      f.auditeeFeedback || '',
      f.agreement || ''
    ]);
    const filename = `Closing_Meeting_Findings_${currentPlan.projectName || 'audit'}_${selectedYear}.xlsx`;
    exportDataToExcel({
      sheetName: 'ประเด็นปิดตรวจ',
      headers,
      rows,
      fileName: filename
    });
  };

  const findings = meetingData.findings || [];
  const attendees = meetingData.attendees || [];

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        title="การประชุมปิดการตรวจสอบและสรุปผลตรวจเบื้องต้น (Closing Meeting)"
        orgName={orgProfile?.name}
        auditorName={`ผู้ตรวจสอบ: ${effectiveAuditorName}`}
        year={selectedYear}
      />

      {/* Select Project Bar & Actions */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 sm:p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-stone-600 dark:text-stone-300 shrink-0">
            โครงการ / แผน:
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold max-w-sm text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer truncate"
          >
            {combinedPlans.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.typeLabel}] {p.projectName} ({p.department})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={handlePullFindingsFromWorkingPapers}
            className="bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="ดึงข้อตรวจพบจากกระดาษทำการ (ขั้นที่ 6) เข้าสู่วาระการประชุมปิดตรวจ"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>📥 ดึงจากกระดาษทำการ (ขั้น 6)</span>
          </button>
          <button
            onClick={handleLoadDlaClosingMeeting}
            className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="โหลดตัวอย่างรายงานการประชุมปิดการตรวจสอบตามคู่มือ สถ. หน้า 52"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>📥 โหลดตัวอย่าง สถ. (หน้า 52)</span>
          </button>
          <OfficialDocActionToolbar
            onDownloadWord={handleDownloadWord}
            wordTitle="รายงานการประชุมปิดการตรวจสอบ (.doc)"
            wordSubtitle={`รายงานการประชุมปิดตรวจและข้อตกลงร่วมกันโครงการ ${currentPlan.projectName}`}
            onDownloadExcel={handleDownloadExcel}
            excelTitle="ประเด็นข้อตรวจพบและข้อตกลง (.xlsx)"
            excelSubtitle="ตารางสรุป Criteria, Condition, คำชี้แจง และ Agreement"
            onPrint={handlePrint}
            pdfTitle="พิมพ์รายงานการประชุมปิดตรวจ / PDF"
            pdfSubtitle="พิมพ์รายงานการประชุมปิดการตรวจสอบและบันทึกข้อตกลง (A4)"
          />
        </div>
      </div>

      {/* Meeting Document Body */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        <div className="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            รายงานการประชุมปิดการตรวจสอบ (Closing Meeting Minutes)
          </h2>
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            โครงการ: {currentPlan.projectName}
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
              value={meetingData.meetingDate || ''}
              onChange={(e) => updateMeetingData({ meetingDate: e.target.value })}
              className="bg-transparent font-bold print:border-none"
            />
          </div>
          <div>
            <span className="text-slate-400 font-medium">เวลา: </span>
            <input
              type="text"
              value={meetingData.meetingTime || ''}
              onChange={(e) => updateMeetingData({ meetingTime: e.target.value })}
              className="bg-transparent font-bold w-24 print:border-none"
            />
          </div>
          <div>
            <span className="text-slate-400 font-medium">สถานที่: </span>
            <input
              type="text"
              value={meetingData.meetingLocation || ''}
              onChange={(e) => updateMeetingData({ meetingLocation: e.target.value })}
              className="bg-transparent font-bold w-full print:border-none"
            />
          </div>
        </div>

        {/* Attendees Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-2">
            <Users className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>ผู้เข้าร่วมการประชุมปิดตรวจ ({attendees.length} ท่าน)</span>
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
              placeholder="บทบาท (เช่น หัวหน้าหน่วยรับตรวจ)"
              value={newAttendee.role}
              onChange={(e) => setNewAttendee({ ...newAttendee, role: e.target.value })}
              className="text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 w-44 text-stone-850 dark:text-stone-100"
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

        {/* Preliminary Findings Discussion Cards */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>สรุปประเด็นข้อตรวจพบเบื้องต้นและข้อตกลงร่วมกัน ({findings.length} ประเด็น)</span>
            </h3>
          </div>

          <div className="space-y-4">
            {findings.map((f, idx) => (
              <div
                key={f.id || idx}
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
                    className="text-slate-300 hover:text-rose-500 print:hidden cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <div>
                      <div className="text-slate-400 font-bold mb-1">สภาพข้อเท็จจริงที่ตรวจพบ (Condition):</div>
                      <textarea
                        rows={3}
                        value={f.condition || ''}
                        onChange={(e) => handleUpdateFinding(f.id, 'condition', e.target.value)}
                        className="w-full text-slate-700 dark:text-slate-300 bg-transparent border-0 focus:ring-1 focus:ring-amber-500 rounded p-1 leading-relaxed"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] text-blue-600 font-medium mb-1">เกณฑ์อ้างอิง (Criteria):</div>
                      <input
                        type="text"
                        value={f.criteria || ''}
                        onChange={(e) => handleUpdateFinding(f.id, 'criteria', e.target.value)}
                        className="w-full text-xs text-slate-600 dark:text-slate-400 bg-transparent border-0 focus:ring-1 focus:ring-amber-500 rounded p-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                    <div>
                      <div className="text-emerald-800 dark:text-emerald-300 font-bold mb-1">คำชี้แจงของหน่วยรับตรวจ (Auditee Response):</div>
                      <textarea
                        rows={2}
                        value={f.auditeeFeedback || ''}
                        onChange={(e) => handleUpdateFinding(f.id, 'auditeeFeedback', e.target.value)}
                        placeholder="ระบุคำชี้แจงและเหตุผลความจำเป็นของหน่วยรับตรวจ..."
                        className="w-full text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 border border-emerald-200 dark:border-emerald-800 rounded p-1.5 leading-relaxed text-xs"
                      />
                    </div>
                    <div>
                      <div className="text-emerald-700 dark:text-emerald-400 font-bold mb-1">ข้อตกลงแนวทางแก้ไขร่วมกัน (Agreed Action):</div>
                      <textarea
                        rows={2}
                        value={f.agreement || ''}
                        onChange={(e) => handleUpdateFinding(f.id, 'agreement', e.target.value)}
                        placeholder="ระบุกรอบเวลาและแนวทางปรับปรุงแก้ไขที่ตกลงร่วมกัน..."
                        className="w-full text-emerald-900 dark:text-emerald-200 bg-white/70 dark:bg-slate-800/70 border border-emerald-200 dark:border-emerald-800 rounded p-1.5 leading-relaxed text-xs font-medium"
                      />
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

        {/* Conclusion & Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200">ข้อสรุปผลการประชุมปิดตรวจ:</label>
            <textarea
              rows={3}
              value={meetingData.conclusion || ''}
              onChange={(e) => updateMeetingData({ conclusion: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-stone-50/60 dark:bg-stone-850/40 text-slate-850 dark:text-stone-100 leading-relaxed outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200">การดำเนินการขั้นต่อไป:</label>
            <textarea
              rows={3}
              value={meetingData.nextSteps || ''}
              onChange={(e) => updateMeetingData({ nextSteps: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-stone-50/60 dark:bg-stone-850/40 text-slate-850 dark:text-stone-100 leading-relaxed outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
          <div className="space-y-12">
            <div>ลงชื่อ........................................................ผู้ตรวจสอบภายใน</div>
            <div>({effectiveAuditorName})<br />ตำแหน่ง {effectiveAuditorPosition}</div>
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
