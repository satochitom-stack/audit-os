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
  UserPlus,
  Check,
  CheckCircle2,
  Phone,
  MapPin,
  CreditCard,
  Award,
  Clock,
  ShieldCheck,
  HelpCircle,
  X
} from 'lucide-react';
import {
  verifyLogin,
  startSession,
  getLastUsername,
  setLastUsername,
  registerUser,
  MEMBERSHIP_PLANS,
  getSystemSettings
} from '../utils/auth';

export default function LoginView({ onLogin, orgProfile, onBackToWelcome }) {
  const [username, setUsername] = useState(() => getLastUsername() || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordInputRef = useRef(null);

  // System settings for bank and pricing info
  const settings = getSystemSettings();

  // Registration Modal States
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPosition, setRegPosition] = useState('นักวิชาการตรวจสอบภายในชำนาญการ');
  const [regOrganization, setRegOrganization] = useState('');
  const [regProvince, setRegProvince] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPlan, setRegPlan] = useState('annual');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regBusy, setRegBusy] = useState(false);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setBusy(true);
    try {
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
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      setBusy(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regDisplayName.trim() || !regOrganization.trim() || !regUsername.trim() || !regPassword) {
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
        position: regPosition.trim() || 'นักวิชาการตรวจสอบภายใน',
        organization: regOrganization.trim(),
        province: regProvince.trim(),
        phone: regPhone.trim(),
        username: regUsername.trim(),
        password: regPassword,
        plan: 'trial'
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

  return (
    <div className="min-h-screen w-full bg-[#171b23] text-stone-200 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-700/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Logo and Brand Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-stone-800 via-stone-700 to-amber-700 text-amber-200 shadow-xl shadow-amber-950/40 mb-2 border border-amber-600/30">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-stone-100 flex items-center justify-center space-x-2">
            <span>Audit-OS</span>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold">
              อปท.
            </span>
          </h1>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            แพลตฟอร์มบริหารงานตรวจสอบภายใน สำหรับตำแหน่งผู้ตรวจสอบภายใน อปท. ทั่วประเทศ (กระบวนการครบวงจร 12 ขั้นตอน)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1f2633]/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-stone-700/80 shadow-2xl space-y-5 text-stone-200">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin หรือ auditor"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#2b3545] border border-stone-600/80 rounded-xl text-xs text-amber-50 placeholder-stone-400 focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#2b3545] border border-stone-600/80 rounded-xl text-xs text-amber-50 placeholder-stone-400 focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-amber-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-stone-400 hover:text-stone-200">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-stone-600 bg-[#2b3545] text-amber-600 focus:ring-amber-500"
                />
                <span>จดจำการเข้าสู่ระบบ</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-r from-amber-600 via-amber-700 to-stone-800 hover:from-amber-500 hover:to-stone-700 text-amber-50 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 text-amber-200" />
              <span>{busy ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
            </button>
          </form>

          {/* Register Button & Back to Home */}
          <div className="pt-3 border-t border-stone-700/60 flex flex-col items-center space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setShowRegisterModal(true);
                setRegError('');
                setRegSuccess('');
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center space-x-1.5 cursor-pointer hover:underline"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>สมัครสมาชิกใหม่ (สำหรับผู้ตรวจสอบภายใน อปท.)</span>
            </button>

            {onBackToWelcome && (
              <button
                type="button"
                onClick={onBackToWelcome}
                className="text-xs text-stone-400 hover:text-amber-200 inline-flex items-center space-x-1 cursor-pointer transition-colors pt-1"
              >
                <span>🏠 กลับสู่หน้าแรก (ภาพรวมระบบ)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1c222d] text-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-stone-700 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-stone-700/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-stone-100 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>สมัครสมาชิกเปิดใช้งานระบบ Audit-OS</span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  สำหรับผู้ตรวจสอบภายใน อปท. (เปิดใช้งานทันที ฟรี 30 วัน ไม่ต้องรออนุมัติ)
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {regError}
              </div>
            )}

            {regSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ส่งคำขอสำเร็จ!</span>
                </div>
                <div>{regSuccess}</div>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="mt-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </div>
            )}

            {!regSuccess && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">
                    ชื่อ - สกุล ผู้ตรวจสอบภายใน *
                  </label>
                  <input
                    type="text"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="เช่น นายสมคิด สุจริตธรรม"
                    className="w-full p-2.5 rounded-xl border border-stone-600/80 bg-[#2b3545] text-amber-50 placeholder-stone-400 focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-300 mb-1">
                      องค์กรปกครองส่วนท้องถิ่น (อปท.) *
                    </label>
                    <input
                      type="text"
                      value={regOrganization}
                      onChange={(e) => setRegOrganization(e.target.value)}
                      placeholder="เช่น อบต.ฝางคำ, เทศบาลตำบล..."
                      className="w-full p-2.5 rounded-xl border border-stone-600/80 bg-[#2b3545] text-amber-50 placeholder-stone-400 font-bold focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-300 mb-1">จังหวัด *</label>
                    <input
                      type="text"
                      value={regProvince}
                      onChange={(e) => setRegProvince(e.target.value)}
                      placeholder="เช่น อุบลราชธานี, เชียงใหม่"
                      className="w-full p-2.5 rounded-xl border border-stone-600/80 bg-[#2b3545] text-amber-50 placeholder-stone-400 focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-300 mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={regPosition}
                      onChange={(e) => setRegPosition(e.target.value)}
                      placeholder="นักวิชาการตรวจสอบภายในชำนาญการ"
                      className="w-full p-2 rounded-xl border border-stone-600/80 bg-[#2b3545] text-amber-50 placeholder-stone-400 focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-300 mb-1">
                      เบอร์โทรศัพท์ / LINE ID *
                    </label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="081-234-5678"
                      className="w-full p-2 rounded-xl border border-stone-600/80 bg-[#2b3545] text-amber-50 placeholder-stone-400 focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-700/80">
                  <div>
                    <label className="block font-semibold text-stone-300 mb-1">
                      ชื่อผู้ใช้ที่ต้องการ (Username) *
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="เช่น somkid_ia"
                      className="w-full p-2 rounded-xl border border-stone-600/80 bg-[#2b3545] font-mono text-amber-50 placeholder-stone-400 font-bold focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-300 mb-1">รหัสผ่าน *</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="อย่างน้อย 4 ตัวอักษร"
                      className="w-full p-2 rounded-xl border border-stone-600/80 bg-[#2b3545] text-amber-50 placeholder-stone-400 focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">ยืนยันรหัสผ่าน *</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                    className="w-full p-2 rounded-xl border border-stone-600/80 bg-[#2b3545] text-amber-50 placeholder-stone-400 focus:bg-[#323d4f] focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
                    required
                  />
                </div>

                {/* Membership Plan Choice */}
                <div className="pt-2 border-t border-stone-700/80 space-y-2">
                  <label className="block font-semibold text-stone-300">
                    เลือกแพ็กเกจสมาชิกที่ต้องการสมัคร
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {Object.values(MEMBERSHIP_PLANS)
                      .filter((p) => p.id !== 'lifetime')
                      .map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setRegPlan(p.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            regPlan === p.id
                              ? 'bg-amber-600/25 border-amber-500 text-white ring-2 ring-amber-500/50 shadow-md'
                              : 'bg-[#2b3545]/70 border-stone-600/80 text-stone-400 hover:border-stone-500'
                          }`}
                        >
                          <div className="font-bold text-xs text-stone-100 flex items-center space-x-1">
                            <span>{p.id === 'trial' ? '🌱' : p.id === 'monthly' ? '⭐' : '👑'}</span>
                            <span>{p.name}</span>
                          </div>
                          <div className="text-xs font-black text-amber-400 mt-1">{p.priceLabel}</div>
                          <div className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{p.description}</div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Banking info & PromptPay QR for paid plans */}
                {regPlan !== 'trial' && (
                  <div className="bg-[#242c38] p-4 rounded-2xl border border-stone-700/80 text-xs text-stone-300 space-y-3">
                    <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>ข้อมูลช่องทางการชำระเงินค่าสมาชิก:</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {settings.qrCodeImage && (
                        <div className="w-28 h-28 bg-white p-1 rounded-xl shrink-0 shadow-md">
                          <img
                            src={settings.qrCodeImage}
                            alt="PromptPay QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="space-y-1 flex-1 text-[11px]">
                        <div>พร้อมเพย์ (PromptPay): <strong className="font-mono text-amber-200 font-bold text-xs">{settings.promptPayNo || '0619614953'}</strong></div>
                        <div>ชื่อบัญชี: <strong className="text-white">{settings.bankAccountName || 'นายทุมมงคล ธรรมพิทักษ์'}</strong></div>
                        <div className="text-stone-400">ธนาคาร: {settings.bankName || 'ธนาคารกสิกรไทย / กรุงไทย'}</div>
                        <div className="text-[10px] text-amber-300/80 pt-1">
                          * สามารถสแกนชำระเงินผ่าน Mobile Banking ทุกธนาคาร แล้วส่งสลิปเพื่อเปิดแพ็กเกจทันที
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-700/80 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={regBusy}
                    className="bg-gradient-to-r from-amber-600 via-amber-700 to-stone-800 hover:from-amber-500 hover:to-stone-700 text-amber-50 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {regBusy ? 'กำลังสร้างบัญชี...' : 'เปิดใช้งาน & ทดลองใช้ฟรี 30 วัน'}
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
