/**
 * versionCheck.js
 * Utility to detect new application builds and broadcast updates across tabs.
 */

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.5.3';
export const APP_BUILD_TIME = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? Number(__BUILD_TIMESTAMP__) : Date.now();

const BROADCAST_CHANNEL_NAME = 'audit_os_system_updates';

/**
 * Fetch latest version metadata from public/version.json
 */
export async function fetchRemoteVersion() {
  try {
    const response = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache'
      }
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (err) {
    // Silently ignore network failures in offline / dev mode
    return null;
  }
}

/**
 * Check if the remote build is newer than current running bundle
 */
export function isNewVersionAvailable(remoteData) {
  if (!remoteData) return false;

  const remoteTime = Number(remoteData.buildTime) || 0;
  // If remote build is newer by more than 2 seconds
  if (remoteTime > APP_BUILD_TIME + 2000) {
    return true;
  }

  // If semantic version is higher
  if (remoteData.version && remoteData.version !== APP_VERSION) {
    return true;
  }

  return false;
}

/**
 * Broadcast an update event (Admin can trigger this or system can notify tabs)
 */
export function broadcastSystemUpdate(customDetails = {}) {
  const updatePayload = {
    version: customDetails.version || APP_VERSION,
    buildTime: Date.now(),
    title: customDetails.title || 'ระบบ Audit-OS อัปเดตเวอร์ชันใหม่',
    description: customDetails.description || 'มีการปรับปรุงระบบและฟังก์ชันการทำงานล่าสุดเรียบร้อยแล้ว',
    changeSummary: customDetails.changeSummary || 'กรุณารีเฟรชหน้าเว็บเพื่อใช้งานฟังก์ชันเวอร์ชันล่าสุด',
    triggeredAt: Date.now()
  };

  try {
    localStorage.setItem('audit_manual_update_broadcast', JSON.stringify(updatePayload));
    window.dispatchEvent(new CustomEvent('audit-system-update-detected', { detail: updatePayload }));

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage(updatePayload);
      channel.close();
    }
  } catch (e) {
    console.warn('Broadcast notice error:', e);
  }

  return updatePayload;
}

/**
 * Reloads the application and clears cache storage if possible
 */
export async function reloadAppForUpdate() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (err) {
    console.warn('Cache clear notice:', err);
  }

  // Force clean reload
  window.location.reload();
}
