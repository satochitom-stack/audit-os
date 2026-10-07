import React from 'react';
import {
  X,
  History,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { SYSTEM_CHANGELOG } from '../data/changelogData';

export default function ChangelogModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <span>บันทึกการปรับปรุงระบบ (Release Notes)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {SYSTEM_CHANGELOG[0]?.version}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ประวัติการอัปเดตและพัฒนาเว็บแอพพลิเคชัน IA-OS อบต.ฝางคำ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {SYSTEM_CHANGELOG.map((log, logIdx) => (
            <div
              key={log.version}
              className={`space-y-4 relative ${
                logIdx !== SYSTEM_CHANGELOG.length - 1
                  ? 'pb-8 border-b border-slate-800/80'
                  : ''
              }`}
            >
              {/* Version & Date Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-base font-black text-cyan-400">
                    {log.version}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      log.badgeColor === 'emerald'
                        ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400'
                        : log.badgeColor === 'blue'
                        ? 'bg-blue-950/70 border-blue-500/30 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {log.tag}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{log.date}</span>
                </div>
              </div>

              {/* Title & Summary */}
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {log.title}
                </h3>
                {log.summary && (
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    {log.summary}
                  </p>
                )}
              </div>

              {/* Categories & Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {log.sections.map((section, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/70 space-y-2"
                  >
                    <div className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                      <span>{section.category}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {section.items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            ระบบปฏิบัติการตรวจสอบภายใน อบต.ฝางคำ (IA-OS)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
