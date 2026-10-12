import React, { useState, useMemo } from 'react';
import PageHeaderBanner from './PageHeaderBanner';
import {
  FileText,
  Search,
  Copy,
  Check,
  Eye,
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Filter,
  Download,
  Printer,
  ExternalLink,
  Building,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  BookOpen,
  Info
} from 'lucide-react';
import {
  V614_CATEGORIES,
  V614_OFFICIAL_TEMPLATES
} from '../data/v614TemplatesData';
import OfficialThaiMemo from './OfficialThaiMemo';
import OfficialThaiOrder from './OfficialThaiOrder';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';

const cleanCategoryLabel = (label) => {
  if (!label) return '';
  return label
    .replace(/^\d+\.\s*/, '')
    .replace(/\s*\(\d+\s*รายการ\)/, '')
    .trim();
};

export default function FormsView({
  formsBase = [],
  onUpdateFormsBase,
  orgProfile = {},
  session,
  setCurrentTab,
  selectedYear = '2569',
  riskManagement = {}
}) {
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewTab, setPreviewTab] = useState('a4'); // 'a4' | 'summary'
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const orgName = orgProfile?.name || session?.organization || 'องค์การบริหารส่วนตำบลต้นแบบ';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('คัดลอกข้อความเรียบร้อยแล้ว');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return V614_OFFICIAL_TEMPLATES.filter((doc) => {
      if (selectedStage !== 'all' && doc.stage !== selectedStage) return false;
      if (selectedDocType !== 'all' && doc.docType !== selectedDocType) return false;

      const q = searchTerm.toLowerCase();
      if (!q) return true;

      return (
        (doc.title || '').toLowerCase().includes(q) ||
        (doc.code || '').toLowerCase().includes(q) ||
        (doc.subject || '').toLowerCase().includes(q) ||
        (doc.summary || '').toLowerCase().includes(q)
      );
    });
  }, [selectedStage, selectedDocType, searchTerm]);

  // Download Microsoft Word (.doc) File with exact Saraban Margins and Styling
  const handleDownloadWord = (doc) => {
    const resolvedOrg = orgName;
    let bodyContent = '';

    if (doc.docType === 'order') {
      bodyContent = `
        <div style="text-align: center; margin-bottom: 20pt;">
          <p style="text-align: center; margin: 0 0 6pt 0;"><span style="font-size: 22pt; font-weight: bold; font-family: 'TH Sarabun PSK';">(ตราครุฑ)</span></p>
          <p style="font-size: 20pt; font-weight: bold; margin: 2pt 0 0 0; font-family: 'TH Sarabun PSK';">${doc.title || 'คำสั่ง' + resolvedOrg}</p>
          <p style="font-size: 16pt; font-weight: bold; margin: 2pt 0 0 0; font-family: 'TH Sarabun PSK';">${doc.docNumber || 'ที่ ........./๒๕๖๙'}</p>
          <p style="font-size: 16pt; font-weight: bold; margin: 2pt 0 12pt 0; font-family: 'TH Sarabun PSK';">เรื่อง ${doc.subject || doc.title}</p>
        </div>
        <div style="border-top: 1pt solid black; margin-bottom: 12pt;"></div>
        <p style="text-indent: 2.5cm; margin-bottom: 8pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          ${(doc.orderPreamble || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg).replace(/\n/g, '<br/>')}
        </p>
        ${(doc.orderClauses || [])
          .map(
            (c) =>
              `<p style="margin-left: 2cm; margin-bottom: 6pt; text-align: justify; font-size: 16pt; font-family: 'TH Sarabun PSK';">${c.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg)}</p>`
          )
          .join('')}
        <p style="text-indent: 2.5cm; margin-top: 12pt; margin-bottom: 8pt; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          ${(doc.orderEffectiveDate || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg)}
        </p>
        <p style="text-indent: 3cm; margin-top: 12pt; margin-bottom: 24pt; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          ${doc.docDate || ''}
        </p>
        <table style="width: 100%; border: none; margin-top: 30pt;">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: center; font-size: 16pt; font-family: 'TH Sarabun PSK';">
              <p style="margin: 0;">(ลงชื่อ)........................................................</p>
              <p style="margin: 4pt 0 0 0; font-weight: bold;">${doc.orderSignatoryName || '([ชื่อ-นามสกุล นายก อปท.])'}</p>
              <p style="margin: 2pt 0 0 0;">${doc.orderSignatoryPosition ? doc.orderSignatoryPosition.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg) : 'นายก' + resolvedOrg}</p>
            </td>
          </tr>
        </table>
      `;
    } else if (doc.docType === 'charter' || doc.docType === 'plan') {
      bodyContent = `
        <div style="text-align: center; margin-bottom: 20pt;">
          <p style="text-align: center; margin: 0 0 6pt 0;"><span style="font-size: 22pt; font-weight: bold; font-family: 'TH Sarabun PSK';">(ตราครุฑ)</span></p>
          <p style="font-size: 20pt; font-weight: bold; margin: 2pt 0 0 0; font-family: 'TH Sarabun PSK';">${doc.title.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg)}</p>
          <p style="font-size: 16pt; font-weight: bold; margin: 2pt 0 12pt 0; font-family: 'TH Sarabun PSK';">${doc.docNumber || ''}</p>
        </div>
        <div style="border-top: 1pt solid black; margin-bottom: 12pt;"></div>
        <div style="font-size: 16pt; line-height: 1.35; font-family: 'TH Sarabun PSK'; text-align: justify;">
          ${(doc.fullContent || doc.summary).replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg).replace(/\n/g, '<br/>')}
        </div>
        <table style="width: 100%; border: none; margin-top: 30pt;">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: center; font-size: 16pt; font-family: 'TH Sarabun PSK';">
              <p style="margin: 0;">(ลงชื่อ)........................................................</p>
              <p style="margin: 4pt 0 0 0; font-weight: bold;">${doc.signatoryName || '([ชื่อ-นามสกุล นายก อปท.])'}</p>
              <p style="margin: 2pt 0 0 0;">${doc.signatoryPosition ? doc.signatoryPosition.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg) : 'นายก' + resolvedOrg}</p>
            </td>
          </tr>
        </table>
      `;
    } else {
      // บันทึกข้อความ (Official Memorandum Form 2)
      bodyContent = `
        <table style="width: 100%; border-bottom: 2pt solid black; padding-bottom: 8pt; margin-bottom: 14pt;">
          <tr>
            <td style="width: 20%; vertical-align: top;">
              <span style="font-size: 18pt; font-weight: bold; font-family: 'TH Sarabun PSK';">(ตราครุฑ)</span>
            </td>
            <td style="width: 80%; text-align: center; vertical-align: middle;">
              <span style="font-size: 26pt; font-weight: bold; letter-spacing: 2px; font-family: 'TH Sarabun PSK';">บันทึกข้อความ</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 8pt;">
              <p style="margin: 0 0 4pt 0; font-size: 16pt; font-family: 'TH Sarabun PSK';">
                <strong>ส่วนราชการ:</strong> ${doc.agency ? doc.agency.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg) : 'หน่วยตรวจสอบภายใน ' + resolvedOrg} ${doc.phone ? 'โทร. ' + doc.phone : ''}
              </p>
              <table style="width: 100%; border: none; margin: 0; padding: 0;">
                <tr>
                  <td style="width: 50%; padding: 0;">
                    <p style="margin: 0 0 4pt 0; font-size: 16pt; font-family: 'TH Sarabun PSK';"><strong>ที่:</strong> ${doc.docNumber || 'อบ ........./๒๕๖๙'}</p>
                  </td>
                  <td style="width: 50%; padding: 0;">
                    <p style="margin: 0 0 4pt 0; font-size: 16pt; font-family: 'TH Sarabun PSK';"><strong>วันที่:</strong> ${doc.docDate || '...... เดือน ................... พ.ศ. .........'}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 16pt; font-family: 'TH Sarabun PSK';">
                <strong>เรื่อง:</strong> <strong>${doc.subject || doc.title}</strong>
              </p>
            </td>
          </tr>
        </table>

        <p style="font-size: 16pt; margin-bottom: 12pt; font-family: 'TH Sarabun PSK';">
          <strong>เรียน:</strong> ${doc.to ? doc.to.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg) : 'นายก' + resolvedOrg}
        </p>

        <p style="text-indent: 2.5cm; margin-bottom: 8pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          ${(doc.part1_background || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg).replace(/\n/g, '<br/>')}
        </p>

        <p style="text-indent: 2.5cm; margin-bottom: 8pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          ${(doc.part2_facts || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg).replace(/\n/g, '<br/>')}
        </p>

        <p style="text-indent: 2.5cm; margin-bottom: 16pt; text-align: justify; line-height: 1.35; font-size: 16pt; font-family: 'TH Sarabun PSK';">
          ${(doc.part3_proposal || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg).replace(/\n/g, '<br/>')}
        </p>

        <!-- ลายมือชื่อผู้ตรวจ -->
        <table style="width: 100%; border: none; margin-top: 24pt; margin-bottom: 24pt;">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: center; font-size: 16pt; font-family: 'TH Sarabun PSK';">
              <p style="margin: 0;">(ลงชื่อ)........................................................</p>
              <p style="margin: 4pt 0 0 0; font-weight: bold;">${doc.signatoryName || '([ชื่อ-นามสกุล ผู้ตรวจสอบภายใน])'}</p>
              <p style="margin: 2pt 0 0 0;">${doc.signatoryPosition || 'นักวิชาการตรวจสอบภายในชำนาญการ'}</p>
              ${doc.signatoryRole ? `<p style="margin: 2pt 0 0 0; font-size: 14pt;">(${doc.signatoryRole})</p>` : ''}
            </td>
          </tr>
        </table>

        <!-- ส่วนเกษียณหนังสือ (ข้อสั่งการ) -->
        <table style="width: 100%; border-top: 1.5pt solid black; margin-top: 20pt; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; border: 1pt solid #777; padding: 8pt; vertical-align: top; font-size: 15pt; font-family: 'TH Sarabun PSK';">
              <p style="margin: 0 0 6pt 0; font-weight: bold; text-decoration: underline;">ความเห็นของปลัดองค์กรปกครองส่วนท้องถิ่น</p>
              <p style="margin: 0 0 4pt 0; font-size: 14pt;">เรียน นายก${resolvedOrg}</p>
              <p style="margin: 0 0 3pt 0;">[  ] เพื่อโปรดทราบ</p>
              <p style="margin: 0 0 3pt 0;">[  ] ${doc.palatReview || 'เห็นควรอนุมัติและสั่งการตามเสนอ'}</p>
              <p style="margin: 0 0 12pt 0;">[  ] อื่นๆ ..............................................................</p>
              <p style="text-align: center; margin: 16pt 0 0 0;">(ลงชื่อ)........................................................</p>
              <p style="text-align: center; margin: 2pt 0 0 0; font-size: 14pt;">ปลัด${resolvedOrg}</p>
            </td>
            <td style="width: 50%; border: 1pt solid #777; padding: 8pt; vertical-align: top; font-size: 15pt; font-family: 'TH Sarabun PSK';">
              <p style="margin: 0 0 6pt 0; font-weight: bold; text-decoration: underline;">คำสั่งการของนายกองค์กรปกครองส่วนท้องถิ่น</p>
              <p style="margin: 0 0 3pt 0;">[  ] ทราบ</p>
              <p style="margin: 0 0 3pt 0;">[  ] ${doc.executiveOrder || 'อนุมัติ / เห็นชอบตามเสนอ'}</p>
              <p style="margin: 0 0 12pt 0;">[  ] อื่นๆ ..............................................................</p>
              <p style="text-align: center; margin: 16pt 0 0 0;">(ลงชื่อ)........................................................</p>
              <p style="text-align: center; margin: 2pt 0 0 0; font-size: 14pt;">นายก${resolvedOrg}</p>
            </td>
          </tr>
        </table>
      `;
    }

    const fullWordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${doc.title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt; /* A4 Portrait */
            margin: 70.85pt 56.7pt 56.7pt 70.85pt; /* Top 2.5cm, Right 2.0cm, Bottom 2.0cm, Left 2.5cm */
            mso-header-margin: 36pt;
            mso-footer-margin: 36pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Angsana New', sans-serif;
            font-size: 16pt;
            line-height: 1.25;
            color: #000;
          }
          p { margin: 0 0 6pt 0; font-size: 16pt; font-family: 'TH Sarabun PSK', sans-serif; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${bodyContent}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', fullWordHtml], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.code} - ${doc.title.slice(0, 40)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`ดาวน์โหลดไฟล์ Word (.doc) สำเร็จแล้ว!`);
  };

  // Direct Standard Print Window
  const handlePrintDocument = (doc) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์เอกสาร');
      return;
    }
    const resolvedOrg = orgName;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${doc.title}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 2.5cm 2cm 2cm 2.5cm;
            }
            body {
              font-family: 'Sarabun', 'TH Sarabun New', Tahoma, sans-serif;
              padding: 0;
              margin: 0;
              line-height: 1.6;
              color: #000;
              background: #fff;
              font-size: 15px;
            }
            .memo-header {
              border-bottom: 2px solid black;
              padding-bottom: 10px;
              margin-bottom: 18px;
            }
            .memo-title {
              text-align: center;
              font-size: 26px;
              font-weight: bold;
              margin: 0;
            }
            .indent {
              text-indent: 2.5cm;
              text-align: justify;
              margin-bottom: 12px;
            }
            table { width: 100%; border-collapse: collapse; }
            .review-box { border: 1px solid #666; padding: 10px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${
            doc.docType === 'order'
              ? `
            <div style="text-align:center; margin-bottom: 24px;">
              <div style="font-size: 22px; font-weight: bold; margin-bottom: 4px;">(ตราครุฑ)</div>
              <h1 style="font-size: 22px; font-weight: bold; margin: 0;">${doc.title || 'คำสั่ง' + resolvedOrg}</h1>
              <div style="font-size: 16px; font-weight: bold; margin-top: 4px;">${doc.docNumber || 'ที่ ........./๒๕๖๙'}</div>
              <div style="font-size: 16px; font-weight: bold; margin-top: 4px;">เรื่อง ${doc.subject || doc.title}</div>
            </div>
            <hr style="border: 0.5px solid black; margin-bottom: 16px;" />
            <div class="indent">${(doc.orderPreamble || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg).replace(/\n/g, '<br/>')}</div>
            ${(doc.orderClauses || []).map((c) => `<div style="padding-left: 1.5cm; margin-bottom: 8px; text-align: justify;">${c.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg)}</div>`).join('')}
            <div class="indent" style="margin-top: 16px;">${(doc.orderEffectiveDate || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg)}</div>
            <div style="text-indent: 3cm; margin-top: 16px;">${doc.docDate || ''}</div>
            <div style="margin-top: 40px; text-align: right; padding-right: 40px;">
              <div>(ลงชื่อ)........................................................</div>
              <div style="font-weight: bold; margin-top: 6px;">${doc.orderSignatoryName || '([ชื่อ-นามสกุล นายก อปท.])'}</div>
              <div>${doc.orderSignatoryPosition ? doc.orderSignatoryPosition.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg) : 'นายก' + resolvedOrg}</div>
            </div>
          `
              : `
            <div class="memo-header">
              <table style="width: 100%;">
                <tr>
                  <td style="width: 20%; vertical-align: top; font-weight: bold; font-size: 18px;">(ตราครุฑ)</td>
                  <td style="width: 80%; text-align: center;"><div class="memo-title">บันทึกข้อความ</div></td>
                </tr>
              </table>
              <div style="margin-top: 12px; font-size: 15px;">
                <div style="margin-bottom: 4px;"><strong>ส่วนราชการ:</strong> ${doc.agency ? doc.agency.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg) : 'หน่วยตรวจสอบภายใน ' + resolvedOrg} ${doc.phone ? 'โทร. ' + doc.phone : ''}</div>
                <table style="width: 100%; margin-bottom: 4px;">
                  <tr>
                    <td style="width: 50%;"><strong>ที่:</strong> ${doc.docNumber || 'อบ ........./๒๕๖๙'}</td>
                    <td style="width: 50%;"><strong>วันที่:</strong> ${doc.docDate || '...... เดือน ................... พ.ศ. .........'}</td>
                  </tr>
                </table>
                <div><strong>เรื่อง:</strong> <strong>${doc.subject || doc.title}</strong></div>
              </div>
            </div>

            <div style="margin-bottom: 14px;"><strong>เรียน:</strong> ${doc.to ? doc.to.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg) : 'นายก' + resolvedOrg}</div>

            <div class="indent">${(doc.part1_background || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg).replace(/\n/g, '<br/>')}</div>
            <div class="indent">${(doc.part2_facts || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg).replace(/\n/g, '<br/>')}</div>
            <div class="indent">${(doc.part3_proposal || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, resolvedOrg).replace(/\n/g, '<br/>')}</div>

            <div style="margin-top: 36px; text-align: right; padding-right: 40px;">
              <div>(ลงชื่อ)........................................................</div>
              <div style="font-weight: bold; margin-top: 6px;">${doc.signatoryName || '([ชื่อ-นามสกุล ผู้ตรวจสอบภายใน])'}</div>
              <div>${doc.signatoryPosition || 'นักวิชาการตรวจสอบภายในชำนาญการ'}</div>
            </div>

            <table style="width: 100%; border-top: 2px solid black; margin-top: 30px; font-size: 13px;">
              <tr>
                <td style="width: 50%; border: 1px solid #777; padding: 10px; vertical-align: top;">
                  <div style="font-weight: bold; text-decoration: underline; margin-bottom: 6px;">ความเห็นของปลัดองค์กรปกครองส่วนท้องถิ่น</div>
                  <div>เรียน นายก${resolvedOrg}</div>
                  <div>[  ] เพื่อโปรดทราบ</div>
                  <div>[  ] ${doc.palatReview || 'เห็นควรอนุมัติตามเสนอ'}</div>
                  <div style="margin-top: 24px; text-align: center;">
                    <div>(ลงชื่อ)........................................................</div>
                    <div>ปลัด${resolvedOrg}</div>
                  </div>
                </td>
                <td style="width: 50%; border: 1px solid #777; padding: 10px; vertical-align: top;">
                  <div style="font-weight: bold; text-decoration: underline; margin-bottom: 6px;">คำสั่งการของนายกองค์กรปกครองส่วนท้องถิ่น</div>
                  <div>[  ] ทราบ</div>
                  <div>[  ] ${doc.executiveOrder || 'อนุมัติ / เห็นชอบตามเสนอ'}</div>
                  <div style="margin-top: 24px; text-align: center;">
                    <div>(ลงชื่อ)........................................................</div>
                    <div>นายก${resolvedOrg}</div>
                  </div>
                </td>
              </tr>
            </table>
          `
          }
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <PageHeaderBanner
        title="หนังสือราชการ บันทึกข้อความ และคำสั่ง (ระเบียบงานสารบรรณ)"
        orgName={orgProfile?.name}
        auditorName="ระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ"
        year={selectedYear}
      />

      {/* Control Bar: Stages, Types & Search (Cleaned & Contained like Central Knowledge Hub) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
          {/* Stage Tabs (ตามขั้นตอนการตรวจสอบ พร้อมตัวนับรายการ) */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {V614_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all'
                  ? V614_OFFICIAL_TEMPLATES.length
                  : V614_OFFICIAL_TEMPLATES.filter((d) => d.stage === cat.id).length;
              const isSelected = selectedStage === cat.id;
              const displayLabel = cleanCategoryLabel(cat.label);

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedStage(isSelected && cat.id !== 'all' ? 'all' : cat.id);
                  }}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs'
                      : 'bg-stone-100/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 border border-transparent'
                  }`}
                >
                  <span>{displayLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box (Contained) */}
          <div className="relative w-full sm:w-64 md:w-72 max-w-full shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบันทึก, เรื่อง, รหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-800 dark:text-stone-100 transition-all box-border"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
          <span className="text-stone-400 font-semibold mr-1">จำแนกตามประเภทหนังสือ:</span>
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'memo', label: 'บันทึกข้อความ (แบบที่ ๒)' },
            { id: 'order', label: 'คำสั่ง (แบบที่ ๑๔)' },
            { id: 'charter', label: 'กฎบัตร / นโยบาย' },
            { id: 'plan', label: 'แผนงาน / Engagement Plan' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedDocType(type.id)}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                selectedDocType === type.id
                  ? 'bg-stone-800 text-white font-bold border-stone-900 dark:bg-stone-700 dark:border-stone-600 shadow-2xs'
                  : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-700 hover:border-amber-400'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Note Above List */}
      <div className="flex items-center justify-between text-xs text-stone-400 px-1 font-medium">
        <div>
          {selectedStage !== 'all' && (
            <span className="text-amber-700 dark:text-amber-400 text-[11px] bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-900/40">
              หมวดหมู่: {cleanCategoryLabel(V614_CATEGORIES.find((c) => c.id === selectedStage)?.label || '')}
            </span>
          )}
        </div>
        <div className="text-[11px] text-stone-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-amber-600" />
          <span>คลิกที่รายการเพื่อเปิดดูบันทึกข้อความและคำสั่ง (ระเบียบงานสารบรรณ A4) ได้ทันทีโดยไม่ต้องดาวน์โหลด</span>
        </div>
      </div>

      {/* CLEAN NUMBERED LIST VIEW (แสดงเป็นรายการมีลำดับเหมือนคลังเอกสารกลาง) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
        {filteredTemplates.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
            {filteredTemplates.map((doc, index) => {
              const isMemo = doc.docType === 'memo';
              const isOrder = doc.docType === 'order';
              const isCharter = doc.docType === 'charter';
              const isPlan = doc.docType === 'plan';

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setPreviewDoc(doc);
                    setPreviewTab('a4');
                  }}
                  className="group p-4 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  {/* Left: Number + Main Title */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Number Badge (1, 2, 3...) */}
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono font-bold text-xs flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
                      {index + 1}
                    </div>

                    {/* Title & Metadata */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Title */}
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors leading-snug">
                          {doc.title}
                        </h3>

                        {/* Document Type Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isOrder
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60'
                              : isMemo
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60'
                              : isCharter
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900/60'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60'
                          }`}
                        >
                          {isOrder
                            ? 'คำสั่ง (แบบ ๑๔)'
                            : isMemo
                            ? 'บันทึกข้อความ (แบบ ๒)'
                            : isCharter
                            ? 'กฎบัตร/ประกาศ'
                            : 'แผนปฏิบัติงาน'}
                        </span>

                        {/* Code Badge */}
                        {doc.code && (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                            {doc.code}
                          </span>
                        )}
                      </div>

                      {/* Sub-line: Subject, Stage, & Link */}
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                        {doc.subject && (
                          <span className="text-amber-850 dark:text-amber-300/90 font-medium">
                            เรื่อง: {doc.subject}
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1 text-stone-400">
                          <Layers className="w-3 h-3 text-stone-400" />
                          <span>{doc.stageName}</span>
                        </span>
                        {doc.linkedTabName && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>เชื่อมโยง: {doc.linkedTabName}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Stage Pill */}
                  <div className="hidden lg:flex shrink-0 items-center">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60">
                      {doc.stageName}
                    </span>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div
                    className="flex items-center space-x-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* View / Open Button (เปิดดู สารบรรณ A4) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDoc(doc);
                        setPreviewTab('a4');
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                      title="เปิดดูหนังสือสารบรรณ A4 ทันที"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>เปิดดู</span>
                    </button>

                    {/* Detail / Summary Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDoc(doc);
                        setPreviewTab('summary');
                      }}
                      className="hidden sm:flex bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold py-1.5 px-2.5 rounded-xl text-xs transition-all items-center space-x-1 cursor-pointer"
                      title="ดูสาระสำคัญและข้อเสนอ"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>รายละเอียด</span>
                    </button>

                    {/* Download Word & Print Toolbar */}
                    <OfficialDocActionToolbar
                      compact={true}
                      onDownloadWord={() => handleDownloadWord(doc)}
                      onPrint={() => handlePrintDocument(doc)}
                      wordTooltip={`ส่งออก ${doc.title} เป็นไฟล์ Word (.doc)`}
                      printTooltip={`พิมพ์ ${doc.title} / ส่งออกเป็น PDF`}
                    />

                    {/* Copy Text Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(
                          doc.id,
                          doc.fullContent ||
                            `${doc.title}\nเรื่อง: ${doc.subject}\n\nข้อความ:\n${doc.part1_background || ''}\n${doc.part2_facts || ''}\n${doc.part3_proposal || ''}`
                        );
                      }}
                      className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                      title="คัดลอกข้อความ"
                    >
                      {copiedId === doc.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Direct Link to System (if linkedTab) */}
                    {doc.linkedTab && setCurrentTab && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentTab(doc.linkedTab);
                        }}
                        className="hidden xl:flex p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
                        title={`ไปยังระบบ: ${doc.linkedTabName}`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">
              ไม่พบบันทึกข้อความหรือคำสั่งที่ตรงกับเงื่อนไข
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
              ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น
            </p>
          </div>
        )}
      </div>

      {/* FULL IN-APP PREVIEW & DETAIL MODAL (เหมือนคลังเอกสารกลาง) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-stone-200/80 dark:border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4 bg-stone-50/70 dark:bg-stone-850/70">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                    {previewDoc.code}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    {previewDoc.stageName}
                  </span>
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Building className="w-3 h-3 text-stone-400" />
                    <span>{orgName}</span>
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {previewDoc.title}
                </h2>

                {previewDoc.subject && (
                  <div className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                    เรื่อง: {previewDoc.subject}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setPreviewTab('a4')}
                  className={`py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    previewTab === 'a4'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>👁️ ดูหนังสือสารบรรณ A4 (In-app Preview)</span>
                </button>

                <button
                  onClick={() => setPreviewTab('summary')}
                  className={`py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    previewTab === 'summary'
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📋 สาระสำคัญ & รายละเอียด</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center space-x-2">
                <OfficialDocActionToolbar
                  compact={true}
                  onDownloadWord={() => handleDownloadWord(previewDoc)}
                  onPrint={() => handlePrintDocument(previewDoc)}
                  wordTooltip={`ส่งออกเป็น Word (.doc)`}
                  printTooltip={`พิมพ์ / PDF`}
                />
              </div>
            </div>

            {/* Modal Body */}
            {previewTab === 'a4' ? (
              <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex justify-center bg-stone-200/60 dark:bg-stone-950 flex-1">
                {previewDoc.docType === 'order' ? (
                  <OfficialThaiOrder
                    orderHeader={previewDoc.title || `คำสั่ง${orgName}`}
                    orderNumber={previewDoc.docNumber || 'ที่ ........./๒๕๖๙'}
                    orderSubject={previewDoc.subject || previewDoc.title}
                    preamble={(previewDoc.orderPreamble || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)}
                    clauses={(previewDoc.orderClauses || []).map((c) =>
                      c.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)
                    )}
                    effectiveDate={(previewDoc.orderEffectiveDate || '').replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)}
                    issuedDate={previewDoc.docDate || ''}
                    signatory={{
                      name: previewDoc.orderSignatoryName || '([ชื่อ-นามสกุล นายก อปท.])',
                      position: previewDoc.orderSignatoryPosition
                        ? previewDoc.orderSignatoryPosition.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)
                        : `นายก${orgName}`
                    }}
                  />
                ) : previewDoc.docType === 'charter' || previewDoc.docType === 'plan' ? (
                  <div
                    className="bg-white text-black p-8 sm:p-14 max-w-4xl w-full mx-auto shadow-md border border-stone-300"
                    style={{
                      fontFamily: "'Sarabun', 'TH Sarabun New', Tahoma, sans-serif",
                      lineHeight: 1.6,
                      fontSize: '15px'
                    }}
                  >
                    <div className="text-center pb-4">
                      <div className="font-bold text-lg mb-1">(ตราครุฑ)</div>
                      <h1 className="font-bold text-xl text-black">
                        {previewDoc.title.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)}
                      </h1>
                      <div className="font-bold text-sm text-stone-600 mt-1">{previewDoc.docNumber}</div>
                    </div>
                    <hr className="border-stone-400 my-4" />
                    <div className="space-y-4 py-2 text-justify text-[15px] leading-relaxed whitespace-pre-line">
                      {(previewDoc.fullContent || previewDoc.summary).replace(
                        /\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g,
                        orgName
                      )}
                    </div>
                    <div className="pt-8 flex justify-end">
                      <div className="w-64 text-center space-y-4">
                        <div>(ลงชื่อ)........................................................</div>
                        <div className="font-bold">
                          {previewDoc.signatoryName || '([ชื่อ-นามสกุล นายก อปท.])'}
                        </div>
                        <div className="text-sm">นายก{orgName}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <OfficialThaiMemo
                    agency={
                      previewDoc.agency
                        ? previewDoc.agency.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)
                        : `หน่วยตรวจสอบภายใน ${orgName}`
                    }
                    phone={previewDoc.phone || '๐-xxxx-xxxx'}
                    docNumber={previewDoc.docNumber || 'อบ ........./๒๕๖๙'}
                    date={previewDoc.docDate || '...... เดือน ................... พ.ศ. .........'}
                    subject={previewDoc.subject || previewDoc.title}
                    to={
                      previewDoc.to
                        ? previewDoc.to.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)
                        : `นายก${orgName} (ผ่าน ปลัด${orgName})`
                    }
                    signatory={{
                      name: previewDoc.signatoryName || '([ชื่อ-นามสกุล ผู้ตรวจสอบภายใน])',
                      position: previewDoc.signatoryPosition || 'นักวิชาการตรวจสอบภายในชำนาญการ',
                      role: previewDoc.signatoryRole || 'ผู้ตรวจสอบภายใน'
                    }}
                    palatReview={{
                      name: '........................................................',
                      position: `ปลัด${orgName}`
                    }}
                    executiveOrder={{
                      name: '........................................................',
                      position: `นายก${orgName}`
                    }}
                    showReviewBoxes={true}
                  >
                    <p className="indent-10">
                      {(previewDoc.part1_background || '').replace(
                        /\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g,
                        orgName
                      )}
                    </p>
                    <p className="indent-10">
                      {(previewDoc.part2_facts || '').replace(
                        /\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g,
                        orgName
                      )}
                    </p>
                    <p className="indent-10">
                      {(previewDoc.part3_proposal || '').replace(
                        /\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g,
                        orgName
                      )}
                    </p>
                  </OfficialThaiMemo>
                )}
              </div>
            ) : (
              /* TAB: SUMMARY & DETAILS */
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-stone-700 dark:text-stone-300 custom-scrollbar">
                {/* Subject & Summary */}
                <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                  <div className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>สรุปสาระสำคัญของเอกสาร</span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-xs">
                    {previewDoc.summary}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-700 space-y-1">
                    <span className="text-stone-400 font-semibold block text-[11px]">รหัส / ลำดับที่</span>
                    <p className="font-mono font-bold text-stone-800 dark:text-stone-100 text-xs">
                      {previewDoc.code}
                    </p>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-700 space-y-1">
                    <span className="text-stone-400 font-semibold block text-[11px]">ประเภทหนังสือสารบรรณ</span>
                    <p className="font-bold text-stone-800 dark:text-stone-100 text-xs">
                      {previewDoc.docType === 'order'
                        ? 'คำสั่ง (แบบ ๑๔)'
                        : previewDoc.docType === 'memo'
                        ? 'บันทึกข้อความ (แบบ ๒)'
                        : previewDoc.docType === 'charter'
                        ? 'กฎบัตร / ประกาศ'
                        : 'แผนปฏิบัติงาน'}
                    </p>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-700 space-y-1">
                    <span className="text-stone-400 font-semibold block text-[11px]">ขั้นตอนการตรวจสอบ</span>
                    <p className="font-bold text-stone-800 dark:text-stone-100 text-xs">
                      {previewDoc.stageName}
                    </p>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-700 space-y-1">
                    <span className="text-stone-400 font-semibold block text-[11px]">ผู้ลงนามตามระเบียบ</span>
                    <p className="font-bold text-stone-800 dark:text-stone-100 text-xs">
                      {previewDoc.signatoryName || previewDoc.orderSignatoryName || 'ผู้ตรวจสอบภายใน / นายก อปท.'}
                    </p>
                  </div>
                </div>

                {/* Structure / Content Breakdown */}
                {previewDoc.part1_background && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>โครงสร้างเนื้อหาตามระเบียบงานสารบรรณ</span>
                    </h4>

                    <div className="space-y-2">
                      <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-200/70 dark:border-stone-700">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1">๑. ต้นเรื่อง / ความเป็นมา:</span>
                        <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-xs">
                          {previewDoc.part1_background.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)}
                        </p>
                      </div>

                      <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-200/70 dark:border-stone-700">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1">๒. ข้อเท็จจริงและข้อพิจารณา:</span>
                        <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-xs whitespace-pre-line">
                          {previewDoc.part2_facts.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)}
                        </p>
                      </div>

                      <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-200/70 dark:border-stone-700">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1">๓. ข้อเสนอ:</span>
                        <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-xs whitespace-pre-line">
                          {previewDoc.part3_proposal.replace(/\[ชื่อองค์กรปกครองส่วนท้องถิ่น\]/g, orgName)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Linked Tab Box */}
                {previewDoc.linkedTab && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                        🔗 เอกสารนี้เชื่อมโยงกับระบบ: {previewDoc.linkedTabName}
                      </span>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        คุณสามารถเปิดใช้งานระบบที่เกี่ยวข้องได้ทันที
                      </p>
                    </div>
                    {setCurrentTab && (
                      <button
                        onClick={() => {
                          setCurrentTab(previewDoc.linkedTab);
                          setPreviewDoc(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1 cursor-pointer shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดใช้งาน</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50/80 dark:bg-stone-850/80 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleCopyText(
                      previewDoc.id,
                      previewDoc.fullContent ||
                        `${previewDoc.title}\nเรื่อง: ${previewDoc.subject}\n\n${previewDoc.part1_background || ''}\n\n${previewDoc.part2_facts || ''}\n\n${previewDoc.part3_proposal || ''}`
                    )
                  }
                  className="bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedId === previewDoc.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>คัดลอกข้อความ</span>
                </button>

                <OfficialDocActionToolbar
                  onDownloadWord={() => handleDownloadWord(previewDoc)}
                  onPrint={() => handlePrintDocument(previewDoc)}
                  wordTooltip={`ส่งออกเป็นไฟล์ Word (.doc)`}
                  printTooltip={`พิมพ์ / ส่งออกเป็น PDF`}
                />
              </div>

              <div className="flex items-center space-x-2">
                {previewDoc.linkedTab && setCurrentTab && (
                  <button
                    onClick={() => {
                      setCurrentTab(previewDoc.linkedTab);
                      setPreviewDoc(null);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดใช้งาน ({previewDoc.linkedTabName})</span>
                  </button>
                )}

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="bg-stone-800 text-white hover:bg-stone-700 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
