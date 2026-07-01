"use client";

import * as React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { TargetAchievement } from "@/types/student";

interface AchievementCalendarProps {
  /** Any date within the month to display */
  monthDate: Date;
  /** Daily achievements (from the achievement-history endpoint) */
  achievements: TargetAchievement[];
  /** Called with a date in the previous/next month when navigating */
  onMonthChange?: (date: Date) => void;
  loading?: boolean;
  className?: string;
}

const WEEKDAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const pad = (n: number) => String(n).padStart(2, "0");

type DayState = "met" | "partial" | "none";

function dayState(a: TargetAchievement | undefined): DayState {
  if (!a) return "none";
  if (a.isTargetMet) return "met";
  const activity =
    a.memorizationLinesAchieved + a.revisionPagesAchieved + a.consolidationPagesAchieved;
  return activity > 0 ? "partial" : "none";
}

const dotClass: Record<DayState, string> = {
  met: "bg-emerald-500",
  partial: "bg-amber-400",
  none: "bg-muted-foreground/20",
};

/**
 * Month heat-map of daily achievements. A dot per day: green = target met,
 * amber = some activity, gray = none. Shared between the teacher student-detail
 * view and the student's own حفظي page.
 */
export function AchievementCalendar({
  monthDate,
  achievements,
  onMonthChange,
  loading,
  className,
}: AchievementCalendarProps) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth(); // 0-11

  const byDate = React.useMemo(() => {
    const map = new Map<string, TargetAchievement>();
    for (const a of achievements) {
      map.set(a.date.slice(0, 10), a);
    }
    return map;
  }, [achievements]);

  // Build the grid: leading blanks to align the 1st on its weekday (Sun=0), then days.
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goPrev = () => onMonthChange?.(new Date(year, month - 1, 1));
  const goNext = () => onMonthChange?.(new Date(year, month + 1, 1));

  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        {onMonthChange ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="الشهر التالي"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : <span />}
        <span className="text-sm font-semibold">
          {MONTHS[month]} {year}
        </span>
        {onMonthChange ? (
          <button
            type="button"
            onClick={goPrev}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="الشهر السابق"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : <span />}
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          {/* Weekday row */}
          <div className="mb-1 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-[10px] text-muted-foreground">{d}</span>
            ))}
          </div>
          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={`blank-${i}`} />;
              const key = `${year}-${pad(month + 1)}-${pad(day)}`;
              const a = byDate.get(key);
              const state = dayState(a);
              const title = a
                ? `${key} — حفظ ${a.memorizationLinesAchieved}/${a.memorizationLinesTarget} · مراجعة ${a.revisionPagesAchieved}/${a.revisionPagesTarget} · تثبيت ${a.consolidationPagesAchieved}/${a.consolidationPagesTarget}`
                : key;
              return (
                <div
                  key={key}
                  title={title}
                  className="flex aspect-square flex-col items-center justify-center rounded-md border border-transparent hover:border-border"
                >
                  <span className="text-[10px] leading-none text-muted-foreground">{day}</span>
                  <span className={cn("mt-1 h-2 w-2 rounded-full", dotClass[state])} />
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> تحقق الهدف</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> نشاط جزئي</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/20" /> لا نشاط</span>
          </div>
        </>
      )}
    </div>
  );
}
