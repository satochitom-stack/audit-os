import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Printer, FileSpreadsheet } from 'lucide-react';

/**
 * OfficialDocActionToolbar
 * ปุ่มสัญลักษณ์ดาวน์โหลดเอกสารแบบ Dropdown กะทัดรัด [ 📥 ∨ ] ตามมาตรฐานผังโครงสร้าง (Org Chart)
 * รองรับการดาวน์โหลดไฟล์ Word (.doc), Excel (.xlsx) และสั่งพิมพ์ / บันทึก PDF
 * พร้อมคำบรรยายเฉพาะของแต่ละหน้า ไม่ใช้ข้อความซ้ำกัน
 */
export default function OfficialDocActionToolbar({
  onDownloadWord,
  onWord,
  wordTitle = 'ดาวน์โหลดไฟล์ Word (.doc)',
  wordSubtitle = 'เอกสารมาตรฐานงานสารบรรณ พ.ศ. ๒๕๒๖',
  wordTooltip = 'ดาวน์โหลดไฟล์ Word (.doc)',
  showWord = true,

  onDownloadExcel,
  onExcel,
  excelTitle = 'ดาวน์โหลดไฟล์ Excel (.xlsx)',
  excelSubtitle = 'ตารางข้อมูลและระบบคำนวณมาตรฐาน',
  excelTooltip = 'ดาวน์โหลดไฟล์ Excel (.xlsx)',
  showExcel = true,

  onPrint,
  printTitle = 'พิมพ์เอกสารทางราชการ',
  printSubtitle = 'สั่งพิมพ์ผ่านเครื่องพิมพ์ (ปรับแนวตั้ง/แนวนอนอัตโนมัติ)',
  printTooltip = 'สั่งพิมพ์เอกสาร',
  showPrint = true,

  onSavePdf,
  onPdf,
  pdfTitle = 'บันทึกเป็นเอกสาร PDF (.pdf)',
  pdfSubtitle = 'บันทึกเป็นไฟล์ PDF ขนาด A4',
  pdfTooltip = 'บันทึกเป็นเอกสาร PDF (.pdf)',
  showPdf = true,

  className = '',
  buttonClassName = '',
  align = 'right', // 'right' or 'left'
  extraActions = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const wordAction = onDownloadWord || onWord;
  const excelAction = onDownloadExcel || onExcel;
  // แยก Print กับ PDF ออกจากกันอย่างชัดเจน
  const printAction = onPrint;
  const pdfAction = onSavePdf || (onPdf && onPdf !== onPrint ? onPdf : onPrint);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasAnyExport = (showWord && wordAction) || (showExcel && excelAction) || (showPrint && printAction) || (showPdf && pdfAction);
  if (!hasAnyExport && !extraActions) return null;

  return (
    <div className={`relative inline-flex items-center space-x-1.5 no-print ${className}`} ref={dropdownRef}>
      {hasAnyExport && (
        <>
          {/* Main Compact Download Icon Button [ 📥 ∨ ] */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`px-2.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${buttonClassName}`}
            title="ดาวน์โหลดหรือพิมพ์เอกสาร (Word / Excel / PDF / Print)"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <Download className="w-4 h-4 text-stone-700 dark:text-stone-200 shrink-0" />
            <ChevronDown className={`w-3 h-3 text-stone-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Dropdown Menu */}
          {isOpen && (
            <div
              className={`absolute top-full mt-2 w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2 ${
                align === 'left' ? 'left-0' : 'right-0'
              }`}
            >
              {/* Option 1: Print Document (แยกชัดเจน) */}
              {showPrint && printAction && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    printAction();
                  }}
                  title={printTooltip}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-stone-800 dark:text-stone-200 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center space-x-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 shrink-0">
                    <Printer className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{printTitle}</div>
                    <div className="text-[10px] text-stone-400 font-normal truncate">{printSubtitle}</div>
                  </div>
                </button>
              )}

              {/* Option 2: Save as PDF (.pdf) (แยกออกจากเมนูพิมพ์) */}
              {showPdf && pdfAction && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    pdfAction();
                  }}
                  title={pdfTooltip}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-800 dark:text-stone-200 hover:text-rose-700 dark:hover:text-rose-300 flex items-center space-x-2.5 text-xs font-bold transition-all cursor-pointer mt-1"
                >
                  <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{pdfTitle}</div>
                    <div className="text-[10px] text-stone-400 font-normal truncate">{pdfSubtitle}</div>
                  </div>
                </button>
              )}

              {/* Option 2: Word (.doc) */}
              {showWord && wordAction && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    wordAction();
                  }}
                  title={wordTooltip}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-stone-800 dark:text-stone-200 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-2.5 text-xs font-bold transition-all cursor-pointer mt-1"
                >
                  <span className="w-6.5 h-6.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0 flex items-center justify-center font-black text-xs">
                    W
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{wordTitle}</div>
                    <div className="text-[10px] text-stone-400 font-normal truncate">{wordSubtitle}</div>
                  </div>
                </button>
              )}

              {/* Option 3: Excel (.xlsx) */}
              {showExcel && excelAction && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    excelAction();
                  }}
                  title={excelTooltip}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-800 dark:text-stone-200 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center space-x-2.5 text-xs font-bold transition-all cursor-pointer mt-1"
                >
                  <span className="w-6.5 h-6.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0 flex items-center justify-center font-black text-xs">
                    X
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{excelTitle}</div>
                    <div className="text-[10px] text-stone-400 font-normal truncate">{excelSubtitle}</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Extra Action Buttons if any */}
      {extraActions}
    </div>
  );
}
