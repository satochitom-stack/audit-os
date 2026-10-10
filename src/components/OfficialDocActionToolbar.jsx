import React from 'react';
import { FileText, FileSpreadsheet, Printer, Download, Sparkles } from 'lucide-react';

/**
 * OfficialDocActionToolbar
 * แถบสัญลักษณ์สำหรับดาวน์โหลดเอกสาร Word (.doc), Excel (.xlsx) และสั่งพิมพ์/บันทึก PDF
 * ออกแบบเป็นสัญลักษณ์ (Icons/Badges) ตามคำขอของผู้ใช้งาน เพื่อความกระชับ สวยงาม และใช้งานง่าย
 */
export default function OfficialDocActionToolbar({
  onDownloadWord,
  wordTooltip = 'ดาวน์โหลดไฟล์ Word (.doc) เพื่อนำไปปรับแก้ตามบริบท อปท. (มาตรฐานงานสารบรรณ)',
  wordLabel = 'Word',
  showWord = true,

  onDownloadExcel,
  excelTooltip = 'ดาวน์โหลดไฟล์ตาราง Excel (.xlsx) สำหรับคำนวณและปรับแต่งข้อมูล',
  excelLabel = 'Excel',
  showExcel = true,

  onPrint,
  printTooltip = 'พิมพ์เอกสารทางการ / บันทึกเป็นไฟล์ PDF',
  printLabel = 'พิมพ์ / PDF',
  showPrint = true,

  compact = false,
  className = '',
  extraActions = null
}) {
  return (
    <div
      className={`no-print flex items-center space-x-1.5 p-1 bg-stone-100/90 dark:bg-stone-850/90 border border-stone-200/80 dark:border-stone-700/80 rounded-2xl shadow-2xs backdrop-blur-xs ${className}`}
      role="toolbar"
      aria-label="เครื่องมือส่งออกเอกสารราชการ"
    >
      {/* 1. ปุ่มสัญลักษณ์ Word (.doc) */}
      {showWord && onDownloadWord && (
        <button
          type="button"
          onClick={onDownloadWord}
          title={wordTooltip}
          aria-label={wordTooltip}
          className="group relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer transform active:scale-95"
        >
          {/* สัญลักษณ์ Word W Icon */}
          <div className="w-4 h-4 rounded bg-white text-blue-700 flex items-center justify-center font-black text-[10px] leading-none shrink-0 group-hover:scale-110 transition-transform">
            W
          </div>
          {!compact && <span className="tracking-tight">{wordLabel}</span>}
          <span className="text-[10px] opacity-75 font-mono">.doc</span>
        </button>
      )}

      {/* 2. ปุ่มสัญลักษณ์ Excel (.xlsx) */}
      {showExcel && onDownloadExcel && (
        <button
          type="button"
          onClick={onDownloadExcel}
          title={excelTooltip}
          aria-label={excelTooltip}
          className="group relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer transform active:scale-95"
        >
          {/* สัญลักษณ์ Excel X Icon */}
          <div className="w-4 h-4 rounded bg-white text-emerald-700 flex items-center justify-center font-black text-[10px] leading-none shrink-0 group-hover:scale-110 transition-transform">
            X
          </div>
          {!compact && <span className="tracking-tight">{excelLabel}</span>}
          <span className="text-[10px] opacity-75 font-mono">.xlsx</span>
        </button>
      )}

      {/* 3. ปุ่มสัญลักษณ์ Print / PDF */}
      {showPrint && onPrint && (
        <button
          type="button"
          onClick={onPrint}
          title={printTooltip}
          aria-label={printTooltip}
          className="group relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-700 font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Printer className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300 group-hover:text-amber-600 transition-colors" />
          {!compact && <span>{printLabel}</span>}
        </button>
      )}

      {/* Extra actions if any */}
      {extraActions}
    </div>
  );
}
