import React, { useState, useEffect } from 'react';
import {
  Building2,
  Shield,
  Printer,
  Edit3,
  Plus,
  Trash2,
  Check,
  X,
  RotateCcw,
  GitFork,
  LayoutGrid,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  School,
  HeartPulse,
  Save,
  HelpCircle
} from 'lucide-react';
import {
  DEFAULT_ORG_STRUCTURE,
  ORG_STRUCTURE_TEMPLATES,
  getTenantOrgStructure,
  saveTenantOrgStructure
} from '../data/orgStructureData';

export default function OrgChartStructure({
  session,
  orgProfile = {},
  onStructureChange
}) {
  const [structure, setStructure] = useState(() => getTenantOrgStructure(session, orgProfile));
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'
  const [toastMessage, setToastMessage] = useState('');

  // Editable Draft state
  const [draft, setDraft] = useState(structure);

  // Sync when session or orgProfile changes
  useEffect(() => {
    const loaded = getTenantOrgStructure(session, orgProfile);
    setStructure(loaded);
    setDraft(loaded);
  }, [session?.username, orgProfile?.name]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleStartEdit = () => {
    setDraft(JSON.parse(JSON.stringify(structure)));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraft(JSON.parse(JSON.stringify(structure)));
    setIsEditing(false);
  };

  const handleApplyTemplate = (templateKey) => {
    const tpl = ORG_STRUCTURE_TEMPLATES[templateKey];
    if (!tpl) return;
    setDraft((prev) => ({
      ...prev,
      departments: JSON.parse(JSON.stringify(tpl.departments))
    }));
    showToast(`โหลดเทมเพลต "${tpl.title}" สำเร็จ! ตรวจสอบและกดบันทึก`);
  };

  const handleSaveEdit = () => {
    saveTenantOrgStructure(draft, session);
    setStructure(draft);
    setIsEditing(false);
    if (onStructureChange) onStructureChange(draft);
    showToast('บันทึกโครงสร้างองค์กร & ซิงค์หน่วยรับตรวจเข้าสู่ระบบเรียบร้อยแล้ว!');
  };

  // Division Helpers inside draft
  const handleAddDepartment = () => {
    const newDept = {
      id: `dept-${Date.now()}`,
      name: 'กองใหม่ (ระบุชื่อ)',
      headTitle: 'ผู้อำนวยการกอง...',
      headName: '',
      color: 'teal',
      divisions: [
        {
          id: `div-${Date.now()}`,
          name: 'ฝ่ายบริหารงานทั่วไป',
          jobs: ['งานสารบรรณ', 'งานการเงิน']
        }
      ],
      affiliatedUnits: []
    };
    setDraft((prev) => ({
      ...prev,
      departments: [...prev.departments, newDept]
    }));
  };

  const handleDeleteDepartment = (index) => {
    if (draft.departments.length <= 1) {
      alert('ต้องมีสำนัก/กองอย่างน้อย 1 กองในโครงสร้าง');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, idx) => idx !== index)
    }));
  };

  const handleDeptChange = (index, field, value) => {
    setDraft((prev) => {
      const nextDepts = [...prev.departments];
      nextDepts[index] = { ...nextDepts[index], [field]: value };
      return { ...prev, departments: nextDepts };
    });
  };

  const handleAddDivision = (deptIdx) => {
    setDraft((prev) => {
      const nextDepts = [...prev.departments];
      const target = { ...nextDepts[deptIdx] };
      target.divisions = [
        ...(target.divisions || []),
        { id: `div-${Date.now()}`, name: 'ฝ่าย...', jobs: ['งาน...'] }
      ];
      nextDepts[deptIdx] = target;
      return { ...prev, departments: nextDepts };
    });
  };

  const handleDeleteDivision = (deptIdx, divIdx) => {
    setDraft((prev) => {
      const nextDepts = [...prev.departments];
      const target = { ...nextDepts[deptIdx] };
      target.divisions = target.divisions.filter((_, i) => i !== divIdx);
      nextDepts[deptIdx] = target;
      return { ...prev, departments: nextDepts };
    });
  };

  const handleDivisionChange = (deptIdx, divIdx, field, value) => {
    setDraft((prev) => {
      const nextDepts = [...prev.departments];
      const target = { ...nextDepts[deptIdx] };
      const nextDivs = [...target.divisions];
      nextDivs[divIdx] = { ...nextDivs[divIdx], [field]: value };
      target.divisions = nextDivs;
      nextDepts[deptIdx] = target;
      return { ...prev, departments: nextDepts };
    });
  };

  const handleDivisionJobsChange = (deptIdx, divIdx, jobsStr) => {
    const jobs = jobsStr.split(',').map((j) => j.trim()).filter(Boolean);
    setDraft((prev) => {
      const nextDepts = [...prev.departments];
      const target = { ...nextDepts[deptIdx] };
      const nextDivs = [...target.divisions];
      nextDivs[divIdx] = { ...nextDivs[divIdx], jobs };
      target.divisions = nextDivs;
      nextDepts[deptIdx] = target;
      return { ...prev, departments: nextDepts };
    });
  };

  const handleAddAffiliatedUnit = (deptIdx) => {
    const unitName = prompt('ระบุชื่อหน่วยงานในสังกัด (เช่น ศูนย์พัฒนาเด็กเล็กบ้าน..., โรงเรียนเทศบาล...):');
    if (!unitName?.trim()) return;
    setDraft((prev) => {
      const nextDepts = [...prev.departments];
      const target = { ...nextDepts[deptIdx] };
      target.affiliatedUnits = [
        ...(target.affiliatedUnits || []),
        { id: `aff-${Date.now()}`, name: unitName.trim(), type: unitName.includes('โรงเรียน') ? 'โรงเรียน' : 'ศพด.' }
      ];
      nextDepts[deptIdx] = target;
      return { ...prev, departments: nextDepts };
    });
  };

  const handleDeleteAffiliatedUnit = (deptIdx, affIdx) => {
    setDraft((prev) => {
      const nextDepts = [...prev.departments];
      const target = { ...nextDepts[deptIdx] };
      target.affiliatedUnits = target.affiliatedUnits.filter((_, i) => i !== affIdx);
      nextDepts[deptIdx] = target;
      return { ...prev, departments: nextDepts };
    });
  };

  const getColorClasses = (color) => {
    switch (color) {
      case 'sky':
        return {
          bg: 'bg-sky-600',
          border: 'border-sky-300',
          badge: 'bg-sky-100 text-sky-900 border-sky-300',
          lightBg: 'bg-sky-50/70 border-sky-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-700',
          border: 'border-purple-300',
          badge: 'bg-purple-100 text-purple-900 border-purple-300',
          lightBg: 'bg-purple-50/70 border-purple-200'
        };
      case 'amber':
        return {
          bg: 'bg-amber-600',
          border: 'border-amber-300',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          lightBg: 'bg-amber-50/70 border-amber-200'
        };
      case 'yellow':
        return {
          bg: 'bg-amber-500',
          border: 'border-yellow-400',
          badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
          lightBg: 'bg-yellow-50/70 border-yellow-200'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-600',
          border: 'border-emerald-300',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          lightBg: 'bg-emerald-50/70 border-emerald-200'
        };
      case 'teal':
        return {
          bg: 'bg-teal-600',
          border: 'border-teal-300',
          badge: 'bg-teal-100 text-teal-900 border-teal-300',
          lightBg: 'bg-teal-50/70 border-teal-200'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-600',
          border: 'border-indigo-300',
          badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          lightBg: 'bg-indigo-50/70 border-indigo-200'
        };
      case 'rose':
        return {
          bg: 'bg-rose-600',
          border: 'border-rose-300',
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          lightBg: 'bg-rose-50/70 border-rose-200'
        };
      default:
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-300',
          badge: 'bg-blue-100 text-blue-900 border-blue-300',
          lightBg: 'bg-blue-50/70 border-blue-200'
        };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all p-4 sm:p-6 lg:p-8 print:p-0 print:border-none print:shadow-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-700 text-white shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200/80 dark:border-slate-800 gap-3 no-print">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <GitFork className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>แผนภูมิโครงสร้างการแบ่งส่วนราชการ & จักรวาลหน่วยรับตรวจ</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                  Customizable Universe
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น'} • {orgProfile.district || ''} {orgProfile.province || ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {/* View Mode Toggle */}
          {!isEditing && (
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/80 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'chart'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>มุมมองแผนภูมิ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ตารางหน่วยรับตรวจ ({structure.departments.length} กอง)</span>
              </button>
            </div>
          )}

          {/* Edit Mode Button */}
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ปรับแต่งโครงสร้าง อปท. ของฉัน</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>ยกเลิก</span>
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/30"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึก & ซิงค์จักรวาลตรวจ</span>
              </button>
            </div>
          )}

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
            title="พิมพ์แผนภูมิสำหรับแนบเล่มแผนตรวจสอบประจำปี"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">พิมพ์แนบเล่มแผน (A4)</span>
          </button>
        </div>
      </div>

      {/* 2. Mode: EDITING FORM (ปรับแต่งโครงสร้าง อปท.) */}
      {isEditing && (
        <div className="mt-5 space-y-6 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 no-print animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <span>🛠️ แก้ไขและกำหนดโครงสร้างองค์กร อปท.</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ปรับเพิ่ม/ลดกอง ฝ่าย และหน่วยงานในสังกัด ให้ตรงกับกรอบอัตรากำลังจริงของ {orgProfile.name}
              </p>
            </div>

            {/* Quick Templates Picker */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-500">เลือกเทมเพลต:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleApplyTemplate(e.target.value);
                }}
                defaultValue=""
                className="bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer shadow-2xs"
              >
                <option value="" disabled>-- เลือกแม่แบบมาตรฐาน --</option>
                <option value="tao_small">อบต. ขนาดเล็ก (3 กองหลัก)</option>
                <option value="tao_standard">อบต. ขนาดกลาง / มาตรฐาน (5 กอง)</option>
                <option value="thessaban">เทศบาลตำบล / เทศบาลเมือง (7 กอง)</option>
                <option value="pao_city">เทศบาลนคร / อบจ. (8+ ส่วนราชการ)</option>
              </select>
            </div>
          </div>

          {/* Leaders Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">ตำแหน่งฝ่ายบริหารสูงสุด:</label>
              <input
                type="text"
                value={draft.approver?.title || ''}
                onChange={(e) => setDraft({ ...draft, approver: { ...draft.approver, title: e.target.value } })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">ตำแหน่งปลัด อปท.:</label>
              <input
                type="text"
                value={draft.palat?.title || ''}
                onChange={(e) => setDraft({ ...draft, palat: { ...draft.palat, title: e.target.value } })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">ตำแหน่งผู้ตรวจสอบภายใน:</label>
              <input
                type="text"
                value={draft.auditor?.title || ''}
                onChange={(e) => setDraft({ ...draft, auditor: { ...draft.auditor, title: e.target.value } })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          {/* Departments Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                รายการสำนัก/กอง ในสังกัด ({draft.departments.length} หน่วยรับตรวจ)
              </span>
              <button
                type="button"
                onClick={handleAddDepartment}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มสำนัก/กองใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {draft.departments.map((dept, deptIdx) => (
                <div
                  key={dept.id || deptIdx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs relative"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[11px] flex items-center justify-center text-slate-600">
                        {deptIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={dept.name}
                        onChange={(e) => handleDeptChange(deptIdx, 'name', e.target.value)}
                        placeholder="ชื่อสำนัก/กอง"
                        className="font-black text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <select
                        value={dept.color || 'blue'}
                        onChange={(e) => handleDeptChange(deptIdx, 'color', e.target.value)}
                        className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded px-1.5 py-1"
                      >
                        <option value="sky">ฟ้า (Sky)</option>
                        <option value="purple">ม่วง (Purple)</option>
                        <option value="amber">ส้มอิฐ (Amber)</option>
                        <option value="yellow">เหลือง (Yellow)</option>
                        <option value="emerald">เขียว (Emerald)</option>
                        <option value="teal">เขียวน้ำทะเล (Teal)</option>
                        <option value="indigo">คราม (Indigo)</option>
                        <option value="rose">ชมพู (Rose)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteDepartment(deptIdx)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                        title="ลบกองนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Head of Department */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">ตำแหน่งหัวหน้าหน่วยงาน:</label>
                    <input
                      type="text"
                      value={dept.headTitle || ''}
                      onChange={(e) => handleDeptChange(deptIdx, 'headTitle', e.target.value)}
                      placeholder="เช่น หัวหน้าสำนักปลัด, ผู้อำนวยการกองคลัง"
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  {/* Divisions */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>ฝ่าย / งานภายในกอง:</span>
                      <button
                        type="button"
                        onClick={() => handleAddDivision(deptIdx)}
                        className="text-blue-600 hover:underline flex items-center space-x-0.5 text-[11px] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>เพิ่มฝ่าย</span>
                      </button>
                    </div>

                    {(dept.divisions || []).map((div, divIdx) => (
                      <div key={div.id || divIdx} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={div.name}
                            onChange={(e) => handleDivisionChange(deptIdx, divIdx, 'name', e.target.value)}
                            placeholder="ชื่อฝ่าย เช่น ฝ่ายอำนวยการ"
                            className="font-bold text-xs p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded flex-1 mr-2"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteDivision(deptIdx, divIdx)}
                            className="text-rose-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={(div.jobs || []).join(', ')}
                            onChange={(e) => handleDivisionJobsChange(deptIdx, divIdx, e.target.value)}
                            placeholder="ระบุงานย่อย คั่นด้วยเครื่องหมายจุลภาค (,) เช่น งานสารบรรณ, งานการเงิน"
                            className="w-full text-[11px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subordinate Affiliated Units (ศพด., โรงเรียน, รพ.สต.) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                      <span>หน่วยงานในสังกัด (ศพด./โรงเรียน/รพ.สต.):</span>
                      <button
                        type="button"
                        onClick={() => handleAddAffiliatedUnit(deptIdx)}
                        className="text-emerald-600 hover:underline flex items-center space-x-0.5 text-[11px] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>เพิ่มหน่วยงานลูก</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(dept.affiliatedUnits || []).map((aff, affIdx) => (
                        <span
                          key={aff.id || affIdx}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                        >
                          <School className="w-3 h-3" />
                          <span>{aff.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAffiliatedUnit(deptIdx, affIdx)}
                            className="text-emerald-600 hover:text-rose-600 ml-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      {(!dept.affiliatedUnits || dept.affiliatedUnits.length === 0) && (
                        <span className="text-[10px] text-slate-400 italic">ไม่มีหน่วยงานลูกในสังกัด</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Mode: VISUAL ORG CHART (แผนภูมิสายงานราชการเป็นทางการ) */}
      {viewMode === 'chart' && (
        <div className="mt-6 overflow-x-auto pb-6">
          <div className="min-w-[1020px] max-w-6xl mx-auto flex flex-col items-center select-none text-slate-800 dark:text-slate-200">
            {/* Formal Title for Print & Screen */}
            <div className="text-center mb-6 space-y-1">
              <h4 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                แผนภูมิโครงสร้างการแบ่งส่วนราชการและการบังคับบัญชา
              </h4>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น'} {orgProfile.district || ''} {orgProfile.province || ''}
              </p>
              <div className="text-[11px] text-slate-500 font-medium">
                (กรอบจักรวาลการตรวจสอบภายใน - Auditable Universe ครอบคลุม {structure.departments.length} หน่วยรับตรวจหลัก)
              </div>
              <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto mt-2" />
            </div>

            {/* TOP TIER: 1. ผู้บริหารสูงสุด (นายก อปท.) */}
            <div className="flex flex-col items-center">
              <div className="w-80 bg-gradient-to-br from-amber-50 via-white to-amber-100/70 dark:from-amber-950/60 dark:via-slate-900 dark:to-amber-900/40 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-3 text-center shadow-xs transition-all hover:scale-[1.01]">
                <div className="flex items-center justify-center space-x-1.5 mb-1">
                  <span className="text-sm">👑</span>
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-300">
                    ฝ่ายบริหาร / ผู้บริหารสูงสุด
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {structure.approver?.title || `นายก${orgProfile.name || 'อปท.'}`}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  {structure.approver?.name || orgProfile.approverName || 'ผู้บริหาร อปท.'}
                </div>
              </div>

              {/* Vertical connector line down from นายก to ปลัด */}
              <div className="w-0.5 h-6 bg-emerald-600 my-0" />
            </div>

            {/* MIDDLE TIER: 2. ปลัด อปท. & หน่วยตรวจสอบภายใน (กิ่งขวา รายงานตรง) */}
            <div className="flex items-center justify-center w-full mb-1">
              {/* Left Spacer to balance the right side */}
              <div className="w-72 shrink-0 hidden md:block" />

              {/* Center Box: ปลัด อปท. */}
              <div className="w-80 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 dark:from-emerald-950/60 dark:via-slate-900 dark:to-emerald-900/40 border-2 border-emerald-500 hover:border-emerald-600 rounded-2xl p-3 text-center shadow-xs transition-all hover:scale-[1.01] shrink-0 z-10">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <span className="text-sm">🏛️</span>
                  <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-300">
                    หัวหน้าพนักงานส่วนท้องถิ่น / ปลัด อปท.
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {structure.palat?.title || `ปลัด${orgProfile.name || 'อปท.'}`}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  {structure.palat?.name || orgProfile.palatName || 'ปลัด อปท.'}
                </div>
              </div>

              {/* Right Side: Connector Line & หน่วยตรวจสอบภายใน */}
              <div className="flex items-center w-72 shrink-0">
                <div className="w-10 h-0.5 bg-blue-500 shrink-0" />
                
                {/* Box: หน่วยตรวจสอบภายใน */}
                <div className="w-60 bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 rounded-2xl p-2.5 text-center shadow-md shrink-0 ring-2 ring-blue-500/20">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <span className="text-xs">🛡️</span>
                    <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-full border border-blue-200">
                      รายงานตรงต่อนายก/ปลัด
                    </span>
                  </div>
                  <div className="text-xs font-black text-blue-900 dark:text-blue-200">
                    หน่วยตรวจสอบภายใน
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">
                    {structure.auditor?.title || orgProfile.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}
                  </div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5 truncate">
                    {structure.auditor?.name || orgProfile.auditorName || 'ผู้ตรวจสอบภายใน'}
                  </div>
                </div>
              </div>
            </div>

            {/* Central Vertical Connector line from ปลัด down to Trunk bar */}
            <div className="w-0.5 h-6 bg-emerald-600" />

            {/* 3. Main Departments Trunk Bar & Columns */}
            <div
              className="grid gap-3 w-full"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, structure.departments.length)}, minmax(180px, 1fr))`
              }}
            >
              {structure.departments.map((dept, idx) => {
                const colors = getColorClasses(dept.color);
                return (
                  <div key={dept.id || idx} className="flex flex-col items-center w-full">
                    {/* Top Branch Connector */}
                    <div className="relative w-full h-5 flex justify-center">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-600" />
                      <div className="w-0.5 h-full bg-emerald-600" />
                    </div>

                    {/* Department Header Box */}
                    <div className={`w-full ${colors.bg} text-white rounded-2xl p-2.5 text-center shadow-xs transition-all`}>
                      <div className="text-xs font-black tracking-wide truncate">
                        {dept.name}
                      </div>
                      <div className="text-[10px] opacity-90 mt-0.5 line-clamp-1">
                        {dept.headTitle || 'หัวหน้าหน่วยงาน'}
                      </div>
                    </div>

                    {/* Sub-boxes (ฝ่าย / งาน) */}
                    <div className="w-full space-y-2 text-left mt-3">
                      {(dept.divisions || []).map((div, divIdx) => (
                        <div
                          key={div.id || divIdx}
                          className={`${colors.lightBg} border rounded-xl p-2 space-y-1 text-[11px]`}
                        >
                          <div className="font-bold text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-200/60 dark:border-slate-700 text-[11px] truncate">
                            {div.name}
                          </div>
                          <ul className="space-y-0.5 text-slate-600 dark:text-slate-300 text-[10px]">
                            {(div.jobs || []).map((job, jobIdx) => (
                              <li key={jobIdx} className="flex items-start space-x-1">
                                <span className="text-slate-400 mt-0.5">•</span>
                                <span className="leading-tight">{job}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {/* Affiliated Units (ศพด., โรงเรียน) */}
                      {Array.isArray(dept.affiliatedUnits) && dept.affiliatedUnits.length > 0 && (
                        <div className="pt-1 space-y-1">
                          <div className="text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-center">
                            หน่วยงานในสังกัด:
                          </div>
                          {dept.affiliatedUnits.map((aff, affIdx) => (
                            <div
                              key={aff.id || affIdx}
                              className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-2 text-center shadow-2xs"
                            >
                              <div className="text-[10px] font-extrabold text-emerald-950 dark:text-emerald-200 flex items-center justify-center space-x-1">
                                <School className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{aff.name}</span>
                              </div>
                              <div className="text-[9px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                                การจัดการศึกษา/บริการในชุมชน
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formal Footer Notes */}
            <div className="w-full mt-10 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>โครงสร้างการแบ่งส่วนราชการตามกรอบอัตรากำลังขององค์กรปกครองส่วนท้องถิ่น</span>
              </div>
              <div className="text-slate-400 text-[10px] mt-1 sm:mt-0">
                เอกสารแนบประกอบกฎบัตรการตรวจสอบภายใน / แผนการตรวจสอบประจำปี พ.ศ. {orgProfile.fiscalYear || '2569'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Mode: AUDITABLE ENTITIES TABLE (ตารางจักรวาลหน่วยรับตรวจ) */}
      {viewMode === 'table' && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 w-12 text-center">ลำดับ</th>
                <th className="p-3">ชื่อสำนัก/กอง (Auditable Entity)</th>
                <th className="p-3">หัวหน้าหน่วยรับตรวจ</th>
                <th className="p-3">ฝ่าย/งานที่สังกัด</th>
                <th className="p-3">หน่วยงานลูกในกำกับ</th>
                <th className="p-3 text-center">สถานะในระบบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {structure.departments.map((dept, idx) => (
                <tr key={dept.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                    <span className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${getColorClasses(dept.color).bg}`}></span>
                      <span>{dept.name}</span>
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                    {dept.headTitle || 'ผู้อำนวยการกอง'}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {(dept.divisions || []).map((d) => d.name).join(', ') || '-'}
                  </td>
                  <td className="p-3">
                    {Array.isArray(dept.affiliatedUnits) && dept.affiliatedUnits.length > 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {dept.affiliatedUnits.map((a) => a.name).join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200">
                      หน่วยรับตรวจ อปท.
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
