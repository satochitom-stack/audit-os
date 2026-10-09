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
  getUsers,
  getLastUsername,
  setLastUsername,
  getDepartments,
  registerUser,
  checkUserSubscription,
  getSystemSettings,
  ENTERPRISE_ROLES
} from '../utils/auth';
import { loginWithFirebase } from '../services/firebaseAuthService';

export default function WelcomeView({
  session,
  orgProfile,
  onOpenOnboarding,
  onLogin,
  onEnterDashboard
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const subStatus = checkUserSubscription(session);
  const systemSettings = getSystemSettings();

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
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const handleScroll = () => {
      setScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [departments, setDepartments] = useState(() => getDepartments());
  const [availableUsers, setAvailableUsers] = useState(() => getUsers());
  const [tenantOrg, setTenantOrg] = useState(() => getTenantOrgStructure(session, orgProfile));

  useEffect(() => {
    const handleSync = () => {
      setDepartments(getDepartments());
      setAvailableUsers(getUsers());
      setTenantOrg(getTenantOrgStructure(session, orgProfile));
    };
    window.addEventListener('ia-departments-changed', handleSync);
    window.addEventListener('ia-departments-updated', handleSync);
    window.addEventListener('ia-org-structure-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ia-departments-changed', handleSync);
      window.removeEventListener('ia-departments-updated', handleSync);
      window.removeEventListener('ia-org-structure-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [session, orgProfile]);

  const DEPARTMENT_ORDER = [
    'สำนักปลัด',
    'กองยุทธศาสตร์และงบประมาณ',
    'กองคลัง',
    'กองช่าง',
    'กองสาธารณสุขและสิ่งแวดล้อม',
    'กองการศึกษา',
    'กองสวัสดิการสังคม',
    'กองการเจ้าหน้าที่',
    'กองการประปา'
  ];

  // Derive dynamic org structure and affiliated units from tenant settings
  const rawTenantDepts = Array.isArray(tenantOrg?.departments) && tenantOrg.departments.length > 0
    ? tenantOrg.departments.map((d) => typeof d === 'string' ? d : d.name)
    : departments;

  // Filter out internal audit, executive titles, and CDCs to get main auditee departments
  const auditeeDepartments = rawTenantDepts
    .filter(
      (d) => d &&
             d !== 'หน่วยตรวจสอบภายใน' && 
             d !== 'ผู้บริหาร' && 
             d !== 'ปลัด อปท.' &&
             d !== 'ปลัด' &&
             d !== 'ผู้ช่วยปลัด' &&
             d !== 'ปลัดเทศบาล' &&
             d !== 'ปลัด อบต.' &&
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
      const newUser = await registerUser({
        displayName: regDisplayName.trim(),
        username: regUsername.trim(),
        password: regPassword,
        organization: regOrganization.trim(),
        department: regDepartment.trim() || 'หน่วยตรวจสอบภายใน',
        position: regPosition.trim() || 'นักวิชาการตรวจสอบภายใน',
        role: 'auditor',
        email: regEmail.trim()
      });

      // Instant 30-day Free Trial - automatically log in!
      setLastUsername(newUser.username);
      const newSession = startSession(newUser, true);
      setShowRegisterModal(false);
      onLogin(newSession);
    } catch (err) {
      setRegError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setRegBusy(false);
    }
  };

  const handleDashboardEntry = () => {
    if (session && subStatus.expired) {
      setShowExpiredModal(true);
      return;
    }
    if (session) {
      onEnterDashboard();
      return;
    }
    setShowLoginModal(true);
  };

  const scrollToLogin = () => {
    handleDashboardEntry();
  };

  const scrollToExplore = () => {
    const el = document.getElementById('welcome-features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f6f2] via-[#f5f2eb] to-[#ede8dc] text-stone-800 font-sans selection:bg-amber-700 selection:text-white relative overflow-x-hidden">
      {/* Expired Subscription Alert Bar (Persistent Banner) */}
      {session && subStatus.expired && (
        <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-amber-100 py-3 px-4 border-b border-rose-500/50 shadow-md flex items-center justify-between text-xs sticky top-0 z-50 no-print print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-6xl mx-auto w-full gap-2">
            <div className="flex items-center space-x-2.5">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-rose-300">บัญชีของคุณ (@{session.username}) หมดอายุทดลองใช้งานฟรี 30 วันแล้ว:</span>
                <span className="text-stone-300 ml-1.5">ทุกเมนูการทำงานถูกล็อค กรุณาติดต่อผู้ดูแลระบบ (ADMIN) เพื่อต่ออายุการใช้งานหรือปลดล็อคสิทธิ์</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowExpiredModal(true)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
            >
              ติดต่อต่ออายุ / ปลดล็อค
            </button>
          </div>
        </div>
      )}

      {/* Soft warm ambient background orbs */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none no-print print:hidden" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-stone-400/10 rounded-full blur-3xl pointer-events-none no-print print:hidden" />
      <div className="absolute bottom-10 -left-40 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none no-print print:hidden" />

      {/* 1. Floating Glass Island Header (Appears smoothly when scrolling down) */}
      <div className={`fixed top-3 sm:top-4 inset-x-0 z-50 px-3 sm:px-6 transition-all duration-300 no-print print:hidden ${
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
                onClick={handleDashboardEntry}
                className="relative group p-[1px] rounded-full overflow-hidden bg-gradient-to-r from-stone-800 via-stone-700 to-amber-700 shadow-md shadow-stone-900/20 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="px-4 sm:px-5 py-2 rounded-full bg-stone-800 hover:bg-stone-900 text-amber-100 font-bold text-xs flex items-center space-x-2 transition-all">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>เข้าสู่ระบบงานตรวจสอบ</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300 transform group-hover:translate-x-1 transition-transform" />
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
                    <span>ลงทะเบียน อปท. (Free Trial 30 วัน)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="relative group p-[1px] rounded-full overflow-hidden bg-gradient-to-r from-stone-800 via-stone-700 to-amber-700 shadow-md shadow-stone-900/20 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-900 hover:to-stone-950 text-amber-100 font-bold text-xs flex items-center space-x-2 transition-all border border-amber-600/30">
                    <LogIn className="w-3.5 h-3.5 text-amber-300" />
                    <span>เข้าสู่ระบบงานตรวจสอบ</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* 2. Responsive Hero Banner (Option B: Royal Blue & Cyber Cyan Cosmic Beam) */}
      <section className="relative w-full pt-2 sm:pt-3 pb-4 sm:pb-6 px-2.5 sm:px-4 lg:px-6 max-w-[1440px] 2xl:max-w-[1560px] mx-auto no-print print:hidden">
        <ResponsiveHeroBanner
          session={session}
          onPrimaryClick={handleDashboardEntry}
          onCtaClick={handleDashboardEntry}
          primaryButtonText="เข้าสู่ระบบงานตรวจสอบ"
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
            { label: "แผนภูมิโครงสร้าง & หน่วยรับตรวจ", href: "#departments", isActive: true }
          ]}
        />
      </section>

      {/* 3. Departments Grid & Flowchart (หน่วยรับตรวจและโครงสร้าง อปท.) */}
      <section id="departments" className="pt-1 sm:pt-2 pb-6 px-2.5 sm:px-4 lg:px-6 max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
        <OrgChartStructure
          session={session}
          orgProfile={orgProfile}
          onStructureChange={(updatedStruct) => {
            setTenantOrg(updatedStruct);
            setDepartments(getDepartments());
          }}
          onSelectDepartment={() => {
            if (!session) setShowLoginModal(true);
          }}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 py-6 px-4 text-center text-xs text-stone-500 space-y-1 bg-white/40 no-print print:hidden">
        <p className="font-semibold text-stone-700">
          หน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
        </p>
        <p>
          {orgProfile?.district || ''} {orgProfile?.province ? 'จังหวัด' + orgProfile.province : ''} | พัฒนาและดูแลระบบโดย: เครือข่ายผู้ตรวจสอบภายใน อปท. (Audit-OS)
        </p>
        <p className="text-[10px] text-stone-400 pt-1">
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
                ลงทะเบียนเปิดใช้งานระบบ Audit-OS
              </h3>
              <p className="text-xs text-stone-500">
                สำหรับผู้ตรวจสอบภายใน อปท. (เปิดใช้งานทันที ฟรี 30 วัน ไม่ต้องรออนุมัติ)
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
                      💡 ชื่อหน่วยงานนี้จะถูกเชื่อมโยงเป็นชื่อ อปท. หลักของระบบ และสามารถเข้าใช้งานเครื่องมือตรวจสอบได้ทันที 30 วัน
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
                      บทบาทการใช้งานระบบ:
                    </label>
                    <div className="p-3 bg-[#faf8f4] border border-stone-300 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-lg">🛡️</span>
                        <div>
                          <div className="font-bold text-stone-900">ผู้ตรวจสอบภายใน อปท. (Internal Auditor)</div>
                          <div className="text-[11px] text-stone-500">สิทธิ์เข้าใช้งานเครื่องมือปฏิบัติงานตรวจสอบภายใน 12 ขั้นตอนครบวงจร</div>
                        </div>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-300 shrink-0">
                        เปิดใช้งานทันที ฟรี 30 วัน
                      </span>
                    </div>
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
                    <span>{regBusy ? 'กำลังสร้างบัญชี...' : 'เปิดใช้งาน & ทดลองใช้ฟรี 30 วัน'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          EXPIRED SUBSCRIPTION MODAL (แจ้งเตือนหมดอายุทดลองใช้ 30 วัน)
      ========================================================================= */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5 relative text-stone-900">
            <button
              type="button"
              onClick={() => setShowExpiredModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-all cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7 text-amber-700" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                หมดอายุการทดลองใช้งาน 30 วันแล้ว
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                ระยะเวลาทดลองใช้ระบบ Audit-OS ฟรี 30 วัน ของบัญชี <span className="font-bold text-stone-800">@{session?.username}</span> สิ้นสุดแล้ว เมนูขั้นตอนการปฏิบัติงานตรวจสอบทั้งหมดถูกล็อค
              </p>
            </div>

            <div className="bg-[#faf8f4] border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2 text-stone-700">
              <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>ช่องทางต่ออายุหรือปลดล็อคโดย ADMIN:</span>
              </div>
              <div className="space-y-1.5 text-[11px] pt-1">
                <div className="flex justify-between py-1 border-b border-stone-200/60">
                  <span className="text-stone-500">อัตราค่าสมาชิกรายปี:</span>
                  <span className="font-bold text-amber-900">฿{systemSettings.annualPrice || '2,990'} / ปี</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200/60">
                  <span className="text-stone-500">อัตราค่าสมาชิกรายเดือน:</span>
                  <span className="font-bold text-stone-800">฿{systemSettings.monthlyPrice || '299'} / เดือน</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200/60">
                  <span className="text-stone-500">พร้อมเพย์ (PromptPay):</span>
                  <span className="font-mono font-bold text-stone-900">{systemSettings.promptPayNo || '081-234-5678'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">บัญชีธนาคาร:</span>
                  <span className="font-medium text-stone-900">{systemSettings.bankName} {systemSettings.bankAccountNo}</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 pt-1 italic">
                * หรือแจ้ง ADMIN ผู้ดูแลระบบ ให้กด "ปลดล็อค / ต่ออายุ" ผ่านระบบหลังบ้าน (Super Admin Backoffice) ได้ทันที
              </p>
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowExpiredModal(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-amber-100 font-bold text-xs transition-all cursor-pointer text-center border border-amber-600/30"
              >
                รับทราบ (อยู่หน้าแรก)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
