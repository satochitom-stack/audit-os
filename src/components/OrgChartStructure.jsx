import React, { useState } from 'react';
import { 
  Building2, 
  Shield, 
  Crown, 
  ChevronRight, 
  Printer, 
  Maximize2, 
  Minimize2, 
  LayoutGrid, 
  GitFork,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function OrgChartStructure({
  availableUsers = [],
  onSelectUser,
  onSelectDepartment,
  orgProfile = {
    name: 'องค์การบริหารส่วนตำบลฝางคำ',
    district: 'อำเภอสิรินธร',
    province: 'จังหวัดอุบลราชธานี'
  }
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const findUserByUsername = (username) => {
    return availableUsers.find((u) => u.username === username);
  };

  const findUserByDept = (deptName) => {
    return availableUsers.find((u) => u.department === deptName);
  };

  const handleBoxClick = (username, deptName) => {
    const user = findUserByUsername(username) || findUserByDept(deptName);
    if (user && onSelectUser) {
      onSelectUser(user);
    } else if (onSelectDepartment) {
      onSelectDepartment(deptName);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`w-full bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden transition-all ${
      fullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto p-4 sm:p-6 bg-slate-50' : 'p-4 sm:p-6 lg:p-8'
    }`}>
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200/80 gap-3 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <GitFork className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              แผนภูมิโครงสร้างการแบ่งส่วนราชการ
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {orgProfile.name} {orgProfile.district} {orgProfile.province}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            title="พิมพ์แผนภูมิโครงสร้างองค์กร"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">พิมพ์แผนภูมิ</span>
          </button>

          <button
            type="button"
            onClick={() => setFullscreen(!fullscreen)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            title={fullscreen ? "ย่อหน้าจอ" : "ขยายเต็มจอ"}
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{fullscreen ? 'ย่อหน้าต่าง' : 'เต็มจอ'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Scroll Hint */}
      <div className="sm:hidden text-center py-2 text-[11px] text-slate-400 bg-slate-50 border-b border-slate-100 no-print flex items-center justify-center space-x-1">
        <span>👈 เลื่อนซ้าย - ขวา เพื่อดูแผนภูมิทั้งหมด 👉</span>
      </div>

      {/* 2. Interactive Flowchart Diagram Canvas */}
      <div className="w-full overflow-x-auto pt-6 pb-8 print:p-0">
        <div className="min-w-[1080px] max-w-6xl mx-auto flex flex-col items-center select-none text-slate-800">
          
          {/* Chart Formal Title */}
          <div className="text-center mb-6 space-y-1">
            <h4 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              แผนภูมิโครงสร้างการแบ่งส่วนราชการ
            </h4>
            <p className="text-xs font-semibold text-slate-700">
              {orgProfile.name} {orgProfile.district} {orgProfile.province}
            </p>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto mt-2" />
          </div>

          {/* TOP TIER: 1. ผู้บริหาร (นายก อบต.ฝางคำ) */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => handleBoxClick('mayor', 'ผู้บริหาร')}
              className="w-72 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 border-2 border-amber-300 hover:border-amber-500 rounded-2xl p-3 text-center transition-all shadow-xs hover:shadow-md cursor-pointer group hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <span className="text-base">👑</span>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/60">
                  ฝ่ายบริหาร / ผู้บริหารสูงสุด
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                นายกองค์การบริหารส่วนตำบลฝางคำ
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {orgProfile.approverName || 'นายจรูญ ธรรมพิทักษ์'}
              </div>
            </div>

            {/* Vertical connector line down from นายก to ปลัด */}
            <div className="w-0.5 h-6 bg-emerald-600 my-0" />
          </div>

          {/* MIDDLE TIER: 2. ปลัด อบต.ฝางคำ & หน่วยตรวจสอบภายใน (กิ่งแยกด้านขวา) */}
          <div className="flex items-center justify-center w-full mb-1">
            
            {/* Left Spacer to perfectly balance the right side so ปลัด remains exactly in the center */}
            <div className="w-72 shrink-0 hidden md:block" />

            {/* Center Box: ปลัด อบต.ฝางคำ (สีเขียวแบบตัวอย่างเทศบาล) */}
            <div
              onClick={() => handleBoxClick('palat', 'ปลัด อบต.ฝางคำ')}
              className="w-72 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border-2 border-emerald-500 hover:border-emerald-600 rounded-2xl p-3 text-center transition-all shadow-xs hover:shadow-md cursor-pointer group hover:scale-[1.02] shrink-0 z-10"
            >
              <div className="flex items-center justify-center space-x-1 mb-1">
                <span className="text-base">🏛️</span>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  หัวหน้าพนักงานส่วนตำบล
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                ปลัดองค์การบริหารส่วนตำบลฝางคำ
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {orgProfile.palatName || 'นายชาญชัย อักโข'}
              </div>
            </div>

            {/* Right Side: Connector Line & หน่วยตรวจสอบภายใน */}
            <div className="flex items-center w-72 shrink-0">
              {/* Connector line */}
              <div className="w-10 h-0.5 bg-blue-500 shrink-0" />
              
              {/* Box: หน่วยตรวจสอบภายใน (กล่องขาว ขอบน้ำเงิน สไตล์ราชการ) */}
              <div
                onClick={() => handleBoxClick('admin', 'หน่วยตรวจสอบภายใน')}
                className="w-60 bg-white border-2 border-blue-600 hover:border-blue-700 rounded-2xl p-2.5 text-center transition-all shadow-xs hover:shadow-md cursor-pointer group hover:scale-[1.02] shrink-0"
              >
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <span className="text-xs">🛡️</span>
                  <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                    รายงานตรงต่อนายก/ปลัด
                  </span>
                </div>
                <div className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                  หน่วยตรวจสอบภายใน
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5 font-medium">
                  {orgProfile.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ'}
                </div>
              </div>
            </div>

          </div>

          {/* Central Vertical Connector line from ปลัด down to Trunk bar */}
          <div className="w-0.5 h-6 bg-emerald-600" />

          {/* 4. The 5 Main Divisions Columns (ตามข้อมูลจริงของ อบต.ฝางคำ) */}
          <div className="grid grid-cols-5 gap-3 w-[98%] max-w-[1060px]">
            
            {/* COLUMN 1: สำนักปลัด (สีฟ้า สไตล์แบบเทศบาล) */}
            <div className="flex flex-col items-center w-full">
              {/* Top Branch Connector (หักฉาก 90 องศา จากกึ่งกลางไปทางขวา) */}
              <div className="relative w-full h-5 flex justify-center">
                <div className="absolute top-0 left-1/2 -right-3.5 h-0.5 bg-emerald-600" />
                <div className="w-0.5 h-full bg-emerald-600" />
              </div>
              
              {/* Division Header Box */}
              <div
                onClick={() => handleBoxClick('office', 'สำนักปลัด')}
                className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-2xl p-2.5 text-center shadow-xs hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <div className="text-xs font-black tracking-wide">
                  สำนักปลัด
                </div>
                <div className="text-[10px] text-sky-100 mt-0.5 line-clamp-1">
                  หัวหน้าสำนักปลัด
                </div>
              </div>

              {/* Sub-boxes (ฝ่าย / งาน) */}
              <div className="w-full space-y-2 text-left mt-3">
                {/* ฝ่ายอำนวยการ */}
                <div className="bg-sky-50/80 border border-sky-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-sky-950 pb-1 border-b border-sky-200/70 text-[11px]">
                    ฝ่ายอำนวยการ
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-sky-500 mr-1">-</span>
                      <span>งานบริหารทั่วไป</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sky-500 mr-1">-</span>
                      <span>งานนโยบายและแผน</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sky-500 mr-1">-</span>
                      <span>งานการเจ้าหน้าที่</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sky-500 mr-1">-</span>
                      <span>งานประชาสัมพันธ์</span>
                    </li>
                  </ul>
                </div>

                {/* ฝ่ายปกครองและความมั่นคง */}
                <div className="bg-sky-50/80 border border-sky-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-sky-950 pb-1 border-b border-sky-200/70 text-[11px]">
                    ฝ่ายปกครอง
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-sky-500 mr-1">-</span>
                      <span>งานป้องกันและบรรเทาฯ</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sky-500 mr-1">-</span>
                      <span>งานกฎหมายและคดี</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sky-500 mr-1">-</span>
                      <span>งานรักษาความสงบฯ</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* COLUMN 2: กองคลัง (สีม่วง/ชมพู สไตล์แบบเทศบาล) */}
            <div className="flex flex-col items-center w-full">
              {/* Top Branch Connector (เชื่อมแนวนอนผ่านซ้าย-ขวา พร้อมกิ่งลงกึ่งกลาง) */}
              <div className="relative w-full h-5 flex justify-center">
                <div className="absolute top-0 -left-3.5 -right-3.5 h-0.5 bg-emerald-600" />
                <div className="w-0.5 h-full bg-emerald-600" />
              </div>
              
              {/* Division Header Box */}
              <div
                onClick={() => handleBoxClick('finance', 'กองคลัง')}
                className="w-full bg-[#c026d3] hover:bg-[#a21caf] text-white rounded-2xl p-2.5 text-center shadow-xs hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <div className="text-xs font-black tracking-wide">
                  กองคลัง
                </div>
                <div className="text-[10px] text-fuchsia-100 mt-0.5 line-clamp-1">
                  ผู้อำนวยการกองคลัง
                </div>
              </div>

              {/* Sub-boxes (ฝ่าย / งาน) */}
              <div className="w-full space-y-2 text-left mt-3">
                {/* ฝ่ายบริหารงานคลัง */}
                <div className="bg-fuchsia-50/80 border border-fuchsia-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-fuchsia-950 pb-1 border-b border-fuchsia-200/70 text-[11px]">
                    ฝ่ายบริหารงานคลัง
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-fuchsia-500 mr-1">-</span>
                      <span>งานการเงินและบัญชี</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-fuchsia-500 mr-1">-</span>
                      <span>งานธุรการและสารบรรณ</span>
                    </li>
                  </ul>
                </div>

                {/* ฝ่ายพัฒนารายได้ */}
                <div className="bg-fuchsia-50/80 border border-fuchsia-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-fuchsia-950 pb-1 border-b border-fuchsia-200/70 text-[11px]">
                    ฝ่ายพัฒนารายได้
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-fuchsia-500 mr-1">-</span>
                      <span>งานจัดเก็บภาษี/รายได้</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-fuchsia-500 mr-1">-</span>
                      <span>งานแผนที่ภาษีและทะเบียนฯ</span>
                    </li>
                  </ul>
                </div>

                {/* ฝ่ายพัสดุและทรัพย์สิน */}
                <div className="bg-fuchsia-50/80 border border-fuchsia-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-fuchsia-950 pb-1 border-b border-fuchsia-200/70 text-[11px]">
                    ฝ่ายพัสดุและทรัพย์สิน
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-fuchsia-500 mr-1">-</span>
                      <span>งานจัดซื้อจัดจ้าง</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-fuchsia-500 mr-1">-</span>
                      <span>งานทะเบียนและควบคุมพัสดุ</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* COLUMN 3: กองช่าง (สีน้ำตาล/ส้ม สไตล์แบบเทศบาล - กลางแกนปลัด) */}
            <div className="flex flex-col items-center w-full">
              {/* Top Branch Connector (จุดตัดกึ่งกลาง รับเส้นตรงจากปลัด แล้วแยกซ้าย-ขวา-ลงล่าง) */}
              <div className="relative w-full h-5 flex justify-center">
                <div className="absolute top-0 -left-3.5 -right-3.5 h-0.5 bg-emerald-600" />
                <div className="w-0.5 h-full bg-emerald-600" />
              </div>
              
              {/* Division Header Box */}
              <div
                onClick={() => handleBoxClick('engineering', 'กองช่าง')}
                className="w-full bg-[#b45309] hover:bg-[#92400e] text-white rounded-2xl p-2.5 text-center shadow-xs hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <div className="text-xs font-black tracking-wide">
                  กองช่าง
                </div>
                <div className="text-[10px] text-amber-100 mt-0.5 line-clamp-1">
                  ผู้อำนวยการกองช่าง
                </div>
              </div>

              {/* Sub-boxes (ฝ่าย / งาน) */}
              <div className="w-full space-y-2 text-left mt-3">
                {/* ฝ่ายแบบแผนและก่อสร้าง */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-amber-950 pb-1 border-b border-amber-200/70 text-[11px]">
                    ฝ่ายแบบแผนและก่อสร้าง
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานวิศวกรรม/สถาปัตย์</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานควบคุมอาคาร</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานแบบแปลนและประมาณราคา</span>
                    </li>
                  </ul>
                </div>

                {/* ฝ่ายสาธารณูปโภค */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-amber-950 pb-1 border-b border-amber-200/70 text-[11px]">
                    ฝ่ายสาธารณูปโภค
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานไฟฟ้าสาธารณะ</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานซ่อมบำรุงทางและสะพาน</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานเครื่องจักรกล</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* COLUMN 4: กองการศึกษา (สีเหลือง/ทอง สไตล์แบบเทศบาล) */}
            <div className="flex flex-col items-center w-full">
              {/* Top Branch Connector (เชื่อมแนวนอนผ่านซ้าย-ขวา พร้อมกิ่งลงกึ่งกลาง) */}
              <div className="relative w-full h-5 flex justify-center">
                <div className="absolute top-0 -left-3.5 -right-3.5 h-0.5 bg-emerald-600" />
                <div className="w-0.5 h-full bg-emerald-600" />
              </div>
              
              {/* Division Header Box */}
              <div
                onClick={() => handleBoxClick('education', 'กองการศึกษา')}
                className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-slate-900 rounded-2xl p-2.5 text-center shadow-xs hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <div className="text-xs font-black tracking-wide">
                  กองการศึกษา
                </div>
                <div className="text-[10px] text-slate-800 font-semibold mt-0.5 line-clamp-1">
                  ผู้อำนวยการกองการศึกษา
                </div>
              </div>

              {/* Sub-boxes (ฝ่าย / งาน) */}
              <div className="w-full space-y-2 text-left mt-3">
                {/* ฝ่ายส่งเสริมการศึกษา ศาสนาและวัฒนธรรม */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-amber-950 pb-1 border-b border-amber-200/70 text-[11px]">
                    ฝ่ายบริหารการศึกษา
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานบริหารการศึกษา</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานศาสนาและวัฒนธรรม</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานกิจกรรมเด็กและเยาวชน</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-1">-</span>
                      <span>งานการศึกษานอกระบบ</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Connecting line down to หน่วยงานภายใต้สังกัด (ศพด.) */}
              <div className="flex flex-col items-center w-full pt-2">
                <div className="w-0.5 h-3.5 bg-emerald-600" />
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-tight bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                  หน่วยงานภายใต้สังกัด
                </span>
                <div className="w-0.5 h-2.5 bg-emerald-600" />
                
                {/* 2 Child Development Centers */}
                <div className="w-full space-y-1.5 mt-0.5">
                  {/* ศพด.วัดเจริญทัศน์ */}
                  <div
                    onClick={() => handleBoxClick('cdc_charoen', 'ศพด.วัดเจริญทัศน์')}
                    className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300 rounded-xl p-1.5 text-center transition-all cursor-pointer group shadow-2xs hover:scale-[1.02]"
                  >
                    <div className="text-[10.5px] font-bold text-slate-900 group-hover:text-emerald-800">
                      🏫 ศพด.วัดเจริญทัศน์
                    </div>
                    <div className="text-[8.5px] text-slate-500 line-clamp-1">
                      การจัดการศึกษาระดับปฐมวัย
                    </div>
                  </div>

                  {/* ศพด.บ้านฝางเทิง */}
                  <div
                    onClick={() => handleBoxClick('cdc_fangthoeng', 'ศพด.บ้านฝางเทิง')}
                    className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300 rounded-xl p-1.5 text-center transition-all cursor-pointer group shadow-2xs hover:scale-[1.02]"
                  >
                    <div className="text-[10.5px] font-bold text-slate-900 group-hover:text-emerald-800">
                      🏫 ศพด.บ้านฝางเทิง
                    </div>
                    <div className="text-[8.5px] text-slate-500 line-clamp-1">
                      การจัดการศึกษาระดับปฐมวัย
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMN 5: กองสวัสดิการสังคม (สีเขียว สไตล์แบบเทศบาล) */}
            <div className="flex flex-col items-center w-full">
              {/* Top Branch Connector (หักฉาก 90 องศา จากทางซ้ายมาจบที่กึ่งกลางพอดี) */}
              <div className="relative w-full h-5 flex justify-center">
                <div className="absolute top-0 -left-3.5 right-1/2 h-0.5 bg-emerald-600" />
                <div className="w-0.5 h-full bg-emerald-600" />
              </div>
              
              {/* Division Header Box */}
              <div
                onClick={() => handleBoxClick('health', 'กองสวัสดิการสังคม')}
                className="w-full bg-[#059669] hover:bg-[#047857] text-white rounded-2xl p-2.5 text-center shadow-xs hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <div className="text-xs font-black tracking-wide">
                  กองสวัสดิการสังคม
                </div>
                <div className="text-[10px] text-emerald-100 mt-0.5 line-clamp-1">
                  ผู้อำนวยการกองสวัสดิการ
                </div>
              </div>

              {/* Sub-boxes (ฝ่าย / งาน) */}
              <div className="w-full space-y-2 text-left mt-3">
                {/* ฝ่ายสังคมสงเคราะห์ */}
                <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-emerald-950 pb-1 border-b border-emerald-200/70 text-[11px]">
                    ฝ่ายสังคมสงเคราะห์
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-1">-</span>
                      <span>งานเบี้ยยังชีพ (ผู้สูงอายุ/คนพิการ)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-1">-</span>
                      <span>งานสงเคราะห์ผู้ด้อยโอกาส</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-1">-</span>
                      <span>งานสวัสดิการเด็กและสตรี</span>
                    </li>
                  </ul>
                </div>

                {/* ฝ่ายพัฒนาชุมชน */}
                <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2 space-y-1 text-[11px]">
                  <div className="font-bold text-emerald-950 pb-1 border-b border-emerald-200/70 text-[11px]">
                    ฝ่ายพัฒนาชุมชน
                  </div>
                  <ul className="space-y-0.5 text-slate-700 text-[10px]">
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-1">-</span>
                      <span>งานพัฒนาและจัดตั้งกลุ่ม</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-1">-</span>
                      <span>งานส่งเสริมอาชีพชุมชน</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-1">-</span>
                      <span>งานกองทุนและสวัสดิการชุมชน</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Footer of the Flowchart Diagram */}
          <div className="mt-8 pt-4 border-t border-slate-200 w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>โครงสร้างการแบ่งส่วนราชการตามกรอบอัตรากำลัง องค์การบริหารส่วนตำบลฝางคำ</span>
            </div>
            <div className="text-[11px] text-slate-400">
              สายการบังคับบัญชาและหน่วยรับตรวจที่เชื่อมโยงในระบบ IA-OS
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
