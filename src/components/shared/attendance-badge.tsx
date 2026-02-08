"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type AttendanceStatus = "present" | "absent" | "not_recorded";

interface AttendanceBadgeProps {
  status: AttendanceStatus;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  present: {
    label: "حاضر",
    variant: "default" as const,
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  absent: {
    label: "غائب",
    variant: "destructive" as const,
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  not_recorded: {
    label: "لم يُسجَّل",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },
};

export function AttendanceBadge({ status, showIcon = true, className }: AttendanceBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(config.className, "gap-1", className)}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
