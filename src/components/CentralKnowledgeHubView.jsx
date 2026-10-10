import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Award,
  Calendar,
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
  GraduationCap,
  ClipboardCheck,
  AlertTriangle,
  Tag,
  Building,
  CheckCircle2,
  ArrowRight,
  Layers,
  Filter,
  Printer
} from 'lucide-react';
import {
  CENTRAL_DOC_CATEGORIES,
  INITIAL_CENTRAL_DOCUMENTS
} from '../data/centralKnowledgeData';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDocumentToWord } from '../utils/documentExportUtils';

export default function CentralKnowledgeHubView({ session, onCloneToWorkingPapers }) {
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_central_documents');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Clean out any V614 items from central hub storage
          const cleaned = parsed.filter((d) => !d.id?.startsWith('DOC-V614-'));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('ia_central_documents', JSON.stringify(cleaned));
          }
          return cleaned.length > 0 ? cleaned : INITIAL_CENTRAL_DOCUMENTS;
        }
      }
    } catch (_) {}
    return INITIAL_CENTRAL_DOCUMENTS;
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);

  const isAdmin = session?.role === 'admin';

  // New Document state for Admin
  const [newDocForm, setNewDocForm] = useState({
    category: 'regulations',
    code: '',
    title: '',
    topic: '',
    organization: 'สถ. / กรมบัญชีกลาง',
    year: '2569',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    summary: '',
    keyPoints: '',
    fullContent: '',
    tags: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveDocumentsToStorage = (list) => {
    setDocuments(list);
    localStorage.setItem('ia_central_documents', JSON.stringify(list));
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
      if (selectedTag && !doc.tags?.includes(selectedTag)) return false;

      const q = searchTerm.toLowerCase();
      if (!q) return true;

      return (
        (doc.title || '').toLowerCase().includes(q) ||
        (doc.code || '').toLowerCase().includes(q) ||
        (doc.topic || '').toLowerCase().includes(q) ||
        (doc.summary || '').toLowerCase().includes(q) ||
        (doc.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [documents, selectedCategory, searchTerm, selectedTag]);

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    documents.forEach((d) => (d.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 15);
  }, [documents]);

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('คัดลอกข้อความเรียบร้อยแล้ว');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clone Working Paper into Auditor's personal workspace
  const handleCloneWorkingPaper = (doc) => {
    if (onCloneToWorkingPapers) {
      onCloneToWorkingPapers(doc);
      showToast(`คัดลอก "${doc.title}" ไปยังกระดาษทำการของคุณเรียบร้อยแล้ว!`);
    } else {
      showToast('ระบบได้บันทึกต้นแบบไปยังกระดาษทำการเรียบร้อยแล้ว');
    }
  };

  // Print Document Window
  const handlePrintDocument = (doc) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์เอกสาร');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${doc.title}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Sarabun', 'TH Sarabun New', Tahoma, sans-serif; padding: 40px; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; }
            h2 { text-align: center; margin-bottom: 20px; font-size: 20px; }
            .header-meta { font-size: 13px; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 24px; display: flex; justify-content: space-between; }
            .summary-box { background: #f8f9fa; border: 1px solid #e9ecef; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
            .content { white-space: pre-wrap; font-size: 14px; line-height: 1.7; }
            @media print {
              body { padding: 10px; }
              .summary-box { border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="header-meta">
            <div><strong>${doc.code}</strong> | ${doc.organization} (พ.ศ. ${doc.year})</div>
            <div>ประเภท: ${doc.fileType}</div>
          </div>
          <h2>${doc.title}</h2>
          <div class="summary-box">
            <strong>สาระสำคัญ:</strong> ${doc.summary}
          </div>
          <div class="content">${doc.fullContent || doc.summary}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownloadWord = (doc) => {
    if (!doc) return;
    const bodyContent = `
      <div style="text-align: center; margin-bottom: 16pt; font-family: 'TH Sarabun PSK';">
        <p style="margin: 0; font-size: 16pt; font-weight: bold;">${doc.code || ''} | ${doc.organization || ''} (พ.ศ. ${doc.year || ''})</p>
        <p style="margin: 4pt 0 0 0; font-size: 20pt; font-weight: bold;">${doc.title || ''}</p>
        <p style="margin: 2pt 0 0 0; font-size: 14pt; color: #555;">ประเภท: ${doc.fileType || ''} | หมวดหมู่: ${doc.category || ''}</p>
      </div>
      <div style="border-top: 1pt solid black; margin-bottom: 12pt;"></div>
      <div style="background-color: #f8f9fa; padding: 10pt; border: 1pt solid #ddd; margin-bottom: 12pt; font-family: 'TH Sarabun PSK'; font-size: 16pt;">
        <strong>สาระสำคัญ:</strong> ${doc.summary || ''}
      </div>
      <div style="font-family: 'TH Sarabun PSK'; font-size: 16pt; line-height: 1.35; white-space: pre-wrap; text-align: justify;">
        ${doc.fullContent || doc.summary || ''}
      </div>
    `;
    exportDocumentToWord(bodyContent, `${doc.title || 'เอกสารคลังความรู้'}.doc`, doc.title);
  };

  // Add Document Submit
  const handleAddDocSubmit = (e) => {
    e.preventDefault();
    if (!newDocForm.title || !newDocForm.summary) {
      alert('กรุณาระบุชื่อเรื่องและคำอธิบายสรุป');
      return;
    }

    const tagsArray = newDocForm.tags
      ? newDocForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : ['ระเบียบใหม่'];

    const keyPointsArray = newDocForm.keyPoints
      ? newDocForm.keyPoints.split('\n').filter(Boolean)
      : [];

    const newDoc = {
      id: `DOC-CUSTOM-${Date.now().toString().slice(-4)}`,
      category: newDocForm.category,
      code: newDocForm.code || 'DOC-CUSTOM',
      title: newDocForm.title,
      topic: newDocForm.topic || newDocForm.title,
      organization: newDocForm.organization,
      year: newDocForm.year,
      fileType: newDocForm.fileType,
      fileSize: newDocForm.fileSize,
      summary: newDocForm.summary,
      keyPoints: keyPointsArray,
      fullContent: newDocForm.fullContent || newDocForm.summary,
      tags: tagsArray
    };

    const updated = [newDoc, ...documents];
    saveDocumentsToStorage(updated);
    setShowAddDocModal(false);
    showToast(`เพิ่ม "${newDoc.title}" ลงในคลังกลางเรียบร้อยแล้ว!`);
  };

  // Delete Document (Admin Only)
  const handleDeleteDoc = (id, title) => {
    if (!window.confirm(`ต้องการลบ "${title}" ออกจากคลังเอกสารกลางหรือไม่?`)) return;
    const updated = documents.filter((d) => d.id !== id);
    saveDocumentsToStorage(updated);
    showToast(`ลบ "${title}" เรียบร้อยแล้ว`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
                <Building className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>คลังเอกสารและคู่มือมาตรฐาน</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
                <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>ระเบียบ • คู่มือ สถ. • มาตรฐานสากล</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
                <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                <span>แชร์ใช้งานร่วมกันทุก อปท.</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              คลังเอกสารกลาง & ฐานความรู้ผู้ตรวจสอบภายใน อปท.
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              รวบรวมระเบียบการเงินการคลัง พ.ร.บ. จัดซื้อจัดจ้างฯ คู่มือมาตรฐาน สถ. สไลด์หลักสูตรผู้ตรวจสอบ (หลักสูตรทอง) และรวมประเด็นข้อทักท้วง สตง. ที่พบบ่อย
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddDocModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center space-x-2 cursor-pointer self-start md:self-auto shrink-0 border border-amber-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มเอกสารในคลังกลาง (ADMIN)</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {CENTRAL_DOC_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all'
                  ? documents.length
                  : documents.filter((d) => d.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedTag('');
                  }}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                      : 'bg-stone-100/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 border border-transparent'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเรื่อง, ระเบียบ, รหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-800 dark:text-stone-100"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
          <span className="text-stone-400 font-semibold flex items-center space-x-1 mr-1">
            <Tag className="w-3 h-3 text-amber-700 dark:text-amber-400" />
            <span>แท็กยอดนิยม:</span>
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={`px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-amber-700 text-white border-amber-800 font-bold'
                  : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-700 hover:border-amber-400'
              }`}
            >
              #{tag}
            </button>
          ))}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag('')}
              className="text-rose-500 hover:underline text-[10px] ml-2 font-semibold"
            >
              ล้างตัวกรองแท็ก
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => {
          const isWorkingPaper = doc.category === 'working-papers';
          const isCurriculum = doc.category === 'curriculum-2569';
          const isQA = doc.category === 'qa-findings';

          let cardAccent = 'border-stone-200/80 dark:border-stone-800 hover:border-amber-500';
          if (isWorkingPaper) cardAccent = 'border-amber-200/80 dark:border-amber-900/60 hover:border-amber-500';
          if (isCurriculum) cardAccent = 'border-stone-300 dark:border-stone-700 hover:border-amber-500';
          if (isQA) cardAccent = 'border-amber-300/80 dark:border-amber-800/60 hover:border-amber-500';

          return (
            <div
              key={doc.id}
              className={`bg-white dark:bg-stone-900 rounded-3xl p-5 border ${cardAccent} shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
            >
              <div className="space-y-3">
                {/* Card Top: Code & FileType */}
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {doc.code}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/40">
                      {doc.fileType} {doc.fileSize ? `(${doc.fileSize})` : ''}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.title)}
                        className="text-stone-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                        title="ลบเอกสาร"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Topic */}
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug">
                    {doc.title}
                  </h3>
                  <div className="text-xs text-amber-800 dark:text-amber-400 font-medium line-clamp-1">
                    {doc.topic}
                  </div>
                  <div className="text-[11px] text-stone-400 flex items-center space-x-1">
                    <Building className="w-3 h-3" />
                    <span>{doc.organization}</span>
                    {doc.year && <span>({doc.year})</span>}
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed">
                  {doc.summary}
                </p>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 px-2 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center space-x-2">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-500" />
                  <span>ดูเนื้อหา</span>
                </button>

                {isWorkingPaper && (
                  <button
                    onClick={() => handleCloneWorkingPaper(doc)}
                    className="bg-amber-700 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
                    title="คัดลอกลงในกระดาษทำการของฉัน"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>นำไปใช้</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopyText(doc.id, doc.fullContent || doc.summary)}
                  className="p-2 rounded-xl border border-stone-200/80 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-all cursor-pointer"
                  title="คัดลอกเนื้อหา"
                >
                  {copiedId === doc.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">ไม่พบเอกสารที่ตรงกับคำค้นหา</h3>
          <p className="text-xs text-stone-500 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-stone-200/80 dark:border-stone-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4 bg-stone-50/50 dark:bg-stone-850/50">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
                    {previewDoc.code}
                  </span>
                  <span className="text-xs text-stone-400">{previewDoc.organization} ({previewDoc.year})</span>
                </div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {previewDoc.title}
                </h2>
                <div className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                  {previewDoc.topic}
                </div>
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700 dark:text-stone-300 custom-scrollbar leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">สาระสำคัญโดยสรุป</h4>
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-stone-800 dark:text-stone-200">
                  {previewDoc.summary}
                </div>
              </div>

              {previewDoc.keyPoints && previewDoc.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">ประเด็นสำคัญที่ต้องตรวจสอบ (Key Checkpoints)</h4>
                  <ul className="space-y-1.5 list-disc list-inside bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700">
                    {previewDoc.keyPoints.map((point, idx) => (
                      <li key={idx} className="leading-relaxed">{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">เนื้อหา / แนวทางปฏิบัติงานฉบับเต็ม</h4>
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 font-sans whitespace-pre-line leading-relaxed text-stone-700 dark:text-stone-300">
                  {previewDoc.fullContent || previewDoc.summary}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-850/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyText(previewDoc.id, previewDoc.fullContent || previewDoc.summary)}
                  className="bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-800 dark:text-stone-200 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกข้อความ</span>
                </button>
                <OfficialDocActionToolbar
                  onDownloadWord={() => handleDownloadWord(previewDoc)}
                  onPrint={() => handlePrintDocument(previewDoc)}
                  wordTooltip={`ดาวน์โหลด ${previewDoc.title} เป็นไฟล์ Word (.doc)`}
                  printTooltip={`พิมพ์ ${previewDoc.title} / บันทึกเป็น PDF`}
                />
              </div>

              <div className="flex items-center space-x-2">
                {previewDoc.category === 'working-papers' && (
                  <button
                    onClick={() => {
                      handleCloneWorkingPaper(previewDoc);
                      setPreviewDoc(null);
                    }}
                    className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>นำเข้ากระดาษทำการของฉันทันที</span>
                  </button>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="bg-stone-800 text-white hover:bg-stone-700 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DOCUMENT (ADMIN ONLY) */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-100 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <span>เพิ่มเอกสาร / แนวทางใหม่ในคลังกลาง (ADMIN)</span>
              </h3>
              <button
                onClick={() => setShowAddDocModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">หมวดหมู่เอกสาร</label>
                  <select
                    value={newDocForm.category}
                    onChange={(e) => setNewDocForm({ ...newDocForm, category: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  >
                    <option value="regulations">กฎหมาย & ระเบียบการเงินการคลัง</option>
                    <option value="working-papers">ต้นแบบกระดาษทำการ & เช็คลิสต์</option>
                    <option value="curriculum-2569">หลักสูตรทอง 2569</option>
                    <option value="qa-findings">รวมปัญหา & ข้อทักท้วง สตง.</option>
                    <option value="forms-templates">แบบฟอร์มหนังสือราชการ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">รหัสเอกสาร / เลขที่ระเบียบ</label>
                  <input
                    type="text"
                    value={newDocForm.code}
                    onChange={(e) => setNewDocForm({ ...newDocForm, code: e.target.value })}
                    placeholder="เช่น ว 23, พ.ร.บ. พัสดุฯ"
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">ชื่อเรื่องเอกสาร *</label>
                <input
                  type="text"
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                  placeholder="เช่น ระเบียบกระทรวงมหาดไทยว่าด้วย..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">หัวข้อภารกิจ / เรื่องที่เกี่ยวข้อง</label>
                <input
                  type="text"
                  value={newDocForm.topic}
                  onChange={(e) => setNewDocForm({ ...newDocForm, topic: e.target.value })}
                  placeholder="เช่น การเบิกจ่ายเงิน, งานก่อสร้าง, ค่าเช่าบ้าน"
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">หน่วยงานเจ้าของเรื่อง</label>
                  <input
                    type="text"
                    value={newDocForm.organization}
                    onChange={(e) => setNewDocForm({ ...newDocForm, organization: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">ปี พ.ศ.</label>
                  <input
                    type="text"
                    value={newDocForm.year}
                    onChange={(e) => setNewDocForm({ ...newDocForm, year: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">สรุปสาระสำคัญ *</label>
                <textarea
                  rows={2}
                  value={newDocForm.summary}
                  onChange={(e) => setNewDocForm({ ...newDocForm, summary: e.target.value })}
                  placeholder="คำอธิบายสรุปสาระสำคัญ..."
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">ประเด็นสำคัญที่ต้องตรวจสอบ (บรรทัดละ 1 ข้อ)</label>
                <textarea
                  rows={3}
                  value={newDocForm.keyPoints}
                  onChange={(e) => setNewDocForm({ ...newDocForm, keyPoints: e.target.value })}
                  placeholder="ข้อ 1: ...&#10;ข้อ 2: ..."
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">เนื้อหา / คำชี้แจงฉบับเต็ม</label>
                <textarea
                  rows={4}
                  value={newDocForm.fullContent}
                  onChange={(e) => setNewDocForm({ ...newDocForm, fullContent: e.target.value })}
                  placeholder="รายละเอียดคำอธิบายฉบับเต็ม..."
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">แท็ก (คั่นด้วยจุลภาค ,)</label>
                <input
                  type="text"
                  value={newDocForm.tags}
                  onChange={(e) => setNewDocForm({ ...newDocForm, tags: e.target.value })}
                  placeholder="เช่น กฎหมาย, เบิกจ่าย, ค่าเช่าบ้าน"
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกลงคลังกลาง</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
