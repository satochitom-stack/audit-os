import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  Send,
  Calendar,
  Plus,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FileText,
  BadgeAlert,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Scale
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import AnnualAuditReportView from './AnnualAuditReportView';
import ReportExportHubModal from './ReportExportHubModal';
import { initialCapaFindings } from '../data/initialData';

export default function ReportingView({
  orgProfile = {},
  annualPlans = [],
  workingPapers = [],
  selectedYear = '2569',
  capaFindings = [],
  setCapaFindings = () => {},
  auditUniverse = [],
  engagementPlans = [],
  session = null
}) {
  const [activeTab, setActiveTab] = useState('annual-report'); // 'annual-report', 'report', 'exit', 'capa'
  const [showExportHubModal, setShowExportHubModal] = useState(false);
  const [selectedWpId, setSelectedWpId] = useState(() => workingPapers[0]?.id || '');

  useEffect(() => {
    if (workingPapers.length > 0 && !workingPapers.some((w) => w.id === selectedWpId)) {
      setSelectedWpId(workingPapers[0].id);
    }
  }, [workingPapers, selectedWpId]);

  // Use real capaFindings passed from props
  const findingsList = capaFindings || [];

  // CAPA Filters State
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [capaSearch, setCapaSearch] = useState('');

  // Modals State
  const [showAddCapaModal, setShowAddCapaModal] = useState(false);
  const [showCapaMemoModal, setShowCapaMemoModal] = useState(false);
  const [editingFinding, setEditingFinding] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reusable Confirm Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    type: 'danger',
    onConfirm: () => {}
  });

  const openConfirmModal = (config) => {
    setConfirmModalConfig({
      isOpen: true,
      title: config.title || 'ยืนยันการทำรายการ',
      message: config.message,
      confirmText: config.confirmText || 'ยืนยัน',
      type: config.type || 'danger',
      onConfirm: config.onConfirm || (() => {})
    });
  };

  // New Finding Form State
  const yearSuffix = (selectedYear || '2569').slice(-2);
  const getTodayISO = () => new Date().toISOString().slice(0, 10);
  const getPlus60DaysISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().slice(0, 10);
  };

  const [newCapa, setNewCapa] = useState({
    source: 'oag',
    sourceName: 'สำนักงานการตรวจเงินแผ่นดิน (สตง.)',
    title: '',
    department: 'กองคลัง',
    responsiblePerson: 'ผู้อำนวยการกองคลัง',
    severity: 'high',
    receivedDate: getTodayISO(),
    dueDate: getPlus60DaysISO(),
    condition: '',
    criteria: '',
    cause: '',
    effect: '',
    correctiveAction: '',
    preventiveAction: '',
    evidenceDocs: '',
    status: 'in_progress',
    auditorOpinion: '',
    executiveOrder: ''
  });

  // Calculate remaining days for 60-day legal countdown
  const getDaysRemaining = (dueDateStr) => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Handle Add or Edit Finding
  const handleSaveCapaFinding = (e) => {
    e.preventDefault();
    if (!newCapa.title.trim()) return;

    if (editingFinding) {
      // Update existing
      const updated = findingsList.map((item) =>
        item.id === editingFinding.id ? { ...item, ...newCapa } : item
      );
      setCapaFindings(updated);
      showToast(`อัปเดตข้อมูลข้อทักท้วง "${newCapa.title}" เรียบร้อยแล้ว`);
      setEditingFinding(null);
    } else {
      // Create new
      const prefix = newCapa.source === 'oag' ? 'CAPA-OAG' : newCapa.source === 'internal' ? 'CAPA-IA' : 'CAPA-INSP';
      const newId = `${prefix}-${yearSuffix}-0${findingsList.length + 1}`;
      const itemToAdd = {
        ...newCapa,
        id: newId,
        verifiedDate: newCapa.status === 'verified_closed' ? getTodayISO() : ''
      };
      setCapaFindings([itemToAdd, ...findingsList]);
      showToast(`บันทึกข้อทักท้วง "${newCapa.title}" เข้าสู่ระบบเรียบร้อยแล้ว`);
    }

    setShowAddCapaModal(false);
    setNewCapa({
      source: 'oag',
      sourceName: 'สำนักงานการตรวจเงินแผ่นดิน (สตง.)',
      title: '',
      department: 'กองคลัง',
      responsiblePerson: 'ผู้อำนวยการกองคลัง',
      severity: 'high',
      receivedDate: getTodayISO(),
      dueDate: getPlus60DaysISO(),
      condition: '',
      criteria: '',
      cause: '',
      effect: '',
      correctiveAction: '',
      preventiveAction: '',
      evidenceDocs: '',
      status: 'in_progress',
      auditorOpinion: '',
      executiveOrder: ''
    });
  };

  // Quick Verify & Close Finding by Auditor
  const handleVerifyAndClose = (findingId, title) => {
    openConfirmModal({
      title: 'รับรองผลและยุติข้อสังเกต',
      message: `คุณได้สอบทานพยานหลักฐานและข้อเท็จจริงของประเด็น "${title}" แล้ว เห็นชอบให้ยุติข้อสังเกตและปิดรายการใช่หรือไม่?`,
      confirmText: 'รับรองและยุติข้อสังเกต',
      type: 'success',
      onConfirm: () => {
        const updated = findingsList.map((item) =>
          item.id === findingId
            ? {
                ...item,
                status: 'verified_closed',
                verifiedDate: getTodayISO(),
                auditorOpinion: item.auditorOpinion || 'ผู้ตรวจสอบภายในได้สอบทานเอกสารหลักฐานแล้ว มีความถูกต้อง ครบถ้วนตามระเบียบ เห็นชอบยุติข้อสังเกต'
              }
            : item
        );
        setCapaFindings(updated);
        showToast('รับรองผลและยุติข้อสังเกตเรียบร้อยแล้ว');
      }
    });
  };

  // Delete Finding
  const handleDeleteCapa = (findingId, title) => {
    openConfirmModal({
      title: 'ยืนยันการลบข้อทักท้วง',
      message: `คุณต้องการลบข้อทักท้วง/ข้อสังเกต "${title}" ออกจากระบบ ใช่หรือไม่?`,
      confirmText: 'ลบรายการ',
      type: 'danger',
      onConfirm: () => {
        setCapaFindings(findingsList.filter((f) => f.id !== findingId));
        showToast('ลบรายการเรียบร้อยแล้ว');
      }
    });
  };

  // Toggle card accordion
  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered CAPA Findings
  const filteredCapaFindings = useMemo(() => {
    return findingsList.filter((f) => {
      const matchSource = selectedSourceFilter === 'all' || f.source === selectedSourceFilter;
      const matchStatus = selectedStatusFilter === 'all' || f.status === selectedStatusFilter;
      const matchSeverity = selectedSeverityFilter === 'all' || f.severity === selectedSeverityFilter;
      const matchDept = selectedDeptFilter === 'all' || f.department === selectedDeptFilter;
      const matchSearch =
        !capaSearch.trim() ||
        f.title.toLowerCase().includes(capaSearch.toLowerCase()) ||
        f.id.toLowerCase().includes(capaSearch.toLowerCase()) ||
        f.department.toLowerCase().includes(capaSearch.toLowerCase()) ||
        (f.condition && f.condition.toLowerCase().includes(capaSearch.toLowerCase()));
      return matchSource && matchStatus && matchSeverity && matchDept && matchSearch;
    });
  }, [findingsList, selectedSourceFilter, selectedStatusFilter, selectedSeverityFilter, selectedDeptFilter, capaSearch]);

  // Statistics
  const oagCount = useMemo(() => findingsList.filter((f) => f.source === 'oag').length, [findingsList]);
  const internalCount = useMemo(() => findingsList.filter((f) => f.source === 'internal').length, [findingsList]);
  const inspectorCount = useMemo(() => findingsList.filter((f) => f.source === 'inspector' || f.source === 'external').length, [findingsList]);
  const closedCount = useMemo(() => findingsList.filter((f) => f.status === 'verified_closed').length, [findingsList]);
  const overdueCount = useMemo(() => {
    return findingsList.filter((f) => f.status !== 'verified_closed' && getDaysRemaining(f.dueDate) < 0).length;
  }, [findingsList]);
  const urgentCount = useMemo(() => {
    return findingsList.filter((f) => f.status !== 'verified_closed' && getDaysRemaining(f.dueDate) >= 0 && getDaysRemaining(f.dueDate) <= 15).length;
  }, [findingsList]);

  // Report view data
  const currentWp = workingPapers.find((w) => w.id === selectedWpId) || workingPapers[0] || {};
  const relatedPlan = annualPlans.find((p) => p.id === currentWp.auditPlanId);
  const reportTitle = currentWp.topic || 'รายงานผลการตรวจสอบภายใน';
  const reportDept = currentWp.department || 'หน่วยรับตรวจ';
  const auditorName = orgProfile.auditorName?.trim() || 'ผู้ตรวจสอบภายใน';
  const auditorPosition = orgProfile.auditorPosition || 'นักวิชาการตรวจสอบภายใน';
  const approverName = orgProfile.approverName?.trim() || 'นายกองค์กรปกครองส่วนท้องถิ่น';
  const approverPosition = orgProfile.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น';
  const palatName = orgProfile.palatName?.trim() || 'ปลัดองค์กรปกครองส่วนท้องถิ่น';
  const palatPosition = orgProfile.palatPosition || 'ปลัดองค์กรปกครองส่วนท้องถิ่น';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 dark:bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 border border-slate-700 text-xs font-bold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('annual-report')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'annual-report'
                ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>รายงานผลการตรวจสอบประจำปี (Annual Report)</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'report'
                ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>รายงานผลรายกิจกรรม (WP Report)</span>
          </button>

          <button
            onClick={() => setActiveTab('exit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'exit'
                ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>การประชุมปิดตรวจ (Exit Conference)</span>
          </button>

          <button
            onClick={() => setActiveTab('capa')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'capa'
                ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ระบบติดตามข้อทักท้วง (CAPA Suite) ({findingsList.length})</span>
          </button>
        </div>

        {/* Global Tab Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'report' && workingPapers.length > 0 && (
            <select
              value={selectedWpId}
              onChange={(e) => setSelectedWpId(e.target.value)}
              className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer max-w-[260px] truncate focus:ring-2 focus:ring-amber-500"
            >
              {workingPapers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id}: {w.topic.slice(0, 30)}...
                </option>
              ))}
            </select>
          )}

          {activeTab === 'capa' && (
            <>
              <button
                onClick={() => setShowCapaMemoModal(true)}
                className="bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>บันทึกสรุปเสนอผู้บริหาร</span>
              </button>

              <button
                onClick={() => {
                  setEditingFinding(null);
                  setNewCapa({
                    source: 'oag',
                    sourceName: 'สำนักงานการตรวจเงินแผ่นดิน (สตง.)',
                    title: '',
                    department: 'กองคลัง',
                    responsiblePerson: 'ผู้อำนวยการกองคลัง',
                    severity: 'high',
                    receivedDate: getTodayISO(),
                    dueDate: getPlus60DaysISO(),
                    condition: '',
                    criteria: '',
                    cause: '',
                    effect: '',
                    correctiveAction: '',
                    preventiveAction: '',
                    evidenceDocs: '',
                    status: 'in_progress',
                    auditorOpinion: '',
                    executiveOrder: ''
                  });
                  setShowAddCapaModal(true);
                }}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มข้อทักท้วง / ข้อสังเกต</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowExportHubModal(true)}
            className="no-print bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก Excel ทางการ (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="no-print bg-stone-850 hover:bg-stone-800 text-stone-100 text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer border border-stone-700/60"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 0: ANNUAL AUDIT REPORT (รายงานผลการตรวจสอบภายในประจำปีงบประมาณ)
      ========================================================================= */}
      {activeTab === 'annual-report' && (
        <AnnualAuditReportView
          orgProfile={orgProfile}
          selectedYear={selectedYear}
          annualPlans={annualPlans}
          workingPapers={workingPapers}
          capaFindings={findingsList}
        />
      )}

      {/* =========================================================================
          TAB 1: AUDIT REPORT DOCUMENT (บันทึกข้อความรายงานผลการตรวจสอบ)
      ========================================================================= */}
      {activeTab === 'report' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto space-y-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
          {/* Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-6 text-center space-y-2">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">บันทึกข้อความ</div>
            <div className="flex justify-between items-baseline text-xs font-bold text-slate-700 dark:text-slate-300 pt-3">
              <div className="text-left">
                <span>ส่วนราชการ: </span>
                <span className="font-normal">{orgProfile.agencyName || 'หน่วยตรวจสอบภายใน'} {orgProfile.name}</span>
              </div>
              <div className="text-right">
                <span>ที่: </span>
                <span className="font-normal font-mono">อบ 78408/.............</span>
              </div>
            </div>
            <div className="flex justify-between items-baseline text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="text-left">
                <span>วันที่: </span>
                <span className="font-normal">...... เดือน ...................... พ.ศ. {selectedYear}</span>
              </div>
              <div className="text-left">
                <span>เรื่อง: </span>
                <span className="font-bold">รายงานผลการตรวจสอบภายใน {reportTitle}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <strong>เรียน:</strong> {approverPosition} (ผ่าน {palatPosition})
            </div>

            <p className="indent-8 text-justify leading-relaxed">
              ตามที่หน่วยตรวจสอบภายใน {orgProfile.name} ได้ดำเนินการเข้าปฏิบัติงานตรวจสอบ{' '}
              <strong>{reportTitle}</strong> ของ <strong>{reportDept}</strong>{' '}
              ตามแผนการตรวจสอบประจำปีงบประมาณ พ.ศ. {selectedYear} บัดนี้ การปฏิบัติงานตรวจสอบได้เสร็จสิ้นแล้ว จึงขอรายงานผลการตรวจสอบดังต่อไปนี้
            </p>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">1. วัตถุประสงค์และขอบเขตการตรวจสอบ</h4>
              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs leading-relaxed">
                {relatedPlan?.objective || `เพื่อตรวจสอบความถูกต้อง ครบถ้วน และการปฏิบัติตามกฎหมาย ระเบียบ ข้อบังคับ และหนังสือสั่งการที่เกี่ยวข้องของ ${reportDept}`}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">2. ข้อตรวจพบและข้อเสนอแนะ</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 text-xs">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-700 dark:text-blue-400 shrink-0">2.1 สภาพการณ์ที่ตรวจพบ:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {currentWp?.finding?.condition || 'ไม่พบข้อบกพร่องที่มีนัยสำคัญ / อยู่ระหว่างการลงข้อมูลในกระดาษทำการ'}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">2.2 สาเหตุ:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {currentWp?.finding?.cause || '-'}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-rose-700 dark:text-rose-400 shrink-0">2.3 ผลกระทบ:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {currentWp?.finding?.effect || '-'}
                  </span>
                </div>
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 space-y-1">
                  <div className="font-bold text-blue-950 dark:text-blue-300">2.4 ข้อเสนอแนะของผู้ตรวจสอบภายใน:</div>
                  <div className="text-blue-900 dark:text-blue-200">
                    {currentWp?.finding?.recommendation || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-8">
                <div>(ลงชื่อ)........................................................</div>
                <div>
                  <div className="font-bold">({auditorName})</div>
                  <div className="text-slate-500">{auditorPosition}</div>
                  <div className="text-[11px] text-slate-400">ผู้รายงาน</div>
                </div>
              </div>

              <div className="space-y-8">
                <div>(ลงชื่อ)........................................................</div>
                <div>
                  <div className="font-bold">({approverName})</div>
                  <div className="text-slate-500">{approverPosition}</div>
                  <div className="text-[11px] text-slate-400">ผู้อนุมัติ / สั่งการ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: EXIT CONFERENCE (การประชุมปิดตรวจ)
      ========================================================================= */}
      {activeTab === 'exit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              การประชุมปิดตรวจ (Exit Conference)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              นำเสนอข้อตรวจพบและร่วมหารือแนวทางปรับปรุงแก้ไขกับหัวหน้าส่วนราชการผู้รับตรวจก่อนออกรายงานฉบับสมบูรณ์
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <div className="font-bold text-blue-950 dark:text-blue-300 mb-1">วันและเวลาประชุม</div>
              <div className="text-slate-700 dark:text-slate-300">ตามที่นัดหมายหน่วยรับตรวจ</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <div className="font-bold text-blue-950 dark:text-blue-300 mb-1">สถานที่ประชุม</div>
              <div className="text-slate-700 dark:text-slate-300">ห้องประชุม {orgProfile.name}</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <div className="font-bold text-blue-950 dark:text-blue-300 mb-1">ประธานในที่ประชุม</div>
              <div className="text-slate-700 dark:text-slate-300">{palatName} ({palatPosition})</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              ประเด็นข้อตรวจพบที่นำเสนอในที่ประชุม ({reportTitle})
            </h4>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>ประเด็น: {currentWp.finding?.condition || 'ยังไม่ได้บันทึกข้อตรวจพบในกระดาษทำการ'}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
                ข้อเสนอแนะ: {currentWp.finding?.recommendation || 'สามารถเข้าไปกรอกข้อตรวจพบและข้อเสนอแนะได้ในโมดูลปฏิบัติการตรวจ'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CAPA TRACKING SUITE (ติดตามข้อทักท้วงและข้อสังเกตทุกด้าน)
      ========================================================================= */}
      {activeTab === 'capa' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-500/30 border border-indigo-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide">
                  Corrective & Preventive Action Suite
                </span>
                <span className="text-slate-300 text-xs">
                  พ.ร.บ. วินัยการเงินการคลัง พ.ศ. 2561 มาตรา 74 & ระเบียบ มท. ตรวจสอบภายใน อปท. 2545 ข้อ 25-26
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                ระบบบริหารและติดตามข้อทักท้วงและข้อสังเกต (CAPA Tracking Suite)
              </h2>
              <p className="text-slate-300 text-xs max-w-3xl leading-relaxed">
                ศูนย์กลางบันทึกและติดตามผลการปรับปรุงแก้ไขข้อบกพร่องทั้งการแก้ไขเฉพาะหน้า (Corrective Action) และมาตรการป้องกันเชิงระบบ (Preventive Action) พร้อมระบบนับถอยหลัง 60 วันตามระเบียบกฎหมายท้องถิ่น
              </p>
            </div>
          </div>

          {/* Statistical Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">ข้อทักท้วงทั้งหมด</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{findingsList.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">ทุกแหล่งที่มา</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">สตง. (OAG)</div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{oagCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">ตรวจเงินแผ่นดิน</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-purple-600 dark:text-purple-400 font-bold">ผู้ตรวจสอบภายใน</div>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">{internalCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">รายงานผลประจำปี</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-cyan-600 dark:text-cyan-400 font-bold">ผู้ตรวจราชการ สถ./สถจ.</div>
              <div className="text-2xl font-black text-cyan-700 dark:text-cyan-300 mt-1">{inspectorCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">ข้อสั่งการจังหวัด</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">ยุติข้อสังเกตแล้ว</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{closedCount}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">รับรองผลสมบูรณ์</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-rose-600 dark:text-rose-400 font-bold">เกินกำหนด / เร่งด่วน</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {overdueCount + urgentCount}
              </div>
              <div className="text-[10px] text-rose-500 mt-0.5">เกิน {overdueCount} | ด่วน {urgentCount}</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              {/* Source Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 font-bold mr-1">แหล่งที่มา:</span>
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'oag', label: 'สตง.' },
                  { id: 'internal', label: 'ผู้ตรวจสอบภายใน' },
                  { id: 'inspector', label: 'ผู้ตรวจราชการ สถ.' },
                  { id: 'external', label: 'ป.ป.ช./ภายนอก' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSourceFilter(s.id)}
                    className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedSourceFilter === s.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Status & Search */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl px-2.5 py-1.5 outline-none font-bold"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
                  <option value="submitted">หน่วยรับตรวจส่งรายงานแล้ว</option>
                  <option value="verified_closed">ยุติข้อสังเกตแล้ว (Verified Closed)</option>
                  <option value="pending">ยังไม่เริ่มดำเนินการ</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ค้นหาข้อทักท้วง..."
                    value={capaSearch}
                    onChange={(e) => setCapaSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs outline-none w-44"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CAPA Findings Cards List */}
          <div className="space-y-4">
            {filteredCapaFindings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">ไม่พบรายการข้อทักท้วงหรือข้อสังเกต</div>
                <p className="text-xs">สามารถกดปุ่ม "+ เพิ่มข้อทักท้วง / ข้อสังเกต" เพื่อบันทึกประเด็นและเริ่มนับเวลาติดตาม 60 วัน</p>
              </div>
            ) : (
              filteredCapaFindings.map((item) => {
                const daysRemaining = getDaysRemaining(item.dueDate);
                const isClosed = item.status === 'verified_closed';
                const isOverdue = !isClosed && daysRemaining < 0;
                const isUrgent = !isClosed && daysRemaining >= 0 && daysRemaining <= 15;
                const isExpanded = !!expandedCards[item.id];

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-xs overflow-hidden ${
                      isClosed
                        ? 'border-emerald-200 dark:border-emerald-950/60'
                        : isOverdue
                        ? 'border-rose-300 dark:border-rose-900/60'
                        : isUrgent
                        ? 'border-amber-300 dark:border-amber-900/60'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Source Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                              item.source === 'oag'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                                : item.source === 'internal'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                                : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900'
                            }`}
                          >
                            {item.sourceName || item.source}
                          </span>

                          <span className="font-mono font-bold text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {item.id}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.severity === 'critical'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : item.severity === 'high'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            ระดับ: {item.severity === 'critical' ? 'วิกฤติ' : item.severity === 'high' ? 'สูง' : 'ปานกลาง'}
                          </span>
                        </div>

                        {/* 60-Day Legal Countdown Timer Badge */}
                        <div className="flex items-center space-x-2">
                          {isClosed ? (
                            <span className="inline-flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ยุติข้อสังเกตแล้ว (Verified Closed)</span>
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 px-3 py-1 rounded-xl text-xs font-bold animate-pulse">
                              <BadgeAlert className="w-3.5 h-3.5 text-rose-600" />
                              <span>เกินกำหนด 60 วัน ({Math.abs(daysRemaining)} วัน)</span>
                            </span>
                          ) : isUrgent ? (
                            <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-xl text-xs font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>เร่งด่วน (เหลือ {daysRemaining} วัน)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-xl text-xs font-bold">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>รอบ 60 วัน (เหลือ {daysRemaining} วัน)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {item.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <div>
                          หน่วยรับผิดชอบ: <span className="font-bold text-slate-700 dark:text-slate-300">{item.department}</span> ({item.responsiblePerson})
                        </div>
                        <div>
                          วันที่รับหนังสือ: <span className="font-medium text-slate-700 dark:text-slate-300">{item.receivedDate}</span>
                        </div>
                        <div>
                          ครบกำหนด 60 วัน: <span className="font-bold text-slate-800 dark:text-slate-200">{item.dueDate}</span>
                        </div>
                      </div>

                      {/* Dual Action Pillars: Corrective Action (CA) & Preventive Action (PA) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {/* CA Box */}
                        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-1.5 text-xs">
                          <div className="flex items-center space-x-1.5 text-blue-950 dark:text-blue-200 font-bold">
                            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                            <span>การแก้ไขข้อบกพร่องเดิม (Corrective Action - CA)</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {item.correctiveAction || 'ยังไม่ได้ระบุการปรับปรุงแก้ไข'}
                          </p>
                        </div>

                        {/* PA Box */}
                        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1.5 text-xs">
                          <div className="flex items-center space-x-1.5 text-emerald-950 dark:text-emerald-200 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                            <span>มาตรการป้องกันไม่ให้เกิดซ้ำ (Preventive Action - PA)</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {item.preventiveAction || 'ยังไม่ได้ระบุมาตรการป้องกันเชิงระบบ'}
                          </p>
                        </div>
                      </div>

                      {/* Expandable Deep Findings (Condition, Criteria, Cause, Effect) */}
                      {isExpanded && (
                        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200">สภาพการณ์ที่ตรวจพบ (Condition):</span>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.condition || '-'}</p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200">เกณฑ์อ้างอิง/ระเบียบ (Criteria):</span>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.criteria || '-'}</p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200">สาเหตุที่แท้จริง (Root Cause):</span>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.cause || '-'}</p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200">ผลกระทบ/ความเสียหาย (Effect):</span>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.effect || '-'}</p>
                            </div>
                          </div>

                          {/* Evidence Docs & Auditor Verification */}
                          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-2">
                            <div>
                              <span className="font-bold text-amber-950 dark:text-amber-200">เอกสารหลักฐานอ้างอิง: </span>
                              <span className="text-slate-700 dark:text-slate-300">{item.evidenceDocs || 'ยังไม่มีการแนบเอกสารหลักฐาน'}</span>
                            </div>
                            <div>
                              <span className="font-bold text-amber-950 dark:text-amber-200">ความเห็นการสอบทานของผู้ตรวจสอบภายใน: </span>
                              <span className="text-slate-700 dark:text-slate-300">{item.auditorOpinion || 'อยู่ระหว่างรอการสอบทานเอกสาร'}</span>
                            </div>
                            {item.executiveOrder && (
                              <div>
                                <span className="font-bold text-amber-950 dark:text-amber-200">คำสั่งการผู้บริหารท้องถิ่น: </span>
                                <span className="text-slate-700 dark:text-slate-300">{item.executiveOrder}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Card Footer Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleCard(item.id)}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียดสภาพการณ์/เกณฑ์/สาเหตุ'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <div className="flex items-center space-x-2">
                          {!isClosed && (
                            <button
                              type="button"
                              onClick={() => handleVerifyAndClose(item.id, item.title)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center space-x-1 cursor-pointer transition-colors"
                              title="ผู้ตรวจสอบภายในสอบทานหลักฐานและยุติเรื่อง"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>รับรอง & ยุติข้อสังเกต</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingFinding(item);
                              setNewCapa(item);
                              setShowAddCapaModal(true);
                            }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                          >
                            แก้ไข / บันทึกผล
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCapa(item.id, item.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD OR EDIT CAPA FINDING
      ========================================================================= */}
      {showAddCapaModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="shrink-0 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {editingFinding ? 'แก้ไขข้อทักท้วง / บันทึกผลการปรับปรุง' : 'เพิ่มข้อทักท้วง / ข้อสังเกตใหม่ (CAPA)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCapaModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCapaFinding} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อประเด็นข้อทักท้วง / ข้อสังเกต</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ลูกหนี้เงินยืมทดรองราชการค้างส่งใช้ใบสำคัญเกินกำหนด..."
                  value={newCapa.title}
                  onChange={(e) => setNewCapa({ ...newCapa, title: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">แหล่งที่มาของข้อทักท้วง</label>
                  <select
                    value={newCapa.source}
                    onChange={(e) => {
                      const val = e.target.value;
                      const sName =
                        val === 'oag'
                          ? 'สำนักงานการตรวจเงินแผ่นดิน (สตง.)'
                          : val === 'internal'
                          ? 'หน่วยตรวจสอบภายใน อปท.'
                          : val === 'inspector'
                          ? 'ผู้ตรวจราชการ สถ. / จังหวัด'
                          : 'ป.ป.ช. / ภายนอก';
                      setNewCapa({ ...newCapa, source: val, sourceName: sName });
                    }}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="oag">สำนักงานการตรวจเงินแผ่นดิน (สตง.)</option>
                    <option value="internal">หน่วยตรวจสอบภายใน อปท.</option>
                    <option value="inspector">ผู้ตรวจราชการ สถ. / จังหวัด</option>
                    <option value="external">ป.ป.ช. / ป.ป.ท. / เรื่องร้องเรียน</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">หน่วยงานรับผิดชอบ</label>
                  <select
                    value={newCapa.department}
                    onChange={(e) => setNewCapa({ ...newCapa, department: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="กองคลัง">กองคลัง</option>
                    <option value="กองช่าง">กองช่าง</option>
                    <option value="กองการศึกษา">กองการศึกษา</option>
                    <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
                    <option value="สำนักปลัด">สำนักปลัด</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">วันที่รับหนังสือ / แจ้งผล</label>
                  <input
                    type="date"
                    value={newCapa.receivedDate}
                    onChange={(e) => setNewCapa({ ...newCapa, receivedDate: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">กำหนดรายงานผล 60 วัน</label>
                  <input
                    type="date"
                    value={newCapa.dueDate}
                    onChange={(e) => setNewCapa({ ...newCapa, dueDate: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ระดับความรุนแรง</label>
                  <select
                    value={newCapa.severity}
                    onChange={(e) => setNewCapa({ ...newCapa, severity: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="critical">วิกฤติ (Critical: ข้อทักท้วงชดใช้เงิน / ผิดระเบียบชัดแจ้ง)</option>
                    <option value="high">สูง (High: เสี่ยงต่อความเสียหาย)</option>
                    <option value="medium">ปานกลาง (Medium: ความล่าช้าทางธุรการ)</option>
                    <option value="low">ต่ำ (Low: ข้อแนะนำเชิงพัฒนา)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">สถานะการแก้ไข</label>
                  <select
                    value={newCapa.status}
                    onChange={(e) => setNewCapa({ ...newCapa, status: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="pending">ยังไม่ดำเนินการ</option>
                    <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
                    <option value="submitted">หน่วยรับตรวจส่งรายงานแล้ว</option>
                    <option value="verified_closed">ยุติข้อสังเกตแล้ว (Verified Closed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">สภาพการณ์ที่ตรวจพบ (Condition)</label>
                <textarea
                  rows="2"
                  value={newCapa.condition}
                  onChange={(e) => setNewCapa({ ...newCapa, condition: e.target.value })}
                  placeholder="ระบุข้อเท็จจริงที่ตรวจพบ..."
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                ></textarea>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">เกณฑ์มาตรฐาน / ระเบียบที่เกี่ยวข้อง (Criteria)</label>
                <input
                  type="text"
                  placeholder="เช่น ระเบียบ มท. รับจ่ายเงินฯ พ.ศ. 2566 ข้อ 94"
                  value={newCapa.criteria}
                  onChange={(e) => setNewCapa({ ...newCapa, criteria: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* CA & PA */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="font-bold text-blue-700 dark:text-blue-400">
                    การแก้ไขข้อบกพร่องเดิม (Corrective Action - CA)
                  </label>
                  <textarea
                    rows="2"
                    value={newCapa.correctiveAction}
                    onChange={(e) => setNewCapa({ ...newCapa, correctiveAction: e.target.value })}
                    placeholder="เช่น ออกหนังสือทวงถาม เรียกเงินคืนคลัง หรือปรับปรุงบัญชี..."
                    className="w-full mt-1 p-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="font-bold text-emerald-700 dark:text-emerald-400">
                    มาตรการป้องกันไม่ให้เกิดซ้ำ (Preventive Action - PA)
                  </label>
                  <textarea
                    rows="2"
                    value={newCapa.preventiveAction}
                    onChange={(e) => setNewCapa({ ...newCapa, preventiveAction: e.target.value })}
                    placeholder="เช่น วางระบบแจ้งเตือนดิจิทัล อบรมเจ้าหน้าที่ หรือกำหนดแนวปฏิบัติใหม่..."
                    className="w-full mt-1 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                  ></textarea>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">เอกสารหลักฐานอ้างอิง (Evidence Docs)</label>
                <input
                  type="text"
                  placeholder="เช่น ใบเสร็จรับเงินเล่มที่ 045 เลขที่ 22, หนังสือที่ อบ 78402/342"
                  value={newCapa.evidenceDocs}
                  onChange={(e) => setNewCapa({ ...newCapa, evidenceDocs: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ความเห็นการสอบทานของผู้ตรวจสอบภายใน</label>
                <textarea
                  rows="2"
                  value={newCapa.auditorOpinion}
                  onChange={(e) => setNewCapa({ ...newCapa, auditorOpinion: e.target.value })}
                  placeholder="บันทึกความเห็นของผู้ตรวจสอบภายในหลังสอบทานพยานหลักฐาน..."
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                ></textarea>
              </div>

              <div className="shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCapaModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: OFFICIAL CAPA SUMMARY MEMO FOR EXECUTIVE & DISTRICT CHIEF
      ========================================================================= */}
      {showCapaMemoModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  บันทึกข้อความรายงานผลการติดตามข้อทักท้วงและข้อสังเกต
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์บันทึกข้อความ</span>
                </button>
                <button
                  onClick={() => setShowCapaMemoModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Follow-Up Memo Body */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed bg-white dark:bg-slate-900">
              <div className="border-b-2 border-slate-900 dark:border-slate-600 pb-4 text-center space-y-2">
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">บันทึกข้อความ</div>
                <div className="flex justify-between items-baseline text-xs font-bold text-slate-700 dark:text-slate-300 pt-2">
                  <div className="text-left">
                    <span>ส่วนราชการ: </span>
                    <span className="font-normal">{orgProfile?.agencyName || 'หน่วยตรวจสอบภายใน'} {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</span>
                  </div>
                  <div className="text-right">
                    <span>ที่: </span>
                    <span className="font-normal font-mono">อบ 78408/.............</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="text-left">
                    <span>วันที่: </span>
                    <span className="font-normal">...... เดือน ...................... พ.ศ. {selectedYear}</span>
                  </div>
                  <div className="text-left">
                    <span>เรื่อง: </span>
                    <span className="font-bold">รายงานผลการติดตามการปฏิบัติตามข้อทักท้วงและข้อสังเกต ประจำปีงบประมาณ พ.ศ. {selectedYear}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <strong>เรียน:</strong> นายก{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} (ผ่าน ปลัด{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'})
                </div>

                <div className="space-y-3 text-justify indent-8">
                  <p>
                    ตามที่ สำนักงานการตรวจเงินแผ่นดิน (สตง.) ผู้ตรวจราชการกรมส่งเสริมการปกครองท้องถิ่น และหน่วยตรวจสอบภายใน ได้มีข้อทักท้วงและข้อสังเกตเกี่ยวกับการปฏิบัติงานทางการเงิน การพัสดุ และการบริหารงานของส่วนราชการในสังกัด {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} นั้น
                  </p>
                  <p>
                    หน่วยตรวจสอบภายใน ได้ดำเนินการติดตามผลการปรับปรุงแก้ไขข้อบกพร่องตามระเบียบกระทรวงมหาดไทย ว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2545 ข้อ 25 และข้อ 26 ครบถ้วนตามกรอบระยะเวลา 60 วันแล้ว จึงขอสรุปผลการติดตามการปฏิบัติตามข้อทักท้วงและข้อสังเกต รวมทั้งสิ้น <strong>{findingsList.length} เรื่อง</strong> โดยดำเนินการแล้วเสร็จและยุติข้อสังเกตได้ <strong>{closedCount} เรื่อง</strong> อยู่ระหว่างดำเนินการ <strong>{findingsList.length - closedCount} เรื่อง</strong> ดังมีรายละเอียดต่อไปนี้:
                  </p>
                </div>

                {/* Table Summary */}
                <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden my-3">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 dark:border-slate-700">
                      <tr>
                        <th className="p-2 text-center w-10">ลำดับ</th>
                        <th className="p-2">แหล่งที่มา</th>
                        <th className="p-2">ประเด็นข้อทักท้วง / ข้อสังเกต</th>
                        <th className="p-2">หน่วยงานรับผิดชอบ</th>
                        <th className="p-2 text-center">สถานะการแก้ไข</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {findingsList.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2 text-center">{idx + 1}</td>
                          <td className="p-2 font-bold">{item.sourceName?.split('(')[0] || item.source}</td>
                          <td className="p-2 font-semibold">{item.title}</td>
                          <td className="p-2">{item.department}</td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'verified_closed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status === 'verified_closed' ? 'ยุติเรื่องแล้ว' : 'อยู่ระหว่างดำเนินการ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 indent-8">
                  <p>
                    จึงเรียนมาเพื่อโปรดทราบและโปรดพิจารณาสั่งการ:
                  </p>
                  <p className="indent-12">
                    1. เร่งรัดให้หน่วยงานที่ยังอยู่ระหว่างดำเนินการ ดำเนินการให้แล้วเสร็จตามกำหนดเวลา
                  </p>
                  <p className="indent-12">
                    2. ส่งรายงานผลการปฏิบัติตามข้อทักท้วงไปยังนายอำเภอสิรินธรและสำนักงานการตรวจเงินแผ่นดินภูมิภาคตามระเบียบต่อไป
                  </p>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-6">
                    <div>(ลงชื่อ)........................................................</div>
                    <div>
                      <div className="font-bold">({orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})</div>
                      <div className="text-slate-500">{orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ'}</div>
                      <div className="text-[11px] text-slate-400">ผู้รายงาน</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>(ลงชื่อ)........................................................</div>
                    <div>
                      <div className="font-bold">({orgProfile?.palatName || 'ปลัด อปท.'})</div>
                      <div className="text-slate-500">{orgProfile?.palatPosition || 'ปลัดองค์กรปกครองส่วนท้องถิ่น'}</div>
                      <div className="text-[11px] text-slate-400">ผู้ตรวจสอบและเสนอความเห็น</div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 text-center text-xs space-y-6">
                  <div>
                    <div className="font-bold mb-4">คำสั่ง / ข้อสั่งการนายก อปท.: ทราบ และให้ดำเนินการตามเสนอ</div>
                    <div>(ลงชื่อ)........................................................</div>
                  </div>
                  <div>
                    <div className="font-bold">({orgProfile?.approverName || 'นายก อปท.'})</div>
                    <div className="text-slate-500">{orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                    <div className="text-[11px] text-slate-400">นายก{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        type={confirmModalConfig.type}
        onConfirm={confirmModalConfig.onConfirm}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Enterprise Report & Excel Export Hub Modal */}
      <ReportExportHubModal
        isOpen={showExportHubModal}
        onClose={() => setShowExportHubModal(false)}
        orgProfile={orgProfile}
        selectedYear={selectedYear}
        annualPlans={annualPlans}
        workingPapers={workingPapers}
        capaFindings={findingsList}
        auditUniverse={auditUniverse}
        engagementPlans={engagementPlans}
      />
    </div>
  );
}
