"use client";

import { Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementData {
  achieved: number;
  target: number;
}

interface AchievementBarProps {
  memorization: AchievementData;
  revision: AchievementData;
  consolidation: AchievementData;
  variant?: "full" | "compact";
  className?: string;
}

function getPercentage(achieved: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((achieved / target) * 100), 100);
}

function getProgressColor(percentage: number): {
  bar: string;
  bg: string;
  text: string;
} {
  if (percentage >= 100)
    return {
      bar: "bg-emerald-500",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  if (percentage >= 80)
    return {
      bar: "bg-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-400",
    };
  if (percentage >= 50)
    return {
      bar: "bg-amber-500",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
    };
  if (percentage > 0)
    return {
      bar: "bg-red-500",
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
    };
  return {
    bar: "bg-gray-300 dark:bg-gray-600",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500 dark:text-gray-400",
  };
}

const metricConfig = {
  memorization: { label: "حفظ", unit: "سطر", accent: "emerald" },
  revision: { label: "مراجعة", unit: "صفحة", accent: "blue" },
  consolidation: { label: "تثبيت", unit: "صفحة", accent: "violet" },
} as const;

function ProgressMetric({
  label,
  achieved,
  target,
  unit,
  variant,
}: {
  label: string;
  achieved: number;
  target: number;
  unit: string;
  variant: "full" | "compact";
}) {
  const percentage = getPercentage(achieved, target);
  const colors = getProgressColor(percentage);
  const isComplete = percentage >= 100;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
        <div className="flex-1 min-w-[48px] h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", colors.bar)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={cn(
          "text-[11px] font-medium whitespace-nowrap tabular-nums",
          isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
        )}>
          {Math.round(achieved)}/{Math.round(target)}
        </span>
        {isComplete && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-2 h-2 rounded-full shrink-0", colors.bar)} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn("text-sm font-semibold tabular-nums", colors.text)}>
            {Math.round(achieved)}/{Math.round(target)}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
          {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colors.bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-0.5 text-left">
        <span className={cn("text-[11px] font-medium tabular-nums", colors.text)}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export function AchievementBar({
  memorization,
  revision,
  consolidation,
  variant = "full",
  className,
}: AchievementBarProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {(
          [
            ["memorization", memorization],
            ["revision", revision],
            ["consolidation", consolidation],
          ] as const
        ).map(([key, data]) => (
          <ProgressMetric
            key={key}
            label={metricConfig[key].label}
            achieved={data.achieved}
            target={data.target}
            unit={metricConfig[key].unit}
            variant="compact"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 bg-gradient-to-l from-muted/50 to-muted/20 rounded-xl border border-muted",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold">إنجاز اليوم</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <ProgressMetric
          label="حفظ"
          achieved={memorization.achieved}
          target={memorization.target}
          unit="سطر"
          variant="full"
        />
        <ProgressMetric
          label="مراجعة"
          achieved={revision.achieved}
          target={revision.target}
          unit="صفحة"
          variant="full"
        />
        <ProgressMetric
          label="تثبيت"
          achieved={consolidation.achieved}
          target={consolidation.target}
          unit="صفحة"
          variant="full"
        />
      </div>
    </div>
  );
}
