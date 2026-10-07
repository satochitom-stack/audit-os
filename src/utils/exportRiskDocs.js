import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * exportRiskDocs.js
 * ส่งออกรายงานการบริหารจัดการความเสี่ยง (แบบ บส. 1 ถึง บส. 5)
 * ตามหนังสือสั่งการกระทรวงมหาดไทย ที่ มท 0805.2/ว 3482
 * รองรับการส่งออกเป็นไฟล์:
 * 1. Microsoft Word (.doc) - ฟอร์มตรงตามมาตรฐาน ว 3482 สมบูรณ์ ตารางไม่แตก
 * 2. Adobe PDF (.pdf) - ดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูงโดยตรง ไม่เปิดหน้าต่างพิมพ์ ไม่มีหัวท้ายระบบ
 * 3. พิมพ์เอกสาร (Print A4 แนวนอน) - สั่งพิมพ์ผ่านเบราว์เซอร์ ตัดหัวท้าย URL / วันที่อัตโนมัติ
 * 4. Microsoft Excel (.xls) - สรุปตารางคำนวณและวิเคราะห์ผล
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadBlob(content, fileName, mimeType) {
  const blob = new Blob(['\uFEFF' + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toThaiDigits(str) {
  if (str === null || str === undefined) return '';
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(str).replace(/[0-9]/g, (d) => thaiDigits[d]);
}

/**
 * Helper รวบรวมข้อมูลโครงสร้างและตารางของ แบบ บส. 1 - 5
 * เพื่อให้ Word, PDF และ Print แสดงผลถูกต้องตรงกัน 100% ตามมาตรฐาน ว 3482
 */
function getBsFormData({
  activeTab,
  filteredBs1 = [],
  filteredBs2 = [],
  filteredBs3 = [],
  filteredBs4 = [],
  filteredBs5Items = [],
  bs5Data = {},
  bs4Period = '6month',
  selectedYear = '2569',
  effectiveDept = ''
}) {
  let formNumber = '1';
  let formName = 'บส.1';
  let title = '';
  let subtitle = '';
  let tableHeaderHtml = '';
  let tableBodyHtml = '';
  let rowHtmls = [];
  let extraHtml = '';
  let totalCols = 8;
  let signatureNumber = { sign: '10', pos: '11', date: '12' };

  if (activeTab === 'bs1') {
    formNumber = '1';
    formName = 'บส.1';
    title = 'กำหนดขอบเขตความรับผิดชอบตามประเด็นยุทธศาสตร์/ข้อบัญญัติ/เทศบัญญัติ/อื่น ๆ (ถ้ามี)';
    subtitle = `ประจำปีงบประมาณ พ.ศ. ${selectedYear}`;
    signatureNumber = { sign: '10', pos: '11', date: '12' };

    const showDeptCol = (!effectiveDept || effectiveDept === 'all');
    totalCols = showDeptCol ? 8 : 7;

    tableHeaderHtml = `
      <tr style="mso-yfti-tblheader: yes;">
        <th style="width: 45pt; text-align: center; vertical-align: middle;">(3)<br/>รหัสความเสี่ยง</th>
        <th style="width: 110pt; text-align: center; vertical-align: middle;">(4)<br/>ยุทธศาสตร์ที่รับผิดชอบ</th>
        <th style="width: 140pt; text-align: center; vertical-align: middle;">(5)<br/>โครงการ/กิจกรรม/ภารกิจ อปท. ที่สำคัญ</th>
        <th style="width: 65pt; text-align: center; vertical-align: middle;">(6)<br/>งบประมาณ (บาท)</th>
        <th style="width: 130pt; text-align: center; vertical-align: middle;">(7)<br/>วัตถุประสงค์</th>
        <th style="width: 85pt; text-align: center; vertical-align: middle;">(8)<br/>ตัวชี้วัด</th>
        <th style="width: 85pt; text-align: center; vertical-align: middle;">(9)<br/>เป้าหมาย</th>
        ${showDeptCol ? '<th style="width: 75pt; text-align: center; vertical-align: middle;">ส่วนราชการ</th>' : ''}
      </tr>
    `;

    rowHtmls = filteredBs1.map((item, idx) => {
      const budgetVal = item.budget !== undefined && item.budget !== null && item.budget !== '' && !isNaN(Number(item.budget))
        ? Number(item.budget).toLocaleString()
        : (item.budget || '-');
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || `RSK-0${idx + 1}`)}</td>
          <td>${escapeHtml(item.strategy || '')}</td>
          <td style="font-weight: bold;">${escapeHtml(item.activity || '')}</td>
          <td style="text-align: right;">${budgetVal}</td>
          <td>${escapeHtml(item.objective || '')}</td>
          <td>${escapeHtml(item.kpi || '')}</td>
          <td>${escapeHtml(item.target || '')}</td>
          ${showDeptCol ? `<td style="text-align: center;">${escapeHtml(item.department || '')}</td>` : ''}
        </tr>
      `;
    });
    tableBodyHtml = rowHtmls.join('');
  } else if (activeTab === 'bs2') {
    formNumber = '2';
    formName = 'บส.2';
    title = 'การวิเคราะห์โอกาส ผลกระทบ และการตอบสนองความเสี่ยง';
    subtitle = `ประจำปีงบประมาณ พ.ศ. ${selectedYear}`;
    signatureNumber = { sign: '13', pos: '14', date: '15' };
    totalCols = 10;

    tableHeaderHtml = `
      <tr style="mso-yfti-tblheader: yes;">
        <th style="width: 45pt; text-align: center; vertical-align: middle;">(3)<br/>รหัสความเสี่ยง</th>
        <th style="width: 95pt; text-align: center; vertical-align: middle;">(4)<br/>โครงการ/กิจกรรม/ภารกิจ</th>
        <th style="width: 95pt; text-align: center; vertical-align: middle;">(5)<br/>วัตถุประสงค์</th>
        <th style="width: 70pt; text-align: center; vertical-align: middle;">(6)<br/>ผู้รับผิดชอบ</th>
        <th style="width: 95pt; text-align: center; vertical-align: middle;">(7)<br/>ความเสี่ยง</th>
        <th style="width: 75pt; text-align: center; vertical-align: middle;">(8)<br/>ประเภทความเสี่ยง</th>
        <th style="width: 30pt; text-align: center; vertical-align: middle;">(9)<br/>คะแนนโอกาส</th>
        <th style="width: 30pt; text-align: center; vertical-align: middle;">(10)<br/>คะแนนผลกระทบ</th>
        <th style="width: 65pt; text-align: center; vertical-align: middle;">(11)<br/>ระดับความเสี่ยง<br/>(9) x (10)</th>
        <th style="width: 140pt; text-align: center; vertical-align: middle;">(12)<br/>วิธีการตอบสนองความเสี่ยง</th>
      </tr>
    `;

    rowHtmls = filteredBs2.map((item) => {
      const l = Number(item.likelihood) || 1;
      const i = Number(item.impact) || 1;
      const score = item.riskScore !== undefined && item.riskScore !== null && item.riskScore !== ''
        ? Number(item.riskScore)
        : (l * i);
      const level = item.riskLevel || (score >= 15 ? 'สูงมาก' : score >= 10 ? 'สูง' : score >= 5 ? 'ปานกลาง' : 'ต่ำ');
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || '')}</td>
          <td style="font-weight: bold;">${escapeHtml(item.activity || '')}</td>
          <td>${escapeHtml(item.objective || '')}</td>
          <td>${escapeHtml(item.responsiblePerson || '')}</td>
          <td style="color: #b91c1c; font-weight: bold;">${escapeHtml(item.riskEvent || '')}</td>
          <td>${escapeHtml(item.riskCategory || '')}</td>
          <td style="text-align: center;">${l}</td>
          <td style="text-align: center;">${i}</td>
          <td style="text-align: center; font-weight: bold;">${score} (${level})</td>
          <td style="color: #1d4ed8;">${escapeHtml(item.riskResponse || '')}</td>
        </tr>
      `;
    });
    tableBodyHtml = rowHtmls.join('');
  } else if (activeTab === 'bs3') {
    formNumber = '3';
    formName = 'บส.3';
    title = 'รายงานการจัดทำแผนบริหารความเสี่ยง';
    subtitle = `ประจำปีงบประมาณ พ.ศ. ${selectedYear}`;
    signatureNumber = { sign: '12', pos: '13', date: '14' };
    totalCols = 9;

    tableHeaderHtml = `
      <tr style="mso-yfti-tblheader: yes;">
        <th style="width: 45pt; text-align: center; vertical-align: middle;">(3)<br/>รหัสความเสี่ยง</th>
        <th style="width: 95pt; text-align: center; vertical-align: middle;">(4)<br/>โครงการ/กิจกรรม/ภารกิจ</th>
        <th style="width: 90pt; text-align: center; vertical-align: middle;">(5)<br/>ความเสี่ยง</th>
        <th style="width: 85pt; text-align: center; vertical-align: middle;">(6)<br/>วิธีการตอบสนองความเสี่ยง</th>
        <th style="width: 70pt; text-align: center; vertical-align: middle;">(7)<br/>ผู้รับผิดชอบ</th>
        <th style="width: 120pt; text-align: center; vertical-align: middle;">(8)<br/>วิธีการจัดการความเสี่ยง (มาตรการ)</th>
        <th style="width: 75pt; text-align: center; vertical-align: middle;">(9)<br/>ตัวชี้วัด</th>
        <th style="width: 70pt; text-align: center; vertical-align: middle;">(10)<br/>ระยะเวลาดำเนินการ</th>
        <th style="width: 90pt; text-align: center; vertical-align: middle;">(11)<br/>วิธีการติดตาม และการรายงาน</th>
      </tr>
    `;

    rowHtmls = filteredBs3.map((item) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || '')}</td>
        <td style="font-weight: bold;">${escapeHtml(item.activity || '')}</td>
        <td style="color: #b91c1c; font-weight: bold;">${escapeHtml(item.riskEvent || '')}</td>
        <td>${escapeHtml(item.riskResponse || '')}</td>
        <td>${escapeHtml(item.responsiblePerson || '')}</td>
        <td>${escapeHtml(item.measures || '')}</td>
        <td>${escapeHtml(item.kpi || '')}</td>
        <td style="text-align: center;">${escapeHtml(item.timeline || '')}</td>
        <td>${escapeHtml(item.monitoringMethod || '')}</td>
      </tr>
    `);
    tableBodyHtml = rowHtmls.join('');
  } else if (activeTab === 'bs4') {
    formNumber = '4';
    formName = 'บส.4';
    title = 'รายงานการติดตามผลการบริหารความเสี่ยง';
    subtitle = `สำหรับปีงบประมาณ พ.ศ. ${selectedYear} &nbsp;&nbsp;&nbsp; [${bs4Period === '3month' ? '✓' : ' '}] รอบ 3 เดือน &nbsp;&nbsp;&nbsp; [${bs4Period === '6month' ? '✓' : ' '}] รอบ 6 เดือน &nbsp;&nbsp;&nbsp; [${bs4Period === '12month' ? '✓' : ' '}] รอบ 12 เดือน`;
    signatureNumber = { sign: '12', pos: '13', date: '14' };
    totalCols = 9;

    tableHeaderHtml = `
      <tr style="mso-yfti-tblheader: yes;">
        <th style="width: 45pt; text-align: center; vertical-align: middle;">(3)<br/>รหัสความเสี่ยง</th>
        <th style="width: 90pt; text-align: center; vertical-align: middle;">(4)<br/>โครงการ/กิจกรรม/ภารกิจ</th>
        <th style="width: 100pt; text-align: center; vertical-align: middle;">(5)<br/>วิธีการจัดการความเสี่ยง</th>
        <th style="width: 65pt; text-align: center; vertical-align: middle;">(6)<br/>ระยะเวลาดำเนินการ</th>
        <th style="width: 65pt; text-align: center; vertical-align: middle;">(7)<br/>ผู้รับผิดชอบ</th>
        <th style="width: 110pt; text-align: center; vertical-align: middle;">(8)<br/>ผลลัพธ์การดำเนินการจัดการความเสี่ยง</th>
        <th style="width: 80pt; text-align: center; vertical-align: middle;">(9)<br/>เอกสาร/หลักฐาน</th>
        <th style="width: 45pt; text-align: center; vertical-align: middle;">(10)<br/>ร้อยละความคืบหน้า</th>
        <th style="width: 140pt; text-align: center; vertical-align: middle;">(11)<br/>ปัญหาอุปสรรค และแนวทางแก้ไข</th>
      </tr>
    `;

    rowHtmls = filteredBs4.map((item) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || '')}</td>
        <td style="font-weight: bold;">${escapeHtml(item.activity || '')}</td>
        <td>${escapeHtml(item.measures || '')}</td>
        <td style="text-align: center;">${escapeHtml(item.timeline || '')}</td>
        <td>${escapeHtml(item.responsiblePerson || '')}</td>
        <td>${escapeHtml(item.result || '')}</td>
        <td>${escapeHtml(item.evidence || '')}</td>
        <td style="text-align: center; font-weight: bold;">${item.progressPercent || 0}%</td>
        <td>${escapeHtml(item.problemSolution || '-')}</td>
      </tr>
    `);
    tableBodyHtml = rowHtmls.join('');
  } else if (activeTab === 'bs5') {
    formNumber = '5';
    formName = 'บส.5';
    title = 'รายงานผลการดำเนินการและทบทวนแผนการบริหารความเสี่ยง';
    subtitle = `สำหรับปีงบประมาณ พ.ศ. ${selectedYear}`;
    signatureNumber = { sign: '14', pos: '15', date: '16' };
    totalCols = 16;

    // Header 16 คอลัมน์มาตรฐาน ว 3482 (ความกว้างรวม = 770pt พอดีกับขนาดหน้ากระดาษ A4 แนวนอน ไม่แตก ไม่ล้น)
    tableHeaderHtml = `
      <tr style="mso-yfti-tblheader: yes;">
        <th rowspan="2" style="width: 38pt; vertical-align: middle; text-align: center;">(3)<br/>รหัสความเสี่ยง</th>
        <th rowspan="2" style="width: 90pt; vertical-align: middle; text-align: center;">(4)<br/>โครงการ/กิจกรรม/ภารกิจ อปท. ที่สำคัญ</th>
        <th rowspan="2" style="width: 72pt; vertical-align: middle; text-align: center;">(5)<br/>ความเสี่ยง</th>
        <th colspan="3" style="width: 90pt; vertical-align: middle; text-align: center;">(6)<br/>คะแนนระดับความเสี่ยง<br/>ก่อนการดำเนินการ</th>
        <th rowspan="2" style="width: 75pt; vertical-align: middle; text-align: center;">(7)<br/>วิธีการจัดการความเสี่ยง</th>
        <th rowspan="2" style="width: 75pt; vertical-align: middle; text-align: center;">(8)<br/>ผลดำเนินการจากการจัดการความเสี่ยง</th>
        <th colspan="3" style="width: 90pt; vertical-align: middle; text-align: center;">(9)<br/>คะแนนระดับความเสี่ยง<br/>ภายหลังการดำเนินการ</th>
        <th rowspan="2" style="width: 50pt; vertical-align: middle; text-align: center;">(10)<br/>การเปลี่ยนแปลง<br/>ระดับความเสี่ยง</th>
        <th rowspan="2" style="width: 64pt; vertical-align: middle; text-align: center;">(11)<br/>ความเสี่ยงคงเหลือ/<br/>เกิดขึ้นใหม่</th>
        <th colspan="2" style="width: 50pt; vertical-align: middle; text-align: center;">(12)<br/>สรุปความเสี่ยง</th>
        <th rowspan="2" style="width: 76pt; vertical-align: middle; text-align: center;">(13)<br/>แนวทาง/มาตรการจัดการความเสี่ยง สำหรับปีถัดไป</th>
      </tr>
      <tr style="mso-yfti-tblheader: yes;">
        <th style="width: 27pt; vertical-align: middle; text-align: center; font-size: 7.5pt; padding: 2px 1px;">โอกาส<br/>(1)</th>
        <th style="width: 31pt; vertical-align: middle; text-align: center; font-size: 7.5pt; padding: 2px 1px;">ผลกระทบ<br/>(2)</th>
        <th style="width: 32pt; vertical-align: middle; text-align: center; font-size: 7.5pt; padding: 2px 1px;">คะแนน<br/>(3)=(1)x(2)</th>
        <th style="width: 27pt; vertical-align: middle; text-align: center; font-size: 7.5pt; padding: 2px 1px;">โอกาส<br/>(1)</th>
        <th style="width: 31pt; vertical-align: middle; text-align: center; font-size: 7.5pt; padding: 2px 1px;">ผลกระทบ<br/>(2)</th>
        <th style="width: 32pt; vertical-align: middle; text-align: center; font-size: 7.5pt; padding: 2px 1px;">คะแนน<br/>(3)=(1)x(2)</th>
        <th style="width: 25pt; vertical-align: middle; text-align: center; font-size: 7pt; padding: 2px 1px;">ควบคุมได้</th>
        <th style="width: 25pt; vertical-align: middle; text-align: center; font-size: 7pt; padding: 2px 1px;">ควบคุมไม่ได้</th>
      </tr>
    `;

    rowHtmls = filteredBs5Items.map((item) => {
      const preScore = (Number(item.preLikelihood) || 1) * (Number(item.preImpact) || 1);
      const postScore = (Number(item.postLikelihood) || 1) * (Number(item.postImpact) || 1);
      const isControllable = item.controllable === 'ควบคุมได้';
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || '')}</td>
          <td style="font-weight: bold;">${escapeHtml(item.activity || '')}</td>
          <td style="color: #b91c1c;">${escapeHtml(item.riskEvent || '')}</td>
          <td style="text-align: center;">${item.preLikelihood || 1}</td>
          <td style="text-align: center;">${item.preImpact || 1}</td>
          <td style="text-align: center; font-weight: bold;">${preScore}</td>
          <td>${escapeHtml(item.measures || '')}</td>
          <td>${escapeHtml(item.result || '')}</td>
          <td style="text-align: center;">${item.postLikelihood || 1}</td>
          <td style="text-align: center;">${item.postImpact || 1}</td>
          <td style="text-align: center; font-weight: bold; color: #15803d;">${postScore}</td>
          <td style="text-align: center;">${escapeHtml(item.riskChange || 'ลดลง')}</td>
          <td>${escapeHtml(item.residualRisk || '-')}</td>
          <td style="text-align: center; font-weight: bold;">${isControllable ? '✓' : ''}</td>
          <td style="text-align: center; font-weight: bold; color: #b91c1c;">${!isControllable ? '✓' : ''}</td>
          <td>${escapeHtml(item.nextYearMeasures || '')}</td>
        </tr>
      `;
    });
    tableBodyHtml = rowHtmls.join('');

    extraHtml = `
      <div class="extra-summary-box" style="margin-top: 6px; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc; font-size: 10pt;">
        <b>สรุปภาพรวมผลการดำเนินการและการทบทวนแผนบริหารความเสี่ยง ประจำปี พ.ศ. ${selectedYear}:</b>
        <p style="text-indent: 1.5cm; margin: 2px 0 0 0;">${escapeHtml(bs5Data.summary || '')}</p>
      </div>
    `;
  }

  return {
    formNumber,
    formName,
    title,
    subtitle,
    signatureNumber,
    totalCols,
    tableHeaderHtml,
    tableBodyHtml,
    rowHtmls,
    extraHtml
  };
}

// -------------------------------------------------------------
// 1. ส่งออกเป็น Microsoft Word (.doc)
// -------------------------------------------------------------
export function exportBsToWord({
  activeTab,
  filteredBs1 = [],
  filteredBs2 = [],
  filteredBs3 = [],
  filteredBs4 = [],
  filteredBs5Items = [],
  bs5Data = {},
  bs4Period = '6month',
  orgProfile = {},
  selectedYear = '2569',
  isSubDivision = false,
  effectiveDept = ''
}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const approverName = isSubDivision ? '....................................................' : (orgProfile.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const approverPosition = isSubDivision ? '....................................................' : (orgProfile.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const deptLabel = effectiveDept && effectiveDept !== 'all' ? `_${effectiveDept}` : '';

  const formData = getBsFormData({
    activeTab,
    filteredBs1,
    filteredBs2,
    filteredBs3,
    filteredBs4,
    filteredBs5Items,
    bs5Data,
    bs4Period,
    selectedYear,
    effectiveDept
  });

  const wordHtml = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>แบบ ${formData.formName} - ${escapeHtml(orgName)}</title>
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
          size: 841.95pt 595.35pt; /* A4 Landscape */
          mso-page-orientation: landscape;
          margin: 1.0cm 1.0cm 1.0cm 1.0cm;
          mso-header-margin: 20pt;
          mso-footer-margin: 20pt;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
        }
        body {
          font-family: 'TH SarabunPSK', 'TH Sarabun New', 'Angsana New', sans-serif;
          font-size: 13pt;
          color: #000000;
          line-height: 1.15;
        }
        .header-top {
          text-align: right;
          font-weight: bold;
          font-size: 14pt;
          margin-bottom: 2px;
        }
        .header-center {
          text-align: center;
          margin-bottom: 6px;
        }
        .header-center h2 {
          font-size: 15pt;
          font-weight: bold;
          margin: 0 0 2px 0;
        }
        .header-center p {
          font-size: 14pt;
          margin: 0 0 2px 0;
        }
        table {
          border-collapse: collapse;
          table-layout: fixed;
          mso-table-layout-alt: fixed;
          width: 100%;
          margin-top: 4px;
          margin-bottom: 8px;
        }
        tr {
          mso-yfti-irow: 0;
          page-break-inside: avoid;
        }
        thead tr {
          mso-yfti-tblheader: yes;
        }
        th, td {
          border: 1px solid #000000;
          padding: 3px 2px;
          vertical-align: top;
          font-size: ${activeTab === 'bs5' ? '10pt' : '10.5pt'};
          line-height: 1.15;
          word-wrap: break-word;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
        }
        .sig-block {
          width: 320pt;
          float: right;
          text-align: left;
          margin-top: 15pt;
          font-size: 12pt;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        <div class="header-top">แบบ บส. ${formData.formNumber}</div>
        <div class="header-center">
          <p style="font-weight: bold;">ชื่อหน่วยงาน ${escapeHtml(orgName)}</p>
          <h2>${escapeHtml(formData.title)}</h2>
          <p>${formData.subtitle}</p>
        </div>

        <table>
          <thead>
            ${formData.tableHeaderHtml}
          </thead>
          <tbody>
            ${formData.tableBodyHtml || `<tr><td colspan="${formData.totalCols}" style="text-align:center; padding: 15px;">ไม่พบข้อมูล</td></tr>`}
          </tbody>
        </table>

        ${formData.extraHtml}

        <div style="clear: both;"></div>

        <div class="sig-block">
          <div>ลายมือชื่อ....................................................................</div>
          <div style="text-indent: 40pt;">( ${escapeHtml(approverName)} )</div>
          <div>ตำแหน่ง ${escapeHtml(approverPosition)}</div>
          <div>วันที่............เดือน........................พ.ศ. .....................</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const fileName = `แบบ_${formData.formName}${deptLabel}_ปี${selectedYear}.doc`;
  downloadBlob(wordHtml, fileName, 'application/msword');
}

// -------------------------------------------------------------
// 2. ดาวน์โหลดเป็นไฟล์ PDF (.pdf) โดยตรง (ไม่มีหน้าต่างพิมพ์ ไม่มีหัวท้ายระบบ)
// -------------------------------------------------------------
export async function exportBsToPdf({
  activeTab,
  filteredBs1 = [],
  filteredBs2 = [],
  filteredBs3 = [],
  filteredBs4 = [],
  filteredBs5Items = [],
  bs5Data = {},
  bs4Period = '6month',
  orgProfile = {},
  selectedYear = '2569',
  isSubDivision = false,
  effectiveDept = ''
}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const approverName = isSubDivision ? '....................................................' : (orgProfile.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const approverPosition = isSubDivision ? '....................................................' : (orgProfile.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const deptLabel = effectiveDept && effectiveDept !== 'all' ? `_${effectiveDept}` : '';

  const formData = getBsFormData({
    activeTab,
    filteredBs1,
    filteredBs2,
    filteredBs3,
    filteredBs4,
    filteredBs5Items,
    bs5Data,
    bs4Period,
    selectedYear,
    effectiveDept
  });

  const commonStyle = `
    * { box-sizing: border-box !important; }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin-top: ${activeTab === 'bs5' ? '4px' : '6px'} !important;
      margin-bottom: ${activeTab === 'bs5' ? '4px' : '6px'} !important;
      border: 1px solid #000000 !important;
      font-size: ${activeTab === 'bs5' ? '8.5pt' : '10pt'} !important;
      line-height: 1.15 !important;
    }
    tr {
      background: transparent !important;
    }
    th, td {
      border: 1px solid #000000 !important;
      border-width: 1px !important;
      border-style: solid !important;
      border-color: #000000 !important;
      padding: ${activeTab === 'bs5' ? '3px 2px' : '4px 3px'} !important;
      vertical-align: top !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      color: #000000 !important;
    }
    th {
      background-color: #f1f5f9 !important;
      font-weight: bold !important;
      text-align: center !important;
      vertical-align: middle !important;
    }
    .extra-summary-box {
      margin-top: 6px !important;
      padding: 5px 8px !important;
      border: 1px solid #000000 !important;
      background-color: #f8fafc !important;
      font-size: 10pt !important;
      color: #000000 !important;
    }
  `;

  const signatureHtml = `
    <div style="width: 100%; display: flex; justify-content: flex-end; margin-top: ${activeTab === 'bs5' ? '8px' : '12px'};">
      <div class="sig-block" style="width: 330pt; text-align: left; font-size: ${activeTab === 'bs5' ? '11pt' : '11.5pt'}; line-height: 1.6; color: #000000;">
        <div>ลายมือชื่อ....................................................................</div>
        <div style="text-indent: 35pt;">( ${escapeHtml(approverName)} )</div>
        <div>ตำแหน่ง ${escapeHtml(approverPosition)}</div>
        <div>วันที่............เดือน........................พ.ศ. .....................</div>
      </div>
    </div>
  `;

  // Create measurement element off-screen
  const measureContainer = document.createElement('div');
  measureContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: -9999px;
    width: 1060px;
    background: #ffffff;
    font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
    visibility: hidden;
    z-index: -9999;
  `;
  document.body.appendChild(measureContainer);

  const fullHeaderHtml = `
    <div id="m-header" style="text-align: center; margin-bottom: 6px;">
      <div style="text-align: right; font-weight: bold; font-size: ${activeTab === 'bs5' ? '12pt' : '13pt'}; margin-bottom: 2px;">แบบ บส. ${formData.formNumber}</div>
      <p style="font-weight: bold; font-size: ${activeTab === 'bs5' ? '13pt' : '14pt'}; margin: 0 0 2px 0;">ชื่อหน่วยงาน ${escapeHtml(orgName)}</p>
      <h2 style="font-size: ${activeTab === 'bs5' ? '14pt' : '15pt'}; font-weight: bold; margin: 0 0 2px 0;">${escapeHtml(formData.title)}</h2>
      <p style="font-size: ${activeTab === 'bs5' ? '12pt' : '13pt'}; margin: 0;">${formData.subtitle}</p>
    </div>
  `;

  const compactHeaderTemplate = (pageNum, totalPages) => `
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px;">
      <span style="font-size: 12pt; font-weight: bold;">แบบ บส. ${formData.formNumber} (ต่อ) - ${escapeHtml(orgName)}</span>
      <span style="font-size: 11pt; color: #555;">หน้า ${pageNum} / ${totalPages}</span>
    </div>
  `;

  const rowsToMeasure = formData.rowHtmls && formData.rowHtmls.length > 0
    ? formData.rowHtmls
    : [`<tr><td colspan="${formData.totalCols}" style="text-align:center; padding: 15px;">ไม่พบข้อมูล</td></tr>`];

  measureContainer.innerHTML = `
    <style>${commonStyle}</style>
    ${fullHeaderHtml}
    <div id="m-header-compact">
      ${compactHeaderTemplate(2, 2)}
    </div>
    <table id="m-table">
      <thead>${formData.tableHeaderHtml}</thead>
      <tbody>
        ${rowsToMeasure.join('')}
      </tbody>
    </table>
    <div id="m-extra">${formData.extraHtml || ''}</div>
    <div id="m-sig">${signatureHtml}</div>
  `;

  // Wait for fonts to be ready
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const headerHeight = measureContainer.querySelector('#m-header').offsetHeight;
  const compactHeaderHeight = measureContainer.querySelector('#m-header-compact').offsetHeight;
  const theadHeight = measureContainer.querySelector('thead').offsetHeight;
  const extraEl = measureContainer.querySelector('#m-extra');
  const extraHeight = extraEl && formData.extraHtml ? extraEl.offsetHeight + 8 : 0;
  const sigHeight = measureContainer.querySelector('#m-sig').offsetHeight + 10;

  const rowEls = measureContainer.querySelectorAll('tbody tr');
  const rowHeights = Array.from(rowEls).map(r => r.offsetHeight);

  document.body.removeChild(measureContainer);

  // A4 Landscape printable height threshold at 1060px width
  const maxPageHeight = 715;

  // Distribute rows into pages
  const pages = [];
  let curRows = [];
  let curHeight = headerHeight + theadHeight + 15;
  let isFirst = true;

  for (let i = 0; i < rowsToMeasure.length; i++) {
    const rh = rowHeights[i] || 60;
    const isLastRow = (i === rowsToMeasure.length - 1);
    const needed = rh + (isLastRow ? (extraHeight + sigHeight) : 0);

    if (curHeight + needed > maxPageHeight && curRows.length > 0) {
      pages.push({
        isFirstPage: isFirst,
        items: curRows,
        hasExtra: false,
        hasSignature: false
      });
      isFirst = false;
      curRows = [rowsToMeasure[i]];
      curHeight = compactHeaderHeight + theadHeight + 15 + rh;
    } else {
      curRows.push(rowsToMeasure[i]);
      curHeight += rh;
    }
  }

  // Handle final page
  if (curRows.length > 0) {
    if (curHeight + extraHeight + sigHeight <= maxPageHeight) {
      pages.push({
        isFirstPage: isFirst,
        items: curRows,
        hasExtra: !!formData.extraHtml,
        hasSignature: true
      });
    } else {
      pages.push({
        isFirstPage: isFirst,
        items: curRows,
        hasExtra: false,
        hasSignature: false
      });
      pages.push({
        isFirstPage: false,
        items: [],
        hasExtra: !!formData.extraHtml,
        hasSignature: true
      });
    }
  }

  // Create temporary container for rendering pages
  const renderContainer = document.createElement('div');
  renderContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: -9999px;
    width: 1060px;
    background: #ffffff;
    z-index: -9999;
  `;
  document.body.appendChild(renderContainer);

  const pageDivs = [];
  pages.forEach((page, pageIdx) => {
    const pageDiv = document.createElement('div');
    pageDiv.style.cssText = `
      width: 1060px;
      background: #ffffff;
      color: #000000;
      padding: ${activeTab === 'bs5' ? '8px 12px' : '10px 15px'};
      box-sizing: border-box;
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
    `;

    let pageHeader = '';
    if (page.isFirstPage) {
      pageHeader = fullHeaderHtml;
    } else {
      pageHeader = compactHeaderTemplate(pageIdx + 1, pages.length);
    }

    let tableHtml = '';
    if (page.items.length > 0) {
      tableHtml = `
        <table>
          <thead>${formData.tableHeaderHtml}</thead>
          <tbody>
            ${page.items.join('')}
          </tbody>
        </table>
      `;
    }

    pageDiv.innerHTML = `
      <style>${commonStyle}</style>
      ${pageHeader}
      ${tableHtml}
      ${page.hasExtra ? formData.extraHtml : ''}
      ${page.hasSignature ? signatureHtml : ''}
    `;

    renderContainer.appendChild(pageDiv);
    pageDivs.push(pageDiv);
  });

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < pageDivs.length; i++) {
      const el = pageDivs[i];
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      if (i > 0) {
        pdf.addPage('a4', 'landscape');
      }

      const printWidth = 277; // 297mm - 20mm margins
      const printHeight = (canvas.height / canvas.width) * printWidth;
      pdf.addImage(imgData, 'JPEG', 10, 8, printWidth, printHeight);
    }

    pdf.save(`แบบ_${formData.formName}${deptLabel}_ปี${selectedYear}.pdf`);
  } finally {
    if (document.body.contains(renderContainer)) {
      document.body.removeChild(renderContainer);
    }
  }
}

// -------------------------------------------------------------
// 3. สั่งพิมพ์เอกสารทางเครื่องพิมพ์ (Print A4 แนวนอน - ตัดหัวท้ายเบราว์เซอร์อัตโนมัติ)
// -------------------------------------------------------------
export function exportBsToPrint({
  activeTab,
  filteredBs1 = [],
  filteredBs2 = [],
  filteredBs3 = [],
  filteredBs4 = [],
  filteredBs5Items = [],
  bs5Data = {},
  bs4Period = '6month',
  orgProfile = {},
  selectedYear = '2569',
  isSubDivision = false,
  effectiveDept = ''
}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const approverName = isSubDivision ? '....................................................' : (orgProfile.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const approverPosition = isSubDivision ? '....................................................' : (orgProfile.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const deptLabel = effectiveDept && effectiveDept !== 'all' ? `_${effectiveDept}` : '';

  const formData = getBsFormData({
    activeTab,
    filteredBs1,
    filteredBs2,
    filteredBs3,
    filteredBs4,
    filteredBs5Items,
    bs5Data,
    bs4Period,
    selectedYear,
    effectiveDept
  });

  const printHtml = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8">
      <title>แบบ_${formData.formName}${deptLabel}_ปี${selectedYear}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 0; /* ตัดหัวท้าย URL / วันที่ของเบราว์เซอร์ออกโดยอัตโนมัติ */
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: 'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', 'Angsana New', sans-serif;
          font-size: 13pt;
          color: #000;
          margin: 8mm 10mm;
          padding: 0;
          line-height: 1.2;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-top {
          text-align: right;
          font-weight: bold;
          font-size: 13pt;
          margin-bottom: 2px;
        }
        .header-center {
          text-align: center;
          margin-bottom: 6px;
        }
        .header-center p {
          font-size: 13pt;
          margin: 0 0 2px 0;
        }
        .header-center h2 {
          font-size: 14pt;
          font-weight: bold;
          margin: 0 0 2px 0;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          table-layout: fixed;
          margin-top: 4px;
          margin-bottom: 6px;
          font-size: ${activeTab === 'bs5' ? '8.5pt' : '10pt'};
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
        }
        th, td {
          border: 1px solid #000;
          padding: ${activeTab === 'bs5' ? '3px 2px' : '4px 3px'};
          vertical-align: top;
          word-wrap: break-word;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
        }
        .sig-block {
          width: 320pt;
          float: right;
          text-align: left;
          margin-top: ${activeTab === 'bs5' ? '10pt' : '14pt'};
          font-size: ${activeTab === 'bs5' ? '11.5pt' : '12pt'};
          line-height: 1.5;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header-top">แบบ บส. ${formData.formNumber}</div>
      <div class="header-center">
        <p style="font-weight: bold;">ชื่อหน่วยงาน ${escapeHtml(orgName)}</p>
        <h2>${escapeHtml(formData.title)}</h2>
        <p>${formData.subtitle}</p>
      </div>

      <table>
        <thead>
          ${formData.tableHeaderHtml}
        </thead>
        <tbody>
          ${formData.tableBodyHtml || `<tr><td colspan="${formData.totalCols}" style="text-align:center; padding: 15px;">ไม่พบข้อมูล</td></tr>`}
        </tbody>
      </table>

      ${formData.extraHtml}

      <div style="clear: both;"></div>

      <div class="sig-block">
        <div>ลายมือชื่อ....................................................................</div>
        <div style="text-indent: 40pt;">( ${escapeHtml(approverName)} )</div>
        <div>ตำแหน่ง ${escapeHtml(approverPosition)}</div>
        <div>วันที่............เดือน........................พ.ศ. .....................</div>
      </div>
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '1000px';
  iframe.style.height = '1000px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(printHtml);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 400);
}


// -------------------------------------------------------------
// 3. ส่งออกเป็น Microsoft Excel (.xls)
// -------------------------------------------------------------
export function exportBsToExcel({
  activeTab,
  filteredBs1 = [],
  filteredBs2 = [],
  filteredBs3 = [],
  filteredBs4 = [],
  filteredBs5Items = [],
  bs5Data = {},
  bs4Period = '6month',
  orgProfile = {},
  selectedYear = '2569',
  isSubDivision = false,
  effectiveDept = ''
}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const approverName = isSubDivision ? '....................................................' : (orgProfile.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const approverPosition = isSubDivision ? '....................................................' : (orgProfile.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น');
  const deptLabel = effectiveDept && effectiveDept !== 'all' ? `_${effectiveDept}` : '';

  let formNumber = '1';
  let formName = 'บส.1';
  let title = '';
  let subtitle = '';
  let tableHeaderHtml = '';
  let tableBodyHtml = '';
  let extraRowsHtml = '';
  let colSpanTotal = 8;

  if (activeTab === 'bs1') {
    formNumber = '1';
    formName = 'บส.1';
    title = 'กำหนดขอบเขตความรับผิดชอบตามประเด็นยุทธศาสตร์/ข้อบัญญัติ/เทศบัญญัติ/อื่น ๆ (ถ้ามี)';
    subtitle = `ประจำปีงบประมาณ พ.ศ. ${selectedYear}`;
    const showDeptCol = (!effectiveDept || effectiveDept === 'all');
    colSpanTotal = showDeptCol ? 8 : 7;

    tableHeaderHtml = `
      <tr>
        <th style="background-color: #D9E1F2;">(3) รหัสความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(4) ยุทธศาสตร์ที่รับผิดชอบ</th>
        <th style="background-color: #D9E1F2;">(5) โครงการ/กิจกรรม/ภารกิจ อปท. ที่สำคัญ</th>
        <th style="background-color: #D9E1F2;">(6) งบประมาณ (บาท)</th>
        <th style="background-color: #D9E1F2;">(7) วัตถุประสงค์</th>
        <th style="background-color: #D9E1F2;">(8) ตัวชี้วัด</th>
        <th style="background-color: #D9E1F2;">(9) เป้าหมาย</th>
        ${showDeptCol ? '<th style="background-color: #D9E1F2;">ส่วนราชการ</th>' : ''}
      </tr>
    `;

    tableBodyHtml = filteredBs1.map((item, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || `RSK-0${idx + 1}`)}</td>
        <td>${escapeHtml(item.strategy || '')}</td>
        <td>${escapeHtml(item.activity || '')}</td>
        <td style="text-align: right;" class="num">${item.budget || 0}</td>
        <td>${escapeHtml(item.objective || '')}</td>
        <td>${escapeHtml(item.kpi || '')}</td>
        <td>${escapeHtml(item.target || '')}</td>
        ${showDeptCol ? `<td style="text-align: center;">${escapeHtml(item.department || '')}</td>` : ''}
      </tr>
    `).join('');
  } else if (activeTab === 'bs2') {
    formNumber = '2';
    formName = 'บส.2';
    title = 'การวิเคราะห์โอกาส ผลกระทบ และการตอบสนองความเสี่ยง';
    subtitle = `ประจำปีงบประมาณ พ.ศ. ${selectedYear}`;
    colSpanTotal = 10;

    tableHeaderHtml = `
      <tr>
        <th style="background-color: #D9E1F2;">(3) รหัสความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(4) โครงการ/กิจกรรม/ภารกิจ</th>
        <th style="background-color: #D9E1F2;">(5) วัตถุประสงค์</th>
        <th style="background-color: #D9E1F2;">(6) ผู้รับผิดชอบ</th>
        <th style="background-color: #D9E1F2;">(7) ความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(8) ประเภทความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(9) คะแนนโอกาส</th>
        <th style="background-color: #D9E1F2;">(10) คะแนนผลกระทบ</th>
        <th style="background-color: #D9E1F2;">(11) ระดับความเสี่ยง (9) x (10)</th>
        <th style="background-color: #D9E1F2;">(12) วิธีการตอบสนองความเสี่ยง</th>
      </tr>
    `;

    tableBodyHtml = filteredBs2.map((item) => {
      const l = Number(item.likelihood) || 1;
      const i = Number(item.impact) || 1;
      const score = item.riskScore !== undefined && item.riskScore !== null && item.riskScore !== ''
        ? item.riskScore
        : (l * i);
      const level = item.riskLevel || (score >= 15 ? 'สูงมาก' : score >= 10 ? 'สูง' : score >= 5 ? 'ปานกลาง' : 'ต่ำ');
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || '')}</td>
          <td>${escapeHtml(item.activity || '')}</td>
          <td>${escapeHtml(item.objective || '')}</td>
          <td>${escapeHtml(item.responsiblePerson || '')}</td>
          <td style="color: #b91c1c; font-weight: bold;">${escapeHtml(item.riskEvent || '')}</td>
          <td>${escapeHtml(item.riskCategory || '')}</td>
          <td style="text-align: center;">${l}</td>
          <td style="text-align: center;">${i}</td>
          <td style="text-align: center; font-weight: bold;">${score} (${level})</td>
          <td>${escapeHtml(item.riskResponse || '')}</td>
        </tr>
      `;
    }).join('');
  } else if (activeTab === 'bs3') {
    formNumber = '3';
    formName = 'บส.3';
    title = 'รายงานการจัดทำแผนบริหารความเสี่ยง';
    subtitle = `ประจำปีงบประมาณ พ.ศ. ${selectedYear}`;
    colSpanTotal = 9;

    tableHeaderHtml = `
      <tr>
        <th style="background-color: #D9E1F2;">(3) รหัสความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(4) โครงการ/กิจกรรม/ภารกิจ</th>
        <th style="background-color: #D9E1F2;">(5) ความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(6) วิธีการตอบสนองความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(7) ผู้รับผิดชอบ</th>
        <th style="background-color: #D9E1F2;">(8) วิธีการจัดการความเสี่ยง (มาตรการ)</th>
        <th style="background-color: #D9E1F2;">(9) ตัวชี้วัด</th>
        <th style="background-color: #D9E1F2;">(10) ระยะเวลาดำเนินการ</th>
        <th style="background-color: #D9E1F2;">(11) วิธีการติดตาม และการรายงาน</th>
      </tr>
    `;

    tableBodyHtml = filteredBs3.map((item) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || '')}</td>
        <td>${escapeHtml(item.activity || '')}</td>
        <td style="color: #b91c1c; font-weight: bold;">${escapeHtml(item.riskEvent || '')}</td>
        <td>${escapeHtml(item.riskResponse || '')}</td>
        <td>${escapeHtml(item.responsiblePerson || '')}</td>
        <td>${escapeHtml(item.measures || '')}</td>
        <td>${escapeHtml(item.kpi || '')}</td>
        <td style="text-align: center;">${escapeHtml(item.timeline || '')}</td>
        <td>${escapeHtml(item.monitoringMethod || '')}</td>
      </tr>
    `).join('');
  } else if (activeTab === 'bs4') {
    formNumber = '4';
    formName = 'บส.4';
    const periodLabel = bs4Period === '3month' ? 'รอบ 3 เดือน' : bs4Period === '6month' ? 'รอบ 6 เดือน' : 'รอบ 12 เดือน';
    title = `รายงานการติดตามผลการบริหารความเสี่ยง (${periodLabel})`;
    subtitle = `สำหรับปีงบประมาณ พ.ศ. ${selectedYear}`;
    colSpanTotal = 9;

    tableHeaderHtml = `
      <tr>
        <th style="background-color: #D9E1F2;">(3) รหัสความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(4) โครงการ/กิจกรรม/ภารกิจ</th>
        <th style="background-color: #D9E1F2;">(5) วิธีการจัดการความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(6) ระยะเวลาดำเนินการ</th>
        <th style="background-color: #D9E1F2;">(7) ผู้รับผิดชอบ</th>
        <th style="background-color: #D9E1F2;">(8) ผลลัพธ์การดำเนินการจัดการความเสี่ยง</th>
        <th style="background-color: #D9E1F2;">(9) เอกสาร/หลักฐาน</th>
        <th style="background-color: #D9E1F2;">(10) ร้อยละความคืบหน้า</th>
        <th style="background-color: #D9E1F2;">(11) ปัญหาอุปสรรค และแนวทางแก้ไข</th>
      </tr>
    `;

    tableBodyHtml = filteredBs4.map((item) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || '')}</td>
        <td>${escapeHtml(item.activity || '')}</td>
        <td>${escapeHtml(item.measures || '')}</td>
        <td style="text-align: center;">${escapeHtml(item.timeline || '')}</td>
        <td>${escapeHtml(item.responsiblePerson || '')}</td>
        <td>${escapeHtml(item.result || '')}</td>
        <td>${escapeHtml(item.evidence || '')}</td>
        <td style="text-align: center; font-weight: bold;">${item.progressPercent || 0}%</td>
        <td>${escapeHtml(item.problemSolution || '-')}</td>
      </tr>
    `).join('');
  } else if (activeTab === 'bs5') {
    formNumber = '5';
    formName = 'บส.5';
    title = 'รายงานผลการดำเนินการและทบทวนแผนการบริหารความเสี่ยง';
    subtitle = `สำหรับปีงบประมาณ พ.ศ. ${selectedYear}`;
    colSpanTotal = 16;

    tableHeaderHtml = `
      <tr>
        <th rowspan="2" style="background-color: #D9E1F2;">(3) รหัสความเสี่ยง</th>
        <th rowspan="2" style="background-color: #D9E1F2;">(4) โครงการ/กิจกรรม/ภารกิจ</th>
        <th rowspan="2" style="background-color: #D9E1F2;">(5) ความเสี่ยง</th>
        <th colspan="3" style="background-color: #D9E1F2;">(6) คะแนนระดับความเสี่ยงก่อนดำเนินการ</th>
        <th rowspan="2" style="background-color: #D9E1F2;">(7) วิธีการจัดการความเสี่ยง</th>
        <th rowspan="2" style="background-color: #D9E1F2;">(8) ผลดำเนินการจากการจัดการ</th>
        <th colspan="3" style="background-color: #D9E1F2;">(9) คะแนนระดับความเสี่ยงภายหลังดำเนินการ</th>
        <th rowspan="2" style="background-color: #D9E1F2;">(10) การเปลี่ยนแปลง</th>
        <th rowspan="2" style="background-color: #D9E1F2;">(11) ความเสี่ยงคงเหลือ/เกิดใหม่</th>
        <th colspan="2" style="background-color: #D9E1F2;">(12) สรุปความเสี่ยง</th>
        <th rowspan="2" style="background-color: #D9E1F2;">(13) มาตรการสำหรับปีถัดไป</th>
      </tr>
      <tr>
        <th style="background-color: #D9E1F2;">โอกาส (1)</th>
        <th style="background-color: #D9E1F2;">ผลกระทบ (2)</th>
        <th style="background-color: #D9E1F2;">คะแนน (3)</th>
        <th style="background-color: #D9E1F2;">โอกาส (1)</th>
        <th style="background-color: #D9E1F2;">ผลกระทบ (2)</th>
        <th style="background-color: #D9E1F2;">คะแนน (3)</th>
        <th style="background-color: #D9E1F2;">ควบคุมได้</th>
        <th style="background-color: #D9E1F2;">ควบคุมไม่ได้</th>
      </tr>
    `;

    tableBodyHtml = filteredBs5Items.map((item) => {
      const preScore = (Number(item.preLikelihood) || 1) * (Number(item.preImpact) || 1);
      const postScore = (Number(item.postLikelihood) || 1) * (Number(item.postImpact) || 1);
      const isControllable = item.controllable === 'ควบคุมได้';
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${escapeHtml(item.riskCode || '')}</td>
          <td>${escapeHtml(item.activity || '')}</td>
          <td style="color: #b91c1c;">${escapeHtml(item.riskEvent || '')}</td>
          <td style="text-align: center;">${item.preLikelihood || 1}</td>
          <td style="text-align: center;">${item.preImpact || 1}</td>
          <td style="text-align: center; font-weight: bold;">${preScore}</td>
          <td>${escapeHtml(item.measures || '')}</td>
          <td>${escapeHtml(item.result || '')}</td>
          <td style="text-align: center;">${item.postLikelihood || 1}</td>
          <td style="text-align: center;">${item.postImpact || 1}</td>
          <td style="text-align: center; font-weight: bold; color: #15803d;">${postScore}</td>
          <td style="text-align: center;">${escapeHtml(item.riskChange || 'ลดลง')}</td>
          <td>${escapeHtml(item.residualRisk || '-')}</td>
          <td style="text-align: center; font-weight: bold;">${isControllable ? '✓' : ''}</td>
          <td style="text-align: center; font-weight: bold; color: #b91c1c;">${!isControllable ? '✓' : ''}</td>
          <td>${escapeHtml(item.nextYearMeasures || '')}</td>
        </tr>
      `;
    }).join('');

    extraRowsHtml = `
      <tr>
        <td colspan="${colSpanTotal}" style="padding: 10px; background-color: #F2F2F2; font-weight: bold;">
          สรุปภาพรวมผลการดำเนินการและการทบทวนแผนบริหารความเสี่ยง ประจำปี พ.ศ. ${selectedYear}:
        </td>
      </tr>
      <tr>
        <td colspan="${colSpanTotal}" style="padding: 10px;">
          ${escapeHtml(bs5Data.summary || '')}
        </td>
      </tr>
    `;
  }

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>แบบ ${formName}</x:Name>
              <x:WorksheetOptions>
                <x:Print>
                  <x:ValidPrinterInfo/>
                  <x:Orientation>Landscape</x:Orientation>
                </x:Print>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'TH Sarabun New', Tahoma, sans-serif; font-size: 13pt; }
        table { border-collapse: collapse; }
        th, td { border: 0.5pt solid #000000; padding: 6px 8px; font-size: 12pt; }
        th { font-weight: bold; text-align: center; }
        .title-row { font-size: 16pt; font-weight: bold; text-align: center; border: none; }
        .subtitle-row { font-size: 13pt; text-align: center; border: none; }
        .header-tag { font-weight: bold; text-align: right; border: none; font-size: 14pt; }
        .num { mso-number-format:"\\#\\,\\#\\#0"; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${colSpanTotal}" class="header-tag">แบบ บส. ${formNumber}</td>
        </tr>
        <tr>
          <td colspan="${colSpanTotal}" class="title-row">${escapeHtml(orgName)}</td>
        </tr>
        <tr>
          <td colspan="${colSpanTotal}" class="subtitle-row">${escapeHtml(title)}</td>
        </tr>
        <tr>
          <td colspan="${colSpanTotal}" class="subtitle-row">${escapeHtml(subtitle)}</td>
        </tr>
        <tr><td colspan="${colSpanTotal}" style="border:none;"></td></tr>
        ${tableHeaderHtml}
        ${tableBodyHtml || `<tr><td colspan="${colSpanTotal}" style="text-align:center;">ไม่พบข้อมูล</td></tr>`}
        ${extraRowsHtml}
        <tr><td colspan="${colSpanTotal}" style="border:none; height: 20px;"></td></tr>
        <tr>
          <td colspan="${colSpanTotal - 4}" style="border:none;"></td>
          <td colspan="4" style="border:none; text-align: center;">(ลงชื่อ)...................................................</td>
        </tr>
        <tr>
          <td colspan="${colSpanTotal - 4}" style="border:none;"></td>
          <td colspan="4" style="border:none; text-align: center;">( ${escapeHtml(approverName)} )</td>
        </tr>
        <tr>
          <td colspan="${colSpanTotal - 4}" style="border:none;"></td>
          <td colspan="4" style="border:none; text-align: center;">ตำแหน่ง ${escapeHtml(approverPosition)}</td>
        </tr>
        <tr>
          <td colspan="${colSpanTotal - 4}" style="border:none;"></td>
          <td colspan="4" style="border:none; text-align: center;">วันที่..........เดือน........................พ.ศ. ............</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const fileName = `แบบ_${formName}${deptLabel}_ปี${selectedYear}.xls`;
  downloadBlob(excelHtml, fileName, 'application/vnd.ms-excel');
}
