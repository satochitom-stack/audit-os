import React, { useState, useEffect } from 'react';
import {
  MessageSquarePlus,
  Send,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  User,
  Building,
  Check,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  FileText
} from 'lucide-react';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  getUserFeedbacks,
  saveUserFeedback
} from '../utils/feedbackUtils';

export default function UserFeedbackModal({ isOpen, onClose, session, orgProfile }) {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [feedbacks, setFeedbacks] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    category: 'feature',
    priority: 'normal',
    title: '',
    description: '',
    expectedBenefit: ''
  });

  const currentUserId = session?.user?.id || session?.username || 'user';
  const currentUserName = session?.user?.name || session?.username || 'ผู้ตรวจสอบภายใน';

  const loadFeedbacks = () => {
    setFeedbacks(getUserFeedbacks());
  };

  useEffect(() => {
    if (isOpen) {
      loadFeedbacks();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => loadFeedbacks();
    window.addEventListener('ia_feedbacks_updated', handleUpdate);
    return () => window.removeEventListener('ia_feedbacks_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('กรุณาระบุหัวข้อเรื่องข้อเสนอแนะ');
      return;
    }
    if (!form.description.trim()) {
      alert('กรุณาระบุรายละเอียดข้อเสนอแนะ');
      return;
    }

    setIsSubmitting(true);
    saveUserFeedback({
      title: form.title,
      category: form.category,
      priority: form.priority,
      description: form.description,
      expectedBenefit: form.expectedBenefit,
      session,
      orgProfile
    });

    setForm({
      category: 'feature',
      priority: 'normal',
      title: '',
      description: '',
      expectedBenefit: ''
    });
    setIsSubmitting(false);
    showToast('ส่งข้อเสนอแนะถึง ADMIN เรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็นครับ!');
    setActiveTab('history');
  };

  // Filter history for current user (or show all if admin)
  const myFeedbacks = session?.role === 'admin'
    ? feedbacks
    : feedbacks.filter((f) => f.userId === currentUserId || f.userName === currentUserName);

  const getStatusBadge = (statusId) => {
    const st = FEEDBACK_STATUSES.find((s) => s.id === statusId) || FEEDBACK_STATUSES[0];
    return (
      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${st.badgeColor}`}>
        {st.label}
      </span>
    );
  };

  const getCategoryBadge = (catId) => {
    const cat = FEEDBACK_CATEGORIES.find((c) => c.id === catId) || FEEDBACK_CATEGORIES[0];
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cat.badgeColor}`}>
        {cat.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-stone-200/80 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4 bg-stone-50/70 dark:bg-stone-850/70">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <MessageSquarePlus className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                เสนอความคิดเห็น & ข้อเสนอแนะถึง ADMIN
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              เสนอแนะฟังก์ชันใหม่ หรือแจ้งจุดที่ต้องการปรับปรุง เพื่อให้ Audit-OS ตอบโจทย์ อปท. ของท่านมากยิ่งขึ้น
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center space-x-2 px-6 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs">
          <button
            onClick={() => setActiveTab('new')}
            className={`py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'new'
                ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>เขียนข้อเสนอแนะใหม่</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ประวัติข้อเสนอแนะของฉัน ({myFeedbacks.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-stone-700 dark:text-stone-300 custom-scrollbar space-y-4">
          {activeTab === 'new' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Identity Pill */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{currentUserName}</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-stone-400" />
                    <span>{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</span>
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 bg-white dark:bg-stone-700 px-2 py-0.5 rounded-md font-mono">
                  ส่งตรงถึง ADMIN
                </span>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">
                    ประเภทข้อเสนอแนะ *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold"
                  >
                    {FEEDBACK_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">
                    ระดับความสำคัญ
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold"
                  >
                    <option value="normal">⚪ ระดับปกติ (ทั่วไป)</option>
                    <option value="important">🟡 มีความสำคัญ (แนะนำให้มี)</option>
                    <option value="urgent">🔴 เร่งด่วน (ติดขัดในการปฏิบัติงานจริง)</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">
                  หัวข้อเรื่อง / ฟังก์ชันที่ต้องการ *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น ขอให้เพิ่มระบบพิมพ์สรุปผลเป็นไฟล์ PDF แบบรวมเล่ม, เพิ่มแบบฟอร์มตรวจสอบคลัง..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">
                  รายละเอียดความคิดเห็น / สิ่งที่ต้องการให้ระบบพัฒนาเพิ่มเติม *
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="อธิบายรายละเอียดสิ่งที่ท่านต้องการ หรือขั้นตอนที่พบปัญหาอย่างชัดเจน..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-sans leading-relaxed"
                  required
                />
              </div>

              {/* Expected Benefit */}
              <div>
                <label className="block font-semibold mb-1 text-stone-800 dark:text-stone-200">
                  ประโยชน์ที่คาดว่าจะได้รับต่องานตรวจสอบภายใน อปท. (ทางเลือก)
                </label>
                <textarea
                  rows={2}
                  value={form.expectedBenefit}
                  onChange={(e) => setForm({ ...form, expectedBenefit: e.target.value })}
                  placeholder="เช่น ช่วยลดเวลาในการพิมพ์เอกสารได้ 50%, สอดคล้องกับแนวทางของกรม สถ. ฉบับล่าสุด..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อเสนอแนะถึง ADMIN'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {myFeedbacks.length > 0 ? (
                myFeedbacks.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getCategoryBadge(item.category)}
                          {getStatusBadge(item.status)}
                          <span className="text-[11px] text-stone-400 font-mono">
                            {item.createdDateTh}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800">
                      {item.description}
                    </p>

                    {item.expectedBenefit && (
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        <strong>💡 ประโยชน์ที่คาดหวัง:</strong> {item.expectedBenefit}
                      </div>
                    )}

                    {/* Admin Response / Notes */}
                    {item.adminNote && (
                      <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-950 dark:text-amber-200 text-xs space-y-1">
                        <div className="font-bold flex items-center space-x-1 text-amber-800 dark:text-amber-300">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>การตอบกลับจาก ADMIN:</span>
                          {item.adminRepliedAt && (
                            <span className="text-[10px] text-stone-400 font-normal">
                              ({item.adminRepliedAt})
                            </span>
                          )}
                        </div>
                        <p className="leading-relaxed whitespace-pre-line">{item.adminNote}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4 space-y-2">
                  <MessageSquarePlus className="w-10 h-10 text-stone-300 mx-auto" />
                  <h4 className="font-bold text-stone-700 dark:text-stone-300 text-sm">
                    ยังไม่มีประวัติการส่งข้อเสนอแนะ
                  </h4>
                  <p className="text-stone-400 text-xs">
                    ท่านสามารถคลิกแท็บ "เขียนข้อเสนอแนะใหม่" เพื่อส่งความคิดเห็นถึง Admin ได้ทันที
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
