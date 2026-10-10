import React, { useState, useMemo } from 'react';
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
  Award
} from 'lucide-react';
import { DLA_FOLLOWUP_REGISTER_6, DLA_FOLLOWUP_MEMO_TEMPLATE } from '../data/dlaStandardTemplates';
import OfficialThaiMemo from './OfficialThaiMemo';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDocumentToWord, exportThaiMemoToWord, exportDataToExcel } from '../utils/documentExportUtils';

export default function AuditFollowUpView({
  selectedYear = '2569',
  orgProfile = {},
  capaFindings = [],
  setCapaFindings
}) {
  const [activeTab, setActiveTab] = useState('register'); // 'register', 'memo'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regimeFilter, setRegimeFilter] = useState('all'); // 'all', 'moi_30', 'cgd_60'
  const [selectedFindingForMemo, setSelectedFindingForMemo] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Helper to add days to a date string YYYY-MM-DD
  const addDays = (dateStr, days) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  // Helper to calculate days remaining
  const calculateDaysRemaining = (deadlineStr) => {
    try {
      if (!deadlineStr) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(deadlineStr);
      deadline.setHours(0, 0, 0, 0);
      const diffTime = deadline - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Default register findings
  const defaultItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'CAPA-FOLLOW-01',
        title: 'การจัดทำงบกระทบยอดเงินฝากธนาคารล่าช้า',
        department: 'กองคลัง',
        reportedDate: '2569-01-10',
        orderDate: '2569-01-15',
        regime: 'moi_30', // 'moi_30' or 'cgd_60'
        deadlineDate: '2569-02-14',
        recommendation: 'ให้กองคลังเร่งรัดจัดทำงบกระทบยอดเงินฝากธนาคารทุกบัญชีเป็นประจำทุกสิ้นเดือนและรายงานผู้บริหารภายใน 15 วัน',
        status: 'overdue', // 'completed', 'in_progress', 'urgent', 'overdue'
        progressNotes: 'กองคลังได้จัดทำงบกระทบยอดของเดือน ม.ค. แล้วเสร็จ อยู่ระหว่างดำเนินการของเดือน ก.พ.',
        updatedAt: '2569-03-01'
      },
      {
        id: 'CAPA-FOLLOW-02',
        title: 'การลงบันทึกการใช้รถยนต์ส่วนกลางไม่ครบถ้วน',
        department: 'สำนักปลัด',
        reportedDate: '2569-02-01',
        orderDate: '2569-02-05',
        regime: 'moi_30',
        deadlineDate: '2569-03-07',
        recommendation: 'กำชับพนักงานขับรถให้ลงบันทึกเลขไมล์เริ่มต้น-สิ้นสุด และคำนวณอัตราสิ้นเปลืองน้ำมันเชื้อเพลิงทุกครั้ง',
        status: 'completed',
        progressNotes: 'สำนักปลัดได้จัดประชุมกำชับพนักงานขับรถ และผู้ควบคุมรถได้ตรวจเช็คสมุดบันทึกประจำรถทุกสัปดาห์แล้ว',
        updatedAt: '2569-02-25'
      },
      {
        id: 'CAPA-FOLLOW-03',
        title: 'การจัดทำทะเบียนคุมสินทรัพย์และครุภัณฑ์ยังไม่เป็นปัจจุบัน',
        department: 'กองช่าง',
        reportedDate: '2569-02-10',
        orderDate: '2569-02-15',
        regime: 'cgd_60', // หลักเกณฑ์ กค. 60 วัน
        deadlineDate: '2569-04-16',
        recommendation: 'ให้กองช่างประสานกองคลังเพื่อปรับปรุงฐานข้อมูลสินทรัพย์และสำรวจครุภัณฑ์จริงให้ตรงกับทะเบียนคุม',
        status: 'in_progress',
        progressNotes: 'อยู่ระหว่างการสำรวจสภาพครุภัณฑ์จริงภาคสนามร่วมกับงานพัสดุ',
        updatedAt: '2569-03-05'
      }
    ];
  }, []);

  const [registerItems, setRegisterItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`ia_followup_register_${selectedYear}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return defaultItems;
  });

  const saveRegister = (items) => {
    setRegisterItems(items);
    localStorage.setItem(`ia_followup_register_${selectedYear}`, JSON.stringify(items));
  };

  const handleUpdateStatus = (id, newStatus) => {
    const updated = registerItems.map((item) =>
      item.id === id ? { ...item, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] } : item
    );
    saveRegister(updated);
  };

  const handleUpdateRegime = (id, newRegime) => {
    const updated = registerItems.map((item) => {
      if (item.id === id) {
        const days = newRegime === 'cgd_60' ? 60 : 30;
        const newDeadline = addDays(item.orderDate || new Date().toISOString().split('T')[0], days);
        return {
          ...item,
          regime: newRegime,
          deadlineDate: newDeadline,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });
    saveRegister(updated);
  };

  const handleUpdateNotes = (id, notes) => {
    const updated = registerItems.map((item) =>
      item.id === id ? { ...item, progressNotes: notes, updatedAt: new Date().toISOString().split('T')[0] } : item
    );
    saveRegister(updated);
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('ต้องการลบรายการติดตามผลนี้ใช่หรือไม่?')) {
      const updated = registerItems.filter((item) => item.id !== id);
      saveRegister(updated);
    }
  };

  const handleSelectForMemo = (item) => {
    setSelectedFindingForMemo(item);
    setActiveTab('memo');
  };

  // New item form state
  const [newItem, setNewItem] = useState({
    title: '',
    department: 'กองคลัง',
    orderDate: new Date().toISOString().split('T')[0],
    regime: 'moi_30',
    recommendation: '',
    progressNotes: ''
  });

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;

    const days = newItem.regime === 'cgd_60' ? 60 : 30;
    const deadlineDate = addDays(newItem.orderDate, days);

    const item = {
      id: `CAPA-FOLLOW-${Date.now().toString().slice(-4)}`,
      title: newItem.title,
      department: newItem.department,
      reportedDate: newItem.orderDate,
      orderDate: newItem.orderDate,
      regime: newItem.regime,
      deadlineDate: deadlineDate,
      recommendation: newItem.recommendation,
      status: 'in_progress',
      progressNotes: newItem.progressNotes || 'อยู่ระหว่างหน่วยรับตรวจจัดทำรายงานผล',
      updatedAt: new Date().toISOString().split('T')[0]
    };

    const updated = [item, ...registerItems];
    saveRegister(updated);
    setShowAddModal(false);
    setNewItem({
      title: '',
      department: 'กองคลัง',
      orderDate: new Date().toISOString().split('T')[0],
      regime: 'moi_30',
      recommendation: '',
      progressNotes: ''
    });
  };

  const handleLoadDlaFollowupRegister = () => {
    const today = new Date().toISOString().split('T')[0];
    const formatted = DLA_FOLLOWUP_REGISTER_6.map((dla) => ({
      id: dla.id,
      title: dla.finding,
      department: dla.department,
      reportedDate: '2569-01-15',
      orderDate: '2569-01-20',
      regime: 'moi_30',
      deadlineDate: addDays('2569-01-20', 30),
      recommendation: dla.recommendation,
      status: dla.status === 'ยุติข้อสังเกต' ? 'completed' : 'in_progress',
      progressNotes: `การดำเนินการ: ${dla.correctiveAction} (เป้าหมาย: ${dla.targetDate})`,
      updatedAt: today
    }));
    saveRegister(formatted);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return registerItems.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recommendation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRegime = regimeFilter === 'all' || item.regime === regimeFilter;

      let matchStatus = true;
      if (statusFilter !== 'all') {
        matchStatus = item.status === statusFilter;
      }

      return matchSearch && matchRegime && matchStatus;
    });
  }, [registerItems, searchTerm, regimeFilter, statusFilter]);

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
  const isCgdRegime = currentMemoItem.regime === 'cgd_60';

  const handleDownloadWord = () => {
    if (activeTab === 'memo') {
      const memoData = {
        agency: `${orgProfile?.agencyName || 'หน่วยตรวจสอบภายใน'} ${orgProfile?.name || 'อปท.'}`,
        docNumber: `มท ๐๘๐๘/${selectedYear}/ว...`,
        date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
        subject: `ติดตามผลการดำเนินการตามข้อเสนอแนะการตรวจสอบภายใน ครบกำหนด ${isCgdRegime ? '๖๐ วัน' : '๓๐ วัน'}`,
        to: `ผู้อำนวยการ${currentMemoItem.department || 'หน่วยรับตรวจ'}`,
        content: `
          <p style="text-indent: 2.5cm; margin-bottom: 8pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
            ตามที่ หน่วยตรวจสอบภายในได้รายงานผลการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. ${selectedYear} ในภารกิจ "${currentMemoItem.title}" และ นายก${orgProfile?.name || 'อปท.'} ได้มีข้อสั่งการเมื่อวันที่ ${currentMemoItem.orderDate || '...'} ให้หน่วยงานของท่านดำเนินการปรับปรุงแก้ไขข้อบกพร่องตามข้อเสนอแนะภายในกำหนด ${isCgdRegime ? '๖๐ วัน' : '๓๐ วัน'} นั้น
          </p>
          <p style="text-indent: 2.5cm; margin-bottom: 8pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
            บัดนี้ ได้ครบกำหนดระยะเวลา ${isCgdRegime ? '๖๐ วัน' : '๓๐ วัน'} แล้ว (ครบกำหนดวันที่ ${currentMemoItem.deadlineDate || '...'}) เพื่อให้การติดตามผลการตรวจสอบภายในเป็นไปตาม ${isCgdRegime ? 'หลักเกณฑ์ปฏิบัติการตรวจสอบภายในสำหรับหน่วยงานของรัฐ พ.ศ. ๒๕๖๑ และที่แก้ไขเพิ่มเติม (ฉบับที่ ๔) พ.ศ. ๒๕๖๖' : 'ระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. ๒๕๔๕ ข้อ ๒๑'} หน่วยตรวจสอบภายในจึงขอติดตามผลความคืบหน้าการปรับปรุงแก้ไขในประเด็นดังกล่าว
          </p>
          <div style="margin: 10pt 0; padding: 8pt; border: 1pt solid #ccc; font-family: 'TH Sarabun PSK';">
            <p style="margin: 0; font-weight: bold; font-size: 16pt;">ข้อเสนอแนะที่ต้องติดตาม:</p>
            <p style="margin: 4pt 0 0 0; font-size: 16pt;">${currentMemoItem.recommendation || '-'}</p>
          </div>
          <p style="text-indent: 2.5cm; margin-top: 10pt; margin-bottom: 16pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
            จึงเรียนมาเพื่อโปรดรายงานผลการดำเนินการพร้อมแนบเอกสารหลักฐานที่เกี่ยวข้อง ส่งกลับมายังหน่วยตรวจสอบภายในภายใน ๗ วันทำการ เพื่อรวบรวมรายงานต่อนายก${orgProfile?.name || 'อปท.'} ต่อไป
          </p>
        `,
        signatoryName: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน',
        signatoryPosition: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน',
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
              <p style="margin: 4pt 0 0 0; font-weight: bold;">(${orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})</p>
              <p style="margin: 2pt 0 0 0;">${orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}</p>
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
      item.regime === 'cgd_60' ? 'เกณฑ์ กค. 60 วัน' : 'ระเบียบ มท. 30 วัน',
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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs print:hidden">
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
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              ทะเบียนคุม & การติดตามผลข้อเสนอแนะ (Harmonized Audit Follow-up)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleLoadDlaFollowupRegister}
              className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
              title="โหลดทะเบียนติดตามผล 6 ภารกิจหลักมาตรฐาน อปท. ตามคู่มือ สถ. หน้า 53"
            >
              <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>📥 โหลดทะเบียน 6 ภารกิจ (คู่มือ สถ.)</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มข้อตรวจพบเพื่อติดตาม</span>
            </button>
            <OfficialDocActionToolbar
              onDownloadWord={handleDownloadWord}
              onDownloadExcel={handleDownloadExcel}
              onPrint={() => window.print()}
              wordTooltip={
                activeTab === 'memo'
                  ? 'ดาวน์โหลดหนังสือเตือนติดตามผลเป็นไฟล์ Word (.doc)'
                  : 'ดาวน์โหลดทะเบียนคุมติดตามผลเป็นไฟล์ Word (.doc)'
              }
              excelTooltip="ส่งออกทะเบียนคุมติดตามผลเป็นไฟล์ Excel (.xlsx)"
              printTooltip="พิมพ์ทะเบียนคุม / หนังสือติดตามผล / บันทึกเป็น PDF"
            />
          </div>
        </div>
      </div>

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
            <div className="text-amber-800 dark:text-amber-300">🏛️ มท. 2545: 30 วัน</div>
            <div className="text-stone-700 dark:text-stone-300">💼 กค. 2561: 60 วัน</div>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-2 border border-stone-200/80 dark:border-stone-800 shadow-xs flex space-x-2 print:hidden">
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
          <span>บันทึกข้อความติดตามผล (เตือนครบกำหนด 30/60 วัน)</span>
        </button>
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
                  placeholder="ค้นหาข้อตรวจพบ, หน่วยงาน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none w-56"
                />
              </div>

              {/* Regime Filter */}
              <select
                value={regimeFilter}
                onChange={(e) => setRegimeFilter(e.target.value)}
                className="text-xs p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold outline-none cursor-pointer"
              >
                <option value="all">ทุกกรอบเวลา (มท. 30 วัน & กค. 60 วัน)</option>
                <option value="moi_30">ระเบียบ มท. (30 วัน)</option>
                <option value="cgd_60">หลักเกณฑ์ กค. (60 วัน)</option>
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
                <option value="completed">ดำเนินการเสร็จสิ้น</option>
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
                  <th className="py-3 px-3">ประเด็นข้อตรวจพบ / ข้อเสนอแนะ</th>
                  <th className="py-3 px-3 w-28">หน่วยรับตรวจ</th>
                  <th className="py-3 px-3 w-40">กรอบเวลา & วันครบกำหนด</th>
                  <th className="py-3 px-3">ความคืบหน้า / การดำเนินการ</th>
                  <th className="py-3 px-3 w-36">สถานะการติดตาม</th>
                  <th className="py-3 px-3 text-right w-36 print:hidden">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredItems.map((item, idx) => {
                  const daysLeft = calculateDaysRemaining(item.deadlineDate);

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-stone-400">{idx + 1}</td>
                      <td className="py-3 px-3 max-w-xs space-y-1">
                        <div className="font-bold text-stone-900 dark:text-stone-100 leading-snug">{item.title}</div>
                        <div className="text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed line-clamp-2">{item.recommendation}</div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-amber-800 dark:text-amber-300">
                        {item.department}
                      </td>

                      <td className="py-3 px-3 space-y-1">
                        <div className="flex items-center space-x-1">
                          <select
                            value={item.regime || 'moi_30'}
                            onChange={(e) => handleUpdateRegime(item.id, e.target.value)}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 outline-none cursor-pointer"
                          >
                            <option value="moi_30">มท. 30 วัน</option>
                            <option value="cgd_60">กค. 60 วัน</option>
                          </select>
                        </div>
                        <div className="font-mono font-bold text-stone-800 dark:text-stone-200">
                          {item.deadlineDate}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          สั่งการ: {item.orderDate}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <textarea
                          rows={2}
                          value={item.progressNotes}
                          onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                          className="w-full text-[11px] p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800 text-stone-800 dark:text-stone-200 leading-relaxed print:border-none focus:ring-1 focus:ring-amber-500 outline-none"
                        />
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
                          <option value="completed">เสร็จสิ้นสมบูรณ์</option>
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
            subject={`ติดตามผลการดำเนินการตามข้อเสนอแนะการตรวจสอบภายใน ครบกำหนด ${isCgdRegime ? '๖๐ วัน' : '๓๐ วัน'}`}
            to={`ผู้อำนวยการ${currentMemoItem.department || 'หน่วยรับตรวจ'}`}
            signatory={{
              name: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน',
              position: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน',
              role: `หน่วยตรวจสอบภายใน ${orgProfile?.name || 'อปท.'}`
            }}
            showReviewBoxes={false}
          >
            <p className="indent-10 text-justify leading-relaxed">
              ตามที่ หน่วยตรวจสอบภายในได้รายงานผลการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. {selectedYear} ในภารกิจ "{currentMemoItem.title}" และ นายก{orgProfile?.name || 'อปท.'} ได้มีข้อสั่งการเมื่อวันที่ {currentMemoItem.orderDate || '...'} ให้หน่วยงานของท่านดำเนินการปรับปรุงแก้ไขข้อบกพร่องตามข้อเสนอแนะภายในกำหนด {isCgdRegime ? '๖๐ วัน' : '๓๐ วัน'} นั้น
            </p>
            <p className="indent-10 text-justify leading-relaxed">
              บัดนี้ ได้ครบกำหนดระยะเวลา {isCgdRegime ? '๖๐ วัน' : '๓๐ วัน'} แล้ว (ครบกำหนดวันที่ {currentMemoItem.deadlineDate || '...'}) เพื่อให้การติดตามผลการตรวจสอบภายในเป็นไปตาม {isCgdRegime ? 'หลักเกณฑ์ปฏิบัติการตรวจสอบภายในสำหรับหน่วยงานของรัฐ พ.ศ. ๒๕๖๑ และที่แก้ไขเพิ่มเติม (ฉบับที่ ๔) พ.ศ. ๒๕๖๖' : 'ระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. ๒๕๔๕ ข้อ ๒๑'} หน่วยตรวจสอบภายในจึงขอติดตามผลความคืบหน้าการปรับปรุงแก้ไขในประเด็นดังกล่าว
            </p>
            <div className="p-3.5 bg-stone-50 border border-stone-300 rounded-none space-y-1">
              <div className="font-bold text-black">ข้อเสนอแนะที่ต้องติดตาม:</div>
              <div className="text-stone-900 whitespace-pre-line leading-relaxed">{currentMemoItem.recommendation}</div>
            </div>
            <p className="indent-10 text-justify leading-relaxed pt-2">
              จึงเรียนมาเพื่อโปรดรายงานผลการดำเนินการพร้อมแนบเอกสารหลักฐานที่เกี่ยวข้อง ส่งกลับมายังหน่วยตรวจสอบภายในภายใน ๗ วันทำการ เพื่อรวบรวมรายงานต่อนายก{orgProfile?.name || 'อปท.'} ต่อไป
            </p>
          </OfficialThaiMemo>
        </div>
      )}

      {/* Modal Add New Finding */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-xl space-y-4">
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

            <form onSubmit={handleAddNewItem} className="space-y-3.5 text-xs">
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
                    หน่วยรับตรวจ:
                  </label>
                  <select
                    value={newItem.department}
                    onChange={(e) => setNewItem({ ...newItem, department: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                  >
                    <option value="สำนักปลัด">สำนักปลัด</option>
                    <option value="กองคลัง">กองคลัง</option>
                    <option value="กองช่าง">กองช่าง</option>
                    <option value="กองการศึกษา">กองการศึกษา</option>
                    <option value="กองสาธารณสุขและสิ่งแวดล้อม">กองสาธารณสุขฯ</option>
                    <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    กรอบเวลากฎหมาย:
                  </label>
                  <select
                    value={newItem.regime}
                    onChange={(e) => setNewItem({ ...newItem, regime: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none font-bold"
                  >
                    <option value="moi_30">ระเบียบ มท. (30 วัน)</option>
                    <option value="cgd_60">หลักเกณฑ์ กค. (60 วัน)</option>
                  </select>
                </div>
              </div>

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
