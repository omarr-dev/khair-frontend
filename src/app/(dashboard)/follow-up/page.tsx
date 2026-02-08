"use client";

import { FollowUpProvider, useFollowUp, HierarchyView } from "@/components/follow-up";
import { AttendanceStats } from "@/components/shared/attendance-stats";
import { AchievementBar } from "@/components/shared/achievement-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";

function FollowUpPageContent() {
  const { totalStudentStats, totalTeacherStats, totalAchievement, loading, selectedDate, setSelectedDate } = useFollowUp();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-16" />
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title + Date Picker */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">المتابعة</h1>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="follow-up-date" className="text-sm text-muted-foreground whitespace-nowrap">
            التاريخ:
          </label>
          <input
            id="follow-up-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Stats Header - Students and Teachers */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <AttendanceStats
          label="الطلاب"
          total={totalStudentStats.total}
          present={totalStudentStats.present}
          absent={totalStudentStats.absent}
          notRecorded={totalStudentStats.notRecorded}
          variant="card"
          icon="students"
        />
        <AttendanceStats
          label="المعلمين"
          total={totalTeacherStats.total}
          present={totalTeacherStats.present}
          absent={totalTeacherStats.absent}
          notRecorded={totalTeacherStats.notRecorded}
          variant="card"
          icon="teachers"
        />
      </div>

      {/* Page-level Achievement Bar */}
      <AchievementBar
        memorization={totalAchievement.memorization}
        revision={totalAchievement.revision}
        consolidation={totalAchievement.consolidation}
        variant="full"
      />

      {/* Hierarchical View */}
      <HierarchyView />
    </div>
  );
}

export default function FollowUpPage() {
  return (
    <FollowUpProvider>
      <FollowUpPageContent />
    </FollowUpProvider>
  );
}
