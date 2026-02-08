"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceStatsProps {
  label: string;
  total: number;
  present: number;
  absent: number;
  notRecorded: number;
  variant?: "card" | "inline" | "compact";
  icon?: "students" | "teachers";
  className?: string;
}

// Helper function to calculate percentage
function getPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Card variant - Full card with header (for page header)
function CardVariant({
  label,
  total,
  present,
  absent,
  notRecorded,
  icon,
}: AttendanceStatsProps) {
  const Icon = icon === "teachers" ? UserCheck : Users;
  const presentPct = getPercentage(present, total);
  const absentPct = getPercentage(absent, total);
  const notRecordedPct = getPercentage(notRecorded, total);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-3">{total}</div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">
              حاضر: {present} ({presentPct}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">
              غائب: {absent} ({absentPct}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-xs text-muted-foreground">
              لم يُسجَّل: {notRecorded} ({notRecordedPct}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline variant - Horizontal badges (for Halaqa/Teacher level)
function InlineVariant({
  label,
  total,
  present,
  absent,
  notRecorded,
  className,
}: AttendanceStatsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">{label}:</span>
      <Badge variant="outline" className="gap-1 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        <span className="text-emerald-700 dark:text-emerald-400">{present}</span>
      </Badge>
      <Badge variant="outline" className="gap-1 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <XCircle className="h-3 w-3 text-red-600" />
        <span className="text-red-700 dark:text-red-400">{absent}</span>
      </Badge>
      <Badge variant="outline" className="gap-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <Clock className="h-3 w-3 text-gray-500" />
        <span className="text-gray-600 dark:text-gray-400">{notRecorded}</span>
      </Badge>
    </div>
  );
}

// Compact variant - Small inline for mobile
function CompactVariant({
  present,
  absent,
  notRecorded,
  className,
}: AttendanceStatsProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{present}✓</span>
      <span className="text-red-600 dark:text-red-400 font-medium">{absent}✗</span>
      <span className="text-gray-500 font-medium">{notRecorded}○</span>
    </div>
  );
}

export function AttendanceStats(props: AttendanceStatsProps) {
  const { variant = "card" } = props;

  switch (variant) {
    case "card":
      return <CardVariant {...props} />;
    case "inline":
      return <InlineVariant {...props} />;
    case "compact":
      return <CompactVariant {...props} />;
    default:
      return <CardVariant {...props} />;
  }
}
