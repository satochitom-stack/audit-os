import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Calendar,
  Building2,
  Sun,
  Moon,
  KeyRound,
  LogOut,
  ChevronDown,
  Settings,
  Plus,
  UserCheck,
  Users,
  ShieldCheck,
  Sparkles,
  LogIn,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { cloudSyncService } from '../services/cloudSyncService';

export default function Header({
  orgProfile,
  selectedYear,
  setSelectedYear,
  fiscalYears = ['2569', '2570'],
  darkMode,
  onToggleDarkMode,
  session,
  onLogout,
  onChangePassword,
  onOpenSettings,
  onOpenUsersManagement,
  onOpenWelcome,
  onOpenCloudSync,
  onOpenOnboarding,
  pendingCount = 0,
  currentTab = 'audit-risk',
  setCurrentTab
}) {
  const [syncStatus, setSyncStatus] = useState(() => cloudSyncService.getSyncStatus());

  useEffect(() => {
    const unsub = cloudSyncService.onSyncStatusChange((st) => setSyncStatus(st));
    return unsub;
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = session?.role === 'admin';
  const userTitle = session?.displayName || (isAdmin ? 'ผู้ดูแลระบบส่วนกลาง (Admin)' : (orgProfile?.auditorName || session?.username));
  const departmentLabel = isAdmin ? 'Super Admin Backoffice' : (session?.organization || orgProfile?.name || 'หน่วยตรวจสอบภายใน');

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-xs no-print shrink-0 transition-colors">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* Brand & Organization Title */}
          <div className="flex items-center space-x-3 shrink-0 min-w-0">
            <div className="relative group cursor-pointer shrink-0" onClick={() => setCurrentTab && setCurrentTab('welcome')} title="คลิกเพื่อกลับสู่หน้าแรก (ภาพรวมระบบ)">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25 group-hover:scale-105 transition-all">
                <Shield className="w-5 h-5 text-white drop-shadow-xs" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-nowrap">
                <span className="font-black text-base sm:text-lg tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                  Audit-OS
                </span>
                <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap tracking-tight">
                  ระบบตรวจสอบภายใน อปท.
                </h1>

                {/* Role Capsule Badge */}
                {isAdmin ? (
                  <button
                    onClick={() => setCurrentTab && setCurrentTab('backoffice')}
                    className="hidden sm:inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide shrink-0 hover:brightness-110 cursor-pointer"
                    title="คลิกเพื่อสลับไประบบหลังบ้าน Super Admin"
                  >
                    👑 SUPER ADMIN
                  </button>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">
                    🛡️ ผู้ตรวจสอบภายใน
                  </span>
                )}
              </div>

              {/* Subtitle / Organization Location */}
              <button
                onClick={isAdmin ? onOpenSettings : undefined}
                className={`text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5 transition-colors text-left truncate ${
                  isAdmin ? 'hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer' : 'cursor-default'
                }`}
                title={isAdmin ? 'คลิกเพื่อแก้ไขข้อมูลหน่วยงานและผู้ตรวจสอบ' : ''}
              >
                <Building2 className="w-3.5 h-3.5 mr-1 text-blue-500 dark:text-cyan-400 shrink-0" />
                <span className="truncate max-w-[220px] sm:max-w-md font-medium">
                  {orgProfile.name} • {orgProfile.district} {orgProfile.province}
                </span>
                {isAdmin && (
                  <span className="hidden lg:inline text-[10px] ml-1.5 text-blue-500 dark:text-cyan-400 opacity-70 hover:opacity-100">
                    (คลิกแก้ไข)
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Controls: Fiscal Year, Cloud Status, Portal, Dark Mode, Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Fiscal Year Selector Capsule */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 ml-1.5 mr-1 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 hidden md:inline">
                ปีงบ:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 border-none shadow-2xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {fiscalYears.map((yr) => (
                  <option key={yr} value={yr}>
                    พ.ศ. {yr}
                  </option>
                ))}
              </select>
              {isAdmin && (
                <button
                  onClick={onOpenSettings}
                  title="เพิ่มหรือจัดการปีงบประมาณ"
                  className="ml-1 p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Cloud Realtime Status Badge Button */}
            <button
              onClick={onOpenCloudSync}
              title={
                syncStatus.status === 'connected'
                  ? 'Cloud Sync: เชื่อมต่อสดเรียลไทม์ (Supabase) คลิกเพื่อจัดการ'
                  : syncStatus.status === 'syncing'
                  ? 'Cloud Sync: กำลังซิงค์ข้อมูล...'
                  : 'Cloud Sync: ออฟไลน์ คลิกเพื่อเปิดระบบซิงค์ Supabase'
              }
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all text-xs font-bold cursor-pointer shrink-0 shadow-2xs active:scale-95 ${
                syncStatus.status === 'connected'
                  ? 'bg-emerald-50/90 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                  : syncStatus.status === 'syncing'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {syncStatus.status === 'connected' ? (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Cloud Realtime</span>
                </>
              ) : syncStatus.status === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                  <span className="hidden sm:inline">กำลังซิงค์...</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="hidden sm:inline">Cloud Sync</span>
                </>
              )}
            </button>

            {/* Quick Super Admin Backoffice / Workbench Switcher */}
            {isAdmin && (
              <button
                onClick={() => setCurrentTab && setCurrentTab(currentTab === 'backoffice' ? 'audit-risk' : 'backoffice')}
                title={currentTab === 'backoffice' ? 'สลับไปยังพื้นที่ปฏิบัติงานตรวจสอบ' : 'สลับไปยังระบบหลังบ้าน Super Admin'}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 ${
                  currentTab === 'backoffice'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/20'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{currentTab === 'backoffice' ? '🛡️ สลับไปหน้าตรวจ' : '⚙️ หลังบ้าน Admin'}</span>
                {pendingCount > 0 && currentTab !== 'backoffice' && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-amber-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Account Capsule Menu */}
            <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center space-x-2 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200/80 dark:border-slate-700"
              >
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ${
                      isAdmin
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                    }`}
                  >
                    {isAdmin ? '👑' : '🛡️'}
                  </div>
                  {isAdmin && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-black text-white items-center justify-center">
                        {pendingCount}
                      </span>
                    </span>
                  )}
                </div>
                <div className="hidden lg:block text-left max-w-[140px]">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {userTitle}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {departmentLabel}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-40 text-xs">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{userTitle}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{departmentLabel}</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                      {isAdmin ? 'สิทธิ์ผู้ดูแลระบบสูงสุด (Super Admin)' : `ชื่อผู้ใช้: @${session?.username} • สมาชิกผู้ตรวจสอบภายใน`}
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (setCurrentTab) setCurrentTab('backoffice');
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 cursor-pointer font-bold border-b border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center space-x-2">
                        <Settings className="w-3.5 h-3.5" />
                        <span>⚙️ 12. ระบบหลังบ้าน Super Admin</span>
                      </div>
                      {pendingCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                          {pendingCount} คำขอใหม่
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (setCurrentTab) setCurrentTab('welcome');
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-medium border-b border-slate-100 dark:border-slate-800"
                  >
                    <span>🏠 หน้าแรก (ภาพรวมระบบ)</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (setCurrentTab) setCurrentTab('audit-risk');
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer font-semibold border-b border-slate-100 dark:border-slate-800"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>🛡️ พื้นที่ทำงานตรวจสอบ 12 ขั้นตอน</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (setCurrentTab) setCurrentTab('central-hub');
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-medium border-b border-slate-100 dark:border-slate-800"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>📚 คลังเอกสารกลาง & ระเบียบปฏิบัติ</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-medium"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>ตั้งค่าข้อมูล อปท. และผู้ตรวจ</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onChangePassword();
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-medium"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>เปลี่ยนรหัสผ่านเข้าสู่ระบบ</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer font-semibold border-t border-slate-100 dark:border-slate-800"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ / สลับบัญชี</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
