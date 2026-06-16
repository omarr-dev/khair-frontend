"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceStats } from "@/components/shared/attendance-stats";
import { AchievementBar } from "@/components/shared/achievement-bar";
import { AttendanceBadge } from "@/components/shared/attendance-badge";
import { Pagination } from "@/components/manage/shared/pagination";
import { useFollowUp, FollowUpHalaqa, FollowUpTeacher, FollowUpStudent } from "./follow-up-context";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronDown,
  Eye,
  Loader2,
  UserCheck,
  Users,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";

export function HierarchyView() {
  const router = useRouter();
  const { halaqat, page, setPage, pageSize, totalCount, totalPages } = useFollowUp();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Everything starts collapsed: only halaqa headers are mounted, expanded
  // content renders on demand (critical with hundreds of halaqat)
  const [expandedHalaqat, setExpandedHalaqat] = useState<Set<number>>(new Set());

  const allExpanded = halaqat.length > 0 && expandedHalaqat.size >= halaqat.length;

  const handleNavigate = useCallback(
    (studentId: number) => {
      setNavigatingTo(studentId.toString());
      router.push(`/my-students/${studentId}`);
    },
    [router]
  );

  const toggleHalaqa = useCallback((halaqaId: number) => {
    setExpandedHalaqat((prev) => {
      const next = new Set(prev);
      if (next.has(halaqaId)) {
        next.delete(halaqaId);
      } else {
        next.add(halaqaId);
      }
      return next;
    });
  }, []);

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedHalaqat(new Set());
    } else {
      setExpandedHalaqat(new Set(halaqat.map((h) => h.id)));
    }
  };

  if (halaqat.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-muted-foreground mb-1">لا توجد بيانات للعرض</p>
        <p className="text-sm text-muted-foreground/70">لم يتم تسجيل أي بيانات متابعة لهذا التاريخ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section header with expand/collapse */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">الحلقات ({totalCount})</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          className="gap-1.5 text-xs text-muted-foreground"
        >
          {allExpanded ? (
            <>
              <ChevronsDownUp className="h-3.5 w-3.5" />
              طي الكل
            </>
          ) : (
            <>
              <ChevronsUpDown className="h-3.5 w-3.5" />
              توسيع الكل
            </>
          )}
        </Button>
      </div>

      {halaqat.map((halaqa) => (
        <HalaqaCard
          key={halaqa.id}
          halaqa={halaqa}
          isExpanded={expandedHalaqat.has(halaqa.id)}
          onToggle={toggleHalaqa}
          onNavigateStudent={handleNavigate}
          navigatingTo={navigatingTo}
        />
      ))}

      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

// Halaqa Card Component — memoized so toggling one halaqa doesn't re-render
// the hundreds of sibling cards
interface HalaqaCardProps {
  halaqa: FollowUpHalaqa;
  isExpanded: boolean;
  onToggle: (halaqaId: number) => void;
  onNavigateStudent: (studentId: number) => void;
  navigatingTo: string | null;
}

const HalaqaCard = memo(function HalaqaCard({
  halaqa,
  isExpanded,
  onToggle,
  onNavigateStudent,
  navigatingTo,
}: HalaqaCardProps) {
  // Teacher expand state is local to each halaqa card so sibling cards keep
  // stable props (and React.memo stays effective)
  const [expandedTeachers, setExpandedTeachers] = useState<Set<number>>(new Set());

  const toggleTeacher = useCallback((teacherId: number) => {
    setExpandedTeachers((prev) => {
      const next = new Set(prev);
      if (next.has(teacherId)) {
        next.delete(teacherId);
      } else {
        next.add(teacherId);
      }
      return next;
    });
  }, []);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Halaqa Header */}
      <div
        className="cursor-pointer"
        onClick={() => onToggle(halaqa.id)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`حلقة ${halaqa.name}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(halaqa.id);
          }
        }}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            {/* Top Row: Icon + Name + Badges + Chevron */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold truncate">{halaqa.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="secondary" className="gap-1 text-xs h-6">
                  <UserCheck className="h-3 w-3" />
                  {halaqa.teacherStats.total}
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs h-6">
                  <Users className="h-3 w-3" />
                  {halaqa.studentStats.total}
                </Badge>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                  aria-hidden="true"
                />
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
              <div className="hidden sm:block text-muted-foreground/30">|</div>
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
        </CardContent>
      </div>

      {/* Teachers — rendered only when expanded */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="border-t border-dashed px-3 sm:px-4 pb-3 sm:pb-4 pt-3 space-y-2">
            {halaqa.teachers.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center bg-muted/30 rounded-lg">
                لا يوجد معلمين في هذه الحلقة
              </div>
            ) : (
              halaqa.teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  isExpanded={expandedTeachers.has(teacher.id)}
                  onToggle={toggleTeacher}
                  onNavigateStudent={onNavigateStudent}
                  navigatingTo={navigatingTo}
                />
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
});

// Teacher Card Component
interface TeacherCardProps {
  teacher: FollowUpTeacher;
  isExpanded: boolean;
  onToggle: (teacherId: number) => void;
  onNavigateStudent: (studentId: number) => void;
  navigatingTo: string | null;
}

const TeacherCard = memo(function TeacherCard({
  teacher,
  isExpanded,
  onToggle,
  onNavigateStudent,
  navigatingTo,
}: TeacherCardProps) {
  return (
    <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 dark:bg-amber-950/10 dark:border-amber-900/30 overflow-hidden">
      {/* Teacher Header */}
      <div
        className="p-3 sm:p-4 cursor-pointer hover:bg-amber-100/40 dark:hover:bg-amber-950/20 transition-colors"
        onClick={() => onToggle(teacher.id)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(teacher.id);
          }
        }}
      >
        <div className="flex flex-col gap-2">
          {/* Top Row: Avatar + Name + Badge + Chevron */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <UserCheck className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm truncate">المعلم {teacher.fullName}</h4>
                <AttendanceBadge status={teacher.attendanceStatus} showIcon={false} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className="gap-1 text-xs h-6">
                <Users className="h-3 w-3" />
                {teacher.studentStats.total}
              </Badge>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
                aria-hidden="true"
              />
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
      </div>

      {/* Students — rendered only when expanded */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="border-t border-dashed px-3 pb-3 pt-2 space-y-1.5">
            {teacher.students.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center bg-muted/20 rounded-lg">
                لا يوجد طلاب مسجلين لهذا المعلم
              </div>
            ) : (
              teacher.students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onNavigate={onNavigateStudent}
                  isNavigating={navigatingTo === student.id.toString()}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// Student Card Component
interface StudentCardProps {
  student: FollowUpStudent;
  onNavigate: (studentId: number) => void;
  isNavigating: boolean;
}

const StudentCard = memo(function StudentCard({ student, onNavigate, isNavigating }: StudentCardProps) {
  return (
    <div
      className={cn(
        "group rounded-lg border border-blue-200/60 bg-blue-50/30 dark:bg-blue-950/10 dark:border-blue-900/30 p-3 cursor-pointer",
        "hover:border-blue-300/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 hover:shadow-sm",
        "transition-all duration-150",
        isNavigating && "opacity-60 pointer-events-none"
      )}
      onClick={() => onNavigate(student.id)}
      role="button"
      tabIndex={0}
      aria-label={`عرض تفاصيل الطالب ${student.fullName}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(student.id);
        }
      }}
    >
      <div className="flex flex-col gap-2">
        {/* Top Row: Avatar + Name + Badge + View Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400 shrink-0">
              {isNavigating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                student.fullName.charAt(0)
              )}
            </div>
            <span className="font-medium text-sm truncate">{student.fullName}</span>
            <AttendanceBadge status={student.attendanceStatus} />
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(student.id);
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
    </div>
  );
});
