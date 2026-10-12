/**
 * ระบบจัดการและคำนวณวัน-เวลา และปีงบประมาณขององค์กรปกครองส่วนท้องถิ่น (อปท.)
 * มาตรฐานตามระเบียบกระทรวงการคลัง และระเบียบกระทรวงมหาดไทย
 * 
 * กฎการนับปีงบประมาณของ อปท.:
 * - เริ่มต้น: วันที่ 1 ตุลาคม
 * - สิ้นสุด: วันที่ 30 กันยายน ของปีถัดไป
 * - ตัวอย่าง:
 *   - 1 ต.ค. 2568 - 30 ก.ย. 2569 คือ ปีงบประมาณ 2569
 *   - 1 ต.ค. 2569 - 30 ก.ย. 2570 คือ ปีงบประมาณ 2570
 */

/**
 * คำนวณปีงบประมาณ พ.ศ. ปัจจุบันโดยอิงจากวันที่จริง (1 ต.ค. - 30 ก.ย.)
 * @param {Date|string|number} [date=new Date()] วันที่ต้องการตรวจสอบ
 * @returns {string} ปีงบประมาณ พ.ศ. 4 หลัก เช่น '2569', '2570'
 */
export function getCurrentFiscalYear(date = new Date()) {
  const d = new Date(date);
  const yearCe = d.getFullYear();
  const month = d.getMonth() + 1; // 1 (ม.ค.) ถึง 12 (ธ.ค.)
  // หากอยู่ในเดือน ต.ค. (10), พ.ย. (11), ธ.ค. (12): เริ่มปีงบประมาณใหม่ = ค.ศ. + 1 + 543 = ค.ศ. + 544
  // หากอยู่ในเดือน ม.ค. (1) ถึง ก.ย. (9): อยู่ในรอบปีงบประมาณปัจจุบัน = ค.ศ. + 543
  return String(month >= 10 ? yearCe + 544 : yearCe + 543);
}

/**
 * คืนค่าช่วงวันที่เริ่มต้นและสิ้นสุดของปีงบประมาณ
 * @param {string|number} [fiscalYear] ปีงบประมาณ พ.ศ. (ค่าเริ่มต้น: ปีงบประมาณปัจจุบัน)
 * @returns {{ fiscalYear: string, startYearBe: string, endYearBe: string, startDate: string, endDate: string, label: string }}
 */
export function getFiscalYearDetails(fiscalYear = getCurrentFiscalYear()) {
  const fy = parseInt(fiscalYear, 10) || 2570;
  const startYearBe = String(fy - 1);
  const endYearBe = String(fy);
  return {
    fiscalYear: String(fy),
    startYearBe,
    endYearBe,
    startDate: `1 ตุลาคม ${startYearBe}`,
    endDate: `30 กันยายน ${endYearBe}`,
    label: `1 ต.ค. ${startYearBe} - 30 ก.ย. ${endYearBe} (ปีงบประมาณ ${endYearBe})`
  };
}

/**
 * คืนค่ารายการปีงบประมาณมาตรฐานที่ควรมีในตัวเลือก dropdown
 * ประกอบด้วยปีงบประมาณปัจจุบัน และปีรอบข้าง (-1, 0, +1)
 * พร้อมคงปี 2569 และ 2570 ไว้เสมอ
 * @param {string|number} [currentYear=getCurrentFiscalYear()]
 * @returns {string[]} อาร์เรย์ปีงบประมาณ เรียงลำดับจากน้อยไปมาก
 */
export function getStandardFiscalYears(currentYear = getCurrentFiscalYear()) {
  const curr = parseInt(currentYear, 10) || 2570;
  const yearSet = new Set([
    '2569',
    '2570',
    String(curr - 1),
    String(curr),
    String(curr + 1)
  ]);
  return Array.from(yearSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}
