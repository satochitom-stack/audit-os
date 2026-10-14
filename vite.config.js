import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.0';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.0: ระบบฐานข้อมูล Google Sheets ของ อปท. (BYOD)',
        description: 'เพิ่มระบบเชื่อมต่อ Google Sheets ส่วนตัวของผู้ใช้ (100% Data Sovereignty) ซิงค์กระดาษทำการ แผนงาน และรายงานผลลง Google Drive ของหน่วยงานท่านเองโดยตรง ปลอดภัยสูงสุด',
        changeSummary: 'Google Sheets BYOD Data Sovereignty, Auto-Sync in background, 1-Click Apps Script Webhook, Human-readable spreadsheet tabs'
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
