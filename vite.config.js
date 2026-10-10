import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.5.4';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'ระบบมีการอัปเดตเวอร์ชันใหม่!',
        description: 'ทางทีมงานได้ทำการอัปเดตและปรับปรุงฟีเจอร์ใหม่เรียบร้อยแล้ว ข้อมูลทั้งหมดของคุณปลอดภัยในระบบ Cloud สามารถคลิกปุ่มด้านขวาเพื่อเริ่มใช้งานเวอร์ชันใหม่ได้ทันที',
        changeSummary: ''
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
