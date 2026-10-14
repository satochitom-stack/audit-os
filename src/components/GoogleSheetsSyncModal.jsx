import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Upload,
  Download,
  ShieldCheck,
  Sparkles,
  Lock,
  Zap,
  X,
  Check,
  Radio,
  FileCode2,
  Database,
  ArrowRight,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  testGoogleSheetsConnection,
  pushToGoogleSheets,
  pullFromGoogleSheets,
  getAppsScriptTemplate
} from '../services/googleSheetsSyncService';

export default function GoogleSheetsSyncModal({
  isOpen,
  onClose,
  allData,
  onImportBackup,
  onExportBackup,
  session
}) {
  const [config, setConfig] = useState(() => getGoogleSheetsConfig(session));
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [activeTab, setActiveTab] = useState(() => (config.webAppUrl ? 'dashboard' : 'setup'));
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showCodePreview, setShowCodePreview] = useState(false);

  useEffect(() => {
    const current = getGoogleSheetsConfig(session);
    setConfig(current);
    setWebAppUrl(current.webAppUrl || '');
    if (current.webAppUrl) {
      setActiveTab('dashboard');
    }
  }, [isOpen, session]);

  if (!isOpen) return null;

  const isConnected = !!config.webAppUrl;
  const scriptCode = getAppsScriptTemplate();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedCode(true);
    setFeedback({
      type: 'success',
      message: '✓ คัดลอกโค้ด Google Apps Script เรียบร้อยแล้ว! สามารถนำไปวางในหน้าต่าง Apps Script ได้ทันที'
    });
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleTest = async () => {
    if (!webAppUrl.trim()) {
      setFeedback({ type: 'error', message: 'กรุณากรอก URL เว็บแอปก่อนทำการทดสอบ' });
      return;
    }
    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await testGoogleSheetsConnection(webAppUrl);
      setFeedback({
        type: 'success',
        message: `✓ เชื่อมต่อสำเร็จ! เข้าถึง Google Sheet: "${res.sheetTitle}" สำเร็จเรียบร้อย`
      });
      const newConf = {
        ...config,
        webAppUrl: webAppUrl.trim(),
        sheetTitle: res.sheetTitle,
        sheetUrl: res.sheetUrl,
        lastStatus: 'success',
        lastError: null
      };
      saveGoogleSheetsConfig(newConf, session);
      setConfig(newConf);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndSync = async () => {
    if (!webAppUrl.trim()) {
      setFeedback({ type: 'error', message: 'กรุณากรอก URL เว็บแอปก่อนทำการบันทึก' });
      return;
    }
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await pushToGoogleSheets(webAppUrl, allData, session);
      const newConf = {
        ...config,
        webAppUrl: webAppUrl.trim(),
        sheetTitle: res.sheetTitle || config.sheetTitle,
        sheetUrl: res.sheetUrl || config.sheetUrl,
        lastSyncTime: new Date().toISOString(),
        lastStatus: 'success',
        lastError: null
      };
      saveGoogleSheetsConfig(newConf, session);
      setConfig(newConf);
      setActiveTab('dashboard');
      setFeedback({
        type: 'success',
        message: '✓ บันทึกและซิงค์ข้อมูลกระดาษทำการทั้งหมดลง Google Sheets ของท่านเรียบร้อยแล้ว!'
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualPush = async () => {
    if (!config.webAppUrl) return;
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await pushToGoogleSheets(config.webAppUrl, allData, session);
      setConfig(getGoogleSheetsConfig(session));
      setFeedback({
        type: 'success',
        message: '✓ ซิงค์ข้อมูลล่าสุดลง Google Sheets สำเร็จสมบูรณ์แบบ!'
      });
    } catch (err) {
      setFeedback({ type: 'error', message: 'การซิงค์ข้อมูลล้มเหลว: ' + err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualPull = async () => {
    if (!config.webAppUrl) return;
    if (!window.confirm('⚠️ คำเตือน: การดึงข้อมูลจาก Google Sheets จะนำข้อมูลสำรองบน Sheet มาแทนที่ข้อมูลปัจจุบันในเครื่อง ต้องการดำเนินการต่อหรือไม่?')) {
      return;
    }
    setIsPulling(true);
    setFeedback(null);
    try {
      const restoredData = await pullFromGoogleSheets(config.webAppUrl, session);
      if (onImportBackup && restoredData) {
        onImportBackup(restoredData);
      }
      setConfig(getGoogleSheetsConfig(session));
      setFeedback({
        type: 'success',
        message: '✓ กู้คืนข้อมูลจาก Google Sheets กลับสู่ระบบสำเร็จเรียบร้อยแล้ว!'
      });
    } catch (err) {
      setFeedback({ type: 'error', message: 'การดึงข้อมูลล้มเหลว: ' + err.message });
    } finally {
      setIsPulling(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('คุณต้องการยกเลิกการเชื่อมต่อกับ Google Sheet นี้ใช่หรือไม่? (ข้อมูลใน Google Sheet จะยังคงอยู่ ไม่สูญหาย)')) {
      const emptyConf = {
        webAppUrl: '',
        sheetTitle: '',
        sheetUrl: '',
        autoSync: true,
        lastSyncTime: null,
        lastStatus: 'idle',
        lastError: null
      };
      saveGoogleSheetsConfig(emptyConf, session);
      setConfig(emptyConf);
      setWebAppUrl('');
      setActiveTab('setup');
      setFeedback({ type: 'info', message: 'ยกเลิกการเชื่อมต่อเรียบร้อยแล้ว' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#1f2430] border border-stone-200 dark:border-stone-700/80 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-amber-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-emerald-600/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-emerald-100 flex items-center gap-2">
                <span>ฐานข้อมูล Google Sheets ของ อปท. (BYOD)</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-black">
                  100% Data Sovereignty
                </span>
              </h3>
              <p className="text-xs text-stone-300">
                ข้อมูลกระดาษทำการ แผนงาน และรายงานทั้งหมด บันทึกลง Google Drive ของ อปท. ท่านเองโดยตรง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3.5 rounded-t-xl border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#1f2430]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>ศูนย์ควบคุมการซิงค์ (Sync Cockpit)</span>
            {isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`py-2 px-3.5 rounded-t-xl border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'setup'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#1f2430]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>วิธีเชื่อมต่อ & โค้ด Apps Script (Quick Setup)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                  : feedback.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{feedback.message}</div>
            </div>
          )}

          {/* TAB 1: DASHBOARD & SYNC ACTIONS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Concept Security Trust Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-stone-50 to-amber-50/40 dark:from-emerald-950/30 dark:via-stone-850 dark:to-stone-800 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>หลักการ Bring Your Own Database (BYOD) เพื่อ อปท.</span>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                  ระบบ <strong>Audit-OS</strong> ทำงานแบบ Local-First ประมวลผลในตัวเครื่องเพื่อความเร็วสูงสุด และส่งข้อมูลสำรองไปจัดเก็บบน <strong>Google Spreadsheet ใน Google Drive ส่วนตัวของท่าน</strong> เจ้าของระบบไม่มีสิทธิ์เข้าถึงหรือเปิดดูข้อตรวจพบของท่าน ข้อมูลจึงปลอดภัยสูงสุดตามระเบียบรักษาความปลอดภัยของข้อมูลราชการ
                </p>
                <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-stone-600 dark:text-stone-400">
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>ข้อมูลเป็นของ อปท. 100%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>เปิดดูและแก้ใน Excel ได้ทันที</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>ค่าสมาชิกถูก ไม่คิดค่า Cloud</span>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>สถานะการเชื่อมต่อ Google Sheets</span>
                  </span>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>เชื่อมต่อแล้ว (พร้อมซิงค์)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <span>⚠️ ยังไม่ได้เชื่อมต่อ</span>
                    </span>
                  )}
                </div>

                {isConnected ? (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          📄 {config.sheetTitle || 'Google Sheets ฐานข้อมูลตรวจสอบ'}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {config.lastSyncTime ? (
                            <span>
                              ซิงค์ล่าสุด: {new Date(config.lastSyncTime).toLocaleString('th-TH')}
                            </span>
                          ) : (
                            <span>ยังไม่เคยซิงค์ข้อมูล (กดปุ่มซิงค์ด้านล่างเพื่อเริ่มการซิงค์ครั้งแรก)</span>
                          )}
                        </div>
                      </div>

                      {config.sheetUrl && (
                        <a
                          href={config.sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-100 font-bold transition-all shrink-0 cursor-pointer text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>เปิดดูแผ่นงาน Google Sheet</span>
                        </a>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleManualPush}
                        disabled={isSyncing}
                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'กำลังส่งข้อมูลขึ้น Google Sheets...' : '🔄 ซิงค์ข้อมูลขึ้น Google Sheets ทันที'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleManualPull}
                        disabled={isPulling}
                        className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600 disabled:opacity-50 text-amber-100 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-600"
                      >
                        <Download className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                        <span>{isPulling ? 'กำลังดึงข้อมูลสำรอง...' : '📥 ดึงข้อมูลกู้คืนจาก Google Sheets (Restore)'}</span>
                      </button>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-stone-200/70 dark:border-stone-700">
                      <button
                        type="button"
                        onClick={() => setActiveTab('setup')}
                        className="text-[11px] text-stone-500 hover:text-emerald-600 font-medium underline cursor-pointer"
                      >
                        แก้ไข URL เว็บแอป หรือ ดูโค้ด Apps Script
                      </button>

                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        ตัดการเชื่อมต่อ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white dark:bg-stone-850 border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2">
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      ยังไม่ได้เชื่อมต่อ Google Sheets! เริ่มต้นเชื่อมต่อง่ายๆ เพียง 4 ขั้นตอน เพื่อจัดเก็บข้อมูลไว้บน Google Drive ของท่านเอง
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('setup')}
                      className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>เริ่มตั้งค่าการเชื่อมต่อ (Quick Setup)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Direct JSON File Backup (Fallback) */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-stone-500" />
                    <span>สำรองข้อมูลฉุกเฉินเป็นไฟล์ (.json) ในคอมพิวเตอร์</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    สำหรับผู้ที่ไม่ต้องการต่อเน็ต สามารถดาวน์โหลดไฟล์สำรองเก็บไว้ในเครื่องได้ตลอดเวลา
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {onExportBackup && (
                    <button
                      type="button"
                      onClick={onExportBackup}
                      className="py-1.5 px-3 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100 font-bold text-xs transition-all cursor-pointer"
                    >
                      💾 ดาวน์โหลดไฟล์สำรอง
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SETUP WIZARD & APPS SCRIPT CODE */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>ขั้นตอนการเชื่อมต่อ Google Sheets (ทำเพียง 1 ครั้ง ไม่เกิน 2 นาที)</span>
                </div>

                {/* 4 Steps */}
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">สร้าง Google Sheet ใหม่ใน Google Drive ของ อปท.</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        เปิด <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3 inline" /></a> หรือไปที่ Google Drive ของท่าน แล้วสร้าง Google Sheets เปล่า 1 ไฟล์
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">เปิดหน้าต่าง Apps Script</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        ใน Google Sheet นั้น ให้คลิกที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
                        <span>วางโค้ดสคริปต์ Webhook (คลิกปุ่มคัดลอกด้านล่าง)</span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCode ? 'คัดลอกแล้ว!' : '📋 คัดลอกโค้ดสคริปต์'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        ลบโค้ดเดิมในหน้าต่าง Apps Script ออกทั้งหมด แล้วกดวางโค้ดนี้ลงไป จากนั้นกดรูปแผ่นดิสก์เพื่อบันทึก (Save)
                      </div>

                      {/* Code preview toggle */}
                      <button
                        type="button"
                        onClick={() => setShowCodePreview(!showCodePreview)}
                        className="text-[10px] text-emerald-600 hover:underline mt-1 cursor-pointer font-semibold block"
                      >
                        {showCodePreview ? '▲ ซ่อนตัวอย่างโค้ด' : '▼ ดูตัวอย่างโค้ด Apps Script'}
                      </button>

                      {showCodePreview && (
                        <div className="mt-2 p-2 rounded-lg bg-stone-900 text-stone-300 font-mono text-[10px] max-h-48 overflow-y-auto">
                          <pre>{scriptCode.slice(0, 1000)}... (และฟังก์ชันสร้างตารางอีก 250 บรรทัด)</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                      4
                    </div>
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">ทำให้ใช้งานได้ (Deploy) เป็น เว็บแอป (Web app)</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                        คลิกปุ่มสีน้ำเงิน <strong>"ทำให้ใช้งานได้" (Deploy)</strong> &gt; <strong>"การทำให้ใช้งานได้รายการใหม่" (New deployment)</strong><br />
                        - เลือกประเภท: <strong>เว็บแอป (Web app)</strong><br />
                        - ดำเนินการในฐานะ: <strong>ฉัน (Me)</strong><br />
                        - ผู้ที่มีสิทธิ์เข้าถึง: <strong>ทุกคน (Anyone)</strong> <span className="text-amber-600 font-bold">*** สำคัญมาก ***</span><br />
                        กด "ทำให้ใช้งานได้" แล้วอนุมัติสิทธิ์ (Authorize access) จากนั้นคัดลอก <strong>URL เว็บแอป</strong> มาใส่ในช่องด้านล่าง
                      </div>
                    </div>
                  </div>
                </div>

                {/* Web App URL Input Form */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      🔗 วาง URL เว็บแอป (Google Apps Script Web App URL):
                    </label>
                    <input
                      type="url"
                      value={webAppUrl}
                      onChange={(e) => setWebAppUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                      className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 font-mono text-xs text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                      * URL จะลงท้ายด้วย <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-amber-700">/exec</code>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={isTesting || !webAppUrl.trim()}
                      className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-stone-300 dark:border-stone-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'กำลังทดสอบการเชื่อมต่อ...' : '🔍 ทดสอบการเชื่อมต่อ (Ping)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndSync}
                      disabled={isSyncing || !webAppUrl.trim()}
                      className="flex-1 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-md shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSyncing ? 'กำลังซิงค์ข้อมูลชุดแรก...' : '✅ บันทึกการเชื่อมต่อและซิงค์ข้อมูลทันที'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between text-xs">
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>ปลอดภัย 100% ภายใต้บัญชี Google Workspace ของหน่วยงานท่าน</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 font-bold text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
