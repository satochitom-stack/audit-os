import React, { useState, useMemo } from 'react';
import {
  BookOpen,
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
  Sparkles,
  FileSpreadsheet,
  Calendar,
  Layers,
  Filter
} from 'lucide-react';

export default function KnowledgeView({
  knowledgeBase = [],
  onUpdateKnowledgeBase,
  orgProfile,
  session
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const isAdmin = session?.role === 'admin';

  // New Document Form State
  const [newDoc, setNewDoc] = useState({
    category: 'หนังสือสั่งการ (ว)',
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
    { id: 'หนังสือสั่งการ (ว)', label: 'หนังสือสั่งการ (ว)' },
    { id: 'กฎหมายหลัก', label: 'พ.ร.บ. / กฎหมายหลัก' },
    { id: 'ระเบียบ มท.', label: 'ระเบียบ มท.' },
    { id: 'แนวทางปฏิบัติ', label: 'แนวทางปฏิบัติ' }
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredItems = useMemo(() => {
    return knowledgeBase.filter((item) => {
      const matchCat =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = (searchTerm || '').toLowerCase();
      const matchSearch =
        (item.title || '').toLowerCase().includes(q) ||
        (item.topic || '').toLowerCase().includes(q) ||
        (item.summary || '').toLowerCase().includes(q) ||
        (item.fileRef || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [knowledgeBase, selectedCategory, searchTerm]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('คัดลอกชื่อระเบียบเรียบร้อยแล้ว');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    let fileType = 'PDF';
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) fileType = 'WORD';
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) fileType = 'EXCEL';

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewDoc((prev) => ({
        ...prev,
        fileUrl: event.target.result,
        fileRef: file.name,
        fileSize: sizeStr,
        fileType
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDoc.title.trim()) {
      alert('กรุณาระบุชื่อหนังสือหรือระเบียบ');
      return;
    }

    const docToAdd = {
      id: `KNOW-CUSTOM-${Date.now()}`,
      category: newDoc.category,
      title: newDoc.title.trim(),
      topic: newDoc.topic.trim() || newDoc.title.trim(),
      summary: newDoc.summary.trim() || 'เอกสารระเบียบปฏิบัติงาน',
      fileRef: newDoc.fileRef || 'ไฟล์แนบระบบ',
      fileUrl: newDoc.fileUrl || '',
      downloadUrl: newDoc.fileUrl || '',
      fileType: newDoc.fileType || 'PDF',
      fileSize: newDoc.fileSize || 'ไฟล์แนบ',
      isCustom: true
    };

    if (onUpdateKnowledgeBase) {
      onUpdateKnowledgeBase((prev) => [docToAdd, ...prev]);
      showToast('เพิ่มเอกสารระเบียบเรียบร้อยแล้ว');
    }

    setIsAddModalOpen(false);
    setNewDoc({
      category: 'หนังสือสั่งการ (ว)',
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
    if (window.confirm(`ยืนยันการลบระเบียบ "${title}" หรือไม่?`)) {
      if (onUpdateKnowledgeBase) {
        onUpdateKnowledgeBase((prev) => prev.filter((item) => item.id !== id));
        showToast('ลบระเบียบเรียบร้อยแล้ว');
      }
    }
  };

  // Helper to detect if a file is previewable in iframe (like PDF)
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-cyan-400 mb-1">
              <BookOpen className="w-4 h-4" />
              <span>คลังระเบียบ กฎหมาย และหนังสือสั่งการ (Knowledge Base)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              สืบค้นข้อระเบียบและแนวทางปฏิบัติงานตรวจสอบภายใน
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>เชื่อมโยงไฟล์ตรงจากคลังเอกสาร</span>
              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 font-mono text-[11px]">
                D:\งานตรวจสอบภายใน\เอกสารความรู้-เอกสารตัวอย่าง
              </code>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มระเบียบ / อัปโหลดไฟล์</span>
            </button>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>ทั้งหมด {knowledgeBase.length} ฉบับ</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 text-xs font-semibold">
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>พร้อมเปิดอ่านและดาวน์โหลดทุกรายการ</span>
          </span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 text-xs font-semibold">
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>พบ {filteredItems.length} รายการจากการค้นหา</span>
            </span>
          )}
        </div>

        {/* Search & Categories Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="พิมพ์คำค้นหา เช่น ว 119, ว 257, ยืมเงิน, ค่าเช่าบ้าน, จัดซื้อจัดจ้าง, ค่ารักษาพยาบาล, ปค.4..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-slate-50/50 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
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
          const activeFileUrl2 = item.fileUrl2;
          const isPdfFile = isPdf(activeFileUrl);

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                {/* Category & Format Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      {item.category}
                    </span>
                    {item.fileType && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        item.fileType.includes('WORD')
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                          : item.fileType.includes('EXCEL')
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                      }`}>
                        {item.fileType} {item.fileSize ? `(${item.fileSize})` : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleCopy(item.id, `${item.title} - ${item.topic}`)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="คัดลอกชื่อหนังสือ/ระเบียบ"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {isAdmin && item.isCustom && (
                      <button
                        onClick={() => handleDeleteDocument(item.id, item.title)}
                        className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="ลบระเบียบนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Topic */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-xs font-semibold text-blue-700 dark:text-cyan-300 mt-1">
                    เรื่อง: {item.topic}
                  </div>
                </div>

                {/* Summary Box */}
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Footer File Reference & Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2.5">
                <div className="flex items-center text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate max-w-full sm:max-w-[210px]" title={item.fileRef}>
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-blue-500 shrink-0" />
                  <span className="truncate">{item.fileRef || 'ไฟล์แนบ'}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {/* Preview Button for PDFs */}
                  {isPdfFile && activeFileUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold transition-all cursor-pointer"
                      title="เปิดดูเอกสารตัวเต็มในระบบ"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                      title="ดาวน์โหลดไฟล์ลงเครื่อง"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{item.fileType?.includes('WORD') ? 'ดาวน์โหลด Word' : 'ดาวน์โหลด'}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      ไม่มีไฟล์แนบ
                    </span>
                  )}

                  {/* Secondary File Download (e.g. Excel) */}
                  {activeFileUrl2 && (
                    <a
                      href={activeFileUrl2}
                      download={`เอกสารแนบ_${item.id}.xlsx`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                      title="ดาวน์โหลดไฟล์ Excel แนบ"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <div className="text-base font-bold text-slate-700 dark:text-slate-200">ไม่พบระเบียบที่ค้นหา</div>
          <div className="text-xs max-w-sm mx-auto">
            ลองค้นหาด้วยคำสำคัญอื่น เช่น <strong>ว 119</strong>, <strong>ยืมเงิน</strong>, <strong>ค่าเช่าบ้าน</strong>, หรือกดเลือกหมวดหมู่ <strong>"ทั้งหมด"</strong>
          </div>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
            className="px-4 py-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400 text-xs font-bold rounded-xl cursor-pointer hover:bg-blue-100"
          >
            ล้างคำค้นหาทั้งหมด
          </button>
        </div>
      )}

      {/* =========================================================================
          PDF PREVIEW MODAL
      ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {previewDoc.title}
                  </h3>
                  <p className="text-[11px] text-blue-600 dark:text-cyan-400 truncate">
                    เรื่อง: {previewDoc.topic}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Iframe */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 overflow-hidden flex flex-col">
              <iframe
                src={`${previewDoc.fileUrl || previewDoc.downloadUrl}#toolbar=1&navpanes=1`}
                className="w-full h-full rounded-lg border border-slate-300 dark:border-slate-800 bg-white"
                title={previewDoc.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD REGULATION / UPLOAD MODAL
      ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  เพิ่มระเบียบ / อัปโหลดเอกสารใหม่
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  หมวดหมู่ระเบียบ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newDoc.category}
                  onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="หนังสือสั่งการ (ว)">หนังสือสั่งการ (ว)</option>
                  <option value="กฎหมายหลัก">พ.ร.บ. / กฎหมายหลัก</option>
                  <option value="ระเบียบ มท.">ระเบียบ มท.</option>
                  <option value="แนวทางปฏิบัติ">แนวทางปฏิบัติ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อหนังสือ / เลขที่ระเบียบ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น หนังสือ ด่วนที่สุด ที่ มท 0808.2/ว..."
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  เรื่อง / หัวข้อ
                </label>
                <input
                  type="text"
                  placeholder="เช่น แนวทางการจัดงานประเพณีและงานเทศกาล..."
                  value={newDoc.topic}
                  onChange={(e) => setNewDoc({ ...newDoc, topic: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  สาระสำคัญ / สรุปย่อ
                </label>
                <textarea
                  rows={3}
                  placeholder="ระบุสาระสำคัญ ประเด็นสำคัญ ข้อกำหนดที่ต้องตรวจสอบ..."
                  value={newDoc.summary}
                  onChange={(e) => setNewDoc({ ...newDoc, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  อัปโหลดไฟล์จากเครื่อง (PDF, Word, Excel)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {newDoc.fileRef && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                    เลือกไฟล์แล้ว: {newDoc.fileRef} ({newDoc.fileSize})
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกระเบียบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
