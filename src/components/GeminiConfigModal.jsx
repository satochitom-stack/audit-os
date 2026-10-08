import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Trash2,
  ShieldCheck,
  Cpu,
  Info,
  Check,
  Zap
} from 'lucide-react';
import {
  getGeminiConfig,
  saveGeminiConfig,
  testGeminiConnection,
  AVAILABLE_GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL
} from '../services/geminiAiService';

export default function GeminiConfigModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(DEFAULT_GEMINI_MODEL);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getGeminiConfig();
      setApiKey(current.apiKey || '');
      setModel(current.model || DEFAULT_GEMINI_MODEL);
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'กรุณากรอก API Key ก่อนทำการทดสอบ'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      let activeModel = model;
      let res = await testGeminiConnection(apiKey.trim(), activeModel);

      // If Google rejects 2.5-flash for new users, automatically switch and re-test with 3.8-flash
      if (!res.success && res.message && (res.message.includes('gemini-2.5-flash') || res.message.includes('gemini-3.8-flash'))) {
        activeModel = 'gemini-3.8-flash';
        setModel('gemini-3.8-flash');
        res = await testGeminiConnection(apiKey.trim(), 'gemini-3.8-flash');
        if (res.success) {
          res.message = '✓ ปรับเปลี่ยนเป็น Gemini 3.8 Flash (มาตรฐานใหม่ล่าสุดของ Google) และเชื่อมต่อสำเร็จเรียบร้อยแล้ว!';
        }
      }

      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการทดสอบ'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e) => {
    e?.preventDefault();
    saveGeminiConfig({ apiKey: apiKey.trim(), model });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    if (window.confirm('คุณต้องการล้างการเชื่อมต่อ Google Gemini API ออกจากระบบใช่หรือไม่?')) {
      saveGeminiConfig({ apiKey: '', model: DEFAULT_GEMINI_MODEL });
      setApiKey('');
      setModel(DEFAULT_GEMINI_MODEL);
      setTestResult(null);
    }
  };

  const isConfigured = Boolean(apiKey && apiKey.trim().length > 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50/60 via-indigo-50/40 to-blue-50/60 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-blue-950/20 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                ตั้งค่า Google Gemini Generative AI
                {isConfigured && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                    เชื่อมต่อแล้ว
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ระบบปัญญาประดิษฐ์วิเคราะห์ความเสี่ยงและมาตรการแก้ไขสำหรับองค์กรปกครองส่วนท้องถิ่น
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Gemini API Key Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600" />
                Google Gemini API Key:
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                รับ API Key ฟรีที่ Google AI Studio
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="วางรหัส AIzaSy..."
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title={showKey ? 'ซ่อนรหัส' : 'แสดงรหัส'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              รองรับ Free Tier จาก Google AI Studio โดยไม่ต้องเสียค่าใช้จ่าย
            </p>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              เลือกโมเดล Gemini (Model):
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            >
              {AVAILABLE_GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
              {AVAILABLE_GEMINI_MODELS.find((m) => m.id === model)?.desc || ''}
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isTesting || !apiKey.trim()}
              onClick={handleTest}
              className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isTesting || !apiKey.trim()
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                  : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  กำลังทดสอบการเชื่อมต่อ Google Gemini API...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  ทดสอบการเชื่อมต่อ (Ping Test)
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`mt-2.5 p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-2">
                    {testResult.success ? 'เชื่อมต่อสำเร็จเรียบร้อย!' : 'เชื่อมต่อไม่สำเร็จ'}
                    {testResult.latencyMs && (
                      <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {testResult.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] leading-relaxed opacity-90">{testResult.message}</div>
                  {!testResult.success && testResult.message && testResult.message.includes('gemini-3.8-flash') && (
                    <button
                      type="button"
                      onClick={() => {
                        setModel('gemini-3.8-flash');
                        setTimeout(() => handleTest(), 50);
                      }}
                      className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                      เปลี่ยนเป็น Gemini 3.8 Flash และทดสอบใหม่ทันที
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Educational Highlights Box */}
          <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              จุดเด่นของการเชื่อมต่อ AI สำหรับงานตรวจสอบภายใน อปท.
            </div>
            <ul className="space-y-1.5 list-disc list-inside leading-relaxed text-slate-700 dark:text-slate-300">
              <li>
                <strong className="text-purple-700 dark:text-purple-300">ปรับแต่งเฉพาะทาง (System Prompt):</strong> วางกรอบระเบียบการเงินการคลัง, ว 614, ว 3482, PDPA, ITA และบริบท อปท.
              </li>
              <li>
                <strong className="text-purple-700 dark:text-purple-300">ระบบทำงานออฟไลน์ (Offline Fallback):</strong> หากไม่มี API Key หรือเน็ตไม่เสถียร ระบบจะใช้คลังคำตอบมาตรฐานอัตโนมัติ ใช้งานได้ต่อเนื่อง 100%
              </li>
              <li>
                <strong className="text-purple-700 dark:text-purple-300">ความปลอดภัยสูงสุด:</strong> ข้อมูล API Key บันทึกใน LocalStorage ของเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ผ่านเซิร์ฟเวอร์คนกลาง
              </li>
            </ul>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between shrink-0">
          <div>
            {isConfigured && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="ล้างค่า API Key"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ล้างการเชื่อมต่อ
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  บันทึกสำเร็จ!
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  บันทึกการตั้งค่า
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
