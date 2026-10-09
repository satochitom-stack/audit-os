import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  ChevronRight,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Search,
  BookOpen,
  ArrowRight,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  Send,
  MessageSquareQuote,
  CheckSquare,
  AlertCircle,
  ClipboardCheck,
  Award
} from 'lucide-react';
import {
  AUDIT_DIMENSIONS,
  ENGAGEMENT_TYPES,
  INITIAL_ENGAGEMENT_PLANS,
  generateEngagementPlanWithAI
} from '../data/engagementPlanTemplates';
import { DLA_CORE_WORKFLOWS_6 } from '../data/dlaStandardTemplates';
import ConfirmModal from './ConfirmModal';
import { getDepartments } from '../utils/auth';

export default function EngagementPlanView({
  selectedYear = '2569',
  orgProfile,
  auditUniverse = [],
  annualPlans = [],
  engagementPlans = INITIAL_ENGAGEMENT_PLANS,
  setEngagementPlans,
  onNavigateToExecution
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'ai-copilot', 'detail', 'communication'
  const [selectedPlanId, setSelectedPlanId] = useState(engagementPlans[0]?.id || 'ENG-FIN-01');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [dimensionFilter, setDimensionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // AI Generator Form States
  const [aiDepartment, setAiDepartment] = useState('กองคลัง');
  const [aiActivity, setAiActivity] = useState('การจัดทำบัญชีและรายงานการเงิน');
  const [aiServiceType, setAiServiceType] = useState('assurance');
  const [aiDimension, setAiDimension] = useState('financial');
  const [aiCustomNotes, setAiCustomNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);

  // Edit / Add Program Step Modal States
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newStep, setNewStep] = useState({
    title: '',
    procedure: '',
    evidence: '',
    samplingMethod: 'สุ่มตรวจร้อยละ 20 ของเอกสารทั้งหมด',
    wpRef: 'WP-01'
  });

  const selectedPlan = engagementPlans.find((p) => p.id === selectedPlanId) || engagementPlans[0] || null;

  // Filtered Plans by Year, Service Type, Dimension, and Search
  const filteredPlans = engagementPlans.filter((p) => {
    const matchYear = !p.fiscalYear || p.fiscalYear === selectedYear;
    const matchType = serviceTypeFilter === 'all' || p.serviceType === serviceTypeFilter;
    const matchDimension =
      dimensionFilter === 'all' ||
      p.dimension === dimensionFilter ||
      (dimensionFilter === 'financial' && (p.serviceSubtype?.includes('การเงิน') || p.title?.includes('การเงิน') || p.title?.includes('บัญชี'))) ||
      (dimensionFilter === 'compliance' && (p.serviceSubtype?.includes('ระเบียบ') || p.title?.includes('จัดซื้อ') || p.title?.includes('พัสดุ') || p.title?.includes('สัญญา'))) ||
      (dimensionFilter === 'performance' && (p.serviceSubtype?.includes('ผลสัมฤทธิ์') || p.serviceSubtype?.includes('คุ้มค่า') || p.title?.includes('อาหาร') || p.title?.includes('เด็ก'))) ||
      (dimensionFilter === 'it_audit' && (p.serviceSubtype?.includes('สารสนเทศ') || p.title?.includes('ไอที') || p.title?.includes('คอมพิวเตอร์'))) ||
      (dimensionFilter === 'special' && (p.serviceSubtype?.includes('พิเศษ') || p.title?.includes('รถ') || p.title?.includes('น้ำมัน'))) ||
      (dimensionFilter === 'followup' && (p.serviceSubtype?.includes('ติดตาม') || p.title?.includes('ข้อทักท้วง') || p.title?.includes('สตง') || p.title?.includes('CAPA'))) ||
      (dimensionFilter === 'consulting' && (p.serviceType === 'consulting' || p.serviceSubtype?.includes('ปรึกษา')));

    const matchSearch =
      !searchTerm ||
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.activityName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchYear && matchType && matchDimension && matchSearch;
  });

  // AI Generation Handler
  const handleGenerateAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newPlan = generateEngagementPlanWithAI({
        activityName: aiActivity,
        department: aiDepartment,
        serviceType: aiServiceType,
        dimension: aiDimension,
        year: selectedYear,
        orgName: orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น',
        auditorName: orgProfile?.auditorName || 'หน่วยตรวจสอบภายใน',
        auditorPosition: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ',
        customGoal: aiCustomNotes
      });
      setGeneratedPreview(newPlan);
      setIsGenerating(false);
    }, 800);
  };

  const [deletePlanId, setDeletePlanId] = useState(null);

  const handleSaveGeneratedPlan = () => {
    if (!generatedPreview) return;
    const updated = [generatedPreview, ...engagementPlans];
    setEngagementPlans(updated);
    setSelectedPlanId(generatedPreview.id);
    setGeneratedPreview(null);
    setActiveTab('detail');
  };

  const handleLoadDlaEngagementPlans = () => {
    const formatted = DLA_CORE_WORKFLOWS_6.map((wf) => {
      let dim = 'compliance';
      if (wf.activityName.includes('บัญชี') || wf.activityName.includes('รับเงิน') || wf.activityName.includes('เบิกจ่าย')) dim = 'financial';
      if (wf.activityName.includes('รถยนต์')) dim = 'special';

      return {
        id: wf.code,
        title: `การตรวจสอบ${wf.activityName}`,
        activityName: wf.activityName,
        department: wf.department,
        fiscalYear: selectedYear,
        serviceType: 'assurance',
        serviceSubtype: wf.activityName.includes('รถยนต์')
          ? 'การตรวจสอบการควบคุมการใช้และรักษารถยนต์ส่วนกลาง'
          : 'การให้ความเชื่อมั่นทางการเงินและการปฏิบัติตามระเบียบ',
        dimension: dim,
        riskLevel: 'สูง',
        auditorName: wf.auditor,
        auditorPosition: wf.auditorPosition,
        approverName: wf.approver,
        approverPosition: wf.approverPosition,
        auditPlanId: wf.id,
        period: wf.period,
        fieldworkPeriod: wf.period,
        reasons: wf.reasons,
        objectives: wf.objectives,
        scope: wf.scope,
        criteria: wf.criteria,
        preliminaryRisks: wf.preliminaryRisks,
        auditStepsSummary: wf.auditStepsSummary,
        auditProgram: (wf.auditProgram || []).map((ap) => ({
          step: ap.step,
          title: ap.title,
          procedure: ap.procedure,
          evidence: ap.evidence,
          samplingMethod: ap.samplingMethod,
          wpRef: ap.wpRef,
          auditor: wf.auditor,
          status: 'pending'
        }))
      };
    });

    const existingIds = new Set(engagementPlans.map((p) => p.id));
    const newToAdd = formatted.filter((p) => !existingIds.has(p.id));
    if (newToAdd.length === 0) {
      alert('มีแผนปฏิบัติงานตรวจสอบตามคู่มือ สถ. ทั้ง 6 ภารกิจอยู่ในระบบแล้ว');
      return;
    }
    const updated = [...newToAdd, ...engagementPlans];
    setEngagementPlans(updated);
    setSelectedPlanId(newToAdd[0].id);
    setActiveTab('detail');
  };

  const handleDeletePlan = (id) => {
    setDeletePlanId(id);
  };

  const confirmDeletePlan = () => {
    if (!deletePlanId) return;
    const updated = engagementPlans.filter((p) => p.id !== deletePlanId);
    setEngagementPlans(updated);
    if (selectedPlanId === deletePlanId && updated.length > 0) {
      setSelectedPlanId(updated[0].id);
    }
    setDeletePlanId(null);
  };

  const handleAddStep = (e) => {
    e.preventDefault();
    if (!selectedPlan || !newStep.title) return;
    const updatedPlan = {
      ...selectedPlan,
      auditProgram: [
        ...(selectedPlan.auditProgram || []),
        {
          step: (selectedPlan.auditProgram?.length || 0) + 1,
          title: newStep.title,
          procedure: newStep.procedure,
          evidence: newStep.evidence,
          samplingMethod: newStep.samplingMethod,
          wpRef: newStep.wpRef,
          auditor: orgProfile?.auditorName || 'นายศุภมงคล ธรรมพิทักษ์',
          status: 'pending'
        }
      ]
    };
    const updated = engagementPlans.map((p) => (p.id === selectedPlan.id ? updatedPlan : p));
    setEngagementPlans(updated);
    setShowAddStepModal(false);
    setNewStep({ title: '', procedure: '', evidence: '', samplingMethod: 'สุ่มตรวจร้อยละ 20 ของเอกสารทั้งหมด', wpRef: 'WP-01' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden backdrop-blur-xs">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Building className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>ผู้ตรวจสอบ: {orgProfile?.auditorName || 'หน่วยตรวจสอบภายใน'}</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>ปีงบประมาณ พ.ศ. {selectedYear}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            แผนการปฏิบัติงานการตรวจสอบ (Audit Engagement Plan)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleLoadDlaEngagementPlans}
            className="flex items-center space-x-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
            title="โหลดแผนปฏิบัติงานและแนวการตรวจสอบ 6 ภารกิจหลักมาตรฐาน อปท. จากคู่มือ สถ."
          >
            <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>📥 โหลด 6 ภารกิจ (คู่มือ สถ.)</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-copilot')}
            className="flex items-center space-x-1.5 bg-amber-700 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>+ AI สร้างแผนตาม ว 614</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-white/80 hover:bg-white dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>พิมพ์แผน (A4)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-medium">แผนปฏิบัติการทั้งหมด</div>
            <div className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-1">
              {filteredPlans.length} <span className="text-xs font-normal text-stone-400">เรื่อง</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-medium">บริการให้ความเชื่อมั่น (Assurance)</div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
              {filteredPlans.filter((p) => p.serviceType === 'assurance').length}{' '}
              <span className="text-xs font-normal text-stone-400">เรื่อง</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-medium">บริการให้คำปรึกษา (Consulting)</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {filteredPlans.filter((p) => p.serviceType === 'consulting').length}{' '}
              <span className="text-xs font-normal text-stone-400">เรื่อง</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-medium">หน่วยรับตรวจในแผน</div>
            <div className="text-2xl font-bold text-stone-800 dark:text-stone-100 mt-1">
              {[...new Set(filteredPlans.map((p) => p.department))].length}{' '}
              <span className="text-xs font-normal text-stone-400">สำนัก/กอง</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 space-x-2 sm:space-x-4 print:hidden">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'list'
              ? 'border-amber-700 text-amber-800 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>รายการแผนปฏิบัติงาน ({filteredPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-copilot')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'ai-copilot'
              ? 'border-amber-600 text-amber-700 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI ผู้ช่วยอัจฉริยะ (ว 614)</span>
        </button>

        <button
          onClick={() => setActiveTab('detail')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'detail'
              ? 'border-amber-700 text-amber-800 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>แนวการตรวจ & กระดาษทำการ (Audit Program)</span>
        </button>

        <button
          onClick={() => setActiveTab('communication')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'communication'
              ? 'border-amber-700 text-amber-800 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4" />
          <span>การสื่อสารกัลยาณมิตร & หนังสือแจ้งเข้าตรวจ</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: รายการแผนปฏิบัติงานตรวจสอบ (Engagement Plans List)
      ========================================================================= */}
      {activeTab === 'list' && (
        <div className="space-y-4 print:hidden">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหากิจกรรม, กอง, หรือเรื่องที่ตรวจ..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-850 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-stone-500 font-medium shrink-0">บริการ:</span>
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => setServiceTypeFilter(e.target.value)}
                  className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="all">ทุกประเภทบริการ</option>
                  <option value="assurance">งานบริการให้ความเชื่อมั่น (Assurance)</option>
                  <option value="consulting">งานบริการให้คำปรึกษา (Consulting)</option>
                </select>
              </div>
            </div>

            {/* Dimension Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 text-xs">
              <span className="text-stone-400 font-medium shrink-0 mr-1 text-[11px]">มิติงานตรวจ:</span>
              {AUDIT_DIMENSIONS.map((dim) => {
                const isActive = dimensionFilter === dim.id;
                return (
                  <button
                    key={dim.id}
                    type="button"
                    onClick={() => setDimensionFilter(dim.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer flex items-center space-x-1 text-xs ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 shadow-xs border border-amber-500/30'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750'
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-80">[{dim.badge}]</span>
                    <span>{dim.label.split('(')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table of Engagement Plans */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100/90 dark:bg-stone-800/80 text-stone-700 dark:text-stone-200 font-bold border-b border-stone-200 dark:border-stone-700/80 text-xs">
                <tr>
                  <th className="py-3.5 px-4 w-32">รหัสแผน</th>
                  <th className="py-3.5 px-4">ชื่อเรื่อง / กิจกรรมตรวจสอบ</th>
                  <th className="py-3.5 px-4 w-36">หน่วยรับตรวจ</th>
                  <th className="py-3.5 px-4 w-48">มิติ & ประเภทงานตรวจ</th>
                  <th className="py-3.5 px-4 w-32">ระยะเวลาเข้าตรวจ</th>
                  <th className="py-3.5 px-4 w-28 text-center">ขั้นตอนตรวจ</th>
                  <th className="py-3.5 px-4 w-36 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      ไม่พบแผนปฏิบัติงานตรวจสอบที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setActiveTab('detail');
                      }}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-amber-800 dark:text-amber-400">
                        {plan.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-800 dark:text-stone-200">{plan.title}</div>
                        <div className="text-xs text-stone-500 mt-0.5">กิจกรรม: {plan.activityName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {plan.department}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">
                            {plan.dimension ? plan.dimension.toUpperCase() : 'AUDIT'}
                          </span>
                          {plan.serviceType === 'assurance' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                              ให้ความเชื่อมั่น
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ให้คำปรึกษา
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 line-clamp-1">{plan.serviceSubtype}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-600 dark:text-stone-400">
                        {plan.fieldworkPeriod || plan.period || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          {plan.auditProgram?.length || 0} ขั้นตอน
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1.5">
                          {onNavigateToExecution && (
                            <button
                              onClick={() => onNavigateToExecution(plan.id)}
                              className="px-2.5 py-1 text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-amber-300 dark:border-amber-700/60 flex items-center space-x-1"
                              title="เปิดกระดาษทำการตรวจสอบของโครงการนี้ (ขั้นที่ 6)"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                              <span>กระดาษทำการ</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedPlanId(plan.id);
                              setActiveTab('detail');
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="ดูแนวการตรวจ"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="ลบแผน"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: AI ผู้ช่วยอัจฉริยะ (AI Audit Engagement Copilot)
      ========================================================================= */}
      {activeTab === 'ai-copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          {/* Left Form: Select Activity & Generate */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  AI ออกแบบแผนปฏิบัติงาน ว 614
                </h3>
                <p className="text-xs text-slate-500">
                  เลือกกิจกรรมความเสี่ยง หรือพิมพ์เรื่องที่ต้องการเข้าตรวจ
                </p>
              </div>
            </div>

            {/* Quick Pick: กิจกรรมความเสี่ยงมาตรฐาน อปท. */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                🎯 เลือกจากกิจกรรมประเมินความเสี่ยงมาตรฐาน อปท.:
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {[
                  { name: 'การจัดทำบัญชีและรายงานการเงิน', dept: 'กองคลัง', score: '2.4 (สูง)' },
                  { name: 'การเก็บรักษาเงิน และการนำเงินฝากบัญชีธนาคาร', dept: 'กองคลัง', score: '2.0 (ปานกลาง)' },
                  { name: 'การเบิกจ่ายเงิน', dept: 'กองคลัง', score: '1.8 (ปานกลาง)' },
                  { name: 'การใช้และรักษารถยนต์', dept: 'สำนักปลัด', score: '2.0 (ปานกลาง)' },
                  { name: 'การจัดซื้อจัดจ้างและการบริหารพัสดุ (e-GP)', dept: 'กองคลัง', score: 'เกณฑ์มาตรฐาน' },
                  { name: 'การบริหารงานควบคุมอาคารและก่อสร้าง', dept: 'กองช่าง', score: 'เกณฑ์มาตรฐาน' }
                ].map((act, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiActivity(act.name);
                      setAiDepartment(act.dept);
                    }}
                    className={`text-left text-xs p-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      aiActivity === act.name
                        ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="truncate">{act.name}</span>
                    <span className="text-[10px] text-stone-400 shrink-0 ml-2">
                      {act.dept} • {act.score}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                หน่วยรับตรวจ (สำนัก/กอง):
              </label>
              <select
                value={aiDepartment}
                onChange={(e) => setAiDepartment(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {getDepartments().filter((d) => d !== 'หน่วยตรวจสอบภายใน').map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Activity Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                ชื่อกิจกรรม / เรื่องที่จะเข้าตรวจ:
              </label>
              <input
                type="text"
                value={aiActivity}
                onChange={(e) => setAiActivity(e.target.value)}
                placeholder="เช่น การจัดทำบัญชีและรายงานการเงิน..."
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Audit Dimension */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                มิติงานตรวจสอบ (Audit Dimension):
              </label>
              <select
                value={aiDimension}
                onChange={(e) => setAiDimension(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="financial">💰 การเงิน & บัญชี (Financial Audit: เงินสด, ฎีกา, KTB, e-LAAS)</option>
                <option value="compliance">📜 การปฏิบัติตามกฎหมายและระเบียบ (Compliance Audit: พัสดุฯ, ก่อสร้าง, ว 184)</option>
                <option value="performance">📈 การดำเนินงาน & ความคุ้มค่า 3Es (Performance Audit: ศพด., โครงการตามแผน)</option>
                <option value="it_audit">💻 ระบบเทคโนโลยีสารสนเทศ (IT Audit: สิทธิ์ระบบ, รหัสผ่าน, สำรองข้อมูล)</option>
                <option value="special">🔍 กรณีพิเศษ & สืบสวนทุจริต (Special Investigation: ข้อร้องเรียน, รถส่วนกลาง, น้ำมัน)</option>
                <option value="followup">🔄 ติดตามผลข้อทักท้วง (Follow-up Audit / CAPA: สตง., ผู้ตรวจภายใน)</option>
                <option value="consulting">🤝 บริการให้คำปรึกษา (Consulting Services: ปค.4/ปค.5, ออกแบบการควบคุม)</option>
              </select>
            </div>

            {/* Service Type per W614 */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                ประเภทงานบริการตรวจสอบ:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAiServiceType('assurance')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                    aiServiceType === 'assurance'
                      ? 'border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 ring-2 ring-stone-700/20'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>บริการให้ความเชื่อมั่น</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Assurance Service (ตรวจการเงิน / กฎระเบียบ)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAiServiceType('consulting')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                    aiServiceType === 'consulting'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1.5">
                    <MessageSquareQuote className="w-4 h-4 text-emerald-600" />
                    <span>บริการให้คำปรึกษา</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">Consulting Service (เพื่อนคู่คิด / ให้คำแนะนำ)</div>
                </button>
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                ประเด็นเน้นย้ำเพิ่มเติม (Optional):
              </label>
              <textarea
                value={aiCustomNotes}
                onChange={(e) => setAiCustomNotes(e.target.value)}
                rows={2}
                placeholder="เช่น เน้นเรื่องการกระทบยอดเงินฝากธนาคาร หรือตรวจเช็คค้างจ่ายเกิน 3 เดือน..."
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || !aiActivity}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI กำลังวิเคราะห์ระเบียบและแนวการตรวจ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>✨ ให้ AI ออกแบบแผนปฏิบัติงาน ว 614</span>
                </>
              )}
            </button>
          </div>

          {/* Right: AI Output Preview */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {!generatedPreview ? (
              <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 mb-3">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200">
                  ระบบผู้ช่วยอัจฉริยะ AI Audit Engagement Copilot
                </h4>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  เลือกกิจกรรมและประเภทงาน ว 614 จากฟอร์มด้านซ้าย แล้วกดปุ่มเพื่อให้ AI ช่วยสังเคราะห์
                  วัตถุประสงค์ ขอบเขต เกณฑ์กฎหมาย แนวการตรวจสเต็ปต่อสเต็ป และร่างหนังสือแจ้งเข้าตรวจอย่างเป็นมิตร
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                      {generatedPreview.planCode}
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-1">
                      {generatedPreview.title}
                    </h3>
                  </div>
                  <button
                    onClick={handleSaveGeneratedPlan}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกเข้าสู่แผนจริง</span>
                  </button>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300">
                    หน่วยรับตรวจ: <strong>{generatedPreview.department}</strong>
                  </span>
                  <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md font-semibold">
                    {generatedPreview.serviceSubtype}
                  </span>
                </div>

                {/* Objectives */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-200">🎯 วัตถุประสงค์การตรวจสอบ:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    {generatedPreview.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                {/* Criteria */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-200">📜 เกณฑ์การตรวจสอบ (Audit Criteria):</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                    {generatedPreview.criteria.map((cri, i) => (
                      <li key={i}>{cri}</li>
                    ))}
                  </ul>
                </div>

                {/* Audit Program Steps */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    📋 แนวการตรวจสอบ (Audit Program - {generatedPreview.auditProgram.length} ขั้นตอน):
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {generatedPreview.auditProgram.map((step) => (
                      <div
                        key={step.step}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1 bg-white dark:bg-slate-800"
                      >
                        <div className="font-semibold text-blue-700 dark:text-blue-300 flex items-center justify-between">
                          <span>
                            ขั้นที่ {step.step}: {step.title}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">{step.wpRef}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">{step.procedure}</p>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                          <span>🔍 การสุ่ม: {step.samplingMethod}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Friendly Mindset Banner */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                    <MessageSquareQuote className="w-4 h-4" />
                    <span>แนวทางการสื่อสารเชิงกัลยาณมิตร (เพื่อนคู่คิด):</span>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-200 text-[11px] mt-1 italic">
                    "{generatedPreview.consultingMindset.friendlyTheme}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State when no plan is selected or available for detail / communication tabs */}
      {(activeTab === 'detail' || activeTab === 'communication') && !selectedPlan && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4 print:hidden">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              ยังไม่มีแผนปฏิบัติงานตรวจสอบ (ว 614) ในปีนี้
            </h3>
            <p className="text-xs text-slate-500">
              กรุณาเลือกหรือสร้างแผนการปฏิบัติงานตรวจสอบใหม่ในแท็บ "รายการแผนงานตรวจ" หรือใช้ระบบสร้างด้วย AI
            </p>
          </div>
          <button
            onClick={() => setActiveTab('list')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            ไปที่แท็บรายการแผนงานตรวจ
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 3: แนวการตรวจ & กระดาษทำการ (Audit Program Detail)
      ========================================================================= */}
      {activeTab === 'detail' && selectedPlan && (
        <div className="space-y-6 print:hidden">
          {/* Plan Selector & Quick Info */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                  {selectedPlan.id}
                </span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="text-stone-500 font-medium">หน่วยรับตรวจ: {selectedPlan.department}</span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="text-stone-500 font-medium">
                  ผู้ตรวจ: {selectedPlan.auditorName || orgProfile?.auditorName}
                </span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                {selectedPlan.title}
              </h2>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <select
                value={selectedPlan.id}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {engagementPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id}: {p.title}
                  </option>
                ))}
              </select>
              {onNavigateToExecution && (
                <button
                  type="button"
                  onClick={() => onNavigateToExecution(selectedPlan.id)}
                  className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shadow-xs"
                  title="เปิดพื้นที่กระดาษทำการของโครงการนี้ (ขั้นที่ 6)"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>เปิดกระดาษทำการ</span>
                </button>
              )}
              <button
                onClick={() => setShowAddStepModal(true)}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มขั้นตอนตรวจ</span>
              </button>
            </div>
          </div>

          {/* Details 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Col 1: Objectives & Scope */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <span>วัตถุประสงค์ & ขอบเขต</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {selectedPlan.objectives?.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
              <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                <strong>ขอบเขตเวลา:</strong> {selectedPlan.scope?.timeframe || selectedPlan.period}
              </div>
            </div>

            {/* Col 2: Criteria */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>เกณฑ์การตรวจ (Criteria)</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {selectedPlan.criteria?.map((cri, i) => (
                  <li key={i}>{cri}</li>
                ))}
              </ul>
            </div>

            {/* Col 3: Risks & Controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>จุดเสี่ยง & การควบคุมสำคัญ</span>
              </h4>
              <div className="space-y-1.5">
                {selectedPlan.preliminaryRisks?.map((r, i) => (
                  <div key={i} className="text-xs p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                    <div className="font-semibold text-rose-800 dark:text-rose-300">⚠️ {r.risk}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      <strong>จุดตรวจ:</strong> {r.controlPoint}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Program Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  แนวการปฏิบัติงานตรวจสอบ (Audit Program Checklist)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                รวม {selectedPlan.auditProgram?.length || 0} ขั้นตอนการปฏิบัติงาน
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700/80">
                  <tr>
                    <th className="py-3 px-3 w-16 text-center">ขั้นที่</th>
                    <th className="py-3 px-4 w-52">หัวข้อการตรวจสอบ</th>
                    <th className="py-3 px-4">ขั้นตอนและวิธีตรวจสอบ (Audit Procedure)</th>
                    <th className="py-3 px-4 w-48">เอกสารหลักฐานที่เรียกตรวจ</th>
                    <th className="py-3 px-4 w-44">วิธีการสุ่มตัวอย่าง</th>
                    <th className="py-3 px-3 w-24 text-center">กระดาษทำการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedPlan.auditProgram?.map((item) => (
                    <tr key={item.step} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.step}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.procedure}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {item.evidence}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        <span className="inline-block bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {item.samplingMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded text-[11px]">
                          {item.wpRef}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: การสื่อสารกัลยาณมิตร & หนังสือแจ้งเข้าตรวจ
      ========================================================================= */}
      {activeTab === 'communication' && selectedPlan && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          {/* Left: Communication Philosophy */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-emerald-600">
                <MessageSquareQuote className="w-5 h-5" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  แนวคิด "เพื่อนคู่คิด ไม่จับผิด"
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ตามแนวทางหนังสือ ว 614 งานตรวจสอบภายในยุคใหม่ต้องมุ่งเน้นการเป็น <strong>ที่ปรึกษาและผู้ให้ความเชื่อมั่น</strong>{' '}
                เพื่อช่วยให้องค์กรลดความเสี่ยงจากระเบียบใหม่ และร่วมพัฒนาระบบงานให้ถูกต้อง ปลอดภัย ไร้ข้อทักท้วงจาก สตง.
              </p>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                <strong>หัวใจสำคัญ:</strong> สื่อสารวัตถุประสงค์ให้ชัดเจน รับฟังข้อจำกัดในการปฏิบัติงานของเพื่อนร่วมงาน และเสนอทางออกที่เป็นไปได้จริง
              </div>
            </div>

            {/* Opening Speech Template */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>คำกล่าวเปิดการตรวจ (Opening Speech):</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                "{selectedPlan.consultingMindset?.openingSpeech}"
              </p>
            </div>
          </div>

          {/* Right: Official Engagement Letter Template */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  แบบร่างหนังสือแจ้งเข้าตรวจล่วงหน้า (Engagement Letter)
                </h3>
              </div>
              <button
                onClick={handlePrint}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์หนังสือแจ้ง</span>
              </button>
            </div>

            {/* Letter Body Preview */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs space-y-3 font-serif leading-relaxed">
              <div className="text-center font-bold text-sm">
                บันทึกข้อความ
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>ส่วนราชการ:</strong> หน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</div>
                <div><strong>โทรศัพท์:</strong> 045-XXXXXX</div>
                <div><strong>ที่:</strong> ฝค 01/2568</div>
                <div><strong>วันที่:</strong> {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div>
                <strong>เรื่อง:</strong> {selectedPlan.consultingMindset?.engagementLetterSubject || `ขอแจ้งกำหนดการเข้าปฏิบัติงานตรวจสอบภายใน กิจกรรม "${selectedPlan.activityName}"`}
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <strong>เรียน:</strong> ผู้อำนวยการ{selectedPlan.department}
              </div>
              <p className="indent-8">
                ด้วยหน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} มีกำหนดการเข้าปฏิบัติงานตรวจสอบภายใน ประจำปีงบประมาณ พ.ศ. {selectedYear} กิจกรรม "<strong>{selectedPlan.activityName}</strong>" ในระหว่างวันที่ <strong>{selectedPlan.fieldworkPeriod || selectedPlan.period}</strong> ตามแผนปฏิบัติงานตรวจสอบที่ได้รับอนุมัติจากนายก{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}แล้ว
              </p>
              <p className="indent-8">
                การเข้าปฏิบัติงานตรวจสอบในครั้งนี้ เป็นไปตามแนวทาง <strong>{selectedPlan.serviceSubtype}</strong> ตามหนังสือกรมบัญชีกลาง ว 614 โดยมีวัตถุประสงค์เพื่อร่วมสนับสนุน ให้คำปรึกษา และตรวจทานความถูกต้องของการปฏิบัติงานให้สอดคล้องกับระเบียบกระทรวงมหาดไทยฉบับใหม่ เพื่อป้องกันความเสี่ยงและข้อทักท้วงจากหน่วยงานกำกับภายนอก มิได้มีเจตนาเพื่อการจับผิดแต่อย่างใด
              </p>
              <p className="indent-8">
                จึงเรียนมาเพื่อโปรดทราบ และขอความอนุเคราะห์แจ้งผู้รับผิดชอบจัดเตรียมเอกสารหลักฐานที่เกี่ยวข้องตามรายการแนบท้ายนี้ เพื่อความสะดวกและรวดเร็วในการปฏิบัติงานร่วมกันต่อไป
              </p>
              <div className="pt-6 flex justify-end">
                <div className="text-center space-y-1">
                  <div>( {selectedPlan.auditorName || orgProfile?.auditorName || 'นายศุภมงคล ธรรมพิทักษ์'} )</div>
                  <div className="text-[11px] text-slate-500">{selectedPlan.auditorPosition || orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. OFFICIAL PRINTABLE DOCUMENT (แบบพิมพ์ทางการสำหรับ A4)
      ========================================================================= */}
      {selectedPlan && (
        <div className="hidden print:block text-black bg-white p-8 font-serif leading-relaxed text-sm space-y-4">
          <div className="text-center space-y-1 pb-4 border-b-2 border-black">
            <h2 className="text-lg font-bold">แผนปฏิบัติงานการตรวจสอบ (Audit Engagement Plan)</h2>
            <h3 className="text-base font-semibold">
              กิจกรรม: {selectedPlan.activityName} ({selectedPlan.department})
            </h3>
            <div className="text-xs">
              หน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} ประจำปีงบประมาณ พ.ศ. {selectedYear}
            </div>
            <div className="text-xs italic text-slate-700">
              อ้างอิงตามหนังสือกรมบัญชีกลาง ด่วนที่สุด ที่ กค 0409.2/ว 614 ลงวันที่ 23 ธันวาคม 2563
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <strong>1. ข้อมูลทั่วไปและประเภทงานตรวจสอบ:</strong>
              <div className="pl-4 mt-0.5">
                • <strong>รหัสแผน:</strong> {selectedPlan.id} ({selectedPlan.planCode})<br />
                • <strong>ประเภทงานตาม ว 614:</strong> {selectedPlan.serviceSubtype}<br />
                • <strong>ระยะเวลาการตรวจสอบ:</strong> {selectedPlan.period} (เข้าตรวจภาคสนาม: {selectedPlan.fieldworkPeriod})<br />
                • <strong>ผู้รับผิดชอบการตรวจสอบ:</strong> {selectedPlan.auditorName || orgProfile?.auditorName} ({selectedPlan.auditorPosition || orgProfile?.auditorPosition})
              </div>
            </div>

            <div>
              <strong>2. วัตถุประสงค์การตรวจสอบ (Engagement Objectives):</strong>
              <ul className="list-decimal list-inside pl-4 mt-0.5 space-y-0.5">
                {selectedPlan.objectives?.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong>3. ขอบเขตการตรวจสอบ (Scope):</strong>
              <div className="pl-4 mt-0.5 space-y-0.5">
                <div>• <strong>เนื้อหา:</strong> {selectedPlan.scope?.content}</div>
                <div>• <strong>กรอบเวลา:</strong> {selectedPlan.scope?.timeframe}</div>
                <div>• <strong>ข้อจำกัดในการตรวจ:</strong> {selectedPlan.scope?.limitation}</div>
              </div>
            </div>

            <div>
              <strong>4. เกณฑ์การตรวจสอบ (Audit Criteria):</strong>
              <ul className="list-decimal list-inside pl-4 mt-0.5 space-y-0.5">
                {selectedPlan.criteria?.map((cri, idx) => (
                  <li key={idx}>{cri}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong>5. แนวการปฏิบัติงานตรวจสอบ (Audit Program):</strong>
              <table className="w-full border-collapse border border-black mt-2 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-black p-1.5 w-12 text-center">ลำดับ</th>
                    <th className="border border-black p-1.5 w-44">หัวข้อการตรวจสอบ</th>
                    <th className="border border-black p-1.5">ขั้นตอนและวิธีการตรวจสอบ</th>
                    <th className="border border-black p-1.5 w-32">วิธีการสุ่มตัวอย่าง</th>
                    <th className="border border-black p-1.5 w-16 text-center">กระดาษทำการ</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.auditProgram?.map((step) => (
                    <tr key={step.step}>
                      <td className="border border-black p-1.5 text-center">{step.step}</td>
                      <td className="border border-black p-1.5 font-bold">{step.title}</td>
                      <td className="border border-black p-1.5">{step.procedure}</td>
                      <td className="border border-black p-1.5">{step.samplingMethod}</td>
                      <td className="border border-black p-1.5 text-center font-bold">{step.wpRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature Block */}
          <div className="grid grid-cols-3 gap-4 pt-12 text-center text-xs">
            <div className="space-y-1">
              <div>ลงชื่อ....................................................ผู้จัดทำ</div>
              <div className="font-bold">({selectedPlan.auditorName || orgProfile?.auditorName || 'นายศุภมงคล ธรรมพิทักษ์'})</div>
              <div>{selectedPlan.auditorPosition || orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ'}</div>
              <div>วันที่ ....../....../......</div>
            </div>

            <div className="space-y-1">
              <div>ลงชื่อ....................................................ผู้เห็นชอบ</div>
              <div className="font-bold">({orgProfile?.palatName || '....................................................'})</div>
              <div>{orgProfile?.palatPosition || 'ปลัดองค์กรปกครองส่วนท้องถิ่น'}</div>
              <div>วันที่ ....../....../......</div>
            </div>

            <div className="space-y-1">
              <div>ลงชื่อ....................................................ผู้อนุมัติ</div>
              <div className="font-bold">({orgProfile?.approverName || '....................................................'})</div>
              <div>{orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
              <div>วันที่ ....../....../......</div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Add Program Step */}
      {showAddStepModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                เพิ่มขั้นตอนแนวการตรวจ (Audit Step)
              </h3>
              <button
                onClick={() => setShowAddStepModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStep} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  หัวข้อการตรวจสอบ:
                </label>
                <input
                  type="text"
                  required
                  value={newStep.title}
                  onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                  placeholder="เช่น ตรวจสอบความถูกต้องของการตัดจ่ายลูกหนี้..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ขั้นตอนและวิธีตรวจสอบ (Procedure):
                </label>
                <textarea
                  rows={3}
                  required
                  value={newStep.procedure}
                  onChange={(e) => setNewStep({ ...newStep, procedure: e.target.value })}
                  placeholder="อธิบายวิธีตรวจ สิ่งที่ต้องเทียบ เอกสารที่ต้องดู..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    วิธีการสุ่มตัวอย่าง:
                  </label>
                  <input
                    type="text"
                    value={newStep.samplingMethod}
                    onChange={(e) => setNewStep({ ...newStep, samplingMethod: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสกระดาษทำการ (WP Ref):
                  </label>
                  <input
                    type="text"
                    value={newStep.wpRef}
                    onChange={(e) => setNewStep({ ...newStep, wpRef: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เอกสารหลักฐานที่เรียกตรวจ:
                </label>
                <input
                  type="text"
                  value={newStep.evidence}
                  onChange={(e) => setNewStep({ ...newStep, evidence: e.target.value })}
                  placeholder="เช่น ทะเบียนคุม, ใบเสร็จรับเงิน, ฎีกา..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStepModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  บันทึกขั้นตอน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletePlanId}
        title="ยืนยันการลบแผนปฏิบัติงานตรวจ"
        message="คุณต้องการลบแผนปฏิบัติงานตรวจสอบ (ว 614) ฉบับนี้ใช่หรือไม่? วัตถุประสงค์ ขอบเขต และแนวการตรวจทั้งหมดของแผนนี้จะถูกนำออกจากระบบ"
        confirmText="ลบแผนปฏิบัติงาน"
        type="danger"
        onConfirm={confirmDeletePlan}
        onClose={() => setDeletePlanId(null)}
      />
    </div>
  );
}
