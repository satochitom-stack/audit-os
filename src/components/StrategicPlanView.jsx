import React, { useState, useMemo, useEffect } from 'react';
import PageHeaderBanner from './PageHeaderBanner';
import {
  Calendar,
  Calculator,
  Building,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Award,
  Rocket,
  CheckSquare,
  Square,
  AlertCircle,
  X
} from 'lucide-react';
import { DLA_STRATEGIC_PLAN_3YEARS } from '../data/dlaStandardTemplates';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDataToExcel, exportThaiMemoToWord } from '../utils/documentExportUtils';
import {
  loadUnifiedStrategicPlan,
  saveUnifiedStrategicPlan,
  normalizeStrategicItem,
  getRollForwardCandidates,
  rollForwardToAnnualPlans
} from '../utils/strategicPlanUtils';

export default function StrategicPlanView({
  selectedYear = '2569',
  orgProfile = {},
  auditUniverse = [],
  annualPlans = [],
  setAnnualPlans,
  strategicPlan = [],
  setStrategicPlan,
  onNavigateToTab,
  session = null
}) {
  const isNonAdminUser = session?.role !== 'admin' && session?.username?.toLowerCase() !== 'admin';
  const effectiveAuditorName = isNonAdminUser
    ? (session?.displayName || (orgProfile?.auditorName && orgProfile.auditorName.toUpperCase() !== 'ADMIN' && !orgProfile.auditorName.includes('Super Admin') ? orgProfile.auditorName : 'ผู้ตรวจสอบภายใน'))
    : (orgProfile?.auditorName || session?.displayName || 'ผู้ดูแลระบบส่วนกลาง (Super Admin)');
  const effectiveAuditorPosition = isNonAdminUser
    ? (session?.position || (orgProfile?.auditorPosition && !orgProfile.auditorPosition.includes('Platform Root') && !orgProfile.auditorPosition.includes('ผู้ดูแลระบบ') ? orgProfile.auditorPosition : 'นักวิชาการตรวจสอบภายในปฏิบัติการ'))
    : (orgProfile?.auditorPosition || session?.position || 'ผู้ดูแลระบบระบบตรวจสอบภายใน (Platform Root)');

  const [activeTab, setActiveTab] = useState('three_year'); // 'manday', 'three_year'

  // Auditor Man-Day Capacity State
  const [auditorCount, setAuditorCount] = useState(1);
  const [grossWorkingDays, setGrossWorkingDays] = useState(220); // มาตรฐานวันทำการ 1 ปี
  const [leaveDays, setLeaveDays] = useState(15); // วันลาพักผ่อน/ป่วย/กิจ
  const [trainingDays, setTrainingDays] = useState(15); // วันฝึกอบรม/สัมมนา
  const [adminDays, setAdminDays] = useState(30); // งานสารบรรณ/วางแผน/ประชุม

  // Net Fieldwork Days per person
  const netFieldworkDaysPerAuditor = Math.max(0, grossWorkingDays - leaveDays - trainingDays - adminDays);
  const totalNetAuditCapacity = netFieldworkDaysPerAuditor * auditorCount;

  // 3-Year Strategic Distribution
  const currentBE = parseInt(selectedYear) || 2569;
  const year1 = currentBE;
  const year2 = currentBE + 1;
  const year3 = currentBE + 2;

  // Default Activities fallback
  const defaultActivities = useMemo(() => [
    { id: 'ST-01', name: 'การรับเงินและการนำส่งเงิน (e-LAAS)', department: 'กองคลัง', riskLevel: 'สูง', y1: true, y2: true, y3: true, manDays: 20 },
    { id: 'ST-02', name: 'การบัญชีและงบกระทบยอดเงินฝากธนาคาร', department: 'กองคลัง', riskLevel: 'สูง', y1: true, y2: true, y3: true, manDays: 25 },
    { id: 'ST-03', name: 'การจัดทำราคากลาง Factor F & ตรวจงานช่าง', department: 'กองช่าง', riskLevel: 'สูง', y1: true, y2: true, y3: true, manDays: 30 },
    { id: 'ST-04', name: 'การตรวจสอบพัสดุประจำปี & จำหน่ายพัสดุ', department: 'กองคลัง / ทุกกอง', riskLevel: 'ปานกลาง', y1: true, y2: false, y3: true, manDays: 15 },
    { id: 'ST-05', name: 'การเบิกจ่ายค่าเช่าบ้านข้าราชการ', department: 'กองคลัง / สำนักปลัด', riskLevel: 'ปานกลาง', y1: true, y2: true, y3: false, manDays: 15 },
    { id: 'ST-06', name: 'การใช้และรักษารถยนต์ส่วนกลางและน้ำมัน', department: 'สำนักปลัด', riskLevel: 'ปานกลาง', y1: false, y2: true, y3: true, manDays: 15 },
    { id: 'ST-07', name: 'เงินอาหารกลางวันโรงเรียน & ศูนย์พัฒนาเด็กเล็ก', department: 'กองการศึกษา', riskLevel: 'ปานกลาง', y1: true, y2: false, y3: true, manDays: 15 },
    { id: 'ST-08', name: 'เงินเบี้ยยังชีพผู้สูงอายุและคนพิการ', department: 'กองสวัสดิการสังคม', riskLevel: 'ต่ำ', y1: false, y2: true, y3: false, manDays: 10 },
    { id: 'ST-09', name: 'การบริหารสัญญาและหลักประกันสัญญา', department: 'กองคลัง', riskLevel: 'ปานกลาง', y1: true, y2: true, y3: false, manDays: 15 }
  ], []);

  // Unified Strategic Activities State
  const [strategicActivities, setStrategicActivities] = useState(() => {
    return loadUnifiedStrategicPlan(selectedYear, defaultActivities, session);
  });

  useEffect(() => {
    const loaded = loadUnifiedStrategicPlan(selectedYear, defaultActivities);
    setStrategicActivities(loaded);
  }, [selectedYear, session?.username]);

  const updateActivities = (newActivities) => {
    setStrategicActivities(newActivities);
    saveUnifiedStrategicPlan(newActivities, selectedYear, session);
    if (setStrategicPlan) {
      setStrategicPlan(newActivities);
    }
  };

  const toggleYear = (id, yearKey) => {
    const updated = strategicActivities.map((act) => {
      if (act.id === id) {
        const nextVal = !act[yearKey];
        const targetYr = yearKey === 'y1' ? String(year1) : yearKey === 'y2' ? String(year2) : String(year3);
        const nextYears = { ...(act.years || {}), [targetYr]: nextVal };
        return {
          ...act,
          [yearKey]: nextVal,
          years: nextYears
        };
      }
      return act;
    });
    updateActivities(updated);
  };

  const handleLoadDlaStrategicPlan = () => {
    const dlaActivities = [
      // ปี 1 (6 กิจกรรม - 200 คน-วัน)
      { id: 'DLA-ST-01', name: 'การรับเงินและนำส่งเงิน', department: 'กองคลัง', riskLevel: 'สูง', y1: true, y2: false, y3: false, manDays: 30 },
      { id: 'DLA-ST-02', name: 'การจัดทำบัญชีและรายงานการเงิน', department: 'กองคลัง', riskLevel: 'สูง', y1: true, y2: false, y3: false, manDays: 40 },
      { id: 'DLA-ST-03', name: 'การตรวจสอบพัสดุประจำปี', department: 'กองคลัง', riskLevel: 'สูง', y1: true, y2: false, y3: false, manDays: 30 },
      { id: 'DLA-ST-04', name: 'หลักประกันสัญญา', department: 'กองคลัง', riskLevel: 'สูง', y1: true, y2: false, y3: false, manDays: 30 },
      { id: 'DLA-ST-05', name: 'การเบิกจ่ายเงิน', department: 'กองคลัง', riskLevel: 'สูง', y1: true, y2: false, y3: false, manDays: 40 },
      { id: 'DLA-ST-06', name: 'การใช้และรักษารถยนต์', department: 'กองช่าง', riskLevel: 'สูง', y1: true, y2: false, y3: false, manDays: 30 },
      // ปี 2 (5 กิจกรรม - 180 คน-วัน)
      { id: 'DLA-ST-07', name: 'การใช้และรักษารถยนต์', department: 'สำนักปลัด', riskLevel: 'ปานกลาง', y1: false, y2: true, y3: false, manDays: 35 },
      { id: 'DLA-ST-08', name: 'การโอนและแก้ไขเปลี่ยนแปลงงบประมาณ', department: 'สำนักปลัด', riskLevel: 'ปานกลาง', y1: false, y2: true, y3: false, manDays: 35 },
      { id: 'DLA-ST-09', name: 'การจัดทำงบประมาณรายจ่ายประจำปี', department: 'สำนักปลัด', riskLevel: 'ปานกลาง', y1: false, y2: true, y3: false, manDays: 35 },
      { id: 'DLA-ST-10', name: 'การรับ-จ่ายและเก็บรักษาพัสดุ', department: 'กองคลัง', riskLevel: 'ปานกลาง', y1: false, y2: true, y3: false, manDays: 35 },
      { id: 'DLA-ST-11', name: 'การขออนุญาตปลูกสร้างอาคาร ดัดแปลง รื้อถอนอาคาร', department: 'กองช่าง', riskLevel: 'ปานกลาง', y1: false, y2: true, y3: false, manDays: 40 },
      // ปี 3 (5 กิจกรรม - 190 คน-วัน)
      { id: 'DLA-ST-12', name: 'การปฏิบัติงานสารบรรณและธุรการ', department: 'สำนักปลัด', riskLevel: 'ต่ำ', y1: false, y2: false, y3: true, manDays: 35 },
      { id: 'DLA-ST-13', name: 'การจัดทำแผนพัฒนาท้องถิ่น', department: 'สำนักปลัด', riskLevel: 'ต่ำ', y1: false, y2: false, y3: true, manDays: 40 },
      { id: 'DLA-ST-14', name: 'การเก็บรักษาเงิน และการนำเงินฝากบัญชีธนาคาร', department: 'กองคลัง', riskLevel: 'ต่ำ', y1: false, y2: false, y3: true, manDays: 45 },
      { id: 'DLA-ST-15', name: 'การปฏิบัติงานสารบรรณและธุรการ', department: 'กองคลัง', riskLevel: 'ต่ำ', y1: false, y2: false, y3: true, manDays: 35 },
      { id: 'DLA-ST-16', name: 'การปฏิบัติงานสารบรรณและธุรการ', department: 'กองช่าง', riskLevel: 'ต่ำ', y1: false, y2: false, y3: true, manDays: 35 }
    ];
    const normalized = dlaActivities.map((a) => normalizeStrategicItem(a, selectedYear));
    updateActivities(normalized);
    alert('โหลดแผนการตรวจสอบระยะยาว 3 ปี (16 กิจกรรม 590 คน-วัน ตามคู่มือ สถ.) เรียบร้อยแล้ว');
  };

  // Planned days sum for Year 1
  const y1TotalDays = strategicActivities
    .filter((a) => a.y1)
    .reduce((sum, a) => sum + (a.manDays || 0), 0);

  // Roll-Forward to Annual Plan State
  const [showRollForwardModal, setShowRollForwardModal] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [rollForwardNotification, setRollForwardNotification] = useState(null);

  const rollForwardCandidates = useMemo(() => {
    return getRollForwardCandidates(strategicActivities, selectedYear, annualPlans);
  }, [strategicActivities, selectedYear, annualPlans]);

  const handleOpenRollForwardModal = () => {
    // Default select all candidates that are scheduled and not already in annual plans
    const availableToSelect = rollForwardCandidates
      .filter((c) => c.canRollForward)
      .map((c) => c.strategicId);
    setSelectedCandidateIds(availableToSelect);
    setShowRollForwardModal(true);
  };

  const handleToggleCandidateSelect = (stratId) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(stratId) ? prev.filter((id) => id !== stratId) : [...prev, stratId]
    );
  };

  const handleExecuteRollForward = () => {
    if (!setAnnualPlans) {
      alert('ไม่พบฟังก์ชันอัปเดตแผนประจำปี');
      return;
    }

    const result = rollForwardToAnnualPlans(
      rollForwardCandidates,
      selectedCandidateIds,
      annualPlans,
      selectedYear,
      { auditorName: effectiveAuditorName }
    );

    setAnnualPlans(result.updatedAnnualPlans);
    setShowRollForwardModal(false);
    setRollForwardNotification({
      count: result.addedCount,
      message: `นำเข้ากิจกรรมจากแผนระยะยาวสู่ร่างแผนประจำปี พ.ศ. ${selectedYear} จำนวน ${result.addedCount} โครงการเรียบร้อยแล้ว`
    });
  };

  // Handlers for exporting Word (.doc) and Excel (.xlsx)
  const handleDownloadExcel = () => {
    try {
      const headers = [
        'รหัส',
        'กิจกรรมที่ตรวจสอบ',
        'สำนัก/กอง',
        'ระดับความเสี่ยง',
        `ปีที่ 1 (พ.ศ. ${year1})`,
        `ปีที่ 2 (พ.ศ. ${year2})`,
        `ปีที่ 3 (พ.ศ. ${year3})`,
        'จำนวนคน-วัน'
      ];
      const rows = strategicActivities.map((act) => [
        act.id,
        act.name,
        act.department,
        act.riskLevel,
        act.y1 ? '✓' : '-',
        act.y2 ? '✓' : '-',
        act.y3 ? '✓' : '-',
        act.manDays || 0
      ]);
      rows.push([
        '',
        'รวมอัตรากำลังคน-วันตลอดแผน 3 ปี',
        '',
        '',
        strategicActivities.filter((a) => a.y1).reduce((s, a) => s + (a.manDays || 0), 0) + ' คน-วัน',
        strategicActivities.filter((a) => a.y2).reduce((s, a) => s + (a.manDays || 0), 0) + ' คน-วัน',
        strategicActivities.filter((a) => a.y3).reduce((s, a) => s + (a.manDays || 0), 0) + ' คน-วัน',
        strategicActivities.reduce((s, a) => s + (a.manDays || 0), 0) + ' คน-วัน'
      ]);

      exportDataToExcel({
        sheetName: `แผน 3 ปี_${year1}-${year3}`,
        headers,
        rows,
        fileName: `แผนการตรวจสอบระยะยาว_3ปี_พศ_${year1}_${year3}_${orgProfile?.name || 'อปท'}`,
        colWidths: [12, 38, 20, 16, 16, 16, 16, 16]
      });
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด Excel');
    }
  };

  const handleDownloadWord = () => {
    try {
      exportThaiMemoToWord({
        agency: `หน่วยตรวจสอบภายใน ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}`,
        phone: orgProfile?.phone || '',
        docNumber: orgProfile?.docCode ? `${orgProfile.docCode}/แผน๓ปี` : 'อบ ๗๘๔๐๘/แผน๓ปี',
        docDate: `๒๙ สิงหาคม ๒๕๖๘`,
        subject: `ขออนุมัติแผนการตรวจสอบระยะยาว (๓ ปี) ประจำปีงบประมาณ พ.ศ. ${year1} - ${year3}`,
        to: `นายก${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} (ผ่าน ปลัด${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'})`,
        contentParagraphs: [
          `<strong>๑. เรื่องเดิม:</strong> ตามระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. ๒๕๔๕ กำหนดให้หน่วยตรวจสอบภายในต้องจัดทำแผนการตรวจสอบระยะยาว เพื่อให้ครอบคลุมกิจกรรมสำคัญของทุกหน่วยรับตรวจในจักรวาลการตรวจสอบ (Audit Universe) อย่างเป็นระบบ นั้น`,
          `<strong>๒. ข้อเท็จจริง:</strong> หน่วยตรวจสอบภายในได้จัดทำแผนการตรวจสอบระยะยาว (๓ ปี) ประจำปีงบประมาณ พ.ศ. ${year1} - ${year3} โดยวิเคราะห์จากผลการประเมินความเสี่ยงและขีดความสามารถอัตรากำลัง (Audit Capacity) รวมทั้งสิ้น ${strategicActivities.length} กิจกรรม คิดเป็นอัตรากำลังรวม ${strategicActivities.reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน โดยมีรายละเอียดการกระจายกิจกรรมในแต่ละปีงบประมาณ ดังนี้<br/>` +
            `&nbsp;&nbsp;&nbsp;&nbsp;๒.๑ ปีงบประมาณ พ.ศ. ${year1} กำหนดตรวจจำนวน ${strategicActivities.filter((a) => a.y1).length} กิจกรรม รวม ${strategicActivities.filter((a) => a.y1).reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน<br/>` +
            `&nbsp;&nbsp;&nbsp;&nbsp;๒.๒ ปีงบประมาณ พ.ศ. ${year2} กำหนดตรวจจำนวน ${strategicActivities.filter((a) => a.y2).length} กิจกรรม รวม ${strategicActivities.filter((a) => a.y2).reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน<br/>` +
            `&nbsp;&nbsp;&nbsp;&nbsp;๒.๓ ปีงบประมาณ พ.ศ. ${year3} กำหนดตรวจจำนวน ${strategicActivities.filter((a) => a.y3).length} กิจกรรม รวม ${strategicActivities.filter((a) => a.y3).reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน`,
          `<strong>๓. ข้อพิจารณาและข้อเสนอ:</strong> เพื่อให้การปฏิบัติงานตรวจสอบภายในมีทิศทางที่ชัดเจนและสอดคล้องกับระเบียบกระทรวงมหาดไทย จึงขอเสนอดังนี้:<br/>` +
            `&nbsp;&nbsp;&nbsp;&nbsp;๓.๑ เห็นชอบแผนการตรวจสอบระยะยาว (๓ ปี) ประจำปีงบประมาณ พ.ศ. ${year1} - ${year3} ตามเอกสารแนบท้ายนี้<br/>` +
            `&nbsp;&nbsp;&nbsp;&nbsp;๓.๒ อนุมัติให้นำแผนปีแรก (พ.ศ. ${year1}) ไปจัดทำเป็นแผนการปฏิบัติงานประจำปีต่อไป<br/><br/>` +
            `จึงเรียนมาเพื่อโปรดพิจารณา หากเห็นชอบโปรดลงนามอนุมัติ`
        ],
        signatoryName: effectiveAuditorName,
        signatoryPosition: effectiveAuditorPosition,
        signatoryRole: 'ผู้จัดทำแผนการตรวจสอบ',
        palatReviewText: 'เห็นควรอนุมัติแผนการตรวจสอบระยะยาว (๓ ปี) ตามเสนอ',
        executiveOrderText: 'อนุมัติแผนการตรวจสอบระยะยาว (๓ ปี) ตามเสนอ',
        orgName: orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น',
        fileName: `บันทึกขออนุมัติแผนระยะยาว๓ปี_พศ_${year1}_${year3}_${orgProfile?.name || 'อปท'}`
      });
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด Word');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        title={`แผนการตรวจสอบระยะยาว (พ.ศ. ${year1} - ${year3})`}
        orgName={orgProfile?.name}
        auditorName={`ผู้จัดทำ: ${effectiveAuditorName}`}
        year={`${year1} - ${year3}`}
      />

      {/* Navigation Subtabs & Action Toolbar */}
      <div className="bg-white/80 dark:bg-stone-900/80 rounded-2xl p-2.5 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('manday')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'manday'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 shadow-xs border border-amber-500/30'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>การคำนวณคน-วัน (Audit Man-Days Capacity)</span>
          </button>

          <button
            onClick={() => setActiveTab('three_year')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'three_year'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 shadow-xs border border-amber-500/30'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>ตารางแผนการตรวจสอบระยะยาว 3 ปี ({year1} - {year3})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleLoadDlaStrategicPlan}
            className="bg-amber-700 hover:bg-amber-800 active:scale-98 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="โหลดชุดข้อมูล 16 กิจกรรม 3 ปี รวม 590 คน-วัน ตามคู่มือ สถ."
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>โหลดตัวอย่าง สถ. (590 คน-วัน)</span>
          </button>

          <OfficialDocActionToolbar
            onDownloadWord={handleDownloadWord}
            wordTitle="บันทึกขออนุมัติแผนระยะยาว (.doc)"
            wordSubtitle={`บันทึกข้อความสารบรรณเสนออนุมัติต่อนายก ${year1} - ${year3}`}
            onDownloadExcel={handleDownloadExcel}
            excelTitle="ตารางแผนระยะยาวและอัตรากำลัง (.xlsx)"
            excelSubtitle={`ตาราง 16 กิจกรรมและสรุปคน-วันรายปี พ.ศ. ${year1} - ${year3}`}
            onPrint={() => window.print()}
            pdfTitle="พิมพ์แผนระยะยาว / PDF"
            pdfSubtitle="พิมพ์สรุปแผนระยะยาวและอัตรากำลังคน-วัน (A4)"
          />
        </div>
      </div>

      {/* Roll-Forward Notification Banner */}
      {rollForwardNotification && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-200 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{rollForwardNotification.message}</span>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('planning')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <span>ไปที่แผนประจำปี (ขั้นที่ 4)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* TAB 1: MAN-DAY CAPACITY CALCULATOR */}
      {activeTab === 'manday' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  <span>เกณฑ์การคำนวณวันทำการและอัตรากำลัง (Audit Man-Days Formula)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  อ้างอิงมาตรฐานกรมส่งเสริมการปกครองท้องถิ่น (สถ.) และกรมบัญชีกลาง
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700">
                <label className="font-bold text-stone-700 dark:text-stone-300">
                  1. จำนวนผู้ตรวจสอบภายใน (คน):
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={auditorCount}
                  onChange={(e) => setAuditorCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-base font-bold p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-stone-400">อัตรากำลังผู้ปฏิบัติงานจริงใน อปท.</span>
              </div>

              <div className="space-y-1.5 bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700">
                <label className="font-bold text-stone-700 dark:text-stone-300">
                  2. วันทำการรวมต่อปี (วัน):
                </label>
                <input
                  type="number"
                  value={grossWorkingDays}
                  onChange={(e) => setGrossWorkingDays(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-bold p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-stone-400">หักวันเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์แล้ว (สถ. กำหนด 220 วัน)</span>
              </div>

              <div className="space-y-1.5 bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700">
                <label className="font-bold text-stone-700 dark:text-stone-300">
                  3. ประมาณการวันลาพักผ่อน/ป่วย/กิจ (วัน/คน):
                </label>
                <input
                  type="number"
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-bold p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-stone-400">เกณฑ์มาตรฐาน 15 วันทำการ</span>
              </div>

              <div className="space-y-1.5 bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700">
                <label className="font-bold text-stone-700 dark:text-stone-300">
                  4. วันอบรม/สัมมนาพัฒนาวิชาชีพ (วัน/คน):
                </label>
                <input
                  type="number"
                  value={trainingDays}
                  onChange={(e) => setTrainingDays(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-bold p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-stone-400">เกณฑ์การพัฒนาตนเองตามมาตรฐานวิชาชีพ 15 วัน</span>
              </div>

              <div className="space-y-1.5 bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-700 sm:col-span-2">
                <label className="font-bold text-stone-700 dark:text-stone-300">
                  5. วันปฏิบัติงานบริหาร สารบรรณ และการประชุม (วัน/คน):
                </label>
                <input
                  type="number"
                  value={adminDays}
                  onChange={(e) => setAdminDays(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-bold p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-stone-400">งานธุรการ การวางแผนประจำปี และภารกิจสนับสนุน 30 วัน</span>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-gradient-to-br from-amber-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl border border-amber-800/40">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>ขีดความสามารถที่ใช้ตรวจได้จริง (Net Audit Capacity)</span>
              </div>

              <div className="space-y-1">
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                  {totalNetAuditCapacity}
                </div>
                <div className="text-xs text-amber-200/80 font-bold">คน-วัน / ปีงบประมาณ (Man-Days)</div>
              </div>

              <div className="pt-4 border-t border-amber-800/60 space-y-2 text-xs text-amber-100/90">
                <div className="flex justify-between">
                  <span>วันตรวจภาคสนามเฉลี่ยต่อคน:</span>
                  <span className="font-bold font-mono">{netFieldworkDaysPerAuditor} วัน</span>
                </div>
                <div className="flex justify-between">
                  <span>วันตรวจที่วางแผนไว้ในปี {year1}:</span>
                  <span className="font-bold font-mono text-amber-300">{y1TotalDays} คน-วัน</span>
                </div>
                <div className="flex justify-between">
                  <span>สัดส่วนการใช้อัตรากำลัง:</span>
                  <span className="font-bold font-mono">
                    {totalNetAuditCapacity > 0 ? Math.round((y1TotalDays / totalNetAuditCapacity) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setActiveTab('three_year')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
              >
                <span>ดูการจัดสรรในแผนระยะยาว 3 ปี</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3-YEAR STRATEGIC PLAN MATRIX */}
      {activeTab === 'three_year' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span>ตารางการกระจายกิจกรรมตรวจสอบระยะยาว 3 ปี (พ.ศ. {year1} - {year3})</span>
              </h3>
              <p className="text-xs text-stone-500">
                รวมทั้งหมด {strategicActivities.length} กิจกรรม | คลิกที่ปุ่ม ✓ / - เพื่อเปิดหรือปิดวงรอบการตรวจสอบในแต่ละปี
              </p>
            </div>

            {/* Roll-Forward to Annual Plan CTA Button */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleOpenRollForwardModal}
                className="bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-md"
                title={`นำกิจกรรมที่กำหนดตรวจในปี พ.ศ. ${year1} เข้าสู่แผนการตรวจสอบประจำปี`}
              >
                <Rocket className="w-4 h-4 text-emerald-200" />
                <span>🚀 นำกิจกรรมปี {year1} สู่แผนประจำปี (Roll-Forward)</span>
              </button>
            </div>
          </div>

          {/* Summary Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700">
              <span className="text-stone-400 font-bold block mb-1">ปีที่ 1 (พ.ศ. {year1}):</span>
              <div className="text-lg font-black text-amber-800 dark:text-amber-300 font-mono">
                {strategicActivities.filter((a) => a.y1).length} กิจกรรม
              </div>
              <span className="text-[11px] text-stone-500 font-mono">
                {strategicActivities.filter((a) => a.y1).reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700">
              <span className="text-stone-400 font-bold block mb-1">ปีที่ 2 (พ.ศ. {year2}):</span>
              <div className="text-lg font-black text-amber-800 dark:text-amber-300 font-mono">
                {strategicActivities.filter((a) => a.y2).length} กิจกรรม
              </div>
              <span className="text-[11px] text-stone-500 font-mono">
                {strategicActivities.filter((a) => a.y2).reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700">
              <span className="text-stone-400 font-bold block mb-1">ปีที่ 3 (พ.ศ. {year3}):</span>
              <div className="text-lg font-black text-amber-800 dark:text-amber-300 font-mono">
                {strategicActivities.filter((a) => a.y3).length} กิจกรรม
              </div>
              <span className="text-[11px] text-stone-500 font-mono">
                {strategicActivities.filter((a) => a.y3).reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <span className="text-amber-900 dark:text-amber-300 font-bold block mb-1">รวมทั้งสิ้น 3 ปี:</span>
              <div className="text-lg font-black text-amber-900 dark:text-amber-200 font-mono">
                {strategicActivities.length} กิจกรรม
              </div>
              <span className="text-[11px] text-amber-800 dark:text-amber-400 font-mono">
                {strategicActivities.reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden">
              <thead className="bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-3 px-3">กิจกรรม / ภารกิจที่ตรวจสอบ</th>
                  <th className="py-3 px-3">หน่วยรับตรวจ</th>
                  <th className="py-3 px-3 text-center">ระดับความเสี่ยง</th>
                  <th className="py-3 px-3 text-center">คน-วัน</th>
                  <th className="py-3 px-3 text-center w-24">ปี {year1}</th>
                  <th className="py-3 px-3 text-center w-24">ปี {year2}</th>
                  <th className="py-3 px-3 text-center w-24">ปี {year3}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {strategicActivities.map((act, idx) => (
                  <tr key={act.id} className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-stone-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-stone-900 dark:text-stone-100">{act.name}</td>
                    <td className="py-3 px-3 text-stone-600 dark:text-stone-400">{act.department}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          act.riskLevel === 'สูงมาก' || act.riskLevel === 'สูง'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : act.riskLevel === 'ปานกลาง'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {act.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-800 dark:text-amber-300 font-mono">
                      {act.manDays}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleYear(act.id, 'y1')}
                        className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          act.y1
                            ? 'bg-amber-700 text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                        title={`คลิกเพื่อเปิด/ปิด ปี ${year1}`}
                      >
                        {act.y1 ? '✓' : '-'}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleYear(act.id, 'y2')}
                        className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          act.y2
                            ? 'bg-amber-700 text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                        title={`คลิกเพื่อเปิด/ปิด ปี ${year2}`}
                      >
                        {act.y2 ? '✓' : '-'}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleYear(act.id, 'y3')}
                        className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          act.y3
                            ? 'bg-amber-700 text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                        title={`คลิกเพื่อเปิด/ปิด ปี ${year3}`}
                      >
                        {act.y3 ? '✓' : '-'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROLL-FORWARD MODAL */}
      {showRollForwardModal && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-bold text-base">
                <Rocket className="w-5 h-5 text-emerald-600" />
                <span>นำกิจกรรมปี พ.ศ. {year1} เข้าสู่แผนการตรวจสอบประจำปี</span>
              </div>
              <button
                onClick={() => setShowRollForwardModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
              ระบบตรวจสอบกิจกรรมที่กำหนดตรวจในปี พ.ศ. {year1} จากแผนระยะยาว พร้อมตรวจจับรายการที่อยู่ในแผนประจำปีอยู่แล้วเพื่อป้องกันการสร้างซ้ำซ้อน
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {rollForwardCandidates.map((cand) => (
                <div
                  key={cand.strategicId}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-colors ${
                    cand.alreadyPlanned
                      ? 'bg-stone-100/60 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 opacity-75'
                      : cand.canRollForward
                      ? 'bg-white dark:bg-stone-850 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
                      : 'bg-stone-50 dark:bg-stone-850/40 border-stone-200 dark:border-stone-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <button
                      type="button"
                      disabled={cand.alreadyPlanned || !cand.isScheduled}
                      onClick={() => handleToggleCandidateSelect(cand.strategicId)}
                      className="cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {selectedCandidateIds.includes(cand.strategicId) ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    <div className="min-w-0 truncate">
                      <div className="font-bold text-stone-900 dark:text-stone-100 truncate">
                        {cand.title}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {cand.department} • ความเสี่ยง: {cand.riskLevel} • {cand.manDays} คน-วัน
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {cand.alreadyPlanned ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300">
                        ✓ มีในแผนประจำปีแล้ว
                      </span>
                    ) : cand.canRollForward ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        พร้อมนำเข้า
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500">
                        ไม่ได้กำหนดปี {year1}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800 text-xs">
              <span className="text-stone-500 font-medium">
                เลือกนำเข้า {selectedCandidateIds.length} รายการ (ไม่รวมรายการเดิม)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRollForwardModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={selectedCandidateIds.length === 0}
                  onClick={handleExecuteRollForward}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                  ยืนยันนำเข้าร่างแผนประจำปี
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
