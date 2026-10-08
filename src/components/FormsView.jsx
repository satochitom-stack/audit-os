import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  FileText,
  Copy,
  Check,
  FolderOpen,
  ExternalLink,
  Download,
  Eye,
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Filter,
  FileCheck2,
  Send
} from 'lucide-react';

export default function FormsView({
  formsBase = [],
  onUpdateFormsBase,
  orgProfile = {},
  session,
  setCurrentTab
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const isAdmin = session?.role === 'admin';

  // New Form Document Form State
  const [newDoc, setNewDoc] = useState({
    category: 'การบริหารความเสี่ยง',
    code: '',
    title: '',
    topic: '',
    summary: '',
    fileRef: '',
    fileUrl: '',
    fileType: 'PDF',
    fileSize: ''
  });

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'การบริหารความเสี่ยง', label: 'การบริหารความเสี่ยง' },
    { id: 'การควบคุมภายใน', label: 'การควบคุมภายใน' },
    { id: 'พัสดุและสัญญา', label: 'พัสดุและสัญญา' },
    { id: 'การเงินและการคลัง', label: 'การเงินและการคลัง' },
    { id: 'งานตรวจสอบภายใน', label: 'งานตรวจสอบภายใน' },
    { id: 'ทั่วไป', label: 'ทั่วไป' }
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredItems = useMemo(() => {
    return (formsBase || []).filter((item) => {
      const matchCat =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = (searchTerm || '').toLowerCase();
      const matchSearch =
        (item.title || '').toLowerCase().includes(q) ||
        (item.code || '').toLowerCase().includes(q) ||
        (item.topic || '').toLowerCase().includes(q) ||
        (item.summary || '').toLowerCase().includes(q) ||
        (item.fileRef || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [formsBase, selectedCategory, searchTerm]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('คัดลอกชื่อแบบฟอร์มเรียบร้อยแล้ว');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    let fileType = 'PDF';
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) fileType = 'WORD';
    else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) fileType = 'EXCEL';

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewDoc((prev) => ({
        ...prev,
        fileUrl: event.target.result,
        fileRef: file.name,
        fileSize: sizeStr,
        fileType,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDoc.title.trim()) {
      alert('กรุณาระบุชื่อแบบฟอร์ม');
      return;
    }

    const docToAdd = {
      id: `FORM-CUSTOM-${Date.now()}`,
      category: newDoc.category,
      code: newDoc.code.trim() || 'แบบฟอร์ม',
      title: newDoc.title.trim(),
      topic: newDoc.topic.trim() || newDoc.title.trim(),
      summary: newDoc.summary.trim() || 'แบบฟอร์มมาตรฐานสำหรับปฏิบัติงาน',
      fileRef: newDoc.fileRef || 'ไฟล์แนบระบบ',
      fileUrl: newDoc.fileUrl || '',
      downloadUrl: newDoc.fileUrl || '',
      fileType: newDoc.fileType || 'PDF',
      fileSize: newDoc.fileSize || 'ไฟล์แนบ',
      date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
      isCustom: true
    };

    if (onUpdateFormsBase) {
      onUpdateFormsBase((prev) => [docToAdd, ...prev]);
      showToast('เพิ่มแบบฟอร์มใหม่เรียบร้อยแล้ว');
    }

    setIsAddModalOpen(false);
    setNewDoc({
      category: 'การบริหารความเสี่ยง',
      code: '',
      title: '',
      topic: '',
      summary: '',
      fileRef: '',
      fileUrl: '',
      fileType: 'PDF',
      fileSize: ''
    });
  };

  const handleDeleteDocument = (id, title) => {
    if (window.confirm(`ยืนยันการลบแบบฟอร์ม "${title}" หรือไม่?`)) {
      if (onUpdateFormsBase) {
        onUpdateFormsBase((prev) => prev.filter((item) => item.id !== id));
        showToast('ลบแบบฟอร์มเรียบร้อยแล้ว');
      }
    }
  };

  const isPdf = (url) => {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf') || url.startsWith('data:application/pdf');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Search Bar */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 rounded-3xl p-6 sm:p-7 border border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold mb-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>คลังแบบฟอร์มมาตรฐาน (Forms Library)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              คลังเอกสารและแบบฟอร์มมาตรฐาน อปท.
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
              รวบรวมแบบฟอร์มทางการ แบบรายงาน และเอกสารแม่แบบสำหรับองค์กรปกครองส่วนท้องถิ่น สามารถเปิดอ่านเอกสารตัวจริงได้ทันทีในระบบโดยไม่ต้องดาวน์โหลด
            </p>
          </div>

          {/* Admin Upload Button */}
          {isAdmin && (
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มแบบฟอร์ม / อัปโหลดไฟล์</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-800">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 text-amber-300 border border-stone-700 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>ทั้งหมด {formsBase.length} ฉบับ</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-xs font-semibold">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>พร้อมเปิดอ่านและดาวน์โหลดทุกรายการ</span>
          </span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800 text-xs font-semibold">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>พบ {filteredItems.length} รายการจากการค้นหา</span>
            </span>
          )}
        </div>

        {/* Search & Categories Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="พิมพ์คำค้นหา เช่น ว 3482, บส. 1, การบริหารความเสี่ยง, ปค. 4, จัดซื้อจัดจ้าง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-700 focus:ring-2 focus:ring-amber-500 outline-none text-xs bg-stone-900/90 text-stone-100 placeholder-stone-400"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const isCopied = copiedId === item.id;
          const activeFileUrl = item.fileUrl || item.downloadUrl;
          const isPdfFile = isPdf(activeFileUrl);

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                {/* Category & Format Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      {item.category}
                    </span>
                    {item.code && (
                      <span className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-[10px] px-2 py-0.5 rounded-md font-bold">
                        {item.code}
                      </span>
                    )}
                    {item.fileType && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          item.fileType.includes('WORD')
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                            : item.fileType.includes('EXCEL')
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                        }`}
                      >
                        {item.fileType} {item.fileSize ? `(${item.fileSize})` : ''}
                      </span>
                    )}
                    {item.pageCount && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 font-semibold">
                        {item.pageCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleCopy(item.id, `${item.title} - ${item.topic}`)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      title="คัดลอกชื่อแบบฟอร์ม"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {isAdmin && (item.isCustom || !item.isOfficial) && (
                      <button
                        onClick={() => handleDeleteDocument(item.id, item.title)}
                        className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="ลบแบบฟอร์มนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Topic */}
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h3>
                  {item.topic && (
                    <div className="text-xs font-semibold text-amber-800 dark:text-amber-400 mt-1">
                      เรื่อง: {item.topic}
                    </div>
                  )}
                </div>

                {/* Summary Box */}
                {item.summary && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-950/60 p-3 rounded-xl border border-stone-100 dark:border-stone-800/80 leading-relaxed">
                    {item.summary}
                  </p>
                )}
              </div>

              {/* Footer File Reference & Actions */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-400 gap-2.5">
                <div
                  className="flex items-center text-stone-500 dark:text-stone-400 font-mono text-[11px] truncate max-w-full sm:max-w-[210px]"
                  title={item.fileRef}
                >
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
                  <span className="truncate">{item.fileRef || 'ไฟล์แนบ'}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {/* Preview Button for PDFs (เปิดอ่านได้โดยไม่ต้องดาวน์โหลด) */}
                  {isPdfFile && activeFileUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="เปิดดูเอกสารตัวเต็มในระบบโดยไม่ต้องดาวน์โหลด"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>เปิดอ่าน</span>
                    </button>
                  )}

                  {/* Primary Download Button */}
                  {activeFileUrl ? (
                    <a
                      href={activeFileUrl}
                      download={item.fileRef || `${item.id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                      title="ดาวน์โหลดไฟล์ลงเครื่อง"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {item.fileType?.includes('WORD')
                          ? 'ดาวน์โหลด Word'
                          : item.fileType?.includes('EXCEL')
                          ? 'ดาวน์โหลด Excel'
                          : 'ดาวน์โหลด'}
                      </span>
                    </a>
                  ) : (
                    <span className="text-stone-400 dark:text-stone-500 text-[11px]">
                      ไม่มีไฟล์แนบ
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center border border-stone-200/80 dark:border-stone-800 text-stone-500 dark:text-stone-400 space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto" />
          <div className="text-base font-bold text-stone-700 dark:text-stone-200">ไม่พบแบบฟอร์มที่ค้นหา</div>
          <div className="text-xs max-w-sm mx-auto">
            ลองค้นหาด้วยคำสำคัญอื่น เช่น <strong>ว 3482</strong>, <strong>การบริหารความเสี่ยง</strong> หรือกดเลือกหมวดหมู่ <strong>"ทั้งหมด"</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-amber-50 dark:bg-stone-800 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-amber-100"
          >
            ล้างคำค้นหาทั้งหมด
          </button>
        </div>
      )}

      {/* =========================================================================
          PDF PREVIEW MODAL (เปิดดูเอกสารได้โดยตรงโดยไม่ต้องดาวน์โหลด)
      ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-stone-200/80 dark:border-stone-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50 dark:bg-stone-850">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCheck2 className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                    {previewDoc.title}
                  </h3>
                  {previewDoc.topic && (
                    <p className="text-[11px] text-amber-800 dark:text-amber-400 truncate">
                      {previewDoc.topic}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.fileUrl || previewDoc.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="เปิดในแท็บใหม่"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">เปิดในแท็บใหม่</span>
                </a>

                <a
                  href={previewDoc.fileUrl || previewDoc.downloadUrl}
                  download={previewDoc.fileRef || `${previewDoc.id}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดไฟล์</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Iframe */}
            <div className="flex-1 bg-stone-100 dark:bg-stone-950 p-2 overflow-hidden flex flex-col">
              <iframe
                src={`${previewDoc.fileUrl || previewDoc.downloadUrl}#toolbar=1&navpanes=1`}
                className="w-full h-full rounded-lg border border-stone-300 dark:border-stone-800 bg-white"
                title={previewDoc.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN ADD / UPLOAD FORM MODAL (เฉพาะ ADMIN เท่านั้น)
      ========================================================================= */}
      {isAdmin && isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden my-8">
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-850">
              <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-bold">
                <Plus className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span>เพิ่มแบบฟอร์มมาตรฐานใหม่ (สำหรับ ADMIN)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    หมวดหมู่แบบฟอร์ม <span className="text-rose-500">*</span>:
                  </label>
                  <select
                    value={newDoc.category}
                    onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-bold"
                  >
                    {categories
                      .filter((c) => c.id !== 'all')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    รหัส / เลขที่แบบฟอร์ม:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ว 3482 หรือ บส. 1"
                    value={newDoc.code}
                    onChange={(e) => setNewDoc({ ...newDoc, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  ชื่อแบบฟอร์ม <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น แบบรายงานการบริหารจัดการความเสี่ยง..."
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  ชื่อเรื่อง / อ้างอิงหนังสือสั่งการ:
                </label>
                <input
                  type="text"
                  placeholder="เช่น หนังสือกระทรวงมหาดไทย ด่วนที่สุด ที่ มท..."
                  value={newDoc.topic}
                  onChange={(e) => setNewDoc({ ...newDoc, topic: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  คำอธิบายสรุปสาระสำคัญ:
                </label>
                <textarea
                  rows="3"
                  placeholder="สรุปวัตถุประสงค์และการนำแบบฟอร์มนี้ไปใช้งาน..."
                  value={newDoc.summary}
                  onChange={(e) => setNewDoc({ ...newDoc, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* File Upload Box */}
              <div className="p-3.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <label className="block text-stone-800 dark:text-stone-200 font-bold">
                  อัปโหลดไฟล์เอกสารจากเครื่อง (PDF, Word, Excel):
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-stone-600 dark:text-stone-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-700 file:text-white hover:file:bg-amber-600 cursor-pointer"
                />
                {newDoc.fileRef && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      แนบไฟล์: {newDoc.fileRef} ({newDoc.fileSize}) - {newDoc.fileType}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-200/80 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกแบบฟอร์ม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
