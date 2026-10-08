import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Shield,
  Download,
  FileText,
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
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Monitor,
  ArrowLeftRight
} from 'lucide-react';
import {
  DEFAULT_ORG_STRUCTURE,
  ORG_STRUCTURE_TEMPLATES,
  getTenantOrgStructure,
  saveTenantOrgStructure
} from '../data/orgStructureData';
import { exportOrgChartToPdf, exportOrgChartToWord } from '../services/orgChartExportService';

export default function OrgChartStructure({
  session,
  orgProfile = {},
  onStructureChange
}) {
  const [structure, setStructure] = useState(() => getTenantOrgStructure(session, orgProfile));
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'
  const [chartLayout, setChartLayout] = useState(() => (structure.departments?.length >= 6 ? 'fit' : 'wide')); // 'fit', 'tworows', 'wide'
  const [toastMessage, setToastMessage] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const chartScrollRef = useRef(null);

  // Editable Draft state
  const [draft, setDraft] = useState(structure);

  // Sync when session or orgProfile changes
  useEffect(() => {
    const loaded = getTenantOrgStructure(session, orgProfile);
    setStructure(loaded);
    setDraft(loaded);
    if (loaded.departments?.length >= 6) {
      setChartLayout('fit');
    }
  }, [session?.username, orgProfile?.name]);

  const scrollLeft = () => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

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
      deputyPalats: tpl.deputyPalats ? JSON.parse(JSON.stringify(tpl.deputyPalats)) : [],
      departments: JSON.parse(JSON.stringify(tpl.departments))
    }));
    showToast(`โหลดเทมเพลต "${tpl.title}" สำเร็จ! ตรวจสอบและกดบันทึก`);
  };

  const handleSaveEdit = () => {
    saveTenantOrgStructure(draft, session);
    setStructure(draft);
    setIsEditing(false);
    if (draft.departments?.length >= 6) {
      setChartLayout('fit');
    }
    if (onStructureChange) onStructureChange(draft);
    showToast('บันทึกโครงสร้างองค์กร & ซิงค์หน่วยรับตรวจเข้าสู่ระบบเรียบร้อยแล้ว!');
  };

  // Deputy Palat Helpers inside draft
  const handleAddDeputyPalat = () => {
    setDraft((prev) => {
      const current = Array.isArray(prev.deputyPalats) ? prev.deputyPalats : [];
      const num = current.length + 1;
      return {
        ...prev,
        deputyPalats: [
          ...current,
          {
            id: `deputy-${Date.now()}`,
            title: current.length === 0 ? 'รองปลัดองค์กรปกครองส่วนท้องถิ่น' : `รองปลัดองค์กรปกครองส่วนท้องถิ่น (คนที่ ${num})`,
            name: '',
            role: current.length === 0 ? 'รองปลัด อปท. (นักบริหารงานท้องถิ่น)' : `กำกับดูแลกลุ่มภารกิจที่ ${num}`
          }
        ]
      };
    });
  };

  const handleDeleteDeputyPalat = (index) => {
    setDraft((prev) => ({
      ...prev,
      deputyPalats: (prev.deputyPalats || []).filter((_, i) => i !== index)
    }));
  };

  const handleDeputyPalatChange = (index, field, value) => {
    setDraft((prev) => {
      const next = [...(prev.deputyPalats || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, deputyPalats: next };
    });
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
          headerHex: '#0284c7',
          borderHex: '#38bdf8',
          lightHex: '#f0f9ff',
          badge: 'bg-sky-100 text-sky-900 border-sky-300',
          lightBg: 'bg-sky-50/70 border-sky-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-700',
          headerHex: '#7e22ce',
          borderHex: '#c084fc',
          lightHex: '#faf5ff',
          badge: 'bg-purple-100 text-purple-900 border-purple-300',
          lightBg: 'bg-purple-50/70 border-purple-200'
        };
      case 'amber':
        return {
          bg: 'bg-amber-600',
          headerHex: '#d97706',
          borderHex: '#fbbf24',
          lightHex: '#fffbeb',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          lightBg: 'bg-amber-50/70 border-amber-200'
        };
      case 'yellow':
        return {
          bg: 'bg-amber-500',
          headerHex: '#ca8a04',
          borderHex: '#facc15',
          lightHex: '#fefce8',
          badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
          lightBg: 'bg-yellow-50/70 border-yellow-200'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-600',
          headerHex: '#059669',
          borderHex: '#34d399',
          lightHex: '#ecfdf5',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          lightBg: 'bg-emerald-50/70 border-emerald-200'
        };
      case 'teal':
        return {
          bg: 'bg-teal-600',
          headerHex: '#0d9488',
          borderHex: '#2dd4bf',
          lightHex: '#f0fdfa',
          badge: 'bg-teal-100 text-teal-900 border-teal-300',
          lightBg: 'bg-teal-50/70 border-teal-200'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-600',
          headerHex: '#4f46e5',
          borderHex: '#818cf8',
          lightHex: '#eef2ff',
          badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          lightBg: 'bg-indigo-50/70 border-indigo-200'
        };
      case 'rose':
        return {
          bg: 'bg-rose-600',
          headerHex: '#e11d48',
          borderHex: '#fb7185',
          lightHex: '#fff1f2',
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          lightBg: 'bg-rose-50/70 border-rose-200'
        };
      default:
        return {
          bg: 'bg-blue-600',
          headerHex: '#2563eb',
          borderHex: '#60a5fa',
          lightHex: '#eff6ff',
          badge: 'bg-blue-100 text-blue-900 border-blue-300',
          lightBg: 'bg-blue-50/70 border-blue-200'
        };
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      if (viewMode !== 'chart') {
        setViewMode('chart');
        await new Promise((r) => setTimeout(r, 250));
      }
      showToast('กำลังประมวลผลไฟล์ PDF (A4 แนวนอน พอดี 1 หน้า)...');
      const ok = await exportOrgChartToPdf('org-chart-printable-area', orgProfile);
      if (ok) {
        showToast('ดาวน์โหลดไฟล์ PDF สี (A4 แนวนอน) สำเร็จเรียบร้อยแล้ว!');
      } else {
        showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadWord = () => {
    try {
      showToast('กำลังดาวน์โหลดไฟล์ Microsoft Word (.doc)...');
      const ok = exportOrgChartToWord(structure, orgProfile);
      if (ok) {
        showToast('ดาวน์โหลดไฟล์ Word สำเร็จเรียบร้อยแล้ว!');
      } else {
        showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ Word');
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ Word');
    }
  };

  const renderDeptColumn = (dept, idx, totalInRow) => {
    const colors = getColorClasses(dept.color);
    return (
      <div key={dept.id || idx} className="flex flex-col items-center w-full min-w-0 org-dept-col">
        {/* Top Branch Connector */}
        <div className="relative w-full h-5 flex justify-center">
          <div
            className={`absolute top-0 h-0.5 ${
              totalInRow === 1
                ? 'hidden'
                : idx === 0
                ? 'left-1/2 right-0'
                : idx === totalInRow - 1
                ? 'left-0 right-1/2'
                : 'left-0 right-0'
            }`}
            style={{ backgroundColor: '#059669', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          />
          <div
            className="w-0.5 h-full"
            style={{ backgroundColor: '#059669', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          />
        </div>

        {/* Department Header Box */}
        <div
          className={`w-full ${colors.bg} text-white rounded-2xl p-2.5 text-center shadow-xs transition-all`}
          style={{
            backgroundColor: colors.headerHex,
            color: '#ffffff',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}
        >
          <div className="text-xs font-black tracking-wide truncate text-white" title={dept.name} style={{ color: '#ffffff' }}>
            {dept.name}
          </div>
          <div className="text-[10px] opacity-90 mt-0.5 line-clamp-1 text-white" title={dept.headTitle} style={{ color: '#ffffff' }}>
            {dept.headTitle || 'หัวหน้าหน่วยงาน'}
          </div>
        </div>

        {/* Sub-boxes (ฝ่าย / งาน) */}
        <div className="w-full space-y-2 text-left mt-3">
          {(dept.divisions || []).map((div, divIdx) => (
            <div
              key={div.id || divIdx}
              className={`${colors.lightBg} border rounded-xl p-2 space-y-1.5 text-[11px] shadow-2xs break-inside-avoid`}
              style={{
                backgroundColor: colors.lightHex,
                borderColor: colors.borderHex,
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}
            >
              <div className="font-bold text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-200/60 dark:border-slate-700 text-[11px] truncate" title={div.name}>
                {div.name}
              </div>

              {/* ตำแหน่งหัวหน้าฝ่าย (สอดคล้องกับโครงสร้างจริงของเทศบาลและ อปท.) */}
              {(div.headTitle || div.headName) && (
                <div
                  className="flex items-center space-x-1 text-[9.5px] font-semibold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/60 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                  style={{ backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <span className="text-[10px]">👤</span>
                  <span className="truncate">{div.headTitle || 'หัวหน้าฝ่าย'}{div.headName ? `: ${div.headName}` : ''}</span>
                </div>
              )}

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

          {/* Affiliated Units (ศพด., โรงเรียน, รพ.สต.) */}
          {Array.isArray(dept.affiliatedUnits) && dept.affiliatedUnits.length > 0 && (
            <div className="pt-1 space-y-1 break-inside-avoid">
              <div className="text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-center">
                หน่วยงานในสังกัด:
              </div>
              {dept.affiliatedUnits.map((aff, affIdx) => (
                <div
                  key={aff.id || affIdx}
                  className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-2 text-center shadow-2xs"
                  style={{ backgroundColor: '#ecfdf5', borderColor: '#34d399', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
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
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all p-4 sm:p-6 lg:p-8 print:p-0 print:border-none print:shadow-none print:bg-white org-chart-print-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-700 text-white shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in duration-200 no-print print:hidden">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="space-y-3.5 pb-4 border-b border-slate-200/80 dark:border-slate-800 no-print print:hidden">
        {/* Row 1: Title (แถวบนเต็มความกว้างแถวเดียว) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
              <GitFork className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                โครงสร้างการแบ่งส่วนราชการ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                {orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น'} • {orgProfile.district || ''} {orgProfile.province || ''}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 shrink-0 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>สายบังคับบัญชาตามกรอบอัตรากำลัง อปท.</span>
            </span>
          </div>
        </div>

        {/* Row 2: Controls & Menus (จัดกลุ่มเมนูเป็นระเบียบ ไม่กระจายแยกฝั่ง และเอาคำในวงเล็บออก) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {/* View Mode Toggle */}
          {!isEditing && (
            <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex items-center space-x-1 border border-stone-200/80 dark:border-stone-700 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'chart'
                    ? 'bg-stone-800 text-amber-100 dark:bg-stone-900 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
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
                    ? 'bg-stone-800 text-amber-100 dark:bg-stone-900 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ตารางส่วนราชการ</span>
              </button>
            </div>
          )}

          {/* Chart Layout Mode Switcher */}
          {!isEditing && viewMode === 'chart' && (
            <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex items-center space-x-1 border border-stone-200/80 dark:border-stone-700 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setChartLayout('fit')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  chartLayout === 'fit'
                    ? 'bg-stone-800 text-amber-100 dark:bg-stone-900 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
                title="ย่อขนาดทุกกองให้พอดีหน้าจอพร้อมกันทั้งหมด"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>พอดีจอ</span>
              </button>
              <button
                type="button"
                onClick={() => setChartLayout('tworows')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  chartLayout === 'tworows'
                    ? 'bg-stone-800 text-amber-100 dark:bg-stone-900 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
                title="จัดแบ่งเป็น 2 ชั้นสมดุล ตัวหนังสือใหญ่ อ่านง่าย"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>จัด 2 ชั้น</span>
              </button>
              <button
                type="button"
                onClick={() => setChartLayout('wide')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  chartLayout === 'wide'
                    ? 'bg-stone-800 text-amber-100 dark:bg-stone-900 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
                title="แนวนอนเต็มขนาด 100%"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>แนวนอน 100%</span>
              </button>
            </div>
          )}

          {/* Action Buttons: Customization & Exports */}
          <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ปรับแต่งโครงสร้าง อปท.</span>
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
                  <span>บันทึกโครงสร้าง</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="ดาวน์โหลดผังโครงสร้างสีความละเอียดสูง (A4 แนวนอน พอดี 1 หน้า)"
            >
              <Download className={`w-3.5 h-3.5 ${isExportingPdf ? 'animate-bounce' : ''}`} />
              <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWord}
              className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              title="ดาวน์โหลดโครงสร้างและฝ่ายเป็นเอกสาร Microsoft Word (.doc) พร้อมตารางและช่องลงนาม"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด Word</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Mode: EDITING FORM (ปรับแต่งโครงสร้าง อปท.) */}
      {isEditing && (
        <div className="mt-5 space-y-6 bg-[#faf8f4] dark:bg-[#1f2532] p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 no-print animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 gap-3">
            <div>
              <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                <span>🛠️ แก้ไขและกำหนดโครงสร้างองค์กร อปท.</span>
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                ปรับเพิ่ม/ลดกอง ฝ่าย และหน่วยงานในสังกัด ให้ตรงกับกรอบอัตรากำลังจริงของ {orgProfile.name}
              </p>
            </div>

            {/* Quick Templates Picker */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-stone-500">เลือกเทมเพลต:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleApplyTemplate(e.target.value);
                }}
                defaultValue=""
                className="bg-white dark:bg-stone-900 text-xs font-bold text-stone-800 dark:text-stone-100 rounded-lg px-2.5 py-1.5 border border-stone-300 dark:border-stone-700 cursor-pointer shadow-2xs"
              >
                <option value="" disabled>-- เลือกแม่แบบมาตรฐาน --</option>
                <option value="tao_small">อบต. ขนาดเล็ก (3 กองหลัก)</option>
                <option value="tao_standard">อบต. ขนาดกลาง / มาตรฐาน (5 กอง + รองปลัด)</option>
                <option value="thessaban">เทศบาลตำบล / เทศบาลเมือง (7 กอง + รองปลัด + หน.ฝ่าย)</option>
                <option value="pao_city">เทศบาลนคร / อบจ. (8+ ส่วนราชการ + รองปลัด 2 ท่าน)</option>
              </select>
            </div>
          </div>

          {/* Leaders Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">ตำแหน่งฝ่ายบริหารสูงสุด:</label>
              <input
                type="text"
                value={draft.approver?.title || ''}
                onChange={(e) => setDraft({ ...draft, approver: { ...draft.approver, title: e.target.value } })}
                className="w-full p-2 bg-[#faf8f4] dark:bg-[#2b3545] border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">ตำแหน่งปลัด อปท.:</label>
              <input
                type="text"
                value={draft.palat?.title || ''}
                onChange={(e) => setDraft({ ...draft, palat: { ...draft.palat, title: e.target.value } })}
                className="w-full p-2 bg-[#faf8f4] dark:bg-[#2b3545] border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">ตำแหน่งผู้ตรวจสอบภายใน:</label>
              <input
                type="text"
                value={draft.auditor?.title || ''}
                onChange={(e) => setDraft({ ...draft, auditor: { ...draft.auditor, title: e.target.value } })}
                className="w-full p-2 bg-[#faf8f4] dark:bg-[#2b3545] border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Deputy Palats (รองปลัด อปท. - เพิ่มได้ 0, 1 หรือ 2 คนตามขนาด อปท.) */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  สายการบังคับบัญชา: รองปลัด อปท. ({(draft.deputyPalats || []).length} อัตรา)
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  อบต. ขนาดเล็ก (0 คน), อบต. ขนาดกลาง / เทศบาลตำบล (1 คน), เทศบาลเมือง / นคร / อบจ. (1-2 คน)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDeputyPalat}
                className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 text-xs font-bold flex items-center space-x-1 hover:bg-teal-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรองปลัด อปท.</span>
              </button>
            </div>

            {(!draft.deputyPalats || draft.deputyPalats.length === 0) && (
              <div className="text-center py-2.5 text-xs text-stone-400 italic bg-stone-50 dark:bg-stone-800/40 rounded-lg border border-dashed border-stone-200 dark:border-stone-800">
                ไม่มีตำแหน่งรองปลัด (สายตรงจากปลัด อปท. ไปยังหัวหน้าส่วนราชการระดับกอง)
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(draft.deputyPalats || []).map((deputy, depIdx) => (
                <div
                  key={deputy.id || depIdx}
                  className="bg-teal-50/50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl p-3 space-y-2 relative shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-900 dark:text-teal-300">
                      รองปลัด ลำดับที่ {depIdx + 1}:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDeputyPalat(depIdx)}
                      className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      title="ลบรองปลัดท่านนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">ชื่อตำแหน่ง:</label>
                      <input
                        type="text"
                        value={deputy.title || ''}
                        onChange={(e) => handleDeputyPalatChange(depIdx, 'title', e.target.value)}
                        placeholder="เช่น รองปลัดเทศบาล"
                        className="w-full p-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">ชื่อ-นามสกุล:</label>
                      <input
                        type="text"
                        value={deputy.name || ''}
                        onChange={(e) => handleDeputyPalatChange(depIdx, 'name', e.target.value)}
                        placeholder="เช่น นาย/นาง..."
                        className="w-full p-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-0.5">สายงาน / กลุ่มภารกิจที่กำกับดูแล:</label>
                    <input
                      type="text"
                      value={deputy.role || ''}
                      onChange={(e) => handleDeputyPalatChange(depIdx, 'role', e.target.value)}
                      placeholder="เช่น กำกับดูแลสายงานบริหารทั่วไป และการคลัง"
                      className="w-full p-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Departments Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                รายการสำนัก/กอง ในสังกัด ({draft.departments.length} หน่วยรับตรวจ)
              </span>
              <button
                type="button"
                onClick={handleAddDepartment}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-amber-100 text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-xs border border-amber-600/30"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
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
                        className="text-amber-700 dark:text-amber-400 hover:underline flex items-center space-x-0.5 text-[11px] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>เพิ่มฝ่าย</span>
                      </button>
                    </div>

                    {(dept.divisions || []).map((div, divIdx) => (
                      <div key={div.id || divIdx} className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={div.name}
                            onChange={(e) => handleDivisionChange(deptIdx, divIdx, 'name', e.target.value)}
                            placeholder="ชื่อฝ่าย เช่น ฝ่ายอำนวยการ"
                            className="font-bold text-xs p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded flex-1 mr-2"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteDivision(deptIdx, divIdx)}
                            className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer"
                            title="ลบฝ่ายนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* ตำแหน่ง & ชื่อหัวหน้าฝ่าย (สอดคล้องกับโครงสร้างจริงของเทศบาล / อปท.) */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5">ตำแหน่งหัวหน้าฝ่าย:</label>
                            <input
                              type="text"
                              value={div.headTitle || ''}
                              onChange={(e) => handleDivisionChange(deptIdx, divIdx, 'headTitle', e.target.value)}
                              placeholder="เช่น หัวหน้าฝ่ายอำนวยการ"
                              className="w-full text-[10.5px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5">ชื่อ-นามสกุลหัวหน้าฝ่าย (ถ้ามี):</label>
                            <input
                              type="text"
                              value={div.headName || ''}
                              onChange={(e) => handleDivisionChange(deptIdx, divIdx, 'headName', e.target.value)}
                              placeholder="เช่น นาย/นาง..."
                              className="w-full text-[10.5px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5">งานในสังกัด (คั่นด้วย ,):</label>
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
        <div className="mt-6 relative">
          <div
            ref={chartScrollRef}
            className={`w-full overflow-x-auto pb-6 transition-all scroll-smooth ${
              chartLayout === 'fit' ? 'overflow-x-hidden' : ''
            }`}
          >
            <div
              id="org-chart-printable-area"
              className={`mx-auto flex flex-col items-center select-none text-slate-800 dark:text-slate-200 ${
                chartLayout === 'tworows'
                  ? 'max-w-6xl w-full'
                  : chartLayout === 'fit'
                  ? 'w-full'
                  : 'min-w-max px-4'
              }`}
            >
              {/* Formal Title for Print & Screen */}
              <div className="text-center mb-6 space-y-1">
                <h4 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  โครงสร้างการแบ่งส่วนราชการ
                </h4>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น'} {orgProfile.district || ''} {orgProfile.province || ''}
                </p>
                <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-2" />
              </div>

              {/* TOP TIER: 1. ผู้บริหารสูงสุด (นายก อปท.) */}
              <div className="flex flex-col items-center">
                <div
                  className="w-80 bg-gradient-to-br from-amber-50 via-white to-amber-100/70 dark:from-amber-950/60 dark:via-slate-900 dark:to-amber-900/40 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-3 text-center shadow-xs transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: '#fffbeb',
                    borderColor: '#f59e0b',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}
                >
                  <div className="flex items-center justify-center space-x-1.5 mb-1">
                    <span className="text-sm">👑</span>
                    <span
                      className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-300"
                      style={{
                        backgroundColor: '#fef3c7',
                        color: '#78350f',
                        borderColor: '#f59e0b',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }}
                    >
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
                <div
                  className="w-0.5 h-6 bg-emerald-600 my-0"
                  style={{ backgroundColor: '#059669', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                />
              </div>

              {/* MIDDLE TIER: 2. ปลัด อปท. & หน่วยตรวจสอบภายใน (กิ่งขวา รายงานตรง) */}
              <div className="flex items-center justify-center w-full mb-1">
                {/* Left Spacer to balance the right side */}
                <div className="w-72 shrink-0 hidden md:block" />

                {/* Center Box: ปลัด อปท. */}
                <div
                  className="w-80 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 dark:from-emerald-950/60 dark:via-slate-900 dark:to-emerald-900/40 border-2 border-emerald-500 hover:border-emerald-600 rounded-2xl p-3 text-center shadow-xs transition-all hover:scale-[1.01] shrink-0 z-10"
                  style={{
                    backgroundColor: '#ecfdf5',
                    borderColor: '#10b981',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}
                >
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <span className="text-sm">🏛️</span>
                    <span
                      className="text-[10px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-300"
                      style={{
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        borderColor: '#10b981',
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact'
                      }}
                    >
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
                  <div
                    className="w-10 h-0.5 bg-blue-500 shrink-0"
                    style={{ backgroundColor: '#3b82f6', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  />
                  
                  {/* Box: หน่วยตรวจสอบภายใน */}
                  <div
                    className="w-60 bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 rounded-2xl p-2.5 text-center shadow-md shrink-0 ring-2 ring-blue-500/20"
                    style={{
                      backgroundColor: '#eff6ff',
                      borderColor: '#2563eb',
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact'
                    }}
                  >
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <span className="text-xs">🛡️</span>
                      <span
                        className="text-[9px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-full border border-blue-200"
                        style={{
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          borderColor: '#3b82f6',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact'
                        }}
                      >
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

              {/* Central Vertical Connector line from ปลัด down to Trunk bar or รองปลัด */}
              <div
                className="w-0.5 h-6 bg-emerald-600"
                style={{ backgroundColor: '#059669', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              />

              {/* TIER 2.5: รองปลัด อปท. (สายงานบังคับบัญชากลางตามกรอบ อปท. ถ้ามี) */}
              {Array.isArray(structure.deputyPalats) && structure.deputyPalats.length > 0 && (
                <div className="flex flex-col items-center w-full my-0.5">
                  <div className="flex items-center justify-center gap-4 flex-wrap max-w-4xl">
                    {structure.deputyPalats.map((deputy, depIdx) => (
                      <div
                        key={deputy.id || depIdx}
                        className="w-72 bg-gradient-to-br from-teal-50 via-white to-teal-100/70 dark:from-teal-950/60 dark:via-slate-900 dark:to-teal-900/40 border-2 border-teal-500 hover:border-teal-600 rounded-2xl p-2.5 text-center shadow-xs transition-all hover:scale-[1.01]"
                        style={{
                          backgroundColor: '#f0fdfa',
                          borderColor: '#14b8a6',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact'
                        }}
                      >
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <span className="text-xs">🏛️</span>
                          <span
                            className="text-[9px] font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-full border border-teal-300"
                            style={{
                              backgroundColor: '#ccfbf1',
                              color: '#115e59',
                              borderColor: '#14b8a6',
                              WebkitPrintColorAdjust: 'exact',
                              printColorAdjust: 'exact'
                            }}
                          >
                            {deputy.role || 'รองปลัด อปท. (นักบริหารงานท้องถิ่น)'}
                          </span>
                        </div>
                        <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {deputy.title || 'รองปลัดองค์กรปกครองส่วนท้องถิ่น'}
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                          {deputy.name || 'รองปลัด อปท.'}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Central Vertical Connector line down from รองปลัด to Trunk bar */}
                  <div
                    className="w-0.5 h-6 bg-emerald-600"
                    style={{ backgroundColor: '#059669', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  />
                </div>
              )}

              {/* 3. Main Departments Rows / Grid */}
              {chartLayout === 'tworows' && structure.departments.length >= 6 ? (
                /* TWO-TIER ROW LAYOUT (จัด 2 ชั้นสมดุล) */
                <div className="w-full space-y-6">
                  {/* Row 1: Top Tier (e.g. 4 depts) */}
                  {(() => {
                    const splitIdx = Math.ceil(structure.departments.length / 2);
                    const row1 = structure.departments.slice(0, splitIdx);
                    const row2 = structure.departments.slice(splitIdx);
                    return (
                      <>
                        <div className="w-full">
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 text-center">
                            ชั้นที่ 1: ส่วนราชการหลัก ({row1.length} ส่วนราชการ)
                          </div>
                          <div
                            className="grid gap-3 w-full"
                            style={{
                              gridTemplateColumns: `repeat(${row1.length}, minmax(0, 1fr))`
                            }}
                          >
                            {row1.map((dept, idx) => renderDeptColumn(dept, idx, row1.length))}
                          </div>
                        </div>

                        {/* Connector down to Tier 2 */}
                        <div className="flex flex-col items-center">
                          <div
                            className="w-0.5 h-6 bg-emerald-600"
                            style={{ backgroundColor: '#059669', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                          />
                          <div
                            className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                            style={{ backgroundColor: '#f1f5f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                          >
                            ชั้นที่ 2: ส่วนราชการบริการและสาธารณูปโภค ({row2.length} ส่วนราชการ)
                          </div>
                          <div
                            className="w-0.5 h-4 bg-emerald-600"
                            style={{ backgroundColor: '#059669', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                          />
                        </div>

                        {/* Row 2: Bottom Tier (e.g. 3 depts) */}
                        <div className="w-full max-w-4xl mx-auto">
                          <div
                            className="grid gap-3 w-full"
                            style={{
                              gridTemplateColumns: `repeat(${row2.length}, minmax(0, 1fr))`
                            }}
                          >
                            {row2.map((dept, idx) => renderDeptColumn(dept, idx, row2.length))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* SINGLE-ROW GRID (Fit or Wide) */
                <div
                  className="grid gap-3 w-full org-chart-dept-grid print:gap-1.5"
                  style={{
                    gridTemplateColumns:
                      chartLayout === 'fit'
                        ? `repeat(${Math.max(1, structure.departments.length)}, minmax(0, 1fr))`
                        : `repeat(${Math.max(1, structure.departments.length)}, minmax(190px, 1fr))`
                  }}
                >
                  {structure.departments.map((dept, idx) =>
                    renderDeptColumn(dept, idx, structure.departments.length)
                  )}
                </div>
              )}

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
                    {(dept.divisions || []).map((d, dIdx) => (
                      <div key={d.id || dIdx} className="py-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{d.name}</span>
                        {d.headTitle && <span className="text-[10px] text-amber-700 dark:text-amber-400 ml-1 font-medium">({d.headTitle})</span>}
                      </div>
                    ))}
                    {(!dept.divisions || dept.divisions.length === 0) && '-'}
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      หน่วยรับตรวจ อปท.
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Print Stylesheet for Landscape Layout */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
