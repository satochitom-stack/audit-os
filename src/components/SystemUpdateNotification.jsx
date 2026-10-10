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

  // When dismissed by user, show discreet floating badge at bottom-right in Audit-OS theme
  if (isDismissed) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <button
          onClick={() => setIsDismissed(false)}
          className="bg-stone-900/95 hover:bg-stone-900 text-amber-300 border border-amber-500/40 rounded-full px-3.5 py-2 text-xs font-bold shadow-xl shadow-amber-950/30 backdrop-blur-md flex items-center space-x-2 transition-all cursor-pointer group hover:border-amber-400"
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950 text-white p-4 sm:px-5 sm:py-4 border border-amber-500/40 shadow-2xl shadow-amber-950/50 backdrop-blur-md ring-1 ring-amber-400/20">
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header: Sparkles + Title + Version Tag */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 text-sm">✨</span>
            <h4 className="text-sm sm:text-base font-extrabold text-stone-100 tracking-tight">
              {updateInfo?.title || DEFAULT_UPDATE_TITLE}
            </h4>
          </div>
          <span className="text-[10px] sm:text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
            v{updateInfo?.version || APP_VERSION}
          </span>
        </div>

        {/* Content & Action Row */}
        <div className="relative mt-2 sm:mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Green Live Pulse Dot + Description Text */}
          <div className="flex items-start space-x-2.5 sm:space-x-3 min-w-0 flex-1">
            <span className="relative flex h-2.5 w-2.5 shrink-0 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-xs sm:text-[13px] text-stone-200 leading-relaxed font-normal">
              {updateInfo?.description || DEFAULT_UPDATE_DESC}
            </p>
          </div>

          {/* Right: Dismiss & Update Action Buttons (Audit-OS Signature Amber-Gold Theme) */}
          <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center ml-auto">
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-stone-400 hover:text-amber-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer px-2 py-1"
            >
              ละเว้น
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isUpdating}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-stone-950 font-black text-xs sm:text-sm px-4 py-1.5 sm:py-2 rounded-xl shadow-md shadow-amber-600/30 hover:shadow-amber-500/50 transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isUpdating ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-stone-950" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-stone-950" />
              )}
              <span>{isUpdating ? 'กำลังอัปเดต...' : 'อัปเดตทันที'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
