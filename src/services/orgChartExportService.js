// บริการส่งออกโครงสร้างการแบ่งส่วนราชการเป็นไฟล์ PDF และ Microsoft Word (.doc)
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * 1. ดาวน์โหลดโครงสร้างการแบ่งส่วนราชการเป็นไฟล์ PDF สีความละเอียดสูง (A4 แนวนอน พอดี 1 หน้า)
 */
export async function exportOrgChartToPdf(elementId = 'org-chart-printable-area', orgProfile = {}) {
  const wasDark = document.documentElement.classList.contains('dark');
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Target element not found:', elementId);
      return { success: false, error: 'ไม่พบส่วนแสดงผลผังองค์กรบนหน้าเว็บ' };
    }

    const orgName = orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น';
    const fiscalYear = orgProfile?.fiscalYear || '2569';
    const fileName = `โครงสร้างการแบ่งส่วนราชการ_${orgName}_ปี${fiscalYear}.pdf`;

    // 1. ชั่วคราว: ปิดโหมดมืดเพื่อให้ Canvas เรนเดอร์ตัวอักษรและสีพื้นหลังได้คมชัดตามสีทางการ 100%
    if (wasDark) {
      document.documentElement.classList.remove('dark');
      await new Promise((r) => setTimeout(r, 80));
    }

    // 2. เรนเดอร์ Canvas ด้วย html2canvas-pro (รองรับ oklch และ CSS ยุคใหม่ของ Tailwind v4)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(element.scrollWidth || 0, 1200),
      onclone: (clonedDoc, clonedEl) => {
        // ลบปุ่มและเครื่องมือที่ไม่ต้องการให้ออกใน PDF
        clonedEl.querySelectorAll('.no-print').forEach((el) => el.remove());
      }
    });

    if (!canvas || !canvas.width || !canvas.height) {
      throw new Error('การประมวลผล Canvas ได้ภาพว่างเปล่า');
    }

    // 3. สร้างเอกสาร PDF ขนาด A4 แนวนอน (297 x 210 มม.)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 8; // ขอบ 8 มม.
    const printableWidth = pageWidth - margin * 2; // 281 มม.
    const printableHeight = pageHeight - margin * 2; // 194 มม.

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // คำนวณอัตราส่วนย่อ/ขยายให้พอดีหน้ากระดาษ A4 หน้าเดียวเสมอ ไม่ล้นหน้า
    const scale = Math.min(printableWidth / canvasWidth, printableHeight / canvasHeight);
    const finalWidth = canvasWidth * scale;
    const finalHeight = canvasHeight * scale;

    // จัดวางกึ่งกลางหน้ากระดาษ
    const posX = (pageWidth - finalWidth) / 2;
    const posY = (pageHeight - finalHeight) / 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', posX, posY, finalWidth, finalHeight);

    // 4. สั่งดาวน์โหลดไฟล์
    pdf.save(fileName);
    return { success: true };
  } catch (err) {
    console.error('PDF Export Error:', err);
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF' };
  } finally {
    // คืนค่าสถานะโหมดมืดกลับคืนสู่ค่าเดิม
    if (wasDark) {
      document.documentElement.classList.add('dark');
    }
  }
}

/**
 * 2. ดาวน์โหลดโครงสร้างการแบ่งส่วนราชการเป็นไฟล์ Microsoft Word (.doc)
 * บรรจุภาพผังโครงสร้างสีความละเอียดสูงตามหน้าเว็บ พร้อมตารางข้อมูลและช่องลงนามครบถ้วน
 */
export async function exportOrgChartToWord(elementId = 'org-chart-printable-area', structure = {}, orgProfile = {}) {
  const wasDark = document.documentElement.classList.contains('dark');
  try {
    const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
    const district = orgProfile.district ? `อำเภอ${orgProfile.district}` : '';
    const province = orgProfile.province ? `จังหวัด${orgProfile.province}` : '';
    const fiscalYear = orgProfile.fiscalYear || '2569';
    const approverName = structure?.approver?.name || orgProfile.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น';
    const approverTitle = structure?.approver?.title || `นายก${orgName}`;
    const palatName = structure?.palat?.name || orgProfile.palatName || 'ปลัดองค์กรปกครองส่วนท้องถิ่น';
    const palatTitle = structure?.palat?.title || `ปลัด${orgName}`;
    const auditorName = structure?.auditor?.name || orgProfile.auditorName || 'ผู้ตรวจสอบภายใน';
    const auditorTitle = structure?.auditor?.title || orgProfile.auditorPosition || 'นักวิชาการตรวจสอบภายใน';

    const depts = Array.isArray(structure?.departments) ? structure.departments : [];
    const deputies = Array.isArray(structure?.deputyPalats) ? structure.deputyPalats : [];

    // แคปเจอร์ภาพผังโครงสร้างจากหน้าเว็บ เพื่อฝังลงในเอกสาร Word ให้ตรงตามภาพหน้าเว็บ 100%
    let chartImgHtml = '';
    const element = document.getElementById(elementId);
    if (element) {
      if (wasDark) {
        document.documentElement.classList.remove('dark');
        await new Promise((r) => setTimeout(r, 80));
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: Math.max(element.scrollWidth || 0, 1200),
        onclone: (clonedDoc, clonedEl) => {
          clonedEl.querySelectorAll('.no-print').forEach((el) => el.remove());
        }
      });

      if (canvas && canvas.width && canvas.height) {
        const imgData = canvas.toDataURL('image/png', 0.95);
        chartImgHtml = `
          <div style="text-align: center; margin: 15pt 0; page-break-inside: avoid;">
            <p style="font-weight: bold; font-size: 14pt; margin-bottom: 8pt; color: #1e3a8a;">
              แผนภูมิโครงสร้างการแบ่งส่วนราชการ (ตามกรอบอัตรากำลังของ อปท.)
            </p>
            <img src="${imgData}" style="width: 100%; max-width: 960px; border: 1pt solid #cbd5e1;" />
          </div>
        `;
      }
    }

    // สร้างตารางข้อมูลส่วนราชการและฝ่าย (รองรับทั้ง object และ string อย่างปลอดภัย)
    let deptRowsHtml = '';
    depts.forEach((dept, idx) => {
      const deptName = typeof dept === 'string' ? dept : dept?.name || `ส่วนราชการที่ ${idx + 1}`;
      const deptHeadTitle = typeof dept === 'object' && dept?.headTitle ? dept.headTitle : 'ผู้อำนวยการ/หัวหน้าส่วนราชการ';
      const rawDivisions = typeof dept === 'object' && Array.isArray(dept?.divisions) && dept.divisions.length > 0
        ? dept.divisions
        : [{ name: 'ฝ่ายบริหารงานทั่วไป', jobs: [] }];

      rawDivisions.forEach((div, divIdx) => {
        const divName = typeof div === 'string' ? div : div?.name || 'ฝ่ายบริหารทั่วไป';
        const jobsList = typeof div === 'object' && Array.isArray(div?.jobs) && div.jobs.length > 0
          ? div.jobs.map((j) => `• ${j}`).join('<br/>')
          : '- งานตามภารกิจที่ได้รับมอบหมาย';

        const headOfDiv = typeof div === 'object' && div?.headTitle ? div.headTitle : 'หัวหน้าฝ่าย';
        const headOfDivName = typeof div === 'object' && div?.headName ? ` (${div.headName})` : '';

        deptRowsHtml += `
          <tr>
            ${divIdx === 0 ? `<td rowspan="${rawDivisions.length}" class="text-center font-bold">${idx + 1}</td>` : ''}
            ${divIdx === 0 ? `<td rowspan="${rawDivisions.length}" class="font-bold">${deptName}<br/><span style="font-size: 13pt; color: #555;">${deptHeadTitle}</span></td>` : ''}
            <td><strong>${divName}</strong></td>
            <td>${headOfDiv}${headOfDivName}</td>
            <td>${jobsList}</td>
          </tr>
        `;
      });

      // หากมีหน่วยงานในสังกัด (เช่น ศูนย์พัฒนาเด็กเล็ก, โรงเรียน)
      if (typeof dept === 'object' && Array.isArray(dept?.affiliatedUnits) && dept.affiliatedUnits.length > 0) {
        dept.affiliatedUnits.forEach((aff) => {
          const affName = typeof aff === 'string' ? aff : aff?.name || 'หน่วยงานบริการชุมชน';
          deptRowsHtml += `
            <tr style="background-color: #f9fbf9;">
              <td class="text-center font-bold">-</td>
              <td class="font-bold" style="color: #0d6e3c;">[หน่วยงานสังกัด ${deptName}]<br/>${affName}</td>
              <td>สถานศึกษา/หน่วยบริการชุมชน</td>
              <td>หัวหน้าสถานศึกษา/รักษาการ</td>
              <td>การจัดการศึกษาปฐมวัยและการบริการชุมชน</td>
            </tr>
          `;
        });
      }
    });

    // ส่วนของรองปลัด (ถ้ามี)
    let deputySectionHtml = '';
    if (deputies.length > 0) {
      deputySectionHtml = `
        <div style="margin: 10pt 0; padding: 8pt; background-color: #f0fdfa; border: 1pt solid #14b8a6;">
          <strong>สายการบังคับบัญชาฝ่ายประจำ (รองปลัด อปท.):</strong><br/>
          ${deputies.map((d) => `• <strong>${d.title || 'รองปลัด อปท.'}:</strong> ${d.name || '-'} (${d.role || 'กำกับดูแลตามมอบหมาย'})`).join('<br/>')}
        </div>
      `;
    }

    const htmlBody = `
      <h1 style="margin-top: 6pt;">โครงสร้างการแบ่งส่วนราชการ</h1>
      <h2>${orgName} ${district} ${province}</h2>

      <!-- ส่วนที่ 1: แผนภูมิโครงสร้างสีตรงตามหน้าเว็บ -->
      ${chartImgHtml}

      <div style="page-break-before: always;"></div>

      <!-- ส่วนที่ 2: ตารางผู้บริหารและสายบังคับบัญชาสูงสุด -->
      <h3 style="margin-top: 14pt;">สายการบังคับบัญชาฝ่ายบริหารและผู้บริหารสูงสุด</h3>
      <table style="margin-bottom: 12pt; border: 1.5pt solid #000;">
        <tr style="background-color: #f5f5f5;">
          <th style="width: 33%; padding: 8pt;">ฝ่ายบริหาร / ผู้บริหารสูงสุด</th>
          <th style="width: 34%; padding: 8pt;">หัวหน้าพนักงานส่วนท้องถิ่น (ปลัด อปท.)</th>
          <th style="width: 33%; padding: 8pt;">หน่วยตรวจสอบภายใน (รายงานตรง)</th>
        </tr>
        <tr>
          <td class="text-center" style="padding: 10pt;">
            <strong>${approverTitle}</strong><br/>
            ( ${approverName} )
          </td>
          <td class="text-center" style="padding: 10pt;">
            <strong>${palatTitle}</strong><br/>
            ( ${palatName} )
          </td>
          <td class="text-center" style="padding: 10pt;">
            <strong>${auditorTitle}</strong><br/>
            ( ${auditorName} )<br/>
            <span style="font-size: 12pt; color: #0056b3;">* รายงานผลตรงต่อนายก/ปลัด</span>
          </td>
        </tr>
      </table>

      ${deputySectionHtml}

      <!-- ส่วนที่ 3: ตารางการแบ่งส่วนราชการและภารกิจ -->
      <h3 style="margin-top: 14pt;">ตารางการแบ่งส่วนราชการ ฝ่าย และงานในสังกัด (${depts.length} ส่วนราชการหลัก)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8pt;">
        <thead>
          <tr style="background-color: #e2e8f0;">
            <th style="width: 6%;">ลำดับ</th>
            <th style="width: 24%;">สำนัก / กอง</th>
            <th style="width: 22%;">ฝ่าย / งาน</th>
            <th style="width: 22%;">หัวหน้าฝ่าย</th>
            <th style="width: 26%;">หน้าที่ความรับผิดชอบหลัก</th>
          </tr>
        </thead>
        <tbody>
          ${deptRowsHtml}
        </tbody>
      </table>

      <!-- ส่วนที่ 4: ช่องลงนามกำกับ -->
      <br/><br/>
      <table class="signature-table" style="width: 100%; border: none;">
        <tr>
          <td style="width: 33%; border: none; text-align: center;">
            ลงชื่อ...................................................ผู้จัดทำ<br/>
            ( ${auditorName} )<br/>
            ${auditorTitle}<br/>
            วันที่ ......./......./.......
          </td>
          <td style="width: 33%; border: none; text-align: center;">
            ลงชื่อ...................................................ผู้ตรวจทาน<br/>
            ( ${palatName} )<br/>
            ${palatTitle}<br/>
            วันที่ ......./......./.......
          </td>
          <td style="width: 34%; border: none; text-align: center;">
            ลงชื่อ...................................................ผู้อนุมัติ<br/>
            ( ${approverName} )<br/>
            ${approverTitle}<br/>
            วันที่ ......./......./.......
          </td>
        </tr>
      </table>
    `;

    const fullHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>โครงสร้างการแบ่งส่วนราชการ - ${orgName}</title>
<style>
  @page Section1 {
    size: 297mm 210mm;
    mso-page-orientation: landscape;
    margin: 12mm 12mm 12mm 12mm;
  }
  div.Section1 { page: Section1; }
  body {
    font-family: 'TH Sarabun New', 'TH SarabunPSK', 'Angsana New', sans-serif;
    font-size: 15pt;
    line-height: 1.25;
    color: #000;
  }
  h1 { font-size: 20pt; font-weight: bold; text-align: center; margin: 0 0 4pt 0; }
  h2 { font-size: 17pt; font-weight: bold; text-align: center; margin: 0 0 4pt 0; }
  h3 { font-size: 15pt; font-weight: bold; margin: 8pt 0 4pt 0; }
  p { margin: 0 0 4pt 0; }
  p.no-indent { text-indent: 0; }
  table { border-collapse: collapse; width: 100%; margin: 6pt 0; font-size: 14pt; }
  table, th, td { border: 1pt solid #333; }
  th { background-color: #f1f5f9; font-weight: bold; padding: 6pt 4pt; text-align: center; }
  td { padding: 5pt 6pt; vertical-align: top; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-bold { font-weight: bold; }
  .signature-table { border: none !important; width: 100%; margin-top: 25pt; }
  .signature-table td { border: none !important; text-align: center; padding: 8pt 5pt; }
</style>
</head>
<body>
<div class="Section1">
  ${htmlBody}
</div>
</body>
</html>`;

    const blob = new Blob(['\ufeff' + fullHtml], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFileName = `โครงสร้างการแบ่งส่วนราชการ_${orgName}_ปี${fiscalYear}.doc`;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);

    return { success: true };
  } catch (err) {
    console.error('Word Export Error:', err);
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการสร้างไฟล์ Word' };
  } finally {
    if (wasDark) {
      document.documentElement.classList.add('dark');
    }
  }
}
