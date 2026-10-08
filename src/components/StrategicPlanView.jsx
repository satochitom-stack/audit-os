import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Calculator,
  Building,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

export default function StrategicPlanView({
  selectedYear = '2569',
  orgProfile = {},
  auditUniverse = [],
  annualPlans = []
}) {
  const [activeTab, setActiveTab] = useState('manday'); // 'manday', 'three_year'

  // Auditor Man-Day Capacity State
  const [auditorCount, setAuditorCount] = useState(1);
  const [grossWorkingDays, setGrossWorkingDays] = useState(220); // มาตรฐานวันทำการ 1 ปี
  const [leaveDays, setLeaveDays] = useState(15); // วันลาพักผ่อน/ป่วย/กิจ
  const [trainingDays, setTrainingDays] = useState(15); // วันฝึกอบรม/สัมมนา
  const [adminDays, setAdminDays] = useState(30); // งานสารบรรณ/วางแผน/ประชุม

  // Net Fieldwork Days per person
  const netFieldworkDaysPerAuditor = Math.max(0, grossWorkingDays - leaveDays - trainingDays - adminDays);
  const totalNetAuditCapacity = netFieldworkDaysPerAuditor * auditorCount;

  // 3-Year Strategic Distribution
  const currentBE = parseInt(selectedYear) || 2569;
  const year1 = currentBE;
  const year2 = currentBE + 1;
  const year3 = currentBE + 2;

  // Strategic Activities
  const defaultActivities = useMemo(() => [
    { id: 'ST-01', name: 'การรับเงินและการนำส่งเงิน (e-LAAS)', department: 'กองคลัง', riskLevel: 'สูง', y1: true, y2: true, y3: true, manDays: 20 },
    { id: 'ST-02', name: 'การบัญชีและงบกระทบยอดเงินฝากธนาคาร', department: 'กองคลัง', riskLevel: 'สูง', y1: true, y2: true, y3: true, manDays: 25 },
    { id: 'ST-03', name: 'การจัดทำราคากลาง Factor F & ตรวจงานช่าง', department: 'กองช่าง', riskLevel: 'สูง', y1: true, y2: true, y3: true, manDays: 30 },
    { id: 'ST-04', name: 'การตรวจสอบพัสดุประจำปี & จำหน่ายพัสดุ', department: 'กองคลัง / ทุกกอง', riskLevel: 'ปานกลาง', y1: true, y2: false, y3: true, manDays: 15 },
    { id: 'ST-05', name: 'การเบิกจ่ายค่าเช่าบ้านข้าราชการ', department: 'กองคลัง / สำนักปลัด', riskLevel: 'ปานกลาง', y1: true, y2: true, y3: false, manDays: 15 },
    { id: 'ST-06', name: 'การใช้และรักษารถยนต์ส่วนกลางและน้ำมัน', department: 'สำนักปลัด', riskLevel: 'ปานกลาง', y1: false, y2: true, y3: true, manDays: 15 },
    { id: 'ST-07', name: 'เงินอาหารกลางวันโรงเรียน & ศูนย์พัฒนาเด็กเล็ก', department: 'กองการศึกษา', riskLevel: 'ปานกลาง', y1: true, y2: false, y3: true, manDays: 15 },
    { id: 'ST-08', name: 'เงินเบี้ยยังชีพผู้สูงอายุและคนพิการ', department: 'กองสวัสดิการสังคม', riskLevel: 'ต่ำ', y1: false, y2: true, y3: false, manDays: 10 },
    { id: 'ST-09', name: 'การบริหารสัญญาและหลักประกันสัญญา', department: 'กองคลัง', riskLevel: 'ปานกลาง', y1: true, y2: true, y3: false, manDays: 15 }
  ], []);

  const [strategicActivities, setStrategicActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_strategic_activities_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return defaultActivities;
  });

  const toggleYear = (id, yearKey) => {
    const updated = strategicActivities.map((act) =>
      act.id === id ? { ...act, [yearKey]: !act[yearKey] } : act
    );
    setStrategicActivities(updated);
    localStorage.setItem('ia_strategic_activities_v2', JSON.stringify(updated));
  };

  // Planned days sum for Year 1
  const y1TotalDays = strategicActivities
    .filter((a) => a.y1)
    .reduce((sum, a) => sum + (a.manDays || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden print:hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>ขั้นตอนที่ 2 ของกระบวนการตรวจสอบภายใน อปท.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              แผนการตรวจสอบระยะยาว (3 ปี) & การคำนวณคน-วัน (Audit Capacity)
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm max-w-2xl">
              คำนวณวันทำการตรวจสอบจริง (Audit Man-Days Capacity) และจัดสรรกิจกรรมเข้าแผนหมุนเวียนระยะยาว 3 ปี ตามระดับความเสี่ยง (สูง=ทุกปี, ปานกลาง=ปีเว้นปี) ตามมาตรฐานคู่มือ สถ.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer border border-white/20 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์แผน 3 ปี</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-xs flex space-x-2 print:hidden">
        <button
          onClick={() => setActiveTab('manday')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'manday'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>การคำนวณคน-วัน (Audit Man-Days Capacity)</span>
        </button>

        <button
          onClick={() => setActiveTab('three_year')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'three_year'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ตารางแผนการตรวจสอบระยะยาว 3 ปี ({year1} - {year3})</span>
        </button>
      </div>

      {/* VIEW: MAN-DAY CALCULATION */}
      {activeTab === 'manday' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span>สูตรคำนวณวันทำการและความสามารถในการตรวจสอบ (Audit Capacity Formula)</span>
            </h2>
            <p className="text-xs text-slate-500">
              อ้างอิงหลักเกณฑ์กระทรวงการคลัง และคู่มือการปฏิบัติงานของกองตรวจสอบระบบการเงินบัญชีท้องถิ่น (สถ.)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Variables */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                ตัวแปรการคำนวณประจำปีงบประมาณ พ.ศ. {selectedYear}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">จำนวนผู้ตรวจสอบภายใน (คน)</label>
                  <input
                    type="number"
                    min="1"
                    value={auditorCount}
                    onChange={(e) => setAuditorCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">วันทำงานรวมทั้งปี (วันทำการราชการ)</label>
                  <input
                    type="number"
                    value={grossWorkingDays}
                    onChange={(e) => setGrossWorkingDays(parseInt(e.target.value) || 220)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">มาตรฐาน 52 สัปดาห์ × 5 วัน หักวันหยุดราชการ = ประมาณ 220-230 วัน</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">หัก วันลา (วัน)</label>
                    <input
                      type="number"
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">หัก ฝึกอบรม (วัน)</label>
                    <input
                      type="number"
                      value={trainingDays}
                      onChange={(e) => setTrainingDays(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">หัก งานบริหาร (วัน)</label>
                    <input
                      type="number"
                      value={adminDays}
                      onChange={(e) => setAdminDays(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity Result Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-indigo-950/40 p-6 rounded-2xl border border-blue-200 dark:border-indigo-800 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                  ผลการคำนวณกำลังคน-วัน (Audit Capacity)
                </span>
                <div className="text-4xl font-black text-blue-900 dark:text-blue-200">
                  {totalNetAuditCapacity} <span className="text-base font-normal text-slate-600 dark:text-slate-400">คน-วัน (Man-Days)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  ผู้ตรวจสอบ {auditorCount} คน สามารถลงพื้นที่ตรวจสอบจริงได้คนละ <strong>{netFieldworkDaysPerAuditor} วัน/ปี</strong> รวมกำลังคนตรวจจริง <strong>{totalNetAuditCapacity} คน-วัน</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">กำลังคน-วันที่ใช้ในแผนปี {year1}:</span>
                  <span className="font-bold text-blue-800 dark:text-blue-300">{y1TotalDays} คน-วัน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">กำลังคงเหลือสำหรับงานตรวจพิเศษ/คำสั่งผู้บริหาร:</span>
                  <span className={`font-bold ${totalNetAuditCapacity >= y1TotalDays ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {totalNetAuditCapacity - y1TotalDays} คน-วัน
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      y1TotalDays <= totalNetAuditCapacity ? 'bg-blue-600' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, (y1TotalDays / (totalNetAuditCapacity || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: 3-YEAR STRATEGIC PLAN MATRIX */}
      {activeTab === 'three_year' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                ผังแผนการตรวจสอบระยะยาว 3 ปี (พ.ศ. {year1} - {year3})
              </h2>
              <div className="text-xs text-slate-500">
                หน่วยตรวจสอบภายใน {orgProfile?.name || 'อปท.'}
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>เสี่ยงสูง (ตรวจทุกปี)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>เสี่ยงปานกลาง (ตรวจปีเว้นปี)</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-3 px-3">กิจกรรม / ภารกิจที่ตรวจสอบ</th>
                  <th className="py-3 px-3">หน่วยรับตรวจ</th>
                  <th className="py-3 px-3 text-center">ระดับความเสี่ยง</th>
                  <th className="py-3 px-3 text-center">คน-วัน</th>
                  <th className="py-3 px-3 text-center w-24">ปี {year1}</th>
                  <th className="py-3 px-3 text-center w-24">ปี {year2}</th>
                  <th className="py-3 px-3 text-center w-24">ปี {year3}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {strategicActivities.map((act, idx) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">{act.name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{act.department}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          act.riskLevel === 'สูง'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : act.riskLevel === 'ปานกลาง'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {act.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700 dark:text-blue-400">
                      {act.manDays}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleYear(act.id, 'y1')}
                        className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          act.y1
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {act.y1 ? '✓' : '-'}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleYear(act.id, 'y2')}
                        className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          act.y2
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {act.y2 ? '✓' : '-'}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleYear(act.id, 'y3')}
                        className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          act.y3
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {act.y3 ? '✓' : '-'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
