import React, { useState, useMemo, useRef } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  TrendingDown,
  Printer,
  Building,
  Plus,
  Trash2,
  Pencil,
  BarChart3,
  Layers,
  FileText,
  Filter,
  ShieldCheck,
  Eye,
  Check,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  HelpCircle,
  ExternalLink,
  FileSpreadsheet,
  Download,
  Upload,
  Zap,
  RefreshCw,
  Search,
  ArrowRight,
  Sliders,
  CheckSquare,
  Target,
  Activity,
  Play,
  Send,
  Clock,
  Undo2,
  Cloud,
  CloudOff
} from 'lucide-react';
import { getDepartments, getSession } from '../utils/auth';
import { exportBsToWord, exportBsToExcel, exportBsToPdf, exportBsToPrint } from '../utils/exportRiskDocs';
import ConfirmModal from './ConfirmModal';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { cloudSyncService, mergeRiskManagement } from '../services/cloudSyncService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  getStandardRisksByDepartment,
  calculateRiskLevel,
  analyzeRiskKeyword,
  getAllStandardRisks,
  auditW3482Compliance,
  cascadeAllBsForms,
  getSmartProblemSolution,
  STANDARD_RISK_LIBRARY
} from '../data/standardRiskLibrary';
import GeminiConfigModal from './GeminiConfigModal';
import {
  isGeminiConfigured,
  analyzeProblemAndSolutionWithAI,
  evaluateResidualRiskWithAI
} from '../services/geminiAiService';

// 6 ประเภทความเสี่ยง ตามหนังสือสั่งการ มท 0805.2/ว 3482 (แบบ บส.2 ข้อ 8)
export const RISK_CATEGORIES = [
  { id: 'strategy', label: '1. ความเสี่ยงด้านกลยุทธ์ (Strategy Risks)', desc: 'ความเสี่ยงที่เกิดจากการกำหนดแผนกลยุทธ์ที่ไม่เหมาะสม หรือเกิดจากการนำกลยุทธ์ไปใช้ไม่ถูกต้อง' },
  { id: 'financial', label: '2. ความเสี่ยงด้านการเงิน (Financial Risks)', desc: 'ความเสี่ยงเกี่ยวกับการบริหารจัดการด้านการเงิน การเบิกจ่ายเงินไม่ถูกต้อง การรับเงินไม่ถูกต้อง ไม่ปฏิบัติตามกฎหมายการเงินการคลัง หรือการทุจริต' },
  { id: 'operation', label: '3. ความเสี่ยงด้านการดำเนินงาน (Operation Risks)', desc: 'ความเสี่ยงที่เกิดจากกระบวนการทำงานที่ไม่มีประสิทธิผลหรือไม่มีประสิทธิภาพ' },
  { id: 'legal', label: '4. ความเสี่ยงด้านการปฏิบัติตามกฎระเบียบ (Legal Risks)', desc: 'ความเสี่ยงที่หน่วยงานไม่ปฏิบัติตามกฎหมาย ระเบียบ ข้อบังคับ หลักเกณฑ์ มติ ครม. หรือคู่มือแนวทางปฏิบัติงาน' },
  { id: 'technology', label: '5. ความเสี่ยงด้านเทคโนโลยีสารสนเทศ (Technology Risks)', desc: 'ความเสี่ยงที่เกิดจากเทคโนโลยีสารสนเทศ ระบบขัดข้อง หรือความไม่ปลอดภัยของข้อมูล' },
  { id: 'reputational', label: '6. ความเสี่ยงด้านความน่าเชื่อถือขององค์กร (Reputational Risks)', desc: 'ความเสี่ยงที่ส่งผลกระทบต่อชื่อเสียง ความเชื่อมั่น และความน่าเชื่อถือขององค์กร' },
];

// 8 วิธีการตอบสนองความเสี่ยง ตามหนังสือสั่งการ มท 0805.2/ว 3482 (แบบ บส.2 ข้อ 12)
export const RISK_RESPONSES = [
  { id: 'avoid', label: '1. ปฏิเสธความเสี่ยง (Avoid)', desc: 'ไม่ดำเนินงานในกิจกรรมที่มีความเสี่ยงสูง ที่หน่วยงานไม่สามารถยอมรับความเสี่ยงนั้นได้' },
  { id: 'reduce_l', label: '2. การลดโอกาสของความเสี่ยง (Reduce Likelihood)', desc: 'เช่น ลดโอกาสของความเสี่ยงการทุจริตด้านการเงิน การเพิ่มจุดตรวจทาน' },
  { id: 'reduce_i', label: '3. การลดผลกระทบของความเสี่ยง (Reduce Impact)', desc: 'เช่น การทำประกันภัย หรือการใช้เครื่องมือป้องกันความเสี่ยงทางการเงิน' },
  { id: 'transfer', label: '4. การโอนความเสี่ยง (Transfer)', desc: 'ถ่ายโอนความเสี่ยงที่ไม่สามารถดำเนินการเองได้ เช่น ให้ภาคเอกชนดำเนินการ' },
  { id: 'accept', label: '5. ยอมรับความเสี่ยง (Accept)', desc: 'ไม่ดำเนินการจัดการความเสี่ยง เนื่องจากความเสี่ยงอยู่ในระดับที่ยอมรับได้' },
  { id: 'monitor', label: '6. ใช้มาตรการการเฝ้าระวัง (Monitor & Early Warning)', desc: 'กำหนดข้อมูลที่ต้องเก็บรวบรวม การวิเคราะห์ การแจ้งเตือนเมื่อเหตุการณ์เกิดขึ้น' },
  { id: 'contingency', label: '7. การทำแผนฉุกเฉิน (Contingency Plan)', desc: 'ระบุขั้นตอนเมื่อเกิดเหตุการณ์ความเสี่ยงขึ้น โดยระบุบุคคลและวิธีดำเนินการที่ชัดเจน' },
  { id: 'exploit', label: '8. การส่งเสริมหรือผลักดันเหตุการณ์ (Exploit / Enhance)', desc: 'เมื่อเหตุการณ์ที่อาจเกิดขึ้นส่งผลกระทบเชิงบวกกับองค์กร' },
];

export const THAI_MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const THAI_MONTH_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// 7 ยุทธศาสตร์มาตรฐานการบริหารความเสี่ยง อปท. (5.2)
export const FANGKHAM_STRATEGIES = [
  'ยุทธศาสตร์ที่ 1 การพัฒนาโครงสร้างพื้นฐาน',
  'ยุทธศาสตร์ที่ 2 การพัฒนาคุณภาพชีวิต',
  'ยุทธศาสตร์ที่ 3 การจัดระเบียบชุมชน สังคม และรักษาความสงบเรียบร้อย',
  'ยุทธศาสตร์ที่ 4 การวางแผนการส่งเสริมการลงทุน',
  'ยุทธศาสตร์ที่ 5 การจัดการทรัพยากรธรรมชาติและสิ่งแวดล้อม',
  'ยุทธศาสตร์ที่ 6 การบริหารจัดการศิลปวัฒนธรรม จารีตประเพณี และภูมิปัญญาท้องถิ่น',
  'ยุทธศาสตร์ที่ 7 การบริหารจัดการทรัพยากรขององค์กรปกครองส่วนท้องถิ่น'
];

export function mapToFangkhamStrategy(strategyText = '', department = '') {
  const text = `${strategyText} ${department}`.toLowerCase();
  if (text.includes('โครงสร้างพื้นฐาน') || text.includes('คมนาคม') || text.includes('ช่าง') || text.includes('ก่อสร้าง') || text.includes('ถนน') || text.includes('สะพาน')) {
    return FANGKHAM_STRATEGIES[0];
  }
  if (text.includes('คุณภาพชีวิต') || text.includes('การศึกษา') || text.includes('สวัสดิการ') || text.includes('สาธารณสุข') || text.includes('เด็ก') || text.includes('ผู้สูงอายุ')) {
    return FANGKHAM_STRATEGIES[1];
  }
  if (text.includes('ระเบียบชุมชน') || text.includes('ความสงบ') || text.includes('ป้องกัน') || text.includes('จราจร') || text.includes('ความปลอดภัย') || text.includes('สาธารณภัย')) {
    return FANGKHAM_STRATEGIES[2];
  }
  if (text.includes('ลงทุน') || text.includes('ส่งเสริมอาชีพ') || text.includes('เกษตร') || text.includes('พาณิชย์') || text.includes('ตลาด')) {
    return FANGKHAM_STRATEGIES[3];
  }
  if (text.includes('ธรรมชาติ') || text.includes('สิ่งแวดล้อม') || text.includes('ขยะ') || text.includes('น้ำเสีย') || text.includes('มลพิษ')) {
    return FANGKHAM_STRATEGIES[4];
  }
  if (text.includes('วัฒนธรรม') || text.includes('ประเพณี') || text.includes('ภูมิปัญญา') || text.includes('ศาสนา') || text.includes('เทศกาล')) {
    return FANGKHAM_STRATEGIES[5];
  }
  if (text.includes('คลัง') || text.includes('การเงิน') || text.includes('พัสดุ') || text.includes('บริหารจัดการ') || text.includes('ทรัพยากร') || text.includes('ปลัด')) {
    return FANGKHAM_STRATEGIES[6];
  }
  const exact = FANGKHAM_STRATEGIES.find(s => s === strategyText || strategyText.includes(s));
  if (exact) return exact;
  return FANGKHAM_STRATEGIES[6];
}

// คำอธิบายแบบตามหนังสือสั่งการ มท 0805.2/ว 3482
const FORM_GUIDELINES = {
  bs1: {
    title: 'คำอธิบายแบบกำหนดขอบเขตความรับผิดชอบตามประเด็นยุทธศาสตร์/ข้อบัญญัติ/เทศบัญญัติ/อื่น ๆ (ถ้ามี)',
    subtitle: 'ตามหนังสือสั่งการ มท 0805.2/ว 3482 ลงวันที่ 18 สิงหาคม 2566',
    items: [
      { num: '1', title: 'ชื่อ อปท.', desc: 'ระบุชื่อองค์กรปกครองส่วนท้องถิ่นที่สังกัด' },
      { num: '2', title: 'ปีงบประมาณ', desc: 'ปีงบประมาณในการบริหารจัดการความเสี่ยง' },
      { num: '3', title: 'รหัสความเสี่ยง', desc: 'รหัสความเสี่ยงตามลำดับจำนวนความเสี่ยงโครงการ/กิจกรรม/ภารกิจ อปท. ที่สำคัญ (เช่น RSK-01, RSK-02)' },
      { num: '4', title: 'ยุทธศาสตร์ที่รับผิดชอบ', desc: 'ระบุโครงการ/กิจกรรม/ภารกิจ อปท. ที่จัดทำขึ้นเพื่อตอบสนองยุทธศาสตร์ใดหรือภารกิจใดของ อปท.' },
      { num: '5', title: 'โครงการ/กิจกรรม/ภารกิจ อปท. ที่สำคัญ', desc: 'โครงการ/กิจกรรมที่สำคัญต่อการบรรลุวัตถุประสงค์ตามยุทธศาสตร์ (ระบุทั้งหมด หรือที่มีความเสี่ยง หรือที่มีความเสี่ยงสูง ตามนโยบายผู้บริหาร)' },
      { num: '6', title: 'งบประมาณ (บาท)', desc: 'จำนวนเงินงบประมาณโครงการ/กิจกรรม/ภารกิจ อปท. ตาม (5) (ถ้ามี)' },
      { num: '7', title: 'วัตถุประสงค์', desc: 'วัตถุประสงค์ตามโครงการ/กิจกรรม/ภารกิจ อปท. ตาม (5)' },
      { num: '8', title: 'ตัวชี้วัด', desc: 'ตัวชี้วัดของโครงการ/กิจกรรม/ภารกิจ อปท. ตาม (5)' },
      { num: '9', title: 'เป้าหมาย', desc: 'เป้าหมายที่ต้องการสูงสุดของโครงการ/กิจกรรม/ภารกิจ อปท.' },
      { num: '10-12', title: 'ลายมือชื่อ ตำแหน่ง วันเดือนปี', desc: 'ลายมือชื่อผู้บริหารท้องถิ่น ตำแหน่ง และวันเดือนปีที่ลงนาม' },
    ]
  },
  bs2: {
    title: 'คำอธิบายแบบการวิเคราะห์โอกาส ผลกระทบ และการตอบสนองความเสี่ยง',
    subtitle: 'ตามหนังสือสั่งการ มท 0805.2/ว 3482 ลงวันที่ 18 สิงหาคม 2566',
    items: [
      { num: '1 - 2', title: 'ชื่อ อปท. และปีงบประมาณ', desc: 'ระบุชื่อหน่วยงาน และปีงบประมาณที่บริหารจัดการความเสี่ยง' },
      { num: '3 - 5', title: 'รหัส, โครงการ/กิจกรรม, วัตถุประสงค์', desc: 'นำข้อมูลเชื่อมโยงมาจาก แบบ บส. 1 (ข้อ 3, 5, 7)' },
      { num: '6', title: 'ผู้รับผิดชอบ', desc: 'ระบุบุคคลหรือหน่วยงาน หรือบุคคลและหน่วยงานผู้รับผิดชอบภารกิจ' },
      { num: '7', title: 'ความเสี่ยง', desc: 'ความเสี่ยงที่มีผลกระทบต่อการบรรลุวัตถุประสงค์ของโครงการ/กิจกรรม/ภารกิจ อปท.' },
      { num: '8', title: 'ประเภทความเสี่ยง (6 ประเภท)', desc: '1. กลยุทธ์ (Strategy) 2. การเงิน (Financial) 3. การดำเนินงาน (Operation) 4. กฎระเบียบ (Legal) 5. เทคโนโลยีสารสนเทศ (Technology) 6. ความน่าเชื่อถือขององค์กร (Reputational)' },
      { num: '9', title: 'คะแนนโอกาส', desc: 'ระบุคะแนนโอกาสที่จะเกิดความเป็นไปได้หรือความถี่ที่จะเกิดความเสี่ยง (เกณฑ์ 1 - 5: สูงมาก, สูง, ปานกลาง, น้อย, น้อยที่สุด)' },
      { num: '10', title: 'คะแนนผลกระทบ', desc: 'ระบุคะแนนผลกระทบต่อโครงการ/กิจกรรม/ภารกิจ (เกณฑ์ 1 - 5: สูงมาก, สูง, ปานกลาง, น้อย, น้อยที่สุด)' },
      { num: '11', title: 'คะแนนระดับความเสี่ยง (9) x (10)', desc: 'คะแนนโอกาส x คะแนนผลกระทบ (1-25) และจัดระดับความเสี่ยง (สูงมาก, สูง, ปานกลาง, ต่ำ)' },
      { num: '12', title: 'วิธีการตอบสนองความเสี่ยง (8 วิธี)', desc: '1. ปฏิเสธความเสี่ยง 2. ลดโอกาส 3. ลดผลกระทบ 4. โอนความเสี่ยง 5. ยอมรับความเสี่ยง 6. ใช้มาตรการเฝ้าระวัง 7. ทำแผนฉุกเฉิน 8. ส่งเสริม/ผลักดันเหตุการณ์' },
      { num: '13-15', title: 'การลงนาม', desc: 'ลายมือชื่อผู้บริหารท้องถิ่น ตำแหน่ง และวันเดือนปีที่ลงนาม' },
    ]
  },
  bs3: {
    title: 'คำอธิบายแบบรายงานการจัดทำแผนบริหารความเสี่ยง',
    subtitle: 'ตามหนังสือสั่งการ มท 0805.2/ว 3482 ลงวันที่ 18 สิงหาคม 2566',
    items: [
      { num: '1 - 2', title: 'ชื่อ อปท. และปีงบประมาณ', desc: 'ระบุชื่อหน่วยงาน และปีงบประมาณ' },
      { num: '3 - 7', title: 'รหัส, โครงการ, ความเสี่ยง, การตอบสนอง, ผู้รับผิดชอบ', desc: 'นำข้อมูลเชื่อมโยงมาจาก แบบ บส. 2 (ข้อ 3, 4, 7, 12, 6)' },
      { num: '8', title: 'วิธีการจัดการความเสี่ยง (มาตรการควบคุม)', desc: 'ระบุแนวทางการดำเนินงาน/ขั้นตอนการปฏิบัติงาน ตามกฎหมาย ระเบียบ ข้อบังคับ และหนังสือสั่งการที่กำหนด เพื่อให้ความเสี่ยงลดลงหรืออยู่ในระดับที่ยอมรับได้' },
      { num: '9', title: 'ตัวชี้วัด', desc: 'ตัวชี้วัดของโครงการ/กิจกรรม/ภารกิจที่มีความเสี่ยง โดยนำข้อมูลมาจาก แบบ บส. 1 (ข้อ 8)' },
      { num: '10', title: 'ระยะเวลาดำเนินการ', desc: 'ระบุช่วงระยะเวลาในการดำเนินการจัดการความเสี่ยง (เช่น ตลอดปีงบประมาณ, ไตรมาส 1 - 2)' },
      { num: '11', title: 'วิธีการติดตาม และการรายงาน', desc: 'ระบุวิธีการติดตามและการรายงานให้ผู้บริหารทราบ เช่น การประชุมประจำเดือน, รายงานไตรมาส, สรุปผลต่อคณะกรรมการ' },
      { num: '12-14', title: 'การลงนาม', desc: 'ลายมือชื่อผู้บริหารท้องถิ่น ตำแหน่ง และวันเดือนปีที่ลงนาม' },
    ]
  },
  bs4: {
    title: 'คำอธิบายแบบรายงานการติดตามผลการบริหารความเสี่ยง',
    subtitle: 'ตามหนังสือสั่งการ มท 0805.2/ว 3482 ลงวันที่ 18 สิงหาคม 2566',
    items: [
      { num: 'หัวแบบ', title: 'รอบการติดตามผล', desc: 'เลือกกาเครื่องหมายถูก [✓] รอบ 3 เดือน หรือ [✓] รอบ 6 เดือน หรือ [✓] รอบ 12 เดือน' },
      { num: '1 - 2', title: 'ชื่อ อปท. และปีงบประมาณ', desc: 'ระบุชื่อหน่วยงาน และปีงบประมาณ' },
      { num: '3 - 7', title: 'รหัส, โครงการ, วิธีจัดการ, ระยะเวลา, ผู้รับผิดชอบ', desc: 'นำข้อมูลเชื่อมโยงมาจาก แบบ บส. 3 (ข้อ 3, 4, 8, 10, 7)' },
      { num: '8', title: 'ผลลัพธ์การดำเนินการจัดการความเสี่ยง', desc: 'ระบุผลการดำเนินงาน/ขั้นตอนปฏิบัติงาน ได้ดำเนินการหรือไม่อย่างไร (ระบุแต่ละขั้นตอนหรือภาพรวม)' },
      { num: '9', title: 'เอกสาร/หลักฐาน', desc: 'เอกสารหลักฐานอ้างอิงประกอบผลการดำเนินการจัดการความเสี่ยง เช่น บันทึกข้อความ, รายงาน, ภาพถ่าย' },
      { num: '10', title: 'ร้อยละความคืบหน้า', desc: 'ระบุความคืบหน้าของการดำเนินการเป็นร้อยละ (%)' },
      { num: '11', title: 'ปัญหาอุปสรรค และแนวทางแก้ไข', desc: 'ระบุปัญหา อุปสรรค และแนวทางแก้ไขปัญหาในการดำเนินมาตรการจัดการความเสี่ยง (ถ้ามี)' },
      { num: '12-14', title: 'การลงนาม', desc: 'ลายมือชื่อผู้บริหารท้องถิ่น ตำแหน่ง และวันเดือนปีที่ลงนาม' },
    ]
  },
  bs5: {
    title: 'คำอธิบายแบบรายงานผลการดำเนินการและทบทวนแผนการบริหารความเสี่ยง',
    subtitle: 'ตามหนังสือสั่งการ มท 0805.2/ว 3482 ลงวันที่ 18 สิงหาคม 2566',
    items: [
      { num: '1 - 2', title: 'ชื่อ อปท. และปีงบประมาณ', desc: 'ระบุชื่อหน่วยงาน และปีงบประมาณ' },
      { num: '3 - 5', title: 'รหัส, โครงการ/กิจกรรม, ความเสี่ยง', desc: 'นำข้อมูลเชื่อมโยงมาจาก แบบ บส. 4 และ บส. 3' },
      { num: '6', title: 'คะแนนระดับความเสี่ยงก่อนดำเนินการ', desc: 'โอกาส (1) x ผลกระทบ (2) = คะแนนระดับความเสี่ยง (3) จากการประเมินในแบบ บส. 2' },
      { num: '7', title: 'วิธีการจัดการความเสี่ยง', desc: 'แนวทางการดำเนินงานตามที่ระบุไว้ในแบบ บส. 4 (ข้อ 5)' },
      { num: '8', title: 'ผลดำเนินการจากการจัดการความเสี่ยง', desc: 'สรุปผลการดำเนินการจัดการความเสี่ยงเป็นภาพรวม' },
      { num: '9', title: 'คะแนนระดับความเสี่ยงภายหลังดำเนินการ', desc: 'ประเมินซ้ำหลังมีมาตรการ: โอกาส (1) x ผลกระทบ (2) = คะแนนระดับความเสี่ยง (3)' },
      { num: '10', title: 'การเปลี่ยนแปลงระดับความเสี่ยง', desc: 'เปรียบเทียบก่อนดำเนินการกับหลังดำเนินการว่า "ลดลง" หรือ "ไม่ลดลง"' },
      { num: '11', title: 'ความเสี่ยงคงเหลือ/เกิดขึ้นใหม่', desc: 'ระบุประเด็นความเสี่ยงที่ยังคงหลงเหลืออยู่ หรือความเสี่ยงใหม่ที่เกิดขึ้นระหว่างปี' },
      { num: '12', title: 'สรุปความเสี่ยง', desc: 'ระบุว่า "ควบคุมได้" หรือ "ควบคุมไม่ได้" (หรืออยู่ในระดับที่ยอมรับได้/ไม่ได้)' },
      { num: '13', title: 'แนวทาง/มาตรการสำหรับปีถัดไป', desc: 'กำหนดแนวทาง มาตรการ หรือวิธีการดำเนินการสำหรับปีงบประมาณถัดไป' },
      { num: '14-16', title: 'การลงนาม', desc: 'ลายมือชื่อผู้บริหารท้องถิ่น ตำแหน่ง และวันเดือนปีที่รายงาน' },
    ]
  }
};

export default function RiskManagementView({
  riskManagement,
  setRiskManagement,
  orgProfile,
  selectedYear = '2569',
  session
}) {
  const currentSession = session || getSession();
  const isAdmin =
    currentSession?.role === 'admin' ||
    currentSession?.department === 'หน่วยตรวจสอบภายใน' ||
    currentSession?.username === 'admin';
  const userDept = currentSession?.department || currentSession?.displayName || 'กองคลัง';

  // Navigation tabs: 'bs1', 'bs2', 'bs3', 'bs4', 'bs5'
  const [activeTab, setActiveTab] = useState('bs1');
  
  // Department filter
  const [filterDept, setFilterDept] = useState(isAdmin ? 'all' : userDept);

  // Toggle official explanation guide
  const [showGuide, setShowGuide] = useState(false);

  // Period for BS.4: '3month', '6month', '12month'
  const [bs4Period, setBs4Period] = useState('6month');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBs1, setEditingBs1] = useState(null);
  const [editingBs2, setEditingBs2] = useState(null);
  const [editingBs3, setEditingBs3] = useState(null);
  const [editingBs4, setEditingBs4] = useState(null);
  const [editingBs5, setEditingBs5] = useState(null);
  const [editingBs5Summary, setEditingBs5Summary] = useState(false);

  // Smart Assistant & Cascade & Compliance state
  const [showSmartAssistant, setShowSmartAssistant] = useState(false);
  const [smartDept, setSmartDept] = useState(isAdmin ? (filterDept !== 'all' ? filterDept : 'กองคลัง') : userDept);
  const [smartSearchTerm, setSmartSearchTerm] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showCascadeConfirm, setShowCascadeConfirm] = useState(false);
  const [cascadeSuccessMsg, setCascadeSuccessMsg] = useState('');

  // Department Submission & Internal Audit Review workflow state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitModalDept, setSubmitModalDept] = useState(userDept);
  const [submitNotes, setSubmitNotes] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewModalDept, setReviewModalDept] = useState('');
  const [reviewOpinion, setReviewOpinion] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [calMonth, setCalMonth] = useState(8); // 8 = กันยายน
  const [calYear, setCalYear] = useState(() => parseInt(selectedYear, 10) || 2569);
  const calendarPopupRef = useRef(null);

  // Close calendar popup on outside click
  React.useEffect(() => {
    if (!showCalendarPopup) return;
    const handleClickOutside = (e) => {
      if (calendarPopupRef.current && !calendarPopupRef.current.contains(e.target)) {
        setShowCalendarPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendarPopup]);

  // Dropdown menus & Collapsible Tracker states
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showGuideMenu, setShowGuideMenu] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showTrackerBoard, setShowTrackerBoard] = useState(false);
  const [showFormSelectorMenu, setShowFormSelectorMenu] = useState(false);

  // Close dropdown menus on outside click
  React.useEffect(() => {
    const handleOutsideMenuClick = (e) => {
      if (!e.target.closest('.dropdown-trigger-area')) {
        setShowExportMenu(false);
        setShowGuideMenu(false);
        setShowDataMenu(false);
        setShowFormSelectorMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideMenuClick);
    return () => document.removeEventListener('mousedown', handleOutsideMenuClick);
  }, []);

  const handleToggleCalendarPopup = () => {
    if (!showCalendarPopup) {
      if (reviewDate) {
        const match = reviewDate.match(/(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/);
        if (match) {
          const mIdx = THAI_MONTH_SHORT.indexOf(match[2]);
          if (mIdx !== -1) {
            setCalMonth(mIdx);
          } else {
            const fullIdx = THAI_MONTH_FULL.indexOf(match[2]);
            if (fullIdx !== -1) setCalMonth(fullIdx);
          }
          const yVal = parseInt(match[3], 10);
          if (yVal > 2500) setCalYear(yVal);
        }
      } else {
        setCalMonth(8); // กันยายน (วันสิ้นปีงบประมาณ)
        setCalYear(parseInt(selectedYear, 10) || 2569);
      }
    }
    setShowCalendarPopup((prev) => !prev);
  };

  const calendarDays = useMemo(() => {
    const ceYear = calYear > 2400 ? calYear - 543 : calYear;
    const firstDayOfWeek = new Date(ceYear, calMonth, 1).getDay(); // 0 = Sun
    const totalDays = new Date(ceYear, calMonth + 1, 0).getDate(); // 28-31
    return { firstDayOfWeek, totalDays };
  }, [calYear, calMonth]);

  const selectedDayNum = useMemo(() => {
    if (!reviewDate) return null;
    const match = reviewDate.match(/(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const mStr = match[2];
    const yVal = parseInt(match[3], 10);
    const mIdx = THAI_MONTH_SHORT.indexOf(mStr) !== -1 ? THAI_MONTH_SHORT.indexOf(mStr) : THAI_MONTH_FULL.indexOf(mStr);
    if (mIdx === calMonth && yVal === calYear) {
      return day;
    }
    return null;
  }, [reviewDate, calMonth, calYear]);

  // Cross-Machine file transfer ref & info state
  const fileInputRef = useRef(null);
  const [showCrossMachineInfo, setShowCrossMachineInfo] = useState(false);

  // Google Gemini AI Integration state
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiReady, setGeminiReady] = useState(() => isGeminiConfigured());
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isBs5AiAnalyzing, setIsBs5AiAnalyzing] = useState(false);
  const [isBatchAiAnalyzing, setIsBatchAiAnalyzing] = useState(false);

  React.useEffect(() => {
    const handleConfigChange = () => {
      setGeminiReady(isGeminiConfigured());
    };
    window.addEventListener('ia-gemini-config-changed', handleConfigChange);
    return () => window.removeEventListener('ia-gemini-config-changed', handleConfigChange);
  }, []);

  // Reusable Elegant Confirm Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    cancelText: 'ยกเลิก',
    isAlert: false,
    type: 'danger',
    onConfirm: () => {}
  });

  const openConfirmModal = (config) => {
    setConfirmModalConfig({
      isOpen: true,
      title: config.title || 'ยืนยันการทำรายการ',
      message: config.message,
      confirmText: config.confirmText || 'ยืนยัน',
      cancelText: config.cancelText !== undefined ? config.cancelText : 'ยกเลิก',
      isAlert: config.isAlert || false,
      type: config.type || 'danger',
      onConfirm: config.onConfirm || (() => {})
    });
  };

  const closeConfirmModal = () => {
    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // State for Add Modals
  const [formBs1, setFormBs1] = useState({
    department: isAdmin ? (filterDept !== 'all' ? filterDept : 'กองคลัง') : userDept,
    riskCode: '',
    strategy: '',
    activity: '',
    budget: '',
    objective: '',
    kpi: '',
    target: '',
    riskEvent: '',
    cause: '',
    riskCategory: 'ด้านการดำเนินงาน (Operation Risks)'
  });

  const [formBs2, setFormBs2] = useState({
    department: isAdmin ? (filterDept !== 'all' ? filterDept : 'กองคลัง') : userDept,
    riskCode: '',
    activity: '',
    objective: '',
    responsiblePerson: '',
    riskEvent: '',
    riskCategory: 'ด้านการดำเนินงาน (Operation Risks)',
    likelihood: 3,
    impact: 3,
    riskResponse: 'การลดโอกาสของความเสี่ยง'
  });

  const [formBs3, setFormBs3] = useState({
    department: isAdmin ? (filterDept !== 'all' ? filterDept : 'กองคลัง') : userDept,
    riskCode: '',
    activity: '',
    riskEvent: '',
    riskResponse: 'การลดโอกาสของความเสี่ยง',
    responsiblePerson: '',
    measures: '',
    kpi: '',
    timeline: 'ตลอดปีงบประมาณ',
    monitoringMethod: 'รายงานผลในการประชุมประจำเดือนของ อปท.'
  });

  const [formBs4, setFormBs4] = useState({
    department: isAdmin ? (filterDept !== 'all' ? filterDept : 'กองคลัง') : userDept,
    period: '6month',
    riskCode: '',
    activity: '',
    measures: '',
    timeline: 'ตลอดปีงบประมาณ',
    responsiblePerson: '',
    result: '',
    evidence: '',
    progressPercent: 80,
    problemSolution: ''
  });

  const [formBs5, setFormBs5] = useState({
    department: isAdmin ? (filterDept !== 'all' ? filterDept : 'กองคลัง') : userDept,
    riskCode: '',
    activity: '',
    riskEvent: '',
    preLikelihood: 3,
    preImpact: 3,
    measures: '',
    result: '',
    postLikelihood: 1,
    postImpact: 2,
    riskChange: 'ลดลง',
    residualRisk: '',
    controllable: 'ควบคุมได้',
    nextYearMeasures: ''
  });

  // Safe data extraction with normalization
  const bs1List = useMemo(() => {
    return (riskManagement?.bs1 || []).map((item, idx) => ({
      ...item,
      riskCode: item.riskCode || `RSK-0${idx + 1}`,
      activity: item.activity || item.riskEvent || 'โครงการ/ภารกิจสำคัญ',
      strategy: item.strategy || FANGKHAM_STRATEGIES[6],
      budget: item.budget !== undefined ? item.budget : 0,
      objective: item.objective || '',
      kpi: item.kpi || 'ร้อยละความสำเร็จตามเป้าหมาย (100%)',
      target: item.target || 'บรรลุตามวัตถุประสงค์ ไม่มีความเสียหาย'
    }));
  }, [riskManagement?.bs1]);

  const bs2List = useMemo(() => {
    return (riskManagement?.bs2 || []).map((item, idx) => {
      const matchBs1 = bs1List.find((b) => b.id === item.id || b.riskCode === item.riskCode || b.department === item.department);
      const l = Number(item.likelihood) || 3;
      const i = Number(item.impact) || 3;
      const score = l * i;
      return {
        ...item,
        riskCode: item.riskCode || matchBs1?.riskCode || `RSK-0${idx + 1}`,
        activity: item.activity || matchBs1?.activity || item.riskEvent || 'ภารกิจสำคัญ',
        objective: item.objective || matchBs1?.objective || '',
        responsiblePerson: item.responsiblePerson || `ผู้อำนวยการ${item.department || ''}`,
        riskEvent: item.riskEvent || matchBs1?.riskEvent || '',
        riskCategory: item.riskCategory || 'ด้านการดำเนินงาน (Operation Risks)',
        likelihood: l,
        impact: i,
        riskScore: score,
        riskLevel: item.riskLevel || (score >= 15 ? 'สูงมาก' : score >= 10 ? 'สูง' : score >= 5 ? 'ปานกลาง' : 'ต่ำ'),
        riskResponse: item.riskResponse || 'การลดโอกาสของความเสี่ยง'
      };
    });
  }, [riskManagement?.bs2, bs1List]);

  const bs3List = useMemo(() => {
    return (riskManagement?.bs3 || []).map((item, idx) => {
      const matchBs2 = bs2List.find((b) => b.id === item.id || b.riskCode === item.riskCode);
      const matchBs1 = bs1List.find((b) => b.id === item.id || b.riskCode === item.riskCode);
      return {
        ...item,
        riskCode: item.riskCode || matchBs2?.riskCode || `RSK-0${idx + 1}`,
        activity: item.activity || matchBs2?.activity || matchBs1?.activity || 'ภารกิจสำคัญ',
        riskEvent: item.riskEvent || matchBs2?.riskEvent || '',
        riskResponse: item.riskResponse || matchBs2?.riskResponse || 'การลดโอกาสของความเสี่ยง',
        responsiblePerson: item.responsiblePerson || matchBs2?.responsiblePerson || `ผู้อำนวยการ${item.department || ''}`,
        measures: item.measures || '',
        kpi: item.kpi || matchBs1?.kpi || 'ร้อยละของความสำเร็จตามมาตรการ (100%)',
        timeline: item.timeline || 'ตลอดปีงบประมาณ',
        monitoringMethod: item.monitoringMethod || 'รายงานผลในการประชุมประจำเดือนของ อปท.'
      };
    });
  }, [riskManagement?.bs3, bs2List, bs1List]);

  const bs4List = useMemo(() => {
    const rawBs4 = Array.isArray(riskManagement?.bs4) ? riskManagement.bs4 : [];

    // Process explicit items in riskManagement.bs4
    const processedRaw = rawBs4.map((item, idx) => {
      const matchBs3 = bs3List.find((b) => b.id === item.id || b.riskCode === item.riskCode);
      return {
        ...item,
        period: item.period || '6month',
        riskCode: item.riskCode || matchBs3?.riskCode || `RSK-0${idx + 1}`,
        activity: item.activity || matchBs3?.activity || 'ภารกิจสำคัญ',
        measures: item.measures || matchBs3?.measures || '',
        timeline: item.timeline || matchBs3?.timeline || 'ตลอดปีงบประมาณ',
        responsiblePerson: item.responsiblePerson || matchBs3?.responsiblePerson || `ผู้อำนวยการ${item.department || ''}`,
        result: item.result || item.progressDetail || '',
        evidence: item.evidence || 'บันทึกข้อความ, รายงานสรุปผล',
        progressPercent: item.progressPercent !== undefined ? item.progressPercent : (item.period === '12month' ? 100 : 80),
        problemSolution: item.problemSolution || ''
      };
    });

    // Ensure items exist for both 6month and 12month (and 3month if selected)
    const virtualItems = [];
    const targetPeriods = ['6month', '12month'];
    if (bs4Period === '3month') targetPeriods.push('3month');

    bs3List.forEach((b3, idx) => {
      targetPeriods.forEach((p) => {
        const exists = processedRaw.some(
          (x) => x.period === p && (x.riskCode === b3.riskCode || x.id === b3.id)
        );
        if (!exists) {
          const m6 = processedRaw.find(
            (x) => x.period === '6month' && (x.riskCode === b3.riskCode || x.id === b3.id)
          );

          if (p === '12month') {
            virtualItems.push({
              id: `BS4-12m-${b3.id || b3.riskCode || idx}`,
              period: '12month',
              riskCode: b3.riskCode,
              department: b3.department,
              activity: b3.activity,
              measures: b3.measures,
              timeline: b3.timeline || 'ตลอดปีงบประมาณ',
              responsiblePerson: b3.responsiblePerson,
              result: m6?.result
                ? `${m6.result} (ผลดำเนินงานสิ้นปีงบประมาณ: ดำเนินการแล้วเสร็จตามเป้าหมาย 100%)`
                : 'ดำเนินการตามมาตรการครบถ้วนตลอดปีงบประมาณ ความเสี่ยงลดลงสู่ระดับที่ยอมรับได้',
              evidence: m6?.evidence || 'รายงานสรุปผลการดำเนินงานประจำปี, ฎีกาเบิกจ่าย, ภาพถ่ายผลสำเร็จของโครงการ',
              progressPercent: 100,
              problemSolution: m6?.problemSolution && m6.problemSolution.trim() !== '-'
                ? `${m6.problemSolution} (ได้รับการแก้ไขและติดตามผลแล้วเสร็จ)`
                : getSmartProblemSolution(b3.riskCode, b3.activity, '12month')
            });
          } else if (p === '6month') {
            virtualItems.push({
              id: `BS4-6m-${b3.id || b3.riskCode || idx}`,
              period: '6month',
              riskCode: b3.riskCode,
              department: b3.department,
              activity: b3.activity,
              measures: b3.measures,
              timeline: b3.timeline || 'ไตรมาส 1 - 2',
              responsiblePerson: b3.responsiblePerson,
              result: 'ได้ดำเนินการตามมาตรการควบคุมภายในรอบ 6 เดือน ความเสี่ยงลดลงสู่ระดับที่ยอมรับได้',
              evidence: 'บันทึกข้อความ, รายงานสรุปผลรอบ 6 เดือน, ภาพถ่ายกิจกรรม',
              progressPercent: 80,
              problemSolution: getSmartProblemSolution(b3.riskCode, b3.activity, '6month')
            });
          } else if (p === '3month') {
            virtualItems.push({
              id: `BS4-3m-${b3.id || b3.riskCode || idx}`,
              period: '3month',
              riskCode: b3.riskCode,
              department: b3.department,
              activity: b3.activity,
              measures: b3.measures,
              timeline: 'ไตรมาสที่ 1 (ต.ค. - ธ.ค.)',
              responsiblePerson: b3.responsiblePerson,
              result: 'อยู่ระหว่างเริ่มดำเนินโครงการและจัดเตรียมความพร้อมตามมาตรการควบคุม',
              evidence: 'บันทึกข้อความขออนุมัติโครงการ, แผนการปฏิบัติงาน',
              progressPercent: 35,
              problemSolution: getSmartProblemSolution(b3.riskCode, b3.activity, '3month')
            });
          }
        }
      });
    });

    return [...processedRaw, ...virtualItems];
  }, [riskManagement?.bs4, bs3List, bs4Period]);

  const bs5Data = useMemo(() => {
    const raw = riskManagement?.bs5 || {};
    const items = (raw.items && Array.isArray(raw.items) && raw.items.length > 0)
      ? raw.items
      : bs1List.map((b, idx) => {
          const m2 = bs2List.find((x) => x.riskCode === b.riskCode || x.id === b.id);
          const m3 = bs3List.find((x) => x.riskCode === b.riskCode || x.id === b.id);
          const m4 = bs4List.find((x) => (x.period === '12month' || x.period === '6month') && (x.riskCode === b.riskCode || x.id === b.id));
          const preL = m2?.likelihood || 3;
          const preI = m2?.impact || 3;
          const postL = 1;
          const postI = 2;
          return {
            id: `BS5-${idx + 1}`,
            riskCode: b.riskCode,
            department: b.department,
            activity: b.activity,
            riskEvent: b.riskEvent,
            preLikelihood: preL,
            preImpact: preI,
            preScore: preL * preI,
            measures: m3?.measures || 'กำหนดมาตรการควบคุมและกำกับดูแล',
            result: m4?.result || 'ดำเนินมาตรการครบถ้วน ความเสี่ยงลดลงสู่ระดับที่ยอมรับได้',
            postLikelihood: postL,
            postImpact: postI,
            postScore: postL * postI,
            riskChange: 'ลดลง',
            residualRisk: 'ความเสี่ยงด้านการปฏิบัติงานต่อเนื่องตามภารกิจ',
            controllable: 'ควบคุมได้',
            nextYearMeasures: 'ติดตามผลและปรับปรุงมาตรการอย่างสม่ำเสมอ'
          };
        });

    return {
      summary: raw.summary || `ภาพรวมการบริหารจัดการความเสี่ยงระดับองค์กรของ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} ในรอบปีงบประมาณ พ.ศ. ${selectedYear} มีการระบุและประเมินความเสี่ยงครบถ้วนทุกส่วนราชการ โดยความเสี่ยงระดับสูงได้รับการบริหารจัดการและติดตามผลจนลดระดับลงมาอยู่ในเกณฑ์ที่ยอมรับได้ การดำเนินงานเป็นไปตามเกณฑ์มาตรฐานการบริหารความเสี่ยงของ อปท. ตามหนังสือสั่งการ มท 0805.2/ว 3482`,
      approvedBy: raw.approvedBy || orgProfile?.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น',
      approverPosition: raw.approverPosition || orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น',
      reportDate: raw.reportDate || `30 กันยายน ${selectedYear}`,
      items
    };
  }, [riskManagement?.bs5, bs1List, bs2List, bs3List, bs4List, orgProfile, selectedYear]);

  // 5 Main Divisions of the Local Administration (มท 0805.2/ว 3482)
  const departmentsList = useMemo(() => {
    const rawDepts = getDepartments().filter((d) => d !== 'หน่วยตรวจสอบภายใน' && !d.includes('สาธารณสุข') && !d.startsWith('ศพด.'));
    const order = { 'สำนักปลัด': 1, 'กองคลัง': 2, 'กองช่าง': 3, 'กองการศึกษา': 4, 'กองสวัสดิการสังคม': 5 };
    return rawDepts.sort((a, b) => (order[a] || 99) - (order[b] || 99));
  }, []);

  // Submissions state tracking across departments
  const submissions = riskManagement?.submissions || {};
  const currentDeptSubmission = submissions[userDept] || { status: 'draft' };

  // Filtered lists based on permission and active department filter
  const effectiveDept = isAdmin ? filterDept : userDept;
  // เป็นกองย่อยหรือไม่ (หากไม่ใช่ Admin หรือ Admin กำลังเลือกดูกองย่อยใดกองหนึ่ง)
  const isSubDivision = !isAdmin || (filterDept !== 'all');

  const filteredBs1 = useMemo(() => {
    if (isAdmin && filterDept === 'all') return bs1List;
    return bs1List.filter((item) => (item.department || '').trim() === effectiveDept.trim());
  }, [bs1List, isAdmin, filterDept, effectiveDept]);

  const filteredBs2 = useMemo(() => {
    if (isAdmin && filterDept === 'all') return bs2List;
    return bs2List.filter((item) => (item.department || '').trim() === effectiveDept.trim());
  }, [bs2List, isAdmin, filterDept, effectiveDept]);

  const filteredBs3 = useMemo(() => {
    if (isAdmin && filterDept === 'all') return bs3List;
    return bs3List.filter((item) => (item.department || '').trim() === effectiveDept.trim());
  }, [bs3List, isAdmin, filterDept, effectiveDept]);

  const filteredBs4 = useMemo(() => {
    let list = bs4List;
    if (bs4Period) {
      list = list.filter((item) => (item.period || '6month') === bs4Period);
    }
    if (isAdmin && filterDept === 'all') return list;
    return list.filter((item) => (item.department || '').trim() === effectiveDept.trim());
  }, [bs4List, bs4Period, isAdmin, filterDept, effectiveDept]);

  const filteredBs5Items = useMemo(() => {
    if (isAdmin && filterDept === 'all') return bs5Data.items;
    return bs5Data.items.filter((item) => (item.department || '').trim() === effectiveDept.trim());
  }, [bs5Data.items, isAdmin, filterDept, effectiveDept]);

  // Check edit permission for an item
  const canEditItem = (itemDept) => {
    if (isAdmin) return true;
    return (itemDept || '').trim() === userDept.trim();
  };

  const computeRiskLevel = (score) => {
    if (score >= 15) return 'สูงมาก';
    if (score >= 10) return 'สูง';
    if (score >= 5) return 'ปานกลาง';
    return 'ต่ำ';
  };

  const getRiskLevelBadge = (level) => {
    switch (level) {
      case 'สูงมาก':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
      case 'สูง':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
      case 'ปานกลาง':
        return 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
    }
  };

  // คำนวณความสอดคล้องตามมาตรฐาน ว 3482 และหลักเกณฑ์ กค. 2562
  const complianceAudit = useMemo(() => {
    return auditW3482Compliance({
      bs1: bs1List,
      bs2: bs2List,
      bs3: bs3List,
      bs4: bs4List,
      bs5: bs5Data
    });
  }, [bs1List, bs2List, bs3List, bs4List, bs5Data]);

  // Execute Auto-Cascade across BS.1 -> BS.5
  const handleExecuteCascade = (targetDept = (isAdmin ? filterDept : userDept)) => {
    const isAll = targetDept === 'all';
    const result = cascadeAllBsForms({
      bs1List: isAll ? bs1List : bs1List.filter(item => (item.department || '').trim() === targetDept.trim()),
      targetDepartment: targetDept,
      orgProfile,
      selectedYear
    });

    if (setRiskManagement) {
      setRiskManagement(prev => {
        const updatedBs2 = isAll 
          ? result.bs2 
          : [...(prev?.bs2 || bs2List).filter(b => (b.department || '').trim() !== targetDept.trim()), ...result.bs2];
        const updatedBs3 = isAll 
          ? result.bs3 
          : [...(prev?.bs3 || bs3List).filter(b => (b.department || '').trim() !== targetDept.trim()), ...result.bs3];
        const updatedBs4 = isAll 
          ? result.bs4 
          : [...(prev?.bs4 || bs4List).filter(b => (b.department || '').trim() !== targetDept.trim()), ...result.bs4];
        const updatedBs5Items = isAll 
          ? result.bs5Items 
          : [...(bs5Data.items || []).filter(b => (b.department || '').trim() !== targetDept.trim()), ...result.bs5Items];

        return {
          ...prev,
          bs2: updatedBs2,
          bs3: updatedBs3,
          bs4: updatedBs4,
          bs5: {
            ...bs5Data,
            items: updatedBs5Items
          }
        };
      });
    }
    setCascadeSuccessMsg(`⚡ ซิงค์เชื่อมโยงข้อมูลข้ามแบบฟอร์ม 1 ➜ 5 สำหรับ "${targetDept === 'all' ? 'ทุกกอง' : targetDept}" สำเร็จตามหลักเกณฑ์ ว 3482!`);
    setTimeout(() => setCascadeSuccessMsg(''), 5000);
    setShowCascadeConfirm(false);
  };

  // Import single standard risk from library into BS.1 -> BS.5
  const handleImportStandardRisk = (stdRisk, targetDept) => {
    const dept = isAdmin
      ? (targetDept || (filterDept !== 'all' ? filterDept : 'กองคลัง'))
      : userDept;
    const newCode = `RSK-0${bs1List.length + 1}`;
    const newId = `BS1-${Date.now()}`;

    const newBs1 = {
      id: newId,
      riskCode: newCode,
      department: dept,
      strategy: stdRisk.strategy,
      activity: stdRisk.activity,
      budget: stdRisk.budget || 0,
      objective: stdRisk.objective,
      kpi: stdRisk.kpi,
      target: stdRisk.target,
      riskEvent: stdRisk.riskEvent,
      cause: stdRisk.cause,
      riskCategory: stdRisk.riskCategory
    };

    const newBs2 = {
      id: `BS2-${Date.now()}`,
      riskCode: newCode,
      department: dept,
      activity: stdRisk.activity,
      objective: stdRisk.objective,
      responsiblePerson: stdRisk.responsiblePerson,
      riskEvent: stdRisk.riskEvent,
      riskCategory: stdRisk.riskCategory,
      likelihood: stdRisk.likelihood,
      impact: stdRisk.impact,
      riskScore: stdRisk.riskScore,
      riskLevel: stdRisk.riskLevel,
      riskResponse: stdRisk.riskResponse
    };

    const newBs3 = {
      id: `BS3-${Date.now()}`,
      riskCode: newCode,
      department: dept,
      activity: stdRisk.activity,
      riskEvent: stdRisk.riskEvent,
      riskResponse: stdRisk.riskResponse,
      responsiblePerson: stdRisk.responsiblePerson,
      measures: stdRisk.treatmentMeasures,
      kpi: stdRisk.kpiMeasure,
      timeline: stdRisk.timeline,
      monitoringMethod: stdRisk.monitoringMethod
    };

    const newBs4 = {
      id: `BS4-${Date.now()}`,
      period: '6month',
      riskCode: newCode,
      department: dept,
      activity: stdRisk.activity,
      measures: stdRisk.treatmentMeasures,
      timeline: stdRisk.timeline,
      responsiblePerson: stdRisk.responsiblePerson,
      result: 'ดำเนินการตามมาตรการควบคุมแล้วเสร็จ ความเสี่ยงลดลงสู่ระดับที่ยอมรับได้',
      evidence: 'บันทึกข้อความ, รายงานสรุปผล, ภาพถ่ายตรวจหน้างาน',
      progressPercent: 85,
      problemSolution: 'ไม่มีปัญหาอุปสรรคสำคัญ'
    };

    const newBs5 = {
      id: `BS5-${Date.now()}`,
      riskCode: newCode,
      department: dept,
      activity: stdRisk.activity,
      riskEvent: stdRisk.riskEvent,
      preLikelihood: stdRisk.likelihood,
      preImpact: stdRisk.impact,
      preScore: stdRisk.riskScore,
      measures: stdRisk.treatmentMeasures,
      result: 'ดำเนินมาตรการครบถ้วน ความเสี่ยงลดลงสู่ระดับที่ยอมรับได้',
      postLikelihood: stdRisk.expectedPostLikelihood || 1,
      postImpact: stdRisk.expectedPostImpact || 2,
      postScore: (stdRisk.expectedPostLikelihood || 1) * (stdRisk.expectedPostImpact || 2),
      riskChange: 'ลดลง',
      residualRisk: 'ความเสี่ยงด้านการปฏิบัติงานต่อเนื่อง',
      controllable: 'ควบคุมได้',
      nextYearMeasures: 'ติดตามผลการควบคุมและทบทวนความเสี่ยงในปีงบประมาณถัดไป'
    };

    if (setRiskManagement) {
      setRiskManagement(prev => ({
        ...prev,
        bs1: [...(prev?.bs1 || bs1List), newBs1],
        bs2: [...(prev?.bs2 || bs2List), newBs2],
        bs3: stdRisk.riskScore >= 10 ? [...(prev?.bs3 || bs3List), newBs3] : (prev?.bs3 || bs3List),
        bs4: stdRisk.riskScore >= 10 ? [...(prev?.bs4 || bs4List), newBs4] : (prev?.bs4 || bs4List),
        bs5: {
          ...bs5Data,
          items: [...(bs5Data.items || []), newBs5]
        }
      }));
    }

    setCascadeSuccessMsg(`✨ นำเข้าภารกิจ "${stdRisk.activity}" เข้าสู่แบบ บส. 1 - บส. 5 เรียบร้อยแล้ว!`);
    setTimeout(() => setCascadeSuccessMsg(''), 4000);
  };

  // Copy risk management data from year 2569 to current year
  const handleCopyFromPreviousYear = () => {
    try {
      const raw = localStorage.getItem('ia_risk_management_by_year');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const sourceData = parsed['2569'];
      if (!sourceData || !sourceData.bs1 || sourceData.bs1.length === 0) return;

      openConfirmModal({
        title: 'คัดลอกข้อมูลความเสี่ยงจากปี พ.ศ. 2569',
        message: `ต้องการคัดลอกชุดข้อมูลความเสี่ยง (แบบ บส. 1 ถึง บส. 5) จากปีงบประมาณ 2569 มาเริ่มต้นเป็นข้อมูลของปีงบประมาณ ${selectedYear} หรือไม่?`,
        confirmText: 'คัดลอกข้อมูล',
        type: 'info',
        onConfirm: () => {
          const copied = JSON.parse(JSON.stringify(sourceData));
          if (setRiskManagement) {
            setRiskManagement(copied);
          }
          setCascadeSuccessMsg(`📋 คัดลอกข้อมูลความเสี่ยงจากปี 2569 มายังปี ${selectedYear} เรียบร้อยแล้ว`);
          setTimeout(() => setCascadeSuccessMsg(''), 4000);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Deploy all standard risks for selected department
  const handleDeployFullPackage = (targetDept) => {
    const deptToDeploy = isAdmin ? targetDept : userDept;
    const stds = getStandardRisksByDepartment(deptToDeploy);
    if (!stds || stds.length === 0) return;
    
    openConfirmModal({
      title: 'ติดตั้งชุดภารกิจและความเสี่ยงมาตรฐาน ว 3482',
      message: `คุณต้องการติดตั้งชุดภารกิจและความเสี่ยงมาตรฐาน ว 3482 สำหรับ "${deptToDeploy}" ทั้งหมด ${stds.length} ภารกิจ เข้าสู่แบบฟอร์ม บส.1 ถึง บส.5 ใช่หรือไม่?`,
      confirmText: 'ติดตั้งภารกิจมาตรฐาน',
      type: 'info',
      onConfirm: () => {
        executeDeployFullPackage(deptToDeploy, stds);
      }
    });
  };

  const executeDeployFullPackage = (targetDept, stds) => {

    const newBs1Items = [];
    const newBs2Items = [];
    const newBs3Items = [];
    const newBs4Items = [];
    const newBs5Items = [];

    stds.forEach((stdRisk, idx) => {
      const newCode = `RSK-${String(bs1List.length + idx + 1).padStart(2, '0')}`;
      const uniqueId = `${Date.now()}-${idx}`;

      newBs1Items.push({
        id: `BS1-${uniqueId}`,
        riskCode: newCode,
        department: targetDept,
        strategy: stdRisk.strategy,
        activity: stdRisk.activity,
        budget: stdRisk.budget || 0,
        objective: stdRisk.objective,
        kpi: stdRisk.kpi,
        target: stdRisk.target,
        riskEvent: stdRisk.riskEvent,
        cause: stdRisk.cause,
        riskCategory: stdRisk.riskCategory
      });

      newBs2Items.push({
        id: `BS2-${uniqueId}`,
        riskCode: newCode,
        department: targetDept,
        activity: stdRisk.activity,
        objective: stdRisk.objective,
        responsiblePerson: stdRisk.responsiblePerson,
        riskEvent: stdRisk.riskEvent,
        riskCategory: stdRisk.riskCategory,
        likelihood: stdRisk.likelihood,
        impact: stdRisk.impact,
        riskScore: stdRisk.riskScore,
        riskLevel: stdRisk.riskLevel,
        riskResponse: stdRisk.riskResponse
      });

      if (stdRisk.riskScore >= 10) {
        newBs3Items.push({
          id: `BS3-${uniqueId}`,
          riskCode: newCode,
          department: targetDept,
          activity: stdRisk.activity,
          riskEvent: stdRisk.riskEvent,
          riskResponse: stdRisk.riskResponse,
          responsiblePerson: stdRisk.responsiblePerson,
          measures: stdRisk.treatmentMeasures,
          kpi: stdRisk.kpiMeasure,
          timeline: stdRisk.timeline,
          monitoringMethod: stdRisk.monitoringMethod
        });

        newBs4Items.push({
          id: `BS4-${uniqueId}`,
          period: '6month',
          riskCode: newCode,
          department: targetDept,
          activity: stdRisk.activity,
          measures: stdRisk.treatmentMeasures,
          timeline: stdRisk.timeline,
          responsiblePerson: stdRisk.responsiblePerson,
          result: 'ดำเนินการตามมาตรการควบคุมแล้วเสร็จ ความเสี่ยงลดลงสู่ระดับที่ยอมรับได้',
          evidence: 'บันทึกข้อความ, รายงานสรุปผล, ภาพถ่ายตรวจหน้างาน',
          progressPercent: 85,
          problemSolution: 'ไม่มีปัญหาอุปสรรคสำคัญ'
        });
      }

      newBs5Items.push({
        id: `BS5-${uniqueId}`,
        riskCode: newCode,
        department: targetDept,
        activity: stdRisk.activity,
        riskEvent: stdRisk.riskEvent,
        preLikelihood: stdRisk.likelihood,
        preImpact: stdRisk.impact,
        preScore: stdRisk.riskScore,
        measures: stdRisk.treatmentMeasures,
        result: 'ดำเนินมาตรการครบถ้วน ความเสี่ยงลดลงสู่ระดับที่ยอมรับได้',
        postLikelihood: stdRisk.expectedPostLikelihood || 1,
        postImpact: stdRisk.expectedPostImpact || 2,
        postScore: (stdRisk.expectedPostLikelihood || 1) * (stdRisk.expectedPostImpact || 2),
        riskChange: 'ลดลง',
        residualRisk: 'ความเสี่ยงด้านการปฏิบัติงานต่อเนื่อง',
        controllable: 'ควบคุมได้',
        nextYearMeasures: 'ติดตามผลการควบคุมและทบทวนความเสี่ยงในปีงบประมาณถัดไป'
      });
    });

    if (setRiskManagement) {
      setRiskManagement(prev => ({
        ...prev,
        bs1: [...(prev?.bs1 || bs1List), ...newBs1Items],
        bs2: [...(prev?.bs2 || bs2List), ...newBs2Items],
        bs3: [...(prev?.bs3 || bs3List), ...newBs3Items],
        bs4: [...(prev?.bs4 || bs4List), ...newBs4Items],
        bs5: {
          ...bs5Data,
          items: [...(bs5Data.items || []), ...newBs5Items]
        }
      }));
    }

    setCascadeSuccessMsg(`🚀 ติดตั้งชุดภารกิจและความเสี่ยงมาตรฐาน ${stds.length} รายการ สำหรับ "${targetDept}" เรียบร้อยแล้ว!`);
    setTimeout(() => setCascadeSuccessMsg(''), 5000);
  };

  // --- HANDLERS: ADD / EDIT / DELETE ---
  // Add BS.1 (and cascade auto-seed for BS.2, 3, 4, 5)
  const handleAddBs1 = (e) => {
    e.preventDefault();
    if (!formBs1.activity) return;
    const targetDept = isAdmin ? formBs1.department : userDept;
    const newCode = formBs1.riskCode || `RSK-0${bs1List.length + 1}`;
    const newId = `BS1-${Date.now()}`;

    const newBs1Item = {
      ...formBs1,
      id: newId,
      riskCode: newCode,
      department: targetDept
    };

    const newBs2Item = {
      id: `BS2-${Date.now()}`,
      riskCode: newCode,
      department: targetDept,
      activity: formBs1.activity,
      objective: formBs1.objective,
      responsiblePerson: `ผู้อำนวยการ${targetDept}`,
      riskEvent: formBs1.riskEvent || formBs1.activity,
      riskCategory: formBs1.riskCategory || 'ด้านการดำเนินงาน (Operation Risks)',
      likelihood: 3,
      impact: 3,
      riskScore: 9,
      riskLevel: 'ปานกลาง',
      riskResponse: 'การลดโอกาสของความเสี่ยง'
    };

    const newBs3Item = {
      id: `BS3-${Date.now()}`,
      riskCode: newCode,
      department: targetDept,
      activity: formBs1.activity,
      riskEvent: formBs1.riskEvent || formBs1.activity,
      riskResponse: 'การลดโอกาสของความเสี่ยง',
      responsiblePerson: `ผู้อำนวยการ${targetDept}`,
      measures: `กำหนดมาตรการควบคุมภายในและการกำกับดูแลสำหรับ ${targetDept}`,
      kpi: formBs1.kpi || 'ร้อยละความสำเร็จตามมาตรการ (100%)',
      timeline: 'ตลอดปีงบประมาณ',
      monitoringMethod: 'รายงานผลในการประชุมประจำเดือนของ อปท.'
    };

    const newBs4Item = {
      id: `BS4-${Date.now()}`,
      period: '6month',
      riskCode: newCode,
      department: targetDept,
      activity: formBs1.activity,
      measures: `กำหนดมาตรการควบคุมภายในและการกำกับดูแลสำหรับ ${targetDept}`,
      timeline: 'ตลอดปีงบประมาณ',
      responsiblePerson: `ผู้อำนวยการ${targetDept}`,
      result: 'อยู่ระหว่างดำเนินการตามมาตรการที่กำหนด',
      evidence: 'บันทึกข้อความ, รายงานสรุปผล',
      progressPercent: 80,
      problemSolution: ''
    };

    const newBs5Item = {
      id: `BS5-${Date.now()}`,
      riskCode: newCode,
      department: targetDept,
      activity: formBs1.activity,
      riskEvent: formBs1.riskEvent || formBs1.activity,
      preLikelihood: 3,
      preImpact: 3,
      preScore: 9,
      measures: `กำหนดมาตรการควบคุมภายในและการกำกับดูแลสำหรับ ${targetDept}`,
      result: 'ดำเนินมาตรการครบถ้วน ความเสี่ยงลดลงสู่เกณฑ์ที่ยอมรับได้',
      postLikelihood: 1,
      postImpact: 2,
      postScore: 2,
      riskChange: 'ลดลง',
      residualRisk: 'ความเสี่ยงด้านการปฏิบัติงานต่อเนื่อง',
      controllable: 'ควบคุมได้',
      nextYearMeasures: 'ติดตามผลและปรับปรุงมาตรการอย่างสม่ำเสมอ'
    };

    if (setRiskManagement) {
      setRiskManagement((prev) => ({
        ...prev,
        bs1: [...(prev?.bs1 || bs1List), newBs1Item],
        bs2: [...(prev?.bs2 || bs2List), newBs2Item],
        bs3: [...(prev?.bs3 || bs3List), newBs3Item],
        bs4: [...(prev?.bs4 || bs4List), newBs4Item],
        bs5: {
          ...bs5Data,
          items: [...(bs5Data.items || []), newBs5Item]
        }
      }));
    }

    setFormBs1({
      department: isAdmin ? (filterDept !== 'all' ? filterDept : 'กองคลัง') : userDept,
      riskCode: '',
      strategy: '',
      activity: '',
      budget: '',
      objective: '',
      kpi: '',
      target: '',
      riskEvent: '',
      cause: '',
      riskCategory: 'ด้านการดำเนินงาน (Operation Risks)'
    });
    setShowAddModal(false);
  };

  // Save Edit BS.1
  const handleSaveEditBs1 = (e) => {
    e.preventDefault();
    if (!editingBs1) return;
    const finalDept = isAdmin ? editingBs1.department : editingBs1.department || userDept;
    if (setRiskManagement) {
      setRiskManagement((prev) => {
        const updatedBs1 = (prev?.bs1 || bs1List).map((item) =>
          item.id === editingBs1.id ? { ...item, ...editingBs1, department: finalDept } : item
        );
        // Cascade update activity & code to BS.2, 3, 4, 5
        const updatedBs2 = (prev?.bs2 || bs2List).map((item) =>
          item.riskCode === editingBs1.riskCode || item.id === editingBs1.id
            ? { ...item, activity: editingBs1.activity, riskEvent: editingBs1.riskEvent, department: finalDept }
            : item
        );
        const updatedBs3 = (prev?.bs3 || bs3List).map((item) =>
          item.riskCode === editingBs1.riskCode || item.id === editingBs1.id
            ? { ...item, activity: editingBs1.activity, riskEvent: editingBs1.riskEvent, department: finalDept }
            : item
        );
        const updatedBs4 = (prev?.bs4 || bs4List).map((item) =>
          item.riskCode === editingBs1.riskCode || item.id === editingBs1.id
            ? { ...item, activity: editingBs1.activity, department: finalDept }
            : item
        );
        const updatedBs5Items = (bs5Data.items || []).map((item) =>
          item.riskCode === editingBs1.riskCode || item.id === editingBs1.id
            ? { ...item, activity: editingBs1.activity, riskEvent: editingBs1.riskEvent, department: finalDept }
            : item
        );
        return {
          ...prev,
          bs1: updatedBs1,
          bs2: updatedBs2,
          bs3: updatedBs3,
          bs4: updatedBs4,
          bs5: { ...bs5Data, items: updatedBs5Items }
        };
      });
    }
    setEditingBs1(null);
  };

  // Delete BS.1
  const handleDeleteBs1 = (id, riskCode, activityName = '') => {
    openConfirmModal({
      title: 'ยืนยันการลบรายการความเสี่ยง',
      message: `คุณต้องการลบรายการ "${riskCode}${activityName ? ` : ${activityName}` : ''}" ออกจากระบบบริหารความเสี่ยง (แบบ บส.1 ถึง บส.5) ใช่หรือไม่?`,
      confirmText: 'ลบรายการนี้',
      type: 'danger',
      onConfirm: () => {
        if (setRiskManagement) {
          setRiskManagement((prev) => ({
            ...prev,
            bs1: (prev?.bs1 || bs1List).filter((item) => item.id !== id && item.riskCode !== riskCode),
            bs2: (prev?.bs2 || bs2List).filter((item) => item.id !== id && item.riskCode !== riskCode),
            bs3: (prev?.bs3 || bs3List).filter((item) => item.id !== id && item.riskCode !== riskCode),
            bs4: (prev?.bs4 || bs4List).filter((item) => item.id !== id && item.riskCode !== riskCode),
            bs5: {
              ...bs5Data,
              items: (bs5Data.items || []).filter((item) => item.id !== id && item.riskCode !== riskCode)
            }
          }));
          setCascadeSuccessMsg(`ลบรายการ ${riskCode} เรียบร้อยแล้ว`);
          setTimeout(() => setCascadeSuccessMsg(''), 3000);
        }
      }
    });
  };

  // Save Edit BS.2
  const handleSaveEditBs2 = (e) => {
    e.preventDefault();
    if (!editingBs2) return;
    const l = Number(editingBs2.likelihood) || 1;
    const i = Number(editingBs2.impact) || 1;
    const score = l * i;
    const level = computeRiskLevel(score);
    if (setRiskManagement) {
      setRiskManagement((prev) => ({
        ...prev,
        bs2: (prev?.bs2 || bs2List).map((item) =>
          item.id === editingBs2.id
            ? { ...item, ...editingBs2, likelihood: l, impact: i, riskScore: score, riskLevel: level }
            : item
        )
      }));
    }
    setEditingBs2(null);
  };

  // Save Edit BS.3
  const handleSaveEditBs3 = (e) => {
    e.preventDefault();
    if (!editingBs3) return;
    if (setRiskManagement) {
      setRiskManagement((prev) => ({
        ...prev,
        bs3: (prev?.bs3 || bs3List).map((item) =>
          item.id === editingBs3.id ? { ...item, ...editingBs3 } : item
        )
      }));
    }
    setEditingBs3(null);
  };

  // Save Edit BS.4
  const handleSaveEditBs4 = (e) => {
    e.preventDefault();
    if (!editingBs4) return;
    if (setRiskManagement) {
      setRiskManagement((prev) => {
        const currentList = prev?.bs4 || bs4List;
        const targetPeriod = editingBs4.period || '6month';
        const existsIndex = currentList.findIndex(
          (item) => item.id === editingBs4.id || 
                    (item.riskCode === editingBs4.riskCode && (item.period || '6month') === targetPeriod)
        );
        let updatedBs4;
        if (existsIndex >= 0) {
          updatedBs4 = currentList.map((item, idx) =>
            idx === existsIndex ? { ...item, ...editingBs4 } : item
          );
        } else {
          updatedBs4 = [...currentList, editingBs4];
        }
        return {
          ...prev,
          bs4: updatedBs4
        };
      });
    }
    setEditingBs4(null);
  };

  // Copy 6-month tracking data to 12-month
  const handleCopy6MonthTo12Month = () => {
    if (!setRiskManagement) return;
    const sixMonthItems = bs4List.filter((b) => (b.period || '6month') === '6month');
    if (sixMonthItems.length === 0) return;

    setRiskManagement((prev) => {
      const currentBs4 = prev?.bs4 || bs4List;
      const otherBs4 = currentBs4.filter((b) => b.period !== '12month');
      const new12m = sixMonthItems.map((item, idx) => ({
        id: `BS4-12m-${item.id || item.riskCode || idx}`,
        period: '12month',
        riskCode: item.riskCode,
        department: item.department,
        activity: item.activity,
        measures: item.measures,
        timeline: item.timeline || 'ตลอดปีงบประมาณ',
        responsiblePerson: item.responsiblePerson,
        result: item.result
          ? `${item.result} (ผลดำเนินงานสิ้นปีงบประมาณ: ดำเนินการแล้วเสร็จตามเป้าหมาย 100%)`
          : 'ดำเนินการตามมาตรการครบถ้วนตลอดปีงบประมาณ ความเสี่ยงลดลงสู่ระดับที่ยอมรับได้',
        evidence: item.evidence || 'รายงานสรุปผลการดำเนินงานประจำปี, ฎีกาเบิกจ่าย, ภาพถ่ายผลสำเร็จของโครงการ',
        progressPercent: 100,
        problemSolution: item.problemSolution && item.problemSolution.trim() !== '-'
          ? `${item.problemSolution} (ได้รับการแก้ไขและติดตามผลแล้วเสร็จ)`
          : getSmartProblemSolution(item.riskCode, item.activity, '12month')
      }));

      return {
        ...prev,
        bs4: [...otherBs4, ...new12m]
      };
    });

    setCascadeSuccessMsg('🎉 คัดลอกและอัปเดตข้อมูลการติดตามผลจากรอบ 6 เดือน สู่รอบ 12 เดือน (สิ้นปีงบประมาณ) สำเร็จเรียบร้อยแล้ว!');
    setTimeout(() => setCascadeSuccessMsg(''), 5000);
  };

  // Set all 12-month progress to 100%
  const handleSetAll12mTo100Percent = () => {
    if (!setRiskManagement) return;
    setRiskManagement((prev) => {
      const currentBs4 = prev?.bs4 || bs4List;
      const updated = currentBs4.map((item) => {
        if (item.period === '12month') {
          return {
            ...item,
            progressPercent: 100,
            result: item.result || 'ดำเนินการตามมาตรการครบถ้วนตลอดปีงบประมาณ บรรลุตามวัตถุประสงค์และตัวชี้วัดที่กำหนด'
          };
        }
        return item;
      });
      return {
        ...prev,
        bs4: updated
      };
    });
    setCascadeSuccessMsg('⚡ ปรับความคืบหน้ารอบ 12 เดือนเป็น 100% ครบทุกรายการเรียบร้อยแล้ว!');
    setTimeout(() => setCascadeSuccessMsg(''), 4000);
  };

  // Auto fill problem and solution for current filtered view (supports Gemini AI or local rule-based)
  const handleAutoFillProblemsSolutions = async () => {
    if (!setRiskManagement) return;
    const targetPeriod = bs4Period || '6month';
    const periodName = targetPeriod === '12month' ? '12 เดือน' : targetPeriod === '3month' ? '3 เดือน' : '6 เดือน';
    const currentBs4 = riskManagement?.bs4 || bs4List;
    const itemsToFill = currentBs4.filter(
      (item) => (item.period || '6month') === targetPeriod && (!item.problemSolution || item.problemSolution.trim() === '' || item.problemSolution.trim() === '-')
    );

    if (itemsToFill.length === 0) {
      setCascadeSuccessMsg(`ℹ️ ข้อมูลรอบ ${periodName} มีข้อความปัญหาและแนวทางแก้ไขครบถ้วนแล้วทุกรายการ`);
      setTimeout(() => setCascadeSuccessMsg(''), 4000);
      return;
    }

    if (geminiReady) {
      setIsBatchAiAnalyzing(true);
      setCascadeSuccessMsg(`🤖 Google Gemini AI กำลังวิเคราะห์ปัญหาและแนวทางแก้ไข (${itemsToFill.length} รายการ)...`);
      try {
        const filledMap = {};
        for (const item of itemsToFill) {
          try {
            const sol = await analyzeProblemAndSolutionWithAI({
              riskCode: item.riskCode,
              department: item.department || userDept || '',
              activity: item.activity,
              measures: item.measures,
              progressPercent: item.progressPercent ?? 80,
              period: targetPeriod,
              result: item.result
            });
            filledMap[item.id] = sol;
          } catch (e) {
            filledMap[item.id] = getSmartProblemSolution(item.riskCode, item.activity, targetPeriod);
          }
        }

        setRiskManagement((prev) => {
          const bs4Arr = prev?.bs4 || bs4List;
          const updated = bs4Arr.map((item) => {
            if (filledMap[item.id]) {
              return { ...item, problemSolution: filledMap[item.id] };
            }
            return item;
          });
          return { ...prev, bs4: updated };
        });

        setCascadeSuccessMsg(`✨ Google Gemini AI วิเคราะห์และเติมปัญหา/แนวทางแก้ไขรอบ ${periodName} ครบ ${itemsToFill.length} รายการเรียบร้อยแล้ว!`);
      } catch (err) {
        console.error('Batch AI error:', err);
      } finally {
        setIsBatchAiAnalyzing(false);
        setTimeout(() => setCascadeSuccessMsg(''), 5000);
      }
    } else {
      // Offline fallback: instantaneous rule-based fill
      setRiskManagement((prev) => {
        const bs4Arr = prev?.bs4 || bs4List;
        const updated = bs4Arr.map((item) => {
          if ((item.period || '6month') === targetPeriod) {
            if (!item.problemSolution || item.problemSolution.trim() === '' || item.problemSolution.trim() === '-') {
              return {
                ...item,
                problemSolution: getSmartProblemSolution(item.riskCode, item.activity, targetPeriod)
              };
            }
          }
          return item;
        });
        return {
          ...prev,
          bs4: updated
        };
      });
      setCascadeSuccessMsg(`✨ เติมข้อความวิเคราะห์ปัญหาอุปสรรคและแนวทางแก้ไขสำหรับรอบ ${periodName} อัตโนมัติเรียบร้อยแล้ว!`);
      setTimeout(() => setCascadeSuccessMsg(''), 5000);
    }
  };


  // Save Edit BS.5 Row
  const handleSaveEditBs5 = (e) => {
    e.preventDefault();
    if (!editingBs5) return;
    const preScore = Number(editingBs5.preLikelihood) * Number(editingBs5.preImpact);
    const postScore = Number(editingBs5.postLikelihood) * Number(editingBs5.postImpact);
    const change = postScore < preScore ? 'ลดลง' : 'ไม่ลดลง';
    const updated = {
      ...editingBs5,
      preScore,
      postScore,
      riskChange: change
    };
    if (setRiskManagement) {
      setRiskManagement((prev) => ({
        ...prev,
        bs5: {
          ...bs5Data,
          items: (bs5Data.items || []).map((item) => (item.id === editingBs5.id ? updated : item))
        }
      }));
    }
    setEditingBs5(null);
  };

  // Save BS.5 Summary
  const handleSaveBs5Summary = (e) => {
    e.preventDefault();
    if (setRiskManagement) {
      setRiskManagement((prev) => ({
        ...prev,
        bs5: {
          ...bs5Data,
          summary: e.target.summary.value,
          approvedBy: e.target.approvedBy.value,
          approverPosition: e.target.approverPosition.value,
          reportDate: e.target.reportDate.value
        }
      }));
    }
    setEditingBs5Summary(false);
  };

  // Department submission to Internal Audit
  const handleSendToAudit = (deptToSend, notesText = '') => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const submitter = currentSession?.displayName || currentSession?.username || deptToSend;

    const newSubRecord = {
      status: 'submitted',
      submittedAt: dateStr,
      submittedBy: submitter,
      notes: notesText.trim(),
      reviewStatus: 'pending',
      reviewedAt: '',
      reviewedBy: '',
      reviewOpinion: ''
    };

    if (setRiskManagement) {
      setRiskManagement((prev) => ({
        ...prev,
        submissions: {
          ...(prev?.submissions || {}),
          [deptToSend]: newSubRecord
        }
      }));
    }

    if (isSupabaseConfigured()) {
      const filterFn = (i) => i && i.department === deptToSend;
      const bs5Items = Array.isArray(riskManagement?.bs5)
        ? riskManagement.bs5
        : Array.isArray(riskManagement?.bs5?.items)
        ? riskManagement.bs5.items
        : [];

      const deptPayload = {
        bs1: (riskManagement?.bs1 || []).filter(filterFn),
        bs2: (riskManagement?.bs2 || []).filter(filterFn),
        bs3: (riskManagement?.bs3 || []).filter(filterFn),
        bs4: (riskManagement?.bs4 || []).filter(filterFn),
        bs5: bs5Items.filter(filterFn),
        bs5Summary: riskManagement?.bs5Summary || {},
        submissions: {
          [deptToSend]: newSubRecord
        }
      };

      cloudSyncService.pushDeptRiskManagement(selectedYear, deptToSend, deptPayload).catch((e) => console.warn('Send cloud push notice:', e));
    }

    setCascadeSuccessMsg(`ส่งแบบ บส.1 - บส.5 ของ "${deptToSend}" ให้หน่วยตรวจสอบภายในเรียบร้อยแล้ว`);
    setShowSubmitModal(false);
    setSubmitNotes('');
  };

  // Recall submission to draft
  const handleRecallSubmission = (deptToRecall) => {
    openConfirmModal({
      title: 'ยืนยันการดึงรายงานกลับมาแก้ไข',
      message: `ท่านต้องการดึงรายงานแบบ บส.1 - บส.5 ของ "${deptToRecall}" กลับมาแก้ไขใช่หรือไม่? (สถานะจะเปลี่ยนเป็นฉบับร่างเพื่อให้ปรับปรุงข้อมูลได้)`,
      type: 'warning',
      confirmText: 'ดึงกลับมาแก้ไข',
      onConfirm: () => {
        const recalledSub = {
          ...(riskManagement?.submissions?.[deptToRecall] || {}),
          status: 'draft',
          reviewStatus: 'pending'
        };

        if (setRiskManagement) {
          setRiskManagement((prev) => ({
            ...prev,
            submissions: {
              ...(prev?.submissions || {}),
              [deptToRecall]: recalledSub
            }
          }));
        }

        if (isSupabaseConfigured()) {
          const filterFn = (i) => i && i.department === deptToRecall;
          const bs5Items = Array.isArray(riskManagement?.bs5)
            ? riskManagement.bs5
            : Array.isArray(riskManagement?.bs5?.items)
            ? riskManagement.bs5.items
            : [];

          const deptPayload = {
            bs1: (riskManagement?.bs1 || []).filter(filterFn),
            bs2: (riskManagement?.bs2 || []).filter(filterFn),
            bs3: (riskManagement?.bs3 || []).filter(filterFn),
            bs4: (riskManagement?.bs4 || []).filter(filterFn),
            bs5: bs5Items.filter(filterFn),
            bs5Summary: riskManagement?.bs5Summary || {},
            submissions: {
              [deptToRecall]: recalledSub
            }
          };

          cloudSyncService.pushDeptRiskManagement(selectedYear, deptToRecall, deptPayload).catch((e) => console.warn('Recall cloud push notice:', e));
        }

        setCascadeSuccessMsg(`ดึงรายงานแบบ บส. ของ "${deptToRecall}" กลับมาเป็นฉบับร่างแล้ว สามารถปรับปรุงและกดส่งใหม่ได้`);
      }
    });
  };

  // Internal Audit review action
  const handleSaveAuditReview = (deptToReview, opinionText = '', customDate = '') => {
    const finalDate = (customDate || reviewDate || '').trim();
    if (!finalDate) {
      alert('กรุณาระบุหรือเลือกวันที่สอบทาน');
      return;
    }
    const auditorName = currentSession?.displayName || orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน';

    const newReviewedRecord = {
      ...(riskManagement?.submissions?.[deptToReview] || {}),
      status: 'reviewed',
      reviewStatus: 'reviewed',
      reviewedAt: finalDate,
      reviewedBy: auditorName,
      reviewOpinion: opinionText.trim()
    };

    if (setRiskManagement) {
      setRiskManagement((prev) => ({
        ...prev,
        submissions: {
          ...(prev?.submissions || {}),
          [deptToReview]: newReviewedRecord
        }
      }));
    }

    // Direct push to Cloud if Supabase is active
    if (isSupabaseConfigured()) {
      const filterFn = (i) => i && i.department === deptToReview;
      const bs5Items = Array.isArray(riskManagement?.bs5)
        ? riskManagement.bs5
        : Array.isArray(riskManagement?.bs5?.items)
        ? riskManagement.bs5.items
        : [];

      const deptPayload = {
        bs1: (riskManagement?.bs1 || []).filter(filterFn),
        bs2: (riskManagement?.bs2 || []).filter(filterFn),
        bs3: (riskManagement?.bs3 || []).filter(filterFn),
        bs4: (riskManagement?.bs4 || []).filter(filterFn),
        bs5: bs5Items.filter(filterFn),
        bs5Summary: riskManagement?.bs5Summary || {},
        submissions: {
          [deptToReview]: newReviewedRecord
        }
      };

      cloudSyncService.pushDeptRiskManagement(selectedYear, deptToReview, deptPayload)
        .then((ok) => {
          if (ok) console.log(`☁️ [Cloud Sync] Review saved for ${deptToReview}`);
        })
        .catch((e) => console.warn('Review cloud push notice:', e));
    }

    setCascadeSuccessMsg(`บันทึกผลการสอบทานแบบ บส. ของ "${deptToReview}" เรียบร้อยแล้ว (ซิงค์ Cloud ทันที)`);
    setShowReviewModal(false);
    setShowCalendarPopup(false);
    setReviewOpinion('');
    setReviewDate('');
  };

  // Export Risk Data (JSON) for Cross-Machine Transfer / Backup
  const handleExportBsData = (targetDept = null) => {
    const isSingle = Boolean(targetDept && targetDept !== 'all');
    const deptFilterName = isSingle ? targetDept : (filterDept !== 'all' ? filterDept : null);
    const filterFn = (item) => (!deptFilterName ? true : item.department === deptFilterName);

    const exportPayload = {
      app: 'IA-OS Fangkham',
      version: '2.0',
      type: 'risk-management-bs',
      exportedAt: new Date().toISOString(),
      fiscalYear: selectedYear,
      exportedBy: currentSession?.displayName || currentSession?.username || 'user',
      department: deptFilterName || 'all',
      data: {
        bs1: (riskManagement?.bs1 || []).filter(filterFn),
        bs2: (riskManagement?.bs2 || []).filter(filterFn),
        bs3: (riskManagement?.bs3 || []).filter(filterFn),
        bs4: (riskManagement?.bs4 || []).filter(filterFn),
        bs5: (Array.isArray(riskManagement?.bs5) ? riskManagement.bs5 : (riskManagement?.bs5?.items || [])).filter(filterFn),
        bs5Summary: riskManagement?.bs5Summary || {},
        submissions: deptFilterName
          ? (riskManagement?.submissions?.[deptFilterName] ? { [deptFilterName]: riskManagement.submissions[deptFilterName] } : {})
          : (riskManagement?.submissions || {})
      }
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = (deptFilterName || 'ทุกส่วนราชการ').replace(/\s+/g, '_');
    link.download = `ข้อมูลแบบ_บส_${cleanName}_ปี${selectedYear}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCascadeSuccessMsg(`ส่งออกไฟล์ข้อมูล บส. ของ "${deptFilterName || 'ทุกส่วนราชการ'}" สำเร็จ! สามารถส่งไฟล์นี้ให้หน่วยตรวจสอบหรือเครื่องอื่นนำเข้าได้`);
  };

  // Import Risk Data (JSON) from another machine / department
  const handleImportBsFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || !parsed.data || (!Array.isArray(parsed.data.bs1) && !Array.isArray(parsed.data.bs2))) {
          alert('รูปแบบไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ JSON ที่ส่งออกจากระบบบริหารความเสี่ยง (แบบ บส.)');
          return;
        }

        const incomingBs1 = parsed.data.bs1 || [];
        const incomingBs2 = parsed.data.bs2 || [];
        const incomingBs3 = parsed.data.bs3 || [];
        const incomingBs4 = parsed.data.bs4 || [];
        const incomingBs5 = parsed.data.bs5 || [];
        const incomingSubmissions = parsed.data.submissions || {};

        if (setRiskManagement) {
          setRiskManagement((prev) => {
            const mergeList = (original = [], incoming = []) => {
              const map = new Map();
              original.forEach((item) => map.set(item.id, item));
              incoming.forEach((item) => map.set(item.id, item));
              return Array.from(map.values());
            };

            return {
              ...prev,
              bs1: mergeList(prev?.bs1 || [], incomingBs1),
              bs2: mergeList(prev?.bs2 || [], incomingBs2),
              bs3: mergeList(prev?.bs3 || [], incomingBs3),
              bs4: mergeList(prev?.bs4 || [], incomingBs4),
              bs5: mergeList(prev?.bs5 || [], incomingBs5),
              submissions: {
                ...(prev?.submissions || {}),
                ...incomingSubmissions
              }
            };
          });
        }

        const deptName = parsed.department === 'all' ? 'ทุกกอง' : parsed.department || 'ส่วนราชการ';
        setCascadeSuccessMsg(`นำเข้าข้อมูล บส. ของ "${deptName}" เรียบร้อยแล้ว! (${incomingBs1.length} รายการ บส.1) ข้อมูลถูกผสานเข้าสู่เครื่องนี้เรียบร้อย`);
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle Print Action (Standard A4 Landscape)
  const handlePrint = () => {
    setShowExportMenu(false);
    exportBsToPrint({
      activeTab,
      filteredBs1,
      filteredBs2,
      filteredBs3,
      filteredBs4,
      filteredBs5Items,
      bs5Data,
      bs4Period,
      orgProfile,
      selectedYear,
      isSubDivision,
      effectiveDept: isAdmin ? filterDept : userDept
    });
  };

  // Handle Download PDF (.pdf) - Direct file download without print dialog
  const handleDownloadPdf = async () => {
    setShowExportMenu(false);
    setCascadeSuccessMsg('กำลังสร้างและดาวน์โหลดไฟล์ PDF มาตรฐาน ว 3482 (A4 แนวนอน)...');
    try {
      await exportBsToPdf({
        activeTab,
        filteredBs1,
        filteredBs2,
        filteredBs3,
        filteredBs4,
        filteredBs5Items,
        bs5Data,
        bs4Period,
        orgProfile,
        selectedYear,
        isSubDivision,
        effectiveDept: isAdmin ? filterDept : userDept
      });
      setCascadeSuccessMsg('✓ ดาวน์โหลดไฟล์ PDF เรียบร้อยแล้ว (ฟอร์ม บส. ตามมาตรฐาน ไม่มีหัวท้ายระบบ)');
      setTimeout(() => setCascadeSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setCascadeSuccessMsg('เกิดข้อผิดพลาดในการดาวน์โหลด PDF: ' + (err.message || err));
    }
  };

  // Handle Download Word (.doc)
  const handleDownloadWord = () => {
    setShowExportMenu(false);
    setCascadeSuccessMsg('กำลังสร้างเอกสาร Word (.doc) มาตรฐาน บส. (A4 แนวนอน)...');
    exportBsToWord({
      activeTab,
      filteredBs1,
      filteredBs2,
      filteredBs3,
      filteredBs4,
      filteredBs5Items,
      bs5Data,
      bs4Period,
      orgProfile,
      selectedYear,
      isSubDivision,
      effectiveDept: isAdmin ? filterDept : userDept
    });
    setTimeout(() => {
      setCascadeSuccessMsg('✓ ดาวน์โหลดเอกสาร Word เรียบร้อยแล้ว (ตารางจัดรูปตามมาตรฐาน ไม่แตก)');
      setTimeout(() => setCascadeSuccessMsg(''), 4000);
    }, 800);
  };

  // Handle Download Excel (.xls)
  const handleDownloadExcel = () => {
    setShowExportMenu(false);
    exportBsToExcel({
      activeTab,
      filteredBs1,
      filteredBs2,
      filteredBs3,
      filteredBs4,
      filteredBs5Items,
      bs5Data,
      bs4Period,
      orgProfile,
      selectedYear,
      isSubDivision,
      effectiveDept: isAdmin ? filterDept : userDept
    });
  };

  const FORMS_METADATA = [
    {
      id: 'bs1',
      step: 1,
      num: '1',
      code: 'บส. 1',
      shortLabel: 'ขอบเขต',
      title: 'กำหนดขอบเขตความรับผิดชอบ',
      desc: 'ภารกิจยุทธศาสตร์ / โครงการ / วัตถุประสงค์ / ระบุความเสี่ยง',
      count: filteredBs1.length
    },
    {
      id: 'bs2',
      step: 2,
      num: '2',
      code: 'บส. 2',
      shortLabel: 'วิเคราะห์',
      title: 'วิเคราะห์โอกาส ผลกระทบ & ตอบสนอง',
      desc: 'ประเมิน 6 ด้าน / โอกาส x ผลกระทบ (1-25) / 8 วิธีตอบสนอง',
      count: filteredBs2.length
    },
    {
      id: 'bs3',
      step: 3,
      num: '3',
      code: 'บส. 3',
      shortLabel: 'แผนบริหาร',
      title: 'แผนการบริหารความเสี่ยง',
      desc: 'มาตรการจัดการ / ผู้รับผิดชอบ / ระยะเวลา / ตัวชี้วัด',
      count: filteredBs3.length
    },
    {
      id: 'bs4',
      step: 4,
      num: '4',
      code: 'บส. 4',
      shortLabel: 'ติดตามผล',
      title: 'ติดตามผลการบริหารความเสี่ยง',
      desc: 'ผลดำเนินการรอบ 6/12 ด. / ความคืบหน้า / ปัญหาอุปสรรค & แก้ไข',
      count: filteredBs4.length
    },
    {
      id: 'bs5',
      step: 5,
      num: '5',
      code: 'บส. 5',
      shortLabel: 'ทบทวนองค์กร',
      title: 'รายงานผล & ทบทวนระดับองค์กร',
      desc: 'สรุปภาพรวมสิ้นปี / ประเมินความเสี่ยงคงเหลือ / มาตรการปีถัดไป',
      count: filteredBs5Items.length
    },
  ];

  const currentFormIndex = Math.max(0, FORMS_METADATA.findIndex(f => f.id === activeTab));
  const currentFormMeta = FORMS_METADATA[currentFormIndex];

  return (
    <div className="space-y-6">
      {/* 1. Clean & Streamlined Header Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-7 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs no-print">
        <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
                <Building className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
                <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>มท 0805.2/ว 3482 • {isAdmin ? 'หน่วยตรวจสอบภายใน' : `ส่วนราชการ: ${userDept}`}</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>ปีงบประมาณ พ.ศ. {selectedYear}</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-full px-3 py-1 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>สอดคล้อง ว 3482 ({complianceAudit.score}%)</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              การบริหารจัดการความเสี่ยงองค์กร (แบบ บส.1 - บส.5)
            </h1>
          </div>
      </div>

      {/* Cascade / Action Toast Notification */}
      {cascadeSuccessMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-xs no-print">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{cascadeSuccessMsg}</span>
          </div>
          <button
            onClick={() => setCascadeSuccessMsg('')}
            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg text-emerald-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1.1 Department Submission Action & Status Card (For Regular Department Users) */}
      {!isAdmin && (
        <div className={`p-4 rounded-xl border shadow-xs no-print transition-all ${
          currentDeptSubmission.status === 'reviewed'
            ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border-blue-200 dark:border-blue-800'
            : currentDeptSubmission.status === 'submitted'
            ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                currentDeptSubmission.status === 'reviewed'
                  ? 'bg-blue-600 text-white'
                  : currentDeptSubmission.status === 'submitted'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
              }`}>
                {currentDeptSubmission.status === 'reviewed' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : currentDeptSubmission.status === 'submitted' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    สถานะการจัดทำและนำส่งแบบ บส.1 - บส.5 ({userDept})
                  </h3>
                  {currentDeptSubmission.status === 'reviewed' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                      <Check className="w-3 h-3 mr-1" /> ผ่านการสอบทานจากหน่วยตรวจสอบภายในแล้ว
                    </span>
                  ) : currentDeptSubmission.status === 'submitted' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                      <Clock className="w-3 h-3 mr-1" /> ส่งรายงานแล้ว (รอหน่วยตรวจสอบภายในสอบทาน)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                      อยู่ระหว่างจัดทำ (ฉบับร่าง)
                    </span>
                  )}
                </div>

                {currentDeptSubmission.status === 'submitted' && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>
                      ส่งเมื่อ: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentDeptSubmission.submittedAt}</span> โดย <span className="font-semibold text-slate-800 dark:text-slate-200">{currentDeptSubmission.submittedBy}</span>
                    </p>
                    {currentDeptSubmission.notes && (
                      <p className="text-emerald-700 dark:text-emerald-300 italic">
                        &ldquo;{currentDeptSubmission.notes}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {currentDeptSubmission.status === 'reviewed' && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p>
                      สอบทานเมื่อ: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentDeptSubmission.reviewedAt}</span> โดย <span className="font-semibold text-slate-800 dark:text-slate-200">{currentDeptSubmission.reviewedBy}</span>
                    </p>
                    {currentDeptSubmission.reviewOpinion && (
                      <div className="p-2.5 rounded-lg bg-blue-100/60 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800/60 text-xs">
                        <span className="font-bold">ความเห็น/ข้อเสนอแนะ:</span> {currentDeptSubmission.reviewOpinion}
                      </div>
                    )}
                  </div>
                )}

                {(!currentDeptSubmission.status || currentDeptSubmission.status === 'draft') && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    เมื่อจัดทำข้อมูลแบบ บส.1 ถึง บส.5 ครบถ้วนแล้ว สามารถกดปุ่มส่งรายงานให้หน่วยตรวจสอบภายในสอบทานความถูกต้องตามเกณฑ์ มท 0805.2/ว 3482
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleExportBsData(userDept)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="ส่งออกไฟล์ข้อมูล บส.1 - บส.5 ของกองนี้เป็น JSON เพื่อส่งให้หน่วยตรวจสอบภายใน"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>ส่งออกไฟล์ บส. กองนี้</span>
              </button>

              {isSupabaseConfigured() && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setCascadeSuccessMsg(`กำลังส่งและซิงค์ข้อมูลของ "${userDept}" ขึ้นสู่ Supabase Cloud...`);
                      const filterFn = (i) => i && i.department === userDept;
                      const bs5Items = Array.isArray(riskManagement?.bs5)
                        ? riskManagement.bs5
                        : Array.isArray(riskManagement?.bs5?.items)
                        ? riskManagement.bs5.items
                        : [];

                      const deptPayload = {
                        bs1: (riskManagement?.bs1 || []).filter(filterFn),
                        bs2: (riskManagement?.bs2 || []).filter(filterFn),
                        bs3: (riskManagement?.bs3 || []).filter(filterFn),
                        bs4: (riskManagement?.bs4 || []).filter(filterFn),
                        bs5: bs5Items.filter(filterFn),
                        bs5Summary: riskManagement?.bs5Summary || {},
                        submissions: riskManagement?.submissions?.[userDept]
                          ? { [userDept]: riskManagement.submissions[userDept] }
                          : { [userDept]: { status: 'submitted', submittedAt: new Date().toLocaleDateString('th-TH'), submittedBy: currentSession?.displayName || userDept } }
                      };

                      const ok = await cloudSyncService.pushDeptRiskManagement(selectedYear, userDept, deptPayload);
                      if (ok) {
                        setCascadeSuccessMsg(`✓ ซิงค์และส่งข้อมูลของ "${userDept}" ขึ้นสู่ Cloud สำเร็จเรียบร้อยแล้ว! ข้อมูลจะปรากฏบนหน้าจอหน่วยตรวจสอบทันที`);
                      } else {
                        setCascadeSuccessMsg(`❌ ไม่สามารถซิงค์ขึ้น Cloud ได้ กรุณาตรวจสอบอินเทอร์เน็ต`);
                      }
                      setTimeout(() => setCascadeSuccessMsg(''), 6000);
                    } catch (err) {
                      setCascadeSuccessMsg(`❌ ผิดพลาด: ${err.message}`);
                    }
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="ซิงค์ข้อมูลแบบ บส. ของกองนี้ขึ้นสู่ Supabase Cloud ทันที"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ซิงค์ขึ้น Cloud ทันที</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCrossMachineInfo(true)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="วิธีส่งข้อมูลข้ามเครื่อง / สำรองข้อมูล"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {(!currentDeptSubmission.status || currentDeptSubmission.status === 'draft') ? (
                <button
                  type="button"
                  onClick={() => {
                    setSubmitModalDept(userDept);
                    setSubmitNotes('');
                    setShowSubmitModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งให้หน่วยตรวจสอบภายใน</span>
                </button>
              ) : currentDeptSubmission.status === 'submitted' ? (
                <button
                  type="button"
                  onClick={() => handleRecallSubmission(userDept)}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  title="ดึงรายงานกลับมาเพื่อปรับปรุงแก้ไขก่อนการสอบทาน"
                >
                  <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>ดึงรายงานกลับมาแก้ไข</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 1.2 Auditor / Admin: Submission Tracker Board across all main departments */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden no-print">
          {/* Tracker Header Bar (Always visible, acts as compact summary and toggle) */}
          <div className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70 dark:bg-slate-850/70 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  กระดานติดตามการส่งแบบ บส.1 - บส.5 ของส่วนราชการ
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ส่งแล้ว {departmentsList.filter(d => submissions[d]?.status === 'submitted' || submissions[d]?.status === 'reviewed').length} / {departmentsList.length} กอง
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  สอบทานแล้ว {departmentsList.filter(d => submissions[d]?.status === 'reviewed').length} กอง
                </span>
              </div>
            </div>

            {/* Right: Data Management Dropdown + Expand/Collapse Button */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-semibold">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportBsFile}
                className="hidden"
              />

              {/* Data Management Dropdown */}
              <div className="relative dropdown-trigger-area">
                <button
                  type="button"
                  onClick={() => setShowDataMenu(!showDataMenu)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  title="จัดการไฟล์ JSON และการซิงค์ Cloud"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>จัดการข้อมูล JSON</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showDataMenu && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowDataMenu(false);
                        }}
                        className="w-full text-left flex items-center px-3.5 py-2 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-indigo-600 mr-2.5 shrink-0" />
                        <div>
                          <div className="font-bold">นำเข้าไฟล์ บส. จากกองอื่น</div>
                          <div className="text-[10px] text-slate-400">นำเข้าไฟล์ .json ที่ได้รับจากกอง</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleExportBsData(null);
                          setShowDataMenu(false);
                        }}
                        className="w-full text-left flex items-center px-3.5 py-2 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-blue-600 mr-2.5 shrink-0" />
                        <div>
                          <div className="font-bold">สำรองข้อมูลทั้งหมด (JSON)</div>
                          <div className="text-[10px] text-slate-400">บันทึกข้อมูลทุกกองเป็นไฟล์สำรอง</div>
                        </div>
                      </button>

                      {isSupabaseConfigured() && (
                        <button
                          type="button"
                          onClick={async () => {
                            setShowDataMenu(false);
                            try {
                              setCascadeSuccessMsg('กำลังเชื่อมต่อและดึงข้อมูลล่าสุดจาก Supabase Cloud...');
                              const cloudData = await cloudSyncService.pullAllRiskManagement();
                              if (cloudData && cloudData[selectedYear] && setRiskManagement) {
                                setRiskManagement((prev) => mergeRiskManagement(prev, cloudData[selectedYear]));
                                setCascadeSuccessMsg('✓ ซิงค์และผสานรวมข้อมูลล่าสุดจาก Supabase Cloud สำเร็จสมบูรณ์!');
                              } else {
                                setCascadeSuccessMsg('✓ ฐานข้อมูลในเครื่องของคุณเป็นข้อมูลล่าสุดตรงกับ Cloud เรียบร้อยแล้ว');
                              }
                              setTimeout(() => setCascadeSuccessMsg(''), 5000);
                            } catch (err) {
                              setCascadeSuccessMsg(`❌ ซิงค์ข้อมูลไม่สำเร็จ: ${err.message}`);
                            }
                          }}
                          className="w-full text-left flex items-center px-3.5 py-2 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                          <div>
                            <div className="font-bold">ซิงค์กับ Supabase Cloud</div>
                            <div className="text-[10px] text-slate-400">ดึงและอัปเดตข้อมูลล่าสุดจากเซิร์ฟเวอร์</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Expand/Collapse Tracker Board */}
              <button
                type="button"
                onClick={() => setShowTrackerBoard(!showTrackerBoard)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                  showTrackerBoard
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title={showTrackerBoard ? 'คลิกเพื่อย่อซ่อนกระดานติดตาม' : 'คลิกเพื่อขยายดูกระดานติดตามทั้ง 5 กอง'}
              >
                {showTrackerBoard ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ซ่อนกระดาน</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    <span>แสดงกระดาน (5 กอง)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Department Cards Grid (Collapsible) */}
          {showTrackerBoard && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {departmentsList.map((dept) => {
              const sub = submissions[dept] || { status: 'draft' };
              const deptRisksCount = bs1List.filter(b => b.department === dept).length;
              const isCurrentFilter = filterDept === dept;

              return (
                <div
                  key={dept}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    isCurrentFilter
                      ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1">
                          <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{dept}</span>
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          ความเสี่ยง {deptRisksCount} กิจกรรม
                        </span>
                      </div>
                      {sub.status === 'reviewed' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                          <ShieldCheck className="w-3 h-3 mr-0.5" /> สอบทานแล้ว
                        </span>
                      ) : sub.status === 'submitted' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 animate-pulse">
                          <Clock className="w-3 h-3 mr-0.5" /> ส่งแล้ว รอสอบทาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          ร่าง / ยังไม่ส่ง
                        </span>
                      )}
                    </div>

                    {sub.status === 'submitted' && (
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50 space-y-0.5">
                        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                          📅 {sub.submittedAt}
                        </p>
                        <p className="truncate text-slate-700 dark:text-slate-300">
                          โดย: {sub.submittedBy}
                        </p>
                        {sub.notes && (
                          <p className="italic text-slate-500 dark:text-slate-400 line-clamp-1" title={sub.notes}>
                            &ldquo;{sub.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {sub.status === 'reviewed' && (
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50 space-y-0.5">
                        <p className="font-semibold text-blue-800 dark:text-blue-300">
                          ✓ สอบทานเมื่อ: {sub.reviewedAt}
                        </p>
                        <p className="truncate text-slate-700 dark:text-slate-300">
                          โดย: {sub.reviewedBy}
                        </p>
                        {sub.reviewOpinion && (
                          <p className="italic text-slate-600 dark:text-slate-300 line-clamp-1" title={sub.reviewOpinion}>
                            ความเห็น: &ldquo;{sub.reviewOpinion}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons on card */}
                  <div className="pt-2 mt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => setFilterDept(dept)}
                      className={`text-[11px] font-bold px-2 py-1 rounded transition-colors flex items-center space-x-1 cursor-pointer ${
                        isCurrentFilter
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                      }`}
                      title="เลือกดูกรองข้อมูลของกองนี้"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isCurrentFilter ? 'กำลังดู' : 'ดูเอกสาร'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleExportBsData(dept)}
                        className="text-[11px] p-1.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                        title={`ส่งออกไฟล์ บส. ของ "${dept}" เป็น JSON`}
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      {sub.status === 'submitted' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewModalDept(dept);
                            setReviewOpinion(sub.reviewOpinion || 'เอกสารแบบ บส.1 - บส.5 จัดทำได้ครบถ้วน ถูกต้องตามหลักเกณฑ์ มท 0805.2/ว 3482 และมีการกำหนดมาตรการควบคุมความเสี่ยงอย่างเหมาะสม');
                            setReviewDate(sub.reviewedAt || '');
                            setShowReviewModal(true);
                          }}
                          className="text-[11px] font-bold px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
                          title="บันทึกผลการสอบทานและข้อเสนอแนะ"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>สอบทาน</span>
                        </button>
                      ) : sub.status === 'reviewed' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewModalDept(dept);
                            setReviewOpinion(sub.reviewOpinion || '');
                            setReviewDate(sub.reviewedAt || '');
                            setShowReviewModal(true);
                          }}
                          className="text-[11px] font-semibold px-2 py-1 rounded text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center space-x-1 cursor-pointer"
                          title="แก้ไขผลการสอบทาน"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>แก้ไขผล</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitModalDept(dept);
                            setSubmitNotes('จัดทำแบบ บส.1 - บส.5 เรียบร้อยแล้ว (หน่วยตรวจสอบบันทึกนำส่งแทนกอง)');
                            setShowSubmitModal(true);
                          }}
                          className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                          title="ส่งแทนกองนี้"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Form Guidelines (Collapsible Accordion) */}
      {showGuide && (
        <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 no-print">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {FORM_GUIDELINES[activeTab]?.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {FORM_GUIDELINES[activeTab]?.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs leading-relaxed">
            {FORM_GUIDELINES[activeTab]?.items.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                    ({item.num})
                  </span>
                  <span>{item.title}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-7 leading-relaxed text-[11px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Special Guideline Badges for BS.2 */}
          {activeTab === 'bs2' && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1 text-[11px]">
                  📌 ประเภทความเสี่ยง 6 ประเภท (ข้อ 8):
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside text-[10px]">
                  {RISK_CATEGORIES.map((c) => (
                    <li key={c.id}><strong>{c.label}:</strong> {c.desc}</li>
                  ))}
                </ul>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1 text-[11px]">
                  📌 วิธีการตอบสนองความเสี่ยง 8 วิธี (ข้อ 12):
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside text-[10px]">
                  {RISK_RESPONSES.map((r) => (
                    <li key={r.id}><strong>{r.label}:</strong> {r.desc}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Executive Form Command Hub (บส. 1 - 5 Navigation & Working Tools) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xs border border-stone-200/80 dark:border-stone-800 p-3 no-print">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Left: Hero Form Dropdown + Quick Stepper */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Hero Dropdown Selector */}
            <div className="relative dropdown-trigger-area">
              <button
                type="button"
                onClick={() => setShowFormSelectorMenu(!showFormSelectorMenu)}
                className="flex items-center space-x-3 bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 hover:from-amber-500/15 hover:to-amber-500/10 text-stone-900 dark:text-stone-100 px-3.5 py-2 rounded-xl shadow-2xs hover:shadow-xs transition-all font-bold cursor-pointer border border-amber-500/30 group"
                title="คลิกเพื่อเลือกแบบรายงาน บส. 1 - บส. 5"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 font-black text-sm shadow-inner group-hover:scale-105 transition-transform">
                  {currentFormMeta.num}
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 tracking-wide flex items-center space-x-1.5">
                    <span>แบบรายงานหลัก</span>
                    <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                    <span>ขั้นตอนที่ {currentFormMeta.step}/5</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black flex items-center space-x-2 text-stone-900 dark:text-stone-100">
                    <span>{currentFormMeta.code} {currentFormMeta.title}</span>
                    <span className="bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                      {currentFormMeta.count}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-500 dark:text-stone-400 transition-transform ml-1 group-hover:text-amber-700 dark:group-hover:text-amber-300 ${showFormSelectorMenu ? 'rotate-180' : ''}`} />
              </button>

              {showFormSelectorMenu && (
                <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-stone-500 dark:text-stone-400">
                    <span>เลือกแบบรายงานหลัก (บส. 1 - บส. 5)</span>
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 px-2 py-0.5 rounded-md font-semibold">ตามเกณฑ์ ว 3482</span>
                  </div>
                  <div className="space-y-1 mt-1.5">
                    {FORMS_METADATA.map((f) => {
                      const isSelected = activeTab === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(f.id);
                            setShowFormSelectorMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-3 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50/90 dark:bg-amber-950/40 text-stone-900 dark:text-stone-100 border border-amber-200/80 dark:border-amber-900/60 shadow-xs'
                              : 'hover:bg-stone-50 dark:hover:bg-stone-850/60 text-stone-700 dark:text-stone-300 border border-transparent'
                          }`}
                        >
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm shrink-0 shadow-xs ${
                            isSelected ? 'bg-amber-700 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                          }`}>
                            {f.num}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-black ${isSelected ? 'text-amber-800 dark:text-amber-300' : 'text-stone-800 dark:text-stone-200'}`}>
                                {f.code} {f.title}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                isSelected ? 'bg-amber-200/90 dark:bg-amber-900 text-amber-900 dark:text-amber-200' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                              }`}>
                                {f.count} รายการ
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">{f.desc}</p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Quick Stepper Pills (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center bg-stone-100/90 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200/80 dark:border-stone-700/60">
              <button
                type="button"
                onClick={() => {
                  const prevIdx = Math.max(0, currentFormIndex - 1);
                  setActiveTab(FORMS_METADATA[prevIdx].id);
                }}
                disabled={currentFormIndex === 0}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="ขั้นตอนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {FORMS_METADATA.map((f) => {
                const isCurrent = activeTab === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveTab(f.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isCurrent
                        ? 'bg-white dark:bg-stone-750 text-amber-800 dark:text-amber-300 shadow-xs border border-amber-300/60 dark:border-amber-700'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                    title={`${f.code} ${f.title} (${f.count} รายการ)`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isCurrent ? 'bg-amber-700 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}>{f.num}</span>
                    <span>{f.shortLabel}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                      isCurrent ? 'bg-amber-100 text-amber-850 dark:bg-amber-950 dark:text-amber-200' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                    }`}>{f.count}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  const nextIdx = Math.min(FORMS_METADATA.length - 1, currentFormIndex + 1);
                  setActiveTab(FORMS_METADATA[nextIdx].id);
                }}
                disabled={currentFormIndex === FORMS_METADATA.length - 1}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="ขั้นตอนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Toolbar: Admin Filter + AI Assistant + Cascade + Add New */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Admin Dept Selector (if admin) */}
            {isAdmin && (
              <div className="flex items-center space-x-1.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="bg-transparent text-xs font-bold text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">🏢 ทุกส่วนราชการ ({departmentsList.length})</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>📁 {dept}</option>
                  ))}
                </select>
              </div>
            )}

            {setRiskManagement && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSmartDept(isAdmin ? (filterDept !== 'all' ? filterDept : 'กองคลัง') : userDept);
                    setShowSmartAssistant(true);
                  }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                  title="ผู้ช่วยวิเคราะห์และจับคู่ความเสี่ยงมาตรฐานตาม ว 3482"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>ผู้ช่วยวิเคราะห์ (ว 3482)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCascadeConfirm(true)}
                  className="bg-stone-50 hover:bg-stone-100 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                  title="ซิงค์เชื่อมโยงข้อมูลจาก บส.1 ไปยัง บส.2, บส.3, บส.4, บส.5 อัตโนมัติ"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>ซิงค์ 1 ➜ 5 (Cascade)</span>
                </button>

                {activeTab === 'bs1' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormBs1({
                        department: isAdmin ? (filterDept !== 'all' ? filterDept : 'กองคลัง') : userDept,
                        riskCode: `RSK-0${bs1List.length + 1}`,
                        strategy: '',
                        activity: '',
                        budget: '',
                        objective: '',
                        kpi: '',
                        target: '',
                        riskEvent: '',
                        cause: '',
                        riskCategory: 'ด้านการดำเนินงาน (Operation Risks)'
                      });
                      setShowAddModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>+ กำหนดความเสี่ยงใหม่ (บส.1)</span>
                  </button>
                )}
              </>
            )}
            {/* Gemini AI Assistant Button */}
            <button
              type="button"
              onClick={() => setShowGeminiModal(true)}
              className={`border text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                geminiReady
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700'
              }`}
              title="ตั้งค่าเชื่อมต่อ Google Gemini Generative AI สำหรับงานวิเคราะห์ความเสี่ยง"
            >
              <Sparkles className={`w-3.5 h-3.5 ${geminiReady ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'}`} />
              <span className="hidden sm:inline">{geminiReady ? 'Gemini AI' : 'ตั้งค่า AI'}</span>
            </button>

            {/* Guidelines & Help Dropdown */}
            <div className="relative dropdown-trigger-area">
              <button
                type="button"
                onClick={() => {
                  setShowGuideMenu(!showGuideMenu);
                  setShowExportMenu(false);
                }}
                className="text-stone-700 dark:text-stone-200 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                title="คู่มือ ระเบียบ และคำอธิบายการจัดทำแบบรายงาน"
              >
                <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">คู่มือ & ระเบียบ</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {showGuideMenu && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <a
                    href="/docs/w3482-risk-forms.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowGuideMenu(false)}
                    className="flex items-center px-3.5 py-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-rose-500 mr-2.5 shrink-0" />
                    <div>
                      <div className="font-bold">หนังสือสั่งการ มท ว 3482</div>
                      <div className="text-[10px] text-stone-400">เปิดเอกสารทางการฉบับจริง (PDF)</div>
                    </div>
                  </a>

                  <a
                    href="/docs/meeting_minutes_risk_2569.docx"
                    download="รายงานการประชุมคณะกรรมการบริหารจัดการความเสี่ยง_ปี2569.docx"
                    onClick={() => setShowGuideMenu(false)}
                    className="flex items-center px-3.5 py-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border-t border-stone-100 dark:border-stone-800/60"
                  >
                    <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400 mr-2.5 shrink-0" />
                    <div>
                      <div className="font-bold">รายงานการประชุมปี 2569</div>
                      <div className="text-[10px] text-stone-400">ดาวน์โหลดเอกสาร Word (.docx)</div>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setShowGuide(!showGuide);
                      setShowGuideMenu(false);
                    }}
                    className="w-full text-left flex items-center px-3.5 py-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-amber-600 mr-2.5 shrink-0" />
                    <div>
                      <div className="font-bold">{showGuide ? 'ซ่อนคำอธิบายแบบ' : 'แสดงคำอธิบายแบบ'}</div>
                      <div className="text-[10px] text-stone-400">คำอธิบายจัดทำแบบ บส.1 - บส.5</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCrossMachineInfo(true);
                      setShowGuideMenu(false);
                    }}
                    className="w-full text-left flex items-center px-3.5 py-2 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-600 mr-2.5 shrink-0" />
                    <div>
                      <div className="font-bold">การเชื่อมข้อมูลข้ามเครื่อง</div>
                      <div className="text-[10px] text-stone-400">วิธีส่งออก/นำเข้าไฟล์และ Cloud</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="คลิกเพื่อดูผลตรวจความสอดคล้องตาม ว 3482 และเกณฑ์กระทรวงการคลัง"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>ผลตรวจ ว 3482 ({complianceAudit.score}%)</span>
              </button>

            {/* Official Download Action Toolbar */}
            <OfficialDocActionToolbar
              onWord={handleDownloadWord}
              onExcel={handleDownloadExcel}
              onPdf={handleDownloadPdf}
              wordTitle={`ส่งออกรายงาน ${currentFormMeta.code} (Word .doc)`}
              wordSubtitle={`แบบรายงาน ${currentFormMeta.code} ${currentFormMeta.title} A4 แนวนอนตามเกณฑ์ ว 3482`}
              excelTitle={`ส่งออกตาราง ${currentFormMeta.code} (Excel .xls)`}
              excelSubtitle={`ตารางข้อมูลการบริหารความเสี่ยง ${currentFormMeta.code} เพื่อการคำนวณ`}
              pdfTitle={`ดาวน์โหลดรายงาน ${currentFormMeta.code} (PDF)`}
              pdfSubtitle={`แบบรายงาน ${currentFormMeta.code} ทางการตามมาตรฐานกรมส่งเสริมการปกครองท้องถิ่น`}
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: แบบ บส. 1
      ========================================================================= */}
      {activeTab === 'bs1' && (
        <div className="space-y-4 printable-document">
          {/* Official Document Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1.5 print:p-2 print:border-none print:shadow-none print:rounded-none">
            <div className="flex justify-between items-start text-xs font-bold text-slate-500 mb-1 print:mb-2 print:text-black">
              <span className="no-print">ลำดับที่ 1 ของชุดแบบรายงาน</span>
              <span className="font-mono text-sm font-black text-slate-800 dark:text-slate-200 print:text-black print:text-sm ml-auto">แบบ บส. 1</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 print:text-black print:text-lg">
              {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 print:text-black print:text-sm">
              กำหนดขอบเขตความรับผิดชอบตามประเด็นยุทธศาสตร์/ข้อบัญญัติ/เทศบัญญัติ/อื่น ๆ (ถ้ามี)
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 print:text-black print:text-xs">
              ประจำปีงบประมาณ พ.ศ. <span className="font-mono font-bold text-slate-900 dark:text-slate-100 print:text-black">{selectedYear}</span>
            </p>
          </div>

          {/* Table BS 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400 border-collapse print:text-black">
                <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700/80 print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="px-2 py-2.5 w-20 text-center print:w-16 print:px-1 print:py-1">
                      (3)<br />รหัสความเสี่ยง
                    </th>
                    <th className="px-2.5 py-2.5 w-44 print:w-40 print:px-1.5 print:py-1">
                      (4)<br />ยุทธศาสตร์ที่รับผิดชอบ
                    </th>
                    <th className="px-3.5 py-2.5 min-w-[200px] print:min-w-0 print:px-2 print:py-1">
                      (5)<br />โครงการ/กิจกรรม/ภารกิจ อปท. ที่สำคัญ
                    </th>
                    <th className="px-2.5 py-2.5 w-28 text-right print:w-24 print:px-1.5 print:py-1">
                      (6)<br />งบประมาณ (บาท)
                    </th>
                    <th className="px-3.5 py-2.5 min-w-[180px] print:min-w-0 print:px-2 print:py-1">
                      (7)<br />วัตถุประสงค์
                    </th>
                    <th className="px-3 py-2.5 min-w-[160px] print:min-w-0 print:px-1.5 print:py-1">
                      (8)<br />ตัวชี้วัด
                    </th>
                    <th className="px-3 py-2.5 min-w-[150px] print:min-w-0 print:px-1.5 print:py-1">
                      (9)<br />เป้าหมาย
                    </th>
                    <th className="px-3 py-3.5 text-center w-28 no-print print:hidden">
                      ส่วนราชการ
                    </th>
                    {setRiskManagement && <th className="px-3 py-3.5 text-center w-20 no-print print:hidden">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBs1.length === 0 ? (
                    <tr>
                      <td colSpan={setRiskManagement ? 10 : 9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="max-w-md mx-auto flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl mb-3">
                            📋
                          </div>
                          <div className="font-semibold text-slate-700 dark:text-slate-200 text-base">
                            ยังไม่มีข้อมูลความเสี่ยง (แบบ บส. 1) ประจำปีงบประมาณ {selectedYear}
                            {filterDept !== 'all' ? ` ของ "${filterDept}"` : ''}
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">
                            ท่านสามารถเริ่มกำหนดความเสี่ยงใหม่, ใช้ระบบผู้ช่วยวิเคราะห์ ว 3482 หรือคัดลอกจากปี 2569 ได้
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {setRiskManagement && (
                              <button
                                type="button"
                                onClick={() => setShowAddModal(true)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <span>+</span> กำหนดความเสี่ยงใหม่ (บส.1)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowSmartAssistant(true)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                            >
                              <span>✨</span> ผู้ช่วยวิเคราะห์ (ว 3482)
                            </button>
                            {selectedYear !== '2569' && setRiskManagement && (
                              <button
                                type="button"
                                onClick={handleCopyFromPreviousYear}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1.5"
                              >
                                <span>📥</span> คัดลอกข้อมูลจากปี 2569
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBs1.map((item, idx) => {
                      const canManage = canEditItem(item.department);
                      return (
                        <tr key={item.id || idx} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-2 py-2 font-mono font-bold text-center text-blue-700 dark:text-blue-300 align-top print:text-black print:px-1 print:py-1">
                            {item.riskCode || `RSK-0${idx + 1}`}
                          </td>
                          <td className="px-2.5 py-2 text-slate-700 dark:text-slate-300 font-medium align-top print:text-black print:px-1.5 print:py-1">
                            {item.strategy}
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100 align-top print:text-black print:px-2 print:py-1">
                            {item.activity}
                          </td>
                          <td className="px-2.5 py-2 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 align-top print:text-black print:px-1.5 print:py-1">
                            {item.budget ? Number(item.budget).toLocaleString() : '-'}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 align-top print:text-black print:px-2 print:py-1">
                            {item.objective}
                          </td>
                          <td className="px-2.5 py-2 text-slate-600 dark:text-slate-300 align-top print:text-black print:px-1.5 print:py-1">
                            {item.kpi}
                          </td>
                          <td className="px-2.5 py-2 text-slate-600 dark:text-slate-300 align-top print:text-black print:px-1.5 print:py-1">
                            {item.target}
                          </td>
                          <td className="px-3 py-3 text-center align-top no-print print:hidden">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.department}
                            </span>
                          </td>
                          {setRiskManagement && (
                            <td className="px-3 py-3 text-center align-top no-print print:hidden">
                              {canManage ? (
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingBs1(item)}
                                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="แก้ไขข้อมูล"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBs1(item.id, item.riskCode, item.activity)}
                                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="ลบรายการ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400">ดูเท่านั้น</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signature Section */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800 flex flex-col items-end text-xs space-y-1.5 text-slate-700 dark:text-slate-300 print:bg-transparent print:border-none print:text-black print:pt-4 print-signature-block break-inside-avoid print:break-inside-avoid">
              <div className="w-80 sm:w-96 print:w-88 text-center space-y-1.5 print:text-[8.5pt] print:mr-6">
                <div className="whitespace-nowrap">(ลงชื่อ)...................................................</div>
                {isSubDivision ? (
                  <>
                    <div className="whitespace-nowrap">( .................................................... )</div>
                    <div className="whitespace-nowrap">ตำแหน่ง ....................................................</div>
                  </>
                ) : (
                  <>
                    <div className="whitespace-nowrap">( {orgProfile?.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น'} )</div>
                    <div className="whitespace-nowrap">ตำแหน่ง {orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                  </>
                )}
                <div className="whitespace-nowrap">วันที่..........เดือน........................พ.ศ. ............</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: แบบ บส. 2
      ========================================================================= */}
      {activeTab === 'bs2' && (
        <div className="space-y-4 printable-document">
          {/* Official Document Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1.5 print:p-2 print:border-none print:shadow-none print:rounded-none">
            <div className="flex justify-between items-start text-xs font-bold text-slate-500 mb-1 print:mb-2 print:text-black">
              <span className="no-print">ลำดับที่ 2 ของชุดแบบรายงาน</span>
              <span className="font-mono text-sm font-black text-slate-800 dark:text-slate-200 print:text-black print:text-sm ml-auto">แบบ บส. 2</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 print:text-black print:text-lg">
              {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 print:text-black print:text-sm">
              การวิเคราะห์โอกาส ผลกระทบ และการตอบสนองความเสี่ยง
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 print:text-black print:text-xs">
              ประจำปีงบประมาณ พ.ศ. <span className="font-mono font-bold text-slate-900 dark:text-slate-100 print:text-black">{selectedYear}</span>
            </p>
          </div>

          {/* Table BS 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400 border-collapse print:text-black">
                <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700/80 print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="px-3 py-3.5 w-24 text-center">
                      (3)<br />รหัสความเสี่ยง
                    </th>
                    <th className="px-4 py-3.5 min-w-[180px]">
                      (4)<br />โครงการ/กิจกรรม/ภารกิจ
                    </th>
                    <th className="px-4 py-3.5 min-w-[160px]">
                      (5)<br />วัตถุประสงค์
                    </th>
                    <th className="px-3.5 py-3.5 w-36">
                      (6)<br />ผู้รับผิดชอบ
                    </th>
                    <th className="px-4 py-3.5 min-w-[170px]">
                      (7)<br />ความเสี่ยง
                    </th>
                    <th className="px-3.5 py-3.5 min-w-[150px]">
                      (8)<br />ประเภทความเสี่ยง
                    </th>
                    <th className="px-2.5 py-3.5 text-center w-20">
                      (9)<br />คะแนนโอกาส
                    </th>
                    <th className="px-2.5 py-3.5 text-center w-20">
                      (10)<br />คะแนนผลกระทบ
                    </th>
                    <th className="px-3 py-3.5 text-center w-24">
                      (11)<br />ระดับความเสี่ยง<br /><span className="text-[10px] font-normal">(9) x (10)</span>
                    </th>
                    <th className="px-4 py-3.5 min-w-[170px]">
                      (12)<br />วิธีการตอบสนองความเสี่ยง
                    </th>
                    {setRiskManagement && <th className="px-3 py-3.5 text-center w-16 no-print print:hidden">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBs2.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-slate-400">
                        ไม่พบข้อมูลในแบบ บส. 2 {filterDept !== 'all' ? `ของ "${filterDept}"` : ''}
                      </td>
                    </tr>
                  ) : (
                    filteredBs2.map((item, idx) => {
                      const canManage = canEditItem(item.department);
                      return (
                        <tr key={item.id || idx} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-2 py-2 font-mono font-bold text-center text-blue-700 dark:text-blue-300 align-top print:text-black print:px-1 print:py-1">
                            {item.riskCode}
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100 align-top print:text-black print:px-1.5 print:py-1">
                            {item.activity}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 align-top print:text-black print:px-1.5 print:py-1">
                            {item.objective}
                          </td>
                          <td className="px-2.5 py-2 text-slate-700 dark:text-slate-300 align-top print:text-black print:px-1 print:py-1">
                            {item.responsiblePerson}
                          </td>
                          <td className="px-3 py-2 text-rose-700 dark:text-rose-300 font-semibold align-top print:text-black print:px-1.5 print:py-1">
                            {item.riskEvent}
                          </td>
                          <td className="px-2.5 py-2 text-slate-700 dark:text-slate-300 align-top text-[11px] print:text-black print:px-1 print:py-1">
                            {item.riskCategory}
                          </td>
                          <td className="px-2 py-2 text-center font-mono font-bold align-top print:text-black print:px-1 print:py-1">
                            {item.likelihood}
                          </td>
                          <td className="px-2 py-2 text-center font-mono font-bold align-top print:text-black print:px-1 print:py-1">
                            {item.impact}
                          </td>
                          <td className="px-2.5 py-2 text-center align-top print:text-black print:px-1 print:py-1">
                            <div className="font-mono font-black text-slate-900 dark:text-slate-100 print:text-black">{item.riskScore}</div>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-block mt-0.5 print:border print:border-black ${getRiskLevelBadge(item.riskLevel)}`}>
                              {item.riskLevel}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-indigo-700 dark:text-indigo-300 font-medium align-top print:text-black print:px-1.5 print:py-1">
                            {item.riskResponse}
                          </td>
                          {setRiskManagement && (
                            <td className="px-3 py-3 text-center align-top no-print print:hidden">
                              {canManage ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingBs2(item)}
                                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="แก้ไขการประเมิน"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">ดูเท่านั้น</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signature Section */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800 flex flex-col items-end text-xs space-y-1.5 text-slate-700 dark:text-slate-300 print:bg-transparent print:border-none print:text-black print:pt-4 print-signature-block break-inside-avoid print:break-inside-avoid">
              <div className="w-80 sm:w-96 print:w-88 text-center space-y-1.5 print:text-[8.5pt] print:mr-6">
                <div className="whitespace-nowrap">(ลงชื่อ)...................................................</div>
                {isSubDivision ? (
                  <>
                    <div className="whitespace-nowrap">( .................................................... )</div>
                    <div className="whitespace-nowrap">ตำแหน่ง ....................................................</div>
                  </>
                ) : (
                  <>
                    <div className="whitespace-nowrap">( {orgProfile?.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น'} )</div>
                    <div className="whitespace-nowrap">ตำแหน่ง {orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                  </>
                )}
                <div className="whitespace-nowrap">วันที่..........เดือน........................พ.ศ. ............</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: แบบ บส. 3
      ========================================================================= */}
      {activeTab === 'bs3' && (
        <div className="space-y-4 printable-document">
          {/* Official Document Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1.5 print:p-2 print:border-none print:shadow-none print:rounded-none">
            <div className="flex justify-between items-start text-xs font-bold text-slate-500 mb-1 print:mb-2 print:text-black">
              <span className="no-print">ลำดับที่ 3 ของชุดแบบรายงาน</span>
              <span className="font-mono text-sm font-black text-slate-800 dark:text-slate-200 print:text-black print:text-sm ml-auto">แบบ บส. 3</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 print:text-black print:text-lg">
              {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 print:text-black print:text-sm">
              รายงานการจัดทำแผนบริหารความเสี่ยง
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 print:text-black print:text-xs">
              ประจำปีงบประมาณ พ.ศ. <span className="font-mono font-bold text-slate-900 dark:text-slate-100 print:text-black">{selectedYear}</span>
            </p>
          </div>

          {/* Table BS 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400 border-collapse print:text-black">
                <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700/80 print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="px-3 py-3.5 w-24 text-center">
                      (3)<br />รหัสความเสี่ยง
                    </th>
                    <th className="px-4 py-3.5 min-w-[180px]">
                      (4)<br />โครงการ/กิจกรรม/ภารกิจ
                    </th>
                    <th className="px-4 py-3.5 min-w-[160px]">
                      (5)<br />ความเสี่ยง
                    </th>
                    <th className="px-3.5 py-3.5 min-w-[140px]">
                      (6)<br />วิธีการตอบสนองความเสี่ยง
                    </th>
                    <th className="px-3.5 py-3.5 w-36">
                      (7)<br />ผู้รับผิดชอบ
                    </th>
                    <th className="px-4 py-3.5 min-w-[220px]">
                      (8)<br />วิธีการจัดการความเสี่ยง (มาตรการ)
                    </th>
                    <th className="px-3.5 py-3.5 min-w-[140px]">
                      (9)<br />ตัวชี้วัด
                    </th>
                    <th className="px-3 py-3.5 w-32">
                      (10)<br />ระยะเวลาดำเนินการ
                    </th>
                    <th className="px-3.5 py-3.5 min-w-[160px]">
                      (11)<br />วิธีการติดตาม และการรายงาน
                    </th>
                    {setRiskManagement && <th className="px-3 py-3.5 text-center w-16 no-print print:hidden">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBs3.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                        ไม่พบข้อมูลในแบบ บส. 3 {filterDept !== 'all' ? `ของ "${filterDept}"` : ''}
                      </td>
                    </tr>
                  ) : (
                    filteredBs3.map((item, idx) => {
                      const canManage = canEditItem(item.department);
                      return (
                        <tr key={item.id || idx} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-2 py-2 font-mono font-bold text-center text-blue-700 dark:text-blue-300 align-top print:text-black print:px-1 print:py-1">
                            {item.riskCode}
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100 align-top print:text-black print:px-1.5 print:py-1">
                            {item.activity}
                          </td>
                          <td className="px-3 py-2 text-rose-700 dark:text-rose-300 font-semibold align-top print:text-black print:px-1.5 print:py-1">
                            {item.riskEvent}
                          </td>
                          <td className="px-2.5 py-2 text-indigo-700 dark:text-indigo-300 font-medium align-top print:text-black print:px-1 print:py-1">
                            {item.riskResponse}
                          </td>
                          <td className="px-2.5 py-2 text-slate-700 dark:text-slate-300 align-top print:text-black print:px-1 print:py-1">
                            {item.responsiblePerson}
                          </td>
                          <td className="px-3.5 py-2 text-slate-700 dark:text-slate-300 leading-relaxed align-top print:text-black print:px-2 print:py-1">
                            {item.measures}
                          </td>
                          <td className="px-2.5 py-2 text-slate-600 dark:text-slate-300 align-top print:text-black print:px-1 print:py-1">
                            {item.kpi}
                          </td>
                          <td className="px-2.5 py-2 text-slate-700 dark:text-slate-300 align-top font-medium print:text-black print:px-1 print:py-1">
                            {item.timeline}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 align-top print:text-black print:px-1.5 print:py-1">
                            {item.monitoringMethod}
                          </td>
                          {setRiskManagement && (
                            <td className="px-3 py-3 text-center align-top no-print print:hidden">
                              {canManage ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingBs3(item)}
                                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="แก้ไขแผน บส.3"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">ดูเท่านั้น</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signature Section */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800 flex flex-col items-end text-xs space-y-1.5 text-slate-700 dark:text-slate-300 print:bg-transparent print:border-none print:text-black print:pt-4 print-signature-block break-inside-avoid print:break-inside-avoid">
              <div className="w-80 sm:w-96 print:w-88 text-center space-y-1.5 print:text-[8.5pt] print:mr-6">
                <div className="whitespace-nowrap">(ลงชื่อ)...................................................</div>
                {isSubDivision ? (
                  <>
                    <div className="whitespace-nowrap">( .................................................... )</div>
                    <div className="whitespace-nowrap">ตำแหน่ง ....................................................</div>
                  </>
                ) : (
                  <>
                    <div className="whitespace-nowrap">( {orgProfile?.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น'} )</div>
                    <div className="whitespace-nowrap">ตำแหน่ง {orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                  </>
                )}
                <div className="whitespace-nowrap">วันที่..........เดือน........................พ.ศ. ............</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: แบบ บส. 4
      ========================================================================= */}
      {activeTab === 'bs4' && (
        <div className="space-y-4 printable-document">
          {/* Official Document Header with Period Selectors */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-3 print:p-2 print:border-none print:shadow-none print:rounded-none">
            <div className="flex justify-between items-start text-xs font-bold text-slate-500 mb-1 print:mb-2 print:text-black">
              <span className="no-print">ลำดับที่ 4 ของชุดแบบรายงาน</span>
              <span className="font-mono text-sm font-black text-slate-800 dark:text-slate-200 print:text-black print:text-sm ml-auto">แบบ บส. 4</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 print:text-black print:text-lg">
              {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
            </h3>
            
            <div className="flex flex-col items-center justify-center gap-3 text-xs font-bold text-slate-800 dark:text-slate-200 print:text-black print:text-sm">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span>รายงานการติดตามผลการบริหารความเสี่ยง <span className="hidden print:inline">({bs4Period === '3month' ? 'รอบ 3 เดือน' : bs4Period === '6month' ? 'รอบ 6 เดือน' : 'รอบ 12 เดือน'})</span></span>
                <span className="no-print text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-normal">
                  กำลังแสดง: {filteredBs4.length} รายการ
                </span>
              </div>

              <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 no-print">
                <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bs4_period"
                    value="3month"
                    checked={bs4Period === '3month'}
                    onChange={() => setBs4Period('3month')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>รอบ 3 เดือน ({bs4List.filter(b => b.period === '3month').length})</span>
                </label>
                <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bs4_period"
                    value="6month"
                    checked={bs4Period === '6month'}
                    onChange={() => setBs4Period('6month')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>รอบ 6 เดือน ({bs4List.filter(b => (b.period || '6month') === '6month').length})</span>
                </label>
                <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bs4_period"
                    value="12month"
                    checked={bs4Period === '12month'}
                    onChange={() => setBs4Period('12month')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>รอบ 12 เดือน ({bs4List.filter(b => b.period === '12month').length})</span>
                </label>
              </div>

              {/* Quick Action Tools for Period */}
              {setRiskManagement && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 no-print w-full max-w-2xl">
                  <span className="text-[11px] font-bold text-slate-500">เครื่องมือจัดการรอบ:</span>
                  {bs4Period === '12month' && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopy6MonthTo12Month}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="คัดลอกข้อมูลและผลการดำเนินงานจากรอบ 6 เดือนมาตั้งต้นในรอบ 12 เดือน"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        คัดลอกผลจากรอบ 6 เดือนสู่รอบ 12 เดือน
                      </button>
                      <button
                        type="button"
                        onClick={handleSetAll12mTo100Percent}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="ปรับความคืบหน้ารอบ 12 เดือนให้เป็น 100% (สิ้นสุดปีงบประมาณ)"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ปรับความคืบหน้ารอบ 12 เดือนเป็น 100% ทั้งหมด
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={isBatchAiAnalyzing}
                    onClick={handleAutoFillProblemsSolutions}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      geminiReady
                        ? 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                        : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    }`}
                    title={geminiReady ? "ให้ Google Gemini AI วิเคราะห์และเติมปัญหา/แนวทางแก้ไขในช่องที่ว่างอัตโนมัติ" : "เติมปัญหาอุปสรรคและแนวทางแก้ไขในข้อที่ยังว่างอัตโนมัติ"}
                  >
                    {isBatchAiAnalyzing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isBatchAiAnalyzing ? 'AI กำลังวิเคราะห์...' : (geminiReady ? '✨ AI เติมปัญหา/แนวทางแก้ไขในช่องว่าง' : '✨ เติมปัญหา/แนวทางแก้ไขอัตโนมัติในช่องที่ว่าง')}</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 print:text-black print:text-xs">
              สำหรับปีงบประมาณ พ.ศ. <span className="font-mono font-bold text-slate-900 dark:text-slate-100 print:text-black">{selectedYear}</span>
            </p>
          </div>

          {/* Table BS 4 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400 border-collapse print:text-black">
                <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700/80 print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="px-3 py-3.5 w-24 text-center">
                      (3)<br />รหัสความเสี่ยง
                    </th>
                    <th className="px-4 py-3.5 min-w-[170px]">
                      (4)<br />โครงการ/กิจกรรม/ภารกิจ
                    </th>
                    <th className="px-4 py-3.5 min-w-[200px]">
                      (5)<br />วิธีการจัดการความเสี่ยง
                    </th>
                    <th className="px-3 py-3.5 w-32">
                      (6)<br />ระยะเวลาดำเนินการ
                    </th>
                    <th className="px-3.5 py-3.5 w-36">
                      (7)<br />ผู้รับผิดชอบ
                    </th>
                    <th className="px-4 py-3.5 min-w-[220px]">
                      (8)<br />ผลลัพธ์การดำเนินการจัดการความเสี่ยง
                    </th>
                    <th className="px-3.5 py-3.5 min-w-[150px]">
                      (9)<br />เอกสาร/หลักฐาน
                    </th>
                    <th className="px-2.5 py-3.5 text-center w-24">
                      (10)<br />ร้อยละความคืบหน้า
                    </th>
                    <th className="px-4 py-3.5 min-w-[180px]">
                      (11)<br />ปัญหาอุปสรรค และแนวทางแก้ไข
                    </th>
                    {setRiskManagement && <th className="px-3 py-3.5 text-center w-16 no-print print:hidden">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBs4.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                        ไม่พบข้อมูลในแบบ บส. 4 สำหรับรอบ {bs4Period === '3month' ? '3 เดือน' : bs4Period === '6month' ? '6 เดือน' : '12 เดือน'} {filterDept !== 'all' ? `ของ "${filterDept}"` : ''}
                      </td>
                    </tr>
                  ) : (
                    filteredBs4.map((item, idx) => {
                      const canManage = canEditItem(item.department);
                      return (
                        <tr key={item.id || idx} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-3 py-3 font-mono font-bold text-center text-blue-700 dark:text-blue-300 align-top">
                            {item.riskCode}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 align-top">
                            {item.activity}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 leading-relaxed align-top">
                            {item.measures}
                          </td>
                          <td className="px-3 py-3 text-slate-700 dark:text-slate-300 align-top">
                            {item.timeline}
                          </td>
                          <td className="px-3.5 py-3 text-slate-700 dark:text-slate-300 align-top">
                            {item.responsiblePerson}
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200 leading-relaxed align-top">
                            {item.result}
                          </td>
                          <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300 align-top text-[11px]">
                            {item.evidence}
                          </td>
                          <td className="px-2.5 py-3 text-center align-top font-mono font-bold">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                              {item.progressPercent}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 align-top">
                            {item.problemSolution || '-'}
                          </td>
                          {setRiskManagement && (
                            <td className="px-3 py-3 text-center align-top no-print print:hidden">
                              {canManage ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingBs4(item)}
                                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="แก้ไขรายงาน บส.4"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">ดูเท่านั้น</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signature Section */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800 flex flex-col items-end text-xs space-y-1.5 text-slate-700 dark:text-slate-300 print:bg-transparent print:border-none print:text-black print:pt-4 print-signature-block break-inside-avoid print:break-inside-avoid">
              <div className="w-80 sm:w-96 print:w-88 text-center space-y-1.5 print:text-[8.5pt] print:mr-6">
                <div className="whitespace-nowrap">(ลงชื่อ)...................................................</div>
                {isSubDivision ? (
                  <>
                    <div className="whitespace-nowrap">( .................................................... )</div>
                    <div className="whitespace-nowrap">ตำแหน่ง ....................................................</div>
                  </>
                ) : (
                  <>
                    <div className="whitespace-nowrap">( {orgProfile?.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น'} )</div>
                    <div className="whitespace-nowrap">ตำแหน่ง {orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                  </>
                )}
                <div className="whitespace-nowrap">วันที่..........เดือน........................พ.ศ. ............</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: แบบ บส. 5
      ========================================================================= */}
      {activeTab === 'bs5' && (
        <div className="space-y-4 printable-document">
          {/* Official Document Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1.5 print:p-2 print:border-none print:shadow-none print:rounded-none">
            <div className="flex justify-between items-start text-xs font-bold text-slate-500 mb-1 print:mb-2 print:text-black">
              <span className="no-print">ลำดับที่ 5 ของชุดแบบรายงาน</span>
              <span className="font-mono text-sm font-black text-slate-800 dark:text-slate-200 print:text-black print:text-sm ml-auto">แบบ บส. 5</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 print:text-black print:text-lg">
              {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 print:text-black print:text-sm">
              รายงานผลการดำเนินการและทบทวนแผนการบริหารความเสี่ยง
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 print:text-black print:text-xs">
              สำหรับปีงบประมาณ พ.ศ. <span className="font-mono font-bold text-slate-900 dark:text-slate-100 print:text-black">{selectedYear}</span>
            </p>
          </div>

          {/* Official Multi-Header Table BS 5 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400 border-collapse print:text-black">
                <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700/80 text-center print:bg-slate-100 print:text-black">
                  <tr>
                    <th rowSpan={2} className="px-3 py-2.5 w-24 border-r border-slate-200 dark:border-slate-700">
                      (3)<br />รหัสความเสี่ยง
                    </th>
                    <th rowSpan={2} className="px-4 py-2.5 min-w-[160px] text-left border-r border-slate-200 dark:border-slate-700">
                      (4)<br />โครงการ/กิจกรรม/ภารกิจ
                    </th>
                    <th rowSpan={2} className="px-4 py-2.5 min-w-[150px] text-left border-r border-slate-200 dark:border-slate-700">
                      (5)<br />ความเสี่ยง
                    </th>
                    <th colSpan={3} className="px-2 py-2 border-r border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/20">
                      (6) คะแนนระดับความเสี่ยงก่อนดำเนินการ
                    </th>
                    <th rowSpan={2} className="px-4 py-2.5 min-w-[180px] text-left border-r border-slate-200 dark:border-slate-700">
                      (7)<br />วิธีการจัดการความเสี่ยง
                    </th>
                    <th rowSpan={2} className="px-4 py-2.5 min-w-[180px] text-left border-r border-slate-200 dark:border-slate-700">
                      (8)<br />ผลดำเนินการจากการจัดการ
                    </th>
                    <th colSpan={3} className="px-2 py-2 border-r border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20">
                      (9) คะแนนระดับความเสี่ยงภายหลังดำเนินการ
                    </th>
                    <th rowSpan={2} className="px-2.5 py-2.5 w-24 border-r border-slate-200 dark:border-slate-700">
                      (10)<br />การเปลี่ยนแปลง
                    </th>
                    <th rowSpan={2} className="px-3.5 py-2.5 min-w-[140px] text-left border-r border-slate-200 dark:border-slate-700">
                      (11)<br />ความเสี่ยงคงเหลือ/เกิดใหม่
                    </th>
                    <th colSpan={2} className="px-2 py-2 border-r border-slate-200 dark:border-slate-700">
                      (12) สรุปความเสี่ยง
                    </th>
                    <th rowSpan={2} className="px-4 py-2.5 min-w-[180px] text-left">
                      (13)<br />มาตรการสำหรับปีถัดไป
                    </th>
                    {setRiskManagement && <th rowSpan={2} className="px-3 py-2.5 w-16 no-print print:hidden">จัดการ</th>}
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700 text-[10px]">
                    {/* (6) Pre-score subheaders */}
                    <th className="px-1.5 py-1.5 w-12 border-r border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/20">โอกาส (1)</th>
                    <th className="px-1.5 py-1.5 w-12 border-r border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/20">ผลกระทบ (2)</th>
                    <th className="px-1.5 py-1.5 w-14 border-r border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/20">คะแนน (3)</th>
                    {/* (9) Post-score subheaders */}
                    <th className="px-1.5 py-1.5 w-12 border-r border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20">โอกาส (1)</th>
                    <th className="px-1.5 py-1.5 w-12 border-r border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20">ผลกระทบ (2)</th>
                    <th className="px-1.5 py-1.5 w-14 border-r border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20">คะแนน (3)</th>
                    {/* (12) Controllable subheaders */}
                    <th className="px-2 py-1.5 w-16 border-r border-slate-200 dark:border-slate-700">ควบคุมได้</th>
                    <th className="px-2 py-1.5 w-16 border-r border-slate-200 dark:border-slate-700">ควบคุมไม่ได้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBs5Items.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="px-4 py-10 text-center text-slate-400">
                        ไม่พบข้อมูลในแบบ บส. 5 {filterDept !== 'all' ? `ของ "${filterDept}"` : ''}
                      </td>
                    </tr>
                  ) : (
                    filteredBs5Items.map((item, idx) => {
                      const canManage = canEditItem(item.department);
                      const isControllable = (item.controllable || '').includes('ควบคุมได้') && !(item.controllable || '').includes('ไม่ได้');
                      return (
                        <tr key={item.id || idx} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-3 py-3 font-mono font-bold text-center text-blue-700 dark:text-blue-300 align-top border-r border-slate-100 dark:border-slate-800">
                            {item.riskCode}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 align-top border-r border-slate-100 dark:border-slate-800">
                            {item.activity}
                          </td>
                          <td className="px-4 py-3 text-rose-700 dark:text-rose-300 font-semibold align-top border-r border-slate-100 dark:border-slate-800">
                            {item.riskEvent}
                          </td>
                          {/* (6) Pre-score */}
                          <td className="px-1.5 py-3 text-center font-mono align-top border-r border-slate-100 dark:border-slate-800 bg-blue-50/20 dark:bg-blue-950/10">
                            {item.preLikelihood}
                          </td>
                          <td className="px-1.5 py-3 text-center font-mono align-top border-r border-slate-100 dark:border-slate-800 bg-blue-50/20 dark:bg-blue-950/10">
                            {item.preImpact}
                          </td>
                          <td className="px-1.5 py-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100 align-top border-r border-slate-100 dark:border-slate-800 bg-blue-50/20 dark:bg-blue-950/10">
                            {item.preScore}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 align-top border-r border-slate-100 dark:border-slate-800">
                            {item.measures}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 align-top border-r border-slate-100 dark:border-slate-800">
                            {item.result}
                          </td>
                          {/* (9) Post-score */}
                          <td className="px-1.5 py-3 text-center font-mono align-top border-r border-slate-100 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                            {item.postLikelihood}
                          </td>
                          <td className="px-1.5 py-3 text-center font-mono align-top border-r border-slate-100 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                            {item.postImpact}
                          </td>
                          <td className="px-1.5 py-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-300 align-top border-r border-slate-100 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                            {item.postScore}
                          </td>
                          {/* (10) Change */}
                          <td className="px-2.5 py-3 text-center align-top border-r border-slate-100 dark:border-slate-800">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.riskChange === 'ลดลง'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {item.riskChange || 'ลดลง'}
                            </span>
                          </td>
                          {/* (11) Residual */}
                          <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300 align-top border-r border-slate-100 dark:border-slate-800 text-[11px]">
                            {item.residualRisk || '-'}
                          </td>
                          {/* (12) Controllable */}
                          <td className="px-2 py-3 text-center align-top border-r border-slate-100 dark:border-slate-800 font-bold text-emerald-600">
                            {isControllable ? '✓' : ''}
                          </td>
                          <td className="px-2 py-3 text-center align-top border-r border-slate-100 dark:border-slate-800 font-bold text-rose-600">
                            {!isControllable ? '✓' : ''}
                          </td>
                          {/* (13) Next Year */}
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 align-top text-[11px]">
                            {item.nextYearMeasures}
                          </td>
                          {setRiskManagement && (
                            <td className="px-3 py-3 text-center align-top no-print print:hidden">
                              {canManage ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingBs5(item)}
                                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="แก้ไขการทบทวน บส.5"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">ดูเท่านั้น</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Executive Summary Card */}
            <div className="p-6 bg-slate-50/70 dark:bg-slate-850/60 border-t border-slate-200 dark:border-slate-800 space-y-4 print:bg-slate-50 print:border print:border-black print:p-4 break-inside-avoid print:break-inside-avoid">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>สรุปภาพรวมผลการดำเนินการและการทบทวนแผนบริหารความเสี่ยง ประจำปี พ.ศ. {selectedYear}:</span>
                </div>
                {isAdmin && setRiskManagement && (
                  <button
                    type="button"
                    onClick={() => setEditingBs5Summary(true)}
                    className="no-print text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>แก้ไขข้อความสรุป & ลายมือชื่อ</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed indent-6">
                {bs5Data.summary}
              </p>
            </div>

            {/* Official Signature Section */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col items-end text-xs space-y-1.5 text-slate-700 dark:text-slate-300 print:bg-transparent print:border-none print:text-black print:pt-4 print-signature-block break-inside-avoid print:break-inside-avoid">
              <div className="w-80 sm:w-96 print:w-88 text-center space-y-1.5 print:text-[8.5pt] print:mr-6">
                <div className="whitespace-nowrap">(ลงชื่อ)...................................................</div>
                {isSubDivision ? (
                  <>
                    <div className="whitespace-nowrap">( .................................................... )</div>
                    <div className="whitespace-nowrap">ตำแหน่ง ....................................................</div>
                  </>
                ) : (
                  <>
                    <div>( {bs5Data.approvedBy || orgProfile?.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น'} )</div>
                    <div>ตำแหน่ง {bs5Data.approverPosition || orgProfile?.approverPosition || 'นายกองค์กรปกครองส่วนท้องถิ่น'}</div>
                  </>
                )}
                <div className="whitespace-nowrap">วันที่..........เดือน........................พ.ศ. ............</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: ADD / EDIT
      ========================================================================= */}

      {/* Modal: Add BS.1 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Pinned */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 rounded-t-2xl z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>กำหนดขอบเขตและระบุความเสี่ยงใหม่ (แบบ บส. 1)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBs1} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (3) รหัสความเสี่ยง:
                  </label>
                  <input
                    type="text"
                    required
                    value={formBs1.riskCode}
                    onChange={(e) => setFormBs1({ ...formBs1, riskCode: e.target.value })}
                    placeholder="เช่น RSK-01"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ส่วนราชการผู้รับผิดชอบ:
                  </label>
                  {isAdmin ? (
                    <select
                      value={formBs1.department}
                      onChange={(e) => setFormBs1({ ...formBs1, department: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      {departmentsList.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold">
                      {userDept} (ระบบจำกัดเฉพาะกองท่าน)
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Standard Mission Selector from Library */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 dark:from-slate-800 dark:to-slate-800/80 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>เลือกจากคลังภารกิจและความเสี่ยงมาตรฐาน อปท. (ว 3482):</span>
                  </label>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    กรอกอัตโนมัติครบ 100%
                  </span>
                </div>
                <select
                  onChange={(e) => {
                    const selectedLibId = e.target.value;
                    if (!selectedLibId) return;
                    const deptList = getStandardRisksByDepartment(isAdmin ? formBs1.department : userDept);
                    const chosen = deptList.find(x => x.riskId === selectedLibId);
                    if (chosen) {
                      setFormBs1(prev => ({
                        ...prev,
                        strategy: mapToFangkhamStrategy(chosen.strategy, isAdmin ? formBs1.department : userDept),
                        activity: chosen.activity,
                        budget: chosen.budget !== undefined ? chosen.budget : prev.budget,
                        objective: chosen.objective,
                        kpi: chosen.kpi,
                        target: chosen.target,
                        riskEvent: chosen.riskEvent,
                        cause: chosen.cause,
                        riskCategory: chosen.riskCategory
                      }));
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-blue-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- คลิกเพื่อเลือกภารกิจมาตรฐานของ {isAdmin ? formBs1.department : userDept} --</option>
                  {getStandardRisksByDepartment(isAdmin ? formBs1.department : userDept).map(item => (
                    <option key={item.riskId} value={item.riskId}>
                      📌 {item.activity} ({item.riskLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (4) ยุทธศาสตร์ที่รับผิดชอบ:
                </label>
                <select
                  required
                  value={formBs1.strategy}
                  onChange={(e) => setFormBs1({ ...formBs1, strategy: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- คลิกเพื่อเลือกยุทธศาสตร์ {orgProfile?.name || 'อปท.'} (7 ยุทธศาสตร์มาตรฐาน) --</option>
                  {FANGKHAM_STRATEGIES.map((strat) => (
                    <option key={strat} value={strat}>
                      🎯 {strat}
                    </option>
                  ))}
                  {formBs1.strategy && !FANGKHAM_STRATEGIES.includes(formBs1.strategy) && (
                    <option value={formBs1.strategy}>
                      📌 {formBs1.strategy}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    (5) โครงการ/กิจกรรม/ภารกิจ อปท. ที่สำคัญ:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formBs1.activity) return;
                      const analyzed = analyzeRiskKeyword(formBs1.activity, isAdmin ? formBs1.department : userDept);
                      if (analyzed) {
                        setFormBs1(prev => ({
                          ...prev,
                          strategy: prev.strategy || mapToFangkhamStrategy(analyzed.strategy, isAdmin ? formBs1.department : userDept),
                          objective: prev.objective || analyzed.objective,
                          kpi: prev.kpi || analyzed.kpi,
                          target: prev.target || analyzed.target,
                          riskEvent: prev.riskEvent || analyzed.riskEvent,
                          cause: prev.cause || analyzed.cause,
                          riskCategory: prev.riskCategory || analyzed.riskCategory
                        }));
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-space-x-1 cursor-pointer transition-all"
                    title="วิเคราะห์และแนะนำข้อมูลตามคำสำคัญของชื่อโครงการ"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>วิเคราะห์อัตโนมัติตามชื่อ</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="เช่น โครงการพัฒนาระบบแผนที่ภาษีและทะเบียนทรัพย์สิน (LTAX 3000)"
                  value={formBs1.activity}
                  onChange={(e) => setFormBs1({ ...formBs1, activity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (6) งบประมาณ (บาท):
                  </label>
                  <input
                    type="number"
                    placeholder="เช่น 150000"
                    value={formBs1.budget}
                    onChange={(e) => setFormBs1({ ...formBs1, budget: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (7) วัตถุประสงค์:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น เพื่อจัดเก็บภาษีได้ครบถ้วน ถูกต้องตามเป้าหมาย"
                    value={formBs1.objective}
                    onChange={(e) => setFormBs1({ ...formBs1, objective: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (8) ตัวชี้วัด:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ร้อยละของแปลงที่ดินที่สำรวจแล้วเสร็จ (100%)"
                    value={formBs1.kpi}
                    onChange={(e) => setFormBs1({ ...formBs1, kpi: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (9) เป้าหมายสูงสุด:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น จัดเก็บภาษีได้ครบถ้วน ไม่ตกหล่น"
                    value={formBs1.target}
                    onChange={(e) => setFormBs1({ ...formBs1, target: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                  ประเด็นความเสี่ยงสำหรับเชื่อมต่อไปยังแบบ บส. 2:
                </span>
                <input
                  type="text"
                  placeholder="ระบุเหตุการณ์ความเสี่ยง เช่น การจัดเก็บภาษีที่ดินไม่เป็นไปตามเป้าหมาย"
                  value={formBs1.riskEvent}
                  onChange={(e) => setFormBs1({ ...formBs1, riskEvent: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกแบบ บส. 1
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit BS.1 */}
      {editingBs1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Pinned */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 rounded-t-2xl z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>แก้ไขข้อมูลกำหนดขอบเขตความเสี่ยง (แบบ บส. 1)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBs1(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBs1} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (3) รหัสความเสี่ยง:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBs1.riskCode || ''}
                    onChange={(e) => setEditingBs1({ ...editingBs1, riskCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ส่วนราชการผู้รับผิดชอบ:
                  </label>
                  {isAdmin ? (
                    <select
                      value={editingBs1.department}
                      onChange={(e) => setEditingBs1({ ...editingBs1, department: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      {departmentsList.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold">
                      {editingBs1.department}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Standard Mission Selector from Library */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 dark:from-slate-800 dark:to-slate-800/80 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>เลือกจากคลังภารกิจและความเสี่ยงมาตรฐาน อปท. (ว 3482):</span>
                  </label>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    อัปเดตข้อมูลอัตโนมัติ
                  </span>
                </div>
                <select
                  onChange={(e) => {
                    const selectedLibId = e.target.value;
                    if (!selectedLibId) return;
                    const deptList = getStandardRisksByDepartment(editingBs1.department);
                    const chosen = deptList.find(x => x.riskId === selectedLibId);
                    if (chosen) {
                      setEditingBs1(prev => ({
                        ...prev,
                        strategy: mapToFangkhamStrategy(chosen.strategy, editingBs1.department),
                        activity: chosen.activity,
                        budget: chosen.budget !== undefined ? chosen.budget : prev.budget,
                        objective: chosen.objective,
                        kpi: chosen.kpi,
                        target: chosen.target,
                        riskEvent: chosen.riskEvent,
                        cause: chosen.cause,
                        riskCategory: chosen.riskCategory
                      }));
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-blue-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- คลิกเพื่อเลือกภารกิจมาตรฐานของ {editingBs1.department} --</option>
                  {getStandardRisksByDepartment(editingBs1.department).map(item => (
                    <option key={item.riskId} value={item.riskId}>
                      📌 {item.activity} ({item.riskLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (4) ยุทธศาสตร์ที่รับผิดชอบ:
                </label>
                <select
                  required
                  value={editingBs1.strategy || ''}
                  onChange={(e) => setEditingBs1({ ...editingBs1, strategy: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- คลิกเพื่อเลือกยุทธศาสตร์ {orgProfile?.name || 'อปท.'} (7 ยุทธศาสตร์มาตรฐาน) --</option>
                  {FANGKHAM_STRATEGIES.map((strat) => (
                    <option key={strat} value={strat}>
                      🎯 {strat}
                    </option>
                  ))}
                  {editingBs1.strategy && !FANGKHAM_STRATEGIES.includes(editingBs1.strategy) && (
                    <option value={editingBs1.strategy}>
                      📌 {editingBs1.strategy}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    (5) โครงการ/กิจกรรม/ภารกิจ อปท. ที่สำคัญ:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingBs1.activity) return;
                      const analyzed = analyzeRiskKeyword(editingBs1.activity, editingBs1.department);
                      if (analyzed) {
                        setEditingBs1(prev => ({
                          ...prev,
                          strategy: prev.strategy || mapToFangkhamStrategy(analyzed.strategy, editingBs1.department),
                          objective: prev.objective || analyzed.objective,
                          kpi: prev.kpi || analyzed.kpi,
                          target: prev.target || analyzed.target,
                          riskEvent: prev.riskEvent || analyzed.riskEvent,
                          cause: prev.cause || analyzed.cause,
                          riskCategory: prev.riskCategory || analyzed.riskCategory
                        }));
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1 cursor-pointer transition-all"
                    title="วิเคราะห์และแนะนำข้อมูลตามคำสำคัญของชื่อโครงการ"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>วิเคราะห์อัตโนมัติตามชื่อ</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editingBs1.activity || ''}
                  onChange={(e) => setEditingBs1({ ...editingBs1, activity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (6) งบประมาณ (บาท):
                  </label>
                  <input
                    type="number"
                    value={editingBs1.budget || ''}
                    onChange={(e) => setEditingBs1({ ...editingBs1, budget: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (7) วัตถุประสงค์:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBs1.objective || ''}
                    onChange={(e) => setEditingBs1({ ...editingBs1, objective: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (8) ตัวชี้วัด:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBs1.kpi || ''}
                    onChange={(e) => setEditingBs1({ ...editingBs1, kpi: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (9) เป้าหมายสูงสุด:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBs1.target || ''}
                    onChange={(e) => setEditingBs1({ ...editingBs1, target: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                  ประเด็นความเสี่ยงสำหรับเชื่อมต่อไปยังแบบ บส. 2:
                </span>
                <input
                  type="text"
                  value={editingBs1.riskEvent || ''}
                  onChange={(e) => setEditingBs1({ ...editingBs1, riskEvent: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBs1(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit BS.2 */}
      {editingBs2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Pinned */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 rounded-t-2xl z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>วิเคราะห์โอกาส ผลกระทบ และการตอบสนองความเสี่ยง (แบบ บส. 2)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBs2(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBs2} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold text-blue-800 dark:text-blue-300">
                  <span>รหัส: {editingBs2.riskCode}</span>
                  <span>{editingBs2.department}</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100">{editingBs2.activity}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (6) ผู้รับผิดชอบ (บุคคลหรือหน่วยงาน):
                </label>
                <input
                  type="text"
                  required
                  value={editingBs2.responsiblePerson || ''}
                  onChange={(e) => setEditingBs2({ ...editingBs2, responsiblePerson: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (7) เหตุการณ์ความเสี่ยง:
                </label>
                <input
                  type="text"
                  required
                  value={editingBs2.riskEvent || ''}
                  onChange={(e) => setEditingBs2({ ...editingBs2, riskEvent: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (8) ประเภทความเสี่ยง (6 ประเภทตามหนังสือสั่งการ):
                </label>
                <select
                  value={editingBs2.riskCategory || RISK_CATEGORIES[2].label}
                  onChange={(e) => setEditingBs2({ ...editingBs2, riskCategory: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  {RISK_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (9) คะแนนโอกาสเกิด (1 - 5):
                  </label>
                  <select
                    value={editingBs2.likelihood}
                    onChange={(e) => setEditingBs2({ ...editingBs2, likelihood: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value={1}>1 - น้อยที่สุด</option>
                    <option value={2}>2 - น้อย</option>
                    <option value={3}>3 - ปานกลาง</option>
                    <option value={4}>4 - สูง</option>
                    <option value={5}>5 - สูงมาก</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (10) คะแนนผลกระทบ (1 - 5):
                  </label>
                  <select
                    value={editingBs2.impact}
                    onChange={(e) => setEditingBs2({ ...editingBs2, impact: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value={1}>1 - น้อยที่สุด</option>
                    <option value={2}>2 - น้อย</option>
                    <option value={3}>3 - ปานกลาง</option>
                    <option value={4}>4 - สูง</option>
                    <option value={5}>5 - สูงมาก</option>
                  </select>
                </div>
              </div>

              {/* Calculated Matrix Level */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 font-medium">คะแนนรวม (9) x (10): </span>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                    {Number(editingBs2.likelihood) * Number(editingBs2.impact)}
                  </span>
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${getRiskLevelBadge(computeRiskLevel(Number(editingBs2.likelihood) * Number(editingBs2.impact)))}`}>
                    ระดับความเสี่ยง: {computeRiskLevel(Number(editingBs2.likelihood) * Number(editingBs2.impact))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (12) วิธีการตอบสนองความเสี่ยง (8 วิธีตามหนังสือสั่งการ):
                </label>
                <select
                  value={editingBs2.riskResponse || RISK_RESPONSES[1].label}
                  onChange={(e) => setEditingBs2({ ...editingBs2, riskResponse: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-indigo-700 dark:text-indigo-300"
                >
                  {RISK_RESPONSES.map((r) => (
                    <option key={r.id} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBs2(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกแบบ บส. 2
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit BS.3 */}
      {editingBs3 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Pinned */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 rounded-t-2xl z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>แก้ไขรายงานการจัดทำแผนบริหารความเสี่ยง (แบบ บส. 3)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBs3(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBs3} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold text-blue-700">
                  <span>รหัส: {editingBs3.riskCode}</span>
                  <span>{editingBs3.department}</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100">{editingBs3.activity}</div>
                <div className="text-rose-600 font-medium">ความเสี่ยง: {editingBs3.riskEvent}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (6) วิธีการตอบสนองความเสี่ยง:
                </label>
                <select
                  value={editingBs3.riskResponse || RISK_RESPONSES[1].label}
                  onChange={(e) => setEditingBs3({ ...editingBs3, riskResponse: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  {RISK_RESPONSES.map((r) => (
                    <option key={r.id} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (7) ผู้รับผิดชอบ:
                </label>
                <input
                  type="text"
                  required
                  value={editingBs3.responsiblePerson || ''}
                  onChange={(e) => setEditingBs3({ ...editingBs3, responsiblePerson: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (8) วิธีการจัดการความเสี่ยง (แนวทาง/ขั้นตอนการปฏิบัติงาน/มาตรการ):
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingBs3.measures || ''}
                  onChange={(e) => setEditingBs3({ ...editingBs3, measures: e.target.value })}
                  placeholder="ระบุแนวทาง ขั้นตอนปฏิบัติงานตามระเบียบ กฎหมาย หรือหนังสือสั่งการ เพื่อให้ความเสี่ยงลดลง"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (9) ตัวชี้วัด:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBs3.kpi || ''}
                    onChange={(e) => setEditingBs3({ ...editingBs3, kpi: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (10) ระยะเวลาดำเนินการ:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBs3.timeline || ''}
                    onChange={(e) => setEditingBs3({ ...editingBs3, timeline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (11) วิธีการติดตาม และการรายงาน:
                </label>
                <input
                  type="text"
                  required
                  value={editingBs3.monitoringMethod || ''}
                  onChange={(e) => setEditingBs3({ ...editingBs3, monitoringMethod: e.target.value })}
                  placeholder="เช่น การประชุมประจำเดือน, รายงานไตรมาส"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBs3(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกแบบ บส. 3
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit BS.4 */}
      {editingBs4 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Pinned */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 rounded-t-2xl z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>แก้ไขรายงานการติดตามผลการบริหารความเสี่ยง (แบบ บส. 4)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBs4(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBs4} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold text-blue-700">
                  <span>รหัส: {editingBs4.riskCode}</span>
                  <span>{editingBs4.department}</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100">{editingBs4.activity}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รอบการรายงาน:
                  </label>
                  <select
                    value={editingBs4.period || '6month'}
                    onChange={(e) => setEditingBs4({ ...editingBs4, period: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="3month">รอบ 3 เดือน</option>
                    <option value="6month">รอบ 6 เดือน</option>
                    <option value="12month">รอบ 12 เดือน</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (10) ร้อยละความคืบหน้า (%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editingBs4.progressPercent}
                    onChange={(e) => setEditingBs4({ ...editingBs4, progressPercent: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (8) ผลลัพธ์การดำเนินการจัดการความเสี่ยง:
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingBs4.result || ''}
                  onChange={(e) => setEditingBs4({ ...editingBs4, result: e.target.value })}
                  placeholder="ระบุว่าได้ดำเนินการหรือไม่อย่างไร ผลสัมฤทธิ์ที่เกิดขึ้นจริง"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (9) เอกสาร/หลักฐานอ้างอิง:
                </label>
                <input
                  type="text"
                  value={editingBs4.evidence || ''}
                  onChange={(e) => setEditingBs4({ ...editingBs4, evidence: e.target.value })}
                  placeholder="เช่น บันทึกข้อความ, รายงานการประชุม, ภาพถ่าย, ทะเบียนคุม"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    (11) ปัญหาอุปสรรค และแนวทางแก้ไข:
                  </label>
                  <button
                    type="button"
                    disabled={isAiAnalyzing}
                    onClick={async () => {
                      setIsAiAnalyzing(true);
                      try {
                        const rec = await analyzeProblemAndSolutionWithAI({
                          riskCode: editingBs4.riskCode,
                          department: editingBs4.department || userDept || '',
                          activity: editingBs4.activity,
                          measures: editingBs4.measures,
                          progressPercent: editingBs4.progressPercent ?? 80,
                          period: editingBs4.period || '6month',
                          result: editingBs4.result
                        });
                        setEditingBs4(prev => ({ ...prev, problemSolution: rec }));
                      } finally {
                        setIsAiAnalyzing(false);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      geminiReady
                        ? 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                        : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    }`}
                    title={geminiReady ? "วิเคราะห์ข้อความด้วย Google Gemini Generative AI" : "แนะนำข้อความวิเคราะห์ปัญหาอุปสรรคและแนวทางแก้ไขที่สอดคล้องกับภารกิจ"}
                  >
                    {isAiAnalyzing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isAiAnalyzing ? 'AI กำลังวิเคราะห์...' : (geminiReady ? '✨ วิเคราะห์ด้วย Gemini AI' : '✨ แนะนำปัญหา & แนวทางแก้ไข')}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={editingBs4.problemSolution || ''}
                  onChange={(e) => setEditingBs4({ ...editingBs4, problemSolution: e.target.value })}
                  placeholder="ระบุปัญหาอุปสรรคและแนวทางแก้ไข (ถ้ามี)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBs4(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกแบบ บส. 4
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit BS.5 Row */}
      {editingBs5 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Pinned */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 rounded-t-2xl z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>ทบทวนผลการดำเนินการและระดับความเสี่ยง (แบบ บส. 5)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBs5(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBs5} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold text-blue-700">
                  <span>รหัส: {editingBs5.riskCode}</span>
                  <span>{editingBs5.department}</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100">{editingBs5.activity}</div>
                <div className="text-rose-600">ความเสี่ยง: {editingBs5.riskEvent}</div>
              </div>

              {/* Pre vs Post Score Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                  <span className="font-bold text-blue-800 dark:text-blue-300 block text-[11px]">
                    (6) คะแนนก่อนดำเนินการ:
                  </span>
                  <div className="flex items-center space-x-2">
                    <label className="w-20">โอกาส:</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editingBs5.preLikelihood}
                      onChange={(e) => setEditingBs5({ ...editingBs5, preLikelihood: Number(e.target.value) })}
                      className="p-1.5 rounded-lg border border-slate-300 w-16 text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="w-20">ผลกระทบ:</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editingBs5.preImpact}
                      onChange={(e) => setEditingBs5({ ...editingBs5, preImpact: Number(e.target.value) })}
                      className="p-1.5 rounded-lg border border-slate-300 w-16 text-center font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-[11px]">
                    (9) คะแนนภายหลังดำเนินการ:
                  </span>
                  <div className="flex items-center space-x-2">
                    <label className="w-20">โอกาส:</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editingBs5.postLikelihood}
                      onChange={(e) => setEditingBs5({ ...editingBs5, postLikelihood: Number(e.target.value) })}
                      className="p-1.5 rounded-lg border border-slate-300 w-16 text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="w-20">ผลกระทบ:</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editingBs5.postImpact}
                      onChange={(e) => setEditingBs5({ ...editingBs5, postImpact: Number(e.target.value) })}
                      className="p-1.5 rounded-lg border border-slate-300 w-16 text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (8) ผลดำเนินการจากการจัดการความเสี่ยง (สรุปเป็นภาพรวม):
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingBs5.result || ''}
                  onChange={(e) => setEditingBs5({ ...editingBs5, result: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      (11) ความเสี่ยงคงเหลือหรือเกิดขึ้นใหม่:
                    </label>
                    <button
                      type="button"
                      disabled={isBs5AiAnalyzing}
                      onClick={async () => {
                        setIsBs5AiAnalyzing(true);
                        try {
                          const evalRes = await evaluateResidualRiskWithAI({
                            riskCode: editingBs5.riskCode,
                            department: editingBs5.department,
                            activity: editingBs5.activity,
                            riskEvent: editingBs5.riskEvent,
                            preScore: Number(editingBs5.preLikelihood) * Number(editingBs5.preImpact),
                            measures: editingBs5.measures || '',
                            result12m: editingBs5.result || ''
                          });
                          setEditingBs5(prev => ({
                            ...prev,
                            postLikelihood: evalRes.postLikelihood ?? prev.postLikelihood,
                            postImpact: evalRes.postImpact ?? prev.postImpact,
                            residualRisk: evalRes.residualRisk || prev.residualRisk,
                            controllable: evalRes.controllable || prev.controllable,
                            nextYearMeasures: evalRes.nextYearMeasures || prev.nextYearMeasures
                          }));
                        } finally {
                          setIsBs5AiAnalyzing(false);
                        }
                      }}
                      className={`text-[11px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        geminiReady
                          ? 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      }`}
                      title={geminiReady ? "วิเคราะห์ความเสี่ยงคงเหลือและมาตรการปีถัดไปด้วย Gemini AI" : "ช่วยแนะนำความเสี่ยงคงเหลือ"}
                    >
                      {isBs5AiAnalyzing ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>{isBs5AiAnalyzing ? 'กำลังประเมิน...' : (geminiReady ? '✨ วิเคราะห์ด้วย Gemini AI' : '✨ แนะนำความเสี่ยงคงเหลือ')}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingBs5.residualRisk || ''}
                    onChange={(e) => setEditingBs5({ ...editingBs5, residualRisk: e.target.value })}
                    placeholder="ระบุความเสี่ยงคงเหลือ"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    (12) สรุปความเสี่ยง:
                  </label>
                  <select
                    value={editingBs5.controllable || 'ควบคุมได้'}
                    onChange={(e) => setEditingBs5({ ...editingBs5, controllable: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="ควบคุมได้">ควบคุมได้ (อยู่ในระดับที่ยอมรับได้)</option>
                    <option value="ควบคุมไม่ได้">ควบคุมไม่ได้</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (13) แนวทาง/มาตรการจัดการความเสี่ยงสำหรับปีถัดไป:
                </label>
                <textarea
                  rows={2}
                  value={editingBs5.nextYearMeasures || ''}
                  onChange={(e) => setEditingBs5({ ...editingBs5, nextYearMeasures: e.target.value })}
                  placeholder="ระบุแนวทางหรือมาตรการสำหรับปีถัดไปเพื่อควบคุมความเสี่ยง"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBs5(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกแบบ บส. 5
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit BS.5 Summary & Signatures (Admin only) */}
      {editingBs5Summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Pinned */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 rounded-t-2xl z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>แก้ไขข้อความสรุปภาพรวม & ผู้ลงนาม (แบบ บส. 5)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBs5Summary(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBs5Summary} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ข้อความสรุปภาพรวมผลการดำเนินงานระดับองค์กร:
                </label>
                <textarea
                  name="summary"
                  rows={4}
                  required
                  defaultValue={bs5Data.summary}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (14) ลายมือชื่อผู้บริหารท้องถิ่น:
                </label>
                <input
                  type="text"
                  name="approvedBy"
                  required
                  defaultValue={bs5Data.approvedBy}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (15) ตำแหน่งผู้บริหารท้องถิ่น:
                </label>
                <input
                  type="text"
                  name="approverPosition"
                  required
                  defaultValue={bs5Data.approverPosition}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  (16) วันเดือนปีที่รายงาน:
                </label>
                <input
                  type="text"
                  name="reportDate"
                  required
                  defaultValue={bs5Data.reportDate}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBs5Summary(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกข้อมูลสรุป
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SMART RISK ASSISTANT (ว 3482)
      ========================================================================= */}
      {showSmartAssistant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Fixed & Sticky */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between bg-white dark:bg-slate-900 shrink-0 rounded-t-3xl z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <span>ผู้ช่วยวิเคราะห์และจับคู่ความเสี่ยงมาตรฐาน อปท.</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      ว 3482
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAdmin
                      ? 'คลังภารกิจและวิเคราะห์ความเสี่ยงจำแนกรายกอง อ้างอิงตามหนังสือสั่งการ มท 0805.2/ว 3482 และหลักเกณฑ์ กค. 2562 (สิทธิ์หน่วยตรวจสอบภายใน: แสดงทุกส่วนราชการ)'
                      : `คลังภารกิจและวิเคราะห์ความเสี่ยงจำแนกเฉพาะหน่วยงาน (${userDept}) อ้างอิงตามหนังสือสั่งการ มท 0805.2/ว 3482`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSmartAssistant(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
                title="ปิดหน้าต่าง (Close)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 sm:p-7 pt-4 overflow-y-auto space-y-5 flex-1">
              {/* Filter & Action Controls */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Department Selection */}
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    เลือกส่วนราชการ:
                  </span>
                  {isAdmin ? (
                    <select
                      value={smartDept}
                      onChange={(e) => setSmartDept(e.target.value)}
                      className="w-full sm:w-auto flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">🏢 ทุกส่วนราชการ (แสดงทั้งหมด)</option>
                      {departmentsList.map((d) => (
                        <option key={d} value={d}>📁 {d}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center justify-between flex-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-indigo-600 dark:text-indigo-400">📁</span>
                        <span>{userDept}</span>
                      </div>
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60 font-medium">
                        🔒 เฉพาะหน่วยงานที่เข้าใช้งาน
                      </span>
                    </div>
                  )}
                </div>

                {/* Keyword Search */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="ค้นหาภารกิจ เช่น ภาษี, คสล., พัสดุ, อาหารกลางวัน..."
                    value={smartSearchTerm}
                    onChange={(e) => setSmartSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Quick Deployment Action */}
              {(isAdmin ? smartDept !== 'all' : true) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    💡 ต้องการติดตั้งภารกิจและความเสี่ยงตามหนังสือสั่งการสำหรับ <strong>"{isAdmin ? smartDept : userDept}"</strong> ครบชุดหรือไม่?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeployFullPackage(isAdmin ? smartDept : userDept)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>🚀 ติดตั้งครบชุด ({getStandardRisksByDepartment(isAdmin ? smartDept : userDept).length} ภารกิจ)</span>
                  </button>
                </div>
              )}
            </div>

            {/* List of Standard Risks */}
            <div className="space-y-4">
              {(() => {
                const effectiveDept = isAdmin ? smartDept : userDept;
                const list = (isAdmin && effectiveDept === 'all') 
                  ? getAllStandardRisks() 
                  : getStandardRisksByDepartment(effectiveDept);
                const filtered = list.filter((item) => {
                  if (!smartSearchTerm) return true;
                  const q = smartSearchTerm.toLowerCase();
                  return (
                    (item.activity || '').toLowerCase().includes(q) ||
                    (item.riskEvent || '').toLowerCase().includes(q) ||
                    (item.objective || '').toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      ไม่พบภารกิจหรือความเสี่ยงที่ตรงกับคำค้นหา
                    </div>
                  );
                }

                return filtered.map((item, idx) => (
                  <div
                    key={item.riskId || idx}
                    className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-3"
                  >
                    {/* Top Row: Meta Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          {isAdmin ? (item.department || smartDept) : userDept}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          {item.riskCategory}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.riskLevel === 'สูงมาก'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300'
                            : item.riskLevel === 'สูง'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300'
                            : 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border border-yellow-300'
                        }`}>
                          ระดับความเสี่ยง: {item.riskLevel} (คะแนน {item.riskScore})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportStandardRisk(item, isAdmin ? (item.department || smartDept) : userDept)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                        title="นำเข้าภารกิจนี้เข้าสู่แบบ บส. 1 ถึง บส. 5 ทันที"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>✨ นำเข้าสู่ระบบ (บส.1 - 5)</span>
                      </button>
                    </div>

                    {/* Mission Title & Strategy */}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {item.activity}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        🎯 {item.strategy} • งบประมาณ: {item.budget ? `${Number(item.budget).toLocaleString()} บาท` : 'ตามภารกิจประจำ'}
                      </p>
                    </div>

                    {/* 2-Column Risk & Measure Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Left: Risk Analysis (บส. 2) */}
                      <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/40 space-y-1.5">
                        <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>เหตุการณ์ความเสี่ยง (แบบ บส. 2 ข้อ 7):</span>
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">
                          {item.riskEvent}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          <strong>สาเหตุ:</strong> {item.cause}
                        </p>
                        <div className="pt-1 flex items-center space-x-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          <span>โอกาส (L): {item.likelihood}</span>
                          <span>•</span>
                          <span>ผลกระทบ (I): {item.impact}</span>
                          <span>•</span>
                          <span className="font-bold text-rose-700 dark:text-rose-300">ผลคูณ: {item.riskScore}</span>
                        </div>
                      </div>

                      {/* Right: Treatment Plan (บส. 3 & บส. 5) */}
                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 space-y-1.5">
                        <span className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>มาตรการจัดการความเสี่ยง (แบบ บส. 3 ข้อ 8):</span>
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-[11px]">
                          {item.treatmentMeasures}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-indigo-100 dark:border-indigo-900/60">
                          <span>วิธีตอบสนอง: {item.riskResponse}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Residual Risk: {item.expectedResidualScore} ({item.expectedResidualLevel})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Bottom Footer (Pinned at bottom) */}
          <div className="p-4 sm:px-6 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 shrink-0 rounded-b-3xl flex items-center justify-between z-10">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              ข้อมูลยึดตามหลักเกณฑ์กระทรวงการคลัง พ.ศ. 2562 และหนังสือสั่งการ มท 0805.2/ว 3482 ลว. 18 สิงหาคม 2566
            </span>
            <button
              type="button"
              onClick={() => setShowSmartAssistant(false)}
              className="px-5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    )}

      {/* =========================================================================
          MODAL: COMPLIANCE AUDIT CHECKLIST (ว 3482)
      ========================================================================= */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header - Fixed & Sticky */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between bg-white dark:bg-slate-900 shrink-0 rounded-t-3xl z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    รายงานการตรวจสอบความสอดคล้องตามมาตรฐาน ว 3482
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ประเมินความถูกต้องของแบบ บส. 1 ถึง บส. 5 ประจำปีงบประมาณ พ.ศ. {selectedYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
                title="ปิดหน้าต่าง (Close)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1">

            {/* Overall Score Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 dark:from-slate-800 dark:to-slate-850 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  คะแนนประเมินความสอดคล้อง (Compliance Score):
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {complianceAudit.score}%
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    complianceAudit.isCompliant
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                  }`}>
                    {complianceAudit.isCompliant ? '✓ ผ่านเกณฑ์มาตรฐานสมบูรณ์' : '⚠️ ต้องปรับปรุงความเชื่อมโยง'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuditModal(false);
                  handleExecuteCascade(isAdmin ? filterDept : userDept);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>ปรับปรุงอัตโนมัติ (Auto-Cascade)</span>
              </button>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                รายการตรวจสอบความสอดคล้องตามหลักเกณฑ์:
              </h4>
              <div className="space-y-2.5">
                {complianceAudit.checks.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-start space-x-3"
                  >
                    <div className="shrink-0 mt-0.5">
                      {c.status === 'passed' ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                          !
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {c.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {c.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics Table */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                สถิติข้อมูลในระบบบริหารจัดการความเสี่ยง:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 block">แบบ บส. 1 (ขอบเขต):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{complianceAudit.stats.totalRisks} รายการ</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 block">ความเสี่ยงระดับสูง/สูงมาก (บส. 2):</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{complianceAudit.stats.highRisks} รายการ</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 block">แบบ บส. 3 (แผนบริหาร):</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{complianceAudit.stats.plansCount} รายการ</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 block">แบบ บส. 4 (ติดตามผล):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{complianceAudit.stats.trackedCount} รายการ</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block">แบบ บส. 5 (ทบทวนองค์กร):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{complianceAudit.stats.evaluatedCount} รายการ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Pinned */}
          <div className="p-4 sm:px-6 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 shrink-0 rounded-b-3xl flex justify-end z-10">
            <button
              type="button"
              onClick={() => setShowAuditModal(false)}
              className="px-5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    )}

      {/* =========================================================================
          MODAL: CASCADE CONFIRMATION (ซิงค์ข้ามแบบฟอร์ม 1 ➜ 5)
      ========================================================================= */}
      {showCascadeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  ซิงค์เชื่อมโยงข้อมูลอัตโนมัติข้ามแบบฟอร์ม (Auto-Cascade)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  เชื่อมโยงข้อมูลจาก บส. 1 ➜ บส. 2 ➜ บส. 3 ➜ บส. 4 ➜ บส. 5 ตามหนังสือสั่งการ ว 3482
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                ระบบจะดำเนินการตามหลักเกณฑ์ระเบียบ ดังนี้:
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[11px]">
                <li><strong>บส. 1 ➜ บส. 2:</strong> นำภารกิจ/วัตถุประสงค์มาวิเคราะห์โอกาส (L) x ผลกระทบ (I) คำนวณระดับความเสี่ยงตาม Matrix 5x5</li>
                <li><strong>บส. 2 ➜ บส. 3:</strong> <span className="text-amber-700 dark:text-amber-400 font-bold">คัดกรองเฉพาะระดับ "สูง" และ "สูงมาก"</span> มาจัดทำแผนและมาตรการจัดการความเสี่ยงตามระเบียบข้อ 10</li>
                <li><strong>บส. 3 ➜ บส. 4:</strong> นำแผนมาตรการมารายงานติดตามผลดำเนินงาน ระบุความคืบหน้า (%) และหลักฐานอ้างอิง</li>
                <li><strong>บส. 4 ➜ บส. 5:</strong> ประเมินคะแนนความเสี่ยงก่อนดำเนินการ vs หลังดำเนินการ (Residual Risk) และสรุปผลว่า "ลดลง" และ "ควบคุมได้"</li>
              </ul>
            </div>

            {isAdmin && (
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เลือกขอบเขตส่วนราชการที่ต้องการซิงค์:
                </label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                >
                  <option value="all">🏢 ทุกส่วนราชการใน อปท. (แนะนำ)</option>
                  {departmentsList.map(d => (
                    <option key={d} value={d}>📁 {d}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCascadeConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleExecuteCascade(isAdmin ? filterDept : userDept)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>ยืนยันซิงค์ข้อมูล (Auto-Cascade)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SUBMIT TO INTERNAL AUDIT (ส่งแบบ บส.1 - บส.5 ให้หน่วยตรวจสอบ)
      ========================================================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ส่งแบบ บส.1 - บส.5 ให้หน่วยตรวจสอบภายใน
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {submitModalDept} • ประจำปีงบประมาณ พ.ศ. {selectedYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1.5">
                <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>สรุปข้อมูลเอกสารที่จะนำส่ง:</span>
                </p>
                <ul className="text-slate-700 dark:text-slate-300 list-disc list-inside space-y-0.5 pl-1">
                  <li>แบบ บส.1 (กำหนดขอบเขตความรับผิดชอบ): {bs1List.filter(b => b.department === submitModalDept).length} กิจกรรม</li>
                  <li>แบบ บส.2 (วิเคราะห์โอกาสและผลกระทบ): {bs2List.filter(b => b.department === submitModalDept).length} กิจกรรม</li>
                  <li>แบบ บส.3 (รายงานแผนบริหารความเสี่ยง): {bs3List.filter(b => b.department === submitModalDept).length} กิจกรรม</li>
                  <li>แบบ บส.4 (รายงานติดตามผลการบริหารความเสี่ยง): {bs4List.filter(b => b.department === submitModalDept).length} กิจกรรม</li>
                  <li>แบบ บส.5 (รายงานผลการดำเนินงานและทบทวน): {bs5Data.items.filter(b => b.department === submitModalDept).length} กิจกรรม</li>
                </ul>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  บันทึกข้อความ / หมายเหตุถึงหน่วยตรวจสอบภายใน (ถ้ามี):
                </label>
                <textarea
                  rows="3"
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="เช่น ได้จัดทำแบบ บส.1 ถึง บส.5 ครบถ้วนแล้ว จึงขอส่งให้หน่วยตรวจสอบภายในสอบทานความถูกต้องตามเกณฑ์ มท 0805.2/ว 3482"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                ผู้ส่ง: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentSession?.displayName || currentSession?.username || submitModalDept}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleSendToAudit(submitModalDept, submitNotes)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ยืนยันส่งรายงาน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AUDIT REVIEW (บันทึกผลการสอบทานของหน่วยตรวจสอบภายใน)
      ========================================================================= */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    บันทึกผลการสอบทานแบบ บส. (หน่วยตรวจสอบภายใน)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {reviewModalDept} • ปีงบประมาณ พ.ศ. {selectedYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setShowCalendarPopup(false);
                  setReviewDate('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {submissions[reviewModalDept] && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-1">
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>วันที่ส่งรายงาน:</strong> {submissions[reviewModalDept]?.submittedAt || '-'}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>ผู้ส่ง:</strong> {submissions[reviewModalDept]?.submittedBy || '-'}
                  </p>
                  {submissions[reviewModalDept]?.notes && (
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>หมายเหตุจากกอง:</strong> &ldquo;{submissions[reviewModalDept]?.notes}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Review Date Selector */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>วันที่สอบทาน:</span>
                    <span className="text-rose-500">*</span>
                  </span>
                </label>
                <div className="flex items-center gap-2 relative">
                  <input
                    type="text"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    placeholder="เช่น 30 ก.ย. 2569 หรือคลิกเลือกจากปฏิทิน"
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleCalendarPopup}
                      className={`px-3 py-2.5 rounded-xl border font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs ${
                        showCalendarPopup
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                      }`}
                      title="คลิกเพื่อเปิดปฏิทินเลือกวันที่"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>เลือกจากปฏิทิน</span>
                    </button>

                    {/* Interactive Thai Buddhist Calendar Popover */}
                    {showCalendarPopup && (
                      <div
                        ref={calendarPopupRef}
                        className="absolute right-0 top-full mt-2 z-50 w-72 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100"
                      >
                        {/* Header: Month / Year selection and navigation */}
                        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              if (calMonth === 0) {
                                setCalMonth(11);
                                setCalYear((y) => y - 1);
                              } else {
                                setCalMonth((m) => m - 1);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="เดือนก่อนหน้า"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1">
                            <select
                              value={calMonth}
                              onChange={(e) => setCalMonth(Number(e.target.value))}
                              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                            >
                              {THAI_MONTH_FULL.map((name, idx) => (
                                <option key={name} value={idx}>{name}</option>
                              ))}
                            </select>

                            <select
                              value={calYear}
                              onChange={(e) => setCalYear(Number(e.target.value))}
                              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                            >
                              {[2566, 2567, 2568, 2569, 2570, 2571, 2572].map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (calMonth === 11) {
                                setCalMonth(0);
                                setCalYear((y) => y + 1);
                              } else {
                                setCalMonth((m) => m + 1);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="เดือนถัดไป"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Day of Week Labels */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          <span className="text-rose-500">อา</span>
                          <span>จ</span>
                          <span>อ</span>
                          <span>พ</span>
                          <span>พฤ</span>
                          <span>ศ</span>
                          <span className="text-indigo-500">ส</span>
                        </div>

                        {/* Day Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: calendarDays.firstDayOfWeek }).map((_, i) => (
                            <div key={`blank-${i}`} className="h-7 w-7" />
                          ))}
                          {Array.from({ length: calendarDays.totalDays }, (_, i) => i + 1).map((day) => {
                            const isSelected = selectedDayNum === day;
                            const dayOfWeek = (calendarDays.firstDayOfWeek + day - 1) % 7;
                            const isSunday = dayOfWeek === 0;

                            return (
                              <button
                                key={`day-${day}`}
                                type="button"
                                onClick={() => {
                                  setReviewDate(`${day} ${THAI_MONTH_SHORT[calMonth]} ${calYear}`);
                                  setShowCalendarPopup(false);
                                }}
                                className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white font-bold shadow-xs scale-105'
                                    : isSunday
                                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick actions at bottom of popover */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              setReviewDate(`30 ก.ย. ${selectedYear}`);
                              setShowCalendarPopup(false);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                          >
                            30 ก.ย. {selectedYear}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              setReviewDate(now.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }));
                              setShowCalendarPopup(false);
                            }}
                            className="text-slate-600 dark:text-slate-400 hover:underline font-medium cursor-pointer"
                          >
                            วันนี้
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCalendarPopup(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-medium"
                          >
                            ปิด
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick preset buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">เลือกเร็ว:</span>
                  <button
                    type="button"
                    onClick={() => setReviewDate(`30 ก.ย. ${selectedYear}`)}
                    className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                  >
                    30 ก.ย. {selectedYear} (สิ้นปีงบ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDate(`31 มี.ค. ${selectedYear}`)}
                    className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                  >
                    31 มี.ค. {selectedYear} (รอบ 6 เดือน)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setReviewDate(now.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }));
                    }}
                    className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                  >
                    วันนี้
                  </button>
                  {reviewDate && (
                    <button
                      type="button"
                      onClick={() => setReviewDate('')}
                      className="px-2 py-0.5 rounded-md text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer transition-colors ml-auto"
                    >
                      ล้างค่า
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ข้อคิดเห็น / ข้อเสนอแนะการสอบทานของหน่วยตรวจสอบภายใน:
                </label>
                <textarea
                  rows="4"
                  value={reviewOpinion}
                  onChange={(e) => setReviewOpinion(e.target.value)}
                  placeholder="ระบุข้อคิดเห็น เช่น แบบ บส.1 - บส.5 จัดทำได้ครบถ้วน ถูกต้องตามเกณฑ์ มท 0805.2/ว 3482 หรือเสนอแนะการปรับปรุงมาตรการควบคุมความเสี่ยง..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                ผู้สอบทาน: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentSession?.displayName || orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setShowCalendarPopup(false);
                  setReviewDate('');
                }}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!reviewDate.trim()}
                onClick={() => handleSaveAuditReview(reviewModalDept, reviewOpinion, reviewDate)}
                className={`px-5 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all ${
                  !reviewDate.trim()
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกผลการสอบทาน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Machine Data Sharing Info Modal */}
      {showCrossMachineInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-850 dark:to-slate-850">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    คำแนะนำการเชื่อมโยงข้อมูลระหว่างเครื่อง (Data Sync)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ความเข้าใจเกี่ยวกับระบบจัดเก็บข้อมูลและการแชร์รายงาน บส.1 - บส.5
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCrossMachineInfo(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs leading-relaxed">
              {/* Question 1 */}
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5 text-sm">
                  <span>❓ ทำไมกองอื่นกรอกข้อมูลแล้ว ไม่วิ่งมาโชว์ที่เครื่อง Admin/หน่วยตรวจ ทันที?</span>
                </h4>
                <p className="text-amber-800 dark:text-amber-200/90">
                  ระบบเว็บแอปพลิเคชันนี้ทำงานด้วยสถาปัตยกรรม <strong>Local-First (Client-side Storage)</strong> ข้อมูลจะถูกจัดเก็บไว้ในหน่วยความจำของบราวเซอร์ประจำเครื่องคอมพิวเตอร์นั้นๆ (Local Storage) เพื่อความปลอดภัยสูงสุด ความรวดเร็วในการเปิดใช้งาน และสามารถทำงานได้แม้อินเทอร์เน็ตหลุด
                </p>
                <p className="text-amber-800 dark:text-amber-200/90 font-medium">
                  👉 ดังนั้น ข้อมูลที่กรอกบนคอมพิวเตอร์เครื่องหนึ่ง (เช่น PC ของกองช่าง) จึงยังไม่ถูกส่งข้ามเครือข่ายไปยังคอมพิวเตอร์เครื่องอื่นโดยตรงจนกว่าจะมีการแชร์ข้อมูล
                </p>
              </div>

              {/* Solution 1 */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5">
                <h4 className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center space-x-1.5 text-sm">
                  <span>🔄 วิธีแชร์และรวมข้อมูลข้ามเครื่อง (ทำได้ทันที ไม่ต้องตั้งค่าเซิร์ฟเวอร์)</span>
                </h4>
                <div className="space-y-2 text-indigo-900 dark:text-indigo-200/90 pl-1">
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <div>
                      <strong>แต่ละกองจัดทำรายงาน:</strong> เมื่อกรอกข้อมูลแบบ บส.1 - บส.5 เสร็จแล้ว ให้กดปุ่ม <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 border border-indigo-200 dark:border-slate-700 mx-1"><Download className="w-3 h-3 mr-0.5 text-indigo-600" />ส่งออกไฟล์ บส. กองนี้</span> ระบบจะดาวน์โหลดไฟล์ <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-indigo-700 dark:text-indigo-300">.json</code> ลงในเครื่อง
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <div>
                      <strong>ส่งไฟล์รายงาน:</strong> แต่ละกองส่งไฟล์ <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-indigo-700 dark:text-indigo-300">.json</code> นั้นให้หน่วยตรวจสอบภายใน (ผ่าน Line, อีเมล หรือ Flash drive)
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <div>
                      <strong>หน่วยตรวจสอบนำเข้าข้อมูล:</strong> หน่วยตรวจสอบเปิดระบบแล้วกดปุ่ม <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-600 font-bold text-white shadow-xs mx-1"><Upload className="w-3 h-3 mr-0.5" />นำเข้าไฟล์ บส. จากกองอื่น</span> แล้วเลือกไฟล์ที่ได้รับ ระบบจะผสานรวมข้อมูล (Merge) เข้าสู่ฐานข้อมูลเครื่องตรวจทันที โดยไม่ทับซ้อนหรือลบข้อมูลเดิมของกองอื่น
                    </div>
                  </div>
                </div>
              </div>

              {/* Solution 2 */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <h4 className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center space-x-1.5 text-sm">
                  <span>☁️ แนวทางซิงค์ออนไลน์เรียลไทม์ (Cloud Database - Supabase)</span>
                </h4>
                <p className="text-emerald-900 dark:text-emerald-200/90">
                  ระบบได้เตรียมโครงสร้างเชื่อมต่อ <strong>Supabase Cloud Database</strong> ไว้เรียบร้อยแล้ว หากหน่วยงานต้องการให้ข้อมูลทุกเครื่องเชื่อมโยงกันสดๆ อัตโนมัติโดยไม่ต้องส่งไฟล์ สามารถไปที่ <strong>&ldquo;ตั้งค่าระบบ&rdquo; &rarr; &ldquo;ฐานข้อมูลคลาวด์ (Supabase)&rdquo;</strong> แล้วกรอก URL และ Anon Key เพื่อเปิดใช้งานระบบ Real-time Sync ได้ทันที
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCrossMachineInfo(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                เข้าใจแล้ว / ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Gemini Generative AI Configuration Modal */}
      <GeminiConfigModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
      />

      {/* Reusable Elegant Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        isAlert={confirmModalConfig.isAlert}
        type={confirmModalConfig.type}
        onConfirm={confirmModalConfig.onConfirm}
        onClose={closeConfirmModal}
      />
    </div>
  );
}
