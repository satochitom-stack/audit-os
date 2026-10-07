import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, Info, CheckCircle2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'ยืนยันการทำรายการ',
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  isAlert = false,
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  icon,
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60';
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60';
    }
  };

  const getConfirmButtonClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 transition-all relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-3.5">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${getIconBg()}`}
          >
            {getIcon()}
          </div>
          <div className="space-y-1 flex-1 pr-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          {!isAlert && cancelText && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center space-x-1.5 ${getConfirmButtonClasses()}`}
          >
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
