import React, { useState, useMemo } from 'react';
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
  Award
} from 'lucide-react';
import { DLA_STRATEGIC_PLAN_3YEARS } from '../data/dlaStandardTemplates';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDataToExcel, exportThaiMemoToWord } from '../utils/documentExportUtils';

export default function StrategicPlanView({
  selectedYear = '2569',
  orgProfile = {},
  auditUniverse = [],
  annualPlans = []
}) {
  const [activeTab, setActiveTab] = useState('manday'); // 'manday', 'three_year'

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

  // Strategic Activities
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

  const [strategicActivities, setStrategicActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_strategic_activities_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return defaultActivities;
  });

  const toggleYear = (id, yearKey) => {
    const updated = strategicActivities.map((act) =>
      act.id === id ? { ...act, [yearKey]: !act[yearKey] } : act
    );
    setStrategicActivities(updated);
    localStorage.setItem('ia_strategic_activities_v2', JSON.stringify(updated));
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
    setStrategicActivities(dlaActivities);
    localStorage.setItem('ia_strategic_activities_v2', JSON.stringify(dlaActivities));
    alert('โหลดแผนการตรวจสอบระยะยาว 3 ปี (16 กิจกรรม 590 คน-วัน ตามคู่มือ สถ.) เรียบร้อยแล้ว');
  };

  // Planned days sum for Year 1
  const y1TotalDays = strategicActivities
    .filter((a) => a.y1)
    .reduce((sum, a) => sum + (a.manDays || 0), 0);

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
        strategicActivities.filter(a => a.y1).reduce((s, a) => s + (a.manDays || 0), 0) + ' คน-วัน',
        strategicActivities.filter(a => a.y2).reduce((s, a) => s + (a.manDays || 0), 0) + ' คน-วัน',
        strategicActivities.filter(a => a.y3).reduce((s, a) => s + (a.manDays || 0), 0) + ' คน-วัน',
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
          `&nbsp;&nbsp;&nbsp;&nbsp;๒.๑ ปีงบประมาณ พ.ศ. ${year1} กำหนดตรวจจำนวน ${strategicActivities.filter(a => a.y1).length} กิจกรรม รวม ${strategicActivities.filter(a => a.y1).reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน<br/>` +
          `&nbsp;&nbsp;&nbsp;&nbsp;๒.๒ ปีงบประมาณ พ.ศ. ${year2} กำหนดตรวจจำนวน ${strategicActivities.filter(a => a.y2).length} กิจกรรม รวม ${strategicActivities.filter(a => a.y2).reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน<br/>` +
          `&nbsp;&nbsp;&nbsp;&nbsp;๒.๓ ปีงบประมาณ พ.ศ. ${year3} กำหนดตรวจจำนวน ${strategicActivities.filter(a => a.y3).length} กิจกรรม รวม ${strategicActivities.filter(a => a.y3).reduce((s, a) => s + (a.manDays || 0), 0)} คน-วัน`,
          `<strong>๓. ข้อพิจารณาและข้อเสนอ:</strong> เพื่อให้การปฏิบัติงานตรวจสอบภายในมีทิศทางที่ชัดเจนและสอดคล้องกับระเบียบกระทรวงมหาดไทย จึงขอเสนอดังนี้:<br/>` +
          `&nbsp;&nbsp;&nbsp;&nbsp;๓.๑ เห็นชอบแผนการตรวจสอบระยะยาว (๓ ปี) ประจำปีงบประมาณ พ.ศ. ${year1} - ${year3} ตามเอกสารแนบท้ายนี้<br/>` +
          `&nbsp;&nbsp;&nbsp;&nbsp;๓.๒ อนุมัติให้นำแผนปีแรก (พ.ศ. ${year1}) ไปจัดทำเป็นแผนการปฏิบัติงานประจำปีต่อไป<br/><br/>` +
          `จึงเรียนมาเพื่อโปรดพิจารณา หากเห็นชอบโปรดลงนามอนุมัติ`
        ],
        signatoryName: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน',
        signatoryPosition: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายในชำนาญการ',
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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-7 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden print:hidden backdrop-blur-xs">
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
              <span>ปีงบประมาณ พ.ศ. {year1} - {year3}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            แผนการตรวจสอบระยะยาว (3 ปี) & การคำนวณคน-วัน (Audit Capacity)
          </h1>
        </div>
      </div>

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
            wordTitle="บันทึกขออนุมัติแผนระยะยาว 3 ปี (.doc)"
            wordSubtitle={`บันทึกข้อความสารบรรณเสนออนุมัติต่อนายก ${year1} - ${year3}`}
            onDownloadExcel={handleDownloadExcel}
            excelTitle="ตารางแผน 3 ปีและอัตรากำลัง (.xlsx)"
            excelSubtitle={`ตาราง 16 กิจกรรมและสรุปคน-วันรายปี พ.ศ. ${year1} - ${year3}`}
            onPrint={() => window.print()}
            pdfTitle="พิมพ์แผนระยะยาว 3 ปี / PDF"
            pdfSubtitle="พิมพ์สรุปแผนระยะยาวและอัตรากำลังคน-วัน (A4)"
          />
        </div>
      </div>

      {/* VIEW: MAN-DAY CALCULATION */}
      {activeTab === 'manday' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="border-b border-stone-200/80 dark:border-stone-800 pb-4">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <span>สูตรคำนวณวันทำการและความสามารถในการตรวจสอบ (Audit Capacity Formula)</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              อ้างอิงหลักเกณฑ์กระทรวงการคลัง และคู่มือการปฏิบัติงานของกองตรวจสอบระบบการเงินบัญชีท้องถิ่น (สถ.)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Variables */}
            <div className="space-y-4 bg-stone-50 dark:bg-stone-850/60 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-700">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-200">
                ตัวแปรการคำนวณประจำปีงบประมาณ พ.ศ. {selectedYear}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">จำนวนผู้ตรวจสอบภายใน (คน)</label>
                  <input
                    type="number"
                    min="1"
                    value={auditorCount}
                    onChange={(e) => setAuditorCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">วันทำงานรวมทั้งปี (วันทำการราชการ)</label>
                  <input
                    type="number"
                    value={grossWorkingDays}
                    onChange={(e) => setGrossWorkingDays(parseInt(e.target.value) || 220)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500/30"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">มาตรฐาน 52 สัปดาห์ × 5 วัน หักวันหยุดราชการ = ประมาณ 220-230 วัน</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">หัก วันลา (วัน)</label>
                    <input
                      type="number"
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">หัก ฝึกอบรม (วัน)</label>
                    <input
                      type="number"
                      value={trainingDays}
                      onChange={(e) => setTrainingDays(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">หัก งานบริหาร (วัน)</label>
                    <input
                      type="number"
                      value={adminDays}
                      onChange={(e) => setAdminDays(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity Result Card */}
            <div className="bg-gradient-to-br from-amber-50/80 via-stone-50 to-stone-100/90 dark:from-stone-850 dark:via-stone-900 dark:to-amber-950/20 p-6 rounded-2xl border border-amber-200/80 dark:border-stone-700 flex flex-col justify-between space-y-4 shadow-2xs">
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                  ผลการคำนวณกำลังคน-วัน (Audit Capacity)
                </span>
                <div className="text-4xl font-black text-stone-900 dark:text-amber-200">
                  {totalNetAuditCapacity} <span className="text-base font-normal text-stone-600 dark:text-stone-400">คน-วัน (Man-Days)</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  ผู้ตรวจสอบ {auditorCount} คน สามารถลงพื้นที่ตรวจสอบจริงได้คนละ <strong>{netFieldworkDaysPerAuditor} วัน/ปี</strong> รวมกำลังคนตรวจจริง <strong>{totalNetAuditCapacity} คน-วัน</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/90 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-600 dark:text-stone-400">กำลังคน-วันที่ใช้ในแผนปี {year1}:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{y1TotalDays} คน-วัน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600 dark:text-stone-400">กำลังคงเหลือสำหรับงานตรวจพิเศษ/คำสั่งผู้บริหาร:</span>
                  <span className={`font-bold ${totalNetAuditCapacity >= y1TotalDays ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {totalNetAuditCapacity - y1TotalDays} คน-วัน
                  </span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      y1TotalDays <= totalNetAuditCapacity ? 'bg-amber-600' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, (y1TotalDays / (totalNetAuditCapacity || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: 3-YEAR STRATEGIC PLAN MATRIX */}
      {activeTab === 'three_year' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                ผังแผนการตรวจสอบระยะยาว 3 ปี (พ.ศ. {year1} - {year3})
              </h2>
              <div className="text-xs text-stone-500">
                หน่วยตรวจสอบภายใน {orgProfile?.name || 'อปท.'}
              </div>
            </div>

            <div className="text-xs text-stone-500 flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>เสี่ยงสูง (ตรวจทุกปี)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>เสี่ยงปานกลาง (ตรวจปีเว้นปี)</span>
              </span>
            </div>
          </div>

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
                          act.riskLevel === 'สูง'
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
    </div>
  );
}
