import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  LogIn,
  Sparkles,
  Building,
  CheckCircle2,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  FileText,
  ShieldAlert,
  ClipboardCheck,
  FileSpreadsheet,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Users,
  ChevronDown,
  UserPlus,
  Check,
  Briefcase,
  Mail,
  Info,
  GitFork,
  LayoutGrid
} from 'lucide-react';
import { ResponsiveHeroBanner } from './ui/responsive-hero-banner';
import OrgChartStructure from './OrgChartStructure';
import {
  verifyLogin,
  startSession,
  loginAsGuest,
  getUsers,
  getLastUsername,
  setLastUsername,
  getDepartments,
  registerUser,
  ENTERPRISE_ROLES
} from '../utils/auth';
import { loginWithFirebase } from '../services/firebaseAuthService';

export default function WelcomeView({
  session,
  orgProfile,
  onOpenOnboarding,
  onLogin,
  onGuestLogin,
  onEnterDashboard
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState(() => getLastUsername());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const passwordInputRef = useRef(null);
  const loginSectionRef = useRef(null);
  const [structureViewMode, setStructureViewMode] = useState('chart');

  // Registration modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('กองคลัง');
  const [regPosition, setRegPosition] = useState('');
  const [regRole, setRegRole] = useState('staff');
  const [regEmail, setRegEmail] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regBusy, setRegBusy] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [departments, setDepartments] = useState(() => getDepartments());
  const [availableUsers, setAvailableUsers] = useState(() => getUsers());

  useEffect(() => {
    const handleSync = () => {
      setDepartments(getDepartments());
      setAvailableUsers(getUsers());
    };
    window.addEventListener('ia-departments-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ia-departments-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const DEPARTMENT_ORDER = ['สำนักปลัด', 'กองคลัง', 'กองช่าง', 'กองการศึกษา', 'กองสวัสดิการสังคม'];

  // Filter out internal audit, executive titles, and CDCs to get main auditee departments (5 กองหลัก)
  const auditeeDepartments = departments
    .filter(
      (d) => d !== 'หน่วยตรวจสอบภายใน' && 
             d !== 'ผู้บริหาร' && 
             !d.includes('ปลัด') && 
             !d.startsWith('ศพด.')
    )
    .sort((a, b) => {
      const idxA = DEPARTMENT_ORDER.indexOf(a);
      const idxB = DEPARTMENT_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, 'th');
    });

  // Child Development Centers
  const childDevelopmentCenters = ['ศพด.วัดเจริญทัศน์', 'ศพด.บ้านฝางเทิง'];

  const KNOWN_LABELS = {
    'สำนักปลัด': 'งานบริหารทั่วไป นโยบาย และงานสาธารณสุข',
    'กองคลัง': 'งานการเงิน พัสดุ และบัญชี',
    'กองช่าง': 'งานโยธาและโครงการก่อสร้าง',
    'กองการศึกษา': 'ศูนย์พัฒนาเด็กเล็กและการศึกษา',
    'กองสวัสดิการสังคม': 'เบี้ยยังชีพและการพัฒนาชุมชน',
    'ศพด.วัดเจริญทัศน์': 'ศูนย์พัฒนาเด็กเล็กวัดเจริญทัศน์',
    'ศพด.บ้านฝางเทิง': 'ศูนย์พัฒนาเด็กเล็กบ้านฝางเทิง',
    'ศพด.': 'ศูนย์พัฒนาเด็กเล็ก',
    'ศูนย์พัฒนาเด็กเล็ก': 'ศูนย์พัฒนาเด็กเล็ก'
  };

  const executiveLeaderPartner = {
    name: 'ผู้บริหาร',
    label: orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น',
    onClick: () => {
      const user = availableUsers.find(
        (u) => u.username === 'mayor' || (u.role === 'executive' && u.username !== 'palat') || u.displayName === 'ผู้บริหาร'
      );
      if (user) {
        handleQuickSelect(user);
      } else {
        setUsername('mayor');
        setPassword('');
        setError('');
        setShowLoginModal(true);
      }
    }
  };

  const permanentSecretaryPartner = {
    name: orgProfile?.palatPosition || 'ปลัดองค์กรปกครองส่วนท้องถิ่น',
    label: 'การบริหารราชการและกำกับดูแลภาพรวม',
    onClick: () => {
      const user = availableUsers.find(
        (u) => u.username === 'palat' || (u.username !== 'office' && !u.displayName?.includes('สำนัก') && (u.displayName?.includes('ปลัด') || u.position?.includes('ปลัด')))
      );
      if (user) {
        handleQuickSelect(user);
      } else {
        setUsername('palat');
        setPassword('');
        setError('');
        setShowLoginModal(true);
      }
    }
  };

  const heroPartners = auditeeDepartments.map((deptName) => {
    const matchedUser = availableUsers.find(
      (u) => (u.department && (u.department === deptName || u.department.includes(deptName))) ||
             (u.displayName && (u.displayName === deptName || u.displayName.includes(deptName)))
    );
    return {
      name: deptName,
      label: KNOWN_LABELS[deptName] || matchedUser?.position || 'งานในภารกิจและหน่วยรับตรวจ',
      onClick: () => {
        if (matchedUser) {
          handleQuickSelect(matchedUser);
        } else {
          scrollToLogin();
        }
      }
    };
  });

  const heroSubUnits = childDevelopmentCenters.map((cdcName) => {
    const matchedUser = availableUsers.find(
      (u) => (u.department && (u.department === cdcName || u.department.includes(cdcName))) ||
             (u.displayName && (u.displayName === cdcName || u.displayName.includes(cdcName))) ||
             (cdcName.includes('เจริญทัศน์') && u.username === 'cdc_charoen') ||
             (cdcName.includes('ฝางเทิง') && u.username === 'cdc_fangthoeng')
    );
    return {
      name: cdcName,
      label: KNOWN_LABELS[cdcName] || matchedUser?.position || 'สถานศึกษา/ศูนย์พัฒนาเด็กเล็กในสังกัด',
      icon: '🏫',
      onClick: () => {
        if (matchedUser) {
          handleQuickSelect(matchedUser);
        } else {
          scrollToLogin();
        }
      }
    };
  });

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setBusy(true);
    try {
      if (username.includes('@')) {
        // Firebase Cloud Authentication
        const fbRes = await loginWithFirebase(username, password);
        const fbSession = {
          uid: fbRes.user.uid,
          username: fbRes.profile?.email || username,
          displayName: fbRes.profile?.displayName || fbRes.user.displayName || 'ผู้ใช้งาน',
          role: fbRes.profile?.role || 'admin',
          orgId: fbRes.profile?.orgId || fbRes.organization?.id || '',
          department: fbRes.profile?.department || 'หน่วยตรวจสอบภายใน',
          position: fbRes.profile?.position || '',
          permissions: fbRes.profile?.permissions || ['dashboard', 'planning', 'execution', 'reporting', 'audit-risk', 'risk-management'],
          isFirebase: true
        };
        setShowLoginModal(false);
        onLogin(fbSession);
        return;
      }

      const user = await verifyLogin(username, password);
      if (!user) {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setBusy(false);
        return;
      }
      setLastUsername(user.username);
      const newSession = startSession(user, remember);
      setShowLoginModal(false);
      onLogin(newSession);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      setBusy(false);
    }
  };

  const handleQuickSelect = (u) => {
    setUsername(u.username);
    setPassword('');
    setError('');
    setLastUsername(u.username);
    setShowLoginModal(true);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 150);
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regDisplayName.trim() || !regUsername.trim() || !regPassword) {
      setRegError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setRegBusy(true);
    try {
      await registerUser({
        displayName: regDisplayName.trim(),
        username: regUsername.trim(),
        password: regPassword,
        department: regDepartment,
        position: regPosition.trim(),
        role: regRole,
        email: regEmail.trim()
      });

      setRegSuccess(`ส่งคำขอลงทะเบียนของ "${regDisplayName}" เรียบร้อยแล้ว! คำขอจะถูกส่งไปยังผู้ดูแลระบบ (ADMIN) เพื่ออนุมัติสิทธิ์เข้าใช้งาน`);
      setRegDisplayName('');
      setRegUsername('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegPosition('');
      setRegEmail('');
    } catch (err) {
      setRegError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setRegBusy(false);
    }
  };

  const handleEnterGuest = () => {
    setShowLoginModal(false);
    if (onGuestLogin) {
      onGuestLogin();
    } else {
      const guestSession = loginAsGuest();
      onLogin(guestSession);
    }
  };

  const scrollToLogin = () => {
    if (session) {
      onEnterDashboard();
      return;
    }
    setShowLoginModal(true);
  };

  const scrollToExplore = () => {
    const el = document.getElementById('welcome-features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7fb] via-[#f8fafc] to-[#edf2f7] text-slate-800 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Soft warm ambient background orbs */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-40 w-[500px] h-[500px] bg-sky-300/15 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Floating Glass Island Header (Appears smoothly when scrolling down) */}
      <div className={`fixed top-3 sm:top-4 inset-x-0 z-50 px-3 sm:px-6 transition-all duration-300 ${
        scrolled ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-6 pointer-events-none'
      }`}>
        <header className="max-w-6xl mx-auto pointer-events-auto rounded-2xl md:rounded-full bg-white/90 backdrop-blur-xl border border-blue-100/80 shadow-[0_8px_30px_rgba(30,58,138,0.12)] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all relative overflow-hidden ring-1 ring-blue-900/5">
          {/* Subtle blue shimmer line */}
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent pointer-events-none" />
          <div className="absolute -bottom-6 left-1/4 w-32 h-12 bg-blue-500/10 blur-xl pointer-events-none" />

          {/* Brand & System Status */}
          <div className="flex items-center space-x-3 sm:space-x-3.5">
            <div
              className="relative group cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25 group-hover:shadow-blue-500/40 transition-all border border-blue-400/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>

            <div>
              <div className="text-sm sm:text-base font-black tracking-wider text-slate-900 flex items-center space-x-2">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-xs">
                  Audit-OS
                </span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200/80 tracking-wide truncate max-w-[150px] sm:max-w-xs">
                  {orgProfile?.name || 'อปท. เครือข่าย'}
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>ระบบสารสนเทศเพื่อการตรวจสอบภายใน อปท. (Multi-Tenant)</span>
              </div>
            </div>
          </div>

          {/* Navigation Pill Links */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/70 text-xs font-semibold text-slate-600 backdrop-blur-md">
            <button
              type="button"
              onClick={scrollToExplore}
              className="px-4 py-1.5 rounded-full hover:text-blue-700 hover:bg-white hover:shadow-xs border border-transparent transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ภาพรวมระบบ</span>
            </button>
            <a
              href="#departments"
              className="px-4 py-1.5 rounded-full hover:text-blue-700 hover:bg-white hover:shadow-xs border border-transparent transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>หน่วยรับตรวจ {auditeeDepartments.length} หน่วย</span>
            </a>
            <a
              href="#modules"
              className="px-4 py-1.5 rounded-full hover:text-blue-700 hover:bg-white hover:shadow-xs border border-transparent transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ฟังก์ชันการตรวจสอบ</span>
            </a>
          </nav>

          {/* Action / Login CTA Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {session ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="relative group p-[1px] rounded-full overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <div className="px-4 sm:px-5 py-2 rounded-full bg-white group-hover:bg-transparent text-slate-800 group-hover:text-white font-bold text-xs flex items-center space-x-2 transition-all">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">ไปยังแดชบอร์ดงาน</span>
                  <span className="text-blue-700 group-hover:text-white">({session.displayName || session.username})</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {onOpenOnboarding && (
                  <button
                    type="button"
                    onClick={onOpenOnboarding}
                    className="hidden sm:flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                    title="ตั้งค่าและลงทะเบียน อปท. ใหม่ (ทดลองใช้งานฟรี 30 วัน)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>ลงทะเบียน อปท. (Free Trial)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEnterGuest}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                  title="เข้าชมแดชบอร์ดในฐานะผู้เยี่ยมชม (ไม่ต้องใช้รหัสผ่าน)"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>ผู้เยี่ยมชม (Guest)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="relative group p-[1px] rounded-full overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 transition-all cursor-pointer"
                >
                  <div className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center space-x-2 transition-all">
                    <LogIn className="w-3.5 h-3.5 text-blue-100" />
                    <span>เข้าสู่ระบบ (Sign In)</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* 2. Responsive Hero Banner (Option B: Royal Blue & Cyber Cyan Cosmic Beam) */}
      <section className="relative w-full pt-2 sm:pt-3 pb-4 sm:pb-6 px-2.5 sm:px-4 lg:px-6 max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
        <ResponsiveHeroBanner
          session={session}
          onPrimaryClick={scrollToLogin}
          onCtaClick={scrollToLogin}
          onGuestClick={handleEnterGuest}
          primaryButtonText="เข้าสู่ระบบ"
          guestButtonText="โหมดผู้เยี่ยมชม"
          executiveLeader={executiveLeaderPartner}
          permanentSecretary={permanentSecretaryPartner}
          partners={heroPartners}
          subUnits={heroSubUnits}
          subUnitsTitle="หน่วยงานภายใต้สังกัด (AFFILIATED AGENCIES)"
          badgeLabel="✨ Welcome"
          badgeText="Next-Gen Digital Governance & Internal Audit Platform"
          description=""
          partnersTitle={`โครงสร้าง ${auditeeDepartments.length} หน่วยรับตรวจที่เชื่อมโยงในระบบ (CONNECTED DEPARTMENTS)`}
          navLinks={[
            { label: "ภาพรวมระบบ", href: "#welcome-features", isActive: true },
            { label: "หน่วยรับตรวจและหน่วยงานในสังกัด", href: "#departments" },
            { label: "ฟังก์ชันการตรวจสอบ", href: "#modules" }
          ]}
        />
      </section>

      {/* 3. Quick Stats & System Pillars */}
      <section id="welcome-features" className="py-20 px-4 md:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold text-blue-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Digital Internal Audit Transformation</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900">
            ยกระดับงานตรวจสอบภายใน {orgProfile?.name || 'อปท. เครือข่าย'} สู่มาตรฐานสากล
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            ผสานการประเมินความเสี่ยงตามหลักสากล SOFCK Matrix, แผนการตรวจสอบประจำปี, แนวการตรวจด้วย AI ตามหนังสือ ว 614 และการประเมินการควบคุมภายใน ปอ.1 - ปค.5 ในที่เดียว
          </p>
        </div>

        {/* 4. Departments Grid & Flowchart (หน่วยรับตรวจและโครงสร้างฝ่ายบริหาร) */}
        <div id="departments" className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span>โครงสร้างการแบ่งส่วนราชการและหน่วยรับตรวจ ({departments.length} สำนัก/กอง/หน่วย)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                แผนภูมิสายการบังคับบัญชา ส่วนราชการ และหน่วยงานภายใต้สังกัด {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
              </p>
            </div>
            
            {/* View Mode Toggle: Org Chart Flowchart vs Card Grid */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setStructureViewMode('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  structureViewMode === 'chart'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitFork className="w-3.5 h-3.5 text-emerald-600" />
                <span>แผนภูมิผังองค์กร (Org Chart)</span>
              </button>
              <button
                type="button"
                onClick={() => setStructureViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  structureViewMode === 'grid'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                <span>มุมมองการ์ด (Card Grid)</span>
              </button>
            </div>
          </div>

          {structureViewMode === 'chart' ? (
            <OrgChartStructure
              availableUsers={availableUsers}
              onSelectUser={handleQuickSelect}
              onSelectDepartment={(dept) => {
                const user = availableUsers.find(u => u.department === dept);
                if (user) handleQuickSelect(user);
                else setShowLoginModal(true);
              }}
            />
          ) : (
            <>
              {/* Executive Leadership Cards (ระดับนโยบายและบริหารงานประจำ) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                {/* 1. ผู้บริหาร */}
                <div
                  onClick={() => {
                    const user = availableUsers.find(
                      (u) => u.username === 'mayor' || (u.role === 'executive' && u.username !== 'palat') || u.displayName === 'ผู้บริหาร'
                    );
                    if (user) handleQuickSelect(user);
                    else {
                      setUsername('mayor');
                      setShowLoginModal(true);
                    }
                  }}
                  className="p-5 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold shadow-2xs group-hover:scale-105 transition-transform">
                        👑
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-100 text-amber-800 border border-amber-200">
                        EXECUTIVE: ฝ่ายบริหาร
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-900 group-hover:text-amber-800 transition-colors flex items-center space-x-1.5">
                        <span>ผู้บริหาร ({orgProfile?.approverPosition || 'นายก อปท.'})</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {orgProfile?.approverName || 'ผู้บริหารท้องถิ่น'} • กำหนดนโยบาย ยุทธศาสตร์ และการบริหารงานภาพรวม
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-amber-100 flex items-center justify-between text-xs text-amber-700 font-medium">
                    <span>เข้าสู่ระบบในฐานะ @mayor</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. ปลัด อปท. */}
                <div
                  onClick={() => {
                    const user = availableUsers.find(
                      (u) => u.username === 'palat' || (u.username !== 'office' && !u.displayName?.includes('สำนัก') && (u.displayName?.includes('ปลัด') || u.position?.includes('ปลัด')))
                    );
                    if (user) handleQuickSelect(user);
                    else {
                      setUsername('palat');
                      setShowLoginModal(true);
                    }
                  }}
                  className="p-5 rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold shadow-2xs group-hover:scale-105 transition-transform">
                        🏛️
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                        CHIEF ADMINISTRATIVE OFFICER
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-900 group-hover:text-indigo-800 transition-colors flex items-center space-x-1.5">
                        <span>{orgProfile?.palatPosition || 'ปลัด อปท.'}</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {orgProfile?.palatName || 'ปลัดองค์กรปกครองส่วนท้องถิ่น'} • หัวหน้าส่วนราชการประจำ บังคับบัญชาข้าราชการและกำกับดูแลทุกกอง
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-700 font-medium">
                    <span>เข้าสู่ระบบในฐานะ @palat</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.filter((d) => !d.startsWith('ศพด.')).map((dept) => {
                  const matchedUser = availableUsers.find((u) => u.department === dept);
                  const isAudit = dept === 'หน่วยตรวจสอบภายใน';

                  return (
                    <div
                      key={dept}
                      onClick={() => {
                        if (matchedUser) handleQuickSelect(matchedUser);
                        else setShowLoginModal(true);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] flex flex-col justify-between ${
                        isAudit
                          ? 'bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white border-blue-200 hover:border-blue-400 shadow-sm shadow-blue-100/60'
                          : 'bg-white border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md shadow-xs'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs ${
                              isAudit ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-600 group-hover:bg-blue-50'
                            }`}
                          >
                            {isAudit ? '👑' : '🏢'}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isAudit
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isAudit ? 'ADMIN' : 'หน่วยรับตรวจ'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                            {dept}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {matchedUser?.position || 'บุคลากรและเจ้าหน้าที่ผู้รับผิดชอบงานประจำกอง'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 group-hover:text-blue-700">
                        <span className="font-medium">
                          {matchedUser ? `เข้าใช้งานในฐานะ @${matchedUser.username}` : 'คลิกเพื่อเข้าสู่ระบบ'}
                        </span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* หน่วยงานภายใต้สังกัด อบต.ฝางคำ (อยู่ใต้กองต่างๆ) */}
              <div className="pt-6 border-t border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shadow-2xs">
                      🏫
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                        <span>หน่วยงานภายใต้สังกัด (AFFILIATED AGENCIES)</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        ศูนย์พัฒนาเด็กเล็กและสถานศึกษาในสังกัด อบต.ฝางคำ
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    2 หน่วยงานภายใต้สังกัด
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {childDevelopmentCenters.map((cdc) => {
                    const matchedUser = availableUsers.find(
                      (u) => u.department === cdc || 
                             (cdc.includes('เจริญทัศน์') && u.username === 'cdc_charoen') || 
                             (cdc.includes('ฝางเทิง') && u.username === 'cdc_fangthoeng')
                    );
                    return (
                      <div
                        key={cdc}
                        onClick={() => {
                          if (matchedUser) handleQuickSelect(matchedUser);
                          else setShowLoginModal(true);
                        }}
                        className="p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/20 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shadow-2xs group-hover:scale-105 transition-transform">
                              🏫
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                              สถานศึกษาในสังกัด
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {cdc}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {matchedUser?.position || 'หัวหน้าศูนย์พัฒนาเด็กเล็ก / ครูผู้ดูแลเด็ก'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-700 group-hover:text-emerald-800 font-medium">
                          <span>
                            {matchedUser ? `เข้าใช้งานในฐานะ @${matchedUser.username}` : 'คลิกเพื่อเข้าสู่ระบบ'}
                          </span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 5. Core System Modules */}
        <div id="modules" className="space-y-6 pt-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h3 className="text-lg md:text-2xl font-bold text-slate-900">
              ระบบงานอัจฉริยะครบวงจร (Audit Modules)
            </h3>
            <p className="text-xs text-slate-500">
              ขับเคลื่อนงานตรวจสอบภายในอย่างเป็นระบบ ตรงตามระเบียบกระทรวงการคลังและมาตรฐานสถ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs hover:shadow-md hover:border-amber-200 transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">การประเมินความเสี่ยง SOFCK</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                จัดลำดับความเสี่ยง 21 กิจกรรม อบต.ฝางคำ ด้วยระบบ 5 ปัจจัย คำนวณความเสี่ยงสูง-กลาง-ต่ำอัตโนมัติ
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">แผนปฏิบัติงานตรวจ (ว 614)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                สร้างแผนรายกิจกรรมอัตโนมัติ พร้อมเทมเพลตและระบบผู้ช่วย AI ช่วยเขียนวัตถุประสงค์และแนวการตรวจ
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">กระดาษทำการตรวจ & LPA</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                บันทึกการสุ่มตรวจ บันทึกผล และเตรียมหลักฐานประเมินประสิทธิภาพ อปท. (LPA) ครบทุกมิติ
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">การควบคุมภายใน ปอ.1 - ปค.5</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ให้แต่ละกองเข้ามาจัดทำและบันทึกรายงานการควบคุมภายในประจำปีได้อย่างถูกต้องตามมาตรฐาน
              </p>
            </div>
          </div>
        </div>

        {/* 6. Call to Action Banner */}
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white border border-blue-200/80 text-center space-y-5 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xl md:text-3xl font-extrabold text-slate-900">
            พร้อมเริ่มต้นปฏิบัติงานตรวจสอบภายในแล้วหรือยัง?
          </h3>
          <p className="text-xs md:text-sm text-slate-600 max-w-xl mx-auto">
            เข้าสู่ระบบด้วยชื่อผู้ใช้งานประจำกองของท่าน หรือติดต่อผู้ดูแลระบบ (หน่วยตรวจสอบภายใน) เพื่อเปิดสิทธิ์การใช้งาน
          </p>
          <div>
            {session ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-2xl inline-flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
              >
                <span>กลับสู่หน้าทำงาน (Dashboard)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-2xl inline-flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-blue-100" />
                <span>เข้าสู่ระบบตรวจสอบภายในทันที</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200/80 py-8 px-4 text-center text-xs text-slate-500 space-y-1 bg-white/40">
        <p className="font-semibold text-slate-700">
          หน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
        </p>
        <p>
          {orgProfile?.district || ''} {orgProfile?.province ? 'จังหวัด' + orgProfile.province : ''} | พัฒนาและดูแลระบบโดย: เครือข่ายผู้ตรวจสอบภายใน อปท. (Audit-OS)
        </p>
        <p className="text-[10px] text-slate-400 pt-2">
          Audit-OS: Cloud Internal Audit Operating System for Local Administrative Organizations
        </p>
      </footer>

      {/* =========================================================================
          LOGIN MODAL
      ========================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5 relative text-slate-900">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 mx-auto flex items-center justify-center text-white shadow-md shadow-emerald-600/20 mb-2">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">เข้าสู่ระบบ Audit-OS (Multi-Tenant)</h3>
              <p className="text-xs text-slate-500">
                เลือกรหัสกองในระบบ หรือเข้าสู่ระบบด้วยบัญชี Cloud Email
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อผู้ใช้งาน หรือ Cloud Email:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น admin, finance, หรือ email@example.com..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รหัสผ่าน (Password):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-500 text-[11px]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 bg-slate-100 border-slate-300"
                  />
                  <span>จดจำชื่อผู้ใช้งานในเครื่องนี้</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold py-2.5 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{busy ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
              </button>
            </form>

            {/* Quick Guest Entry in Modal */}
            <div className="pt-2">
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">หรือเข้าชมทั่วไป</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnterGuest}
                className="w-full py-2.5 px-3 rounded-xl border border-blue-200 hover:border-blue-400 bg-blue-50/60 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>เข้าใช้งานในฐานะผู้เยี่ยมชม (Guest View - ไม่ต้องใช้รหัสผ่าน)</span>
              </button>
            </div>

            {/* Quick account selector chips */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <span className="text-[11px] text-slate-500 block font-medium">
                เลือกเข้าสู่ระบบด่วนตามบทบาท / กอง:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {(() => {
                  const sorted = [...availableUsers]
                    .filter((u) => u.username !== 'health' && !u.department?.includes('สาธารณสุข'))
                    .sort((a, b) => {
                      const order = { 
                        mayor: 1, 
                        palat: 2, 
                        admin: 3, 
                        office: 4, 
                        finance: 5, 
                        engineering: 6, 
                        education: 7, 
                        welfare: 8,
                        cdc_charoen: 9,
                        cdc_fangthoeng: 10
                      };
                      return (order[a.username] || 99) - (order[b.username] || 99);
                    });
                  return sorted.map((u) => {
                    let label = u.displayName || u.username;
                    let icon = '🏢 ';
                    if (u.username === 'mayor' || (u.role === 'executive' && u.username !== 'palat') || label === 'ผู้บริหาร') {
                      icon = '👑 ';
                      label = 'ผู้บริหาร';
                    } else if (u.username === 'palat' || (label.includes('ปลัด') && u.username !== 'office' && !label.includes('สำนัก'))) {
                      icon = '🏛️ ';
                      label = 'ปลัด อปท.';
                    } else if (u.role === 'admin' || u.username === 'admin') {
                      icon = '👑 ';
                      label = 'หน่วยตรวจสอบฯ';
                    } else if (u.username === 'office' || label.includes('สำนักปลัด')) {
                      icon = '🏢 ';
                      label = 'สำนักปลัด';
                    } else if (u.username?.startsWith('cdc_') || label.includes('ศพด.')) {
                      icon = '🏫 ';
                    } else if (label === 'กองสาธารณสุขและสิ่งแวดล้อม') {
                      label = 'กองสวัสดิการสังคม';
                    }
                    return (
                      <button
                        key={u.username}
                        type="button"
                        onClick={() => handleQuickSelect(u)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          Boolean(username && u.username && username.toLowerCase() === u.username.toLowerCase())
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {icon}
                        {label}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Register New Account Action */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              {onOpenOnboarding && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    onOpenOnboarding();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>ยังไม่มีระบบ อปท.? ตั้งค่าหน่วยงานใหม่ (Free Trial 30 วัน)</span>
                </button>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 text-[11px]">เป็นเจ้าหน้าที่ในสังกัด อปท. นี้?</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setRegError('');
                    setRegSuccess('');
                    setShowRegisterModal(true);
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ลงทะเบียนขอสิทธิ์ใช้งาน</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REGISTRATION MODAL: บุคลากรใหม่ขอสิทธิ์เข้าใช้งาน
      ========================================================================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 my-8 relative animate-scale-up">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1.5 pb-2 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                ลงทะเบียนขอสิทธิ์เข้าใช้งานระบบ
              </h3>
              <p className="text-xs text-slate-500">
                สำหรับบุคลากร เจ้าหน้าที่ และหัวหน้าส่วนราชการ อปท. (คำขอจะถูกส่งให้ ADMIN อนุมัติ)
              </p>
            </div>

            {regSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">ส่งคำขอลงทะเบียนเรียบร้อยแล้ว</h4>
                  <p className="text-xs text-slate-600 leading-relaxed px-4">
                    {regSuccess}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                {regError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      ชื่อ-นามสกุลจริง <span className="text-rose-500">*</span>:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        placeholder="เช่น นายสมชาย ใจมั่นคง"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ชื่อผู้ใช้เข้าระบบ (Username) <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                      placeholder="เช่น somchai_j (ภาษาอังกฤษ)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      อีเมล (สำหรับแจ้งเตือน) :
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="somchai@example.go.th"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      รหัสผ่าน (Password) <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="กำหนดรหัสผ่านอย่างน้อย 4 ตัว"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      สังกัด / สำนัก-กอง <span className="text-rose-500">*</span>:
                    </label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ตำแหน่งในองค์กร:
                    </label>
                    <input
                      type="text"
                      value={regPosition}
                      onChange={(e) => setRegPosition(e.target.value)}
                      placeholder="เช่น เจ้าพนักงานพัสดุปฏิบัติงาน"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      บทบาทที่ขอเปิดสิทธิ์ใช้งาน:
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                    >
                      {ENTERPRISE_ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {ENTERPRISE_ROLES.find((r) => r.id === regRole)?.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setShowLoginModal(true);
                    }}
                    className="flex-1 py-2.5 px-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-all cursor-pointer text-center"
                  >
                    ยกเลิก / เข้าสู่ระบบ
                  </button>

                  <button
                    type="submit"
                    disabled={regBusy}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{regBusy ? 'กำลังส่งคำขอ...' : 'ส่งคำขอลงทะเบียน'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
