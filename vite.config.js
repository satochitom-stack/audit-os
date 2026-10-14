import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.3';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.3: ซิงค์สิทธิประโยชน์สนับสนุนระบบจาก Admin และกำหนดแพ็กเกจตลอดชีพเป็นคุ้มค่าที่สุด (Synced Benefits & Lifetime VIP Most Valuable)',
        description: 'ปรับปรุงหน้ารายละเอียดสิทธิประโยชน์ให้เชื่อมโยงข้อความจากหน้า Admin โดยตรง รองรับ Markdown และข้อความสนับสนุนระบบ พร้อมปรับย้ายป้ายแนะนำและคุ้มค่าที่สุดไปยังแพ็กเกจตลอดชีพ (LIFETIME VIP ฿590) อย่างชัดเจนและสมบูรณ์',
        changeSummary: 'Admin Benefits Sync, Markdown-ready Benefits Rendering, Lifetime VIP Most Valuable badge, Annual Plan label update, Registration Plan Choice enhancement'
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
