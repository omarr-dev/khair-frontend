"use client";

import { useEffect, useState } from "react";
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
import { halaqatApi, studentApi, teachersApi } from "@/services";
import { HalaqaHierarchy, TeacherInHalaqa, StudentInHalaqa } from "@/types/halaqa";
import { Student, StudentAssignment } from "@/types/student";
import { Teacher } from "@/types/teacher";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SearchableSelect } from "@/components/shared/searchable-select";
import { DaySelector, formatActiveDays } from "@/components/shared/day-selector";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useManage } from "../manage-context";

export function StructureView() {
  const router = useRouter();
  const { halaqatHierarchy, globalSearch, refreshHierarchy, halaqaStudents, loadHalaqaStudents } =
    useManage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHalaqa, setEditingHalaqa] = useState<HalaqaHierarchy | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [halaqaToDelete, setHalaqaToDelete] = useState<HalaqaHierarchy | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const { user } = useAuth();

  // Teacher action state
  const [isTeacherEditDialogOpen, setIsTeacherEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherInHalaqa | null>(null);
  const [teacherFullName, setTeacherFullName] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherIdNumber, setTeacherIdNumber] = useState("");
  const [teacherQualification, setTeacherQualification] = useState("");
  const [isTeacherSubmitting, setIsTeacherSubmitting] = useState(false);
  const [isTeacherDeleteDialogOpen, setIsTeacherDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherInHalaqa | null>(null);

  // Student action state
  const [isStudentEditDialogOpen, setIsStudentEditDialogOpen] = useState(false);
  const [editingStudentData, setEditingStudentData] = useState<Student | null>(null);
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [studentDateOfBirth, setStudentDateOfBirth] = useState("");
  const [studentGuardianName, setStudentGuardianName] = useState("");
  const [studentGuardianPhone, setStudentGuardianPhone] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [isStudentDeleteDialogOpen, setIsStudentDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentInHalaqa | null>(null);

  // Student assignments state
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [managingStudent, setManagingStudent] = useState<StudentInHalaqa | null>(null);
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);
  const [assignHalaqa, setAssignHalaqa] = useState("");
  const [assignTeacher, setAssignTeacher] = useState("");
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [isDeleteAssignmentDialogOpen, setIsDeleteAssignmentDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<StudentAssignment | null>(null);

  // Expanded state for halaqat and teachers — everything starts collapsed so
  // only halaqa headers are mounted; expanded content renders on demand
  const [expandedHalaqat, setExpandedHalaqat] = useState<Set<number>>(new Set());
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());

  const allExpanded =
    halaqatHierarchy.length > 0 && expandedHalaqat.size >= halaqatHierarchy.length;

  // "Expand all" opens halaqa headers only; student lists still load
  // per-teacher on demand to avoid fetching every halaqa at once
  const expandAll = () => {
    setExpandedHalaqat(new Set(halaqatHierarchy.map((h) => h.id)));
  };

  const collapseAll = () => {
    setExpandedHalaqat(new Set());
    setExpandedTeachers(new Set());
  };

  // Fetch students for any expanded teacher whose halaqa isn't loaded yet
  // (also re-fetches after refreshHierarchy clears the cache)
  useEffect(() => {
    const neededHalaqaIds = new Set<number>();
    expandedTeachers.forEach((key) => {
      const halaqaId = parseInt(key.split("-")[0], 10);
      if (!halaqaStudents.has(halaqaId)) {
        neededHalaqaIds.add(halaqaId);
      }
    });
    neededHalaqaIds.forEach((id) => loadHalaqaStudents(id));
  }, [expandedTeachers, halaqaStudents, loadHalaqaStudents]);

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

  // ---- Teacher Actions ----
  const openTeacherEditDialog = async (teacher: TeacherInHalaqa) => {
    setEditingTeacher(teacher);
    try {
      const response = await teachersApi.getById(teacher.id);
      const fullTeacher = response.data;
      setTeacherFullName(fullTeacher.fullName);
      setTeacherPhone(fullTeacher.phoneNumber || "");
      setTeacherEmail(fullTeacher.email || "");
      setTeacherIdNumber(fullTeacher.idNumber || "");
      setTeacherQualification(fullTeacher.qualification || "");
      setIsTeacherEditDialogOpen(true);
    } catch {
      toast.error("حدث خطأ أثناء جلب بيانات المعلم");
    }
  };

  const resetTeacherForm = () => {
    setTeacherFullName("");
    setTeacherPhone("");
    setTeacherEmail("");
    setTeacherIdNumber("");
    setTeacherQualification("");
    setEditingTeacher(null);
  };

  const handleTeacherEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setIsTeacherSubmitting(true);
    try {
      await teachersApi.update(editingTeacher.id, {
        fullName: teacherFullName,
        phoneNumber: teacherPhone || undefined,
        email: teacherEmail || undefined,
        idNumber: teacherIdNumber || undefined,
        qualification: teacherQualification || undefined,
      });
      toast.success("تم تحديث بيانات المعلم بنجاح");
      setIsTeacherEditDialogOpen(false);
      resetTeacherForm();
      refreshHierarchy();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "حدث خطأ أثناء تحديث بيانات المعلم");
    } finally {
      setIsTeacherSubmitting(false);
    }
  };

  const openTeacherDeleteDialog = (teacher: TeacherInHalaqa) => {
    setTeacherToDelete(teacher);
    setIsTeacherDeleteDialogOpen(true);
  };

  const handleTeacherDelete = async () => {
    if (!teacherToDelete) return;
    try {
      await teachersApi.delete(teacherToDelete.id);
      toast.success("تم حذف المعلم بنجاح");
      refreshHierarchy();
      setIsTeacherDeleteDialogOpen(false);
      setTeacherToDelete(null);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "حدث خطأ أثناء حذف المعلم");
    }
  };

  // ---- Student Actions ----
  const openStudentEditDialog = async (student: StudentInHalaqa) => {
    try {
      const response = await studentApi.getById(student.id);
      const fullStudent = response.data;
      setEditingStudentData(fullStudent);
      setStudentFirstName(fullStudent.firstName);
      setStudentLastName(fullStudent.lastName);
      setStudentDateOfBirth(fullStudent.dateOfBirth || "");
      setStudentGuardianName(fullStudent.guardianName || "");
      setStudentGuardianPhone(fullStudent.guardianPhone || "");
      setStudentPhone(fullStudent.phone || "");
      setStudentIdNumber(fullStudent.idNumber || "");
      setIsStudentEditDialogOpen(true);
    } catch {
      toast.error("حدث خطأ أثناء جلب بيانات الطالب");
    }
  };

  const resetStudentForm = () => {
    setStudentFirstName("");
    setStudentLastName("");
    setStudentDateOfBirth("");
    setStudentGuardianName("");
    setStudentGuardianPhone("");
    setStudentPhone("");
    setStudentIdNumber("");
    setEditingStudentData(null);
  };

  const handleStudentEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentData) return;
    setIsStudentSubmitting(true);
    try {
      await studentApi.update(editingStudentData.id, {
        firstName: studentFirstName,
        lastName: studentLastName,
        dateOfBirth: studentDateOfBirth || undefined,
        guardianName: studentGuardianName || undefined,
        guardianPhone: studentGuardianPhone || undefined,
        phone: studentPhone || undefined,
        idNumber: studentIdNumber || undefined,
      });
      toast.success("تم تحديث بيانات الطالب بنجاح");
      setIsStudentEditDialogOpen(false);
      resetStudentForm();
      refreshHierarchy();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "حدث خطأ أثناء تحديث بيانات الطالب");
    } finally {
      setIsStudentSubmitting(false);
    }
  };

  const openStudentDeleteDialog = (student: StudentInHalaqa) => {
    setStudentToDelete(student);
    setIsStudentDeleteDialogOpen(true);
  };

  const handleStudentDelete = async () => {
    if (!studentToDelete) return;
    try {
      await studentApi.delete(studentToDelete.id);
      toast.success("تم حذف الطالب بنجاح");
      refreshHierarchy();
      setIsStudentDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "حدث خطأ أثناء حذف الطالب");
    }
  };

  // ---- Student Assignments ----
  const fetchStudentAssignments = async (studentId: number) => {
    try {
      const response = await studentApi.getAssignments(studentId);
      setStudentAssignments(response.data);
    } catch {
      setStudentAssignments([]);
    }
  };

  const openManageAssignments = async (student: StudentInHalaqa) => {
    setManagingStudent(student);
    await fetchStudentAssignments(student.id);
    setIsAssignmentDialogOpen(true);
  };

  const fetchTeachersByHalaqa = async (halaqaId: number) => {
    try {
      const response = await teachersApi.getByHalaqa(halaqaId);
      setAvailableTeachers(response.data as Teacher[]);
    } catch {
      setAvailableTeachers([]);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingStudent || !assignHalaqa || !assignTeacher) return;
    try {
      await studentApi.assign({
        studentId: managingStudent.id,
        halaqaId: parseInt(assignHalaqa),
        teacherId: parseInt(assignTeacher),
      });
      toast.success("تم إضافة التعيين بنجاح");
      await fetchStudentAssignments(managingStudent.id);
      setAssignHalaqa("");
      setAssignTeacher("");
      refreshHierarchy();
    } catch {
      toast.error("حدث خطأ أثناء إضافة التعيين");
    }
  };

  const openDeleteAssignmentDialog = (assignment: StudentAssignment) => {
    setAssignmentToDelete(assignment);
    setIsDeleteAssignmentDialogOpen(true);
  };

  const handleDeleteAssignment = async () => {
    if (!managingStudent || !assignmentToDelete) return;
    try {
      await studentApi.deleteAssignment(
        assignmentToDelete.studentId,
        assignmentToDelete.halaqaId,
        assignmentToDelete.teacherId
      );
      toast.success("تم حذف التعيين بنجاح");
      await fetchStudentAssignments(managingStudent.id);
      setIsDeleteAssignmentDialogOpen(false);
      setAssignmentToDelete(null);
      refreshHierarchy();
    } catch {
      toast.error("حدث خطأ أثناء حذف التعيين");
    }
  };

  const toggleHalaqa = (halaqaId: number) => {
    const newExpanded = new Set(expandedHalaqat);
    if (newExpanded.has(halaqaId)) {
      newExpanded.delete(halaqaId);
    } else {
      newExpanded.add(halaqaId);
    }
    setExpandedHalaqat(newExpanded);
  };

  const toggleTeacher = (halaqaId: number, teacherId: number) => {
    const key = `${halaqaId}-${teacherId}`;
    const newExpanded = new Set(expandedTeachers);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      loadHalaqaStudents(halaqaId);
    }
    setExpandedTeachers(newExpanded);
  };

  // Filter halaqat based on global search (halaqa and teacher names; students
  // are searchable server-side in the Students tab)
  const filteredHalaqat = halaqatHierarchy.filter((halaqa) => {
    if (!globalSearch) return true;
    const searchLower = globalSearch.toLowerCase();
    if (halaqa.name.toLowerCase().includes(searchLower)) return true;
    if (halaqa.teachers.some((t) => t.fullName.toLowerCase().includes(searchLower))) return true;
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
              aria-expanded={expandedHalaqat.has(halaqa.id)}
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
                  {expandedHalaqat.has(halaqa.id) ? (
                    <ChevronUp className="h-5 w-5 text-primary" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-primary" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>

            {/* Level 2: Teachers — rendered only when the halaqa is expanded */}
            {expandedHalaqat.has(halaqa.id) && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
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
                          <div className="flex items-center gap-1">
                            {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
                              <>
                                <div className="hidden sm:flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTeacherEditDialog(teacher);
                                    }}
                                    aria-label={`تعديل ${teacher.fullName}`}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTeacherDeleteDialog(teacher);
                                    }}
                                    aria-label={`حذف ${teacher.fullName}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="sm:hidden h-7 w-7 p-0"
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label="خيارات المعلم"
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openTeacherEditDialog(teacher);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 ml-2" />
                                      تعديل
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openTeacherDeleteDialog(teacher);
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
                            {expandedTeachers.has(`${halaqa.id}-${teacher.id}`) ? (
                              <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Level 3: Students — fetched on demand per halaqa, rendered only when expanded */}
                      {expandedTeachers.has(`${halaqa.id}-${teacher.id}`) && (() => {
                        const loadedStudents = halaqaStudents.get(halaqa.id);
                        const teacherStudents = loadedStudents?.filter(
                          (s) => s.teacherId === teacher.id
                        );
                        return (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="space-y-1 pr-2 sm:pr-4 lg:pr-6 mr-2 sm:mr-4 border-r-2 border-secondary/30 mr-6 sm:mr-8">
                          {!loadedStudents ? (
                            <div className="p-3 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg mr-2 sm:mr-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              جارٍ تحميل الطلاب...
                            </div>
                          ) : !teacherStudents || teacherStudents.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center bg-muted/30 rounded-lg mr-2 sm:mr-4">
                              لا يوجد طلاب مسجلين لهذا المعلم
                            </div>
                          ) : (
                            teacherStudents.map((student) => (
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
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleNavigate(student.id);
                                        }}
                                        disabled={navigatingTo === student.id.toString()}
                                        aria-label="تفاصيل"
                                      >
                                        {navigatingTo === student.id.toString() ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>
                                      {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
                                        <>
                                          <div className="hidden sm:flex gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openManageAssignments(student);
                                              }}
                                              aria-label="حلقاته"
                                            >
                                              <BookOpen className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openStudentEditDialog(student);
                                              }}
                                              aria-label="تعديل"
                                            >
                                              <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openStudentDeleteDialog(student);
                                              }}
                                              aria-label="حذف"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="sm:hidden h-7 w-7 p-0"
                                                onClick={(e) => e.stopPropagation()}
                                                aria-label="خيارات الطالب"
                                              >
                                                <MoreVertical className="h-3.5 w-3.5" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openManageAssignments(student);
                                                }}
                                              >
                                                <BookOpen className="h-4 w-4 ml-2" />
                                                حلقاته
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openStudentEditDialog(student);
                                                }}
                                              >
                                                <Edit className="h-4 w-4 ml-2" />
                                                تعديل
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openStudentDeleteDialog(student);
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
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                        </div>
                        );
                      })()}
                    </div>
                  ))
                )}
              </div>
              </div>
            )}
          </div>
        ))}
        </>
      )}

      {/* Halaqa Delete Confirmation Dialog */}
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

      {/* Teacher Edit Dialog */}
      <Dialog
        open={isTeacherEditDialogOpen}
        onOpenChange={(open) => {
          setIsTeacherEditDialogOpen(open);
          if (!open) resetTeacherForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المعلم</DialogTitle>
            <DialogDescription>تعديل بيانات المعلم {editingTeacher?.fullName}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTeacherEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="teacherFullName">
                  الاسم الكامل
                  <span className="text-destructive mr-1">*</span>
                </Label>
                <Input
                  id="teacherFullName"
                  value={teacherFullName}
                  onChange={(e) => setTeacherFullName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherPhone">رقم الجوال</Label>
                <Input
                  id="teacherPhone"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  dir="ltr"
                  className="h-11 text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherEmail">البريد الإلكتروني</Label>
                <Input
                  id="teacherEmail"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  type="email"
                  dir="ltr"
                  className="h-11 text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherIdNumber">رقم الهوية</Label>
                <Input
                  id="teacherIdNumber"
                  value={teacherIdNumber}
                  onChange={(e) => setTeacherIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  dir="ltr"
                  className="h-11 text-left"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherQualification">المؤهل</Label>
                <Input
                  id="teacherQualification"
                  value={teacherQualification}
                  onChange={(e) => setTeacherQualification(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="submit" disabled={isTeacherSubmitting} className="w-full sm:w-auto">
                {isTeacherSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                تحديث
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Teacher Delete Confirmation Dialog */}
      <AlertDialog open={isTeacherDeleteDialogOpen} onOpenChange={setIsTeacherDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المعلم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المعلم &quot;{teacherToDelete?.fullName}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTeacherDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Edit Dialog */}
      <Dialog
        open={isStudentEditDialogOpen}
        onOpenChange={(open) => {
          setIsStudentEditDialogOpen(open);
          if (!open) resetStudentForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الطالب</DialogTitle>
            <DialogDescription>تعديل بيانات الطالب {editingStudentData?.fullName}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStudentEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentFirstName">
                    الاسم الأول
                    <span className="text-destructive mr-1">*</span>
                  </Label>
                  <Input
                    id="studentFirstName"
                    value={studentFirstName}
                    onChange={(e) => setStudentFirstName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentLastName">
                    الاسم الأخير
                    <span className="text-destructive mr-1">*</span>
                  </Label>
                  <Input
                    id="studentLastName"
                    value={studentLastName}
                    onChange={(e) => setStudentLastName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentDateOfBirth">تاريخ الميلاد</Label>
                <Input
                  id="studentDateOfBirth"
                  type="date"
                  value={studentDateOfBirth}
                  onChange={(e) => setStudentDateOfBirth(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentGuardianName">اسم ولي الأمر</Label>
                <Input
                  id="studentGuardianName"
                  value={studentGuardianName}
                  onChange={(e) => setStudentGuardianName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentGuardianPhone">رقم ولي الأمر</Label>
                <Input
                  id="studentGuardianPhone"
                  value={studentGuardianPhone}
                  onChange={(e) => setStudentGuardianPhone(e.target.value)}
                  dir="ltr"
                  className="h-11 text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentPhone">رقم هاتف الطالب</Label>
                <Input
                  id="studentPhone"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  dir="ltr"
                  className="h-11 text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentIdNumber">رقم الهوية</Label>
                <Input
                  id="studentIdNumber"
                  value={studentIdNumber}
                  onChange={(e) => setStudentIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  dir="ltr"
                  className="h-11 text-left"
                  maxLength={10}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="submit" disabled={isStudentSubmitting} className="w-full sm:w-auto">
                {isStudentSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                تحديث
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Student Delete Confirmation Dialog */}
      <AlertDialog open={isStudentDeleteDialogOpen} onOpenChange={setIsStudentDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الطالب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الطالب &quot;{studentToDelete?.fullName}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStudentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Assignments Management Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>إدارة تعيينات الطالب: {managingStudent?.fullName}</DialogTitle>
            <DialogDescription>يمكنك إضافة أو حذف تعيينات الطالب في الحلقات</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">التعيينات الحالية</h3>
              {studentAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد تعيينات</p>
              ) : (
                <div className="space-y-2">
                  {studentAssignments.map((assignment) => (
                    <div
                      key={`${assignment.halaqaId}-${assignment.teacherId}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{assignment.halaqaName}</p>
                        <p className="text-sm text-muted-foreground">المعلم: {assignment.teacherName}</p>
                        <Badge variant={assignment.isActive ? "default" : "secondary"} className="mt-1">
                          {assignment.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => openDeleteAssignmentDialog(assignment)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">إضافة تعيين جديد</h3>
              <form onSubmit={handleAddAssignment} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="assignHalaqa">الحلقة</Label>
                  <SearchableSelect
                    className="w-full"
                    options={halaqatHierarchy}
                    value={assignHalaqa}
                    onValueChange={(val) => {
                      setAssignHalaqa(val);
                      setAssignTeacher("");
                      fetchTeachersByHalaqa(Number(val));
                    }}
                    placeholder="اختر الحلقة"
                    searchPlaceholder="ابحث عن حلقة..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignTeacher">المعلم</Label>
                  <Select value={assignTeacher} onValueChange={setAssignTeacher} disabled={!assignHalaqa}>
                    <SelectTrigger>
                      <SelectValue placeholder={assignHalaqa ? "اختر المعلم" : "اختر الحلقة أولاً"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeachers.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={!assignHalaqa || !assignTeacher}>
                  إضافة التعيين
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Confirmation Dialog */}
      <AlertDialog open={isDeleteAssignmentDialogOpen} onOpenChange={setIsDeleteAssignmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف التعيين</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف تعيين الطالب &quot;{managingStudent?.fullName}&quot; من حلقة &quot;
              {assignmentToDelete?.halaqaName}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
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
