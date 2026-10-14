import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.8';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.8: ปรับโฉมหน้าแดชบอร์ดตรวจสอบภายในใหม่ (Executive Audit Cockpit & Visual Progress Charts)',
        description: 'ยกเครื่องหน้าแดชบอร์ดให้เป็นศูนย์สรุปผลการปฏิบัติงานตรวจสอบภายในที่สะอาดตา นำเมนูปุ่มทางลัดที่ซ้ำซ้อนออก เพิ่มกราฟแท่งความคืบหน้ารายไตรมาส Q1-Q4 โดนัทชาร์ตสัดส่วนสถานะการตรวจ และเส้นทางความก้าวหน้า 3 ระยะ',
        changeSummary: 'Redesign DashboardView with Quarterly Bar Chart, Donut Status Chart, Risk Coverage Progress, Streamlined 3-Stage Lifecycle Tracker, and Project Execution Table'
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
