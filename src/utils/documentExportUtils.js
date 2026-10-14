/**
 * Document & Data Export Utility for Audit-OS
 * รองรับการส่งออกเป็นไฟล์ Word (.doc) และ Excel (.xlsx / .xls) ตามระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖
 * และระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. ๒๕๔๕
 */

import * as XLSX from 'xlsx';
import {
  toThaiDigits,
  formatSarabanDate,
  GARUDA_SVG_1_5CM_HTML,
  GARUDA_SVG_3CM_HTML,
  SARABAN_CONFIG
} from './sarabanUtils';

/**
 * Escapes HTML characters
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Trigger file download from Blob
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Garuda Emblem SVG for Word documents (ทั้ง 1.5 ซม. และ 3.0 ซม.)
 */
export const GARUDA_SVG_HTML = GARUDA_SVG_1_5CM_HTML;
export const THAI_GARUDA_SVG = GARUDA_SVG_3CM_HTML;

/**
 * Wrap HTML content inside Microsoft Word MSO HTML wrapper
 * Configured specifically for A4 with official Saraban margins:
 * - Top: 2.5cm (70.85pt)
 * - Bottom: 2.0cm (56.7pt)
 * - Left: 3.0cm (85.05pt) [ตามระเบียบสารบรรณ กั้นหน้า ๓ ซม.]
 * - Right: 2.0cm (56.7pt) [ตามระเบียบสารบรรณ กั้นหลัง ๒ ซม.]
 * Default Font: TH Sarabun PSK 16pt
 */
export function wrapWordHtml(bodyContent, title = 'เอกสารราชการ') {
  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHtml(title)}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 595.3pt 841.9pt; /* A4 Portrait */
          margin: 70.85pt 56.7pt 56.7pt 85.05pt; /* Top 2.5cm, Right 2.0cm, Bottom 2.0cm, Left 3.0cm (มาตรฐานงานสารบรรณ) */
          mso-header-margin: 36pt;
          mso-footer-margin: 36pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Angsana New', 'Cordia New', sans-serif;
          font-size: 16pt;
          line-height: 1.25;
          color: #000;
        }
        p {
          margin: 0 0 6pt 0;
          font-size: 16pt;
          font-family: 'TH Sarabun PSK', 'TH Sarabun New', sans-serif;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'TH Sarabun PSK', 'TH Sarabun New', sans-serif;
          font-size: 16pt;
        }
        th, td {
          vertical-align: top;
        }
        .indent {
          text-indent: 2.5cm;
          text-align: justify;
        }
        .memo-title {
          text-align: center;
          font-size: 29pt;
          font-weight: bold;
          font-family: 'TH Sarabun PSK', 'TH Sarabun New', sans-serif;
          line-height: 1.1;
        }
        .order-title {
          text-align: center;
          font-size: 24pt;
          font-weight: bold;
          font-family: 'TH Sarabun PSK', 'TH Sarabun New', sans-serif;
          line-height: 1.2;
        }
        .header-field {
          font-weight: bold;
          font-size: 16pt;
        }
        .table-bordered th, .table-bordered td {
          border: 1pt solid #000;
          padding: 4pt 6pt;
        }
        .table-bordered th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${bodyContent}
      </div>
    </body>
    </html>
  `;
}

/**
 * 1. ส่งออกบันทึกข้อความทางการเป็นไฟล์ Word (.doc)
 * สอดคล้องระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖ แบบที่ ๒
 * - ตราครุฑ ๑.๕ ซม. ชิดมุมบนซ้าย
 * - คำว่า "บันทึกข้อความ" ๒๙ พอยต์ ตัวหนา กึ่งกลาง
 * - ตัวเลขทุกตำแหน่งเป็นตัวเลขไทย (๐-๙)
 */
export function exportThaiMemoToWord(arg1 = {}, arg2) {
  let opts = {};
  if (typeof arg1 === 'object' && arg1 !== null) {
    opts = { ...arg1 };
    if (typeof arg2 === 'string') {
      opts.fileName = arg2;
    }
  } else {
    opts = {};
  }

  const agency = toThaiDigits(opts.agency || opts.agencyName || 'หน่วยตรวจสอบภายใน');
  const phone = toThaiDigits(opts.phone || '');
  const docNumber = toThaiDigits(opts.docNumber || 'อบ ๗๘๔๐๘/พิเศษ');
  const rawDate = opts.docDate || opts.date || '';
  const docDate = rawDate ? formatSarabanDate(rawDate, { isExternal: false }) : 'วันที่ ...... เดือน ........................ พ.ศ. ............';
  const subject = toThaiDigits(opts.subject || 'เรื่องเสนอเพื่อโปรดพิจารณา');
  const to = toThaiDigits(opts.to || opts.destination || 'นายกองค์กรปกครองส่วนท้องถิ่น (ผ่าน ปลัดองค์กรปกครองส่วนท้องถิ่น)');
  
  // Support both contentParagraphs array and content string (HTML)
  let paragraphsHtml = '';
  if (Array.isArray(opts.contentParagraphs) && opts.contentParagraphs.length > 0) {
    paragraphsHtml = opts.contentParagraphs.map((p) => {
      if (!p) return '';
      const convertedP = toThaiDigits(p);
      return `<p class="indent" style="margin-bottom: 8pt; text-align: justify; line-height: 1.35; font-size: 16pt;">${convertedP.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
  } else if (typeof opts.content === 'string' && opts.content.trim()) {
    paragraphsHtml = `<div style="line-height: 1.35; font-size: 16pt;">${toThaiDigits(opts.content)}</div>`;
  } else if (typeof opts.bodyContent === 'string' && opts.bodyContent.trim()) {
    paragraphsHtml = `<div style="line-height: 1.35; font-size: 16pt;">${toThaiDigits(opts.bodyContent)}</div>`;
  }

  const signatoryName = toThaiDigits(opts.signatoryName || opts.signatory?.name || 'ผู้ตรวจสอบภายใน');
  const signatoryPosition = toThaiDigits(opts.signatoryPosition || opts.signatory?.position || 'นักวิชาการตรวจสอบภายในชำนาญการ');
  const signatoryRole = toThaiDigits(opts.signatoryRole || opts.signatory?.role || 'ผู้รายงาน');
  const palatReviewText = toThaiDigits(opts.palatReviewText || 'เห็นควรอนุมัติและสั่งการตามเสนอ');
  const executiveOrderText = toThaiDigits(opts.executiveOrderText || 'อนุมัติ / เห็นชอบตามเสนอ');
  const orgName = toThaiDigits(opts.orgName || 'องค์กรปกครองส่วนท้องถิ่น');
  let rawFileName = opts.fileName || 'บันทึกข้อความ';
  rawFileName = rawFileName.replace(/\.doc$/i, '');

  const bodyContent = `
    <!-- ส่วนหัวบันทึกข้อความ (แบบที่ ๒ ท้ายระเบียบฯ) -->
    <table style="width: 100%; border-bottom: 2pt solid black; padding-bottom: 6pt; margin-bottom: 12pt;">
      <tr>
        <td style="width: 15%; vertical-align: top; text-align: left;">
          ${GARUDA_SVG_1_5CM_HTML}
        </td>
        <td style="width: 85%; text-align: center; vertical-align: middle;">
          <div class="memo-title">บันทึกข้อความ</div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top: 8pt;">
          <p style="margin: 0 0 4pt 0; font-size: 16pt;">
            <span class="header-field">ส่วนราชการ:</span> ${escapeHtml(agency)} ${phone ? `โทร. ${escapeHtml(phone)}` : ''}
          </p>
          <table style="width: 100%; margin: 0 0 4pt 0;">
            <tr>
              <td style="width: 50%;">
                <span class="header-field">ที่:</span> ${escapeHtml(docNumber)}
              </td>
              <td style="width: 50%;">
                <span class="header-field"></span> ${escapeHtml(docDate)}
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 4pt 0; font-size: 16pt;">
            <span class="header-field">เรื่อง:</span> <strong>${escapeHtml(subject)}</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- คำขึ้นต้น -->
    <p style="margin-bottom: 10pt; font-size: 16pt;">
      <span class="header-field">เรียน:</span> ${escapeHtml(to)}
    </p>

    <!-- เนื้อหาบันทึกข้อความ -->
    <div style="margin-bottom: 16pt; font-size: 16pt;">
      ${paragraphsHtml}
    </div>

    <!-- ลายมือชื่อผู้ตรวจ (เยื้องขวา) -->
    <table style="width: 100%; margin-top: 24pt; margin-bottom: 24pt; border: none;">
      <tr>
        <td style="width: 45%;"></td>
        <td style="width: 55%; text-align: center; font-size: 16pt;">
          <p style="margin: 0;">(ลงชื่อ)........................................................</p>
          <p style="margin: 4pt 0 0 0; font-weight: bold;">(${escapeHtml(signatoryName)})</p>
          <p style="margin: 2pt 0 0 0;">${escapeHtml(signatoryPosition)}</p>
          ${signatoryRole ? `<p style="margin: 2pt 0 0 0; font-size: 14pt;">(${escapeHtml(signatoryRole)})</p>` : ''}
        </td>
      </tr>
    </table>

    <!-- ส่วนเกษียณสั่งการ (ความเห็นปลัด & คำสั่งนายก) -->
    <table style="width: 100%; border-top: 1.5pt solid black; margin-top: 18pt; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; border: 1pt solid #777; padding: 8pt; vertical-align: top; font-size: 14pt;">
          <p style="margin: 0 0 6pt 0; font-weight: bold; text-decoration: underline; font-size: 15pt;">ความเห็นของปลัดองค์กรปกครองส่วนท้องถิ่น</p>
          <p style="margin: 0 0 4pt 0;">เรียน นายก${escapeHtml(orgName)}</p>
          <p style="margin: 0 0 3pt 0;">[  ] เพื่อโปรดทราบ</p>
          <p style="margin: 0 0 3pt 0;">[  ] ${escapeHtml(palatReviewText)}</p>
          <p style="margin: 0 0 10pt 0;">[  ] อื่นๆ ..............................................................</p>
          <p style="text-align: center; margin: 18pt 0 0 0;">(ลงชื่อ)........................................................</p>
          <p style="text-align: center; margin: 2pt 0 0 0;">ปลัด${escapeHtml(orgName)}</p>
          <p style="text-align: center; margin: 2pt 0 0 0; font-size: 12pt;">วันที่ ...... / ...... / ......</p>
        </td>
        <td style="width: 50%; border: 1pt solid #777; padding: 8pt; vertical-align: top; font-size: 14pt;">
          <p style="margin: 0 0 6pt 0; font-weight: bold; text-decoration: underline; font-size: 15pt;">คำสั่งการของนายกองค์กรปกครองส่วนท้องถิ่น</p>
          <p style="margin: 0 0 3pt 0;">[  ] ทราบ</p>
          <p style="margin: 0 0 3pt 0;">[  ] ${escapeHtml(executiveOrderText)}</p>
          <p style="margin: 0 0 10pt 0;">[  ] อื่นๆ ..............................................................</p>
          <p style="text-align: center; margin: 18pt 0 0 0;">(ลงชื่อ)........................................................</p>
          <p style="text-align: center; margin: 2pt 0 0 0;">นายก${escapeHtml(orgName)}</p>
          <p style="text-align: center; margin: 2pt 0 0 0; font-size: 12pt;">วันที่ ...... / ...... / ......</p>
        </td>
      </tr>
    </table>
  `;

  const fullHtml = wrapWordHtml(bodyContent, subject);
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `${rawFileName}.doc`);
}

/**
 * 2. ส่งออกหนังสือภายนอกเป็นไฟล์ Word (.doc)
 * สอดคล้องระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖ แบบที่ ๑
 */
export function exportThaiExternalLetterToWord(opts = {}) {
  const docNumber = toThaiDigits(opts.docNumber || 'อบ ๗๑๒๐๑/พิเศษ');
  const agencyName = toThaiDigits(opts.agencyName || 'องค์การบริหารส่วนตำบลต้นแบบ');
  const agencyAddress = toThaiDigits(opts.agencyAddress || '');
  const rawDate = opts.docDate || opts.date || '';
  const docDate = rawDate ? formatSarabanDate(rawDate, { isExternal: true }) : '...... เดือน ................................ พ.ศ. ............';
  const subject = toThaiDigits(opts.subject || 'เรื่องขอความอนุเคราะห์');
  const to = toThaiDigits(opts.to || 'หัวหน้าหน่วยงาน');
  const reference = toThaiDigits(opts.reference || '');
  const attachments = (opts.attachments || []).map((a) => toThaiDigits(a));
  const bodyReason = toThaiDigits(opts.bodyReason || '');
  const bodyIntent = toThaiDigits(opts.bodyIntent || '');
  const bodyConclusion = toThaiDigits(opts.bodyConclusion || 'จึงเรียนมาเพื่อโปรดพิจารณา');
  const signatoryName = toThaiDigits(opts.signatoryName || opts.signatory?.name || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const signatoryPosition = toThaiDigits(opts.signatoryPosition || opts.signatory?.position || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const contactDept = toThaiDigits(opts.contactDepartment || 'หน่วยตรวจสอบภายใน');
  const phone = toThaiDigits(opts.phone || '');
  const fax = toThaiDigits(opts.fax || '');
  const email = opts.email || '';
  let rawFileName = (opts.fileName || `หนังสือภายนอก_${subject.slice(0, 30)}`).replace(/\.doc$/i, '');

  const bodyContent = `
    <!-- ครุฑ ๓ ซม. กึ่งกลาง -->
    <div style="text-align: center; margin-bottom: 12pt;">
      ${GARUDA_SVG_3CM_HTML}
    </div>

    <!-- ที่ และ ส่วนราชการ -->
    <table style="width: 100%; margin-bottom: 12pt; font-size: 16pt;">
      <tr>
        <td style="width: 50%;">
          <strong>ที่</strong> ${escapeHtml(docNumber)}
        </td>
        <td style="width: 50%; padding-left: 20pt;">
          <p style="margin: 0; font-weight: bold;">${escapeHtml(agencyName)}</p>
          ${agencyAddress ? `<p style="margin: 2pt 0 0 0; font-size: 15pt;">${escapeHtml(agencyAddress)}</p>` : ''}
        </td>
      </tr>
    </table>

    <!-- วัน เดือน ปี (กึ่งกลาง ไม่มีคำว่า "วันที่") -->
    <div style="text-align: center; margin: 12pt 0; font-size: 16pt;">
      ${escapeHtml(docDate)}
    </div>

    <!-- เรื่อง, เรียน, อ้างถึง, สิ่งที่ส่งมาด้วย -->
    <p style="margin: 0 0 4pt 0; font-size: 16pt;"><strong>เรื่อง</strong> ${escapeHtml(subject)}</p>
    <p style="margin: 0 0 4pt 0; font-size: 16pt;"><strong>เรียน</strong> ${escapeHtml(to)}</p>
    ${reference ? `<p style="margin: 0 0 4pt 0; font-size: 16pt;"><strong>อ้างถึง</strong> ${escapeHtml(reference)}</p>` : ''}
    ${attachments && attachments.length > 0 ? `
      <table style="width: 100%; margin: 0 0 8pt 0; font-size: 16pt;">
        <tr>
          <td style="width: 18%; font-weight: bold;">สิ่งที่ส่งมาด้วย</td>
          <td style="width: 82%;">
            ${attachments.map((att, i) => `<div>${attachments.length > 1 ? toThaiDigits(i + 1) + '. ' : ''}${escapeHtml(att)}</div>`).join('')}
          </td>
        </tr>
      </table>
    ` : ''}

    <!-- ภาคเหตุ, ภาคความประสงค์, ภาคสรุป -->
    <div style="margin-top: 14pt; margin-bottom: 20pt; font-size: 16pt; line-height: 1.35;">
      ${bodyReason ? `<p class="indent" style="margin-bottom: 8pt; text-align: justify;">${escapeHtml(bodyReason)}</p>` : ''}
      ${bodyIntent ? `<p class="indent" style="margin-bottom: 8pt; text-align: justify;">${escapeHtml(bodyIntent)}</p>` : ''}
      ${bodyConclusion ? `<p class="indent" style="margin-bottom: 12pt; text-align: justify;">${escapeHtml(bodyConclusion)}</p>` : ''}
    </div>

    <!-- ลายมือชื่อ (เยื้องขวา) -->
    <table style="width: 100%; margin-top: 24pt; margin-bottom: 30pt; border: none; font-size: 16pt;">
      <tr>
        <td style="width: 45%;"></td>
        <td style="width: 55%; text-align: center;">
          <p style="margin: 0 0 16pt 0;">ขอแสดงความนับถือ</p>
          <p style="margin: 0;">(ลงชื่อ)........................................................</p>
          <p style="margin: 4pt 0 0 0; font-weight: bold;">(${escapeHtml(signatoryName)})</p>
          <p style="margin: 2pt 0 0 0;">${escapeHtml(signatoryPosition)}</p>
        </td>
      </tr>
    </table>

    <!-- ส่วนราชการเจ้าของเรื่อง ท้ายกระดาษด้านซ้าย -->
    <div style="margin-top: 30pt; font-size: 14pt; border-top: 1pt solid #ddd; padding-top: 8pt;">
      <p style="margin: 0;">${escapeHtml(agencyName)}</p>
      <p style="margin: 2pt 0 0 0;">${escapeHtml(contactDept)}</p>
      ${phone ? `<p style="margin: 2pt 0 0 0;">โทร. ${escapeHtml(phone)}</p>` : ''}
      ${fax ? `<p style="margin: 2pt 0 0 0;">โทรสาร ${escapeHtml(fax)}</p>` : ''}
      ${email ? `<p style="margin: 2pt 0 0 0;">ไปรษณีย์อิเล็กทรอนิกส์: ${escapeHtml(email)}</p>` : ''}
    </div>
  `;

  const fullHtml = wrapWordHtml(bodyContent, subject);
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `${rawFileName}.doc`);
}

/**
 * 3. ส่งออกคำสั่งทางการเป็นไฟล์ Word (.doc)
 * สอดคล้องระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖ แบบที่ ๑๔
 */
export function exportThaiOrderToWord(opts = {}) {
  const header = toThaiDigits(opts.orderHeader || opts.title || 'คำสั่ง');
  const orderNumber = toThaiDigits(opts.orderNumber || opts.docNumber || 'ที่ ........./๒๕๖๙');
  const subject = toThaiDigits(opts.orderSubject || opts.subject || '');
  const preamble = toThaiDigits(opts.orderPreamble || opts.preamble || '');
  const clauses = (opts.orderClauses || opts.clauses || []).map((c) => toThaiDigits(c));
  const effectiveDate = toThaiDigits(opts.orderEffectiveDate || opts.effectiveDate || '');
  const rawDate = opts.orderIssuedDate || opts.issuedDate || opts.docDate || '';
  const issuedDate = rawDate ? formatSarabanDate(rawDate, { isOrder: true }) : 'สั่ง ณ วันที่ ...... เดือน ................................ พ.ศ. ............';
  const signatoryName = toThaiDigits(opts.orderSignatoryName || opts.signatory?.name || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const signatoryPosition = toThaiDigits(opts.orderSignatoryPosition || opts.signatory?.position || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  let rawFileName = (opts.fileName || `คำสั่ง_${subject.slice(0, 30)}`).replace(/\.doc$/i, '');

  const bodyContent = `
    <!-- ครุฑ ๓ ซม. กึ่งกลาง -->
    <div style="text-align: center; margin-bottom: 12pt;">
      ${GARUDA_SVG_3CM_HTML}
      <div class="order-title" style="margin-top: 6pt;">${escapeHtml(header)}</div>
      <div style="font-weight: bold; font-size: 16pt; margin-top: 4pt;">${escapeHtml(orderNumber)}</div>
      <div style="font-weight: bold; font-size: 16pt; margin-top: 4pt; margin-bottom: 14pt;">เรื่อง ${escapeHtml(subject)}</div>
    </div>

    <div style="border-top: 1pt solid black; margin-bottom: 14pt;"></div>

    <!-- คำปรารภ -->
    <div class="indent" style="margin-bottom: 10pt; text-align: justify; line-height: 1.35; font-size: 16pt;">
      ${escapeHtml(preamble).replace(/\n/g, '<br/>')}
    </div>

    <!-- ข้อกำหนด -->
    ${clauses.map((c) => `
      <div style="margin-left: 2cm; margin-bottom: 6pt; text-align: justify; font-size: 16pt; line-height: 1.35;">
        ${escapeHtml(c)}
      </div>
    `).join('')}

    <!-- วันบังคับใช้ -->
    ${effectiveDate ? `
      <div class="indent" style="margin-top: 12pt; margin-bottom: 10pt; font-size: 16pt;">
        ${escapeHtml(effectiveDate)}
      </div>
    ` : ''}

    <!-- สั่ง ณ วันที่ -->
    <div class="indent" style="margin-top: 12pt; margin-bottom: 24pt; font-size: 16pt;">
      ${escapeHtml(issuedDate)}
    </div>

    <!-- ลายมือชื่อ (เยื้องขวา) -->
    <table style="width: 100%; margin-top: 30pt; border: none; font-size: 16pt;">
      <tr>
        <td style="width: 45%;"></td>
        <td style="width: 55%; text-align: center;">
          <p style="margin: 0;">(ลงชื่อ)........................................................</p>
          <p style="margin: 4pt 0 0 0; font-weight: bold;">(${escapeHtml(signatoryName)})</p>
          <p style="margin: 2pt 0 0 0;">${escapeHtml(signatoryPosition)}</p>
        </td>
      </tr>
    </table>
  `;

  const fullHtml = wrapWordHtml(bodyContent, subject);
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `${rawFileName}.doc`);
}

/**
 * 4. ส่งออกเอกสารทั่วไป / รายงานทางการเป็น Word (.doc)
 * แปลงตัวเลขทุกตำแหน่งเป็นตัวเลขไทยโดยอัตโนมัติ
 */
export function exportDocumentToWord(arg1 = {}, arg2, arg3) {
  let title = 'รายงานผลการตรวจสอบ';
  let htmlContent = '';
  let fileName = 'รายงานตรวจสอบ';

  if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1)) {
    title = arg1.title || 'รายงานผลการตรวจสอบ';
    htmlContent = arg1.htmlContent || arg1.content || arg1.bodyContent || '';
    fileName = arg1.fileName || 'รายงานตรวจสอบ';
  } else if (typeof arg1 === 'string') {
    htmlContent = arg1;
    if (typeof arg2 === 'string') fileName = arg2;
    if (typeof arg3 === 'string') title = arg3;
  }

  // แปลงตัวเลขเป็นเลขไทย
  const thaiContent = toThaiDigits(htmlContent);
  const cleanFileName = (fileName || 'รายงานตรวจสอบ').replace(/\.doc$/i, '');
  const fullHtml = wrapWordHtml(thaiContent, title);
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `${cleanFileName}.doc`);
}

/**
 * 5. ส่งออกตารางข้อมูลเป็นไฟล์ Excel (.xlsx) ด้วย SheetJS
 */
export function exportDataToExcel(arg1 = {}, arg2, arg3, arg4, arg5) {
  let sheetName = 'ข้อมูลตรวจสอบ';
  let headers = [];
  let rows = [];
  let fileName = 'ตารางตรวจสอบ';
  let colWidths = [];

  if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1) && ('headers' in arg1 || 'rows' in arg1 || 'sheetName' in arg1 || 'fileName' in arg1)) {
    sheetName = arg1.sheetName || 'ข้อมูลตรวจสอบ';
    headers = arg1.headers || [];
    rows = arg1.rows || [];
    fileName = arg1.fileName || 'ตารางตรวจสอบ';
    colWidths = arg1.colWidths || [];
  } else {
    sheetName = typeof arg1 === 'string' ? arg1 : 'ข้อมูลตรวจสอบ';

    if (Array.isArray(arg2) && arg2.length > 0 && Array.isArray(arg2[0]) && (!arg3 || typeof arg3 === 'string')) {
      headers = arg2[0] || [];
      rows = arg2.slice(1);
      fileName = typeof arg3 === 'string' ? arg3 : 'ตารางตรวจสอบ';
      colWidths = Array.isArray(arg4) ? arg4 : [];
    } else {
      headers = Array.isArray(arg2) ? arg2 : [];
      rows = Array.isArray(arg3) ? arg3 : [];
      fileName = typeof arg4 === 'string' ? arg4 : 'ตารางตรวจสอบ';
      colWidths = Array.isArray(arg5) ? arg5 : [];
    }
  }

  const cleanFileName = (fileName || 'ตารางตรวจสอบ').replace(/\.xlsx$/i, '');

  try {
    const workbook = XLSX.utils.book_new();

    const formattedRows = rows.map((row) => {
      if (Array.isArray(row)) return row;
      if (typeof row === 'object' && row !== null) {
        if (headers.length > 0) {
          return headers.map((h, i) => row[h] ?? row[Object.keys(row)[i]] ?? '');
        }
        return Object.values(row);
      }
      return [row];
    });

    const data = headers.length > 0 ? [headers, ...formattedRows] : formattedRows;
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    if (colWidths && colWidths.length > 0) {
      worksheet['!cols'] = colWidths.map((w) => ({ wch: typeof w === 'number' ? w : 18 }));
    }

    const cleanSheetName = (sheetName || 'Sheet1').replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName);

    XLSX.writeFile(workbook, `${cleanFileName}.xlsx`);
    return true;
  } catch (err) {
    console.error('Error exporting to XLSX, using fallback CSV:', err);
    let csv = '\uFEFF';
    if (headers.length > 0) {
      csv += headers.map((h) => `"${String(h ?? '').replace(/"/g, '""')}"`).join(',') + '\r\n';
    }
    rows.forEach((r) => {
      const rowArr = Array.isArray(r) ? r : Object.values(r || {});
      csv += rowArr.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',') + '\r\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${cleanFileName}.csv`);
    return true;
  }
}

/**
 * 6. Helper เฉพาะสำหรับตารางการประเมินความเสี่ยง SOFCK (16 กิจกรรม สถ.)
 */
export function exportRiskMatrixToExcel({
  activities = [],
  orgProfile = {},
  selectedYear = '2569'
}) {
  const headers = [
    'ลำดับ',
    'สำนัก/กอง',
    'กิจกรรมที่ประเมินความเสี่ยง',
    'S (ยุทธศาสตร์)',
    'O (การดำเนินงาน)',
    'F (การเงิน/พัสดุ)',
    'C (การปฏิบัติตามกฎ)',
    'K (สารสนเทศ)',
    'คะแนนเฉลี่ย',
    'ระดับความเสี่ยง',
    'จัดเข้าแผนตรวจสอบ'
  ];

  const rows = activities.map((act, idx) => {
    const s = Number(act.sScore ?? act.scoreS ?? act.s ?? 1);
    const o = Number(act.oScore ?? act.scoreO ?? act.o ?? 1);
    const f = Number(act.fScore ?? act.scoreF ?? act.f ?? 1);
    const c = Number(act.cScore ?? act.scoreC ?? act.c ?? 1);
    const k = Number(act.kScore ?? act.scoreK ?? act.k ?? 1);
    const avgVal = act.score != null ? Number(act.score) : Number(((s + o + f + c + k) / 5).toFixed(1));
    const level = act.level || act.riskLevel || (avgVal >= 2.4 ? 'สูง' : avgVal >= 1.6 ? 'ปานกลาง' : 'ต่ำ');
    const inPlan = (act.includedInPlan || act.inPlan || act.inAnnualPlan || level === 'สูง' || level === 'สูงมาก') ? 'บรรจุในแผนแล้ว' : 'เฝ้าระวัง/แผนระยะยาว';
    const activityName = act.activity || act.name || act.title || '-';

    return [
      idx + 1,
      act.department || '-',
      activityName,
      s,
      o,
      f,
      c,
      k,
      avgVal,
      level,
      inPlan
    ];
  });

  const widths = [8, 20, 42, 10, 10, 10, 10, 10, 14, 20, 22];
  const orgName = orgProfile?.name || 'อปท';
  exportDataToExcel({
    sheetName: `ความเสี่ยง_${selectedYear}`,
    headers,
    rows,
    fileName: `การประเมินความเสี่ยง_SOFCK_ปี_${selectedYear}_${orgName}`,
    colWidths: widths
  });
}

/**
 * 7. ระบบตรวจสอบและตั้งค่าขนาดหน้ากระดาษอัจฉริยะ (Smart Print Orientation)
 * ตรวจสอบความกว้างของเนื้อหาหรือประเภทเอกสาร:
 * - เอกสารแนวนอน (Landscape): ตาราง Matrix SOFCK, ตารางประเมินความเสี่ยง สถ., ตารางหลายคอลัมน์
 * - เอกสารแนวตั้ง (Portrait): บันทึกข้อความราชการ, รายงาน, หนังสือราชการ
 * @param {'auto'|'portrait'|'landscape'} preferred
 * @param {string} [elementId]
 * @returns {'portrait'|'landscape'}
 */
export function applySmartPrintOrientation(preferred = 'auto', elementId = null) {
  let orientation = preferred;

  if (orientation === 'auto') {
    if (elementId && typeof document !== 'undefined') {
      const el = document.getElementById(elementId);
      if (el) {
        const table = el.querySelector('table');
        if (table && table.rows.length > 0 && table.rows[0].cells.length > 5) {
          orientation = 'landscape';
        } else if (el.scrollWidth > 780) {
          orientation = 'landscape';
        } else {
          orientation = 'portrait';
        }
      }
    }
    if (orientation === 'auto') {
      orientation = 'portrait';
    }
  }

  if (typeof document !== 'undefined') {
    let styleEl = document.getElementById('smart-print-orientation-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'smart-print-orientation-style';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `@media print { @page { size: ${orientation}; margin: ${orientation === 'landscape' ? '15mm 15mm 15mm 15mm' : '25mm 20mm 20mm 30mm'}; } }`;
  }

  return orientation;
}

/**
 * 7. Helper สำหรับการพิมพ์เอกสาร (Direct Clean Print)
 */
export function triggerDirectPrint(elementId) {
  if (elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      window.print();
      return;
    }
  }
  window.print();
}
