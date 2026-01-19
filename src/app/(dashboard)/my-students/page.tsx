"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { studentApi, progressApi } from "@/services";
import { Student, UpdateMemorizationDto } from "@/types/student";
import { CreateProgressRecord, ProgressRecord } from "@/types/progress";
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
  X,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

// Helper function to get surah name by number
const getSurahName = (number: number) => {
  const surah = surahs.find((s) => s.id === number);
  return surah?.name || "غير محدد";
};

// Group students by Halaqa
interface HalaqaGroup {
  halaqaName: string;
  students: Student[];
}

export default function MyStudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedHalaqas, setCollapsedHalaqas] = useState<Set<string>>(new Set());
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Progress form state
  const [progressStudent, setProgressStudent] = useState<Student | null>(null);
  const [progressType, setProgressType] = useState<"0" | "1" | "2">("0");
  const [selectedSurah, setSelectedSurah] = useState("");
  const [fromVerse, setFromVerse] = useState("");
  const [toVerse, setToVerse] = useState("");
  const [quality, setQuality] = useState<"0" | "1" | "2" | "3">("0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit memorization dialog state
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editDirection, setEditDirection] = useState<"Forward" | "Backward">("Forward");
  const [editSurah, setEditSurah] = useState("");
  const [editVerse, setEditVerse] = useState("");
  const [saving, setSaving] = useState(false);

  const handleNavigate = (studentId: string | number) => {
    setNavigatingTo(studentId.toString());
    router.push(`/my-students/${studentId}`);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Clear toVerse when fromVerse changes if toVerse is now invalid
  useEffect(() => {
    if (fromVerse && toVerse && parseInt(toVerse) < parseInt(fromVerse)) {
      setToVerse("");
    }
  }, [fromVerse]);

  const fetchStudents = async (preserveScroll = false) => {
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
  };

  const filteredStudents = students.filter((student) =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group students by their Halaqa
  const groupedStudents: HalaqaGroup[] = filteredStudents.reduce((groups, student) => {
    const halaqaName = student.currentHalaqa || "بدون حلقة";
    let group = groups.find(g => g.halaqaName === halaqaName);

    if (!group) {
      group = { halaqaName, students: [] };
      groups.push(group);
    }

    group.students.push(student);
    return groups;
  }, [] as HalaqaGroup[]);

  const toggleHalaqa = (halaqaName: string) => {
    const newCollapsed = new Set(collapsedHalaqas);
    if (newCollapsed.has(halaqaName)) {
      newCollapsed.delete(halaqaName);
    } else {
      newCollapsed.add(halaqaName);
    }
    setCollapsedHalaqas(newCollapsed);
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
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

      // Reset form
      setProgressStudent(null);
      setSelectedSurah("");
      setFromVerse("");
      setToVerse("");
      setNotes("");

      // Refresh students to get updated positions (preserve scroll)
      fetchStudents(true);
    } catch (error: any) {
      console.error("Error creating progress:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء حفظ التسميع");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMemorization = (student: Student) => {
    setEditStudent(student);
    setEditDirection(student.memorizationDirection);
    setEditSurah(student.currentSurahNumber.toString());
    setEditVerse(student.currentVerse.toString());
  };

  const handleSaveMemorization = async () => {
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
  };

  const openProgressForm = (student: Student) => {
    setProgressStudent(student);
    // Pre-select the current surah for convenience
    const currentSurah = surahs.find((s) => s.id === student.currentSurahNumber);
    if (currentSurah) {
      setSelectedSurah(currentSurah.name);
      // Pre-fill fromVerse with currentVerse + 1 (the next verse to memorize)
      const startVerse = student.currentVerse + 1;
      if (startVerse <= currentSurah.versesCount) {
        setFromVerse(startVerse.toString());
      }
    }
  };

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
                {collapsedHalaqas.has(group.halaqaName) ? (
                  <ChevronDown className="h-5 w-5 text-primary" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-primary" />
                )}
              </div>

              {/* Students in this Halaqa */}
              {!collapsedHalaqas.has(group.halaqaName) && (
                <div className="space-y-2 pr-4">
                  {group.students.map((student) => (
                    <Card
                      key={student.id}
                      className="transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
                    >
                      <CardContent className="p-4">
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
                              onClick={() => openProgressForm(student)}
                              className="flex-1 sm:flex-none"
                            >
                              <GraduationCap className="h-4 w-4 ml-2" />
                              <span className="hidden sm:inline">تسجيل تسميع</span>
                              <span className="sm:hidden">تسميع</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
              <Select value={progressType} onValueChange={(v) => setProgressType(v as "0" | "1" | "2")}>
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
            </div>

            <div className="space-y-2">
              <Label>السورة</Label>
              <Select value={selectedSurah} onValueChange={setSelectedSurah} disabled={true}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر السورة" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSurah && (
                    <SelectItem value={selectedSurah}>
                      {selectedSurah}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>من آية</Label>
                <Select value={fromVerse} onValueChange={setFromVerse} disabled={true}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الآية" />
                  </SelectTrigger>
                  <SelectContent>
                    {fromVerse && (
                      <SelectItem value={fromVerse}>
                        {fromVerse}
                      </SelectItem>
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
    </div>
  );
}

