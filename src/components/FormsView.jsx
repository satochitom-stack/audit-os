import React, { useState, useMemo } from 'react';
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
  BookOpen
} from 'lucide-react';
import {
  V614_CATEGORIES,
  V614_OFFICIAL_TEMPLATES
} from '../data/v614TemplatesData';
import OfficialThaiMemo from './OfficialThaiMemo';
import OfficialThaiOrder from './OfficialThaiOrder';
import OfficialDocActionToolbar from './OfficialDocActionToolbar';

export default function FormsView({
  formsBase = [],
  onUpdateFormsBase,
  orgProfile = {},
  session,
  setCurrentTab
}) {
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
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

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-7 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Building className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{orgName}</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>หนังสือกรมบัญชีกลาง ว ๖๑๔ • ระเบียบ มท. ๒๕๔๕</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ระเบียบงานสารบรรณ พ.ศ. ๒๕๒๖ (ตราครุฑ & เกษียณสั่งการ)</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            แบบบันทึกข้อความ & คำสั่งการตรวจสอบภายใน (ว ๖๑๔ สารบรรณ)
          </h1>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Stage Tabs (ตาม 4 ขั้นตอนการตรวจสอบ) */}
          <div className="flex flex-wrap gap-1.5">
            {V614_CATEGORIES.map((cat) => {
              const isSelected = selectedStage === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedStage(cat.id)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 border border-transparent'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบันทึก, เรื่อง, รหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-800 dark:text-stone-100"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
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
              className={`px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                selectedDocType === type.id
                  ? 'bg-stone-800 text-white font-bold border-stone-900 dark:bg-stone-700'
                  : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-700 hover:border-amber-400'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid (20 รายการ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((doc) => {
          const isMemo = doc.docType === 'memo';
          const isOrder = doc.docType === 'order';

          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/90 dark:border-stone-800 hover:border-amber-500/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Card Top: Code & Type Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800/50">
                      {doc.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isOrder
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200'
                          : isMemo
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {isOrder
                        ? 'คำสั่ง (แบบ ๑๔)'
                        : isMemo
                        ? 'บันทึกข้อความ (แบบ ๒)'
                        : doc.docType === 'charter'
                        ? 'กฎบัตร/ประกาศ'
                        : 'แผนปฏิบัติงาน'}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold text-stone-400">
                    {doc.stageName}
                  </span>
                </div>

                {/* Title & Subject */}
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug">
                    {doc.title}
                  </h3>
                  <div className="text-xs text-amber-800 dark:text-amber-400 font-medium line-clamp-2">
                    เรื่อง: {doc.subject}
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed">
                  {doc.summary}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex-1 bg-amber-50 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-amber-900 dark:text-amber-200 font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer border border-amber-200/80 dark:border-stone-700"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                    <span>ดูสารบรรณ A4</span>
                  </button>

                  <OfficialDocActionToolbar
                    compact={true}
                    onDownloadWord={() => handleDownloadWord(doc)}
                    onPrint={() => handlePrintDocument(doc)}
                    wordTooltip={`ดาวน์โหลด ${doc.title} เป็นไฟล์ Word (.doc)`}
                    printTooltip={`พิมพ์ ${doc.title} / บันทึกเป็น PDF`}
                  />
                </div>

                {doc.linkedTab && setCurrentTab && (
                  <button
                    onClick={() => setCurrentTab(doc.linkedTab)}
                    className="w-full text-left py-1 px-2 rounded-lg text-[11px] font-bold text-stone-500 hover:text-amber-800 dark:hover:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="truncate">เชื่อมโยง: {doc.linkedTabName}</span>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">ไม่พบบันทึกข้อความหรือคำสั่งที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs text-stone-500 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
        </div>
      )}

      {/* FULL A4 SARABAN PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-stone-100 dark:bg-stone-900 rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-stone-300 dark:border-stone-800 shadow-2xl overflow-hidden">
            {/* Modal Control Header */}
            <div className="p-4 bg-white dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  {previewDoc.code}
                </span>
                <span className="font-bold text-sm text-stone-800 dark:text-stone-100 truncate">
                  {previewDoc.title}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <OfficialDocActionToolbar
                  onDownloadWord={() => handleDownloadWord(previewDoc)}
                  onPrint={() => handlePrintDocument(previewDoc)}
                  wordTooltip={`ดาวน์โหลด ${previewDoc.title} เป็นไฟล์ Word (.doc)`}
                  printTooltip={`พิมพ์ ${previewDoc.title} / บันทึกเป็น PDF`}
                />

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Realistic Thai Saraban Sheet */}
            <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex justify-center bg-stone-200/60 dark:bg-stone-950">
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

            {/* Modal Footer Controls */}
            <div className="p-4 bg-white dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleCopyText(
                      previewDoc.id,
                      previewDoc.fullContent ||
                        `${previewDoc.title}\n\n${previewDoc.part1_background}\n\n${previewDoc.part2_facts}\n\n${previewDoc.part3_proposal}`
                    )
                  }
                  className="bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกข้อความ</span>
                </button>
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
                    <span>เปิดใช้งานในระบบ ({previewDoc.linkedTabName})</span>
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
