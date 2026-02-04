"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { studentApi } from "@/services";
import { Student, SetStudentTargetDto } from "@/types/student";
import { surahs } from "@/lib/quran-data";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";
import { convertArabicToEnglish } from "@/lib/utils";
import { StudentTargetDialog } from "@/components/students/student-target-dialog";
import { ProgressRecordingDialog } from "@/components/students/progress-recording-dialog";
import { EditMemorizationDialog } from "@/components/students/edit-memorization-dialog";

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
  target: number;
  unit: string;
  percentage: number;
}) {
  const colorClass = getProgressColor(percentage);
  const textColorClass = getProgressTextColor(percentage);
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`w-2 h-2 rounded-full ${colorClass} shrink-0`} />
        <span className="text-xs text-muted-foreground truncate">{label}:</span>
      </div>
      <span className={`text-xs font-medium ${textColorClass} whitespace-nowrap`}>
        {achieved}/{target} {unit}
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

  // Target dialog state
  // Target dialog state
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);

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
    // Save scroll position if needed
    const scrollPosition = preserveScroll ? window.scrollY : 0;
    
    setLoading(true);
    try {
      const response = await studentApi.getMyStudents();
      setStudents(response.data);
      
      // Restore scroll position after state update
      if (preserveScroll && scrollPosition > 0) {
        setTimeout(() => {
          window.scrollTo({ top: scrollPosition, behavior: 'auto' });
        }, 0);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء تحميل الطلاب");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter((student) =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group students by their Halaqa
  const groupedStudents: HalaqaGroup[] = useMemo(() => {
    return filteredStudents.reduce((groups, student) => {
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
  }, [filteredStudents]);

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
                              </div>
                            </div>
                            
                            {/* Achievement Progress Row - Only show if there's a target */}
                            {hasTarget && todayAchievement && (
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 bg-muted/30 rounded-lg border border-muted">
                                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                  <Target className="h-3 w-3" />
                                  <span>إنجاز اليوم:</span>
                                </div>
                                {(todayAchievement.memorizationLinesTarget ?? 0) > 0 && (
                                  <ProgressIndicator
                                    label="حفظ"
                                    achieved={todayAchievement.memorizationLinesAchieved}
                                    target={todayAchievement.memorizationLinesTarget!}
                                    unit="سطر"
                                    percentage={todayAchievement.memorizationPercentage}
                                  />
                                )}
                                {(todayAchievement.revisionPagesTarget ?? 0) > 0 && (
                                  <ProgressIndicator
                                    label="مراجعة"
                                    achieved={todayAchievement.revisionPagesAchieved}
                                    target={todayAchievement.revisionPagesTarget!}
                                    unit="صفحة"
                                    percentage={todayAchievement.revisionPercentage}
                                  />
                                )}
                                {(todayAchievement.consolidationPagesTarget ?? 0) > 0 && (
                                  <ProgressIndicator
                                    label="تثبيت"
                                    achieved={todayAchievement.consolidationPagesAchieved}
                                    target={todayAchievement.consolidationPagesTarget!}
                                    unit="صفحة"
                                    percentage={todayAchievement.consolidationPercentage}
                                  />
                                )}
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
