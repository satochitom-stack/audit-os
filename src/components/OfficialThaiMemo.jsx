import React from 'react';
import { toThaiDigits, formatSarabanDate, GARUDA_SVG_PATH, SARABAN_CONFIG } from '../utils/sarabanUtils';

/**
 * ตราครุฑราชการ (Garuda Emblem) ขนาดมาตรฐาน ๑.๕ เซนติเมตร
 * ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ ภาคผนวก ๒ แบบที่ ๒ (บันทึกข้อความ)
 */
export function GarudaEmblem({ className = 'w-14 h-14', size = 57 }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${className} fill-current text-slate-900 dark:text-slate-100 shrink-0`}
      aria-label="ตราครุฑราชการ ๑.๕ เซนติเมตร"
      style={{ display: 'inline-block' }}
    >
      <path d={GARUDA_SVG_PATH} />
    </svg>
  );
}

/**
 * แบบฟอร์มบันทึกข้อความราชการ (Official Thai Government Memorandum - Form 2)
 * ออกแบบถูกต้องตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ และที่แก้ไขเพิ่มเติม
 * - หัวหนังสือ: คำว่า "บันทึกข้อความ" ตัวพิมพ์หนา ๒๙ พอยต์ กึ่งกลาง ตราครุฑสูง ๑.๕ ซม. ชิดมุมบนซ้าย
 * - ตัวอักษร: TH Sarabun PSK / New ขนาด ๑๖ พอยต์
 * - วันที่: มีคำว่า "วันที่" นำหน้า
 * - ตัวเลข: แปลงตัวเลขอารบิกทั้งหมดให้เป็นตัวเลขไทย (๐-๙)
 * - ระยะขอบ: กั้นหน้า ๓ ซม. กั้นหลัง ๒ ซม. กั้นบน ๒.๕ ซม. กั้นล่าง ๒ ซม. ย่อหน้า ๒.๕ ซม.
 */
export default function OfficialThaiMemo({
  agency = 'หน่วยตรวจสอบภายใน องค์การบริหารส่วนตำบลต้นแบบ',
  phone = '๐๔๕-๘๔๒-๑๑๑ ต่อ ๑๐๘',
  docNumber = 'อบ ๗๑๒๐๑/พิเศษ',
  date = '',
  subject = '',
  to = 'นายกองค์การบริหารส่วนตำบลต้นแบบ (ผ่าน ปลัดองค์การบริหารส่วนตำบลต้นแบบ)',
  children,
  signatory = {
    name: 'นางสาววิภาวี ตรวจการดี',
    position: 'นักวิชาการตรวจสอบภายในชำนาญการ',
    role: 'ผู้รายงาน'
  },
  palatReview = {
    name: 'นายสมศักดิ์ สุจริต',
    position: 'ปลัดองค์การบริหารส่วนตำบลต้นแบบ'
  },
  executiveOrder = {
    name: 'นายประสิทธิ์ พัฒนา',
    position: 'นายกองค์การบริหารส่วนตำบลต้นแบบ'
  },
  showReviewBoxes = true,
  customReviewBoxes = null,
  className = ''
}) {
  const displayPhone = toThaiDigits(phone);
  const displayDocNumber = toThaiDigits(docNumber) || 'อบ ............../...............';
  const displayDate = date ? formatSarabanDate(date, { isExternal: false }) : 'วันที่ ...... เดือน ................................ พ.ศ. ............';
  const displaySubject = toThaiDigits(subject);
  const displayTo = toThaiDigits(to);

  return (
    <div
      className={`official-saraban-memo bg-white text-black p-6 sm:p-12 max-w-4xl mx-auto shadow-md border border-stone-300 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:text-black ${className}`}
      style={{
        fontFamily: SARABAN_CONFIG.fontFamily,
        lineHeight: 1.35,
        fontSize: '16pt',
        boxSizing: 'border-box'
      }}
    >
      {/* =========================================================================
          ส่วนหัวบันทึกข้อความ (ตามแบบที่ ๒ ท้ายระเบียบฯ)
          - ครุฑสูง ๑.๕ ซม. (57px) ชิดมุมบนซ้าย
          - คำว่า "บันทึกข้อความ" ตัวพิมพ์หนา ๒๙ พอยต์ อยู่กึ่งกลางหน้ากระดาษ
      ========================================================================= */}
      <div className="relative pb-3 border-b-2 border-black">
        <div className="flex items-start">
          {/* ครุฑมุมบนซ้าย ขนาด ๑.๕ ซม. */}
          <div className="w-14 h-14 flex items-center justify-start shrink-0">
            <GarudaEmblem className="w-14 h-14" size={57} />
          </div>

          {/* คำว่า "บันทึกข้อความ" ๒๙ พอยต์ กึ่งกลางหน้า */}
          <div className="flex-1 text-center pr-14">
            <h1
              className="font-bold tracking-normal inline-block text-black"
              style={{ fontSize: '29pt', lineHeight: 1.2, letterSpacing: '1px' }}
            >
              บันทึกข้อความ
            </h1>
          </div>
        </div>

        {/* รายละเอียดส่วนราชการ, ที่, วันที่, เรื่อง */}
        <div className="mt-3 space-y-1 text-[16pt] text-black">
          {/* ส่วนราชการ */}
          <div className="flex items-baseline">
            <span className="font-bold shrink-0">ส่วนราชการ</span>
            <span className="ml-3 flex-1 border-b border-dotted border-stone-400 print:border-none">
              {agency} {displayPhone ? `โทร. ${displayPhone}` : ''}
            </span>
          </div>

          {/* ที่ และ วันที่ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-baseline">
              <span className="font-bold shrink-0">ที่</span>
              <span className="ml-3 flex-1 border-b border-dotted border-stone-400 print:border-none">
                {displayDocNumber}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold shrink-0"></span>
              <span className="flex-1 border-b border-dotted border-stone-400 print:border-none">
                {displayDate}
              </span>
            </div>
          </div>

          {/* เรื่อง */}
          <div className="flex items-baseline pt-0.5">
            <span className="font-bold shrink-0">เรื่อง</span>
            <span className="ml-3 font-bold flex-1 border-b border-dotted border-stone-400 print:border-none">
              {displaySubject}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          คำขึ้นต้น (เรียน)
      ========================================================================= */}
      <div className="pt-3 pb-2 text-[16pt]">
        <span className="font-bold">เรียน</span>
        <span className="ml-3">{displayTo}</span>
      </div>

      {/* =========================================================================
          เนื้อความบันทึกข้อความ (Children)
          - ย่อหน้า ๒.๕ ซม.
          - จัดขอบชิดสองข้าง (text-justify)
          - ขนาดตัวอักษร ๑๖ พอยต์
      ========================================================================= */}
      <div className="space-y-4 py-2 text-justify text-[16pt] leading-relaxed text-black">
        {children}
      </div>

      {/* =========================================================================
          ส่วนลงลายมือชื่อผู้รายงาน (ผู้ตรวจสอบภายใน)
          - เยื้องไปทางด้านขวา (ประมาณกึ่งกลางถึงขวา)
      ========================================================================= */}
      <div className="pt-6 flex justify-end">
        <div className="w-72 text-center space-y-4 text-[16pt]">
          <div className="text-stone-700">
            (ลงชื่อ)........................................................
          </div>
          <div className="space-y-0.5">
            <div className="font-bold">({toThaiDigits(signatory?.name) || '........................................................'})</div>
            <div>{toThaiDigits(signatory?.position) || 'นักวิชาการตรวจสอบภายใน'}</div>
            {signatory?.role && <div className="text-sm text-stone-600">({toThaiDigits(signatory.role)})</div>}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ส่วนเกษียณหนังสือราชการ (ความเห็นของปลัด อปท. & คำสั่งการของนายก อปท.)
          - มีเส้นคั่นชัดเจนแบ่ง ๒ ส่วนซ้าย-ขวา ตามมาตรฐานงานสารบรรณ อปท.
      ========================================================================= */}
      {showReviewBoxes && (
        customReviewBoxes ? (
          <div className="mt-8 pt-3 border-t-2 border-black">
            {customReviewBoxes}
          </div>
        ) : (
          <div className="mt-8 pt-3 border-t-2 border-black grid grid-cols-1 sm:grid-cols-2 gap-5 text-[14pt] text-black">
            {/* ฝั่งซ้าย: ความเห็นของปลัด อปท. */}
            <div className="border border-stone-400 p-3 rounded-none space-y-2 bg-white">
              <div className="font-bold underline text-[15pt]">
                ความเห็นของปลัดองค์กรปกครองส่วนท้องถิ่น
              </div>
              <div className="text-[14pt]">
                เรียน นายกองค์กรปกครองส่วนท้องถิ่น
              </div>
              <div className="space-y-1 text-[13.5pt]">
                <label className="flex items-start space-x-2">
                  <span className="font-bold text-sm">[  ]</span>
                  <span>เพื่อโปรดทราบ</span>
                </label>
                <label className="flex items-start space-x-2">
                  <span className="font-bold text-sm">[  ]</span>
                  <span>
                    เห็นควรให้หน่วยรับตรวจถือปฏิบัติตามข้อเสนอแนะของผู้ตรวจสอบภายใน
                    และรายงานผลการปรับปรุงให้ทราบภายใน ๓๐ วัน
                  </span>
                </label>
                <label className="flex items-start space-x-2">
                  <span className="font-bold text-sm">[  ]</span>
                  <span>อื่นๆ ............................................................................</span>
                </label>
              </div>

              <div className="pt-4 text-center space-y-0.5 text-[14pt]">
                <div>(ลงชื่อ)........................................................</div>
                <div className="font-bold">({toThaiDigits(palatReview?.name) || '........................................................'})</div>
                <div className="text-sm text-stone-600">{toThaiDigits(palatReview?.position) || 'ปลัดองค์กรปกครองส่วนท้องถิ่น'}</div>
                <div className="text-xs text-stone-500">วันที่ ...... / ...... / ......</div>
              </div>
            </div>

            {/* ฝั่งขวา: คำสั่งการของนายก อปท. */}
            <div className="border border-stone-400 p-3 rounded-none space-y-2 bg-white">
              <div className="font-bold underline text-[15pt]">
                คำสั่งการของนายกองค์กรปกครองส่วนท้องถิ่น
              </div>
              <div className="space-y-1 text-[13.5pt] pt-2">
                <label className="flex items-start space-x-2">
                  <span className="font-bold text-sm">[  ]</span>
                  <span>ทราบ</span>
                </label>
                <label className="flex items-start space-x-2">
                  <span className="font-bold text-sm">[  ]</span>
                  <span>เห็นชอบและอนุมัติตามเสนอ</span>
                </label>
                <label className="flex items-start space-x-2">
                  <span className="font-bold text-sm">[  ]</span>
                  <span>
                    สั่งการให้หน่วยรับตรวจดำเนินการตามข้อเสนอแนะของผู้ตรวจสอบภายใน
                    และรายงานผลการปรับปรุงให้ทราบภายใน ๓๐ วัน
                  </span>
                </label>
                <label className="flex items-start space-x-2">
                  <span className="font-bold text-sm">[  ]</span>
                  <span>อื่นๆ ............................................................................</span>
                </label>
              </div>

              <div className="pt-4 text-center space-y-0.5 text-[14pt]">
                <div>(ลงชื่อ)........................................................</div>
                <div className="font-bold">({toThaiDigits(executiveOrder?.name) || '........................................................'})</div>
                <div className="text-sm text-stone-600">{toThaiDigits(executiveOrder?.position) || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                <div className="text-xs text-stone-500">วันที่ ...... / ...... / ......</div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
