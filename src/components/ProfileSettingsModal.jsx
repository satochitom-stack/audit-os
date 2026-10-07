import React, { useState } from 'react';
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

export default function ProfileSettingsModal({
  orgProfile,
  onSaveProfile,
  fiscalYears,
  onAddYear,
  onDeleteYear,
  onResetData,
  onExportBackup,
  onImportBackup,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'years', 'data'
  const [profileForm, setProfileForm] = useState({ ...orgProfile });
  const [newYearInput, setNewYearInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    if (!profileForm.auditorName.trim()) {
      setError('กรุณาระบุชื่อ-นามสกุล ผู้ตรวจสอบภายใน');
      return;
    }
    onSaveProfile(profileForm);
    setMessage('บันทึกข้อมูลผู้ตรวจสอบและหน่วยงานเรียบร้อยแล้ว');
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
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        onImportBackup(json);
        setMessage('นำเข้าข้อมูลสำรองสำเร็จ');
        setTimeout(() => setMessage(''), 2500);
      } catch {
        setError('ไฟล์ JSON ไม่ถูกต้องหรือไม่สามารถอ่านได้');
      }
    };
    reader.readAsText(file);
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
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-3 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-blue-900 dark:text-blue-300">💡 ข้อมูลนี้จะแสดงในทุกหน้าจอและใช้ในเอกสาร:</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  เช่น ในหัวกระดาษทำการ, รายงานผลการตรวจสอบ, และการลงนามในบันทึกข้อความ
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
