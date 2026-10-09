import React from 'react';

/**
 * ตราครุฑราชการ (Garuda Emblem) ขนาดมาตรฐาน 1.5 เซนติเมตร
 * ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ ภาคผนวก ๒ แบบที่ ๒ (บันทึกข้อความ)
 */
export function GarudaEmblem({ className = 'w-10 h-10' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} fill-current text-slate-900 dark:text-slate-100 shrink-0`}
      aria-label="ตราครุฑราชการ"
    >
      <path d="M50 3 C53 10, 58 15, 66 14 C62 21, 56 25, 54 32 C60 30, 70 25, 80 21 C76 31, 68 38, 60 41 C66 45, 75 49, 83 51 C73 57, 63 55, 55 53 C53 62, 52 72, 50 82 C48 72, 47 62, 45 53 C37 55, 27 57, 17 51 C25 49, 34 45, 40 41 C32 38, 24 31, 20 21 C30 25, 40 30, 46 32 C44 25, 38 21, 34 14 C42 15, 47 10, 50 3 Z M50 32 C54 32, 57 35, 57 39 C57 43, 54 46, 50 46 C46 46, 43 43, 43 39 C43 35, 46 32, 50 32 Z M35 56 C42 62, 47 70, 50 80 C53 70, 58 62, 65 56 C60 62, 55 72, 50 88 C45 72, 40 62, 35 56 Z" />
    </svg>
  );
}

/**
 * แบบฟอร์มบันทึกข้อความราชการ (Official Thai Government Memorandum - Form 2)
 * ออกแบบถูกต้องตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ และที่แก้ไขเพิ่มเติม
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
  return (
    <div
      className={`official-saraban-memo bg-white text-black p-8 sm:p-14 max-w-4xl mx-auto shadow-md border border-stone-300 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:text-black ${className}`}
      style={{
        fontFamily: "'Sarabun', 'TH Sarabun New', 'Angsana New', 'Cordia New', Tahoma, sans-serif",
        lineHeight: 1.6,
        fontSize: '15px'
      }}
    >
      {/* =========================================================================
          ส่วนหัวบันทึกข้อความ (ตามแบบที่ ๒ ท้ายระเบียบฯ)
          - ครุฑสูง ๑.๕ ซม. อยู่มุมบนซ้าย
          - คำว่า "บันทึกข้อความ" ตัวพิมพ์หนา ๒๙ พอยท์ อยู่กึ่งกลาง
      ========================================================================= */}
      <div className="relative pb-3 border-b-2 border-black">
        {/* ครุฑมุมบนซ้าย */}
        <div className="flex items-start">
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            <GarudaEmblem className="w-12 h-12" />
          </div>

          {/* คำว่า "บันทึกข้อความ" กึ่งกลางหน้า */}
          <div className="flex-1 text-center pr-14">
            <h1
              className="font-bold tracking-normal inline-block text-black"
              style={{ fontSize: '28px', letterSpacing: '1px' }}
            >
              บันทึกข้อความ
            </h1>
          </div>
        </div>

        {/* รายละเอียดส่วนราชการ, ที่, วันที่, เรื่อง */}
        <div className="mt-3 space-y-1.5 text-[15px] text-black">
          {/* ส่วนราชการ */}
          <div className="flex items-baseline">
            <span className="font-bold shrink-0">ส่วนราชการ</span>
            <span className="ml-3 flex-1 border-b border-dotted border-stone-400 print:border-none">
              {agency} {phone ? `โทร. ${phone}` : ''}
            </span>
          </div>

          {/* ที่ และ วันที่ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-baseline">
              <span className="font-bold shrink-0">ที่</span>
              <span className="ml-3 flex-1 border-b border-dotted border-stone-400 print:border-none">
                {docNumber || 'อบ ............../...............'}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold shrink-0">วันที่</span>
              <span className="ml-3 flex-1 border-b border-dotted border-stone-400 print:border-none">
                {date || '...... เดือน ................................ พ.ศ. ............'}
              </span>
            </div>
          </div>

          {/* เรื่อง */}
          <div className="flex items-baseline pt-0.5">
            <span className="font-bold shrink-0">เรื่อง</span>
            <span className="ml-3 font-bold flex-1 border-b border-dotted border-stone-400 print:border-none">
              {subject}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          คำขึ้นต้น (เรียน)
      ========================================================================= */}
      <div className="pt-4 pb-2 text-[15px]">
        <span className="font-bold">เรียน</span>
        <span className="ml-3 font-medium">{to}</span>
      </div>

      {/* =========================================================================
          เนื้อความบันทึกข้อความ (Children)
          - ย่อหน้า ๒.๕ ซม. (indent-10)
          - จัดชิดขอบและกระชับตามแบบหนังสือราชการ
      ========================================================================= */}
      <div className="space-y-4 py-2 text-justify text-[15px] leading-relaxed text-black">
        {children}
      </div>

      {/* =========================================================================
          ส่วนลงลายมือชื่อผู้รายงาน (ผู้ตรวจสอบภายใน)
          - เยื้องไปทางด้านขวา (ประมาณกึ่งกลางถึงขวา)
      ========================================================================= */}
      <div className="pt-8 flex justify-end">
        <div className="w-64 text-center space-y-5">
          <div className="text-stone-700">
            (ลงชื่อ)........................................................
          </div>
          <div className="space-y-0.5">
            <div className="font-bold">({signatory.name || '........................................................'})</div>
            <div className="text-sm">{signatory.position || 'นักวิชาการตรวจสอบภายใน'}</div>
            {signatory.role && <div className="text-xs text-stone-600">({signatory.role})</div>}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ส่วนเกษียณหนังสือราชการ (ความเห็นของปลัด อปท. & คำสั่งการของนายก อปท.)
          - มีเส้นคั่นชัดเจนแบ่ง ๒ ส่วนซ้าย-ขวา ตามมาตรฐานงานสารบรรณ อปท.
      ========================================================================= */}
      {showReviewBoxes && (
        customReviewBoxes ? (
          <div className="mt-10 pt-4 border-t-2 border-black">
            {customReviewBoxes}
          </div>
        ) : (
          <div className="mt-10 pt-4 border-t-2 border-black grid grid-cols-1 sm:grid-cols-2 gap-6 text-[13px] text-black">
            {/* ฝั่งซ้าย: ความเห็นของปลัด อปท. */}
            <div className="border border-stone-400 p-3.5 rounded-none space-y-2.5 bg-white">
              <div className="font-bold underline text-[14px]">
                ความเห็นของปลัดองค์กรปกครองส่วนท้องถิ่น
              </div>
              <div className="text-xs">
                เรียน นายกองค์กรปกครองส่วนท้องถิ่น
              </div>
              <div className="space-y-1 text-xs">
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

              <div className="pt-6 text-center space-y-1">
                <div>(ลงชื่อ)........................................................</div>
                <div className="font-bold">({palatReview?.name || '........................................................'})</div>
                <div className="text-xs text-stone-600">{palatReview?.position || 'ปลัดองค์กรปกครองส่วนท้องถิ่น'}</div>
                <div className="text-[11px] text-stone-500">วันที่ ...... / ...... / ......</div>
              </div>
            </div>

            {/* ฝั่งขวา: คำสั่งการของนายก อปท. */}
            <div className="border border-stone-400 p-3.5 rounded-none space-y-2.5 bg-white">
              <div className="font-bold underline text-[14px]">
                คำสั่งการของนายกองค์กรปกครองส่วนท้องถิ่น
              </div>
              <div className="space-y-1 text-xs pt-3">
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

              <div className="pt-6 text-center space-y-1">
                <div>(ลงชื่อ)........................................................</div>
                <div className="font-bold">({executiveOrder?.name || '........................................................'})</div>
                <div className="text-xs text-stone-600">{executiveOrder?.position || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                <div className="text-[11px] text-stone-500">วันที่ ...... / ...... / ......</div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
