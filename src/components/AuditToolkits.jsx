import React, { useState, useEffect } from 'react';
import {
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
  Copy,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AuditToolkits({ onAddSampleFromTool, currentWpId = '' }) {
  const [activeTool, setActiveTool] = useState(() => {
    if (currentWpId === 'WP-PRICE-2570') return 'factor-f';
    if (currentWpId === 'WP-PROC-2570') return 'penalty';
    if (currentWpId === 'WP-PERMIT-2570') return 'permit';
    if (currentWpId === 'WP-CONST-2570') return 'ordinance';
    return 'factor-f';
  });

  useEffect(() => {
    if (currentWpId === 'WP-PRICE-2570') setActiveTool('factor-f');
    else if (currentWpId === 'WP-PROC-2570') setActiveTool('penalty');
    else if (currentWpId === 'WP-PERMIT-2570') setActiveTool('permit');
    else if (currentWpId === 'WP-CONST-2570') setActiveTool('ordinance');
  }, [currentWpId]);

  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedToast, setCopiedToast] = useState(false);

  // 1. State for Factor F Calculator
  const [workType, setWorkType] = useState('road'); // road, building, bridge, irrigation
  const [directCost, setDirectCost] = useState('1500000');
  const [advancePercent, setAdvancePercent] = useState('0'); // 0, 5, 10, 15
  const [retentionPercent, setRetentionPercent] = useState('0'); // 0, 5, 10
  const [interestRate, setInterestRate] = useState('6'); // 5, 6, 7
  const [vatRate] = useState(7);
  const [engineerPrice, setEngineerPrice] = useState('2040000');

  // 2. State for Procurement Penalty Calculator
  const [contractValue, setContractValue] = useState('850000');
  const [penaltyRateType, setPenaltyRateType] = useState('0.001'); // 0.1% or 0.2%
  const [dueDate, setDueDate] = useState('2027-02-15');
  const [actualDeliveryDate, setActualDeliveryDate] = useState('2027-02-25');
  const [isTrafficImpact, setIsTrafficImpact] = useState(false);

  // 3. State for Building Permit Calculator
  const [buildingArea, setBuildingArea] = useState('250');
  const [floorCount, setFloorCount] = useState('2');
  const [buildingType, setBuildingType] = useState('residential'); // residential, commercial, industrial
  const [collectedFee, setCollectedFee] = useState('200');
  const [receiptNo, setReceiptNo] = useState('เล่มที่ 014 เลขที่ 05');

  // 4. State for Capital Project / Ordinance Helper
  const [projectName, setProjectName] = useState('โครงการก่อสร้างถนน คสล. สายบ้านฝางคำ หมู่ที่ 3');
  const [budgetAmount, setBudgetAmount] = useState('480000');
  const [isInLocalPlan, setIsInLocalPlan] = useState(true);
  const [hasContractBySep30, setHasContractBySep30] = useState(true);
  const [hasDailyReport, setHasDailyReport] = useState(true);
  const [hasCylinderTest, setHasCylinderTest] = useState(true);

  const showToast = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Helper calculation for Factor F
  const calculateFactorF = () => {
    const cost = Number(directCost) || 0;
    if (cost <= 0) return { factorF: 1.3, standardPrice: 0 };

    // Standard baseline Factor F approximation curves according to Ministry of Finance
    let base = 1.30;
    if (workType === 'road') {
      if (cost <= 500000) base = 1.3624;
      else if (cost <= 1000000) base = 1.3601;
      else if (cost <= 2000000) base = 1.3533;
      else if (cost <= 5000000) base = 1.3412;
      else if (cost <= 10000000) base = 1.3190;
      else base = 1.2850;
    } else if (workType === 'building') {
      if (cost <= 500000) base = 1.3045;
      else if (cost <= 1000000) base = 1.3021;
      else if (cost <= 2000000) base = 1.2974;
      else if (cost <= 5000000) base = 1.2856;
      else if (cost <= 10000000) base = 1.2650;
      else base = 1.2420;
    } else if (workType === 'bridge') {
      if (cost <= 500000) base = 1.3320;
      else if (cost <= 1000000) base = 1.3285;
      else if (cost <= 2000000) base = 1.3210;
      else if (cost <= 5000000) base = 1.3105;
      else base = 1.2890;
    } else {
      base = 1.3150;
    }

    // Adjust for advance payment and retention
    if (advancePercent === '5') base -= 0.005;
    if (advancePercent === '10') base -= 0.010;
    if (advancePercent === '15') base -= 0.015;
    if (retentionPercent === '5') base += 0.003;
    if (retentionPercent === '10') base += 0.006;

    const factorF = Number(base.toFixed(4));
    const standardPrice = Math.round(cost * factorF);
    const engPrice = Number(engineerPrice) || 0;
    const diff = engPrice - standardPrice;
    const isExceeded = diff > 500; // tolerance threshold
    const isUndervalued = diff < -500;

    return { factorF, standardPrice, diff, isExceeded, isUndervalued };
  };

  const factorFResult = calculateFactorF();

  // Helper calculation for Penalty
  const calculatePenalty = () => {
    const val = Number(contractValue) || 0;
    const rate = isTrafficImpact ? 0.002 : Number(penaltyRateType);
    let overdueDays = 0;

    if (dueDate && actualDeliveryDate) {
      const d1 = new Date(dueDate);
      const d2 = new Date(actualDeliveryDate);
      const diffTime = d2.getTime() - d1.getTime();
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    if (overdueDays < 0) overdueDays = 0;

    // Minimum 100 baht per day per regulation
    let dailyPenalty = Math.round(val * rate);
    if (dailyPenalty < 100 && val > 0) dailyPenalty = 100;

    const totalPenalty = overdueDays * dailyPenalty;
    const isOverdue = overdueDays > 0;

    return { overdueDays, dailyPenalty, totalPenalty, isOverdue, rate };
  };

  const penaltyResult = calculatePenalty();

  // Helper calculation for Building Permit Fees
  const calculatePermitFee = () => {
    const area = Number(buildingArea) || 0;
    const floors = Number(floorCount) || 1;

    // Rate based on Building Control Act Regulation:
    // Building Permit fee:
    // <= 2 floors: 20 THB
    // 3 floors: 30 THB
    // > 3 floors or > 2000 sqm: 100 THB
    let permitFee = 20;
    if (floors === 3) permitFee = 30;
    else if (floors > 3 || area > 2000) permitFee = 100;

    // Blueprint Review Fee:
    // area <= 100 sqm: 0.50 THB/sqm (min 20 THB)
    // area > 100 to 500 sqm: 1.00 THB/sqm
    // area > 500 sqm: 1.50 THB/sqm
    let blueprintFee = 0;
    if (area <= 100) blueprintFee = Math.max(20, area * 0.50);
    else if (area <= 500) blueprintFee = 50 + (area - 100) * 1.0;
    else blueprintFee = 450 + (area - 500) * 1.5;

    blueprintFee = Math.round(blueprintFee);
    const totalDue = permitFee + blueprintFee;
    const collected = Number(collectedFee) || 0;
    const feeDiff = collected - totalDue;
    const isFeeAccurate = feeDiff === 0;

    return { permitFee, blueprintFee, totalDue, collected, feeDiff, isFeeAccurate };
  };

  const permitFeeResult = calculatePermitFee();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/90 dark:border-blue-900/60 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border-b border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>ชุดเครื่องมือผู้ช่วยตรวจสอบภายในเฉพาะด้าน (Audit Toolkits 2570)</span>
              <span className="text-[10px] bg-blue-700 text-white px-2 py-0.5 rounded-full font-bold">
                ใหม่ ว 614 / กรมบัญชีกลาง
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ช่วยคำนวณและตรวจสอบความถูกต้องตามกฎหมายและระเบียบ แม้ผู้ตรวจไม่มีพื้นฐานงานช่าง
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-800 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>{isExpanded ? 'ย่อเครื่องมือ' : 'เปิดใช้งานเครื่องมือ'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Tool selector buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTool('factor-f')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTool === 'factor-f'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <div>ตรวจราคากลาง & Factor F</div>
                <div className={`text-[10px] font-normal ${activeTool === 'factor-f' ? 'text-blue-100' : 'text-slate-400'}`}>แบบ ปร.4, 5, 6</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTool('penalty')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTool === 'penalty'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <div>คำนวณค่าปรับส่งมอบล่าช้า</div>
                <div className={`text-[10px] font-normal ${activeTool === 'penalty' ? 'text-blue-100' : 'text-slate-400'}`}>0.1% - 0.2% ต่อวัน</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTool('permit')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTool === 'permit'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <div>ตรวจค่าธรรมเนียมใบอนุญาต</div>
                <div className={`text-[10px] font-normal ${activeTool === 'permit' ? 'text-blue-100' : 'text-slate-400'}`}>พ.ร.บ. ควบคุมอาคาร 2522</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTool('ordinance')}
              className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTool === 'ordinance'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <HardHat className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <div>ตรวจงานก่อสร้างข้อบัญญัติ</div>
                <div className={`text-[10px] font-normal ${activeTool === 'ordinance' ? 'text-blue-100' : 'text-slate-400'}`}>กันเงินเหลื่อมปี / คุมงาน</div>
              </div>
            </button>
          </div>

          {/* =========================================================================
              TOOL 1: FACTOR F & REFERENCE PRICE CALCULATOR
          ========================================================================= */}
          {activeTool === 'factor-f' && (
            <div className="bg-slate-50/70 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center">
                  <Calculator className="w-4 h-4 text-blue-700 dark:text-blue-400 mr-1.5" />
                  เครื่องมือตรวจทานราคากลางและตาราง Factor F (แบบ ปร.5 / ปร.6)
                </span>
                <span className="text-slate-500 text-[11px]">
                  อ้างอิง: หลักเกณฑ์การคำนวณราคากลางงานก่อสร้าง กรมบัญชีกลาง
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ประเภทงานก่อสร้าง</label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium"
                  >
                    <option value="road">งานทาง (ถนน คสล. / ลาดยาง / ลูกรัง)</option>
                    <option value="building">งานอาคาร (สำนักงาน / ศพด. / โรงจอดรถ)</option>
                    <option value="bridge">งานสะพานและท่อเหลี่ยม</option>
                    <option value="irrigation">งานชลประทาน (คลองส่งน้ำ / ฝาย)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ค่างานต้นทุน (Direct Cost ใน ปร.4)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={directCost}
                      onChange={(e) => setDirectCost(e.target.value)}
                      className="w-full p-2 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                    <span className="absolute right-3 top-2 text-slate-400">บาท</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">เงื่อนไขเงินล่วงหน้าจ่าย</label>
                  <select
                    value={advancePercent}
                    onChange={(e) => setAdvancePercent(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="0">0% (ตามปกติของ อปท.)</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">เงินประกันผลงานหัก</label>
                  <select
                    value={retentionPercent}
                    onChange={(e) => setRetentionPercent(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="0">0% (จ่ายเต็มตามงวด)</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                  </select>
                </div>
              </div>

              {/* Comparison Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">ค่า Factor F ตามเกณฑ์มาตรฐาน</div>
                  <div className="text-xl font-mono font-black text-blue-700 dark:text-blue-400 mt-1">
                    {factorFResult.factorF.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">รวม VAT 7% และดอกเบี้ยเงินกู้ {interestRate}%</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">ราคากลางที่ควรจะเป็น (ค่างาน x Factor F)</div>
                  <div className="text-xl font-mono font-black text-slate-900 dark:text-slate-100 mt-1">
                    {factorFResult.standardPrice.toLocaleString()} <span className="text-xs font-normal text-slate-400">บาท</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">คำนวณตามสูตรของกรมบัญชีกลาง</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    ราคากลางที่กองช่างคำนวณมา (ใน ปร.6)
                  </label>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <input
                      type="number"
                      value={engineerPrice}
                      onChange={(e) => setEngineerPrice(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none font-mono font-bold text-sm text-slate-900 dark:text-slate-100"
                    />
                    <span className="text-slate-400 shrink-0 text-xs">บาท</span>
                  </div>
                </div>
              </div>

              {/* Result banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  factorFResult.isExceeded
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : factorFResult.isUndervalued
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {factorFResult.isExceeded ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : factorFResult.isUndervalued ? (
                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {factorFResult.isExceeded
                        ? `⚠️ ราคากลางของกองช่างสูงกว่าเกณฑ์มาตรฐาน ${Math.abs(factorFResult.diff).toLocaleString()} บาท`
                        : factorFResult.isUndervalued
                        ? `ℹ️ ราคากลางของกองช่างต่ำกว่าเกณฑ์มาตรฐาน ${Math.abs(factorFResult.diff).toLocaleString()} บาท`
                        : '✅ ราคากลางของกองช่างถูกต้องสอดคล้องกับตาราง Factor F กรมบัญชีกลาง'}
                    </span>
                    <div className="text-[11px] opacity-80">
                      {factorFResult.isExceeded
                        ? 'อาจเกิดจากการใช้ตาราง Factor F ผิดประเภท หรือคิดภาษีซ้ำซ้อน ควรขอให้กองช่างทบทวนตารางคำนวณแบบ ปร.5'
                        : 'การใช้ตาราง Factor F ถูกต้องตามประเภทงานและเงื่อนไขสัญญา'}
                    </div>
                  </div>
                </div>

                {onAddSampleFromTool && (
                  <button
                    onClick={() => {
                      onAddSampleFromTool({
                        docNo: `แบบ ปร.5 (ราคากลาง ${workType})`,
                        date: 'ปี 2570',
                        payee: 'คณะกรรมการกำหนดราคากลาง',
                        amount: Number(engineerPrice) || 0,
                        testResult: factorFResult.isExceeded ? 'ไม่ถูกต้อง' : 'ปกติ',
                        note: `ค่างานต้นทุน ${Number(directCost).toLocaleString()} บาท, Factor F=${factorFResult.factorF.toFixed(4)}, ส่วนต่าง=${factorFResult.diff.toLocaleString()} บาท`
                      });
                      showToast();
                    }}
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer shrink-0 ml-2"
                  >
                    + บันทึกลงกระดาษทำการ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TOOL 2: PROCUREMENT DELAY & PENALTY CALCULATOR
          ========================================================================= */}
          {activeTool === 'penalty' && (
            <div className="bg-slate-50/70 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center">
                  <Clock className="w-4 h-4 text-blue-700 dark:text-blue-400 mr-1.5" />
                  เครื่องมือคำนวณค่าปรับส่งมอบงานล่าช้า & ตรวจสอบระยะเวลาสัญญา
                </span>
                <span className="text-slate-500 text-[11px]">
                  อ้างอิง: ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างฯ พ.ศ. 2560 ข้อ 162
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">มูลค่าตามสัญญา (บาท)</label>
                  <input
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">วันที่ครบกำหนดสัญญา</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">วันที่ผู้รับจ้างส่งมอบงานจริง</label>
                  <input
                    type="date"
                    value={actualDeliveryDate}
                    onChange={(e) => setActualDeliveryDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">อัตราค่าปรับตามระเบียบ</label>
                  <div className="space-y-1 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTrafficImpact}
                        onChange={(e) => setIsTrafficImpact(e.target.checked)}
                        className="rounded text-blue-700 focus:ring-blue-500"
                      />
                      <span>งานก่อสร้างสาธารณะที่กระทบการจราจร (0.2% ต่อวัน)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Penalty Results */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">จำนวนวันส่งมอบล่าช้า</div>
                  <div className="text-xl font-mono font-black text-rose-600 dark:text-rose-400 mt-1">
                    {penaltyResult.overdueDays} <span className="text-xs font-normal text-slate-400">วัน</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">นับตั้งแต่วันถัดจากวันครบกำหนดสัญญา</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">อัตราค่าปรับต่อวัน ({(penaltyResult.rate * 100).toFixed(1)}%)</div>
                  <div className="text-xl font-mono font-black text-slate-900 dark:text-slate-100 mt-1">
                    {penaltyResult.dailyPenalty.toLocaleString()} <span className="text-xs font-normal text-slate-400">บาท/วัน</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">เกณฑ์ขั้นต่ำไม่น้อยกว่าวันละ 100 บาท</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">ค่าปรับรวมที่ต้องเรียกเก็บจากคู่สัญญา</div>
                  <div className="text-xl font-mono font-black text-rose-600 dark:text-rose-400 mt-1">
                    {penaltyResult.totalPenalty.toLocaleString()} <span className="text-xs font-normal text-slate-400">บาท</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ต้องหักออกจากฎีกาเบิกจ่ายเงินงวดสุดท้าย</div>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  penaltyResult.isOverdue
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {penaltyResult.isOverdue ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {penaltyResult.isOverdue
                        ? `⚠️ ผู้รับจ้างส่งมอบงานล่าช้ากว่าสัญญา ${penaltyResult.overdueDays} วัน ต้องเรียกค่าปรับ ${penaltyResult.totalPenalty.toLocaleString()} บาท`
                        : '✅ ผู้รับจ้างส่งมอบงานภายในกำหนดเวลาตามสัญญา ไม่มีค่าปรับ'}
                    </span>
                    <div className="text-[11px] opacity-80">
                      {penaltyResult.isOverdue
                        ? 'ตรวจสอบฎีกาเบิกจ่ายเงินว่ากองคลังได้หักค่าปรับจำนวนนี้ไว้ครบถ้วนหรือไม่ หากไม่หัก เจ้าหน้าที่ตรวจรับอาจต้องรับผิดชอบส่วนต่าง'
                        : 'การส่งมอบงานและการตรวจรับพัสดุดำเนินการตามกรอบเวลาสัญญา'}
                    </div>
                  </div>
                </div>

                {onAddSampleFromTool && penaltyResult.isOverdue && (
                  <button
                    onClick={() => {
                      onAddSampleFromTool({
                        docNo: 'สัญญาจ้างก่อสร้าง/ซื้อขาย',
                        date: actualDeliveryDate,
                        payee: 'คู่สัญญาตามสัญญา',
                        amount: Number(contractValue) || 0,
                        testResult: 'มีข้อสังเกต',
                        note: `ส่งมอบล่าช้า ${penaltyResult.overdueDays} วัน ต้องเรียกค่าปรับ ${penaltyResult.totalPenalty.toLocaleString()} บาท`
                      });
                      showToast();
                    }}
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer shrink-0 ml-2"
                  >
                    + บันทึกลงกระดาษทำการ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TOOL 3: BUILDING PERMIT FEE CALCULATOR
          ========================================================================= */}
          {activeTool === 'permit' && (
            <div className="bg-slate-50/70 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center">
                  <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400 mr-1.5" />
                  เครื่องมือคำนวณและตรวจสอบค่าธรรมเนียมใบอนุญาตก่อสร้างอาคาร (แบบ อ.1)
                </span>
                <span className="text-slate-500 text-[11px]">
                  อ้างอิง: กฎกระทรวงกำหนดค่าธรรมเนียมตาม พ.ร.บ. ควบคุมอาคาร พ.ศ. 2522
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">พื้นที่อาคารรวม (ตารางเมตร)</label>
                  <input
                    type="number"
                    value={buildingArea}
                    onChange={(e) => setBuildingArea(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">จำนวนชั้นของอาคาร</label>
                  <select
                    value={floorCount}
                    onChange={(e) => setFloorCount(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="1">1 ชั้น</option>
                    <option value="2">2 ชั้น</option>
                    <option value="3">3 ชั้น</option>
                    <option value="4">เกิน 3 ชั้นขึ้นไป</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ค่าธรรมเนียมที่กองช่างเรียกเก็บจริง</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={collectedFee}
                      onChange={(e) => setCollectedFee(e.target.value)}
                      className="w-full p-2 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-slate-400">บาท</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">เลขที่ใบเสร็จรับเงินที่ออก</label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono text-[11px]"
                    placeholder="เช่น เล่มที่ 012 เลขที่ 45"
                  />
                </div>
              </div>

              {/* Fee Results */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">ค่าธรรมเนียมใบอนุญาตก่อสร้าง (แบบ อ.1)</div>
                  <div className="text-xl font-mono font-black text-blue-700 dark:text-blue-400 mt-1">
                    {permitFeeResult.permitFee} <span className="text-xs font-normal text-slate-400">บาท</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ตามอัตรากฎกระทรวง ฉบับที่ 7</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">ค่าธรรมเนียมตรวจแบบแปลนก่อสร้าง</div>
                  <div className="text-xl font-mono font-black text-blue-700 dark:text-blue-400 mt-1">
                    {permitFeeResult.blueprintFee.toLocaleString()} <span className="text-xs font-normal text-slate-400">บาท</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">คิดตามพื้นที่ {buildingArea} ตร.ม.</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">รวมค่าธรรมเนียมที่ต้องนำส่งคลัง</div>
                  <div className="text-xl font-mono font-black text-slate-900 dark:text-slate-100 mt-1">
                    {permitFeeResult.totalDue.toLocaleString()} <span className="text-xs font-normal text-slate-400">บาท</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {permitFeeResult.isFeeAccurate ? '✅ เรียกเก็บถูกต้องตรงตามเกณฑ์' : `⚠️ เรียกเก็บคลาดเคลื่อน ${Math.abs(permitFeeResult.feeDiff)} บาท`}
                  </div>
                </div>
              </div>

              {/* Permit Checklist Box */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/40 text-[11px] space-y-1">
                <span className="font-bold text-blue-900 dark:text-blue-200 block">
                  📌 สิ่งที่ผู้ตรวจสอบต้องขอตรวจจากกองช่าง:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-blue-800/90 dark:text-blue-300">
                  <li>คำขออนุญาตก่อสร้าง (แบบ ข.1) และเอกสารสิทธิ์ที่ดิน (โฉนด/น.ส.3)</li>
                  <li>สำเนาใบเสร็จรับเงินที่กองช่างออกให้ผู้ยื่นคำขอ และใบนำส่งเงินให้กองคลัง</li>
                  <li>แบบแปลนที่มีสถาปนิกและวิศวกรผู้ควบคุมงานลงนามรับรอง (กรณีพื้นที่เกิน 150 ตร.ม. หรือความสูงตามเกณฑ์)</li>
                  <li>กรอบเวลาพิจารณาอนุญาต (ต้องไม่เกิน 45 วัน นับแต่วันที่ได้รับคำขอครบถ้วนตาม พ.ร.บ. อำนวยความสะดวกฯ)</li>
                </ul>
              </div>

              {onAddSampleFromTool && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      onAddSampleFromTool({
                        docNo: receiptNo || 'ใบเสร็จรับเงินค่าธรรมเนียม',
                        date: 'ปี 2570',
                        payee: `ผู้ขออนุญาตก่อสร้าง (${buildingType === 'residential' ? 'บ้านพักอาศัย' : buildingType === 'commercial' ? 'อาคารพาณิชย์' : 'โรงงาน/คลังสินค้า'})`,
                        amount: Number(collectedFee) || 0,
                        testResult: permitFeeResult.isFeeAccurate ? 'ปกติ' : 'มีข้อสังเกต',
                        note: `พื้นที่ ${buildingArea} ตร.ม. ${floorCount} ชั้น | ค่าคำขอ ${permitFeeResult.permitFee} บ. + ค่าตรวจแบบ ${permitFeeResult.blueprintFee} บ. = ต้องเก็บ ${permitFeeResult.totalDue} บ. (เก็บจริง ${collectedFee} บ. ส่วนต่าง ${permitFeeResult.feeDiff} บ.)`
                      });
                      showToast();
                    }}
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ บันทึกลงกระดาษทำการ</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TOOL 4: CAPITAL PROJECT & ORDINANCE ALIGNMENT HELPER
          ========================================================================= */}
          {activeTool === 'ordinance' && (
            <div className="bg-slate-50/70 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center">
                  <HardHat className="w-4 h-4 text-blue-700 dark:text-blue-400 mr-1.5" />
                  เครื่องมือสอบทานโครงการก่อสร้างตามข้อบัญญัติงบประมาณ & การคุมงานหน้างาน
                </span>
                <span className="text-slate-500 text-[11px]">
                  อ้างอิง: ระเบียบ มท. รับจ่ายเงิน 2566 & ระเบียบพัสดุ 2560 ข้อ 178
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ชื่อโครงการตามข้อบัญญัติ</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">งบประมาณตามข้อบัญญัติ (บาท)</label>
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Key Verification Checkpoints */}
              <div className="space-y-2 pt-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  เกณฑ์การสอบทานความถูกต้อง 4 จุดสำคัญ (Key Checkpoints):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => setIsInLocalPlan(!isInLocalPlan)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isInLocalPlan
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isInLocalPlan ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <span className="font-semibold text-xs">บรรจุในแผนพัฒนาท้องถิ่น (พ.ศ. 2566 - 2570)</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border">
                      {isInLocalPlan ? 'ตรงแผน' : 'ไม่ตรงแผน ⚠️'}
                    </span>
                  </div>

                  <div
                    onClick={() => setHasContractBySep30(!hasContractBySep30)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      hasContractBySep30
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {hasContractBySep30 ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <span className="font-semibold text-xs">การกันเงินเหลื่อมปี: ก่อหนี้ผูกพันทัน 30 ก.ย.</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border">
                      {hasContractBySep30 ? 'มีหนี้ผูกพัน' : 'ต้องขอสภาฯ'}
                    </span>
                  </div>

                  <div
                    onClick={() => setHasDailyReport(!hasDailyReport)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      hasDailyReport
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {hasDailyReport ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <span className="font-semibold text-xs">สมุดบันทึกรายวันช่างผู้ควบคุมงาน (Daily Report)</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border">
                      {hasDailyReport ? 'บันทึกครบ' : 'ขาดบันทึก ⚠️'}
                    </span>
                  </div>

                  <div
                    onClick={() => setHasCylinderTest(!hasCylinderTest)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      hasCylinderTest
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {hasCylinderTest ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <span className="font-semibold text-xs">ผลทดสอบกำลังอัดคอนกรีต (Cylinder Test 28 วัน)</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border">
                      {hasCylinderTest ? 'มีผลทดสอบ' : 'ไม่มีผลทดสอบ ⚠️'}
                    </span>
                  </div>
                </div>
              </div>

              {onAddSampleFromTool && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      const issues = [];
                      if (!isInLocalPlan) issues.push('ไม่พบในแผนพัฒนาท้องถิ่น');
                      if (!hasContractBySep30) issues.push('ยังไม่ผูกพันสัญญาภายใน 30 ก.ย.');
                      if (!hasDailyReport) issues.push('ขาดสมุดบันทึกช่างคุมงาน');
                      if (!hasCylinderTest) issues.push('ไม่มีผลทดสอบ Cylinder 28 วัน');

                      const isOk = issues.length === 0;

                      onAddSampleFromTool({
                        docNo: 'โครงการตามข้อบัญญัติงบประมาณ',
                        date: 'ปี 2570',
                        payee: projectName,
                        amount: Number(budgetAmount) || 0,
                        testResult: isOk ? 'ปกติ' : 'มีข้อสังเกต',
                        note: isOk
                          ? 'ผ่านเกณฑ์ 4 จุดสำคัญ: บรรจุในแผน, ก่อหนี้ทัน 30 ก.ย., มีบันทึกคุมงาน, มีผลทดสอบคอนกรีต'
                          : `พบข้อสังเกต: ${issues.join(', ')}`
                      });
                      showToast();
                    }}
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ บันทึกลงกระดาษทำการ</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating copied alert */}
      {copiedToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl fixed bottom-6 right-6 shadow-xl flex items-center space-x-2 z-50">
          <CheckCircle2 className="w-4 h-4" />
          <span>บันทึกตัวอย่างการทดสอบลงกระดาษทำการเรียบร้อยแล้ว</span>
        </div>
      )}
    </div>
  );
}
