// โครงสร้างองค์กรและจักรวาลหน่วยรับตรวจของ อปท. (Auditable Universe & Org Structure Model)
// ออกแบบตามโครงสร้างการแบ่งส่วนราชการตามกรอบอัตรากำลังของ อปท. (สถ.)
// สามารถปรับแต่ง เพิ่ม/ลด/แก้ไขกอง ฝ่าย และหน่วยงานในสังกัดได้อิสระสำหรับทุก อปท. ทั่วประเทศ

export const DEFAULT_ORG_STRUCTURE = {
  approver: {
    title: 'นายกองค์กรปกครองส่วนท้องถิ่น',
    name: 'ผู้บริหาร อปท.',
    role: 'ฝ่ายบริหาร / ผู้บริหารสูงสุด'
  },
  palat: {
    title: 'ปลัดองค์กรปกครองส่วนท้องถิ่น',
    name: 'ปลัด อปท.',
    role: 'หัวหน้าพนักงานส่วนท้องถิ่น / ปลัด อปท.'
  },
  deputyPalats: [
    {
      id: 'deputy-1',
      title: 'รองปลัดองค์กรปกครองส่วนท้องถิ่น',
      name: '',
      role: 'รองปลัด อปท. (นักบริหารงานท้องถิ่น)'
    }
  ],
  auditor: {
    title: 'นักวิชาการตรวจสอบภายใน',
    name: 'ผู้ตรวจสอบภายใน',
    role: 'หน่วยตรวจสอบภายใน (รายงานตรงต่อนายก/ปลัด)'
  },
  departments: [
    {
      id: 'dept-office',
      name: 'สำนักปลัด',
      headTitle: 'หัวหน้าสำนักปลัด',
      headName: '',
      color: 'sky',
      divisions: [
        {
          id: 'div-off-1',
          name: 'ฝ่ายอำนวยการ',
          headTitle: 'หัวหน้าฝ่ายอำนวยการ',
          headName: '',
          jobs: ['งานสารบรรณทั่วไป', 'งานนโยบายและแผน', 'งานการเจ้าหน้าที่', 'งานประชาสัมพันธ์']
        },
        {
          id: 'div-off-2',
          name: 'ฝ่ายปกครอง',
          headTitle: 'หัวหน้าฝ่ายปกครอง',
          headName: '',
          jobs: ['งานป้องกันและบรรเทาสาธารณภัย', 'งานกฎหมายและคดี', 'งานรักษาความสงบเรียบร้อย']
        }
      ],
      affiliatedUnits: []
    },
    {
      id: 'dept-finance',
      name: 'กองคลัง',
      headTitle: 'ผู้อำนวยการกองคลัง',
      headName: '',
      color: 'purple',
      divisions: [
        {
          id: 'div-fin-1',
          name: 'ฝ่ายบริหารงานคลัง',
          headTitle: 'หัวหน้าฝ่ายบริหารงานคลัง',
          headName: '',
          jobs: ['งานการเงินและบัญชี (e-LAAS)', 'งานระเบียบการเงินการคลัง']
        },
        {
          id: 'div-fin-2',
          name: 'ฝ่ายพัฒนารายได้',
          headTitle: 'หัวหน้าฝ่ายพัฒนารายได้',
          headName: '',
          jobs: ['งานจัดเก็บภาษีและค่าธรรมเนียม', 'งานแผนที่ภาษีและทะเบียนทรัพย์สิน']
        },
        {
          id: 'div-fin-3',
          name: 'ฝ่ายพัสดุและทรัพย์สิน',
          headTitle: 'หัวหน้าฝ่ายพัสดุและทรัพย์สิน',
          headName: '',
          jobs: ['งานจัดซื้อจัดจ้าง (e-GP)', 'งานทะเบียนและคุมพัสดุ']
        }
      ],
      affiliatedUnits: []
    },
    {
      id: 'dept-tech',
      name: 'กองช่าง',
      headTitle: 'ผู้อำนวยการกองช่าง',
      headName: '',
      color: 'amber',
      divisions: [
        {
          id: 'div-tech-1',
          name: 'ฝ่ายแบบแผนและก่อสร้าง',
          headTitle: 'หัวหน้าฝ่ายแบบแผนและก่อสร้าง',
          headName: '',
          jobs: ['งานสำรวจออกแบบและคำนวณราคา', 'งานควบคุมอาคาร (พ.ร.บ.อาคาร)', 'งานประมาณราคากลาง Factor F']
        },
        {
          id: 'div-tech-2',
          name: 'ฝ่ายสาธารณูปโภค',
          headTitle: 'หัวหน้าฝ่ายสาธารณูปโภค',
          headName: '',
          jobs: ['งานไฟฟ้าสาธารณะ', 'งานซ่อมบำรุงทางและสะพาน', 'งานเครื่องจักรกล']
        }
      ],
      affiliatedUnits: []
    },
    {
      id: 'dept-education',
      name: 'กองการศึกษา',
      headTitle: 'ผู้อำนวยการกองการศึกษา',
      headName: '',
      color: 'yellow',
      divisions: [
        {
          id: 'div-edu-1',
          name: 'ฝ่ายบริหารการศึกษา',
          headTitle: 'หัวหน้าฝ่ายบริหารการศึกษา',
          headName: '',
          jobs: ['งานแผนการศึกษา', 'งานศาสนาและวัฒนธรรม', 'งานกิจกรรมเด็กและเยาวชน']
        }
      ],
      affiliatedUnits: [
        { id: 'aff-edu-1', name: 'ศูนย์พัฒนาเด็กเล็ก (ศพด.)', type: 'ศพด.' }
      ]
    },
    {
      id: 'dept-welfare',
      name: 'กองสวัสดิการสังคม',
      headTitle: 'ผู้อำนวยการกองสวัสดิการสังคม',
      headName: '',
      color: 'emerald',
      divisions: [
        {
          id: 'div-wel-1',
          name: 'ฝ่ายสังคมสงเคราะห์',
          headTitle: 'หัวหน้าฝ่ายสังคมสงเคราะห์',
          headName: '',
          jobs: ['งานเบี้ยยังชีพผู้สูงอายุ/คนพิการ', 'งานสงเคราะห์ผู้ด้อยโอกาส', 'งานสวัสดิการเด็กและสตรี']
        },
        {
          id: 'div-wel-2',
          name: 'ฝ่ายพัฒนาชุมชน',
          headTitle: 'หัวหน้าฝ่ายพัฒนาชุมชน',
          headName: '',
          jobs: ['งานส่งเสริมอาชีพและกลุ่ม', 'งานสำรวจจัดตั้งกลุ่ม', 'งานกองทุนและสวัสดิการชุมชน']
        }
      ],
      affiliatedUnits: []
    }
  ]
};

// =========================================================================
// เทมเพลตมาตรฐานสำหรับ อปท. แต่ละขนาด (Standard Model Templates)
// =========================================================================
export const ORG_STRUCTURE_TEMPLATES = {
  tao_small: {
    id: 'tao_small',
    title: 'อบต. ขนาดเล็ก (3 กองหลัก)',
    desc: 'สำนักปลัด, กองคลัง, กองช่าง (ไม่มีกรอบรองปลัด เหมาะกับ อบต. ขนาดเล็ก)',
    deputyPalats: [],
    departments: [
      DEFAULT_ORG_STRUCTURE.departments[0], // สำนักปลัด
      DEFAULT_ORG_STRUCTURE.departments[1], // กองคลัง
      DEFAULT_ORG_STRUCTURE.departments[2]  // กองช่าง
    ]
  },
  tao_standard: {
    id: 'tao_standard',
    title: 'อบต. ขนาดกลาง / มาตรฐาน (5 กอง + รองปลัด)',
    desc: 'สำนักปลัด, กองคลัง, กองช่าง, กองการศึกษา (มี ศพด.), กองสวัสดิการสังคม และรองปลัด อบต.',
    deputyPalats: [
      {
        id: 'deputy-1',
        title: 'รองปลัด อบต.',
        name: '',
        role: 'รองปลัด อบต. (นักบริหารงานท้องถิ่น ระดับต้น/กลาง)'
      }
    ],
    departments: [...DEFAULT_ORG_STRUCTURE.departments]
  },
  thessaban: {
    id: 'thessaban',
    title: 'เทศบาลตำบล / เทศบาลเมือง (7 กอง + รองปลัดเทศบาล + หัวหน้าฝ่าย)',
    desc: 'โครงสร้างเทศบาลมาตรฐาน มีรองปลัดเทศบาล, กองสาธารณสุขและสิ่งแวดล้อม, กองยุทธศาสตร์และงบประมาณ และมีหัวหน้าฝ่ายกำกับดูแลทุกฝ่าย',
    deputyPalats: [
      {
        id: 'deputy-1',
        title: 'รองปลัดเทศบาล',
        name: '',
        role: 'รองปลัดเทศบาล (นักบริหารงานเทศบาล)'
      }
    ],
    departments: [
      ...DEFAULT_ORG_STRUCTURE.departments,
      {
        id: 'dept-health',
        name: 'กองสาธารณสุขและสิ่งแวดล้อม',
        headTitle: 'ผู้อำนวยการกองสาธารณสุขฯ',
        headName: '',
        color: 'teal',
        divisions: [
          {
            id: 'div-hea-1',
            name: 'ฝ่ายบริการสาธารณสุข',
            headTitle: 'หัวหน้าฝ่ายบริการสาธารณสุข',
            headName: '',
            jobs: ['งานรักษาความสะอาดและขยะ', 'งานควบคุมโรคและสุขาภิบาล', 'งานคุ้มครองผู้บริโภค']
          }
        ],
        affiliatedUnits: [
          { id: 'aff-hea-1', name: 'รพ.สต. ถ่ายโอน', type: 'รพ.สต.' }
        ]
      },
      {
        id: 'dept-strategy',
        name: 'กองยุทธศาสตร์และงบประมาณ',
        headTitle: 'ผู้อำนวยการกองยุทธศาสตร์ฯ',
        headName: '',
        color: 'indigo',
        divisions: [
          {
            id: 'div-str-1',
            name: 'ฝ่ายแผนงานและงบประมาณ',
            headTitle: 'หัวหน้าฝ่ายแผนงานและงบประมาณ',
            headName: '',
            jobs: ['งานวิเคราะห์นโยบายและแผน', 'งานจัดทำงบประมาณรายจ่าย', 'งานติดตามและประเมินผล']
          }
        ],
        affiliatedUnits: []
      }
    ]
  },
  pao_city: {
    id: 'pao_city',
    title: 'เทศบาลนคร / อบจ. (8+ ส่วนราชการ + รองปลัด 2 ท่าน + หัวหน้าฝ่าย)',
    desc: 'โครงสร้างเต็มรูปแบบ มีรองปลัด 2 ท่าน (สายงานบริหารทั่วไป & สายงานพัฒนา/บริการ), กองการเจ้าหน้าที่, กองการประปา และหัวหน้าฝ่ายครบทุกฝ่าย',
    deputyPalats: [
      {
        id: 'deputy-1',
        title: 'รองปลัด อบจ. / เทศบาล (คนที่ 1)',
        name: '',
        role: 'กำกับดูแลสายงานบริหารทั่วไป และการคลัง'
      },
      {
        id: 'deputy-2',
        title: 'รองปลัด อบจ. / เทศบาล (คนที่ 2)',
        name: '',
        role: 'กำกับดูแลสายงานพัฒนา ช่าง และบริการสาธารณะ'
      }
    ],
    departments: [
      ...DEFAULT_ORG_STRUCTURE.departments,
      {
        id: 'dept-health',
        name: 'กองสาธารณสุขและสิ่งแวดล้อม',
        headTitle: 'ผู้อำนวยการกองสาธารณสุขฯ',
        headName: '',
        color: 'teal',
        divisions: [
          {
            id: 'div-hea-1',
            name: 'ฝ่ายบริการสาธารณสุข',
            headTitle: 'หัวหน้าฝ่ายบริการสาธารณสุข',
            headName: '',
            jobs: ['งานรักษาความสะอาดและขยะ', 'งานควบคุมโรคและสุขาภิบาล']
          }
        ],
        affiliatedUnits: [
          { id: 'aff-hea-1', name: 'รพ.สต. ถ่ายโอน', type: 'รพ.สต.' }
        ]
      },
      {
        id: 'dept-hr',
        name: 'กองการเจ้าหน้าที่',
        headTitle: 'ผู้อำนวยการกองการเจ้าหน้าที่',
        headName: '',
        color: 'rose',
        divisions: [
          {
            id: 'div-hr-1',
            name: 'ฝ่ายสรรหาและบรรจุแต่งตั้ง',
            headTitle: 'หัวหน้าฝ่ายสรรหาและบรรจุแต่งตั้ง',
            headName: '',
            jobs: ['งานวางแผนอัตรากำลัง', 'งานบรรจุแต่งตั้งและโอนย้าย', 'งานประเมินผลงานและวินัย']
          }
        ],
        affiliatedUnits: []
      },
      {
        id: 'dept-water',
        name: 'กองการประปา',
        headTitle: 'ผู้อำนวยการกองการประปา',
        headName: '',
        color: 'cyan',
        divisions: [
          {
            id: 'div-wat-1',
            name: 'ฝ่ายผลิตและจำหน่ายน้ำ',
            headTitle: 'หัวหน้าฝ่ายผลิตและจำหน่ายน้ำ',
            headName: '',
            jobs: ['งานระบบประปา', 'งานจัดเก็บค่าน้ำประปา', 'งานบำรุงรักษาท่อส่งน้ำ']
          }
        ],
        affiliatedUnits: []
      }
    ]
  }
};

const STORAGE_KEY_PREFIX = 'ia_org_structure';

export function getTenantOrgStructure(userOrSession, orgProfile = {}) {
  try {
    const username = typeof userOrSession === 'string'
      ? userOrSession
      : userOrSession?.username || 'admin';
    const storageKey = `${STORAGE_KEY_PREFIX}_tenant_${username.toLowerCase()}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.departments) && parsed.departments.length > 0) {
        return {
          ...parsed,
          deputyPalats: Array.isArray(parsed.deputyPalats)
            ? parsed.deputyPalats
            : (parsed.deputyPalat ? [parsed.deputyPalat] : []),
          approver: {
            ...parsed.approver,
            name: orgProfile.approverName || parsed.approver?.name || 'ผู้บริหาร อปท.',
            title: orgProfile.approverPosition || parsed.approver?.title || `นายก${orgProfile.name || 'อปท.'}`
          },
          palat: {
            ...parsed.palat,
            name: orgProfile.palatName || parsed.palat?.name || 'ปลัด อปท.',
            title: orgProfile.palatPosition || parsed.palat?.title || `ปลัด${orgProfile.name || 'อปท.'}`
          },
          auditor: {
            ...parsed.auditor,
            name: orgProfile.auditorName || parsed.auditor?.name || 'ผู้ตรวจสอบภายใน',
            title: orgProfile.auditorPosition || parsed.auditor?.title || 'นักวิชาการตรวจสอบภายใน'
          },
          departments: (parsed.departments || []).map((dept) => ({
            ...dept,
            divisions: (dept.divisions || []).map((div) => ({
              ...div,
              headTitle: div.headTitle || (div.name ? `หัวหน้า${div.name}` : 'หัวหน้าฝ่าย'),
              headName: div.headName || ''
            }))
          }))
        };
      }
    }
  } catch (e) {
    console.warn('Could not read tenant org structure:', e);
  }

  // Fallback default populated with active orgProfile
  return {
    ...DEFAULT_ORG_STRUCTURE,
    deputyPalats: DEFAULT_ORG_STRUCTURE.deputyPalats || [],
    approver: {
      ...DEFAULT_ORG_STRUCTURE.approver,
      name: orgProfile.approverName || 'ผู้บริหาร อปท.',
      title: orgProfile.approverPosition || `นายก${orgProfile.name || 'อปท.'}`
    },
    palat: {
      ...DEFAULT_ORG_STRUCTURE.palat,
      name: orgProfile.palatName || 'ปลัด อปท.',
      title: orgProfile.palatPosition || `ปลัด${orgProfile.name || 'อปท.'}`
    },
    auditor: {
      ...DEFAULT_ORG_STRUCTURE.auditor,
      name: orgProfile.auditorName || 'ผู้ตรวจสอบภายใน',
      title: orgProfile.auditorPosition || 'นักวิชาการตรวจสอบภายใน'
    }
  };
}

export function saveTenantOrgStructure(structure, userOrSession) {
  try {
    const username = typeof userOrSession === 'string'
      ? userOrSession
      : userOrSession?.username || 'admin';
    const storageKey = `${STORAGE_KEY_PREFIX}_tenant_${username.toLowerCase()}`;
    localStorage.setItem(storageKey, JSON.stringify(structure));

    // Also sync the department list to ia_departments for systemic linkage across the app
    const deptNames = ['หน่วยตรวจสอบภายใน'];
    if (Array.isArray(structure.departments)) {
      structure.departments.forEach((d) => {
        if (d.name && !deptNames.includes(d.name)) deptNames.push(d.name);
        // Include subordinate units if present
        if (Array.isArray(d.affiliatedUnits)) {
          d.affiliatedUnits.forEach((aff) => {
            if (aff.name && !deptNames.includes(aff.name)) deptNames.push(aff.name);
          });
        }
      });
    }
    const deptKey = `ia_departments_tenant_${username.toLowerCase()}`;
    localStorage.setItem(deptKey, JSON.stringify(deptNames));
    localStorage.setItem('ia_departments', JSON.stringify(deptNames));

    window.dispatchEvent(new CustomEvent('ia-departments-updated', { detail: deptNames }));
    window.dispatchEvent(new CustomEvent('ia-departments-changed', { detail: deptNames }));
    window.dispatchEvent(new CustomEvent('ia-org-structure-changed', { detail: structure }));
  } catch (e) {
    console.warn('Could not save tenant org structure:', e);
  }
}
