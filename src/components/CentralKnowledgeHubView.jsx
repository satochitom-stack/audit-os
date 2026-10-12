import React, { useState, useMemo, useEffect } from 'react';
import PageHeaderBanner from './PageHeaderBanner';
import {
  BookOpen,
  Calendar,
  Search,
  FileText,
  Copy,
  Check,
  FolderOpen,
  ExternalLink,
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
  Filter,
  Printer,
  UploadCloud,
  FileUp,
  User,
  HardDrive,
  Info,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Clock,
  Layers,
  HelpCircle,
  File,
  RotateCcw
} from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  CENTRAL_DOC_CATEGORIES,
  INITIAL_CENTRAL_DOCUMENTS
} from '../data/centralKnowledgeData';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDocumentToWord } from '../utils/documentExportUtils';
import {
  saveDocumentFile,
  getDocumentFile,
  deleteDocumentFile
} from '../utils/indexedDbUtils';
import { luxuryConfirm, luxuryAlert } from './LuxuryModal';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const DELETED_DOCS_KEY = 'ia_deleted_central_doc_ids';

const getDeletedDocIds = () => {
  try {
    const saved = localStorage.getItem(DELETED_DOCS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (_) {
    return [];
  }
};

const saveDeletedDocIds = (ids) => {
  try {
    localStorage.setItem(DELETED_DOCS_KEY, JSON.stringify(ids));
  } catch (_) {}
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function CentralKnowledgeHubView({ session, onCloneToWorkingPapers }) {
  // Current user info
  const currentUserName = session?.user?.name || session?.displayName || session?.username || 'ผู้ตรวจสอบภายใน';
  const currentUsername = session?.username || session?.user?.username || '';
  const isAdmin = session?.role === 'admin' || session?.username === 'admin';

  // Check if current user has permission to delete this document:
  // Admin OR the user who uploaded the document
  const canDeleteDoc = (doc) => {
    if (!doc) return false;
    if (isAdmin) return true;

    // 1. Check uploader username
    if (currentUsername && doc.uploaderUsername && doc.uploaderUsername.toLowerCase() === currentUsername.toLowerCase()) {
      return true;
    }

    // 2. Check all possible identifiers of the current logged-in user
    const userIdentifiers = [
      session?.username,
      session?.displayName,
      session?.user?.name,
      session?.user?.username,
      currentUserName
    ].filter(Boolean).map((s) => s.trim().toLowerCase());

    if (doc.uploadedBy && userIdentifiers.includes(doc.uploadedBy.trim().toLowerCase())) {
      return true;
    }

    // 3. User-uploaded document fallback
    if (doc.id?.startsWith('DOC-USER-')) {
      if (!doc.uploadedBy || userIdentifiers.includes(doc.uploadedBy?.trim()?.toLowerCase())) {
        return true;
      }
    }

    return false;
  };

  // Load documents metadata from localStorage with deleted blacklist protection
  const [documents, setDocuments] = useState(() => {
    try {
      const deletedIds = new Set(getDeletedDocIds());
      const saved = localStorage.getItem('ia_central_documents');
      if (saved !== null) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((d) => !d.id?.startsWith('DOC-V614-'))
            .filter((d) => !deletedIds.has(d.id));
          return cleaned; // Strictly return cleaned, even if empty array! Never resurrect!
        }
      }
      // First time initialization: filter defaults by blacklist
      return INITIAL_CENTRAL_DOCUMENTS.filter(
        (d) => !d.id?.startsWith('DOC-V614-') && !deletedIds.has(d.id)
      );
    } catch (_) {}
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  
  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewTab, setPreviewTab] = useState('preview'); // 'preview' | 'summary' | 'details'
  const [attachedFile, setAttachedFile] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState(14); // px

  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Upload / Add Modal state
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileDataUrl, setUploadFileDataUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newDocForm, setNewDocForm] = useState({
    category: 'regulations',
    code: '',
    title: '',
    topic: '',
    organization: 'สถ. / กรมบัญชีกลาง',
    year: '2569',
    fileType: 'PDF',
    fileSize: '',
    externalUrl: '',
    summary: '',
    keyPoints: '',
    fullContent: '',
    tags: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync with Cloud Firestore & localStorage
  const saveDocumentsToStorage = async (list, newlyDeletedIds = []) => {
    setDocuments(list);
    localStorage.setItem('ia_central_documents', JSON.stringify(list));

    let currentDeleted = getDeletedDocIds();
    if (newlyDeletedIds && newlyDeletedIds.length > 0) {
      const set = new Set([...currentDeleted, ...newlyDeletedIds]);
      currentDeleted = Array.from(set);
      saveDeletedDocIds(currentDeleted);
    }

    try {
      const docRef = doc(db, 'system_settings', 'central_documents');
      await setDoc(
        docRef,
        {
          documents: list,
          deletedIds: currentDeleted,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUserName
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Central documents sync to Firestore failed:', err);
    }
  };

  // Real-time synchronization from Firestore
  useEffect(() => {
    try {
      const docRef = doc(db, 'system_settings', 'central_documents');
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const remoteDocs = data?.documents;
            const remoteDeleted = data?.deletedIds || [];
            if (Array.isArray(remoteDeleted) && remoteDeleted.length > 0) {
              const currentDeleted = new Set(getDeletedDocIds());
              remoteDeleted.forEach((id) => currentDeleted.add(id));
              saveDeletedDocIds(Array.from(currentDeleted));
            }
            if (Array.isArray(remoteDocs)) {
              const deletedIds = new Set(getDeletedDocIds());
              const filtered = remoteDocs
                .filter((d) => !d.id?.startsWith('DOC-V614-'))
                .filter((d) => !deletedIds.has(d.id));
              setDocuments(filtered);
              localStorage.setItem('ia_central_documents', JSON.stringify(filtered));
            }
          }
        },
        (err) => {
          console.warn('Firestore central_documents snapshot error:', err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Failed to listen to central_documents:', e);
    }
  }, []);

  // Fetch attached file from IndexedDB when a document is opened for preview
  useEffect(() => {
    let isMounted = true;
    if (previewDoc) {
      setAttachedFile(null);
      if (previewDoc.hasAttachment || previewDoc.id?.startsWith('DOC-USER-')) {
        setIsLoadingFile(true);
        getDocumentFile(previewDoc.id)
          .then((file) => {
            if (isMounted) {
              setAttachedFile(file);
              setIsLoadingFile(false);
            }
          })
          .catch(() => {
            if (isMounted) setIsLoadingFile(false);
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [previewDoc]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;

      return (
        (doc.title || '').toLowerCase().includes(q) ||
        (doc.code || '').toLowerCase().includes(q) ||
        (doc.topic || '').toLowerCase().includes(q) ||
        (doc.summary || '').toLowerCase().includes(q) ||
        (doc.organization || '').toLowerCase().includes(q) ||
        (doc.uploadedBy || '').toLowerCase().includes(q) ||
        (doc.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [documents, searchTerm]);

  const handleCopyText = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('คัดลอกข้อความลงคลิปบอร์ดแล้ว');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clone Working Paper into Auditor's personal workspace
  const handleCloneWorkingPaper = (doc) => {
    if (onCloneToWorkingPapers) {
      onCloneToWorkingPapers(doc);
      showToast(`คัดลอก "${doc.title}" ไปยังกระดาษทำการของคุณเรียบร้อยแล้ว!`);
    } else {
      showToast('บันทึกต้นแบบไปยังกระดาษทำการเรียบร้อยแล้ว');
    }
  };

  // Print Document Window
  const handlePrintDocument = (doc) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      luxuryAlert({
        title: 'เบราว์เซอร์บล็อกหน้าต่างใหม่',
        message: 'กรุณาอนุญาตให้เปิดป๊อปอัป (Pop-ups) ในเบราว์เซอร์เพื่อพิมพ์เอกสาร',
        variant: 'warning'
      });
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
            <div><strong>${doc.code || ''}</strong> | ${doc.organization || ''} (พ.ศ. ${doc.year || ''})</div>
            <div>ประเภท: ${doc.fileType || 'เอกสาร'}</div>
          </div>
          <h2>${doc.title}</h2>
          <div class="summary-box">
            <strong>สาระสำคัญ:</strong> ${doc.summary || ''}
          </div>
          <div class="content">${doc.fullContent || doc.summary || ''}</div>
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

  // File selection & validation handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) {
      setUploadFile(null);
      setUploadFileDataUrl('');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`⚠️ ไฟล์มีขนาด ${formatBytes(file.size)} ซึ่งเกินขีดจำกัดสูงสุด 10 MB กรุณาเลือกไฟล์ที่ขนาดไม่เกิน 10 MB เพื่อประหยัดพื้นที่จัดเก็บ หรือใช้การระบุลิงก์เอกสารออนไลน์`);
      setUploadFile(null);
      setUploadFileDataUrl('');
      return;
    }

    setUploadFile(file);

    // Auto deduce file type & size
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    let fileType = ext;
    if (['DOC', 'DOCX'].includes(ext)) fileType = 'Word';
    if (['XLS', 'XLSX'].includes(ext)) fileType = 'Excel';
    if (['JPG', 'JPEG', 'PNG'].includes(ext)) fileType = 'รูปภาพ';

    // Auto fill title if empty
    const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setNewDocForm((prev) => ({
      ...prev,
      title: prev.title || fileNameWithoutExt,
      fileType: fileType,
      fileSize: formatBytes(file.size)
    }));

    // Read as Data URL
    const reader = new FileReader();
    reader.onload = () => {
      setUploadFileDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Add / Upload Document Submit (available for all users)
  const handleAddDocSubmit = async (e) => {
    e.preventDefault();
    if (!newDocForm.title.trim()) {
      await luxuryAlert({
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณาระบุชื่อเรื่องของเอกสารก่อนดำเนินการจัดเก็บ',
        variant: 'warning'
      });
      return;
    }
    if (!newDocForm.summary.trim()) {
      await luxuryAlert({
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณาระบุสรุปสาระสำคัญของเอกสาร เพื่อเป็นข้อมูลสำหรับผู้ใช้งานคนอื่น',
        variant: 'warning'
      });
      return;
    }

    setIsSubmitting(true);
    const docId = `DOC-USER-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Prepare arrays
    const tagsArray = newDocForm.tags
      ? newDocForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : ['เอกสารส่วนกลาง'];

    const keyPointsArray = newDocForm.keyPoints
      ? newDocForm.keyPoints.split('\n').map((k) => k.trim()).filter(Boolean)
      : [];

    // Save attachment in IndexedDB if provided
    let hasAttachment = false;
    if (uploadFile && uploadFileDataUrl) {
      try {
        await saveDocumentFile(docId, {
          fileName: uploadFile.name,
          fileType: newDocForm.fileType,
          fileSize: formatBytes(uploadFile.size),
          mimeType: uploadFile.type,
          dataUrl: uploadFileDataUrl
        });
        hasAttachment = true;
      } catch (err) {
        console.error('Failed to save file to IndexedDB', err);
      }
    }

    const newDoc = {
      id: docId,
      category: newDocForm.category,
      code: newDocForm.code.trim() || 'เอกสารเผยแพร่',
      title: newDocForm.title.trim(),
      topic: newDocForm.topic.trim() || newDocForm.title.trim(),
      organization: newDocForm.organization.trim() || 'อปท. / สถ.',
      year: newDocForm.year.trim() || '2569',
      fileType: newDocForm.fileType || (hasAttachment ? 'PDF' : 'เอกสารข้อความ'),
      fileSize: newDocForm.fileSize || (uploadFile ? formatBytes(uploadFile.size) : 'ข้อความ'),
      externalUrl: newDocForm.externalUrl.trim(),
      hasAttachment: hasAttachment,
      summary: newDocForm.summary.trim(),
      keyPoints: keyPointsArray,
      fullContent: newDocForm.fullContent.trim() || newDocForm.summary.trim(),
      tags: tagsArray,
      uploadedBy: currentUserName,
      uploaderUsername: currentUsername,
      uploadedAt: new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };

    const updated = [newDoc, ...documents];
    saveDocumentsToStorage(updated);

    // Reset Form
    setNewDocForm({
      category: 'regulations',
      code: '',
      title: '',
      topic: '',
      organization: 'สถ. / กรมบัญชีกลาง',
      year: '2569',
      fileType: 'PDF',
      fileSize: '',
      externalUrl: '',
      summary: '',
      keyPoints: '',
      fullContent: '',
      tags: ''
    });
    setUploadFile(null);
    setUploadFileDataUrl('');
    setFileError('');
    setIsSubmitting(false);
    setShowAddDocModal(false);

    showToast(`อัปโหลดเอกสาร "${newDoc.title}" เข้าสู่คลังกลางเรียบร้อยแล้ว ทุกคนสามารถเปิดดูได้ทันที`);
  };

  // Delete Document (Admin or Uploader only)
  const handleDeleteDoc = async (doc) => {
    if (!canDeleteDoc(doc)) {
      await luxuryAlert({
        title: 'ไม่มีสิทธิ์ลบเอกสารนี้',
        message: 'คุณสามารถลบได้เฉพาะเอกสารที่คุณเป็นผู้อัปโหลดเท่านั้น หรือติดต่อผู้ดูแลระบบ (Admin) เพื่อดำเนินการ',
        variant: 'warning'
      });
      return;
    }

    const isUploader =
      !isAdmin &&
      (doc.uploadedBy === currentUserName ||
        (doc.uploaderUsername && doc.uploaderUsername.toLowerCase() === currentUsername.toLowerCase()));

    const confirmed = await luxuryConfirm({
      title: 'ยืนยันการลบเอกสาร',
      message: 'คุณต้องการลบเอกสารนี้ออกจากคลังเอกสารแม่แบบกลางหรือไม่?',
      itemTitle: doc.title,
      subMessage: isUploader
        ? `⚠️ คุณกำลังลบเอกสารที่คุณเป็นผู้อัปโหลด ("${doc.uploadedBy || currentUserName}") เอกสารนี้จะถูกลบถาวรออกจากระบบส่วนกลาง`
        : '⚠️ เอกสารนี้จะถูกลบถาวรออกจากคลังกลาง และจะไม่ปรากฏในระบบอีกต่อไป',
      confirmText: 'ลบเอกสารทันที',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!confirmed) return;

    if (doc.hasAttachment || doc.id?.startsWith('DOC-USER-')) {
      try {
        await deleteDocumentFile(doc.id);
      } catch (_) {}
    }

    const updated = documents.filter((d) => d.id !== doc.id);
    await saveDocumentsToStorage(updated, [doc.id]);
    if (previewDoc?.id === doc.id) {
      setPreviewDoc(null);
    }
    showToast(`ลบ "${doc.title}" ออกจากคลังเรียบร้อยแล้ว`);
  };

  // Clear All Documents (Admin only - instant batch clean)
  const handleClearAllDocs = async () => {
    if (!isAdmin) return;
    const count = documents.length;
    const confirmed = await luxuryConfirm({
      title: 'ยืนยันล้างคลังเอกสารทั้งหมด',
      message: `คุณต้องการลบเอกสารทั้งหมด ${count} รายการออกจากคลังกลางหรือไม่?`,
      subMessage: '⚠️ เอกสารทั้งหมดจะถูกลบถาวรออกจากคลังกลาง และจะไม่ถูกโหลดกลับมาซ้ำอีกเมื่อรีเฟรชหน้าเว็บ',
      confirmText: 'ล้างข้อมูลทั้งหมดทันที',
      cancelText: 'ยกเลิก',
      variant: 'danger'
    });
    if (!confirmed) return;

    const allIds = documents.map((d) => d.id);
    for (const doc of documents) {
      if (doc.hasAttachment || doc.id?.startsWith('DOC-USER-')) {
        try {
          await deleteDocumentFile(doc.id);
        } catch (_) {}
      }
    }

    await saveDocumentsToStorage([], allIds);
    setPreviewDoc(null);
    showToast(`ล้างคลังเอกสารเรียบร้อยแล้ว (ลบทั้งหมด ${count} รายการ)`);
  };

  // Restore Default Sample Templates (Admin only)
  const handleRestoreSampleDocs = async () => {
    if (!isAdmin) return;
    const confirmed = await luxuryConfirm({
      title: 'คืนค่าเอกสารตัวอย่างตั้งต้น',
      message: 'คุณต้องการโหลดเอกสารแม่แบบตัวอย่างตั้งต้นของระบบกลับมาหรือไม่?',
      subMessage: 'ระบบจะคืนค่ารายการเอกสารแม่แบบกฎหมาย ระเบียบ และกระดาษทำการตัวอย่าง 28 รายการกลับมาในคลังกลาง',
      confirmText: 'คืนค่าตัวอย่าง',
      cancelText: 'ยกเลิก',
      variant: 'info'
    });
    if (!confirmed) return;

    saveDeletedDocIds([]);
    await saveDocumentsToStorage(INITIAL_CENTRAL_DOCUMENTS, []);
    showToast('คืนค่าเอกสารแม่แบบตัวอย่างเรียบร้อยแล้ว');
  };

  // Category badge styling helper
  const getCategoryBadge = (catId) => {
    const cat = CENTRAL_DOC_CATEGORIES.find((c) => c.id === catId);
    const label = cat ? cat.label : catId;
    switch (catId) {
      case 'regulations':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
            <BookOpen className="w-3 h-3 text-blue-600" />
            <span>กฎหมาย & ระเบียบ</span>
          </span>
        );
      case 'working-papers':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
            <ClipboardCheck className="w-3 h-3 text-emerald-600" />
            <span>ต้นแบบกระดาษทำการ</span>
          </span>
        );
      case 'curriculum-2569':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
            <GraduationCap className="w-3 h-3 text-purple-600" />
            <span>หลักสูตรทอง 2569</span>
          </span>
        );
      case 'qa-findings':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>ปัญหา & ข้อทักท้วง</span>
          </span>
        );
      case 'forms-templates':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
            <FileText className="w-3 h-3 text-amber-600" />
            <span>แบบฟอร์มมาตรฐาน</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            <span>{label}</span>
          </span>
        );
    }
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

      {/* Page Header Banner (Strictly no buttons inside, respecting UI guardrails) */}
      <PageHeaderBanner
        title="คลังเอกสารกลาง & ฐานความรู้ผู้ตรวจสอบภายใน อปท."
        orgName="ศูนย์แลกเปลี่ยนเอกสารและระเบียบปฏิบัติงานกลาง"
        auditorName="กฎหมาย • หนังสือสั่งการ ว • ต้นแบบกระดาษทำการ • สถ."
        badges={['ระบบคลังข้อมูลกลางใช้ร่วมกันทุก User']}
      />

      {/* Control Bar: Summary Info, Clear All (Admin), Upload Button & Contained Search Input */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          {/* Left: Total Documents Info Badge */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-amber-600" />
              <span>รายการเอกสารทั้งหมดในคลังกลาง</span>
            </span>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700">
              {documents.length} รายการ
            </span>
          </div>

          {/* Action Toolbar: Clear All (Admin), Upload Button (All Users) + Contained Search Input */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 max-w-full">
            {isAdmin && documents.length > 0 && (
              <button
                onClick={handleClearAllDocs}
                className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold py-2.5 px-3.5 rounded-xl text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer shrink-0"
                title="ล้างเอกสารทั้งหมดออกจากคลังกลาง (เฉพาะ Admin)"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>ล้างคลังทั้งหมด</span>
              </button>
            )}

            <button
              onClick={() => setShowAddDocModal(true)}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center space-x-2 cursor-pointer shrink-0 border border-amber-500/30 active:scale-98 whitespace-nowrap"
            >
              <FileUp className="w-4 h-4" />
              <span>+ อัปโหลด / เพิ่มเอกสารกลาง</span>
            </button>

            <div className="relative w-full sm:w-56 md:w-64 max-w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อเรื่อง, ระเบียบ, รหัส..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-800 dark:text-stone-100 transition-all box-border"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guide Note Above Table */}
      <div className="flex items-center justify-end text-xs text-stone-400 px-1 font-medium">
        <div className="text-[11px] text-stone-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-amber-600" />
          <span>คลิกที่รายการเพื่อเปิดดูรายละเอียดและอ่านเอกสารได้ทันทีโดยไม่ต้องดาวน์โหลด</span>
        </div>
      </div>

      {/* CLEAN NUMBERED LIST VIEW (แสดงเฉพาะหัวข้อเรื่อง เป็นรายการมีลำดับ) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
        {filteredDocs.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
            {filteredDocs.map((doc, index) => {
              const canDelete = canDeleteDoc(doc);
              const isWorkingPaper = doc.category === 'working-papers';

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setPreviewDoc(doc);
                    setPreviewTab('preview');
                  }}
                  className="group p-4 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  {/* Left: Number + Main Title */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Number Badge (1, 2, 3...) */}
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono font-bold text-xs flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
                      {index + 1}
                    </div>

                    {/* Title & Metadata (Focused on Title as requested) */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Topic / Document Title */}
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors leading-snug">
                          {doc.title}
                        </h3>

                        {/* File Type & Size Badge */}
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          {doc.fileType || 'เอกสาร'} {doc.fileSize ? `(${doc.fileSize})` : ''}
                        </span>

                        {/* Has Attachment indicator */}
                        {doc.hasAttachment && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-0.5">
                            <File className="w-2.5 h-2.5" />
                            <span>มีไฟล์แนบ</span>
                          </span>
                        )}

                        {/* External link indicator */}
                        {doc.externalUrl && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/80 dark:border-sky-900/60 flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>ลิงก์ออนไลน์</span>
                          </span>
                        )}
                      </div>

                      {/* Sub-line: Code, Organization, Year & Category */}
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                        {doc.code && (
                          <span className="font-mono text-stone-700 dark:text-stone-300 font-semibold bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px]">
                            {doc.code}
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-stone-400" />
                          <span>{doc.organization || 'อปท. / สถ.'}</span>
                        </span>
                        {doc.year && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              <span>ปี พ.ศ. {doc.year}</span>
                            </span>
                          </>
                        )}
                        {doc.uploadedBy && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-stone-400">
                              <User className="w-3 h-3 text-stone-400" />
                              <span>โดย: {doc.uploadedBy}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Category Pill */}
                  <div className="hidden md:flex shrink-0 items-center">
                    {getCategoryBadge(doc.category)}
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div
                    className="flex items-center space-x-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* View / Open Button (เปิดดู) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDoc(doc);
                        setPreviewTab('preview');
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                      title="เปิดดูเอกสารทันที"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>เปิดดู</span>
                    </button>

                    {/* Detail Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDoc(doc);
                        setPreviewTab('summary');
                      }}
                      className="hidden sm:flex bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold py-1.5 px-2.5 rounded-xl text-xs transition-all items-center space-x-1 cursor-pointer"
                      title="ดูรายละเอียดและสาระสำคัญ"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>รายละเอียด</span>
                    </button>

                    {/* Clone to Working Paper (if applicable) */}
                    {isWorkingPaper && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneWorkingPaper(doc);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2.5 rounded-xl text-xs transition-all flex items-center space-x-1 cursor-pointer"
                        title="คัดลอกลงกระดาษทำการของฉัน"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">นำไปใช้</span>
                      </button>
                    )}

                    {/* Copy Text Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(doc.id, doc.fullContent || doc.summary);
                      }}
                      className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                      title="คัดลอกข้อความ"
                    >
                      {copiedId === doc.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete Button (if authorized) */}
                    {canDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(doc);
                        }}
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="ลบเอกสาร"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">
              ไม่พบรายการเอกสารในคลังกลาง
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
              {searchTerm
                ? 'ไม่พบเอกสารที่ตรงกับเงื่อนไขการค้นหา ลองเปลี่ยนคำค้นหาใหม่'
                : 'ขณะนี้ไม่มีเอกสารในคลังกลาง (เอกสารถูกลบออกแล้ว) สามารถอัปโหลดเอกสารใหม่ หรือให้ Admin กู้คืนเอกสารตัวอย่างตั้งต้นได้'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => setShowAddDocModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>+ อัปโหลดเอกสารใหม่</span>
              </button>
              {isAdmin && (
                <button
                  onClick={handleRestoreSampleDocs}
                  className="bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold py-2 px-4 rounded-xl text-xs transition-all border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 cursor-pointer"
                  title="คืนค่าเอกสารแม่แบบตัวอย่างตั้งต้น 28 รายการ"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                  <span>กู้คืนเอกสารตัวอย่างตั้งต้น</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FULL IN-APP PREVIEW & DETAIL MODAL (เปิดดูได้ทันทีโดยไม่ต้องโหลดลงเครื่อง) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-stone-200/80 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4 bg-stone-50/70 dark:bg-stone-850/70">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                    {previewDoc.code || 'DOC-REF'}
                  </span>
                  {getCategoryBadge(previewDoc.category)}
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Building className="w-3 h-3 text-stone-400" />
                    <span>{previewDoc.organization}</span>
                    {previewDoc.year && <span>(พ.ศ. {previewDoc.year})</span>}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {previewDoc.title}
                </h2>

                {previewDoc.topic && previewDoc.topic !== previewDoc.title && (
                  <div className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                    {previewDoc.topic}
                  </div>
                )}
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setPreviewTab('preview')}
                  className={`py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    previewTab === 'preview'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>👁️ เปิดอ่านเอกสาร (In-app Preview)</span>
                </button>

                <button
                  onClick={() => setPreviewTab('summary')}
                  className={`py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    previewTab === 'summary'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📋 สาระสำคัญ & จุดตรวจ</span>
                </button>

                <button
                  onClick={() => setPreviewTab('details')}
                  className={`py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    previewTab === 'details'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>ℹ️ ข้อมูลเอกสาร & แท็ก</span>
                </button>
              </div>

              {/* Font Resizer (Available when reading text content) */}
              {previewTab === 'preview' && !attachedFile?.dataUrl && (
                <div className="flex items-center space-x-1 text-stone-500">
                  <span className="text-[11px] mr-1 hidden sm:inline">ขนาดตัวอักษร:</span>
                  <button
                    onClick={() => setReaderFontSize((s) => Math.max(12, s - 1))}
                    className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold"
                    title="ลดขนาดตัวอักษร"
                  >
                    A-
                  </button>
                  <span className="font-mono text-[11px] px-1">{readerFontSize}px</span>
                  <button
                    onClick={() => setReaderFontSize((s) => Math.min(22, s + 1))}
                    className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold"
                    title="เพิ่มขนาดตัวอักษร"
                  >
                    A+
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-stone-700 dark:text-stone-300 custom-scrollbar">
              {/* TAB 1: IN-APP PREVIEW / DOCUMENT READER (ไม่ต้องโหลดลงเครื่อง) */}
              {previewTab === 'preview' && (
                <div className="space-y-4">
                  {/* Loading indicator */}
                  {isLoadingFile && (
                    <div className="text-center py-12 text-stone-500 flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังโหลดเอกสารแนบ...</span>
                    </div>
                  )}

                  {/* Case 1: Uploaded File with Data URL (PDF or image) */}
                  {!isLoadingFile && attachedFile?.dataUrl && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-stone-100 dark:bg-stone-800 p-3 rounded-xl text-xs">
                        <div className="flex items-center space-x-2">
                          <File className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-stone-800 dark:text-stone-200">{attachedFile.fileName}</span>
                          <span className="text-stone-400">({attachedFile.fileSize})</span>
                        </div>
                        <a
                          href={attachedFile.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-700 hover:underline flex items-center space-x-1 font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>เปิดในหน้าต่างใหม่</span>
                        </a>
                      </div>

                      {/* PDF Iframe viewer - Reads directly without downloading */}
                      {attachedFile.dataUrl.startsWith('data:application/pdf') || attachedFile.fileName?.endsWith('.pdf') ? (
                        <div className="border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden shadow-inner bg-stone-100 dark:bg-stone-950">
                          <iframe
                            src={attachedFile.dataUrl}
                            title={previewDoc.title}
                            className="w-full h-[62vh] border-0"
                          />
                        </div>
                      ) : attachedFile.dataUrl.startsWith('data:image/') ? (
                        <div className="flex justify-center p-4 bg-stone-100 dark:bg-stone-800 rounded-2xl">
                          <img
                            src={attachedFile.dataUrl}
                            alt={previewDoc.title}
                            className="max-h-[60vh] object-contain rounded-xl shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="p-6 text-center bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
                          <FileText className="w-10 h-10 text-stone-400 mx-auto" />
                          <p className="font-bold">เอกสารแนบ: {attachedFile.fileName}</p>
                          <p className="text-stone-500">คลิกปุ่มด้านบนเพื่อเปิดดูในหน้าต่างใหม่</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case 2: External Link Provided */}
                  {previewDoc.externalUrl && !attachedFile?.dataUrl && (
                    <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/60 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                          <ExternalLink className="w-4 h-4 text-sky-600" />
                          <span>เอกสารต้นทางออนไลน์ (Direct Source Link)</span>
                        </div>
                        <p className="text-[11px] text-sky-700 dark:text-sky-300 truncate max-w-xl">
                          {previewDoc.externalUrl}
                        </p>
                      </div>
                      <a
                        href={previewDoc.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shrink-0 shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดอ่านออนไลน์</span>
                      </a>
                    </div>
                  )}

                  {/* Case 3: Official Document Reader View (Text / Regulatory Content) */}
                  {!attachedFile?.dataUrl && (
                    <div className="bg-stone-50/70 dark:bg-stone-850/50 p-6 sm:p-8 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-6 shadow-xs">
                      {/* Paper Document Header */}
                      <div className="border-b border-stone-200 dark:border-stone-700 pb-4 text-center space-y-1">
                        <div className="font-mono text-xs text-stone-500">
                          {previewDoc.code} • {previewDoc.organization}
                        </div>
                        <h1 className="text-base sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-serif leading-snug">
                          {previewDoc.title}
                        </h1>
                        <div className="text-xs text-stone-500">
                          รอบปี พ.ศ. {previewDoc.year}
                        </div>
                      </div>

                      {/* Highlight summary ribbon */}
                      <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border-l-4 border-amber-600 text-stone-800 dark:text-stone-200 text-xs leading-relaxed">
                        <strong className="block text-amber-900 dark:text-amber-300 font-bold mb-1">
                          📌 สาระสำคัญโดยสรุป:
                        </strong>
                        {previewDoc.summary}
                      </div>

                      {/* Full Content with customizable font size */}
                      <div
                        className="font-sans leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line space-y-4"
                        style={{ fontSize: `${readerFontSize}px` }}
                      >
                        {previewDoc.fullContent || previewDoc.summary}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SUMMARY & CHECKPOINTS */}
              {previewTab === 'summary' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>สาระสำคัญโดยสรุป (Executive Summary)</span>
                    </h4>
                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-stone-800 dark:text-stone-200 leading-relaxed text-xs">
                      {previewDoc.summary}
                    </div>
                  </div>

                  {previewDoc.keyPoints && previewDoc.keyPoints.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center space-x-1.5">
                        <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                        <span>ประเด็นสำคัญที่ต้องตรวจสอบ (Key Checkpoints)</span>
                      </h4>
                      <ul className="space-y-2 bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700">
                        {previewDoc.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs leading-relaxed">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-stone-800 dark:text-stone-200">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {previewDoc.category === 'working-papers' && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">
                          💡 ต้นแบบกระดาษทำการนี้พร้อมใช้งาน
                        </span>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          คุณสามารถคัดลอกต้นแบบนี้ไปยังกระดาษทำการส่วนตัวของคุณเพื่อเริ่มตรวจได้ทันที
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          handleCloneWorkingPaper(previewDoc);
                          setPreviewDoc(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>คัดลอกไปใช้งาน</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DETAILS & METADATA */}
              {previewTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2">
                      <span className="text-stone-400 font-semibold block text-[11px]">รหัสเอกสาร / เลขที่ระเบียบ</span>
                      <p className="font-mono font-bold text-stone-800 dark:text-stone-100 text-sm">
                        {previewDoc.code || '-'}
                      </p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2">
                      <span className="text-stone-400 font-semibold block text-[11px]">หน่วยงานเจ้าของเรื่อง</span>
                      <p className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                        {previewDoc.organization || '-'}
                      </p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2">
                      <span className="text-stone-400 font-semibold block text-[11px]">ปี พ.ศ. ที่ประกาศ / รอบงบประมาณ</span>
                      <p className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                        {previewDoc.year || '-'}
                      </p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2">
                      <span className="text-stone-400 font-semibold block text-[11px]">ประเภทไฟล์และขนาด</span>
                      <p className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                        {previewDoc.fileType} {previewDoc.fileSize ? `(${previewDoc.fileSize})` : ''}
                      </p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2">
                      <span className="text-stone-400 font-semibold block text-[11px]">ผู้อัปโหลดเข้าสู่คลังกลาง</span>
                      <p className="font-bold text-stone-800 dark:text-stone-100 text-sm flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>{previewDoc.uploadedBy || 'ระบบมาตรฐาน (System)'}</span>
                      </p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2">
                      <span className="text-stone-400 font-semibold block text-[11px]">วันที่บันทึกเข้าสู่ระบบ</span>
                      <p className="font-bold text-stone-800 dark:text-stone-100 text-sm flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{previewDoc.uploadedAt || 'ฐานข้อมูลตั้งต้น'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {previewDoc.tags && previewDoc.tags.length > 0 && (
                    <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2">
                      <span className="text-stone-400 font-semibold block text-[11px] flex items-center space-x-1">
                        <Tag className="w-3 h-3 text-amber-600" />
                        <span>แท็กคำค้นหาที่เกี่ยวข้อง:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {previewDoc.tags.map((t) => (
                          <span
                            key={t}
                            className="text-xs bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Toolbar */}
            <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-850/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyText(previewDoc.id, previewDoc.fullContent || previewDoc.summary)}
                  className="bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedId === previewDoc.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>คัดลอกข้อความ</span>
                </button>

                <OfficialDocActionToolbar
                  onDownloadWord={() => handleDownloadWord(previewDoc)}
                  onPrint={() => handlePrintDocument(previewDoc)}
                  wordTooltip={`ส่งออก ${previewDoc.title} เป็นไฟล์ Word (.doc)`}
                  printTooltip={`พิมพ์ ${previewDoc.title} / ส่งออกเป็น PDF`}
                />
              </div>

              <div className="flex items-center space-x-2">
                {canDeleteDoc(previewDoc) && (
                  <button
                    onClick={() => handleDeleteDoc(previewDoc)}
                    className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                    title={isAdmin ? "ลบเอกสารนี้ออกจากคลังกลาง (สิทธิ์ Admin)" : "ลบเอกสารนี้ออกจากคลังกลาง (สิทธิ์ผู้อัปโหลด)"}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>ลบเอกสาร</span>
                  </button>
                )}

                {previewDoc.category === 'working-papers' && (
                  <button
                    onClick={() => {
                      handleCloneWorkingPaper(previewDoc);
                      setPreviewDoc(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>นำเข้ากระดาษทำการ</span>
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

      {/* MODAL: UPLOAD / ADD DOCUMENT (สำหรับ User ทุกคน สามารถแชร์ข้อมูลร่วมกันได้) */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-100 flex items-center space-x-2">
                  <UploadCloud className="w-5 h-5 text-amber-600" />
                  <span>อัปโหลด / เพิ่มเอกสารใหม่ในคลังกลาง</span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  แชร์เอกสาร ระเบียบ หรือแนวทางปฏิบัติให้ผู้ตรวจสอบภายในทุกคนในระบบใช้งานร่วมกัน
                </p>
              </div>
              <button
                onClick={() => setShowAddDocModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Central Hub Notice */}
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>ข้อมูลส่วนกลาง (Shared Hub):</strong> เอกสารที่คุณเพิ่มจะถูกบันทึกในคลังกลางเพื่อให้ผู้ตรวจสอบภายในทุกคนเปิดอ่านและค้นหาได้ทันที จำกัดขนาดไฟล์ไม่เกิน 10 MB ต่อไฟล์ เพื่อประหยัดพื้นที่จัดเก็บของเครื่อง
              </div>
            </div>

            <form onSubmit={handleAddDocSubmit} className="space-y-4 text-xs">
              {/* FILE UPLOAD INPUT SECTION */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-stone-800 dark:text-stone-200">
                  📁 เลือกไฟล์เอกสารเพื่ออัปโหลด (PDF, Word, Excel, รูปภาพ)
                </label>
                <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 rounded-2xl p-4 text-center bg-stone-50/60 dark:bg-stone-800/40 transition-colors">
                  <input
                    type="file"
                    id="central-doc-file-input"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="central-doc-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                  >
                    <UploadCloud className="w-8 h-8 text-amber-600" />
                    <span className="font-bold text-amber-700 dark:text-amber-400 hover:underline">
                      คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                    </span>
                    <span className="text-[11px] text-stone-400">
                      รองรับไฟล์ .PDF, .DOCX, .XLSX, รูปภาพ (ขนาดสูงสุดไม่เกิน 10 MB)
                    </span>
                  </label>
                </div>

                {/* Selected File Badge */}
                {uploadFile && (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold truncate">{uploadFile.name}</span>
                      <span className="text-stone-400 text-[11px]">({formatBytes(uploadFile.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setUploadFileDataUrl('');
                      }}
                      className="text-stone-400 hover:text-rose-500 p-1"
                      title="ยกเลิกไฟล์นี้"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* File Error Notice */}
                {fileError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 font-semibold text-[11px]">
                    {fileError}
                  </div>
                )}
              </div>

              {/* Online External URL (Alternative or addition) */}
              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  🔗 หรือแนบลิงก์เอกสารออนไลน์ (URL จากเว็บ สถ. / กรมบัญชีกลาง - ไม่กินพื้นที่จัดเก็บ)
                </label>
                <input
                  type="url"
                  value={newDocForm.externalUrl}
                  onChange={(e) => setNewDocForm({ ...newDocForm, externalUrl: e.target.value })}
                  placeholder="เช่น https://www.dla.go.th/... หรือ https://www.cgd.go.th/..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              {/* Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">หมวดหมู่เอกสาร *</label>
                  <select
                    value={newDocForm.category}
                    onChange={(e) => setNewDocForm({ ...newDocForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
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
                    placeholder="เช่น ว 23, พ.ร.บ. พัสดุฯ, มท 0808..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">ชื่อเรื่องเอกสาร / หัวข้อเรื่อง *</label>
                <input
                  type="text"
                  value={newDocForm.title}
                  onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                  placeholder="เช่น แนวทางปฏิบัติการตรวจรับพัสดุและการควบคุมภายใน พ.ศ. 2569"
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
                  placeholder="เช่น การจัดซื้อจัดจ้าง, ค่าเช่าบ้าน, การเบิกจ่ายเงิน"
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="คำอธิบายสรุปสาระสำคัญโดยสังเขป..."
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">ประเด็นสำคัญที่ต้องตรวจสอบ (บรรทัดละ 1 ข้อ)</label>
                <textarea
                  rows={2}
                  value={newDocForm.keyPoints}
                  onChange={(e) => setNewDocForm({ ...newDocForm, keyPoints: e.target.value })}
                  placeholder="ข้อ 1: ตรวจสอบความถูกต้องของเอกสาร&#10;ข้อ 2: ตรวจสอบการอนุมัติฎีกา..."
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">เนื้อหา / คำชี้แจงฉบับเต็ม</label>
                <textarea
                  rows={3}
                  value={newDocForm.fullContent}
                  onChange={(e) => setNewDocForm({ ...newDocForm, fullContent: e.target.value })}
                  placeholder="รายละเอียดคำอธิบายฉบับเต็ม (หากไม่มีไฟล์แนบ)..."
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-sans text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">แท็กคำค้นหา (คั่นด้วยเครื่องหมายจุลภาค ,)</label>
                <input
                  type="text"
                  value={newDocForm.tags}
                  onChange={(e) => setNewDocForm({ ...newDocForm, tags: e.target.value })}
                  placeholder="เช่น กฎหมาย, เบิกจ่าย, ค่าเช่าบ้าน, สถ."
                  className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกลงคลังกลาง'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
