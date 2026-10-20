import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  User,
  Calendar,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import {
  buildLegacyRecoveryBundle,
  getLegacyRecoveryStatus,
  LEGACY_RECOVERY_BASE_KEYS
} from '../utils/tenantStorageUtils.js';

const LEGACY_MODULE_LABELS = {
  ia_org_profile: 'โปรไฟล์หน่วยงาน',
  ia_annual_plans_by_year: 'แผนตรวจสอบประจำปี',
  ia_working_papers_by_year: 'กระดาษทำการ',
  ia_risk_assessments_by_year: 'การประเมินความเสี่ยง',
  ia_internal_controls_by_year: 'การควบคุมภายใน',
  ia_risk_management_by_year: 'การบริหารความเสี่ยง',
  ia_lpa_indicators_by_year: 'ตัวชี้วัด LPA',
  ia_audit_charter_by_year: 'กฎบัตรการตรวจสอบ',
  ia_audit_universe_by_year: 'จักรวาลการตรวจสอบ',
  ia_engagement_plans_by_year: 'แผนการปฏิบัติงาน',
  ia_strategic_plan: 'แผนยุทธศาสตร์',
  ia_strategic_activities_v2: 'กิจกรรมแผนยุทธศาสตร์',
  ia_capa_findings_by_year: 'ข้อสังเกตและรายการติดตาม',
  ia_risk_feedback_linkages_by_year: 'ความเชื่อมโยงข้อสังเกตกับความเสี่ยง',
  ia_central_calendar_events: 'ปฏิทินกลาง',
  ia_dept_office_data: 'ข้อมูลสำนักปลัด',
  ia_dept_finance_data: 'ข้อมูลกองคลัง',
  ia_dept_tech_data: 'ข้อมูลกองช่าง',
  ia_dept_education_data: 'ข้อมูลกองการศึกษา',
  ia_dept_welfare_data: 'ข้อมูลกองสวัสดิการสังคม',
  ia_dept_public_health_data: 'ข้อมูลกองสาธารณสุข',
  ia_dept_cdc_charoen_data: 'ข้อมูลศูนย์พัฒนาเด็กเล็กเจริญ',
  ia_dept_cdc_fangthoeng_data: 'ข้อมูลศูนย์พัฒนาเด็กเล็กฝั่งเทิง',
  ia_executive_directives: 'ข้อสั่งการผู้บริหาร',
  ia_public_overview_data: 'ข้อมูลภาพรวมเผยแพร่',
  ia_annual_plans: 'แผนตรวจสอบประจำปีรูปแบบเดิม',
  ia_working_papers: 'กระดาษทำการรูปแบบเดิม',
  ia_risk_assessments: 'การประเมินความเสี่ยงรูปแบบเดิม',
  ia_internal_controls: 'การควบคุมภายในรูปแบบเดิม',
  ia_risk_management: 'การบริหารความเสี่ยงรูปแบบเดิม',
  ia_lpa_indicators: 'ตัวชี้วัด LPA รูปแบบเดิม',
  ia_audit_charter: 'กฎบัตรการตรวจสอบรูปแบบเดิม',
  ia_audit_universe: 'จักรวาลการตรวจสอบรูปแบบเดิม',
  ia_engagement_plans: 'แผนการปฏิบัติงานรูปแบบเดิม',
  ia_capa_findings: 'รายการติดตามรูปแบบเดิม',
  ia_risk_feedback_linkages: 'ข้อมูลเชื่อมโยงความเสี่ยงรูปแบบเดิม'
};

export default function ProfileSettingsModal({
  orgProfile,
  onSaveProfile,
  fiscalYears,
  onAddYear,
  onDeleteYear,
  onResetData,
  onExportBackup,
  onImportBackup,
  onRestoreSafetySnapshot,
  session,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'years', 'data'
  const [profileForm, setProfileForm] = useState({ ...orgProfile });
  const [newYearInput, setNewYearInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [legacyRecoveryStatus, setLegacyRecoveryStatus] = useState({});

  useEffect(() => {
    setLegacyRecoveryStatus(getLegacyRecoveryStatus(session));
  }, [session?.username, activeTab]);

  const awaitingLegacyRecovery = Object.entries(legacyRecoveryStatus).filter(
    ([baseKey, entry]) => entry?.status === 'awaiting_recovery' && LEGACY_RECOVERY_BASE_KEYS.includes(baseKey)
  );

  useEffect(() => {
    if (orgProfile) {
      setProfileForm((prev) => ({
        ...prev,
        ...orgProfile,
        name: orgProfile.name || prev.name || '',
        district: orgProfile.district || prev.district || '',
        province: orgProfile.province || prev.province || ''
      }));
    }
  }, [orgProfile]);

  // Reusable Elegant Confirm Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    cancelText: 'ยกเลิก',
    isAlert: false,
    type: 'danger',
    onConfirm: () => {}
  });

  const openConfirmModal = (config) => {
    setConfirmModalConfig({
      isOpen: true,
      title: config.title || 'ยืนยันการทำรายการ',
      message: config.message,
      confirmText: config.confirmText || 'ยืนยัน',
      cancelText: config.cancelText !== undefined ? config.cancelText : 'ยกเลิก',
      isAlert: config.isAlert || false,
      type: config.type || 'danger',
      onConfirm: config.onConfirm || (() => {})
    });
  };

  const closeConfirmModal = () => {
    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const finalForm = {
      ...profileForm,
      auditorName: profileForm.auditorName?.trim() || 'ผู้ตรวจสอบภายใน',
      name: profileForm.name?.trim() || 'องค์การบริหารส่วนตำบลต้นแบบ',
      district: profileForm.district?.trim() || '',
      province: profileForm.province?.trim() || ''
    };
    onSaveProfile(finalForm);
    setMessage('บันทึกข้อมูลหน่วยงาน อปท. และผู้ตรวจสอบเรียบร้อยแล้ว');
    setTimeout(() => setMessage(''), 2500);
  };

  const handleAddYearSubmit = (e) => {
    e.preventDefault();
    const yr = newYearInput.trim();
    if (!yr) return;
    if (fiscalYears.includes(yr)) {
      setError(`ปีงบประมาณ ${yr} มีอยู่ในระบบแล้ว`);
      return;
    }
    onAddYear(yr);
    setNewYearInput('');
    setMessage(`เพิ่มปีงบประมาณ พ.ศ. ${yr} เรียบร้อยแล้ว`);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const ok = await onImportBackup(json);
        if (ok !== false) {
          setMessage('นำเข้าข้อมูลสำรองสำเร็จ');
          setTimeout(() => setMessage(''), 2500);
        }
      } catch {
        setError('ไฟล์ JSON ไม่ถูกต้องหรือไม่สามารถอ่านได้');
      }
    };
    reader.readAsText(file);
  };

  const handleLegacyRecoveryExport = () => {
    const bundle = buildLegacyRecoveryBundle();
    if (Object.keys(bundle.entries).length === 0) {
      setError('ไม่พบข้อมูลเดิมที่ต้องเก็บรักษาในเบราว์เซอร์นี้');
      return;
    }

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit-OS_Legacy-Recovery-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('ส่งออกชุดเก็บรักษาข้อมูลเดิมแล้ว ไฟล์นี้ยังไม่ได้ย้ายข้อมูลเข้าบัญชีใด');
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ตั้งค่าระบบ & โปรไฟล์ผู้ตรวจสอบ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดชื่อผู้ตรวจสอบ หน่วยงาน อปท. และงวดปีงบประมาณ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 bg-slate-50/50 dark:bg-slate-850">
          <button
            onClick={() => { setActiveTab('profile'); setError(''); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ข้อมูลผู้ตรวจสอบและ อปท.
          </button>
          <button
            onClick={() => { setActiveTab('years'); setError(''); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'years'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            จัดการปีงบประมาณ ({fiscalYears.length})
          </button>
          <button
            onClick={() => { setActiveTab('data'); setError(''); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'data'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            จัดการข้อมูล & ล้างข้อมูลตัวอย่าง
          </button>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Profile Form */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-stone-700 dark:text-stone-300">
                <span className="font-bold text-amber-900 dark:text-amber-300">💡 แก้ไขชื่อ อปท., อำเภอ, จังหวัด และผู้ตรวจสอบได้ที่นี่:</span>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                  เมื่อบันทึกแล้ว ข้อมูลจะถูกอัปเดตไปที่หัวแถบระบบด้านบน, กระดาษทำการทุกขั้นตอน, รายงานผลการตรวจสอบ และระบบเชื่อมโยงข้อมูลโดยอัตโนมัติ
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    ชื่อ-นามสกุล ผู้ตรวจสอบภายใน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น นายสมชาย หมายมั่น"
                    value={profileForm.auditorName}
                    onChange={(e) => setProfileForm({ ...profileForm, auditorName: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    ตำแหน่งผู้ตรวจสอบภายใน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นักวิชาการตรวจสอบภายในชำนาญการ"
                    value={profileForm.auditorPosition}
                    onChange={(e) => setProfileForm({ ...profileForm, auditorPosition: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  ชื่อองค์กรปกครองส่วนท้องถิ่น (อปท.)
                </label>
                <input
                  type="text"
                  placeholder="เช่น องค์การบริหารส่วนตำบล... / เทศบาลตำบล..."
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">อำเภอ</label>
                  <input
                    type="text"
                    placeholder="เช่น อำเภอสิรินธร"
                    value={profileForm.district}
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">จังหวัด</label>
                  <input
                    type="text"
                    placeholder="เช่น จังหวัดอุบลราชธานี"
                    value={profileForm.province}
                    onChange={(e) => setProfileForm({ ...profileForm, province: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    ชื่อนายก อปท. (ผู้บริหารสูงสุด)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นายจรูญ ธรรมพิทักษ์"
                    value={profileForm.approverName}
                    onChange={(e) => setProfileForm({ ...profileForm, approverName: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    ชื่อปลัด อปท. (ผู้สอบทาน)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นายชาญชัย อักโข"
                    value={profileForm.palatName}
                    onChange={(e) => setProfileForm({ ...profileForm, palatName: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกข้อมูลโปรไฟล์</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Fiscal Years */}
          {activeTab === 'years' && (
            <div className="space-y-4 text-xs">
              <form onSubmit={handleAddYearSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="กรอกปีงบประมาณ พ.ศ. ใหม่ เช่น 2571"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มปีงบประมาณ</span>
                </button>
              </form>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {fiscalYears.map((yr) => (
                  <div
                    key={yr}
                    className="p-3 bg-white dark:bg-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        ปีงบประมาณ พ.ศ. {yr}
                      </span>
                    </div>
                    {fiscalYears.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          openConfirmModal({
                            title: 'ยืนยันการลบปีงบประมาณ',
                            message: `คุณต้องการลบปีงบประมาณ พ.ศ. ${yr} ออกจากระบบใช่หรือไม่?`,
                            confirmText: 'ลบปีงบประมาณนี้',
                            type: 'danger',
                            onConfirm: () => onDeleteYear(yr)
                          });
                        }}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                        title="ลบปีนี้ออกจากรายการ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Data Management & Clean Wipe */}
          {activeTab === 'data' && (
            <div className="space-y-4 text-xs">
              {awaitingLegacyRecovery.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4" />
                    <span>พบข้อมูลเก่าที่ยังไม่ผูกกับบัญชี (Legacy Recovery)</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    ระบบเก็บข้อมูลเดิมไว้โดยไม่ย้ายเข้าบัญชีอัตโนมัติ เพราะยังยืนยันเจ้าของข้อมูลไม่ได้ โปรดดาวน์โหลดไฟล์เก็บรักษาก่อนดำเนินการต่อ และเก็บไฟล์นี้ในที่ปลอดภัย
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                    {awaitingLegacyRecovery.map(([baseKey]) => (
                      <li key={baseKey}>{LEGACY_MODULE_LABELS[baseKey] || baseKey}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={handleLegacyRecoveryExport}
                    className="mt-1 bg-amber-700 hover:bg-amber-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดชุดเก็บรักษาข้อมูลเดิม</span>
                  </button>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                    ไฟล์นี้เป็นชุดเก็บรักษาเพื่อให้ตรวจสอบและกู้คืนภายหลัง ไม่ใช่ไฟล์สำรองมาตรฐาน และไม่ควรนำเข้าโดยตรง
                  </p>
                </div>
              )}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-rose-900 dark:text-rose-300">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>ล้างข้อมูลตัวอย่างทั้งหมด (Reset to Clean Blank State)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  ปุ่มนี้จะล้างข้อมูลโครงการตัวอย่าง, ฎีกาสุ่มตรวจตัวอย่าง, และข้อตรวจพบตัวอย่างจากไดรฟ์ D ออกทั้งหมด เพื่อให้คุณเริ่มต้นกรอกข้อมูลงานจริงของ อปท. ของคุณได้อย่างสะอาดและโปร่งใส 100%
                </p>
                <button
                  type="button"
                  onClick={() => {
                    openConfirmModal({
                      title: 'ยืนยันการล้างข้อมูลตัวอย่าง',
                      message: 'คุณต้องการล้างข้อมูลโครงการตัวอย่างและข้อตรวจพบทั้งหมด เพื่อเริ่มต้นด้วยฐานข้อมูลที่ว่างเปล่าใช่หรือไม่? (การดำเนินการนี้ไม่สามารถย้อนกลับได้)',
                      confirmText: 'ล้างข้อมูลตัวอย่างเดี๋ยวนี้',
                      type: 'danger',
                      onConfirm: () => {
                        onResetData();
                        setMessage('ล้างข้อมูลตัวอย่างและเริ่มต้นใหม่เรียบร้อยแล้ว');
                        setTimeout(() => setMessage(''), 3000);
                      }
                    });
                  }}
                  className="mt-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างข้อมูลตัวอย่างเดี๋ยวนี้</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  สำรองและกู้คืนข้อมูล (Backup & Restore)
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onExportBackup}
                    className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ส่งออกไฟล์สำรอง (JSON)</span>
                  </button>

                  <label className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>นำเข้าไฟล์สำรอง (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>

                  {onRestoreSafetySnapshot && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await onRestoreSafetySnapshot();
                        if (ok) {
                          setMessage('ย้อนกลับข้อมูลไปยังจุดสำรองก่อนนำเข้าสำเร็จแล้ว');
                          setTimeout(() => setMessage(''), 3000);
                        }
                      }}
                      className="bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer"
                      title="ย้อนกลับข้อมูลไปยังจุดสำรองนิรภัยที่สร้างขึ้นก่อนการนำเข้าล่าสุด"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>ย้อนกลับข้อมูลก่อนนำเข้าล่าสุด (Safety Snapshot)</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Reusable Elegant Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        isAlert={confirmModalConfig.isAlert}
        type={confirmModalConfig.type}
        onConfirm={confirmModalConfig.onConfirm}
        onClose={closeConfirmModal}
      />
    </div>
  );
}
