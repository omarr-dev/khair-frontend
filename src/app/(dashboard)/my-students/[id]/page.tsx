"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { studentApi } from "@/services";
import { StudentDetail, StudentAttendanceRecord, AchievementHistory } from "@/types/student";
import { Button } from "@/components/ui/button";
import { StudentTargetDialog } from "@/components/students/student-target-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  User,
  Phone,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  Target,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  getDay,
} from "date-fns";
import { ar } from "date-fns/locale";

// Day names in Arabic
const dayNames = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"];
const dayNamesLong = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type ViewMode = "weekly" | "monthly";

// Helper function to get progress color based on percentage
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return { bg: "bg-emerald-500", text: "text-emerald-600" };
  if (percentage >= 80) return { bg: "bg-blue-500", text: "text-blue-600" };
  if (percentage >= 50) return { bg: "bg-amber-500", text: "text-amber-600" };
  return { bg: "bg-red-500", text: "text-red-600" };
};



// Reusable progress bar component with accessibility
interface AchievementProgressBarProps {
  label: string;
  achieved: number;
  target: number;
  unit: string;
  percentage: number;
}

function AchievementProgressBar({ label, achieved, target, unit, percentage }: AchievementProgressBarProps) {
  const colors = getProgressColor(percentage);
  const clampedPercentage = Math.min(percentage, 100);
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {achieved}/{target} {unit}
          </span>
          <span className={cn("text-xs font-bold min-w-[36px] text-left", colors.text)}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div 
        className="h-2 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${achieved} من ${target} ${unit}`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colors.bg
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = parseInt(params.id as string);

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [achievementHistory, setAchievementHistory] = useState<AchievementHistory | null>(null);
  const [loadingAchievement, setLoadingAchievement] = useState(false);

  // Target dialog state
  // Target dialog state
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);

  // Get date range for achievement history (7 days)
  const getDateRange = useCallback(() => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today.setDate(today.getDate() - 6)).toISOString().split('T')[0];
    return { startDate, endDate };
  }, []);

  const fetchStudentDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await studentApi.getDetails(studentId);
      setStudent(response.data);
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast.error("حدث خطأ أثناء تحميل بيانات الطالب");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const fetchAchievement = useCallback(async () => {
    setLoadingAchievement(true);
    try {
      const { startDate, endDate } = getDateRange();
      const response = await studentApi.getAchievementHistory(studentId, startDate, endDate);
      setAchievementHistory(response.data);
    } catch {
      // No achievement data - that's okay
      setAchievementHistory(null);
    } finally {
      setLoadingAchievement(false);
    }
  }, [studentId, getDateRange]);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
      fetchAchievement();
    }
  }, [studentId, fetchStudentDetails, fetchAchievement]);

  // Parse active days from string "0,1,3,4" to array [0,1,3,4]
  const activeDays = useMemo(() => {
    if (!student?.halaqaActiveDays) return [];
    return student.halaqaActiveDays.split(",").map((d) => parseInt(d.trim()));
  }, [student?.halaqaActiveDays]);

  // Get calendar days based on view mode
  const calendarDays = useMemo(() => {
    if (viewMode === "weekly") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      // Get all days, but pad to start from Sunday
      const monthDays = eachDayOfInterval({ start, end });
      const firstDayOfWeek = getDay(start);
      const paddedDays: (Date | null)[] = [];
      
      // Add empty slots before first day
      for (let i = 0; i < firstDayOfWeek; i++) {
        paddedDays.push(null);
      }
      
      return [...paddedDays, ...monthDays];
    }
  }, [currentDate, viewMode]);

  // Get attendance status for a specific day
  const getAttendanceForDay = (date: Date): StudentAttendanceRecord | undefined => {
    if (!student) return undefined;
    return student.recentAttendance.find((a) =>
      isSameDay(new Date(a.date), date)
    );
  };

  // Check if a day is an active class day
  const isActiveDay = (date: Date): boolean => {
    if (activeDays.length === 0) return true; // If no active days set, show all
    return activeDays.includes(getDay(date));
  };

  // Navigate calendar
  const navigateCalendar = (direction: "prev" | "next") => {
    if (viewMode === "weekly") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  // Calculate juz progress percentage (30 juz total)
  const juzProgress = student ? Math.min((student.juzMemorized / 30) * 100, 100) : 0;

  // Target Handlers


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">لم يتم العثور على الطالب</p>
        <Button onClick={() => router.back()}>
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
        <h1 className="text-xl font-bold">{student.fullName}</h1>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary">
                {student.firstName.charAt(0)}
              </span>
            </div>

            {/* Name */}
            <h2 className="text-2xl font-bold mb-2">{student.fullName}</h2>

            {/* Current Position */}
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <BookOpen className="h-4 w-4" />
              <span>
                {student.currentSurahName || "الفاتحة"}
                {student.currentVerse > 0 && ` - آية ${student.currentVerse}`}
              </span>
              <Badge
                variant={student.memorizationDirection === "Forward" ? "default" : "secondary"}
                className="mr-2"
              >
                {student.memorizationDirection === "Forward" ? (
                  <ArrowDown className="h-3 w-3 ml-1" />
                ) : (
                  <ArrowUp className="h-3 w-3 ml-1" />
                )}
                {student.memorizationDirection === "Forward" ? "من الفاتحة" : "من الناس"}
              </Badge>
            </div>

            {/* Juz Progress Bar */}
            <div className="w-full max-w-xs mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">التقدم في الحفظ</span>
                <span className="font-medium">{student.juzMemorized.toFixed(1)} جزء</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${juzProgress}%` }}
                />
              </div>
            </div>

            {/* Guardian Info */}
            {(student.guardianName || student.guardianPhone) && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4 mt-2 w-full justify-center">
                {student.guardianName && (
                  <div className="flex items-center gap-1">
                    ولي الأمر:
                    <User className="h-4 w-4" />
                    <span>{student.guardianName}</span>
                  </div>
                )}
                {student.guardianPhone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{student.guardianPhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {student.stats.attendanceRate.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">الحضور</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {student.stats.totalVersesMemorized}
            </div>
            <div className="text-xs text-muted-foreground">آية محفوظة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {student.stats.averageQualityText || "—"}
            </div>
            <div className="text-xs text-muted-foreground">المتوسط</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Achievement Card */}
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5" />
              إنجاز اليوم
            </div>
            {/* Streak Badge */}
            <div className="flex items-center gap-2">
              {achievementHistory?.hasTarget && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-7 bg-white/10 hover:bg-white/20 text-white border-0"
                  onClick={() => setTargetDialogOpen(true)}
                >
                  <Edit3 className="h-3 w-3 ml-1" />
                  تعديل
                </Button>
              )}
              {achievementHistory?.hasTarget && achievementHistory.currentStreak > 0 && (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                  <span className="text-orange-300">🔥</span>
                  <span className="text-sm font-bold">{achievementHistory.currentStreak}</span>
                  <span className="text-xs opacity-80">يوم</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <CardContent className="pt-6 pb-6">
          {loadingAchievement ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : achievementHistory?.hasTarget ? (
            (() => {
              // Get today's achievement from the daily achievements array
              const todayStr = new Date().toISOString().split('T')[0];
              const todayAchievement = achievementHistory.dailyAchievements.find(
                a => a.date.split('T')[0] === todayStr
              );
              
              if (!todayAchievement) {
                return (
                  <div className="text-center py-6 text-muted-foreground">
                    لا توجد بيانات لليوم
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Progress Bars */}
                  {todayAchievement.memorizationLinesTarget > 0 && (
                    <AchievementProgressBar
                      label="الحفظ"
                      achieved={todayAchievement.memorizationLinesAchieved}
                      target={todayAchievement.memorizationLinesTarget}
                      unit="سطر"
                      percentage={todayAchievement.memorizationPercentage}
                    />
                  )}

                  {todayAchievement.revisionPagesTarget > 0 && (
                    <AchievementProgressBar
                      label="المراجعة"
                      achieved={todayAchievement.revisionPagesAchieved}
                      target={todayAchievement.revisionPagesTarget}
                      unit="صفحة"
                      percentage={todayAchievement.revisionPercentage}
                    />
                  )}

                  {todayAchievement.consolidationPagesTarget > 0 && (
                    <AchievementProgressBar
                      label="التثبيت"
                      achieved={todayAchievement.consolidationPagesAchieved}
                      target={todayAchievement.consolidationPagesTarget}
                      unit="صفحة"
                      percentage={todayAchievement.consolidationPercentage}
                    />
                  )}

                  {/* Weekly Summary - Compact */}
                  <div className="flex items-center justify-between pt-3 border-t text-sm text-muted-foreground">
                    <span>هذا الأسبوع</span>
                    <div className="flex items-center gap-4">
                      <span>
                        <span className="font-semibold text-foreground">{achievementHistory.totalDaysTargetMet}</span> أيام تحقيق الهدف
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">{achievementHistory.totalDaysActive}</span> أيام نشطة
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-8">
              <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground mb-4">لم يتم تعيين أهداف لهذا الطالب</p>
              <Button onClick={() => setTargetDialogOpen(true)} variant="outline" className="gap-2">
                <Target className="h-4 w-4" />
                تعيين الأهداف
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              الحضور
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setViewMode("weekly")}
                  className={cn(
                    "px-3 py-1 text-sm transition-colors",
                    viewMode === "weekly"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  أسبوعي
                </button>
                <button
                  onClick={() => setViewMode("monthly")}
                  className={cn(
                    "px-3 py-1 text-sm transition-colors",
                    viewMode === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  شهري
                </button>
              </div>
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigateCalendar("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigateCalendar("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* Current Period Label */}
          <div className="text-sm text-muted-foreground">
            {viewMode === "weekly"
              ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "d MMM", { locale: ar })} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "d MMM yyyy", { locale: ar })}`
              : format(currentDate, "MMMM yyyy", { locale: ar })}
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className={cn(
            "grid gap-1 mb-2",
            viewMode === "weekly" ? "grid-cols-7" : "grid-cols-7"
          )}>
            {dayNames.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "text-center text-xs font-medium py-1",
                  activeDays.length > 0 && !activeDays.includes(index)
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className={cn(
            "grid gap-1",
            viewMode === "weekly" ? "grid-cols-7" : "grid-cols-7"
          )}>
            {calendarDays.map((date, index) => {
              if (!date) {
                // Empty slot for padding in monthly view
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const attendance = getAttendanceForDay(date);
              const isActive = isActiveDay(date);
              const isToday = isSameDay(date, new Date());
              const isFuture = date > new Date();

              // Determine status color
              let statusClass = "bg-muted"; // Default: no class / not active
              let statusIcon = null;

              if (isActive && !isFuture) {
                if (attendance) {
                  if (attendance.status === "حاضر") {
                    statusClass = "bg-green-500";
                    statusIcon = <Check className="h-3 w-3 text-white" />;
                  } else if (attendance.status === "غائب") {
                    statusClass = "bg-red-500";
                    statusIcon = <X className="h-3 w-3 text-white" />;
                  } else if (attendance.status === "متأخر") {
                    statusClass = "bg-yellow-500";
                    statusIcon = <Clock className="h-3 w-3 text-white" />;
                  }
                } else if (!isFuture) {
                  // Active day but no attendance recorded - could be not recorded yet
                  statusClass = "bg-muted";
                }
              }

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-all",
                    statusClass,
                    isToday && "ring-2 ring-primary ring-offset-1",
                    !isActive && "opacity-40"
                  )}
                >
                  <span className={cn(
                    "font-medium",
                    attendance && "text-white"
                  )}>
                    {format(date, "d")}
                  </span>
                  {statusIcon}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>حاضر</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>غائب</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>متأخر</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              <span>لا يوجد</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            آخر التسميعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.recentProgress.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد تسميعات مسجلة
            </div>
          ) : (
            <div className="space-y-3">
              {student.recentProgress.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{record.surahName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({record.fromVerse} - {record.toVerse})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={record.type === "حفظ جديد" ? "default" : "secondary"} className="text-xs">
                        {record.type}
                      </Badge>
                      <span>•</span>
                      <span>{format(new Date(record.date), "d MMM yyyy", { locale: ar })}</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      record.quality === "ممتاز"
                        ? "default"
                        : record.quality === "جيد جداً"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {record.quality}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Dialog */}
      {student && (
        <StudentTargetDialog
          studentId={studentId}
          studentName={student.fullName}
          open={targetDialogOpen}
          onOpenChange={setTargetDialogOpen}
          onTargetsUpdated={fetchAchievement}
        />
      )}
    </div>
  );
}

