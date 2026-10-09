import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  Plus,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Building,
  Calendar,
  UserCheck,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Info,
  Award
} from 'lucide-react';
import { exportWorkingPaperToExcel } from '../utils/exportExcel';
import { DLA_CORE_WORKFLOWS_6 } from '../data/dlaStandardTemplates';

export default function ExecutionView({
  workingPapers = [],
  setWorkingPapers,
  selectedWp,
  setSelectedWp,
  orgProfile,
  selectedYear = '2569',
  engagementPlans = [],
  onNavigateToTab
}) {
  const currentWp = workingPapers.find((w) => w.id === selectedWp) || workingPapers[0] || {
    id: 'WP-EMPTY',
    topic: 'ไม่มีกระดาษทำการ',
    department: 'หน่วยรับตรวจ',
    checklist: [],
    samples: [],
    finding: {}
  };

  // Sync selectedWp if not in workingPapers
  useEffect(() => {
    if (workingPapers.length > 0 && !workingPapers.some((w) => w.id === selectedWp)) {
      setSelectedWp(workingPapers[0].id);
    }
  }, [workingPapers, selectedWp, setSelectedWp]);

  const isSubsidyWp = currentWp.id?.startsWith('WP-SUBSIDY');
  const docNoLabel = isSubsidyWp ? 'เลขที่โครงการ / บันทึกข้อตกลง' : 'เลขที่เอกสาร / ฎีกา';
  const payeeLabel = isSubsidyWp ? 'หน่วยงาน / องค์กรที่ขอรับเงินอุดหนุน' : 'ผู้รับเงิน / คู่สัญญา';
  const amountLabel = isSubsidyWp ? 'วงเงินอุดหนุน (บาท)' : 'จำนวนเงิน (บาท)';

  const [showAddSample, setShowAddSample] = useState(false);
  const [expandedGuidance, setExpandedGuidance] = useState({});
  const [autoFindingToast, setAutoFindingToast] = useState('');

  const [newSample, setNewSample] = useState({
    docNo: '',
    date: '',
    payee: '',
    amount: '',
    testResult: 'ปกติ',
    note: ''
  });

  const toggleGuidance = (id) => {
    setExpandedGuidance((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllGuidance = () => {
    const hasAnyOpen = Object.values(expandedGuidance).some(Boolean);
    if (hasAnyOpen) {
      setExpandedGuidance({});
    } else {
      const allOpen = {};
      (currentWp.checklist || []).forEach((item) => {
        if (item.guidance) allOpen[item.id] = true;
      });
      setExpandedGuidance(allOpen);
    }
  };

  // Select or Auto-Instantiate Working Paper from Engagement Plan
  const handleSelectOrGenerateWp = (targetId) => {
    const existing = workingPapers.find((w) => w.id === targetId || w.engagementId === targetId);
    if (existing) {
      setSelectedWp(existing.id);
      return;
    }

    const matchingEng = engagementPlans.find(
      (ep) => ep.id === targetId || `WP-${ep.id}` === targetId
    );

    if (matchingEng) {
      const criteriaList = Array.isArray(matchingEng.criteria)
        ? matchingEng.criteria
        : (matchingEng.criteria ? [matchingEng.criteria] : ['ระเบียบกระทรวงมหาดไทยที่เกี่ยวข้อง']);

      const newWp = {
        id: targetId.startsWith('WP-') ? targetId : `WP-${targetId}`,
        engagementId: matchingEng.id,
        topic: matchingEng.title || matchingEng.activityName || 'โครงการตรวจสอบ',
        department: matchingEng.targetAuditee || matchingEng.department || 'หน่วยรับตรวจ',
        auditPeriod: matchingEng.auditPeriod || `ปีงบประมาณ พ.ศ. ${selectedYear}`,
        auditor: orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน',
        criteria: criteriaList,
        checklist: (matchingEng.auditProgram || []).map((step, idx) => ({
          id: `CHK-${idx + 1}`,
          question: step.title || step.step || step.procedure || (typeof step === 'string' ? step : `ขั้นตอนการตรวจที่ ${idx + 1}`),
          standard: step.standard || criteriaList[0] || '',
          guidance: step.details || step.procedure || step.evidence || '',
          result: 'pending',
          note: ''
        })),
        samples: [],
        finding: {
          condition: '',
          criteria: criteriaList.join('\n'),
          cause: '',
          effect: '',
          recommendation: ''
        }
      };

      setWorkingPapers([newWp, ...workingPapers]);
      setSelectedWp(newWp.id);
      setAutoFindingToast(`✓ สร้างกระดาษทำการเชื่อมโยงกับ "${matchingEng.title}" สำเร็จ`);
      setTimeout(() => setAutoFindingToast(''), 3500);
      return;
    }

    setSelectedWp(targetId);
  };

  // Sync Checklist and Criteria from linked Engagement Plan
  const handleSyncFromEngagementPlan = () => {
    const matchingEng = engagementPlans.find(
      (ep) =>
        ep.id === currentWp.engagementId ||
        ep.id === currentWp.id ||
        `WP-${ep.id}` === currentWp.id ||
        ep.title === currentWp.topic
    );

    if (!matchingEng) {
      setAutoFindingToast('⚠️ ไม่พบแผนปฏิบัติงานที่ตรงกับกระดาษทำการนี้');
      setTimeout(() => setAutoFindingToast(''), 3500);
      return;
    }

    const criteriaList = Array.isArray(matchingEng.criteria)
      ? matchingEng.criteria
      : (matchingEng.criteria ? [matchingEng.criteria] : currentWp.criteria || []);

    const existingCheckMap = new Map((currentWp.checklist || []).map((c) => [c.question, c]));
    const updatedChecklist = (matchingEng.auditProgram || []).map((step, idx) => {
      const q = step.title || step.step || step.procedure || (typeof step === 'string' ? step : `ขั้นตอนที่ ${idx + 1}`);
      const oldItem = existingCheckMap.get(q);
      return {
        id: oldItem?.id || `CHK-${idx + 1}`,
        question: q,
        standard: step.standard || oldItem?.standard || criteriaList[0] || '',
        guidance: step.details || step.procedure || step.evidence || oldItem?.guidance || '',
        result: oldItem?.result || 'pending',
        note: oldItem?.note || ''
      };
    });

    const updated = workingPapers.map((w) => {
      if (w.id === currentWp.id) {
        return {
          ...w,
          criteria: criteriaList,
          checklist: updatedChecklist.length > 0 ? updatedChecklist : w.checklist
        };
      }
      return w;
    });

    setWorkingPapers(updated);
    setAutoFindingToast(`✓ ซิงค์แนวการตรวจจากแผนปฏิบัติงาน (${matchingEng.title}) เรียบร้อยแล้ว`);
    setTimeout(() => setAutoFindingToast(''), 3500);
  };

  // Toggle checklist item result
  const handleToggleChecklist = (checkId) => {
    const updated = workingPapers.map((wp) => {
      if (wp.id === currentWp.id) {
        const nextChecklist = (wp.checklist || []).map((item) => {
          if (item.id === checkId) {
            let nextResult = 'passed';
            if (item.result === 'passed') nextResult = 'failed';
            else if (item.result === 'failed') nextResult = 'na';
            else nextResult = 'passed';
            return { ...item, result: nextResult };
          }
          return item;
        });
        return { ...wp, checklist: nextChecklist };
      }
      return wp;
    });
    setWorkingPapers(updated);
  };

  // Load DLA 6 Working Papers with Checklists (Pages 12, 19, 27, 33, 40, 47)
  const handleLoadDlaWorkingPapers = () => {
    const formatted = DLA_CORE_WORKFLOWS_6.map((wf) => {
      const template = wf.workingPaperTemplate;
      const report = wf.auditReport5Elements;
      return {
        id: template.wpNo,
        topic: template.title,
        department: wf.department,
        auditPeriod: wf.period,
        auditor: wf.auditor,
        criteria: report.criteria,
        checklist: (template.checkpoints || []).map((cp) => ({
          id: cp.id,
          question: cp.item,
          standard: cp.criteria,
          guidance: `${cp.criteria} | วิธีการตรวจ: ${cp.method || 'ตรวจสอบเอกสารและสังเกตการณ์'}`,
          result: cp.status === 'ผ่าน' ? 'passed' : cp.status === 'ไม่ผ่าน' ? 'failed' : 'passed',
          note: cp.status === 'ไม่ผ่าน' ? 'พบข้อสังเกตตามตัวอย่างคู่มือ สถ.' : ''
        })),
        samples: [
          {
            id: `SMP-${wf.code}-01`,
            docNo: wf.code === 'ENG-DLA-01' ? 'ใบเสร็จเล่มที่ 01/69 เลขที่ 45' : wf.code === 'ENG-DLA-05' ? 'ฎีกาเบิกเงิน 102/69' : 'เอกสารตรวจสอบที่ 01',
            date: '2569-01-15',
            payee: wf.department,
            amount: 15000,
            testResult: 'ปกติ',
            note: 'สุ่มตรวจความถูกต้องตามระเบียบ'
          },
          {
            id: `SMP-${wf.code}-02`,
            docNo: wf.code === 'ENG-DLA-01' ? 'ใบเสร็จเล่มที่ 02/69 เลขที่ 50' : wf.code === 'ENG-DLA-05' ? 'ฎีกาเบิกเงิน 145/69' : 'เอกสารตรวจสอบที่ 02',
            date: '2569-02-10',
            payee: wf.department,
            amount: 28500,
            testResult: 'ปกติ',
            note: 'ผ่านการลงนามครบถ้วน'
          }
        ],
        finding: {
          condition: report.condition,
          criteria: report.criteria,
          cause: report.cause,
          effect: report.effect,
          recommendation: report.recommendation
        }
      };
    });

    const existingIds = new Set(workingPapers.map((w) => w.id));
    const newToAdd = formatted.filter((w) => !existingIds.has(w.id));
    if (newToAdd.length === 0) {
      alert('มีกระดาษทำการตามคู่มือ สถ. ทั้ง 6 ภารกิจอยู่ในระบบแล้ว');
      return;
    }
    const updated = [...newToAdd, ...workingPapers];
    setWorkingPapers(updated);
    setSelectedWp(newToAdd[0].id);
  };

  // Add new sample row
  const handleAddSample = (e) => {
    e.preventDefault();
    if (!newSample.docNo) return;
    const updated = workingPapers.map((wp) => {
      if (wp.id === currentWp.id) {
        const samples = wp.samples || [];
        return {
          ...wp,
          samples: [
            ...samples,
            {
              ...newSample,
              id: `SMP-${Date.now().toString().slice(-4)}`,
              amount: Number(newSample.amount) || 0
            }
          ]
        };
      }
      return wp;
    });
    setWorkingPapers(updated);
    setShowAddSample(false);
    setNewSample({
      docNo: '',
      date: '',
      payee: '',
      amount: '',
      testResult: 'ปกติ',
      note: ''
    });
  };

  // Update findings
  const handleUpdateFinding = (field, value) => {
    const updated = workingPapers.map((wp) => {
      if (wp.id === currentWp.id) {
        return {
          ...wp,
          finding: {
            ...wp.finding,
            [field]: value
          }
        };
      }
      return wp;
    });
    setWorkingPapers(updated);
  };

  // Auto-generate 4-element audit findings from failed checklist and abnormal samples
  const handleAutoGenerateFindings = () => {
    const failedChecklist = (currentWp.checklist || []).filter((item) => item.result === 'failed');
    const abnormalSamples = (currentWp.samples || []).filter((s) => s.testResult !== 'ปกติ');

    if (failedChecklist.length === 0 && abnormalSamples.length === 0) {
      const autoCondition = `จากการสุ่มตรวจสอบเอกสารและกระบวนการปฏิบัติงานเรื่อง "${currentWp.topic}" ของ ${currentWp.department} ประจำปีงบประมาณ พ.ศ. ${selectedYear} ตามตัวอย่างที่สุ่มตรวจ ไม่พบข้อบกพร่องที่มีนัยสำคัญ การดำเนินงานเป็นไปตามระเบียบและเกณฑ์มาตรฐานที่กำหนด`;
      const autoCause = `หน่วยรับตรวจมีความเข้าใจในระเบียบกฎหมาย มีการสอบทานขั้นตอนการปฏิบัติงาน และมีการควบคุมภายในที่เหมาะสม`;
      const autoEffect = `ทำให้การปฏิบัติงานและการใช้จ่ายงบประมาณเป็นไปด้วยความถูกต้อง โปร่งใส เกิดประโยชน์สูงสุดแก่ทางราชการ`;
      const autoRec = `เห็นควรให้ ${currentWp.department} รักษามาตรฐานการปฏิบัติงาน และติดตามหนังสือสั่งการหรือระเบียบที่มีการปรับปรุงใหม่จากกระทรวงมหาดไทยและกรมบัญชีกลางอย่างต่อเนื่อง`;

      const updated = workingPapers.map((wp) => {
        if (wp.id === currentWp.id) {
          return {
            ...wp,
            finding: {
              condition: autoCondition,
              cause: autoCause,
              effect: autoEffect,
              recommendation: autoRec
            }
          };
        }
        return wp;
      });
      setWorkingPapers(updated);
      setAutoFindingToast('ร่างข้อตรวจพบ (กรณีผลตรวจปกติ/ผ่านเกณฑ์) เรียบร้อยแล้ว');
      setTimeout(() => setAutoFindingToast(''), 3000);
      return;
    }

    // Compose Condition
    let conditionText = `จากการสุ่มตรวจสอบการปฏิบัติงานเรื่อง "${currentWp.topic}" ของ ${currentWp.department} ประจำปีงบประมาณ พ.ศ. ${selectedYear} พบข้อบกพร่องและข้อสังเกต ดังนี้:\n`;
    failedChecklist.forEach((item, idx) => {
      conditionText += `${idx + 1}. ไม่ผ่านเกณฑ์: ${item.question}${item.note ? ` (ข้อสังเกต: ${item.note})` : ''}\n`;
    });

    if (abnormalSamples.length > 0) {
      conditionText += `\nจากการสุ่มตรวจเอกสาร/สัญญา/ฎีกาเบิกจ่าย พบรายการที่มีข้อสังเกตหรือไม่ถูกต้อง จำนวน ${abnormalSamples.length} รายการ ดังนี้:\n`;
      abnormalSamples.forEach((s, idx) => {
        conditionText += `- รายการที่ ${idx + 1}: ${s.docNo} (${s.payee}) จำนวนเงิน ${Number(s.amount || 0).toLocaleString()} บาท - ผลการตรวจ: "${s.testResult}" (${s.note || 'ไม่มีระบุหมายเหตุ'})\n`;
      });
    }

    // Specific Causes, Effects, and Recommendations by WP ID or Topic
    let causeText = '';
    let effectText = '';
    let recText = '';

    if (currentWp.id === 'WP-PRICE-2570' || currentWp.topic?.includes('ราคากลาง')) {
      causeText = `คณะกรรมการกำหนดราคากลางและเจ้าหน้าที่ผู้รับผิดชอบยังขาดความเข้าใจในหลักเกณฑ์และวิธีปฏิบัติการคำนวณราคากลางงานก่อสร้างของราชการตามประกาศคณะกรรมการราคากลางฯ และไม่ได้สอบทานตาราง Factor F รวมถึงขาดการตรวจสอบราคาวัสดุก่อสร้างจากสำนักงานพาณิชย์จังหวัดให้เป็นปัจจุบัน`;
      effectText = `อาจทำให้ราคากลางที่ อปท. อนุมัติสูงหรือต่ำกว่าความเป็นจริง ส่งผลให้การจัดซื้อจัดจ้างด้วยเงินงบประมาณไม่ประหยัด คุ้มค่า และมีความเสี่ยงต่อการถูก สตง. หรือ ป.ป.ช. ตรวจสอบทักท้วงและเรียกเงินคืน`;
      recText = `1. แจ้ง ${currentWp.department} สั่งการให้คณะกรรมการกำหนดราคากลางทบทวนการคำนวณราคากลางและแบบ ปร.4, ปร.5, ปร.6 ให้ถูกต้องตามหลักเกณฑ์ของกรมบัญชีกลาง\n2. กำชับให้ใช้ราคาพาณิชย์จังหวัดและอัตราค่าแรงขั้นต่ำที่เป็นปัจจุบัน รวมถึงเลือกตาราง Factor F ให้ตรงกับประเภทงานก่อสร้างและเงื่อนไขสัญญาอย่างเคร่งครัด\n3. รายงานผลการดำเนินการให้ผู้บริหารท้องถิ่นทราบภายใน 30 วัน`;
    } else if (currentWp.id === 'WP-PROC-2570' || currentWp.topic?.includes('จัดซื้อจัดจ้าง')) {
      causeText = `เจ้าหน้าที่พัสดุและคณะกรรมการตรวจรับพัสดุยังขาดความรัดกุมในการตรวจสอบเอกสารหลักประกันสัญญา และขาดระบบติดตามการนับระยะเวลาส่งมอบงานตามสัญญา รวมถึงมิได้คิดค่าปรับกรณีส่งมอบงานล่าช้าตามมาตรา 175 แห่ง พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560`;
      effectText = `ทำให้ทางราชการเสียประโยชน์จากการไม่เรียกเก็บค่าปรับตามสัญญา และหลักประกันสัญญาอาจไม่ครอบคลุมความชำรุดบกพร่อง ก่อให้เกิดความเสี่ยงต่อความเสียหายของงบประมาณและวินัยการเงินการคลัง`;
      recText = `1. สั่งการให้กองคลัง/งานพัสดุ ตรวจสอบระยะเวลาส่งมอบงานและเรียกเก็บค่าปรับจากคู่สัญญาให้ครบถ้วนถูกต้องตามระเบียบฯ\n2. จัดทำทะเบียนคุมสัญญาและหลักประกันสัญญาเพื่อแจ้งเตือนการหมดอายุและการส่งคืนหลักประกันอย่างเป็นระบบ\n3. ให้เจ้าหน้าที่ที่เกี่ยวข้องศึกษาทำความเข้าใจ พ.ร.บ. การจัดซื้อจัดจ้างฯ พ.ศ. 2560 และหนังสือสั่งการคณะกรรมการวินิจฉัยอย่างเคร่งครัด`;
    } else if (currentWp.id === 'WP-CONST-2570' || currentWp.topic?.includes('ข้อบัญญัติ')) {
      causeText = `ช่างผู้ควบคุมงานไม่ได้จัดทำสมุดบันทึกรายงานประจำวันตามระเบียบพัสดุฯ ข้อ 178 อย่างต่อเนื่อง และคณะกรรมการตรวจรับพัสดุมิได้รอผลทดสอบความแข็งแรงของคอนกรีต (Cylinder Test 28 วัน) ก่อนการตรวจรับงวดสุดท้าย รวมถึงการกันเงินเหลื่อมปียังไม่สอดคล้องกับระเบียบ มท. รับจ่ายเงิน 2566`;
      effectText = `งานก่อสร้างอาจไม่ได้คุณภาพมาตรฐานตามแบบรูปรายการ ก่อให้เกิดความชำรุดเสียหายก่อนเวลาอันควร และการเบิกจ่ายงบประมาณอาจไม่ชอบด้วยระเบียบการเงินการคลังของ อปท.`;
      recText = `1. กำชับให้ช่างผู้ควบคุมงานจดบันทึกสภาพการปฏิบัติงานประจำวันและรายงานประธานกรรมการตรวจรับพัสดุเป็นประจำทุกสัปดาห์\n2. การตรวจรับงานโครงสร้างคอนกรีตต้องมีผลทดสอบกำลังอัด (Cylinder Test) จากสถาบันที่เชื่อถือได้รับรองครบถ้วนก่อนการเบิกจ่ายเงินงวด\n3. ตรวจสอบการกันเงินเหลื่อมปีให้มีหนี้ผูกพันสัญญาภายใน 30 ก.ย. หากไม่ทันต้องเสนอขออนุมัติต่อสภาท้องถิ่นตามระเบียบ มท. รับจ่ายเงิน 2566 ข้อ 64-67`;
    } else if (currentWp.id === 'WP-PERMIT-2570' || currentWp.topic?.includes('ขออนุญาต') || currentWp.topic?.includes('รื้อถอน')) {
      causeText = `เจ้าหน้าที่ผู้รับผิดชอบขาดการตรวจสอบอัตราค่าธรรมเนียมใบอนุญาตและค่าตรวจแบบแปลนตามกฎกระทรวง ฉบับที่ 7 (พ.ศ. 2528) แห่ง พ.ร.บ. ควบคุมอาคาร พ.ศ. 2522 และขาดการควบคุมระยะเวลาการพิจารณาคำขอให้เป็นไปตามกรอบ 45 วันของ พ.ร.บ. การอำนวยความสะดวกฯ พ.ศ. 2558`;
      effectText = `ทำให้ อปท. จัดเก็บรายได้ค่าธรรมเนียมตกหล่นไม่ครบถ้วน และประชาชนผู้ขออนุญาตอาจได้รับการบริการที่ล่าช้าเกินกรอบเวลาที่กฎหมายกำหนด รวมถึงอาจมีสิ่งปลูกสร้างที่ผิดแบบรูปความปลอดภัย`;
      recText = `1. ให้กองช่างตรวจสอบและคำนวณค่าธรรมเนียมใบอนุญาตและค่าตรวจแบบแปลนให้ถูกต้องตามขนาดพื้นที่และประเภทอาคาร หากจัดเก็บขาดให้ติดตามเรียกเก็บเพิ่มเติม\n2. จัดทำสมุดคุมคำขออนุญาตก่อสร้าง (แบบ ข.1) และควบคุมกระบวนการพิจารณาให้แล้วเสร็จภายใน 45 วัน\n3. ตรวจสอบใบประกอบวิชาชีพของวิศวกรและสถาปนิกผู้รับผิดชอบงานให้ถูกต้องตามกฎหมายวิศวกรและสถาปัตยกรรม`;
    } else {
      causeText = `เจ้าหน้าที่ผู้ปฏิบัติงานยังขาดความเข้าใจในระเบียบกระทรวงมหาดไทยและหนังสือสั่งการที่เกี่ยวข้อง และขาดการสอบทานเอกสารหลักฐานในแต่ละขั้นตอนก่อนเสนอขออนุมัติเบิกจ่าย`;
      effectText = `อาจทำให้การเบิกจ่ายงบประมาณและการปฏิบัติงานไม่ถูกต้องตามระเบียบราชการ เสี่ยงต่อความเสียหายของงบประมาณแผ่นดิน และอาจถูก สตง. ทักท้วงและเรียกเงินคืน`;
      recText = `1. แจ้ง ${currentWp.department} ให้ทบทวนและแก้ไขข้อบกพร่องตามระเบียบราชการให้ถูกต้องครบถ้วน\n2. กำชับเจ้าหน้าที่ผู้รับผิดชอบให้ปฏิบัติตามระเบียบและหนังสือสั่งการที่เกี่ยวข้องอย่างเคร่งครัด\n3. รายงานผลการปรับปรุงแก้ไขให้ผู้บริหารท้องถิ่นและหน่วยตรวจสอบภายในทราบภายใน 30 วัน`;
    }

    const updated = workingPapers.map((wp) => {
      if (wp.id === currentWp.id) {
        return {
          ...wp,
          finding: {
            condition: conditionText.trim(),
            cause: causeText.trim(),
            effect: effectText.trim(),
            recommendation: recText.trim()
          }
        };
      }
      return wp;
    });
    setWorkingPapers(updated);
    setAutoFindingToast('ดึงข้อตรวจพบจาก Checklist และการสุ่มตรวจมาร่างข้อตรวจพบ 4 องค์ประกอบเรียบร้อยแล้ว');
    setTimeout(() => setAutoFindingToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Topic Selector */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-8 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 backdrop-blur-xs">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Building className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'}</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>ผู้ตรวจสอบ: {orgProfile?.auditorName || currentWp.auditor || 'หน่วยตรวจสอบภายใน'}</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>ปีงบประมาณ พ.ศ. {selectedYear}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            กระดาษทำการการตรวจสอบ (Audit Working Papers)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSyncFromEngagementPlan}
            className="no-print bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
            title="ซิงค์ขั้นตอนการตรวจและเกณฑ์จากแผนการปฏิบัติงาน (Step 4)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="hidden sm:inline">ซิงค์จากแผนงาน</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDlaWorkingPapers}
            className="no-print bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
            title="โหลดกระดาษทำการ 6 ภารกิจหลักมาตรฐาน อปท. จากคู่มือ สถ."
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>📥 โหลด 6 ภารกิจ (คู่มือ สถ.)</span>
          </button>

          <button
            type="button"
            onClick={() => exportWorkingPaperToExcel(currentWp, orgProfile)}
            className="no-print bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Working Paper Selector Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
              เลือกกระดาษทำการที่ต้องการตรวจ (Working Paper):
            </label>
            <div className="relative">
              <select
                value={currentWp.id}
                onChange={(e) => handleSelectOrGenerateWp(e.target.value)}
                className="w-full appearance-none bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-900 dark:text-stone-100 text-sm font-bold py-2.5 pl-3.5 pr-9 rounded-xl border border-stone-300 dark:border-stone-700 outline-none cursor-pointer truncate shadow-2xs"
              >
                {engagementPlans.length > 0 && (
                  <optgroup label="📋 โครงการตามแผนปฏิบัติงาน (Engagement Plans ว 614)">
                    {engagementPlans.map((ep) => {
                      const wpId = ep.id.startsWith('WP-') ? ep.id : `WP-${ep.id}`;
                      return (
                        <option key={ep.id} value={wpId}>
                          {ep.id}: {ep.title || ep.activityName} ({ep.department || ep.targetAuditee})
                        </option>
                      );
                    })}
                  </optgroup>
                )}

                <optgroup label="📁 กระดาษทำการทั้งหมดในระบบ">
                  {workingPapers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.id}: {w.topic} ({w.department})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-500 dark:text-stone-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800">
          <span className="inline-flex items-center space-x-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Building className="w-3.5 h-3.5 text-stone-500" />
            <span>หน่วยรับตรวจ: {currentWp.department || 'ไม่ระบุ'}</span>
          </span>
          <span className="inline-flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200">
            <span>รหัส: {currentWp.id}</span>
          </span>
        </div>
      </div>

      {/* Criteria / Regulations Box */}
      <div className="bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-4 text-xs">
        <div className="flex items-center space-x-2 font-bold text-amber-950 dark:text-amber-200 mb-1.5">
          <BookmarkCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>เกณฑ์มาตรฐาน / ระเบียบกฎหมายที่ใช้ตรวจสอบ (Criteria)</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-amber-900/90 dark:text-amber-300 pl-1">
          {currentWp.criteria?.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      {/* Section 1: Audit Program Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              1. แนวทางการตรวจสอบและการควบคุมภายใน (Audit Program Checklist)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              คลิกที่ปุ่มผลการตรวจเพื่อสลับสถานะ: ผ่าน / ไม่ผ่าน / ไม่เกี่ยวข้อง
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            {(currentWp.checklist || []).some((i) => i.guidance) && (
              <button
                type="button"
                onClick={toggleAllGuidance}
                className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 hover:underline flex items-center space-x-1 cursor-pointer bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/80 dark:border-amber-900/40"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {Object.values(expandedGuidance).some(Boolean)
                    ? 'ยุบคำแนะนำ'
                    : '💡 เปิดคำแนะนำทั้งหมด'}
                </span>
              </button>
            )}
            <span className="text-xs font-bold text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
              {(currentWp.checklist || []).filter((c) => c.result === 'passed').length} / {(currentWp.checklist || []).length} ผ่านเกณฑ์
            </span>
          </div>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {(currentWp.checklist || []).map((item, idx) => {
            const isPassed = item.result === 'passed';
            const isFailed = item.result === 'failed';
            const hasGuidance = Boolean(item.guidance?.trim());
            const isGuidanceOpen = expandedGuidance[item.id];

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 dark:hover:bg-stone-850/40 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-stone-400 dark:text-stone-500 text-xs shrink-0">{idx + 1}.</span>
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 leading-snug">
                      {item.question}
                    </span>
                  </div>

                  {hasGuidance && (
                    <div className="pl-4 pt-0.5">
                      <button
                        type="button"
                        onClick={() => toggleGuidance(item.id)}
                        className="inline-flex items-center space-x-1 text-[11px] font-medium text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-200 hover:underline cursor-pointer transition-colors"
                      >
                        <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{isGuidanceOpen ? 'ซ่อนคำแนะนำและข้อกฎหมาย' : '💡 ดูคำแนะนำและข้อกฎหมายสำหรับผู้ตรวจ'}</span>
                      </button>

                      {isGuidanceOpen && (
                        <div className="mt-1.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-[11px] text-stone-850 dark:text-amber-100 leading-relaxed animate-in fade-in">
                          <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1 mb-1">
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>เกณฑ์และสาระสำคัญที่ต้องสอบทาน:</span>
                          </div>
                          <p className="pl-4 text-stone-700 dark:text-stone-300">{item.guidance}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {item.note && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-4">
                      <strong>หมายเหตุตรวจพบ:</strong> {item.note}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleChecklist(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isPassed
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                        : isFailed
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {isPassed ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>ปฏิบัติถูกต้อง</span>
                      </>
                    ) : isFailed ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>มีข้อบกพร่อง</span>
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>ไม่เกี่ยวข้อง</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Sample Testing (สุ่มตรวจฎีกา / เอกสาร) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              2. ตารางบันทึกการสุ่มตรวจตัวอย่าง (Sample Testing Records)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              รายการเอกสาร ฎีกาเบิกจ่าย หรือสัญญาที่ทำการสุ่มตรวจ
            </p>
          </div>
          <button
            onClick={() => setShowAddSample(true)}
            className="no-print bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มตัวอย่าง</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600 dark:text-stone-400">
            <thead className="bg-stone-100/90 dark:bg-stone-800/80 text-stone-700 dark:text-stone-200 font-bold border-b border-stone-200 dark:border-stone-700/80">
              <tr>
                <th className="px-4 py-2.5">ลำดับ</th>
                <th className="px-4 py-2.5">{docNoLabel}</th>
                <th className="px-4 py-2.5">วันที่</th>
                <th className="px-4 py-2.5">{payeeLabel}</th>
                <th className="px-4 py-2.5 text-right">{amountLabel}</th>
                <th className="px-4 py-2.5 text-center">ผลการตรวจ</th>
                <th className="px-4 py-2.5">ข้อสังเกต / เอกสารแนบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {currentWp.samples?.map((s, idx) => (
                <tr key={s.id} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/50 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-stone-400 dark:text-stone-500">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-stone-900 dark:text-stone-100">{s.docNo}</td>
                  <td className="px-4 py-2.5">{s.date}</td>
                  <td className="px-4 py-2.5 font-medium text-stone-800 dark:text-stone-200">{s.payee}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">
                    {s.amount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      {s.testResult}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-stone-500 dark:text-stone-400">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Audit Findings (ข้อตรวจพบ 4 องค์ประกอบ) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>3. สรุปข้อตรวจพบและข้อเสนอแนะ (Audit Findings - 4 Elements)</span>
          </div>

          <button
            type="button"
            onClick={handleAutoGenerateFindings}
            className="no-print bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto transition-all"
            title="ดึงผลการตรวจที่ไม่ผ่านและตัวอย่างที่มีข้อสังเกตมาร่างเป็นข้อตรวจพบ 4 องค์ประกอบอัตโนมัติ"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>⚡ ร่างข้อตรวจพบอัตโนมัติ (Auto-Generate Findings)</span>
          </button>
        </div>

        {autoFindingToast && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{autoFindingToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Condition */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 dark:text-stone-200">
              1. สภาพการณ์ที่ตรวจพบ (Condition)
            </label>
            <textarea
              rows="3"
              value={currentWp.finding?.condition || ''}
              onChange={(e) => handleUpdateFinding('condition', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-600 focus:ring-2 focus:ring-amber-500 outline-none bg-stone-50/60 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 leading-relaxed"
              placeholder="ระบุข้อเท็จจริงที่ตรวจพบ..."
            ></textarea>
          </div>

          {/* Cause */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 dark:text-stone-200">
              2. สาเหตุของข้อบกพร่อง (Cause)
            </label>
            <textarea
              rows="3"
              value={currentWp.finding?.cause || ''}
              onChange={(e) => handleUpdateFinding('cause', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-600 focus:ring-2 focus:ring-amber-500 outline-none bg-stone-50/60 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 leading-relaxed"
              placeholder="ระบุสาเหตุ เช่น ขาดความรู้ ขาดการควบคุม..."
            ></textarea>
          </div>

          {/* Effect */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 dark:text-stone-200">
              3. ผลกระทบ / ความเสียหาย (Effect)
            </label>
            <textarea
              rows="3"
              value={currentWp.finding?.effect || ''}
              onChange={(e) => handleUpdateFinding('effect', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-600 focus:ring-2 focus:ring-amber-500 outline-none bg-stone-50/60 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 leading-relaxed"
              placeholder="ระบุความเสี่ยงหรือความเสียหายที่เกิดขึ้น..."
            ></textarea>
          </div>

          {/* Recommendation */}
          <div className="space-y-1.5">
            <label className="font-bold text-amber-900 dark:text-amber-300">
              4. ข้อเสนอแนะของผู้ตรวจสอบภายใน (Recommendation)
            </label>
            <textarea
              rows="3"
              value={currentWp.finding?.recommendation || ''}
              onChange={(e) => handleUpdateFinding('recommendation', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed text-stone-900 dark:text-amber-100 font-medium"
              placeholder="ระบุแนวทางแก้ไขที่ชัดเจน สามารถปฏิบัติได้จริง..."
            ></textarea>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            * ข้อมูลข้อตรวจพบนี้จะถูกเชื่อมโยงไปยังการประชุมปิดตรวจ (ขั้นที่ 7) และรายงานผล (ขั้นที่ 8)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAutoFindingToast('✓ บันทึกข้อมูลกระดาษทำการเรียบร้อยแล้ว');
                setTimeout(() => setAutoFindingToast(''), 3000);
              }}
              className="no-print bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              💾 บันทึกกระดาษทำการ
            </button>

            {onNavigateToTab && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('closing-meeting')}
                  className="no-print bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-colors shadow-xs flex items-center space-x-1"
                  title="ส่งผลตรวจนี้ไปยังการประชุมปิดการตรวจสอบ"
                >
                  <span>ประชุมปิดตรวจ (ขั้น 7)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('reporting')}
                  className="no-print bg-stone-800 hover:bg-stone-900 text-amber-200 font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-colors shadow-xs flex items-center space-x-1"
                  title="ส่งผลตรวจนี้ไปยังรายงานผลการตรวจสอบ 5 องค์ประกอบ"
                >
                  <span>ออกรายงานผล (ขั้น 8)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Sample */}
      {showAddSample && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">เพิ่มรายการสุ่มตรวจ</h3>
            <form onSubmit={handleAddSample} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">{docNoLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={isSubsidyWp ? 'เช่น บันทึกข้อตกลง 12/68' : 'เช่น ฎีกา 214/68'}
                  value={newSample.docNo}
                  onChange={(e) => setNewSample({ ...newSample, docNo: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">วันที่</label>
                  <input
                    type="text"
                    placeholder="เช่น 15 ก.พ. 68"
                    value={newSample.date}
                    onChange={(e) => setNewSample({ ...newSample, date: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">{amountLabel}</label>
                  <input
                    type="number"
                    placeholder="เช่น 15000"
                    value={newSample.amount}
                    onChange={(e) => setNewSample({ ...newSample, amount: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">{payeeLabel}</label>
                <input
                  type="text"
                  placeholder={isSubsidyWp ? 'เช่น โรงเรียนในเขตพื้นที่' : 'เช่น หจก. สมบูรณ์ก่อสร้าง'}
                  value={newSample.payee}
                  onChange={(e) => setNewSample({ ...newSample, payee: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ผลการตรวจ</label>
                <select
                  value={newSample.testResult}
                  onChange={(e) => setNewSample({ ...newSample, testResult: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                >
                  <option value="ปกติ">ปกติ (ถูกต้องตามระเบียบ)</option>
                  <option value="มีข้อสังเกต">มีข้อสังเกต</option>
                  <option value="ไม่ถูกต้อง">ไม่ถูกต้อง</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ข้อสังเกต / หมายเหตุ</label>
                <input
                  type="text"
                  placeholder="ระบุข้อสังเกต..."
                  value={newSample.note}
                  onChange={(e) => setNewSample({ ...newSample, note: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSample(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  บันทึกตัวอย่าง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
