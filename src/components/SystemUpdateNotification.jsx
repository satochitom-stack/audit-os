import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RotateCw, X, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import {
  APP_VERSION,
  fetchRemoteVersion,
  isNewVersionAvailable,
  reloadAppForUpdate
} from '../utils/versionCheck';

export default function SystemUpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check for remote update
  const checkUpdate = useCallback(async () => {
    try {
      const remote = await fetchRemoteVersion();
      if (remote && isNewVersionAvailable(remote)) {
        setUpdateInfo(remote);
        setUpdateAvailable(true);
      }
    } catch (e) {
      // Ignore network errors
    }
  }, []);

  useEffect(() => {
    // 1. Initial check after 3 seconds
    const initialTimer = setTimeout(() => {
      checkUpdate();
    }, 3000);

    // 2. Periodic background polling every 60 seconds
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
      } catch (err) {
        // BroadcastChannel unsupported or blocked
      }
    }

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkUpdate);
      window.removeEventListener('audit-system-update-detected', handleCustomBroadcast);
      if (bc) bc.close();
    };
  }, [checkUpdate]);

  const handleRefresh = async () => {
    setIsUpdating(true);
    await reloadAppForUpdate();
  };

  if (!updateAvailable) return null;

  // If dismissed by user, show an elegant discreet floating badge in bottom right
  if (isDismissed) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <button
          onClick={() => setIsDismissed(false)}
          className="bg-stone-900/90 dark:bg-stone-950/90 hover:bg-stone-900 text-amber-300 border border-amber-500/40 rounded-full px-3.5 py-2 text-xs font-bold shadow-xl shadow-amber-950/20 backdrop-blur-md flex items-center space-x-2 transition-all cursor-pointer hover:border-amber-400 group"
          title="คลิกเพื่อดูการแจ้งเตือนอัปเดตระบบ"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>มีอัปเดตระบบใหม่ (v{updateInfo?.version || APP_VERSION})</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950 text-white p-4 sm:p-5 border border-amber-500/40 shadow-2xl shadow-amber-950/40 backdrop-blur-md ring-1 ring-amber-400/20">
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left Info */}
          <div className="flex items-start space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-stone-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-600/30 mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mr-0.5" />
                  <span>อัปเดตระบบเวอร์ชันใหม่ v{updateInfo?.version || APP_VERSION}</span>
                </span>
                <span className="text-[11px] text-stone-400">
                  {updateInfo?.releaseDate || 'เวอร์ชันล่าสุด'}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-extrabold text-stone-100 tracking-tight leading-snug">
                {updateInfo?.title || 'ระบบ Audit-OS อัปเดตเวอร์ชันใหม่พร้อมใช้งาน'}
              </h4>

              <p className="text-xs text-stone-300 leading-relaxed line-clamp-2">
                {updateInfo?.description || 'มีการปรับปรุงประสิทธิภาพและความเสถียรของระบบเรียบร้อยแล้ว'}
                {updateInfo?.changeSummary && (
                  <span className="text-amber-200/90 font-medium block sm:inline sm:ml-1">
                    • {updateInfo.changeSummary}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800 justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isUpdating}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-600/30 hover:shadow-amber-500/50 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RotateCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'กำลังโหลดเวอร์ชันล่าสุด...' : 'รีเฟรชเพื่ออัปเดตทันที'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-xl transition-colors cursor-pointer"
              title="ไว้ภายหลัง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
