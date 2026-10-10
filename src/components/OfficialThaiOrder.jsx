import React from 'react';
import { GarudaEmblem } from './OfficialThaiMemo';

/**
 * แบบฟอร์มคำสั่งราชการ (Official Thai Government Order - Form 14)
 * ออกแบบตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ ภาคผนวก ๒ แบบที่ ๑๔ (คำสั่ง)
 */
export default function OfficialThaiOrder({
  orderHeader = 'คำสั่ง[ชื่อองค์กรปกครองส่วนท้องถิ่น]',
  orderNumber = 'ที่ [เลขที่คำสั่ง]/[ปี พ.ศ.]',
  orderSubject = 'แต่งตั้งผู้ตรวจสอบภายในประจำ[ชื่อองค์กรปกครองส่วนท้องถิ่น]',
  preamble = '',
  clauses = [],
  effectiveDate = 'ทั้งนี้ ตั้งแต่วันที่ [วันที่] เดือน [เดือน] พ.ศ. [ปี พ.ศ.] เป็นต้นไป',
  issuedDate = 'สั่ง ณ วันที่ [วันที่] เดือน [เดือน] พ.ศ. [ปี พ.ศ.]',
  signatory = {
    name: '([ชื่อ-นามสกุล นายก อปท.])',
    position: 'นายกองค์กรปกครองส่วนท้องถิ่น'
  },
  className = ''
}) {
  return (
    <div
      className={`official-saraban-order bg-white text-black p-8 sm:p-14 max-w-4xl mx-auto shadow-md border border-stone-300 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:text-black ${className}`}
      style={{
        fontFamily: "'Sarabun', 'TH Sarabun New', 'Angsana New', 'Cordia New', Tahoma, sans-serif",
        lineHeight: 1.6,
        fontSize: '15px'
      }}
    >
      {/* ครุฑกึ่งกลางหน้ากระดาษ (ขนาด ๓ ซม. ตามแบบที่ ๑๔) */}
      <div className="flex flex-col items-center justify-center pb-4 text-center">
        <div className="w-16 h-16 flex items-center justify-center mb-2">
          <GarudaEmblem className="w-16 h-16 text-black" />
        </div>
        <h1 className="font-bold text-xl sm:text-2xl text-black">
          {orderHeader}
        </h1>
        <div className="font-bold text-base text-black mt-1">
          {orderNumber}
        </div>
        <div className="font-bold text-base text-black mt-1">
          เรื่อง {orderSubject}
        </div>
      </div>

      <div className="border-t border-black my-3" />

      {/* คำปรารภ / ข้อความคำสั่ง */}
      <div className="space-y-4 py-2 text-justify text-[15px] leading-relaxed text-black whitespace-pre-line indent-8">
        {preamble}
      </div>

      {/* ข้อกำหนด / สาระสำคัญ */}
      {clauses && clauses.length > 0 && (
        <div className="space-y-2 py-2 text-justify text-[15px] leading-relaxed text-black">
          {clauses.map((clause, idx) => (
            <div key={idx} className="pl-6 text-justify">
              {clause}
            </div>
          ))}
        </div>
      )}

      {/* วันบังคับใช้ */}
      {effectiveDate && (
        <div className="pt-3 text-[15px] indent-8 text-black font-medium">
          {effectiveDate}
        </div>
      )}

      {/* สั่ง ณ วันที่ */}
      {issuedDate && (
        <div className="pt-6 text-[15px] indent-12 text-black font-medium">
          {issuedDate}
        </div>
      )}

      {/* ลายมือชื่อผู้สั่งการ (นายก อปท.) */}
      <div className="pt-8 flex justify-end">
        <div className="w-72 text-center space-y-5">
          <div className="text-stone-700">
            (ลงชื่อ)........................................................
          </div>
          <div className="space-y-0.5">
            <div className="font-bold">{signatory.name || '........................................................'}</div>
            <div className="text-sm font-semibold">{signatory.position || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
