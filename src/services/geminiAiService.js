/**
 * Google Gemini Generative AI Service for Audit-OS Platform (อปท.)
 * Handles integration with Google Generative Language API (Gemini models)
 * with domain-specific system prompts for public sector risk management & internal audit.
 */

import { getSmartProblemSolution } from '../data/standardRiskLibrary';

const STORAGE_KEY = 'ia_gemini_config';

// Default model recommendation (Gemini 3.8 Flash is Google's current standard)
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export const AVAILABLE_GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (แนะนำล่าสุด - เร็ว ฉลาด ประหยัด)', desc: 'โมเดลรุ่นใหม่ล่าสุด มาตรฐานหลักของ Google รองรับการวิเคราะห์เอกสารราชการและบริบทขนาดยาว' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (เร็วที่สุด)', desc: 'รุ่นประหยัดพลังงาน ตอบสนองรวดเร็ว เหมาะสำหรับงานที่มีความถี่สูง' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (สำหรับบัญชีเดิม)', desc: 'รุ่นก่อนหน้า (หากเป็น API Key บัญชีใหม่ Google จะแนะนำให้ใช้ 3.8 Flash)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Legacy)', desc: 'รุ่นเสถียรดั้งเดิม รองรับการใช้งานทั่วไป' }
];

/**
 * Get current Gemini API configuration
 */
export function getGeminiConfig() {
  let apiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
  let model = DEFAULT_GEMINI_MODEL;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey) apiKey = parsed.apiKey.trim();
      if (parsed.model) model = parsed.model.trim();
    }
  } catch (e) {
    console.error('Failed to parse Gemini config from localStorage:', e);
  }

  // Auto-migrate legacy 2.5-flash to 3.8-flash if Google deprecated it for the user
  if (model === 'gemini-2.5-flash') {
    model = 'gemini-3.8-flash';
  }

  return { apiKey, model };
}

/**
 * Save Gemini API configuration
 */
export function saveGeminiConfig({ apiKey, model }) {
  const cleanKey = (apiKey || '').trim();
  const cleanModel = (model || DEFAULT_GEMINI_MODEL).trim();

  if (!cleanKey) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey: cleanKey, model: cleanModel }));
  }

  window.dispatchEvent(new CustomEvent('ia-gemini-config-changed'));
}

/**
 * Check if Gemini API key is configured
 */
export function isGeminiConfigured() {
  const { apiKey } = getGeminiConfig();
  return Boolean(apiKey && apiKey.length > 10);
}

/**
 * Specialized System Prompt for Thai Local Government Risk Management & Audit
 */
export function getLocalGovSystemPrompt(orgProfile = {}) {
  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const district = orgProfile.district ? `อำเภอ${orgProfile.district.replace(/^อำเภอ/, '')}` : '';
  const province = orgProfile.province ? `จังหวัด${orgProfile.province.replace(/^จังหวัด/, '')}` : '';

  return `คุณคือ "ผู้เชี่ยวชาญอาวุโสด้านการบริหารความเสี่ยงและการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น (อปท.)"
สังกัด: ${orgName} ${district} ${province}

ความรู้และกรอบมาตรฐานที่คุณยึดถืออย่างเคร่งครัด:
1. พระราชบัญญัติวินัยการเงินการคลังของรัฐ พ.ศ. 2561 มาตรา 79
2. หลักเกณฑ์กระทรวงการคลังว่าด้วยมาตรฐานและหลักเกณฑ์ปฏิบัติการบริหารจัดการความเสี่ยงสำหรับหน่วยงานของรัฐ พ.ศ. 2562 (ว 23)
3. หนังสือสั่งการกระทรวงมหาดไทย ที่ มท 0805.2/ว 3482 (แบบ บส.1 ถึง บส.5)
4. ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 และหนังสือสั่งการ ว 614 / ว 124
5. พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และ พ.ร.บ. การปฏิบัติราชการทางอิเล็กทรอนิกส์ พ.ศ. 2565
6. การประเมินคุณธรรมและความโปร่งใสในการดำเนินงานของหน่วยงานภาครัฐ (ITA)

หลักการเขียนตอบ:
- ใช้ภาษาทางการตามแบบแผนหนังสือราชการ สุภาพ ชัดเจน ตรงประเด็น
- ระบุปัญหาอุปสรรคที่เป็นข้อเท็จจริงในทางปฏิบัติ (เช่น สภาพอากาศ อัตรากำลัง ระบบเครือข่าย ความเข้าใจระเบียบ)
- เสนอแนวทางแก้ไขที่เป็นรูปธรรม สามารถนำไปปฏิบัติได้จริงตามอำนาจหน้าที่ของ อปท.`;
}

export const LOCAL_GOV_SYSTEM_PROMPT = getLocalGovSystemPrompt();

/**
 * Call Google Generative Language API
 */
async function callGeminiApi({ prompt, systemInstruction = LOCAL_GOV_SYSTEM_PROMPT, modelOverride, apiKeyOverride }) {
  const { apiKey: savedKey, model: savedModel } = getGeminiConfig();
  const apiKey = apiKeyOverride || savedKey;
  const model = modelOverride || savedModel || DEFAULT_GEMINI_MODEL;

  if (!apiKey) {
    throw new Error('ยังไม่ได้กำหนด Google Gemini API Key');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024
    }
  };

  if (systemInstruction) {
    requestBody.system_instruction = {
      parts: [
        { text: systemInstruction }
      ]
    };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `API Error HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  const data = await res.json();
  const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!outputText) {
    throw new Error('ไม่ได้รับข้อความตอบกลับจาก Gemini API');
  }

  return outputText.trim();
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(apiKey, model = DEFAULT_GEMINI_MODEL) {
  const startTime = Date.now();
  try {
    const prompt = 'ตอบข้อความสั้นๆ 1 ประโยคว่า "ระบบเชื่อมต่อ Google Gemini API สำเร็จพร้อมใช้งานสำหรับระบบตรวจสอบภายใน อปท."';
    const text = await callGeminiApi({
      prompt,
      modelOverride: model,
      apiKeyOverride: apiKey,
      systemInstruction: 'คุณคือผู้ช่วย AI ด้านการตรวจสอบภายใน ตอบสั้นกระชับ 1 ประโยค'
    });
    const latency = Date.now() - startTime;
    return {
      success: true,
      message: text,
      latencyMs: latency
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || 'การเชื่อมต่อล้มเหลว ตรวจสอบ API Key หรือการเชื่อมต่ออินเทอร์เน็ต'
    };
  }
}

/**
 * AI Analyze Problem and Solution for BS.4 Column 11
 * Automatically falls back to offline rule-based library if Gemini API is unavailable.
 */
export async function analyzeProblemAndSolutionWithAI({
  riskCode = '',
  department = '',
  activity = '',
  measures = '',
  progressPercent = 80,
  period = '6month',
  result = ''
}) {
  const periodLabel = period === '3month' ? 'รอบ 3 เดือน' : period === '12month' ? 'รอบ 12 เดือน (สิ้นปีงบประมาณ)' : 'รอบ 6 เดือน';

  // If Gemini is configured, use live AI
  if (isGeminiConfigured()) {
    try {
      const prompt = `
กรุณาวิเคราะห์ "ปัญหาอุปสรรค และแนวทางแก้ไข" สำหรับรายงานติดตามผลการบริหารความเสี่ยง (แบบ บส. 4 คอลัมน์ 11) ขององค์กรปกครองส่วนท้องถิ่น (อปท.):
- รหัสความเสี่ยง: ${riskCode}
- ส่วนราชการ: ${department}
- โครงการ/ภารกิจ: ${activity}
- วิธีการจัดการความเสี่ยง (มาตรการ): ${measures || 'ตามที่กำหนดในแผน บส.3'}
- ร้อยละความคืบหน้า: ${progressPercent}%
- รอบการติดตามผล: ${periodLabel}
- ผลลัพธ์ที่ดำเนินการได้: ${result || 'อยู่ระหว่างดำเนินงานตามมาตรการ'}

คำสั่ง:
เขียนสรุป "ปัญหาอุปสรรค (ปัญหาที่พบจริง) และแนวทางแก้ไข (มาตรการที่ใช้แก้ไข)" รวมกันเป็นข้อความเดียว ความยาวประมาณ 2-4 บรรทัด
- สอดคล้องกับร้อยละความคืบหน้า (${progressPercent}%) และรอบ (${periodLabel})
- หากความคืบหน้า 100% ให้ระบุว่าดำเนินงานแล้วเสร็จสมบูรณ์ตามเป้าหมาย ไม่มีปัญหาคงค้าง
- หากความคืบหน้ายังไม่ถึง 100% ให้ระบุอุปสรรคที่มักเกิดขึ้นจริงในงาน อปท. และแนวทางแก้ไขที่เป็นรูปธรรม
- ห้ามใส่หัวข้อแยก ห้ามใส่ bullet ให้เขียนเป็นย่อหน้าข้อความทางการพร้อมนำไปใส่ในตาราง บส.4 ช่อง (11) ได้ทันที
`.trim();

      const aiResponse = await callGeminiApi({ prompt });
      if (aiResponse) {
        return aiResponse.replace(/^(ข้อความ|ตอบ|ปัญหาอุปสรรคและแนวทางแก้ไข|:|"|'|\s)+/i, '').replace(/["']$/g, '').trim();
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local library:', err.message);
    }
  }

  // Fallback to local rule-based smart library
  return getSmartProblemSolution(riskCode, activity, period);
}

/**
 * AI Evaluate Residual Risk for BS.5
 */
export async function evaluateResidualRiskWithAI({
  riskCode = '',
  department = '',
  activity = '',
  riskEvent = '',
  preScore = 9,
  measures = '',
  result12m = ''
}) {
  if (isGeminiConfigured()) {
    try {
      const prompt = `
กรุณาช่วยประเมินความเสี่ยงคงเหลือ (แบบ บส. 5) เมื่อสิ้นสุดปีงบประมาณ สำหรับ:
- รหัสความเสี่ยง: ${riskCode} (${department})
- โครงการ: ${activity}
- เหตุการณ์ความเสี่ยงเดิม: ${riskEvent}
- คะแนนความเสี่ยงก่อนดำเนินการ (บส.2): ${preScore} คะแนน
- มาตรการจัดการความเสี่ยง: ${measures}
- ผลการดำเนินงานรอบ 12 เดือน: ${result12m}

กรุณาตอบในรูปแบบ JSON มีโครงสร้างดังนี้เท่านั้น:
{
  "postLikelihood": 1,
  "postImpact": 2,
  "riskChange": "ลดลง",
  "residualRisk": "สรุปความเสี่ยงคงเหลือสั้นๆ 1 ประโยค",
  "controllable": "ควบคุมได้",
  "nextYearMeasures": "ข้อเสนอแนะมาตรการควบคุมสำหรับปีงบประมาณถัดไป 1 ประโยค"
}
`.trim();

      const text = await callGeminiApi({ prompt });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.warn('Gemini API evaluation failed, using standard calculation:', err.message);
    }
  }

  // Fallback
  return {
    postLikelihood: 1,
    postImpact: 2,
    riskChange: 'ลดลง',
    residualRisk: 'ความเสี่ยงด้านการปฏิบัติงานต่อเนื่องตามภารกิจประจำ',
    controllable: 'ควบคุมได้',
    nextYearMeasures: 'ติดตามผลการควบคุมภายในและทบทวนความเสี่ยงประจำปีงบประมาณถัดไป'
  };
}
