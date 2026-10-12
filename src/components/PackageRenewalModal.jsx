import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  Send,
  Lock,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { getMembershipPlans, getSubscriptionCountdown, checkUserSubscription } from '../utils/auth';
import { addFeedback } from '../utils/feedbackUtils';

export default function PackageRenewalModal({
  isOpen,
  onClose,
  session,
  settings = {},
  onOpenFeedback
}) {
  if (!isOpen) return null;

  const isAdmin = session?.role === 'admin';
  const plans = getMembershipPlans(settings);
  const currentPlanKey = session?.plan || 'trial';
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    return currentPlanKey === 'trial' ? 'annual' : currentPlanKey;
  });
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [transferSlipNote, setTransferSlipNote] = useState('');

  const countdown = getSubscriptionCountdown(session);
  const subStatus = checkUserSubscription(session);
  const selectedPlan = plans[selectedPlanId] || plans.annual;

  const handleCopyPromptPay = () => {
    const num = settings.promptPayNo || '0619614953';
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendRenewalRequest = () => {
    if (!session) return;
    setSubmitting(true);
    try {
      const subject = `ขอต่ออายุสมาชิกแพ็กเกจ ${selectedPlan.name} (ผู้ใช้: @${session.username})`;
      const details = `ผู้ใช้งาน @${session.username} (${session.displayName || session.username} - ${session.organization || 'อปท.'}) มีความประสงค์ต่ออายุ/สมัครสมาชิกแพ็กเกจ: ${selectedPlan.name} (ราคา: ${selectedPlan.priceLabel})\n\nบันทึกเพิ่มเติมจากผู้ใช้: ${transferSlipNote || 'โอนชำระเงินเรียบร้อยแล้ว รบกวน Admin ตรวจสอบและอัปเดตสิทธิ์ครับ'}`;
      
      addFeedback({
        title: subject,
        description: details,
        category: 'renewal',
        priority: 'urgent',
        expectedBenefit: `ต่ออายุการใช้งานแพ็กเกจ ${selectedPlan.name} เพื่อปฏิบัติงานตรวจสอบภายในอย่างต่อเนื่อง`,
        session,
        orgProfile: { name: session.organization || 'อปท.' }
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        if (onClose) onClose();
      }, 3000);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#1f2430] border border-stone-200 dark:border-stone-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-amber-600/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-100 flex items-center gap-2">
                <span>แพ็กเกจสมาชิก & การต่ออายุการใช้งาน</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                  SaaS Local Gov
                </span>
              </h3>
              <p className="text-xs text-stone-300">
                เลือกแพ็กเกจที่เหมาะสมกับหน่วยงานของคุณ เพื่อปลดล็อกการปฏิบัติงานตรวจสอบภายในเต็มรูปแบบ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {/* Current User Status Banner */}
          {!isAdmin && session && (
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{session.organization || 'อปท.'} • {session.displayName || session.username}</span>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  แพ็กเกจปัจจุบัน: <strong className="text-amber-800 dark:text-amber-400">{countdown.planLabel}</strong>
                  {countdown.expiryDate && (
                    <span> • หมดอายุ: {countdown.expiryText}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  subStatus.expired
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-amber-300'
                }`}>
                  <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                  <span>คงเหลือ {countdown.shortText || countdown.text}</span>
                </span>
              </div>
            </div>
          )}

          {/* 1. กรอบรายละเอียดสิทธิประโยชน์ส่วนกลางแค่ 1 กรอบด้านบน (ตามข้อกำหนดของผู้ใช้) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-stone-50 to-amber-50/50 dark:from-amber-950/30 dark:via-stone-850 dark:to-stone-800 border border-amber-300/80 dark:border-amber-800/60 text-xs">
            <div className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 mb-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>รายละเอียดและสิทธิประโยชน์ระบบมาตรฐาน (รวมทุกแพ็กเกจ)</span>
            </div>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
              {settings.systemBenefits ||
                'ระบบตรวจสอบภายใน อปท. (Audit-OS) ปลดล็อกฟังก์ชันครบวงจร 11 ขั้นตอน: การประเมินความเสี่ยง SOFCK, แผนตรวจสอบระยะยาว 3 ปี, แผนการตรวจสอบประจำปี, แผนการปฏิบัติงานรายโครงการ, การประชุมเปิด-ปิดตรวจ, กระดาษทำการตรวจสอบ, รายงานผล 5 องค์ประกอบ, ทะเบียนคุมติดตามผล 30/60 วัน, คณะกรรมการตรวจสอบ (Audit Committee), การควบคุมภายใน (แบบ ปค. 1, 4, 5, 6), การบริหารความเสี่ยง (แบบ บส. 1 - 5), คลังเอกสารระเบียบปฏิบัติ และเครื่องมือคำนวณ Factor F/ค่าปรับ'}
            </p>
            <div className="mt-2.5 pt-2 border-t border-amber-200/80 dark:border-amber-800/40 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>ปลดล็อก 11 กระบวนการตรวจ</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>คลังระเบียบ & หนังสือสั่งการ สถ.</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>ระบบควบคุมภายใน ปค. 1-6</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>บริหารความเสี่ยง บส. 1-5</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>คำนวณ Factor F & ค่าปรับ</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>ระบบสำรองข้อมูล Multi-tenant</span>
              </div>
            </div>
          </div>

          {/* 2. รายการแพ็กเกจ เรียงต่อลงมา โดยไม่ต้องมีกรอบรายละเอียดซ้ำอีก (ตามข้อกำหนดของผู้ใช้) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              เลือกแพ็กเกจที่ต้องการสมัครหรือต่ออายุ:
            </label>
            <div className="space-y-2">
              {/* แพ็กเกจ 1: ฟรี 30 วัน */}
              <label
                onClick={() => setSelectedPlanId('trial')}
                className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedPlanId === 'trial'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/40 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-850'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="renewal_plan"
                    checked={selectedPlanId === 'trial'}
                    onChange={() => setSelectedPlanId('trial')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <span>🌱 {plans.trial.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-semibold">
                        สำหรับผู้เริ่มต้น
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      ทดลองใช้งานฟรี {settings.trialDays || 30} วัน
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">ฟรี ฿0</span>
                </div>
              </label>

              {/* แพ็กเกจ 2: รายเดือน VIP */}
              <label
                onClick={() => setSelectedPlanId('monthly')}
                className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedPlanId === 'monthly'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/40 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-850'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="renewal_plan"
                    checked={selectedPlanId === 'monthly'}
                    onChange={() => setSelectedPlanId('monthly')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <span>⭐ {plans.monthly.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                        30 วัน
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      ปฏิบัติงานต่อเนื่อง ปลดล็อกทุกกระดาษทำการ
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-indigo-700 dark:text-indigo-400">{plans.monthly.priceLabel}</span>
                </div>
              </label>

              {/* แพ็กเกจ 3: รายปี PREMIUM (แนะนำ คุ้มค่าที่สุด) */}
              <label
                onClick={() => setSelectedPlanId('annual')}
                className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedPlanId === 'annual'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/40 shadow-md'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-850'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="renewal_plan"
                    checked={selectedPlanId === 'annual'}
                    onChange={() => setSelectedPlanId('annual')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <span>👑 {plans.annual.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black shadow-2xs">
                        ⭐ แนะนำ คุ้มค่าที่สุด
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      ใช้งานตลอด 365 วัน พร้อมคลังระเบียบทอง 2569
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-amber-700 dark:text-amber-400">{plans.annual.priceLabel}</span>
                </div>
              </label>

              {/* แพ็กเกจ 4: ตลอดชีพ LIFETIME VIP */}
              <label
                onClick={() => setSelectedPlanId('lifetime')}
                className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedPlanId === 'lifetime'
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/40 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-850'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="renewal_plan"
                    checked={selectedPlanId === 'lifetime'}
                    onChange={() => setSelectedPlanId('lifetime')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <span>💎 {plans.lifetime.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                        ตลอดชีพ
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      ปลดล็อกถาวร ไม่จำกัดวันหมดอายุ ดูแลระยะยาว
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-purple-700 dark:text-purple-400">{plans.lifetime.priceLabel}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Payment & PromptPay Information (สำหรับแพ็กเกจที่ชำระเงิน) */}
          {selectedPlanId !== 'trial' && (
            <div className="p-4 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>ข้อมูลชำระเงิน: {selectedPlan.name} ({selectedPlan.priceLabel})</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ฿{Number(selectedPlan.price || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {settings.qrCodeImage ? (
                  <div className="w-32 h-32 bg-white p-1.5 rounded-2xl shrink-0 shadow-md">
                    <img
                      src={settings.qrCodeImage}
                      alt="PromptPay QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-stone-800 rounded-2xl border border-stone-700 flex flex-col items-center justify-center p-2 text-center text-stone-400 shrink-0">
                    <CreditCard className="w-6 h-6 mb-1 text-amber-400" />
                    <span className="text-[10px]">สแกนผ่าน Mobile Banking</span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs flex-1 w-full">
                  <div className="flex items-center justify-between bg-stone-800/80 p-2 rounded-xl border border-stone-700/80">
                    <span className="text-stone-400 text-[11px]">พร้อมเพย์ (PromptPay):</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono text-amber-300 font-bold text-sm tracking-wide">
                        {settings.promptPayNo || '0619614953'}
                      </strong>
                      <button
                        type="button"
                        onClick={handleCopyPromptPay}
                        className="px-1.5 py-0.5 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 hover:text-white text-[10px] flex items-center gap-0.5 cursor-pointer"
                        title="คัดลอกเลขพร้อมเพย์"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-300 space-y-0.5 px-1">
                    <div>ชื่อบัญชี: <strong className="text-white">{settings.bankAccountName || 'นายทุมมงคล ธรรมพิทักษ์'}</strong></div>
                    <div className="text-stone-400">ธนาคาร: {settings.bankName || 'ธนาคารกสิกรไทย / กรุงไทย'}</div>
                  </div>

                  <div className="pt-1">
                    <input
                      type="text"
                      value={transferSlipNote}
                      onChange={(e) => setTransferSlipNote(e.target.value)}
                      placeholder="ระบุวันเวลาที่โอน หรือหมายเลขอ้างอิงสลิป..."
                      className="w-full p-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Submit */}
          {submitSuccess ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ส่งข้อมูลแจ้งขอต่ออายุถึง ADMIN เรียบร้อยแล้ว! แอดมินจะดำเนินการเปิดสิทธิ์ให้ท่านโดยเร็วที่สุด</span>
            </div>
          ) : (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800">
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                {selectedPlanId === 'trial'
                  ? 'สิทธิ์ทดลองใช้งานจะเริ่มนับถอยหลังทันที 30 วัน'
                  : '* เมื่อชำระเงินแล้วกดปุ่มด้านขวาเพื่อส่งข้อมูลถึง Admin ทันที'}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSendRenewalRequest}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-stone-950 font-black text-xs shadow-md shadow-amber-950/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>กำลังส่งข้อมูล...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>แจ้งต่ออายุถึง ADMIN 📤</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
