import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.9';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.9: ย้ายกราฟสรุปและสัดส่วนขึ้นด้านบนของกรอบแผนการตรวจ (Visual Charts Above Audit Plan)',
        description: 'ปรับตำแหน่งการแสดงผลหน้าแดชบอร์ดตรวจสอบภายใน โดยยกแผงกราฟแท่งความคืบหน้ารายไตรมาสและโดนัทชาร์ตสัดส่วนสถานะการตรวจขึ้นไปอยู่ด้านบนของกรอบแผนการตรวจและตัวชี้วัด',
        changeSummary: 'Position Visual Analytics Charts (Quarterly Progress Bar Chart & Donut Status Chart) directly above the Annual Audit Plan KPI metrics section'
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
