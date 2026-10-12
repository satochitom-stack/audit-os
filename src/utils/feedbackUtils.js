// ระบบจัดการข้อเสนอแนะและความคิดเห็นจากผู้ใช้งาน (User Feedback & Suggestions)
// บันทึกและส่งต่อถึง ADMIN เพื่อพัฒนาและปรับปรุงระบบตามความต้องการของ อปท.

export const FEEDBACK_CATEGORIES = [
  { id: 'renewal', label: '💳 แจ้งชำระเงิน / ขอต่ออายุแพ็กเกจ', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'feature', label: '🚀 เสนอแนะฟังก์ชัน/ฟีเจอร์ใหม่', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  { id: 'bug', label: '🐛 แจ้งปัญหาการใช้งาน / ข้อผิดพลาด', badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
  { id: 'form', label: '📑 ปรับปรุงแบบฟอร์ม / ระเบียบ / กระดาษทำการ', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  { id: 'ui', label: '🎨 ปรับปรุงความสวยงาม / ความสะดวก (UI/UX)', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  { id: 'other', label: '💬 ความคิดเห็นและข้อเสนอแนะทั่วไป', badgeColor: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' }
];

export const FEEDBACK_STATUSES = [
  { id: 'pending', label: '⏳ รอการตรวจสอบ', badgeColor: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  { id: 'reviewing', label: '🔍 กำลังพิจารณา', badgeColor: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
  { id: 'developing', label: '🛠️ กำลังพัฒนาในรอบถัดไป', badgeColor: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
  { id: 'completed', label: '✅ ปรับปรุงเรียบร้อยแล้ว', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  { id: 'declined', label: '❌ ไม่สามารถดำเนินการได้', badgeColor: 'bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700' }
];

const INITIAL_FEEDBACKS = [
  {
    id: 'FB-INIT-01',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdDateTh: '10 ต.ค. 2569 14:30',
    userId: 'auditor01',
    userName: 'นายกฤษณมงคล ธรรมพิทักษ์',
    userRole: 'auditor',
    orgName: 'อบต.ฝางคำ',
    category: 'feature',
    categoryLabel: '🚀 เสนอแนะฟังก์ชัน/ฟีเจอร์ใหม่',
    title: 'ขอให้เพิ่มระบบนับเวลาถอยหลังอายุสมาชิก และคลังเอกสารกลางที่ผู้ใช้ทุกคนสามารถอัปโหลดร่วมกันได้',
    description: 'อยากให้ผู้ตรวจสอบภายในของแต่ละ อปท. สามารถช่วยกันอัปโหลดหนังสือสั่งการ ว ต่างๆ และแบบฟอร์มตรวจสอบเข้าสู่ระบบกลางร่วมกันได้ เพื่อไม่ต้องรอให้ Admin เพิ่มคนเดียว',
    expectedBenefit: 'ช่วยให้ฐานข้อมูลระเบียบและแนวทางการตรวจสอบมีความสดใหม่และครอบคลุมทั่วประเทศ',
    priority: 'important',
    status: 'completed',
    adminNote: 'ดำเนินการพัฒนาเสร็จสิ้นแล้วในเวอร์ชัน 2.5.6 (ระบบคลังเอกสารกลางแบบแชร์ใช้งานร่วมกัน พร้อมระบบ In-app Document Viewer)',
    adminRepliedAt: '12 ต.ค. 2569 11:50'
  }
];

export function getUserFeedbacks() {
  try {
    const saved = localStorage.getItem('ia_user_feedbacks');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load feedbacks:', e);
  }
  return INITIAL_FEEDBACKS;
}

export function saveUserFeedback({
  title,
  category = 'feature',
  priority = 'normal',
  description,
  expectedBenefit = '',
  session,
  orgProfile
}) {
  const currentFeedbacks = getUserFeedbacks();

  const catObj = FEEDBACK_CATEGORIES.find((c) => c.id === category);
  const now = new Date();

  const newFeedback = {
    id: `FB-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: now.toISOString(),
    createdDateTh: now.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    userId: session?.user?.id || session?.username || 'user',
    userName: session?.user?.name || session?.username || 'ผู้ตรวจสอบภายใน',
    userRole: session?.role || 'auditor',
    orgName: orgProfile?.name || 'อปท.',
    category,
    categoryLabel: catObj ? catObj.label : 'ข้อเสนอแนะ',
    title: title.trim(),
    description: description.trim(),
    expectedBenefit: expectedBenefit.trim(),
    priority, // 'normal' | 'important' | 'urgent'
    status: 'pending', // default
    adminNote: '',
    adminRepliedAt: null
  };

  const updated = [newFeedback, ...currentFeedbacks];
  try {
    localStorage.setItem('ia_user_feedbacks', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ia_feedbacks_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save feedback:', e);
  }

  return newFeedback;
}

export function updateFeedbackStatus(feedbackId, newStatus, adminNote = '') {
  const currentFeedbacks = getUserFeedbacks();
  const updated = currentFeedbacks.map((f) => {
    if (f.id === feedbackId) {
      return {
        ...f,
        status: newStatus,
        adminNote: adminNote !== undefined ? adminNote : f.adminNote,
        adminRepliedAt: new Date().toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    }
    return f;
  });

  try {
    localStorage.setItem('ia_user_feedbacks', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ia_feedbacks_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to update feedback status:', e);
  }

  return updated;
}

export function deleteFeedback(feedbackId) {
  const currentFeedbacks = getUserFeedbacks();
  const updated = currentFeedbacks.filter((f) => f.id !== feedbackId);
  try {
    localStorage.setItem('ia_user_feedbacks', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ia_feedbacks_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to delete feedback:', e);
  }
  return updated;
}

export const addFeedback = saveUserFeedback;
