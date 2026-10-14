import React from 'react';
import { toThaiDigits, formatSarabanDate, GARUDA_SVG_PATH, SARABAN_CONFIG } from '../utils/sarabanUtils';

/**
 * แบบฟอร์มคำสั่งราชการ (Official Thai Government Order - Form 14)
 * ออกแบบตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ ภาคผนวก ๒ แบบที่ ๑๔ (คำสั่ง)
 * - ครุฑ: ขนาด ๓ เซนติเมตร (ประมาณ 113 px / 85 pt) วางกึ่งกลางหน้ากระดาษ
 * - ชื่อคำสั่ง: "คำสั่ง [ชื่อส่วนราชการที่ออกคำสั่ง]" ขนาด ๒๔ พอยต์ กึ่งกลาง
 * - ที่: "ที่ [เลขที่คำสั่ง]/[ปี พ.ศ.]" กึ่งกลาง
 * - เรื่อง: "เรื่อง [ชื่อเรื่อง]" กึ่งกลาง
 * - คำปรารภ: ย่อหน้า ๒.๕ ซม.
 * - สาระสำคัญ / ข้อกำหนด: เรียงข้อเป็นตัวเลขไทย ๑., ๒., ๓., ...
 * - วันมีผลใช้บังคับ: ย่อหน้า ๒.๕ ซม. "ทั้งนี้ ตั้งแต่วันที่ ... เป็นต้นไป"
 * - สั่ง ณ วันที่: "สั่ง ณ วันที่ [วันที่] [เดือน] พ.ศ. [ปี พ.ศ.]"
 * - ลายมือชื่อ: เยื้องไปทางด้านขวา
 */
export default function OfficialThaiOrder({
  orderHeader = 'คำสั่ง[ชื่อองค์กรปกครองส่วนท้องถิ่น]',
  orderNumber = 'ที่ [เลขที่คำสั่ง]/[ปี พ.ศ.]',
  orderSubject = 'แต่งตั้งผู้ตรวจสอบภายในประจำ[ชื่อองค์กรปกครองส่วนท้องถิ่น]',
  preamble = '',
  clauses = [],
  effectiveDate = 'ทั้งนี้ ตั้งแต่วันที่ [วันที่] เดือน [เดือน] พ.ศ. [ปี พ.ศ.] เป็นต้นไป',
  issuedDate = '',
  signatory = {
    name: '([ชื่อ-นามสกุล นายก อปท.])',
    position: 'นายกองค์กรปกครองส่วนท้องถิ่น'
  },
  className = ''
}) {
  const displayHeader = toThaiDigits(orderHeader);
  const displayOrderNumber = toThaiDigits(orderNumber);
  const displaySubject = toThaiDigits(orderSubject);
  const displayPreamble = toThaiDigits(preamble);
  const displayClauses = (clauses || []).map((c) => toThaiDigits(c));
  const displayEffectiveDate = toThaiDigits(effectiveDate);
  const displayIssuedDate = issuedDate ? formatSarabanDate(issuedDate, { isOrder: true }) : 'สั่ง ณ วันที่ ...... เดือน ................................ พ.ศ. ............';
  const displaySignatoryName = toThaiDigits(signatory?.name) || '........................................................';
  const displaySignatoryPosition = toThaiDigits(signatory?.position) || 'นายกองค์กรปกครองส่วนท้องถิ่น';

  return (
    <div
      className={`official-saraban-order bg-white text-black p-8 sm:p-14 max-w-4xl mx-auto shadow-md border border-stone-300 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:text-black ${className}`}
      style={{
        fontFamily: SARABAN_CONFIG.fontFamily,
        lineHeight: 1.35,
        fontSize: '16pt',
        boxSizing: 'border-box'
      }}
    >
      {/* =========================================================================
          ครุฑกึ่งกลางหน้ากระดาษ (ขนาด ๓ ซม. ตามแบบที่ ๑๔)
      ========================================================================= */}
      <div className="flex flex-col items-center justify-center pb-3 text-center">
        <svg
          viewBox="0 0 100 100"
          width="113"
          height="113"
          className="fill-current text-black mb-3 shrink-0"
          aria-label="ตราครุฑราชการ ๓ เซนติเมตร"
        >
          <path d={GARUDA_SVG_PATH} />
        </svg>

        <h1
          className="font-bold text-black"
          style={{ fontSize: SARABAN_CONFIG.fontSizeOrderTitle, lineHeight: 1.2 }}
        >
          {displayHeader}
        </h1>

        <div className="font-bold text-[16pt] text-black mt-1">
          {displayOrderNumber}
        </div>

        <div className="font-bold text-[16pt] text-black mt-1">
          เรื่อง {displaySubject}
        </div>
      </div>

      <div className="border-t border-black my-4" />

      {/* คำปรารภ / ข้อความคำสั่ง (ย่อหน้า ๒.๕ ซม.) */}
      <div
        className="space-y-4 py-2 text-justify text-[16pt] leading-relaxed text-black whitespace-pre-line"
        style={{ textIndent: '2.5cm' }}
      >
        {displayPreamble}
      </div>

      {/* ข้อกำหนด / สาระสำคัญ (ข้อ ๑., ๒., ๓., ...) */}
      {displayClauses && displayClauses.length > 0 && (
        <div className="space-y-2.5 py-2 text-justify text-[16pt] leading-relaxed text-black">
          {displayClauses.map((clause, idx) => (
            <div key={idx} className="pl-8 text-justify" style={{ textIndent: '-1.5cm', paddingLeft: '2cm' }}>
              {clause}
            </div>
          ))}
        </div>
      )}

      {/* วันบังคับใช้ (ย่อหน้า ๒.๕ ซม.) */}
      {displayEffectiveDate && (
        <div
          className="pt-4 text-[16pt] text-black"
          style={{ textIndent: '2.5cm' }}
        >
          {displayEffectiveDate}
        </div>
      )}

      {/* สั่ง ณ วันที่ (เยื้องไปทางกึ่งกลาง หรือ ย่อหน้า ๒.๕ ซม.) */}
      {displayIssuedDate && (
        <div
          className="pt-6 text-[16pt] text-black"
          style={{ textIndent: '2.5cm' }}
        >
          {displayIssuedDate}
        </div>
      )}

      {/* ลายมือชื่อผู้สั่งการ (นายก อปท.) */}
      <div className="pt-8 flex justify-end">
        <div className="w-80 text-center space-y-4 text-[16pt]">
          <div className="text-stone-700">
            (ลงชื่อ)........................................................
          </div>
          <div className="space-y-0.5">
            <div className="font-bold">({displaySignatoryName})</div>
            <div className="text-[15pt]">{displaySignatoryPosition}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
