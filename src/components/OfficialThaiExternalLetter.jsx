import React from 'react';
import { toThaiDigits, formatSarabanDate, GARUDA_SVG_PATH, SARABAN_CONFIG } from '../utils/sarabanUtils';

/**
 * แบบฟอร์มหนังสือภายนอก (Official Thai External Letter - Form 1)
 * ตามระเบียบสำนักนายกรัฐมนตรี ว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ ภาคผนวก ๒ แบบที่ ๑
 * - ตราครุฑ: สูง ๓ เซนติเมตร (ประมาณ 113 px / 85 pt) วางกึ่งกลางหน้ากระดาษ
 * - ที่: ด้านซ้ายมือ / ส่วนราชการเจ้าของหนังสือ: ด้านขวามือ
 * - วันที่: วางกึ่งกลางหน้ากระดาษแนวเดียวกับตราครุฑ โดยไม่มีคำว่า "วันที่" นำหน้า
 * - เรื่อง, เรียน, อ้างถึง, สิ่งที่ส่งมาด้วย
 * - เนื้อความ ๓ ภาค: ภาคเหตุ, ภาคความประสงค์, ภาคสรุป
 * - คำลงท้าย: "ขอแสดงความนับถือ"
 * - ท้ายกระดาษซ้ายมือ: ส่วนราชการเจ้าของเรื่อง, เบอร์โทรศัพท์, โทรสาร, อีเมล
 */
export default function OfficialThaiExternalLetter({
  docNumber = 'อบ ๗๑๒๐๑/พิเศษ',
  agencyName = 'องค์การบริหารส่วนตำบลต้นแบบ',
  agencyAddress = 'ตำบลต้นแบบ อำเภอเมือง จังหวัดอุบลราชธานี ๓๔๐๐๐',
  date = '',
  subject = '',
  to = '',
  reference = '',
  attachments = [],
  bodyReason = '',
  bodyIntent = '',
  bodyConclusion = '',
  signatory = {
    name: 'นายประสิทธิ์ พัฒนา',
    position: 'นายกองค์การบริหารส่วนตำบลต้นแบบ'
  },
  contactDepartment = 'หน่วยตรวจสอบภายใน',
  phone = '๐-๔๕๘๔-๒๑๑๑ ต่อ ๑๐๘',
  fax = '',
  email = 'audit@example.go.th',
  children,
  className = ''
}) {
  const displayDocNumber = toThaiDigits(docNumber) || 'ที่ อบ ........./.........';
  const displayAgencyName = toThaiDigits(agencyName);
  const displayAgencyAddress = toThaiDigits(agencyAddress);
  const displayDate = date ? formatSarabanDate(date, { isExternal: true }) : '...... เดือน ................................ พ.ศ. ............';
  const displaySubject = toThaiDigits(subject);
  const displayTo = toThaiDigits(to);
  const displayReference = toThaiDigits(reference);
  const displayAttachments = attachments.map((att) => toThaiDigits(att));
  const displayContactDept = toThaiDigits(contactDepartment);
  const displayPhone = toThaiDigits(phone);
  const displayFax = toThaiDigits(fax);
  const displaySignatoryName = toThaiDigits(signatory?.name) || '........................................................';
  const displaySignatoryPos = toThaiDigits(signatory?.position) || 'นายกองค์กรปกครองส่วนท้องถิ่น';

  return (
    <div
      className={`official-saraban-external-letter bg-white text-black p-8 sm:p-14 max-w-4xl mx-auto shadow-md border border-stone-300 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:text-black ${className}`}
      style={{
        fontFamily: SARABAN_CONFIG.fontFamily,
        lineHeight: 1.35,
        fontSize: '16pt',
        boxSizing: 'border-box'
      }}
    >
      {/* =========================================================================
          ส่วนหัว: ตราครุฑ สูง ๓ ซม. กึ่งกลางหน้ากระดาษ
      ========================================================================= */}
      <div className="flex flex-col items-center justify-center pb-2 text-center">
        <img
          src="/garuda.png"
          alt="ตราครุฑราชการ ๓ เซนติเมตร"
          width="113"
          height="113"
          className="object-contain mb-3 shrink-0"
          style={{ width: '3.0cm', height: '3.0cm', maxHeight: '3.0cm' }}
        />
      </div>

      {/* =========================================================================
          เลขที่หนังสือ (ซ้าย) และ ส่วนราชการเจ้าของหนังสือ (ขวา)
      ========================================================================= */}
      <div className="grid grid-cols-2 gap-4 items-start text-[16pt]">
        <div>
          <span className="font-bold">ที่ </span>
          <span>{displayDocNumber}</span>
        </div>
        <div className="text-left pl-6 space-y-0.5">
          <div className="font-semibold">{displayAgencyName}</div>
          <div className="text-[15pt] text-stone-700 leading-tight">{displayAgencyAddress}</div>
        </div>
      </div>

      {/* =========================================================================
          วัน เดือน ปี (กึ่งกลางหน้ากระดาษ แนวเดียวกับตราครุฑ ไม่มีคำว่า "วันที่")
      ========================================================================= */}
      <div className="text-center py-4 text-[16pt]">
        <span>{displayDate}</span>
      </div>

      {/* =========================================================================
          เรื่อง, เรียน, อ้างถึง, สิ่งที่ส่งมาด้วย
      ========================================================================= */}
      <div className="space-y-1.5 text-[16pt] pt-1">
        <div className="flex items-baseline">
          <span className="font-bold shrink-0">เรื่อง</span>
          <span className="ml-3 font-semibold flex-1">{displaySubject}</span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold shrink-0">เรียน</span>
          <span className="ml-3 flex-1">{displayTo}</span>
        </div>

        {displayReference && (
          <div className="flex items-baseline">
            <span className="font-bold shrink-0">อ้างถึง</span>
            <span className="ml-3 flex-1">{displayReference}</span>
          </div>
        )}

        {displayAttachments && displayAttachments.length > 0 && (
          <div className="flex items-start">
            <span className="font-bold shrink-0">สิ่งที่ส่งมาด้วย</span>
            <div className="ml-3 flex-1 space-y-0.5">
              {displayAttachments.map((att, idx) => (
                <div key={idx}>
                  {displayAttachments.length > 1 ? `${toThaiDigits(idx + 1)}. ` : ''}{att}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          เนื้อความหนังสือภายนอก (ภาคเหตุ, ภาคความประสงค์, ภาคสรุป หรือ children)
          - ย่อหน้า ๒.๕ ซม.
          - ตัวอักษร ๑๖ พอยต์
      ========================================================================= */}
      <div className="space-y-4 pt-4 pb-4 text-justify text-[16pt] leading-relaxed text-black">
        {children ? (
          children
        ) : (
          <>
            {bodyReason && (
              <p style={{ textIndent: '2.5cm' }} className="m-0 text-justify">
                {toThaiDigits(bodyReason)}
              </p>
            )}

            {bodyIntent && (
              <p style={{ textIndent: '2.5cm' }} className="m-0 text-justify">
                {toThaiDigits(bodyIntent)}
              </p>
            )}

            {bodyConclusion && (
              <p style={{ textIndent: '2.5cm' }} className="m-0 text-justify">
                {toThaiDigits(bodyConclusion)}
              </p>
            )}
          </>
        )}
      </div>

      {/* =========================================================================
          คำลงท้าย "ขอแสดงความนับถือ" และบล็อกลายมือชื่อ
          - กึ่งกลางถึงขวา
      ========================================================================= */}
      <div className="pt-8 flex justify-end">
        <div className="w-80 text-center space-y-4 text-[16pt]">
          <div className="font-medium">ขอแสดงความนับถือ</div>
          <div className="pt-6 text-stone-700">
            (ลงชื่อ)........................................................
          </div>
          <div className="space-y-0.5">
            <div className="font-bold">({displaySignatoryName})</div>
            <div>{displaySignatoryPos}</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ส่วนราชการเจ้าของเรื่อง ท้ายกระดาษด้านซ้าย
      ========================================================================= */}
      <div className="pt-12 text-[14pt] space-y-0.5 text-black border-t border-stone-200 mt-8 print:border-none">
        <div>{displayAgencyName}</div>
        <div>{displayContactDept}</div>
        {displayPhone && <div>โทร. {displayPhone}</div>}
        {displayFax && <div>โทรสาร {displayFax}</div>}
        {email && <div>ไปรษณีย์อิเล็กทรอนิกส์: {email}</div>}
      </div>
    </div>
  );
}
