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
  onOpenDlaTemplates,
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
  const userTitle = isAdmin
    ? 'ผู้ดูแลระบบส่วนกลาง'
    : (session?.displayName || orgProfile?.auditorName || session?.username || 'ผู้ตรวจสอบภายใน');
  const departmentLabel = isAdmin
    ? 'Super Admin Control'
    : (session?.organization || orgProfile?.name || 'หน่วยตรวจสอบภายใน');

  return (
    <header className="bg-[#faf9f6]/95 dark:bg-[#1a1e28]/95 backdrop-blur-md border-b border-stone-200/90 dark:border-stone-800 sticky top-0 z-30 shadow-xs no-print shrink-0 transition-colors">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* Brand & Organization Title */}
          <div className="flex items-center space-x-3 shrink-0 min-w-0">
            <div className="relative group cursor-pointer shrink-0" onClick={() => setCurrentTab && setCurrentTab('welcome')} title="คลิกเพื่อกลับสู่หน้าแรก (ภาพรวมระบบ)">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-stone-800 via-stone-700 to-amber-700 flex items-center justify-center text-amber-200 shadow-md shadow-stone-900/20 group-hover:scale-105 transition-all border border-amber-600/30">
                <Shield className="w-5 h-5 text-amber-200 drop-shadow-xs" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-stone-900"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-nowrap">
                <span className="font-black text-base sm:text-lg tracking-wider bg-gradient-to-r from-stone-800 via-stone-900 to-amber-800 dark:from-amber-200 dark:to-stone-100 bg-clip-text text-transparent whitespace-nowrap">
                  Audit-OS
                </span>
                <span className="text-stone-300 dark:text-stone-700 font-light select-none">|</span>
                <h1 className="text-xs sm:text-sm md:text-base font-bold text-stone-800 dark:text-stone-100 whitespace-nowrap tracking-tight">
                  ระบบตรวจสอบภายใน อปท.
                </h1>

                {/* Role Capsule Badge */}
                {isAdmin ? (
                  <button
                    onClick={() => setCurrentTab && setCurrentTab('backoffice')}
                    className="hidden sm:inline-flex items-center gap-1 bg-gradient-to-r from-amber-600 to-amber-800 text-amber-50 shadow-xs text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide shrink-0 hover:brightness-110 cursor-pointer border border-amber-500/30"
                    title="คลิกเพื่อสลับไประบบหลังบ้าน Super Admin"
                  >
                    👑 SUPER ADMIN
                  </button>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">
                    🛡️ ผู้ตรวจสอบภายใน
                  </span>
                )}
              </div>

              {/* Subtitle / Organization Location */}
              {isAdmin ? (
                <div className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-400 flex items-center mt-0.5 font-medium truncate">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                  <span className="truncate">
                    ศูนย์ควบคุมระบบส่วนกลาง (Platform Root) • ดูแลระบบ อปท. ทั่วประเทศ
                  </span>
                </div>
              ) : (
                <button
                  onClick={onOpenSettings}
                  className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 flex items-center mt-0.5 transition-colors text-left truncate cursor-pointer hover:text-amber-700 dark:hover:text-amber-300"
                  title="คลิกเพื่อแก้ไขข้อมูลหน่วยงานและผู้ตรวจสอบ"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span className="truncate max-w-[220px] sm:max-w-md font-medium">
                    {orgProfile.name} • {orgProfile.district} {orgProfile.province}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: Fiscal Year, Cloud Status, Portal, Dark Mode, Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Fiscal Year Selector Capsule */}
            <div className="flex items-center bg-stone-100/90 dark:bg-stone-850/90 rounded-xl p-1 border border-stone-200/80 dark:border-stone-700/80 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 ml-1.5 mr-1 shrink-0" />
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mr-1 hidden md:inline">
                ปีงบ:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white dark:bg-stone-900 text-xs font-bold text-stone-800 dark:text-stone-100 rounded-lg px-2 py-1 border-none shadow-2xs focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
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

            {/* DLA Templates Handbook Modal Button */}
            <button
              onClick={onOpenDlaTemplates}
              title="เปิดคลังแม่แบบและแนวทางปฏิบัติงาน สถ. (63 หน้า)"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100/90 hover:bg-amber-200/90 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700/70 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <span className="text-sm">🏛️</span>
              <span className="hidden sm:inline">คู่มือ สถ.</span>
            </button>

            {/* Quick Super Admin Backoffice / Workbench Switcher */}
            {isAdmin && (
              <button
                onClick={() => setCurrentTab && setCurrentTab(currentTab === 'backoffice' ? 'audit-risk' : 'backoffice')}
                title={currentTab === 'backoffice' ? 'สลับไปยังพื้นที่ปฏิบัติงานตรวจสอบ' : 'สลับไปยังระบบหลังบ้าน Super Admin'}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 ${
                  currentTab === 'backoffice'
                    ? 'bg-stone-800 hover:bg-stone-900 text-amber-100 border border-amber-600/30 shadow-stone-900/20'
                    : 'bg-gradient-to-r from-amber-600 via-amber-700 to-stone-800 hover:from-amber-500 hover:to-stone-700 text-amber-50 shadow-amber-950/20'
                }`}
              >
                {currentTab === 'backoffice' ? (
                  <Shield className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Settings className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{currentTab === 'backoffice' ? 'สลับไปหน้าตรวจ' : 'หลังบ้าน Admin'}</span>
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
              className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-amber-300 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* User Account Capsule Menu */}
            <div className="relative pl-1 border-l border-stone-200 dark:border-stone-800" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center space-x-2 px-2 py-1 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer border border-transparent hover:border-stone-200/80 dark:border-stone-700"
              >
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ${
                      isAdmin
                        ? 'bg-gradient-to-br from-amber-600 to-stone-800 text-amber-200 border border-amber-500/30'
                        : 'bg-gradient-to-br from-stone-800 to-amber-700 text-amber-200 border border-amber-600/30'
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
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate">
                    {userTitle}
                  </div>
                  <div className="text-[10px] text-stone-400 dark:text-stone-500 truncate">
                    {departmentLabel}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl overflow-hidden z-40 text-xs">
                  <div className="px-3.5 py-2.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40">
                    <div className="font-bold text-stone-800 dark:text-stone-200 truncate">{userTitle}</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{departmentLabel}</div>
                    <div className="text-[10px] text-amber-800 dark:text-amber-400 mt-0.5 font-semibold">
                      {isAdmin ? 'สิทธิ์ผู้ดูแลระบบสูงสุด (Super Admin)' : `ชื่อผู้ใช้: @${session?.username} • สมาชิกผู้ตรวจสอบภายใน`}
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (setCurrentTab) setCurrentTab('backoffice');
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/80 cursor-pointer font-bold border-b border-stone-100 dark:border-stone-800"
                    >
                      <div className="flex items-center space-x-2">
                        <Settings className="w-3.5 h-3.5 text-amber-700" />
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
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer font-medium border-b border-stone-100 dark:border-stone-800"
                  >
                    <span>🏠 หน้าแรก (ภาพรวมระบบ)</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (setCurrentTab) setCurrentTab('audit-risk');
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-amber-800 dark:text-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 cursor-pointer font-semibold border-b border-stone-100 dark:border-stone-800"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>🛡️ พื้นที่ทำงานตรวจสอบ 12 ขั้นตอน</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (setCurrentTab) setCurrentTab('central-hub');
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer font-medium border-b border-stone-100 dark:border-stone-800"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>📚 คลังเอกสารกลาง & ระเบียบปฏิบัติ</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenDlaTemplates) onOpenDlaTemplates();
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-amber-900 dark:text-amber-200 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/80 cursor-pointer font-bold border-b border-stone-100 dark:border-stone-800"
                  >
                    <span>🏛️ คลังคู่มือ & แม่แบบ สถ. 63 หน้า</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer font-medium"
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
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer font-medium"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>เปลี่ยนรหัสผ่านเข้าสู่ระบบ</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer font-semibold border-t border-stone-100 dark:border-stone-800"
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
