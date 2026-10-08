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
import { getTenantOrgStructure } from '../data/orgStructureData';
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

  // Registration modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOrganization, setRegOrganization] = useState(() => orgProfile?.name || 'องค์การบริหารส่วนตำบลต้นแบบ');
  const [regDepartment, setRegDepartment] = useState('หน่วยตรวจสอบภายใน');
  const [regPosition, setRegPosition] = useState('นักวิชาการตรวจสอบภายใน');
  const [regRole, setRegRole] = useState('auditor');
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

  // Derive dynamic org structure and affiliated units from tenant settings
  const tenantOrg = getTenantOrgStructure(session, orgProfile);
  const affiliatedUnits = [];
  if (Array.isArray(tenantOrg?.departments)) {
    tenantOrg.departments.forEach((d) => {
      if (Array.isArray(d.affiliatedUnits)) {
        d.affiliatedUnits.forEach((aff) => {
          if (aff?.name && !affiliatedUnits.includes(aff.name)) {
            affiliatedUnits.push(aff.name);
          }
        });
      }
    });
  }

  const KNOWN_LABELS = {
    'สำนักปลัด': 'งานบริหารทั่วไป นโยบาย และงานสารบรรณ',
    'กองคลัง': 'งานการเงิน พัสดุ และบัญชี (e-LAAS)',
    'กองช่าง': 'งานโยธา ประมาณราคา และโครงการก่อสร้าง',
    'กองการศึกษา': 'ศูนย์พัฒนาเด็กเล็กและการศึกษา',
    'กองสวัสดิการสังคม': 'เบี้ยยังชีพและการพัฒนาชุมชน',
    'ศพด.': 'ศูนย์พัฒนาเด็กเล็ก',
    'ศูนย์พัฒนาเด็กเล็ก': 'ศูนย์พัฒนาเด็กเล็ก'
  };

  const scrollToDepartments = () => {
    const el = document.getElementById('departments');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else scrollToLogin();
  };

  const executiveLeaderPartner = {
    name: tenantOrg.approver?.title || 'ฝ่ายบริหาร / นายก อปท.',
    label: tenantOrg.approver?.name || orgProfile?.approverName || 'ผู้บริหารองค์กรปกครองส่วนท้องถิ่น',
    onClick: scrollToDepartments
  };

  const permanentSecretaryPartner = {
    name: tenantOrg.palat?.title || 'ปลัดองค์กรปกครองส่วนท้องถิ่น',
    label: tenantOrg.palat?.name || orgProfile?.palatName || 'การบริหารราชการและกำกับดูแลภาพรวม',
    onClick: scrollToDepartments
  };

  const heroPartners = auditeeDepartments.map((deptName) => {
    return {
      name: deptName,
      label: KNOWN_LABELS[deptName] || 'หน่วยรับตรวจในจักรวาลการตรวจสอบ',
      onClick: scrollToDepartments
    };
  });

  const heroSubUnits = (affiliatedUnits.length > 0 ? affiliatedUnits : ['ศูนย์พัฒนาเด็กเล็กในสังกัด']).map((affName) => {
    return {
      name: affName,
      label: 'สถานศึกษา/หน่วยงานภายใต้สังกัด อปท.',
      icon: '🏫',
      onClick: scrollToDepartments
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

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regDisplayName.trim() || !regUsername.trim() || !regPassword || !regOrganization.trim()) {
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
        organization: regOrganization.trim(),
        department: regDepartment.trim() || 'หน่วยตรวจสอบภายใน',
        position: regPosition.trim() || 'ผู้ตรวจสอบภายใน',
        role: regRole,
        email: regEmail.trim()
      });

      setRegSuccess(`ส่งคำขอลงทะเบียนของ "${regDisplayName}" ในสังกัด "${regOrganization.trim()}" เรียบร้อยแล้ว! คำขอจะถูกส่งไปยังผู้ดูแลระบบ (ADMIN) เพื่ออนุมัติสิทธิ์เข้าใช้งาน`);
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
    <div className="min-h-screen bg-gradient-to-b from-[#f7f6f2] via-[#f5f2eb] to-[#ede8dc] text-stone-800 font-sans selection:bg-amber-700 selection:text-white relative overflow-x-hidden">
      {/* Soft warm ambient background orbs */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-stone-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-40 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Floating Glass Island Header (Appears smoothly when scrolling down) */}
      <div className={`fixed top-3 sm:top-4 inset-x-0 z-50 px-3 sm:px-6 transition-all duration-300 ${
        scrolled ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-6 pointer-events-none'
      }`}>
        <header className="max-w-6xl mx-auto pointer-events-auto rounded-2xl md:rounded-full bg-white/90 backdrop-blur-xl border border-stone-200/80 shadow-[0_8px_30px_rgba(40,30,20,0.08)] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all relative overflow-hidden ring-1 ring-stone-900/5">
          {/* Subtle warm shimmer line */}
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />
          <div className="absolute -bottom-6 left-1/4 w-32 h-12 bg-amber-500/10 blur-xl pointer-events-none" />

          {/* Brand & System Status */}
          <div className="flex items-center space-x-3 sm:space-x-3.5">
            <div
              className="relative group cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-800 via-stone-700 to-amber-700 flex items-center justify-center text-amber-200 shadow-md shadow-stone-900/20 group-hover:shadow-stone-900/30 transition-all border border-amber-600/30">
                <Shield className="w-5 h-5 text-amber-200" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>

            <div>
              <div className="text-sm sm:text-base font-black tracking-wider text-stone-900 flex items-center space-x-2">
                <span className="bg-gradient-to-r from-stone-800 via-stone-900 to-amber-800 bg-clip-text text-transparent drop-shadow-xs">
                  Audit-OS
                </span>
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200/80 tracking-wide truncate max-w-[150px] sm:max-w-xs">
                  {orgProfile?.name || 'อปท. เครือข่าย'}
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-stone-500 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>ระบบสารสนเทศเพื่อการตรวจสอบภายใน อปท. (Multi-Tenant)</span>
              </div>
            </div>
          </div>

          {/* Navigation Pill Links */}
          <nav className="hidden lg:flex items-center space-x-1 bg-stone-100/80 p-1 rounded-full border border-stone-200/70 text-xs font-semibold text-stone-600 backdrop-blur-md">
            <button
              type="button"
              onClick={scrollToExplore}
              className="px-4 py-1.5 rounded-full hover:text-stone-900 hover:bg-white hover:shadow-xs border border-transparent transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>ภาพรวมระบบ</span>
            </button>
            <a
              href="#departments"
              className="px-4 py-1.5 rounded-full hover:text-stone-900 hover:bg-white hover:shadow-xs border border-transparent transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Building className="w-3.5 h-3.5 text-stone-600" />
              <span>หน่วยรับตรวจ {auditeeDepartments.length} หน่วย</span>
            </a>
            <a
              href="#modules"
              className="px-4 py-1.5 rounded-full hover:text-stone-900 hover:bg-white hover:shadow-xs border border-transparent transition-all cursor-pointer flex items-center space-x-1.5"
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
                className="relative group p-[1px] rounded-full overflow-hidden bg-gradient-to-r from-stone-800 via-stone-700 to-amber-700 shadow-md shadow-stone-900/20 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="px-4 sm:px-5 py-2 rounded-full bg-stone-800 text-amber-100 font-bold text-xs flex items-center space-x-2 transition-all">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">ไปยังแดชบอร์ดงาน</span>
                  <span className="text-amber-300">({session.displayName || session.username})</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {onOpenOnboarding && (
                  <button
                    type="button"
                    onClick={onOpenOnboarding}
                    className="hidden sm:flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-stone-800 hover:bg-stone-900 text-amber-100 font-bold text-xs shadow-md border border-amber-600/30 transition-all cursor-pointer"
                    title="ตั้งค่าและลงทะเบียน อปท. ใหม่ (ทดลองใช้งานฟรี 30 วัน)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>ลงทะเบียน อปท. (Free Trial)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEnterGuest}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white hover:bg-stone-100 border border-stone-200 hover:border-amber-300 text-stone-700 hover:text-amber-900 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                  title="เข้าชมแดชบอร์ดในฐานะผู้เยี่ยมชม (ไม่ต้องใช้รหัสผ่าน)"
                >
                  <Users className="w-3.5 h-3.5 text-stone-600" />
                  <span>ผู้เยี่ยมชม (Guest)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="relative group p-[1px] rounded-full overflow-hidden bg-gradient-to-r from-stone-800 via-stone-700 to-amber-700 shadow-md shadow-stone-900/20 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-900 hover:to-stone-950 text-amber-100 font-bold text-xs flex items-center space-x-2 transition-all border border-amber-600/30">
                    <LogIn className="w-3.5 h-3.5 text-amber-300" />
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
          logoText="Audit-OS"
          subLogoText={orgProfile?.name || "เครือข่ายผู้ตรวจสอบภายใน อปท."}
          title="ระบบสารสนเทศเพื่อการตรวจสอบภายใน"
          titleLine2={orgProfile?.name ? orgProfile.name : "สำหรับองค์กรปกครองส่วนท้องถิ่น"}
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
                แผนภูมิสายการบังคับบัญชา ส่วนราชการ และจักรวาลหน่วยรับตรวจ (Auditable Universe) {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
              </p>
            </div>
          </div>

          <OrgChartStructure
            session={session}
            orgProfile={orgProfile}
            onSelectDepartment={() => {
              if (!session) setShowLoginModal(true);
            }}
          />
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
            <div className="p-5 rounded-2xl bg-white border border-stone-200/90 space-y-2.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-stone-900">การประเมินความเสี่ยง SOFCK</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                จัดลำดับความเสี่ยง 21 กิจกรรมงาน อปท. ด้วยระบบ 5 ปัจจัย คำนวณความเสี่ยงสูง-กลาง-ต่ำอัตโนมัติ
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200/90 space-y-2.5 shadow-xs hover:shadow-md hover:border-stone-400 transition-all">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 border border-stone-200/80 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="font-bold text-sm text-stone-900">แผนปฏิบัติงานตรวจ (ว 614)</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                สร้างแผนรายกิจกรรมอัตโนมัติ พร้อมเทมเพลตและระบบผู้ช่วย AI ช่วยเขียนวัตถุประสงค์และแนวการตรวจ
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200/90 space-y-2.5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-stone-900">กระดาษทำการตรวจ & LPA</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                บันทึกการสุ่มตรวจ บันทึกผล และเตรียมหลักฐานประเมินประสิทธิภาพ อปท. (LPA) ครบทุกมิติ
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200/90 space-y-2.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-stone-800 text-amber-200 border border-amber-600/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
              </div>
              <h4 className="font-bold text-sm text-stone-900">การควบคุมภายใน ปอ.1 - ปค.5</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                ให้แต่ละกองเข้ามาจัดทำและบันทึกรายงานการควบคุมภายในประจำปีได้อย่างถูกต้องตามมาตรฐาน
              </p>
            </div>
          </div>
        </div>

        {/* 6. Call to Action Banner */}
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-stone-100/90 via-amber-50/70 to-white border border-stone-300/80 text-center space-y-5 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xl md:text-3xl font-extrabold text-stone-900">
            พร้อมเริ่มต้นปฏิบัติงานตรวจสอบภายในแล้วหรือยัง?
          </h3>
          <p className="text-xs md:text-sm text-stone-600 max-w-xl mx-auto">
            เข้าสู่ระบบด้วยชื่อผู้ใช้งานประจำกองของท่าน หรือติดต่อผู้ดูแลระบบ (หน่วยตรวจสอบภายใน) เพื่อเปิดสิทธิ์การใช้งาน
          </p>
          <div>
            {session ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="bg-stone-800 hover:bg-stone-900 text-amber-100 border border-amber-600/30 font-bold text-sm px-6 py-3 rounded-2xl inline-flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <span>กลับสู่หน้าทำงาน (Dashboard)</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="bg-stone-800 hover:bg-stone-900 text-amber-100 border border-amber-600/30 font-bold text-sm px-6 py-3 rounded-2xl inline-flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>เข้าสู่ระบบตรวจสอบภายในทันที</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-stone-200/80 py-8 px-4 text-center text-xs text-stone-500 space-y-1 bg-white/40">
        <p className="font-semibold text-stone-700">
          หน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
        </p>
        <p>
          {orgProfile?.district || ''} {orgProfile?.province ? 'จังหวัด' + orgProfile.province : ''} | พัฒนาและดูแลระบบโดย: เครือข่ายผู้ตรวจสอบภายใน อปท. (Audit-OS)
        </p>
        <p className="text-[10px] text-stone-400 pt-2">
          Audit-OS: Cloud Internal Audit Operating System for Local Administrative Organizations
        </p>
      </footer>

      {/* =========================================================================
          LOGIN MODAL
      ========================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5 relative text-stone-900">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-all cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-stone-800 via-stone-700 to-amber-700 mx-auto flex items-center justify-center text-amber-200 shadow-md shadow-stone-900/20 mb-2 border border-amber-600/30">
                <Shield className="w-6 h-6 text-amber-200" />
              </div>
              <h3 className="text-base font-bold text-stone-900">เข้าสู่ระบบ Audit-OS (Multi-Tenant)</h3>
              <p className="text-xs text-stone-500">
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
                <label className="block font-semibold text-stone-700 mb-1">
                  ชื่อผู้ใช้งาน หรือ Cloud Email:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น admin, finance, หรือ email@example.com..."
                    className="w-full pl-9 pr-3 py-2.5 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  รหัสผ่าน (Password):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none text-stone-500 text-[11px]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 bg-stone-100 border-stone-300"
                  />
                  <span>จดจำชื่อผู้ใช้งานในเครื่องนี้</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 bg-gradient-to-r from-amber-600 via-amber-700 to-stone-800 hover:from-amber-500 hover:to-stone-700 text-amber-50 font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-amber-200" />
                <span>{busy ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
              </button>
            </form>

            {/* Quick Guest Entry in Modal */}
            <div className="pt-2">
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2 text-stone-400 font-semibold tracking-wider">หรือเข้าชมทั่วไป</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnterGuest}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-300 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/40 text-stone-700 hover:text-amber-900 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Users className="w-4 h-4 text-stone-600" />
                <span>เข้าใช้งานในฐานะผู้เยี่ยมชม (Guest View - ไม่ต้องใช้รหัสผ่าน)</span>
              </button>
            </div>

            {/* Register New Account Action */}
            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
              {onOpenOnboarding && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    onOpenOnboarding();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-amber-100 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md border border-amber-600/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>ยังไม่มีระบบ อปท.? ตั้งค่าหน่วยงานใหม่ (Free Trial 30 วัน)</span>
                </button>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-500 text-[11px]">เป็นเจ้าหน้าที่ในสังกัด อปท. นี้?</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setRegError('');
                    setRegSuccess('');
                    setShowRegisterModal(true);
                  }}
                  className="text-amber-800 hover:text-amber-950 font-bold hover:underline cursor-pointer flex items-center space-x-1"
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

            <div className="text-center space-y-1.5 pb-2 border-b border-stone-200/80">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center mx-auto shadow-xs">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                ลงทะเบียนขอสิทธิ์เข้าใช้งานระบบ
              </h3>
              <p className="text-xs text-stone-500">
                สำหรับบุคลากร เจ้าหน้าที่ และหัวหน้าส่วนราชการ อปท. (คำขอจะถูกส่งให้ ADMIN อนุมัติ)
              </p>
            </div>

            {regSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-800 text-sm">ส่งคำขอลงทะเบียนเรียบร้อยแล้ว</h4>
                  <p className="text-xs text-stone-600 leading-relaxed px-4">
                    {regSuccess}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="w-full bg-stone-800 hover:bg-stone-900 text-amber-100 font-bold py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer border border-amber-600/30"
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
                    <label className="block font-semibold text-stone-700 mb-1">
                      ชื่อ-นามสกุลจริง <span className="text-rose-500">*</span>:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        placeholder="เช่น นายสมชาย ใจมั่นคง"
                        className="w-full pl-9 pr-3 py-2 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      ชื่อผู้ใช้เข้าระบบ (Username) <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                      placeholder="เช่น somchai_j (ภาษาอังกฤษ)"
                      className="w-full px-3 py-2 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      อีเมล (สำหรับแจ้งเตือน) :
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="somchai@example.go.th"
                      className="w-full px-3 py-2 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      รหัสผ่าน (Password) <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="กำหนดรหัสผ่านอย่างน้อย 4 ตัว"
                      className="w-full px-3 py-2 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                      className="w-full px-3 py-2 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">
                      องค์กรปกครองส่วนท้องถิ่น (อปท.) / หน่วยงานที่สังกัด <span className="text-rose-500">*</span>:
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        required
                        list="welcome-org-options"
                        value={regOrganization}
                        onChange={(e) => setRegOrganization(e.target.value)}
                        placeholder="พิมพ์หรือเลือกชื่อ อปท. เช่น องค์การบริหารส่วนตำบล..., เทศบาลตำบล..."
                        className="w-full pl-9 pr-3 py-2 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-colors"
                      />
                      <datalist id="welcome-org-options">
                        <option value="องค์การบริหารส่วนตำบลต้นแบบ" />
                        <option value="เทศบาลตำบลเมืองทอง" />
                        <option value="เทศบาลนครสุรนารี" />
                        <option value="องค์การบริหารส่วนจังหวัด" />
                      </datalist>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1">
                      💡 ชื่อหน่วยงานนี้จะถูกเชื่อมโยงเป็นชื่อ อปท. หลักของระบบ และแสดงในเอกสาร/รายงานการตรวจสอบทันที
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      กลุ่มงาน / หน่วยงานตรวจสอบ:
                    </label>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="เช่น หน่วยตรวจสอบภายใน"
                      className="w-full px-3 py-2 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 font-medium transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      ตำแหน่งในองค์กร:
                    </label>
                    <input
                      type="text"
                      value={regPosition}
                      onChange={(e) => setRegPosition(e.target.value)}
                      placeholder="เช่น นักวิชาการตรวจสอบภายในปฏิบัติการ"
                      className="w-full px-3 py-2 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">
                      บทบาทที่ขอเปิดสิทธิ์ใช้งาน:
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-3 py-2 bg-[#faf8f4] border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 font-medium cursor-pointer transition-colors"
                    >
                      {ENTERPRISE_ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-stone-400 mt-1">
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
                    className="flex-1 py-2.5 px-3 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50 transition-all cursor-pointer text-center"
                  >
                    ยกเลิก / เข้าสู่ระบบ
                  </button>

                  <button
                    type="submit"
                    disabled={regBusy}
                    className="flex-1 bg-gradient-to-r from-amber-600 via-amber-700 to-stone-800 hover:from-amber-500 hover:to-stone-700 text-amber-50 font-bold py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 text-amber-200" />
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
