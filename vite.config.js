import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.8.0';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.8.0: ยกระดับระบบประเมินความเสี่ยง เกณฑ์ 3/5 ระดับ, ตราครุฑงานสารบรรณ, จัดหน้าพิมพ์อัจฉริยะ และแก้ไขตัวเลขส่งออก',
        description: 'เพิ่มตัวเลือกสลับเกณฑ์ประเมินความเสี่ยง ๓ ระดับ (ว ๓๘๐) และ ๕ ระดับ (อปท./COSO), ตราครุฑมาตรฐานงานสารบรรณ ๑.๕ ซม., จัดหน้ากระดาษพิมพ์แนวตั้ง/แนวนอนอัตโนมัติตามเนื้อหา, แยกปุ่มพิมพ์และ PDF, แก้ไขตัวเลขคะแนนในไฟล์ดาวน์โหลด',
        changeSummary: 'Add 3/5 risk scale toggle, official Garuda emblem, smart print orientation, separate print/pdf actions, and fix export score data'
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
