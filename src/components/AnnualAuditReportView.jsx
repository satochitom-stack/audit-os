import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeAlert,
  Sparkles,
  BookOpen,
  ArrowRight,
  Award
} from 'lucide-react';
import { exportAnnualAuditReportExcel } from '../services/reportExportService';

export default function AnnualAuditReportView({
  orgProfile = {},
  selectedYear = '2569',
  annualPlans = [],
  workingPapers = [],
  capaFindings = []
}) {
  const [showCoverMemo, setShowCoverMemo] = useState(true);
  const [showExecSummary, setShowExecSummary] = useState(true);
  const [showDeptDetails, setShowDeptDetails] = useState(true);
  const [showCapaTable, setShowCapaTable] = useState(true);
  const [showControlEvaluation, setShowControlEvaluation] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const agencyName = orgProfile.agencyName || 'หน่วยตรวจสอบภายใน';
  const auditorName = orgProfile.auditorName?.trim() || 'หน่วยตรวจสอบภายใน';
  const auditorPosition = orgProfile.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ';
  const approverName = orgProfile.approverName?.trim() || 'นายกองค์กรปกครองส่วนท้องถิ่น';
  const approverPosition = orgProfile.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น';
  const palatName = orgProfile.palatName?.trim() || 'ปลัดองค์กรปกครองส่วนท้องถิ่น';
  const palatPosition = orgProfile.palatPosition || 'ปลัดองค์กรปกครองส่วนท้องถิ่น';

  // Statistics
  const totalPlans = annualPlans.length;
  const totalWp = workingPapers.length;
  const totalCapa = capaFindings.length;
  const closedCapa = capaFindings.filter((c) => c.status === 'verified_closed').length;
  const pendingCapa = totalCapa - closedCapa;
  const complianceRate = totalCapa > 0 ? Math.round((closedCapa / totalCapa) * 100) : 100;

  // Handle Export to Excel
  const handleExportExcel = () => {
    const success = exportAnnualAuditReportExcel({
      orgProfile,
      selectedYear,
      annualPlans,
      workingPapers,
      capaFindings
    });
    if (success) {
      showToast('📗 ดาวน์โหลดรายงานผลการตรวจสอบประจำปี (.xlsx) เรียบร้อยแล้ว');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 dark:bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 border border-slate-700 text-xs font-bold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner (no-print) */}
      <div className="no-print bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
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
              รายงานผลการตรวจสอบภายในประจำปีงบประมาณ (Annual Audit Report)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-600 text-white shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors border border-amber-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงาน / บันทึกเป็น PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toggles for display (no-print) */}
      <div className="no-print bg-stone-50/80 dark:bg-stone-900/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center gap-4 text-xs font-medium text-stone-600 dark:text-stone-300">
        <span className="font-bold text-stone-800 dark:text-stone-200">ตัวเลือกการแสดงผลส่วนรายงาน:</span>
        <label className="flex items-center space-x-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showCoverMemo}
            onChange={(e) => setShowCoverMemo(e.target.checked)}
            className="rounded accent-amber-700"
          />
          <span>หนังสือนำส่ง / บันทึกข้อความ</span>
        </label>
        <label className="flex items-center space-x-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showExecSummary}
            onChange={(e) => setShowExecSummary(e.target.checked)}
            className="rounded accent-amber-700"
          />
          <span>บทสรุปสำหรับผู้บริหาร</span>
        </label>
        <label className="flex items-center space-x-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showDeptDetails}
            onChange={(e) => setShowDeptDetails(e.target.checked)}
            className="rounded accent-amber-700"
          />
          <span>ผลการตรวจรายกอง</span>
        </label>
        <label className="flex items-center space-x-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showCapaTable}
            onChange={(e) => setShowCapaTable(e.target.checked)}
            className="rounded accent-amber-700"
          />
          <span>ตารางติดตามข้อทักท้วง (CAPA)</span>
        </label>
        <label className="flex items-center space-x-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showControlEvaluation}
            onChange={(e) => setShowControlEvaluation(e.target.checked)}
            className="rounded accent-amber-700"
          />
          <span>การควบคุมภายในภาพรวม</span>
        </label>
      </div>

      {/* =========================================================================
          PRINTABLE OFFICIAL REPORT CONTAINER
      ========================================================================= */}
      <div className="printable-document bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-12 lg:p-16 border border-slate-200 dark:border-slate-800 shadow-md max-w-4xl mx-auto space-y-10 text-slate-800 dark:text-slate-200 leading-relaxed text-xs sm:text-sm">
        
        {/* =======================================================================
            1. OFFICIAL MEMORANDUM COVER (บันทึกข้อความหนังสือนำส่งทางการ)
        ======================================================================= */}
        {showCoverMemo && (
          <div className="space-y-6 pb-8 border-b-2 border-slate-900 dark:border-slate-600">
            {/* Garuda Emblem and Header */}
            <div className="relative text-center pb-4">
              {/* Garuda Emblem SVG */}
              <div className="w-16 h-16 mx-auto mb-2 text-slate-900 dark:text-slate-100 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-14 h-14 fill-current">
                  <path d="M50 5 C55 15, 65 20, 75 18 C70 28, 62 32, 60 40 C68 38, 80 32, 90 28 C85 40, 75 48, 65 52 C72 58, 82 62, 92 65 C80 72, 68 70, 58 68 C56 78, 54 88, 50 95 C46 88, 44 78, 42 68 C32 70, 20 72, 8 65 C18 62, 28 58, 35 52 C25 48, 15 40, 10 28 C20 32, 32 38, 40 40 C38 32, 30 28, 25 18 C35 20, 45 15, 50 5 Z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black tracking-wider text-slate-900 dark:text-slate-100">
                บันทึกข้อความ
              </h1>
            </div>

            {/* Memorandum Header Fields */}
            <div className="space-y-2 border-b border-slate-300 dark:border-slate-700 pb-4 text-xs font-semibold">
              <div className="flex flex-col sm:flex-row justify-between gap-1">
                <div>
                  <span className="font-bold">ส่วนราชการ: </span>
                  <span className="font-normal font-sans">{agencyName} {orgName}</span>
                </div>
                <div>
                  <span className="font-bold">ที่: </span>
                  <span className="font-normal font-mono">อบ 78408 / ......</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-1">
                <div>
                  <span className="font-bold">วันที่: </span>
                  <span className="font-normal font-sans">...... เดือน .......................... พ.ศ. {selectedYear}</span>
                </div>
                <div>
                  <span className="font-bold">โทรศัพท์: </span>
                  <span className="font-normal font-sans">045-842-xxx</span>
                </div>
              </div>

              <div>
                <span className="font-bold">เรื่อง: </span>
                <span className="font-black text-sm">รายงานผลการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. {selectedYear}</span>
              </div>
            </div>

            {/* Salutation */}
            <div className="pt-2">
              <span className="font-bold text-sm">เรียน: </span>
              <span>{approverPosition} (ผ่าน {palatPosition})</span>
            </div>

            {/* Memo Body */}
            <div className="space-y-3 text-justify leading-relaxed indent-8">
              <p>
                ตามที่ {agencyName} {orgName} ได้รับอนุมัติแผนการตรวจสอบประจำปีงบประมาณ พ.ศ. {selectedYear} และได้เข้าปฏิบัติงานตรวจสอบภายในหน่วยรับตรวจในสังกัด {orgName} ตามมาตรฐานการปฏิบัติงานวิชาชีพการตรวจสอบภายในภาครัฐ และระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2545 และที่แก้ไขเพิ่มเติม เพื่อประเมินความมีประสิทธิภาพ ประสิทธิผล ความโปร่งใส และความคุ้มค่าของการบริหารจัดการ การเงิน การบัญชี การพัสดุ และการใช้ทรัพยากรของทางราชการ นั้น
              </p>
              <p>
                บัดนี้ การปฏิบัติงานตรวจสอบภายในประจำปีงบประมาณ พ.ศ. {selectedYear} ได้เสร็จสิ้นสมบูรณ์แล้ว {agencyName} จึงขอรายงานผลการตรวจสอบภายในฉบับสมบูรณ์ พร้อมข้อสังเกตและข้อเสนอแนะในการปรับปรุงระบบการควบคุมภายในและการบริหารความเสี่ยง รายละเอียดปรากฏตามรายงานแนบท้ายนี้
              </p>
            </div>
          </div>
        )}

        {/* =======================================================================
            2. EXECUTIVE SUMMARY (บทสรุปสำหรับผู้บริหาร)
        ======================================================================= */}
        {showExecSummary && (
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-amber-600/30 pb-2">
              <span className="text-base font-black text-stone-900 dark:text-stone-100">
                ส่วนที่ 1: บทสรุปสำหรับผู้บริหาร (Executive Summary)
              </span>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700 text-center space-y-0.5">
                <div className="text-[11px] text-stone-500 font-medium">แผนการตรวจสอบ</div>
                <div className="text-xl font-black text-amber-700 dark:text-amber-400">{totalPlans} กิจกรรม</div>
                <div className="text-[10px] text-emerald-600 font-bold">ดำเนินการตรวจ 100%</div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700 text-center space-y-0.5">
                <div className="text-[11px] text-stone-500 font-medium">กระดาษทำการที่จัดทำ</div>
                <div className="text-xl font-black text-stone-900 dark:text-stone-100">{totalWp} เรื่อง</div>
                <div className="text-[10px] text-purple-600 font-bold">สุ่มตรวจหลักฐานครบถ้วน</div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700 text-center space-y-0.5">
                <div className="text-[11px] text-stone-500 font-medium">ข้อตรวจพบ/ทักท้วง (CAPA)</div>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400">{totalCapa} ประเด็น</div>
                <div className="text-[10px] text-stone-500">รวม สตง. & ตรวจสอบภายใน</div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700 text-center space-y-0.5">
                <div className="text-[11px] text-stone-500 font-medium">ความสำเร็จการแก้ไข (CAPA)</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{complianceRate}%</div>
                <div className="text-[10px] text-emerald-600 font-bold">ยุติแล้ว {closedCapa} จาก {totalCapa} เรื่อง</div>
              </div>
            </div>

            <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-2 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>ผลการประเมินภาพรวมของผู้ตรวจสอบภายใน:</span>
              </div>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-justify">
                ในภาพรวมปีงบประมาณ พ.ศ. {selectedYear} การบริหารจัดการและการปฏิบัติงานของ {orgName} มีระบบการควบคุมภายในที่เพียงพอและเป็นที่น่าพอใจในระดับหนึ่ง โดยหน่วยรับตรวจส่วนใหญ่ได้ให้ความร่วมมือและปฏิบัติตามกฎหมาย ระเบียบ ข้อบังคับของทางราชการ อย่างไรก็ดี ยังพบข้อบกพร่องที่ต้องได้รับการกวดขันและปรับปรุงอย่างต่อเนื่อง ได้แก่ การกำกับควบคุมการใช้รถยนต์ส่วนกลางและใบสั่งจ่ายน้ำมันของสำนักปลัด, การเร่งรัดติดตามลูกหนี้เงินยืมทดรองราชการและการคิดค่าปรับสัญญาพัสดุของกองคลัง, และการรอผลทดสอบความแข็งแรงของคอนกรีต 28 วันก่อนตรวจรับงานของกองช่าง
              </p>
            </div>
          </section>
        )}

        {/* =======================================================================
            3. OBJECTIVES, SCOPE & METHODOLOGY (วัตถุประสงค์และขอบเขต)
        ======================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-300 dark:border-slate-700 pb-2">
            <span className="text-base font-black text-slate-900 dark:text-slate-100">
              ส่วนที่ 2: วัตถุประสงค์ ขอบเขต และเกณฑ์ที่ใช้ในการตรวจสอบ
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-justify">
            <p>
              <strong>2.1 วัตถุประสงค์การตรวจสอบ:</strong> เพื่อสอบทานความถูกต้อง ครบถ้วน ของเอกสารทางการเงิน การพัสดุ การควบคุมทรัพย์สิน และการดำเนินงานตามภารกิจหลัก ให้เป็นไปตามระเบียบกฎหมาย หนังสือสั่งการของกระทรวงมหาดไทย พร้อมทั้งประเมินความมีประสิทธิภาพ ประสิทธิผล และความเพียงพอของระบบการควบคุมภายในขององค์กร
            </p>
            <p>
              <strong>2.2 ขอบเขตการตรวจสอบ:</strong> ครอบคลุมการปฏิบัติงานในรอบปีงบประมาณ พ.ศ. {selectedYear} ระหว่างวันที่ 1 ตุลาคม {Number(selectedYear)-1} ถึงวันที่ 30 กันยายน {selectedYear} โดยเข้าตรวจสอบทุกหน่วยงานในสังกัด ได้แก่ สำนักปลัด, กองคลัง, กองช่าง, กองการศึกษา, กองสวัสดิการสังคม และศูนย์พัฒนาเด็กเล็กในสังกัด
            </p>
            <p>
              <strong>2.3 วิธีการตรวจสอบ:</strong> ใช้วิธีการตรวจสอบเชิงลึก (Substantive Test) ร่วมกับการทดสอบการควบคุม (Test of Controls) โดยการสัมภาษณ์ผู้ปฏิบัติงาน ตรวจสอบเอกสารหลักฐานเชิงประจักษ์ สุ่มตรวจฎีกาเบิกจ่ายเงิน สุ่มตรวจสัญญาจัดซื้อจัดจ้าง สุ่มนับพัสดุครุภัณฑ์ และการลงพื้นที่ตรวจสอบสถานที่จริงของโครงการก่อสร้าง
            </p>
          </div>
        </section>

        {/* =======================================================================
            4. DETAILED DEPARTMENT FINDINGS (สรุปผลการตรวจสอบรายสำนัก/กอง)
        ======================================================================= */}
        {showDeptDetails && (
          <section className="space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-300 dark:border-slate-700 pb-2">
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                ส่วนที่ 3: สรุปผลการตรวจสอบและข้อเสนอแนะรายหน่วยรับตรวจ
              </span>
            </div>

            {/* 3.1 สำนักปลัด */}
            <div className="border border-stone-200/80 dark:border-stone-700 rounded-2xl p-4 sm:p-5 space-y-3 bg-stone-50/50 dark:bg-stone-900/40">
              <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-2">
                <span className="font-bold text-sm text-stone-800 dark:text-stone-200 flex items-center space-x-2">
                  <Building className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>3.1 สำนักปลัด (Office of the Municipal Clerk)</span>
                </span>
                <span className="text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded font-bold">
                  ระดับความเสี่ยง: ปานกลาง
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <strong>• ด้านการใช้และรักษารถยนต์ส่วนกลางและน้ำมันเชื้อเพลิง:</strong> จากการสุ่มตรวจสอบสมุดคุมรถยนต์และใบสั่งจ่ายน้ำมัน พบว่ามีการบันทึกการขอใช้รถยนต์ครบถ้วน แต่ยังพบบางเที่ยวการเดินทางที่มิได้บันทึกเลขกิโลเมตรสิ้นสุดในใบสั่งจ่ายน้ำมันให้ตรงกับหน้าปัดรถยนต์ และยังขาดการสรุปคำนวณอัตราสิ้นเปลืองน้ำมันเฉลี่ยรายเดือน
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                  <strong>ข้อเสนอแนะ:</strong> ขอให้กำชับพนักงานขับรถยนต์ส่วนกลางบันทึกเลขกิโลเมตรเริ่มต้น–สิ้นสุด และปริมาณน้ำมันให้ครบถ้วนทุกครั้งตามระเบียบกระทรวงมหาดไทยว่าด้วยการใช้และรักษารถยนต์ของ อปท. พ.ศ. 2548 ข้อ 19 และจัดทำรายงานสรุปอัตราสิ้นเปลืองน้ำมันเชื้อเพลิงเสนอผู้บริหารเป็นประจำทุกเดือน
                </div>
              </div>
            </div>

            {/* 3.2 กองคลัง */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center space-x-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>3.2 กองคลัง (Finance & Treasury Division)</span>
                </span>
                <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                  ระดับความเสี่ยง: สูง (งานงบประมาณและพัสดุ)
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <strong>• ด้านการจัดซื้อจัดจ้างและการบริหารสัญญา (พ.ร.บ. 2560):</strong> สุ่มตรวจสอบสัญญาจัดซื้อจัดจ้าง 12 รายการ มีการจัดทำร่างสัญญาและวางหลักประกันสัญญาครบถ้วน มี 1 สัญญาที่ผู้รับจ้างส่งมอบงานล่าช้ากว่ากำหนด ซึ่งกองคลังได้คิดค่าปรับวันละ 0.1% ถูกต้อง แต่ต้องเร่งรัดหักค่าปรับก่อนคืนหลักประกันสัญญา
                </div>
                <div>
                  <strong>• ด้านลูกหนี้เงินยืมทดรองราชการ (30 วัน):</strong> พบลูกหนี้เงินยืมโครงการกิจกรรมชุมชนที่ส่งใช้เงินยืมล่าช้าเกิน 30 วัน นับจากวันเสร็จสิ้นกิจกรรม จำนวน 1 รายการ
                </div>
                <div>
                  <strong>• ด้านการตรวจสอบพัสดุประจำปี (ว 184):</strong> คณะกรรมการได้ดำเนินการตรวจสอบพัสดุประจำปีและมีรายงานตามแบบ ว 184 เรียบร้อย พัสดุชำรุด 2 รายการอยู่ระหว่างเสนอขออนุมัติจำหน่าย
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                  <strong>ข้อเสนอแนะ:</strong> กำชับให้เจ้าหน้าที่ถือปฏิบัติตามระเบียบ มท. ว่าด้วยการรับเงิน การเบิกจ่ายเงินฯ พ.ศ. 2566 อย่างเคร่งครัด โดยส่งหนังสือแจ้งเตือนลูกหนี้เงินยืมล่วงหน้าก่อนครบกำหนด 30 วัน และห้ามมิให้อนุมัติให้ยืมเงินรายใหม่แก่บุคคลที่ยังค้างส่งเงินยืมเดิม
                </div>
              </div>
            </div>

            {/* 3.3 กองช่าง */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-sm text-purple-900 dark:text-purple-300 flex items-center space-x-2">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span>3.3 กองช่าง (Civil Works Division)</span>
                </span>
                <span className="text-[11px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-bold">
                  ระดับความเสี่ยง: สูง (งานก่อสร้างโครงสร้างพื้นฐาน)
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <strong>• การคำนวณราคากลาง Factor F & ปร.5:</strong> การจัดทำประมาณการราคากลางงานถนนและสะพานใช้ตาราง Factor F ถูกต้องตามประเภทงานและอัตราดอกเบี้ยเงินกู้ ณ วันคำนวณราคากลาง
                </div>
                <div>
                  <strong>• การควบคุมงานและการทดสอบคอนกรีต 28 วัน:</strong> สุ่มตรวจสอบโครงการก่อสร้างถนน คสล. พบว่ากรรมการตรวจรับพัสดุได้ลงพื้นที่ตรวจหน้างานจริง และได้เก็บแท่งตัวอย่างคอนกรีตส่งทดสอบกำลังอัด (Cylinder Compressive Strength) ผ่านเกณฑ์มาตรฐาน 240 ksc ครบถ้วนก่อนการเบิกจ่ายเงิน
                </div>
                <div>
                  <strong>• การขออนุญาตก่อสร้างอาคาร 45 วัน:</strong> มีการพิจารณาคำขออนุญาตก่อสร้างอาคารและออกใบอนุญาต (แบบ อ.1) ภายในกรอบเวลา 45 วันตาม พ.ร.บ. ควบคุมอาคาร พ.ศ. 2522
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                  <strong>ข้อเสนอแนะ:</strong> ให้ช่างผู้ควบคุมงานบันทึกรายงานการปฏิบัติงานประจำวัน (Daily Log) อย่างต่อเนื่อง และแนบใบผลทดสอบกำลังอัดคอนกรีต 28 วันจากสถาบันที่ได้มาตรฐานทุกครั้งก่อนเสนอคณะกรรมการตรวจรับพัสดุลงนามตรวจรับ
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =======================================================================
            5. CAPA FOLLOW-UP STATUS (การติดตามข้อทักท้วงและข้อสังเกต สตง.)
        ======================================================================= */}
        {showCapaTable && (
          <section className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-300 dark:border-slate-700 pb-2">
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                ส่วนที่ 4: การติดตามผลการปฏิบัติตามข้อเสนอแนะและข้อทักท้วง (CAPA Status)
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              สรุปผลการติดตามการดำเนินการตามข้อทักท้วงของสำนักงานการตรวจเงินแผ่นดิน (สตง.) และหน่วยตรวจสอบภายใน ตามกรอบระยะเวลา 60 วันตามกฎหมาย:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700">
                    <th className="p-2 w-24">รหัส</th>
                    <th className="p-2 w-28">แหล่งที่มา</th>
                    <th className="p-2 w-24">หน่วยงาน</th>
                    <th className="p-2">ประเด็นข้อตรวจพบ / ข้อทักท้วง</th>
                    <th className="p-2 w-24 text-center">วันครบ 60 วัน</th>
                    <th className="p-2 w-28 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {capaFindings.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2 font-mono font-bold text-amber-800 dark:text-amber-300">{c.id}</td>
                      <td className="p-2">{c.sourceName || (c.source === 'oag' ? 'สตง.' : 'หน่วยตรวจสอบ')}</td>
                      <td className="p-2">{c.department}</td>
                      <td className="p-2 font-medium">{c.title}</td>
                      <td className="p-2 text-center font-mono">{c.dueDate}</td>
                      <td className="p-2 text-center">
                        {c.status === 'verified_closed' ? (
                          <span className="inline-block bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            ยุติข้อสังเกตแล้ว
                          </span>
                        ) : (
                          <span className="inline-block bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            อยู่ระหว่างแก้ไข
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =======================================================================
            6. INTERNAL CONTROL & RISK OVERVIEW (การควบคุมภายในและบริหารความเสี่ยง)
        ======================================================================= */}
        {showControlEvaluation && (
          <section className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-300 dark:border-slate-700 pb-2">
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                ส่วนที่ 5: การประเมินระบบการควบคุมภายในและการบริหารความเสี่ยงภาพรวม
              </span>
            </div>

            <div className="space-y-2 text-xs text-justify">
              <p>
                จากการประเมินผลการควบคุมภายในตามหลักเกณฑ์กระทรวงการคลังว่าด้วยมาตรฐานและหลักเกณฑ์ปฏิบัติการควบคุมภายในสำหรับหน่วยงานของรัฐ พ.ศ. 2561 (แบบ ปค.4 และ ปค.5) พบว่า {orgName} มีการกำหนดสภาพแวดล้อมการควบคุม การประเมินความเสี่ยง กิจกรรมการควบคุม สารสนเทศและการสื่อสาร และการติดตามประเมินผล ที่ครอบคลุมทุกส่วนราชการ
              </p>
              <p>
                <strong>ข้อเสนอแนะเชิงกลยุทธ์ต่อฝ่ายบริหาร:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700 dark:text-slate-300">
                <li>สนับสนุนการนำเทคโนโลยีดิจิทัล (IA-OS) มาใช้ในการเชื่อมโยงข้อมูลระหว่างกอง เพื่อลดความผิดพลาดด้านเอกสาร</li>
                <li>จัดฝึกอบรมระเบียบการจัดซื้อจัดจ้าง พ.ศ. 2560 และระเบียบรับจ่ายเงิน พ.ศ. 2566 ให้แก่เจ้าหน้าที่ผู้ปฏิบัติงานใหม่อย่างสม่ำเสมอ</li>
                <li>กำชับให้ทุกสำนัก/กองนำแผนการบริหารความเสี่ยง (แบบ บส.5) ไปปฏิบัติใช้จริงเพื่อป้องกันการเกิดข้อทักท้วงซ้ำซ้อน</li>
              </ul>
            </div>
          </section>
        )}

        {/* =======================================================================
            7. TRIPLE OFFICIAL SIGNATURE BLOCKS (ส่วนลงนามทางการ 3 ระดับ)
        ======================================================================= */}
        <section className="pt-8 border-t-2 border-slate-900 dark:border-slate-700 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-xs">
            {/* Sign 1: Internal Auditor */}
            <div className="space-y-1">
              <div className="font-bold text-slate-600 dark:text-slate-400">ผู้จัดทำและเสนอรายงาน</div>
              <div className="pt-10 border-b border-dotted border-slate-400 dark:border-slate-600 w-44 mx-auto" />
              <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">({auditorName})</div>
              <div className="text-[11px] text-slate-500">{auditorPosition}</div>
              <div className="text-[10px] text-slate-400">วันที่ ...... / .................... / {selectedYear}</div>
            </div>

            {/* Sign 2: Municipal Clerk (Palat) */}
            <div className="space-y-1">
              <div className="font-bold text-slate-600 dark:text-slate-400">ความเห็นของปลัด อบต.</div>
              <div className="text-[10px] text-slate-500 italic pb-1">"เห็นชอบ เสนอนายก อบต. พิจารณา"</div>
              <div className="pt-7 border-b border-dotted border-slate-400 dark:border-slate-600 w-44 mx-auto" />
              <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">({palatName})</div>
              <div className="text-[11px] text-slate-500">{palatPosition}</div>
              <div className="text-[10px] text-slate-400">วันที่ ...... / .................... / {selectedYear}</div>
            </div>

            {/* Sign 3: Mayor (Approver) */}
            <div className="space-y-1">
              <div className="font-bold text-slate-600 dark:text-slate-400">ข้อสั่งการของนายก อบต.</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold pb-1">"ทราบ และมอบหมายให้ทุกกองดำเนินการ"</div>
              <div className="pt-7 border-b border-dotted border-slate-400 dark:border-slate-600 w-44 mx-auto" />
              <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">({approverName})</div>
              <div className="text-[11px] text-slate-500">{approverPosition}</div>
              <div className="text-[10px] text-slate-400">วันที่ ...... / .................... / {selectedYear}</div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
