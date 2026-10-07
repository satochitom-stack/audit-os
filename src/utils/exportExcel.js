// ส่งออกกระดาษทำการตรวจสอบเป็นไฟล์ Excel (.xls)
//
// ใช้เทคนิค "HTML Table เป็น .xls" (Excel เปิดไฟล์ HTML ที่มีนามสกุล .xls ได้โดยตรง)
// เพื่อให้ได้ตารางที่มีการจัดรูปแบบ (ตีเส้น, สีหัวตาราง, ตัวหนา, การรวมเซลล์)
// ใกล้เคียงกระดาษทำการจริงที่ใช้พิมพ์ โดยไม่ต้องพึ่งพาไลบรารีภายนอกเพิ่มเติม
// (เหมาะกับโปรเจกต์นี้ที่ไม่มีการเชื่อมต่ออินเทอร์เน็ต/ไม่สามารถติดตั้งแพ็กเกจใหม่ได้ทุกครั้ง)

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const RESULT_LABEL = {
  passed: 'ปฏิบัติถูกต้อง',
  failed: 'มีข้อบกพร่อง',
  na: 'ไม่เกี่ยวข้อง / ยังไม่ตรวจ',
};

function isSubsidyWorkingPaper(wp) {
  return wp?.id?.startsWith('WP-SUBSIDY');
}

export function exportWorkingPaperToExcel(wp, orgProfile) {
  if (!wp) return;

  const isSubsidy = isSubsidyWorkingPaper(wp);
  const docNoLabel = isSubsidy ? 'เลขที่โครงการ / บันทึกข้อตกลง' : 'เลขที่เอกสาร / ฎีกา';
  const payeeLabel = isSubsidy ? 'หน่วยงาน / องค์กรที่ขอรับเงินอุดหนุน' : 'ผู้รับเงิน / คู่สัญญา';
  const amountLabel = isSubsidy ? 'วงเงินอุดหนุน (บาท)' : 'จำนวนเงิน (บาท)';

  const thStyle =
    'background:#1e3a8a;color:#ffffff;font-weight:bold;border:1px solid #94a3b8;padding:6px 8px;text-align:center;font-size:12px;';
  const tdStyle = 'border:1px solid #cbd5e1;padding:6px 8px;font-size:12px;vertical-align:top;';
  const tdCenter = tdStyle + 'text-align:center;';
  const tdRight = tdStyle + 'text-align:right;';
  const sectionTitleStyle =
    'background:#dbeafe;color:#1e3a8a;font-weight:bold;border:1px solid #94a3b8;padding:6px 8px;font-size:13px;';
  const labelStyle = 'font-weight:bold;padding:4px 8px;font-size:12px;background:#f1f5f9;border:1px solid #cbd5e1;';
  const valueStyle = 'padding:4px 8px;font-size:12px;border:1px solid #cbd5e1;';

  const checklistRows = (wp.checklist || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="${tdCenter}">${idx + 1}</td>
        <td style="${tdStyle}">${escapeHtml(item.question)}</td>
        <td style="${tdCenter}">${escapeHtml(RESULT_LABEL[item.result] || item.result)}</td>
        <td style="${tdStyle}">${escapeHtml(item.note)}</td>
      </tr>`
    )
    .join('');

  const sampleRows = (wp.samples || [])
    .map(
      (s, idx) => `
      <tr>
        <td style="${tdCenter}">${idx + 1}</td>
        <td style="${tdStyle}">${escapeHtml(s.docNo)}</td>
        <td style="${tdCenter}">${escapeHtml(s.date)}</td>
        <td style="${tdStyle}">${escapeHtml(s.payee)}</td>
        <td style="${tdRight}">${Number(s.amount || 0).toLocaleString('th-TH')}</td>
        <td style="${tdCenter}">${escapeHtml(s.testResult)}</td>
        <td style="${tdStyle}">${escapeHtml(s.note)}</td>
      </tr>`
    )
    .join('');

  const criteriaHtml = (wp.criteria || [])
    .map((c) => `<div style="margin-bottom:2px;">- ${escapeHtml(c)}</div>`)
    .join('');

  const html = `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${escapeHtml(wp.id)}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>
  table { border-collapse: collapse; font-family: 'Tahoma', 'Sarabun', sans-serif; }
  td, th { mso-number-format:"\\@"; }
</style>
</head>
<body>
<table>
  <tr><td colspan="4" style="font-size:15px;font-weight:bold;text-align:center;padding:8px;">กระดาษทำการตรวจสอบภายใน (Audit Working Paper)</td></tr>
  <tr><td colspan="4" style="font-size:12px;text-align:center;padding:2px 8px 10px 8px;">${escapeHtml(
    orgProfile?.name || ''
  )} ${escapeHtml(orgProfile?.district || '')} ${escapeHtml(orgProfile?.province || '')}</td></tr>

  <tr>
    <td style="${labelStyle}">รหัสกระดาษทำการ</td><td style="${valueStyle}">${escapeHtml(wp.id)}</td>
    <td style="${labelStyle}">หน่วยรับตรวจ</td><td style="${valueStyle}">${escapeHtml(wp.department)}</td>
  </tr>
  <tr>
    <td style="${labelStyle}">เรื่องที่ตรวจสอบ</td><td colspan="3" style="${valueStyle}">${escapeHtml(wp.topic)}</td>
  </tr>
  <tr>
    <td style="${labelStyle}">ผู้ตรวจสอบ</td><td style="${valueStyle}">${escapeHtml(wp.auditor)}</td>
    <td style="${labelStyle}">งวดตรวจสอบ</td><td style="${valueStyle}">${escapeHtml(wp.auditPeriod)}</td>
  </tr>
  <tr>
    <td style="${labelStyle}">เกณฑ์/ระเบียบที่ใช้ตรวจสอบ</td>
    <td colspan="3" style="${valueStyle}">${criteriaHtml || '-'}</td>
  </tr>

  <tr><td colspan="4" style="height:8px;border:none;"></td></tr>

  <tr><td colspan="4" style="${sectionTitleStyle}">1. แนวทางการตรวจสอบและการควบคุมภายใน (Audit Program Checklist)</td></tr>
  <tr>
    <th style="${thStyle}">ที่</th>
    <th style="${thStyle}">รายการตรวจสอบ</th>
    <th style="${thStyle}">ผลการตรวจ</th>
    <th style="${thStyle}">หมายเหตุ</th>
  </tr>
  ${checklistRows || `<tr><td colspan="4" style="${tdStyle}">- ไม่มีข้อมูล -</td></tr>`}

  <tr><td colspan="4" style="height:8px;border:none;"></td></tr>

  <tr><td colspan="7" style="${sectionTitleStyle}">2. ตารางบันทึกการสุ่มตรวจตัวอย่าง (Sample Testing Records)</td></tr>
  <tr>
    <th style="${thStyle}">ลำดับ</th>
    <th style="${thStyle}">${escapeHtml(docNoLabel)}</th>
    <th style="${thStyle}">วันที่</th>
    <th style="${thStyle}">${escapeHtml(payeeLabel)}</th>
    <th style="${thStyle}">${escapeHtml(amountLabel)}</th>
    <th style="${thStyle}">ผลการตรวจ</th>
    <th style="${thStyle}">ข้อสังเกต / เอกสารแนบ</th>
  </tr>
  ${sampleRows || `<tr><td colspan="7" style="${tdStyle}">- ไม่มีข้อมูล -</td></tr>`}

  <tr><td colspan="7" style="height:8px;border:none;"></td></tr>

  <tr><td colspan="7" style="${sectionTitleStyle}">3. สรุปข้อตรวจพบและข้อเสนอแนะ (Audit Findings)</td></tr>
  <tr><td style="${labelStyle}">1. สภาพการณ์ที่ตรวจพบ (Condition)</td><td colspan="6" style="${valueStyle}">${escapeHtml(
    wp.finding?.condition
  ) || '-'}</td></tr>
  <tr><td style="${labelStyle}">2. สาเหตุ (Cause)</td><td colspan="6" style="${valueStyle}">${escapeHtml(
    wp.finding?.cause
  ) || '-'}</td></tr>
  <tr><td style="${labelStyle}">3. ผลกระทบ (Effect)</td><td colspan="6" style="${valueStyle}">${escapeHtml(
    wp.finding?.effect
  ) || '-'}</td></tr>
  <tr><td style="${labelStyle}">4. ข้อเสนอแนะ (Recommendation)</td><td colspan="6" style="${valueStyle}">${escapeHtml(
    wp.finding?.recommendation
  ) || '-'}</td></tr>

  <tr><td colspan="7" style="height:24px;border:none;"></td></tr>
  <tr>
    <td colspan="3" style="border:none;text-align:center;font-size:12px;">ลงชื่อ..............................................ผู้ตรวจสอบ<br/>(${escapeHtml(
      orgProfile?.auditorName
    )})<br/>${escapeHtml(orgProfile?.auditorPosition)}</td>
    <td style="border:none;"></td>
    <td colspan="3" style="border:none;text-align:center;font-size:12px;">ลงชื่อ..............................................ผู้สอบทาน<br/>(${escapeHtml(
      orgProfile?.palatName
    )})<br/>${escapeHtml(orgProfile?.palatPosition)}</td>
  </tr>
</table>
</body>
</html>`;

  const blob = new Blob(['﻿', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `กระดาษทำการ_${wp.id}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
