"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceStats } from "@/components/shared/attendance-stats";
import { AchievementBar } from "@/components/shared/achievement-bar";
import { AttendanceBadge } from "@/components/shared/attendance-badge";
import { useFollowUp, FollowUpHalaqa, FollowUpTeacher, FollowUpStudent } from "./follow-up-context";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  UserCheck,
  Users,
} from "lucide-react";

export function HierarchyView() {
  const router = useRouter();
  const { halaqat } = useFollowUp();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Collapsed state for halaqat and teachers
  const [collapsedHalaqat, setCollapsedHalaqat] = useState<Set<number>>(
    () => new Set(halaqat.map((h) => h.id))
  );
  const [collapsedTeachers, setCollapsedTeachers] = useState<Set<string>>(
    () => {
      const teacherKeys: string[] = [];
      halaqat.forEach((halaqa) => {
        halaqa.teachers.forEach((teacher) => {
          teacherKeys.push(`${halaqa.id}-${teacher.id}`);
        });
      });
      return new Set(teacherKeys);
    }
  );

  const handleNavigate = (studentId: number) => {
    setNavigatingTo(studentId.toString());
    router.push(`/my-students/${studentId}`);
  };

  const toggleHalaqa = (halaqaId: number) => {
    const newCollapsed = new Set(collapsedHalaqat);
    if (newCollapsed.has(halaqaId)) {
      newCollapsed.delete(halaqaId);
    } else {
      newCollapsed.add(halaqaId);
    }
    setCollapsedHalaqat(newCollapsed);
  };

  const toggleTeacher = (halaqaId: number, teacherId: number) => {
    const key = `${halaqaId}-${teacherId}`;
    const newCollapsed = new Set(collapsedTeachers);
    if (newCollapsed.has(key)) {
      newCollapsed.delete(key);
    } else {
      newCollapsed.add(key);
    }
    setCollapsedTeachers(newCollapsed);
  };

  if (halaqat.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        لا توجد بيانات للعرض
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {halaqat.map((halaqa) => (
        <HalaqaCard
          key={halaqa.id}
          halaqa={halaqa}
          isCollapsed={collapsedHalaqat.has(halaqa.id)}
          onToggle={() => toggleHalaqa(halaqa.id)}
          collapsedTeachers={collapsedTeachers}
          onToggleTeacher={(teacherId) => toggleTeacher(halaqa.id, teacherId)}
          onNavigateStudent={handleNavigate}
          navigatingTo={navigatingTo}
        />
      ))}
    </div>
  );
}

// Halaqa Card Component
interface HalaqaCardProps {
  halaqa: FollowUpHalaqa;
  isCollapsed: boolean;
  onToggle: () => void;
  collapsedTeachers: Set<string>;
  onToggleTeacher: (teacherId: number) => void;
  onNavigateStudent: (studentId: number) => void;
  navigatingTo: string | null;
}

function HalaqaCard({
  halaqa,
  isCollapsed,
  onToggle,
  collapsedTeachers,
  onToggleTeacher,
  onNavigateStudent,
  navigatingTo,
}: HalaqaCardProps) {
  return (
    <div className="space-y-2">
      {/* Halaqa Header */}
      <div
        className={cn(
          "flex flex-col gap-3 p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors",
          "bg-primary/5 border-primary/20 hover:bg-primary/10"
        )}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-label={`حلقة ${halaqa.name}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {/* Top Row: Name + Counts + Chevron */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold truncate">{halaqa.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-xs">
              <UserCheck className="h-3 w-3" />
              {halaqa.teacherStats.total}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              {halaqa.studentStats.total}
            </Badge>
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-5 w-5 text-primary" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <AttendanceStats
            label="الطلاب"
            total={halaqa.studentStats.total}
            present={halaqa.studentStats.present}
            absent={halaqa.studentStats.absent}
            notRecorded={halaqa.studentStats.notRecorded}
            variant="inline"
          />
          <div className="hidden sm:block text-muted-foreground">|</div>
          <AttendanceStats
            label="المعلمين"
            total={halaqa.teacherStats.total}
            present={halaqa.teacherStats.present}
            absent={halaqa.teacherStats.absent}
            notRecorded={halaqa.teacherStats.notRecorded}
            variant="inline"
          />
        </div>

        {/* Achievement Row */}
        <AchievementBar
          memorization={halaqa.achievement.memorization}
          revision={halaqa.achievement.revision}
          consolidation={halaqa.achievement.consolidation}
          variant="compact"
        />
      </div>

      {/* Teachers (when expanded) */}
      {!isCollapsed && (
        <div className="space-y-2 pr-2 sm:pr-4 lg:pr-6">
          {halaqa.teachers.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center bg-muted/50 rounded-lg mr-2 sm:mr-4">
              لا يوجد معلمين في هذه الحلقة
            </div>
          ) : (
            halaqa.teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                halaqaId={halaqa.id}
                isCollapsed={collapsedTeachers.has(`${halaqa.id}-${teacher.id}`)}
                onToggle={() => onToggleTeacher(teacher.id)}
                onNavigateStudent={onNavigateStudent}
                navigatingTo={navigatingTo}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Teacher Card Component
interface TeacherCardProps {
  teacher: FollowUpTeacher;
  halaqaId: number;
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigateStudent: (studentId: number) => void;
  navigatingTo: string | null;
}

function TeacherCard({
  teacher,
  isCollapsed,
  onToggle,
  onNavigateStudent,
  navigatingTo,
}: TeacherCardProps) {
  return (
    <div className="space-y-2">
      {/* Teacher Header */}
      <div
        className={cn(
          "flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-colors mr-2 sm:mr-4",
          "bg-secondary/30 border-secondary/50 hover:bg-secondary/50"
        )}
        onClick={onToggle}
      >
        {/* Top Row: Name + Badge + Chevron */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">المعلم {teacher.fullName}</h3>
              <AttendanceBadge status={teacher.attendanceStatus} showIcon={false} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              {teacher.studentStats.total}
            </Badge>
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Stats Row */}
        <AttendanceStats
          label="الطلاب"
          total={teacher.studentStats.total}
          present={teacher.studentStats.present}
          absent={teacher.studentStats.absent}
          notRecorded={teacher.studentStats.notRecorded}
          variant="inline"
        />

        {/* Achievement Row */}
        <AchievementBar
          memorization={teacher.achievement.memorization}
          revision={teacher.achievement.revision}
          consolidation={teacher.achievement.consolidation}
          variant="compact"
        />
      </div>

      {/* Students (when expanded) */}
      {!isCollapsed && (
        <div className="space-y-1 pr-2 sm:pr-4 lg:pr-6 mr-2 sm:mr-4">
          {teacher.students.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center bg-muted/30 rounded-lg mr-2 sm:mr-4">
              لا يوجد طلاب مسجلين لهذا المعلم
            </div>
          ) : (
            teacher.students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onNavigate={() => onNavigateStudent(student.id)}
                isNavigating={navigatingTo === student.id.toString()}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Student Card Component
interface StudentCardProps {
  student: FollowUpStudent;
  onNavigate: () => void;
  isNavigating: boolean;
}

function StudentCard({ student, onNavigate, isNavigating }: StudentCardProps) {
  return (
    <Card
      className={cn(
        "mr-2 sm:mr-4 cursor-pointer hover:shadow-md transition-shadow",
        isNavigating && "opacity-70"
      )}
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      aria-label={`عرض تفاصيل الطالب ${student.fullName}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate();
        }
      }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          {/* Top Row: Name + Badge + View Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                {isNavigating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  student.fullName.charAt(0)
                )}
              </div>
              <span className="font-medium truncate">{student.fullName}</span>
              <AttendanceBadge status={student.attendanceStatus} />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Achievement Row */}
          <AchievementBar
            memorization={student.achievement.memorization}
            revision={student.achievement.revision}
            consolidation={student.achievement.consolidation}
            variant="compact"
          />
        </div>
      </CardContent>
    </Card>
  );
}
