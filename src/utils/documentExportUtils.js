/**
 * Document & Data Export Utility for Audit-OS
 * รองรับการส่งออกเป็นไฟล์ Word (.doc) และ Excel (.xlsx / .xls) ตามระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖
 * และระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. ๒๕๔๕
 */

import * as XLSX from 'xlsx';

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
 * Garuda Emblem SVG for Word documents
 */
export const GARUDA_SVG_HTML = `
<div style="text-align: left; margin-bottom: 4pt;">
  <!-- ตราครุฑ 1.5 - 3 ซม. -->
  <svg width="60" height="60" viewBox="0 0 100 100" style="fill: black; display: inline-block;">
    <path d="M50 3 C53 10, 58 15, 66 14 C62 21, 56 25, 54 32 C60 30, 70 25, 80 21 C76 31, 68 38, 60 41 C66 45, 75 49, 83 51 C73 57, 63 55, 55 53 C53 62, 52 72, 50 82 C48 72, 47 62, 45 53 C37 55, 27 57, 17 51 C25 49, 34 45, 40 41 C32 38, 24 31, 20 21 C30 25, 40 30, 46 32 C44 25, 38 21, 34 14 C42 15, 47 10, 50 3 Z M50 32 C54 32, 57 35, 57 39 C57 43, 54 46, 50 46 C46 46, 43 43, 43 39 C43 35, 46 32, 50 32 Z M35 56 C42 62, 47 70, 50 80 C53 70, 58 62, 65 56 C60 62, 55 72, 50 88 C45 72, 40 62, 35 56 Z"/>
  </svg>
</div>
`;

export const THAI_GARUDA_SVG = GARUDA_SVG_HTML;

/**
 * Wrap HTML content inside Microsoft Word MSO HTML wrapper
 * Configured specifically for A4 with official Saraban margins:
 * Top: 2.5cm (70.85pt), Left: 2.5cm (70.85pt), Right: 2.0cm (56.7pt), Bottom: 2.0cm (56.7pt)
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
          margin: 70.85pt 56.7pt 56.7pt 70.85pt; /* Top 2.5cm, Right 2.0cm, Bottom 2.0cm, Left 2.5cm */
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
          font-size: 15pt;
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

  const agency = opts.agency || opts.agencyName || 'หน่วยตรวจสอบภายใน';
  const phone = opts.phone || '';
  const docNumber = opts.docNumber || 'อบ ๗๘๔๐๘/พิเศษ';
  const docDate = opts.docDate || opts.date || `วันที่ ...... เดือน ........................ พ.ศ. ............`;
  const subject = opts.subject || 'เรื่องเสนอเพื่อโปรดพิจารณา';
  const to = opts.to || opts.destination || 'นายกองค์กรปกครองส่วนท้องถิ่น (ผ่าน ปลัดองค์กรปกครองส่วนท้องถิ่น)';
  
  // Support both contentParagraphs array and content string (HTML)
  let paragraphsHtml = '';
  if (Array.isArray(opts.contentParagraphs) && opts.contentParagraphs.length > 0) {
    paragraphsHtml = opts.contentParagraphs.map((p) => {
      if (!p) return '';
      return `<p class="indent" style="margin-bottom: 8pt; text-align: justify; line-height: 1.3;">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
  } else if (typeof opts.content === 'string' && opts.content.trim()) {
    paragraphsHtml = `<div style="line-height: 1.3; font-size: 16pt;">${opts.content}</div>`;
  } else if (typeof opts.bodyContent === 'string' && opts.bodyContent.trim()) {
    paragraphsHtml = `<div style="line-height: 1.3; font-size: 16pt;">${opts.bodyContent}</div>`;
  }

  const signatoryName = opts.signatoryName || opts.signatory?.name || 'ผู้ตรวจสอบภายใน';
  const signatoryPosition = opts.signatoryPosition || opts.signatory?.position || 'นักวิชาการตรวจสอบภายในชำนาญการ';
  const signatoryRole = opts.signatoryRole || opts.signatory?.role || 'ผู้รายงาน';
  const palatReviewText = opts.palatReviewText || 'เห็นควรอนุมัติและสั่งการตามเสนอ';
  const executiveOrderText = opts.executiveOrderText || 'อนุมัติ / เห็นชอบตามเสนอ';
  const orgName = opts.orgName || 'องค์กรปกครองส่วนท้องถิ่น';
  let rawFileName = opts.fileName || 'บันทึกข้อความ';
  rawFileName = rawFileName.replace(/\.doc$/i, '');

  const bodyContent = `
    <!-- ส่วนหัวบันทึกข้อความ -->
    <table style="width: 100%; border-bottom: 2pt solid black; padding-bottom: 6pt; margin-bottom: 12pt;">
      <tr>
        <td style="width: 15%; vertical-align: top;">
          ${GARUDA_SVG_HTML}
        </td>
        <td style="width: 85%; text-align: center; vertical-align: middle;">
          <div class="memo-title">บันทึกข้อความ</div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top: 8pt;">
          <p style="margin: 0 0 4pt 0;">
            <span class="header-field">ส่วนราชการ:</span> ${escapeHtml(agency)} ${phone ? `โทร. ${escapeHtml(phone)}` : ''}
          </p>
          <table style="width: 100%; margin: 0 0 4pt 0;">
            <tr>
              <td style="width: 50%;">
                <span class="header-field">ที่:</span> ${escapeHtml(docNumber)}
              </td>
              <td style="width: 50%;">
                <span class="header-field">วันที่:</span> ${escapeHtml(docDate)}
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 4pt 0;">
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
    <div style="margin-bottom: 16pt;">
      ${paragraphsHtml}
    </div>

    <!-- ลายมือชื่อผู้ตรวจ -->
    <table style="width: 100%; margin-top: 20pt; margin-bottom: 20pt; border: none;">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%; text-align: center;">
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
        <td style="width: 50%; border: 1pt solid #777; padding: 8pt; vertical-align: top; font-size: 15pt;">
          <p style="margin: 0 0 6pt 0; font-weight: bold; text-decoration: underline;">ความเห็นของปลัดองค์กรปกครองส่วนท้องถิ่น</p>
          <p style="margin: 0 0 4pt 0; font-size: 14pt;">เรียน นายก${escapeHtml(orgName)}</p>
          <p style="margin: 0 0 3pt 0;">[  ] เพื่อโปรดทราบ</p>
          <p style="margin: 0 0 3pt 0;">[  ] ${escapeHtml(palatReviewText)}</p>
          <p style="margin: 0 0 10pt 0;">[  ] อื่นๆ ..............................................................</p>
          <p style="text-align: center; margin: 18pt 0 0 0;">(ลงชื่อ)........................................................</p>
          <p style="text-align: center; margin: 2pt 0 0 0; font-size: 14pt;">ปลัด${escapeHtml(orgName)}</p>
          <p style="text-align: center; margin: 2pt 0 0 0; font-size: 12pt;">วันที่ ...... / ...... / ......</p>
        </td>
        <td style="width: 50%; border: 1pt solid #777; padding: 8pt; vertical-align: top; font-size: 15pt;">
          <p style="margin: 0 0 6pt 0; font-weight: bold; text-decoration: underline;">คำสั่งการของนายกองค์กรปกครองส่วนท้องถิ่น</p>
          <p style="margin: 0 0 3pt 0;">[  ] ทราบ</p>
          <p style="margin: 0 0 3pt 0;">[  ] ${escapeHtml(executiveOrderText)}</p>
          <p style="margin: 0 0 10pt 0;">[  ] อื่นๆ ..............................................................</p>
          <p style="text-align: center; margin: 18pt 0 0 0;">(ลงชื่อ)........................................................</p>
          <p style="text-align: center; margin: 2pt 0 0 0; font-size: 14pt;">นายก${escapeHtml(orgName)}</p>
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
 * 2. ส่งออกเอกสารทั่วไป / รายงานทางการเป็น Word (.doc)
 * รองรับทั้งแบบ Object { title, htmlContent, fileName } และแบบ Positional (htmlContent, fileName, title)
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
    // Positional call: exportDocumentToWord(bodyContent, fileName, title)
    htmlContent = arg1;
    if (typeof arg2 === 'string') fileName = arg2;
    if (typeof arg3 === 'string') title = arg3;
  }

  const cleanFileName = (fileName || 'รายงานตรวจสอบ').replace(/\.doc$/i, '');
  const fullHtml = wrapWordHtml(htmlContent, title);
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, `${cleanFileName}.doc`);
}

/**
 * 3. ส่งออกตารางข้อมูลเป็นไฟล์ Excel (.xlsx) ด้วย SheetJS
 * รองรับทั้งแบบ Object { sheetName, headers, rows, fileName, colWidths }
 * และแบบ Positional (sheetName, headersOrData, rowsOrFileName, fileName, colWidths)
 */
export function exportDataToExcel(arg1 = {}, arg2, arg3, arg4, arg5) {
  let sheetName = 'ข้อมูลตรวจสอบ';
  let headers = [];
  let rows = [];
  let fileName = 'ตารางตรวจสอบ';
  let colWidths = [];

  if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1) && ('headers' in arg1 || 'rows' in arg1 || 'sheetName' in arg1 || 'fileName' in arg1)) {
    // Object signature
    sheetName = arg1.sheetName || 'ข้อมูลตรวจสอบ';
    headers = arg1.headers || [];
    rows = arg1.rows || [];
    fileName = arg1.fileName || 'ตารางตรวจสอบ';
    colWidths = arg1.colWidths || [];
  } else {
    // Positional signature: exportDataToExcel(sheetName, headers, rows, fileName, colWidths)
    // or: exportDataToExcel(sheetName, [headers, ...rows], fileName)
    sheetName = typeof arg1 === 'string' ? arg1 : 'ข้อมูลตรวจสอบ';

    if (Array.isArray(arg2) && arg2.length > 0 && Array.isArray(arg2[0]) && (!arg3 || typeof arg3 === 'string')) {
      // arg2 is [headers, ...rows]
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

  // Clean filename: remove trailing .xlsx if present
  const cleanFileName = (fileName || 'ตารางตรวจสอบ').replace(/\.xlsx$/i, '');

  try {
    const workbook = XLSX.utils.book_new();

    // Ensure rows format (convert objects to arrays if needed)
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

    // Combine headers and rows into 2D array
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
    // Fallback: CSV with UTF-8 BOM
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
 * 4. Helper เฉพาะสำหรับตารางการประเมินความเสี่ยง SOFCK (16 กิจกรรม สถ.)
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
    const s = act.scoreS ?? 0;
    const o = act.scoreO ?? 0;
    const f = act.scoreF ?? 0;
    const c = act.scoreC ?? 0;
    const k = act.scoreK ?? 0;
    const avg = act.averageScore ?? ((s + o + f + c + k) / 5).toFixed(2);
    const level = act.riskLevel || (avg >= 4 ? 'สูงมาก (Very High)' : avg >= 3 ? 'สูง (High)' : avg >= 2 ? 'ปานกลาง (Medium)' : 'ต่ำ (Low)');
    const inPlan = (act.inAnnualPlan || avg >= 3) ? 'อยู่ในแผนประจำปี' : 'เฝ้าระวัง/แผนระยะยาว';

    return [
      idx + 1,
      act.department || '-',
      act.name || act.title || '-',
      s,
      o,
      f,
      c,
      k,
      Number(avg),
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
 * 5. Helper สำหรับการพิมพ์เอกสาร (Direct Clean Print)
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
