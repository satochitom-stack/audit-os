import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  Copy,
  ExternalLink,
  Database,
  AlertCircle,
  X,
  Upload,
  Download,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { cloudSyncService, mergeRiskManagement } from '../services/cloudSyncService';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  testSupabaseConnection
} from '../services/supabaseClient';
import { SUPABASE_SCHEMA_SQL } from '../data/supabaseSchemaSql';

export default function CloudSyncModal({
  isOpen,
  onClose,
  riskManagementByYear,
  setRiskManagementByYear,
  selectedYear,
  isAdmin = false
}) {
  const [config, setConfig] = useState(() => getSupabaseConfig());
  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [syncStatus, setSyncStatus] = useState(() => cloudSyncService.getSyncStatus());
  const [isTesting, setIsTesting] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showConfigFields, setShowConfigFields] = useState(false);

  useEffect(() => {
    const unsub = cloudSyncService.onSyncStatusChange((st) => {
      setSyncStatus(st);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const current = getSupabaseConfig();
    setUrl(current.url || '');
    setAnonKey(current.anonKey || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await testSupabaseConnection(url, anonKey);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.tableMissing
            ? '✓ เชื่อมต่อสำเร็จ! (โปรดอย่าลืมรันคำสั่ง SQL ในขั้นตอนที่ 2)'
            : '✓ เชื่อมต่อฐานข้อมูล Supabase สำเร็จสมบูรณ์แบบ!'
        });
      } else {
        setFeedback({
          type: 'error',
          message: `เชื่อมต่อไม่สำเร็จ: ${res.message}`
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!url || !anonKey) {
      setFeedback({ type: 'error', message: 'กรุณากรอกทั้ง Project URL และ Anon Key' });
      return;
    }
    saveSupabaseConfig(url, anonKey);
    setFeedback({ type: 'success', message: '✓ บันทึกการเชื่อมต่อเรียบร้อยแล้ว! กำลังเริ่มซิงค์อัตโนมัติ...' });
    cloudSyncService.initRealtimeSync();
  };

  const handleDisconnect = () => {
    saveSupabaseConfig('', '');
    setUrl('');
    setAnonKey('');
    setFeedback({ type: 'info', message: 'ตัดการเชื่อมต่อ Cloud แล้ว กลับสู่โหมด LocalStorage ในเครื่อง' });
  };

  // Sync Now: Pull latest from Cloud and merge
  const handleSyncNow = async () => {
    setIsBusy(true);
    setFeedback(null);
    try {
      const cloudData = await cloudSyncService.pullAllRiskManagement();
      if (cloudData && Object.keys(cloudData).length > 0 && setRiskManagementByYear) {
        setRiskManagementByYear((prev) => {
          const next = { ...prev };
          Object.keys(cloudData).forEach((yr) => {
            if (cloudData[yr]) {
              next[yr] = mergeRiskManagement(next[yr], cloudData[yr]);
            }
          });
          return next;
        });
        setFeedback({
          type: 'success',
          message: '✓ ดึงและผสานรวมข้อมูลล่าสุดจาก Cloud เรียบร้อยแล้ว!'
        });
      } else {
        setFeedback({
          type: 'info',
          message: 'ฐานข้อมูลบน Cloud ยังไม่มีรายการใหม่ หรือกำลังใช้งานข้อมูลล่าสุดอยู่แล้ว'
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `ซิงค์ไม่สำเร็จ: ${err.message}` });
    } finally {
      setIsBusy(false);
    }
  };

  // Upload All Local Data to Cloud (Initial Seed)
  const handleUploadAllToCloud = async () => {
    if (!riskManagementByYear) return;
    setIsBusy(true);
    setFeedback(null);
    try {
      const res = await cloudSyncService.pushAllRiskManagement(riskManagementByYear);
      setFeedback({
        type: 'success',
        message: `✓ อัปโหลดข้อมูลแบบ บส. ทุกกองขึ้น Supabase สำเร็จเรียบร้อยแล้ว (${res.count} รายการ)! ทุกเครื่องจะเห็นข้อมูลนี้ทันที`
      });
    } catch (err) {
      setFeedback({ type: 'error', message: `อัปโหลดไม่สำเร็จ: ${err.message}` });
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const isConnected = isSupabaseConfigured() && syncStatus.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 dark:from-slate-850 dark:via-slate-850 dark:to-slate-850">
          <div className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
                isConnected
                  ? 'bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-indigo-600 shadow-indigo-500/20'
              }`}
            >
              {isConnected ? <Cloud className="w-6 h-6" /> : <CloudOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ระบบซิงค์ออนไลน์เรียลไทม์ (Supabase Cloud)
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : isSupabaseConfigured()
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {isConnected
                    ? '🟢 เชื่อมต่อเรียลไทม์'
                    : isSupabaseConfigured()
                    ? '🟡 กำลังเชื่อมต่อ...'
                    : '⚪ ออฟไลน์ (เครื่องเดียว)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เชื่อมต่อและซิงค์ข้อมูลระหว่างกองและหน่วยตรวจสอบภายในแบบเรียลไทม์
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : feedback.type === 'info'
                ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto text-xs">
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span>สถานะการซิงค์: {syncStatus.status === 'connected' ? 'ออนไลน์แบบเรียลไทม์ (Live WebSocket)' : 'ออฟไลน์'}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                ซิงค์ครั้งล่าสุด: <span className="font-semibold text-slate-700 dark:text-slate-300">{syncStatus.lastSyncTime || 'ยังไม่มีการซิงค์'}</span>
                {syncStatus.error && <span className="text-rose-500 ml-2">({syncStatus.error})</span>}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {isSupabaseConfigured() && (
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isBusy}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  title="ดึงข้อมูลล่าสุดจาก Cloud มาอัปเดตลงเครื่อง"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                  <span>{isBusy ? 'กำลังซิงค์...' : 'ซิงค์เดี๋ยวนี้ (Sync)'}</span>
                </button>
              )}

              {isAdmin && isSupabaseConfigured() && (
                <button
                  type="button"
                  onClick={handleUploadAllToCloud}
                  disabled={isBusy}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                  title="ส่งข้อมูลในเครื่องทั้งหมดขึ้น Cloud (เหมาะสำหรับรันครั้งแรกหลังตั้งค่า)"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ส่งข้อมูลในเครื่องขึ้น Cloud</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Setup Guide Accordion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>วิธีเริ่มต้นใช้งาน Supabase (ฟรี) ใน 3 ขั้นตอน:</span>
              </h4>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center space-x-1 text-[11px] font-semibold"
              >
                <span>เปิด Supabase.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
              <li>
                <strong>สร้างโปรเจกต์:</strong> สมัครและสร้าง Project บน <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase</a> (เลือก Region Singapore)
              </li>
              <li>
                <strong>รันคำสั่ง SQL สร้างตาราง:</strong> เข้าไปที่เมนู <strong>SQL Editor</strong> บน Supabase กดปุ่มด้านล่างเพื่อคัดลอกสคริปต์ แล้วนำไปวางแล้วกด <strong>Run</strong>
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-700 flex items-center space-x-1.5 cursor-pointer text-xs"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedSql ? '✓ คัดลอก SQL แล้ว!' : 'คัดลอกคำสั่ง SQL สำหรับ Supabase'}</span>
                  </button>
                </div>
              </li>
              <li>
                <strong>นำ URL และ Key มากราก:</strong> ไปที่หน้า <strong>Project Settings &rarr; Data API</strong> คัดลอก <em>Project URL</em> และ <em>anon public key</em> มาใส่ในช่องด้านล่าง แล้วกด <strong>บันทึกการเชื่อมต่อ</strong>
              </li>
            </ol>
          </div>

          {/* Credentials Settings */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                <span>การตั้งค่าเชื่อมต่อ Supabase API</span>
              </h4>
              {isSupabaseConfigured() && (
                <button
                  type="button"
                  onClick={() => setShowConfigFields(!showConfigFields)}
                  className="text-blue-600 text-xs font-semibold hover:underline"
                >
                  {showConfigFields ? 'ซ่อนฟอร์ม' : 'แก้ไขค่า URL/Key'}
                </button>
              )}
            </div>

            {(!isSupabaseConfigured() || showConfigFields) && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzabcdefghijklmnop.supabase.co"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Supabase Anon Public API Key:
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !url || !anonKey}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {isSupabaseConfigured() && (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-semibold transition-colors"
                      >
                        ตัดการเชื่อมต่อ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveConnection}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>บันทึกและเชื่อมต่อ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isSupabaseConfigured() && !showConfigFields && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate">
                URL: {url}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>เมื่อเชื่อมต่อแล้ว ระบบจะส่งข้อมูลสดผ่าน Realtime WebSocket อัตโนมัติทุกครั้งที่มีการบันทึก</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
