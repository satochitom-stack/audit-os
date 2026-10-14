import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.2';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.2: การแยกข้อมูลและโปรไฟล์ระหว่าง ADMIN กับ User อย่างสมบูรณ์ (Tenant Profile & Auditor Isolation)',
        description: 'แก้ไขปัญหาข้อมูลและชื่อผู้ประเมิน/ผู้ตรวจสอบของ ADMIN ปรากฏในบัญชี User ทั่วไป โดยทำการแยกข้อมูล orgProfile และข้อมูลการจัดทำเอกสาร/ลายมือชื่อตาม Tenant และ Session ของผู้ใช้งานอย่างเด็ดขาด ป้องกันการรั่วไหลของข้อมูลระหว่าง ADMIN กับ User',
        changeSummary: 'Tenant Profile Isolation, Clean User Workspace, Zero ADMIN leakage in user reports, banners, and memos, Strict effectiveAuditor sanitization'
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
