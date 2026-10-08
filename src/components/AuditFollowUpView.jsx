import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  Printer,
  Calendar,
  Send,
  Plus,
  Trash2,
  Edit3,
  Check,
  ChevronDown,
  Filter,
  Search,
  BellRing
} from 'lucide-react';

export default function AuditFollowUpView({
  selectedYear = '2569',
  orgProfile = {},
  capaFindings = [],
  setCapaFindings
}) {
  const [activeTab, setActiveTab] = useState('register'); // 'register', 'memo'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFindingForMemo, setSelectedFindingForMemo] = useState(null);

  // Default register findings if capaFindings is empty
  const defaultItems = useMemo(() => {
    return [
      {
        id: 'CAPA-FOLLOW-01',
        title: 'การจัดทำงบกระทบยอดเงินฝากธนาคารล่าช้า',
        department: 'กองคลัง',
        reportedDate: '2569-02-15',
        orderDate: '2569-02-20',
        deadlineDate: '2569-03-22', // 30 วัน
        recommendation: 'ให้กองคลังเร่งรัดจัดทำงบกระทบยอดเงินฝากธนาคารทุกบัญชีเป็นประจำทุกสิ้นเดือนและรายงานผู้บริหารภายใน 15 วัน',
        status: 'in_progress', // 'completed', 'in_progress', 'overdue'
        progressNotes: 'กองคลังได้จัดทำงบกระทบยอดของเดือน ม.ค. แล้วเสร็จ อยู่ระหว่างดำเนินการของเดือน ก.พ.',
        updatedAt: '2569-03-01'
      },
      {
        id: 'CAPA-FOLLOW-02',
        title: 'การลงบันทึกการใช้รถยนต์ส่วนกลางไม่ครบถ้วน',
        department: 'สำนักปลัด',
        reportedDate: '2569-01-10',
        orderDate: '2569-01-15',
        deadlineDate: '2569-02-14',
        recommendation: 'กำชับพนักงานขับรถให้ลงบันทึกเลขไมล์เริ่มต้น-สิ้นสุด และคำนวณอัตราสิ้นเปลืองน้ำมันเชื้อเพลิงทุกครั้ง',
        status: 'completed',
        progressNotes: 'สำนักปลัดได้จัดประชุมกำชับพนักงานขับรถ และผู้ควบคุมรถได้ตรวจเช็คสมุดบันทึกประจำรถทุกสัปดาห์แล้ว',
        updatedAt: '2569-02-10'
      }
    ];
  }, []);

  const [registerItems, setRegisterItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_followup_register');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return defaultItems;
  });

  const saveRegister = (items) => {
    setRegisterItems(items);
    localStorage.setItem('ia_followup_register', JSON.stringify(items));
  };

  const handleUpdateStatus = (id, newStatus) => {
    const updated = registerItems.map((item) =>
      item.id === id ? { ...item, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] } : item
    );
    saveRegister(updated);
  };

  const handleUpdateNotes = (id, notes) => {
    const updated = registerItems.map((item) =>
      item.id === id ? { ...item, progressNotes: notes, updatedAt: new Date().toISOString().split('T')[0] } : item
    );
    saveRegister(updated);
  };

  const handleSelectForMemo = (item) => {
    setSelectedFindingForMemo(item);
    setActiveTab('memo');
  };

  const currentMemoItem = selectedFindingForMemo || registerItems[0] || defaultItems[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-6 sm:p-8 text-stone-100 border border-stone-800 shadow-xl relative overflow-hidden print:hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>ขั้นตอนที่ 9 ของกระบวนการตรวจสอบภายใน อปท.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              ทะเบียนคุม & การติดตามผลข้อเสนอแนะ 30 วัน (Audit Follow-up)
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-2xl">
              ติดตามการปฏิบัติตามข้อเสนอแนะตามระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในของ อปท. พ.ศ. 2545 ข้อ 21 พร้อมจัดทำหนังสือติดตามผลเมื่อครบกำหนด 30 วัน
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={() => window.print()}
              className="bg-stone-800/80 hover:bg-stone-700 text-stone-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer border border-stone-700 shadow-xs"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>พิมพ์ทะเบียนคุม / หนังสือ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-2 border border-stone-200/80 dark:border-stone-800 shadow-xs flex space-x-2 print:hidden">
        <button
          onClick={() => setActiveTab('register')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'register'
              ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>ทะเบียนคุมการปฏิบัติตามข้อเสนอแนะ (Follow-up Register)</span>
        </button>

        <button
          onClick={() => setActiveTab('memo')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'memo'
              ? 'bg-stone-850 text-amber-200 dark:bg-stone-800 dark:text-amber-300 shadow-xs border border-stone-700/60'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>บันทึกข้อความติดตามผลครบ 30 วัน (Reminder Memo)</span>
        </button>
      </div>

      {/* VIEW: REGISTER */}
      {activeTab === 'register' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                ทะเบียนคุมการติดตามผลการดำเนินการตามข้อเสนอแนะ ประจำปีงบประมาณ พ.ศ. {selectedYear}
              </h2>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                หน่วยตรวจสอบภายใน {orgProfile?.name || 'อปท.'}
              </div>
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>เสร็จสิ้น: {registerItems.filter((i) => i.status === 'completed').length}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>อยู่ระหว่างดำเนินการ: {registerItems.filter((i) => i.status === 'in_progress').length}</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden">
              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-3 px-3">ประเด็นข้อตรวจพบ / ข้อเสนอแนะ</th>
                  <th className="py-3 px-3">หน่วยรับตรวจ</th>
                  <th className="py-3 px-3">วันครบกำหนด (30 วัน)</th>
                  <th className="py-3 px-3">ผลการดำเนินการ</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3 text-right print:hidden">เครื่องมือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {registerItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-stone-400">{idx + 1}</td>
                    <td className="py-3 px-3 max-w-xs space-y-1">
                      <div className="font-bold text-stone-900 dark:text-stone-100">{item.title}</div>
                      <div className="text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed">{item.recommendation}</div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-amber-800 dark:text-amber-300">
                      {item.department}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-stone-800 dark:text-stone-200">{item.deadlineDate}</div>
                      <div className="text-[10px] text-stone-400">สั่งการเมื่อ: {item.orderDate}</div>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <textarea
                        rows={2}
                        value={item.progressNotes}
                        onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                        className="w-full text-[11px] p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800 text-stone-800 dark:text-stone-200 leading-relaxed print:border-none focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className={`p-1.5 rounded-lg text-[11px] font-bold border ${
                          item.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
                        <option value="completed">ดำเนินการเสร็จสิ้น</option>
                        <option value="overdue">เกินกำหนด 30 วัน</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 text-right print:hidden">
                      <button
                        onClick={() => handleSelectForMemo(item)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                        title="ออกบันทึกติดตามผล 30 วัน"
                      >
                        ออกหนังสือเตือน
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: MEMO */}
      {activeTab === 'memo' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-12 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0">
          <div className="text-center font-bold text-base text-stone-900 dark:text-stone-100 border-b pb-3 border-stone-200 dark:border-stone-700">
            บันทึกข้อความ (ติดตามผลการปฏิบัติตามข้อเสนอแนะครบกำหนด 30 วัน)
          </div>

          <div className="text-xs space-y-2 text-stone-800 dark:text-stone-200">
            <div className="flex justify-between">
              <div><strong>ส่วนราชการ:</strong> หน่วยตรวจสอบภายใน {orgProfile?.name || 'อปท.'}</div>
              <div><strong>โทร:</strong> {orgProfile?.phone || '-'}</div>
            </div>
            <div className="flex justify-between">
              <div><strong>ที่:</strong> มท 0808/{selectedYear}/ว...</div>
              <div><strong>วันที่:</strong> {new Date().toLocaleDateString('th-TH')}</div>
            </div>
            <div>
              <strong>เรื่อง:</strong> ติดตามผลการดำเนินการตามข้อเสนอแนะการตรวจสอบภายใน ครบกำหนด 30 วัน
            </div>
            <div className="pt-2">
              <strong>เรียน:</strong> ผู้อำนวยการ{currentMemoItem.department || 'หน่วยรับตรวจ'}
            </div>
          </div>

          <div className="text-xs space-y-3 leading-relaxed text-stone-700 dark:text-stone-300 text-justify">
            <p className="indent-8">
              ตามที่ หน่วยตรวจสอบภายในได้รายงานผลการตรวจสอบภายในประจำปีงบประมาณ พ.ศ. {selectedYear} ในภารกิจ "{currentMemoItem.title}" และ นายก{orgProfile?.name || 'อปท.'} ได้มีข้อสั่งการเมื่อวันที่ {currentMemoItem.orderDate || '...'} ให้หน่วยงานของท่านดำเนินการปรับปรุงแก้ไขข้อบกพร่องตามข้อเสนอแนะภายในกำหนด 30 วันนั้น
            </p>
            <p className="indent-8">
              บัดนี้ ได้ล่วงเลยครบกำหนดระยะเวลา 30 วันแล้ว (ครบกำหนดวันที่ {currentMemoItem.deadlineDate || '...'}) เพื่อให้การติดตามผลการตรวจสอบภายในเป็นไปตามระเบียบกระทรวงมหาดไทยว่าด้วยการตรวจสอบภายในขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2545 ข้อ 21 หน่วยตรวจสอบภายในจึงขอติดตามผลความคืบหน้าการปรับปรุงแก้ไขในประเด็นดังกล่าว
            </p>
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-200">ข้อเสนอแนะที่ต้องติดตาม:</div>
              <div className="text-stone-800 dark:text-stone-200">{currentMemoItem.recommendation}</div>
            </div>
            <p className="indent-8">
              จึงเรียนมาเพื่อโปรดรายงานผลการดำเนินการพร้อมแนบเอกสารหลักฐานที่เกี่ยวข้อง ส่งกลับมายังหน่วยตรวจสอบภายในภายใน 7 วันทำการ เพื่อรวบรวมรายงานต่อนายก{orgProfile?.name || 'อปท.'} ต่อไป
            </p>
          </div>

          <div className="pt-10 text-center text-xs space-y-12 ml-auto w-64">
            <div>(ลงชื่อ)........................................................</div>
            <div>
              ({orgProfile?.auditorName || 'ผู้ตรวจสอบภายใน'})<br />
              {orgProfile?.auditorPosition || 'นักวิชาการตรวจสอบภายใน'}<br />
              หน่วยตรวจสอบภายใน {orgProfile?.name || 'อปท.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
