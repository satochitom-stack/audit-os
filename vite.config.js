import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.5.5';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS อัปเดตเวอร์ชัน 2.5.5 เรียบร้อยแล้ว!',
        description: 'อัปเดตระบบสมาชิกอัตโนมัติ 30 วัน, นาฬิกานับถอยหลังอายุสมาชิกแบบเรียลไทม์, กำหนดวันหมดอายุโดยตรงใน Admin, ซ่อนรหัสผ่านของผู้ใช้เพื่อความปลอดภัยขั้นสูงสุด และระบบลืมรหัสผ่านด้วยตนเอง',
        changeSummary: 'Instant 30-day trial, Live Countdown Timer, Admin Expiry Date Picker, Strict Password Privacy, Self-Service Password Reset'
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
