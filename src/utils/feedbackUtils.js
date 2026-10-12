// ระบบจัดการข้อเสนอแนะและความคิดเห็นจากผู้ใช้งาน (User Feedback & Suggestions)
// บันทึกและส่งต่อถึง ADMIN เพื่อพัฒนาและปรับปรุงระบบตามความต้องการของ อปท.
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

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

// No initial sample feedbacks - starts clean
const INITIAL_FEEDBACKS = [];

const DELETED_FEEDBACKS_KEY = 'ia_deleted_feedback_ids';
const FEEDBACKS_STORAGE_KEY = 'ia_user_feedbacks';

export function getDeletedFeedbackIds() {
  try {
    const saved = localStorage.getItem(DELETED_FEEDBACKS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function saveDeletedFeedbackIds(ids) {
  try {
    localStorage.setItem(DELETED_FEEDBACKS_KEY, JSON.stringify(ids));
  } catch (_) {}
}

export function getUserFeedbacks() {
  try {
    const deletedIds = new Set([
      ...getDeletedFeedbackIds(),
      'FB-INIT-01' // Blacklist sample mock feedback permanently
    ]);

    const saved = localStorage.getItem(FEEDBACKS_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (f) => !f.id?.startsWith('FB-INIT-') && !deletedIds.has(f.id)
        );
        // If stale sample feedback was present, clean it up immediately
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.error('Failed to load feedbacks:', e);
  }
  return [];
}

// Sync with Cloud Firestore
export async function syncFeedbacksToCloud(list, newlyDeletedIds = []) {
  try {
    let currentDeleted = getDeletedFeedbackIds();
    if (newlyDeletedIds && newlyDeletedIds.length > 0) {
      const set = new Set([...currentDeleted, ...newlyDeletedIds, 'FB-INIT-01']);
      currentDeleted = Array.from(set);
      saveDeletedFeedbackIds(currentDeleted);
    }

    const docRef = doc(db, 'system_settings', 'user_feedbacks');
    await setDoc(
      docRef,
      {
        feedbacks: list,
        deletedIds: currentDeleted,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Sync feedbacks to Firestore failed (offline or denied):', err);
  }
}

// Subscribe to real-time updates from Cloud Firestore
export function subscribeToFeedbacks(callback) {
  try {
    const docRef = doc(db, 'system_settings', 'user_feedbacks');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const remoteList = data?.feedbacks;
          const remoteDeleted = data?.deletedIds || [];

          if (Array.isArray(remoteDeleted) && remoteDeleted.length > 0) {
            const currentDeleted = new Set(getDeletedFeedbackIds());
            remoteDeleted.forEach((id) => currentDeleted.add(id));
            saveDeletedFeedbackIds(Array.from(currentDeleted));
          }

          if (Array.isArray(remoteList)) {
            const deletedIds = new Set([
              ...getDeletedFeedbackIds(),
              'FB-INIT-01'
            ]);
            const filtered = remoteList.filter(
              (f) => !f.id?.startsWith('FB-INIT-') && !deletedIds.has(f.id)
            );
            localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(filtered));
            window.dispatchEvent(new CustomEvent('ia_feedbacks_updated', { detail: filtered }));
            if (callback) callback(filtered);
          }
        }
      },
      (err) => {
        console.warn('Feedbacks real-time snapshot error:', err);
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to feedbacks:', e);
    return () => {};
  }
}

export async function saveUserFeedback({
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
    userName: session?.user?.name || session?.displayName || session?.username || 'ผู้ตรวจสอบภายใน',
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
    localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ia_feedbacks_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save feedback to localStorage:', e);
  }

  await syncFeedbacksToCloud(updated);
  return newFeedback;
}

export async function updateFeedbackStatus(feedbackId, newStatus, adminNote = '') {
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
    localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ia_feedbacks_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to update feedback status:', e);
  }

  await syncFeedbacksToCloud(updated);
  return updated;
}

export async function deleteFeedback(feedbackId) {
  // Add to deleted blacklist permanently
  const deletedIds = new Set([...getDeletedFeedbackIds(), feedbackId, 'FB-INIT-01']);
  saveDeletedFeedbackIds(Array.from(deletedIds));

  const currentFeedbacks = getUserFeedbacks();
  const updated = currentFeedbacks.filter((f) => f.id !== feedbackId && !f.id?.startsWith('FB-INIT-'));

  try {
    localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ia_feedbacks_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to delete feedback:', e);
  }

  await syncFeedbacksToCloud(updated, [feedbackId]);
  return updated;
}

export async function clearAllFeedbacks() {
  const currentFeedbacks = getUserFeedbacks();
  const allIds = currentFeedbacks.map((f) => f.id);
  const deletedIds = new Set([...getDeletedFeedbackIds(), ...allIds, 'FB-INIT-01']);
  saveDeletedFeedbackIds(Array.from(deletedIds));

  try {
    localStorage.setItem(FEEDBACKS_STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('ia_feedbacks_updated', { detail: [] }));
  } catch (e) {
    console.error('Failed to clear all feedbacks:', e);
  }

  await syncFeedbacksToCloud([], allIds);
  return [];
}

export const addFeedback = saveUserFeedback;
