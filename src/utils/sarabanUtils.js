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
 */
export const GARUDA_SVG_PATH = "M50 3 C53 10, 58 15, 66 14 C62 21, 56 25, 54 32 C60 30, 70 25, 80 21 C76 31, 68 38, 60 41 C66 45, 75 49, 83 51 C73 57, 63 55, 55 53 C53 62, 52 72, 50 82 C48 72, 47 62, 45 53 C37 55, 27 57, 17 51 C25 49, 34 45, 40 41 C32 38, 24 31, 20 21 C30 25, 40 30, 46 32 C44 25, 38 21, 34 14 C42 15, 47 10, 50 3 Z M50 32 C54 32, 57 35, 57 39 C57 43, 54 46, 50 46 C46 46, 43 43, 43 39 C43 35, 46 32, 50 32 Z M35 56 C42 62, 47 70, 50 80 C53 70, 58 62, 65 56 C60 62, 55 72, 50 88 C45 72, 40 62, 35 56 Z";

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
