"use client";

import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck,
  ArrowRight, 
  Sparkles, 
  LogIn, 
  Menu, 
  X, 
  Building2, 
  Play,
  Users,
  Eye,
  Monitor,
  Maximize2,
  Minimize2,
  ChevronDown
} from 'lucide-react';

export interface NavLink {
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

export interface Partner {
  name: string;
  label?: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface ResponsiveHeroBannerProps {
  logoText?: string;
  subLogoText?: string;
  backgroundImageUrl?: string;
  navLinks?: NavLink[];
  ctaButtonText?: string;
  onCtaClick?: () => void;
  badgeLabel?: string;
  badgeText?: string;
  title?: string;
  titleLine2?: string;
  description?: string;
  primaryButtonText?: string;
  onPrimaryClick?: () => void;
  secondaryButtonText?: string;
  onSecondaryClick?: () => void;
  onGuestClick?: () => void;
  guestButtonText?: string;
  executiveLeader?: Partner;
  permanentSecretary?: Partner;
  partnersTitle?: string;
  partners?: Partner[];
  subUnitsTitle?: string;
  subUnits?: Partner[];
  session?: any;
}

export const ResponsiveHeroBanner: React.FC<ResponsiveHeroBannerProps> = ({
  logoText = "Audit-OS",
  subLogoText = "ระบบตรวจสอบภายใน อปท.",
  backgroundImageUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80",
  navLinks = [
    { label: "ภาพรวมระบบ", href: "#welcome-features", isActive: true },
    { label: "หน่วยรับตรวจและส่วนราชการ", href: "#departments" },
    { label: "ฟังก์ชันการตรวจสอบ", href: "#modules" }
  ],
  ctaButtonText = "เข้าสู่ระบบ",
  onCtaClick,
  badgeLabel = "✨ Audit-OS Network",
  badgeText = "แพลตฟอร์มสารสนเทศเพื่อการตรวจสอบภายใน อปท.",
  title = "ระบบสารสนเทศเพื่อการตรวจสอบภายใน",
  titleLine2 = "องค์กรปกครองส่วนท้องถิ่น",
  description = "",
  primaryButtonText = "เข้าสู่ระบบ",
  onPrimaryClick,
  secondaryButtonText = "",
  onSecondaryClick,
  onGuestClick,
  guestButtonText = "โหมดผู้เยี่ยมชม",
  executiveLeader,
  permanentSecretary,
  partnersTitle = "โครงสร้างส่วนราชการและหน่วยรับตรวจในระบบ (AUDITEE UNITS)",
  partners = [
    { name: "สำนักปลัด", label: "งานบริหารทั่วไปและนโยบาย" },
    { name: "กองคลัง", label: "งานการเงิน พัสดุ และบัญชี" },
    { name: "กองช่าง", label: "งานโยธาและโครงการก่อสร้าง" },
    { name: "กองการศึกษา", label: "ศูนย์พัฒนาเด็กเล็กและการศึกษา" },
    { name: "กองสวัสดิการสังคม", label: "เบี้ยยังชีพและการพัฒนาชุมชน" }
  ],
  subUnitsTitle = "หน่วยงานภายใต้สังกัด (AFFILIATED AGENCIES)",
  subUnits,
  session
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fitMode, setFitMode] = useState<'fit' | 'compact'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ia_hero_fit_mode') as 'fit' | 'compact') || 'fit';
    }
    return 'fit';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleBrowserFullscreen = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    }
  };

  return (
    <section className={`w-full isolate transition-all duration-300 overflow-hidden relative rounded-3xl sm:rounded-[2.5rem] border border-blue-200/80 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.12)] bg-gradient-to-br from-white via-[#f4f8fe] to-[#eaf2fc] text-slate-800 flex flex-col justify-between ${
      fitMode === 'fit'
        ? 'min-h-[78vh] sm:min-h-[82vh] lg:min-h-[85vh] max-h-[880px]'
        : 'min-h-[520px] sm:min-h-[560px]'
    }`}>
      {/* 1. Bright Architectural Building Photo Background */}
      <img
        src={backgroundImageUrl}
        alt="IA-OS Building Background"
        className="w-full h-full object-cover absolute inset-0 opacity-[0.22] filter blur-[0.5px] scale-105 pointer-events-none select-none"
      />

      {/* Soft warm-white and sky-blue gradient wash for daylight clarity */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-blue-50/70" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-blue-900/5 rounded-3xl sm:rounded-[2.5rem]" />

      {/* 2. Dynamic Electric Royal Blue & Cyan Cutting Light Beam (เส้นแสงโค้งตามรูปวาด ผ่านข้อความพาดหัว) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <svg 
          viewBox="0 0 1440 900" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full object-cover animate-beam-pulse"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Main beam gradient flowing along path from top-left (low slope) to bottom-right (deep plunge) */}
            <linearGradient id="beamGradient" x1="-50" y1="140" x2="1420" y2="940" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
              <stop offset="8%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="35%" stopColor="#0ea5e9" stopOpacity="0.85" />
              <stop offset="58%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="78%" stopColor="#2563eb" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>

            {/* Core laser white-cyan hot gradient */}
            <linearGradient id="coreGradient" x1="-50" y1="140" x2="1420" y2="940" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="15%" stopColor="#bae6fd" stopOpacity="0.5" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="68%" stopColor="#e0f2fe" stopOpacity="0.95" />
              <stop offset="90%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>

            {/* Radiant lens glow around headline text */}
            <radialGradient id="textBacklight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>

            {/* Laser blur filters */}
            <filter id="glowWide" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="36" result="blurWide" />
            </filter>
            <filter id="glowMed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="13" result="blurMed" />
            </filter>
            <filter id="glowSharp" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blurSharp" />
            </filter>
          </defs>

          {/* Soft radiant aura behind text intersection matching design */}
          <circle cx="870" cy="355" r="160" fill="url(#textBacklight)" />
          <circle cx="950" cy="420" r="160" fill="url(#textBacklight)" />
          <ellipse cx="910" cy="385" rx="220" ry="75" fill="url(#textBacklight)" transform="rotate(30 910 385)" />

          {/* Planetary horizon arc matching reference */}
          {/* Layer 1: Wide atmospheric blue dispersion aura */}
          <path 
            d="M -50 130 C 540 90, 1120 390, 1420 930" 
            stroke="#0284c7" 
            strokeWidth="98" 
            strokeOpacity="0.22"
            filter="url(#glowWide)"
            pathLength="1000"
            className="animate-draw-beam"
          />

          {/* Layer 2: Medium vibrant cyan/royal beam body */}
          <path 
            d="M -50 130 C 540 90, 1120 390, 1420 930" 
            stroke="url(#beamGradient)" 
            strokeWidth="26" 
            strokeOpacity="0.85"
            filter="url(#glowMed)"
            pathLength="1000"
            className="animate-draw-beam"
          />

          {/* Layer 3: Neon electric line */}
          <path 
            d="M -50 130 C 540 90, 1120 390, 1420 930" 
            stroke="url(#beamGradient)" 
            strokeWidth="9" 
            strokeOpacity="0.95"
            filter="url(#glowSharp)"
            pathLength="1000"
            className="animate-draw-beam"
          />

          {/* Layer 4: Razor-sharp white-hot laser core */}
          <path 
            d="M -50 130 C 540 90, 1120 390, 1420 930" 
            stroke="url(#coreGradient)" 
            strokeWidth="3.4" 
            strokeOpacity="1"
            pathLength="1000"
            className="animate-draw-beam"
          />
        </svg>
      </div>

      {/* Ambient soft glow bubbles */}
      <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-cyan-300/12 rounded-full blur-3xl pointer-events-none" />

      {/* 3. Integrated Modern Glass Header */}
      <header className="z-20 relative pt-5 sm:pt-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto relative flex items-center justify-between">
          {/* Left: Modern Government Tech Brand */}
          <div className="flex items-center space-x-3 bg-white/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-blue-100/80 shadow-xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-sm sm:text-base tracking-wider text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  {logoText}
                </span>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  {subLogoText}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium">ระบบราชการดิจิทัล 24/7</span>
              </div>
            </div>
          </div>

          {/* Center: Frosted Glass Capsule Navigation Pill - Perfectly Centered on Central Axis */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/90 px-2 py-1.5 border border-slate-200/80 shadow-xs backdrop-blur-md md:absolute md:left-1/2 md:-translate-x-1/2">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                onClick={(e) => {
                  if (link.onClick) {
                    e.preventDefault();
                    link.onClick();
                  }
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  link.isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-2xs'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: Screen Fit & Fullscreen Controls */}
          <div className="hidden md:flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => {
                const next = fitMode === 'fit' ? 'compact' : 'fit';
                setFitMode(next);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('ia_hero_fit_mode', next);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                fitMode === 'fit'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={fitMode === 'fit' ? "กำลังแสดงผลแบบพอดีหน้าจอ (คลิกเพื่อสลับเป็นขนาดกะทัดรัด)" : "คลิกเพื่อปรับขนาดให้พอดีหน้าจอ"}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{fitMode === 'fit' ? 'พอดีหน้าจอ' : 'กะทัดรัด'}</span>
            </button>

            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className="p-1.5 rounded-full text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
              title={isFullscreen ? "ออกจากเต็มจอ" : "แสดงผลเต็มจอภาพ (Fullscreen)"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 border border-slate-200 shadow-xs text-slate-700"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl space-y-2">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (link.onClick) {
                    e.preventDefault();
                    link.onClick();
                  }
                }}
                className="block px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl"
              >
                {link.label}
              </a>
            ))}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-2">
              <span className="text-xs text-slate-500 font-medium">มุมมองหน้าจอ:</span>
              <button
                type="button"
                onClick={() => {
                  const next = fitMode === 'fit' ? 'compact' : 'fit';
                  setFitMode(next);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('ia_hero_fit_mode', next);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{fitMode === 'fit' ? 'โหมดพอดีจอ' : 'โหมดกะทัดรัด'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 4. Hero Content: Welcome at Top, Title in Center, Buttons at Bottom */}
      <div className="z-10 relative flex-1 flex flex-col justify-between items-center pt-6 sm:pt-7 lg:pt-8 pb-5 sm:pb-7 px-6">
        {/* Upper: Frosted Glass Welcome Badge - at original position below header bar */}
        <div className="w-full max-w-4xl mx-auto text-center animate-fade-slide-in-1">
          <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full bg-white/90 px-3.5 sm:px-4 py-1.5 border border-blue-200/80 shadow-xs backdrop-blur-md hover:border-blue-300 transition-all">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-full py-0.5 px-2.5 sm:px-3 shadow-2xs font-['Plus_Jakarta_Sans',sans-serif] tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-cyan-200 animate-pulse" />
              {badgeLabel}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 font-['Plus_Jakarta_Sans','Prompt',sans-serif] tracking-wide">
              {badgeText}
            </span>
          </div>
        </div>

        {/* Middle: Main Title - Centered in middle area for perfect visual balance */}
        <div className="w-full max-w-5xl mx-auto text-center my-auto py-4 sm:py-6 lg:py-8 animate-fade-slide-in-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] xl:text-[2.85rem] font-extrabold text-slate-900 tracking-tight leading-tight md:leading-snug font-['Prompt',sans-serif]">
            <span className="block drop-shadow-sm">
              {title}
            </span>
            <span className="inline-block whitespace-nowrap bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent drop-shadow-sm mt-1.5 sm:mt-2 md:mt-2.5">
              {titleLine2}
            </span>
          </h1>
        </div>

        {/* Lower Section: Action Buttons positioned down below */}
        <div className="w-full max-w-4xl mx-auto text-center pt-4 sm:pt-6 pb-3 sm:pb-4 animate-fade-slide-in-3">
          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-center justify-center">
            {/* Primary Button */}
            <button
              type="button"
              onClick={onPrimaryClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold text-sm sm:text-base px-6 py-2.5 sm:py-3 shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer group"
            >
              <LogIn className="w-4 h-4 text-blue-100 group-hover:scale-110 transition-transform" />
              <span>{session ? "เปิดแดชบอร์ดงานตรวจสอบ" : primaryButtonText}</span>
              <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Guest / Visitor Button */}
            {onGuestClick && (
              <button
                type="button"
                onClick={onGuestClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-sm sm:text-base px-6 py-2.5 sm:py-3 border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer group"
              >
                <Eye className="w-4 h-4 text-slate-500 group-hover:text-blue-600 group-hover:scale-110 transition-colors" />
                <span>{guestButtonText}</span>
              </button>
            )}

            {secondaryButtonText && onSecondaryClick && (
              <button
                type="button"
                onClick={onSecondaryClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 font-semibold text-sm sm:text-base px-6 py-2.5 sm:py-3 border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>{secondaryButtonText}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Sleek Bottom Scroll Indicator */}
      <div className="z-10 relative pb-4 sm:pb-6 text-center select-none">
        <a
          href="#welcome-features"
          className="inline-flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-600 transition-colors group cursor-pointer"
        >
          <span className="opacity-80 group-hover:opacity-100">เลื่อนลงเพื่อสำรวจระบบ</span>
          <ChevronDown className="w-4 h-4 text-blue-500 animate-bounce" />
        </a>
      </div>
    </section>
  );
};

export default ResponsiveHeroBanner;
