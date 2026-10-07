"use client";
import React from 'react';
import { Calendar, Code, FileText, User, Clock, Building2, BadgeDollarSign, HardHat, GraduationCap, HeartHandshake } from "lucide-react";
import RadialOrbitalTimeline, { type TimelineItem } from "@/components/ui/radial-orbital-timeline";
import ResponsiveHeroBanner from './responsive-hero-banner';

export interface HeroDemoProps {
  session?: any;
  onLogin?: () => void;
  onExplore?: () => void;
  onSelectDepartment?: (dept: string) => void;
}

export const HeroDemo: React.FC<HeroDemoProps> = ({
  session,
  onLogin,
  onExplore,
  onSelectDepartment
}) => {
  return (
    <ResponsiveHeroBanner
      badgeLabel="IA-OS 2569"
      badgeText="ระบบปฏิบัติการตรวจสอบภายใน อปท. ยุคดิจิทัล"
      title="ระบบงานตรวจสอบภายใน"
      titleLine2="องค์การบริหารส่วนตำบลฝางคำ"
      description="ยกระดับการปฏิบัติงานตรวจสอบภายในสู่มาตรฐานสากล เชื่อมโยง 5 ส่วนราชการหลัก ประเมินความเสี่ยง SOFCK จัดทำแนวการตรวจตามหนังสือสั่งการ ว 614 และรายงานการควบคุมภายใน ปอ.1 - ปค.5 อย่างครบวงจร"
      primaryButtonText="เข้าสู่ระบบงาน (Sign In)"
      secondaryButtonText="สำรวจฟังก์ชันระบบ"
      ctaButtonText="เข้าสู่ระบบ"
      onPrimaryClick={onLogin}
      onSecondaryClick={onExplore}
      onCtaClick={onLogin}
      session={session}
      partners={[
        { name: "สำนักปลัด", label: "งานบริหารทั่วไป นโยบาย และสาธารณสุข", onClick: () => onSelectDepartment?.("สำนักปลัด") },
        { name: "กองคลัง", label: "งานการเงิน พัสดุ และบัญชี", onClick: () => onSelectDepartment?.("กองคลัง") },
        { name: "กองช่าง", label: "งานโยธาและโครงการก่อสร้าง", onClick: () => onSelectDepartment?.("กองช่าง") },
        { name: "กองการศึกษา", label: "ศูนย์พัฒนาเด็กเล็กและการศึกษา", onClick: () => onSelectDepartment?.("กองการศึกษา") },
        { name: "กองสวัสดิการสังคม", label: "เบี้ยยังชีพและการพัฒนาชุมชน", onClick: () => onSelectDepartment?.("กองสวัสดิการสังคม") }
      ]}
    />
  );
};

export const defaultTimelineData: TimelineItem[] = [
  {
    id: 1,
    title: "สำนักปลัด",
    date: "ตลอดปีงบประมาณ",
    content: "งานสารบรรณ นิติการ ป้องกันและบรรเทาสาธารณภัย สุขาภิบาลและสิ่งแวดล้อม",
    category: "บริหารทั่วไป",
    icon: Building2,
    relatedIds: [2, 3],
    status: "completed",
    energy: 95,
  },
  {
    id: 2,
    title: "กองคลัง",
    date: "ม.ค. - มิ.ย. 2569",
    content: "จัดเก็บภาษีที่ดินและสิ่งปลูกสร้าง จัดซื้อจัดจ้าง e-GP บัญชีและการเงิน",
    category: "การเงินและพัสดุ",
    icon: BadgeDollarSign,
    relatedIds: [1, 3],
    status: "in-progress",
    energy: 90,
  },
  {
    id: 3,
    title: "กองช่าง",
    date: "พิจารณาใน 45 วัน",
    content: "การขออนุญาตก่อสร้างอาคาร (ข.1/อ.1) ซ่อมบำรุงโครงสร้างพื้นฐานและไฟฟ้าสาธารณะ",
    category: "โยธาและผังเมือง",
    icon: HardHat,
    relatedIds: [1, 4],
    status: "in-progress",
    energy: 85,
  },
  {
    id: 4,
    title: "กองการศึกษา",
    date: "เปิดภาคเรียน 1-2",
    content: "บริหารศูนย์พัฒนาเด็กเล็ก 2 แห่ง อาหารกลางวันนักเรียน และเงินอุดหนุนการศึกษา",
    category: "การศึกษาและเด็ก",
    icon: GraduationCap,
    relatedIds: [3, 5],
    status: "completed",
    energy: 100,
  },
  {
    id: 5,
    title: "กองสวัสดิการสังคม",
    date: "ทุกวันที่ 10 ของเดือน",
    content: "เบี้ยยังชีพผู้สูงอายุ คนพิการ ผู้ป่วยเอดส์ และการสงเคราะห์ครอบครัวยากไร้",
    category: "สวัสดิการชุมชน",
    icon: HeartHandshake,
    relatedIds: [1, 4],
    status: "completed",
    energy: 98,
  },
];

export function RadialOrbitalTimelineDemo({ data }: { data?: TimelineItem[] }) {
  return (
    <div className="w-full flex justify-center items-center">
      <RadialOrbitalTimeline timelineData={data || defaultTimelineData} />
    </div>
  );
}

export const SplineSceneBasic = HeroDemo;
export { ResponsiveHeroBanner } from './responsive-hero-banner';
export default {
  RadialOrbitalTimelineDemo,
  HeroDemo,
};
