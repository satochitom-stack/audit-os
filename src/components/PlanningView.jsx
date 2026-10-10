import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
  ChevronRight,
  Printer,
  Sparkles,
  ArrowRight,
  Download,
  Trash2,
  Filter,
  Layers,
  Scale,
  BadgeDollarSign,
  TrendingUp,
  Cpu,
  ShieldAlert,
  HelpCircle,
  Clock,
  CheckSquare,
  Square,
  Search,
  ExternalLink,
  BookOpen,
  Edit3,
  Award
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import OfficialThaiMemo from './OfficialThaiMemo';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import {
  exportDataToExcel,
  exportThaiMemoToWord,
  exportDocumentToWord
} from '../utils/documentExportUtils';
import { AUDIT_DIMENSIONS, generateEngagementPlanWithAI } from '../data/engagementPlanTemplates';
import { DLA_ANNUAL_AUDIT_PLAN_DATA, DLA_STRATEGIC_PLAN_3YEARS } from '../data/dlaStandardTemplates';

export default function PlanningView({
  auditCharter,
  annualPlans = [],
  setAnnualPlans,
  riskAssessments = [],
  setRiskAssessments,
  auditUniverse = [],
  setAuditUniverse,
  engagementPlans = [],
  setEngagementPlans,
  strategicPlan = [],
  setStrategicPlan,
  orgProfile = {},
  selectedYear = '2569',
  setCurrentTab = () => {}
}) {
  // 4 Tabs: 'annual', 'strategic', 'risk', 'charter'
  const [activeTab, setActiveTab] = useState('annual');

  // Filter states for Annual Plan
  const [selectedDimension, setSelectedDimension] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showDlaPlanFormModal, setShowDlaPlanFormModal] = useState(false);
  const [showImportRiskModal, setShowImportRiskModal] = useState(false);
  const [showApprovalMemoModal, setShowApprovalMemoModal] = useState(false);
  const [showAddStrategicModal, setShowAddStrategicModal] = useState(false);
  const [showAddRisk, setShowAddRisk] = useState(false);
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

  // New Plan form state
  const yearSuffix = (selectedYear || orgProfile?.fiscalYear || '2569').slice(-2);
  const [newPlan, setNewPlan] = useState({
    title: '',
    dimension: 'compliance',
    department: 'กองคลัง',
    quarter: `ไตรมาส 1 (ต.ค. - ธ.ค. ${yearSuffix})`,
    period: `ต.ค. - ธ.ค. ${yearSuffix}`,
    riskLevel: 'สูง',
    budget: 5000,
    objective: ''
  });

  // New Strategic Plan form state
  const [newStrategic, setNewStrategic] = useState({
    department: 'กองคลัง',
    activity: '',
    riskLevel: 'สูง',
    frequency: 'ทุกปี (Annual)',
    years: { '2568': false, '2569': true, '2570': false, '2571': false, '2572': false },
    responsibleAuditor: 'หน่วยตรวจสอบภายใน'
  });

  // New Risk Assessment form state
  const [newRisk, setNewRisk] = useState({
    agency: 'กองคลัง',
    activity: '',
    dimension: 'compliance',
    riskFactor: '',
    likelihood: 3,
    impact: 3,
    treatment: ''
  });

  // Selected items in Import High-Risk Modal
  const [selectedRisksToImport, setSelectedRisksToImport] = useState([]);

  // Detect high risk items from auditUniverse that are not yet in annualPlans
  const eligibleHighRiskCandidates = useMemo(() => {
    return auditUniverse.filter((item) => {
      const alreadyInPlan = annualPlans.some((p) => {
        if (p.sourceRiskId && p.sourceRiskId === item.id) return true;
        const titleMatch = (p.title === item.activity || p.topic === item.activity || p.projectName === item.activity);
        if (!titleMatch) return false;
        if (p.department && item.department) return p.department.trim() === item.department.trim();
        return true;
      });
      if (alreadyInPlan) return false;
      const score = item.score || ((item.sScore || 1) * 0.2 + (item.oScore || 1) * 0.25 + (item.fScore || 1) * 0.15 + (item.cScore || 1) * 0.2 + (item.kScore || 1) * 0.2);
      const isHigh = item.level === 'สูงมาก' || item.level === 'สูง' || score >= 2.3 || item.activity.includes('บัญชี') || item.activity.includes('พัสดุ') || item.activity.includes('เงิน');
      return isHigh;
    });
  }, [auditUniverse, annualPlans]);

  // Dimension Helper
  const getDimConfig = (dimId) => {
    return AUDIT_DIMENSIONS.find((d) => d.id === dimId) || {
      id: dimId || 'compliance',
      label: 'การปฏิบัติตามกฎระเบียบ (Compliance)',
      badge: 'COMP'
    };
  };

  const getDimensionBadgeStyle = (dimId) => {
    switch (dimId) {
      case 'financial':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'compliance':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'performance':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'it_audit':
        return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'special':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'followup':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'consulting':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // Add Plan Handler
  const handleAddPlan = (e) => {
    e.preventDefault();
    if (!newPlan.title.trim()) return;
    const planId = `PLAN-${yearSuffix}-0${annualPlans.length + 1}`;
    const itemToAdd = {
      ...newPlan,
      id: planId,
      status: 'pending',
      progress: 0,
      budget: Number(newPlan.budget) || 0
    };
    setAnnualPlans([...annualPlans, itemToAdd]);
    setShowAddPlan(false);
    showToast(`เพิ่มโครงการ "${newPlan.title}" ในแผนประจำปี ${selectedYear} เรียบร้อยแล้ว`);
    setNewPlan({
      title: '',
      dimension: 'compliance',
      department: 'กองคลัง',
      quarter: `ไตรมาส 1 (ต.ค. - ธ.ค. ${yearSuffix})`,
      period: `ต.ค. - ธ.ค. ${yearSuffix}`,
      riskLevel: 'สูง',
      budget: 5000,
      objective: ''
    });
  };

  // Load DLA Official Annual Plan (Page 16)
  const handleLoadDlaAnnualPlan = () => {
    openConfirmModal({
      title: 'นำเข้าแผนปฏิบัติการประจำปีตามคู่มือ สถ.',
      message: `ต้องการนำเข้าโครงการตรวจสอบ 6 ภารกิจหลัก (กองคลัง 5 โครงการ, กองช่าง 1 โครงการ) ตามคู่มือ สถ. หน้า 16 สำหรับปีงบประมาณ ${selectedYear} หรือไม่?`,
      confirmText: 'นำเข้า 6 โครงการ',
      type: 'info',
      onConfirm: () => {
        const existingTitles = new Set(annualPlans.map((p) => p.title));
        const formatted = DLA_ANNUAL_AUDIT_PLAN_DATA.map((dla, idx) => {
          let dim = 'compliance';
          if (dla.projectName.includes('บัญชี') || dla.projectName.includes('รับเงิน') || dla.projectName.includes('เบิกจ่าย')) dim = 'financial';
          if (dla.projectName.includes('รถยนต์')) dim = 'special';
          return {
            id: `PLAN-${yearSuffix}-DLA0${idx + 1}`,
            title: dla.projectName,
            dimension: dim,
            department: dla.department,
            quarter: dla.timing,
            period: dla.timing,
            riskLevel: dla.riskLevel || 'สูง',
            budget: dla.budget || 2000,
            manDays: dla.manDays || 30,
            auditor: dla.auditor,
            objective: `เพื่อตรวจสอบการปฏิบัติงานและให้ความเชื่อมั่นกิจกรรม ${dla.projectName} ตามแนวทางปฏิบัติงานตรวจสอบภายใน อปท. (กรมส่งเสริมการปกครองท้องถิ่น)`,
            status: dla.status || 'pending',
            progress: dla.status === 'completed' ? 100 : dla.status === 'in_progress' ? 45 : 0
          };
        }).filter(item => !existingTitles.has(item.title));

        if (formatted.length === 0) {
          showToast('มีโครงการตามคู่มือ สถ. ทั้งหมดอยู่ในแผนแล้ว');
          return;
        }

        setAnnualPlans([...annualPlans, ...formatted]);
        showToast(`นำเข้าโครงการตรวจสอบ ${formatted.length} รายการตามคู่มือ สถ. เรียบร้อยแล้ว`);
      }
    });
  };

  // Load DLA Strategic Plan (Pages 12-14)
  const handleLoadDlaStrategicPlan = () => {
    openConfirmModal({
      title: 'นำเข้าแผนการตรวจสอบระยะยาว 3 ปี ตามคู่มือ สถ.',
      message: 'ต้องการนำเข้าแผนระยะยาว 16 กิจกรรม (กรอบ 590 คน-วัน) ตามคู่มือ สถ. หน้า 12-14 หรือไม่?',
      confirmText: 'นำเข้าแผนระยะยาว',
      type: 'info',
      onConfirm: () => {
        const y1Items = (DLA_STRATEGIC_PLAN_3YEARS.year1?.breakdown || []).map((b, idx) => ({
          id: `STRAT-Y1-0${idx + 1}`,
          department: b.unit,
          activity: b.activity,
          riskLevel: b.risk,
          frequency: 'ทุกปี (Annual)',
          years: { '2568': false, '2569': true, '2570': false, '2571': false, '2572': false },
          responsibleAuditor: 'หน่วยตรวจสอบภายใน'
        }));
        const y2Items = (DLA_STRATEGIC_PLAN_3YEARS.year2?.breakdown || []).map((b, idx) => ({
          id: `STRAT-Y2-0${idx + 1}`,
          department: b.unit,
          activity: b.activity,
          riskLevel: b.risk,
          frequency: 'ทุก 2 ปี (Biennial)',
          years: { '2568': false, '2569': false, '2570': true, '2571': false, '2572': false },
          responsibleAuditor: 'หน่วยตรวจสอบภายใน'
        }));
        const y3Items = (DLA_STRATEGIC_PLAN_3YEARS.year3?.breakdown || []).map((b, idx) => ({
          id: `STRAT-Y3-0${idx + 1}`,
          department: b.unit,
          activity: b.activity,
          riskLevel: b.risk,
          frequency: 'ทุก 3 ปี (Triennial)',
          years: { '2568': false, '2569': false, '2570': false, '2571': true, '2572': false },
          responsibleAuditor: 'หน่วยตรวจสอบภายใน'
        }));

        const combined = [...y1Items, ...y2Items, ...y3Items];
        setStrategicPlan(combined);
        showToast(`นำเข้าแผนระยะยาว 16 กิจกรรม (590 คน-วัน) ตามคู่มือ สถ. สำเร็จ`);
      }
    });
  };

  // Save Edited Plan
  const handleSaveEditPlan = (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    const updated = annualPlans.map((p) =>
      p.id === editingPlan.id
        ? {
            ...editingPlan,
            budget: Number(editingPlan.budget) || 0,
            progress: Number(editingPlan.progress) || 0
          }
        : p
    );
    setAnnualPlans(updated);
    setShowEditPlanModal(false);
    setEditingPlan(null);
    showToast(`บันทึกการแก้ไขโครงการ "${editingPlan.title}" เรียบร้อยแล้ว`);
  };

  // Batch Import High-Risk Items Handler
  const handleBatchImportHighRisk = () => {
    if (selectedRisksToImport.length === 0) return;
    const newItems = selectedRisksToImport.map((item, idx) => {
      const planId = `PLAN-${yearSuffix}-0${annualPlans.length + idx + 1}`;
      // Infer dimension based on activity name
      let dim = 'compliance';
      if (item.activity.includes('บัญชี') || item.activity.includes('การเงิน') || item.activity.includes('เงินฝาก') || item.activity.includes('เบิกจ่าย')) {
        dim = 'financial';
      } else if (item.activity.includes('คอมพิวเตอร์') || item.activity.includes('สารสนเทศ') || item.activity.includes('IT')) {
        dim = 'it_audit';
      } else if (item.activity.includes('อาหารกลางวัน') || item.activity.includes('เบี้ยยังชีพ') || item.activity.includes('ผลสัมฤทธิ์')) {
        dim = 'performance';
      } else if (item.activity.includes('รถ') || item.activity.includes('น้ำมัน') || item.activity.includes('สืบสวน')) {
        dim = 'special';
      }

      return {
        id: planId,
        sourceRiskId: item.id,
        title: item.activity,
        dimension: dim,
        department: item.department || 'กองคลัง',
        quarter: `ไตรมาส ${(idx % 4) + 1} (พ.ศ. ${selectedYear})`,
        period: `พ.ศ. ${selectedYear}`,
        riskLevel: item.level || 'สูงมาก',
        budget: 5000,
        objective: `เพื่อตรวจสอบการปฏิบัติงานและประเมินประสิทธิภาพกิจกรรม ${item.activity} ตามผลการประเมินความเสี่ยงที่มีนัยสำคัญ`,
        status: 'pending',
        progress: 0
      };
    });

    setAnnualPlans([...annualPlans, ...newItems]);

    // Update includedInPlan in auditUniverse
    const importedIds = new Set(selectedRisksToImport.map((r) => r.id));
    const updatedUniverse = auditUniverse.map((u) => (importedIds.has(u.id) ? { ...u, includedInPlan: true } : u));
    setAuditUniverse(updatedUniverse);

    setShowImportRiskModal(false);
    setSelectedRisksToImport([]);
    showToast(`ดึงรายการความเสี่ยงสูง ${newItems.length} รายการเข้าสู่แผนประจำปี ${selectedYear} สำเร็จ`);
  };

  // Open / Create Linked Engagement Plan
  const handleOpenEngagementPlan = (plan) => {
    // Check if engagement plan exists
    let existing = engagementPlans.find(
      (ep) => ep.auditPlanId === plan.id || ep.title === plan.title || ep.activityName === plan.title
    );

    if (!existing) {
      // Auto-generate comprehensive engagement plan linked to this annual plan
      const newEp = generateEngagementPlanWithAI({
        activityName: plan.title,
        department: plan.department || 'กองคลัง',
        dimension: plan.dimension || 'compliance',
        serviceType: plan.dimension === 'consulting' ? 'consulting' : 'assurance',
        year: selectedYear,
        orgName: orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น',
        auditorName: orgProfile?.auditorName || 'หน่วยตรวจสอบภายใน',
        auditorPosition: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'
      });
      newEp.auditPlanId = plan.id;
      newEp.riskLevel = plan.riskLevel || 'สูง';
      setEngagementPlans([...engagementPlans, newEp]);
      showToast(`สร้างแผนปฏิบัติการตรวจสอบ (Engagement Plan) สำหรับ "${plan.title}" เรียบร้อยแล้ว`);
    }

    setCurrentTab('engagement-plan');
  };

  // Delete Annual Plan Item
  const handleDeleteAnnualPlan = (planId, title) => {
    openConfirmModal({
      title: 'ยืนยันการลบโครงการตรวจสอบ',
      message: `คุณต้องการลบโครงการ "${title}" ออกจากแผนประจำปี พ.ศ. ${selectedYear} ใช่หรือไม่?`,
      confirmText: 'ลบโครงการ',
      type: 'danger',
      onConfirm: () => {
        const deletedPlan = annualPlans.find((p) => p.id === planId);
        setAnnualPlans(annualPlans.filter((p) => p.id !== planId));
        if (deletedPlan && setAuditUniverse && auditUniverse.length > 0) {
          const updatedUniverse = auditUniverse.map((u) => {
            const isMatch = (deletedPlan.sourceRiskId && deletedPlan.sourceRiskId === u.id) ||
              ((deletedPlan.title === u.activity || deletedPlan.topic === u.activity) &&
               (!deletedPlan.department || !u.department || deletedPlan.department.trim() === u.department.trim()));
            return isMatch ? { ...u, includedInPlan: false } : u;
          });
          setAuditUniverse(updatedUniverse);
        }
        showToast('ลบโครงการออกจากแผนเรียบร้อยแล้ว');
      }
    });
  };

  // Toggle Strategic Plan Year Mark
  const handleToggleStrategicYear = (stratId, yr) => {
    const updated = strategicPlan.map((item) => {
      if (item.id === stratId) {
        return {
          ...item,
          years: {
            ...item.years,
            [yr]: !item.years?.[yr]
          }
        };
      }
      return item;
    });
    setStrategicPlan(updated);
  };

  // Add Strategic Plan Item
  const handleAddStrategic = (e) => {
    e.preventDefault();
    if (!newStrategic.activity.trim()) return;
    const stratId = `STRAT-0${strategicPlan.length + 1}`;
    setStrategicPlan([...strategicPlan, { ...newStrategic, id: stratId }]);
    setShowAddStrategicModal(false);
    showToast(`เพิ่มกิจกรรม "${newStrategic.activity}" ในแผนระยะยาว 5 ปีเรียบร้อยแล้ว`);
    setNewStrategic({
      department: 'กองคลัง',
      activity: '',
      riskLevel: 'สูง',
      frequency: 'ทุกปี (Annual)',
      years: { '2568': false, '2569': true, '2570': false, '2571': false, '2572': false },
      responsibleAuditor: 'หน่วยตรวจสอบภายใน'
    });
  };

  // Add Risk Item
  const handleAddRisk = (e) => {
    e.preventDefault();
    if (!newRisk.activity.trim()) return;
    const score = newRisk.likelihood * newRisk.impact;
    let level = 'ต่ำ';
    if (score >= 15) level = 'สูงมาก';
    else if (score >= 10) level = 'สูง';
    else if (score >= 5) level = 'ปานกลาง';

    setRiskAssessments([
      ...riskAssessments,
      {
        ...newRisk,
        id: `RISK-0${riskAssessments.length + 1}`,
        riskScore: score,
        level: level
      }
    ]);
    setShowAddRisk(false);
    showToast(`บันทึกการประเมินความเสี่ยงกิจกรรม "${newRisk.activity}" เรียบร้อยแล้ว`);
    setNewRisk({
      agency: 'กองคลัง',
      activity: '',
      dimension: 'compliance',
      riskFactor: '',
      likelihood: 3,
      impact: 3,
      treatment: ''
    });
  };

  // Filtered Annual Plans
  const filteredAnnualPlans = useMemo(() => {
    return annualPlans.filter((p) => {
      const matchDim = selectedDimension === 'all' || p.dimension === selectedDimension;
      const matchDept = selectedDeptFilter === 'all' || p.department === selectedDeptFilter;
      const matchSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDim && matchDept && matchSearch;
    });
  }, [annualPlans, selectedDimension, selectedDeptFilter, searchQuery]);

  // Statistics for Annual Plan
  const totalBudget = useMemo(() => annualPlans.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0), [annualPlans]);
  const avgProgress = useMemo(() => {
    if (annualPlans.length === 0) return 0;
    return Math.round(annualPlans.reduce((acc, curr) => acc + (Number(curr.progress) || 0), 0) / annualPlans.length);
  }, [annualPlans]);
  const highRiskCount = useMemo(() => annualPlans.filter((p) => p.riskLevel === 'สูงมาก' || p.riskLevel === 'สูง').length, [annualPlans]);

  // Strategic Plan Statistics
  const strategicAnnualCount = useMemo(() => strategicPlan.filter((s) => s.frequency?.includes('ทุกปี')).length, [strategicPlan]);
  const strategicBiannualCount = useMemo(() => strategicPlan.filter((s) => s.frequency?.includes('2 ปี')).length, [strategicPlan]);
  const strategicTriannualCount = useMemo(() => strategicPlan.filter((s) => s.frequency?.includes('3 ปี')).length, [strategicPlan]);

  // Handlers for exporting Word and Excel
  const handleDownloadAnnualPlanExcel = () => {
    try {
      const headers = [
        'ลำดับ',
        'รหัสโครงการ',
        'โครงการ / เรื่องที่ตรวจสอบ',
        'ด้านการตรวจสอบ',
        'สำนัก/กอง (หน่วยรับตรวจ)',
        'ระยะเวลาดำเนินการ',
        'ระดับความเสี่ยง',
        'งบประมาณ (บาท)',
        'วัตถุประสงค์การตรวจสอบ',
        'สถานะการดำเนินงาน'
      ];
      const rows = annualPlans.map((p, idx) => [
        idx + 1,
        p.id,
        p.title,
        p.dimension,
        p.department,
        p.period || p.quarter || '-',
        p.riskLevel,
        Number(p.budget || 0),
        p.objective || '-',
        p.status === 'completed' ? 'เสร็จสิ้น' : p.status === 'in_progress' ? 'กำลังตรวจ' : 'รอดำเนินการ'
      ]);

      exportDataToExcel({
        sheetName: `แผนประจำปี_${selectedYear}`,
        headers,
        rows,
        fileName: `แผนการปฏิบัติงานตรวจสอบประจำปี_${selectedYear}_${orgProfile?.name || 'อปท'}`,
        colWidths: [8, 16, 38, 18, 20, 22, 16, 16, 40, 18]
      });
      showToast('ดาวน์โหลดแผนประจำปี Excel (.xlsx) สำเร็จแล้ว');
    } catch (err) {
      console.error(err);
      showToast('⚠️ เกิดข้อผิดพลาดในการดาวน์โหลด Excel');
    }
  };

  const handleDownloadApprovalMemoWord = () => {
    try {
      exportThaiMemoToWord({
        agency: `${orgProfile?.agencyName || 'หน่วยตรวจสอบภายใน'} ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}`,
        phone: orgProfile?.phone || '',
        docNumber: orgProfile?.docCode ? `${orgProfile.docCode}/แผน` : 'อบ ๗๘๔๐๘/แผน',
        docDate: `๒๙ สิงหาคม ๒๕๖๘`,
        subject: `ขออนุมัติแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. ${selectedYear}`,
        to: `นายก${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} (ผ่าน ปลัด${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'})`,
        contentParagraphs: [
          `<strong>๑. เรื่องเดิม:</strong> ตามระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. ๒๕๔๕ ข้อ ๑๘ กำหนดให้ผู้ตรวจสอบภายในต้องเสนอแผนการปฏิบัติงานตรวจสอบประจำปีต่อนายกองค์กรปกครองส่วนท้องถิ่นเพื่อพิจารณาอนุมัติก่อนเริ่มปีงบประมาณ นั้น`,
          `<strong>๒. ข้อเท็จจริง:</strong> หน่วยตรวจสอบภายในได้จัดทำแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. ${selectedYear} โดยผ่านการประเมินความเสี่ยงตามหลักเกณฑ์กระทรวงการคลัง (ว ๓๘๐) และวิเคราะห์ทรัพยากรการตรวจสอบ รวมโครงการตรวจสอบทั้งสิ้น <strong>${annualPlans.length} โครงการ</strong> ครอบคลุมสำนัก/กองต่างๆ ดังนี้<br/>` +
          annualPlans.map((p, i) => `&nbsp;&nbsp;&nbsp;&nbsp;๒.${i + 1} ${p.title} (${p.department}) ระดับความเสี่ยง: ${p.riskLevel}`).join('<br/>'),
          `<strong>๓. ข้อพิจารณาและข้อเสนอ:</strong> เพื่อให้การปฏิบัติงานตรวจสอบภายในเป็นไปตามระเบียบและบรรลุวัตถุประสงค์ในการกำกับดูแลที่ดี จึงขอเสนอดังนี้:<br/>` +
          `&nbsp;&nbsp;&nbsp;&nbsp;๓.๑ โปรดพิจารณาอนุมัติแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. ${selectedYear} ตามเอกสารแนบท้าย<br/>` +
          `&nbsp;&nbsp;&nbsp;&nbsp;๓.๒ แจ้งสำนัก/กองที่เกี่ยวข้องเพื่อทราบและเตรียมความพร้อมรับการตรวจสอบต่อไป<br/><br/>` +
          `จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ`
        ],
        signatoryName: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน',
        signatoryPosition: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายในชำนาญการ',
        signatoryRole: 'ผู้จัดทำแผนการปฏิบัติงาน',
        palatReviewText: 'เห็นควรอนุมัติแผนการปฏิบัติงานตรวจสอบประจำปีตามเสนอ',
        executiveOrderText: 'อนุมัติแผนการปฏิบัติงานตรวจสอบประจำปีตามเสนอ และแจ้งหน่วยรับตรวจทราบ',
        orgName: orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น',
        fileName: `บันทึกขออนุมัติแผนประจำปี_${selectedYear}_${orgProfile?.name || 'อปท'}`
      });
      showToast('ดาวน์โหลดบันทึกขออนุมัติแผน Word (.doc) สำเร็จแล้ว');
    } catch (err) {
      console.error(err);
      showToast('⚠️ เกิดข้อผิดพลาดในการดาวน์โหลด Word');
    }
  };

  const handleDownloadDlaPlanFormWord = () => {
    try {
      const planRows = annualPlans.map((p, idx) => `
        <tr>
          <td style="text-align: center; border: 1pt solid #000; padding: 4pt;">${idx + 1}</td>
          <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold;">${p.title}</td>
          <td style="border: 1pt solid #000; padding: 4pt;">${p.department}</td>
          <td style="border: 1pt solid #000; padding: 4pt;">${p.objective || '-'}</td>
          <td style="text-align: center; border: 1pt solid #000; padding: 4pt;">${p.period || p.quarter || '-'}</td>
          <td style="text-align: center; border: 1pt solid #000; padding: 4pt;">${p.riskLevel}</td>
        </tr>
      `).join('');

      const content = `
        <div style="text-align: center; margin-bottom: 16pt;">
          <h2 style="font-size: 18pt; font-weight: bold; margin: 0;">แผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. ${selectedYear}</h2>
          <div style="font-size: 16pt; font-weight: bold; margin-top: 4pt;">หน่วยตรวจสอบภายใน ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</div>
          <div style="font-size: 14pt; margin-top: 2pt;">(ตามแบบฟอร์มคู่มือ สถ. หน้า 16)</div>
        </div>
        <table class="table-bordered" style="width: 100%; border: 1pt solid #000; border-collapse: collapse; font-size: 14pt;">
          <thead>
            <tr style="background-color: #f3f4f6; font-weight: bold;">
              <th style="border: 1pt solid #000; padding: 6pt; width: 6%;">ลำดับ</th>
              <th style="border: 1pt solid #000; padding: 6pt; width: 30%;">โครงการ / กิจกรรมที่ตรวจสอบ</th>
              <th style="border: 1pt solid #000; padding: 6pt; width: 18%;">หน่วยรับตรวจ</th>
              <th style="border: 1pt solid #000; padding: 6pt; width: 26%;">วัตถุประสงค์การตรวจสอบ</th>
              <th style="border: 1pt solid #000; padding: 6pt; width: 10%;">ระยะเวลา</th>
              <th style="border: 1pt solid #000; padding: 6pt; width: 10%;">ระดับความเสี่ยง</th>
            </tr>
          </thead>
          <tbody>
            ${planRows}
          </tbody>
        </table>
        <table style="width: 100%; margin-top: 30pt; border: none;">
          <tr>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">(ลงชื่อ)........................................................ผู้จัดทำแผน</p>
              <p style="margin: 4pt 0 0 0; font-weight: bold;">(${orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})</p>
              <p style="margin: 2pt 0 0 0;">${orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}</p>
            </td>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">(ลงชื่อ)........................................................ผู้อนุมัติแผน</p>
              <p style="margin: 4pt 0 0 0; font-weight: bold;">(${orgProfile?.mayorName || 'นายก อปท.'})</p>
              <p style="margin: 2pt 0 0 0;">นายก${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</p>
            </td>
          </tr>
        </table>
      `;

      exportDocumentToWord({
        title: `แผนปฏิบัติงานตรวจสอบ_${selectedYear}`,
        htmlContent: content,
        fileName: `แบบฟอร์มแผนการปฏิบัติงานประจำปี_สถ_${selectedYear}_${orgProfile?.name || 'อปท'}`
      });
      showToast('ดาวน์โหลดแบบฟอร์มแผน Word (.doc) สำเร็จแล้ว');
    } catch (err) {
      console.error(err);
      showToast('⚠️ เกิดข้อผิดพลาดในการดาวน์โหลด Word');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 dark:bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 border border-slate-700 text-xs font-bold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sub-navigation Tabs: 4 Tiers */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('annual')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'annual'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 shadow-xs border border-amber-500/30'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>แผนปฏิบัติการประจำปี ({annualPlans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('strategic')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'strategic'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 shadow-xs border border-amber-500/30'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>แผนระยะยาว 3-5 ปี ({strategicPlan.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('risk')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'risk'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 shadow-xs border border-amber-500/30'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>ประเมินความเสี่ยง (5x5 Matrix)</span>
          </button>

          <button
            onClick={() => setActiveTab('charter')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'charter'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 shadow-xs border border-amber-500/30'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>กฎบัตรการตรวจสอบภายใน</span>
          </button>
        </div>

        {/* Global Tab Actions */}
        <div className="flex items-center space-x-2">
          {activeTab === 'annual' && (
            <>
              {eligibleHighRiskCandidates.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedRisksToImport(eligibleHighRiskCandidates);
                    setShowImportRiskModal(true);
                  }}
                  className="bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>ดึงรายการเสี่ยงสูงจากเมทริกซ์ ({eligibleHighRiskCandidates.length})</span>
                </button>
              )}

              <button
                onClick={handleLoadDlaAnnualPlan}
                className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                title="โหลดโครงการตรวจสอบ 6 ภารกิจหลักมาตรฐาน อปท. จากคู่มือ สถ. หน้า 16"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>📥 โหลดแผน 6 ภารกิจ (คู่มือ สถ.)</span>
              </button>

              <button
                onClick={() => setShowDlaPlanFormModal(true)}
                className="bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                title="ดูแบบฟอร์มแผนการตรวจสอบประจำปีทางการตามคู่มือ สถ. หน้า 16"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>📋 แบบฟอร์มแผน สถ.</span>
              </button>

              <button
                onClick={() => setShowApprovalMemoModal(true)}
                className="bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>บันทึกขออนุมัติแผน</span>
              </button>

              <button
                onClick={() => setShowAddPlan(true)}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มโครงการตรวจสอบ</span>
              </button>
            </>
          )}

          {activeTab === 'strategic' && (
            <>
              <button
                onClick={handleLoadDlaStrategicPlan}
                className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                title="โหลดแผนระยะยาว 16 กิจกรรม (590 คน-วัน) จากคู่มือ สถ. หน้า 12-14"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>📥 โหลดแผน 3 ปี 590 วัน (คู่มือ สถ.)</span>
              </button>

              <button
                onClick={() => setShowAddStrategicModal(true)}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มกิจกรรมในแผนระยะยาว</span>
              </button>
            </>
          )}

          {activeTab === 'risk' && (
            <button
              onClick={() => setShowAddRisk(true)}
              className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ประเมินกิจกรรมใหม่</span>
            </button>
          )}

          <OfficialDocActionToolbar
            onDownloadWord={handleDownloadDlaPlanFormWord}
            onDownloadExcel={handleDownloadAnnualPlanExcel}
            onPrint={() => window.print()}
            wordTooltip="ดาวน์โหลดแบบฟอร์มแผนประจำปี Word (.doc)"
            excelTooltip="ดาวน์โหลดตารางแผนปฏิบัติการตรวจสอบประจำปี Excel (.xlsx)"
            printTooltip="สั่งพิมพ์แผน หรือบันทึกเป็น PDF"
          />
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ANNUAL AUDIT PLAN (แผนปฏิบัติการประจำปี)
      ========================================================================= */}
      {activeTab === 'annual' && (
        <div className="space-y-5">
          {/* Header Info Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                  แผนการตรวจสอบประจำปี (Annual Audit Plan) ประจำปีงบประมาณ พ.ศ. {selectedYear}
                </h2>
              </div>

              {/* Quick Summary Badges */}
              <div className="grid grid-cols-3 gap-2 text-center shrink-0 bg-white/80 dark:bg-stone-850/60 backdrop-blur-md p-3 rounded-xl border border-stone-200/80 dark:border-stone-700 shadow-2xs">
                <div className="px-2">
                  <div className="text-xl font-black text-stone-900 dark:text-stone-100">{annualPlans.length}</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">โครงการทั้งหมด</div>
                </div>
                <div className="px-2 border-x border-stone-200 dark:border-stone-700">
                  <div className="text-xl font-black text-amber-800 dark:text-amber-400">{highRiskCount}</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">ความเสี่ยงสูง</div>
                </div>
                <div className="px-2">
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">{avgProgress}%</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">ความก้าวหน้าเฉลี่ย</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dimension Filter Chips Bar */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="font-bold text-stone-700 dark:text-stone-300 flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>จำแนกตามมิติการตรวจสอบ ({AUDIT_DIMENSIONS.length - 1} มิติ):</span>
              </div>

              {/* Department & Search Controls */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs rounded-xl px-2.5 py-1.5 outline-none font-bold cursor-pointer"
                >
                  <option value="all">ทุกหน่วยรับตรวจ</option>
                  <option value="สำนักปลัด">สำนักปลัด</option>
                  <option value="กองคลัง">กองคลัง</option>
                  <option value="กองช่าง">กองช่าง</option>
                  <option value="กองการศึกษา">กองการศึกษา</option>
                  <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ค้นหาโครงการ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs outline-none w-40 sm:w-48 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
              {AUDIT_DIMENSIONS.map((dim) => {
                const isActive = selectedDimension === dim.id;
                const count = dim.id === 'all'
                  ? annualPlans.length
                  : annualPlans.filter((p) => p.dimension === dim.id).length;
                return (
                  <button
                    key={dim.id}
                    onClick={() => setSelectedDimension(dim.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 shadow-xs border border-amber-500/30'
                        : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    <span>{dim.badge}</span>
                    <span className="hidden md:inline font-normal opacity-90">{dim.label.split('(')[0]}</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Annual Plans Table */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600 dark:text-stone-400">
                <thead className="bg-stone-50/90 dark:bg-stone-800/80 text-stone-700 dark:text-stone-200 font-bold border-b border-stone-200 dark:border-stone-750">
                  <tr>
                    <th className="px-4 py-3.5">รหัส</th>
                    <th className="px-3 py-3.5 text-center">มิติการตรวจ</th>
                    <th className="px-4 py-3.5">ชื่อเรื่อง / โครงการที่ตรวจสอบ</th>
                    <th className="px-4 py-3.5">หน่วยรับตรวจ</th>
                    <th className="px-3 py-3.5">ไตรมาส / ระยะเวลา</th>
                    <th className="px-3 py-3.5 text-center">ระดับความเสี่ยง</th>
                    <th className="px-3 py-3.5 text-right">งบประมาณ</th>
                    <th className="px-3 py-3.5 text-center">ความก้าวหน้า</th>
                    <th className="px-3 py-3.5 text-center">สถานะ</th>
                    <th className="px-4 py-3.5 text-center">การปฏิบัติการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAnnualPlans.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-12 text-slate-400">
                        ไม่พบโครงการตรวจสอบในแผนประจำปีที่ตรงกับเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    filteredAnnualPlans.map((plan) => {
                      const dimCfg = getDimConfig(plan.dimension);
                      const hasEngagement = engagementPlans.some(
                        (ep) => ep.auditPlanId === plan.id || ep.title === plan.title || ep.activityName === plan.title
                      );

                      return (
                        <tr key={plan.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {plan.id}
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDimensionBadgeStyle(
                                plan.dimension
                              )}`}
                              title={dimCfg.label}
                            >
                              {dimCfg.badge}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 max-w-xs">
                            <div className="line-clamp-2">{plan.title}</div>
                            {plan.objective && (
                              <div className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                                {plan.objective}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                            {plan.department}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{plan.quarter}</div>
                            <div className="text-[11px] text-slate-400">{plan.period}</div>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                plan.riskLevel === 'สูงมาก'
                                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                                  : plan.riskLevel === 'สูง'
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              {plan.riskLevel}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {Number(plan.budget || 0).toLocaleString()} ฿
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              <div className="w-14 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all"
                                  style={{ width: `${plan.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-[11px]">{plan.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                plan.status === 'completed'
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                  : plan.status === 'in_progress'
                                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {plan.status === 'completed'
                                ? 'เสร็จสิ้น'
                                : plan.status === 'in_progress'
                                ? 'กำลังตรวจ'
                                : 'รอตรวจ'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* 1-Click Jump or Create Engagement Plan */}
                              <button
                                onClick={() => handleOpenEngagementPlan(plan)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer ${
                                  hasEngagement
                                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800'
                                    : 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
                                }`}
                                title={hasEngagement ? 'เปิดแผนปฏิบัติการตรวจสอบ' : 'คลิกเพื่อสร้างแผนปฏิบัติการตรวจสอบทันที'}
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{hasEngagement ? 'แผนปฏิบัติการ' : 'จัดทำแผนตรวจ'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEditingPlan(plan);
                                  setShowEditPlanModal(true);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                title="แก้ไขโครงการ"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteAnnualPlan(plan.id, plan.title)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="ลบโครงการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: STRATEGIC AUDIT PLAN (แผนระยะยาว 3 - 5 ปี / Audit Cycle Matrix)
      ========================================================================= */}
      {activeTab === 'strategic' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                    <span>กรอบแผน 3-5 ปี</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                  แผนการตรวจสอบระยะยาว 3-5 ปี (Strategic Multi-Year Audit Plan)
                </h2>
              </div>

              {/* Cycle Badges */}
              <div className="flex items-center space-x-3 text-xs shrink-0">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center">
                  <div className="text-base font-black text-rose-700 dark:text-rose-400">{strategicAnnualCount}</div>
                  <div className="text-[10px] text-slate-500">ตรวจทุกปี (High)</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center">
                  <div className="text-base font-black text-amber-700 dark:text-amber-400">{strategicBiannualCount}</div>
                  <div className="text-[10px] text-slate-500">ทุก 2 ปี (Medium)</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-center">
                  <div className="text-base font-black text-emerald-700 dark:text-emerald-400">{strategicTriannualCount}</div>
                  <div className="text-[10px] text-slate-500">ทุก 3 ปี (Low)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700/80">
                  <tr>
                    <th className="px-4 py-3.5">รหัส</th>
                    <th className="px-4 py-3.5">หน่วยรับตรวจ</th>
                    <th className="px-4 py-3.5">กิจกรรม / กระบวนการที่ตรวจสอบ</th>
                    <th className="px-3 py-3.5 text-center">ระดับความเสี่ยง</th>
                    <th className="px-3 py-3.5">วงรอบการตรวจ</th>
                    {['2568', '2569', '2570', '2571', '2572'].map((yr) => (
                      <th
                        key={yr}
                        className={`px-3 py-3.5 text-center ${
                          yr === selectedYear ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-black' : ''
                        }`}
                      >
                        {yr}
                      </th>
                    ))}
                    <th className="px-4 py-3.5">ผู้รับผิดชอบ</th>
                    <th className="px-3 py-3.5 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {strategicPlan.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {item.department}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-sm">
                        {item.activity}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.riskLevel === 'สูงมาก'
                              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                              : item.riskLevel === 'สูง'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {item.frequency}
                      </td>

                      {/* 5-Year Checkboxes */}
                      {['2568', '2569', '2570', '2571', '2572'].map((yr) => {
                        const isScheduled = !!item.years?.[yr];
                        const isCurrent = yr === selectedYear;
                        return (
                          <td
                            key={yr}
                            onClick={() => handleToggleStrategicYear(item.id, yr)}
                            className={`px-3 py-3 text-center cursor-pointer transition-colors ${
                              isCurrent ? 'bg-blue-50/50 dark:bg-blue-950/20 font-bold' : ''
                            } hover:bg-slate-100 dark:hover:bg-slate-800`}
                            title={`คลิกเพื่อสลับกำหนดการตรวจปี ${yr}`}
                          >
                            <div className="flex items-center justify-center">
                              {isScheduled ? (
                                <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs font-bold text-xs">
                                  ✓
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 inline-block opacity-40"></span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {item.responsibleAuditor}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => {
                            openConfirmModal({
                              title: 'ยืนยันการลบกิจกรรมในแผนระยะยาว',
                              message: `คุณต้องการลบกิจกรรม "${item.activity}" ออกจากแผนตรวจสอบระยะยาว 5 ปี ใช่หรือไม่?`,
                              confirmText: 'ลบกิจกรรม',
                              type: 'danger',
                              onConfirm: () => {
                                setStrategicPlan(strategicPlan.filter((s) => s.id !== item.id));
                                showToast('ลบกิจกรรมออกจากแผนระยะยาวแล้ว');
                              }
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          TAB 3: RISK ASSESSMENT & 5x5 HEATMAP
      ========================================================================= */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 5x5 Heatmap */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                  ผังวิเคราะห์ระดับความเสี่ยง (5x5 Risk Heatmap)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  โอกาสเกิด (Likelihood: 1-5) x ผลกระทบ (Impact: 1-5) ตามเกณฑ์กระทรวงการคลัง
                </p>
              </div>

              <div className="relative pt-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center space-x-1">
                  <span>▲ ระดับผลกระทบ (Impact)</span>
                </div>

                <div className="grid grid-rows-5 gap-1.5 text-center text-xs font-bold">
                  {[5, 4, 3, 2, 1].map((impactVal) => (
                    <div key={impactVal} className="grid grid-cols-5 gap-1.5 h-12">
                      {[1, 2, 3, 4, 5].map((likeVal) => {
                        const score = impactVal * likeVal;
                        let bg = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-200';
                        if (score >= 15) bg = 'bg-rose-500 text-white hover:bg-rose-600 shadow-xs';
                        else if (score >= 10) bg = 'bg-amber-400 text-slate-900 hover:bg-amber-500 shadow-xs';
                        else if (score >= 5) bg = 'bg-yellow-200 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-300';

                        const matched = riskAssessments.filter(
                          (r) => r.impact === impactVal && r.likelihood === likeVal
                        );

                        return (
                          <div
                            key={likeVal}
                            className={`${bg} rounded-xl p-1 flex flex-col items-center justify-center transition-all cursor-pointer relative`}
                            title={`L: ${likeVal}, I: ${impactVal} (คะแนน: ${score})`}
                          >
                            <span className="text-[10px] opacity-75">{score}</span>
                            {matched.length > 0 && (
                              <span className="mt-0.5 bg-slate-900 text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold shadow-sm">
                                {matched.length}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2">
                  ระดับโอกาสเกิด (Likelihood) ▶
                </div>
              </div>

              {/* Heatmap Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div className="flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                  <span className="w-3 h-3 rounded bg-rose-500 shrink-0"></span>
                  <span className="font-bold text-rose-800 dark:text-rose-300">สูงมาก (15-25)</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200 dark:border-amber-900">
                  <span className="w-3 h-3 rounded bg-amber-400 shrink-0"></span>
                  <span className="font-bold text-amber-800 dark:text-amber-300">สูง (10-14)</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded-xl border border-yellow-200 dark:border-yellow-900">
                  <span className="w-3 h-3 rounded bg-yellow-300 shrink-0"></span>
                  <span className="font-bold text-yellow-800 dark:text-yellow-300">ปานกลาง (5-9)</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  <span className="w-3 h-3 rounded bg-emerald-300 shrink-0"></span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">ต่ำ (1-4)</span>
                </div>
              </div>
            </div>

            {/* Evaluated Activities Cards List */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    กิจกรรมที่ประเมินความเสี่ยง ({riskAssessments.length})
                  </h3>
                  <p className="text-xs text-slate-500">สามารถกดบรรจุเข้าแผนประจำปีได้โดยตรง</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {riskAssessments.map((item) => {
                  const alreadyInPlan = annualPlans.some((p) => p.title === item.activity);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 transition-all text-xs space-y-2 bg-slate-50/40 dark:bg-slate-800/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.activity}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.level === 'สูงมาก'
                              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                              : item.level === 'สูง'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                              : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300'
                          }`}
                        >
                          {item.level} (คะแนน {item.riskScore})
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        หน่วยรับตรวจ: <span className="font-bold text-slate-700 dark:text-slate-300">{item.agency}</span> • L: {item.likelihood} • I: {item.impact}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-300">ปัจจัยเสี่ยง:</span> {item.riskFactor}
                      </p>

                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/60">
                        <span className="font-bold text-emerald-950 dark:text-emerald-200">มาตรการควบคุม (บส.3):</span> {item.treatment}
                      </p>

                      {/* Quick Push to Annual Plan Button */}
                      <div className="pt-1 flex justify-end">
                        <button
                          disabled={alreadyInPlan}
                          onClick={() => {
                            const newPlanItem = {
                              id: `PLAN-${yearSuffix}-0${annualPlans.length + 1}`,
                              title: item.activity,
                              dimension: item.dimension || 'compliance',
                              department: item.agency,
                              quarter: `ไตรมาส 1 (ต.ค. - ธ.ค. ${yearSuffix})`,
                              period: `พ.ศ. ${selectedYear}`,
                              riskLevel: item.level,
                              budget: 5000,
                              objective: `เพื่อตรวจสอบการปฏิบัติงานและประเมินประสิทธิภาพกิจกรรม ${item.activity} ตามผลการประเมินความเสี่ยงที่มีคะแนน ${item.riskScore} (${item.level})`,
                              status: 'pending',
                              progress: 0
                            };
                            setAnnualPlans([...annualPlans, newPlanItem]);
                            showToast(`บรรจุ "${item.activity}" เข้าสู่แผนประจำปี ${selectedYear} แล้ว`);
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                            alreadyInPlan
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{alreadyInPlan ? 'บรรจุในแผนแล้ว' : 'บรรจุเข้าแผนประจำปี'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: AUDIT CHARTER (กฎบัตรการตรวจสอบภายใน)
      ========================================================================= */}
      {activeTab === 'charter' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6 space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {auditCharter?.title || 'กฎบัตรการตรวจสอบภายใน (Internal Audit Charter)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} {orgProfile?.district || ''} {orgProfile?.province || ''}
            </p>
            <div className="inline-block mt-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-3.5 py-1 rounded-full font-bold border border-blue-200 dark:border-blue-800">
              อนุมัติและประกาศใช้เมื่อ: {auditCharter?.approvedDate || '1 ตุลาคม 2568'} โดย {orgProfile?.approverName || 'นายก อปท.'}
            </div>
          </div>

          <div className="space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <section className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">1. วัตถุประสงค์ (Objective)</h3>
              <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                {auditCharter?.objective}
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">2. สายการบังคับบัญชาและความเป็นอิสระ (Reporting Line & Independence)</h3>
              <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                ผู้ตรวจสอบภายในขึ้นตรงต่อนายก{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} ในการปฏิบัติหน้าที่และรายงานผลการตรวจสอบ และประสานงานการปฏิบัติงานผ่านปลัด{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} เพื่อรักษาความเป็นอิสระและเที่ยงธรรมตามมาตรฐานการตรวจสอบภายในภาครัฐ
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">3. อำนาจหน้าที่ (Authority)</h3>
              <ul className="space-y-2 list-disc list-inside bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                {auditCharter?.authority?.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">4. ขอบเขตและความรับผิดชอบ (Responsibilities)</h3>
              <ul className="space-y-2 list-disc list-inside bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                {auditCharter?.responsibilities?.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">5. จรรยาบรรณวิชาชีพการตรวจสอบภายใน (Code of Ethics)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {auditCharter?.codeOfEthics?.map((code, idx) => (
                  <div key={idx} className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{code}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Official Signatures */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-8">
              <div>(ลงชื่อ)........................................................</div>
              <div>
                <div className="font-bold">({orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})</div>
                <div className="text-slate-500">{orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}</div>
                <div className="text-[11px] text-slate-400">ผู้จัดทำกฎบัตร</div>
              </div>
            </div>

            <div className="space-y-8">
              <div>(ลงชื่อ)........................................................</div>
              <div>
                <div className="font-bold">({orgProfile?.approverName || 'นายก อปท.'})</div>
                <div className="text-slate-500">{orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                <div className="text-[11px] text-slate-400">ผู้อนุมัติและประกาศใช้</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: BATCH IMPORT HIGH-RISK CANDIDATES
      ========================================================================= */}
      {showImportRiskModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="shrink-0 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    ดึงกิจกรรมความเสี่ยงสูงบรรจุเข้าแผนปฏิบัติการประจำปี {selectedYear}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตรวจพบกิจกรรมที่มีความเสี่ยงสูง/สูงมากจากเมทริกซ์ 5x5 ที่ยังไม่ได้บรรจุในแผน
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportRiskModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  เลือกกิจกรรม ({selectedRisksToImport.length}/{eligibleHighRiskCandidates.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRisksToImport.length === eligibleHighRiskCandidates.length) {
                      setSelectedRisksToImport([]);
                    } else {
                      setSelectedRisksToImport(eligibleHighRiskCandidates);
                    }
                  }}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  {selectedRisksToImport.length === eligibleHighRiskCandidates.length ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
              </div>

              <div className="space-y-2">
                {eligibleHighRiskCandidates.map((item) => {
                  const isChecked = selectedRisksToImport.some((r) => r.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedRisksToImport(selectedRisksToImport.filter((r) => r.id !== item.id));
                        } else {
                          setSelectedRisksToImport([...selectedRisksToImport, item]);
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                        isChecked
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="pt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {item.activity}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.level === 'สูงมาก'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}
                          >
                            {item.level || 'ความเสี่ยงสูง'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          หน่วยรับตรวจ: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.department}</span> • ปัจจัยเสี่ยง: {item.reason || item.riskFactor}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowImportRiskModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={selectedRisksToImport.length === 0}
                onClick={handleBatchImportHighRisk}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50 cursor-pointer shadow-xs"
              >
                ยืนยันการบรรจุเข้าแผน ({selectedRisksToImport.length} รายการ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: OFFICIAL APPROVAL MEMO (บันทึกข้อความขออนุมัติแผน)
      ========================================================================= */}
      {showApprovalMemoModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  บันทึกข้อความขออนุมัติแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. {selectedYear}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <OfficialDocActionToolbar
                  onDownloadWord={handleDownloadApprovalMemoWord}
                  onPrint={() => window.print()}
                  showExcel={false}
                  wordTooltip="ดาวน์โหลดบันทึกขออนุมัติแผน Word (.doc) ตามระเบียบงานสารบรรณ"
                  printTooltip="สั่งพิมพ์บันทึกข้อความ หรือบันทึกเป็น PDF"
                />
                <button
                  onClick={() => setShowApprovalMemoModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Formal Government Memo Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100 dark:bg-stone-950">
              <OfficialThaiMemo
                agency={`${orgProfile?.agencyName || 'หน่วยตรวจสอบภายใน'} ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}`}
                phone={orgProfile?.phone || ''}
                docNumber={orgProfile?.docCode ? `${orgProfile.docCode}/แผน` : 'อบ ๗๘๔๐๘/แผน'}
                date={`...... เดือน ...................... พ.ศ. ${selectedYear}`}
                subject={`ขออนุมัติแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. ${selectedYear}`}
                to={`นายก${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} (ผ่าน ปลัด${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'})`}
                signatory={{
                  name: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน',
                  position: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ',
                  role: 'ผู้จัดทำแผน'
                }}
                customReviewBoxes={
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[13px] text-black">
                    {/* ปลัด อปท. */}
                    <div className="border border-stone-400 p-3.5 space-y-2.5 bg-white">
                      <div className="font-bold underline text-[14px]">
                        ความเห็นของปลัดองค์กรปกครองส่วนท้องถิ่น
                      </div>
                      <div className="text-xs">เรียน นายกองค์กรปกครองส่วนท้องถิ่น</div>
                      <div className="space-y-1 text-xs">
                        <label className="flex items-start space-x-2">
                          <span className="font-bold text-sm">[  ]</span>
                          <span>เห็นชอบแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. {selectedYear} ตามเสนอ</span>
                        </label>
                        <label className="flex items-start space-x-2">
                          <span className="font-bold text-sm">[  ]</span>
                          <span>เห็นควรนำเสนอเพื่อโปรดพิจารณาอนุมัติ</span>
                        </label>
                        <label className="flex items-start space-x-2">
                          <span className="font-bold text-sm">[  ]</span>
                          <span>อื่นๆ ............................................................................</span>
                        </label>
                      </div>
                      <div className="pt-6 text-center space-y-1">
                        <div>(ลงชื่อ)........................................................</div>
                        <div className="font-bold">({orgProfile?.palatName || '........................................................'})</div>
                        <div className="text-xs text-stone-600">{orgProfile?.palatPosition || 'ปลัดองค์กรปกครองส่วนท้องถิ่น'}</div>
                        <div className="text-[11px] text-stone-500">วันที่ ...... / ...... / ......</div>
                      </div>
                    </div>

                    {/* นายก อปท. */}
                    <div className="border border-stone-400 p-3.5 space-y-2.5 bg-white">
                      <div className="font-bold underline text-[14px]">
                        คำสั่งการของนายกองค์กรปกครองส่วนท้องถิ่น
                      </div>
                      <div className="space-y-1 text-xs pt-3">
                        <label className="flex items-start space-x-2">
                          <span className="font-bold text-sm">[  ]</span>
                          <span className="font-bold">อนุมัติแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. {selectedYear}</span>
                        </label>
                        <label className="flex items-start space-x-2">
                          <span className="font-bold text-sm">[  ]</span>
                          <span>แจ้งให้ทุกสำนัก/กอง/หน่วยรับตรวจ ทราบและอำนวยความสะดวกในการเข้าตรวจ</span>
                        </label>
                        <label className="flex items-start space-x-2">
                          <span className="font-bold text-sm">[  ]</span>
                          <span>ไม่อนุมัติ เนื่องจาก ....................................................</span>
                        </label>
                      </div>
                      <div className="pt-6 text-center space-y-1">
                        <div>(ลงชื่อ)........................................................</div>
                        <div className="font-bold">({orgProfile?.approverName || '........................................................'})</div>
                        <div className="text-xs text-stone-600">{orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                        <div className="text-[11px] text-stone-500">วันที่ ...... / ...... / ......</div>
                      </div>
                    </div>
                  </div>
                }
              >
                <div className="space-y-3 text-justify indent-10">
                  <p>
                    ด้วยหน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} ได้ดำเนินการจัดทำแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. {selectedYear} เสร็จเรียบร้อยแล้ว โดยอาศัยอำนาจตามระเบียบกระทรวงมหาดไทย ว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. ๒๕๔๕ และที่แก้ไขเพิ่มเติม (ฉบับที่ ๒) พ.ศ. ๒๕๕๘ ข้อ ๑๘ ข้อ ๑๙ และข้อ ๒๐ ประกอบพระราชบัญญัติวินัยการเงินการคลังของรัฐ พ.ศ. ๒๕๖๑ มาตรา ๗๙
                  </p>
                  <p>
                    ในการนี้ หน่วยตรวจสอบภายในได้ดำเนินการประเมินความเสี่ยงตามเกณฑ์มาตรฐานของกระทรวงการคลัง และจัดลำดับความสำคัญของกิจกรรมครอบคลุมทุกส่วนราชการ โดยบรรจุโครงการตรวจสอบในแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. {selectedYear} รวมทั้งสิ้น <strong>{annualPlans.length} โครงการ</strong> วงเงินงบประมาณรวม <strong>{totalBudget.toLocaleString()} บาท</strong> โดยมีรายละเอียดดังต่อไปนี้:
                  </p>
                </div>

                {/* Table Summary in Memo */}
                <div className="border border-stone-400 rounded-none overflow-hidden my-3">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead className="bg-stone-100 text-black font-bold border-b border-stone-400">
                      <tr>
                        <th className="p-2 text-center w-10 border-r border-stone-300">ลำดับ</th>
                        <th className="p-2 border-r border-stone-300">โครงการ / กิจกรรมที่ตรวจสอบ</th>
                        <th className="p-2 border-r border-stone-300">หน่วยรับตรวจ</th>
                        <th className="p-2 text-center border-r border-stone-300">ระดับความเสี่ยง</th>
                        <th className="p-2">ระยะเวลาดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-300">
                      {annualPlans.map((p, idx) => (
                        <tr key={p.id}>
                          <td className="p-2 text-center border-r border-stone-300">{idx + 1}</td>
                          <td className="p-2 font-bold border-r border-stone-300">{p.title}</td>
                          <td className="p-2 border-r border-stone-300">{p.department}</td>
                          <td className="p-2 text-center border-r border-stone-300 font-bold">{p.riskLevel}</td>
                          <td className="p-2">{p.quarter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 indent-10">
                  <p>
                    จึงเรียนมาเพื่อโปรดพิจารณา:
                  </p>
                  <p className="indent-14">
                    ๑. ให้ความเห็นชอบและอนุมัติแผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. {selectedYear}
                  </p>
                  <p className="indent-14">
                    ๒. แจ้งให้ทุกสำนัก/กอง/หน่วยรับตรวจ ทราบและอำนวยความสะดวกในการเข้าปฏิบัติงานตรวจสอบต่อไป
                  </p>
                </div>
              </OfficialThaiMemo>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD ANNUAL PLAN ITEM
      ========================================================================= */}
      {showAddPlan && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                เพิ่มโครงการในแผนการตรวจสอบประจำปี {selectedYear}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPlan(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อเรื่อง / กิจกรรมที่ตรวจสอบ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น การตรวจสอบการจัดซื้อจัดจ้างโครงการก่อสร้าง..."
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">มิติการตรวจสอบ</label>
                  <select
                    value={newPlan.dimension}
                    onChange={(e) => setNewPlan({ ...newPlan, dimension: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    {AUDIT_DIMENSIONS.filter((d) => d.id !== 'all').map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.badge}: {d.label.split('(')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">หน่วยรับตรวจ</label>
                  <select
                    value={newPlan.department}
                    onChange={(e) => setNewPlan({ ...newPlan, department: e.target.value })}
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
                  <label className="font-bold text-slate-700 dark:text-slate-300">ระดับความเสี่ยง</label>
                  <select
                    value={newPlan.riskLevel}
                    onChange={(e) => setNewPlan({ ...newPlan, riskLevel: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="สูงมาก">สูงมาก</option>
                    <option value="สูง">สูง</option>
                    <option value="ปานกลาง">ปานกลาง</option>
                    <option value="ต่ำ">ต่ำ</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">งบประมาณดำเนินการ (บาท)</label>
                  <input
                    type="number"
                    value={newPlan.budget}
                    onChange={(e) => setNewPlan({ ...newPlan, budget: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ไตรมาสที่ดำเนินการ</label>
                  <input
                    type="text"
                    value={newPlan.quarter}
                    onChange={(e) => setNewPlan({ ...newPlan, quarter: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ระยะเวลาเข้าตรวจ</label>
                  <input
                    type="text"
                    value={newPlan.period}
                    onChange={(e) => setNewPlan({ ...newPlan, period: e.target.value })}
                    placeholder="เช่น 1 - 30 พ.ย. 68"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">วัตถุประสงค์การตรวจสอบ</label>
                <textarea
                  rows="3"
                  value={newPlan.objective}
                  onChange={(e) => setNewPlan({ ...newPlan, objective: e.target.value })}
                  placeholder="ระบุวัตถุประสงค์เพื่อความโปร่งใสและปฏิบัติตามระเบียบ..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                ></textarea>
              </div>

              <div className="shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlan(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  บันทึกโครงการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD STRATEGIC PLAN ITEM (3-5 ปี)
      ========================================================================= */}
      {showAddStrategicModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              เพิ่มกิจกรรมในแผนตรวจสอบระยะยาว 3-5 ปี
            </h3>
            <form onSubmit={handleAddStrategic} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">กิจกรรม / กระบวนการที่ตรวจสอบ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น การตรวจสอบการจัดเก็บภาษีที่ดินและสิ่งปลูกสร้าง"
                  value={newStrategic.activity}
                  onChange={(e) => setNewStrategic({ ...newStrategic, activity: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">หน่วยรับตรวจ</label>
                  <select
                    value={newStrategic.department}
                    onChange={(e) => setNewStrategic({ ...newStrategic, department: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="กองคลัง">กองคลัง</option>
                    <option value="กองช่าง">กองช่าง</option>
                    <option value="กองการศึกษา">กองการศึกษา</option>
                    <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
                    <option value="สำนักปลัด">สำนักปลัด</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ระดับความเสี่ยง</label>
                  <select
                    value={newStrategic.riskLevel}
                    onChange={(e) => setNewStrategic({ ...newStrategic, riskLevel: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="สูงมาก">สูงมาก</option>
                    <option value="สูง">สูง</option>
                    <option value="ปานกลาง">ปานกลาง</option>
                    <option value="ต่ำ">ต่ำ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">วงรอบความถี่ในการตรวจสอบ</label>
                <select
                  value={newStrategic.frequency}
                  onChange={(e) => setNewStrategic({ ...newStrategic, frequency: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                >
                  <option value="ทุกปี (Annual)">ทุกปี (Annual: สำหรับความเสี่ยงสูงมาก)</option>
                  <option value="ทุก 2 ปี (Bi-annual)">ทุก 2 ปี (Bi-annual: สำหรับความเสี่ยงสูง)</option>
                  <option value="ทุก 3 ปี (Tri-annual)">ทุก 3 ปี (Tri-annual: สำหรับความเสี่ยงปานกลาง/ต่ำ)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStrategicModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD RISK ASSESSMENT (5x5)
      ========================================================================= */}
      {showAddRisk && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ประเมินความเสี่ยงกิจกรรมใหม่
            </h3>
            <form onSubmit={handleAddRisk} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อกิจกรรมที่ประเมิน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น การจัดเก็บภาษีที่ดินและสิ่งปลูกสร้าง"
                  value={newRisk.activity}
                  onChange={(e) => setNewRisk({ ...newRisk, activity: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">หน่วยรับตรวจ</label>
                  <select
                    value={newRisk.agency}
                    onChange={(e) => setNewRisk({ ...newRisk, agency: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="กองคลัง">กองคลัง</option>
                    <option value="กองช่าง">กองช่าง</option>
                    <option value="กองการศึกษา">กองการศึกษา</option>
                    <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
                    <option value="สำนักปลัด">สำนักปลัด</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">มิติการตรวจ</label>
                  <select
                    value={newRisk.dimension}
                    onChange={(e) => setNewRisk({ ...newRisk, dimension: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    {AUDIT_DIMENSIONS.filter((d) => d.id !== 'all').map((d) => (
                      <option key={d.id} value={d.id}>{d.badge}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ปัจจัยความเสี่ยง</label>
                <input
                  type="text"
                  placeholder="เช่น การประเมินภาษีล่าช้า ฐานข้อมูลแผนที่ภาษียังไม่เป็นปัจจุบัน..."
                  value={newRisk.riskFactor}
                  onChange={(e) => setNewRisk({ ...newRisk, riskFactor: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">โอกาสเกิด (L: 1-5)</label>
                  <select
                    value={newRisk.likelihood}
                    onChange={(e) => setNewRisk({ ...newRisk, likelihood: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="1">1 - ต่ำมาก</option>
                    <option value="2">2 - ต่ำ</option>
                    <option value="3">3 - ปานกลาง</option>
                    <option value="4">4 - สูง</option>
                    <option value="5">5 - สูงมาก</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ผลกระทบ (I: 1-5)</label>
                  <select
                    value={newRisk.impact}
                    onChange={(e) => setNewRisk({ ...newRisk, impact: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="1">1 - ต่ำมาก</option>
                    <option value="2">2 - ต่ำ</option>
                    <option value="3">3 - ปานกลาง</option>
                    <option value="4">4 - สูง</option>
                    <option value="5">5 - สูงมาก</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs font-bold">
                <span>คะแนนความเสี่ยง (L x I):</span>
                <span className="text-base text-blue-600 dark:text-blue-400 font-black">
                  {newRisk.likelihood * newRisk.impact}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">มาตรการควบคุม / แผนลดความเสี่ยง (บส.3)</label>
                <textarea
                  rows="2"
                  value={newRisk.treatment}
                  onChange={(e) => setNewRisk({ ...newRisk, treatment: e.target.value })}
                  placeholder="ระบุกิจกรรมควบคุม..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRisk(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  บันทึกการประเมิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT ANNUAL PLAN ITEM
      ========================================================================= */}
      {showEditPlanModal && editingPlan && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  แก้ไขโครงการตรวจสอบ ({editingPlan.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditPlanModal(false);
                  setEditingPlan(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditPlan} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อเรื่อง / กิจกรรมที่ตรวจสอบ</label>
                <input
                  type="text"
                  required
                  value={editingPlan.title || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">มิติการตรวจสอบ</label>
                  <select
                    value={editingPlan.dimension || 'compliance'}
                    onChange={(e) => setEditingPlan({ ...editingPlan, dimension: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    {AUDIT_DIMENSIONS.filter((d) => d.id !== 'all').map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.badge}: {d.label.split('(')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">หน่วยรับตรวจ</label>
                  <select
                    value={editingPlan.department || 'กองคลัง'}
                    onChange={(e) => setEditingPlan({ ...editingPlan, department: e.target.value })}
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
                  <label className="font-bold text-slate-700 dark:text-slate-300">ระดับความเสี่ยง</label>
                  <select
                    value={editingPlan.riskLevel || 'สูง'}
                    onChange={(e) => setEditingPlan({ ...editingPlan, riskLevel: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="สูงมาก">สูงมาก</option>
                    <option value="สูง">สูง</option>
                    <option value="ปานกลาง">ปานกลาง</option>
                    <option value="ต่ำ">ต่ำ</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">งบประมาณดำเนินการ (บาท)</label>
                  <input
                    type="number"
                    value={editingPlan.budget ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, budget: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ไตรมาส / ระยะเวลา</label>
                  <input
                    type="text"
                    value={editingPlan.quarter || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, quarter: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">จำนวนวันตรวจ (คน-วัน)</label>
                  <input
                    type="number"
                    value={editingPlan.manDays ?? 30}
                    onChange={(e) => setEditingPlan({ ...editingPlan, manDays: Number(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">สถานะ</label>
                  <select
                    value={editingPlan.status || 'pending'}
                    onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                  >
                    <option value="pending">รอตรวจ (Pending)</option>
                    <option value="in_progress">กำลังตรวจ (In Progress)</option>
                    <option value="completed">เสร็จสิ้น (Completed)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ความก้าวหน้า (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingPlan.progress ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, progress: Number(e.target.value) || 0 })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ผู้รับผิดชอบการตรวจสอบ</label>
                <input
                  type="text"
                  value={editingPlan.auditor || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, auditor: e.target.value })}
                  placeholder="เช่น นางสาว ก (นักวิชาการตรวจสอบภายใน)"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">วัตถุประสงค์การตรวจสอบ</label>
                <textarea
                  rows="3"
                  value={editingPlan.objective || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, objective: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                ></textarea>
              </div>

              <div className="shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPlanModal(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: OFFICIAL DLA ANNUAL AUDIT PLAN FORM (สถ. หน้า 16)
      ========================================================================= */}
      {showDlaPlanFormModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
            <div className="shrink-0 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    แบบแผนการปฏิบัติงานตรวจสอบประจำปี (คู่มือ สถ. หน้า 16)
                  </h3>
                  <p className="text-xs text-slate-500">
                    รูปแบบตารางมาตรฐานทางการสำหรับเสนอขออนุมัติผู้บริหารท้องถิ่น
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <OfficialDocActionToolbar
                  onDownloadWord={handleDownloadDlaPlanFormWord}
                  onDownloadExcel={handleDownloadAnnualPlanExcel}
                  onPrint={() => window.print()}
                  wordTooltip="ดาวน์โหลดแบบฟอร์มแผนประจำปี (สถ. หน้า 16) Word (.doc)"
                  excelTooltip="ดาวน์โหลดตารางแผนประจำปี Excel (.xlsx)"
                  printTooltip="สั่งพิมพ์แบบฟอร์มแผน หรือบันทึกเป็น PDF"
                />
                <button
                  onClick={() => setShowDlaPlanFormModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-serif">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  แผนการปฏิบัติงานตรวจสอบ ประจำปีงบประมาณ พ.ศ. {selectedYear}
                </h2>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  หน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
                </h3>
              </div>

              <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    <tr>
                      <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center w-12">ลำดับ</th>
                      <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">โครงการ / กิจกรรมที่ตรวจสอบ</th>
                      <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 w-28 text-center">หน่วยรับตรวจ</th>
                      <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 w-44">ผู้รับผิดชอบ</th>
                      <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 w-36 text-center">ระยะเวลา</th>
                      <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 w-24 text-right">งบประมาณ</th>
                      <th className="p-2.5 text-center w-20">คน-วัน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {annualPlans.map((plan, idx) => (
                      <tr key={plan.id}>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-medium">
                          {plan.title}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center">
                          {plan.department}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-[11px]">
                          {plan.auditor || orgProfile?.auditorName || 'นักวิชาการตรวจสอบภายใน'}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center text-[11px]">
                          {plan.period || plan.quarter}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono">
                          {Number(plan.budget || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono">
                          {plan.manDays || 30}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 dark:bg-slate-850 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                      <td colSpan="5" className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center">
                        รวมงบประมาณและจำนวนวันทั้งสิ้น
                      </td>
                      <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right font-mono">
                        {annualPlans.reduce((sum, p) => sum + (Number(p.budget) || 0), 0).toLocaleString()} ฿
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {annualPlans.reduce((sum, p) => sum + (Number(p.manDays) || 30), 0)} วัน
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures 3 Columns */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-6">
                  <div>(ลงชื่อ)........................................................</div>
                  <div>
                    <div className="font-bold">({orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})</div>
                    <div className="text-slate-500">{orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}</div>
                    <div className="text-[11px] text-slate-400">ผู้จัดทำแผน</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>(ลงชื่อ)........................................................</div>
                  <div>
                    <div className="font-bold">({orgProfile?.palatName || 'ปลัด อปท.'})</div>
                    <div className="text-slate-500">{orgProfile?.palatPosition || 'ปลัดองค์กรปกครองส่วนท้องถิ่น'}</div>
                    <div className="text-[11px] text-slate-400">ผู้เห็นชอบ</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>(ลงชื่อ)........................................................</div>
                  <div>
                    <div className="font-bold">({orgProfile?.approverName || 'นายก อปท.'})</div>
                    <div className="text-slate-500">{orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                    <div className="text-[11px] text-slate-400">ผู้อนุมัติ</div>
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
    </div>
  );
}
