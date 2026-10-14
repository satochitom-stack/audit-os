import React, { useState } from 'react';
import PageHeaderBanner from './PageHeaderBanner';
import {
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Building,
  Award,
  Calendar,
  Printer,
  ChevronRight,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { getDepartments } from '../utils/auth';
import ConfirmModal from './ConfirmModal';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';
import { exportDocumentToWord, exportDataToExcel } from '../utils/documentExportUtils';
import { GARUDA_SVG_3CM_HTML, GARUDA_SVG_PATH, toThaiDigits } from '../utils/sarabanUtils';

export default function InternalControlView({
  internalControls,
  setInternalControls,
  orgProfile,
  selectedYear = '2569',
  session = null
}) {
  const isNonAdminUser = session?.role !== 'admin' && session?.username?.toLowerCase() !== 'admin';
  const effectiveAuditorName = isNonAdminUser
    ? (session?.displayName || (orgProfile?.auditorName && orgProfile.auditorName.toUpperCase() !== 'ADMIN' && !orgProfile.auditorName.includes('Super Admin') ? orgProfile.auditorName : 'ผู้ตรวจสอบภายใน'))
    : (orgProfile?.auditorName || session?.displayName || 'ผู้ดูแลระบบส่วนกลาง (Super Admin)');
  const effectiveAuditorPosition = isNonAdminUser
    ? (session?.position || (orgProfile?.auditorPosition && !orgProfile.auditorPosition.includes('Platform Root') && !orgProfile.auditorPosition.includes('ผู้ดูแลระบบ') ? orgProfile.auditorPosition : 'นักวิชาการตรวจสอบภายในปฏิบัติการ'))
    : (orgProfile?.auditorPosition || session?.position || 'ผู้ดูแลระบบระบบตรวจสอบภายใน (Platform Root)');

  const [activeTab, setActiveTab] = useState('pk4'); // 'pk4', 'pk5', 'pk1'
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPk4, setNewPk4] = useState({
    department: 'กองคลัง',
    evaluatedProcess: '',
    controlEvaluation: '',
    residualRisk: 'ปานกลาง',
    improvementPlan: ''
  });

  const handleAddPk4 = (e) => {
    e.preventDefault();
    if (!newPk4.evaluatedProcess || !newPk4.controlEvaluation) return;
    const item = {
      ...newPk4,
      id: `PK4-${Date.now()}`
    };
    if (setInternalControls) {
      setInternalControls((prev) => ({
        ...prev,
        pk4: [...(prev?.pk4 || []), item]
      }));
    }
    setNewPk4({
      department: 'กองคลัง',
      evaluatedProcess: '',
      controlEvaluation: '',
      residualRisk: 'ปานกลาง',
      improvementPlan: ''
    });
    setShowAddModal(false);
  };

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

  const handleDeletePk4 = (id, processName = '') => {
    openConfirmModal({
      title: 'ยืนยันการลบรายการควบคุมภายใน (ปค.4)',
      message: `คุณต้องการลบรายการกระบวนการ "${processName || 'นี้'}" ออกจากรายงาน ปค.4 ใช่หรือไม่?`,
      confirmText: 'ลบรายการนี้',
      type: 'danger',
      onConfirm: () => {
        if (setInternalControls) {
          setInternalControls((prev) => ({
            ...prev,
            pk4: (prev?.pk4 || []).filter((item, index) => item.id !== id && index !== id)
          }));
        }
      }
    });
  };

  const pk4List = internalControls?.pk4 || [];
  const pk5List = internalControls?.pk5 || [];
  const pk1Data = internalControls?.pk1 || {};
  const [pk6SavedToast, setPk6SavedToast] = useState(false);

  const rawPk6 = internalControls?.pk6;
  const pk6Data = {
    reviewPeriod: rawPk6?.reviewPeriod || 'สำหรับระยะเวลาสิ้นสุดวันที่ 30 กันยายน',
    auditorName: (isNonAdminUser && (!rawPk6?.auditorName || rawPk6.auditorName.toUpperCase() === 'ADMIN' || rawPk6.auditorName.includes('Super Admin')))
      ? effectiveAuditorName
      : (rawPk6?.auditorName || effectiveAuditorName),
    auditorPosition: (isNonAdminUser && (!rawPk6?.auditorPosition || rawPk6.auditorPosition.includes('Platform Root') || rawPk6.auditorPosition.includes('ผู้ดูแลระบบ')))
      ? effectiveAuditorPosition
      : (rawPk6?.auditorPosition || effectiveAuditorPosition),
    reviewDate: rawPk6?.reviewDate || `30 กันยายน ${selectedYear}`,
    overallAssurance: rawPk6?.overallAssurance || 'adequate',
    summaryOpinion: rawPk6?.summaryOpinion || `หน่วยตรวจสอบภายในได้สอบทานรายงานการประเมินผลการควบคุมภายใน (แบบ ปค.4 และ แบบ ปค.5) ของฝ่ายบริหาร และสอบทานเอกสารหลักฐานที่เกี่ยวข้อง มีความเห็นว่าระบบการควบคุมภายในของ${orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} มีความเพียงพอ เหมาะสม และมีการปฏิบัติตามอย่างต่อเนื่องตามสมควร อย่างไรก็ดี มีบางกระบวนการที่ควรเพิ่มการควบคุมตามข้อสังเกตและข้อเสนอแนะ`,
    elementsReview: rawPk6?.elementsReview || [
      {
        elementName: '๑. สภาพแวดล้อมการควบคุม (Control Environment)',
        status: 'adequate',
        observation: 'ผู้บริหารมีนโยบายส่งเสริมความซื่อสัตย์สุจริต มีโครงสร้างองค์กรและการแบ่งมอบอำนาจหน้าที่ชัดเจน'
      },
      {
        elementName: '๒. การประเมินความเสี่ยง (Risk Assessment)',
        status: 'adequate',
        observation: 'มีการระบุและวิเคราะห์ความเสี่ยงที่อาจกระทบต่อการบรรลุวัตถุประสงค์ของภารกิจสำคัญ แต่ควรทบทวนให้ทันต่อเหตุการณ์'
      },
      {
        elementName: '๓. กิจกรรมการควบคุม (Control Activities)',
        status: 'adequate',
        observation: 'มีระเบียบ คำสั่ง และแนวปฏิบัติในการแบ่งแยกหน้าที่ การอนุมัติ และการตรวจสอบเอกสารการเงินและพัสดุ'
      },
      {
        elementName: '๔. สารสนเทศและการสื่อสาร (Information & Communication)',
        status: 'adequate',
        observation: 'มีการใช้ระบบ e-LAAS และสารสนเทศทางราชการในการปฏิบัติงานและรายงานข้อมูลอย่างต่อเนื่อง'
      },
      {
        elementName: '๕. การติดตามประเมินผล (Monitoring Activities)',
        status: 'adequate',
        observation: 'มีการติดตามผลการปฏิบัติงานตามแผน และการประเมินผลการควบคุมภายในประจำปี'
      }
    ],
    auditorRecommendations: `๑. ให้หน่วยรับตรวจเร่งรัดปฏิบัติตามแผนการปรับปรุงการควบคุมภายในตามที่ระบุไว้ในแบบ ปค.5 ให้แล้วเสร็จตามกำหนด\n๒. ให้ผู้บังคับบัญชาแต่ละสำนัก/กอง กำกับดูแลการบันทึกบัญชีและการจัดซื้อจัดจ้างให้เป็นไปตามระเบียบอย่างเคร่งครัด`
  };

  const handleUpdatePk6 = (field, value) => {
    if (!setInternalControls) return;
    setInternalControls((prev) => ({
      ...prev,
      pk6: {
        ...(prev?.pk6 || pk6Data),
        [field]: value
      }
    }));
  };

  const handleUpdatePk6Element = (index, field, value) => {
    if (!setInternalControls) return;
    const currentElements = [...(pk6Data.elementsReview || [])];
    currentElements[index] = {
      ...currentElements[index],
      [field]: value
    };
    handleUpdatePk6('elementsReview', currentElements);
  };

  const handleSavePk6 = () => {
    setPk6SavedToast(true);
    setTimeout(() => setPk6SavedToast(false), 3000);
  };

  const handleDownloadWord = () => {
    const orgName = orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น';

    if (activeTab === 'pk1') {
      const signerName = orgProfile?.approverName || pk1Data?.signer || 'นายกองค์กรปกครองส่วนท้องถิ่น';
      const signerPos = orgProfile?.approverPosition || pk1Data?.position || 'นายกองค์กรปกครองส่วนท้องถิ่น';
      const signDate = pk1Data?.signDate || `30 กันยายน ${selectedYear}`;

      const bodyContent = `
        <div style="text-align: center; margin-bottom: 20pt; font-family: 'TH Sarabun PSK';">
          <div style="text-align: center; margin: 0 0 10pt 0;">${GARUDA_SVG_3CM_HTML}</div>
          <p style="font-size: 20pt; font-weight: bold; margin: 2pt 0 0 0;">หนังสือรับรองการปฏิบัติตามมาตรฐานการควบคุมภายใน (แบบ ปค.1)</p>
          <p style="font-size: 16pt; font-weight: bold; margin: 2pt 0 0 0;">${orgName} ${orgProfile?.district || ''} ${orgProfile?.province || ''}</p>
          <p style="font-size: 16pt; margin: 2pt 0 0 0;">สำหรับปีงบประมาณสิ้นสุดวันที่ 30 กันยายน พ.ศ. ${selectedYear}</p>
        </div>
        <div style="border-top: 1.5pt solid black; margin-bottom: 16pt;"></div>

        <p style="text-indent: 2.5cm; margin-bottom: 12pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          ${orgName} ได้ประเมินผลการควบคุมภายในของหน่วยงานตามมาตรฐานและหลักเกณฑ์ปฏิบัติการควบคุมภายในสำหรับหน่วยงานของรัฐที่กระทรวงการคลังกำหนด สำหรับปีงบประมาณสิ้นสุดวันที่ 30 กันยายน พ.ศ. ${selectedYear}
        </p>

        <p style="text-indent: 2.5cm; margin-bottom: 12pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          จากผลการประเมินดังกล่าว เห็นว่า ระบบการควบคุมภายในของ ${orgName} มีความเพียงพอและมีประสิทธิผลตามสมควร ที่จะให้ความเชื่อมั่นอย่างสมเหตุสมผลว่า การดำเนินงานจะบรรลุวัตถุประสงค์ด้านการดำเนินงาน ด้านการรายงานทางการเงิน และด้านการปฏิบัติตามกฎหมายและระเบียบ
        </p>

        <table style="width: 100%; border: none; margin-top: 40pt; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">(ลงชื่อ)........................................................</p>
              <p style="margin: 4pt 0 0 0; font-weight: bold;">(${signerName})</p>
              <p style="margin: 2pt 0 0 0;">${signerPos}</p>
              <p style="margin: 4pt 0 0 0;">วันที่ ${signDate}</p>
            </td>
          </tr>
        </table>
      `;
      exportDocumentToWord(bodyContent, `แบบ_ปค1_หนังสือรับรองการควบคุมภายใน_${selectedYear}.doc`, 'หนังสือรับรองการควบคุมภายใน (แบบ ปค.1)');
    } else if (activeTab === 'pk5') {
      const bodyContent = `
        <div style="text-align: center; margin-bottom: 16pt; font-family: 'TH Sarabun PSK';">
          <p style="margin: 0; font-size: 20pt; font-weight: bold;">แบบ ปค.5: รายงานการติดตามประเมินผลการควบคุมภายใน</p>
          <p style="margin: 4pt 0 0 0; font-size: 16pt; font-weight: bold;">${orgName}</p>
          <p style="margin: 2pt 0 0 0; font-size: 16pt;">ประจำปีงบประมาณ พ.ศ. ${selectedYear} (งวด 6 เดือน และ 12 เดือน)</p>
        </div>
        <div style="border-top: 1.5pt solid black; margin-bottom: 14pt;"></div>

        <table style="width: 100%; border-collapse: collapse; border: 1pt solid black; font-size: 14pt; font-family: 'TH Sarabun PSK'; margin-bottom: 16pt;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1pt solid black; padding: 5pt; width: 6%; text-align: center;">ลำดับ</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 14%; text-align: center;">ส่วนราชการ</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 25%; text-align: center;">ประเด็นความเสี่ยง</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 25%; text-align: center;">กิจกรรมการควบคุม</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 15%; text-align: center;">ผู้รับผิดชอบ/กำหนดเวลา</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 15%; text-align: center;">สถานะการดำเนินงาน</th>
            </tr>
          </thead>
          <tbody>
            ${pk5List
              .map(
                (item, i) => `
              <tr>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${i + 1}</td>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${item.department || '-'}</td>
                <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;"><strong>${item.riskIssue || '-'}</strong></td>
                <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;">${item.controlActivity || '-'}</td>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${item.responsiblePerson || '-'} (${item.timeline || '-'})</td>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${item.status || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
      exportDocumentToWord(bodyContent, `แบบ_ปค5_รายงานติดตามประเมินผล_${selectedYear}.doc`, 'แบบ ปค.5 รายงานการติดตามประเมินผลการควบคุมภายใน');
    } else if (activeTab === 'pk4') {
      const bodyContent = `
        <div style="text-align: center; margin-bottom: 16pt; font-family: 'TH Sarabun PSK';">
          <p style="margin: 0; font-size: 20pt; font-weight: bold;">แบบ ปค.4: รายงานการประเมินผลการควบคุมภายในระดับสำนัก/กอง</p>
          <p style="margin: 4pt 0 0 0; font-size: 16pt; font-weight: bold;">${orgName}</p>
          <p style="margin: 2pt 0 0 0; font-size: 16pt;">ประจำปีงบประมาณ พ.ศ. ${selectedYear} (ตามหลักเกณฑ์กระทรวงการคลัง พ.ศ. 2561)</p>
        </div>
        <div style="border-top: 1.5pt solid black; margin-bottom: 14pt;"></div>

        <table style="width: 100%; border-collapse: collapse; border: 1pt solid black; font-size: 14pt; font-family: 'TH Sarabun PSK'; margin-bottom: 16pt;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1pt solid black; padding: 5pt; width: 6%; text-align: center;">ลำดับ</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 14%; text-align: center;">สำนัก / กอง</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 25%; text-align: center;">กระบวนการปฏิบัติงาน</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 25%; text-align: center;">การประเมินผลการควบคุม</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 10%; text-align: center;">ความเสี่ยงคงเหลือ</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 20%; text-align: center;">แผนการปรับปรุง</th>
            </tr>
          </thead>
          <tbody>
            ${pk4List
              .map(
                (item, i) => `
              <tr>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${i + 1}</td>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${item.department || '-'}</td>
                <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;"><strong>${item.process || item.evaluatedProcess || '-'}</strong></td>
                <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;">${item.controlEvaluation || item.existingControl || '-'}</td>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${item.residualRisk || '-'}</td>
                <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;">${item.improvementPlan || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
      exportDocumentToWord(bodyContent, `แบบ_ปค4_รายงานประเมินผลระดับกอง_${selectedYear}.doc`, 'แบบ ปค.4 รายงานประเมินผลการควบคุมภายใน');
    } else if (activeTab === 'pk6') {
      const bodyContent = `
        <div style="text-align: center; margin-bottom: 20pt; font-family: 'TH Sarabun PSK';">
          <div style="text-align: center; margin: 0 0 10pt 0;">${GARUDA_SVG_3CM_HTML}</div>
          <p style="font-size: 20pt; font-weight: bold; margin: 2pt 0 0 0;">แบบ ปค.6: รายงานการสอบทานการประเมินผลการควบคุมภายในของผู้ตรวจสอบภายใน</p>
          <p style="font-size: 16pt; font-weight: bold; margin: 2pt 0 0 0;">${orgName} ${orgProfile?.district || ''} ${orgProfile?.province || ''}</p>
          <p style="font-size: 16pt; margin: 2pt 0 0 0;">สำหรับระยะเวลาสิ้นสุดวันที่ 30 กันยายน พ.ศ. ${selectedYear}</p>
        </div>
        <div style="border-top: 1.5pt solid black; margin-bottom: 16pt;"></div>

        <p style="font-size: 16pt; font-weight: bold; font-family: 'TH Sarabun PSK'; margin-bottom: 6pt;">เรียน นายก${orgName}</p>
        <p style="text-indent: 2.5cm; margin-bottom: 12pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          หน่วยตรวจสอบภายในได้ทำการสอบทานการประเมินผลการควบคุมภายในของ ${orgName} สำหรับปีงบประมาณสิ้นสุดวันที่ 30 กันยายน พ.ศ. ${selectedYear} ตามหลักเกณฑ์กระทรวงการคลังว่าด้วยมาตรฐานและหลักเกณฑ์ปฏิบัติการควบคุมภายในสำหรับหน่วยงานของรัฐ พ.ศ. 2561 โดยได้สอบทานรายงานการประเมินผลการควบคุมภายใน (แบบ ปค.4 และ แบบ ปค.5) ของฝ่ายบริหาร และการสุ่มตรวจเอกสารหลักฐานการปฏิบัติงาน
        </p>

        <p style="font-size: 16pt; font-weight: bold; font-family: 'TH Sarabun PSK'; margin-top: 14pt; margin-bottom: 6pt;">ผลการสอบทานตาม 5 องค์ประกอบของการควบคุมภายใน:</p>
        <table style="width: 100%; border-collapse: collapse; border: 1pt solid black; font-size: 14pt; font-family: 'TH Sarabun PSK'; margin-bottom: 14pt;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1pt solid black; padding: 5pt; width: 35%; text-align: center;">องค์ประกอบของการควบคุมภายใน</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 15%; text-align: center;">ผลการประเมิน</th>
              <th style="border: 1pt solid black; padding: 5pt; width: 50%; text-align: center;">ข้อสังเกตของผู้ตรวจสอบภายใน</th>
            </tr>
          </thead>
          <tbody>
            ${(pk6Data.elementsReview || []).map(el => `
              <tr>
                <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;"><strong>${el.elementName}</strong></td>
                <td style="border: 1pt solid black; padding: 5pt; text-align: center; vertical-align: top;">${el.status === 'adequate' ? 'เพียงพอ' : 'ควรปรับปรุง'}</td>
                <td style="border: 1pt solid black; padding: 5pt; vertical-align: top;">${el.observation || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <p style="font-size: 16pt; font-weight: bold; font-family: 'TH Sarabun PSK'; margin-top: 14pt; margin-bottom: 6pt;">ข้อสรุปและความเห็นของผู้ตรวจสอบภายใน:</p>
        <p style="text-indent: 2.5cm; margin-bottom: 12pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          ${pk6Data.summaryOpinion}
        </p>

        <p style="font-size: 16pt; font-weight: bold; font-family: 'TH Sarabun PSK'; margin-top: 14pt; margin-bottom: 6pt;">ข้อเสนอแนะในการปรับปรุงการควบคุมภายใน:</p>
        <p style="text-indent: 2.5cm; margin-bottom: 12pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK'; white-space: pre-line;">
          ${pk6Data.auditorRecommendations}
        </p>

        <table style="width: 100%; border: none; margin-top: 30pt; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">(ลงชื่อ)........................................................ ผู้ตรวจสอบภายใน</p>
              <p style="margin: 4pt 0 0 0; font-weight: bold;">(${pk6Data.auditorName || effectiveAuditorName})</p>
              <p style="margin: 2pt 0 0 0;">${pk6Data.auditorPosition || effectiveAuditorPosition}</p>
              <p style="margin: 4pt 0 0 0;">วันที่ ${pk6Data.reviewDate || '30 กันยายน ' + selectedYear}</p>
            </td>
          </tr>
        </table>
      `;
      exportDocumentToWord(bodyContent, `แบบ_ปค6_รายงานสอบทานผู้ตรวจสอบภายใน_${selectedYear}.doc`, 'แบบ ปค.6 รายงานการสอบทานการควบคุมภายในของผู้ตรวจสอบภายใน');
    }
  };

  const handleDownloadExcel = () => {
    if (activeTab === 'pk5') {
      const headers = [
        'ลำดับ',
        'ส่วนราชการ',
        'ประเด็นความเสี่ยง',
        'กิจกรรมการควบคุมที่กำหนด',
        'ผู้รับผิดชอบ',
        'กำหนดเวลาแล้วเสร็จ',
        'สถานะการดำเนินงาน'
      ];
      const rows = pk5List.map((item, i) => [
        i + 1,
        item.department || '',
        item.riskIssue || '',
        item.controlActivity || '',
        item.responsiblePerson || '',
        item.timeline || '',
        item.status || ''
      ]);
      exportDataToExcel('แบบ ปค.5', [headers, ...rows], `Internal_Control_PK5_${selectedYear}.xlsx`);
    } else if (activeTab === 'pk6') {
      const headers = ['ลำดับ', 'องค์ประกอบการควบคุมภายใน (5 ด้าน)', 'ผลการประเมิน', 'ข้อสังเกตของผู้ตรวจสอบภายใน'];
      const rows = (pk6Data.elementsReview || []).map((el, i) => [
        i + 1,
        el.elementName,
        el.status === 'adequate' ? 'เพียงพอ' : 'ควรปรับปรุง',
        el.observation || ''
      ]);
      exportDataToExcel('แบบ ปค.6', [headers, ...rows], `Internal_Control_PK6_${selectedYear}.xlsx`);
    } else {
      const headers = [
        'ลำดับ',
        'สำนัก/กอง',
        'กระบวนการปฏิบัติงาน',
        'การประเมินผลการควบคุม',
        'ความเสี่ยงคงเหลือ',
        'แผนการปรับปรุงการควบคุม'
      ];
      const rows = pk4List.map((item, i) => [
        i + 1,
        item.department || '',
        item.process || item.evaluatedProcess || '',
        item.controlEvaluation || item.existingControl || '',
        item.residualRisk || '',
        item.improvementPlan || ''
      ]);
      exportDataToExcel('แบบ ปค.4', [headers, ...rows], `Internal_Control_PK4_${selectedYear}.xlsx`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {pk6SavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 dark:bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 border border-slate-700 text-xs font-bold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>บันทึกรายงานการสอบทาน ปค.6 เรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Header & Description */}
      <PageHeaderBanner
        title="การประเมินผลและการสอบทานการควบคุมภายในตามหลักเกณฑ์กระทรวงการคลัง (แบบ ปค.1 - ปค.6)"
        orgName={orgProfile?.name}
        auditorName="มาตรฐานกระทรวงการคลัง พ.ศ. 2561 • ว 79"
        year={selectedYear}
      />

      {/* Tab Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pk4')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pk4'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                : 'bg-white/80 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850 border border-stone-200/80 dark:border-stone-800'
            }`}
          >
            แบบ ปค.4: รายงานประเมินผลระดับกอง ({pk4List.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pk5')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pk5'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                : 'bg-white/80 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850 border border-stone-200/80 dark:border-stone-800'
            }`}
          >
            แบบ ปค.5: รายงานติดตามการปรับปรุง ({pk5List.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pk1')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pk1'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                : 'bg-white/80 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850 border border-stone-200/80 dark:border-stone-800'
            }`}
          >
            แบบ ปค.1: หนังสือรับรองระดับ อปท.
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pk6')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'pk6'
                ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                : 'bg-white/80 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850 border border-stone-200/80 dark:border-stone-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>แบบ ปค.6: สอบทานโดยผู้ตรวจสอบภายใน</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'pk4' && setInternalControls && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-amber-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มกระบวนการประเมิน ปค.4</span>
            </button>
          )}

          <OfficialDocActionToolbar
            onWord={handleDownloadWord}
            onExcel={activeTab !== 'pk1' ? handleDownloadExcel : null}
            onPdf={() => window.print()}
            wordTitle={
              activeTab === 'pk6'
                ? 'ส่งออกรายงานสอบทาน ปค.6 (Word .doc)'
                : activeTab === 'pk1'
                ? 'ส่งออกหนังสือรับรอง ปค.1 (Word .doc)'
                : activeTab === 'pk5'
                ? 'ส่งออกรายงานติดตาม ปค.5 (Word .doc)'
                : 'ส่งออกรายงานประเมินผล ปค.4 (Word .doc)'
            }
            wordSubtitle={
              activeTab === 'pk6'
                ? 'รายงานการสอบทานการประเมินผลการควบคุมภายในของผู้ตรวจสอบภายใน (ปค.6)'
                : activeTab === 'pk1'
                ? 'หนังสือรับรองการประเมินผลการควบคุมภายในระดับองค์กร (ปค.1)'
                : activeTab === 'pk5'
                ? 'รายงานการประเมินผลและการติดตามการปฏิบัติตามแผนปรับปรุง (ปค.5)'
                : 'รายงานการประเมินผลการควบคุมภายในระดับส่วนงานย่อย (ปค.4)'
            }
            excelTitle={
              activeTab === 'pk6'
                ? 'ส่งออกตาราง ปค.6 (Excel .xlsx)'
                : activeTab === 'pk5'
                ? 'ส่งออกตาราง ปค.5 (Excel .xlsx)'
                : activeTab === 'pk4'
                ? 'ส่งออกตาราง ปค.4 (Excel .xlsx)'
                : undefined
            }
            excelSubtitle={
              activeTab === 'pk6'
                ? 'ตารางการสอบทานองค์ประกอบการควบคุมภายใน 5 ด้านของผู้ตรวจสอบภายใน'
                : activeTab === 'pk5'
                ? 'ตารางติดตามผลการปรับปรุงการควบคุมภายในระดับ อปท.'
                : activeTab === 'pk4'
                ? 'ตารางการประเมินและการปรับปรุงการควบคุมภายในระดับกอง'
                : undefined
            }
            pdfTitle={
              activeTab === 'pk6'
                ? 'พิมพ์รายงานสอบทาน ปค.6 (PDF/Print)'
                : activeTab === 'pk1'
                ? 'พิมพ์หนังสือรับรอง ปค.1 (PDF/Print)'
                : activeTab === 'pk5'
                ? 'พิมพ์รายงาน ปค.5 (PDF/Print)'
                : 'พิมพ์รายงาน ปค.4 (PDF/Print)'
            }
            pdfSubtitle={
              activeTab === 'pk6'
                ? 'จัดพิมพ์รายงานการสอบทานของผู้ตรวจสอบภายใน (แบบ ปค.6)'
                : activeTab === 'pk1'
                ? 'จัดพิมพ์หนังสือรับรอง ปค.1 พร้อมลงนามหัวหน้าหน่วยงาน'
                : 'จัดพิมพ์แบบรายงานตามมาตรฐานกรมบัญชีกลาง'
            }
          />
        </div>
      </div>

      {/* Tab: PK 4 */}
      {activeTab === 'pk4' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                แบบ ปค.4: รายงานการประเมินผลการควบคุมภายใน (ระดับส่วนราชการ / สำนัก / กอง)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                ประเมินความเสี่ยงที่ยังมีอยู่และกำหนดแผนการปรับปรุงการควบคุมภายในตามภารกิจรายกอง
              </p>
            </div>
            <div className="text-xs font-bold text-stone-500 dark:text-stone-400">
              ปีงบประมาณ พ.ศ. {selectedYear}
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600 dark:text-stone-400">
                <thead className="bg-stone-50/90 dark:bg-stone-850/80 text-stone-700 dark:text-stone-200 font-bold border-b border-stone-200 dark:border-stone-700/80">
                  <tr>
                    <th className="px-4 py-3.5 w-40">ส่วนราชการ</th>
                    <th className="px-4 py-3.5 w-56">กระบวนการปฏิบัติงานที่ประเมิน</th>
                    <th className="px-4 py-3.5">ผลการประเมินการควบคุมภายใน</th>
                    <th className="px-4 py-3.5 text-center w-28">ความเสี่ยงที่ยังมีอยู่</th>
                    <th className="px-4 py-3.5">แผนการปรับปรุงการควบคุมภายใน</th>
                    {setInternalControls && <th className="px-3 py-3.5 text-center w-16 no-print">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {pk4List.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                        ยังไม่มีรายการประเมินผลการควบคุมภายใน (คลิกปุ่ม "+ เพิ่มกระบวนการประเมิน ปค.4" เพื่อเริ่มต้น)
                      </td>
                    </tr>
                  ) : (
                    pk4List.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-amber-50/20 dark:hover:bg-stone-850/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-stone-900 dark:text-stone-100 align-top">
                          <span className="inline-flex items-center space-x-1.5">
                            <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{item.department}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-stone-800 dark:text-stone-200 align-top">
                          {item.evaluatedProcess}
                        </td>
                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400 max-w-sm align-top">
                          {item.controlEvaluation}
                        </td>
                        <td className="px-4 py-3 text-center align-top">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block ${
                              item.residualRisk === 'สูง' || item.residualRisk === 'สูงมาก'
                                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50'
                                : item.residualRisk === 'ปานกลาง'
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50'
                                : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50'
                            }`}
                          >
                            {item.residualRisk}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-800 dark:text-stone-200 font-medium align-top">
                          {item.improvementPlan}
                        </td>
                        {setInternalControls && (
                          <td className="px-3 py-3 text-center align-top no-print">
                            <button
                              type="button"
                              onClick={() => handleDeletePk4(item.id || idx, item.process)}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PK 5 */}
      {activeTab === 'pk5' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              แบบ ปค.5: รายงานการติดตามประเมินผลการควบคุมภายใน
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              ติดตามผลการดำเนินงานตามแผนการปรับปรุงการควบคุมภายในประจำงวด 6 เดือน และ 12 เดือน
            </p>
          </div>

          <div className="space-y-3">
            {pk5List.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center space-x-2">
                    <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                      {item.department || 'ส่วนราชการ'}
                    </span>
                    <span>ประเด็นความเสี่ยง: {item.riskIssue}</span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] self-start sm:self-auto ${
                      item.status === 'ดำเนินการแล้วเสร็จ'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-850/70 p-3 rounded-xl border border-stone-200/80 dark:border-stone-800">
                  <span className="font-bold text-stone-900 dark:text-stone-100">กิจกรรมควบคุมที่กำหนด: </span>
                  {item.controlActivity}
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
                  <span>ผู้รับผิดชอบ: <strong className="text-stone-700 dark:text-stone-300">{item.responsiblePerson}</strong></span>
                  <span>กำหนดเวลาแล้วเสร็จ: <strong className="text-stone-700 dark:text-stone-300">{item.timeline}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: PK 1 */}
      {activeTab === 'pk1' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 sm:p-12 border border-stone-200/80 dark:border-stone-800 shadow-xs max-w-3xl mx-auto space-y-6 text-stone-800 dark:text-stone-200 text-xs sm:text-sm">
          <div className="text-center border-b border-stone-200 dark:border-stone-800 pb-6 space-y-2">
            <div className="flex justify-center mb-3">
              <svg viewBox="0 0 100 100" width="80" height="80" className="fill-current text-stone-900 dark:text-stone-100 shrink-0" aria-label="ตราครุฑ ๓ เซนติเมตร">
                <path d={GARUDA_SVG_PATH} />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
              หนังสือรับรองการปฏิบัติตามมาตรฐานการควบคุมภายใน (แบบ ปค.1)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">
              {orgProfile?.name} {orgProfile?.district} {orgProfile?.province}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              สำหรับปีงบประมาณสิ้นสุดวันที่ ๓๐ กันยายน พ.ศ. {toThaiDigits(selectedYear)}
            </p>
          </div>

          <div className="space-y-5 leading-relaxed text-sm">
            <p className="indent-10 text-justify">
              {orgProfile?.name} ได้ประเมินผลการควบคุมภายในของหน่วยงานตามมาตรฐานและหลักเกณฑ์ปฏิบัติการควบคุมภายในสำหรับหน่วยงานของรัฐที่กระทรวงการคลังกำหนด
              สำหรับปีงบประมาณสิ้นสุดวันที่ ๓๐ กันยายน พ.ศ. {toThaiDigits(selectedYear)}
            </p>

            <p className="indent-10 text-justify">
              จากผลการประเมินดังกล่าว เห็นว่า ระบบการควบคุมภายในของ {orgProfile?.name} มีความเพียงพอและมีประสิทธิผลตามสมควร
              ที่จะให้ความเชื่อมั่นอย่างสมเหตุสมผลว่า การดำเนินงานจะบรรลุวัตถุประสงค์ด้านการดำเนินงาน
              ด้านการรายงานทางการเงิน และด้านการปฏิบัติตามกฎหมายและระเบียบ
            </p>

            <div className="pt-10 text-center space-y-3">
              <div className="text-stone-400 font-mono tracking-widest">(ลงชื่อ)........................................................................</div>
              <div>
                <div className="font-bold text-base text-stone-900 dark:text-stone-100">
                  ({orgProfile?.approverName || pk1Data?.signer || 'นายกองค์กรปกครองส่วนท้องถิ่น'})
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  {orgProfile?.approverPosition || pk1Data?.position || 'นายกองค์กรปกครองส่วนท้องถิ่น'}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                  วันที่ {toThaiDigits(pk1Data?.signDate || `๓๐ กันยายน ${toThaiDigits(selectedYear)}`)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PK 6 - รายงานการสอบทานการประเมินผลการควบคุมภายในของผู้ตรวจสอบภายใน */}
      {activeTab === 'pk6' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 mb-2">
                  <Award className="w-3.5 h-3.5" />
                  <span>แบบฟอร์มตรวจสอบภายในตามหลักเกณฑ์กระทรวงการคลัง พ.ศ. ๒๕๖๑</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  แบบ ปค.6: รายงานการสอบทานการประเมินผลการควบคุมภายในของผู้ตรวจสอบภายใน
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  หน่วยตรวจสอบภายใน {orgProfile?.name || 'องค์กรปกครองส่วนท้องถิ่น'} • สำหรับระยะเวลาสิ้นสุดวันที่ 30 กันยายน พ.ศ. {selectedYear}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSavePk6}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors shrink-0 self-start sm:self-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกการสอบทาน ปค.6</span>
              </button>
            </div>

            {/* Scope & Introduction */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs text-stone-700 dark:text-stone-300 space-y-2">
              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>วัตถุประสงค์และขอบเขตการสอบทาน:</span>
              </div>
              <p className="leading-relaxed text-justify">
                หน่วยตรวจสอบภายในได้ทำการสอบทานรายงานการประเมินผลการควบคุมภายในของส่วนงานย่อย (แบบ ปค.4) และรายงานการติดตามการปฏิบัติตามแผนการปรับปรุงการควบคุมภายใน (แบบ ปค.5) ของฝ่ายบริหาร รวมทั้งสอบทานหลักฐานการปฏิบัติงานที่เกี่ยวข้อง เพื่อให้ความเชื่อมั่นอย่างสมเหตุสมผลว่าระบบการควบคุมภายในที่องค์กรจัดวางไว้มีความเพียงพอ เหมาะสม และมีการปฏิบัติตามอย่างมีประสิทธิผล
              </p>
            </div>

            {/* Overall Assurance Selector */}
            <div className="bg-stone-50 dark:bg-stone-850 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-3">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                บทสรุปความเห็นของผู้ตรวจสอบภายใน (Internal Auditor's Assurance):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border cursor-pointer flex items-start space-x-2.5 transition-all ${
                  pk6Data.overallAssurance === 'adequate'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/50 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                }`}>
                  <input
                    type="radio"
                    name="overallAssurance"
                    value="adequate"
                    checked={pk6Data.overallAssurance === 'adequate'}
                    onChange={() => handleUpdatePk6('overallAssurance', 'adequate')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div className="text-xs">
                    <span className="font-bold block">✓ ระบบการควบคุมภายในมีความเพียงพอและเหมาะสม</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">การควบคุมภายในโดยรวมมีความเพียงพอและมีประสิทธิผลตามสมควร มีการปฏิบัติตามอย่างต่อเนื่อง</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer flex items-start space-x-2.5 transition-all ${
                  pk6Data.overallAssurance === 'needs_improvement'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500/50 text-amber-900 dark:text-amber-200'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                }`}>
                  <input
                    type="radio"
                    name="overallAssurance"
                    value="needs_improvement"
                    checked={pk6Data.overallAssurance === 'needs_improvement'}
                    onChange={() => handleUpdatePk6('overallAssurance', 'needs_improvement')}
                    className="mt-0.5 accent-amber-600"
                  />
                  <div className="text-xs">
                    <span className="font-bold block">⚠️ มีข้อบกพร่องที่ควรได้รับการปรับปรุงเพิ่มเติม</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">มีจุดอ่อนหรือความเสี่ยงที่ฝ่ายบริหารต้องเร่งรัดปรับปรุงตามข้อเสนอแนะ</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                  ข้อความสรุปความเห็นของผู้ตรวจสอบภายใน:
                </label>
                <textarea
                  rows={3}
                  value={pk6Data.summaryOpinion}
                  onChange={(e) => handleUpdatePk6('summaryOpinion', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-800 dark:text-stone-200 leading-relaxed outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* 5 Elements Evaluation Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                ผลการสอบทานตาม 5 องค์ประกอบของการควบคุมภายใน (COSO Internal Control Framework):
              </h4>
              <div className="overflow-x-auto rounded-xl border border-stone-200/80 dark:border-stone-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800 font-bold">
                    <tr>
                      <th className="p-3 w-1/3">องค์ประกอบของการควบคุมภายใน</th>
                      <th className="p-3 w-28 text-center">ผลการสอบทาน</th>
                      <th className="p-3">ข้อสังเกตของผู้ตรวจสอบภายใน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200/80 dark:divide-stone-800">
                    {(pk6Data.elementsReview || []).map((el, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-850/50">
                        <td className="p-3 font-semibold text-stone-900 dark:text-stone-100 align-top">
                          {el.elementName}
                        </td>
                        <td className="p-3 text-center align-top">
                          <select
                            value={el.status}
                            onChange={(e) => handleUpdatePk6Element(idx, 'status', e.target.value)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
                              el.status === 'adequate'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            <option value="adequate">เพียงพอ</option>
                            <option value="needs_improvement">ควรปรับปรุง</option>
                          </select>
                        </td>
                        <td className="p-3 align-top">
                          <input
                            type="text"
                            value={el.observation || ''}
                            onChange={(e) => handleUpdatePk6Element(idx, 'observation', e.target.value)}
                            className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-800 dark:text-stone-200"
                            placeholder="ระบุข้อสังเกตหรือผลการสอบทาน..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                ข้อเสนอแนะในการปรับปรุงการควบคุมภายในของผู้ตรวจสอบภายใน:
              </label>
              <textarea
                rows={3}
                value={pk6Data.auditorRecommendations}
                onChange={(e) => handleUpdatePk6('auditorRecommendations', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-800 dark:text-stone-200 leading-relaxed outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="ระบุข้อเสนอแนะเชิงป้องกันและแก้ไข..."
              />
            </div>

            {/* Auditor Signature Block */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">ผู้ตรวจสอบภายใน:</span>
                  <input
                    type="text"
                    value={pk6Data.auditorName || effectiveAuditorName || ''}
                    onChange={(e) => handleUpdatePk6('auditorName', e.target.value)}
                    placeholder="ชื่อ-นามสกุล ผู้ตรวจสอบภายใน"
                    className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-800 dark:text-stone-200"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">ตำแหน่ง:</span>
                  <input
                    type="text"
                    value={pk6Data.auditorPosition || effectiveAuditorPosition || ''}
                    onChange={(e) => handleUpdatePk6('auditorPosition', e.target.value)}
                    placeholder="ตำแหน่ง"
                    className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-800 dark:text-stone-200"
                  />
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-stone-400 block">วันที่สอบทาน:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                  30 กันยายน พ.ศ. {selectedYear}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add PK.4 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900 z-10">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                เพิ่มกระบวนการประเมินผลการควบคุมภายใน (แบบ ปค.4)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPk4} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  สำนัก / กอง ที่รับผิดชอบ:
                </label>
                <select
                  value={newPk4.department}
                  onChange={(e) => setNewPk4({ ...newPk4, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100"
                >
                  {getDepartments().filter((d) => d !== 'หน่วยตรวจสอบภายใน').map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  กระบวนการปฏิบัติงานที่ประเมิน:
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กระบวนการจัดซื้อจัดจ้างและการบริหารสัญญา"
                  value={newPk4.evaluatedProcess}
                  onChange={(e) => setNewPk4({ ...newPk4, evaluatedProcess: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  ผลการประเมินการควบคุมภายใน:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="ระบุจุดควบคุมที่มีอยู่ และจุดบกพร่อง/ความเสี่ยงที่พบ"
                  value={newPk4.controlEvaluation}
                  onChange={(e) => setNewPk4({ ...newPk4, controlEvaluation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    ความเสี่ยงที่ยังมีอยู่:
                  </label>
                  <select
                    value={newPk4.residualRisk}
                    onChange={(e) => setNewPk4({ ...newPk4, residualRisk: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 font-bold"
                  >
                    <option value="ต่ำ">ต่ำ</option>
                    <option value="ปานกลาง">ปานกลาง</option>
                    <option value="สูง">สูง</option>
                    <option value="สูงมาก">สูงมาก</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  แผนการปรับปรุงการควบคุมภายใน:
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุกิจกรรมควบคุมเพิ่มเติมเพื่อลดความเสี่ยง"
                  value={newPk4.improvementPlan}
                  onChange={(e) => setNewPk4({ ...newPk4, improvementPlan: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-900/10 cursor-pointer"
                >
                  บันทึกรายการ ปค.4
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
