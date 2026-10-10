import React, { useState } from 'react';
import {
  Building,
  Calendar,
  Award,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  HelpCircle,
  FolderOpen,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDocumentToWord, exportDataToExcel } from '../utils/documentExportUtils';

export default function LpaView({
  lpaIndicators,
  orgProfile,
  selectedYear = '2569'
}) {
  const [checkedEvidence, setCheckedEvidence] = useState({});
  const [expandedId, setExpandedId] = useState(4); // Default expand Indicator 4 (Internal Audit)

  const toggleEvidence = (indicatorId, evidenceIdx) => {
    const key = `${indicatorId}-${evidenceIdx}`;
    setCheckedEvidence((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const totalScore = lpaIndicators.reduce((acc, curr) => acc + curr.score, 0);
  const maxScore = lpaIndicators.reduce((acc, curr) => acc + curr.maxScore, 0);

  const handleDownloadWord = () => {
    const orgName = orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น';
    const bodyContent = `
      <div style="text-align: center; margin-bottom: 16pt; font-family: 'TH Sarabun PSK';">
        <p style="margin: 0; font-size: 20pt; font-weight: bold;">แบบประเมินประสิทธิภาพขององค์กรปกครองส่วนท้องถิ่น (LPA)</p>
        <p style="margin: 4pt 0 0 0; font-size: 16pt; font-weight: bold;">ด้านที่ ๑ การบริหารจัดการ: งานตรวจสอบภายใน</p>
        <p style="margin: 2pt 0 0 0; font-size: 16pt;">${orgName} ประจำปีงบประมาณ พ.ศ. ${selectedYear}</p>
      </div>
      <div style="border-top: 1.5pt solid black; margin-bottom: 14pt;"></div>

      <p style="font-size: 16pt; font-family: 'TH Sarabun PSK'; margin-bottom: 8pt;">
        <strong>สรุปคะแนนประเมินตนเอง:</strong> ได้รับคะแนนรวม <strong>${totalScore}</strong> จากคะแนนเต็ม <strong>${maxScore}</strong> คิดเป็นร้อยละ <strong>${Math.round((totalScore / maxScore) * 100)}%</strong>
      </p>

      <table style="width: 100%; border-collapse: collapse; border: 1pt solid black; font-size: 14pt; font-family: 'TH Sarabun PSK'; margin-bottom: 16pt;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1pt solid black; padding: 5pt; width: 8%; text-align: center;">ตัวชี้วัด</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 42%; text-align: center;">ชื่อตัวชี้วัด / รายละเอียด</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 10%; text-align: center;">เต็ม</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 10%; text-align: center;">ได้</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 30%; text-align: center;">เอกสารหลักฐานอ้างอิง</th>
          </tr>
        </thead>
        <tbody>
          ${lpaIndicators
            .map(
              (ind) => `
            <tr>
              <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${ind.id}</td>
              <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;"><strong>${ind.name}</strong><br/><span style="color:#555; font-size:12pt;">${ind.desc || ''}</span></td>
              <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${ind.maxScore}</td>
              <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top; font-weight: bold;">${ind.score}</td>
              <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;">${(ind.evidences || []).map((e) => `• ${e}`).join('<br/>')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <table style="width: 100%; border: none; margin-top: 30pt; font-size: 16pt; font-family: 'TH Sarabun PSK';">
        <tr>
          <td style="width: 50%;"></td>
          <td style="width: 50%; text-align: center;">
            <p style="margin: 0;">(ลงชื่อ)........................................................ผู้ประเมิน</p>
            <p style="margin: 4pt 0 0 0; font-weight: bold;">(${orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})</p>
            <p style="margin: 2pt 0 0 0;">${orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}</p>
          </td>
        </tr>
      </table>
    `;
    exportDocumentToWord(bodyContent, `แบบประเมิน_LPA_ด้านที่1_${selectedYear}.doc`, 'แบบประเมินประสิทธิภาพ LPA');
  };

  const handleDownloadExcel = () => {
    const headers = ['ตัวชี้วัดที่', 'ชื่อตัวชี้วัด', 'คะแนนเต็ม', 'คะแนนประเมินตนเอง', 'รายการเอกสารหลักฐานอ้างอิง'];
    const rows = lpaIndicators.map((ind) => [
      ind.id,
      ind.name,
      ind.maxScore,
      ind.score,
      (ind.evidences || []).join('; ')
    ]);
    exportDataToExcel('LPA ด้านที่ 1', [headers, ...rows], `LPA_Assessment_Indicators_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Building className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>LPA ด้านที่ 1 โครงสร้างการบริหารจัดการ</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>ปีงบประมาณ พ.ศ. {selectedYear}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            การประเมินประสิทธิภาพ อปท. (LPA ด้านที่ 1 การบริหารจัดการ)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <OfficialDocActionToolbar
            onDownloadWord={handleDownloadWord}
            onDownloadExcel={handleDownloadExcel}
            onPrint={() => window.print()}
            wordTooltip="ดาวน์โหลดแบบประเมิน LPA ด้านที่ 1 เป็นไฟล์ Word (.doc)"
            excelTooltip="ส่งออกคะแนนและเกณฑ์ LPA ด้านที่ 1 เป็นไฟล์ Excel (.xlsx)"
            printTooltip="พิมพ์แบบประเมิน LPA / บันทึกเป็น PDF"
          />

          <div className="bg-white/80 dark:bg-stone-800/80 rounded-2xl p-4 border border-emerald-500/30 text-center shrink-0 shadow-2xs">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">คะแนนประเมินตนเอง</div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-300 mt-1">
              {totalScore} / {maxScore}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ระดับยอดเยี่ยม (100%)
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Accordions */}
      <div className="space-y-4">
        {lpaIndicators.map((ind) => {
          const isExpanded = expandedId === ind.id;
          return (
            <div
              key={ind.id}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden transition-all"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : ind.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-amber-50/30 dark:hover:bg-stone-850/60 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {ind.id}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                      {ind.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                      {ind.criteria}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                    {ind.score} / {ind.maxScore} คะแนน
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 mb-1">เกณฑ์การประเมิน (Criteria):</h4>
                    <p className="text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 leading-relaxed">
                      {ind.criteria}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 mb-2">
                      รายการเอกสารหลักฐานที่ต้องจัดเตรียม (Evidence Checklist):
                    </h4>
                    <div className="space-y-2">
                      {ind.evidenceList?.map((item, idx) => {
                        const key = `${ind.id}-${idx}`;
                        const isChecked = checkedEvidence[key] !== false; // default true for complete preparation
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleEvidence(ind.id, idx)}
                            className="bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 border-stone-300 dark:border-stone-600 pointer-events-none"
                              />
                              <span
                                className={`text-xs ${
                                  isChecked
                                    ? 'text-stone-800 dark:text-stone-200 font-medium'
                                    : 'text-stone-400 dark:text-stone-500 line-through'
                                }`}
                              >
                                {item}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isChecked
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                              }`}
                            >
                              {isChecked ? 'พร้อมรับตรวจ' : 'ยังไม่พร้อม'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-[11px] text-stone-500 dark:text-stone-400 border-t border-stone-200/80 dark:border-stone-800">
                    <span className="flex items-center text-amber-800 dark:text-amber-400 font-medium">
                      <FolderOpen className="w-3.5 h-3.5 mr-1" />
                      แฟ้มเอกสารอ้างอิง: D:\งานตรวจสอบภายใน\LPA\LPA ปี 68 ตรวจของ ปี 67\ตัวชี้วัดที่ {ind.id}.docx
                    </span>
                    <OfficialDocActionToolbar
                      compact={true}
                      onPrint={() => window.print()}
                      printTooltip={`พิมพ์แบบประเมินตัวชี้วัดที่ ${ind.id}`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
