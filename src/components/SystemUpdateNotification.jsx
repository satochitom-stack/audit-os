import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, Sparkles } from 'lucide-react';
import {
  APP_VERSION,
  DEFAULT_UPDATE_TITLE,
  DEFAULT_UPDATE_DESC,
  fetchRemoteVersion,
  isNewVersionAvailable,
  reloadAppForUpdate,
  subscribeToCloudUpdateBroadcast
} from '../utils/versionCheck';

export default function SystemUpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check for remote update from version.json
  const checkUpdate = useCallback(async () => {
    try {
      const remote = await fetchRemoteVersion();
      if (remote && isNewVersionAvailable(remote)) {
        setUpdateInfo(remote);
        setUpdateAvailable(true);
      }
    } catch (e) {
      // Ignore network errors in offline/dev
    }
  }, []);

  useEffect(() => {
    // 1. Initial check after 2 seconds
    const initialTimer = setTimeout(() => {
      checkUpdate();
    }, 2000);

    // 2. Periodic background check every 60 seconds
    const intervalTimer = setInterval(() => {
      checkUpdate();
    }, 60000);

    // 3. Check when user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkUpdate);

    // 4. Listen to custom broadcast events (from Admin or another tab)
    const handleCustomBroadcast = (e) => {
      const details = e.detail || {};
      setUpdateInfo(details);
      setUpdateAvailable(true);
      setIsDismissed(false);
    };
    window.addEventListener('audit-system-update-detected', handleCustomBroadcast);

    // 5. BroadcastChannel across browser tabs
    let bc;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('audit_os_system_updates');
        bc.onmessage = (event) => {
          if (event.data) {
            setUpdateInfo(event.data);
            setUpdateAvailable(true);
            setIsDismissed(false);
          }
        };
      } catch (err) {}
    }

    // 6. Realtime Cloud Firestore Update Broadcast
    const unsubCloud = subscribeToCloudUpdateBroadcast((cloudData) => {
      if (cloudData) {
        setUpdateInfo(cloudData);
        setUpdateAvailable(true);
        setIsDismissed(false);
      }
    });

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkUpdate);
      window.removeEventListener('audit-system-update-detected', handleCustomBroadcast);
      if (bc) bc.close();
      if (typeof unsubCloud === 'function') unsubCloud();
    };
  }, [checkUpdate]);

  const handleRefresh = async () => {
    setIsUpdating(true);
    await reloadAppForUpdate();
  };

  if (!updateAvailable) return null;

  // When dismissed by user, show discreet floating badge at bottom-right
  if (isDismissed) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <button
          onClick={() => setIsDismissed(false)}
          className="bg-slate-900/95 hover:bg-slate-900 text-slate-200 border border-slate-700/80 rounded-full px-3.5 py-2 text-xs font-semibold shadow-xl shadow-black/40 backdrop-blur-md flex items-center space-x-2 transition-all cursor-pointer group"
          title="คลิกเพื่อเปิดแถบแจ้งเตือนอัปเดตระบบ"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-amber-400">✨</span>
          <span>มีอัปเดตระบบใหม่ (คลิกเพื่อดู)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-xl md:max-w-2xl animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] text-white p-4 sm:px-5 sm:py-4 border border-slate-700/80 shadow-2xl shadow-slate-950/70 backdrop-blur-md">
        {/* Header: Sparkles + Title */}
        <div className="flex items-center space-x-2">
          <span className="text-amber-400 text-sm">✨</span>
          <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {updateInfo?.title || DEFAULT_UPDATE_TITLE}
          </h4>
        </div>

        {/* Content & Action Row (Matching ร้านคำก้อมวัสดุ) */}
        <div className="mt-2 sm:mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Green Live Pulse Dot + Description Text */}
          <div className="flex items-start space-x-2.5 sm:space-x-3 min-w-0 flex-1">
            <span className="relative flex h-2.5 w-2.5 shrink-0 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
              {updateInfo?.description || DEFAULT_UPDATE_DESC}
            </p>
          </div>

          {/* Right: Dismiss & Update Action Buttons */}
          <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center ml-auto">
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer px-1 py-1"
            >
              ละเว้น
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs sm:text-sm px-4 py-1.5 sm:py-2 rounded-lg shadow-md hover:shadow-blue-500/25 transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isUpdating && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isUpdating ? 'กำลังอัปเดต...' : 'อัปเดตทันที'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
