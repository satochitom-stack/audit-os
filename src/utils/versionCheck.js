/**
 * versionCheck.js
 * Utility to detect new application builds and broadcast updates across tabs & Cloud.
 */

import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.5.4';
export const APP_BUILD_TIME = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? Number(__BUILD_TIMESTAMP__) : Date.now();

const BROADCAST_CHANNEL_NAME = 'audit_os_system_updates';

export const DEFAULT_UPDATE_TITLE = 'ระบบมีการอัปเดตเวอร์ชันใหม่!';
export const DEFAULT_UPDATE_DESC = 'ทางทีมงานได้ทำการอัปเดตและปรับปรุงฟีเจอร์ใหม่เรียบร้อยแล้ว ข้อมูลทั้งหมดของคุณปลอดภัยในระบบ Cloud สามารถคลิกปุ่มด้านขวาเพื่อเริ่มใช้งานเวอร์ชันใหม่ได้ทันที';

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
    return null;
  }
}

/**
 * Check if the remote build is newer than current running bundle
 */
export function isNewVersionAvailable(remoteData) {
  if (!remoteData) return false;

  const remoteTime = Number(remoteData.buildTime) || 0;
  if (remoteTime > APP_BUILD_TIME + 2000) {
    return true;
  }

  if (remoteData.version && remoteData.version !== APP_VERSION) {
    return true;
  }

  return false;
}

/**
 * Broadcast an update event across browser tabs AND Cloud Firestore
 */
export async function broadcastSystemUpdate(customDetails = {}) {
  const updatePayload = {
    version: customDetails.version || APP_VERSION,
    buildTime: Date.now(),
    title: customDetails.title || DEFAULT_UPDATE_TITLE,
    description: customDetails.description || DEFAULT_UPDATE_DESC,
    changeSummary: customDetails.changeSummary || '',
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

    // Broadcast via Cloud Firestore to all connected devices
    if (db) {
      const docRef = doc(db, 'system_settings', 'version_update');
      await setDoc(docRef, updatePayload, { merge: true });
    }
  } catch (e) {
    console.warn('Broadcast notice error:', e);
  }

  return updatePayload;
}

/**
 * Subscribe to Cloud Firestore update broadcasts
 */
export function subscribeToCloudUpdateBroadcast(callback) {
  if (!db) return () => {};
  try {
    const docRef = doc(db, 'system_settings', 'version_update');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.triggeredAt && data.triggeredAt > APP_BUILD_TIME) {
            callback(data);
          }
        }
      },
      (err) => {
        console.warn('Cloud update listener error:', err.message);
      }
    );
  } catch (err) {
    return () => {};
  }
}

/**
 * Reloads the application and clears cache storage
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
