import React, { useState } from 'react';
import {
  Wrench,
  Calculator,
  HardHat,
  FileCheck2,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  ClipboardList,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import AuditToolkits from './AuditToolkits';

export default function TechnicalToolkitsView({
  selectedYear = '2570',
  workingPapers = [],
  setWorkingPapers,
  setSelectedWp,
  setCurrentTab,
  initialTool = 'factor-f'
}) {
  const [activeTool, setActiveTool] = useState(initialTool);

  const TOOL_TOPICS = [
    {
      id: 'factor-f',
      wpId: 'WP-PRICE-2570',
      title: 'การคำนวณราคากลางงานก่อสร้าง & Factor F',
      icon: Calculator,
      color: 'blue',
      badge: 'แบบ ปร.4, 5, 6',
      description: 'ตรวจสอบค่างานต้นทุน, ตาราง Factor F, ราคาวัสดุพาณิชย์จังหวัด, อัตราค่าแรงกรมบัญชีกลาง, และตารางเปิดเผยราคากลาง บก.01',
      legalReference: 'หลักเกณฑ์การคำนวณราคากลางงานก่อสร้างของราชการ (กรมบัญชีกลาง)'
    },
    {
      id: 'penalty',
      wpId: 'WP-PROC-2570',
      title: 'การจัดซื้อจัดจ้าง & คำนวณค่าปรับส่งมอบล่าช้า',
      icon: Clock,
      color: 'amber',
      badge: 'พ.ร.บ. จัดซื้อจัดจ้างฯ 2560',
      description: 'ตรวจสอบครบวงจร 7 ขั้นตอน (แผน e-GP -> ขอซื้อจ้าง -> สัญญา -> ตรวจรับ -> คิดค่าปรับ 0.1%/0.2% -> คืนหลักประกัน 5%)',
      legalReference: 'พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ม. 175 & ระเบียบฯ ข้อ 175-182'
    },
    {
      id: 'ordinance',
      wpId: 'WP-CONST-2570',
      title: 'โครงการก่อสร้างตามข้อบัญญัติ & คุมงาน',
      icon: HardHat,
      color: 'indigo',
      badge: '4 จุดชี้ขาด',
      description: 'ตรวจสอบความสอดคล้องกับแผนพัฒนาท้องถิ่น, การกันเงินเหลื่อมปีตามระเบียบ มท. 2566 ข้อ 64-67, สมุดบันทึกช่างคุมงาน (ข้อ 178) และผลทดสอบคอนกรีต 28 วัน (Cylinder Test)',
      legalReference: 'ระเบียบ มท. ว่าด้วยการรับเงิน การเบิกจ่ายเงินฯ พ.ศ. 2566 & ระเบียบพัสดุฯ 2560 ข้อ 178'
    },
    {
      id: 'permit',
      wpId: 'WP-PERMIT-2570',
      title: 'การขออนุญาตสิ่งปลูกสร้าง รื้อถอน & ค่าธรรมเนียม',
      icon: Building2,
      color: 'emerald',
      badge: 'พ.ร.บ. ควบคุมอาคาร 2522',
      description: 'ตรวจสอบคำขอ (แบบ ข.1), ใบอนุญาต (อ.1-อ.6), ค่าธรรมเนียมและค่าตรวจแบบแปลน (กฎกระทรวง ฉบับที่ 7), วุฒิบัตรสถาปนิก/วิศวกร และกรอบเวลา 45 วัน',
      legalReference: 'พ.ร.บ. ควบคุมอาคาร พ.ศ. 2522, กฎกระทรวง ฉบับที่ 7 (พ.ศ. 2528) & พ.ร.บ. อำนวยความสะดวกฯ 2558'
    }
  ];

  const currentTopic = TOOL_TOPICS.find((t) => t.id === activeTool) || TOOL_TOPICS[0];

  // Handler to push sample into working paper
  const handleAddSampleFromTool = (sampleData) => {
    const targetWpId = currentTopic.wpId;
    const updated = workingPapers.map((wp) => {
      if (wp.id === targetWpId || (workingPapers.length === 1 && wp.id === workingPapers[0].id)) {
        const samples = wp.samples || [];
        return {
          ...wp,
          samples: [
            ...samples,
            {
              ...sampleData,
              id: `SMP-${Date.now().toString().slice(-4)}`
            }
          ]
        };
      }
      return wp;
    });
    setWorkingPapers(updated);
  };

  const handleOpenWorkingPaper = (wpId) => {
    if (setSelectedWp) {
      setSelectedWp(wpId);
    }
    if (setCurrentTab) {
      setCurrentTab('execution');
    }
  };

  return (
    <div className="space-y-6">
      {/* Pillar Hero Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white dark:from-slate-850 dark:to-slate-900 rounded-2xl p-6 text-slate-900 dark:text-slate-100 shadow-xs border border-blue-200/80 dark:border-slate-700/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-100/80 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
              <Wrench className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>เสาหลักที่ 2: ปฏิบัติการตรวจสอบ & เครื่องมือเฉพาะทาง</span>
              <span>•</span>
              <span className="text-blue-800 dark:text-blue-200 font-bold">ปีงบประมาณ พ.ศ. {selectedYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              ชุดเครื่องมือช่วยตรวจสอบเชิงเทคนิค (Technical Audit Toolkits)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              เครื่องมืออำนวยความสะดวกสำหรับผู้ตรวจสอบภายใน ช่วยคำนวณและสอบทานความถูกต้องตามระเบียบ กฎหมาย หนังสือสั่งการ
              ใน 4 ประเด็นหลัก: ราคากลาง, จัดซื้อจัดจ้าง, โครงการตามข้อบัญญัติ และการขออนุญาตก่อสร้าง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleOpenWorkingPaper(currentTopic.wpId)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-blue-100" />
              <span>เปิดกระดาษทำการ ({currentTopic.wpId})</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Topic Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TOOL_TOPICS.map((topic) => {
          const Icon = topic.icon;
          const isSelected = activeTool === topic.id;
          return (
            <div
              key={topic.id}
              onClick={() => setActiveTool(topic.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500/80 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {topic.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {topic.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {topic.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold">
                  {topic.wpId}
                </span>
                <span className={`font-bold flex items-center space-x-1 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500'}`}>
                  <span>{isSelected ? 'กำลังใช้งาน' : 'เลือกใช้งาน'}</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Toolkit Interaction Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">หมวดที่กำลังทดสอบ:</span>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
              {currentTopic.title}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>อ้างอิง: {currentTopic.legalReference}</span>
          </div>
        </div>

        {/* Embedded Interactive Calculators */}
        <AuditToolkits
          key={`tool-${activeTool}`}
          currentWpId={currentTopic.wpId}
          onAddSampleFromTool={handleAddSampleFromTool}
        />
      </div>

      {/* Key Audit Regulations Reference Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs space-y-2">
          <div className="flex items-center space-x-2 font-bold text-amber-950 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>ข้อควรระวังสำคัญสำหรับผู้ตรวจสอบภายใน (สตง. เพ่งเล็งบ่อยครั้ง):</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-900/90 dark:text-amber-300/90 pl-1 leading-relaxed">
            <li><strong>ราคากลาง:</strong> ห้ามใช้ราคาวัสดุจากร้านค้าทั่วไปหากมีราคาพาณิชย์จังหวัดประกาศไว้ และห้ามคิดภาษีมูลค่าเพิ่มซ้ำซ้อนในแบบ ปร.4 และ ปร.5</li>
            <li><strong>จัดซื้อจัดจ้าง:</strong> ตรวจสอบการลงนามในสัญญาก่อนการเริ่มงานจริง และหักค่าปรับกรณีส่งมอบงานล่าช้าในฎีกาเบิกจ่ายงวดสุดท้ายเสมอ</li>
            <li><strong>งานก่อสร้าง:</strong> ตรวจรับงานโครงสร้างคอนกรีตต้องแนบผลทดสอบ Cylinder Test 28 วันครบถ้วน และสมุดคุมงานต้องลงบันทึกทุกวันทำงาน</li>
            <li><strong>ขออนุญาตก่อสร้าง:</strong> เจ้าหน้าที่ต้องออกใบเสร็จรับเงินค่าธรรมเนียมและนำส่งกองคลังทันที และต้องพิจารณาคำขอให้เสร็จภายใน 45 วัน</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 text-xs space-y-2">
          <div className="flex items-center space-x-2 font-bold text-blue-950 dark:text-blue-200">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>หนังสือสั่งการและระเบียบที่เกี่ยวข้องโดยตรง:</span>
          </div>
          <div className="space-y-1 text-blue-900/90 dark:text-blue-300 leading-relaxed">
            <div className="flex items-start space-x-2">
              <span className="font-bold text-blue-700 dark:text-blue-400 shrink-0">•</span>
              <span><strong>ว 614:</strong> ซักซ้อมแนวทางการจัดทำแผนปฏิบัติงานตรวจสอบรายโครงการ</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-bold text-blue-700 dark:text-blue-400 shrink-0">•</span>
              <span><strong>มท. รับจ่ายเงิน 2566 ข้อ 64-67:</strong> หลักเกณฑ์การกันเงินเหลื่อมปีและการขยายเวลาเบิกจ่ายเงิน</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-bold text-blue-700 dark:text-blue-400 shrink-0">•</span>
              <span><strong>พ.ร.บ. จัดซื้อจัดจ้างฯ 2560 ม. 175:</strong> อัตราค่าปรับกรณีส่งมอบงานล่าช้า (ร้อยละ 0.1 หรือ 0.2 ต่อวัน)</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-bold text-blue-700 dark:text-blue-400 shrink-0">•</span>
              <span><strong>กฎกระทรวง ฉบับที่ 7 (พ.ศ. 2528):</strong> อัตราค่าธรรมเนียมใบอนุญาต (อ.1) และค่าตรวจแบบแปลนตาม พ.ร.บ. ควบคุมอาคาร</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
