import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  FileText,
  DollarSign,
  ArrowRight,
  Filter,
  Plus,
  Send,
  Eye,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  AlertOctagon,
  Sparkles,
  BarChart3,
  Users,
  Table,
  LayoutGrid
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const INITIAL_DIRECTIVES = [];

export default function ExecutiveDashboardView({
  session,
  setCurrentTab,
  orgProfile = {},
  capaFindings = [],
  annualPlans = [],
  workingPapers = []
}) {
  const [directives, setDirectives] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_executive_directives');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const realOnes = parsed.filter((d) => !d.id?.startsWith('DIR-2569-00'));
          return realOnes;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DIRECTIVES;
  });

  const [activeTab, setActiveTab] = useState('overview'); // overview, directives, compliance
  const [scorecardViewMode, setScorecardViewMode] = useState('table'); // table or cards
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [showCreateDirectiveModal, setShowCreateDirectiveModal] = useState(false);
  const [selectedDirectiveForView, setSelectedDirectiveForView] = useState(null);

  // New directive form
  const [newDirective, setNewDirective] = useState({
    title: '',
    department: 'กองคลัง',
    dueDate: '',
    urgency: 'urgent_high',
    detail: '',
    legalRef: ''
  });

  // Confirm Modal
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const saveDirectives = (data) => {
    setDirectives(data);
    try {
      localStorage.setItem('ia_executive_directives', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDirective = (e) => {
    e.preventDefault();
    if (!newDirective.title || !newDirective.dueDate) {
      alert('กรุณากรอกหัวข้อและกำหนดวันที่ต้องการรายงานผลให้ครบถ้วน');
      return;
    }

    const item = {
      id: `DIR-${Date.now()}`,
      code: `ขสก.${directives.length + 1}/${new Date().getFullYear() + 543}`,
      title: newDirective.title,
      department: newDirective.department,
      issuer: session?.fullName || 'ผู้บริหาร อปท.',
      issuerRole: session?.role === 'admin' ? 'ผู้ดูแลระบบ / ตรวจสอบภายใน' : 'ผู้บริหาร อปท.',
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate: newDirective.dueDate,
      urgency: newDirective.urgency,
      status: 'in_progress',
      detail: newDirective.detail,
      departmentResponse: '',
      legalRef: newDirective.legalRef || 'ตามนโยบายบริหารงาน อปท.'
    };

    saveDirectives([item, ...directives]);
    setShowCreateDirectiveModal(false);
    setNewDirective({
      title: '',
      department: 'กองคลัง',
      dueDate: '',
      urgency: 'urgent_high',
      detail: '',
      legalRef: ''
    });
  };

  const handleUpdateStatus = (id, newStatus) => {
    const updated = directives.map((d) => (d.id === id ? { ...d, status: newStatus } : d));
    saveDirectives(updated);
    if (selectedDirectiveForView && selectedDirectiveForView.id === id) {
      setSelectedDirectiveForView((prev) => ({ ...prev, status: newStatus }));
    }
  };

  // Department statistics and scorecard based on real data
  const departmentsData = useMemo(() => {
    return [
      {
        id: 'สำนักปลัด',
        name: 'สำนักปลัด (รวมงานสาธารณสุขและสิ่งแวดล้อม)',
        code: 'clerk',
        tabKey: 'dept-office',
        head: 'หัวหน้าสำนักปลัด',
        complianceScore: null,
        riskTier: 'รอการประเมิน',
        openIssues: capaFindings.filter((c) => (c.department === 'สำนักปลัด' || c.department?.includes('สาธารณสุข') || c.department?.includes('สิ่งแวดล้อม')) && c.status !== 'verified_closed').length,
        budgetAllocated: 0,
        budgetSpent: 0,
        keyArea: 'การใช้รถยนต์และน้ำมัน (คย.01), งานสารบรรณ, นิติการ, ขยะมูลฝอย 6 หมู่บ้าน, ควบคุมโรคติดต่อ, สุขาภิบาลอาหาร'
      },
      {
        id: 'กองคลัง',
        name: 'กองคลัง',
        code: 'finance',
        tabKey: 'dept-finance',
        head: 'ผู้อำนวยการกองคลัง',
        complianceScore: null,
        riskTier: 'รอการประเมิน',
        openIssues: capaFindings.filter((c) => c.department === 'กองคลัง' && c.status !== 'verified_closed').length,
        budgetAllocated: 0,
        budgetSpent: 0,
        keyArea: 'สัญญาจัดซื้อจัดจ้าง (พ.ร.บ. 2560), ลูกหนี้เงินยืม, ภาษีที่ดิน'
      },
      {
        id: 'กองช่าง',
        name: 'กองช่าง',
        code: 'tech',
        tabKey: 'dept-tech',
        head: 'ผู้อำนวยการกองช่าง',
        complianceScore: null,
        riskTier: 'รอการประเมิน',
        openIssues: capaFindings.filter((c) => c.department === 'กองช่าง' && c.status !== 'verified_closed').length,
        budgetAllocated: 0,
        budgetSpent: 0,
        keyArea: 'ราคากลาง Factor F, ทดสอบคอนกรีต 28 วัน, ขออนุญาตก่อสร้าง 45 วัน'
      },
      {
        id: 'กองการศึกษา',
        name: 'กองการศึกษา ศาสนาและวัฒนธรรม',
        code: 'education',
        tabKey: 'dept-education',
        head: 'ผู้อำนวยการกองการศึกษา',
        complianceScore: null,
        riskTier: 'รอการประเมิน',
        openIssues: capaFindings.filter((c) => c.department?.includes('การศึกษา') && c.status !== 'verified_closed').length,
        budgetAllocated: 0,
        budgetSpent: 0,
        keyArea: 'อาหารกลางวัน ศพด. (24 บาท), นมโรงเรียน, จัดซื้อสื่อการสอน'
      },
      {
        id: 'กองสวัสดิการสังคม',
        name: 'กองสวัสดิการสังคม',
        code: 'welfare',
        tabKey: 'dept-welfare',
        head: 'ผู้อำนวยการกองสวัสดิการสังคม',
        complianceScore: null,
        riskTier: 'รอการประเมิน',
        openIssues: capaFindings.filter((c) => c.department?.includes('สวัสดิการ') && c.status !== 'verified_closed').length,
        budgetAllocated: 0,
        budgetSpent: 0,
        keyArea: 'เบี้ยยังชีพ 4 ขั้น (600-1000 บาท), คนพิการ, สงเคราะห์ผู้ประสบภัย'
      }
    ];
  }, [capaFindings]);

  // Overall financial sums (based on recorded data)
  const totalBudget = orgProfile?.annualBudget || departmentsData.reduce((sum, d) => sum + (d.budgetAllocated || 0), 0);
  const totalSpent = orgProfile?.budgetSpent || departmentsData.reduce((sum, d) => sum + (d.budgetSpent || 0), 0);
  const spentPercent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0';

  // Real Legal Countdown telemetry from actual recorded data
  const oagFindings = useMemo(() => {
    return capaFindings.filter(
      (c) => (c.source === 'oag' || c.sourceName?.includes('สตง') || c.sourceName?.includes('ตสน')) && c.status !== 'verified_closed'
    );
  }, [capaFindings]);

  const financeLoans = useMemo(() => {
    try {
      const f = JSON.parse(localStorage.getItem('ia_dept_finance_data') || '{}');
      if (Array.isArray(f.loans)) return f.loans;
    } catch (_) {}
    return [];
  }, []);
  const overdueLoans = financeLoans.filter((l) => l.status === 'overdue' || (l.status !== 'cleared' && !l.clearDate));

  const techPermits = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem('ia_dept_tech_data') || '{}');
      if (Array.isArray(t.buildingPermits)) return t.buildingPermits;
    } catch (_) {}
    return [];
  }, []);
  const pendingPermits = techPermits.filter((p) => p.status === 'reviewing' || p.status === 'pending');

  const inventoryItems = useMemo(() => {
    try {
      const f = JSON.parse(localStorage.getItem('ia_dept_finance_data') || '{}');
      if (Array.isArray(f.inventoryCheck)) return f.inventoryCheck;
    } catch (_) {}
    return [];
  }, []);

  // Filtered Directives
  const filteredDirectives = directives.filter((d) => {
    if (selectedDeptFilter !== 'all' && d.department !== selectedDeptFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-white dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden border border-blue-200/80 dark:border-blue-900/50">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>แดชบอร์ดและรายงานภาพรวมสำหรับผู้บริหาร (Executive Governance Cockpit)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              แดชบอร์ดผู้บริหาร {orgProfile.name || 'อบต.ฝางคำ'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              ติดตามสถานะความเสี่ยงองค์กร 5 สำนัก/กอง, วินัยการเงินการคลัง, กรอบเวลากฎหมายสำคัญ 
              และระบบสั่งการมอบหมายงานผู้บริหาร (Executive Directives)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateDirectiveModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกข้อสั่งการผู้บริหาร</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab && setCurrentTab('reporting')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-white/15 transition-all cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              <span>รายงานสรุปประจำปี</span>
            </button>
          </div>
        </div>

        {/* 4 Financial & Governance KPI Highlights (ตารางสรุป 4 มิติสำคัญ) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-blue-200/60 dark:border-white/10">
          <div className="bg-white/95 dark:bg-white/5 rounded-2xl p-4 border border-blue-200/80 dark:border-white/10 shadow-xs">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>งบประมาณรวมทั้งสิ้น</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {totalBudget > 0 ? (
                <>
                  {(totalBudget / 1000000).toFixed(2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">ลบ.</span>
                </>
              ) : (
                <>
                  0.00 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">บาท</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {totalBudget > 0 ? 'ปีงบประมาณ พ.ศ. 2569' : 'รอการบันทึกงบประมาณ'}
            </div>
          </div>

          <div className="bg-white/95 dark:bg-white/5 rounded-2xl p-4 border border-blue-200/80 dark:border-white/10 shadow-xs">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>การเบิกจ่ายงบประมาณ</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-300">
              {spentPercent}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {totalSpent > 0 ? `เบิกจ่าย ${(totalSpent / 1000000).toFixed(2)} ลบ.` : 'เบิกจ่าย 0.00 บาท'}
            </div>
          </div>

          <div className="bg-white/95 dark:bg-white/5 rounded-2xl p-4 border border-blue-200/80 dark:border-white/10 shadow-xs">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>ข้อทักท้วงคงค้าง (CAPA)</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-300">
              {capaFindings.filter((c) => c.status !== 'verified_closed').length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">ข้อ</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {capaFindings.filter((c) => c.status !== 'verified_closed').length > 0 ? 'อยู่ในกรอบ 60 วัน' : 'ไม่มีข้อทักท้วงคงค้าง'}
            </div>
          </div>

          <div className="bg-white/95 dark:bg-white/5 rounded-2xl p-4 border border-blue-200/80 dark:border-white/10 shadow-xs">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <Send className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>ข้อสั่งการผู้บริหาร</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {directives.filter((d) => d.status === 'in_progress').length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">เรื่องรอดำเนินการ</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              {directives.length > 0 ? `เสร็จสิ้น ${directives.filter((d) => d.status === 'completed').length} เรื่อง` : 'ไม่มีข้อสั่งการคงค้าง'}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Critical Legal Countdowns (มาตรการเฝ้าระวังทางกฎหมายและระเบียบเร่งด่วน) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              มาตรการเฝ้าระวังกรอบเวลากฎหมายสำคัญ (Critical Legal Countdowns)
            </h2>
          </div>
          <span className="text-xs text-slate-500">เฝ้าระวังอัตโนมัติตามระเบียบกฎหมาย อปท.</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. สตง. 60 วัน */}
          <div className="bg-gradient-to-b from-rose-50/50 via-white to-white dark:from-rose-950/20 dark:to-slate-900 rounded-2xl p-5 border border-rose-200/90 dark:border-rose-900/40 shadow-xs relative overflow-hidden group hover:border-rose-400 transition-all">
            <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
            <div className="flex items-start justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                กฎ 60 วัน สตง./ตสน.
              </span>
              <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
              รายงานผลแก้ไขข้อทักท้วง สตง.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
              ตาม พ.ร.บ. วินัยการเงินการคลัง พ.ศ. 2561 ต้องรายงานผลการแก้ไขข้อสังเกตภายใน 60 วัน
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">สถานะข้อสังเกต:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${oagFindings.length > 0 ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'}`}>
                {oagFindings.length > 0 ? `คงค้าง ${oagFindings.length} ข้อ` : 'ไม่มีข้อทักท้วง สตง. คงค้าง'}
              </span>
            </div>
          </div>

          {/* 2. ลูกหนี้เงินยืม 30 วัน */}
          <div className="bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:to-slate-900 rounded-2xl p-5 border border-amber-200/90 dark:border-amber-900/40 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-all">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
            <div className="flex items-start justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                กฎ 30 วัน ส่งใช้เงินยืม
              </span>
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
              ล้างหนี้เงินยืมทดรองราชการ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
              ระเบียบ มท. รับจ่ายเงิน 2566 ข้อ 94 ต้องส่งใช้ใบเสร็จภายใน 30 วันนับแต่วันสิ้นสุดโครงการ
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">ลูกหนี้ค้างส่งใช้:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${overdueLoans.length > 0 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'}`}>
                {overdueLoans.length > 0 ? `${overdueLoans.length} ราย (รอดำเนินการ)` : 'ไม่มีลูกหนี้ค้างส่งใช้'}
              </span>
            </div>
          </div>

          {/* 3. ขออนุญาตก่อสร้าง 45 วัน */}
          <div className="bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:to-slate-900 rounded-2xl p-5 border border-blue-200/90 dark:border-blue-900/40 shadow-xs relative overflow-hidden group hover:border-blue-400 transition-all">
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-500" />
            <div className="flex items-start justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                กฎ 45 วัน ควบคุมอาคาร
              </span>
              <Building2 className="w-5 h-5 text-blue-500 shrink-0" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
              พิจารณาคำขออนุญาตอาคาร (ข.1)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
              ตาม พ.ร.บ. ควบคุมอาคาร พ.ศ. 2522 ต้องตรวจแบบและแจ้งผลอนุญาต (แบบ อ.1) ใน 45 วัน
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">คำขอรอพิจารณา:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${pendingPermits.length > 0 ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                {pendingPermits.length > 0 ? `${pendingPermits.length} คำขอ` : 'ไม่มีคำขอค้างพิจารณา'}
              </span>
            </div>
          </div>

          {/* 4. ว 184 ตรวจสอบพัสดุประจำปี */}
          <div className="bg-gradient-to-b from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:to-slate-900 rounded-2xl p-5 border border-emerald-200/90 dark:border-emerald-900/40 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
            <div className="flex items-start justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ว 184 พัสดุประจำปี
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
              การตรวจสอบและจำหน่ายพัสดุ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
              หนังสือกรมส่งเสริมฯ ว 184 แต่งตั้งกรรมการสุ่มตรวจครุภัณฑ์และรายงานนายก อปท.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">สถานะดำเนินการ:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${inventoryItems.length > 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                {inventoryItems.length > 0 ? `บันทึกแล้ว ${inventoryItems.length} รายการ` : 'รอการบันทึกข้อมูลประจำปี'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Overview Scorecards vs. Executive Directives */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>คะแนนประเมินและสถานะ 5 สำนัก/กอง</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('directives')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'directives'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>ระบบข้อสั่งการผู้บริหาร ({directives.length})</span>
        </button>
      </div>

      {/* TAB 1: Department Scorecard & Heatmap */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                ดัชนีชี้วัดการปฏิบัติตามระเบียบและระดับความเสี่ยง 5 ส่วนราชการ (Department Governance Scorecard)
              </h3>
              <span className="text-xs text-slate-500">คลิกที่ส่วนราชการเพื่อเปิด Workspace เฉพาะทาง</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setScorecardViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scorecardViewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>ตารางสรุป</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScorecardViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scorecardViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>การ์ด</span>
                </button>
              </div>
            </div>
          </div>

          {scorecardViewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3.5">ส่วนราชการ (สำนัก/กอง)</th>
                      <th className="px-4 py-3.5">ผู้บังคับบัญชา / หัวหน้าส่วน</th>
                      <th className="px-4 py-3.5">จุดเน้นการตรวจสอบ</th>
                      <th className="px-3 py-3.5 text-center">ระดับความเสี่ยง</th>
                      <th className="px-4 py-3.5 text-center min-w-[150px]">คะแนนความโปร่งใส/ระเบียบ</th>
                      <th className="px-4 py-3.5 text-right">งบประมาณจัดสรร</th>
                      <th className="px-3 py-3.5 text-center">ข้อทักท้วงคงค้าง</th>
                      <th className="px-4 py-3.5 text-center">พื้นที่ปฏิบัติงาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {departmentsData.map((dept) => {
                      const riskColor =
                        dept.riskTier === 'สูง'
                          ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50'
                          : dept.riskTier === 'ปานกลาง'
                          ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50'
                          : dept.riskTier === 'ต่ำ'
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50'
                          : 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700';

                      const riskLabel = dept.riskTier === 'รอการประเมิน' ? 'รอการประเมิน' : `เสี่ยง${dept.riskTier}`;

                      return (
                        <tr
                          key={dept.id}
                          className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                          onClick={() => setCurrentTab && setCurrentTab(dept.tabKey)}
                        >
                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                            {dept.name}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <span className="font-semibold">{dept.head}</span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs">
                            {dept.keyArea}
                          </td>
                          <td className="px-3 py-3.5 text-center whitespace-nowrap">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${riskColor}`}>
                              {riskLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    dept.complianceScore >= 90
                                      ? 'bg-emerald-500'
                                      : dept.complianceScore >= 80
                                      ? 'bg-blue-500'
                                      : dept.complianceScore > 0
                                      ? 'bg-amber-500'
                                      : 'bg-transparent'
                                  }`}
                                  style={{ width: `${dept.complianceScore || 0}%` }}
                                />
                              </div>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 min-w-12 text-left">
                                {dept.complianceScore !== null && dept.complianceScore !== undefined ? `${dept.complianceScore}%` : 'รอประเมิน'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {dept.budgetAllocated > 0 ? `${(dept.budgetAllocated / 1000000).toFixed(2)} ลบ.` : 'รอการบันทึก'}
                          </td>
                          <td className="px-3 py-3.5 text-center whitespace-nowrap">
                            <span className={`font-semibold ${dept.openIssues > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {dept.openIssues > 0 ? `${dept.openIssues} ข้อ` : 'ไม่มีข้อตรวจพบ'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                              <span>เข้าหน้างาน</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentsData.map((dept) => {
                const riskColor =
                  dept.riskTier === 'สูง'
                    ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50'
                    : dept.riskTier === 'ปานกลาง'
                    ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50'
                    : dept.riskTier === 'ต่ำ'
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50'
                    : 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700';

                const riskLabel = dept.riskTier === 'รอการประเมิน' ? 'รอการประเมิน' : `เสี่ยง${dept.riskTier}`;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setCurrentTab && setCurrentTab(dept.tabKey)}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            {dept.head}
                          </div>
                          <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                            {dept.name}
                          </h4>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${riskColor}`}>
                          {riskLabel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>จุดเน้นตรวจ:</strong> {dept.keyArea}
                      </p>

                      {/* Progress Bar Score */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">คะแนนความโปร่งใส/ระเบียบ:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {dept.complianceScore !== null && dept.complianceScore !== undefined ? `${dept.complianceScore}%` : 'รอการประเมิน'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              dept.complianceScore >= 90
                                ? 'bg-emerald-500'
                                : dept.complianceScore >= 80
                                ? 'bg-blue-500'
                                : dept.complianceScore > 0
                                ? 'bg-amber-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${dept.complianceScore || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Budget & Issues Stats */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <div className="text-slate-400 text-[11px]">งบประมาณจัดสรร</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {dept.budgetAllocated > 0 ? `${(dept.budgetAllocated / 1000000).toFixed(2)} ลบ.` : 'รอการบันทึก'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">ข้อทักท้วงคงค้าง</div>
                          <div className={`font-semibold ${dept.openIssues > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {dept.openIssues > 0 ? `${dept.openIssues} ข้อ` : 'ไม่มีข้อตรวจพบ'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                      <span>เข้าสู่หน้างาน {dept.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Executive Directives / Orders System */}
      {activeTab === 'directives' && (
        <div className="space-y-4">
          {/* Directives Filter & Actions */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">กรองตามส่วนราชการ:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="all">ทุกสำนัก/กอง ({directives.length})</option>
                <option value="สำนักปลัด">สำนักปลัด (รวมงานสาธารณสุขฯ)</option>
                <option value="กองคลัง">กองคลัง</option>
                <option value="กองช่าง">กองช่าง</option>
                <option value="กองการศึกษา">กองการศึกษา</option>
                <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateDirectiveModal(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ออกข้อสั่งการใหม่</span>
            </button>
          </div>

          {/* Directives List */}
          <div className="space-y-3">
            {filteredDirectives.map((d) => {
              const isUrgent = d.urgency === 'urgent_high';
              const statusColor =
                d.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                  : d.status === 'reported'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800';

              const statusText =
                d.status === 'completed'
                  ? 'ตรวจรับแล้วเสร็จ'
                  : d.status === 'reported'
                  ? 'รายงานผลแล้ว รอสอบทาน'
                  : 'อยู่ระหว่างดำเนินการ';

              return (
                <div
                  key={d.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                          {d.code}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                          มอบหมาย: {d.department}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isUrgent
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900'
                          }`}
                        >
                          {isUrgent ? '⚡ ด่วนที่สุด' : 'ด่วน'}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {d.title}
                      </h4>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 text-left sm:text-right">
                      <div>ผู้สั่งการ: <strong className="text-slate-700 dark:text-slate-200">{d.issuer}</strong></div>
                      <div>กำหนดรายงาน: <strong className="text-rose-600 dark:text-rose-400">{d.dueDate}</strong></div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                    <strong>สาระสำคัญ:</strong> {d.detail}
                    {d.legalRef && (
                      <span className="block mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                        อ้างอิง: {d.legalRef}
                      </span>
                    )}
                  </p>

                  {d.departmentResponse && (
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-xs">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>รายงานผลจาก {d.department}:</span>
                      </div>
                      <p className="text-emerald-900 dark:text-emerald-200 text-xs">
                        {d.departmentResponse}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">
                      สั่งการเมื่อ: {d.assignedDate}
                    </span>

                    <div className="flex items-center space-x-2">
                      {d.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(d.id, 'reported')}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold transition-colors cursor-pointer"
                        >
                          บันทึกการรายงานผล
                        </button>
                      )}

                      {d.status === 'reported' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(d.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                        >
                          ลงนามตรวจรับข้อสั่งการ (เสร็จสิ้น)
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedDirectiveForView(d)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูรายละเอียด</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredDirectives.length === 0 && (
              <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Send className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <div className="font-bold text-sm text-slate-700 dark:text-slate-300">ไม่มีข้อสั่งการในส่วนราชการนี้</div>
                <div className="text-xs text-slate-500">สามารถกดปุ่ม "ออกข้อสั่งการใหม่" เพื่อมอบหมายงานได้ทันที</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: ออกข้อสั่งการผู้บริหารใหม่ */}
      {showCreateDirectiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-bold">
                <Send className="w-5 h-5 text-blue-600" />
                <span>บันทึกข้อสั่งการและมอบหมายงานผู้บริหาร</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateDirectiveModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirective} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  หัวข้อข้อสั่งการ / ภารกิจที่มอบหมาย <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เร่งรัดติดตามการคืนเงินยืม หรือ สรุปรายงานพัสดุประจำปี ว 184"
                  value={newDirective.title}
                  onChange={(e) => setNewDirective({ ...newDirective, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    สำนัก/กอง ที่รับมอบหมาย:
                  </label>
                  <select
                    value={newDirective.department}
                    onChange={(e) => setNewDirective({ ...newDirective, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="สำนักปลัด">สำนักปลัด (รวมงานสาธารณสุขและสิ่งแวดล้อม)</option>
                    <option value="กองคลัง">กองคลัง</option>
                    <option value="กองช่าง">กองช่าง</option>
                    <option value="กองการศึกษา">กองการศึกษา</option>
                    <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    ระดับความเร่งด่วน:
                  </label>
                  <select
                    value={newDirective.urgency}
                    onChange={(e) => setNewDirective({ ...newDirective, urgency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="urgent_high">⚡ ด่วนที่สุด</option>
                    <option value="urgent">ด่วนมาก</option>
                    <option value="normal">ด่วน / ปกติ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    กำหนดวันที่ต้องรายงานผล <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="date"
                    required
                    value={newDirective.dueDate}
                    onChange={(e) => setNewDirective({ ...newDirective, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    ระเบียบ/กฎหมายที่อ้างอิง:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ระเบียบ มท. รับจ่ายเงิน 2566"
                    value={newDirective.legalRef}
                    onChange={(e) => setNewDirective({ ...newDirective, legalRef: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  รายละเอียดและแนวทางสั่งการ:
                </label>
                <textarea
                  rows="3"
                  placeholder="ระบุข้อกำหนด ผลผลิตที่ต้องการ และแนวทางที่ให้ส่วนราชการดำเนินการ..."
                  value={newDirective.detail}
                  onChange={(e) => setNewDirective({ ...newDirective, detail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateDirectiveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกข้อสั่งการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ดูรายละเอียดข้อสั่งการ */}
      {selectedDirectiveForView && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-bold">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>รายละเอียดข้อสั่งการ ({selectedDirectiveForView.code})</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDirectiveForView(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                <div className="text-slate-400 text-[11px]">หัวข้อข้อสั่งการ:</div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {selectedDirectiveForView.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">ผู้รับมอบหมาย:</span>
                  <strong className="text-blue-700 dark:text-blue-400">{selectedDirectiveForView.department}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">กำหนดรายงาน:</span>
                  <strong className="text-rose-600 dark:text-rose-400">{selectedDirectiveForView.dueDate}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-500 font-bold">รายละเอียดข้อสั่งการ:</div>
                <p className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedDirectiveForView.detail}
                </p>
              </div>

              {selectedDirectiveForView.departmentResponse ? (
                <div className="space-y-1">
                  <div className="text-emerald-700 dark:text-emerald-400 font-bold">รายงานผลการดำเนินการ:</div>
                  <p className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-900 dark:text-emerald-200 leading-relaxed border border-emerald-200 dark:border-emerald-800">
                    {selectedDirectiveForView.departmentResponse}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                  ⏳ อยู่ระหว่างดำเนินการ ยังไม่มีการรายงานผลจากส่วนราชการ
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDirectiveForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        onConfirm={confirmModalConfig.onConfirm}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
