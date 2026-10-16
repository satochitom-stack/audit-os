import React, { useState, useMemo, useEffect } from 'react';
import PageHeaderBanner from './PageHeaderBanner';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  Printer,
  Calendar,
  Send,
  Plus,
  Trash2,
  Edit3,
  Check,
  ChevronDown,
  Filter,
  Search,
  BellRing,
  AlertTriangle,
  Scale,
  Sparkles,
  Award,
  Eye,
  History,
  FileText,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { DLA_FOLLOWUP_REGISTER_6, DLA_FOLLOWUP_MEMO_TEMPLATE } from '../data/dlaStandardTemplates';
import OfficialThaiMemo from './OfficialThaiMemo';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDocumentToWord, exportThaiMemoToWord, exportDataToExcel } from '../utils/documentExportUtils';
import { toThaiDigits, formatSarabanDate } from '../utils/sarabanUtils';
import { luxuryConfirm } from './LuxuryModal';
import {
  parseDateOnly,
  formatDateOnly,
  addDays,
  calculateDaysRemaining,
  reconcileFollowupRegister,
  syncFollowupStatusToCapa,
  createCapaFromFollowupItem,
  createFollowupHistoryEntry,
  getSourceMeta,
  getTodayDate
} from '../utils/followupSyncUtils';

export default function AuditFollowUpView({
  selectedYear = '2569',
  orgProfile = {},
  capaFindings = [],
  setCapaFindings,
  session = null,
  onNavigateToTab = null
}) {
  const isNonAdminUser = session?.role !== 'admin' && session?.username?.toLowerCase() !== 'admin';
  const effectiveAuditorName = isNonAdminUser
    ? (session?.displayName || (orgProfile?.auditorName && orgProfile.auditorName.toUpperCase() !== 'ADMIN' && !orgProfile.auditorName.includes('Super Admin') ? orgProfile.auditorName : 'ผู้ตรวจสอบภายใน'))
    : (orgProfile?.auditorName || session?.displayName || 'ผู้ดูแลระบบส่วนกลาง (Super Admin)');
  const effectiveAuditorPosition = isNonAdminUser
    ? (session?.position || (orgProfile?.auditorPosition && !orgProfile.auditorPosition.includes('Platform Root') && !orgProfile.auditorPosition.includes('ผู้ดูแลระบบ') ? orgProfile.auditorPosition : 'นักวิชาการตรวจสอบภายใน'))
    : (orgProfile?.auditorPosition || session?.position || 'ผู้ดูแลระบบระบบตรวจสอบภายใน (Platform Root)');

  const [activeTab, setActiveTab] = useState('register'); // 'register', 'memo'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regimeFilter, setRegimeFilter] = useState('all'); // 'all', 'moi_30', 'cgd_60', 'agency_defined'
  const [sourceFilter, setSourceFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedFindingForMemo, setSelectedFindingForMemo] = useState(null);
  const [selectedFindingForDetail, setSelectedFindingForDetail] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLogNote, setNewLogNote] = useState('');
  const [newLogEvidence, setNewLogEvidence] = useState('');

  // Default register findings
  const defaultItems = useMemo(() => {
    return [
      {
        id: 'CAPA-FOLLOW-01',
        findingId: 'CAPA-FOLLOW-01',
        source: 'internal',
        sourceName: 'หน่วยตรวจสอบภายใน อปท.',
        title: 'การจัดทำงบกระทบยอดเงินฝากธนาคารล่าช้า',
        department: 'กองคลัง',
        reportedDate: '2569-01-10',
        orderDate: '2569-01-15',
        regime: 'agency_defined',
        deadlineDays: 30,
        deadlineBasis: 'ข้อมูลตัวอย่าง — ตรวจสอบและกำหนดตามบริบทจริง',
        deadlineDate: '2569-02-14',
        recommendation: 'ให้กองคลังเร่งรัดจัดทำงบกระทบยอดเงินฝากธนาคารทุกบัญชีเป็นประจำทุกสิ้นเดือนและรายงานผู้บริหารภายใน 15 วัน',
        status: 'overdue', // 'completed', 'in_progress', 'urgent', 'overdue'
        progressNotes: 'กองคลังได้จัดทำงบกระทบยอดของเดือน ม.ค. แล้วเสร็จ อยู่ระหว่างดำเนินการของเดือน ก.พ.',
        updatedAt: '2569-03-01',
        history: [
          {
            timestamp: new Date().toISOString(),
            date: '2569-01-15',
            action: 'created',
            fromStatus: '',
            toStatus: 'in_progress',
            changedBy: 'ผู้ตรวจสอบภายใน',
            note: 'ตั้งเรื่องติดตามผลการตรวจสอบ'
          }
        ]
      },
      {
        id: 'CAPA-FOLLOW-02',
        findingId: 'CAPA-FOLLOW-02',
        source: 'internal',
        sourceName: 'หน่วยตรวจสอบภายใน อปท.',
        title: 'การลงบันทึกการใช้รถยนต์ส่วนกลางไม่ครบถ้วน',
        department: 'สำนักปลัด',
        reportedDate: '2569-02-01',
        orderDate: '2569-02-05',
        regime: 'agency_defined',
        deadlineDays: 30,
        deadlineBasis: 'ข้อมูลตัวอย่าง — ตรวจสอบและกำหนดตามบริบทจริง',
        deadlineDate: '2569-03-07',
        recommendation: 'กำชับพนักงานขับรถให้ลงบันทึกเลขไมล์เริ่มต้น-สิ้นสุด และคำนวณอัตราสิ้นเปลืองน้ำมันเชื้อเพลิงทุกครั้ง',
        status: 'completed',
        progressNotes: 'สำนักปลัดได้จัดประชุมกำชับพนักงานขับรถ และผู้ควบคุมรถได้ตรวจเช็คสมุดบันทึกประจำรถทุกสัปดาห์แล้ว',
        updatedAt: '2569-02-25',
        history: [
          {
            timestamp: new Date().toISOString(),
            date: '2569-02-25',
            action: 'completed',
            fromStatus: 'in_progress',
            toStatus: 'completed',
            changedBy: 'ผู้ตรวจสอบภายใน',
            note: 'ตรวจสอบสมุดบันทึกประจำรถและหลักฐานแล้วเสร็จ ยุติข้อสังเกต'
          }
        ]
      },
      {
        id: 'CAPA-FOLLOW-03',
        findingId: 'CAPA-FOLLOW-03',
        source: 'internal',
        sourceName: 'หน่วยตรวจสอบภายใน อปท.',
        title: 'การจัดทำทะเบียนคุมสินทรัพย์และครุภัณฑ์ยังไม่เป็นปัจจุบัน',
        department: 'กองช่าง',
        reportedDate: '2569-02-10',
        orderDate: '2569-02-15',
        regime: 'agency_defined',
        deadlineDays: 60,
        deadlineBasis: 'ข้อมูลตัวอย่าง — ตรวจสอบและกำหนดตามบริบทจริง',
        deadlineDate: '2569-04-16',
        recommendation: 'ให้กองช่างประสานกองคลังเพื่อปรับปรุงฐานข้อมูลสินทรัพย์และสำรวจครุภัณฑ์จริงให้ตรงกับทะเบียนคุม',
        status: 'in_progress',
        progressNotes: 'อยู่ระหว่างการสำรวจสภาพครุภัณฑ์จริงภาคสนามร่วมกับงานพัสดุ',
        updatedAt: '2569-03-05',
        history: [
          {
            timestamp: new Date().toISOString(),
            date: '2569-02-15',
            action: 'created',
            fromStatus: '',
            toStatus: 'in_progress',
            changedBy: 'ผู้ตรวจสอบภายใน',
            note: 'ตั้งเรื่องติดตามผลการตรวจสอบ'
          }
        ]
      }
    ];
  }, []);

  const [registerItems, setRegisterItems] = useState(() => {
    let saved = null;
    try {
      const raw = localStorage.getItem(`ia_followup_register_${selectedYear}`);
      if (raw) saved = JSON.parse(raw);
    } catch (_) {}
    return reconcileFollowupRegister(saved, capaFindings, {
      auditorName: effectiveAuditorName,
      selectedYear,
      defaultItems
    });
  });

  // Reconcile incoming CAPA updates when capaFindings or selectedYear changes
  useEffect(() => {
    setRegisterItems((prev) => {
      const reconciled = reconcileFollowupRegister(prev, capaFindings, {
        auditorName: effectiveAuditorName,
        selectedYear,
        defaultItems
      });
      try {
        localStorage.setItem(`ia_followup_register_${selectedYear}`, JSON.stringify(reconciled));
      } catch (_) {}
      return reconciled;
    });
  }, [capaFindings, selectedYear, effectiveAuditorName, defaultItems]);

  const saveRegister = (items) => {
    setRegisterItems(items);
    try {
      localStorage.setItem(`ia_followup_register_${selectedYear}`, JSON.stringify(items));
    } catch (_) {}
  };

  const handleUpdateStatus = (id, newStatus, customNote = '') => {
    const today = getTodayDate();
    let updatedTarget = null;

    const updated = registerItems.map((item) => {
      if (item.id !== id) return item;
      const historyEntry = createFollowupHistoryEntry({
        action: 'status_changed',
        fromStatus: item.status,
        toStatus: newStatus,
        changedBy: effectiveAuditorName,
        note: customNote || (newStatus === 'completed' ? 'ยุติข้อสังเกตและปิดรายการ' : `ปรับปรุงสถานะเป็น ${newStatus}`),
        date: today
      });
      const nextItem = {
        ...item,
        status: newStatus,
        history: [historyEntry, ...(Array.isArray(item.history) ? item.history : [])],
        updatedAt: today
      };
      updatedTarget = nextItem;
      return nextItem;
    });

    saveRegister(updated);

    // Keep selected finding in sync if modal is open
    if (selectedFindingForDetail && selectedFindingForDetail.id === id && updatedTarget) {
      setSelectedFindingForDetail(updatedTarget);
    }

    // Sync to CAPA findings if setCapaFindings is provided
    const targetItem = registerItems.find((item) => item.id === id);
    const targetFindingId = targetItem?.findingId || id;
    if (setCapaFindings && typeof setCapaFindings === 'function') {
      setCapaFindings((prev) =>
        syncFollowupStatusToCapa(prev, targetFindingId, newStatus, {
          note: customNote || (newStatus === 'completed' ? 'ยุติข้อสังเกตและปิดรายการจากการติดตามผล' : `ปรับปรุงสถานะติดตามเป็น ${newStatus}`),
          auditorName: effectiveAuditorName,
          date: today
        })
      );
    }
  };

  const handleAddFollowupLog = (id) => {
    if (!newLogNote.trim() && !newLogEvidence.trim()) return;
    const today = getTodayDate();
    let updatedTarget = null;

    const updated = registerItems.map((item) => {
      if (item.id !== id) return item;
      const historyEntry = createFollowupHistoryEntry({
        action: 'followup_note',
        fromStatus: item.status,
        toStatus: item.status,
        changedBy: effectiveAuditorName,
        note: newLogNote.trim(),
        evidence: newLogEvidence.trim(),
        date: today
      });
      const nextItem = {
        ...item,
        evidenceDocs: newLogEvidence.trim()
          ? (item.evidenceDocs ? `${item.evidenceDocs}, ${newLogEvidence.trim()}` : newLogEvidence.trim())
          : item.evidenceDocs,
        progressNotes: newLogNote.trim()
          ? `${item.progressNotes ? item.progressNotes + '\n' : ''}[${today}] ${newLogNote.trim()}`
          : item.progressNotes,
        history: [historyEntry, ...(Array.isArray(item.history) ? item.history : [])],
        updatedAt: today
      };
      updatedTarget = nextItem;
      return nextItem;
    });

    saveRegister(updated);
    if (selectedFindingForDetail && selectedFindingForDetail.id === id && updatedTarget) {
      setSelectedFindingForDetail(updatedTarget);
    }
    setNewLogNote('');
    setNewLogEvidence('');
  };

  const handleUpdateRegime = (id, newRegime, customDays) => {
    const updated = registerItems.map((item) => {
      if (item.id !== id) return item;
      const days = newRegime === 'cgd_60' ? 60 : newRegime === 'moi_30' ? 30 : Number(customDays ?? item.deadlineDays ?? 30);
      if (!Number.isInteger(days) || days < 1 || days > 3650) return item;
      return {
        ...item,
        regime: newRegime,
        deadlineDays: days,
        deadlineBasis: newRegime === 'agency_defined' ? (item.deadlineBasis || '') : '',
        deadlineDate: addDays(item.orderDate || getTodayDate(), days),
        updatedAt: getTodayDate()
      };
    });
    saveRegister(updated);
  };

  const handleUpdateDeadlineSetting = (id, field, value) => {
    const updated = registerItems.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: value, updatedAt: getTodayDate() };
      if (field === 'deadlineDays') {
        const days = Number(value);
        if (Number.isInteger(days) && days >= 1 && days <= 3650) {
          next.deadlineDate = addDays(item.orderDate || getTodayDate(), days);
        } else {
          // Do not leave an old deadline visible while the edited interval is invalid or empty.
          next.deadlineDate = '';
        }
      }
      return next;
    });
    saveRegister(updated);
  };

  const handleUpdateNotes = (id, notes) => {
    const updated = registerItems.map((item) =>
      item.id === id ? { ...item, progressNotes: notes, updatedAt: getTodayDate() } : item
    );
    saveRegister(updated);
  };

  const handleDeleteItem = async (id) => {
    const itemToDelete = registerItems.find((item) => item.id === id);
    const confirmed = await luxuryConfirm({
      title: 'ยืนยันการลบรายการติดตามผล',
      message: 'ต้องการลบรายการติดตามผลการตรวจสอบนี้ออกจากทะเบียนหรือไม่?',
      itemTitle: itemToDelete?.title || `รหัส ${id}`,
      confirmText: 'ลบรายการ',
      variant: 'danger'
    });
    if (!confirmed) return;
    const updated = registerItems.filter((item) => item.id !== id);
    saveRegister(updated);
    if (selectedFindingForDetail && selectedFindingForDetail.id === id) {
      setSelectedFindingForDetail(null);
    }
  };

  const handleSelectForMemo = (item) => {
    setSelectedFindingForMemo(item);
    setActiveTab('memo');
  };

  // New item form state
  const [newItem, setNewItem] = useState({
    source: 'internal',
    title: '',
    department: 'กองคลัง',
    responsiblePerson: '',
    orderDate: getTodayDate(),
    regime: 'agency_defined',
    deadlineDays: 30,
    deadlineBasis: '',
    recommendation: '',
    condition: '',
    criteria: '',
    cause: '',
    effect: '',
    correctiveAction: '',
    evidenceDocs: '',
    progressNotes: ''
  });

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;

    const days = newItem.regime === 'cgd_60' ? 60 : newItem.regime === 'moi_30' ? 30 : Number(newItem.deadlineDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650) return;
    if (newItem.regime === 'agency_defined' && !newItem.deadlineBasis.trim()) return;
    const deadlineDate = addDays(newItem.orderDate, days);
    const today = getTodayDate();
    const sourceMeta = getSourceMeta(newItem.source || 'internal');

    const generatedId = `CAPA-FOLLOW-${Date.now().toString().slice(-4)}`;
    const item = {
      id: generatedId,
      findingId: generatedId,
      source: newItem.source || 'internal',
      sourceName: sourceMeta.fullName,
      title: newItem.title.trim(),
      department: newItem.department,
      responsiblePerson: newItem.responsiblePerson.trim() || `ผู้อำนวยการ${newItem.department}`,
      reportedDate: newItem.orderDate,
      orderDate: newItem.orderDate,
      regime: newItem.regime,
      deadlineDays: days,
      deadlineBasis: newItem.deadlineBasis.trim(),
      deadlineDate: deadlineDate,
      recommendation: newItem.recommendation.trim(),
      condition: newItem.condition.trim() || newItem.title.trim(),
      criteria: newItem.criteria.trim(),
      cause: newItem.cause.trim(),
      effect: newItem.effect.trim(),
      correctiveAction: newItem.correctiveAction.trim(),
      evidenceDocs: newItem.evidenceDocs.trim(),
      status: 'in_progress',
      progressNotes: newItem.progressNotes.trim() || 'อยู่ระหว่างหน่วยรับตรวจจัดทำรายงานผลและดำเนินการแก้ไข',
      history: [
        createFollowupHistoryEntry({
          action: 'created_in_followup',
          fromStatus: '',
          toStatus: 'in_progress',
          changedBy: effectiveAuditorName,
          note: 'บันทึกรายการข้อตรวจพบใหม่เข้าสู่ทะเบียนติดตามผล',
          date: newItem.orderDate
        })
      ],
      updatedAt: today
    };

    const updated = [item, ...registerItems];
    saveRegister(updated);

    // Two-way sync: Add to CAPA findings list as well
    if (setCapaFindings && typeof setCapaFindings === 'function') {
      const capaModel = createCapaFromFollowupItem(item, selectedYear);
      setCapaFindings((prev) => [capaModel, ...(Array.isArray(prev) ? prev : [])]);
    }

    setShowAddModal(false);
    setNewItem({
      source: 'internal',
      title: '',
      department: 'กองคลัง',
      responsiblePerson: '',
      orderDate: getTodayDate(),
      regime: 'agency_defined',
      deadlineDays: 30,
      deadlineBasis: '',
      recommendation: '',
      condition: '',
      criteria: '',
      cause: '',
      effect: '',
      correctiveAction: '',
      evidenceDocs: '',
      progressNotes: ''
    });
  };

  const handleLoadDlaFollowupRegister = () => {
    const today = getTodayDate();
    const formatted = DLA_FOLLOWUP_REGISTER_6.map((dla) => ({
      id: dla.id,
      findingId: dla.id,
      source: 'internal',
      sourceName: 'หน่วยตรวจสอบภายใน อปท.',
      title: dla.finding,
      department: dla.department,
      responsiblePerson: `ผู้อำนวยการ${dla.department}`,
      reportedDate: '2569-01-15',
      orderDate: '2569-01-20',
      regime: 'moi_30',
      deadlineDays: 30,
      deadlineBasis: 'ผู้ใช้เลือกอ้างอิง มท.',
      deadlineDate: addDays('2569-01-20', 30),
      recommendation: dla.recommendation,
      condition: dla.finding,
      criteria: 'มาตรฐานและคู่มือการปฏิบัติงานตรวจสอบภายใน อปท. (กรมส่งเสริมการปกครองท้องถิ่น)',
      cause: 'การปฏิบัติงานยังไม่เป็นไปตามแนวทางมาตรฐาน',
      effect: 'อาจมีความเสี่ยงด้านการควบคุมภายใน',
      correctiveAction: dla.correctiveAction,
      status: dla.status === 'ยุติข้อสังเกต' ? 'completed' : 'in_progress',
      progressNotes: `การดำเนินการ: ${dla.correctiveAction} (เป้าหมาย: ${dla.targetDate})`,
      history: [
        createFollowupHistoryEntry({
          action: 'loaded_dla_template',
          fromStatus: '',
          toStatus: dla.status === 'ยุติข้อสังเกต' ? 'completed' : 'in_progress',
          changedBy: effectiveAuditorName,
          note: 'โหลดตัวอย่าง 6 ภารกิจหลักมาตรฐาน สถ.',
          date: today
        })
      ],
      updatedAt: today
    }));
    saveRegister(formatted);
  };

  // Extract unique departments for filter dropdown
  const availableDepartments = useMemo(() => {
    const set = new Set();
    registerItems.forEach((i) => {
      if (i.department && i.department.trim()) set.add(i.department.trim());
    });
    return Array.from(set).sort();
  }, [registerItems]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return registerItems.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q)) ||
        (item.recommendation && item.recommendation.toLowerCase().includes(q)) ||
        (item.sourceName && item.sourceName.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q));

      const matchRegime = regimeFilter === 'all' || item.regime === regimeFilter;
      const matchSource = sourceFilter === 'all' || item.source === sourceFilter;
      const matchDepartment = departmentFilter === 'all' || item.department === departmentFilter;

      let matchStatus = true;
      if (statusFilter !== 'all') {
        matchStatus = item.status === statusFilter;
      }

      return matchSearch && matchRegime && matchSource && matchDepartment && matchStatus;
    });
  }, [registerItems, searchTerm, regimeFilter, sourceFilter, departmentFilter, statusFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = registerItems.length;
    const completed = registerItems.filter((i) => i.status === 'completed').length;
    const inProgress = registerItems.filter((i) => i.status === 'in_progress').length;
    const overdue = registerItems.filter((i) => i.status === 'overdue').length;
    const urgent = registerItems.filter((i) => i.status === 'urgent').length;
    const moiCount = registerItems.filter((i) => i.regime === 'moi_30').length;
    const cgdCount = registerItems.filter((i) => i.regime === 'cgd_60').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, overdue, urgent, moiCount, cgdCount, percent };
  }, [registerItems]);

  const currentMemoItem = selectedFindingForMemo || registerItems[0] || defaultItems[0];
  const deadlineDays = Number(currentMemoItem.deadlineDays) || (currentMemoItem.regime === 'cgd_60' ? 60 : currentMemoItem.regime === 'moi_30' ? 30 : null);
  const deadlineDaysThai = deadlineDays == null ? 'ตามกำหนดที่ระบุ' : toThaiDigits(String(deadlineDays));
  const deadlineBasisText = currentMemoItem.regime === 'agency_defined'
    ? `กรอบเวลาที่หน่วยงานกำหนด (${currentMemoItem.deadlineBasis || 'ยังไม่ได้ระบุฐานการกำหนด'})`
    : currentMemoItem.regime === 'cgd_60'
      ? 'หลักอ้างอิงที่ผู้ใช้เลือก: กค. (โปรดตรวจสอบฉบับที่ใช้บังคับ)'
      : 'หลักอ้างอิงที่ผู้ใช้เลือก: มท. (โปรดตรวจสอบฉบับที่ใช้บังคับ)';

  const handleDownloadWord = () => {
    if (activeTab === 'memo') {
      const memoData = {
        agency: `${orgProfile?.agencyName || 'หน่วยตรวจสอบภายใน'} ${orgProfile?.name || 'อปท.'}`,
        docNumber: `มท ๐๘๐๘/${selectedYear}/ว...`,
        date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        subject: `ติดตามผลการดำเนินการตามข้อเสนอแนะการตรวจสอบภายใน ครบกำหนด ${deadlineDays == null ? 'ตามกำหนดที่ระบุ' : `${deadlineDaysThai} วัน`}`, 
        to: `ผู้อำนวยการ${currentMemoItem.department || 'หน่วยรับตรวจ'}`,
        content: `
          <p style="text-indent: 2.5cm; margin-bottom: 8pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
            ตามที่ หน่วยตรวจสอบภายในได้รายงานผลการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. ${selectedYear} ในภารกิจ "${currentMemoItem.title}" และ นายก${orgProfile?.name || 'อปท.'} ได้มีข้อสั่งการเมื่อวันที่ ${currentMemoItem.orderDate || '...'} ให้หน่วยงานของท่านดำเนินการปรับปรุงแก้ไขข้อบกพร่องตามข้อเสนอแนะภายในกำหนด ${deadlineDays == null ? 'ตามกรอบเวลาที่ระบุไว้' : `${deadlineDaysThai} วัน`} นั้น
          </p>
          <p style="text-indent: 2.5cm; margin-bottom: 8pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
            บัดนี้ ถึงกำหนดติดตามผลตามกรอบเวลา ${deadlineDays == null ? 'ที่ระบุไว้' : `${deadlineDaysThai} วัน`} (ครบกำหนดวันที่ ${currentMemoItem.deadlineDate || '...'}) โดยใช้ฐานการกำหนดว่า ${deadlineBasisText} หน่วยตรวจสอบภายในจึงขอติดตามผลความคืบหน้าการปรับปรุงแก้ไขในประเด็นดังกล่าว
          </p>
          <div style="margin: 10pt 0; padding: 8pt; border: 1pt solid #ccc; font-family: 'TH Sarabun PSK';">
            <p style="margin: 0; font-weight: bold; font-size: 16pt;">ข้อเสนอแนะที่ต้องติดตาม:</p>
            <p style="margin: 4pt 0 0 0; font-size: 16pt;">${currentMemoItem.recommendation || '-'}</p>
          </div>
          <p style="text-indent: 2.5cm; margin-top: 10pt; margin-bottom: 16pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
            จึงเรียนมาเพื่อโปรดรายงานผลการดำเนินการพร้อมแนบเอกสารหลักฐานที่เกี่ยวข้อง ส่งกลับมายังหน่วยตรวจสอบภายในภายในระยะเวลาที่กำหนด เพื่อรวบรวมรายงานต่อนายก${orgProfile?.name || 'อปท.'} ต่อไป
          </p>
        `,
        signatoryName: effectiveAuditorName,
        signatoryPosition: effectiveAuditorPosition,
        palatName: orgProfile?.palatName || 'ปลัด อปท.',
        palatPosition: orgProfile?.palatPosition || 'ปลัดองค์กรปกครองส่วนท้องถิ่น',
        approverName: orgProfile?.approverName || 'นายก อปท.',
        approverPosition: orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'
      };
      exportThaiMemoToWord(memoData, `หนังสือติดตามผล_${currentMemoItem.department || 'หน่วยรับตรวจ'}_${selectedYear}.doc`);
    } else {
      const orgName = orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น';
      const bodyContent = `
        <div style="text-align: center; margin-bottom: 16pt; font-family: 'TH Sarabun PSK';">
          <p style="margin: 0; font-size: 20pt; font-weight: bold;">ทะเบียนคุมและติดตามผลการปฏิบัติตามข้อเสนอแนะการตรวจสอบภายใน</p>
          <p style="margin: 4pt 0 0 0; font-size: 16pt; font-weight: bold;">${orgName}</p>
          <p style="margin: 2pt 0 0 0; font-size: 16pt;">ประจำปีงบประมาณ พ.ศ. ${selectedYear}</p>
        </div>
        <div style="border-top: 1.5pt solid black; margin-bottom: 14pt;"></div>

        <table style="width: 100%; border-collapse: collapse; border: 1pt solid black; font-size: 14pt; font-family: 'TH Sarabun PSK'; margin-bottom: 16pt;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1pt solid black; padding: 5pt; width: 6%; text-align: center;">ลำดับ</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 22%; text-align: center;">ภารกิจ / เรื่อง</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 14%; text-align: center;">หน่วยรับตรวจ</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 28%; text-align: center;">ข้อตรวจพบ / ข้อเสนอแนะ</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 15%; text-align: center;">กำหนดเวลา</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 15%; text-align: center;">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${registerItems
              .map(
                (item, i) => `
              <tr>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${i + 1}</td>
                <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;"><strong>${item.title || '-'}</strong></td>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${item.department || '-'}</td>
                <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;">${item.recommendation || '-'}</td>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${item.deadlineDate || '-'}</td>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${item.status === 'completed' ? 'เสร็จสิ้นสมบูรณ์' : item.status === 'urgent' ? 'เร่งด่วน' : item.status === 'overdue' ? 'เกินกำหนด' : 'อยู่ระหว่างดำเนินการ'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <table style="width: 100%; border: none; margin-top: 30pt; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">(ลงชื่อ)........................................................ผู้ตรวจสอบภายใน</p>
              <p style="margin: 4pt 0 0 0; font-weight: bold;">(${effectiveAuditorName})</p>
              <p style="margin: 2pt 0 0 0;">${effectiveAuditorPosition}</p>
            </td>
          </tr>
        </table>
      `;
      exportDocumentToWord(bodyContent, `ทะเบียนติดตามผลการตรวจสอบ_${selectedYear}.doc`, 'ทะเบียนคุมและติดตามผลการตรวจสอบภายใน');
    }
  };

  const handleDownloadExcel = () => {
    const headers = [
      'ลำดับ',
      'ภารกิจ / เรื่อง',
      'หน่วยรับตรวจ',
      'เกณฑ์อ้างอิง',
      'ข้อตรวจพบ/สภาพที่พบ',
      'ข้อเสนอแนะ',
      'วันที่สั่งการ',
      'วันครบกำหนด',
      'สถานะการดำเนินงาน'
    ];
    const rows = registerItems.map((item, i) => [
      i + 1,
      item.title || '',
      item.department || '',
      item.regime === 'cgd_60' ? 'ผู้ใช้เลือกอ้างอิง กค. (ตรวจสอบฉบับที่ใช้บังคับ)' : item.regime === 'moi_30' ? 'ผู้ใช้เลือกอ้างอิง มท. (ตรวจสอบฉบับที่ใช้บังคับ)' : `หน่วยงานกำหนด ${item.deadlineDays || ''} วัน: ${item.deadlineBasis || 'ไม่ระบุฐาน'}`, 
      item.condition || '',
      item.recommendation || '',
      item.orderDate || '',
      item.deadlineDate || '',
      item.status === 'completed'
        ? 'เสร็จสิ้นสมบูรณ์'
        : item.status === 'urgent'
        ? 'เร่งด่วน'
        : item.status === 'overdue'
        ? 'เกินกำหนด'
        : 'อยู่ระหว่างดำเนินการ'
    ]);
    exportDataToExcel('ทะเบียนติดตามผล', [headers, ...rows], `Audit_FollowUp_Register_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        title="ระบบติดตามผลการปฏิบัติตามข้อเสนอแนะและมาตรการปรับปรุง (CAPA Audit Tracking)"
        orgName={orgProfile?.name}
        auditorName={`ผู้ตรวจสอบ: ${effectiveAuditorName}`}
        year={selectedYear}
      />

      {/* Stats Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">ข้อตรวจพบทั้งหมด</div>
          <div className="mt-1 text-2xl font-black text-stone-900 dark:text-stone-100">{stats.total}</div>
          <div className="text-[10px] text-stone-400 mt-1">มท: {stats.moiCount} | กค: {stats.cgdCount}</div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">แก้ไขแล้วเสร็จ</div>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">{stats.percent}% ความสำเร็จ</div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">อยู่ระหว่างดำเนินการ</div>
          <div className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-400">{stats.inProgress}</div>
          <div className="text-[10px] text-stone-400 mt-1">ตามรอบเวลาปกติ</div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300">ใกล้ครบกำหนด (≤ 15 วัน)</div>
          <div className="mt-1 text-2xl font-black text-amber-900 dark:text-amber-300">{stats.urgent}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">ต้องเร่งรัดติดตาม</div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">เกินกำหนดเวลา (Overdue)</div>
          <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">{stats.overdue}</div>
          <div className="text-[10px] text-rose-600 font-bold mt-1">ต้องออกหนังสือเตือน</div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">กรอบเวลาตามเกณฑ์</div>
          <div className="text-xs space-y-1 font-bold">
            <div className="text-stone-700 dark:text-stone-300">กำหนดตามข้อกำหนดที่ใช้บังคับ</div>
            <div className="text-stone-500 dark:text-stone-400">หากไม่มีข้อกำหนดชัดเจน ให้หน่วยงานกำหนดเอง</div>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs & Action Toolbar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-2 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'register'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ทะเบียนคุมการปฏิบัติตามข้อเสนอแนะ (Follow-up Register)</span>
          </button>

          <button
            onClick={() => setActiveTab('memo')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'memo'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-transparent'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>บันทึกข้อความติดตามผลตามกำหนดของรายการ</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'register' && (
            <>
              <button
                onClick={handleLoadDlaFollowupRegister}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="โหลดตัวอย่างทะเบียนคุม 6 ภารกิจหลัก สถ."
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>โหลดตัวอย่าง 6 ภารกิจ สถ.</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มข้อตรวจพบ</span>
              </button>
            </>
          )}

          <OfficialDocActionToolbar
            onWord={handleDownloadWord}
            onExcel={activeTab === 'register' ? handleDownloadExcel : null}
            onPdf={() => window.print()}
            wordTitle={activeTab === 'register' ? 'ส่งออกทะเบียนคุม (Word .doc)' : 'ส่งออกบันทึกข้อความติดตามผล (Word .doc)'}
            wordSubtitle={
              activeTab === 'register'
                ? 'ทะเบียนคุมและติดตามผลข้อเสนอแนะ พร้อมตารางสรุปและช่องลงนาม'
                : 'บันทึกข้อความแจ้งเตือนเร่งรัดติดตามผลตามระเบียบงานสารบรรณ'
            }
            excelTitle={activeTab === 'register' ? 'ส่งออกทะเบียนคุม (Excel .xlsx)' : undefined}
            excelSubtitle={activeTab === 'register' ? 'ตารางทะเบียนคุมข้อสังเกตและสถานะการปรับปรุงแก้ไข' : undefined}
            pdfTitle={activeTab === 'register' ? 'พิมพ์ทะเบียนคุม (PDF/Print)' : 'พิมพ์บันทึกข้อความเตือน (PDF/Print)'}
            pdfSubtitle={
              activeTab === 'register'
                ? 'จัดพิมพ์ทะเบียนคุมแบบหน้ากว้างและรายงานสรุป'
                : 'จัดพิมพ์บันทึกข้อความตราครุฑมาตรฐาน'
            }
          />
        </div>
      </div>

      {/* ==================================================== */}
      {/* VIEW: REGISTER */}
      {/* ==================================================== */}
      {activeTab === 'register' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="ค้นหาข้อตรวจพบ, รหัส, หน่วยงาน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none w-56"
                />
              </div>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="text-xs p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold outline-none cursor-pointer"
              >
                <option value="all">ทุกแหล่งข้อค้นพบ</option>
                <option value="internal">การตรวจสอบภายใน (IA)</option>
                <option value="oag">สตง.</option>
                <option value="inspector">ผู้ตรวจราชการ</option>
                <option value="external">หน่วยงานภายนอกอื่นๆ</option>
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-xs p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold outline-none cursor-pointer"
              >
                <option value="all">ทุกหน่วยรับตรวจ</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Regime Filter */}
              <select
                value={regimeFilter}
                onChange={(e) => setRegimeFilter(e.target.value)}
                className="text-xs p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold outline-none cursor-pointer"
              >
                <option value="all">ทุกกรอบเวลา</option>
                <option value="moi_30">ผู้ใช้เลือกอ้างอิง มท. (30 วัน)</option>
                <option value="cgd_60">ผู้ใช้เลือกอ้างอิง กค. (60 วัน)</option>
                <option value="agency_defined">กรอบเวลาที่หน่วยงานกำหนด</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold outline-none cursor-pointer"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
                <option value="urgent">เร่งด่วน (≤ 15 วัน)</option>
                <option value="overdue">เกินกำหนดเวลา</option>
                <option value="completed">เสร็จสิ้นสมบูรณ์</option>
              </select>
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              แสดง {filteredItems.length} จากทั้งหมด {registerItems.length} รายการ
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden">
              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-3 px-3">แหล่งที่มา & ประเด็นข้อตรวจพบ</th>
                  <th className="py-3 px-3 w-32">หน่วยรับตรวจ / ผู้รับผิดชอบ</th>
                  <th className="py-3 px-3 w-40">กรอบเวลา & วันครบกำหนด</th>
                  <th className="py-3 px-3">ความคืบหน้า / การดำเนินการ</th>
                  <th className="py-3 px-3 w-36">สถานะการติดตาม</th>
                  <th className="py-3 px-3 text-right w-44 print:hidden">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredItems.map((item, idx) => {
                  const daysLeft = calculateDaysRemaining(item.deadlineDate);
                  const sourceMeta = getSourceMeta(item.source);

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-stone-400">{idx + 1}</td>
                      <td className="py-3 px-3 max-w-xs space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.source === 'oag'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                                : item.source === 'inspector'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                                : item.source === 'external'
                                ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                            }`}
                          >
                            {sourceMeta.label}
                          </span>
                          <span className="font-mono text-[10px] text-stone-400 font-bold">{item.id}</span>
                          {item.severity && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                item.severity === 'critical'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : item.severity === 'high'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                              }`}
                            >
                              {item.severity === 'critical' ? 'วิกฤติ' : item.severity === 'high' ? 'สูง' : 'ปานกลาง'}
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-stone-900 dark:text-stone-100 leading-snug">{item.title}</div>
                        <div className="text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed line-clamp-2">
                          {item.recommendation || item.correctiveAction}
                        </div>
                      </td>

                      <td className="py-3 px-3 space-y-1">
                        <div className="font-semibold text-amber-800 dark:text-amber-300">{item.department}</div>
                        {item.responsiblePerson && (
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">
                            {item.responsiblePerson}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 space-y-1">
                        <div className="flex items-center space-x-1">
                          <select
                            value={item.regime || 'agency_defined'}
                            onChange={(e) => handleUpdateRegime(item.id, e.target.value)}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 outline-none cursor-pointer"
                          >
                            <option value="agency_defined">หน่วยงานกำหนด</option>
                            <option value="moi_30">ผู้ใช้เลือกอ้างอิง มท. (30 วัน)</option>
                            <option value="cgd_60">ผู้ใช้เลือกอ้างอิง กค. (60 วัน)</option>
                          </select>
                        </div>
                        {item.regime === 'agency_defined' && (
                          <div className="mt-2 space-y-1.5">
                            <input
                              type="number"
                              min="1"
                              max="3650"
                              value={item.deadlineDays ?? ''}
                              onChange={(e) => handleUpdateDeadlineSetting(item.id, 'deadlineDays', e.target.value)}
                              aria-label="จำนวนวันติดตามที่หน่วยงานกำหนด"
                              className="w-full text-[10px] p-1.5 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                            />
                            <input
                              type="text"
                              value={item.deadlineBasis || ''}
                              onChange={(e) => handleUpdateDeadlineSetting(item.id, 'deadlineBasis', e.target.value)}
                              placeholder="ฐาน/เหตุผลที่กำหนดเวลา"
                              aria-label="ฐานหรือเหตุผลที่หน่วยงานกำหนดเวลา"
                              className="w-full text-[10px] p-1.5 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                            />
                          </div>
                        )}
                        <div className="font-mono font-bold text-stone-800 dark:text-stone-200">
                          {item.deadlineDate || '-'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          สั่งการ: {item.orderDate || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs space-y-1.5">
                        <textarea
                          rows={2}
                          value={item.progressNotes}
                          onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                          className="w-full text-[11px] p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800 text-stone-800 dark:text-stone-200 leading-relaxed print:border-none focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                        {item.evidenceDocs && (
                          <div className="text-[10px] text-blue-700 dark:text-blue-300 flex items-center space-x-1 truncate">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate" title={item.evidenceDocs}>หลักฐาน: {item.evidenceDocs}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 space-y-1">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          className={`w-full p-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                            item.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : item.status === 'overdue'
                              ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              : item.status === 'urgent'
                              ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-200'
                              : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
                          <option value="urgent">เร่งด่วน (≤ 15 วัน)</option>
                          <option value="overdue">เกินกำหนดเวลา</option>
                          <option value="completed">เสร็จสิ้นสมบูรณ์ (ยุติข้อสังเกต)</option>
                        </select>

                        {/* Days countdown badge */}
                        {item.status !== 'completed' && (
                          <div className="text-[10px] font-semibold text-stone-500 flex items-center space-x-1">
                            {daysLeft < 0 ? (
                              <span className="text-rose-600 font-bold">เกินกำหนด {-daysLeft} วัน</span>
                            ) : daysLeft <= 15 ? (
                              <span className="text-amber-700 font-bold">เหลืออีก {daysLeft} วัน</span>
                            ) : (
                              <span>เหลืออีก {daysLeft} วัน</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right print:hidden space-x-1">
                        <button
                          onClick={() => setSelectedFindingForDetail(item)}
                          className="bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300/80 dark:border-stone-700 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center space-x-1"
                          title="ดูรายละเอียดข้อค้นพบและประวัติการติดตามผล (Audit Trail)"
                        >
                          <Eye className="w-3 h-3 text-stone-500" />
                          <span>รายละเอียด</span>
                        </button>
                        <button
                          onClick={() => handleSelectForMemo(item)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                          title="สร้างหนังสือติดตามผล"
                        >
                          ออกหนังสือเตือน
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: MEMO */}
      {/* ==================================================== */}
      {activeTab === 'memo' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <OfficialThaiMemo
            agency={`${orgProfile?.agencyName || 'หน่วยตรวจสอบภายใน'} ${orgProfile?.name || 'อปท.'}`}
            phone={orgProfile?.phone || ''}
            docNumber={`มท ๐๘๐๘/${selectedYear}/ว...`}
            date={new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            subject={`ติดตามผลการดำเนินการตามข้อเสนอแนะการตรวจสอบภายใน ครบกำหนด ${deadlineDays == null ? 'ตามกำหนดที่ระบุ' : `${deadlineDaysThai} วัน`}`}
            to={`ผู้อำนวยการ${currentMemoItem.department || 'หน่วยรับตรวจ'}`}
            signatory={{
              name: effectiveAuditorName,
              position: effectiveAuditorPosition,
              role: `หน่วยตรวจสอบภายใน ${orgProfile?.name || 'อปท.'}`
            }}
            showReviewBoxes={false}
          >
            <p style={{ textIndent: '2.5cm' }} className="m-0 text-justify leading-relaxed">
              {toThaiDigits(`ตามที่ หน่วยตรวจสอบภายในได้รายงานผลการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. ${selectedYear} ในภารกิจ "${currentMemoItem.title}" และ นายก${orgProfile?.name || 'อปท.'} ได้มีข้อสั่งการเมื่อวันที่ ${currentMemoItem.orderDate || '...'} ให้หน่วยงานของท่านดำเนินการปรับปรุงแก้ไขข้อบกพร่องตามข้อเสนอแนะภายในกำหนด ${deadlineDays == null ? 'ตามกำหนดที่ระบุ' : `${deadlineDaysThai} วัน`} นั้น`)}
            </p>
            <p style={{ textIndent: '2.5cm' }} className="m-0 text-justify leading-relaxed">
              {toThaiDigits(`บัดนี้ ได้ครบกำหนดระยะเวลา ${deadlineDays == null ? 'ตามกำหนดที่ระบุ' : `${deadlineDaysThai} วัน`} แล้ว (ครบกำหนดวันที่ ${currentMemoItem.deadlineDate || '...'}) เพื่อให้การติดตามผลการตรวจสอบภายในเป็นไปตาม ${deadlineBasisText} หน่วยตรวจสอบภายในจึงขอติดตามผลความคืบหน้าการปรับปรุงแก้ไขในประเด็นดังกล่าว`)}
            </p>
            <div className="p-3.5 bg-stone-50 border border-stone-300 rounded-none space-y-1 my-2">
              <div className="font-bold text-black">ข้อเสนอแนะที่ต้องติดตาม:</div>
              <div className="text-stone-900 whitespace-pre-line leading-relaxed">{toThaiDigits(currentMemoItem.recommendation)}</div>
            </div>
            <p style={{ textIndent: '2.5cm' }} className="m-0 text-justify leading-relaxed pt-2">
              {toThaiDigits(`จึงเรียนมาเพื่อโปรดรายงานผลการดำเนินการพร้อมแนบเอกสารหลักฐานที่เกี่ยวข้อง ส่งกลับมายังหน่วยตรวจสอบภายในภายในระยะเวลาที่กำหนด เพื่อรวบรวมรายงานต่อนายก${orgProfile?.name || 'อปท.'} ต่อไป`)}
            </p>
          </OfficialThaiMemo>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DETAIL & AUDIT TRAIL HISTORY */}
      {/* ==================================================== */}
      {selectedFindingForDetail && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4 border-stone-100 dark:border-stone-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      selectedFindingForDetail.source === 'oag'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                        : selectedFindingForDetail.source === 'inspector'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                    }`}
                  >
                    {getSourceMeta(selectedFindingForDetail.source).label}
                  </span>
                  <span className="font-mono text-xs text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded font-bold">
                    {selectedFindingForDetail.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedFindingForDetail.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : selectedFindingForDetail.status === 'overdue'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {selectedFindingForDetail.status === 'completed'
                      ? 'เสร็จสิ้นสมบูรณ์'
                      : selectedFindingForDetail.status === 'overdue'
                      ? 'เกินกำหนดเวลา'
                      : selectedFindingForDetail.status === 'urgent'
                      ? 'เร่งด่วน'
                      : 'อยู่ระหว่างดำเนินการ'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 pt-1">
                  {selectedFindingForDetail.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFindingForDetail(null)}
                className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Core Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px]">หน่วยรับตรวจ:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{selectedFindingForDetail.department}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">ผู้รับผิดชอบ:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{selectedFindingForDetail.responsiblePerson || '-'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">วันที่สั่งการ:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{selectedFindingForDetail.orderDate || '-'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">กรอบเวลา:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {selectedFindingForDetail.deadlineDays ? `${selectedFindingForDetail.deadlineDays} วัน` : '-'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">วันครบกำหนด:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{selectedFindingForDetail.deadlineDate || '-'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">ฐานอ้างอิง:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{selectedFindingForDetail.deadlineBasis || 'ข้อกำหนดที่ใช้บังคับ'}</span>
              </div>
            </div>

            {/* 5 Elements Findings */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>สาระสำคัญของข้อตรวจพบและข้อเสนอแนะ:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {selectedFindingForDetail.condition && (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                    <span className="font-bold text-stone-700 dark:text-stone-300 block mb-1">สภาพที่ตรวจพบ (Condition):</span>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{selectedFindingForDetail.condition}</p>
                  </div>
                )}
                {selectedFindingForDetail.criteria && (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                    <span className="font-bold text-stone-700 dark:text-stone-300 block mb-1">เกณฑ์มาตรฐาน (Criteria):</span>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{selectedFindingForDetail.criteria}</p>
                  </div>
                )}
                {selectedFindingForDetail.cause && (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                    <span className="font-bold text-stone-700 dark:text-stone-300 block mb-1">สาเหตุ (Cause):</span>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{selectedFindingForDetail.cause}</p>
                  </div>
                )}
                {selectedFindingForDetail.effect && (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                    <span className="font-bold text-stone-700 dark:text-stone-300 block mb-1">ผลกระทบ (Effect):</span>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{selectedFindingForDetail.effect}</p>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">ข้อเสนอแนะของผู้ตรวจสอบภายใน (Recommendation):</span>
                <p className="text-stone-800 dark:text-stone-200 leading-relaxed">{selectedFindingForDetail.recommendation}</p>
              </div>

              {selectedFindingForDetail.correctiveAction && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-1">
                  <span className="font-bold text-blue-900 dark:text-blue-200 block">แผนปรับปรุงแก้ไขของหน่วยรับตรวจ (Corrective Action):</span>
                  <p className="text-stone-800 dark:text-stone-200 leading-relaxed">{selectedFindingForDetail.correctiveAction}</p>
                </div>
              )}
            </div>

            {/* Audit Trail & History Timeline */}
            <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>ประวัติการติดตามผลและบันทึกหลักฐาน (Audit Trail):</span>
                </div>
                <span className="text-[10px] text-stone-400">
                  {(selectedFindingForDetail.history || []).length} บันทึก
                </span>
              </div>

              {/* Add New Follow-up Log Form */}
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2">
                <span className="font-bold text-stone-700 dark:text-stone-300 text-[11px] block">
                  + เพิ่มบันทึกการติดตามผล / พยานหลักฐานที่ได้รับ:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="บันทึกความคืบหน้า เช่น ตรวจพบว่าได้นำส่งรายงานแล้ว..."
                    value={newLogNote}
                    onChange={(e) => setNewLogNote(e.target.value)}
                    className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs outline-none"
                  />
                  <input
                    type="text"
                    placeholder="อ้างอิงเอกสารหลักฐาน เช่น ลว. 15 มี.ค. 69..."
                    value={newLogEvidence}
                    onChange={(e) => setNewLogEvidence(e.target.value)}
                    className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs outline-none"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!newLogNote.trim() && !newLogEvidence.trim()}
                    onClick={() => handleAddFollowupLog(selectedFindingForDetail.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                  >
                    บันทึกประวัติการติดตาม
                  </button>
                </div>
              </div>

              {/* History Timeline List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedFindingForDetail.history || []).length === 0 ? (
                  <div className="text-stone-400 text-center py-4">ยังไม่มีบันทึกประวัติเพิ่มเติม</div>
                ) : (
                  selectedFindingForDetail.history.map((h, i) => (
                    <div
                      key={h.id || i}
                      className="p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between text-stone-400 text-[10px]">
                        <span>วันที่: {h.date || h.timestamp?.slice(0, 10)}</span>
                        <span>โดย: {h.changedBy || 'ผู้ตรวจสอบภายใน'}</span>
                      </div>
                      <div className="font-semibold text-stone-800 dark:text-stone-200">
                        {h.note || (h.action === 'status_changed' ? `ปรับสถานะเป็น ${h.toStatus}` : 'บันทึกการติดตาม')}
                      </div>
                      {h.evidence && (
                        <div className="text-blue-600 dark:text-blue-400 text-[10px] flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>หลักฐาน: {h.evidence}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {selectedFindingForDetail.status !== 'completed' ? (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedFindingForDetail.id, 'completed', 'ผู้ตรวจสอบภายในสอบทานหลักฐานและยุติข้อสังเกต')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>รับรองและยุติข้อสังเกต</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedFindingForDetail.id, 'in_progress', 'เปิดประเด็นติดตามผลต่อเนื่อง')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    เปิดการติดตามต่อ
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedFindingForDetail(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD NEW FINDING */}
      {/* ==================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                เพิ่มข้อตรวจพบเพื่อติดตามผล (New Follow-up Finding)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    แหล่งที่มาของข้อค้นพบ:
                  </label>
                  <select
                    value={newItem.source}
                    onChange={(e) => setNewItem({ ...newItem, source: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none font-bold"
                  >
                    <option value="internal">การตรวจสอบภายใน (IA)</option>
                    <option value="oag">สำนักงานการตรวจเงินแผ่นดิน (สตง.)</option>
                    <option value="inspector">ผู้ตรวจราชการ</option>
                    <option value="external">หน่วยงานภายนอกอื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    หน่วยรับตรวจ:
                  </label>
                  <select
                    value={newItem.department}
                    onChange={(e) => setNewItem({ ...newItem, department: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none font-bold"
                  >
                    <option value="สำนักปลัด">สำนักปลัด</option>
                    <option value="กองคลัง">กองคลัง</option>
                    <option value="กองช่าง">กองช่าง</option>
                    <option value="กองการศึกษา">กองการศึกษา</option>
                    <option value="กองสาธารณสุขและสิ่งแวดล้อม">กองสาธารณสุขฯ</option>
                    <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  หัวข้อข้อตรวจพบ / รายการบกพร่อง:
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น การจัดทำบัญชีเงินสดไม่ตรงกับยอดคงเหลือจริง"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ผู้รับผิดชอบดำเนินการ:
                  </label>
                  <input
                    type="text"
                    placeholder={`เช่น ผู้อำนวยการ${newItem.department}`}
                    value={newItem.responsiblePerson}
                    onChange={(e) => setNewItem({ ...newItem, responsiblePerson: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ฐานกำหนดเวลา:
                  </label>
                  <select
                    value={newItem.regime}
                    onChange={(e) => setNewItem({ ...newItem, regime: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none font-bold"
                  >
                    <option value="agency_defined">หน่วยงานกำหนดเอง</option>
                    <option value="moi_30">ผู้ใช้เลือกอ้างอิง มท. (30 วัน)</option>
                    <option value="cgd_60">ผู้ใช้เลือกอ้างอิง กค. (60 วัน)</option>
                  </select>
                </div>
              </div>

              {newItem.regime === 'agency_defined' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">กำหนดเวลา (วัน):</label>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      required
                      value={newItem.deadlineDays}
                      onChange={(e) => setNewItem({ ...newItem, deadlineDays: e.target.value })}
                      className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">ฐาน/เหตุผล:</label>
                    <input
                      type="text"
                      required
                      value={newItem.deadlineBasis}
                      onChange={(e) => setNewItem({ ...newItem, deadlineBasis: e.target.value })}
                      placeholder="เช่น มติ/คำสั่ง/แนวทางหน่วยงาน"
                      className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  วันที่สั่งการ / ได้รับรายงาน:
                </label>
                <input
                  type="date"
                  required
                  value={newItem.orderDate}
                  onChange={(e) => setNewItem({ ...newItem, orderDate: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  ข้อเสนอแนะของผู้ตรวจสอบภายใน:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="ระบุข้อเสนอแนะและแนวทางปรับปรุงแก้ไข"
                  value={newItem.recommendation}
                  onChange={(e) => setNewItem({ ...newItem, recommendation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  พยานหลักฐานที่ต้องจัดส่ง / ตรวจสอบ:
                </label>
                <input
                  type="text"
                  placeholder="เช่น สำเนางบกระทบยอด, คำสั่งแต่งตั้ง, ภาพถ่าย..."
                  value={newItem.evidenceDocs}
                  onChange={(e) => setNewItem({ ...newItem, evidenceDocs: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold cursor-pointer shadow-xs"
                >
                  บันทึกลงทะเบียนคุม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
