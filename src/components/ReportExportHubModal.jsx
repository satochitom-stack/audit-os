import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  FileText,
  Building,
  HardHat,
  Car,
  BadgeDollarSign,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Layers,
  X
} from 'lucide-react';
import {
  exportAnnualAuditReportExcel,
  exportCapaMatrixExcel,
  exportWorkingPapersExcel,
  exportDepartmentWorkspacesExcel,
  exportMasterEnterpriseExcel
} from '../services/reportExportService';
import {
  initialOfficeWorkspaceData,
  initialFinanceWorkspaceData,
  initialTechWorkspaceData
} from '../data/initialData';

export default function ReportExportHubModal({
  isOpen,
  onClose,
  orgProfile = {},
  selectedYear = '2569',
  annualPlans = [],
  workingPapers = [],
  capaFindings = [],
  auditUniverse = [],
  engagementPlans = []
}) {
  const [downloading, setDownloading] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  if (!isOpen) return null;

  // Retrieve department data from localStorage if available
  const getDeptData = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return fallback;
  };

  const officeData = getDeptData('ia_dept_office_data', initialOfficeWorkspaceData);
  const financeData = getDeptData('ia_dept_finance_data', initialFinanceWorkspaceData);
  const techData = getDeptData('ia_dept_tech_data', initialTechWorkspaceData);

  const handleExport = (type) => {
    setDownloading(type);
    setDownloadSuccess('');

    setTimeout(() => {
      let ok = false;
      if (type === 'annual') {
        ok = exportAnnualAuditReportExcel({
          orgProfile,
          selectedYear,
          annualPlans,
          workingPapers,
          capaFindings
        });
      } else if (type === 'capa') {
        ok = exportCapaMatrixExcel(capaFindings, orgProfile, selectedYear);
      } else if (type === 'wp') {
        ok = exportWorkingPapersExcel(workingPapers, orgProfile, selectedYear);
      } else if (type === 'dept') {
        ok = exportDepartmentWorkspacesExcel({
          officeData,
          financeData,
          techData,
          orgProfile,
          selectedYear
        });
      } else if (type === 'master') {
        ok = exportMasterEnterpriseExcel({
          orgProfile,
          selectedYear,
          annualPlans,
          workingPapers,
          capaFindings,
          auditUniverse,
          engagementPlans,
          officeData,
          financeData,
          techData
        });
      }

      setDownloading(null);
      if (ok) {
        setDownloadSuccess('ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว!');
        setTimeout(() => setDownloadSuccess(''), 4000);
      }
    }, 150);
  };

  const EXPORT_OPTIONS = [
    {
      id: 'master',
      title: 'ชุดข้อมูลหลักระดับองค์กร (All-in-One Master Workbook)',
      desc: 'รวมทุกมิติในไฟล์เดียว 7 แผ่นงาน: ข้อมูลองค์กร, ความเสี่ยง SOFCK, แผน ว 614, กระดาษทำการ, ข้อทักท้วง CAPA, และงานเฉพาะกอง',
      badge: 'แนะนำสูงสุด (ครบทุกมิติ)',
      color: 'from-blue-600 to-indigo-600',
      icon: Sparkles,
      count: '7 แผ่นงาน'
    },
    {
      id: 'annual',
      title: 'รายงานผลการตรวจสอบภายในประจำปี (Annual Audit Summary Sheet)',
      desc: 'สรุปผลการตรวจสอบรายกิจกรรม, สถิติข้อตรวจพบ, การบรรลุเป้าหมายตามแผนงาน, และข้อเสนอแนะภาพรวม',
      badge: 'แบบฟอร์มทางการ',
      color: 'from-emerald-600 to-teal-600',
      icon: FileText,
      count: `${annualPlans.length} กิจกรรม`
    },
    {
      id: 'capa',
      title: 'ทะเบียนคุมข้อทักท้วง & ข้อสังเกต สตง. (CAPA Matrix under 60-day rule)',
      desc: 'ทะเบียนติดตามข้อทักท้วงครบวงจร สภาพการณ์ (Condition), เกณฑ์ (Criteria), สาเหตุ, ผลกระทบ, มาตรการแก้ไข และผลการยุติข้อสังเกต',
      badge: 'กฎหมาย 60 วัน',
      color: 'from-amber-600 to-orange-600',
      icon: ShieldCheck,
      count: `${capaFindings.length} ข้อทักท้วง`
    },
    {
      id: 'wp',
      title: 'กระดาษทำการตรวจสอบ & ผลการสุ่มตรวจ (Working Papers & Audit Samples)',
      desc: 'ตารางกระดาษทำการตรวจสอบ (WP-01 ถึง WP-04) พร้อมแผ่นงานรายการสุ่มตรวจฎีกาเบิกจ่ายและเอกสารเชิงประจักษ์',
      badge: 'หลักฐานการตรวจ',
      color: 'from-purple-600 to-indigo-600',
      icon: FileSpreadsheet,
      count: `${workingPapers.length} กระดาษทำการ`
    },
    {
      id: 'dept',
      title: 'ข้อมูลเฉพาะส่วนราชการ (Department Workspaces Summary)',
      desc: 'ทะเบียนคุมรถยนต์และน้ำมัน (สำนักปลัด), สัญญาจัดซื้อจัดจ้าง (กองคลัง), และคุมงานก่อสร้าง/ทดสอบคอนกรีต 28 วัน (กองช่าง)',
      badge: '3 สำนัก/กองหลัก',
      color: 'from-rose-600 to-pink-600',
      icon: Building,
      count: '3 สำนัก/กอง'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                ศูนย์ส่งออกรายงาน & ข้อมูล Excel ทางการ (Report & Data Export Hub)
              </h3>
              <p className="text-xs text-slate-500">
                {orgProfile.name || 'อบต.ฝางคำ'} • ปีงบประมาณ พ.ศ. {selectedYear} • ไฟล์ Microsoft Excel (.xlsx)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {downloadSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400">
            เลือกรูปแบบชุดข้อมูลที่ต้องการส่งออก ระบบจัดรูปแบบฟิลด์ภาษาไทยสมบูรณ์แบบ พร้อมเปิดใช้งานใน Microsoft Excel ได้ทันทีโดยไม่เกิดปัญหาตัวอักษรภาษาต่างดาว
          </div>

          <div className="space-y-3">
            {EXPORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isWorking = downloading === opt.id;

              return (
                <div
                  key={opt.id}
                  className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {opt.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                    <span className="text-[11px] font-mono text-slate-400">
                      {opt.count}
                    </span>
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() => handleExport(opt.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
                        opt.id === 'master'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Download className={`w-3.5 h-3.5 ${isWorking ? 'animate-bounce' : ''}`} />
                      <span>{isWorking ? 'กำลังส่งออก...' : 'ดาวน์โหลด (.xlsx)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>รองรับ Microsoft Excel 2013-2024 / Microsoft 365 / Google Sheets</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
