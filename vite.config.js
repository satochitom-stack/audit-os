import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.6';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.6: นำรายการสิทธิประโยชน์ 6 ข้อออกจากหน้าต่างสนับสนุนระบบ (Cleaned 11 Audit Processes Checkmarks in Support Modal)',
        description: 'นำรายการ 6 หัวข้อย่อย (ปลดล็อก 11 กระบวนการตรวจ, คลังระเบียบ สถ. ฯลฯ) ออกจากหน้าต่างแพ็กเกจ & สนับสนุนระบบ เพื่อให้คงเหลือเฉพาะข้อความสนับสนุนระบบจาก Admin โดยตรงอย่างกระชับและไม่ซ้ำซ้อน',
        changeSummary: 'Remove 6 checkmark items from PackageRenewalModal, Pure Admin Markdown Message, Streamline Support Modal View'
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
