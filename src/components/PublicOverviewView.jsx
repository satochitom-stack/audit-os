import React, { useState, useEffect } from 'react';
import {
  Building2,
  Car,
  BadgeDollarSign,
  HardHat,
  GraduationCap,
  HeartHandshake,
  Activity,
  Calendar,
  Clock,
  Download,
  FileText,
  ShieldCheck,
  Phone,
  MapPin,
  Mail,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Globe,
  Sparkles,
  Users,
  Settings,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  X,
  Quote,
  Landmark,
  Award,
  Orbit,
  LayoutGrid,
  Cloud,
  Loader2
} from 'lucide-react';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import { cloudSyncService } from '../services/cloudSyncService';

export default function PublicOverviewView({
  orgProfile = {},
  selectedYear = '2569',
  session = {},
  setCurrentTab = () => {}
}) {
  const [activeTab, setActiveTab] = useState('divisions'); // divisions, timelines, forms, ita
  const [timelineViewMode, setTimelineViewMode] = useState('orbital'); // orbital, cards
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
  const [adminModalTab, setAdminModalTab] = useState('general'); // general, divisions, timelines, forms, contact
  const [selectedDivForEdit, setSelectedDivForEdit] = useState(0);

  const isAdmin = session?.role === 'admin';

  const orgName = orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น';
  const rawDistrict = orgProfile.district || '';
  const rawProvince = orgProfile.province || '';

  const cleanDistrict = rawDistrict.replace(/^อำเภอ/, '').trim();
  const cleanProvince = rawProvince.replace(/^จังหวัด/, '').trim();
  const locationDisplay = cleanDistrict && cleanProvince ? `${orgName} • อ.${cleanDistrict} จ.${cleanProvince}` : orgName;

  // Default initial public data
  const defaultOverviewData = {
    slogan: 'เมืองน่าอยู่ เชิดชูคุณธรรม นำการพัฒนา ประชาชนมีคุณภาพชีวิตที่ดี',
    welcomeDesc: 'มุ่งมั่นให้บริการด้วยความโปร่งใส รวดเร็ว ถูกต้องตามระเบียบกฎหมาย พร้อมเปิดเผยข้อมูลสาธารณะแก่พี่น้องประชาชนทุกคน',
    metrics: [
      { label: 'การบริหารราชการ', value: '5 ส่วนราชการหลัก', note: `โครงสร้างส่วนราชการ` },
      { label: 'เขตพื้นที่ให้บริการ', value: 'ครอบคลุมทุกพื้นที่', note: 'ครอบคลุมทุกหลังคาเรือน' },
      { label: 'มาตรฐานความโปร่งใส', value: 'No Gift Policy 100%', note: 'งดรับของขวัญทุกชนิด' },
      { label: 'ช่องทางรับเรื่องร้องทุกข์', value: 'ศูนย์ดำรงธรรม อปท.', note: 'ยุติธรรม รวดเร็ว โปร่งใส' }
    ],
    divisions: [
      {
        id: 'office',
        name: 'สำนักปลัด',
        leader: orgProfile.palatName ? `กำกับโดย ${orgProfile.palatName}` : 'หัวหน้าสำนักปลัด',
        iconName: 'Building2',
        color: 'blue',
        headerBg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60',
        badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        services: [
          'งานสารบรรณ รับ-ส่งหนังสือราชการและออกหนังสือรับรอง',
          'งานนิติการและศูนย์ดำรงธรรม รับเรื่องราวร้องทุกข์ของประชาชน',
          'งานป้องกันและบรรเทาสาธารณภัย (อปพร., รถน้ำ, ระงับอัคคีภัย)',
          'บริการจัดเก็บและขนถ่ายขยะมูลฝอยในเขตพื้นที่รับผิดชอบ',
          'การควบคุมและป้องกันโรคติดต่อในชุมชน (ไข้เลือดออก, พิษสุนัขบ้า)',
          'งานสุขาภิบาลอาหาร ตรวจมาตรฐานร้านอาหารและตลาดนัดชุมชน'
        ],
        location: 'ชั้น 1 อาคารสำนักงาน',
        officeHours: 'จันทร์ - ศุกร์ 08.30 - 16.30 น.'
      },
      {
        id: 'finance',
        name: 'กองคลัง',
        leader: 'ผู้อำนวยการกองคลัง',
        iconName: 'BadgeDollarSign',
        color: 'emerald',
        headerBg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        services: [
          'บริการรับชำระภาษีที่ดินและสิ่งปลูกสร้าง (ยื่นภายในเดือน มิ.ย.)',
          'บริการรับชำระภาษีป้ายและค่าธรรมเนียมใบอนุญาตต่างๆ',
          'งานแผนที่ภาษีและทะเบียนทรัพย์สิน (LTAX 3000 / CIS)',
          'งานพัสดุ การจัดซื้อจัดจ้างภาครัฐด้วยความโปร่งใส (e-GP)',
          'งานการเงินและบัญชี การเบิกจ่ายเงินงบประมาณโครงการพัฒนา'
        ],
        location: 'ชั้น 1 อาคารสำนักงาน',
        officeHours: 'จันทร์ - ศุกร์ 08.30 - 16.30 น.'
      },
      {
        id: 'tech',
        name: 'กองช่าง',
        leader: 'ผู้อำนวยการกองช่าง',
        iconName: 'HardHat',
        color: 'amber',
        headerBg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        services: [
          'บริการรับคำขออนุญาตก่อสร้าง ดัดแปลง หรือรื้อถอนอาคาร (แบบ ข.1)',
          'ตรวจพิจารณาแบบแปลนและออกใบอนุญาตอาคาร (แบบ อ.1 ภายใน 45 วัน)',
          'งานซ่อมบำรุงโครงสร้างพื้นฐาน ถนน สะพาน และทางระบายน้ำ',
          'บริการซ่อมแซมและบำรุงรักษาไฟฟ้าสาธารณะส่องสว่างริมทาง',
          'งานควบคุมและดูแลระบบประปาชนบทเพื่อการอุปโภคบริโภค'
        ],
        location: 'ชั้น 2 อาคารสำนักงาน',
        officeHours: 'จันทร์ - ศุกร์ 08.30 - 16.30 น.'
      },
      {
        id: 'education',
        name: 'กองการศึกษา ศาสนาและวัฒนธรรม',
        leader: 'ผู้อำนวยการกองการศึกษา',
        iconName: 'GraduationCap',
        color: 'purple',
        headerBg: 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-900/60',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        services: [
          'บริหารจัดการศูนย์พัฒนาเด็กเล็กในสังกัด',
          'จัดสรรงบประมาณอาหารกลางวันนักเรียนคุณภาพ (24 บาท/คน/วัน)',
          'จัดหาและแจกจ่ายนมโรงเรียนตามมาตรฐาน (พาสเจอร์ไรส์/ยูเอชที)',
          'ส่งเสริมสนับสนุนการจัดกิจกรรมทางศาสนาและประเพณีวัฒนธรรมท้องถิ่น',
          'สนับสนุนการพัฒนาการเรียนรู้และสุขอนามัยเด็กปฐมวัย'
        ],
        location: 'ชั้น 2 อาคารสำนักงาน',
        officeHours: 'จันทร์ - ศุกร์ 08.30 - 16.30 น.'
      },
      {
        id: 'welfare',
        name: 'กองสวัสดิการสังคม',
        leader: 'ผู้อำนวยการกองสวัสดิการสังคม',
        iconName: 'HeartHandshake',
        color: 'rose',
        headerBg: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60',
        badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
        services: [
          'บริการรับลงทะเบียนและจ่ายเงินเบี้ยยังชีพผู้สูงอายุ (600 - 1,000 บาท/เดือน)',
          'บริการรับคำขอลงทะเบียนเบี้ยความพิการ (800 - 1,000 บาท/เดือน)',
          'บริการช่วยเหลือสงเคราะห์ผู้ป่วยเอดส์และผู้ยากไร้ในชุมชน',
          'บริการเงินช่วยเหลือผู้ประสบปัญหาทางสังคมและภัยพิบัติฉุกเฉิน',
          'ส่งเสริมและพัฒนาศักยภาพกลุ่มสตรี เยาวชน และผู้สูงอายุในพื้นที่'
        ],
        location: 'ชั้น 1 อาคารสำนักงาน',
        officeHours: 'จันทร์ - ศุกร์ 08.30 - 16.30 น.'
      }
    ],
    timelines: [
      {
        id: 'TIME-01',
        title: 'การชำระภาษีที่ดินและสิ่งปลูกสร้าง',
        period: 'มกราคม - มิถุนายน ของทุกปี',
        authority: 'กองคลัง',
        desc: 'ประชาชนผู้ครอบครองที่ดินและสิ่งปลูกสร้าง ยื่นแบบและชำระภาษีตามการประเมิน',
        statusNote: 'เปิดให้บริการตามเวลาราชการ',
        color: 'emerald'
      },
      {
        id: 'TIME-02',
        title: 'การโอนเงินเบี้ยยังชีพผู้สูงอายุและคนพิการ',
        period: 'ทุกวันที่ 10 ของเดือน',
        authority: 'กองสวัสดิการสังคม',
        desc: 'กรมบัญชีกลางโอนเงินเข้าบัญชีเงินฝากธนาคารของผู้มีสิทธิโดยตรง',
        statusNote: 'ตรงตามรอบปฏิทินจ่ายเงินภาครัฐ',
        color: 'rose'
      },
      {
        id: 'TIME-03',
        title: 'การยื่นคำขออนุญาตก่อสร้างอาคาร (แบบ ข.1)',
        period: 'พิจารณาแล้วเสร็จภายใน 45 วัน',
        authority: 'กองช่าง',
        desc: 'ตาม พ.ร.บ. ควบคุมอาคาร พ.ศ. 2522 ตรวจสอบแบบแปลนและแจ้งผลอนุญาต',
        statusNote: 'ยื่นคำขอได้ทุกวันทำการ',
        color: 'amber'
      },
      {
        id: 'TIME-04',
        title: 'รอบการจัดเก็บขยะมูลฝอยชุมชน',
        period: 'สัปดาห์ละ 2 ครั้ง (ทุกหมู่บ้าน)',
        authority: 'สำนักปลัด (งานสาธารณสุขฯ)',
        desc: 'รถเก็บขนมูลฝอยเข้าให้บริการตามรอบเส้นทางที่กำหนด อัตรา 40 บาท/ถัง/เดือน',
        statusNote: 'ให้บริการสม่ำเสมอ',
        color: 'blue'
      },
      {
        id: 'TIME-05',
        title: 'รณรงค์ฉีดวัคซีนป้องกันโรคพิษสุนัขบ้าฟรี',
        period: 'มีนาคม - พฤษภาคม ของทุกปี',
        authority: 'สำนักปลัด (งานสาธารณสุขฯ)',
        desc: 'บริการฉีดวัคซีนป้องกันโรคพิษสุนัขบ้าให้แก่สุนัขและแมวในชุมชนฟรี',
        statusNote: 'จัดบริการเชิงรุกถึงหมู่บ้าน',
        color: 'purple'
      }
    ],
    forms: [
      {
        id: 'FORM-01',
        code: 'แบบ บย.01',
        title: 'คำขอลงทะเบียนรับเงินเบี้ยยังชีพผู้สูงอายุ',
        dept: 'กองสวัสดิการสังคม',
        docs: 'บัตรประชาชนตัวจริง, ทะเบียนบ้าน, สมุดบัญชีเงินฝากธนาคาร',
        size: 'PDF / Word'
      },
      {
        id: 'FORM-02',
        code: 'แบบ คำขอ บพ.',
        title: 'คำขอลงทะเบียนรับเงินเบี้ยความพิการ',
        dept: 'กองสวัสดิการสังคม',
        docs: 'สมุดประจำตัวคนพิการ, บัตรประชาชน, ทะเบียนบ้าน, หน้าสมุดบัญชีธนาคาร',
        size: 'PDF / Word'
      },
      {
        id: 'FORM-03',
        code: 'แบบ ข.1',
        title: 'คำขออนุญาตก่อสร้าง ดัดแปลง หรือรื้อถอนอาคาร',
        dept: 'กองช่าง',
        docs: 'สำเนาโฉนดที่ดิน/น.ส.3, แบบแปลนและผังบริเวณ 3 ชุด, บัตรประชาชนผู้ขอ',
        size: 'PDF / Word'
      },
      {
        id: 'FORM-04',
        code: 'แบบ คำร้องทั่วไป',
        title: 'แบบคำร้องขอรับบริการสาธารณะ / ศูนย์ดำรงธรรม',
        dept: 'สำนักปลัด',
        docs: 'สำเนาบัตรประชาชน และรายละเอียดข้อร้องเรียนหรือเรื่องที่ขอรับบริการ',
        size: 'PDF / Word'
      },
      {
        id: 'FORM-05',
        code: 'แบบ คำขอถังขยะ',
        title: 'แบบคำขอลงทะเบียนถังขยะมูลฝอยและขอรับบริการจัดเก็บ',
        dept: 'สำนักปลัด (งานสาธารณสุขฯ)',
        docs: 'สำเนาบัตรประชาชนเจ้าบ้าน, สำเนาทะเบียนบ้านหลังที่ขอรับบริการ',
        size: 'PDF / Word'
      }
    ],
    contactInfo: {
      phone: orgProfile.phone || '045-000-000',
      fax: orgProfile.fax || '-',
      email: orgProfile.email || 'saraban@localgov.mail.go.th',
      address: orgProfile.address || `สำนักงาน${orgName} ${locationDisplay}`,
      officeHours: 'จันทร์ - ศุกร์ เวลา 08.30 - 16.30 น. (เว้นวันหยุดราชการ)'
    },
    orbitalNodes: [
      {
        id: 1,
        title: 'สำนักปลัด',
        subtitle: 'กำกับโดย หัวหน้าสำนักปลัด',
        date: 'ตลอดปีงบประมาณ',
        content: 'งานสารบรรณ นิติการ ป้องกันและบรรเทาสาธารณภัย สุขาภิบาลและสิ่งแวดล้อม',
        category: 'สำนักปลัด',
        iconName: 'Building2',
        relatedIds: [2, 6],
        status: 'completed',
        energy: 96,
        color: 'blue'
      },
      {
        id: 2,
        title: 'กองคลัง',
        subtitle: 'ผู้อำนวยการกองคลัง',
        date: 'ภาษีที่ดิน มิ.ย.',
        content: 'การเงินและบัญชี ภาษีที่ดินและสิ่งปลูกสร้าง แผนที่ภาษี LTAX 3000 และจัดซื้อจัดจ้าง e-GP',
        category: 'กองคลัง',
        iconName: 'BadgeDollarSign',
        relatedIds: [1, 3],
        status: 'in-progress',
        energy: 94,
        color: 'emerald'
      },
      {
        id: 3,
        title: 'กองช่าง',
        subtitle: 'ผู้อำนวยการกองช่าง',
        date: 'พิจารณาคำขอ 45 วัน',
        content: 'คำขออนุญาตก่อสร้างอาคาร (ข.1/อ.1) ตรวจแบบแปลน ซ่อมบำรุงไฟฟ้าสาธารณะและถนน',
        category: 'กองช่าง',
        iconName: 'HardHat',
        relatedIds: [1, 4],
        status: 'in-progress',
        energy: 88,
        color: 'amber'
      },
      {
        id: 4,
        title: 'กองการศึกษา',
        subtitle: 'ผู้อำนวยการกองการศึกษา',
        date: 'ภาคเรียนที่ 1 - 2',
        content: 'ศูนย์พัฒนาเด็กเล็ก 2 แห่ง (ศพด.วัดเจริญทัศน์ & ศพด.บ้านฝางเทิง) อาหารกลางวันและนมโรงเรียน',
        category: 'กองการศึกษา',
        iconName: 'GraduationCap',
        relatedIds: [3, 5],
        status: 'completed',
        energy: 100,
        color: 'purple'
      },
      {
        id: 5,
        title: 'กองสวัสดิการสังคม',
        subtitle: 'ผู้อำนวยการกองสวัสดิการสังคม',
        date: 'ทุกวันที่ 10 ของเดือน',
        content: 'เบี้ยยังชีพผู้สูงอายุ (600-1,000 บ.) เบี้ยความพิการ และสงเคราะห์ครอบครัวยากไร้',
        category: 'กองสวัสดิการสังคม',
        iconName: 'HeartHandshake',
        relatedIds: [1, 6],
        status: 'completed',
        energy: 98,
        color: 'rose'
      },
      {
        id: 6,
        title: 'เขตพื้นที่รับผิดชอบ',
        subtitle: `พื้นที่บริการประชาชน ${orgName}`,
        date: 'ครอบคลุม 100%',
        content: 'ครอบคลุมการให้บริการสาธารณะและดูแลคุณภาพชีวิตประชาชนทุกหลังคาเรือนในเขตพื้นที่รับผิดชอบ',
        category: 'เขตพื้นที่บริการ',
        iconName: 'MapPin',
        relatedIds: [1, 5],
        status: 'completed',
        energy: 100,
        color: 'cyan'
      }
    ]
  };

  // Selected node for editing in orbital tab
  const [selectedOrbitalNodeForEdit, setSelectedOrbitalNodeForEdit] = useState(0);

  // Persistent state backed by LocalStorage
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_public_overview_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.divisions) && parsed.divisions.length === 5) {
          return {
            ...defaultOverviewData,
            ...parsed,
            orbitalNodes: Array.isArray(parsed.orbitalNodes) && parsed.orbitalNodes.length === 6
              ? parsed.orbitalNodes
              : defaultOverviewData.orbitalNodes
          };
        }
      }
    } catch (e) {
      console.error('Error loading public overview data:', e);
    }
    return defaultOverviewData;
  });

  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudNotice, setCloudNotice] = useState('');

  // Pull latest public overview data from Supabase Cloud on mount & listen to realtime updates
  useEffect(() => {
    let isMounted = true;

    const loadCloudData = async () => {
      try {
        const cloudData = await cloudSyncService.pullPublicOverviewData();
        if (isMounted && cloudData && typeof cloudData === 'object' && cloudData.slogan) {
          setData((prev) => {
            const merged = {
              ...defaultOverviewData,
              ...prev,
              ...cloudData,
              orbitalNodes: Array.isArray(cloudData.orbitalNodes) && cloudData.orbitalNodes.length === 6
                ? cloudData.orbitalNodes
                : prev.orbitalNodes
            };
            try {
              localStorage.setItem('ia_public_overview_data', JSON.stringify(merged));
            } catch (err) {
              console.warn('LocalStorage save error:', err);
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn('Could not load public overview from cloud:', err);
      }
    };

    loadCloudData();

    // Listen to real-time update event from Supabase Realtime channel
    const handleRealtimeUpdate = (e) => {
      if (e.detail && typeof e.detail === 'object' && e.detail.slogan) {
        console.log('⚡ [PublicOverview] Received Realtime Slogan/Overview Update:', e.detail.slogan);
        setData((prev) => {
          const merged = {
            ...prev,
            ...e.detail,
            orbitalNodes: Array.isArray(e.detail.orbitalNodes) && e.detail.orbitalNodes.length === 6
              ? e.detail.orbitalNodes
              : prev.orbitalNodes
          };
          try {
            localStorage.setItem('ia_public_overview_data', JSON.stringify(merged));
          } catch (err) {
            console.warn(err);
          }
          return merged;
        });
      }
    };

    window.addEventListener('ia-public-overview-updated', handleRealtimeUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('ia-public-overview-updated', handleRealtimeUpdate);
    };
  }, []);

  // Working copy for Admin Edit Modal
  const [editForm, setEditForm] = useState(data);

  const handleOpenAdminModal = (defaultTab = 'general') => {
    const copy = JSON.parse(JSON.stringify(data));
    if (!copy.orbitalNodes || copy.orbitalNodes.length !== 6) {
      copy.orbitalNodes = JSON.parse(JSON.stringify(defaultOverviewData.orbitalNodes));
    }
    setEditForm(copy);
    setAdminModalTab(defaultTab);
    setShowAdminEditModal(true);
  };

  const handleSaveAdminData = async () => {
    setIsSavingCloud(true);
    setData(editForm);
    localStorage.setItem('ia_public_overview_data', JSON.stringify(editForm));
    
    try {
      const ok = await cloudSyncService.pushPublicOverviewData(editForm);
      if (ok) {
        setCloudNotice('☁️ ซิงค์ข้อมูลคำขวัญและข้อมูลภาพรวมขึ้น Supabase Cloud สำเร็จ (เปิดเครื่องไหนก็เป็นข้อมูลล่าสุด)');
      } else {
        setCloudNotice('💾 บันทึกลงเบราว์เซอร์เรียบร้อย (ระบบจะซิงค์ขึ้น Cloud ทันทีที่เชื่อมต่อเครือข่าย)');
      }
      setTimeout(() => setCloudNotice(''), 4500);
    } catch (err) {
      console.warn('Failed to push public overview to cloud:', err);
      setCloudNotice('💾 บันทึกลงเครื่องเรียบร้อยแล้ว');
      setTimeout(() => setCloudNotice(''), 4500);
    } finally {
      setIsSavingCloud(false);
      setShowAdminEditModal(false);
    }
  };

  const handleResetToDefault = async () => {
    if (window.confirm('ท่านต้องการรีเซ็ตข้อมูลภาพรวมกลับสู่ค่าเริ่มต้นของระบบใช่หรือไม่?')) {
      setData(defaultOverviewData);
      setEditForm(defaultOverviewData);
      localStorage.setItem('ia_public_overview_data', JSON.stringify(defaultOverviewData));
      try {
        await cloudSyncService.pushPublicOverviewData(defaultOverviewData);
        setCloudNotice('☁️ รีเซ็ตและซิงค์ข้อมูลค่าเริ่มต้นขึ้น Supabase Cloud สำเร็จ');
        setTimeout(() => setCloudNotice(''), 4000);
      } catch (err) {
        console.warn(err);
      }
      setShowAdminEditModal(false);
    }
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'Building2': return Building2;
      case 'BadgeDollarSign': return BadgeDollarSign;
      case 'HardHat': return HardHat;
      case 'GraduationCap': return GraduationCap;
      case 'HeartHandshake': return HeartHandshake;
      default: return Building2;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Cloud Notification Banner */}
      {cloudNotice && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {cloudNotice}
          </span>
          <button onClick={() => setCloudNotice('')} className="p-1 hover:bg-emerald-200/50 rounded-lg cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. กรอบหน่วยงานด้านบน: ข้อมูลองค์กรปกครองส่วนท้องถิ่น */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-900 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-850 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs sm:text-sm font-bold tracking-wide">
            <Landmark className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>{locationDisplay}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>ITA ธรรมาภิบาลระดับ AA</span>
          </span>
        </div>

        {/* Admin Management Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenAdminModal}
            className="bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 border border-amber-600/30 active:scale-95"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>⚙️ จัดการ/แก้ไขข้อมูล (Admin)</span>
          </button>
        )}
      </div>

      {/* 2. โมเดลวงโคจร 3 มิติ (Radial Orbital): โครงสร้าง 5 ส่วนราชการหลัก & ภารกิจ อปท. */}
      {(() => {
        const orbitalNodesToDisplay = (data.orbitalNodes || defaultOverviewData.orbitalNodes).map((node) => ({
          ...node,
          icon: getIconComponent(node.iconName)
        }));

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                  <Orbit className="w-4 h-4" />
                </span>
                <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 font-['Prompt',sans-serif]">
                  โครงสร้าง 5 ส่วนราชการหลัก & ภารกิจ {orgName}
                </h2>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenAdminModal('orbital')}
                  className="text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขคำขวัญ/ข้อมูลวงโคจร</span>
                </button>
              )}
            </div>

            <RadialOrbitalTimeline
              timelineData={orbitalNodesToDisplay}
              slogan={data.slogan}
              centerTitle={orgName}
              centerSubtitle="ศูนย์ปฏิบัติการ 5 ส่วนราชการ"
              badgeLabel="IA-OS DIGITAL GOVERNANCE"
              className="w-full min-h-[580px] h-[640px] flex flex-col items-center justify-center bg-gradient-to-b from-[#f3f8fe] via-[#ebf3fc] to-[#f5f9ff] dark:from-[#071126] dark:via-[#0b1a3a] dark:to-[#071126] relative overflow-hidden rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm"
            />
          </div>
        );
      })()}

      {/* Navigation Sub-Tabs in Modern Pill Container */}
      <div className="bg-white dark:bg-stone-900 p-2 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('divisions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'divisions'
              ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs font-black'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent'
          }`}
        >
          <Building2 className={`w-4 h-4 ${activeTab === 'divisions' ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500'}`} />
          <span>โครงสร้าง 5 ส่วนราชการ (รายละเอียด)</span>
        </button>

        <button
          onClick={() => setActiveTab('timelines')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'timelines'
              ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs font-black'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent'
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === 'timelines' ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500'}`} />
          <span>ปฏิทินรอบเวลาให้บริการประชาชน</span>
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'forms'
              ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs font-black'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent'
          }`}
        >
          <Download className={`w-4 h-4 ${activeTab === 'forms' ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500'}`} />
          <span>แบบฟอร์มคำขอสำหรับประชาชน</span>
        </button>

        <button
          onClick={() => setActiveTab('ita')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'ita'
              ? 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-500/30 shadow-xs font-black'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${activeTab === 'ita' ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500'}`} />
          <span>ความโปร่งใส & ศูนย์ข้อมูลข่าวสาร</span>
        </button>
      </div>

      {/* Tab 1: 5 Divisions Public Structure */}
      {activeTab === 'divisions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>โครงสร้างการบริหารราชการ {orgName}:</strong> ปฏิบัติภารกิจตามระเบียบกฎหมายและพระราชบัญญัติจัดตั้งองค์กรปกครองส่วนท้องถิ่น โดยแบ่งส่วนราชการออกเป็น 5 หน่วยงาน เพื่ออำนวยความสะดวกและให้บริการประชาชนอย่างทั่วถึง รวดเร็ว และเป็นธรรม
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.divisions.map((div, idx) => {
              const Icon = getIconComponent(div.iconName);
              return (
                <div
                  key={div.id || idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Distinct Department Header Strip with soft color tint */}
                  <div className={`p-4 border-b ${div.headerBg}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold shadow-xs border border-slate-200/60 dark:border-slate-700">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {div.name}
                          </h3>
                          <div className="text-xs text-slate-500 font-medium">
                            {div.leader}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Content: Services List */}
                  <div className="p-5 space-y-3 flex-1">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      ภารกิจและงานบริการประชาชน:
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {div.services.map((s, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                          <span className="leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Footer: Location and Office Hours */}
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{div.location}</span>
                    </span>
                    <span>{div.officeHours}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Service Timelines & Deadlines */}
      {activeTab === 'timelines' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-['Prompt',sans-serif]">
                กรอบเวลาและรอบปฏิทินการให้บริการประชาชน
              </h2>
              <p className="text-xs text-slate-500">
                กำหนดการสำคัญเพื่อการติดต่อรับบริการและการปฏิบัติตามกฎหมายของประชาชน
              </p>
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-xl font-bold">
              ปีงบประมาณ พ.ศ. {selectedYear}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {data.timelines.map((t, idx) => (
              <div
                key={t.id || idx}
                className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2 text-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {t.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    {t.authority}
                  </span>
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t.period}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.desc}
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>สถานะการบริการ:</span>
                  <span className="text-emerald-600 font-medium">● {t.statusNote}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Citizen Downloadable Forms */}
      {activeTab === 'forms' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                คลังแบบฟอร์มคำขอสำหรับประชาชน (Citizen Forms)
              </h2>
              <p className="text-xs text-slate-500">
                ดาวน์โหลดแบบคำขอและตรวจสอบเอกสารหลักฐานที่ต้องใช้แนบก่อนเดินทางมาติดต่อ
              </p>
            </div>
            <span className="text-xs text-slate-400">
              ดาวน์โหลดฟรีไม่มีค่าใช้จ่าย
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.forms.map((form, idx) => (
              <div
                key={form.id || idx}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-xl px-3 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60">
                      {form.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {form.title}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-2">
                    <span>หน่วยงานรับผิดชอบ: <strong>{form.dept}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    เอกสารประกอบที่ต้องแนบ: {form.docs}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => alert(`ท่านสามารถขอรับแบบฟอร์ม "${form.title}" ได้ที่สำนักงาน ${orgName} หรือดาวน์โหลดผ่านระบบงานเอกสาร`)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border border-slate-200/60 dark:border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>ตัวอย่างแบบคำขอ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: ITA & Open Government Transparency */}
      {activeTab === 'ita' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ประกาศเจตจำนงสุจริตและความโปร่งใสในการบริหารงาน (No Gift Policy)
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {orgName} ยึดมั่นในการบริหารงานตามหลักธรรมาภิบาล มุ่งเน้นความโปร่งใส ปราศจากการทุจริตคอร์รัปชัน โดยประกาศนโยบาย <strong>"งดรับ งดให้ ของขวัญและของกำนัลทุกชนิดจากการปฏิบัติหน้าที่ (No Gift Policy)"</strong> เพื่อปลูกฝังค่านิยมความซื่อสัตย์สุจริต และสร้างความเชื่อมั่นแก่ประชาชนผู้รับบริการ
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <div className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                    ITA ประจำปี 2568: ผ่านเกณฑ์ระดับ AA
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    การประเมินคุณธรรมและความโปร่งใสในการดำเนินงานของหน่วยงานภาครัฐ (ITA) ประจำปี
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1">
                  <div className="font-bold text-xs text-blue-900 dark:text-blue-200">
                    ศูนย์ข้อมูลข่าวสารของราชการ
                  </div>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                    เปิดเผยข้อมูลตามมาตรา 9 แห่ง พ.ร.บ. ข้อมูลข่าวสารของราชการ พ.ศ. 2540
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>ช่องทางการร้องเรียนและการแจ้งเบาะแสการทุจริต</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ประชาชนสามารถแจ้งเรื่องร้องเรียน ร้องทุกข์ หรือแจ้งเบาะแสการทุจริตประพฤติมิชอบของเจ้าหน้าที่ ได้ผ่านช่องทางศูนย์ดำรงธรรม {orgName} โดยข้อมูลของผู้ร้องเรียนจะถูกเก็บรักษาเป็นความลับสูงสุดตามกฎหมาย
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>สายตรงศูนย์ดำรงธรรม: {data.contactInfo.phone}</span>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>อีเมลร้องทุกข์: {data.contactInfo.email}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Organization Contact Card */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>สถานที่ติดต่อราชการ</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">ที่อยู่สำนักงาน:</span>
                  <p className="leading-relaxed">{data.contactInfo.address}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">เวลาให้บริการ:</span>
                  <p className="leading-relaxed">{data.contactInfo.officeHours}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">เบอร์โทรศัพท์:</span>
                  <p className="font-mono">{data.contactInfo.phone}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">ไปรษณีย์อิเล็กทรอนิกส์ (Email):</span>
                  <p className="font-mono text-blue-600 dark:text-blue-400">{data.contactInfo.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN EDIT MODAL (เฉพาะผู้ดูแลระบบ ADMIN)
      ========================================================================= */}
      {showAdminEditModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center space-x-2.5">
                <Settings className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    แก้ไขข้อมูลภาพรวมและบริการประชาชน (เฉพาะสิทธิ์ผู้ดูแลระบบ ADMIN)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ปรับปรุงข้อความ คำขวัญ บริการ 5 กอง ปฏิทิน และแบบฟอร์ม เพื่อบันทึกลงระบบจริง
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 shrink-0 bg-slate-100/50 dark:bg-slate-900/50">
              <button
                onClick={() => setAdminModalTab('general')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminModalTab === 'general'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                }`}
              >
                1. ข้อมูลทั่วไป & คำขวัญ
              </button>
              <button
                onClick={() => setAdminModalTab('divisions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminModalTab === 'divisions'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                }`}
              >
                2. ข้อมูล 5 ส่วนราชการ
              </button>
              <button
                onClick={() => setAdminModalTab('timelines')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminModalTab === 'timelines'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                }`}
              >
                3. ปฏิทินรอบเวลาบริการ ({editForm.timelines?.length || 0})
              </button>
              <button
                onClick={() => setAdminModalTab('forms')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminModalTab === 'forms'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                }`}
              >
                4. คลังแบบฟอร์มคำขอ ({editForm.forms?.length || 0})
              </button>
              <button
                onClick={() => setAdminModalTab('contact')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminModalTab === 'contact'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                }`}
              >
                5. ที่อยู่ & การติดต่อ
              </button>
              <button
                onClick={() => setAdminModalTab('orbital')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminModalTab === 'orbital'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                }`}
              >
                🪐 6. ข้อมูลวงโคจร 3D (6 โหนด)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs custom-scrollbar">
              {/* Tab 1: General Info */}
              {adminModalTab === 'general' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>คำขวัญ / สโลแกน {orgName}</span>
                      </label>
                      <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                        <Cloud className="w-3 h-3" />
                        <span>ซิงค์ Cloud ทุกเครื่อง</span>
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editForm.slogan}
                      onChange={(e) => setEditForm({ ...editForm, slogan: e.target.value })}
                      placeholder="ระบุคำขวัญประจำตำบล"
                      className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-950 font-bold text-blue-950 dark:text-cyan-100"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      * แสดงผลบนป้ายคำขวัญด้านบนโมเดลวงโคจร 3 มิติ และเชื่อมโยงทุกอุปกรณ์ผ่าน Supabase Cloud
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      คำชี้แจง / ปรัชญาการให้บริการประชาชน
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.welcomeDesc}
                      onChange={(e) => setEditForm({ ...editForm, welcomeDesc: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                      ป้ายสถิติภาพรวม 4 รายการ (Quick Metrics):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editForm.metrics.map((m, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/50">
                          <input
                            type="text"
                            placeholder="ชื่อหัวข้อ"
                            value={m.label}
                            onChange={(e) => {
                              const updated = [...editForm.metrics];
                              updated[idx].label = e.target.value;
                              setEditForm({ ...editForm, metrics: updated });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="ข้อความค่าสถิติ"
                            value={m.value}
                            onChange={(e) => {
                              const updated = [...editForm.metrics];
                              updated[idx].value = e.target.value;
                              setEditForm({ ...editForm, metrics: updated });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-blue-600 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="คำอธิบายเพิ่มเติม"
                            value={m.note}
                            onChange={(e) => {
                              const updated = [...editForm.metrics];
                              updated[idx].note = e.target.value;
                              setEditForm({ ...editForm, metrics: updated });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 text-[11px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 5 Divisions Editing */}
              {adminModalTab === 'divisions' && (
                <div className="space-y-4">
                  {/* Select Division Picker */}
                  <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {editForm.divisions.map((div, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDivForEdit(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedDivForEdit === idx
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {div.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const currentDiv = editForm.divisions[selectedDivForEdit];
                    if (!currentDiv) return null;
                    return (
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                              ชื่อส่วนราชการ:
                            </label>
                            <input
                              type="text"
                              value={currentDiv.name}
                              onChange={(e) => {
                                const updated = [...editForm.divisions];
                                updated[selectedDivForEdit].name = e.target.value;
                                setEditForm({ ...editForm, divisions: updated });
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                              ผู้กำกับดูแล / หัวหน้าหน่วยงาน:
                            </label>
                            <input
                              type="text"
                              value={currentDiv.leader}
                              onChange={(e) => {
                                const updated = [...editForm.divisions];
                                updated[selectedDivForEdit].leader = e.target.value;
                                setEditForm({ ...editForm, divisions: updated });
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                              สถานที่ตั้งห้องทำงาน:
                            </label>
                            <input
                              type="text"
                              value={currentDiv.location}
                              onChange={(e) => {
                                const updated = [...editForm.divisions];
                                updated[selectedDivForEdit].location = e.target.value;
                                setEditForm({ ...editForm, divisions: updated });
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                              เวลาทำการ:
                            </label>
                            <input
                              type="text"
                              value={currentDiv.officeHours}
                              onChange={(e) => {
                                const updated = [...editForm.divisions];
                                updated[selectedDivForEdit].officeHours = e.target.value;
                                setEditForm({ ...editForm, divisions: updated });
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <label className="font-bold text-slate-700 dark:text-slate-300">
                              รายการภารกิจและงานบริการประชาชน ({currentDiv.services.length} รายการ):
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...editForm.divisions];
                                updated[selectedDivForEdit].services.push('บริการประชาชนรายการใหม่');
                                setEditForm({ ...editForm, divisions: updated });
                              }}
                              className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>เพิ่มรายการบริการ</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {currentDiv.services.map((srv, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={srv}
                                  onChange={(e) => {
                                    const updated = [...editForm.divisions];
                                    updated[selectedDivForEdit].services[sIdx] = e.target.value;
                                    setEditForm({ ...editForm, divisions: updated });
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...editForm.divisions];
                                    updated[selectedDivForEdit].services.splice(sIdx, 1);
                                    setEditForm({ ...editForm, divisions: updated });
                                  }}
                                  className="text-rose-500 hover:text-rose-700 p-1 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab 3: Timelines Editing */}
              {adminModalTab === 'timelines' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      รายการกำหนดการและรอบปฏิทินบริการประชาชน:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newT = {
                          id: `TIME-${Date.now().toString().slice(-4)}`,
                          title: 'บริการใหม่',
                          period: 'ตามกำหนดการ',
                          authority: 'สำนักปลัด',
                          desc: 'รายละเอียดการให้บริการ',
                          statusNote: 'เปิดให้บริการตามเวลาราชการ',
                          color: 'blue'
                        };
                        setEditForm({ ...editForm, timelines: [...editForm.timelines, newT] });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มรอบเวลาบริการ</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editForm.timelines.map((t, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="ชื่องานบริการ"
                            value={t.title}
                            onChange={(e) => {
                              const updated = [...editForm.timelines];
                              updated[idx].title = e.target.value;
                              setEditForm({ ...editForm, timelines: updated });
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
                          />
                          <input
                            type="text"
                            placeholder="หน่วยงานที่รับผิดชอบ"
                            value={t.authority}
                            onChange={(e) => {
                              const updated = [...editForm.timelines];
                              updated[idx].authority = e.target.value;
                              setEditForm({ ...editForm, timelines: updated });
                            }}
                            className="w-48 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 text-xs font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editForm.timelines];
                              updated.splice(idx, 1);
                              setEditForm({ ...editForm, timelines: updated });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="รอบเวลา / กรอบวัน"
                            value={t.period}
                            onChange={(e) => {
                              const updated = [...editForm.timelines];
                              updated[idx].period = e.target.value;
                              setEditForm({ ...editForm, timelines: updated });
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 font-bold"
                          />
                          <input
                            type="text"
                            placeholder="คำอธิบายรายละเอียด"
                            value={t.desc}
                            onChange={(e) => {
                              const updated = [...editForm.timelines];
                              updated[idx].desc = e.target.value;
                              setEditForm({ ...editForm, timelines: updated });
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Forms Editing */}
              {adminModalTab === 'forms' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      รายการแบบฟอร์มคำขอสำหรับประชาชน:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newF = {
                          id: `FORM-${Date.now().toString().slice(-4)}`,
                          code: 'แบบฟอร์มใหม่',
                          title: 'ชื่อคำขอรับบริการ',
                          dept: 'สำนักปลัด',
                          docs: 'สำเนาบัตรประชาชน, ทะเบียนบ้าน',
                          size: 'PDF / Word'
                        };
                        setEditForm({ ...editForm, forms: [...editForm.forms, newF] });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มแบบฟอร์ม</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editForm.forms.map((f, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="รหัสแบบฟอร์ม (เช่น แบบ ข.1)"
                            value={f.code}
                            onChange={(e) => {
                              const updated = [...editForm.forms];
                              updated[idx].code = e.target.value;
                              setEditForm({ ...editForm, forms: updated });
                            }}
                            className="w-36 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-blue-600"
                          />
                          <input
                            type="text"
                            placeholder="ชื่อแบบคำขอ"
                            value={f.title}
                            onChange={(e) => {
                              const updated = [...editForm.forms];
                              updated[idx].title = e.target.value;
                              setEditForm({ ...editForm, forms: updated });
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editForm.forms];
                              updated.splice(idx, 1);
                              setEditForm({ ...editForm, forms: updated });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="หน่วยงานรับผิดชอบ"
                            value={f.dept}
                            onChange={(e) => {
                              const updated = [...editForm.forms];
                              updated[idx].dept = e.target.value;
                              setEditForm({ ...editForm, forms: updated });
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600"
                          />
                          <input
                            type="text"
                            placeholder="เอกสารประกอบที่ต้องแนบ"
                            value={f.docs}
                            onChange={(e) => {
                              const updated = [...editForm.forms];
                              updated[idx].docs = e.target.value;
                              setEditForm({ ...editForm, forms: updated });
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Contact Info */}
              {adminModalTab === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        เบอร์โทรศัพท์ติดต่อ:
                      </label>
                      <input
                        type="text"
                        value={editForm.contactInfo.phone}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          contactInfo: { ...editForm.contactInfo, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        เบอร์โทรสาร (Fax):
                      </label>
                      <input
                        type="text"
                        value={editForm.contactInfo.fax}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          contactInfo: { ...editForm.contactInfo, fax: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        ไปรษณีย์อิเล็กทรอนิกส์ (Email):
                      </label>
                      <input
                        type="email"
                        value={editForm.contactInfo.email}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          contactInfo: { ...editForm.contactInfo, email: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        ที่อยู่สำนักงาน อบต.:
                      </label>
                      <input
                        type="text"
                        value={editForm.contactInfo.address}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          contactInfo: { ...editForm.contactInfo, address: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        วันและเวลาให้บริการประชาชน:
                      </label>
                      <input
                        type="text"
                        value={editForm.contactInfo.officeHours}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          contactInfo: { ...editForm.contactInfo, officeHours: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: 3D Orbital Nodes Editing */}
              {adminModalTab === 'orbital' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>คำขวัญ / สโลแกน {orgName} (แสดงที่ป้ายคำขวัญด้านบนวงโคจร)</span>
                      </label>
                      <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                        <Cloud className="w-3 h-3" />
                        <span>Cloud Sync</span>
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editForm.slogan || ''}
                      onChange={(e) => setEditForm({ ...editForm, slogan: e.target.value })}
                      placeholder="ระบุคำขวัญประจำตำบล"
                      className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 font-bold text-blue-950 dark:text-cyan-100"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      * ป้ายคำขวัญออกแบบใหม่สไตล์ป้ายเกียรติยศดิจิทัล (Civic Plaque) ขนาดตัวหนังสือตามมาตรฐานเดิม ซิงค์อัตโนมัติทุกอุปกรณ์
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                      เลือกโหนดในวงโคจร 3D ที่ต้องการแก้ไขข้อมูล:
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {(editForm.orbitalNodes || defaultOverviewData.orbitalNodes).map((node, idx) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedOrbitalNodeForEdit(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedOrbitalNodeForEdit === idx
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {node.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const currentNode = (editForm.orbitalNodes || defaultOverviewData.orbitalNodes)[selectedOrbitalNodeForEdit];
                    if (!currentNode) return null;

                    const updateCurrentNode = (field, val) => {
                      const updated = [...(editForm.orbitalNodes || defaultOverviewData.orbitalNodes)];
                      updated[selectedOrbitalNodeForEdit] = {
                        ...updated[selectedOrbitalNodeForEdit],
                        [field]: val
                      };
                      setEditForm({ ...editForm, orbitalNodes: updated });
                    };

                    return (
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            แก้ไขรายละเอียดโหนดที่ {selectedOrbitalNodeForEdit + 1}: {currentNode.title}
                          </span>
                          <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 font-bold">
                            ID: {currentNode.id}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                              ชื่อโหนดในวงโคจร (Node Title)
                            </label>
                            <input
                              type="text"
                              value={currentNode.title}
                              onChange={(e) => updateCurrentNode('title', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                              ตำแหน่ง / ผู้กำกับ / คำอธิบายสั้น (Subtitle)
                            </label>
                            <input
                              type="text"
                              value={currentNode.subtitle || ''}
                              onChange={(e) => updateCurrentNode('subtitle', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                              กรอบเวลา / ระยะเวลาให้บริการ (Date/Period)
                            </label>
                            <input
                              type="text"
                              value={currentNode.date || ''}
                              onChange={(e) => updateCurrentNode('date', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                              สถานะการให้บริการ (Status)
                            </label>
                            <select
                              value={currentNode.status}
                              onChange={(e) => updateCurrentNode('status', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium"
                            >
                              <option value="completed">พร้อมให้บริการเต็มรูปแบบ (Completed)</option>
                              <option value="in-progress">กำลังดำเนินงาน/บริการ (In Progress)</option>
                              <option value="pending">รอดำเนินการ (Pending)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                              โทนสี (Color)
                            </label>
                            <select
                              value={currentNode.color || 'blue'}
                              onChange={(e) => updateCurrentNode('color', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium"
                            >
                              <option value="blue">Blue (น้ำเงิน/ฟ้า)</option>
                              <option value="emerald">Emerald (เขียว)</option>
                              <option value="amber">Amber (ส้ม/ทอง)</option>
                              <option value="purple">Purple (ม่วง)</option>
                              <option value="rose">Rose (ชมพู/แดง)</option>
                              <option value="cyan">Cyan (ฟ้าสว่าง)</option>
                            </select>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-slate-600 dark:text-slate-400 font-semibold">
                                ศักยภาพและความพร้อมการให้บริการ (Energy %)
                              </label>
                              <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">
                                {currentNode.energy}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={currentNode.energy || 100}
                              onChange={(e) => updateCurrentNode('energy', parseInt(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            รายละเอียดภารกิจและบริการ (แสดงในกล่องป๊อปอัป 3D เมื่อคลิก)
                          </label>
                          <textarea
                            rows={3}
                            value={currentNode.content || ''}
                            onChange={(e) => updateCurrentNode('content', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 leading-relaxed font-normal"
                            placeholder="ระบุภารกิจหรือบริการสำคัญ เช่น ม.1 บ้านฝาง • ม.2 บ้านเทิง..."
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSavingCloud}
                  onClick={handleResetToDefault}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>คืนค่าเริ่มต้น</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-cyan-300 font-semibold bg-blue-50/80 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-900/60">
                  <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>Cloud Realtime Sync (ซิงค์อัตโนมัติทุกเครื่อง)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={isSavingCloud}
                  onClick={() => setShowAdminEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isSavingCloud}
                  onClick={handleSaveAdminData}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
                >
                  {isSavingCloud ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังซิงค์ Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>บันทึกข้อมูลและซิงค์ Cloud</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
