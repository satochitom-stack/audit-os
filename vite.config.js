import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.5';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.5: นำกรอบสถาปัตยกรรม BYOD ออกจากหน้าแรก และปรับแถบนำทางให้กระชับเรียบหรู (Removed Redundant Architecture Banner & Streamlined Landing UI)',
        description: 'นำบล็อกกรอบสถาปัตยกรรม Bring Your Own Database (BYOD) ออกจากหน้าแรกเพื่อขจัดความซ้ำซ้อน เนื่องจากมีเมนูจัดการฐานข้อมูล Google Sheets อย่างสมบูรณ์อยู่ภายในระบบแล้ว พร้อมปรับแถบ Navigation เชื่อมโยงตรงสู่แผนภูมิโครงสร้างหน่วยรับตรวจ',
        changeSummary: 'Remove BYOD architecture banner from WelcomeView, Clean Single Anchor Navigation, Remove unused icons and dead links'
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
