"use client";

import { FollowUpProvider, useFollowUp, HierarchyView } from "@/components/follow-up";
import { AttendanceStats } from "@/components/shared/attendance-stats";
import { AchievementBar } from "@/components/shared/achievement-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, CalendarDays } from "lucide-react";

function FollowUpPageContent() {
  const { totalStudentStats, totalTeacherStats, totalAchievement, loading, selectedDate, setSelectedDate } = useFollowUp();

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
        {/* Stats skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
        {/* Achievement skeleton */}
        <Skeleton className="h-28 rounded-xl" />
        {/* Hierarchy skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">المتابعة</h1>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg border px-3 py-1.5">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            id="follow-up-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Achievement Overview */}
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
