"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { studentApi } from "@/services";
import { StudentDetail, StudentAttendanceRecord, AchievementHistory } from "@/types/student";
import { Button } from "@/components/ui/button";
import { StudentTargetDialog } from "@/components/students/student-target-dialog";
import { ProgressRecordingDialog } from "@/components/students/progress-recording-dialog";
import { EditMemorizationDialog } from "@/components/students/edit-memorization-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  User,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  Target,
  Edit3,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { extractErrorMessage } from "@/lib/error-handler";
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
  differenceInDays,
} from "date-fns";
import { ar } from "date-fns/locale";

// Day names in Arabic (short)
const dayNames = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"];

type ViewMode = "weekly" | "monthly";
type DateRangeOption = "today" | "week" | "month" | "custom";

// Security: Max days allowed for custom date range
const MAX_DATE_RANGE_DAYS = 90;

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

const AchievementProgressBar = memo(function AchievementProgressBar({ 
  label, 
  achieved, 
  target, 
  unit, 
  percentage 
}: AchievementProgressBarProps) {
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
        className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
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
});

// Day indicator dot component - memoized for performance
interface DayDotProps {
  day: {
    date: string;
    isTargetMet: boolean;
    memorizationLinesAchieved?: number;
    memorizationLinesTarget?: number;
    revisionPagesAchieved?: number;
    revisionPagesTarget?: number;
    consolidationPagesAchieved?: number;
    consolidationPagesTarget?: number;
  };
}

const DayDot = memo(function DayDot({ day }: DayDotProps) {
  const hasActivity = (day.memorizationLinesAchieved || 0) > 0 || 
                     (day.revisionPagesAchieved || 0) > 0 || 
                     (day.consolidationPagesAchieved || 0) > 0;
  const dayDate = new Date(day.date);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "w-4 h-4 rounded-full transition-all duration-200 cursor-pointer hover:scale-125",
            day.isTargetMet 
              ? "bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900" 
              : hasActivity
                ? "bg-amber-400"
                : "bg-gray-200 dark:bg-gray-700"
          )}
          role="status"
          aria-label={day.isTargetMet ? "تم تحقيق الهدف" : hasActivity ? "نشاط جزئي" : "لا نشاط"}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        <div className="font-medium mb-1">
          {format(dayDate, "EEEE d MMM", { locale: ar })}
        </div>
        <div className="space-y-0.5 text-muted-foreground">
          {(day.memorizationLinesTarget || 0) > 0 && (
            <div>حفظ: {day.memorizationLinesAchieved || 0}/{day.memorizationLinesTarget} سطر</div>
          )}
          {(day.revisionPagesTarget || 0) > 0 && (
            <div>مراجعة: {day.revisionPagesAchieved || 0}/{day.revisionPagesTarget} صفحة</div>
          )}
          {(day.consolidationPagesTarget || 0) > 0 && (
            <div>تثبيت: {day.consolidationPagesAchieved || 0}/{day.consolidationPagesTarget} صفحة</div>
          )}
        </div>
        <div className={cn(
          "mt-1 font-medium",
          day.isTargetMet ? "text-emerald-600" : hasActivity ? "text-amber-600" : "text-gray-500"
        )}>
          {day.isTargetMet ? "✓ تم تحقيق الهدف" : hasActivity ? "نشاط جزئي" : "لا نشاط"}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

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
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);

  // Progress recording dialog state
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  // Edit memorization dialog state
  const [editMemorizationOpen, setEditMemorizationOpen] = useState(false);

  // Achievement date range state
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("today");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Force refresh achievement data (used after target updates)
  const [achievementRefreshKey, setAchievementRefreshKey] = useState(0);
  const refreshAchievement = useCallback(() => {
    setAchievementRefreshKey(k => k + 1);
  }, []);

  // Helper to get today's date string (stable reference)
  const getTodayStr = useCallback(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Calculate date range based on selection - memoized for performance
  // Returns stable object references to prevent unnecessary re-renders
  const selectedDateRange = useMemo(() => {
    const todayStr = getTodayStr();
    
    switch (dateRangeOption) {
      case "today":
        return { startDate: todayStr, endDate: todayStr, days: 1, label: "اليوم" };
      case "week": {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        return { 
          startDate: weekStart.toISOString().split('T')[0], 
          endDate: todayStr,
          days: 7,
          label: "آخر 7 أيام"
        };
      }
      case "month": {
        const monthStart = new Date();
        monthStart.setDate(monthStart.getDate() - 29);
        return { 
          startDate: monthStart.toISOString().split('T')[0], 
          endDate: todayStr,
          days: 30,
          label: "آخر 30 يوم"
        };
      }
      case "custom": {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          // Security: Validate and clamp date range
          const diffDays = Math.min(
            Math.abs(differenceInDays(end, start)) + 1,
            MAX_DATE_RANGE_DAYS
          );
          return {
            startDate: customStartDate,
            endDate: customEndDate,
            days: diffDays,
            label: `${format(start, "d MMM", { locale: ar })} - ${format(end, "d MMM", { locale: ar })}`
          };
        }
        // Fallback to week if custom dates not set
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        return { 
          startDate: weekStart.toISOString().split('T')[0], 
          endDate: todayStr, 
          days: 7, 
          label: "آخر 7 أيام" 
        };
      }
    }
  }, [dateRangeOption, customStartDate, customEndDate, getTodayStr]);

  // Fetch student details on mount
  useEffect(() => {
    if (!studentId) return;
    
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await studentApi.getDetails(studentId);
        if (isMounted) {
          setStudent(response.data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching student details:", error);
          toast.error("حدث خطأ أثناء تحميل بيانات الطالب");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  // Fetch achievements when date range changes - with cleanup
  useEffect(() => {
    if (!studentId) return;
    
    let isMounted = true;
    const { startDate, endDate } = selectedDateRange;
    
    const fetchAchievementData = async () => {
      setLoadingAchievement(true);
      try {
        const response = await studentApi.getAchievementHistory(studentId, startDate, endDate);
        if (isMounted) {
          setAchievementHistory(response.data);
        }
      } catch {
        // No achievement data - that's okay
        if (isMounted) {
          setAchievementHistory(null);
        }
      } finally {
        if (isMounted) {
          setLoadingAchievement(false);
        }
      }
    };
    
    fetchAchievementData();
    
    return () => {
      isMounted = false;
    };
  }, [studentId, selectedDateRange.startDate, selectedDateRange.endDate, achievementRefreshKey]);

  // Calculate cumulative stats from daily achievements - memoized for performance
  const cumulativeStats = useMemo(() => {
    if (!achievementHistory?.hasTarget || !achievementHistory.dailyAchievements?.length) {
      return null;
    }
    
    const days = achievementHistory.dailyAchievements;
    const numDays = days.length;
    
    // Get target from any day (it's the same for all days)
    const firstDay = days[0];
    if (!firstDay) return null;
    
    // Cumulative targets = daily target × number of days
    const memDailyTarget = firstDay.memorizationLinesTarget || 0;
    const revDailyTarget = firstDay.revisionPagesTarget || 0;
    const conDailyTarget = firstDay.consolidationPagesTarget || 0;
    
    const memTarget = memDailyTarget * numDays;
    const revTarget = revDailyTarget * numDays;
    const conTarget = conDailyTarget * numDays;
    
    // Cumulative achieved = sum of all days
    const memAchieved = days.reduce((sum, d) => sum + (d.memorizationLinesAchieved || 0), 0);
    const revAchieved = days.reduce((sum, d) => sum + (d.revisionPagesAchieved || 0), 0);
    const conAchieved = days.reduce((sum, d) => sum + (d.consolidationPagesAchieved || 0), 0);
    
    return {
      memorization: {
        achieved: memAchieved,
        target: memTarget,
        dailyTarget: memDailyTarget,
        percentage: memTarget > 0 ? (memAchieved / memTarget) * 100 : 0,
      },
      revision: {
        achieved: revAchieved,
        target: revTarget,
        dailyTarget: revDailyTarget,
        percentage: revTarget > 0 ? (revAchieved / revTarget) * 100 : 0,
      },
      consolidation: {
        achieved: conAchieved,
        target: conTarget,
        dailyTarget: conDailyTarget,
        percentage: conTarget > 0 ? (conAchieved / conTarget) * 100 : 0,
      },
      numDays,
      daysTargetMet: achievementHistory.totalDaysTargetMet,
      daysActive: achievementHistory.totalDaysActive,
    };
  }, [achievementHistory]);

  // Handle custom date range apply
  const handleApplyCustomRange = useCallback(() => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      
      // Validate dates
      if (start > end) {
        toast.error("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
        return;
      }
      
      const diffDays = differenceInDays(end, start) + 1;
      if (diffDays > MAX_DATE_RANGE_DAYS) {
        toast.error(`لا يمكن اختيار أكثر من ${MAX_DATE_RANGE_DAYS} يوم`);
        return;
      }
      
      setDateRangeOption("custom");
      setShowCustomPicker(false);
    }
  }, [customStartDate, customEndDate]);

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

  // Get attendance status for a specific day - memoized
  const getAttendanceForDay = useCallback((date: Date): StudentAttendanceRecord | undefined => {
    if (!student?.recentAttendance) return undefined;
    return student.recentAttendance.find((a) =>
      isSameDay(new Date(a.date), date)
    );
  }, [student?.recentAttendance]);

  // Check if a day is an active class day - memoized
  const isActiveDay = useCallback((date: Date): boolean => {
    if (activeDays.length === 0) return true; // If no active days set, show all
    return activeDays.includes(getDay(date));
  }, [activeDays]);

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

  // Refresh student data after progress/memorization update
  const refreshStudentData = useCallback(async () => {
    try {
      const response = await studentApi.getDetails(studentId);
      setStudent(response.data);
      refreshAchievement();
    } catch (error) {
      console.error("Error refreshing student data:", error);
    }
  }, [studentId, refreshAchievement]);

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

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 mt-4 border-t w-full">
              <Button
                onClick={() => setProgressDialogOpen(true)}
                className="gap-2"
              >
                <Edit3 className="h-4 w-4" />
                تسجيل تسميع
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditMemorizationOpen(true)}
                className="gap-2 border-primary/50 hover:bg-primary/5"
              >
                <Edit3 className="h-4 w-4" />
                تعديل الحفظ
              </Button>
            </div>
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

      {/* Achievement Card with Date Range */}
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white p-4 rounded-t-xl">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5" />
              الإنجاز
            </div>
            <div className="flex items-center gap-2">
              {achievementHistory?.hasTarget && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-7 bg-white/10 hover:bg-white/20 text-white border-0"
                  onClick={() => setTargetDialogOpen(true)}
                >
                  <Edit3 className="h-3 w-3 ml-1" />
                  تعديل الهدف
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

          {/* Date Range Selector */}
          {achievementHistory?.hasTarget && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {(["today", "week", "month"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setDateRangeOption(option);
                      setShowCustomPicker(false);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                      dateRangeOption === option
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "bg-white/20 hover:bg-white/30 text-white"
                    )}
                  >
                    {option === "today" && "اليوم"}
                    {option === "week" && "آخر 7 أيام"}
                    {option === "month" && "آخر 30 يوم"}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomPicker(!showCustomPicker)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1",
                    dateRangeOption === "custom"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  )}
                >
                  <CalendarDays className="h-3 w-3" />
                  مخصص
                </button>
              </div>

              {/* Custom Date Picker */}
              {showCustomPicker && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs opacity-80">من:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="bg-white/20 border border-white/30 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs opacity-80">إلى:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        min={customStartDate}
                        max={new Date().toISOString().split('T')[0]}
                        className="bg-white/20 border border-white/30 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleApplyCustomRange}
                      disabled={!customStartDate || !customEndDate}
                      className="h-7 bg-white text-emerald-700 hover:bg-white/90"
                    >
                      تطبيق
                    </Button>
                  </div>
                  <p className="text-xs opacity-70">
                    الحد الأقصى: {MAX_DATE_RANGE_DAYS} يوم
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <CardContent className="pt-6 pb-6">
          {loadingAchievement ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : achievementHistory?.hasTarget && cumulativeStats ? (
            <div className="space-y-4">
              {/* Period Label */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedDateRange.label}
                  {dateRangeOption !== "today" && (
                    <span className="mr-1 text-xs">
                      ({cumulativeStats.numDays} يوم)
                    </span>
                  )}
                </span>
                {dateRangeOption !== "today" && cumulativeStats.memorization.dailyTarget > 0 && (
                  <span className="text-xs text-muted-foreground">
                    الهدف اليومي: {cumulativeStats.memorization.dailyTarget} سطر
                  </span>
                )}
              </div>

              {/* Progress Bars */}
              {cumulativeStats.memorization.dailyTarget > 0 && (
                <AchievementProgressBar
                  label="الحفظ"
                  achieved={cumulativeStats.memorization.achieved}
                  target={cumulativeStats.memorization.target}
                  unit="سطر"
                  percentage={cumulativeStats.memorization.percentage}
                />
              )}

              {cumulativeStats.revision.dailyTarget > 0 && (
                <AchievementProgressBar
                  label="المراجعة"
                  achieved={cumulativeStats.revision.achieved}
                  target={cumulativeStats.revision.target}
                  unit="صفحة"
                  percentage={cumulativeStats.revision.percentage}
                />
              )}

              {cumulativeStats.consolidation.dailyTarget > 0 && (
                <AchievementProgressBar
                  label="التثبيت"
                  achieved={cumulativeStats.consolidation.achieved}
                  target={cumulativeStats.consolidation.target}
                  unit="صفحة"
                  percentage={cumulativeStats.consolidation.percentage}
                />
              )}

              {/* Visual Day Dots - Show for multi-day views */}
              {dateRangeOption !== "today" && achievementHistory.dailyAchievements && achievementHistory.dailyAchievements.length > 0 && (
                <div className="pt-3 border-t space-y-3">
                  {/* Summary Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>سجل الأيام</span>
                    <div className="flex items-center gap-4">
                      <span>
                        <span className="font-semibold text-emerald-600">{cumulativeStats.daysTargetMet}</span>
                        <span className="text-xs mr-1">تحقيق الهدف</span>
                      </span>
                      <span>
                        <span className="font-semibold text-amber-600">{cumulativeStats.daysActive}</span>
                        <span className="text-xs mr-1">نشاط</span>
                      </span>
                    </div>
                  </div>

                  {/* Day Dots with Tooltip */}
                  <TooltipProvider delayDuration={100}>
                    <div className="flex flex-wrap items-center gap-1.5 justify-center" role="list" aria-label="سجل الأيام">
                      {achievementHistory.dailyAchievements.map((day, i) => (
                        <DayDot key={day.date || i} day={day} />
                      ))}
                    </div>
                  </TooltipProvider>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>تحقيق الهدف</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>نشاط جزئي</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <span>لا نشاط</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : !achievementHistory?.hasTarget ? (
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
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد بيانات للفترة المحددة
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
          onTargetsUpdated={refreshAchievement}
        />
      )}

      {/* Progress Recording Dialog */}
      {student && student.halaqaId && (
        <ProgressRecordingDialog
          studentId={student.id}
          studentName={student.fullName}
          halaqaId={student.halaqaId}
          currentSurahNumber={student.currentSurahNumber}
          currentVerse={student.currentVerse}
          open={progressDialogOpen}
          onOpenChange={setProgressDialogOpen}
          onProgressRecorded={refreshStudentData}
        />
      )}

      {/* Edit Memorization Dialog */}
      {student && (
        <EditMemorizationDialog
          studentId={student.id}
          studentName={student.fullName}
          currentDirection={student.memorizationDirection}
          currentSurahNumber={student.currentSurahNumber}
          currentVerse={student.currentVerse}
          open={editMemorizationOpen}
          onOpenChange={setEditMemorizationOpen}
          onMemorizationUpdated={refreshStudentData}
        />
      )}
    </div>
  );
}

