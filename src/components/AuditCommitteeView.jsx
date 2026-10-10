import React, { useState, useMemo } from 'react';
import {
  Building,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  ShieldCheck,
  UserCheck,
  Users,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Save,
  Check,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  BookOpen,
  PieChart,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDocumentToWord, exportDataToExcel } from '../utils/documentExportUtils';

export default function AuditCommitteeView({
  selectedYear = '2569',
  orgProfile = {},
  annualPlans = []
}) {
  const [activeTab, setActiveTab] = useState('evaluation'); // 'evaluation', 'meetings', 'charter', 'independence', 'qaip'

  // ==========================================
  // TAB 1: 11 DIMENSIONS SELF-EVALUATION (ส.ค. 2568 หน้า 72-77)
  // ==========================================
  const defaultEvaluations = [
    {
      id: 1,
      name: '1. องค์ประกอบและคุณสมบัติของคณะกรรมการตรวจสอบ',
      desc: 'กรรมการมีความรู้ ความสามารถ ความเป็นอิสระ และมีผู้เชี่ยวชาญด้านบัญชี/การเงินอย่างน้อย 1 คน',
      maxScore: 4,
      score: 4,
      comment: 'มีกรรมการผู้ทรงคุณวุฒิด้านบัญชีและการเงิน และมีคุณสมบัติครบถ้วนตามหลักเกณฑ์กระทรวงการคลัง'
    },
    {
      id: 2,
      name: '2. การประชุมและการปฏิบัติหน้าที่',
      desc: 'มีการประชุมอย่างน้อยปีละ 4 ครั้ง วาระการประชุมชัดเจน และมีองค์ประชุมครบถ้วนตามเกณฑ์',
      maxScore: 4,
      score: 4,
      comment: 'จัดการประชุมครบ 4 ไตรมาส และมีการจัดทำรายงานการประชุมบันทึกมติอย่างครบถ้วน'
    },
    {
      id: 3,
      name: '3. การกำกับดูแลการดำเนินงานของหน่วยงาน (Governance Oversight)',
      desc: 'สอบทานให้มีระบบการกำกับดูแลกิจการที่ดี นโยบายความโปร่งใส และการบริหารจัดการที่มีประสิทธิภาพ',
      maxScore: 4,
      score: 3,
      comment: 'มีการสอบทานแผนงานหลัก แต่อาจเพิ่มการติดตามนโยบายด้านความคุ้มค่าและเทคโนโลยีดิจิทัล'
    },
    {
      id: 4,
      name: '4. การสอบทานระบบการบริหารความเสี่ยงและการควบคุมภายใน',
      desc: 'สอบทานประสิทธิผลของการประเมินความเสี่ยงและระบบการควบคุมภายในตามมาตรฐานกระทรวงการคลัง',
      maxScore: 4,
      score: 4,
      comment: 'สอบทานรายงาน ปค.4 และ ปค.5 ของหน่วยงานครบถ้วนทุกกองสำนัก'
    },
    {
      id: 5,
      name: '5. การสอบทานรายงานทางการเงิน (Financial Reporting)',
      desc: 'สอบทานความถูกต้อง น่าเชื่อถือ และการเปิดเผยข้อมูลตามมาตรฐานการบัญชีภาครัฐ',
      maxScore: 4,
      score: 3,
      comment: 'สอบทานรายงานการเงินรายไตรมาสร่วมกับกองคลังอย่างสม่ำเสมอ'
    },
    {
      id: 6,
      name: '6. การสอบทานการปฏิบัติตามกฎหมาย ระเบียบ ข้อบังคับ (Compliance)',
      desc: 'สอบทานการปฏิบัติตามกฎหมาย ระเบียบจัดซื้อจัดจ้าง วินัยการเงินการคลัง และมติ ครม.',
      maxScore: 4,
      score: 4,
      comment: 'ให้ความสำคัญกับการตรวจสอบด้านจัดซื้อจัดจ้างและข้อบัญญัติงบประมาณรายจ่าย'
    },
    {
      id: 7,
      name: '7. การกำกับดูแลงานตรวจสอบภายใน (Internal Audit Oversight)',
      desc: 'อนุมัติกฎบัตร แผนการตรวจสอบประจำปี อัตรากำลัง งบประมาณ และความเป็นอิสระของ IA',
      maxScore: 4,
      score: 4,
      comment: 'ให้ความเห็นชอบแผนการตรวจสอบประจำปี พ.ศ. ' + selectedYear + ' และสนับสนุนทรัพยากร'
    },
    {
      id: 8,
      name: '8. การสอบทานการต่อต้านทุจริตและรายการขัดแย้งทางผลประโยชน์',
      desc: 'สอบทานมาตรการป้องกันการทุจริต การรับเรื่องร้องเรียน (Whistleblowing) และรายการทับซ้อน',
      maxScore: 4,
      score: 3,
      comment: 'มีระบบรับเรื่องร้องเรียน แต่อยู่ระหว่างพัฒนาช่องทางอิเล็กทรอนิกส์ที่ปลอดภัย'
    },
    {
      id: 9,
      name: '9. การประสานงานกับผู้สอบบัญชีภายนอก (สตง. / External Auditor)',
      desc: 'ประชุมร่วมกับผู้สอบบัญชีอย่างน้อยปีละ 1 ครั้ง และประชุมเฉพาะโดยไม่มีฝ่ายบริหาร (Closed Session)',
      maxScore: 4,
      score: 3,
      comment: 'มีการหารือข้อตรวจพบของ สตง. ในไตรมาสที่ 4 เพื่อป้องกันข้อบกพร่องซ้ำซาก'
    },
    {
      id: 10,
      name: '10. การรายงานผลต่อหัวหน้าหน่วยงานของรัฐ (Reporting to Top Management)',
      desc: 'จัดทำรายงานสรุปผลการปฏิบัติงานของคณะกรรมการตรวจสอบเสนอผู้บริหารอย่างน้อยปีละ 1 ครั้ง',
      maxScore: 4,
      score: 4,
      comment: 'จัดทำรายงานสรุปเสนอหัวหน้าหน่วยงานและเปิดเผยในรายงานประจำปี'
    },
    {
      id: 11,
      name: '11. การส่งเสริมวัฒนธรรมองค์กรและจริยธรรม (Ethics & Culture)',
      desc: 'ส่งเสริมประมวลจริยธรรม ความซื่อสัตย์สุจริต และบรรยากาศการกำกับดูแลที่เข้มแข็ง (Tone at the Top)',
      maxScore: 4,
      score: 3,
      comment: 'ส่งเสริมการอบรมคุณธรรม จริยธรรม และการประเมิน ITA ประจำปี'
    }
  ];

  const [evaluations, setEvaluations] = useState(() => {
    try {
      const saved = localStorage.getItem(`ia_audit_comm_eval_${selectedYear}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 11) return parsed;
      }
    } catch (_) {}
    return defaultEvaluations;
  });

  const [evaluatorName, setEvaluatorName] = useState(() => {
    return localStorage.getItem(`ia_audit_comm_evaluator_${selectedYear}`) || 'ประธานคณะกรรมการตรวจสอบ';
  });

  const handleScoreChange = (id, newScore) => {
    const updated = evaluations.map((item) =>
      item.id === id ? { ...item, score: Number(newScore) } : item
    );
    setEvaluations(updated);
    localStorage.setItem(`ia_audit_comm_eval_${selectedYear}`, JSON.stringify(updated));
  };

  const handleCommentChange = (id, newComment) => {
    const updated = evaluations.map((item) =>
      item.id === id ? { ...item, comment: newComment } : item
    );
    setEvaluations(updated);
    localStorage.setItem(`ia_audit_comm_eval_${selectedYear}`, JSON.stringify(updated));
  };

  const totalScore = useMemo(() => {
    return evaluations.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
  }, [evaluations]);

  const maxTotalScore = 44; // 11 dimensions * 4 max
  const scorePercent = Math.round((totalScore / maxTotalScore) * 100);

  const maturityInfo = useMemo(() => {
    if (scorePercent >= 85) {
      return {
        level: 'ระดับดีเลิศ / โดดเด่น (Exemplary)',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        desc: 'คณะกรรมการตรวจสอบปฏิบัติหน้าที่ครบถ้วนตามหลักเกณฑ์กระทรวงการคลัง และส่งเสริมการกำกับดูแลกิจการที่ดีอย่างมีประสิทธิภาพสูงสุด'
      };
    } else if (scorePercent >= 70) {
      return {
        level: 'ระดับดี / เป็นไปตามมาตรฐาน (Standard Compliant)',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        desc: 'คณะกรรมการตรวจสอบปฏิบัติหน้าที่สอดคล้องตามมาตรฐานหลักเกณฑ์อย่างเพียงพอ และมีแนวทางพัฒนาอย่างต่อเนื่อง'
      };
    } else if (scorePercent >= 55) {
      return {
        level: 'ระดับพอใช้ / มีการพัฒนา (Developing)',
        badgeColor: 'bg-amber-200/70 text-amber-950 border-amber-400 dark:bg-amber-900/60 dark:text-amber-200',
        desc: 'ปฏิบัติหน้าที่ตามเกณฑ์พื้นฐาน แต่ยังมีบางด้านที่ต้องพัฒนาเพิ่มเติม เช่น การประสานงานกับผู้สอบบัญชีภายนอกหรือระบบป้องกันทุจริต'
      };
    } else {
      return {
        level: 'ระดับต้องปรับปรุง (Needs Improvement)',
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300',
        desc: 'มีคะแนนประเมินต่ำกว่าเกณฑ์มาตรฐาน ควรทบทวนบทบาทหน้าที่และการประชุมตามคู่มือกรมบัญชีกลาง สิงหาคม ๒๕๖๘ โดยด่วน'
      };
    }
  }, [scorePercent]);

  // ==========================================
  // TAB 2: 4-QUARTER MEETING CALENDAR & 40 CHECKLIST ITEMS
  // ==========================================
  const defaultQuarters = [
    {
      quarterId: 'Q1',
      quarterName: 'ไตรมาสที่ 1 (ตุลาคม - ธันวาคม)',
      theme: 'การวางแผนและการเปิดปีงบประมาณ',
      closedSession: false,
      items: [
        { id: 'Q1-01', text: 'ทบทวนและเสนอขออนุมัติกฎบัตรคณะกรรมการตรวจสอบประจำปี', done: true },
        { id: 'Q1-02', text: 'พิจารณาให้ความเห็นชอบกฎบัตรหน่วยตรวจสอบภายใน', done: true },
        { id: 'Q1-03', text: 'พิจารณาให้ความเห็นชอบแผนการตรวจสอบประจำปี พ.ศ. ' + selectedYear + ' และแผน 3 ปี', done: true },
        { id: 'Q1-04', text: 'สอบทานความเพียงพอของอัตรากำลังและงบประมาณหน่วยตรวจสอบภายใน', done: true },
        { id: 'Q1-05', text: 'รับฟังแผนการสอบบัญชีประจำปีของผู้สอบบัญชีภายนอก (สตง.)', done: false },
        { id: 'Q1-06', text: 'สอบทานรายงานการเงินประจำปีงบประมาณก่อนหน้า และหมายเหตุประกอบงบ', done: true },
        { id: 'Q1-07', text: 'ติดตามรายงานข้อสังเกตและข้อเสนอแนะของผู้สอบบัญชี สตง. ล่าสุด', done: false },
        { id: 'Q1-08', text: 'ลงนามในแบบยืนยันความเป็นอิสระและไม่มีผลประโยชน์ทับซ้อนประจำปี', done: true },
        { id: 'Q1-09', text: 'กำหนดแผนและปฏิทินการประชุมของคณะกรรมการตรวจสอบตลอดทั้งปีงบประมาณ', done: true },
        { id: 'Q1-10', text: 'รายงานสรุปผลการประชุมไตรมาสที่ 1 ต่อหัวหน้าหน่วยงานของรัฐ', done: true }
      ]
    },
    {
      quarterId: 'Q2',
      quarterName: 'ไตรมาสที่ 2 (มกราคม - มีนาคม)',
      theme: 'การสอบทานระบบควบคุมภายในและรายงานการเงินงวดแรก',
      closedSession: false,
      items: [
        { id: 'Q2-01', text: 'สอบทานรายงานการเงินและรายงานการรับจ่ายเงินประจำไตรมาส', done: true },
        { id: 'Q2-02', text: 'รับทราบรายงานผลการตรวจสอบภายในรอบไตรมาสที่ 1-2', done: true },
        { id: 'Q2-03', text: 'สอบทานรายงานการประเมินการควบคุมภายในระดับหน่วยงาน (แบบ ปค.4 และ ปค.5)', done: true },
        { id: 'Q2-04', text: 'ติดตามความคืบหน้าการปรับปรุงระบบควบคุมภายในตามแผนที่กำหนดไว้', done: false },
        { id: 'Q2-05', text: 'สอบทานการปฏิบัติตามกฎหมายและระเบียบด้านการจัดซื้อจัดจ้างที่มีความเสี่ยงสูง', done: true },
        { id: 'Q2-06', text: 'ติดตามข้อร้องเรียนหรือประเด็นที่อาจมีการทุจริตประพฤติมิชอบ', done: false },
        { id: 'Q2-07', text: 'สอบทานความคืบหน้าการดำเนินการตามข้อเสนอแนะค้างตรวจ (ทะเบียนคุม 30 วัน)', done: true },
        { id: 'Q2-08', text: 'ประเมินความเสี่ยงอุบัติใหม่ (Emerging Risks) ที่อาจกระทบเป้าหมาย อปท.', done: false },
        { id: 'Q2-09', text: 'ให้ข้อเสนอแนะเชิงป้องกันแก่ฝ่ายบริหารในกระบวนการทำงานที่พบข้อบกพร่องซ้ำซาก', done: true },
        { id: 'Q2-10', text: 'รายงานสรุปผลการประชุมไตรมาสที่ 2 ต่อหัวหน้าหน่วยงานของรัฐ', done: false }
      ]
    },
    {
      quarterId: 'Q3',
      quarterName: 'ไตรมาสที่ 3 (เมษายน - มิถุนายน)',
      theme: 'การสอบทานการบริหารความเสี่ยงและมาตรการป้องกันทุจริต',
      closedSession: false,
      items: [
        { id: 'Q3-01', text: 'สอบทานรายงานความก้าวหน้าการบริหารจัดการความเสี่ยงองค์กร (ERM)', done: false },
        { id: 'Q3-02', text: 'รับทราบรายงานผลการตรวจสอบภายในในภารกิจตามแผนประจำปี', done: true },
        { id: 'Q3-03', text: 'สอบทานรายการที่อาจมีความขัดแย้งทางผลประโยชน์ (Conflict of Interest)', done: false },
        { id: 'Q3-04', text: 'ติดตามการขับเคลื่อนมาตรการป้องกันการทุจริตและการประเมินคุณธรรมและความโปร่งใส (ITA)', done: true },
        { id: 'Q3-05', text: 'ติดตามการดำเนินการทางวินัย/ละเมิด/ชดใช้เงินตามข้อทักท้วง (ถ้ามี)', done: false },
        { id: 'Q3-06', text: 'สอบทานความมั่นคงปลอดภัยของระบบสารสนเทศและการคุ้มครองข้อมูลส่วนบุคคล (PDPA)', done: false },
        { id: 'Q3-07', text: 'สอบทานประสิทธิภาพการเบิกจ่ายงบประมาณโครงการลงทุนและข้อบัญญัติ', done: true },
        { id: 'Q3-08', text: 'ให้คำปรึกษาแก่ผู้ตรวจสอบภายในด้านเทคนิคการตรวจสอบเชิงลึก', done: true },
        { id: 'Q3-09', text: 'ทบทวนความคืบหน้าของโครงการตรวจสอบที่ล่าช้ากว่าแผนงาน', done: false },
        { id: 'Q3-10', text: 'รายงานสรุปผลการประชุมไตรมาสที่ 3 ต่อหัวหน้าหน่วยงานของรัฐ', done: false }
      ]
    },
    {
      quarterId: 'Q4',
      quarterName: 'ไตรมาสที่ 4 (กรกฎาคม - กันยายน)',
      theme: 'Closed Session, ประเมินตนเอง 11 ด้าน และรายงานประจำปี',
      closedSession: true,
      items: [
        { id: 'Q4-01', text: 'ประชุมเฉพาะร่วมกับผู้ตรวจสอบภายในโดยไม่มีฝ่ายบริหาร (Closed Session with IA)', done: false },
        { id: 'Q4-02', text: 'ประชุมเฉพาะร่วมกับผู้สอบบัญชี สตง. โดยไม่มีฝ่ายบริหาร (Closed Session with External Auditor)', done: false },
        { id: 'Q4-03', text: 'รับทราบรายงานสรุปผลการตรวจสอบภายในรอบปีงบประมาณ พ.ศ. ' + selectedYear, done: false },
        { id: 'Q4-04', text: 'ประเมินผลการปฏิบัติงานของหัวหน้าหน่วยตรวจสอบภายใน (ตามคู่มือ ส.ค. 2568)', done: false },
        { id: 'Q4-05', text: 'ประเมินผลการปฏิบัติงานตนเองของคณะกรรมการตรวจสอบ 11 ด้าน (Self-Evaluation)', done: true },
        { id: 'Q4-06', text: 'สอบทานความพร้อมของระบบการประกันและปรับปรุงคุณภาพงานตรวจสอบ (QAIP)', done: false },
        { id: 'Q4-07', text: 'สรุปสถานะการปฏิบัติตามข้อเสนอแนะรอบปี และข้อตรวจพบที่ยังแก้ไขไม่แล้วเสร็จ', done: false },
        { id: 'Q4-08', text: 'จัดทำร่างรายงานผลการปฏิบัติงานของคณะกรรมการตรวจสอบประจำปี เสนอหัวหน้าหน่วยงาน', done: false },
        { id: 'Q4-09', text: 'เปิดเผยรายงานผลการปฏิบัติงานของคณะกรรมการตรวจสอบในรายงานประจำปีของหน่วยงาน', done: false },
        { id: 'Q4-10', text: 'พิจารณาเตรียมการกรอบทิศทางและประเด็นความเสี่ยงสำหรับปีงบประมาณถัดไป', done: false }
      ]
    }
  ];

  const [quarters, setQuarters] = useState(() => {
    try {
      const saved = localStorage.getItem(`ia_audit_comm_quarters_${selectedYear}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed;
      }
    } catch (_) {}
    return defaultQuarters;
  });

  const handleToggleChecklist = (qId, itemId) => {
    const updated = quarters.map((q) => {
      if (q.quarterId !== qId) return q;
      return {
        ...q,
        items: q.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it))
      };
    });
    setQuarters(updated);
    localStorage.setItem(`ia_audit_comm_quarters_${selectedYear}`, JSON.stringify(updated));
  };

  const totalChecklistItems = 40;
  const completedChecklistItems = quarters.reduce(
    (acc, q) => acc + q.items.filter((i) => i.done).length,
    0
  );

  // ==========================================
  // TAB 3: INDEPENDENCE & CONFLICT OF INTEREST
  // ==========================================
  const defaultMembers = [
    {
      id: 'MB-01',
      name: 'นายเกียรติศักดิ์ บริสุทธิ์',
      position: 'ประธานคณะกรรมการตรวจสอบ',
      qualification: 'อดีตรองอธิบดี / ผู้ทรงคุณวุฒิด้านการบริหารการคลังภาครัฐ',
      isAccountingExpert: false,
      signedDate: `${selectedYear}-10-15`,
      status: 'signed'
    },
    {
      id: 'MB-02',
      name: 'นางสาววิภาดา บัญชีทอง',
      position: 'กรรมการตรวจสอบ (ผู้เชี่ยวชาญด้านบัญชีและการเงิน)',
      qualification: 'ผู้สอบบัญชีรับอนุญาต (CPA) / อาจารย์พิเศษสาขาการบัญชี',
      isAccountingExpert: true,
      signedDate: `${selectedYear}-10-15`,
      status: 'signed'
    },
    {
      id: 'MB-03',
      name: 'นายสมบัติ นิติกรชำนาญ',
      position: 'กรรมการตรวจสอบ',
      qualification: 'ผู้ทรงคุณวุฒิด้านกฎหมายมหาชนและการจัดซื้อจัดจ้างภาครัฐ',
      isAccountingExpert: false,
      signedDate: `${selectedYear}-10-18`,
      status: 'signed'
    },
    {
      id: 'MB-04',
      name: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน',
      position: 'เลขานุการคณะกรรมการตรวจสอบ (หัวหน้าหน่วยตรวจสอบภายใน)',
      qualification: orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายในชำนาญการ',
      isAccountingExpert: false,
      signedDate: `${selectedYear}-10-15`,
      status: 'signed'
    }
  ];

  const [members, setMembers] = useState(() => {
    try {
      const saved = localStorage.getItem(`ia_audit_comm_members_${selectedYear}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return defaultMembers;
  });

  const handleDownloadWord = () => {
    const orgName = orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น';
    const totalScore = evaluations.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const maxScore = evaluations.reduce((acc, curr) => acc + (curr.maxScore || 4), 0);
    const percent = Math.round((totalScore / maxScore) * 100);

    const bodyContent = `
      <div style="text-align: center; margin-bottom: 16pt; font-family: 'TH Sarabun PSK';">
        <p style="margin: 0; font-size: 20pt; font-weight: bold;">รายงานผลการประเมินตนเองของคณะกรรมการตรวจสอบ (Audit Committee Self-Evaluation)</p>
        <p style="margin: 4pt 0 0 0; font-size: 16pt; font-weight: bold;">${orgName}</p>
        <p style="margin: 2pt 0 0 0; font-size: 16pt;">ประจำปีงบประมาณ พ.ศ. ${selectedYear} (ตามคู่มือกระทรวงการคลัง สิงหาคม ๒๕๖๘)</p>
      </div>
      <div style="border-top: 1.5pt solid black; margin-bottom: 14pt;"></div>

      <p style="font-size: 16pt; font-family: 'TH Sarabun PSK'; margin-bottom: 8pt;">
        <strong>สรุปผลการประเมินภาพรวม:</strong> ได้รับคะแนนรวม <strong>${totalScore}</strong> จากคะแนนเต็ม <strong>${maxScore}</strong> คิดเป็นร้อยละ <strong>${percent}%</strong> 
        ระดับผลการประเมิน: <strong>${percent >= 85 ? 'ดีเยี่ยม' : percent >= 70 ? 'ดี' : percent >= 50 ? 'พอใช้' : 'ต้องปรับปรุง'}</strong>
      </p>

      <table style="width: 100%; border-collapse: collapse; border: 1pt solid black; font-size: 14pt; font-family: 'TH Sarabun PSK'; margin-bottom: 16pt;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1pt solid black; padding: 5pt; width: 6%; text-align: center;">ลำดับ</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 34%; text-align: center;">ด้านการประเมิน</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 10%; text-align: center;">คะแนนเต็ม</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 10%; text-align: center;">ได้</th>
            <th style="border: 1pt solid black; padding: 5pt; width: 40%; text-align: center;">หลักฐาน / ข้อเสนอแนะพัฒนา</th>
          </tr>
        </thead>
        <tbody>
          ${evaluations
            .map(
              (e) => `
            <tr>
              <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${e.id}</td>
              <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;"><strong>${e.name}</strong><br/><span style="color:#555; font-size:12pt;">${e.desc}</span></td>
              <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${e.maxScore}</td>
              <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top; font-weight: bold;">${e.score}</td>
              <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;">หลักฐาน: ${e.evidence || '-'}<br/>ข้อเสนอแนะ: ${e.improvement || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <table style="width: 100%; border: none; margin-top: 30pt; font-size: 16pt; font-family: 'TH Sarabun PSK';">
        <tr>
          <td style="width: 50%;"></td>
          <td style="width: 50%; text-align: center;">
            <p style="margin: 0;">(ลงชื่อ)........................................................</p>
            <p style="margin: 4pt 0 0 0; font-weight: bold;">(${evaluatorName})</p>
            <p style="margin: 2pt 0 0 0;">ประธานคณะกรรมการตรวจสอบ ${orgName}</p>
          </td>
        </tr>
      </table>
    `;

    exportDocumentToWord(bodyContent, `รายงานการประเมินตนเองคณะกรรมการตรวจสอบ_${selectedYear}.doc`, 'รายงานผลการประเมินตนเองคณะกรรมการตรวจสอบ');
  };

  const handleDownloadExcel = () => {
    const headers = [
      'ลำดับ',
      'ด้านการประเมินผลการปฏิบัติงาน',
      'คำอธิบายเกณฑ์มาตรฐาน',
      'คะแนนเต็ม',
      'คะแนนที่ได้',
      'หลักฐานเชิงประจักษ์',
      'ข้อเสนอแนะเพื่อการพัฒนา'
    ];
    const rows = evaluations.map((e) => [
      e.id,
      e.name,
      e.desc,
      e.maxScore,
      e.score,
      e.evidence || '',
      e.improvement || ''
    ]);
    exportDataToExcel('ประเมินตนเองคณะกรรมการตรวจสอบ', [headers, ...rows], `Audit_Committee_Evaluation_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
                <Building className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
                <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>ผู้ตรวจสอบ: {orgProfile?.auditorName || 'หน่วยตรวจสอบภายใน'}</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>ปีงบประมาณ พ.ศ. {selectedYear}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              คณะกรรมการตรวจสอบ (Audit Committee Portal)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <OfficialDocActionToolbar
              onDownloadWord={handleDownloadWord}
              onDownloadExcel={handleDownloadExcel}
              onPrint={() => window.print()}
              wordTooltip="ดาวน์โหลดรายงานผลการประเมินตนเองคณะกรรมการตรวจสอบเป็นไฟล์ Word (.doc)"
              excelTooltip="ส่งออกตารางการประเมินตนเอง 11 ด้านเป็นไฟล์ Excel (.xlsx)"
              printTooltip="พิมพ์รายงานผลการประเมินตนเอง / กฎบัตร / บันทึกเป็น PDF"
            />
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-2 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-wrap gap-1.5 print:hidden">
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'evaluation'
              ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-transparent'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>แบบประเมินผลตนเอง 11 ด้าน (คู่มือ ส.ค. 68)</span>
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'meetings'
              ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-transparent'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>ปฏิทิน 4 ไตรมาส & Checklist 40 ข้อ</span>
        </button>

        <button
          onClick={() => setActiveTab('charter')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'charter'
              ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-transparent'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>กฎบัตรคณะกรรมการตรวจสอบ (Charter)</span>
        </button>

        <button
          onClick={() => setActiveTab('independence')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'independence'
              ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-transparent'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>แบบยืนยันความเป็นอิสระ & ผลประโยชน์ทับซ้อน</span>
        </button>

        <button
          onClick={() => setActiveTab('qaip')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'qaip'
              ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/80 border border-transparent'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>การประกันและปรับปรุงคุณภาพงานตรวจสอบ (QAIP)</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* VIEW: TAB 1 - 11 DIMENSIONS SELF-EVALUATION */}
      {/* ==================================================== */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          {/* Summary Score Metric Card */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  ผลการประเมินตนเองภาพรวม (11 มิติ)
                </span>
                <div className="mt-2 flex items-baseline space-x-3">
                  <span className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-stone-100">
                    {totalScore}
                  </span>
                  <span className="text-base text-stone-400 font-bold">/ {maxTotalScore} คะแนน</span>
                  <span className="text-xl font-extrabold text-amber-800 dark:text-amber-300">
                    ({scorePercent}%)
                  </span>
                </div>
                <div className="w-full bg-stone-100 dark:bg-stone-800 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
              </div>

              <div className="md:col-span-2 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-300">ระดับวุฒิภาวะ:</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${maturityInfo.badgeColor}`}>
                    {maturityInfo.level}
                  </span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {maturityInfo.desc}
                </p>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                  * อ้างอิงเกณฑ์คะแนนตามภาคผนวก ข ของคู่มือกรมบัญชีกลาง สิงหาคม ๒๕๖๘ (ระดับคะแนน 4=ดีมาก, 3=ดี, 2=พอใช้, 1=ต้องปรับปรุง)
                </div>
              </div>
            </div>
          </div>

          {/* Table of 11 Dimensions */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  แบบประเมินผลการปฏิบัติงานของคณะกรรมการตรวจสอบ ประจำปีงบประมาณ พ.ศ. {selectedYear}
                </h2>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  หน่วยงาน: {orgProfile?.name || 'อปท.'} • ผู้ให้การประเมิน: {evaluatorName}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-stone-500">ผู้ประเมิน:</span>
                <input
                  type="text"
                  value={evaluatorName}
                  onChange={(e) => {
                    setEvaluatorName(e.target.value);
                    localStorage.setItem(`ia_audit_comm_evaluator_${selectedYear}`, e.target.value);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-700">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                    <th className="py-3 px-3">มิติการประเมิน (11 ด้าน)</th>
                    <th className="py-3 px-3 w-36 text-center">ระดับคะแนน (1-4)</th>
                    <th className="py-3 px-3">คำอธิบายประกอบการประเมิน / ข้อเสนอแนะเพื่อการพัฒนา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {evaluations.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-stone-400">{item.id}</td>
                      <td className="py-3 px-3 max-w-sm space-y-0.5">
                        <div className="font-bold text-stone-900 dark:text-stone-100">{item.name}</div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">{item.desc}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          value={item.score}
                          onChange={(e) => handleScoreChange(item.id, e.target.value)}
                          className={`font-bold text-xs p-1.5 rounded-lg border cursor-pointer ${
                            item.score === 4
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : item.score === 3
                              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          <option value={4}>4 - ดีมาก</option>
                          <option value={3}>3 - ดี</option>
                          <option value={2}>2 - พอใช้</option>
                          <option value={1}>1 - ปรับปรุง</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <textarea
                          rows={2}
                          value={item.comment}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          className="w-full text-[11px] p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-1 focus:ring-amber-500 outline-none leading-relaxed print:border-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: TAB 2 - 4-QUARTER MEETINGS & 40 CHECKLIST ITEMS */}
      {/* ==================================================== */}
      {activeTab === 'meetings' && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                ความคืบหน้าการปฏิบัติงานตามเกณฑ์ 4 ไตรมาส (Checklist 40 ข้อ)
              </span>
              <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <span>{completedChecklistItems} จาก {totalChecklistItems} ข้อเสร็จสิ้น</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300">
                  {Math.round((completedChecklistItems / totalChecklistItems) * 100)}%
                </span>
              </div>
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
              * เป็นรายการตรวจสอบมาตรฐานตามคู่มือกรมบัญชีกลาง สิงหาคม ๒๕๖๘ เพื่อให้มั่นใจว่าคณะกรรมการตรวจสอบได้ปฏิบัติหน้าที่ครบถ้วนในแต่ละไตรมาส
            </div>
          </div>

          {/* 4 Quarter Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quarters.map((q) => {
              const qDoneCount = q.items.filter((i) => i.done).length;
              const qPercent = Math.round((qDoneCount / q.items.length) * 100);

              return (
                <div
                  key={q.quarterId}
                  className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black bg-stone-900 text-amber-300 px-2 py-0.5 rounded-md">
                          {q.quarterId}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                          {q.quarterName}
                        </h3>
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                        ประเด็นหลัก: {q.theme}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        {qDoneCount}/{q.items.length} ({qPercent}%)
                      </span>
                    </div>
                  </div>

                  {q.closedSession && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-950 dark:text-amber-200 flex items-center space-x-2">
                      <span className="text-base">🔒</span>
                      <span className="font-semibold">
                        มีวาระพิเศษ Closed Session: ประชุมเฉพาะร่วมกับผู้ตรวจสอบภายในและ สตง. โดยไม่มีฝ่ายบริหาร (ตามคู่มือหน้า 35)
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {q.items.map((it) => (
                      <div
                        key={it.id}
                        onClick={() => handleToggleChecklist(q.quarterId, it.id)}
                        className={`p-2.5 rounded-xl border text-xs transition-all flex items-start space-x-2.5 cursor-pointer select-none ${
                          it.done
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-stone-900 dark:text-stone-100'
                            : 'bg-stone-50/50 dark:bg-stone-850/40 border-stone-200/60 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100/60'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            it.done
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                          }`}
                        >
                          {it.done && <Check className="w-3 h-3" />}
                        </div>
                        <span className={`leading-relaxed ${it.done ? 'font-medium' : ''}`}>
                          {it.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: TAB 3 - CHARTER (กฎบัตร) */}
      {/* ==================================================== */}
      {activeTab === 'charter' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-12 border border-stone-200/80 dark:border-stone-800 shadow-xs max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
          <div className="text-center space-y-2 border-b border-stone-200 dark:border-stone-700 pb-5">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
              กฎบัตรคณะกรรมการตรวจสอบ (Audit Committee Charter)
            </h2>
            <div className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
              {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} • ประจำปีงบประมาณ พ.ศ. {selectedYear}
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-400">
              (จัดทำขึ้นตามแนวทางคู่มือคณะกรรมการตรวจสอบสำหรับหน่วยงานของรัฐ กรมบัญชีกลาง สิงหาคม ๒๕๖๘ ภาคผนวก ก)
            </div>
          </div>

          <div className="text-xs space-y-6 text-stone-800 dark:text-stone-200 leading-relaxed text-justify">
            <section className="space-y-2">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                1. วัตถุประสงค์ (Objectives)
              </h3>
              <p className="indent-8">
                กฎบัตรฉบับนี้จัดทำขึ้นเพื่อกำหนดกรอบการปฏิบัติหน้าที่ ขอบเขตอำนาจ และความรับผิดชอบของคณะกรรมการตรวจสอบของ {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} เพื่อช่วยให้การปฏิบัติหน้าที่เป็นไปอย่างมีประสิทธิภาพ เป็นอิสระ และสนับสนุนให้หน่วยงานมีระบบการกำกับดูแลกิจการที่ดี มีการบริหารความเสี่ยงและการควบคุมภายในที่เหมาะสม ตลอดจนรายงานทางการเงินที่มีความถูกต้อง น่าเชื่อถือ และสอดคล้องตามกฎหมาย ระเบียบ ข้อบังคับที่เกี่ยวข้อง
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                2. องค์ประกอบและคุณสมบัติ (Composition & Qualifications)
              </h3>
              <p className="indent-8">
                คณะกรรมการตรวจสอบประกอบด้วย กรรมการจำนวนไม่น้อยกว่า 3 คน แต่ไม่เกิน 5 คน โดยได้รับการแต่งตั้งจากผู้มีอำนาจแต่งตั้งตามกฎหมาย ทั้งนี้ กรรมการตรวจสอบอย่างน้อย 1 คน จะต้องมีความรู้ ความชำนาญ และประสบการณ์ด้านการบัญชีหรือการเงินอย่างเพียงพอที่จะสามารถสอบทานความน่าเชื่อถือของรายงานทางการเงินได้ และกรรมการทุกคนต้องมีความเป็นอิสระ ปราศจากความขัดแย้งทางผลประโยชน์
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                3. อำนาจหน้าที่และความรับผิดชอบ (Duties & Responsibilities)
              </h3>
              <p className="indent-8">
                คณะกรรมการตรวจสอบมีหน้าที่และความรับผิดชอบหลัก 8 มิติ ดังต่อไปนี้:
              </p>
              <ul className="space-y-2 pl-6 list-disc">
                <li><strong>การสอบทานรายงานทางการเงิน:</strong> สอบทานให้หน่วยงานมีรายงานทางการเงินที่ถูกต้อง โปร่งใส เป็นไปตามมาตรฐานการบัญชีภาครัฐ และเปิดเผยข้อมูลอย่างเพียงพอ</li>
                <li><strong>การสอบทานระบบการควบคุมภายในและการบริหารความเสี่ยง:</strong> สอบทานให้มั่นใจว่าหน่วยงานมีระบบการควบคุมภายในและการบริหารความเสี่ยงที่เหมาะสม มีประสิทธิผล และครอบคลุมความเสี่ยงสำคัญทุกมิติ</li>
                <li><strong>การสอบทานการปฏิบัติตามกฎหมายและระเบียบ:</strong> สอบทานการปฏิบัติตามพระราชบัญญัติวินัยการเงินการคลังของรัฐ ระเบียบกระทรวงมหาดไทย ระเบียบจัดซื้อจัดจ้าง และกฎหมายอื่นที่เกี่ยวข้อง</li>
                <li><strong>การกำกับดูแลงานตรวจสอบภายใน:</strong> พิจารณาให้ความเห็นชอบกฎบัตรการตรวจสอบภายใน แผนการตรวจสอบประจำปี ความเพียงพอของอัตรากำลังและงบประมาณ ตลอดจนดูแลให้หน่วยตรวจสอบภายในมีความเป็นอิสระในการปฏิบัติงาน</li>
                <li><strong>การสอบทานรายการที่อาจมีความขัดแย้งทางผลประโยชน์:</strong> สอบทานและให้ข้อเสนอแนะในการป้องกันการขัดกันแห่งผลประโยชน์ และสนับสนุนมาตรการต่อต้านการทุจริตประพฤติมิชอบ</li>
                <li><strong>การประสานงานกับผู้สอบบัญชีภายนอก (สตง.):</strong> ประสานงานและร่วมประชุมกับสำนักงานการตรวจเงินแผ่นดินอย่างสม่ำเสมอ และจัดให้มีการประชุมเฉพาะโดยไม่มีฝ่ายบริหารอย่างน้อยปีละ 1 ครั้ง</li>
                <li><strong>การรายงานผล:</strong> จัดทำรายงานผลการปฏิบัติงานของคณะกรรมการตรวจสอบเสนอต่อหัวหน้าหน่วยงานของรัฐ และเปิดเผยไว้ในรายงานประจำปี</li>
                <li><strong>การประเมินผลการปฏิบัติงานตนเอง:</strong> ดำเนินการประเมินผลการปฏิบัติงานของคณะกรรมการตรวจสอบเป็นประจำทุกปี (11 ด้าน) และนำผลการประเมินไปปรับปรุงการปฏิบัติงานให้ดียิ่งขึ้น</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                4. การประชุม (Meetings)
              </h3>
              <p className="indent-8">
                คณะกรรมการตรวจสอบต้องจัดให้มีการประชุมอย่างน้อยปีละ 4 ครั้ง (ไตรมาสละ 1 ครั้ง) และสามารถเรียกประชุมพิเศษเพิ่มเติมได้ตามความจำเป็น องค์ประชุมต้องประกอบด้วยกรรมการตรวจสอบไม่น้อยกว่ากึ่งหนึ่งของจำนวนกรรมการทั้งหมด โดยประธานคณะกรรมการตรวจสอบทำหน้าที่เป็นประธานในที่ประชุม
              </p>
            </section>
          </div>

          <div className="pt-8 border-t border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row justify-between items-center text-xs text-stone-500 gap-4">
            <div>
              ทบทวนและให้ความเห็นชอบเมื่อวันที่ ๑ ตุลาคม พ.ศ. {selectedYear}
            </div>
            <div className="text-center font-bold text-stone-800 dark:text-stone-200">
              (ลงชื่อ)........................................................<br />
              (นายเกียรติศักดิ์ บริสุทธิ์)<br />
              ประธานคณะกรรมการตรวจสอบ
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: TAB 4 - INDEPENDENCE DECLARATION */}
      {/* ==================================================== */}
      {activeTab === 'independence' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                แบบยืนยันความเป็นอิสระและไม่มีผลประโยชน์ทับซ้อน (Independence Declaration)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                ตามหลักเกณฑ์กระทรวงการคลังฯ และคู่มือกรมบัญชีกลาง สิงหาคม ๒๕๖๘ กรรมการตรวจสอบทุกคนต้องลงนามยืนยันความเป็นอิสระทุกปีงบประมาณ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-750 bg-stone-50/50 dark:bg-stone-850/50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                        {m.name}
                      </div>
                      <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                        {m.position}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {m.qualification}
                      </div>
                    </div>
                    {m.isAccountingExpert && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 shrink-0">
                        ผู้เชี่ยวชาญบัญชี/การเงิน
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-750 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ลงนามยืนยันแล้ว ({m.signedDate})</span>
                    </span>
                    <button
                      onClick={() => alert(`ยืนยันการบันทึกสถานะของ ${m.name} เรียบร้อยแล้ว`)}
                      className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
                    >
                      ดูแบบลงนาม
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: TAB 5 - QAIP */}
      {/* ==================================================== */}
      {activeTab === 'qaip' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
              การประกันและปรับปรุงคุณภาพงานตรวจสอบภายใน (QAIP)
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              ตามหลักเกณฑ์ปฏิบัติการตรวจสอบภายในสำหรับหน่วยงานของรัฐ พ.ศ. ๒๕๖๑ ข้อ ๒๘ และมาตรฐานสากล IIA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔍</span>
                <h4 className="font-bold text-sm text-amber-950 dark:text-amber-200">
                  1. การประเมินภายใน (Internal Assessment)
                </h4>
              </div>
              <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-2 pl-4 list-disc">
                <li><strong>การติดตามอย่างต่อเนื่อง (Ongoing Monitoring):</strong> สอบทานกระดาษทำการทุกโครงการโดยหัวหน้างานตรวจสอบ</li>
                <li><strong>การประเมินตนเองเป็นระยะ (Periodic Self-Assessment):</strong> ประเมินการปฏิบัติตามมาตรฐานสากลทุกสิ้นปีงบประมาณ</li>
                <li><strong>แบบประเมินความพึงพอใจของหน่วยรับตรวจ:</strong> เก็บแบบสำรวจหลังการปิดตรวจทุกโครงการ</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🌐</span>
                <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                  2. การประเมินภายนอก (External Assessment)
                </h4>
              </div>
              <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-2 pl-4 list-disc">
                <li><strong>รอบการประเมิน:</strong> อย่างน้อย 1 ครั้งในทุก 5 ปี โดยผู้ประเมินอิสระที่มีคุณสมบัติเหมาะสมจากภายนอก</li>
                <li><strong>หน่วยงานที่กำกับ:</strong> กรมบัญชีกลาง / สมาคมผู้ตรวจสอบภายในแห่งประเทศไทย (IIAT)</li>
                <li><strong>สถานะปัจจุบัน:</strong> อยู่ระหว่างเตรียมความพร้อมด้านเอกสารเชิงประจักษ์และการจัดทำแผนพัฒนาคุณภาพ</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
