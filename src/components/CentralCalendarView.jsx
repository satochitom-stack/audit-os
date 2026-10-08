import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Clock,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  ListFilter,
  Search,
  Sparkles,
  MapPin,
  Tag
} from 'lucide-react';
import { initialCentralCalendarEvents } from '../data/initialData';

export default function CentralCalendarView({
  session,
  orgProfile = {},
  setCurrentTab
}) {
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_central_calendar_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return initialCentralCalendarEvents || [];
  });

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    department: 'กองคลัง',
    category: 'audit',
    standardRef: '',
    desc: ''
  });

  const saveEvents = (data) => {
    setEvents(data);
    try {
      localStorage.setItem('ia_central_calendar_events', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) {
      alert('กรุณากรอกชื่อกิจกรรมและวันที่ให้ครบถ้วน');
      return;
    }

    const catNameMap = {
      audit: 'การตรวจสอบภายใน (Internal Audit)',
      deadline: 'วันครบกำหนดรายงาน (Legal Deadline)',
      contract: 'ครบกำหนดสัญญา (Contract Expiry)',
      meeting: 'การประชุม / อบรม (Meeting & Workshop)'
    };

    const item = {
      id: `EVT-${Date.now()}`,
      title: newEvent.title,
      date: newEvent.date,
      department: newEvent.department,
      category: newEvent.category,
      categoryName: catNameMap[newEvent.category] || 'กิจกรรมทั่วไป',
      standardRef: newEvent.standardRef || 'ระเบียบแบบแผนราชการ',
      desc: newEvent.desc || '',
      status: 'pending'
    };

    saveEvents([...events, item]);
    setShowAddModal(false);
    setNewEvent({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      department: 'กองคลัง',
      category: 'audit',
      standardRef: '',
      desc: ''
    });
  };

  const toggleEventStatus = (id) => {
    const updated = events.map((ev) =>
      ev.id === id
        ? { ...ev, status: ev.status === 'completed' ? 'pending' : 'completed' }
        : ev
    );
    saveEvents(updated);
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent((prev) => ({
        ...prev,
        status: prev.status === 'completed' ? 'pending' : 'completed'
      }));
    }
  };

  // Filtered & Sorted events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (selectedDept !== 'all' && ev.department !== selectedDept) return false;
        if (selectedCategory !== 'all' && ev.category !== selectedCategory) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = ev.title.toLowerCase().includes(q);
          const matchDept = ev.department.toLowerCase().includes(q);
          const matchRef = ev.standardRef?.toLowerCase().includes(q);
          if (!matchTitle && !matchDept && !matchRef) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, selectedDept, selectedCategory, searchQuery]);

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'audit':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800';
      case 'deadline':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900';
      case 'contract':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700';
      case 'meeting':
        return 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:border-stone-700';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-800 dark:border-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 rounded-3xl p-6 shadow-sm border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
            <span>ปฏิทินปฏิบัติงาน & แผนการตรวจสอบส่วนกลาง (Central IA Calendar)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            ปฏิทินกิจกรรมการตรวจสอบและกรอบเวลาราชการ
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            รวมกำหนดการตรวจรับพัสดุ, วันครบกำหนดส่งรายงาน ปค.5 / บส.3, ปิดงบการเงิน และกิจกรรมตรวจสอบทุกส่วนราชการ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-stone-800 p-1 rounded-xl border border-stone-700/60">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              รายการกำหนดการ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              ตารางปฏิทิน
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มกิจกรรม</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหาชื่อกิจกรรม, ส่วนราชการ, ระเบียบที่เกี่ยวข้อง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 font-bold"
          >
            <option value="all">ทุกสำนัก/กอง</option>
            <option value="หน่วยตรวจสอบภายใน">หน่วยตรวจสอบภายใน</option>
            <option value="สำนักปลัด">สำนักปลัด (รวมงานสาธารณสุขฯ)</option>
            <option value="กองคลัง">กองคลัง</option>
            <option value="กองช่าง">กองช่าง</option>
            <option value="กองการศึกษา">กองการศึกษา</option>
            <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
            <option value="ทุกส่วนราชการ">ทุกส่วนราชการ</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 font-bold"
          >
            <option value="all">ทุกประเภทกิจกรรม</option>
            <option value="audit">การตรวจสอบภายใน</option>
            <option value="deadline">วันครบกำหนดส่งรายงาน</option>
            <option value="contract">ครบกำหนดสัญญา</option>
            <option value="meeting">การประชุม / อบรม</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: LIST / AGENDA VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredEvents.map((ev) => {
            const isCompleted = ev.status === 'completed';
            const catBadgeClass = getCategoryBadge(ev.category);

            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className={`bg-white dark:bg-stone-900 rounded-2xl p-5 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  isCompleted
                    ? 'border-stone-200/80 dark:border-stone-800 opacity-75'
                    : 'border-stone-200/80 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex flex-col items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {new Date(ev.date).toLocaleDateString('th-TH', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black">
                      {new Date(ev.date).getDate()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${catBadgeClass}`}>
                        {ev.categoryName || ev.category}
                      </span>
                      <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                        {ev.department}
                      </span>
                      {isCompleted && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ดำเนินการเสร็จแล้ว</span>
                        </span>
                      )}
                    </div>

                    <h3 className={`font-bold text-sm sm:text-base group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors ${
                      isCompleted ? 'line-through text-stone-500' : 'text-stone-900 dark:text-stone-100'
                    }`}>
                      {ev.title}
                    </h3>

                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                      {ev.desc}
                    </p>

                    {ev.standardRef && (
                      <div className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold">
                        อ้างอิง: {ev.standardRef}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEventStatus(ev.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {isCompleted ? 'เปลี่ยนเป็นรอดำเนินการ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="p-12 text-center text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800">
              <CalendarIcon className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <div className="font-bold text-sm text-stone-700 dark:text-stone-300">ไม่พบกิจกรรมที่ตรงกับเงื่อนไข</div>
              <div className="text-xs text-stone-500">กรุณาลองเปลี่ยนคำค้นหา หรือกดเพิ่มกิจกรรมใหม่</div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: GRID / CALENDAR MONTH VIEW */}
      {viewMode === 'grid' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              มีนาคม 2569 (March 2026)
            </h3>
            <span className="text-xs text-stone-500">
              คลิกที่กิจกรรมในแต่ละวันเพื่อเปิดดูรายละเอียด
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-stone-500 border-b border-stone-100 dark:border-stone-800 pb-2">
            <div>อา.</div>
            <div>จ.</div>
            <div>อ.</div>
            <div>พ.</div>
            <div>พฤ.</div>
            <div>ศ.</div>
            <div>ส.</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const dayStr = `2026-03-${day.toString().padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter((e) => e.date === dayStr);

              return (
                <div
                  key={day}
                  className={`min-h-[90px] p-1.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                    dayEvents.length > 0
                      ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20'
                      : 'border-stone-100 dark:border-stone-800/80 bg-stone-50/30 dark:bg-stone-950/30'
                  }`}
                >
                  <div className="text-right font-bold text-xs text-stone-700 dark:text-stone-300 p-0.5">
                    {day}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="text-[10px] font-bold p-1 rounded bg-amber-700 text-white truncate cursor-pointer hover:bg-amber-800 shadow-2xs"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-amber-700 dark:text-amber-400 font-bold text-center">
                        +{dayEvents.length - 2} อื่นๆ
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: เพิ่มกิจกรรมใหม่ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200/80 dark:border-stone-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3">
              <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-bold">
                <CalendarIcon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span>เพิ่มกิจกรรมในปฏิทินส่วนกลาง</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  ชื่อกิจกรรม / ภารกิจการตรวจ <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สุ่มตรวจพัสดุประจำปี หรือ รายงานผล ปค.5"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    วันที่กำหนด <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    ประเภทกิจกรรม:
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-bold"
                  >
                    <option value="audit">การตรวจสอบภายใน</option>
                    <option value="deadline">วันครบกำหนดส่งรายงาน</option>
                    <option value="contract">ครบกำหนดสัญญา</option>
                    <option value="meeting">การประชุม / อบรม</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    ส่วนราชการที่รับผิดชอบ:
                  </label>
                  <select
                    value={newEvent.department}
                    onChange={(e) => setNewEvent({ ...newEvent, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-bold"
                  >
                    <option value="หน่วยตรวจสอบภายใน">หน่วยตรวจสอบภายใน</option>
                    <option value="สำนักปลัด">สำนักปลัด (รวมงานสาธารณสุขฯ)</option>
                    <option value="กองคลัง">กองคลัง</option>
                    <option value="กองช่าง">กองช่าง</option>
                    <option value="กองการศึกษา">กองการศึกษา</option>
                    <option value="กองสวัสดิการสังคม">กองสวัสดิการสังคม</option>
                    <option value="ทุกส่วนราชการ">ทุกส่วนราชการ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    กฎหมาย / ระเบียบอ้างอิง:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ว 184 หรือ พ.ร.บ. จัดซื้อจัดจ้างฯ"
                    value={newEvent.standardRef}
                    onChange={(e) => setNewEvent({ ...newEvent, standardRef: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  รายละเอียดเพิ่มเติม:
                </label>
                <textarea
                  rows="3"
                  placeholder="ระบุข้อกำหนด สิ่งที่ต้องเตรียมการ หรือแนวทางปฏิบัติ..."
                  value={newEvent.desc}
                  onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-200/80 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกกิจกรรม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: รายละเอียดกิจกรรม */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200/80 dark:border-stone-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3">
              <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-bold">
                <CalendarIcon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span>รายละเอียดกิจกรรมปฏิทิน</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl space-y-1">
                <div className="text-stone-400 text-[11px]">ชื่อกิจกรรม:</div>
                <div className="font-bold text-base text-stone-900 dark:text-stone-100">
                  {selectedEvent.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-stone-50 dark:bg-stone-950 rounded-xl">
                  <span className="text-stone-400 block text-[11px]">วันที่กำหนด:</span>
                  <strong className="text-amber-800 dark:text-amber-400 font-mono">{selectedEvent.date}</strong>
                </div>
                <div className="p-2.5 bg-stone-50 dark:bg-stone-950 rounded-xl">
                  <span className="text-stone-400 block text-[11px]">ส่วนราชการ:</span>
                  <strong className="text-stone-800 dark:text-stone-200">{selectedEvent.department}</strong>
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl space-y-1">
                <span className="text-stone-400 block text-[11px]">รายละเอียด:</span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {selectedEvent.desc || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </p>
                {selectedEvent.standardRef && (
                  <div className="text-amber-800 dark:text-amber-400 font-semibold pt-1 text-[11px]">
                    ระเบียบอ้างอิง: {selectedEvent.standardRef}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 dark:border-stone-800">
                <span className="text-stone-500 font-bold">สถานะการดำเนินงาน:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedEvent.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {selectedEvent.status === 'completed' ? '✓ ดำเนินการแล้วเสร็จ' : '⏳ รอดำเนินการ'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200/80 dark:border-stone-800">
              <button
                type="button"
                onClick={() => toggleEventStatus(selectedEvent.id)}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-xs cursor-pointer border border-amber-200/80 dark:border-amber-800/60"
              >
                {selectedEvent.status === 'completed' ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
