/**
 * googleSheetsSyncService.js
 * 
 * Bring Your Own Database (BYOD) & Data Sovereignty Service for Audit-OS.
 * Allows local government internal auditors to synchronize working papers, 
 * annual plans, risk assessments, and CAPA follow-up registers directly to their 
 * personal Google Sheets on Google Drive via a lightweight Google Apps Script Web App.
 * 
 * Benefits:
 * 1. 100% Data Sovereignty: All audit evidence belongs exclusively to the auditor's Google Drive.
 * 2. Zero Server Storage Cost: Audit-OS runs client-side with zero Firebase Firestore storage overhead.
 * 3. Human-Readable Spreadsheets: Data is automatically formatted into clean, labeled tabs in Google Sheets.
 * 4. Instant 1-Click Restore: Can pull backup data from Google Sheets back into Audit-OS at any time.
 */

const CONFIG_KEY = 'ia_google_sheets_sync_config';

export function getGoogleSheetsConfig(session) {
  const userKey = session?.username ? `${CONFIG_KEY}_${session.username}` : CONFIG_KEY;
  const defaults = {
    webAppUrl: '',
    sheetTitle: '',
    sheetUrl: '',
    autoSync: true,
    lastSyncTime: null,
    lastStatus: 'idle', // 'idle' | 'syncing' | 'success' | 'error'
    lastError: null
  };
  try {
    const raw = localStorage.getItem(userKey) || localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error reading Google Sheets sync config:', err);
  }
  return defaults;
}

export function saveGoogleSheetsConfig(config, session) {
  const userKey = session?.username ? `${CONFIG_KEY}_${session.username}` : CONFIG_KEY;
  try {
    localStorage.setItem(userKey, JSON.stringify(config));
    // Also save as fallback
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('ia-google-sheets-config-changed', { detail: config }));
  } catch (err) {
    console.error('Error saving Google Sheets sync config:', err);
  }
}

/**
 * Ping Google Apps Script Web App to verify connectivity
 */
export async function testGoogleSheetsConnection(webAppUrl) {
  if (!webAppUrl || !webAppUrl.trim().startsWith('https://script.google.com/macros/s/')) {
    throw new Error('กรุณาระบุ Google Apps Script Web App URL ที่ถูกต้อง (ขึ้นต้นด้วย https://script.google.com/macros/s/...)');
  }

  const cleanUrl = webAppUrl.trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ping' }),
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || data.error || 'การเชื่อมต่อไม่สำเร็จ');
    }

    return {
      success: true,
      sheetTitle: data.sheetTitle || 'Google Spreadsheet ของ อปท.',
      sheetUrl: data.sheetUrl || '',
      timestamp: data.timestamp || new Date().toISOString()
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('การเชื่อมต่อหมดเวลา (Timeout 15 วินาที) โปรดตรวจสอบสิทธิ์การแชร์ Web App (ต้องเลือก "ทุกคน" หรือ "Anyone")');
    }
    throw new Error(err.message || 'ไม่สามารถเชื่อมต่อ Google Apps Script ได้');
  }
}

/**
 * Push full audit dataset to Google Sheets
 */
export async function pushToGoogleSheets(webAppUrl, allData, session) {
  if (!webAppUrl) throw new Error('ไม่พบการตั้งค่า Web App URL');

  const cleanUrl = webAppUrl.trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout for large payloads

  try {
    const payload = {
      action: 'sync_all',
      timestamp: new Date().toISOString(),
      orgName: allData?.orgProfile?.name || session?.organization || 'อปท.',
      auditorName: allData?.orgProfile?.auditorName || session?.displayName || session?.username || 'ผู้ตรวจสอบภายใน',
      selectedYear: allData?.selectedYear || '2569',
      data: allData
    };

    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || result.error || 'การซิงค์ข้อมูลลง Google Sheets ล้มเหลว');
    }

    const updatedConfig = {
      ...getGoogleSheetsConfig(session),
      webAppUrl: cleanUrl,
      sheetTitle: result.sheetTitle || 'Audit-OS Database',
      sheetUrl: result.sheetUrl || '',
      lastSyncTime: new Date().toISOString(),
      lastStatus: 'success',
      lastError: null
    };
    saveGoogleSheetsConfig(updatedConfig, session);

    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    const updatedConfig = {
      ...getGoogleSheetsConfig(session),
      webAppUrl: cleanUrl,
      lastStatus: 'error',
      lastError: err.message
    };
    saveGoogleSheetsConfig(updatedConfig, session);
    throw err;
  }
}

/**
 * Pull full audit dataset from Google Sheets to restore locally
 */
export async function pullFromGoogleSheets(webAppUrl, session) {
  if (!webAppUrl) throw new Error('ไม่พบการตั้งค่า Web App URL');

  const cleanUrl = webAppUrl.trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'pull_all' }),
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || result.error || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้');
    }

    if (!result.data && !result.payload) {
      throw new Error('ไม่พบข้อมูลสำรอง Audit-OS ใน Google Sheet นี้ (อาจยังไม่เคยซิงค์ข้อมูล)');
    }

    const data = result.data || result.payload;

    const updatedConfig = {
      ...getGoogleSheetsConfig(session),
      webAppUrl: cleanUrl,
      lastSyncTime: new Date().toISOString(),
      lastStatus: 'success',
      lastError: null
    };
    saveGoogleSheetsConfig(updatedConfig, session);

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Returns the ready-to-use Google Apps Script code template
 */
export function getAppsScriptTemplate() {
  return `/**
 * ==============================================================================
 * Audit-OS for Local Government - Google Sheets Data Sovereignty Webhook
 * ==============================================================================
 * สคริปต์เชื่อมต่อฐานข้อมูลส่วนตัวสำหรับผู้ตรวจสอบภายใน อปท. (Audit-OS BYOD)
 * ข้อมูลทั้งหมดจะถูกบันทึกไว้ใน Google Drive ของหน่วยงานท่านเอง 100%
 *
 * วิธีติดตั้ง (ทำเพียงครั้งเดียว):
 * 1. ใน Google Sheets นี้ ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 2. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดชุดนี้ลงไปแทน
 * 3. กด "บันทึก" (Save) รูปแผ่นดิสก์ด้านบน
 * 4. คลิกปุ่มสีน้ำเงิน "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 5. เลือกประเภท: "เว็บแอป" (Web app)
 *    - คำอธิบาย: Audit-OS Webhook
 *    - ดำเนินการในฐานะ (Execute as): ฉัน (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): ทุกคน (Anyone)  *** สำคัญมาก ***
 * 6. กด "ทำให้ใช้งานได้" (Deploy) แล้วอนุมัติสิทธิ์ (Authorize access)
 * 7. คัดลอก "URL เว็บแอป" (Web app URL) ไปวางในโปรแกรม Audit-OS
 * ==============================================================================
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, message: 'No payload received' });
    }
    
    var req = JSON.parse(e.postData.contents);
    var action = req.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. PING - ตรวจสอบการเชื่อมต่อ
    if (action === 'ping') {
      return createJsonResponse({
        success: true,
        sheetTitle: ss.getName(),
        sheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    // 2. PULL_ALL - ดึงข้อมูลกู้คืนกลับสู่ Audit-OS
    if (action === 'pull_all') {
      var rawSheet = ss.getSheetByName('_AuditOS_RawData');
      if (!rawSheet) {
        return createJsonResponse({
          success: false,
          message: 'ยังไม่พบข้อมูลสำรอง Audit-OS ใน Google Sheet นี้ กรุณากดซิงค์ข้อมูลจากระบบขึ้นมาก่อน'
        });
      }
      var rawJson = loadRawDataChunks(rawSheet);
      if (!rawJson) {
        return createJsonResponse({ success: false, message: 'ข้อมูลสำรองในแผ่นงานว่างเปล่า' });
      }
      var parsedData = JSON.parse(rawJson);
      return createJsonResponse({
        success: true,
        data: parsedData,
        sheetTitle: ss.getName(),
        sheetUrl: ss.getUrl()
      });
    }

    // 3. SYNC_ALL - ซิงค์ข้อมูลทั้งหมดลง Google Sheets
    if (action === 'sync_all') {
      var payload = req.data || req.payload || {};
      var orgName = req.orgName || (payload.orgProfile && payload.orgProfile.name) || 'อปท.';
      var selectedYear = req.selectedYear || payload.selectedYear || '2569';

      // 3.1 บันทึก Full JSON ลงแผ่นงานที่ซ่อนไว้ โดยแบ่งส่วน (Chunking) ป้องกันข้อจำกัด 50,000 อักขระ/เซลล์
      var rawSheet = ss.getSheetByName('_AuditOS_RawData');
      if (!rawSheet) {
        rawSheet = ss.insertSheet('_AuditOS_RawData');
        rawSheet.hideSheet();
      }
      saveRawDataChunks(rawSheet, JSON.stringify(payload));

      // 3.2 ปรับชื่อไฟล์ Spreadsheet ให้ชัดเจน
      try {
        ss.rename('Audit-OS ข้อมูลตรวจสอบภายใน ' + orgName + ' (ปีงบ ' + selectedYear + ')');
      } catch (eRen) {}

      // 3.3 สร้างและจัดรูปแบบแผ่นงานที่มนุษย์เปิดอ่าน/พิมพ์ได้จริง
      formatOrgProfileSheet(ss, payload.orgProfile, selectedYear);
      formatAnnualPlanSheet(ss, payload.annualPlansByYear, selectedYear);
      formatWorkingPapersSheet(ss, payload.workingPapersByYear, selectedYear);
      formatCapaSheet(ss, payload.capaFindingsByYear, selectedYear);
      formatRiskAssessmentSheet(ss, payload.auditUniverseByYear, selectedYear);

      return createJsonResponse({
        success: true,
        message: 'ซิงค์ข้อมูลลง Google Sheets เรียบร้อยแล้ว',
        sheetTitle: ss.getName(),
        sheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({ success: false, message: 'Unknown action: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return createJsonResponse({
    success: true,
    message: 'Audit-OS Google Sheets Webhook is ACTIVE and Ready!',
    sheetTitle: ss.getName(),
    sheetUrl: ss.getUrl(),
    time: new Date().toISOString()
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// -----------------------------------------------------------------------------
// Large Data Chunking Helpers (ป้องกัน Error: อินพุตเกินจำนวนอักขระสูงสุด 50,000 ตัว/เซลล์)
// -----------------------------------------------------------------------------
function saveRawDataChunks(sheet, dataString) {
  sheet.clear();
  var CHUNK_SIZE = 40000; // ตัดเป็นท่อนละ 40,000 ตัวอักษร ปลอดภัยต่ำกว่า 50,000 ตัวอักษรเสมอ
  var chunks = [];
  for (var i = 0; i < dataString.length; i += CHUNK_SIZE) {
    chunks.push([dataString.substring(i, i + CHUNK_SIZE)]);
  }
  if (chunks.length > 0) {
    sheet.getRange(1, 1, chunks.length, 1).setValues(chunks);
  }
}

function loadRawDataChunks(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) return '';
  var values = sheet.getRange(1, 1, lastRow, 1).getValues();
  var fullStr = '';
  for (var i = 0; i < values.length; i++) {
    fullStr += (values[i][0] || '');
  }
  return fullStr;
}

function safeCell(val) {
  if (val === null || val === undefined) return '';
  var str = String(val);
  if (str.length > 45000) {
    return str.substring(0, 45000) + '... [ตัดทอนเพื่อความปลอดภัยของ Google Sheets (จำกัด 50,000 ตัวอักษร/เซลล์)]';
  }
  return str;
}

// -----------------------------------------------------------------------------
// Formatters for Human-Readable Spreadsheet Tabs
// -----------------------------------------------------------------------------

function getOrCreateSheet(ss, sheetName) {
  var s = ss.getSheetByName(sheetName);
  if (!s) {
    s = ss.insertSheet(sheetName);
  }
  s.clear();
  return s;
}

function styleHeader(range, bgColor, fgColor) {
  range.setBackground(bgColor || '#1e293b')
       .setFontColor(fgColor || '#ffffff')
       .setFontWeight('bold')
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle');
}

function formatOrgProfileSheet(ss, profile, year) {
  if (!profile) return;
  var s = getOrCreateSheet(ss, '🏛️ ข้อมูล อปท.');
  
  s.getRange('A1:B1').merge();
  s.getRange('A1').setValue('🏛️ ข้อมูลหน่วยงานและผู้ตรวจสอบภายใน อปท. (ปีงบ ' + year + ')')
   .setFontSize(14).setFontWeight('bold').setFontColor('#b45309');
  
  var rows = [
    ['ชื่อหน่วยงาน (อปท.):', safeCell(profile.name || '')],
    ['อำเภอ:', safeCell(profile.district || '')],
    ['จังหวัด:', safeCell(profile.province || '')],
    ['ปีงบประมาณ:', safeCell(profile.fiscalYear || year)],
    ['ผู้ตรวจสอบภายใน:', safeCell(profile.auditorName || '')],
    ['ตำแหน่งผู้ตรวจ:', safeCell(profile.auditorPosition || '')],
    ['ปลัด อปท.:', safeCell(profile.palatName || '')],
    ['นายก อปท. (ผู้อนุมัติ):', safeCell(profile.approverName || '')],
    ['อัปเดตล่าสุด:', new Date().toLocaleString('th-TH')]
  ];
  
  s.getRange(3, 1, rows.length, 2).setValues(rows);
  s.getRange(3, 1, rows.length, 1).setFontWeight('bold').setBackground('#f8fafc');
  s.getRange(3, 1, rows.length, 2).setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  s.autoResizeColumns(1, 2);
}

function formatAnnualPlanSheet(ss, plansByYear, year) {
  var list = (plansByYear && plansByYear[year]) || [];
  var s = getOrCreateSheet(ss, '📋 แผนการตรวจสอบประจำปี');
  
  s.getRange('A1:G1').merge();
  s.getRange('A1').setValue('📋 แผนการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. ' + year)
   .setFontSize(13).setFontWeight('bold').setFontColor('#0369a1');

  var headers = ['รหัสโครงการ', 'ชื่อกิจกรรม/โครงการตรวจสอบ', 'หน่วยรับตรวจ (กอง/สำนัก)', 'ไตรมาส', 'วัตถุประสงค์การตรวจ', 'ผู้รับผิดชอบ', 'สถานะ'];
  s.getRange(3, 1, 1, headers.length).setValues([headers]);
  styleHeader(s.getRange(3, 1, 1, headers.length), '#0284c7', '#ffffff');

  if (list.length > 0) {
    var rows = list.map(function(item) {
      return [
        safeCell(item.id || item.code || '-'),
        safeCell(item.title || item.name || '-'),
        safeCell(item.department || item.target || '-'),
        safeCell(item.quarter || item.period || '-'),
        safeCell(item.objective || '-'),
        safeCell(item.auditor || '-'),
        safeCell(item.status || 'รอการตรวจสอบ')
      ];
    });
    s.getRange(4, 1, rows.length, headers.length).setValues(rows);
    s.getRange(4, 1, rows.length, headers.length).setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  }
  s.autoResizeColumns(1, headers.length);
}

function formatWorkingPapersSheet(ss, wpByYear, year) {
  var list = (wpByYear && wpByYear[year]) || [];
  var s = getOrCreateSheet(ss, '📝 กระดาษทำการและข้อตรวจพบ');

  s.getRange('A1:G1').merge();
  s.getRange('A1').setValue('📝 ทะเบียนกระดาษทำการและบันทึกข้อตรวจพบ (Working Papers ' + year + ')')
   .setFontSize(13).setFontWeight('bold').setFontColor('#059669');

  var headers = ['รหัสกระดาษทำการ', 'หัวข้อการตรวจสอบ', 'หน่วยรับตรวจ', 'ผลการตรวจเบื้องต้น', 'ข้อตรวจพบ/ประเด็นสังเกต', 'เกณฑ์/ระเบียบที่เกี่ยวข้อง', 'ข้อเสนอแนะการปรับปรุง'];
  s.getRange(3, 1, 1, headers.length).setValues([headers]);
  styleHeader(s.getRange(3, 1, 1, headers.length), '#059669', '#ffffff');

  if (list.length > 0) {
    var rows = list.map(function(item) {
      var findingsText = '';
      if (item.finding) findingsText = item.finding;
      else if (Array.isArray(item.findings)) findingsText = item.findings.map(function(f){ return (f.title || f.condition || '') }).join('; ');
      
      return [
        safeCell(item.id || item.code || '-'),
        safeCell(item.title || item.name || '-'),
        safeCell(item.department || '-'),
        safeCell(item.result || item.conclusion || 'ตรวจสอบแล้ว'),
        safeCell(findingsText || '-'),
        safeCell(item.criteria || item.regulation || '-'),
        safeCell(item.recommendation || '-')
      ];
    });
    s.getRange(4, 1, rows.length, headers.length).setValues(rows);
    s.getRange(4, 1, rows.length, headers.length).setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  }
  s.autoResizeColumns(1, headers.length);
}

function formatCapaSheet(ss, capaByYear, year) {
  var list = (capaByYear && capaByYear[year]) || [];
  var s = getOrCreateSheet(ss, '🔍 ทะเบียนคุมข้อทักท้วง CAPA');

  s.getRange('A1:F1').merge();
  s.getRange('A1').setValue('🔍 ทะเบียนคุมข้อทักท้วงและติดตามผลการปรับปรุง 30/60 วัน (CAPA ' + year + ')')
   .setFontSize(13).setFontWeight('bold').setFontColor('#b45309');

  var headers = ['ลำดับ', 'ประเด็นข้อตรวจพบ/ข้อทักท้วง', 'หน่วยรับตรวจ', 'กำหนดเวลาแก้ไข (30 วัน)', 'สถานะการติดตาม', 'หมายเหตุ'];
  s.getRange(3, 1, 1, headers.length).setValues([headers]);
  styleHeader(s.getRange(3, 1, 1, headers.length), '#d97706', '#ffffff');

  if (list.length > 0) {
    var rows = list.map(function(item, idx) {
      return [
        idx + 1,
        safeCell(item.issue || item.finding || item.title || '-'),
        safeCell(item.department || item.target || '-'),
        safeCell(item.deadline || item.dueDate || '30 วัน'),
        safeCell(item.status || 'อยู่ระหว่างติดตาม'),
        safeCell(item.note || item.remark || '-')
      ];
    });
    s.getRange(4, 1, rows.length, headers.length).setValues(rows);
    s.getRange(4, 1, rows.length, headers.length).setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  }
  s.autoResizeColumns(1, headers.length);
}

function formatRiskAssessmentSheet(ss, universeByYear, year) {
  var list = (universeByYear && universeByYear[year]) || [];
  var s = getOrCreateSheet(ss, '🎯 การประเมินความเสี่ยง SOFCK');

  s.getRange('A1:F1').merge();
  s.getRange('A1').setValue('🎯 ผังจักรวาลการตรวจสอบและการประเมินความเสี่ยง 5 ด้าน SOFCK (' + year + ')')
   .setFontSize(13).setFontWeight('bold').setFontColor('#7c3aed');

  var headers = ['รหัสหน่วยตรวจ', 'ชื่อกิจกรรม/งานที่ตรวจ', 'หน่วยรับตรวจ', 'คะแนนความเสี่ยงรวม', 'ระดับความเสี่ยง', 'ลำดับความสำคัญ'];
  s.getRange(3, 1, 1, headers.length).setValues([headers]);
  styleHeader(s.getRange(3, 1, 1, headers.length), '#7c3aed', '#ffffff');

  if (list.length > 0) {
    var rows = list.map(function(item) {
      return [
        safeCell(item.id || item.code || '-'),
        safeCell(item.activity || item.name || item.title || '-'),
        safeCell(item.department || '-'),
        safeCell(item.riskScore || item.score || '-'),
        safeCell(item.riskLevel || item.level || 'ปานกลาง'),
        safeCell(item.priority || '-')
      ];
    });
    s.getRange(4, 1, rows.length, headers.length).setValues(rows);
    s.getRange(4, 1, rows.length, headers.length).setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  }
  s.autoResizeColumns(1, headers.length);
}
`;
}
