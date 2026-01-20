"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { studentApi, progressApi } from "@/services";
import { Student, UpdateMemorizationDto, StudentTarget, SetStudentTargetDto, TargetAchievement } from "@/types/student";
import { CreateProgressRecord } from "@/types/progress";
import { surahs } from "@/lib/quran-data";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

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

// Helper function to convert Arabic numerals to English and sanitize
const convertArabicToEnglish = (str: string) => {
  const english = str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  return english.replace(/[^0-9]/g, '');
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
  
  // Achievements cache for today
  const [achievements, setAchievements] = useState<Map<number, TargetAchievement | null>>(new Map());
  const [loadingAchievements, setLoadingAchievements] = useState<Set<number>>(new Set());

  // Progress form state
  const [progressStudent, setProgressStudent] = useState<Student | null>(null);
  const [progressType, setProgressType] = useState<"0" | "1" | "2">("0");
  const [selectedSurah, setSelectedSurah] = useState("");
  const [fromVerse, setFromVerse] = useState("");
  const [toVerse, setToVerse] = useState("");
  const [quality, setQuality] = useState<"0" | "1" | "2" | "3">("0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingProgressData, setLoadingProgressData] = useState(false);

  // Edit memorization dialog state
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editDirection, setEditDirection] = useState<"Forward" | "Backward">("Forward");
  const [editSurah, setEditSurah] = useState("");
  const [editVerse, setEditVerse] = useState("");
  const [saving, setSaving] = useState(false);

  // Target dialog state
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [targetData, setTargetData] = useState<StudentTarget | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [memorizationTarget, setMemorizationTarget] = useState("");
  const [revisionTarget, setRevisionTarget] = useState("");
  const [consolidationTarget, setConsolidationTarget] = useState("");

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

  // Fetch achievement for a student
  const fetchAchievement = useCallback(async (studentId: number) => {
    if (achievements.has(studentId) || loadingAchievements.has(studentId)) {
      return;
    }
    
    setLoadingAchievements(prev => new Set(prev).add(studentId));
    try {
      const response = await studentApi.getAchievement(studentId, getTodayDate());
      setAchievements(prev => new Map(prev).set(studentId, response.data));
    } catch {
      // No achievement data - that's okay
      setAchievements(prev => new Map(prev).set(studentId, null));
    } finally {
      setLoadingAchievements(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  }, [achievements, loadingAchievements]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch achievements for visible students
  useEffect(() => {
    students.forEach(student => {
      fetchAchievement(student.id);
    });
  }, [students, fetchAchievement]);

  // Clear toVerse when fromVerse changes if toVerse is now invalid
  useEffect(() => {
    if (fromVerse && toVerse && parseInt(toVerse) < parseInt(fromVerse)) {
      setToVerse("");
    }
  }, [fromVerse, toVerse]);

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

  const handleProgressSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressStudent) return;

    if (!user?.teacherId) {
      toast.error("لا يمكن تحديد هوية المعلم. يرجى تسجيل الخروج والدخول مرة أخرى.");
      return;
    }

    setSubmitting(true);

    try {
      const activeAssignment = progressStudent.assignments.find((a) => a.isActive);
      if (!activeAssignment) {
        toast.error("الطالب غير مسجل في حلقة نشطة");
        return;
      }

      const data: CreateProgressRecord = {
        studentId: progressStudent.id,
        teacherId: user.teacherId,
        halaqaId: activeAssignment.halaqaId,
        date: new Date().toISOString(),
        type: parseInt(progressType) as 0 | 1 | 2,
        surahName: selectedSurah,
        fromVerse: parseInt(fromVerse),
        toVerse: parseInt(toVerse),
        quality: parseInt(quality) as 0 | 1 | 2 | 3,
        notes: notes || undefined,
      };

      await progressApi.create(data);
      toast.success("تم حفظ التسميع بنجاح");

      // Clear the achievement cache for this student to force refresh
      setAchievements(prev => {
        const next = new Map(prev);
        next.delete(progressStudent.id);
        return next;
      });

      // Reset form
      setProgressStudent(null);
      setSelectedSurah("");
      setFromVerse("");
      setToVerse("");
      setNotes("");

      // Refresh students to get updated positions (preserve scroll)
      fetchStudents(true);
    } catch (error: unknown) {
      console.error("Error creating progress:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء حفظ التسميع");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [progressStudent, user?.teacherId, progressType, selectedSurah, fromVerse, toVerse, quality, notes, fetchStudents]);

  const handleEditMemorization = useCallback((student: Student) => {
    setEditStudent(student);
    setEditDirection(student.memorizationDirection);
    setEditSurah(student.currentSurahNumber.toString());
    setEditVerse(student.currentVerse.toString());
  }, []);

  const handleSaveMemorization = useCallback(async () => {
    if (!editStudent) return;

    setSaving(true);
    try {
      const data: UpdateMemorizationDto = {
        memorizationDirection: editDirection,
        currentSurahNumber: parseInt(editSurah),
        currentVerse: parseInt(editVerse),
      };

      await studentApi.updateMemorization(editStudent.id, data);
      toast.success("تم تحديث موضع الحفظ بنجاح");
      setEditStudent(null);
      fetchStudents(true);
    } catch (error) {
      console.error("Error updating memorization:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء تحديث موضع الحفظ");
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [editStudent, editDirection, editSurah, editVerse, fetchStudents]);

  const loadProgressByType = useCallback(async (student: Student, type: "0" | "1" | "2") => {
    if (type === "0") {
      // For new memorization: start from current position + 1, fields disabled
      const currentSurah = surahs.find((s) => s.id === student.currentSurahNumber);
      if (currentSurah) {
        setSelectedSurah(currentSurah.name);
        const startVerse = student.currentVerse + 1;
        if (startVerse <= currentSurah.versesCount) {
          setFromVerse(startVerse.toString());
        }
      }
      setLoadingProgressData(false);
    } else {
      // For revision (1) or consolidation (2): get last progress of this type
      setLoadingProgressData(true);
      try {
        const response = await progressApi.getLastByType(student.id, parseInt(type) as 0 | 1 | 2);
        const lastProgress = response.data;
        
        if (lastProgress) {
          // Start from where they left off in this type
          const lastSurah = surahs.find(s => s.name === lastProgress.surahName);
          
          if (lastSurah) {
            // Check if we need to move to the next verse or next surah
            const nextVerse = lastProgress.toVerse + 1;
            
            if (nextVerse <= lastSurah.versesCount) {
              // Continue in the same surah
              setSelectedSurah(lastProgress.surahName);
              setFromVerse(nextVerse.toString());
              setToVerse("");
            } else {
              // Move to the next surah (if exists)
              const nextSurahIndex = surahs.findIndex(s => s.name === lastProgress.surahName) + 1;
              if (nextSurahIndex < surahs.length) {
                const nextSurah = surahs[nextSurahIndex];
                setSelectedSurah(nextSurah.name);
                setFromVerse("1");
                setToVerse("");
              } else {
                // Reached end of Quran, start over
                const firstSurah = surahs[0];
                setSelectedSurah(firstSurah.name);
                setFromVerse("1");
                setToVerse("");
              }
            }
          } else {
            // Fallback if surah not found
            const firstSurah = surahs[0];
            setSelectedSurah(firstSurah.name);
            setFromVerse("1");
            setToVerse("");
          }
        } else {
          // No previous progress of this type, start from beginning
          // Teacher will manually enter the position
          const firstSurah = surahs[0];
          setSelectedSurah(firstSurah.name);
          setFromVerse("1");
          setToVerse("");
        }
      } catch {
        // If there's no record (404) or any other error, silently start from beginning
        // The teacher will manually enter the correct position
        console.log("No previous record found, starting from beginning");
        const firstSurah = surahs[0];
        setSelectedSurah(firstSurah.name);
        setFromVerse("1");
        setToVerse("");
      } finally {
        setLoadingProgressData(false);
      }
    }
  }, []);

  const openProgressForm = useCallback((student: Student) => {
    setProgressStudent(student);
    setProgressType("0"); // Default to new memorization
    // Load initial data for new memorization
    loadProgressByType(student, "0");
  }, [loadProgressByType]);

  // ================== TARGET HANDLERS ==================
  
  const openTargetDialog = useCallback(async (student: Student) => {
    setTargetStudent(student);
    setLoadingTarget(true);
    setTargetData(null);
    setMemorizationTarget("");
    setRevisionTarget("");
    setConsolidationTarget("");
    
    try {
      const response = await studentApi.getTarget(student.id);
      const target = response.data;
      setTargetData(target);
      
      if (target) {
        setMemorizationTarget(target.memorizationLinesTarget?.toString() || "");
        setRevisionTarget(target.revisionPagesTarget?.toString() || "");
        setConsolidationTarget(target.consolidationPagesTarget?.toString() || "");
      }
    } catch {
      // No target set - that's okay
    } finally {
      setLoadingTarget(false);
    }
  }, []);

  const handleSaveTarget = useCallback(async () => {
    if (!targetStudent) return;
    
    setSavingTarget(true);
    try {
      const data: SetStudentTargetDto = {
        memorizationLinesTarget: memorizationTarget ? parseInt(memorizationTarget) : null,
        revisionPagesTarget: revisionTarget ? parseInt(revisionTarget) : null,
        consolidationPagesTarget: consolidationTarget ? parseInt(consolidationTarget) : null,
      };
      
      await studentApi.setTarget(targetStudent.id, data);
      toast.success("تم حفظ الأهداف بنجاح");
      
      // Clear achievement cache to refresh
      setAchievements(prev => {
        const next = new Map(prev);
        next.delete(targetStudent.id);
        return next;
      });
      
      // Re-fetch achievement
      setTimeout(() => fetchAchievement(targetStudent.id), 100);
      
      setTargetStudent(null);
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء حفظ الأهداف");
      toast.error(errorMessage);
    } finally {
      setSavingTarget(false);
    }
  }, [targetStudent, memorizationTarget, revisionTarget, consolidationTarget, fetchAchievement]);

  const handleRemoveTarget = useCallback(async () => {
    if (!targetStudent) return;
    
    setSavingTarget(true);
    try {
      const data: SetStudentTargetDto = {
        memorizationLinesTarget: null,
        revisionPagesTarget: null,
        consolidationPagesTarget: null,
      };
      
      await studentApi.setTarget(targetStudent.id, data);
      toast.success("تم إزالة الأهداف");
      
      // Clear achievement cache
      setAchievements(prev => {
        const next = new Map(prev);
        next.delete(targetStudent.id);
        return next;
      });
      
      setTargetStudent(null);
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء إزالة الأهداف");
      toast.error(errorMessage);
    } finally {
      setSavingTarget(false);
    }
  }, [targetStudent]);

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
      
      // Clear all achievement caches
      setAchievements(new Map());
      
      setBulkTargetHalaqa(null);
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء تعيين الأهداف");
      toast.error(errorMessage);
    } finally {
      setSavingBulkTarget(false);
    }
  }, [bulkTargetHalaqa, bulkMemorizationTarget, bulkRevisionTarget, bulkConsolidationTarget]);

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
                    const achievement = achievements.get(student.id);
                    const isLoadingAchievement = loadingAchievements.has(student.id);
                    const hasTarget = achievement && (
                      achievement.memorizationLinesTarget > 0 ||
                      achievement.revisionPagesTarget > 0 ||
                      achievement.consolidationPagesTarget > 0
                    );
                    
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
                              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleNavigate(student.id)}
                                  loading={navigatingTo === student.id.toString()}
                                  title="عرض الملف الشخصي"
                                  className="flex-1 sm:flex-none"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditMemorization(student)}
                                  title="تعديل موضع الحفظ"
                                  className="flex-1 sm:flex-none"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openTargetDialog(student)}
                                  title="إدارة الأهداف"
                                  className={`flex-1 sm:flex-none ${hasTarget ? 'border-primary text-primary' : ''}`}
                                >
                                  <Target className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => openProgressForm(student)}
                                  className="flex-1 sm:flex-none"
                                >
                                  <GraduationCap className="h-4 w-4 ml-2" />
                                  <span className="hidden sm:inline">تسجيل تسميع</span>
                                  <span className="sm:hidden">تسميع</span>
                                </Button>
                              </div>
                            </div>
                            
                            {/* Achievement Progress Row - Only show if there's a target */}
                            {isLoadingAchievement ? (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                <span>جاري تحميل الإنجاز...</span>
                              </div>
                            ) : hasTarget && (
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 bg-muted/30 rounded-lg border border-muted">
                                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                  <Target className="h-3 w-3" />
                                  <span>إنجاز اليوم:</span>
                                </div>
                                {achievement.memorizationLinesTarget > 0 && (
                                  <ProgressIndicator
                                    label="حفظ"
                                    achieved={achievement.memorizationLinesAchieved}
                                    target={achievement.memorizationLinesTarget}
                                    unit="سطر"
                                    percentage={achievement.memorizationPercentage}
                                  />
                                )}
                                {achievement.revisionPagesTarget > 0 && (
                                  <ProgressIndicator
                                    label="مراجعة"
                                    achieved={achievement.revisionPagesAchieved}
                                    target={achievement.revisionPagesTarget}
                                    unit="صفحة"
                                    percentage={achievement.revisionPercentage}
                                  />
                                )}
                                {achievement.consolidationPagesTarget > 0 && (
                                  <ProgressIndicator
                                    label="تثبيت"
                                    achieved={achievement.consolidationPagesAchieved}
                                    target={achievement.consolidationPagesTarget}
                                    unit="صفحة"
                                    percentage={achievement.consolidationPercentage}
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
      <Dialog open={!!progressStudent} onOpenChange={() => setProgressStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل تسميع - {progressStudent?.fullName}</DialogTitle>
            <DialogDescription>
              الموقع الحالي: {progressStudent && getSurahName(progressStudent.currentSurahNumber)}
              {progressStudent?.currentVerse ? ` آية ${progressStudent.currentVerse}` : ""}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProgressSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>نوع التسميع</Label>
              <Select 
                value={progressType} 
                onValueChange={async (v) => {
                  const newType = v as "0" | "1" | "2";
                  setProgressType(newType);
                  if (progressStudent) {
                    await loadProgressByType(progressStudent, newType);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      حفظ جديد
                    </span>
                  </SelectItem>
                  <SelectItem value="1">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      مراجعة
                    </span>
                  </SelectItem>
                  <SelectItem value="2">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      التثبيت
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {loadingProgressData && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  جاري تحميل البيانات...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>السورة</Label>
              <Select 
                value={selectedSurah} 
                onValueChange={setSelectedSurah} 
                disabled={progressType === "0" || loadingProgressData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر السورة" />
                </SelectTrigger>
                <SelectContent>
                  {progressType === "0" ? (
                    selectedSurah && (
                      <SelectItem value={selectedSurah}>
                        {selectedSurah}
                      </SelectItem>
                    )
                  ) : (
                    surahs.map((surah) => (
                      <SelectItem key={surah.id} value={surah.name}>
                        {surah.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>من آية</Label>
                <Select 
                  value={fromVerse} 
                  onValueChange={setFromVerse} 
                  disabled={progressType === "0" || loadingProgressData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الآية" />
                  </SelectTrigger>
                  <SelectContent>
                    {progressType === "0" ? (
                      fromVerse && (
                        <SelectItem value={fromVerse}>
                          {fromVerse}
                        </SelectItem>
                      )
                    ) : (
                      selectedSurah && Array.from(
                        { length: surahs.find(s => s.name === selectedSurah)?.versesCount || 0 },
                        (_, i) => i + 1
                      ).map((verse) => (
                        <SelectItem key={verse} value={verse.toString()}>
                          {verse}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>إلى آية</Label>
                <Select value={toVerse} onValueChange={setToVerse} disabled={!selectedSurah || !fromVerse}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الآية" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSurah && fromVerse && Array.from(
                      { length: (surahs.find(s => s.name === selectedSurah)?.versesCount || 0) - parseInt(fromVerse) + 1 },
                      (_, i) => parseInt(fromVerse) + i
                    ).map((verse) => (
                      <SelectItem key={verse} value={verse.toString()}>
                        {verse}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>التقييم</Label>
              <Select value={quality} onValueChange={(v) => setQuality(v as "0" | "1" | "2" | "3")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">ممتاز</SelectItem>
                  <SelectItem value="1">جيد جداً</SelectItem>
                  <SelectItem value="2">جيد</SelectItem>
                  <SelectItem value="3">مقبول</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات إضافية..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProgressStudent(null)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={!selectedSurah || !fromVerse || !toVerse}
                loading={submitting}
              >
                حفظ التسميع
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Memorization Dialog */}
      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل موضع الحفظ - {editStudent?.fullName}</DialogTitle>
            <DialogDescription>
              قم بتحديد الاتجاه والموضع الحالي للحفظ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اتجاه الحفظ</Label>
              <Select
                value={editDirection}
                onValueChange={(v) => setEditDirection(v as "Forward" | "Backward")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Forward">
                    <span className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4" />
                      من الفاتحة إلى الناس
                    </span>
                  </SelectItem>
                  <SelectItem value="Backward">
                    <span className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4" />
                      من الناس إلى الفاتحة
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>السورة الحالية</Label>
              <Select value={editSurah} onValueChange={setEditSurah}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر السورة" />
                </SelectTrigger>
                <SelectContent>
                  {surahs.map((surah) => (
                    <SelectItem key={surah.id} value={surah.id.toString()}>
                      {surah.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الآية الحالية</Label>
              <Select value={editVerse} onValueChange={setEditVerse} disabled={!editSurah}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الآية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - لم يبدأ بعد</SelectItem>
                  {editSurah && Array.from(
                    { length: surahs.find(s => s.id === parseInt(editSurah))?.versesCount || 0 },
                    (_, i) => i + 1
                  ).map((verse) => (
                    <SelectItem key={verse} value={verse.toString()}>
                      {verse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                اختر 0 إذا لم يبدأ الطالب بهذه السورة بعد
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStudent(null)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveMemorization} loading={saving}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Target Dialog */}
      <Dialog open={!!targetStudent} onOpenChange={() => setTargetStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              أهداف الطالب - {targetStudent?.fullName}
            </DialogTitle>
            <DialogDescription>
              حدد الأهداف اليومية للطالب. اتركها فارغة إذا لم تكن تستخدم نظام الأهداف.
            </DialogDescription>
          </DialogHeader>

          {loadingTarget ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
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
                    value={memorizationTarget}
                    onChange={(e) => setMemorizationTarget(convertArabicToEnglish(e.target.value))}
                    placeholder="عدد الأسطر"
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
                    value={revisionTarget}
                    onChange={(e) => setRevisionTarget(convertArabicToEnglish(e.target.value))}
                    placeholder="عدد الصفحات"
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
                    value={consolidationTarget}
                    onChange={(e) => setConsolidationTarget(convertArabicToEnglish(e.target.value))}
                    placeholder="عدد الصفحات"
                    className="text-center"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">صفحة</span>
                </div>
              </div>

              {targetData && (
                <p className="text-xs text-muted-foreground text-center">
                  آخر تحديث: {new Date(targetData.updatedAt).toLocaleDateString('ar-SA')}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {targetData && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemoveTarget}
                disabled={savingTarget}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                إزالة الأهداف
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTargetStudent(null)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSaveTarget}
                loading={savingTarget}
                className="flex-1"
              >
                حفظ الأهداف
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
