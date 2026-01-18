"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { studentApi } from "@/services";
import { StudentDetail, StudentProgressRecord, StudentAttendanceRecord, StudentTarget, SetStudentTargetDto } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  RefreshCw,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/error-handler";
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

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = parseInt(params.id as string);

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Target edit state
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetForm, setTargetForm] = useState<SetStudentTargetDto>({
    memorizationLinesTarget: null,
    revisionPagesTarget: null,
    consolidationPagesTarget: null,
  });
  const [savingTarget, setSavingTarget] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
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
  };

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

  // Open target edit dialog
  const openTargetEdit = () => {
    if (student?.target) {
      setTargetForm({
        memorizationLinesTarget: student.target.memorizationLinesTarget ?? null,
        revisionPagesTarget: student.target.revisionPagesTarget ?? null,
        consolidationPagesTarget: student.target.consolidationPagesTarget ?? null,
      });
    } else {
      setTargetForm({
        memorizationLinesTarget: null,
        revisionPagesTarget: null,
        consolidationPagesTarget: null,
      });
    }
    setEditingTarget(true);
  };

  // Save target
  const handleSaveTarget = async () => {
    setSavingTarget(true);
    try {
      await studentApi.setTarget(studentId, targetForm);
      toast.success("تم حفظ الأهداف بنجاح");
      setEditingTarget(false);
      // Refresh student data
      fetchStudentDetails();
    } catch (error) {
      console.error("Error saving target:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء حفظ الأهداف");
      toast.error(errorMessage);
    } finally {
      setSavingTarget(false);
    }
  };

  // Check if any target is set
  const hasTargets = student?.target && (
    student.target.memorizationLinesTarget || 
    student.target.revisionPagesTarget || 
    student.target.consolidationPagesTarget
  );

  // Calculate juz progress percentage (30 juz total)
  const juzProgress = student ? Math.min((student.juzMemorized / 30) * 100, 100) : 0;

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

      {/* Daily Targets Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-l from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              الأهداف اليومية
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={openTargetEdit}
              className="gap-1"
            >
              <Edit3 className="h-4 w-4" />
              {hasTargets ? "تعديل" : "تحديد"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!hasTargets ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="mb-2">لم يتم تحديد أهداف بعد</p>
              <Button variant="outline" size="sm" onClick={openTargetEdit}>
                تحديد الأهداف
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {/* Memorization Target */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">الحفظ</span>
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {student.target?.memorizationLinesTarget ?? "—"}
                </div>
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">سطر / يوم</div>
              </div>

              {/* Revision Target */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">المراجعة</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {student.target?.revisionPagesTarget ?? "—"}
                </div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70">وجه / يوم</div>
              </div>

              {/* Consolidation Target */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <BookMarked className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">التثبيت</span>
                </div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {student.target?.consolidationPagesTarget ?? "—"}
                </div>
                <div className="text-xs text-amber-600/70 dark:text-amber-400/70">وجه / يوم</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Edit Dialog */}
      <Dialog open={editingTarget} onOpenChange={setEditingTarget}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              تحديد الأهداف اليومية
            </DialogTitle>
            <DialogDescription>
              حدد الأهداف اليومية للطالب {student.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Memorization */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-500/10">
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                الحفظ (سطر / يوم)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="مثال: 5"
                value={targetForm.memorizationLinesTarget ?? ""}
                onChange={(e) => setTargetForm(prev => ({
                  ...prev,
                  memorizationLinesTarget: e.target.value ? parseInt(e.target.value) : null
                }))}
              />
            </div>

            {/* Revision */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-500/10">
                  <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                </div>
                المراجعة (وجه / يوم)
              </Label>
              <Input
                type="number"
                min="0"
                max="50"
                placeholder="مثال: 2"
                value={targetForm.revisionPagesTarget ?? ""}
                onChange={(e) => setTargetForm(prev => ({
                  ...prev,
                  revisionPagesTarget: e.target.value ? parseInt(e.target.value) : null
                }))}
              />
            </div>

            {/* Consolidation */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500/10">
                  <BookMarked className="h-3.5 w-3.5 text-amber-600" />
                </div>
                التثبيت (وجه / يوم)
              </Label>
              <Input
                type="number"
                min="0"
                max="50"
                placeholder="مثال: 1"
                value={targetForm.consolidationPagesTarget ?? ""}
                onChange={(e) => setTargetForm(prev => ({
                  ...prev,
                  consolidationPagesTarget: e.target.value ? parseInt(e.target.value) : null
                }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTarget(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveTarget} loading={savingTarget}>
              حفظ الأهداف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
