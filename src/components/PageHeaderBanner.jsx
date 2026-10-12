import React from 'react';
import { Building, Award, Calendar } from 'lucide-react';

/**
 * PageHeaderBanner - คอมโพเนนต์กรอบหัวเรื่องมาตรฐานกลางประจำทุกเมนู
 * 
 * กฎเหล็กประจำระบบ:
 * 1. ภายในกรอบหัวเรื่องมีเฉพาะ Tag Pills และ Title (h1) เท่านั้น
 * 2. ห้ามใส่ปุ่มคำสั่ง (Button), โมดอล หรือปุ่มดาวน์โหลดไว้ในกรอบนี้ 100%
 * 3. ปุ่มปฏิบัติการทั้งหมดต้องจัดวางไว้ใน Toolbar / Controls Strip ใต้กรอบนี้
 */
export default function PageHeaderBanner({
  title,
  orgName = 'องค์กรปกครองส่วนท้องถิ่น',
  auditorName,
  year = '2569',
  badges = [],
  className = ''
}) {
  return (
    <div
      className={`bg-gradient-to-r from-amber-500/10 via-stone-100/70 to-amber-500/5 dark:from-stone-900/60 dark:via-stone-900/40 dark:to-stone-900/60 rounded-3xl p-6 sm:p-7 border border-amber-500/20 dark:border-stone-800 shadow-xs relative overflow-hidden backdrop-blur-xs no-print ${className}`}
    >
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Org Pill */}
          {orgName && (
            <span className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-full px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Building className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{orgName}</span>
            </span>
          )}

          {/* 2. Auditor / Standard / Reference Pill */}
          {auditorName && (
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{auditorName}</span>
            </span>
          )}

          {/* 3. Year Pill */}
          {year && (
            <span className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>ปีงบประมาณ พ.ศ. {year}</span>
            </span>
          )}

          {/* Extra badges */}
          {badges.map((badge, idx) => {
            if (React.isValidElement(badge)) {
              return <React.Fragment key={idx}>{badge}</React.Fragment>;
            }
            if (typeof badge === 'string') {
              return (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  <span>{badge}</span>
                </span>
              );
            }
            const Icon = badge.icon;
            return (
              <span
                key={idx}
                className={`inline-flex items-center space-x-1 border rounded-full px-3 py-1 text-xs font-medium ${
                  badge.className ||
                  'bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-stone-500" />}
                <span>{badge.label || badge.text}</span>
              </span>
            );
          })}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
          {title}
        </h1>
      </div>
    </div>
  );
}
