import React, { useState } from 'react';
import {
  Building2,
  Shield,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Layers,
  MapPin,
  Calendar,
  Check,
  HelpCircle,
  Award
} from 'lucide-react';

const THAI_PROVINCES = [
  'อุบลราชธานี', 'กรุงเทพมหานคร', 'ขอนแก่น', 'เชียงใหม่', 'นครราชสีมา',
  'สงขลา', 'อุดรธานี', 'สุราษฎร์ธานี', 'ชลบุรี', 'นนทบุรี',
  'สมุทรปราการ', 'ปทุมธานี', 'ศรีสะเกษ', 'ยโสธร', 'อำนาจเจริญ',
  'มุกดาหาร', 'ร้อยเอ็ด', 'มหาสารคาม', 'กาฬสินธุ์', 'สกลนคร',
  'นครพนม', 'บุรีรัมย์', 'สุรินทร์', 'ชัยภูมิ', 'เลย',
  'หนองคาย', 'บึงกาฬ', 'หนองบัวลำภู', 'พิษณุโลก', 'นครสวรรค์',
  'เชียงราย', 'ลำปาง', 'ลำพูน', 'แพร่', 'น่าน',
  'พะเยา', 'แม่ฮ่องสอน', 'อุตรดิตถ์', 'สุโขทัย', 'ตาก',
  'กำแพงเพชร', 'พิจิตร', 'เพชรบูรณ์', 'อุทัยธานี', 'พระนครศรีอยุธยา',
  'อ่างทอง', 'ลพบุรี', 'สิงห์บุรี', 'ชัยนาท', 'สระบุรี',
  'นครนายก', 'ปราจีนบุรี', 'สระแก้ว', 'ฉะเชิงเทรา', 'จันทบุรี',
  'ตราด', 'ระยอง', 'ราชบุรี', 'กาญจนบุรี', 'สุพรรณบุรี',
  'นครปฐม', 'สมุทรสาคร', 'สมุทรสงคราม', 'เพชรบุรี', 'ประจวบคีรีขันธ์',
  'นครศรีธรรมราช', 'กระบี่', 'พังงา', 'ภูเก็ต', 'ระนอง',
  'ชุมพร', 'ตรัง', 'พัทลุง', 'สตูล', 'ปัตตานี',
  'ยะลา', 'นราธิวาส'
];

const ORG_TYPES = [
  'องค์การบริหารส่วนตำบล',
  'เทศบาลตำบล',
  'เทศบาลเมือง',
  'เทศบาลนคร',
  'องค์การบริหารส่วนจังหวัด'
];

export default function OnboardingModal({
  isOpen,
  initialData = {},
  onComplete,
  onCancel
}) {
  const [step, setStep] = useState(1); // 1: Org Info, 2: Personnel, 3: Plan & Confirmation
  
  const [form, setForm] = useState({
    orgType: initialData.orgType || 'องค์การบริหารส่วนตำบล',
    name: initialData.name || '',
    district: initialData.district || '',
    province: initialData.province || 'อุบลราชธานี',
    fiscalYear: initialData.fiscalYear || '2569',
    agencyName: initialData.agencyName || 'หน่วยตรวจสอบภายใน',
    auditorName: initialData.auditorName || '',
    auditorPosition: initialData.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ',
    approverName: initialData.approverName || '',
    approverPosition: initialData.approverPosition || 'นายกองค์การบริหารส่วนตำบล',
    palatName: initialData.palatName || '',
    palatPosition: initialData.palatPosition || 'ปลัดองค์การบริหารส่วนตำบล'
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto-fill positions when orgType changes
  const handleOrgTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      orgType: type,
      approverPosition: prev.approverPosition.includes('นายก') ? `นายก${type}` : prev.approverPosition,
      palatPosition: prev.palatPosition.includes('ปลัด') ? `ปลัด${type}` : prev.palatPosition
    }));
  };

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (step === 1) {
      if (!form.name.trim()) {
        setError('กรุณาระบุชื่อองค์กรปกครองส่วนท้องถิ่น (อปท.)');
        return;
      }
      if (!form.province) {
        setError('กรุณาเลือกจังหวัด');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.auditorName.trim()) {
        setError('กรุณาระบุชื่อ-นามสกุล ผู้ตรวจสอบภายใน');
        return;
      }
      setStep(3);
    }
  };

  const handleFinalSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await onComplete(form);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm shadow-inner">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Audit-OS Onboarding</span>
                </div>
                <h2 className="text-2xl font-bold">ตั้งค่าหน่วยงาน อปท. เครือข่าย</h2>
                <p className="text-emerald-100 text-sm mt-0.5">
                  เริ่มต้นกำหนดอัตลักษณ์หน่วยงานและเชื่อมต่อระบบ Multi-Tenant
                </p>
              </div>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
            <div className={`flex items-center space-x-2 text-xs font-medium ${step >= 1 ? 'text-white' : 'text-emerald-200/60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-white text-emerald-700' : 'bg-white/20 text-white'}`}>
                1
              </span>
              <span>ข้อมูล อปท.</span>
            </div>
            <div className="h-0.5 w-12 bg-white/30" />
            <div className={`flex items-center space-x-2 text-xs font-medium ${step >= 2 ? 'text-white' : 'text-emerald-200/60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-white text-emerald-700' : 'bg-white/20 text-white'}`}>
                2
              </span>
              <span>ผู้บริหารและผู้ตรวจ</span>
            </div>
            <div className="h-0.5 w-12 bg-white/30" />
            <div className={`flex items-center space-x-2 text-xs font-medium ${step >= 3 ? 'text-white' : 'text-emerald-200/60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step >= 3 ? 'bg-white text-emerald-700' : 'bg-white/20 text-white'}`}>
                3
              </span>
              <span>ยืนยันและเริ่มใช้งาน</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Organization Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>ขั้นตอนที่ 1: ข้อมูลองค์กรปกครองส่วนท้องถิ่น</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ระบุชื่อและที่ตั้งของ อปท. เพื่อให้ระบบจัดทำแบบฟอร์ม บส.1-5, ปค.1-5 และหัวกระดาษตรวจสอบอัตโนมัติ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ประเภทองค์กรปกครองส่วนท้องถิ่น *
                  </label>
                  <select
                    value={form.orgType}
                    onChange={(e) => handleOrgTypeChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ปีงบประมาณเริ่มต้น *
                  </label>
                  <select
                    value={form.fiscalYear}
                    onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="2569">ปีงบประมาณ พ.ศ. 2569</option>
                    <option value="2570">ปีงบประมาณ พ.ศ. 2570</option>
                    <option value="2571">ปีงบประมาณ พ.ศ. 2571</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ชื่อหน่วยงาน อปท. เต็ม * (เช่น {form.orgType}ดอนมดแดง หรือ {form.orgType}วารินชำราบ)
                </label>
                <input
                  type="text"
                  placeholder={`เช่น ${form.orgType}...`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    อำเภอ (เช่น อำเภอเมือง, อำเภอสิรินธร)
                  </label>
                  <input
                    type="text"
                    placeholder="อำเภอ..."
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    จังหวัด *
                  </label>
                  <select
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    {THAI_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>ระบบเครือข่าย SaaS:</strong> ข้อมูลนี้จะแยกพื้นที่จัดเก็บ (Multi-Tenant Isolated) เฉพาะ อปท. ของท่านอย่างปลอดภัย และเปิดใช้งานโมดูลมาตรฐานระเบียบ ว 3482 อัตโนมัติ
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Personnel & Signatories */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>ขั้นตอนที่ 2: ข้อมูลผู้บริหารและผู้ตรวจสอบภายใน</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ใช้สำหรับการลงนามท้ายรายงาน, กฎบัตรการตรวจสอบ, และการมอบหมายสิทธิ์
                </p>
              </div>

              {/* Auditor Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>ผู้ตรวจสอบภายใน (ผู้รับผิดชอบหลัก)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      ชื่อ-นามสกุล ผู้ตรวจสอบ *
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น นาย/นาง/นางสาว..."
                      value={form.auditorName}
                      onChange={(e) => setForm({ ...form, auditorName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      ตำแหน่งทางวิชาการ/สายงาน
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น นักวิชาการตรวจสอบภายในปฏิบัติการ"
                      value={form.auditorPosition}
                      onChange={(e) => setForm({ ...form, auditorPosition: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Executives Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mayor */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ผู้บริหารสูงสุด (นายก อปท.)
                  </span>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ชื่อ-นามสกุล นายก</label>
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล..."
                      value={form.approverName}
                      onChange={(e) => setForm({ ...form, approverName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={form.approverPosition}
                      onChange={(e) => setForm({ ...form, approverPosition: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Palat */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ปลัดองค์กรปกครองส่วนท้องถิ่น
                  </span>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ชื่อ-นามสกุล ปลัด</label>
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล..."
                      value={form.palatName}
                      onChange={(e) => setForm({ ...form, palatName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={form.palatPosition}
                      onChange={(e) => setForm({ ...form, palatPosition: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmation and Plan Info */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>ขั้นตอนที่ 3: สรุปข้อมูลและสิทธิประโยชน์เครือข่าย</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ตรวจสอบความถูกต้องก่อนเริ่มใช้งานระบบ
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-5 bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:from-slate-800/50 dark:to-emerald-950/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 space-y-3">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">หน่วยงาน อปท.</span>
                    <strong className="text-slate-800 dark:text-slate-200">{form.name}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">ที่ตั้ง</span>
                    <strong className="text-slate-800 dark:text-slate-200">{form.district || '-'} จ.{form.province}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">ผู้ตรวจสอบภายใน</span>
                    <strong className="text-slate-800 dark:text-slate-200">{form.auditorName}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">ปีงบประมาณ</span>
                    <strong className="text-slate-800 dark:text-slate-200">พ.ศ. {form.fiscalYear}</strong>
                  </div>
                </div>
              </div>

              {/* SaaS Plan Feature Highlights */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Award className="w-4 h-4" />
                    <span>Audit-OS Network Package</span>
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-semibold">
                    Free Trial 30 วัน
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>ระบบบริหารความเสี่ยง ว 3482 (บส. 1 - 5)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>ส่งออก Word / PDF / Excel ตรงตามแบบแผน</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>คลังระเบียบ กฎหมาย และคู่มือผู้ตรวจ (15 MB)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>อัตราค่าบริการ 70 บ./ด. หรือ 700 บ./ปี</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                disabled={submitting}
              >
                ย้อนกลับ
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                ข้ามไปก่อน
              </button>
            ) : (
              <div />
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm inline-flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>ถัดไป</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm inline-flex items-center space-x-2 shadow-xl shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังบันทึกและเชื่อมต่อระบบ...</span>
                  </>
                ) : (
                  <>
                    <span>เริ่มใช้งาน Audit-OS ทันที</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
