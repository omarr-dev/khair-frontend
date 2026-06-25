"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { studentApi, attendanceApi, halaqatApi } from "@/services";
import { Student, SetStudentTargetDto } from "@/types/student";
import { SearchableSelectOption } from "@/components/shared/searchable-select";
import { AttendanceRecord } from "@/types/attendance";
import { surahs } from "@/lib/quran-data";
import { normalizeArabic } from "@/lib/arabic";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceBadge } from "@/components/shared/attendance-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  BookOpen,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Edit3,
  GraduationCap,
  RefreshCw,
  Eye,
  Target,
  Users,
  RotateCcw,
  Check,
  X,
  Loader2,
  UserPlus,
  MoreVertical,
  Pencil,
  UserMinus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";
import { convertArabicToEnglish } from "@/lib/utils";
import { StudentTargetDialog } from "@/components/students/student-target-dialog";
import { ProgressRecordingDialog } from "@/components/students/progress-recording-dialog";
import { EditMemorizationDialog } from "@/components/students/edit-memorization-dialog";
import { StudentManageDialog } from "@/components/students/student-manage-dialog";

// Helper function to get surah name by number
const getSurahName = (number: number) => {
  const surah = surahs.find((s) => s.id === number);
  return surah?.name || "غير محدد";
};

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to get progress color based on percentage
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return "bg-emerald-500";
  if (percentage >= 80) return "bg-blue-500";
  if (percentage >= 50) return "bg-amber-500";
  if (percentage > 0) return "bg-red-500";
  return "bg-gray-300";
};

// Helper function to get progress text color
const getProgressTextColor = (percentage: number) => {
  if (percentage >= 100) return "text-emerald-600";
  if (percentage >= 80) return "text-blue-600";
  if (percentage >= 50) return "text-amber-600";
  if (percentage > 0) return "text-red-600";
  return "text-gray-500";
};



// Group students by Halaqa
interface HalaqaGroup {
  halaqaName: string;
  halaqaId?: number;
  students: Student[];
}

// Progress indicator component
function ProgressIndicator({
  label,
  achieved,
  target,
  unit,
  percentage
}: {
  label: string;
  achieved: number;
  target?: number | null;
  unit: string;
  percentage: number;
}) {
  const hasTarget = (target ?? 0) > 0;
  const colorClass = hasTarget ? getProgressColor(percentage) : "bg-muted-foreground/40";
  const textColorClass = hasTarget ? getProgressTextColor(percentage) : "text-muted-foreground";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`w-2 h-2 rounded-full ${colorClass} shrink-0`} />
        <span className="text-xs text-muted-foreground truncate">{label}:</span>
      </div>
      <span className={`text-xs font-medium ${textColorClass} whitespace-nowrap`}>
        {hasTarget
          ? `${Math.round(achieved)}/${Math.round(target!)} ${unit}`
          : `${Math.round(achieved)} ${unit}`}
      </span>
    </div>
  );
}

export default function MyStudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedHalaqas, setCollapsedHalaqas] = useState<Set<string>>(new Set());
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Progress form state - just track which student is selected
  const [progressStudent, setProgressStudent] = useState<Student | null>(null);

  // Edit memorization dialog state - just track which student is selected
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  // Add / edit-profile / remove state
  const [halaqaOptions, setHalaqaOptions] = useState<SearchableSelectOption[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [profileEditStudent, setProfileEditStudent] = useState<Student | null>(null);
  const [removeStudent, setRemoveStudent] = useState<Student | null>(null);
  const [removing, setRemoving] = useState(false);

  // Target dialog state
  // Target dialog state
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);

  // Attendance state
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceRecord>>({});
  const [savingAttendance, setSavingAttendance] = useState<Record<number, boolean>>({});
  const [editingAttendance, setEditingAttendance] = useState<Set<number>>(new Set());

  // Bulk target dialog state
  const [bulkTargetHalaqa, setBulkTargetHalaqa] = useState<HalaqaGroup | null>(null);
  const [bulkMemorizationTarget, setBulkMemorizationTarget] = useState("");
  const [bulkRevisionTarget, setBulkRevisionTarget] = useState("");
  const [bulkConsolidationTarget, setBulkConsolidationTarget] = useState("");
  const [savingBulkTarget, setSavingBulkTarget] = useState(false);

  const handleNavigate = useCallback((studentId: string | number) => {
    setNavigatingTo(studentId.toString());
    router.push(`/my-students/${studentId}`);
  }, [router]);

  const fetchStudents = useCallback(async (preserveScroll = false) => {
    // On a background refresh (e.g. after recording a recitation) keep the list
    // mounted instead of showing the loading skeleton. Swapping in the skeleton
    // collapses the page height and bounces the scroll position to the top.
    const scrollPosition = preserveScroll ? window.scrollY : 0;

    if (!preserveScroll) setLoading(true);
    try {
      const response = await studentApi.getMyStudents();
      setStudents(response.data);

      // Belt-and-suspenders: restore scroll after the data re-renders in place.
      if (preserveScroll && scrollPosition > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollPosition, behavior: 'auto' });
        });
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء تحميل الطلاب");
      toast.error(errorMessage);
    } finally {
      if (!preserveScroll) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Load the teacher's own halaqat for the add / assign pickers
  useEffect(() => {
    halaqatApi
      .getLookup()
      .then((res) => setHalaqaOptions(res.data))
      .catch(() => setHalaqaOptions([]));
  }, []);

  // Remove a student from the teacher's halaqa (unassign — does not delete the record)
  const handleRemove = useCallback(async () => {
    if (!removeStudent || !user?.teacherId) return;
    const halaqaId = removeStudent.assignments.find((a) => a.isActive)?.halaqaId;
    if (!halaqaId) {
      toast.error("الطالب غير مسجّل في حلقة");
      return;
    }
    setRemoving(true);
    try {
      await studentApi.deleteAssignment(removeStudent.id, halaqaId, user.teacherId);
      toast.success("تمت إزالة الطالب من حلقتك");
      setRemoveStudent(null);
      fetchStudents(true);
    } catch (error) {
      toast.error(extractErrorMessage(error, "حدث خطأ أثناء إزالة الطالب"));
    } finally {
      setRemoving(false);
    }
  }, [removeStudent, user?.teacherId, fetchStudents]);

  const filteredStudents = students.filter((student) =>
    normalizeArabic(student.fullName).includes(normalizeArabic(searchTerm))
  );

  // Ordering for attendance: present first, then late, then not-recorded, then absent.
  const attendanceOrder = useCallback((studentId: number) => {
    const record = attendanceMap[studentId];
    if (!record) return 2;
    if (record.status === "حاضر") return 0;
    if (record.status === "متأخر") return 1;
    return 3; // غائب
  }, [attendanceMap]);

  // Group students by their Halaqa
  const groupedStudents: HalaqaGroup[] = useMemo(() => {
    const groups = filteredStudents.reduce((groups, student) => {
      const halaqaName = student.currentHalaqa || "بدون حلقة";
      const activeAssignment = student.assignments.find(a => a.isActive);
      let group = groups.find(g => g.halaqaName === halaqaName);

      if (!group) {
        group = { halaqaName, halaqaId: activeAssignment?.halaqaId, students: [] };
        groups.push(group);
      }

      group.students.push(student);
      return groups;
    }, [] as HalaqaGroup[]);

    // Sort each group so present students appear first, absent ones last.
    // Array.sort is stable, so students with the same status keep their order.
    groups.forEach(group => {
      group.students.sort((a, b) => attendanceOrder(a.id) - attendanceOrder(b.id));
    });
    return groups;
  }, [filteredStudents, attendanceOrder]);

  // Stable key of the distinct active halaqa IDs. Recording a recitation/edit
  // refreshes the student list (new array reference) without changing which
  // halaqat exist, so keying the attendance fetch off this — instead of the
  // whole `students` array — stops it from re-firing one request per halaqa on
  // every action. It only refetches when the set of halaqat actually changes.
  const halaqaIdsKey = useMemo(() => {
    const ids = new Set<number>();
    for (const s of students) {
      const active = s.assignments.find(a => a.isActive);
      if (active?.halaqaId) ids.add(active.halaqaId);
    }
    return Array.from(ids).sort((a, b) => a - b).join(",");
  }, [students]);

  // Fetch today's attendance for the teacher's halaqat (once per halaqa set)
  useEffect(() => {
    if (!halaqaIdsKey) return;

    const fetchAttendance = async () => {
      const today = getTodayDate();
      const halaqaIds = halaqaIdsKey.split(",").map(Number);

      const map: Record<number, AttendanceRecord> = {};
      await Promise.all(
        halaqaIds.map(async (halaqaId) => {
          try {
            const response = await attendanceApi.getByDate(halaqaId, today);
            for (const record of response.data.records) {
              map[record.studentId] = record;
            }
          } catch {
            // Silently ignore - attendance just won't show
          }
        })
      );
      setAttendanceMap(map);
    };

    fetchAttendance();
  }, [halaqaIdsKey]);

  // Handle recording attendance
  const handleAttendance = useCallback(async (studentId: number, halaqaId: number, status: 0 | 1) => {
    setSavingAttendance(prev => ({ ...prev, [studentId]: true }));
    try {
      const response = await attendanceApi.create({
        studentId,
        halaqaId,
        date: getTodayDate(),
        status,
      });
      setAttendanceMap(prev => ({ ...prev, [studentId]: response.data }));
      setEditingAttendance(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      toast.success(status === 0 ? "تم تسجيل الحضور" : "تم تسجيل الغياب");
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء تسجيل الحضور");
      toast.error(errorMessage);
    } finally {
      setSavingAttendance(prev => ({ ...prev, [studentId]: false }));
    }
  }, []);

  const toggleHalaqa = useCallback((halaqaName: string) => {
    setCollapsedHalaqas(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(halaqaName)) {
        newCollapsed.delete(halaqaName);
      } else {
        newCollapsed.add(halaqaName);
      }
      return newCollapsed;
    });
  }, []);

  // ================== TARGET HANDLERS ==================
  


  // ================== BULK TARGET HANDLERS ==================
  
  const openBulkTargetDialog = useCallback((group: HalaqaGroup) => {
    setBulkTargetHalaqa(group);
    setBulkMemorizationTarget("");
    setBulkRevisionTarget("");
    setBulkConsolidationTarget("");
  }, []);

  const handleSaveBulkTarget = useCallback(async () => {
    if (!bulkTargetHalaqa) return;
    
    setSavingBulkTarget(true);
    try {
      // Use the teacher-specific endpoint which sets targets for all their students
      const data: SetStudentTargetDto = {
        memorizationLinesTarget: parseInt(bulkMemorizationTarget) || null,
        revisionPagesTarget: parseInt(bulkRevisionTarget) || null,
        consolidationPagesTarget: parseInt(bulkConsolidationTarget) || null,
      };
      
      const response = await studentApi.bulkSetMyStudentsTargets(data);
      toast.success(`تم تعيين الأهداف لـ ${response.data.count} طالب`);

      // Refresh students to get updated targets and achievements
      await fetchStudents(true);

      setBulkTargetHalaqa(null);
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء تعيين الأهداف");
      toast.error(errorMessage);
    } finally {
      setSavingBulkTarget(false);
    }
  }, [bulkTargetHalaqa, bulkMemorizationTarget, bulkRevisionTarget, bulkConsolidationTarget, fetchStudents]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">طلابي</h1>
        {user?.teacherId && halaqaOptions.length > 0 && (
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="ml-2 h-4 w-4" />
            إضافة طالب
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث عن طالب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Students Grouped by Halaqa */}
      <div className="space-y-6">
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد طلاب مسجلين لديك"}
            </CardContent>
          </Card>
        ) : (
          groupedStudents.map((group) => (
            <div key={group.halaqaName} className="space-y-3">
              {/* Halaqa Header */}
              <div
                className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => toggleHalaqa(group.halaqaName)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary">{group.halaqaName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {group.students.length} {group.students.length === 1 ? 'طالب' : 'طلاب'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Bulk Target Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBulkTargetDialog(group);
                    }}
                    title="تعيين أهداف موحدة للجميع"
                    className="text-primary hover:text-primary"
                  >
                    <Users className="h-4 w-4 ml-1" />
                    <Target className="h-4 w-4" />
                  </Button>
                  {collapsedHalaqas.has(group.halaqaName) ? (
                    <ChevronDown className="h-5 w-5 text-primary" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>

              {/* Students in this Halaqa */}
              {!collapsedHalaqas.has(group.halaqaName) && (
                <div className="space-y-2 pr-4">
                  {group.students.map((student) => {
                    const todayAchievement = student.todayAchievement;
                    const hasTarget = todayAchievement?.hasTarget && (
                      (todayAchievement.memorizationLinesTarget ?? 0) > 0 ||
                      (todayAchievement.revisionPagesTarget ?? 0) > 0 ||
                      (todayAchievement.consolidationPagesTarget ?? 0) > 0
                    );
                    const currentStreak = student.currentStreak || 0;

                    return (
                      <Card
                        key={student.id}
                        className="transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3">
                            {/* Student Info Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              {/* Student Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3
                                    className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleNavigate(student.id)}
                                  >
                                    {student.fullName}
                                  </h3>
                                  {/* Streak Badge */}
                                  {currentStreak > 0 && (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 shrink-0">
                                      🔥 {currentStreak}
                                    </Badge>
                                  )}
                                  <Badge
                                    variant={
                                      student.memorizationDirection === "Forward"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="shrink-0"
                                  >
                                    {student.memorizationDirection === "Forward" ? (
                                      <ArrowDown className="h-3 w-3 ml-1" />
                                    ) : (
                                      <ArrowUp className="h-3 w-3 ml-1" />
                                    )}
                                    {student.memorizationDirection === "Forward"
                                      ? "من الفاتحة"
                                      : "من الناس"}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="h-4 w-4" />
                                    {getSurahName(student.currentSurahNumber)}
                                    {student.currentVerse > 0 && ` - آية ${student.currentVerse}`}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="h-4 w-4" />
                                    {student.juzMemorized.toFixed(1)} جزء
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  onClick={() => setProgressStudent(student)}
                                  className="flex-1 sm:flex-none order-1"
                                >
                                  <GraduationCap className="h-4 w-4 ml-1.5" />
                                  تسجيل تسميع
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setTargetStudent(student)}
                                  className={`flex-1 sm:flex-none order-2 ${hasTarget ? 'border-primary text-primary' : ''}`}
                                >
                                  <Target className="h-4 w-4 ml-1.5" />
                                  أهداف
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditStudent(student)}
                                  className="flex-1 sm:flex-none order-3"
                                >
                                  <Edit3 className="h-4 w-4 ml-1.5" />
                                  تعديل
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleNavigate(student.id)}
                                  loading={navigatingTo === student.id.toString()}
                                  className="flex-1 sm:flex-none order-4"
                                >
                                  <Eye className="h-4 w-4 ml-1.5" />
                                  عرض
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="order-5 px-2" title="المزيد">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setProfileEditStudent(student)}>
                                      <Pencil className="h-4 w-4 ml-2" />
                                      تعديل بيانات الطالب
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setRemoveStudent(student)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <UserMinus className="h-4 w-4 ml-2" />
                                      إزالة من الحلقة
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            {/* Attendance Row */}
                            {(() => {
                              const activeHalaqaId = student.assignments.find(a => a.isActive)?.halaqaId;
                              const record = attendanceMap[student.id];
                              const isSaving = savingAttendance[student.id];
                              const isEditing = editingAttendance.has(student.id);
                              const hasRealRecord = record && record.id !== 0;
                              const showButtons = !hasRealRecord || isEditing;

                              if (!activeHalaqaId) return null;

                              return (
                                <div className="flex items-center gap-2">
                                  {showButtons ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isSaving}
                                        onClick={() => handleAttendance(student.id, activeHalaqaId, 0)}
                                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/50"
                                      >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 ml-1" />}
                                        حاضر
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isSaving}
                                        onClick={() => handleAttendance(student.id, activeHalaqaId, 1)}
                                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50"
                                      >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5 ml-1" />}
                                        غائب
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <AttendanceBadge
                                        status={record.status === "حاضر" ? "present" : "absent"}
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-muted-foreground"
                                        onClick={() => setEditingAttendance(prev => new Set(prev).add(student.id))}
                                      >
                                        <RotateCcw className="h-3 w-3 ml-1" />
                                        تعديل
                                      </Button>
                                    </>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Achievement Progress Row - Always shown so teachers can see if the student has a record today */}
                            {todayAchievement && (
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 bg-muted/30 rounded-lg border border-muted">
                                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                  <Target className="h-3 w-3" />
                                  <span>إنجاز اليوم:</span>
                                </div>
                                <ProgressIndicator
                                  label="حفظ"
                                  achieved={todayAchievement.memorizationLinesAchieved}
                                  target={todayAchievement.memorizationLinesTarget}
                                  unit="سطر"
                                  percentage={todayAchievement.memorizationPercentage}
                                />
                                <ProgressIndicator
                                  label="مراجعة"
                                  achieved={todayAchievement.revisionPagesAchieved}
                                  target={todayAchievement.revisionPagesTarget}
                                  unit="صفحة"
                                  percentage={todayAchievement.revisionPercentage}
                                />
                                <ProgressIndicator
                                  label="تثبيت"
                                  achieved={todayAchievement.consolidationPagesAchieved}
                                  target={todayAchievement.consolidationPagesTarget}
                                  unit="صفحة"
                                  percentage={todayAchievement.consolidationPercentage}
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Progress Recording Dialog */}
      {progressStudent && (
        <ProgressRecordingDialog
          studentId={progressStudent.id}
          studentName={progressStudent.fullName}
          halaqaId={progressStudent.assignments.find(a => a.isActive)?.halaqaId || 0}
          currentSurahNumber={progressStudent.currentSurahNumber}
          currentVerse={progressStudent.currentVerse}
          memorizationDirection={progressStudent.memorizationDirection}
          open={!!progressStudent}
          onOpenChange={(open) => !open && setProgressStudent(null)}
          onProgressRecorded={() => {
            setProgressStudent(null);
            fetchStudents(true);
          }}
        />
      )}

      {/* Edit Memorization Dialog */}
      {editStudent && (
        <EditMemorizationDialog
          studentId={editStudent.id}
          studentName={editStudent.fullName}
          currentDirection={editStudent.memorizationDirection}
          currentSurahNumber={editStudent.currentSurahNumber}
          currentVerse={editStudent.currentVerse}
          open={!!editStudent}
          onOpenChange={(open) => !open && setEditStudent(null)}
          onMemorizationUpdated={() => {
            setEditStudent(null);
            fetchStudents(true);
          }}
        />
      )}

      {/* Add Student Dialog (ID-first flow) */}
      {user?.teacherId && (
        <StudentManageDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          mode="add"
          teacherId={user.teacherId}
          halaqaOptions={halaqaOptions}
          onSuccess={() => fetchStudents(true)}
        />
      )}

      {/* Edit Student Profile Dialog */}
      {user?.teacherId && profileEditStudent && (
        <StudentManageDialog
          open={!!profileEditStudent}
          onOpenChange={(open) => !open && setProfileEditStudent(null)}
          mode="edit"
          student={profileEditStudent}
          teacherId={user.teacherId}
          halaqaOptions={halaqaOptions}
          onSuccess={() => {
            setProfileEditStudent(null);
            fetchStudents(true);
          }}
        />
      )}

      {/* Remove from Halaqa confirmation */}
      <AlertDialog open={!!removeStudent} onOpenChange={(open) => !open && setRemoveStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إزالة الطالب من الحلقة</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إزالة <span className="font-semibold">{removeStudent?.fullName}</span> من حلقتك فقط.
              لن يتم حذف سجل الطالب من النظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جارٍ الإزالة...
                </>
              ) : (
                "إزالة"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Target Dialog */}
      {targetStudent && (
        <StudentTargetDialog
          studentId={targetStudent.id}
          studentName={targetStudent.fullName}
          open={!!targetStudent}
          onOpenChange={(open) => !open && setTargetStudent(null)}
          onTargetsUpdated={() => {
            // Re-fetch students to get updated targets
            fetchStudents(true);
          }}
        />
      )}

      {/* Bulk Target Dialog */}
      <Dialog open={!!bulkTargetHalaqa} onOpenChange={() => setBulkTargetHalaqa(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              أهداف موحدة - {bulkTargetHalaqa?.halaqaName}
            </DialogTitle>
            <DialogDescription>
              تعيين نفس الأهداف لجميع الطلاب في الحلقة ({bulkTargetHalaqa?.students.length} طالب)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Memorization Target */}
            <div className="space-y-2 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                <Label className="text-emerald-700 dark:text-emerald-300 font-medium">
                  أسطر الحفظ اليومي
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={bulkMemorizationTarget}
                  onChange={(e) => setBulkMemorizationTarget(convertArabicToEnglish(e.target.value))}
                  placeholder="مثال: 5"
                  className="text-center"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">سطر</span>
              </div>
            </div>

            {/* Revision Target */}
            <div className="space-y-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <Label className="text-blue-700 dark:text-blue-300 font-medium">
                  صفحات المراجعة اليومية
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={bulkRevisionTarget}
                  onChange={(e) => setBulkRevisionTarget(convertArabicToEnglish(e.target.value))}
                  placeholder="مثال: 2"
                  className="text-center"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">صفحة</span>
              </div>
            </div>

            {/* Consolidation Target */}
            <div className="space-y-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-600" />
                <Label className="text-amber-700 dark:text-amber-300 font-medium">
                  صفحات التثبيت اليومية
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={bulkConsolidationTarget}
                  onChange={(e) => setBulkConsolidationTarget(convertArabicToEnglish(e.target.value))}
                  placeholder="مثال: 1"
                  className="text-center"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">صفحة</span>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ سيتم استبدال أي أهداف سابقة للطلاب بهذه الأهداف الجديدة
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkTargetHalaqa(null)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveBulkTarget}
              loading={savingBulkTarget}
              disabled={!bulkMemorizationTarget && !bulkRevisionTarget && !bulkConsolidationTarget}
            >
              تعيين للجميع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
