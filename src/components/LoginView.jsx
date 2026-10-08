import React, { useState, useRef } from 'react';
import {
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Sparkles,
  Building,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Check,
  CheckCircle2,
  Users
} from 'lucide-react';
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

export default function LoginView({ onLogin, orgProfile, onOpenOnboarding }) {
  const [username, setUsername] = useState(() => getLastUsername());
  const [password, setPassword] = useState(''); // Never prefill password
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(true);
  const passwordInputRef = useRef(null);

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

  const departments = getDepartments();

  const availableUsers = getUsers();

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
      const session = startSession(user, remember);
      onLogin(session);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      setBusy(false);
    }
  };

  const handleQuickSelect = (u) => {
    setUsername(u.username);
    setPassword(''); // Do NOT remember or autofill password
    setError('');
    setLastUsername(u.username);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        {/* App Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-3">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Audit-OS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {orgProfile?.name || 'ระบบสารสนเทศเพื่อการตรวจสอบภายใน อปท. (Multi-Tenant SaaS)'}
          </p>
          <div className="mt-2 inline-flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Firebase Cloud Multi-Tenant: audit-os-7c993</span>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <LogIn className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>เข้าสู่ระบบตรวจสอบภายใน</span>
            </h2>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อผู้ใช้งาน (Username):
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin, finance, clerk..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>จดจำการเข้าสู่ระบบ</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer mt-2"
            >
              {busy ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Guest Entry */}
          <div className="pt-1">
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-semibold tracking-wider">หรือเข้าชมทั่วไป</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const guestSession = loginAsGuest();
                onLogin(guestSession);
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-blue-200 dark:border-blue-800 hover:border-blue-400 bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
            >
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>เข้าใช้งานในฐานะผู้เยี่ยมชม (Guest View - ไม่ต้องใช้รหัสผ่าน)</span>
            </button>
          </div>

          {/* Quick Login Account Picker (Auditor & Executive Roles) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => setShowQuickLogin(!showQuickLogin)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 cursor-pointer"
            >
              <span>🛡️ เลือกเข้าสู่ระบบด่วนตามบทบาท (Auditor & Executive Roles):</span>
              {showQuickLogin ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showQuickLogin && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {(() => {
                  const allowedUsernames = ['admin', 'mayor', 'palat'];
                  const sorted = [...availableUsers]
                    .filter((u) => 
                      allowedUsernames.includes(u.username) || 
                      u.role === 'admin' || 
                      u.role === 'executive' || 
                      u.role === 'auditor' ||
                      u.department?.includes('ตรวจสอบ')
                    )
                    .sort((a, b) => {
                      const order = { admin: 1, mayor: 2, palat: 3 };
                      return (order[a.username] || 99) - (order[b.username] || 99);
                    });
                  return sorted.map((u) => {
                    const isSelected = Boolean(username && u.username && username.toLowerCase() === u.username.toLowerCase());
                    const isMayor = u.username === 'mayor' || (u.role === 'executive' && u.username !== 'palat') || u.displayName?.includes('ผู้บริหาร') || u.displayName?.includes('นายก');
                    const isPalat = u.username === 'palat' || (u.displayName?.includes('ปลัด') && !u.displayName?.includes('สำนัก'));
                    const isAdmin = u.role === 'admin' || u.username === 'admin' || u.department?.includes('ตรวจสอบ');

                    let icon = '🛡️';
                    let displayTitle = u.displayName || u.username;
                    if (isMayor) {
                      icon = '👑';
                      displayTitle = 'ผู้บริหาร อปท.';
                    } else if (isPalat) {
                      icon = '🏛️';
                      displayTitle = 'ปลัด อปท.';
                    } else if (isAdmin) {
                      icon = '👑';
                      displayTitle = 'ผู้ตรวจสอบภายใน';
                    }

                    return (
                      <button
                        key={u.username}
                        type="button"
                        onClick={() => handleQuickSelect(u)}
                        className={`text-left p-2 rounded-lg border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500/30'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{icon}</span>
                          <span className="truncate font-bold">
                            {displayTitle}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          @{u.username}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Onboarding New Local Gov SaaS */}
          {onOpenOnboarding && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>ยังไม่มีระบบ อปท.? ตั้งค่าหน่วยงานใหม่ (Free Trial 30 วัน)</span>
              </button>
            </div>
          )}

          {/* Register New Account Action */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">เป็นเจ้าหน้าที่ในสังกัด อปท. นี้?</span>
            <button
              type="button"
              onClick={() => {
                setRegError('');
                setRegSuccess('');
                setShowRegisterModal(true);
              }}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>ลงทะเบียนขอสิทธิ์ใช้งาน</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          มาตรฐานระบบงานตรวจสอบภายในองค์กรปกครองส่วนท้องถิ่น
        </div>
      </div>

      {/* =========================================================================
          REGISTRATION MODAL: บุคลากรใหม่ขอสิทธิ์เข้าใช้งาน
      ========================================================================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8 relative animate-scale-up">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ลงทะเบียนขอสิทธิ์เข้าใช้งานระบบ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สำหรับบุคลากร เจ้าหน้าที่ และหัวหน้าส่วนราชการ อปท. (คำขอจะถูกส่งให้ ADMIN อนุมัติ)
              </p>
            </div>

            {regSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">ส่งคำขอลงทะเบียนเรียบร้อยแล้ว</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-4">
                    {regSuccess}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                {regError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อผู้ใช้เข้าระบบ (Username) <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                      placeholder="เช่น somchai_j (ภาษาอังกฤษ)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      อีเมล (สำหรับแจ้งเตือน) :
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="somchai@example.go.th"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      รหัสผ่าน (Password) <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="กำหนดรหัสผ่านอย่างน้อย 4 ตัว"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      องค์กรปกครองส่วนท้องถิ่น (อปท.) / หน่วยงานที่สังกัด <span className="text-rose-500">*</span>:
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        list="login-org-options"
                        value={regOrganization}
                        onChange={(e) => setRegOrganization(e.target.value)}
                        placeholder="พิมพ์หรือเลือกชื่อ อปท. เช่น องค์การบริหารส่วนตำบล..., เทศบาลตำบล..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                      <datalist id="login-org-options">
                        <option value="องค์การบริหารส่วนตำบลต้นแบบ" />
                        <option value="เทศบาลตำบลเมืองทอง" />
                        <option value="เทศบาลนครสุรนารี" />
                        <option value="องค์การบริหารส่วนจังหวัด" />
                      </datalist>
                    </div>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                      💡 ชื่อหน่วยงานนี้จะถูกเชื่อมโยงเป็นชื่อ อปท. หลักของระบบ และแสดงในเอกสาร/รายงานการตรวจสอบทันที
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      กลุ่มงาน / หน่วยงานตรวจสอบ:
                    </label>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="เช่น หน่วยตรวจสอบภายใน"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ตำแหน่งในองค์กร:
                    </label>
                    <input
                      type="text"
                      value={regPosition}
                      onChange={(e) => setRegPosition(e.target.value)}
                      placeholder="เช่น นักวิชาการตรวจสอบภายในปฏิบัติการ"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      บทบาทที่ขอเปิดสิทธิ์ใช้งาน:
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
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
                    onClick={() => setShowRegisterModal(false)}
                    className="flex-1 py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer text-center"
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
