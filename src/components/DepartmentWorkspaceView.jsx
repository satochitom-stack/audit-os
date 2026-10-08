import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  BadgeDollarSign,
  HardHat,
  Plus,
  Printer,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  FileText,
  Trash2,
  Search,
  Filter,
  Sparkles,
  Layers,
  Car,
  FileSpreadsheet,
  Users,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Download,
  TrendingUp,
  FolderPlus,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Info,
  GraduationCap,
  HeartHandshake,
  Activity,
  Send,
  Apple,
  Milk,
  Baby,
  Truck,
  AlertOctagon,
  Heart,
  HelpCircle
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import {
  initialOfficeWorkspaceData,
  initialFinanceWorkspaceData,
  initialTechWorkspaceData,
  initialEducationWorkspaceData,
  initialWelfareWorkspaceData,
  initialPublicHealthWorkspaceData,
  initialCdcCharoenWorkspaceData,
  initialCdcFangthoengWorkspaceData
} from '../data/initialData';
import { exportDepartmentWorkspacesExcel } from '../services/reportExportService';

export default function DepartmentWorkspaceView({
  orgProfile = {},
  selectedYear = '2569',
  session = null,
  capaFindings = [],
  setCapaFindings = () => {},
  initialDepartment = 'สำนักปลัด',
  setCurrentTab = () => {}
}) {
  const isAdmin = session?.role === 'admin' || session?.role === 'executive';
  const userDept = session?.department || 'สำนักปลัด';

  // Determine active department: if non-admin, lock or default to user's dept
  const getDefaultDept = () => {
    if (!isAdmin) {
      if (userDept.includes('คลัง')) return 'กองคลัง';
      if (userDept.includes('ช่าง')) return 'กองช่าง';
      if (userDept.includes('การศึกษา')) return 'กองการศึกษา';
      if (userDept.includes('สวัสดิการ')) return 'กองสวัสดิการสังคม';
      if (userDept.includes('เจริญทัศน์')) return 'ศพด.วัดเจริญทัศน์';
      if (userDept.includes('ฝางเทิง')) return 'ศพด.บ้านฝางเทิง';
      if (userDept.includes('สาธารณสุข') || userDept.includes('สิ่งแวดล้อม')) return 'สำนักปลัด';
      return 'สำนักปลัด';
    }
    return initialDepartment || 'สำนักปลัด';
  };

  const [activeDept, setActiveDept] = useState(getDefaultDept);

  useEffect(() => {
    if (initialDepartment && isAdmin) {
      setActiveDept(initialDepartment);
    }
  }, [initialDepartment, isAdmin]);

  // Sub-tabs per department
  // สำนักปลัด: 'overview', 'vehicles', 'projects', 'saraban', 'complaints', 'capa'
  // กองคลัง: 'overview', 'contracts', 'penalty', 'inventory', 'loans', 'capa'
  // กองช่าง: 'overview', 'estimator', 'projects', 'permits', 'machinery', 'capa'
  // กองการศึกษา: 'overview', 'lunch', 'materials', 'teachers', 'capa'
  // กองสวัสดิการสังคม: 'overview', 'elderly', 'disability', 'relief', 'capa'
  // งานสาธารณสุขฯ: 'overview', 'waste', 'disease', 'sanitation', 'capa'
  const [subTab, setSubTab] = useState('overview');

  // Reset sub-tab when department changes
  useEffect(() => {
    setSubTab('overview');
  }, [activeDept]);

  // Persistent Department States isolated in LocalStorage
  const [officeData, setOfficeData] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_dept_office_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialOfficeWorkspaceData;
  });

  const [financeData, setFinanceData] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_dept_finance_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialFinanceWorkspaceData;
  });

  const [techData, setTechData] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_dept_tech_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialTechWorkspaceData;
  });

  const [educationData, setEducationData] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_dept_education_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            summary: { ...initialEducationWorkspaceData.summary, ...(parsed.summary || {}) },
            centers: Array.isArray(parsed.centers) ? parsed.centers : [],
            schoolLunchMilk: Array.isArray(parsed.schoolLunchMilk) ? parsed.schoolLunchMilk : [],
            educationalMaterials: Array.isArray(parsed.educationalMaterials) ? parsed.educationalMaterials : [],
            cdcTeachers: Array.isArray(parsed.cdcTeachers) ? parsed.cdcTeachers : []
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialEducationWorkspaceData;
  });

  const [welfareData, setWelfareData] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_dept_welfare_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            summary: { ...initialWelfareWorkspaceData.summary, ...(parsed.summary || {}) },
            elderlyAllowances: Array.isArray(parsed.elderlyAllowances) ? parsed.elderlyAllowances : initialWelfareWorkspaceData.elderlyAllowances,
            disabilityAllowances: Array.isArray(parsed.disabilityAllowances) ? parsed.disabilityAllowances : [],
            emergencyRelief: Array.isArray(parsed.emergencyRelief) ? parsed.emergencyRelief : [],
            hivEmergencyAids: Array.isArray(parsed.hivEmergencyAids) ? parsed.hivEmergencyAids : []
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialWelfareWorkspaceData;
  });

  const [publicHealthData, setPublicHealthData] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_dept_public_health_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            summary: {
              wasteBinsRegistered: 0,
              monthlyWasteFeeEstimate: 0,
              foggingCampaignsCompleted: 0,
              rabiesVaccinatedAnimals: 0,
              ...(parsed.summary || {})
            },
            wasteManagement: Array.isArray(parsed.wasteManagement)
              ? parsed.wasteManagement
              : (Array.isArray(parsed.wasteFeeCollections) ? parsed.wasteFeeCollections : []),
            diseaseControl: Array.isArray(parsed.diseaseControl)
              ? parsed.diseaseControl
              : (Array.isArray(parsed.diseaseSurveillances) ? parsed.diseaseSurveillances : []),
            foodSanitation: Array.isArray(parsed.foodSanitation)
              ? parsed.foodSanitation
              : (Array.isArray(parsed.marketFoodSanitations) ? parsed.marketFoodSanitations : [])
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialPublicHealthWorkspaceData;
  });

  // Executive Directives from LocalStorage
  const [executiveDirectives, setExecutiveDirectives] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_executive_directives');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Save changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('ia_dept_office_data', JSON.stringify(officeData));
  }, [officeData]);

  useEffect(() => {
    localStorage.setItem('ia_dept_finance_data', JSON.stringify(financeData));
  }, [financeData]);

  useEffect(() => {
    localStorage.setItem('ia_dept_tech_data', JSON.stringify(techData));
  }, [techData]);

  useEffect(() => {
    localStorage.setItem('ia_dept_education_data', JSON.stringify(educationData));
  }, [educationData]);

  useEffect(() => {
    localStorage.setItem('ia_dept_welfare_data', JSON.stringify(welfareData));
  }, [welfareData]);

  useEffect(() => {
    localStorage.setItem('ia_dept_public_health_data', JSON.stringify(publicHealthData));
  }, [publicHealthData]);

  const [cdcCharoenData, setCdcCharoenData] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_dept_cdc_charoen_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...initialCdcCharoenWorkspaceData,
            ...parsed,
            summary: { ...initialCdcCharoenWorkspaceData.summary, ...(parsed.summary || {}) },
            children: Array.isArray(parsed.children) ? parsed.children : initialCdcCharoenWorkspaceData.children,
            lunchDailyLogs: Array.isArray(parsed.lunchDailyLogs) ? parsed.lunchDailyLogs : initialCdcCharoenWorkspaceData.lunchDailyLogs,
            healthGrowthChecks: Array.isArray(parsed.healthGrowthChecks) ? parsed.healthGrowthChecks : initialCdcCharoenWorkspaceData.healthGrowthChecks,
            materialsAndSafety: Array.isArray(parsed.materialsAndSafety) ? parsed.materialsAndSafety : initialCdcCharoenWorkspaceData.materialsAndSafety,
            teachers: Array.isArray(parsed.teachers) ? parsed.teachers : initialCdcCharoenWorkspaceData.teachers
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialCdcCharoenWorkspaceData;
  });

  const [cdcFangthoengData, setCdcFangthoengData] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_dept_cdc_fangthoeng_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...initialCdcFangthoengWorkspaceData,
            ...parsed,
            summary: { ...initialCdcFangthoengWorkspaceData.summary, ...(parsed.summary || {}) },
            children: Array.isArray(parsed.children) ? parsed.children : initialCdcFangthoengWorkspaceData.children,
            lunchDailyLogs: Array.isArray(parsed.lunchDailyLogs) ? parsed.lunchDailyLogs : initialCdcFangthoengWorkspaceData.lunchDailyLogs,
            healthGrowthChecks: Array.isArray(parsed.healthGrowthChecks) ? parsed.healthGrowthChecks : initialCdcFangthoengWorkspaceData.healthGrowthChecks,
            materialsAndSafety: Array.isArray(parsed.materialsAndSafety) ? parsed.materialsAndSafety : initialCdcFangthoengWorkspaceData.materialsAndSafety,
            teachers: Array.isArray(parsed.teachers) ? parsed.teachers : initialCdcFangthoengWorkspaceData.teachers
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialCdcFangthoengWorkspaceData;
  });

  useEffect(() => {
    localStorage.setItem('ia_dept_cdc_charoen_data', JSON.stringify(cdcCharoenData));
  }, [cdcCharoenData]);

  useEffect(() => {
    localStorage.setItem('ia_dept_cdc_fangthoeng_data', JSON.stringify(cdcFangthoengData));
  }, [cdcFangthoengData]);

  // Toast State
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Confirm Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    type: 'danger',
    onConfirm: () => {}
  });

  const openConfirm = (config) => {
    setConfirmModalConfig({
      isOpen: true,
      title: config.title || 'ยืนยันการทำรายการ',
      message: config.message,
      confirmText: config.confirmText || 'ยืนยัน',
      type: config.type || 'danger',
      onConfirm: config.onConfirm || (() => {})
    });
  };

  // =========================================================================
  // SUB-COMPONENTS & TOOL STATES
  // =========================================================================

  // 1. Penalty Calculator State (กองคลัง)
  const [penaltyContractPrice, setPenaltyContractPrice] = useState('850000');
  const [penaltyRate, setPenaltyRate] = useState('0.001'); // 0.1% or 0.2% or 0.01%
  const [penaltyDueDate, setPenaltyDueDate] = useState('2026-08-15');
  const [penaltyDeliveryDate, setPenaltyDeliveryDate] = useState('2026-08-25');
  const [penaltyDeductHolidays, setPenaltyDeductHolidays] = useState(0);

  const penaltyCalculation = useMemo(() => {
    const price = Number(penaltyContractPrice) || 0;
    const rate = Number(penaltyRate) || 0.001;
    if (!penaltyDueDate || !penaltyDeliveryDate) return { days: 0, dailyPenalty: 0, totalPenalty: 0 };
    const due = new Date(penaltyDueDate);
    const deliver = new Date(penaltyDeliveryDate);
    const diffTime = deliver.getTime() - due.getTime();
    let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days <= 0) return { days: 0, dailyPenalty: Math.round(price * rate), totalPenalty: 0 };
    const netDays = Math.max(0, days - Number(penaltyDeductHolidays || 0));
    const dailyPenalty = Math.round(price * rate);
    const totalPenalty = dailyPenalty * netDays;
    return { days: netDays, dailyPenalty, totalPenalty, rawDays: days };
  }, [penaltyContractPrice, penaltyRate, penaltyDueDate, penaltyDeliveryDate, penaltyDeductHolidays]);

  // 2. Factor F Calculator State (กองช่าง)
  const [factorFWorkType, setFactorFWorkType] = useState('road'); // road, building, bridge, irrigation
  const [factorFDirectCost, setFactorFDirectCost] = useState('1500000');
  const [factorFAdvance, setFactorFAdvance] = useState('0'); // 0, 5, 10, 15
  const [factorFRetention, setFactorFRetention] = useState('0'); // 0, 5, 10
  const [factorFInterest, setFactorFInterest] = useState('6'); // 5, 6, 7
  const [factorFVat] = useState(7);

  const factorFCalculation = useMemo(() => {
    const cost = Number(factorFDirectCost) || 0;
    if (cost <= 0) return { factorF: 1.3000, estimatedPrice: 0 };
    let baseF = 1.3082;
    if (factorFWorkType === 'road') {
      if (cost < 500000) baseF = 1.3624;
      else if (cost < 1000000) baseF = 1.3285;
      else if (cost < 2000000) baseF = 1.3082;
      else if (cost < 5000000) baseF = 1.2844;
      else baseF = 1.2512;
    } else if (factorFWorkType === 'building') {
      if (cost < 500000) baseF = 1.3054;
      else if (cost < 1000000) baseF = 1.2785;
      else if (cost < 2000000) baseF = 1.2592;
      else baseF = 1.2312;
    } else if (factorFWorkType === 'bridge') {
      if (cost < 1000000) baseF = 1.3325;
      else if (cost < 2000000) baseF = 1.3115;
      else baseF = 1.2755;
    } else {
      if (cost < 1000000) baseF = 1.3150;
      else baseF = 1.2820;
    }
    // Adjust interest
    if (factorFInterest === '7') baseF += 0.0075;
    else if (factorFInterest === '5') baseF -= 0.0075;
    const estPrice = Math.round(cost * baseF);
    return { factorF: Number(baseF.toFixed(4)), estimatedPrice: estPrice };
  }, [factorFWorkType, factorFDirectCost, factorFAdvance, factorFRetention, factorFInterest]);

  // Modal Add Item States for All Departments
  const [showAddOfficeLogModal, setShowAddOfficeLogModal] = useState(false);
  const [newVehicleLog, setNewVehicleLog] = useState({
    plate: 'กข-4122 อุบลราชธานี',
    requestDate: new Date().toISOString().slice(0, 10),
    requester: '',
    destination: '',
    startKm: '',
    endKm: '',
    fuelVoucherNo: '',
    fuelLiters: '',
    fuelCost: ''
  });

  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [newContract, setNewContract] = useState({
    contractNo: '',
    title: '',
    method: 'เฉพาะเจาะจง',
    contractPrice: '',
    contractor: '',
    signedDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    guaranteeType: 'หนังสือค้ำประกันธนาคาร (LG)',
    guaranteeAmount: ''
  });

  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    contractNo: '',
    borrower: '',
    purpose: '',
    amount: '',
    borrowDate: new Date().toISOString().slice(0, 10),
    dueDate: ''
  });

  const [showAddConstProjectModal, setShowAddConstProjectModal] = useState(false);
  const [newConstProject, setNewConstProject] = useState({
    projectName: '',
    location: '',
    budget: '',
    contractPrice: '',
    contractor: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    engineerSupervisor: '',
    progress: 0
  });

  const [showAddPermitModal, setShowAddPermitModal] = useState(false);
  const [newPermit, setNewPermit] = useState({
    requestNo: '',
    applicant: '',
    buildingType: 'บ้านพักอาศัย ค.ส.ล. 1-2 ชั้น',
    areaSqM: '',
    location: '',
    submissionDate: new Date().toISOString().slice(0, 10),
    feeAmount: 100
  });

  // CDC Specific Modal States
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChild, setNewChild] = useState({
    prefix: 'ด.ช.',
    firstName: '',
    lastName: '',
    nickname: '',
    idCard: '',
    birthDate: '',
    gender: 'ชาย',
    weight: '',
    height: '',
    nutritionStatus: 'สมส่วน',
    dentalStatus: 'ฟันดีไม่มีผุ',
    parentName: '',
    phone: '',
    status: 'กำลังศึกษา'
  });

  const [showAddLunchModal, setShowAddLunchModal] = useState(false);
  const [newLunchLog, setNewLunchLog] = useState({
    date: new Date().toISOString().slice(0, 10),
    attendanceCount: '',
    absentCount: '0',
    menuDescription: '',
    milkQuantity: '',
    milkTasteCheck: 'ปกติ (รสจืด เย็นตามเกณฑ์)',
    lunchQualityCheck: 'ถูกสุขลักษณะ รสชาติกลมกล่อม ครบ 5 หมู่',
    inspector: '',
    remarks: ''
  });

  const [showAddHealthModal, setShowAddHealthModal] = useState(false);
  const [newHealthCheck, setNewHealthCheck] = useState({
    checkDate: new Date().toISOString().slice(0, 10),
    term: 'ภาคเรียนที่ 1/2569',
    childName: '',
    weight: '',
    height: '',
    nutritionStatus: 'สมส่วน',
    dentalStatus: 'ฟันดี ไม่มีฟันน้ำนมผุ',
    dspmStatus: 'สมวัยทุกด้าน (4 ด้านผ่านเกณฑ์)',
    examiner: ''
  });

  const [showAddSafetyModal, setShowAddSafetyModal] = useState(false);
  const [newSafetyCheck, setNewSafetyCheck] = useState({
    itemName: '',
    category: 'เครื่องเล่นสนาม',
    quantity: '1',
    condition: 'พร้อมใช้งาน ปลอดภัย มีแผ่นยางกันกระแทก',
    lastInspectedDate: new Date().toISOString().slice(0, 10),
    inspector: ''
  });

  // Helper flags for CDC
  const isCdc = activeDept === 'ศพด.วัดเจริญทัศน์' || activeDept === 'ศพด.บ้านฝางเทิง';
  const currentCdcData = activeDept === 'ศพด.วัดเจริญทัศน์' ? cdcCharoenData : cdcFangthoengData;
  const setCurrentCdcData = activeDept === 'ศพด.วัดเจริญทัศน์' ? setCdcCharoenData : setCdcFangthoengData;

  // Filter CAPA findings belonging to the active department
  const deptCapaFindings = useMemo(() => {
    return capaFindings.filter((f) => {
      if (activeDept.includes('เจริญทัศน์')) {
        return f.department?.includes('เจริญทัศน์') || f.department?.includes('ศพด.');
      }
      if (activeDept.includes('ฝางเทิง')) {
        return f.department?.includes('ฝางเทิง') || f.department?.includes('ศพด.');
      }
      return f.department?.includes(activeDept.replace('กอง', '').replace('สำนัก', ''));
    });
  }, [capaFindings, activeDept]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 dark:bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 border border-slate-700 text-xs font-bold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Department Switcher */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-2xl p-5 sm:p-6 border border-stone-800 shadow-sm text-stone-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Department Workspace (Sprint 3)
              </span>
              <span className="text-xs text-stone-300">
                {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} • ปีงบประมาณ พ.ศ. {selectedYear}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-100 flex items-center space-x-2.5">
              <span>พื้นที่ทำงานเฉพาะส่วนราชการ: {activeDept}</span>
            </h1>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              ศูนย์ปฏิบัติงานส่วนราชการที่เชื่อมโยงงานประจำ เครื่องมือเฉพาะทาง (พัสดุ, ราคากลาง, แผนงาน) พร้อมระบบการควบคุมภายในและการตอบข้อทักท้วงตามกฎหมาย
            </p>
          </div>

          {/* Department Switcher Tabs & Excel Export Button */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isAdmin ? (
              <div className="flex flex-wrap items-center bg-stone-800/80 p-1.5 rounded-2xl border border-stone-700/80 shrink-0 gap-1">
                {[
                  { id: 'สำนักปลัด', label: 'สำนักปลัด', icon: Building2 },
                  { id: 'กองคลัง', label: 'กองคลัง', icon: BadgeDollarSign },
                  { id: 'กองช่าง', label: 'กองช่าง', icon: HardHat },
                  { id: 'กองการศึกษา', label: 'กองการศึกษา', icon: GraduationCap },
                  { id: 'กองสวัสดิการสังคม', label: 'กองสวัสดิการสังคม', icon: HeartHandshake },
                  { id: 'ศพด.วัดเจริญทัศน์', label: 'ศพด.วัดเจริญทัศน์', icon: Baby },
                  { id: 'ศพด.บ้านฝางเทิง', label: 'ศพด.บ้านฝางเทิง', icon: Baby }
                ].map((d) => {
                  const isSelected = activeDept === d.id;
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setActiveDept(d.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>เข้าสู่ระบบในฐานะ: {session?.displayName || userDept}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                exportDepartmentWorkspacesExcel({
                  officeData,
                  financeData,
                  techData,
                  orgProfile,
                  selectedYear
                });
                showToast(`📗 ส่งออกข้อมูล Excel ของ ${activeDept} เรียบร้อยแล้ว`);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors shrink-0"
              title="ส่งออกข้อมูลสำนัก/กอง เป็น Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation for Active Department */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
          {/* 1. สำนักปลัด Sub-Tabs */}
          {activeDept === 'สำนักปลัด' && (
            <>
              <button
                onClick={() => setSubTab('overview')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'overview' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ภาพรวมสำนักปลัด</span>
              </button>
              <button
                onClick={() => setSubTab('vehicles')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'vehicles' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>ทะเบียนคุมรถ & น้ำมัน ({officeData.vehicleLogs.length})</span>
              </button>
              <button
                onClick={() => setSubTab('projects')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'projects' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>แผนพัฒนาท้องถิ่น ({officeData.developmentProjects.length})</span>
              </button>
              <button
                onClick={() => setSubTab('saraban')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'saraban' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>สารบรรณอิเล็กทรอนิกส์ ({officeData.sarabanBooks.length})</span>
              </button>
              <button
                onClick={() => setSubTab('complaints')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'complaints' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>เรื่องร้องเรียน & นิติการ ({officeData.complaints.length})</span>
              </button>
              <button
                onClick={() => setSubTab('health')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'health' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-teal-500" />
                <span>งานสาธารณสุขและสิ่งแวดล้อม ({publicHealthData?.wasteManagement?.length || 0} ม.)</span>
              </button>
              <button
                onClick={() => setSubTab('capa')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'capa' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>ตอบข้อทักท้วง (CAPA) ({deptCapaFindings.length})</span>
              </button>
            </>
          )}

          {/* 2. กองคลัง Sub-Tabs */}
          {activeDept === 'กองคลัง' && (
            <>
              <button
                onClick={() => setSubTab('overview')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'overview' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ภาพรวมกองคลัง</span>
              </button>
              <button
                onClick={() => setSubTab('contracts')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'contracts' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>ทะเบียนจัดซื้อจัดจ้าง & สัญญา ({financeData.contracts.length})</span>
              </button>
              <button
                onClick={() => setSubTab('penalty')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'penalty' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-amber-500" />
                <span>เครื่องมือคำนวณค่าปรับพัสดุ</span>
              </button>
              <button
                onClick={() => setSubTab('inventory')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'inventory' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ตรวจสอบพัสดุประจำปี (ว 184)</span>
              </button>
              <button
                onClick={() => setSubTab('loans')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'loans' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>ลูกหนี้เงินยืม 30 วัน ({financeData.loans.length})</span>
              </button>
              <button
                onClick={() => setSubTab('capa')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'capa' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>ตอบข้อทักท้วง สตง./IA ({deptCapaFindings.length})</span>
              </button>
            </>
          )}

          {/* 3. กองช่าง Sub-Tabs */}
          {activeDept === 'กองช่าง' && (
            <>
              <button
                onClick={() => setSubTab('overview')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'overview' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ภาพรวมกองช่าง</span>
              </button>
              <button
                onClick={() => setSubTab('estimator')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'estimator' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-blue-500" />
                <span>คำนวณราคากลาง Factor F & ปร.5</span>
              </button>
              <button
                onClick={() => setSubTab('projects')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'projects' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <HardHat className="w-3.5 h-3.5" />
                <span>โครงการก่อสร้างตามข้อบัญญัติ ({techData.constructionProjects.length})</span>
              </button>
              <button
                onClick={() => setSubTab('permits')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'permits' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>ขออนุญาตก่อสร้างอาคาร 45 วัน ({techData.buildingPermits.length})</span>
              </button>
              <button
                onClick={() => setSubTab('machinery')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'machinery' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>เครื่องจักรกล & ยานพาหนะ ({techData.machinery.length})</span>
              </button>
              <button
                onClick={() => setSubTab('capa')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'capa' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>ตอบข้อทักท้วงกองช่าง ({deptCapaFindings.length})</span>
              </button>
            </>
          )}

          {/* 4. กองการศึกษา ศาสนาและวัฒนธรรม Sub-Tabs */}
          {activeDept === 'กองการศึกษา' && (
            <>
              <button
                onClick={() => setSubTab('overview')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'overview' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ภาพรวมกองการศึกษา</span>
              </button>
              <button
                onClick={() => setSubTab('lunch')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'lunch' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Apple className="w-3.5 h-3.5 text-emerald-500" />
                <span>อาหารกลางวัน & นม ศพด.</span>
              </button>
              <button
                onClick={() => setSubTab('materials')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'materials' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>สื่อการเรียนการสอน ({educationData.educationalMaterials.length})</span>
              </button>
              <button
                onClick={() => setSubTab('teachers')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'teachers' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>ทะเบียนครูผู้ดูแลเด็ก ({educationData.cdcTeachers.length})</span>
              </button>
              <button
                onClick={() => setSubTab('capa')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'capa' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>ตอบข้อทักท้วง ({deptCapaFindings.length})</span>
              </button>
            </>
          )}

          {/* 5. กองสวัสดิการสังคม Sub-Tabs */}
          {activeDept === 'กองสวัสดิการสังคม' && (
            <>
              <button
                onClick={() => setSubTab('overview')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'overview' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ภาพรวมกองสวัสดิการ</span>
              </button>
              <button
                onClick={() => setSubTab('elderly')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'elderly' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>เบี้ยยังชีพผู้สูงอายุ 4 ขั้น ({welfareData.summary.totalElderlyBeneficiaries})</span>
              </button>
              <button
                onClick={() => setSubTab('disability')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'disability' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" />
                <span>เบี้ยความพิการ ({welfareData.summary.totalDisabilityBeneficiaries})</span>
              </button>
              <button
                onClick={() => setSubTab('relief')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'relief' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>เงินสงเคราะห์ผู้ประสบภัย ({welfareData.emergencyRelief.length})</span>
              </button>
              <button
                onClick={() => setSubTab('capa')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'capa' ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60' : 'bg-stone-100 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>ตอบข้อทักท้วง ({deptCapaFindings.length})</span>
              </button>
            </>
          )}

          {/* 6. ศูนย์พัฒนาเด็กเล็ก (ศพด.วัดเจริญทัศน์ & ศพด.บ้านฝางเทิง) Sub-Tabs */}
          {isCdc && (
            <>
              <button
                onClick={() => setSubTab('overview')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'overview' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ภาพรวม ศพด.</span>
              </button>
              <button
                onClick={() => setSubTab('students')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'students' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Baby className="w-3.5 h-3.5 text-pink-500" />
                <span>ทะเบียนเด็กเล็ก ({currentCdcData.children.length} คน)</span>
              </button>
              <button
                onClick={() => setSubTab('lunch')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'lunch' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5 text-emerald-500" />
                <span>อาหารกลางวัน & นม ({currentCdcData.lunchDailyLogs.length} วัน)</span>
              </button>
              <button
                onClick={() => setSubTab('health')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'health' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-teal-500" />
                <span>สุขภาพ & พัฒนาการ ({currentCdcData.healthGrowthChecks.length})</span>
              </button>
              <button
                onClick={() => setSubTab('materials')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'materials' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>สื่อการเรียน & ความปลอดภัย ({currentCdcData.materialsAndSafety.length})</span>
              </button>
              <button
                onClick={() => setSubTab('teachers')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'teachers' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>บุคลากรครู ({currentCdcData.teachers.length} ท่าน)</span>
              </button>
              <button
                onClick={() => setSubTab('capa')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  subTab === 'capa' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>ตอบข้อทักท้วง ({deptCapaFindings.length})</span>
              </button>
            </>
          )}

        </div>
      </div>

      {/* EXECUTIVE DIRECTIVES CALLOUT BANNER (if any directive assigned to activeDept) */}
      {(() => {
        const relevant = executiveDirectives.filter((d) =>
          d.department === activeDept ||
          (activeDept === 'สำนักปลัด' && (d.department?.includes('ปลัด') || d.department?.includes('สาธารณสุข') || d.department?.includes('สิ่งแวดล้อม'))) ||
          (activeDept === 'กองการศึกษา' && d.department?.includes('การศึกษา')) ||
          (activeDept === 'กองสวัสดิการสังคม' && d.department?.includes('สวัสดิการ')) ||
          (isCdc && (d.department?.includes('ศพด.') || d.department?.includes(activeDept.replace('ศพด.', ''))))
        );

        if (relevant.length === 0) return null;

        return (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-4 rounded-2xl border border-amber-300 dark:border-amber-800/60 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  ข้อสั่งการผู้บริหารส่งถึง {activeDept} ({relevant.length} เรื่อง)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentTab('executive-dashboard')}
                className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>เปิดศูนย์สั่งการผู้บริหาร</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5">
              {relevant.map((dir) => (
                <div key={dir.id} className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{dir.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {dir.urgency === 'urgent_high' ? '⚡ ด่วนที่สุด' : 'ด่วนมาก'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ผู้สั่งการ: <strong>{dir.issuer}</strong> • กำหนดรายงานผล: <strong className="text-rose-600">{dir.dueDate}</strong>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border self-start sm:self-center ${
                    dir.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : dir.status === 'reported'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {dir.status === 'completed' ? '✓ รายงานเสร็จสิ้น' : dir.status === 'reported' ? 'รายงานผลแล้ว' : '⏳ รอดำเนินการ'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          WORKSPACE CONTENT: 1. สำนักปลัด
      ========================================================================= */}
      {activeDept === 'สำนักปลัด' && (
        <div className="space-y-6">
          {/* SubTab: Overview */}
          {subTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ยานพาหนะส่วนกลาง</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{officeData.vehicles.length} คัน</div>
                  <div className="text-[11px] text-blue-600 font-bold">บันทึกเดินทาง {officeData.vehicleLogs.length} เที่ยว</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">โครงการพัฒนาท้องถิ่น</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{officeData.developmentProjects.length} โครงการ</div>
                  <div className="text-[11px] text-emerald-600 font-bold">งบรวม {officeData.developmentProjects.reduce((a,c)=>a+c.budget,0).toLocaleString()} ฿</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">หนังสือสารบรรณในระบบ</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{officeData.sarabanBooks.length} ฉบับ</div>
                  <div className="text-[11px] text-purple-600 font-bold">รับ-ส่งคำสั่งการล่าสุด</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">เรื่องร้องเรียนศูนย์ดำรงธรรม</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{officeData.complaints.length} เรื่อง</div>
                  <div className="text-[11px] text-amber-600 font-bold">ยุติแล้ว {officeData.complaints.filter(c=>c.status==='resolved').length} เรื่อง</div>
                </div>
              </div>

              {/* Action Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/70 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                    <Car className="w-4 h-4 text-blue-600" />
                    <span>งานควบคุมการใช้รถยนต์ส่วนกลางและน้ำมันเชื้อเพลิง</span>
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    ควบคุมการบันทึกเลขกิโลเมตรและใบสั่งจ่ายน้ำมันอย่างเคร่งครัดตามระเบียบ มท. ว่าด้วยการใช้และรักษารถยนต์ของ อปท. พ.ศ. 2548
                  </p>
                  <button
                    onClick={() => setSubTab('vehicles')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>เปิดทะเบียนคุมรถยนต์</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>แผนพัฒนาท้องถิ่นและข้อบัญญัติงบประมาณ</span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    ติดตามการดำเนินโครงการตามข้อบัญญัติงบประมาณรายจ่ายประจำปี 2569 ให้แล้วเสร็จตามกำหนด
                  </p>
                  <button
                    onClick={() => setSubTab('projects')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>ดูรายการโครงการ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Vehicles & Fuel Logbook */}
          {subTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    สมุดบันทึกการใช้รถยนต์ส่วนกลางและการใช้น้ำมันเชื้อเพลิง (Vehicle & Fuel Logbook)
                  </h3>
                  <p className="text-xs text-slate-500">
                    บันทึกการเดินทาง เลขไมล์ และใบสั่งจ่ายน้ำมันตามระเบียบกระทรวงมหาดไทย
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAddOfficeLogModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>บันทึกการขอใช้รถ</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="no-print bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Vehicles Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {officeData.vehicles.map((v) => (
                  <div key={v.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{v.plate}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        พร้อมใช้งาน
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{v.type} ({v.brand})</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>คนขับประจำ: {v.driver}</span>
                      <span className="font-mono font-bold">เลขไมล์: {v.currentKm.toLocaleString()} กม.</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Logs Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3.5">วันที่เดินทาง</th>
                        <th className="p-3.5">ทะเบียนรถ</th>
                        <th className="p-3.5">ผู้ขอใช้รถ / วัตถุประสงค์และสถานที่ไป</th>
                        <th className="p-3.5 text-center">เลขไมล์ ไป-กลับ</th>
                        <th className="p-3.5 text-center">ระยะทาง (กม.)</th>
                        <th className="p-3.5 text-right">ใบสั่งจ่ายน้ำมัน (บาท)</th>
                        <th className="p-3.5 text-center">ผู้อนุมัติ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {officeData.vehicleLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">{log.requestDate}</td>
                          <td className="p-3.5 whitespace-nowrap font-bold text-blue-600">{log.plate}</td>
                          <td className="p-3.5 max-w-xs">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{log.requester}</div>
                            <div className="text-[11px] text-slate-400">{log.destination}</div>
                          </td>
                          <td className="p-3.5 text-center font-mono whitespace-nowrap">
                            {log.startKm.toLocaleString()} - {log.endKm.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                            {log.totalKm}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{log.fuelCost.toLocaleString()} ฿</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.fuelVoucherNo} ({log.fuelLiters} ลิตร)</div>
                          </td>
                          <td className="p-3.5 text-center text-slate-500 whitespace-nowrap">{log.approvedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Projects */}
          {subTab === 'projects' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    แผนพัฒนาท้องถิ่นและโครงการตามข้อบัญญัติของสำนักปลัด
                  </h3>
                  <p className="text-xs text-slate-500">
                    ติดตามการขับเคลื่อนโครงการตามยุทธศาสตร์ขององค์กรปกครองส่วนท้องถิ่น
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {officeData.developmentProjects.map((proj) => (
                  <div key={proj.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded">
                      {proj.code}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                      {proj.projectName}
                    </h4>
                    <div className="flex justify-between items-center text-slate-500 pt-1">
                      <span>งบประมาณ:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {proj.budget.toLocaleString()} ฿
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>ความคืบหน้า</span>
                        <span className="font-bold">{proj.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400">ผู้รับผิดชอบ: {proj.responsiblePerson}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Saraban */}
          {subTab === 'saraban' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ระบบสารบรรณอิเล็กทรอนิกส์ (E-Document Register)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ทะเบียนรับ-ส่งหนังสือราชการ คำสั่งการ และระเบียบปฏิบัติ
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5">ประเภท</th>
                      <th className="p-3.5">เลขที่หนังสือ</th>
                      <th className="p-3.5">ลงวันที่</th>
                      <th className="p-3.5">จาก / ถึง</th>
                      <th className="p-3.5">เรื่อง</th>
                      <th className="p-3.5">ผู้รับปฏิบัติ</th>
                      <th className="p-3.5 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {officeData.sarabanBooks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.type === 'inward' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {b.type === 'inward' ? 'หนังสือรับ' : 'หนังสือส่ง'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{b.bookNo}</td>
                        <td className="p-3.5 whitespace-nowrap">{b.bookDate}</td>
                        <td className="p-3.5 font-medium whitespace-nowrap">{b.from || b.to}</td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100 max-w-sm">{b.subject}</td>
                        <td className="p-3.5 whitespace-nowrap">{b.assignedTo}</td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {b.status === 'completed' ? 'ดำเนินการแล้ว' : 'อยู่ระหว่างเสนอ'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab: Complaints */}
          {subTab === 'complaints' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ศูนย์รับเรื่องร้องเรียนร้องทุกข์ & งานนิติการ
                  </h3>
                  <p className="text-xs text-slate-500">
                    บันทึกเรื่องร้องทุกข์และติดตามการตรวจสอบข้อเท็จจริง
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {officeData.complaints.map((c) => (
                  <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.issue}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status === 'resolved' ? 'ยุติเรื่องแล้ว' : 'อยู่ระหว่างตรวจสอบ'}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      ผู้ร้อง: {c.complainant} • ช่องทาง: {c.channel} • วันที่รับ: {c.receivedDate}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">ผลการดำเนินการ: </span>
                      <p className="text-slate-600 dark:text-slate-400">{c.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: CAPA Response for สำนักปลัด */}
          {subTab === 'capa' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ข้อทักท้วงและข้อสังเกตที่ต้องปรับปรุงแก้ไข (สำนักปลัด)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ติดตามการแก้ไขและจัดทำรายงานผลตอบข้อทักท้วงภายในกรอบเวลา 60 วัน
                  </p>
                </div>
              </div>

              {deptCapaFindings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 text-slate-500">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="text-sm font-bold">ไม่พบข้อทักท้วงค้างการแก้ไขของสำนักปลัด</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {deptCapaFindings.map((f) => (
                    <div key={f.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{f.title}</span>
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">{f.id}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{f.condition}</p>
                      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                        <span className="font-bold text-blue-950 dark:text-blue-200">การแก้ไข (CA): </span>
                        <span>{f.correctiveAction || 'อยู่ระหว่างจัดทำรายงานแก้ไข'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SubTab: Health & Environment (งานสาธารณสุขและสิ่งแวดล้อม ภายใต้สำนักปลัด) */}
          {subTab === 'health' && (
            <div className="space-y-6">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ถังขยะลงทะเบียน (6 หมู่บ้าน)</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{publicHealthData?.summary?.wasteBinsRegistered || 0} ถัง</div>
                  <div className="text-[11px] text-blue-600 font-bold">จัดเก็บสัปดาห์ละ 2 ครั้ง</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ประมาณการค่าธรรมเนียมขยะ/เดือน</div>
                  <div className="text-2xl font-black text-emerald-600">{(publicHealthData?.summary?.monthlyWasteFeeEstimate || 0)?.toLocaleString()} ฿</div>
                  <div className="text-[11px] text-slate-500">อัตรา 40 บาท/ถัง/เดือน</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">การพ่นหมอกควันไข้เลือดออก</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{publicHealthData?.summary?.foggingCampaignsCompleted || 0} ครั้ง</div>
                  <div className="text-[11px] text-rose-600 font-bold">ครอบคลุม ศพด. และชุมชน</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">วัคซีนป้องกันพิษสุนัขบ้า</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{publicHealthData?.summary?.rabiesVaccinatedAnimals || 0} ตัว</div>
                  <div className="text-[11px] text-emerald-600 font-bold">ร้อยละ 93 ของประชากรสัตว์</div>
                </div>
              </div>

              {/* Waste Fees & Villages Summary Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      ข้อมูลการจัดเก็บขยะมูลฝอยและค่าธรรมเนียมรายหมู่บ้าน (พ.ร.บ. สาธารณสุข 2535)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      ส่วนหนึ่งของงานสาธารณสุขและสิ่งแวดล้อม ภายใต้การกำกับดูแลของสำนักปลัด
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">ในเขตพื้นที่รับผิดชอบ</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="py-3 px-3">หมู่บ้าน</th>
                        <th className="py-3 px-3 text-center">ครัวเรือน</th>
                        <th className="py-3 px-3 text-center">จำนวนถังขยะ</th>
                        <th className="py-3 px-3 text-right">ค่าธรรมเนียม/เดือน</th>
                        <th className="py-3 px-3">ความถี่การจัดเก็บ</th>
                        <th className="py-3 px-3 text-center">อัตราการชำระเงิน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(publicHealthData?.wasteManagement || []).length > 0 ? (
                        publicHealthData.wasteManagement.map((w, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{w.village}</td>
                            <td className="py-3 px-3 text-center">{w.households} ครัวเรือน</td>
                            <td className="py-3 px-3 text-center font-bold text-blue-600">{w.binsCount} ถัง</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{w.monthlyTotal?.toLocaleString()} ฿</td>
                            <td className="py-3 px-3 text-slate-500">{w.collectionFrequency}</td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-600">{w.paymentComplianceRate}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">ยังไม่มีข้อมูลการจัดเก็บขยะ</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">ถังขยะทั้งหมด:</span>
                    <strong className="text-lg text-slate-900 dark:text-slate-100">{publicHealthData?.summary?.wasteBinsRegistered || 0} ถัง</strong>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">จัดเก็บได้เฉลี่ย:</span>
                    <strong className="text-lg text-emerald-600">90.2%</strong>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">รถขยะปฏิบัติการ:</span>
                    <strong className="text-lg text-blue-600">1 คัน (อัดท้าย 6 ล้อ)</strong>
                  </div>
                </div>
              </div>

              {/* Disease Control Projects */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  บันทึกโครงการควบคุมและป้องกันโรคติดต่อในพื้นที่
                </h3>
                {(publicHealthData?.diseaseControl || []).length > 0 ? (
                  <div className="space-y-3">
                    {publicHealthData.diseaseControl.map((d) => (
                      <div key={d.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{d.campaignName}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ ดำเนินการแล้วเสร็จ
                          </span>
                        </div>
                        <div className="text-slate-500">กลุ่มเป้าหมาย: <strong>{d.target}</strong> ({d.achievedCount} / {d.targetCount})</div>
                        <div className="text-slate-500">ช่วงเวลาดำเนินการ: <strong>{d.campaignPeriod}</strong></div>
                        {d.vaccineBatch && <div className="text-blue-600 font-mono">Lot วัคซีน: {d.vaccineBatch}</div>}
                        {d.chemicalType && <div className="text-amber-600 font-medium">สารเคมี: {d.chemicalType}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                    ยังไม่มีบันทึกโครงการควบคุมและป้องกันโรคติดต่อในระบบ
                  </div>
                )}
              </div>

              {/* Food Sanitation */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  บันทึกการตรวจสุขาภิบาลอาหารและตลาดนัดชุมชน
                </h3>
                {(publicHealthData?.foodSanitation || []).length > 0 ? (
                  <div className="space-y-3">
                    {publicHealthData.foodSanitation.map((s) => (
                      <div key={s.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{s.placeName}</h4>
                            <div className="text-slate-500">{s.location}</div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ผ่านเกณฑ์ {s.passedStalls} / {s.stallsCount} แผง
                          </span>
                        </div>
                        <div className="text-slate-600 pt-1 border-t border-slate-100 dark:border-slate-800">
                          มาตรฐานที่ประเมิน: <strong>{s.sanitationStandard}</strong> • วันที่ตรวจ: {s.inspectionDate}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                    ยังไม่มีบันทึกการตรวจสุขาภิบาลอาหารและตลาดนัดในระบบ
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          WORKSPACE CONTENT: 2. กองคลัง
      ========================================================================= */}
      {activeDept === 'กองคลัง' && (
        <div className="space-y-6">
          {/* SubTab: Overview */}
          {subTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">สัญญาจัดซื้อจัดจ้าง</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{financeData.contracts.length} สัญญา</div>
                  <div className="text-[11px] text-blue-600 font-bold">มูลค่ารวม {financeData.contracts.reduce((a,c)=>a+c.contractPrice,0).toLocaleString()} ฿</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ลูกหนี้เงินยืมทดรองราชการ</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{financeData.loans.length} ราย</div>
                  <div className="text-[11px] text-rose-600 font-bold">ค้างเกิน 30 วัน {financeData.loans.filter(l=>l.status==='overdue').length} ราย</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ตรวจสอบพัสดุ ว 184</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{financeData.inventoryCheck.length} รายการ</div>
                  <div className="text-[11px] text-emerald-600 font-bold">ตรวจนับแล้วเสร็จ 100%</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ข้อทักท้วง สตง. ของกองคลัง</div>
                  <div className="text-2xl font-black text-amber-600">{deptCapaFindings.length} ประเด็น</div>
                  <div className="text-[11px] text-slate-400">อยู่ระหว่างส่งหลักฐาน</div>
                </div>
              </div>

              {/* Action Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50/70 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-900 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                    <Calculator className="w-4 h-4 text-amber-600" />
                    <span>เครื่องมือคำนวณค่าปรับจัดซื้อจัดจ้างส่งมอบงานล่าช้า</span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    คำนวณอัตโนมัติตาม พ.ร.บ. จัดซื้อจัดจ้างฯ 2560 ม. 175 และระเบียบฯ ข้อ 175-182 เพื่อความถูกต้องก่อนหักเงินจ่ายฎีกา
                  </p>
                  <button
                    onClick={() => setSubTab('penalty')}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>เปิดเครื่องคิดค่าปรับ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-blue-50/70 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>ระบบเตือนลูกหนี้เงินยืมทดรองราชการ (30 วัน)</span>
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    แจ้งเตือนและทวงถามสัญญายืมเงินเพื่อป้องกันไม่ให้ค้างส่งใช้เกิน 30 วันตามระเบียบ มท. รับจ่ายเงินฯ 2566
                  </p>
                  <button
                    onClick={() => setSubTab('loans')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>ตรวจสมุดคุมลูกหนี้</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Procurement Contracts */}
          {subTab === 'contracts' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ทะเบียนคุมสัญญาและการจัดซื้อจัดจ้าง (พ.ร.บ. พัสดุฯ 2560)
                  </h3>
                  <p className="text-xs text-slate-500">
                    บันทึกข้อมูลสัญญา วงเงิน วันครบกำหนดส่งมอบ และหลักประกันสัญญา
                  </p>
                </div>
                <button
                  onClick={() => setShowAddContractModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกสัญญาใหม่</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5">เลขที่สัญญา</th>
                      <th className="p-3.5">ชื่อโครงการ / รายการพัสดุ</th>
                      <th className="p-3.5">วิธีจัดซื้อจัดจ้าง</th>
                      <th className="p-3.5">คู่สัญญา / ผู้รับจ้าง</th>
                      <th className="p-3.5 text-right">วงเงินสัญญา (บาท)</th>
                      <th className="p-3.5">วันสิ้นสุดสัญญา</th>
                      <th className="p-3.5">หลักประกันสัญญา</th>
                      <th className="p-3.5 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {financeData.contracts.map((cn) => (
                      <tr key={cn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{cn.contractNo}</td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100 max-w-xs">{cn.title}</td>
                        <td className="p-3.5 text-[11px] text-slate-500 whitespace-nowrap">{cn.method}</td>
                        <td className="p-3.5 whitespace-nowrap">{cn.contractor}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {cn.contractPrice.toLocaleString()} ฿
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-medium">{cn.dueDate}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div>{cn.guaranteeType}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{cn.guaranteeAmount?.toLocaleString()} ฿</div>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cn.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {cn.status === 'completed' ? 'ส่งมอบแล้ว' : 'อยู่ระหว่างสัญญา'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab: Penalty Calculator (เครื่องมือคิดค่าปรับ) */}
          {subTab === 'penalty' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs mb-1">
                    <Calculator className="w-4 h-4" />
                    <span>พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ม. 175</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    เครื่องมือคำนวณค่าปรับการส่งมอบพัสดุ/งานจ้างล่าช้า
                  </h3>
                  <p className="text-xs text-slate-500">
                    คำนวณค่าปรับรายวันและยอดค่าปรับรวมที่ต้องหักออกจากฎีกาเบิกจ่ายเงินงวดสุดท้าย
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="no-print bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer self-start"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ใบคิดค่าปรับ</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">วงเงินตามสัญญาจ้าง (บาท)</label>
                    <input
                      type="number"
                      value={penaltyContractPrice}
                      onChange={(e) => setPenaltyContractPrice(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">อัตราค่าปรับต่อวัน</label>
                    <select
                      value={penaltyRate}
                      onChange={(e) => setPenaltyRate(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none cursor-pointer"
                    >
                      <option value="0.001">ร้อยละ 0.1 ต่อวัน (ซื้อ/จ้างทั่วไป ไม่กระทบจราจร)</option>
                      <option value="0.002">ร้อยละ 0.2 ต่อวัน (ซื้อ/จ้างทั่วไป ที่ต้องการความเร่งด่วน)</option>
                      <option value="0.0001">ร้อยละ 0.01 ต่อวัน (งานจ้างก่อสร้างสาธารณูปโภคขั้นต่ำ)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">วันครบกำหนดตามสัญญา</label>
                      <input
                        type="date"
                        value={penaltyDueDate}
                        onChange={(e) => setPenaltyDueDate(e.target.value)}
                        className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">วันส่งมอบงานจริง</label>
                      <input
                        type="date"
                        value={penaltyDeliveryDate}
                        onChange={(e) => setPenaltyDeliveryDate(e.target.value)}
                        className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold text-rose-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      วันหยุดราชการหรือมติ ครม. ที่ได้รับยกเว้น (วัน)
                    </label>
                    <input
                      type="number"
                      value={penaltyDeductHolidays}
                      onChange={(e) => setPenaltyDeductHolidays(e.target.value)}
                      placeholder="0"
                      className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>

                {/* Calculation Result */}
                <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl p-6 border border-amber-200 dark:border-amber-900 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      สรุปผลการคิดค่าปรับตามระเบียบ
                    </div>
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-amber-200/60 dark:border-amber-900">
                        <span className="text-slate-600 dark:text-slate-400">จำนวนวันที่ส่งมอบล่าช้า:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{penaltyCalculation.days} วัน</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-amber-200/60 dark:border-amber-900">
                        <span className="text-slate-600 dark:text-slate-400">อัตราค่าปรับต่อวัน:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {penaltyCalculation.dailyPenalty.toLocaleString()} บาท/วัน
                        </span>
                      </div>
                      <div className="flex justify-between py-2 items-baseline">
                        <span className="font-bold text-amber-950 dark:text-amber-200 text-sm">ยอดเงินค่าปรับรวมทั้งสิ้น:</span>
                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                          {penaltyCalculation.totalPenalty.toLocaleString()} ฿
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="font-bold text-slate-800 dark:text-slate-200">ข้อควรระวังสำหรับผู้ตรวจ: </span>
                    กรณีสัญญาจ้างก่อสร้างหากมีค่าปรับเกินร้อยละ 10 ของวงเงินสัญญา อปท. ต้องพิจารณาบอกเลิกสัญญา เว้นแต่ผู้รับจ้างยินยอมเสียค่าปรับโดยไม่มีเงื่อนไข
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Loans 30-Day Tracker */}
          {subTab === 'loans' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ทะเบียนคุมลูกหนี้เงินยืมทดรองราชการ (30-Day Advance Loans)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ติดตามการส่งใช้ใบสำคัญและคืนเงินเหลือจ่ายภายใน 30 วันตามระเบียบ มท. รับจ่ายเงินฯ 2566
                  </p>
                </div>
                <button
                  onClick={() => setShowAddLoanModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกสัญญายืมเงิน</span>
                </button>
              </div>

              <div className="space-y-3">
                {financeData.loans.map((loan) => (
                  <div key={loan.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{loan.contractNo}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{loan.borrower}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        loan.status === 'cleared'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}>
                        {loan.status === 'cleared' ? 'ส่งใช้ครบถ้วนแล้ว' : 'ค้างส่งใช้เกิน 30 วัน'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{loan.purpose}</p>
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                      <span>ยืมเมื่อ: {loan.borrowDate} • ครบ 30 วัน: <strong className="text-slate-800 dark:text-slate-200">{loan.dueDate}</strong></span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        วงเงินยืม: {loan.amount.toLocaleString()} ฿
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Annual Inventory Audit (ว 184) */}
          {subTab === 'inventory' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    การตรวจสอบพัสดุประจำปี (หนังสือสั่งการ ว 184)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตรวจนับครุภัณฑ์คงเหลือ ตรวจสอบสภาพการใช้งาน และรายงานผลจำหน่ายพัสดุชำรุด
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {financeData.inventoryCheck.map((inv) => (
                  <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {inv.assetCode}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.condition === 'good' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.condition === 'good' ? 'สภาพดี' : 'เสื่อมสภาพ'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{inv.assetName}</h4>
                    <div className="text-[11px] text-slate-500">ราคาทุน: {inv.costPrice.toLocaleString()} ฿</div>
                    <p className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                      ความเห็นกรรมการ: {inv.committeeOpinion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: CAPA Response for กองคลัง */}
          {subTab === 'capa' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ข้อทักท้วงและข้อสังเกตของกองคลัง (CAPA Response)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ประเด็นจาก สตง. และผู้ตรวจสอบภายในที่กองคลังต้องรายงานผลการแก้ไข
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {deptCapaFindings.map((f) => (
                  <div key={f.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{f.title}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">{f.id}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{f.condition}</p>
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                      <span className="font-bold text-blue-950 dark:text-blue-200">การแก้ไข (CA): </span>
                      <span>{f.correctiveAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          WORKSPACE CONTENT: 3. กองช่าง
      ========================================================================= */}
      {activeDept === 'กองช่าง' && (
        <div className="space-y-6">
          {/* SubTab: Overview */}
          {subTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">โครงการก่อสร้างตามข้อบัญญัติ</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{techData.constructionProjects.length} โครงการ</div>
                  <div className="text-[11px] text-blue-600 font-bold">งบประมาณ {techData.constructionProjects.reduce((a,c)=>a+c.budget,0).toLocaleString()} ฿</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">คำขออนุญาตก่อสร้าง 45 วัน</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{techData.buildingPermits.length} รายการ</div>
                  <div className="text-[11px] text-emerald-600 font-bold">ออกใบอนุญาต (อ.1) แล้ว</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">เครื่องจักรกล & ยานพาหนะ</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{techData.machinery.length} คัน</div>
                  <div className="text-[11px] text-purple-600 font-bold">พร้อมปฏิบัติการภาคสนาม</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ข้อทักท้วง สตง. ของกองช่าง</div>
                  <div className="text-2xl font-black text-rose-600">{deptCapaFindings.length} ประเด็น</div>
                  <div className="text-[11px] text-slate-400">ค่าปรับ / คุมงาน</div>
                </div>
              </div>

              {/* Action Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/70 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span>คำนวณราคากลางงานก่อสร้าง & Factor F</span>
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    คำนวณตาราง Factor F ตามหลักเกณฑ์กรมบัญชีกลาง เพื่อจัดทำแบบ ปร.4, ปร.5 และตารางเปิดเผยราคากลาง บก.01
                  </p>
                  <button
                    onClick={() => setSubTab('estimator')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>เปิดระบบคำนวณราคากลาง</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                    <HardHat className="w-4 h-4 text-emerald-600" />
                    <span>ทะเบียนคุมโครงการก่อสร้าง & ผล Cylinder Test</span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    บันทึกผู้ควบคุมงาน คณะกรรมการตรวจรับ และผลการทดสอบแรงอัดคอนกรีต 28 วัน
                  </p>
                  <button
                    onClick={() => setSubTab('projects')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>ดูทะเบียนคุมงานก่อสร้าง</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Factor F Estimator */}
          {subTab === 'estimator' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs mb-1">
                    <Calculator className="w-4 h-4" />
                    <span>หลักเกณฑ์การคำนวณราคากลางงานก่อสร้างของราชการ (กรมบัญชีกลาง)</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    เครื่องมือคำนวณราคากลาง Factor F & แบบ ปร.5
                  </h3>
                  <p className="text-xs text-slate-500">
                    คำนวณตัวคูณ Factor F จากค่างานต้นทุน ดอกเบี้ย และภาษีมูลค่าเพิ่ม 7%
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="no-print bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer self-start"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์แบบ ปร.5</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">ประเภทงานก่อสร้าง</label>
                    <select
                      value={factorFWorkType}
                      onChange={(e) => setFactorFWorkType(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none cursor-pointer"
                    >
                      <option value="road">งานทาง (ถนน ค.ส.ล. / ถนนลาดยาง / ลูกรัง)</option>
                      <option value="building">งานอาคาร (อาคารสำนักงาน / โรงเรียน / ศพด.)</option>
                      <option value="bridge">งานสะพานและท่อเหลี่ยม</option>
                      <option value="irrigation">งานชลประทาน (คูคลอง / ฝายน้ำล้น)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">ค่างานต้นทุนรวม (Direct Cost - บาท)</label>
                    <input
                      type="number"
                      value={factorFDirectCost}
                      onChange={(e) => setFactorFDirectCost(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-sm outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">เงินล่วงหน้าจ่าย</label>
                      <select
                        value={factorFAdvance}
                        onChange={(e) => setFactorFAdvance(e.target.value)}
                        className="w-full mt-1.5 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="15">15%</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">เงินประกันหัก</label>
                      <select
                        value={factorFRetention}
                        onChange={(e) => setFactorFRetention(e.target.value)}
                        className="w-full mt-1.5 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">อัตราดอกเบี้ย</label>
                      <select
                        value={factorFInterest}
                        onChange={(e) => setFactorFInterest(e.target.value)}
                        className="w-full mt-1.5 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none"
                      >
                        <option value="5">5%</option>
                        <option value="6">6%</option>
                        <option value="7">7%</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Result Card */}
                <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-900 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      ผลการคำนวณราคากลางตามแบบ ปร.5
                    </div>
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-blue-200/60 dark:border-blue-900">
                        <span className="text-slate-600 dark:text-slate-400">ค่างานต้นทุน:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {Number(factorFDirectCost || 0).toLocaleString()} บาท
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-blue-200/60 dark:border-blue-900">
                        <span className="text-slate-600 dark:text-slate-400">ค่า Factor F ที่คำนวณได้:</span>
                        <span className="font-mono font-black text-blue-700 dark:text-blue-300 text-base">
                          {factorFCalculation.factorF.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 items-baseline">
                        <span className="font-bold text-blue-950 dark:text-blue-200 text-sm">ราคากลางรวม (บาท):</span>
                        <span className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
                          {factorFCalculation.estimatedPrice.toLocaleString()} ฿
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200">เกณฑ์การเปิดเผยราคากลาง: </span>
                    โครงการที่มีวงเงินเกิน 500,000 บาท ต้องจัดทำตารางเปิดเผยราคากลาง (แบบ บก.01) ประกาศบนเว็บไซต์ อปท. และระบบ e-GP
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Construction Projects Logbook */}
          {subTab === 'projects' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ทะเบียนคุมโครงการก่อสร้างตามข้อบัญญัติ (Construction Project Logbook)
                  </h3>
                  <p className="text-xs text-slate-500">
                    บันทึกข้อมูลงานช่าง การคุมงาน และการตรวจรับพัสดุ
                  </p>
                </div>
                <button
                  onClick={() => setShowAddConstProjectModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกโครงการก่อสร้างใหม่</span>
                </button>
              </div>

              <div className="space-y-3">
                {techData.constructionProjects.map((p) => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.projectName}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] self-start sm:self-center ${
                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {p.status === 'completed' ? 'ก่อสร้างแล้วเสร็จ 100%' : `กำลังก่อสร้าง (${p.progress}%)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-500 text-[11px] pt-1">
                      <div>สถานที่: <strong className="text-slate-700 dark:text-slate-300">{p.location}</strong></div>
                      <div>ผู้รับจ้าง: <strong className="text-slate-700 dark:text-slate-300">{p.contractor}</strong></div>
                      <div>วงเงินสัญญา: <strong className="font-mono text-slate-900 dark:text-slate-100 text-xs">{p.contractPrice.toLocaleString()} ฿</strong></div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>นายช่างผู้ควบคุมงาน: <span className="font-bold text-slate-800 dark:text-slate-200">{p.engineerSupervisor}</span></div>
                      <div>ผลทดสอบคอนกรีต 28 วัน: <span className="font-bold text-blue-600">{p.cylinderTest28Days}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Building Permits */}
          {subTab === 'permits' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ทะเบียนคุมการขออนุญาตก่อสร้าง ดัดแปลง รื้อถอนอาคาร (พ.ร.บ. ควบคุมอาคาร 2522)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตรวจแบบแปลนและพิจารณาออกใบอนุญาต (แบบ อ.1) ภายในกรอบเวลา 45 วัน
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPermitModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกคำขออนุญาต</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {techData.buildingPermits.map((pm) => (
                  <div key={pm.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{pm.requestNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pm.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {pm.status === 'approved' ? 'ออกใบอนุญาตแล้ว' : 'อยู่ระหว่างตรวจแบบ'}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{pm.applicant}</div>
                    <div className="text-slate-500 text-[11px]">{pm.buildingType} (พื้นที่ {pm.areaSqM} ตร.ม.)</div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px]">
                      <span>ยื่นคำขอ: {pm.submissionDate}</span>
                      <span>ครบ 45 วัน: <strong>{pm.deadline45Days}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Machinery */}
          {subTab === 'machinery' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ทะเบียนคุมเครื่องจักรกลและยานพาหนะกองช่าง
                  </h3>
                  <p className="text-xs text-slate-500">
                    ติดตามชั่วโมงการทำงานและการบำรุงรักษาเครื่องจักรกลงานก่อสร้าง
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {techData.machinery.map((m) => (
                  <div key={m.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{m.code}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">พร้อมใช้งาน</span>
                    </div>
                    <div className="text-slate-500">ทะเบียน: {m.plate} • คนขับ: {m.driver}</div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px]">
                      <span>ชั่วโมงสะสม: <strong>{m.operatingHours.toLocaleString()} ชม.</strong></span>
                      <span>ซ่อมบำรุงล่าสุด: {m.lastMaintenance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: CAPA Response for กองช่าง */}
          {subTab === 'capa' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ข้อทักท้วงและข้อสังเกตของกองช่าง (CAPA Response)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ติดตามการแก้ไขงานก่อสร้าง การคิดค่าปรับ และเอกสารหลักฐานส่งผู้ตรวจสอบภายใน
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {deptCapaFindings.map((f) => (
                  <div key={f.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{f.title}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">{f.id}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{f.condition}</p>
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                      <span className="font-bold text-blue-950 dark:text-blue-200">การแก้ไข (CA): </span>
                      <span>{f.correctiveAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          WORKSPACE CONTENT: 4. กองการศึกษา ศาสนาและวัฒนธรรม
      ========================================================================= */}
      {activeDept === 'กองการศึกษา' && (
        <div className="space-y-6">
          {/* SubTab: Overview */}
          {subTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ศูนย์พัฒนาเด็กเล็กในสังกัด</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{educationData.centers.length} แห่ง</div>
                  <div className="text-[11px] text-blue-600 font-bold">เด็กเล็กทั้งหมด {educationData.summary.totalStudents} คน</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">อัตราอาหารกลางวันตามเกณฑ์</div>
                  <div className="text-2xl font-black text-emerald-600">{educationData.summary.dailyLunchRatePerChild} ฿<span className="text-xs font-normal text-slate-500"> /คน/วัน</span></div>
                  <div className="text-[11px] text-slate-500">มติ ครม. & ระเบียบ มท. 2562</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">งบประมาณอาหารกลางวัน/เดือน</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{educationData.summary.monthlyLunchBudgetEstimate?.toLocaleString()} ฿</div>
                  <div className="text-[11px] text-emerald-600 font-bold">นมโรงเรียน {educationData.summary.milkCartonsDaily} กล่อง/วัน</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ครูและผู้ดูแลเด็ก ศพด.</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{educationData.cdcTeachers.length} คน</div>
                  <div className="text-[11px] text-purple-600 font-bold">มีใบอนุญาตประกอบวิชาชีพครบ</div>
                </div>
              </div>

              {/* Child Development Centers Detail Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {educationData.centers.map((c) => (
                  <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full">
                          {c.code}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{c.name}</h4>
                        <p className="text-xs text-slate-500">{c.location}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {c.studentsCount} คน
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[11px]">หัวหน้าศูนย์:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{c.headTeacher}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">ครูผู้ดูแลเด็ก:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{c.teachersCount} คน</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">อาหารกลางวัน:</span>
                        <strong className="text-emerald-600">{c.lunchBudgetDaily?.toLocaleString()} ฿/วัน</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">นมโรงเรียน:</span>
                        <strong className="text-blue-600">{c.milkBudgetDaily} กล่อง/วัน</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Lunch & Milk Calculator */}
          {subTab === 'lunch' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Apple className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      ระบบคำนวณและทะเบียนคุมเงินค่าอาหารกลางวันและนมโรงเรียน ศพด.
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                    เกณฑ์ 24 บาท/คน/วัน
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-xs">
                  <div>
                    <span className="text-slate-500 block">จำนวนเด็กทั้ง 2 ศูนย์:</span>
                    <strong className="text-base text-emerald-800 dark:text-emerald-300">102 คน</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">งบอาหารกลางวันต่อวัน:</span>
                    <strong className="text-base text-emerald-800 dark:text-emerald-300">2,448 บาท/วัน</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">งบอาหารกลางวัน 20 วันทำการ:</span>
                    <strong className="text-base text-emerald-800 dark:text-emerald-300">48,960 บาท/เดือน</strong>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-3">ศูนย์พัฒนาเด็กเล็ก</th>
                        <th className="py-3 px-3 text-center">จำนวนเด็ก</th>
                        <th className="py-3 px-3 text-right">งบรายวัน (24 บ.)</th>
                        <th className="py-3 px-3 text-right">งบรายเดือน (20 วัน)</th>
                        <th className="py-3 px-3 text-center">นมพาสเจอร์ไรส์/ยูเอชที</th>
                        <th className="py-3 px-3">คณะกรรมการตรวจรับ</th>
                        <th className="py-3 px-3 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {educationData.centers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                          <td className="py-3 px-3 text-center font-bold">{c.studentsCount} คน</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">{c.lunchBudgetDaily?.toLocaleString()} ฿</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{(c.lunchBudgetDaily * 20)?.toLocaleString()} ฿</td>
                          <td className="py-3 px-3 text-center font-mono">{c.milkBudgetDaily} กล่อง/วัน</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{c.headTeacher} และตัวแทนผู้ปกครอง</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ ตรวจรับครบถ้วน
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

          {/* SubTab: Educational Materials */}
          {subTab === 'materials' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  ทะเบียนคุมการจัดซื้อสื่อการเรียนการสอนและของเล่นเด็กปฐมวัย
                </h3>
                <span className="text-xs text-slate-500 font-bold">
                  รวม {educationData.educationalMaterials.length} โครงการ
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="py-3 px-3">รหัสรายการ</th>
                      <th className="py-3 px-3">ชื่อรายการจัดซื้อ</th>
                      <th className="py-3 px-3">เป้าหมาย / ศูนย์</th>
                      <th className="py-3 px-3 text-right">วงเงิน (บาท)</th>
                      <th className="py-3 px-3">วันที่ตรวจรับ</th>
                      <th className="py-3 px-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {educationData.educationalMaterials.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-blue-600">{m.id}</td>
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{m.title}</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{m.targetCenter}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{m.budget?.toLocaleString()} ฿</td>
                        <td className="py-3 px-3 text-slate-600">{m.verifiedDate}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ ตรวจรับลงบัญชีแล้ว
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab: Teachers */}
          {subTab === 'teachers' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  ทะเบียนครูผู้ดูแลเด็กและใบอนุญาตประกอบวิชาชีพทางการศึกษา
                </h3>
                <span className="text-xs text-slate-500">ตรวจสอบอายุใบอนุญาตและมาตรฐานวิชาชีพ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {educationData.cdcTeachers.map((t) => (
                  <div key={t.id} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t.name}</h4>
                        <div className="text-xs text-blue-600 font-semibold">{t.position}</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                        {t.id}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <div>สังกัด: <strong>{t.facility}</strong></div>
                      <div>ระดับชั้นที่ดูแล: <strong>{t.assignedClass}</strong></div>
                      <div>เลขที่ใบอนุญาต: <strong className="font-mono">{t.licenseNo}</strong></div>
                      <div>วันหมดอายุใบอนุญาต: <strong className="text-emerald-600">{t.licenseExpire}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: CAPA */}
          {subTab === 'capa' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                ประเด็นข้อตรวจพบและข้อทักท้วง (CAPA) กองการศึกษา
              </h3>
              {deptCapaFindings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <div>ไม่พบข้อทักท้วงคงค้างของกองการศึกษา การดำเนินงานเป็นไปตามระเบียบเรียบร้อย</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {deptCapaFindings.map((f) => (
                    <div key={f.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 text-xs space-y-2">
                      <div className="font-bold text-slate-900">{f.title}</div>
                      <div className="text-slate-600">การแก้ไข: {f.correctiveAction}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          WORKSPACE CONTENT: 5. กองสวัสดิการสังคม
      ========================================================================= */}
      {activeDept === 'กองสวัสดิการสังคม' && (
        <div className="space-y-6">
          {/* SubTab: Overview */}
          {subTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ผู้สูงอายุรับเบี้ยยังชีพ (4 ขั้น)</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{welfareData.summary.totalElderlyBeneficiaries} ราย</div>
                  <div className="text-[11px] text-blue-600 font-bold">ยอดเงิน 359,800 ฿/เดือน</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">คนพิการรับเบี้ยความพิการ</div>
                  <div className="text-2xl font-black text-indigo-600">{welfareData.summary.totalDisabilityBeneficiaries} ราย</div>
                  <div className="text-[11px] text-slate-500">ยอดเงิน 55,600 ฿/เดือน</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ยอดเบิกจ่ายเบี้ยยังชีพรวม/เดือน</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{welfareData.summary.monthlyDisbursementAmount?.toLocaleString()} ฿</div>
                  <div className="text-[11px] text-emerald-600 font-bold">e-Payment กรมบัญชีกลาง 100%</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">เงินสงเคราะห์ผู้ประสบภัย/ยากไร้</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{welfareData.emergencyRelief.length} ราย</div>
                  <div className="text-[11px] text-amber-600 font-bold">ระเบียบ มท. ช่วยเหลือประชาชน 2566</div>
                </div>
              </div>

              {/* 4-Tier Elderly Breakdown */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    ตารางสรุปการจ่ายเงินเบี้ยยังชีพผู้สูงอายุ 4 ขั้นบันได (ระเบียบ มท. 2566)
                  </h3>
                  <span className="text-xs text-slate-500">ตัดยอดผู้เสียชีวิต/ย้ายที่อยู่ประจำเดือน</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="py-3 px-3">ระดับช่วงอายุ</th>
                        <th className="py-3 px-3 text-center">จำนวนผู้มีสิทธิ</th>
                        <th className="py-3 px-3 text-right">ยอดเงินรายเดือน</th>
                        <th className="py-3 px-3 text-right">ประมาณการต่อปี</th>
                        <th className="py-3 px-3 text-center">ตัดยอดเสียชีวิตเดือนนี้</th>
                        <th className="py-3 px-3">ช่องทางการจ่ายเงิน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {welfareData.elderlyAllowances.map((el, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{el.tier}</td>
                          <td className="py-3 px-3 text-center font-bold text-blue-600">{el.recipientCount} ราย</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">{el.monthlyTotal?.toLocaleString()} ฿</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{el.annualEstimate?.toLocaleString()} ฿</td>
                          <td className="py-3 px-3 text-center">
                            {el.deceasedDeductionThisMonth > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                -{el.deceasedDeductionThisMonth} ราย (ตัดยอดแล้ว)
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px]">{el.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Elderly Allowances Detail */}
          {subTab === 'elderly' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  ทะเบียนคุมเบี้ยยังชีพผู้สูงอายุ (แบบ บย.01)
                </h3>
                <span className="text-xs text-slate-500 font-bold">ฐานข้อมูลผู้สูงอายุ {welfareData.summary.totalElderlyBeneficiaries} ราย</span>
              </div>
              <p className="text-xs text-slate-500">
                การจ่ายเงินเบี้ยยังชีพผู้สูงอายุ ดำเนินการผ่านระบบบูรณาการฐานข้อมูลสวัสดิการสังคม (e-Payment) ของกรมบัญชีกลาง เข้าบัญชีเงินฝากธนาคารของผู้มีสิทธิโดยตรงทุกวันที่ 10 ของเดือน
              </p>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs space-y-2">
                <div className="font-bold text-blue-900 dark:text-blue-200">เกณฑ์การจ่ายตามระเบียบ มท. 2566:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">อายุ 60-69 ปี: <strong>600 บาท</strong></div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">อายุ 70-79 ปี: <strong>700 บาท</strong></div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">อายุ 80-89 ปี: <strong>800 บาท</strong></div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">อายุ 90 ปีขึ้นไป: <strong>1,000 บาท</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Disability Allowances */}
          {subTab === 'disability' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                ทะเบียนคุมเบี้ยความพิการ กองสวัสดิการสังคม
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {welfareData.disabilityAllowances.map((d) => (
                  <div key={d.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs">
                    <span className="font-bold text-indigo-600 block">{d.category}</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{d.recipientCount} ราย</div>
                    <div className="text-slate-500">ยอดเบิกจ่ายรวม: <strong className="font-mono text-slate-900 dark:text-slate-100">{d.monthlyTotal?.toLocaleString()} ฿/เดือน</strong></div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ ตรวจสอบสิทธิกับ พม. เรียบร้อย
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Emergency Relief */}
          {subTab === 'relief' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                ทะเบียนคุมเงินสงเคราะห์ผู้ประสบภัยพิบัติและผู้ยากไร้
              </h3>
              <div className="space-y-3">
                {welfareData.emergencyRelief.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{r.id}</span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">{r.caseName}</h4>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 font-mono">{r.amount?.toLocaleString()} ฿</span>
                    </div>
                    <div className="text-slate-500">ผู้รับความช่วยเหลือ: <strong>{r.beneficiary}</strong> • วันที่จ่ายเงิน: {r.disbursedDate}</div>
                    <div className="text-[11px] text-blue-600 font-medium">ระเบียบอ้างอิง: {r.ruleReference}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: CAPA */}
          {subTab === 'capa' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                ประเด็นข้อตรวจพบและข้อทักท้วง (CAPA) กองสวัสดิการสังคม
              </h3>
              {deptCapaFindings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <div>ไม่พบข้อทักท้วงคงค้างของกองสวัสดิการสังคม การเบิกจ่ายถูกต้องตามระเบียบ</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {deptCapaFindings.map((f) => (
                    <div key={f.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 text-xs space-y-2">
                      <div className="font-bold text-slate-900">{f.title}</div>
                      <div className="text-slate-600">การแก้ไข: {f.correctiveAction}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          WORKSPACE CONTENT: 6. ศูนย์พัฒนาเด็กเล็ก (ศพด.วัดเจริญทัศน์ & ศพด.บ้านฝางเทิง)
      ========================================================================= */}
      {isCdc && (
        <div className="space-y-6">
          {/* SubTab: Overview */}
          {subTab === 'overview' && (
            <div className="space-y-6">
              {/* Center Info Banner */}
              <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-xs">
                    <Baby className="w-3.5 h-3.5 text-pink-300" />
                    <span>สังกัดกองการศึกษา ศาสนาและวัฒนธรรม {orgProfile?.name || 'อปท.'}</span>
                  </div>
                  <h2 className="text-2xl font-black">{currentCdcData.centerName}</h2>
                  <p className="text-xs text-purple-100 flex items-center gap-2">
                    <span>📍 ที่ตั้ง: {currentCdcData.village || orgProfile?.district || 'ในเขตพื้นที่รับผิดชอบ'}</span>
                    <span>•</span>
                    <span>มาตรฐานปฐมวัยแห่งชาติ: ได้คะแนน <strong>{currentCdcData.summary.nationalStandardScore || 90}</strong> / 100</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    className="bg-white hover:bg-purple-50 text-purple-900 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4 text-purple-700" />
                    <span>รับเด็กเล็กใหม่</span>
                  </button>
                  <button
                    onClick={() => setShowAddLunchModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Apple className="w-4 h-4" />
                    <span>บันทึกอาหาร/นม วันนี้</span>
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">เด็กเล็กในความดูแลทั้งหมด</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {currentCdcData.children.length || currentCdcData.summary.totalChildren} คน
                  </div>
                  <div className="text-[11px] text-pink-600 font-bold">
                    ชาย {currentCdcData.summary.boysCount || 0} คน • หญิง {currentCdcData.summary.girlsCount || 0} คน
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">อาหารกลางวันเด็กเล็ก</div>
                  <div className="text-2xl font-black text-emerald-600">
                    {currentCdcData.summary.lunchRatePerChild || 24} ฿<span className="text-xs font-normal text-slate-500"> /คน/วัน</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    เงินอุดหนุนรัฐบาลตามมติ ครม.
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">บันทึกอาหารกลางวัน & นม</div>
                  <div className="text-2xl font-black text-blue-600">
                    {currentCdcData.lunchDailyLogs.length} วัน
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold">
                    ตรวจรับสม่ำเสมอ 100%
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ครูและผู้ดูแลเด็ก</div>
                  <div className="text-2xl font-black text-purple-600">
                    {currentCdcData.teachers.length || currentCdcData.summary.teachersCount} ท่าน
                  </div>
                  <div className="text-[11px] text-purple-600 font-bold">
                    อัตราส่วน 1:{Math.round((currentCdcData.children.length || 20) / (currentCdcData.teachers.length || 1))} คน/ครู
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Check Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recent Lunch Check Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Apple className="w-4 h-4 text-emerald-500" />
                      <span>บันทึกตรวจรับอาหารกลางวันล่าสุด</span>
                    </h3>
                    <button
                      onClick={() => setSubTab('lunch')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      ดูทั้งหมด
                    </button>
                  </div>
                  {currentCdcData.lunchDailyLogs.length > 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-700 dark:text-slate-300">วันที่: {currentCdcData.lunchDailyLogs[0].date}</span>
                        <span className="text-emerald-600">เด็กมาเรียน: {currentCdcData.lunchDailyLogs[0].attendanceCount} คน</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        <strong>เมนู:</strong> {currentCdcData.lunchDailyLogs[0].menuDescription}
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                        <span>ผู้ตรวจชิม/ตรวจรับ: {currentCdcData.lunchDailyLogs[0].inspector}</span>
                        <span className="text-blue-600 font-bold">นม: {currentCdcData.lunchDailyLogs[0].milkQuantity} ถุง/กล่อง</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีบันทึกอาหารกลางวัน</p>
                  )}
                </div>

                {/* Health & DSPM Development Status Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-500" />
                      <span>สุขภาพ & พัฒนาการ 4 ด้าน (DSPM)</span>
                    </h3>
                    <button
                      onClick={() => setSubTab('health')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      ดูทั้งหมด
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-teal-950 dark:text-teal-200">
                      <span>การประเมินภาวะโภชนาการและพัฒนาการ</span>
                      <span className="bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 px-2 py-0.5 rounded text-[10px]">
                        ภาคเรียนที่ 1/2569
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      บันทึกตรวจสุขภาพและประเมินพัฒนาการแล้ว <strong>{currentCdcData.healthGrowthChecks.length}</strong> รายการ โดย รพ.สต. ในพื้นที่ ร่วมกับครูผู้ดูแลเด็ก
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-200/60 text-[11px]">
                      <div>✅ ภาวะโภชนาการ: <strong>สมส่วน 100%</strong></div>
                      <div>✅ พัฒนาการ 4 ด้าน: <strong>สมวัย</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Students */}
          {subTab === 'students' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Baby className="w-4 h-4 text-pink-500" />
                    <span>ทะเบียนเด็กเล็ก {currentCdcData.centerName}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    จำนวนเด็กเล็กทั้งหมด {currentCdcData.children.length} คน (ปีการศึกษา 2569)
                  </p>
                </div>
                <button
                  onClick={() => setShowAddChildModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มทะเบียนเด็กเล็ก</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="py-3 px-3">รหัส / บัตร ปชช.</th>
                        <th className="py-3 px-3">ชื่อ - สกุล (ชื่อเล่น)</th>
                        <th className="py-3 px-3 text-center">เพศ</th>
                        <th className="py-3 px-3 text-center">อายุ</th>
                        <th className="py-3 px-3 text-right">นน./สส.</th>
                        <th className="py-3 px-3 text-center">โภชนาการ</th>
                        <th className="py-3 px-3">ผู้ปกครอง / เบอร์ติดต่อ</th>
                        <th className="py-3 px-3 text-center">สถานะ</th>
                        <th className="py-3 px-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentCdcData.children.map((ch, idx) => (
                        <tr key={ch.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-3">
                            <span className="font-mono text-purple-700 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded text-[11px]">
                              {ch.id}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ch.idCard || '-'}</div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {ch.prefix} {ch.firstName} {ch.lastName}
                            {ch.nickname && <span className="text-pink-600 ml-1">({ch.nickname})</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ch.gender === 'ชาย' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                            }`}>
                              {ch.gender}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                            {ch.ageYears || 3} ขวบ {ch.ageMonths ? `${ch.ageMonths} ด.` : ''}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {ch.weight ? `${ch.weight} กก.` : '-'} / {ch.height ? `${ch.height} ซม.` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {ch.nutritionStatus || 'สมส่วน'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{ch.parentName || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{ch.phone || '-'}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              {ch.status || 'กำลังศึกษา'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                openConfirm({
                                  title: 'ยืนยันลบเด็กเล็ก',
                                  message: `คุณต้องการลบข้อมูลเด็กเล็ก "${ch.prefix} ${ch.firstName} ${ch.lastName}" ใช่หรือไม่?`,
                                  confirmText: 'ลบข้อมูล',
                                  type: 'danger',
                                  onConfirm: () => {
                                    const updated = currentCdcData.children.filter((c) => c.id !== ch.id);
                                    setCurrentCdcData({ ...currentCdcData, children: updated });
                                    showToast('ลบข้อมูลเด็กเล็กเรียบร้อยแล้ว');
                                  }
                                });
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="ลบข้อมูล"
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

          {/* SubTab: Lunch & Milk */}
          {subTab === 'lunch' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Apple className="w-4 h-4 text-emerald-500" />
                    <span>บันทึกตรวจรับอาหารกลางวัน & อาหารเสริมนม (รายวัน)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตามระเบียบกระทรวงมหาดไทยว่าด้วยรายจ่ายเพื่อการจัดบริการสาธารณะ และหนังสือสั่งการ มท.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddLunchModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกตรวจรับประจำวัน</span>
                </button>
              </div>

              {/* Calculator Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs space-y-1">
                  <div className="text-slate-500 font-bold">อัตราเงินอุดหนุนอาหารกลางวัน</div>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    24 บาท <span className="text-xs font-normal">/คน/วัน (มติ ครม.)</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
                  <div className="text-slate-500 font-bold">การตรวจรับนมโรงเรียน</div>
                  <div className="text-xl font-black text-blue-700 dark:text-blue-300">
                    1 กล่อง/ถุง <span className="text-xs font-normal">/คน/วัน (นมพาสเจอร์ไรส์/ยูเอชที)</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs space-y-1">
                  <div className="text-slate-500 font-bold">มาตรการป้องกันความเสี่ยง</div>
                  <div className="text-xs font-bold text-purple-800 dark:text-purple-300">
                    ตรวจชิมก่อนแจกจ่าย • สุ่มตรวจอุณหภูมิความเย็น • บันทึกหลักฐานรายวัน
                  </div>
                </div>
              </div>

              {/* Logs List */}
              <div className="space-y-3">
                {currentCdcData.lunchDailyLogs.map((log) => (
                  <div key={log.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                          {log.id}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          วันที่: {log.date}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          เด็กมาเรียน {log.attendanceCount} คน (ขาด {log.absentCount || 0} คน)
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          นม {log.milkQuantity} กล่อง
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        🍛 เมนูอาหารกลางวัน: <span className="font-normal text-slate-700 dark:text-slate-300">{log.menuDescription}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>🥛 ผลตรวจชิมนม: <strong>{log.milkTasteCheck || 'ปกติ'}</strong></div>
                        <div>🍲 คุณภาพอาหาร: <strong>{log.lunchQualityCheck || 'ถูกต้องตามหลักโภชนาการ'}</strong></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                      <span>ผู้ตรวจรับ/ผู้ตรวจชิม: <strong>{log.inspector}</strong></span>
                      <button
                        onClick={() => {
                          const updated = currentCdcData.lunchDailyLogs.filter((l) => l.id !== log.id);
                          setCurrentCdcData({ ...currentCdcData, lunchDailyLogs: updated });
                          showToast('ลบบันทึกอาหารกลางวันเรียบร้อยแล้ว');
                        }}
                        className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                      >
                        ลบรายการ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Health & DSPM Development */}
          {subTab === 'health' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-500" />
                    <span>ทะเบียนเฝ้าระวังสุขภาพ & ประเมินพัฒนาการเด็กปฐมวัย (DSPM 4 ด้าน)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตรวจร่างกาย ชั่งน้ำหนัก วัดส่วนสูง ตรวจสุขภาพฟัน และประเมินพัฒนาการร่วมกับ รพ.สต. ในพื้นที่
                  </p>
                </div>
                <button
                  onClick={() => setShowAddHealthModal(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกตรวจสุขภาพ/พัฒนาการ</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCdcData.healthGrowthChecks.map((hc) => (
                  <div key={hc.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded text-[11px]">{hc.id}</span>
                      <span className="text-slate-400 text-[11px]">{hc.checkDate} ({hc.term})</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{hc.childName}</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
                      <div>น้ำหนัก: <strong>{hc.weight} กก.</strong></div>
                      <div>ส่วนสูง: <strong>{hc.height} ซม.</strong></div>
                      <div>ภาวะโภชนาการ: <strong className="text-emerald-600">{hc.nutritionStatus}</strong></div>
                      <div>สุขภาพฟัน: <strong>{hc.dentalStatus}</strong></div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 text-[11px]">
                      <span className="font-bold text-teal-900 dark:text-teal-200">พัฒนาการ 4 ด้าน (DSPM): </span>
                      <span>{hc.dspmStatus}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>ผู้ตรวจ: {hc.examiner}</span>
                      <button
                        onClick={() => {
                          const updated = currentCdcData.healthGrowthChecks.filter((h) => h.id !== hc.id);
                          setCurrentCdcData({ ...currentCdcData, healthGrowthChecks: updated });
                          showToast('ลบบันทึกตรวจสุขภาพเรียบร้อยแล้ว');
                        }}
                        className="text-rose-500 hover:underline cursor-pointer"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Materials & Playground Safety */}
          {subTab === 'materials' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span>สื่อการเรียนรู้ & เช็กลิสต์ความปลอดภัยสนามเด็กเล่นสร้างปัญญา</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    ทะเบียนคุมสื่อการสอน ของเล่นเสริมพัฒนาการ และการตรวจสอบความปลอดภัยเครื่องเล่นสนาม
                  </p>
                </div>
                <button
                  onClick={() => setShowAddSafetyModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายการสื่อ/ความปลอดภัย</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCdcData.materialsAndSafety.map((mat) => (
                  <div key={mat.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded text-[10px]">
                        {mat.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">จำนวน {mat.quantity} รายการ</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">{mat.itemName}</div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
                      <strong>สภาพความปลอดภัย:</strong> {mat.condition}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                      <span>ตรวจล่าสุด: {mat.lastInspectedDate}</span>
                      <button
                        onClick={() => {
                          const updated = currentCdcData.materialsAndSafety.filter((m) => m.id !== mat.id);
                          setCurrentCdcData({ ...currentCdcData, materialsAndSafety: updated });
                          showToast('ลบรายการสื่อ/ความปลอดภัยเรียบร้อยแล้ว');
                        }}
                        className="text-rose-500 hover:underline cursor-pointer"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: Teachers */}
          {subTab === 'teachers' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>บุคลากรครูและผู้ดูแลเด็ก {currentCdcData.centerName}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  บุคลากรที่มีคุณสมบัติถูกต้องตามมาตรฐานสถานพัฒนาเด็กปฐมวัยแห่งชาติ
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentCdcData.teachers.map((tc) => (
                  <div key={tc.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded text-[10px]">{tc.id}</span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">{tc.name}</h4>
                        <div className="text-xs text-purple-700 font-semibold">{tc.position}</div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {tc.status || 'ปฏิบัติราชการ'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>วุฒิการศึกษา: <strong>{tc.qualification}</strong></div>
                      <div>ห้องเรียนที่ดูแล: <strong>{tc.assignedClass}</strong></div>
                      <div>เบอร์โทรศัพท์: <strong>{tc.phone}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab: CAPA for CDC */}
          {subTab === 'capa' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                ประเด็นข้อตรวจพบและข้อเสนอแนะผู้ตรวจสอบภายใน (CAPA) {currentCdcData.centerName}
              </h3>
              {deptCapaFindings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <div>ไม่พบข้อทักท้วงคงค้างของ {currentCdcData.centerName} การจัดบริการสาธารณะและอาหารกลางวันถูกต้องครบถ้วน</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {deptCapaFindings.map((f) => (
                    <div key={f.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 text-xs space-y-2">
                      <div className="font-bold text-slate-900">{f.title}</div>
                      <div className="text-slate-600">การแก้ไข (CA): {f.correctiveAction}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS: 1. ADD VEHICLE LOG (สำนักปลัด)
      ========================================================================= */}
      {showAddOfficeLogModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              บันทึกการขอใช้รถยนต์ส่วนกลาง
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const start = Number(newVehicleLog.startKm) || 0;
                const end = Number(newVehicleLog.endKm) || 0;
                const newLog = {
                  ...newVehicleLog,
                  id: `VLOG-${Date.now().toString().slice(-4)}`,
                  startKm: start,
                  endKm: end,
                  totalKm: Math.max(0, end - start),
                  fuelLiters: Number(newVehicleLog.fuelLiters) || 0,
                  fuelCost: Number(newVehicleLog.fuelCost) || 0,
                  approvedBy: 'หัวหน้าสำนักปลัด',
                  status: 'approved'
                };
                setOfficeData({
                  ...officeData,
                  vehicleLogs: [newLog, ...officeData.vehicleLogs]
                });
                setShowAddOfficeLogModal(false);
                showToast('บันทึกการใช้รถยนต์เรียบร้อยแล้ว');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ทะเบียนรถ</label>
                <select
                  value={newVehicleLog.plate}
                  onChange={(e) => setNewVehicleLog({ ...newVehicleLog, plate: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                >
                  {officeData.vehicles.map((v) => (
                    <option key={v.id} value={v.plate}>{v.plate} ({v.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ผู้ขอใช้รถ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น หัวหน้าฝ่ายบริหารงานทั่วไป"
                  value={newVehicleLog.requester}
                  onChange={(e) => setNewVehicleLog({ ...newVehicleLog, requester: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">วัตถุประสงค์และสถานที่ไป</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ที่ว่าการอำเภอสิรินธร ประชุมหัวหน้าส่วนราชการ"
                  value={newVehicleLog.destination}
                  onChange={(e) => setNewVehicleLog({ ...newVehicleLog, destination: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">เลขไมล์ก่อนออก</label>
                  <input
                    type="number"
                    required
                    value={newVehicleLog.startKm}
                    onChange={(e) => setNewVehicleLog({ ...newVehicleLog, startKm: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">เลขไมล์กลับ</label>
                  <input
                    type="number"
                    required
                    value={newVehicleLog.endKm}
                    onChange={(e) => setNewVehicleLog({ ...newVehicleLog, endKm: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ใบสั่งจ่ายน้ำมัน (เลขที่)</label>
                  <input
                    type="text"
                    placeholder="VOUCH-69-..."
                    value={newVehicleLog.fuelVoucherNo}
                    onChange={(e) => setNewVehicleLog({ ...newVehicleLog, fuelVoucherNo: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ค่าน้ำมัน (บาท)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newVehicleLog.fuelCost}
                    onChange={(e) => setNewVehicleLog({ ...newVehicleLog, fuelCost: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddOfficeLogModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALS: 2. ADD CONTRACT (กองคลัง) */}
      {showAddContractModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              บันทึกสัญญาจัดซื้อจัดจ้างใหม่
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newCn = {
                  ...newContract,
                  id: `CN-69-0${financeData.contracts.length + 1}`,
                  contractPrice: Number(newContract.contractPrice) || 0,
                  guaranteeAmount: Number(newContract.guaranteeAmount) || 0,
                  status: 'active'
                };
                setFinanceData({
                  ...financeData,
                  contracts: [newCn, ...financeData.contracts]
                });
                setShowAddContractModal(false);
                showToast('บันทึกสัญญาจัดซื้อจัดจ้างแล้ว');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">เลขที่สัญญา</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สัญญาเลขที่ 15/2569"
                  value={newContract.contractNo}
                  onChange={(e) => setNewContract({ ...newContract, contractNo: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อโครงการ / รายการพัสดุ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โครงการจัดซื้อกล้องวงจรปิด..."
                  value={newContract.title}
                  onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">วงเงินสัญญา (บาท)</label>
                  <input
                    type="number"
                    required
                    value={newContract.contractPrice}
                    onChange={(e) => setNewContract({ ...newContract, contractPrice: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">คู่สัญญา / ผู้รับจ้าง</label>
                  <input
                    type="text"
                    required
                    value={newContract.contractor}
                    onChange={(e) => setNewContract({ ...newContract, contractor: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">วันสิ้นสุดสัญญา</label>
                  <input
                    type="date"
                    required
                    value={newContract.dueDate}
                    onChange={(e) => setNewContract({ ...newContract, dueDate: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">หลักประกัน 5% (บาท)</label>
                  <input
                    type="number"
                    value={newContract.guaranteeAmount}
                    onChange={(e) => setNewContract({ ...newContract, guaranteeAmount: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddContractModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  บันทึกสัญญา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALS: 3. ADD CONSTRUCTION PROJECT (กองช่าง) */}
      {showAddConstProjectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              บันทึกโครงการก่อสร้างใหม่
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newP = {
                  ...newConstProject,
                  id: `PRJ-CONST-0${techData.constructionProjects.length + 1}`,
                  code: 'โครงการตามข้อบัญญัติ 2569',
                  budget: Number(newConstProject.budget) || 0,
                  contractPrice: Number(newConstProject.contractPrice) || 0,
                  cylinderTest28Days: '-',
                  progress: 0,
                  status: 'in_progress'
                };
                setTechData({
                  ...techData,
                  constructionProjects: [newP, ...techData.constructionProjects]
                });
                setShowAddConstProjectModal(false);
                showToast('บันทึกโครงการก่อสร้างเรียบร้อยแล้ว');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อโครงการก่อสร้าง</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โครงการก่อสร้างถนน ค.ส.ล. สาย..."
                  value={newConstProject.projectName}
                  onChange={(e) => setNewConstProject({ ...newConstProject, projectName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">สถานที่ก่อสร้าง</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น หมู่ที่ 3 หรือชื่อสายทาง/สถานที่"
                  value={newConstProject.location}
                  onChange={(e) => setNewConstProject({ ...newConstProject, location: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">งบประมาณ (บาท)</label>
                  <input
                    type="number"
                    required
                    value={newConstProject.budget}
                    onChange={(e) => setNewConstProject({ ...newConstProject, budget: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">วงเงินสัญญา (บาท)</label>
                  <input
                    type="number"
                    required
                    value={newConstProject.contractPrice}
                    onChange={(e) => setNewConstProject({ ...newConstProject, contractPrice: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ผู้รับจ้าง</label>
                <input
                  type="text"
                  required
                  value={newConstProject.contractor}
                  onChange={(e) => setNewConstProject({ ...newConstProject, contractor: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">นายช่างผู้ควบคุมงาน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายช่างโยธาปฏิบัติงาน"
                  value={newConstProject.engineerSupervisor}
                  onChange={(e) => setNewConstProject({ ...newConstProject, engineerSupervisor: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddConstProjectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  บันทึกโครงการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: 5. CDC ADD CHILD (ศพด.)
      ========================================================================= */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Baby className="w-4 h-4 text-pink-500" />
                <span>เพิ่มทะเบียนเด็กเล็กใหม่ ({currentCdcData.centerName})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddChildModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const prefixId = activeDept.includes('เจริญทัศน์') ? 'CDC-CJ' : 'CDC-FT';
                const count = currentCdcData.children.length + 1;
                const newId = `${prefixId}-${String(count).padStart(3, '0')}`;
                const childObj = {
                  ...newChild,
                  id: newId,
                  weight: Number(newChild.weight) || 0,
                  height: Number(newChild.height) || 0,
                  ageYears: Number(newChild.ageYears) || 3,
                  ageMonths: Number(newChild.ageMonths) || 0,
                  status: 'กำลังศึกษา'
                };
                const updated = [childObj, ...currentCdcData.children];
                setCurrentCdcData({
                  ...currentCdcData,
                  children: updated,
                  summary: {
                    ...currentCdcData.summary,
                    totalChildren: updated.length,
                    boysCount: updated.filter(c => c.gender === 'ชาย').length,
                    girlsCount: updated.filter(c => c.gender === 'หญิง').length
                  }
                });
                setShowAddChildModal(false);
                setNewChild({
                  prefix: 'ด.ช.',
                  firstName: '',
                  lastName: '',
                  nickname: '',
                  idCard: '',
                  birthDate: '',
                  gender: 'ชาย',
                  weight: '',
                  height: '',
                  nutritionStatus: 'สมส่วน',
                  dentalStatus: 'ฟันดีไม่มีผุ',
                  parentName: '',
                  phone: '',
                  status: 'กำลังศึกษา'
                });
                showToast(`บันทึกข้อมูล ${childObj.prefix} ${childObj.firstName} เข้าสู่ระบบแล้ว`);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">คำนำหน้า</label>
                  <select
                    value={newChild.prefix}
                    onChange={(e) => {
                      const p = e.target.value;
                      setNewChild({ ...newChild, prefix: p, gender: p === 'ด.ช.' ? 'ชาย' : 'หญิง' });
                    }}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="ด.ช.">ด.ช.</option>
                    <option value="ด.ญ.">ด.ญ.</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อจริง</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กิตติภูมิ"
                    value={newChild.firstName}
                    onChange={(e) => setNewChild({ ...newChild, firstName: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">นามสกุล</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมบูรณ์"
                    value={newChild.lastName}
                    onChange={(e) => setNewChild({ ...newChild, lastName: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อเล่น</label>
                  <input
                    type="text"
                    placeholder="เช่น น้องภูมิ"
                    value={newChild.nickname}
                    onChange={(e) => setNewChild({ ...newChild, nickname: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">เลขประจำตัวประชาชน (13 หลัก)</label>
                  <input
                    type="text"
                    placeholder="1-3401-xxxxx-xx-x"
                    value={newChild.idCard}
                    onChange={(e) => setNewChild({ ...newChild, idCard: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">วัน/เดือน/ปีเกิด</label>
                  <input
                    type="date"
                    value={newChild.birthDate}
                    onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">น้ำหนัก (กก.)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="14.5"
                    value={newChild.weight}
                    onChange={(e) => setNewChild({ ...newChild, weight: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ส่วนสูง (ซม.)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="96"
                    value={newChild.height}
                    onChange={(e) => setNewChild({ ...newChild, height: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ภาวะโภชนาการ</label>
                  <select
                    value={newChild.nutritionStatus}
                    onChange={(e) => setNewChild({ ...newChild, nutritionStatus: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="สมส่วน">สมส่วน</option>
                    <option value="ท้วม">ท้วม</option>
                    <option value="เริ่มอ้วน">เริ่มอ้วน</option>
                    <option value="อ้วน">อ้วน</option>
                    <option value="ค่อนข้างผอม">ค่อนข้างผอม</option>
                    <option value="ผอม">ผอม</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">สุขภาพช่องปาก/ฟัน</label>
                  <input
                    type="text"
                    placeholder="ฟันดีไม่มีผุ"
                    value={newChild.dentalStatus}
                    onChange={(e) => setNewChild({ ...newChild, dentalStatus: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อผู้ปกครอง</label>
                  <input
                    type="text"
                    placeholder="เช่น นายประสิทธิ์ สมบูรณ์"
                    value={newChild.parentName}
                    onChange={(e) => setNewChild({ ...newChild, parentName: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="tel"
                    placeholder="08x-xxx-xxxx"
                    value={newChild.phone}
                    onChange={(e) => setNewChild({ ...newChild, phone: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer transition-colors"
                >
                  บันทึกทะเบียนเด็ก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: 6. CDC ADD LUNCH/MILK LOG (ศพด.)
      ========================================================================= */}
      {showAddLunchModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Apple className="w-4 h-4 text-emerald-500" />
                <span>บันทึกตรวจรับอาหารกลางวัน & อาหารเสริมนม ({currentCdcData.centerName})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLunchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const prefixId = activeDept.includes('เจริญทัศน์') ? 'LUNCH-CJ' : 'LUNCH-FT';
                const count = currentCdcData.lunchDailyLogs.length + 1;
                const newId = `${prefixId}-2569-${String(count).padStart(3, '0')}`;
                const logObj = {
                  ...newLunchLog,
                  id: newId,
                  attendanceCount: Number(newLunchLog.attendanceCount) || currentCdcData.children.length,
                  absentCount: Number(newLunchLog.absentCount) || 0,
                  milkQuantity: Number(newLunchLog.milkQuantity) || Number(newLunchLog.attendanceCount) || currentCdcData.children.length
                };
                const updated = [logObj, ...currentCdcData.lunchDailyLogs];
                setCurrentCdcData({ ...currentCdcData, lunchDailyLogs: updated });
                setShowAddLunchModal(false);
                setNewLunchLog({
                  date: new Date().toISOString().slice(0, 10),
                  attendanceCount: '',
                  absentCount: '0',
                  menuDescription: '',
                  milkQuantity: '',
                  milkTasteCheck: 'ปกติ (รสจืด เย็นตามเกณฑ์)',
                  lunchQualityCheck: 'ถูกสุขลักษณะ รสชาติกลมกล่อม ครบ 5 หมู่',
                  inspector: '',
                  remarks: ''
                });
                showToast(`บันทึกตรวจรับอาหารกลางวัน & นม วันที่ ${logObj.date} เรียบร้อยแล้ว`);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">วันที่ตรวจรับ</label>
                  <input
                    type="date"
                    required
                    value={newLunchLog.date}
                    onChange={(e) => setNewLunchLog({ ...newLunchLog, date: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">เด็กมาเรียน (คน)</label>
                  <input
                    type="number"
                    required
                    placeholder={String(currentCdcData.children.length || 25)}
                    value={newLunchLog.attendanceCount}
                    onChange={(e) => setNewLunchLog({ ...newLunchLog, attendanceCount: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ขาดเรียน (คน)</label>
                  <input
                    type="number"
                    value={newLunchLog.absentCount}
                    onChange={(e) => setNewLunchLog({ ...newLunchLog, absentCount: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">รายการเมนูอาหารกลางวัน (ครบ 5 หมู่)</label>
                <textarea
                  rows="2"
                  required
                  placeholder="เช่น ข้าวสวย + ต้มจืดเต้าหู้หมูสับผักกาดขาว + ไก่ทอดเกลือ + กล้วยน้ำว้า"
                  value={newLunchLog.menuDescription}
                  onChange={(e) => setNewLunchLog({ ...newLunchLog, menuDescription: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ตรวจรับนมโรงเรียน (กล่อง/ถุง)</label>
                  <input
                    type="number"
                    placeholder="เช่น 26"
                    value={newLunchLog.milkQuantity}
                    onChange={(e) => setNewLunchLog({ ...newLunchLog, milkQuantity: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ผลการตรวจชิมนม</label>
                  <select
                    value={newLunchLog.milkTasteCheck}
                    onChange={(e) => setNewLunchLog({ ...newLunchLog, milkTasteCheck: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="ปกติ (รสจืด ไม่บูด เย็นตามเกณฑ์)">ปกติ (รสจืด ไม่บูด เย็นตามเกณฑ์)</option>
                    <option value="ปกติ (นมพาสเจอร์ไรส์ สดใหม่)">ปกติ (นมพาสเจอร์ไรส์ สดใหม่)</option>
                    <option value="ปกติ (นมยูเอชที บรรจุภัณฑ์สมบูรณ์)">ปกติ (นมยูเอชที บรรจุภัณฑ์สมบูรณ์)</option>
                    <option value="พบความผิดปกติ (แจ้งเปลี่ยนทันที)">พบความผิดปกติ (แจ้งเปลี่ยนทันที)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">คุณภาพอาหารกลางวัน</label>
                  <input
                    type="text"
                    value={newLunchLog.lunchQualityCheck}
                    onChange={(e) => setNewLunchLog({ ...newLunchLog, lunchQualityCheck: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ครูผู้ตรวจรับ / ผู้ตรวจชิม</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ครูผู้ดูแลเด็ก / ผู้ช่วยครู"
                    value={newLunchLog.inspector}
                    onChange={(e) => setNewLunchLog({ ...newLunchLog, inspector: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLunchModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors"
                >
                  บันทึกการตรวจรับ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: 7. CDC ADD HEALTH CHECK (ศพด.)
      ========================================================================= */}
      {showAddHealthModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-500" />
                <span>บันทึกตรวจสุขภาพและประเมินพัฒนาการ DSPM</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddHealthModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const prefixId = activeDept.includes('เจริญทัศน์') ? 'HEALTH-CJ' : 'HEALTH-FT';
                const count = currentCdcData.healthGrowthChecks.length + 1;
                const newId = `${prefixId}-${String(count).padStart(3, '0')}`;
                const healthObj = {
                  ...newHealthCheck,
                  id: newId,
                  weight: Number(newHealthCheck.weight) || 0,
                  height: Number(newHealthCheck.height) || 0
                };
                const updated = [healthObj, ...currentCdcData.healthGrowthChecks];
                setCurrentCdcData({ ...currentCdcData, healthGrowthChecks: updated });
                setShowAddHealthModal(false);
                setNewHealthCheck({
                  checkDate: new Date().toISOString().slice(0, 10),
                  term: 'ภาคเรียนที่ 1/2569',
                  childName: '',
                  weight: '',
                  height: '',
                  nutritionStatus: 'สมส่วน',
                  dentalStatus: 'ฟันดี ไม่มีฟันน้ำนมผุ',
                  dspmStatus: 'สมวัยทุกด้าน (4 ด้านผ่านเกณฑ์)',
                  examiner: ''
                });
                showToast(`บันทึกผลตรวจสุขภาพของ ${healthObj.childName} เรียบร้อยแล้ว`);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">วันที่ตรวจ</label>
                  <input
                    type="date"
                    required
                    value={newHealthCheck.checkDate}
                    onChange={(e) => setNewHealthCheck({ ...newHealthCheck, checkDate: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ภาคเรียน</label>
                  <select
                    value={newHealthCheck.term}
                    onChange={(e) => setNewHealthCheck({ ...newHealthCheck, term: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="ภาคเรียนที่ 1/2569">ภาคเรียนที่ 1/2569</option>
                    <option value="ภาคเรียนที่ 2/2569">ภาคเรียนที่ 2/2569</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อเด็กเล็ก</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ด.ช. กิตติภูมิ สมบูรณ์"
                  value={newHealthCheck.childName}
                  onChange={(e) => setNewHealthCheck({ ...newHealthCheck, childName: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">น้ำหนัก (กก.)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="14.5"
                    value={newHealthCheck.weight}
                    onChange={(e) => setNewHealthCheck({ ...newHealthCheck, weight: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ส่วนสูง (ซม.)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="96"
                    value={newHealthCheck.height}
                    onChange={(e) => setNewHealthCheck({ ...newHealthCheck, height: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ภาวะโภชนาการ</label>
                  <select
                    value={newHealthCheck.nutritionStatus}
                    onChange={(e) => setNewHealthCheck({ ...newHealthCheck, nutritionStatus: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="สมส่วน">สมส่วน</option>
                    <option value="ท้วม">ท้วม</option>
                    <option value="เริ่มอ้วน">เริ่มอ้วน</option>
                    <option value="ค่อนข้างผอม">ค่อนข้างผอม</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">พัฒนาการ 4 ด้าน (DSPM)</label>
                  <select
                    value={newHealthCheck.dspmStatus}
                    onChange={(e) => setNewHealthCheck({ ...newHealthCheck, dspmStatus: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="สมวัยทุกด้าน (4 ด้านผ่านเกณฑ์)">สมวัยทุกด้าน (4 ด้านผ่านเกณฑ์)</option>
                    <option value="สงสัยล่าช้า 1 ด้าน (นัดติดตามซ้ำ 30 วัน)">สงสัยล่าช้า 1 ด้าน (นัดติดตามซ้ำ 30 วัน)</option>
                    <option value="ส่งต่อตรวจวินิจฉัยแพทย์">ส่งต่อตรวจวินิจฉัยแพทย์</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ผู้ตรวจ / หน่วยบริการสาธารณสุข</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น รพ.สต. ในพื้นที่ ร่วมกับครู ศพด."
                  value={newHealthCheck.examiner}
                  onChange={(e) => setNewHealthCheck({ ...newHealthCheck, examiner: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddHealthModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-colors"
                >
                  บันทึกผลการตรวจ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: 8. CDC ADD SAFETY/MATERIAL CHECK (ศพด.)
      ========================================================================= */}
      {showAddSafetyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>บันทึกสื่อการเรียนรู้ / ตรวจความปลอดภัยสนามเด็กเล่น</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSafetyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const prefixId = activeDept.includes('เจริญทัศน์') ? 'MAT-CJ' : 'MAT-FT';
                const count = currentCdcData.materialsAndSafety.length + 1;
                const newId = `${prefixId}-${String(count).padStart(3, '0')}`;
                const matObj = {
                  ...newSafetyCheck,
                  id: newId,
                  quantity: Number(newSafetyCheck.quantity) || 1
                };
                const updated = [matObj, ...currentCdcData.materialsAndSafety];
                setCurrentCdcData({ ...currentCdcData, materialsAndSafety: updated });
                setShowAddSafetyModal(false);
                setNewSafetyCheck({
                  itemName: '',
                  category: 'เครื่องเล่นสนาม',
                  quantity: '1',
                  condition: 'พร้อมใช้งาน ปลอดภัย มีแผ่นยางกันกระแทก',
                  lastInspectedDate: new Date().toISOString().slice(0, 10),
                  inspector: ''
                });
                showToast(`บันทึกรายการ "${matObj.itemName}" เรียบร้อยแล้ว`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อสื่อการสอน / เครื่องเล่นสนาม</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ชิงช้ากลางแจ้ง, ชุดบล็อกไม้เสริมพัฒนาการ"
                  value={newSafetyCheck.itemName}
                  onChange={(e) => setNewSafetyCheck({ ...newSafetyCheck, itemName: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">หมวดหมู่</label>
                  <select
                    value={newSafetyCheck.category}
                    onChange={(e) => setNewSafetyCheck({ ...newSafetyCheck, category: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="เครื่องเล่นสนาม">เครื่องเล่นสนาม</option>
                    <option value="สื่อเสริมพัฒนาการ">สื่อเสริมพัฒนาการ</option>
                    <option value="อุปกรณ์ปฐมพยาบาล">อุปกรณ์ปฐมพยาบาล</option>
                    <option value="อาคารสถานที่ & ความปลอดภัย">อาคารสถานที่ & ความปลอดภัย</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">จำนวน (ชุด/ชิ้น)</label>
                  <input
                    type="number"
                    required
                    value={newSafetyCheck.quantity}
                    onChange={(e) => setNewSafetyCheck({ ...newSafetyCheck, quantity: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">สภาพความพร้อมใช้และความปลอดภัย</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น พร้อมใช้งาน ปลอดภัย ไม่มีเหลี่ยมคม น็อตยึดแน่นหนา"
                  value={newSafetyCheck.condition}
                  onChange={(e) => setNewSafetyCheck({ ...newSafetyCheck, condition: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">วันที่ตรวจล่าสุด</label>
                  <input
                    type="date"
                    required
                    value={newSafetyCheck.lastInspectedDate}
                    onChange={(e) => setNewSafetyCheck({ ...newSafetyCheck, lastInspectedDate: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">ผู้ตรวจประเมิน</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น นายช่างกองช่าง & ครู ศพด."
                    value={newSafetyCheck.inspector}
                    onChange={(e) => setNewSafetyCheck({ ...newSafetyCheck, inspector: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSafetyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors"
                >
                  บันทึกรายการ
                </button>
              </div>
            </form>
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
