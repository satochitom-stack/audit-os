import React, { useState } from 'react';
import {
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 rounded-3xl p-6 sm:p-7 border border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-0.5 text-xs font-semibold text-emerald-300">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Performance Assessment (LPA) ประจำปี พ.ศ. {selectedYear}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            การประเมินประสิทธิภาพ อปท. ด้านที่ 1 การบริหารจัดการ
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
            ระบบตรวจสอบความพร้อมเอกสารหลักฐานตัวชี้วัดที่ 1 - 5 เพื่อเตรียมรับการตรวจประเมินประสิทธิภาพของ อปท.
          </p>
        </div>

        <div className="bg-stone-850/90 rounded-2xl p-4 border border-stone-700/60 text-center shrink-0 shadow-xs">
          <div className="text-xs font-bold text-emerald-400">คะแนนประเมินตนเอง</div>
          <div className="text-3xl font-black text-emerald-300 mt-1">
            {totalScore} / {maxScore}
          </div>
          <div className="text-[11px] font-bold text-emerald-400 mt-0.5">
            ระดับยอดเยี่ยม (100%)
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
                    <button
                      onClick={() => window.print()}
                      className="no-print text-stone-700 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-400 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์แบบประเมินตัวชี้วัดนี้</span>
                    </button>
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
