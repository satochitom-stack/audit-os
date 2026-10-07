/**
 * Report & Data Export Engine (Sprint 4: Enterprise Integrations & Report Engine)
 * บริการสร้างและส่งออกไฟล์ Excel (.xlsx / .csv) และรายงานทางการสำหรับระบบตรวจสอบภายใน อปท.
 * รองรับภาษาไทย 100% พร้อมจัดความกว้างคอลัมน์และโครงสร้างแบบฟอร์มมาตรฐานราชการ
 */

import * as XLSX from 'xlsx';

/**
 * ดาวน์โหลดข้อมูลเป็นไฟล์ Excel (.xlsx) หลายแผ่นงาน
 * @param {Array<{ sheetName: string, data: Array<Array<any>> | Array<Object>, colWidths?: Array<{ wch: number }> }>} sheets
 * @param {string} fileName - ชื่อไฟล์ (ไม่ต้องใส่นามสกุล)
 */
export function downloadMultiSheetExcel(sheets, fileName = 'รายงานตรวจสอบภายใน_อปท') {
  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ sheetName, data, colWidths }) => {
      let worksheet;
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
        // 2D Array (AOA)
        worksheet = XLSX.utils.aoa_to_sheet(data);
      } else {
        // Array of Objects
        worksheet = XLSX.utils.json_to_sheet(data);
      }

      if (colWidths && colWidths.length > 0) {
        worksheet['!cols'] = colWidths;
      }

      // Safe sheet name (max 31 chars, no special forbidden chars)
      const safeName = (sheetName || 'Sheet')
        .replace(/[:\\/?*\[\]]/g, '')
        .slice(0, 31);

      XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
    });

    const cleanFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, cleanFileName);
    return true;
  } catch (error) {
    console.error('Error generating Excel file:', error);
    // Fallback to CSV if xlsx fails for any reason
    if (sheets.length > 0) {
      downloadCsvFallback(sheets[0].data, fileName);
    }
    return false;
  }
}

/**
 * ดาวน์โหลดข้อมูลเป็นไฟล์ CSV (UTF-8 with BOM เพื่อเปิดใน Excel ภาษาไทยได้ทันที)
 */
export function downloadCsvFallback(data, fileName = 'ข้อมูลตรวจสอบภายใน') {
  try {
    if (!data || data.length === 0) return false;

    let csvContent = '\uFEFF'; // UTF-8 BOM
    if (Array.isArray(data[0])) {
      data.forEach((row) => {
        const line = row
          .map((val) => {
            const str = val === null || val === undefined ? '' : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',');
        csvContent += line + '\r\n';
      });
    } else {
      const headers = Object.keys(data[0]);
      csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',') + '\r\n';
      data.forEach((row) => {
        const line = headers
          .map((h) => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',');
        csvContent += line + '\r\n';
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('CSV Export Error:', err);
    return false;
  }
}

/**
 * 1. ส่งออกรายงานผลการตรวจสอบภายในประจำปี (Annual Comprehensive Audit Summary Excel)
 */
export function exportAnnualAuditReportExcel({
  orgProfile = {},
  selectedYear = '2569',
  annualPlans = [],
  workingPapers = [],
  capaFindings = []
}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const auditorName = orgProfile.auditorName || 'หน่วยตรวจสอบภายใน';

  // Sheet 1: หน้ารวมสรุปผลประจำปี (Executive Summary)
  const summaryAoa = [
    [`รายงานผลการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. ${selectedYear}`],
    [`หน่วยรับตรวจ: ${orgName} • ผู้ตรวจสอบ: ${auditorName}`],
    [`วันที่ส่งออกข้อมูล: ${new Date().toLocaleDateString('th-TH')}`],
    [],
    ['สถิติผลการปฏิบัติงานตรวจสอบภายในภาพรวม'],
    ['รายการชี้วัด', 'จำนวน/ยอด', 'หน่วยนับ', 'หมายเหตุ'],
    ['กิจกรรมตามแผนการตรวจสอบประจำปี', annualPlans.length, 'กิจกรรม', 'ครอบคลุมทุกสำนัก/กอง'],
    ['กระดาษทำการที่เปิดตรวจและบันทึกผล', workingPapers.length, 'เรื่อง', 'ความคืบหน้าร้อยละ 100'],
    ['ประเด็นข้อตรวจพบทั้งหมด (CAPA Findings)', capaFindings.length, 'ข้อ', 'รวมข้อทักท้วง สตง./ตสน.'],
    [
      'ข้อทักท้วงที่ยุติ/แก้ไขแล้วเสร็จ (Closed)',
      capaFindings.filter((c) => c.status === 'verified_closed').length,
      'ข้อ',
      'ผ่านการสอบทานพยานหลักฐาน'
    ],
    [
      'ข้อทักท้วงที่อยู่ระหว่างดำเนินการ (In Progress)',
      capaFindings.filter((c) => c.status !== 'verified_closed').length,
      'ข้อ',
      'ติดตามในกรอบเวลา 60 วัน'
    ],
    [],
    ['สรุปผลการตรวจสอบรายกิจกรรมตามแผน'],
    ['ลำดับ', 'รหัสแผน', 'ชื่อกิจกรรมการตรวจสอบ', 'สำนัก/กอง', 'ความเสี่ยง', 'สถานะกระดาษทำการ', 'ข้อตรวจพบสำคัญ', 'ข้อเสนอแนะ']
  ];

  annualPlans.forEach((plan, idx) => {
    const wp = workingPapers.find((w) => w.auditPlanId === plan.id || w.topic === plan.title);
    summaryAoa.push([
      idx + 1,
      plan.id,
      plan.title,
      plan.department,
      plan.riskLevel || 'ปานกลาง',
      wp ? 'จัดทำกระดาษทำการแล้ว' : 'ตามแผนงาน',
      wp?.finding?.condition || 'ไม่พบข้อบกพร่องที่มีนัยสำคัญ',
      wp?.finding?.recommendation || 'ปฏิบัติตามระเบียบกฎหมายอย่างเคร่งครัด'
    ]);
  });

  // Sheet 2: ทะเบียนข้อทักท้วง CAPA รายละเอียด
  const capaAoa = [
    [`ทะเบียนคุมข้อทักท้วงและข้อสังเกตการตรวจสอบ (CAPA Register) ปี ${selectedYear}`],
    [`${orgName} • รายงานตามกรอบเวลา 60 วัน`],
    [],
    [
      'รหัสข้อทักท้วง',
      'แหล่งที่มา',
      'หน่วยงานรับตรวจ',
      'ประเด็นข้อตรวจพบ / ข้อทักท้วง',
      'ระดับความรุนแรง',
      'วันที่รับเรื่อง',
      'วันครบกำหนด (60 วัน)',
      'สถานะ',
      'สภาพการณ์ (Condition)',
      'เกณฑ์มาตรฐาน (Criteria)',
      'สาเหตุ (Cause)',
      'ผลกระทบ (Effect)',
      'มาตรการแก้ไข (Corrective Action)',
      'มาตรการป้องกัน (Preventive Action)',
      'ความเห็นผู้ตรวจสอบภายใน'
    ]
  ];

  capaFindings.forEach((c) => {
    capaAoa.push([
      c.id,
      c.sourceName || (c.source === 'oag' ? 'สตง.' : 'หน่วยตรวจสอบภายใน'),
      c.department,
      c.title,
      c.severity === 'high' ? 'สูง' : c.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ',
      c.receivedDate,
      c.dueDate,
      c.status === 'verified_closed' ? 'ยุติข้อสังเกตแล้ว' : 'อยู่ระหว่างดำเนินการ',
      c.condition || '',
      c.criteria || '',
      c.cause || '',
      c.effect || '',
      c.correctiveAction || '',
      c.preventiveAction || '',
      c.auditorOpinion || ''
    ]);
  });

  const sheets = [
    {
      sheetName: 'สรุปรายงานประจำปี',
      data: summaryAoa,
      colWidths: [
        { wch: 8 },
        { wch: 16 },
        { wch: 38 },
        { wch: 22 },
        { wch: 14 },
        { wch: 24 },
        { wch: 45 },
        { wch: 45 }
      ]
    },
    {
      sheetName: 'ทะเบียนข้อทักท้วง_CAPA',
      data: capaAoa,
      colWidths: [
        { wch: 18 },
        { wch: 22 },
        { wch: 20 },
        { wch: 36 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 20 },
        { wch: 35 },
        { wch: 35 },
        { wch: 30 },
        { wch: 30 },
        { wch: 35 },
        { wch: 35 },
        { wch: 35 }
      ]
    }
  ];

  return downloadMultiSheetExcel(sheets, `รายงานผลการตรวจสอบภายในประจำปี_${selectedYear}_${orgName}`);
}

/**
 * 2. ส่งออกทะเบียนข้อทักท้วง CAPA Matrix ทางการ
 */
export function exportCapaMatrixExcel(capaFindings = [], orgProfile = {}, selectedYear = '2569') {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const aoa = [
    [`ทะเบียนคุมและติดตามข้อทักท้วง (CAPA Matrix under 60-day Rule)`],
    [`${orgName} • ประจำปีงบประมาณ พ.ศ. ${selectedYear}`],
    [],
    [
      'รหัสรายการ',
      'แหล่งที่มาของข้อตรวจพบ',
      'หน่วยงานที่รับผิดชอบ',
      'ชื่อประเด็นข้อตรวจพบ',
      'ความรุนแรง',
      'วันที่แจ้งเรื่อง',
      'วันครบกำหนดชี้แจง',
      'สถานะการดำเนินการ',
      'สภาพการณ์ที่ตรวจพบ',
      'เกณฑ์มาตรฐาน/ระเบียบ',
      'สาเหตุข้อบกพร่อง',
      'ผลกระทบที่เกิดขึ้น',
      'แนวทางแก้ไขปรับปรุง',
      'มาตรการป้องกันเกิดซ้ำ',
      'เอกสารพยานหลักฐาน',
      'ความเห็นผู้ตรวจสอบภายใน',
      'ข้อสั่งการผู้บริหาร'
    ]
  ];

  capaFindings.forEach((f) => {
    aoa.push([
      f.id,
      f.sourceName || (f.source === 'oag' ? 'สำนักงานการตรวจเงินแผ่นดิน' : 'หน่วยตรวจสอบภายใน'),
      f.department,
      f.title,
      f.severity === 'high' ? 'ความเสี่ยงสูง' : f.severity === 'medium' ? 'ความเสี่ยงปานกลาง' : 'ความเสี่ยงต่ำ',
      f.receivedDate,
      f.dueDate,
      f.status === 'verified_closed' ? 'ยุติข้อสังเกตเรียบร้อย' : 'อยู่ระหว่างดำเนินการแก้ไข',
      f.condition || '',
      f.criteria || '',
      f.cause || '',
      f.effect || '',
      f.correctiveAction || '',
      f.preventiveAction || '',
      f.evidenceDocs || '',
      f.auditorOpinion || '',
      f.executiveOrder || ''
    ]);
  });

  return downloadMultiSheetExcel(
    [
      {
        sheetName: 'ทะเบียนคุมข้อทักท้วง_CAPA',
        data: aoa,
        colWidths: [
          { wch: 18 },
          { wch: 28 },
          { wch: 20 },
          { wch: 38 },
          { wch: 16 },
          { wch: 14 },
          { wch: 16 },
          { wch: 22 },
          { wch: 38 },
          { wch: 35 },
          { wch: 30 },
          { wch: 30 },
          { wch: 38 },
          { wch: 38 },
          { wch: 25 },
          { wch: 35 },
          { wch: 30 }
        ]
      }
    ],
    `ทะเบียนคุมข้อทักท้วง_CAPA_${selectedYear}_${orgName}`
  );
}

/**
 * 3. ส่งออกกระดาษทำการและผลการสุ่มตรวจ (Working Papers & Sample Audit Sheets)
 */
export function exportWorkingPapersExcel(workingPapers = [], orgProfile = {}, selectedYear = '2569') {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';

  // Sheet 1: สรุปกระดาษทำการ
  const wpAoa = [
    [`สรุปกระดาษทำการตรวจสอบภายใน (Working Papers Summary)`],
    [`${orgName} • ปีงบประมาณ พ.ศ. ${selectedYear}`],
    [],
    [
      'รหัสกระดาษทำการ',
      'กิจกรรมการตรวจสอบ',
      'สำนัก/กองรับตรวจ',
      'ผู้จัดทำ',
      'ผู้สอบทาน',
      'สภาพการณ์ (Condition)',
      'เกณฑ์มาตรฐาน (Criteria)',
      'สาเหตุ (Cause)',
      'ผลกระทบ (Effect)',
      'ข้อเสนอแนะ (Recommendation)',
      'ข้อสรุปผลการตรวจ'
    ]
  ];

  // Sheet 2: รายการสุ่มตรวจเอกสาร (Audit Samples)
  const sampleAoa = [
    [`รายละเอียดการสุ่มตรวจเอกสารและหลักฐานเชิงประจักษ์`],
    [`${orgName} • ปีงบประมาณ พ.ศ. ${selectedYear}`],
    [],
    [
      'รหัสกระดาษทำการ',
      'กิจกรรม',
      'สำนัก/กอง',
      'ลำดับตัวอย่าง',
      'รายการเอกสาร/ฎีกา/สัญญา',
      'จำนวนเงิน (บาท)',
      'ผลการตรวจ',
      'ข้อสังเกตจากการสุ่มตรวจ'
    ]
  ];

  workingPapers.forEach((wp) => {
    wpAoa.push([
      wp.id,
      wp.topic,
      wp.department,
      wp.auditor || orgProfile.auditorName || 'ผู้ตรวจสอบภายใน',
      wp.reviewer || orgProfile.palatName || 'ปลัด อบต.',
      wp.finding?.condition || '',
      wp.finding?.criteria || '',
      wp.finding?.cause || '',
      wp.finding?.effect || '',
      wp.finding?.recommendation || '',
      wp.conclusion || 'ตรวจสอบแล้ว'
    ]);

    if (Array.isArray(wp.samples)) {
      wp.samples.forEach((s, idx) => {
        sampleAoa.push([
          wp.id,
          wp.topic,
          wp.department,
          idx + 1,
          s.docNo || s.description || s.title || `ตัวอย่างที่ ${idx + 1}`,
          typeof s.amount === 'number' ? s.amount : Number(s.amount) || 0,
          s.result === 'pass' ? 'ถูกต้อง' : s.result === 'fail' ? 'พบข้อบกพร่อง' : 'ปกติ',
          s.note || s.remark || '-'
        ]);
      });
    }
  });

  return downloadMultiSheetExcel(
    [
      {
        sheetName: 'สรุปกระดาษทำการ',
        data: wpAoa,
        colWidths: [
          { wch: 18 },
          { wch: 35 },
          { wch: 22 },
          { wch: 20 },
          { wch: 20 },
          { wch: 35 },
          { wch: 35 },
          { wch: 30 },
          { wch: 30 },
          { wch: 35 },
          { wch: 30 }
        ]
      },
      {
        sheetName: 'รายการสุ่มตรวจ',
        data: sampleAoa,
        colWidths: [
          { wch: 18 },
          { wch: 30 },
          { wch: 20 },
          { wch: 12 },
          { wch: 35 },
          { wch: 18 },
          { wch: 16 },
          { wch: 35 }
        ]
      }
    ],
    `กระดาษทำการตรวจสอบภายใน_${selectedYear}_${orgName}`
  );
}

/**
 * 4. ส่งออกข้อมูลเฉพาะส่วนราชการ (สำนักปลัด, กองคลัง, กองช่าง)
 */
export function exportDepartmentWorkspacesExcel({
  officeData,
  financeData,
  techData,
  orgProfile = {},
  selectedYear = '2569'
}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const sheets = [];

  // Sheet สำนักปลัด: ยานพาหนะ และ โครงการ
  if (officeData) {
    const vehicleAoa = [
      [`ทะเบียนคุมการใช้รถยนต์ส่วนกลางและน้ำมันเชื้อเพลิง สำนักปลัด ${orgName}`],
      [`ประจำปีงบประมาณ พ.ศ. ${selectedYear}`],
      [],
      ['ลำดับ', 'วันที่เดินทาง', 'ทะเบียนรถ', 'วัตถุประสงค์ / สถานที่ไป', 'เลขกิโลเมตรเริ่ม', 'เลขกิโลเมตรสิ้นสุด', 'ระยะทาง (กม.)', 'ใบสั่งน้ำมัน', 'ลิตร', 'ยอดเงิน (บาท)', 'พนักงานขับรถ']
    ];
    (officeData.vehicleLogs || []).forEach((v, idx) => {
      vehicleAoa.push([
        idx + 1,
        v.date,
        v.licensePlate,
        v.destination,
        v.startKm,
        v.endKm,
        v.totalKm || (v.endKm - v.startKm),
        v.voucherNo,
        v.liters,
        v.cost,
        v.driver
      ]);
    });
    sheets.push({
      sheetName: 'สำนักปลัด_คุมรถและน้ำมัน',
      data: vehicleAoa,
      colWidths: [
        { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 32 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 20 }
      ]
    });
  }

  // Sheet กองคลัง: สัญญาจัดซื้อจัดจ้าง และ ลูกหนี้เงินยืม
  if (financeData) {
    const contractAoa = [
      [`ทะเบียนคุมสัญญาจัดซื้อจัดจ้าง กองคลัง ${orgName}`],
      [`ตาม พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560`],
      [],
      ['ลำดับ', 'เลขที่สัญญา', 'รายการจัดซื้อจัดจ้าง', 'วิธีจัดหา', 'วงเงินงบประมาณ', 'วงเงินสัญญา', 'คู่สัญญา/ผู้รับจ้าง', 'วันเริ่มสัญญา', 'วันสิ้นสุดสัญญา', 'หลักประกันสัญญา (บาท)', 'สถานะ']
    ];
    (financeData.contracts || []).forEach((c, idx) => {
      contractAoa.push([
        idx + 1,
        c.contractNo,
        c.projectName,
        c.method,
        c.budget,
        c.contractAmount,
        c.contractor,
        c.startDate,
        c.endDate,
        c.guaranteeAmount || 0,
        c.status
      ]);
    });
    sheets.push({
      sheetName: 'กองคลัง_สัญญาจัดซื้อจัดจ้าง',
      data: contractAoa,
      colWidths: [
        { wch: 8 }, { wch: 16 }, { wch: 35 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }
      ]
    });
  }

  // Sheet กองช่าง: โครงการก่อสร้างและผลทดสอบ 28 วัน
  if (techData) {
    const techAoa = [
      [`ทะเบียนคุมโครงการก่อสร้างตามข้อบัญญัติ กองช่าง ${orgName}`],
      [`พร้อมผลทดสอบความแข็งแรงแท่งคอนกรีต 28 วัน`],
      [],
      ['ลำดับ', 'รหัสโครงการ', 'ชื่อโครงการก่อสร้าง', 'สถานที่ก่อสร้าง', 'วงเงินตามสัญญา', 'ผู้รับจ้าง', 'ช่างผู้ควบคุมงาน', 'ผลทดสอบคอนกรีต 28 วัน', 'สถานะโครงการ']
    ];
    (techData.constructionProjects || []).forEach((p, idx) => {
      techAoa.push([
        idx + 1,
        p.projectCode,
        p.projectName,
        p.location,
        p.contractAmount,
        p.contractor,
        p.supervisorEngineer,
        p.cylinderTestPassed ? `ผ่านเกณฑ์ (${p.cylinderTestStrength || 240} ksc)` : 'รอผลทดสอบ',
        p.status
      ]);
    });
    sheets.push({
      sheetName: 'กองช่าง_คุมงานก่อสร้าง',
      data: techAoa,
      colWidths: [
        { wch: 8 }, { wch: 16 }, { wch: 38 }, { wch: 24 }, { wch: 16 }, { wch: 26 }, { wch: 22 }, { wch: 24 }, { wch: 18 }
      ]
    });
  }

  return downloadMultiSheetExcel(sheets, `ข้อมูลงานเฉพาะส่วนราชการ_${selectedYear}_${orgName}`);
}

/**
 * 5. ส่งออกชุดไฟล์ใหญ่ All-in-One Master Workbook (7 แผ่นงานครอบคลุมทุกมิติ)
 */
export function exportMasterEnterpriseExcel({
  orgProfile = {},
  selectedYear = '2569',
  annualPlans = [],
  workingPapers = [],
  capaFindings = [],
  auditUniverse = [],
  engagementPlans = [],
  officeData = null,
  financeData = null,
  techData = null
}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';

  // Sheet 1: สรุปภาพรวมองค์กร
  const orgAoa = [
    [`ระบบบริหารจัดการและตรวจสอบภายใน อปท. (Audit-OS)`],
    [`ข้อมูลภาพรวมหน่วยงาน: ${orgName}`],
    [],
    ['รายการ', 'รายละเอียด'],
    ['ชื่อองค์กรปกครองส่วนท้องถิ่น', orgName],
    ['อำเภอ', orgProfile.district || '-'],
    ['จังหวัด', orgProfile.province || '-'],
    ['ปีงบประมาณ', `พ.ศ. ${selectedYear}`],
    ['ผู้บริหารสูงสุด (นายก อปท.)', orgProfile.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น'],
    ['ปลัด อปท.', orgProfile.palatName || 'ปลัดองค์กรปกครองส่วนท้องถิ่น'],
    ['ผู้ตรวจสอบภายใน', orgProfile.auditorName || 'หน่วยตรวจสอบภายใน'],
    ['จำนวนกิจกรรมในจักรวาลการตรวจสอบ (Universe)', auditUniverse.length],
    ['จำนวนกิจกรรมตามแผนประจำปี', annualPlans.length],
    ['จำนวนกระดาษทำการตรวจสอบ', workingPapers.length],
    ['จำนวนข้อทักท้วง (CAPA)', capaFindings.length]
  ];

  // Sheet 2: จักรวาลการตรวจสอบและการประเมินความเสี่ยง SOFCK
  const universeAoa = [
    [`จักรวาลการตรวจสอบ (Audit Universe) และการจัดลำดับความเสี่ยง`],
    [`${orgName} • ปีงบประมาณ พ.ศ. ${selectedYear}`],
    [],
    ['รหัสกิจกรรม', 'ชื่อกิจกรรมการตรวจสอบ', 'สำนัก/กอง', 'ความสำคัญ (S)', 'โอกาสเสี่ยง (O)', 'ความถี่ (F)', 'การควบคุม (C)', 'ความรู้ชำนาญ (K)', 'คะแนนรวม', 'ระดับความเสี่ยง']
  ];
  auditUniverse.forEach((u) => {
    universeAoa.push([
      u.id,
      u.name,
      u.department,
      u.scores?.S || 3,
      u.scores?.O || 3,
      u.scores?.F || 3,
      u.scores?.C || 3,
      u.scores?.K || 3,
      u.totalScore || 15,
      u.riskLevel || 'ปานกลาง'
    ]);
  });

  // Sheet 3: แผนปฏิบัติการตรวจสอบรายกิจกรรม (ว 614 Engagement Plans)
  const engAoa = [
    [`แผนปฏิบัติการตรวจสอบรายกิจกรรม (Engagement Plans ตาม ว 614)`],
    [`${orgName} • ปีงบประมาณ พ.ศ. ${selectedYear}`],
    [],
    ['รหัสแผนงาน', 'ชื่อกิจกรรม', 'หน่วยงานเป้าหมาย', 'วัตถุประสงค์การตรวจ', 'ขอบเขตเวลาที่ตรวจ', 'วิธีการสุ่มตัวอย่าง', 'ขนาดตัวอย่างสุ่ม', 'ความเสี่ยงสำคัญ']
  ];
  engagementPlans.forEach((e) => {
    engAoa.push([
      e.id,
      e.title,
      e.targetDepartment || e.department,
      e.objective || '',
      e.scopePeriod || '',
      e.samplingMethod || 'สุ่มแบบเจาะจงและสุ่มตัวอย่างตามขนาดวงเงิน',
      e.sampleSize || 'ร้อยละ 20 ของประชากร',
      e.keyRisks || ''
    ]);
  });

  const sheets = [
    { sheetName: '1_ภาพรวมองค์กร', data: orgAoa, colWidths: [{ wch: 32 }, { wch: 45 }] },
    { sheetName: '2_ประเมินความเสี่ยง_SOFCK', data: universeAoa, colWidths: [{ wch: 14 }, { wch: 35 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }] },
    { sheetName: '3_แผนงานว614', data: engAoa, colWidths: [{ wch: 16 }, { wch: 35 }, { wch: 22 }, { wch: 35 }, { wch: 22 }, { wch: 30 }, { wch: 20 }, { wch: 35 }] }
  ];

  // Add Working papers, CAPA, etc.
  if (workingPapers.length > 0) {
    const wpAoa = [
      ['รหัสกระดาษทำการ', 'กิจกรรม', 'สำนัก/กอง', 'สภาพการณ์', 'เกณฑ์', 'สาเหตุ', 'ผลกระทบ', 'ข้อเสนอแนะ']
    ];
    workingPapers.forEach((w) => {
      wpAoa.push([
        w.id,
        w.topic,
        w.department,
        w.finding?.condition || '',
        w.finding?.criteria || '',
        w.finding?.cause || '',
        w.finding?.effect || '',
        w.finding?.recommendation || ''
      ]);
    });
    sheets.push({ sheetName: '4_กระดาษทำการและข้อตรวจพบ', data: wpAoa, colWidths: [{ wch: 16 }, { wch: 32 }, { wch: 20 }, { wch: 35 }, { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 35 }] });
  }

  if (capaFindings.length > 0) {
    const capaAoa = [
      ['รหัส', 'แหล่งที่มา', 'กอง', 'ประเด็น', 'ระดับ', 'วันครบ 60 วัน', 'สถานะ', 'มาตรการแก้ไข', 'ความเห็นผู้ตรวจ']
    ];
    capaFindings.forEach((c) => {
      capaAoa.push([
        c.id,
        c.sourceName || c.source,
        c.department,
        c.title,
        c.severity,
        c.dueDate,
        c.status === 'verified_closed' ? 'ยุติแล้ว' : 'อยู่ระหว่างดำเนินการ',
        c.correctiveAction || '',
        c.auditorOpinion || ''
      ]);
    });
    sheets.push({ sheetName: '5_ทะเบียนข้อทักท้วง_CAPA', data: capaAoa, colWidths: [{ wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 32 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 35 }, { wch: 30 }] });
  }

  return downloadMultiSheetExcel(sheets, `ชุดข้อมูลหลัก_Master_Workbook_${selectedYear}_${orgName}`);
}

/**
 * 6. ส่งออกเอกสารราชการเป็นไฟล์ Microsoft Word (.doc) มาตรฐาน A4
 * รองรับฟอนต์ราชการไทย (TH Sarabun New), ขอบกระดาษ 2.5 ซม. / 2 ซม., ตาราง และการจัดย่อหน้า
 */
export function exportToWordDoc(title, htmlBody, fileName = 'เอกสารราชการ_อปท') {
  try {
    const fullHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${title || 'เอกสารราชการ'}</title>
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
    size: 210mm 297mm;
    margin: 2.5cm 2.0cm 2.0cm 2.5cm;
    mso-header-margin: 36pt;
    mso-footer-margin: 36pt;
    mso-paper-source: 0;
  }
  div.Section1 { page: Section1; }
  body {
    font-family: 'TH Sarabun New', 'TH SarabunPSK', 'Angsana New', 'Cordia New', sans-serif;
    font-size: 16pt;
    line-height: 1.25;
    color: #000;
  }
  h1 { font-size: 20pt; font-weight: bold; text-align: center; margin: 0 0 10pt 0; }
  h2 { font-size: 18pt; font-weight: bold; text-align: center; margin: 8pt 0 6pt 0; }
  h3 { font-size: 16pt; font-weight: bold; margin: 8pt 0 4pt 0; }
  p { margin: 0 0 6pt 0; text-align: justify; text-justify: inter-cluster; text-indent: 1.5cm; }
  p.no-indent { text-indent: 0; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 15pt; }
  table, th, td { border: 1pt solid #333; }
  th { background-color: #f2f2f2; font-weight: bold; padding: 5pt 4pt; text-align: center; }
  td { padding: 4pt 6pt; vertical-align: top; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-bold { font-weight: bold; }
  .signature-table { border: none !important; width: 100%; margin-top: 35pt; }
  .signature-table td { border: none !important; text-align: center; padding: 12pt 5pt; }
</style>
</head>
<body>
<div class="Section1">
  ${htmlBody}
</div>
</body>
</html>`;

    const blob = new Blob(['\ufeff', fullHtml], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.doc`;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Word Export Error:', err);
    return false;
  }
}

/**
 * 7. ดาวน์โหลดแบบฟอร์มทางการราชการเป็น Word (.doc)
 */
export function downloadOfficialFormWord(formId, orgProfile = {}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const palatName = orgProfile.palatName || 'ปลัดองค์กรปกครองส่วนท้องถิ่น';
  const approverName = orgProfile.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น';
  const auditorName = orgProfile.auditorName || 'ผู้ตรวจสอบภายใน';
  const currentYear = '2569';

  switch (formId) {
    case 'FORM-PK-01': {
      const body = `
        <div class="text-right font-bold">แบบ ปค. 1</div>
        <h2>หนังสือรับรองการประเมินผลการควบคุมภายใน</h2>
        <p class="text-center font-bold no-indent">${orgName}</p>
        <p class="text-center no-indent">สำหรับงวดตั้งแต่วันที่ 1 ตุลาคม 2568 ถึงวันที่ 30 กันยายน 2569</p>
        <br/>
        <p>เรียน ผู้ว่าราชการจังหวัดอุบลราชธานี / สำนักงานการตรวจเงินแผ่นดิน</p>
        <p>${orgName} ได้ประเมินผลการควบคุมภายในของหน่วยงาน สำหรับงวดตั้งแต่วันที่ 1 ตุลาคม 2568 ถึงวันที่ 30 กันยายน 2569 ด้วยเกณฑ์มาตรฐานตามหลักเกณฑ์กระทรวงการคลังว่าด้วยมาตรฐานและหลักเกณฑ์ปฏิบัติการควบคุมภายในสำหรับหน่วยงานของรัฐ พ.ศ. 2561</p>
        <p>จากผลการประเมินดังกล่าว ${orgName} มีความเห็นว่า ระบบการควบคุมภายในของหน่วยงานมีความเพียงพอและมีประสิทธิผล สามารถให้ความมั่นใจอย่างสมเหตุสมผลว่า การดำเนินงานสามารถบรรลุวัตถุประสงค์ด้านการดำเนินงาน ด้านการรายงานทางการเงิน และด้านการปฏิบัติตามกฎหมายและระเบียบที่เกี่ยวข้อง</p>
        <p>อย่างไรก็ดี ยังมีข้อตรวจพบและการปรับปรุงที่ต้องดำเนินการติดตามอย่างต่อเนื่องตามที่ระบุไว้ในแบบ ปค. 5</p>
        
        <table class="signature-table">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%;">
              ลงชื่อ...................................................<br/>
              ( ${approverName} )<br/>
              ตำแหน่ง นายก${orgName}<br/>
              วันที่ ........ เดือน .................... พ.ศ. ${currentYear}
            </td>
          </tr>
        </table>
      `;
      return exportToWordDoc('แบบ ปค.1', body, `แบบ_ปค1_หนังสือรับรองการควบคุมภายใน_${orgName}`);
    }

    case 'FORM-PK-04': {
      const body = `
        <div class="text-right font-bold">แบบ ปค. 4</div>
        <h2>รายงานการประเมินองค์ประกอบของการควบคุมภายใน</h2>
        <p class="text-center font-bold no-indent">${orgName}</p>
        <p class="text-center no-indent">ประจำปีงบประมาณ พ.ศ. ${currentYear}</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">องค์ประกอบของการควบคุมภายใน</th>
              <th style="width: 45%;">ผลการประเมิน / การปฏิบัติจริง</th>
              <th style="width: 30%;">ข้อเสนอแนะในการปรับปรุง</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-bold">1. สภาพแวดล้อมการควบคุม (Control Environment)</td>
              <td>หน่วยงานมีโครงสร้างการแบ่งส่วนราชการชัดเจน มีข้อบังคับจริยธรรม และมอบหมายหน้าที่เป็นลายลักษณ์อักษร</td>
              <td>ควรจัดการอบรมเสริมสร้างวินัยทางการเงินการคลังแก่เจ้าหน้าที่บรรจุใหม่อย่างสม่ำเสมอ</td>
            </tr>
            <tr>
              <td class="font-bold">2. การประเมินความเสี่ยง (Risk Assessment)</td>
              <td>มีการระบุและวิเคราะห์ความเสี่ยงระดับองค์กรตามหนังสือสั่งการ ว 3482 และจัดทำแผนบริหารความเสี่ยงครบถ้วน</td>
              <td>ควรทบทวนปัจจัยเสี่ยงด้านเทคโนโลยีสารสนเทศและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) เพิ่มเติม</td>
            </tr>
            <tr>
              <td class="font-bold">3. กิจกรรมการควบคุม (Control Activities)</td>
              <td>มีระบบการแบ่งแยกหน้าที่ระหว่างผู้อนุมัติ ผู้ถือเงิน และผู้บันทึกบัญชีตามระเบียบ มท. รับจ่ายเงิน 2566</td>
              <td>กำชับการตรวจสอบเอกสารหลักฐานประกอบฎีกาให้ครบถ้วนก่อนส่งเบิกจ่าย</td>
            </tr>
            <tr>
              <td class="font-bold">4. สารสนเทศและการสื่อสาร (Information & Communication)</td>
              <td>ใช้ระบบ e-LAAS, ระบบจัดซื้อ e-GP และสื่อสารข้อมูลผ่านระบบไลน์กลุ่มทางการและเว็บไซต์ อปท.</td>
              <td>พัฒนาการสำรองข้อมูลอัตโนมัติภายนอกสถานที่ (Off-site Backup) เพื่อความปลอดภัย</td>
            </tr>
            <tr>
              <td class="font-bold">5. กิจกรรมการติดตามผล (Monitoring Activities)</td>
              <td>มีหน่วยตรวจสอบภายในดำเนินการตรวจสอบตามแผนประจำปี และติดตามผลการแก้ไขข้อทักท้วง (CAPA) ใน 60 วัน</td>
              <td>ให้ทุกสำนัก/กองรายงานผลการปฏิบัติตามแผน ปค.5 ต่อผู้บริหารทุกไตรมาส</td>
            </tr>
          </tbody>
        </table>
        
        <table class="signature-table">
          <tr>
            <td style="width: 50%;">
              ลงชื่อ...................................................<br/>
              ( ${auditorName} )<br/>
              ผู้ตรวจสอบภายใน
            </td>
            <td style="width: 50%;">
              ลงชื่อ...................................................<br/>
              ( ${palatName} )<br/>
              ปลัด${orgName}
            </td>
          </tr>
        </table>
      `;
      return exportToWordDoc('แบบ ปค.4', body, `แบบ_ปค4_ประเมิน5องค์ประกอบ_${orgName}`);
    }

    case 'FORM-PK-05': {
      const body = `
        <div class="text-right font-bold">แบบ ปค. 5</div>
        <h2>รายงานการประเมินผลการควบคุมภายในภาพรวมองค์กร</h2>
        <p class="text-center font-bold no-indent">${orgName}</p>
        <p class="text-center no-indent">สำหรับงวดตั้งแต่วันที่ 1 ตุลาคม 2568 ถึงวันที่ 30 กันยายน 2569</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">ลำดับ</th>
              <th style="width: 25%;">ความเสี่ยง / ข้อตรวจพบสำคัญ</th>
              <th style="width: 32%;">การควบคุมภายในที่มีอยู่ / การปรับปรุง</th>
              <th style="width: 20%;">หน่วยงานรับผิดชอบ</th>
              <th style="width: 15%;">กำหนดเสร็จ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td>การจัดเก็บภาษีที่ดินและสิ่งปลูกสร้างนอกสถานที่อาจออกใบเสร็จล่าช้า</td>
              <td>นำระบบ Mobile e-Receipt และระบบชำระเงิน QR Code มาใช้ กระทบยอดทันทีสิ้นวัน</td>
              <td>กองคลัง</td>
              <td class="text-center">ไตรมาสที่ 2</td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td>การควบคุมพัสดุครุภัณฑ์และการจำหน่ายพัสดุชำรุดค้างปี (ว 184)</td>
              <td>แต่งตั้งคณะกรรมการตรวจสอบพัสดุประจำปีและบันทึกตัดบัญชีพัสดุตามระเบียบ</td>
              <td>กองคลัง / ทุกส่วนราชการ</td>
              <td class="text-center">มีนาคม 2569</td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td>การเบิกจ่ายเงินเบี้ยยังชีพกรณีผู้มีสิทธิเสียชีวิตระหว่างเดือน</td>
              <td>ประสานข้อมูลทะเบียนราษฎรและ อสม. ตัดยอด Real-time ก่อนประมวลผลเบิกจ่าย</td>
              <td>กองสวัสดิการสังคม</td>
              <td class="text-center">ต่อเนื่องทุกเดือน</td>
            </tr>
          </tbody>
        </table>
        
        <table class="signature-table">
          <tr>
            <td style="width: 50%;">
              ลงชื่อ...................................................<br/>
              ( ${palatName} )<br/>
              ปลัด${orgName}
            </td>
            <td style="width: 50%;">
              ลงชื่อ...................................................<br/>
              ( ${approverName} )<br/>
              นายก${orgName}
            </td>
          </tr>
        </table>
      `;
      return exportToWordDoc('แบบ ปค.5', body, `แบบ_ปค5_ภาพรวมองค์กร_${orgName}`);
    }

    case 'FORM-PENALTY': {
      const body = `
        <div class="text-right font-bold">แบบ คป.01</div>
        <p class="text-center font-bold no-indent" style="font-size: 18pt;">บันทึกข้อความ</p>
        <p class="no-indent"><strong>ส่วนราชการ:</strong> กองคลัง / งานพัสดุ ${orgName}</p>
        <p class="no-indent"><strong>ที่:</strong> อบ 77602 / .................................... <strong>วันที่:</strong> ...................................................</p>
        <p class="no-indent"><strong>เรื่อง:</strong> รายงานการส่งมอบงานล่าช้าและการคำนวณเงินค่าปรับตามสัญญา</p>
        <hr style="border: 0.5pt solid #333; margin: 8pt 0;" />
        <p><strong>เรียน</strong> นายก${orgName}</p>
        <p>ตามที่ ${orgName} ได้จัดทำสัญญาจัดซื้อ/จ้าง เลขที่ ......................... ลงวันที่ ......................... กับ ..................................................... ในวงเงินตามสัญญา ................................. บาท กำหนดส่งมอบงานภายในวันที่ ......................... นั้น</p>
        <p>ปรากฏว่าคู่สัญญาได้ส่งมอบงานเมื่อวันที่ ......................... ซึ่งล่วงเลยกำหนดระยะเวลาตามสัญญาเป็นเวลา .................. วัน ทางพัสดุได้ตรวจสอบแล้วเห็นควรดำเนินการคิดค่าปรับตาม พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 มาตรา 102 ดังตารางต่อไปนี้:</p>
        
        <table>
          <thead>
            <tr>
              <th>รายการ</th>
              <th>รายละเอียด / การคำนวณ</th>
              <th>จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1. วงเงินตามสัญญาจัดซื้อ/จัดจ้าง</td>
              <td>มูลค่ารวมภาษีมูลค่าเพิ่ม</td>
              <td class="text-right font-bold">1,200,000.00</td>
            </tr>
            <tr>
              <td>2. อัตราค่าปรับต่อวัน</td>
              <td>อัตราร้อยละ 0.1 ต่อวัน (งานจ้างก่อสร้าง/พัสดุ)</td>
              <td class="text-right">1,200.00 บาท/วัน</td>
            </tr>
            <tr>
              <td>3. จำนวนวันที่ส่งมอบงานล่าช้า</td>
              <td>ตั้งแต่วันถัดจากวันครบกำหนดสัญญา ถึงวันส่งมอบงาน</td>
              <td class="text-right">10 วัน</td>
            </tr>
            <tr>
              <td>4. หัก: วันหยุดราชการ (ถ้ามีตามระเบียบ)</td>
              <td>กรณีส่งมอบของในวันทำการแรกหลังวันหยุด</td>
              <td class="text-right">0 วัน</td>
            </tr>
            <tr>
              <td class="font-bold">5. รวมเงินค่าปรับทั้งสิ้น</td>
              <td class="font-bold">1,200 บาท x 10 วัน</td>
              <td class="text-right font-bold" style="color: #c00;">12,000.00</td>
            </tr>
          </tbody>
        </table>
        
        <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติให้หักเงินค่าปรับจำนวน 12,000.00 บาท (หนึ่งหมื่นสองพันบาทถ้วน) จากการเบิกจ่ายเงินตามสัญญาต่อไป</p>
        
        <table class="signature-table">
          <tr>
            <td style="width: 50%;">
              ลงชื่อ...................................................<br/>
              ( ................................................... )<br/>
              เจ้าหน้าที่พัสดุ
            </td>
            <td style="width: 50%;">
              ลงชื่อ...................................................<br/>
              ( ................................................... )<br/>
              ผู้อำนวยการกองคลัง
            </td>
          </tr>
        </table>
      `;
      return exportToWordDoc('แบบ คป.01 คิดค่าปรับ', body, `แบบ_คป01_คำนวณค่าปรับสัญญา_${orgName}`);
    }

    case 'FORM-V184': {
      const body = `
        <div class="text-right font-bold">แบบ ว 184</div>
        <h2>รายงานผลการตรวจสอบพัสดุประจำปีงบประมาณ พ.ศ. ${currentYear}</h2>
        <p class="text-center font-bold no-indent">${orgName}</p>
        <p class="text-center no-indent">ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างฯ พ.ศ. 2560 และ ว 184</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">ลำดับ</th>
              <th style="width: 18%;">หมายเลขครุภัณฑ์</th>
              <th style="width: 25%;">รายการครุภัณฑ์</th>
              <th style="width: 14%;">สภาพการใช้งาน</th>
              <th style="width: 20%;">สถานที่เก็บ/ผู้ครอบครอง</th>
              <th style="width: 15%;">ความเห็นกรรมการ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td>7440-001-0012/62</td>
              <td>เครื่องคอมพิวเตอร์ประมวลผล</td>
              <td class="text-center">ใช้การได้ปกติ</td>
              <td>สำนักปลัด</td>
              <td>ให้ใช้งานต่อไป</td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td>7450-002-0045/58</td>
              <td>เครื่องพิมพ์มัลติฟังก์ชัน</td>
              <td class="text-center" style="color: #b45309;">ชำรุดรอซ่อม</td>
              <td>กองคลัง</td>
              <td>ส่งซ่อมบำรุง</td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td>7730-004-0003/52</td>
              <td>เครื่องตัดหญ้าสะพายบ่า</td>
              <td class="text-center" style="color: #dc2626;">ชำรุดเสื่อมสภาพ</td>
              <td>กองช่าง</td>
              <td>เสนอจำหน่ายขายทอดตลาด</td>
            </tr>
          </tbody>
        </table>
        <p class="font-bold">สรุปภาพรวมการตรวจสอบพัสดุ:</p>
        <p>คณะกรรมการได้ตรวจสอบพัสดุคงเหลือ ณ วันสิ้นปีงบประมาณ พบว่าพัสดุส่วนใหญ่มีการเก็บรักษาและลงบัญชีคุมถูกต้อง มีพัสดุชำรุดเสื่อมสภาพที่เห็นควรดำเนินการจำหน่ายออกจากบัญชีตามระเบียบฯ</p>
        
        <table class="signature-table">
          <tr>
            <td style="width: 33%;">
              ลงชื่อ......................................<br/>
              ( ...................................... )<br/>
              ประธานกรรมการ
            </td>
            <td style="width: 33%;">
              ลงชื่อ......................................<br/>
              ( ...................................... )<br/>
              กรรมการ
            </td>
            <td style="width: 33%;">
              ลงชื่อ......................................<br/>
              ( ...................................... )<br/>
              กรรมการและเลขานุการ
            </td>
          </tr>
        </table>
      `;
      return exportToWordDoc('แบบ ว 184', body, `แบบ_ว184_ตรวจสอบพัสดุประจำปี_${orgName}`);
    }

    default: {
      // General Template for other forms
      const body = `
        <div class="text-right font-bold">${formId}</div>
        <h2>แบบฟอร์มมาตรฐานสำหรับองค์กรปกครองส่วนท้องถิ่น</h2>
        <p class="text-center font-bold no-indent">${orgName}</p>
        <p class="text-center no-indent">ประจำปีงบประมาณ พ.ศ. ${currentYear}</p>
        <br/>
        <p>เอกสารแบบฟอร์มนี้จัดทำขึ้นตามระเบียบกระทรวงมหาดไทยและกฎหมายที่เกี่ยวข้อง เพื่อใช้ประกอบการปฏิบัติงานและตรวจสอบภายในของ ${orgName}</p>
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">ลำดับ</th>
              <th style="width: 45%;">หัวข้อ / สาระสำคัญ</th>
              <th style="width: 45%;">ผลการปฏิบัติ / หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td>การตรวจสอบความถูกต้องของเอกสารหลักฐาน</td>
              <td>ครบถ้วน ถูกต้องตามระเบียบ</td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td>การอนุมัติและการลงนามตามลำดับชั้น</td>
              <td>ดำเนินการตามขั้นตอนอำนาจสั่งการ</td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td>การลงทะเบียนคุมและจัดเก็บเอกสาร</td>
              <td>บันทึกในระบบและสมุดคุมเรียบร้อย</td>
            </tr>
          </tbody>
        </table>
        
        <table class="signature-table">
          <tr>
            <td style="width: 50%;">
              ลงชื่อ...................................................<br/>
              ( ${palatName} )<br/>
              ปลัด${orgName}
            </td>
            <td style="width: 50%;">
              ลงชื่อ...................................................<br/>
              ( ${approverName} )<br/>
              นายก${orgName}
            </td>
          </tr>
        </table>
      `;
      return exportToWordDoc(formId, body, `แบบฟอร์ม_${formId}_${orgName}`);
    }
  }
}

/**
 * 8. ดาวน์โหลดแบบฟอร์มทางการราชการเป็น Excel (.xlsx)
 */
export function downloadOfficialFormExcel(formId, orgProfile = {}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const currentYear = '2569';

  switch (formId) {
    case 'FORM-PK-05': {
      const aoa = [
        [`แบบ ปค. 5: รายงานการประเมินผลการควบคุมภายในภาพรวมองค์กร`],
        [`${orgName} • ประจำปีงบประมาณ พ.ศ. ${currentYear}`],
        [],
        ['ลำดับ', 'กระบวนการ/งานที่ประเมิน', 'ความเสี่ยง/จุดอ่อนที่พบ', 'กิจกรรมการควบคุมที่มีอยู่/ต้องปรับปรุง', 'ผู้รับผิดชอบ', 'กำหนดเสร็จ', 'สถานะ'],
        [1, 'การจัดเก็บภาษีที่ดินและสิ่งปลูกสร้าง', 'การออกใบเสร็จนอกสถานที่ล่าช้า', 'นำระบบ Mobile e-Receipt และ QR Code Payment มาใช้', 'ผู้อำนวยการกองคลัง', 'มีนาคม 2569', 'อยู่ระหว่างดำเนินการ'],
        [2, 'การเบิกจ่ายเงินเบี้ยยังชีพ', 'ข้อมูลผู้เสียชีวิตปลายเดือนล่าช้า', 'เชื่อมโยงข้อมูลกับ รพ.สต. และฝ่ายทะเบียนราษฎร', 'ผู้อำนวยการกองสวัสดิการ', 'ต่อเนื่องทุกเดือน', 'ดำเนินการแล้วเสร็จ'],
        [3, 'การจัดซื้อจัดจ้างและตรวจรับพัสดุ', 'การส่งมอบงานก่อสร้างช่างคุมงานขาดส่งบันทึก', 'จัดทำแบบรายงานช่างคุมงานประจำวันรายสัปดาห์', 'ผู้อำนวยการกองช่าง', 'ไตรมาสที่ 2', 'อยู่ระหว่างดำเนินการ']
      ];
      return downloadMultiSheetExcel([{ sheetName: 'แบบ_ปค5', data: aoa, colWidths: [{ wch: 8 }, { wch: 28 }, { wch: 32 }, { wch: 38 }, { wch: 22 }, { wch: 16 }, { wch: 18 }] }], `แบบ_ปค5_การควบคุมภายใน_${orgName}`);
    }

    case 'FORM-PENALTY': {
      const aoa = [
        [`แบบ คป.01: แบบคำนวณและแจ้งคิดค่าปรับตามสัญญาจัดซื้อจัดจ้าง (Penalty Sheet)`],
        [`${orgName} • ตาม พ.ร.บ. จัดซื้อจัดจ้าง พ.ศ. 2560 มาตรา 102`],
        [],
        ['รายการคำนวณค่าปรับ', 'รายละเอียด', 'หน่วย/ตัวเลข', 'ยอดเงิน (บาท)', 'หมายเหตุ'],
        ['เลขที่สัญญา', 'จ้างก่อสร้างถนน คสล. บ้านฝางเทิง', 'CN-69/004', '-', 'คู่สัญญา: หจก. สิรินธรการโยธา'],
        ['วงเงินตามสัญญา', 'รวมภาษีมูลค่าเพิ่ม 7%', '-', 1200000, 'เบิกจ่ายงบประมาณ อปท.'],
        ['กำหนดส่งมอบตามสัญญา', 'ครบกำหนดระยะเวลาตามสัญญา', '15 ม.ค. 2569', '-', ''],
        ['วันที่ส่งมอบงานจริง', 'ส่งมอบ ณ สำนักงาน อปท.', '25 ม.ค. 2569', '-', 'ล่าช้า 10 วัน'],
        ['อัตราค่าปรับต่อวัน', 'อัตราร้อยละ 0.1 ของวงเงินสัญญา', '0.1%', 1200, 'คำนวณจากยอด 1,200,000'],
        ['จำนวนวันคิดค่าปรับ', 'นับตั้งแต่วันถัดจากวันครบกำหนด', '10 วัน', '-', 'หักวันหยุดตามระเบียบแล้ว'],
        ['รวมเงินค่าปรับสุทธิ', 'หักจากเงินค่าจ้างก่อนเบิกจ่าย', '-', 12000, 'บันทึกลดหนี้/หักเงินฎีกา']
      ];
      return downloadMultiSheetExcel([{ sheetName: 'แบบ_คป01_คิดค่าปรับ', data: aoa, colWidths: [{ wch: 24 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 28 }] }], `แบบ_คป01_คิดค่าปรับตามสัญญา_${orgName}`);
    }

    case 'FORM-V184': {
      const aoa = [
        [`แบบ ว 184: รายงานผลการตรวจสอบพัสดุและครุภัณฑ์ประจำปี`],
        [`${orgName} • ประจำปีงบประมาณ พ.ศ. ${currentYear}`],
        [],
        ['ลำดับ', 'หมายเลขครุภัณฑ์', 'ชื่อรายการพัสดุครุภัณฑ์', 'ปีที่ได้มา', 'ราคาทุน (บาท)', 'สภาพปัจจุบัน', 'หน่วยงานผู้ครอบครอง', 'ความเห็นคณะกรรมการ'],
        [1, '7440-001-0012/62', 'เครื่องคอมพิวเตอร์ประมวลผล All-in-One', '2562', 28000, 'ใช้การได้ปกติ', 'สำนักปลัด', 'ให้ใช้งานต่อไป'],
        [2, '7450-002-0045/58', 'เครื่องพิมพ์เลเซอร์มัลติฟังก์ชัน', '2558', 16500, 'ชำรุดรอซ่อม', 'กองคลัง', 'ส่งซ่อมบำรุง'],
        [3, '7730-004-0003/52', 'เครื่องตัดหญ้าสะพายบ่า', '2552', 8900, 'ชำรุดเสื่อมสภาพ', 'กองช่าง', 'เสนอจำหน่ายขายทอดตลาด'],
        [4, '4110-003-0008/60', 'โต๊ะทำงานระดับ 3-6', '2560', 4500, 'ใช้การได้ปกติ', 'กองการศึกษา', 'ให้ใช้งานต่อไป']
      ];
      return downloadMultiSheetExcel([{ sheetName: 'แบบ_ว184_พัสดุ', data: aoa, colWidths: [{ wch: 8 }, { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 28 }] }], `แบบ_ว184_ตรวจสอบพัสดุประจำปี_${orgName}`);
    }

    default: {
      const aoa = [
        [`แบบฟอร์มมาตรฐาน: ${formId}`],
        [`${orgName} • ปีงบประมาณ พ.ศ. ${currentYear}`],
        [],
        ['ลำดับ', 'รายการ / กิจกรรม', 'จำนวน / ปริมาณ', 'สถานะการดำเนินงาน', 'หมายเหตุ'],
        [1, 'การตรวจสอบเอกสารและข้อมูลพื้นฐาน', 1, 'ครบถ้วนถูกต้อง', ''],
        [2, 'การบันทึกรายการในทะเบียนคุม', 1, 'บันทึกเรียบร้อย', '']
      ];
      return downloadMultiSheetExcel([{ sheetName: formId.slice(0, 30), data: aoa, colWidths: [{ wch: 8 }, { wch: 35 }, { wch: 16 }, { wch: 20 }, { wch: 25 }] }], `แบบฟอร์ม_${formId}_${orgName}`);
    }
  }
}

