import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.1';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.1: รูปแบบเอกสารราชการมาตรฐานตามระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖',
        description: 'ปรับปรุงเอกสารราชการทั้งหมดในระบบให้ถูกต้องตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ และที่แก้ไขเพิ่มเติม: ตัวเลขไทย (๐-๙), ตราครุฑเวกเตอร์มาตรฐาน, ระยะขอบกระดาษ A4 มาตรฐาน (กั้นหน้า ๓ ซม. กั้นหลัง ๒ ซม. กั้นบน ๒.๕ ซม. กั้นล่าง ๒ ซม. ย่อหน้า ๒.๕ ซม.)',
        changeSummary: 'Thai Saraban Regulation Compliance, Thai Digits (๐-๙), Official SVG Garuda Emblem (1.5cm / 3.0cm), Precise MSO Word Margins, OfficialThaiExternalLetter, OfficialThaiOrder, OfficialThaiMemo'
      };
      try {
        if (!fs.existsSync('./public')) {
          fs.mkdirSync('./public', { recursive: true });
        }
        fs.writeFileSync('./public/version.json', JSON.stringify(versionData, null, 2), 'utf-8');
      } catch (e) {
        console.warn('Could not write version.json:', e);
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
  },
  plugins: [
    versionPlugin(),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
