"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { halaqatApi } from "@/services";
import { HalaqaHierarchy } from "@/types/halaqa";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock,
  Edit,
  Eye,
  GraduationCap,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { DaySelector, formatActiveDays } from "@/components/shared/day-selector";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useManage } from "../manage-context";

export function StructureView() {
  const router = useRouter();
  const { halaqatHierarchy, globalSearch, refreshHierarchy } = useManage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHalaqa, setEditingHalaqa] = useState<HalaqaHierarchy | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [halaqaToDelete, setHalaqaToDelete] = useState<HalaqaHierarchy | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const { user } = useAuth();

  // Collapsed state for halaqat and teachers
  // Smart default: expand all when <=5 halaqat, collapse when >5
  const [collapsedHalaqat, setCollapsedHalaqat] = useState<Set<number>>(
    () => new Set(halaqatHierarchy.map((h) => h.id))
  );
  const [collapsedTeachers, setCollapsedTeachers] = useState<Set<string>>(
    () => {
      const teacherKeys: string[] = [];
      halaqatHierarchy.forEach((halaqa) => {
        halaqa.teachers.forEach((teacher) => {
          teacherKeys.push(`${halaqa.id}-${teacher.id}`);
        });
      });
      return new Set(teacherKeys);
    }
  );

  const allExpanded = collapsedHalaqat.size === 0 && collapsedTeachers.size === 0;

  const expandAll = () => {
    setCollapsedHalaqat(new Set());
    setCollapsedTeachers(new Set());
  };

  const collapseAll = () => {
    setCollapsedHalaqat(new Set(halaqatHierarchy.map((h) => h.id)));
    const teacherKeys: string[] = [];
    halaqatHierarchy.forEach((halaqa) => {
      halaqa.teachers.forEach((teacher) => {
        teacherKeys.push(`${halaqa.id}-${teacher.id}`);
      });
    });
    setCollapsedTeachers(new Set(teacherKeys));
  };

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [activeDays, setActiveDays] = useState("");

  const handleNavigate = (studentId: number) => {
    setNavigatingTo(studentId.toString());
    router.push(`/my-students/${studentId}`);
  };

  const resetForm = () => {
    setName("");
    setLocation("");
    setTimeSlot("");
    setActiveDays("");
    setEditingHalaqa(null);
  };

  const openEditDialog = (halaqa: HalaqaHierarchy) => {
    setEditingHalaqa(halaqa);
    setName(halaqa.name);
    setLocation(halaqa.location || "");
    setTimeSlot(halaqa.timeSlot || "");
    setActiveDays(halaqa.activeDays || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHalaqa) {
        await halaqatApi.update(editingHalaqa.id, {
          name,
          location: location || undefined,
          timeSlot: timeSlot || undefined,
          activeDays: activeDays || undefined,
          isActive: editingHalaqa.isActive,
        });
        toast.success("تم تحديث الحلقة بنجاح");
      } else {
        await halaqatApi.create({
          name,
          location: location || undefined,
          timeSlot: timeSlot || undefined,
          activeDays: activeDays || undefined,
        });
        toast.success("تم إضافة الحلقة بنجاح");
      }
      setIsDialogOpen(false);
      resetForm();
      refreshHierarchy();
    } catch (error) {
      console.error("Error saving halaqa:", error);
      toast.error("حدث خطأ أثناء حفظ الحلقة");
    }
  };

  const openDeleteDialog = (halaqa: HalaqaHierarchy) => {
    setHalaqaToDelete(halaqa);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!halaqaToDelete) return;

    try {
      await halaqatApi.delete(halaqaToDelete.id);
      toast.success("تم حذف الحلقة بنجاح");
      refreshHierarchy();
      setIsDeleteDialogOpen(false);
      setHalaqaToDelete(null);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "حدث خطأ أثناء الحذف");
    }
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

  // Filter halaqat based on global search
  const filteredHalaqat = halaqatHierarchy.filter((halaqa) => {
    if (!globalSearch) return true;
    const searchLower = globalSearch.toLowerCase();
    if (halaqa.name.toLowerCase().includes(searchLower)) return true;
    if (halaqa.teachers.some((t) => t.fullName.toLowerCase().includes(searchLower))) return true;
    if (halaqa.teachers.some((t) => t.students.some((s) => s.fullName.toLowerCase().includes(searchLower)))) return true;
    return false;
  });

  return (
    <div className="space-y-4">
      {/* Add Button */}
      {user?.role === "Supervisor" && (
        <div className="flex justify-end">
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة حلقة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingHalaqa ? "تعديل الحلقة" : "إضافة حلقة جديدة"}
                </DialogTitle>
                <DialogDescription>أدخل بيانات الحلقة ثم اضغط حفظ</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      اسم الحلقة
                      <span className="text-destructive mr-1" aria-label="مطلوب">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: حلقة النعمان بن مقرن"
                      required
                      className="h-11"
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">المكان</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="مثال: المسجد الإسراء"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeSlot">الوقت</Label>
                    <Input
                      id="timeSlot"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      placeholder="مثال: المغرب"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>أيام الحلقة النشطة</Label>
                    <DaySelector selectedDays={activeDays} onChange={setActiveDays} />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    {editingHalaqa ? "تحديث" : "حفظ"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Hierarchical Tree View */}
      {filteredHalaqat.length === 0 ? (
        <EmptyState
          icon={globalSearch ? Search : BookOpen}
          title={globalSearch ? "لا توجد نتائج للبحث" : "لا توجد حلقات"}
          description={globalSearch ? "حاول البحث بكلمات مختلفة" : "ابدأ بإضافة حلقة جديدة"}
          action={
            !globalSearch && user?.role === "Supervisor"
              ? { label: "إضافة حلقة جديدة", onClick: () => setIsDialogOpen(true) }
              : undefined
          }
        />
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={allExpanded ? collapseAll : expandAll}
              className="gap-1.5 text-muted-foreground"
            >
              {allExpanded ? (
                <>
                  <ChevronsDownUp className="h-4 w-4" />
                  طي الكل
                </>
              ) : (
                <>
                  <ChevronsUpDown className="h-4 w-4" />
                  توسيع الكل
                </>
              )}
            </Button>
          </div>
          {filteredHalaqat.map((halaqa) => (
          <div key={halaqa.id} className="space-y-2">
            {/* Level 1: Halaqa Header */}
            <div
              className={cn(
                "flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors",
                "bg-primary/5 border-primary/20 hover:bg-primary/10"
              )}
              onClick={() => toggleHalaqa(halaqa.id)}
              role="button"
              tabIndex={0}
              aria-expanded={!collapsedHalaqat.has(halaqa.id)}
              aria-label={`حلقة ${halaqa.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleHalaqa(halaqa.id);
                }
              }}
            >
              <div className="flex items-center gap-3 flex-1 w-full">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg sm:text-xl font-bold">{halaqa.name}</h2>
                    {!halaqa.isActive && (
                      <Badge variant="secondary" className="text-xs">غير نشط</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    {halaqa.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{halaqa.location}</span>
                      </span>
                    )}
                    {halaqa.timeSlot && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {halaqa.timeSlot}
                      </span>
                    )}
                    {halaqa.activeDays && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        {formatActiveDays(halaqa.activeDays)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <UserCheck className="h-3 w-3" />
                    {halaqa.teacherCount} معلم
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    {halaqa.studentCount} طالب
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {user?.role === "Supervisor" && (
                    <>
                      <div className="hidden sm:flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(halaqa);
                          }}
                          aria-label={`تعديل ${halaqa.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(halaqa);
                          }}
                          aria-label={`حذف ${halaqa.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="sm:hidden h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="خيارات الحلقة"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(halaqa);
                            }}
                          >
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(halaqa);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                  {collapsedHalaqat.has(halaqa.id) ? (
                    <ChevronDown className="h-5 w-5 text-primary" aria-hidden="true" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-primary" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>

            {/* Level 2: Teachers */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: collapsedHalaqat.has(halaqa.id) ? "0fr" : "1fr" }}
            >
              <div className="overflow-hidden">
              <div className="space-y-2 pr-2 sm:pr-4 lg:pr-6 border-r-2 border-primary/15 mr-4 sm:mr-5">
                {halaqa.teachers.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center bg-muted/50 rounded-lg mr-2 sm:mr-4">
                    لا يوجد معلمين في هذه الحلقة
                  </div>
                ) : (
                  halaqa.teachers.map((teacher) => (
                    <div key={teacher.id} className="space-y-2">
                      <div
                        className={cn(
                          "flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border cursor-pointer transition-colors mr-2 sm:mr-4",
                          "bg-secondary/30 border-secondary/50 hover:bg-secondary/50"
                        )}
                        onClick={() => toggleTeacher(halaqa.id, teacher.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 w-full">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <UserCheck className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">المعلم {teacher.fullName}</h3>
                            {teacher.phoneNumber && (
                              <p className="hidden sm:block text-sm text-muted-foreground" dir="ltr">
                                {teacher.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Users className="h-3 w-3" />
                            {teacher.studentCount} طالب
                          </Badge>
                          <div>
                            {collapsedTeachers.has(`${halaqa.id}-${teacher.id}`) ? (
                              <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Level 3: Students */}
                      <div
                        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                        style={{ gridTemplateRows: collapsedTeachers.has(`${halaqa.id}-${teacher.id}`) ? "0fr" : "1fr" }}
                      >
                        <div className="overflow-hidden">
                        <div className="space-y-1 pr-2 sm:pr-4 lg:pr-6 mr-2 sm:mr-4 border-r-2 border-secondary/30 mr-6 sm:mr-8">
                          {teacher.students.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center bg-muted/30 rounded-lg mr-2 sm:mr-4">
                              لا يوجد طلاب مسجلين لهذا المعلم
                            </div>
                          ) : (
                            teacher.students.map((student) => (
                              <Card
                                key={student.id}
                                className={`mr-2 sm:mr-4 cursor-pointer hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-primary ${navigatingTo === student.id.toString() ? "opacity-70" : ""}`}
                                onClick={() => handleNavigate(student.id)}
                                role="button"
                                tabIndex={0}
                                aria-label={`عرض تفاصيل الطالب ${student.fullName}`}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleNavigate(student.id);
                                  }
                                }}
                              >
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                                        {navigatingTo === student.id.toString() ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          student.fullName.charAt(0)
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                          <span className="font-medium truncate">{student.fullName}</span>
                                          <Badge
                                            variant={student.memorizationDirection === "Forward" ? "default" : "secondary"}
                                            className="text-xs self-start sm:self-auto"
                                          >
                                            {student.memorizationDirection === "Forward" ? (
                                              <ArrowDown className="h-2 w-2 ml-1" />
                                            ) : (
                                              <ArrowUp className="h-2 w-2 ml-1" />
                                            )}
                                            {student.memorizationDirection === "Forward" ? "من الفاتحة" : "من الناس"}
                                          </Badge>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <BookOpen className="h-3 w-3 shrink-0" />
                                            <span className="truncate">
                                              {student.currentSurahName || "الفاتحة"}
                                              {student.currentVerse > 0 && ` - آية ${student.currentVerse}`}
                                            </span>
                                          </span>
                                          <span className="flex items-center gap-1 shrink-0">
                                            <GraduationCap className="h-3 w-3" />
                                            {student.juzMemorized.toFixed(1)} جزء
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex justify-end">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleNavigate(student.id);
                                        }}
                                        disabled={navigatingTo === student.id.toString()}
                                      >
                                        {navigatingTo === student.id.toString() ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            </div>
          </div>
        ))}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الحلقة &quot;{halaqaToDelete?.name}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
