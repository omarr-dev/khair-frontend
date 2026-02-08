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

// Helper to calculate percentage
function getPercentage(achieved: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((achieved / target) * 100), 100);
}

// Get color based on percentage
function getProgressColor(percentage: number): string {
  if (percentage >= 100) return "bg-emerald-500";
  if (percentage >= 80) return "bg-blue-500";
  if (percentage >= 50) return "bg-amber-500";
  if (percentage > 0) return "bg-red-500";
  return "bg-gray-300";
}

// Single metric display
function AchievementMetric({
  label,
  achieved,
  target,
  unit,
  color,
  variant,
}: {
  label: string;
  achieved: number;
  target: number;
  unit: string;
  color: string;
  variant: "full" | "compact";
}) {
  const percentage = getPercentage(achieved, target);
  const colorClass = getProgressColor(percentage);
  const isComplete = percentage >= 100;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5">
        <div className={cn("w-2 h-2 rounded-full shrink-0", colorClass)} />
        <span className="text-xs text-muted-foreground">{label}:</span>
        <span className={cn(
          "text-xs font-medium",
          isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
        )}>
          {achieved}/{target} {unit}
        </span>
        {isComplete && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-2 h-2 rounded-full shrink-0", color)} />
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className={cn(
        "text-sm font-medium",
        isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
      )}>
        {achieved}/{target} {unit}
      </span>
      {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
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
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <AchievementMetric
          label="حفظ"
          achieved={memorization.achieved}
          target={memorization.target}
          unit="سطر"
          color="bg-emerald-500"
          variant="compact"
        />
        <AchievementMetric
          label="مراجعة"
          achieved={revision.achieved}
          target={revision.target}
          unit="صفحة"
          color="bg-blue-500"
          variant="compact"
        />
        <AchievementMetric
          label="تثبيت"
          achieved={consolidation.achieved}
          target={consolidation.target}
          unit="صفحة"
          color="bg-violet-500"
          variant="compact"
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-4 p-3 bg-muted/30 rounded-lg border border-muted",
      className
    )}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground shrink-0">
        <Target className="h-4 w-4" />
        <span>إنجاز اليوم:</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <AchievementMetric
          label="حفظ"
          achieved={memorization.achieved}
          target={memorization.target}
          unit="سطر"
          color="bg-emerald-500"
          variant="full"
        />
        <AchievementMetric
          label="مراجعة"
          achieved={revision.achieved}
          target={revision.target}
          unit="صفحة"
          color="bg-blue-500"
          variant="full"
        />
        <AchievementMetric
          label="تثبيت"
          achieved={consolidation.achieved}
          target={consolidation.target}
          unit="صفحة"
          color="bg-violet-500"
          variant="full"
        />
      </div>
    </div>
  );
}
