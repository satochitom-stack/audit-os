import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const buildTimestamp = Date.now();
const appVersion = '2.7.4';

function versionPlugin() {
  return {
    name: 'version-generator',
    buildStart() {
      const versionData = {
        version: appVersion,
        buildTime: buildTimestamp,
        releaseDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        title: 'Audit-OS v2.7.4: ปรับปรุงโครงสร้างเมนู คลีนสัญลักษณ์ซ้อน และจัดระเบียบหน้าแรกให้สะอาดตา (Streamlined Navigation & Clean Landing UI)',
        description: 'ปรับลดความซ้ำซ้อนของเมนูในระบบทั้งหมด ตัดสัญลักษณ์และอีโมจิที่ซ้อนกันออก จัดกลุ่มเมนูใน User Dropdown ให้ชัดเจน และคลีน Floating Header หน้าแรกให้สบายตา พร้อมป้องกันข้อมูลของ Admin หลุดไปยังมุมมองผู้ใช้ทั่วไป',
        changeSummary: 'Streamlined Navigation Menus, Clean User Dropdown, No Duplicate Emojis/Icons, Clean Landing Page Header, Single CTA Action, Tenant Org Leakage Prevention'
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
