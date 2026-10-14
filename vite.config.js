import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.7';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.7: อัปเกรดระบบสำรองข้อมูล Google Sheets (Data Chunking ป้องกัน 50,000 อักขระ & คู่มือสิทธิ์ Google)',
        description: 'แก้ไขปัญหาข้อจำกัด 50,000 อักขระต่อเซลล์ของ Google Sheets โดยใช้ระบบ Data Chunking แตกไฟล์ JSON ลงหลายแถวอัตโนมัติ และเพิ่มคำแนะนำการตั้งค่าผ่านหน้าจอความปลอดภัย Google Unverified App',
        changeSummary: 'Data chunking for Google Sheets raw data backup (bypass 50k char limit), add step-by-step Google unverified app bypass guide and auto-detect 50k error'
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
