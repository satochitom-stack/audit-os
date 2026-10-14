/**
 * Saraban Utilities (ระเบียบสำนักนายกรัฐมนตรี ว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ และที่แก้ไขเพิ่มเติม)
 * ศูนย์กลางการแปลงเลขไทย ฟอร์แมตวันที่ตามระเบียบสารบรรณ และตราครุฑมาตรฐาน
 */

/**
 * แมปแปลงเลขอารบิก 0-9 เป็นเลขไทย ๐-๙
 */
const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

/**
 * แปลงตัวเลขอารบิกทั้งหมดให้เป็นตัวเลขไทยอย่างเป็นระบบ
 * ปลอดภัยต่อ HTML tags และ attributes (แปลงเฉพาะข้อความ ไม่แปลงตัวเลขใน tag attributes)
 * @param {string|number} input
 * @returns {string}
 */
export function toThaiDigits(input) {
  if (input === null || input === undefined) return '';
  const str = String(input);
  
  // ตรวจสอบว่ามี HTML tag หรือไม่
  if (/<[^>]+>/.test(str)) {
    // แยกส่วน HTML tags ออกจาก text nodes และแปลงเฉพาะตัวเลขใน text
    return str.replace(/<[^>]*>|(\d+)/g, (match, digits) => {
      if (digits) {
        return digits.replace(/\d/g, (d) => THAI_DIGITS[d] || d);
      }
      return match;
    });
  }

  // ข้อความทั่วไป แปลงตัวเลขทุกตัวเป็นเลขไทย
  return str.replace(/\d/g, (d) => THAI_DIGITS[d] || d);
}

/**
 * รายชื่อเดือนภาษาไทยเต็ม
 */
export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * ฟอร์แมตวันที่ให้ถูกต้องตามระเบียบงานสารบรรณ
 * - หนังสือภายใน (บันทึกข้อความ): มีคำว่า "วันที่" นำหน้า เช่น "วันที่ ๑๔ ตุลาคม ๒๕๖๙"
 * - หนังสือภายนอก: ไม่มีคำว่า "วันที่" นำหน้า เช่น "๑๔ ตุลาคม ๒๕๖๙"
 * - คำสั่ง: มีคำว่า "สั่ง ณ วันที่ ๑๔ ตุลาคม พ.ศ. ๒๕๖๙"
 * @param {string|Date} dateInput
 * @param {Object} options { isExternal: false, isOrder: false, placeholder: true }
 * @returns {string}
 */
export function formatSarabanDate(dateInput, options = {}) {
  const { isExternal = false, isOrder = false, placeholder = false } = options;

  if (!dateInput) {
    if (placeholder) {
      if (isOrder) return 'สั่ง ณ วันที่ ...... เดือน ........................ พ.ศ. ............';
      if (isExternal) return '...... เดือน ........................ พ.ศ. ............';
      return 'วันที่ ...... เดือน ........................ พ.ศ. ............';
    }
    return '';
  }

  let d, m, y;

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    d = dateInput.getDate();
    m = dateInput.getMonth();
    y = dateInput.getFullYear() + 543;
  } else if (typeof dateInput === 'string') {
    // ตรวจสอบว่าเป็น ISO date YYYY-MM-DD
    const isoMatch = dateInput.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const rawYear = parseInt(isoMatch[1], 10);
      y = rawYear < 2500 ? rawYear + 543 : rawYear;
      m = parseInt(isoMatch[2], 10) - 1;
      d = parseInt(isoMatch[3], 10);
    } else {
      // หากส่งข้อความวันที่มาแล้ว เช่น "14 ตุลาคม 2569" ให้แปลงตัวเลขเป็นเลขไทย
      const thaiNumStr = toThaiDigits(dateInput);
      if (isExternal && thaiNumStr.startsWith('วันที่ ')) {
        return thaiNumStr.replace(/^วันที่\s*/, '');
      }
      if (!isExternal && !isOrder && !thaiNumStr.startsWith('วันที่ ') && !thaiNumStr.startsWith('สั่ง ณ วันที่')) {
        return `วันที่ ${thaiNumStr}`;
      }
      return thaiNumStr;
    }
  } else {
    return toThaiDigits(String(dateInput));
  }

  const thaiDay = toThaiDigits(d);
  const monthName = THAI_MONTHS[m] || '';
  const thaiYear = toThaiDigits(y);

  if (isOrder) {
    return `สั่ง ณ วันที่ ${thaiDay} ${monthName} พ.ศ. ${thaiYear}`;
  }
  if (isExternal) {
    return `${thaiDay} ${monthName} ${thaiYear}`;
  }
  return `วันที่ ${thaiDay} ${monthName} ${thaiYear}`;
}

/**
 * SVG Path สำหรับตราครุฑทางการที่มีความคมชัดและได้สัดส่วนมาตรฐานระเบียบสำนักนายกรัฐมนตรี
 * โครงร่างพญาครุฑกางปีก ยอดชฎา พระพักตร์ จงอยปาก ทรวงอก หางลายกนก และกรงเล็บตามมาตรฐานงานสารบรรณ
 */
export const GARUDA_SVG_PATH = "M 50,1 L 51.2,7 L 52.8,12 L 50.8,13 L 53,17 L 55,21 L 52,22 L 54.5,26 L 50,27.5 L 45.5,26 L 48,22 L 45,21 L 47.2,17 L 45.2,13 L 47.2,12 L 48.8,7 Z M 50,28 C 53,28 55,30 55,33 C 55,36 53,38 51.5,40 L 50,44 L 48.5,40 C 47,38 45,36 45,33 C 45,30 47,28 50,28 Z M 45,30 C 42,29 39,32 38,35 C 41,35 43,34 44.5,33 Z M 55,30 C 58,29 61,32 62,35 C 59,35 57,34 55.5,33 Z M 42,36 C 35,32 26,22 17,14 C 19,20 22,27 26,33 C 18,27 11,25 6,26 C 9,33 14,39 21,43 C 13,39 7,41 3,46 C 7,51 14,54 21,54 C 13,54 8,58 5,64 C 11,65 18,64 24,61 C 17,64 12,70 11,76 C 17,75 23,72 28,66 C 22,71 18,78 18,85 C 24,82 30,76 34,68 C 36,65 39,63 41,61 L 43,50 Z M 58,36 C 65,32 74,22 83,14 C 81,20 78,27 74,33 C 82,27 89,25 94,26 C 91,33 86,39 79,43 C 87,39 93,41 97,46 C 93,51 86,54 79,54 C 87,54 92,58 95,64 C 89,65 82,64 76,61 C 83,64 88,70 89,76 C 83,75 77,72 72,66 C 78,71 82,78 82,85 C 76,82 70,76 66,68 C 64,65 61,63 59,61 L 57,50 Z M 46,42 C 43,45 42,50 43,56 C 44,61 46,65 48,67 L 50,68 L 52,67 C 54,65 56,61 57,56 C 58,50 57,45 54,42 Z M 44,43 C 38,42 34,44 32,48 C 30,52 32,56 36,56 C 39,56 42,53 44,50 Z M 56,43 C 62,42 66,44 68,48 C 70,52 68,56 64,56 C 61,56 58,53 56,50 Z M 48,67 C 46,74 42,83 38,94 C 43,92 47,87 49,81 L 50,96 L 51,81 C 53,87 57,92 62,94 C 58,83 54,74 52,67 Z M 44,65 C 41,71 37,77 34,83 C 32,86 31,89 29,91 C 32,90 35,87 37,84 C 36,87 35,91 34,94 C 38,91 40,86 42,81 C 44,77 46,72 46,67 Z M 56,65 C 59,71 63,77 66,83 C 68,86 69,89 71,91 C 68,90 65,87 63,84 C 64,87 65,91 66,94 C 62,91 60,86 58,81 C 56,77 54,72 54,67 Z";

/**
 * Garuda Emblem HTML string สำหรับ Word (.doc) และ Direct Print Window
 * - 1.5 ซม. (ประมาณ 42.5 pt / 57 px) ใช้สำหรับหนังสือภายใน (บันทึกข้อความ แบบที่ ๒)
 * - 3.0 ซม. (ประมาณ 85 pt / 113 px) ใช้สำหรับหนังสือภายนอก (แบบที่ ๑) และคำสั่ง (แบบที่ ๑๔)
 */
export const GARUDA_SVG_1_5CM_HTML = `
<svg width="57" height="57" viewBox="0 0 100 100" style="fill: black; display: inline-block; vertical-align: top;">
  <path d="${GARUDA_SVG_PATH}" />
</svg>
`;

export const GARUDA_SVG_3CM_HTML = `
<svg width="113" height="113" viewBox="0 0 100 100" style="fill: black; display: inline-block; margin: 0 auto;">
  <path d="${GARUDA_SVG_PATH}" />
</svg>
`;

/**
 * มาตรฐานระยะขอบและฟอนต์ตามระเบียบงานสารบรรณ
 */
export const SARABAN_CONFIG = {
  fontFamily: "'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif",
  fontSize: '16pt',
  fontSizeTitle: '29pt',
  fontSizeOrderTitle: '24pt',
  margins: {
    top: '2.5cm',
    bottom: '2.0cm',
    left: '3.0cm',
    right: '2.0cm',
    indent: '2.5cm'
  },
  wordMarginsPt: {
    top: '70.85pt',    // 2.5 cm
    bottom: '56.7pt',   // 2.0 cm
    left: '85.05pt',    // 3.0 cm
    right: '56.7pt'     // 2.0 cm
  }
};
