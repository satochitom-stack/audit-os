import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Info,
  AlertOctagon,
  HelpCircle,
  X,
  ShieldAlert,
  Sparkles,
  FileText,
  UserCheck,
  ShieldCheck,
  Check
} from 'lucide-react';

/**
 * Event-driven Luxury Modal Dispatcher
 * Allows any part of the application to trigger a high-end luxury confirm or alert modal
 * with full promise-based async resolution.
 */

const MODAL_EVENT_NAME = 'ia_open_luxury_modal';

/**
 * Triggers a luxury confirmation dialog (Yes / Cancel)
 * @param {Object} options
 * @param {string} options.title - Header title
 * @param {string|React.ReactNode} options.message - Main description
 * @param {string} [options.itemTitle] - Highlighted item/document/user name
 * @param {string} [options.subMessage] - Caution or supplementary note
 * @param {string} [options.confirmText] - Label for confirm button (default: "ยืนยัน")
 * @param {string} [options.cancelText] - Label for cancel button (default: "ยกเลิก")
 * @param {'danger'|'warning'|'info'|'success'} [options.variant] - Theme color variant
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
 */
export function luxuryConfirm(options) {
  if (typeof options === 'string') {
    options = { message: options };
  }
  return new Promise((resolve) => {
    const detail = {
      ...options,
      isConfirm: true,
      variant: options.variant || (options.isDelete ? 'danger' : 'warning'),
      resolve
    };
    window.dispatchEvent(new CustomEvent(MODAL_EVENT_NAME, { detail }));
  });
}

/**
 * Triggers a luxury alert dialog (OK only)
 * @param {Object|string} options
 * @returns {Promise<boolean>} Resolves true when closed
 */
export function luxuryAlert(options) {
  if (typeof options === 'string') {
    options = { message: options };
  }
  return new Promise((resolve) => {
    const detail = {
      ...options,
      isConfirm: false,
      variant: options.variant || 'info',
      confirmText: options.confirmText || 'รับทราบ',
      resolve
    };
    window.dispatchEvent(new CustomEvent(MODAL_EVENT_NAME, { detail }));
  });
}

// Global window exposure for quick access anywhere
if (typeof window !== 'undefined') {
  window.luxuryConfirm = luxuryConfirm;
  window.luxuryAlert = luxuryAlert;

  // Intercept window.alert to automatically convert any alert into a luxury modal
  try {
    if (!window._nativeAlert) {
      window._nativeAlert = window.alert;
      window.alert = (message) => {
        const text = typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message || '');
        const isWarning = text.includes('กรุณา') || text.includes('เตือน') || text.includes('ไม่พบ') || text.includes('ผิดพลาด');
        const isError = text.includes('ผิดพลาด') || text.includes('Error') || text.includes('ล้มเหลว');
        luxuryAlert({
          title: isError ? 'แจ้งเตือนข้อผิดพลาด' : isWarning ? 'แจ้งเตือนจากระบบ' : 'แจ้งข้อมูลระบบ',
          message: text,
          variant: isError ? 'danger' : isWarning ? 'warning' : 'info'
        });
      };
    }
  } catch (_) {}
}

/**
 * Luxury Modal UI Container
 * Mount once at root (e.g. in App.jsx) to display modal states with high-end animations
 */
export default function LuxuryModalContainer() {
  const [modalState, setModalState] = useState(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    const handleOpen = (e) => {
      const detail = e.detail;
      setModalState(detail);
    };

    window.addEventListener(MODAL_EVENT_NAME, handleOpen);
    return () => window.removeEventListener(MODAL_EVENT_NAME, handleOpen);
  }, []);

  // Handle keyboard events (Escape to close, Enter to confirm)
  useEffect(() => {
    if (!modalState) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        // Only trigger confirm if active element is not cancel button
        if (document.activeElement?.getAttribute('data-action') !== 'cancel') {
          e.preventDefault();
          handleClose(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState]);

  // Auto-focus confirm button on open
  useEffect(() => {
    if (modalState) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [modalState]);

  if (!modalState) return null;

  const {
    title,
    message,
    itemTitle,
    subMessage,
    confirmText,
    cancelText = 'ยกเลิก',
    variant = 'warning',
    isConfirm = true,
    resolve
  } = modalState;

  const handleClose = (result) => {
    if (resolve) {
      resolve(result);
    }
    setModalState(null);
  };

  // Variant styling configurations
  const variantConfigs = {
    danger: {
      badgeText: 'SECURITY ACTION • การยืนยันความปลอดภัยขั้นสูง',
      defaultTitle: 'ยืนยันการลบข้อมูล',
      icon: Trash2,
      glowColor: 'bg-rose-500/20 dark:bg-rose-500/25',
      borderColor: 'border-rose-500/40 dark:border-rose-500/40',
      iconWrapper: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20 border-rose-500/30',
      confirmBtn: 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 border-rose-400/40',
      defaultConfirmText: 'ลบข้อมูลทันที'
    },
    warning: {
      badgeText: 'CONFIRMATION REQUIRED • โปรดยืนยันการดำเนินการ',
      defaultTitle: 'แจ้งเตือนและยืนยัน',
      icon: AlertTriangle,
      glowColor: 'bg-amber-500/20 dark:bg-amber-500/25',
      borderColor: 'border-amber-500/40 dark:border-amber-500/40',
      iconWrapper: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20 border-amber-500/30',
      confirmBtn: 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-stone-950 font-black shadow-lg shadow-amber-500/30 border-amber-300/60',
      defaultConfirmText: 'ยืนยันดำเนินการ'
    },
    info: {
      badgeText: 'AUDIT-OS SYSTEM NOTICE • ข้อมูลระบบ',
      defaultTitle: 'แจ้งข้อมูลระบบ',
      icon: Info,
      glowColor: 'bg-sky-500/20 dark:bg-sky-500/25',
      borderColor: 'border-sky-500/40 dark:border-sky-500/40',
      iconWrapper: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20 border-sky-500/30',
      confirmBtn: 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/30 border-sky-400/40',
      defaultConfirmText: 'รับทราบ'
    },
    success: {
      badgeText: 'ACTION SUCCESSFUL • ดำเนินการสำเร็จ',
      defaultTitle: 'ดำเนินการเรียบร้อย',
      icon: CheckCircle2,
      glowColor: 'bg-emerald-500/20 dark:bg-emerald-500/25',
      borderColor: 'border-emerald-500/40 dark:border-emerald-500/40',
      iconWrapper: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20 border-emerald-500/30',
      confirmBtn: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 border-emerald-400/40',
      defaultConfirmText: 'ตกลง'
    }
  };

  const config = variantConfigs[variant] || variantConfigs.warning;
  const IconComponent = config.icon;
  const finalTitle = title || config.defaultTitle;
  const finalConfirmText = confirmText || config.defaultConfirmText;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-stone-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => handleClose(false)}
    >
      {/* Modal Container */}
      <div
        className={`relative w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300 transform scale-100 bg-white dark:bg-stone-900 ${config.borderColor}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Ambient Top Glow Aura */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 blur-3xl rounded-full pointer-events-none ${config.glowColor}`}
        />

        {/* Top Header Badge & Close Button */}
        <div className="relative px-6 pt-5 pb-2 flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-stone-100/90 dark:bg-stone-800/90 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span>{config.badgeText}</span>
          </div>
          <button
            onClick={() => handleClose(false)}
            data-action="cancel"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            {/* Medallion Icon Badge */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-8 border shrink-0 transition-transform hover:scale-105 ${config.iconWrapper}`}
            >
              <IconComponent className="w-7 h-7" />
            </div>

            {/* Title & Message */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
                {finalTitle}
              </h3>

              <div className="mt-2 text-sm sm:text-[15px] text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                {message}
              </div>

              {/* Item Title Highlight Pill / Card (e.g. Document Title, User) */}
              {itemTitle && (
                <div className="mt-3.5 p-3 sm:p-3.5 rounded-2xl bg-amber-50/70 dark:bg-stone-800/80 border border-amber-200/80 dark:border-stone-700/80 flex items-start gap-3 shadow-xs">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">
                      รายการที่เกี่ยวข้อง
                    </p>
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-100 break-words line-clamp-3 mt-0.5">
                      {itemTitle}
                    </p>
                  </div>
                </div>
              )}

              {/* Sub-message / Caution note */}
              {subMessage && (
                <div
                  className={`mt-3 p-3 rounded-xl border text-xs sm:text-[13px] leading-relaxed flex items-start gap-2.5 ${
                    variant === 'danger'
                      ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                      : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{subMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer Buttons */}
        <div className="relative px-6 py-4 bg-stone-50/80 dark:bg-stone-950/50 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-end gap-3">
          {isConfirm && (
            <button
              type="button"
              data-action="cancel"
              onClick={() => handleClose(false)}
              className="px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              {cancelText}
            </button>
          )}

          <button
            ref={confirmBtnRef}
            type="button"
            data-action="confirm"
            onClick={() => handleClose(true)}
            className={`px-5 sm:px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm border transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${config.confirmBtn}`}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-4 h-4" />
            ) : variant === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>{finalConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
