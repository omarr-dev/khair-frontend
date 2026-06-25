"use client";

import { useState, useEffect, useCallback } from "react";
import { studentApi, teachersApi } from "@/services";
import { StudentFilterParams } from "@/types/api";
import { Student, CreateStudentDto, UpdateStudentDto, StudentAssignment } from "@/types/student";
import { Teacher } from "@/types/teacher";
import { useAuth } from "@/components/providers";
import { useDebounce } from "@/hooks";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  UserCheck,
  Edit,
  Trash2,
  Eye,
  Loader2,
  User,
  Phone,
  IdCard,
  Calendar,
  UserCircle,
  BookOpen,
  GraduationCap,
  ArrowUpDown,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatSaudiPhoneNumber } from "@/lib/phone-formatter";
import { AxiosError } from "axios";
import { useManage } from "../manage-context";
import { FilterBar } from "../shared/filter-bar";
import { Pagination } from "../shared/pagination";

export function StudentsView() {
  const router = useRouter();
  const { halaqat, globalSearch } = useManage();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true); // first load only — list placeholder
  const [isFetching, setIsFetching] = useState(false); // refetch (search/filter) — dim in place
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [managingStudent, setManagingStudent] = useState<Student | null>(null);
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleteAssignmentDialogOpen, setIsDeleteAssignmentDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<StudentAssignment | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const { user } = useAuth();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [localSearch, setLocalSearch] = useState("");
  const [filterHalaqa, setFilterHalaqa] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  // Combined search (global + local)
  const effectiveSearch = globalSearch || localSearch;
  const debouncedSearch = useDebounce(effectiveSearch, 300);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [office, setOffice] = useState("");
  const [center, setCenter] = useState("");
  const [socialStatus, setSocialStatus] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [memorizationDirection, setMemorizationDirection] = useState<"Forward" | "Backward">("Forward");
  const [currentSurahNumber, setCurrentSurahNumber] = useState("1");
  const [currentVerse, setCurrentVerse] = useState("0");
  const [selectedHalaqa, setSelectedHalaqa] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  // Assignment form state
  const [assignHalaqa, setAssignHalaqa] = useState("");
  const [assignTeacher, setAssignTeacher] = useState("");

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ID-first add flow: "id" = enter ID, "existing" = match found, "new" = fill new student form
  const [addStep, setAddStep] = useState<"id" | "existing" | "new">("id");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [existingStudent, setExistingStudent] = useState<Student | null>(null);

  const handleNavigate = (studentId: number) => {
    setNavigatingTo(studentId.toString());
    router.push(`/my-students/${studentId}`);
  };

  const fetchStudents = useCallback(async () => {
    try {
      setIsFetching(true);

      const params: StudentFilterParams = {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        halaqaId: filterHalaqa !== "all" ? parseInt(filterHalaqa) : undefined,
        teacherId: filterTeacher !== "all" ? parseInt(filterTeacher) : undefined,
        sortBy: sortBy as "name" | "juz" | "createdAt",
        sortOrder: sortOrder as "asc" | "desc",
      };

      const response = await studentApi.getPaginated(params);
      setStudents(response.data.items);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("حدث خطأ أثناء تحميل الطلاب");
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filterHalaqa, filterTeacher, sortBy, sortOrder]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (selectedHalaqa) {
      fetchTeachersByHalaqa(parseInt(selectedHalaqa));
    } else {
      setTeachers([]);
      setSelectedTeacher("");
    }
  }, [selectedHalaqa]);

  useEffect(() => {
    if (assignHalaqa) {
      fetchTeachersByHalaqa(parseInt(assignHalaqa));
    }
  }, [assignHalaqa]);

  const fetchTeachersByHalaqa = async (halaqaId: number) => {
    try {
      const response = await teachersApi.getByHalaqa(halaqaId);
      setTeachers(response.data as Teacher[]);
    } catch (error) {
      console.error("Error fetching teachers by halaqa:", error);
      setTeachers([]);
    }
  };

  const fetchStudentAssignments = async (studentId: number) => {
    try {
      const response = await studentApi.getAssignments(studentId);
      setStudentAssignments(response.data);
    } catch (error) {
      console.error("Error fetching student assignments:", error);
      setStudentAssignments([]);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setGuardianName("");
    setGuardianPhone("");
    setPhone("");
    setIdNumber("");
    setNationality("");
    setOffice("");
    setCenter("");
    setSocialStatus("");
    setHealthStatus("");
    setMemorizationDirection("Forward");
    setCurrentSurahNumber("1");
    setCurrentVerse("0");
    setSelectedHalaqa("");
    setSelectedTeacher("");
    setEditingStudent(null);
    setAddStep("id");
    setExistingStudent(null);
    setLookupLoading(false);
  };

  const resetAssignmentForm = () => {
    setAssignHalaqa("");
    setAssignTeacher("");
  };

  const resetFilters = () => {
    setLocalSearch("");
    setFilterHalaqa("all");
    setFilterTeacher("all");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
  };

  const openManageAssignments = async (student: Student) => {
    setManagingStudent(student);
    await fetchStudentAssignments(student.id);
    setIsAssignmentDialogOpen(true);
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
      await fetchStudents();
      resetAssignmentForm();
    } catch (error) {
      console.error("Error adding assignment:", error);
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
      await fetchStudents();
      setIsDeleteAssignmentDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("حدث خطأ أثناء حذف التعيين");
    }
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setDateOfBirth(student.dateOfBirth || "");
    setGuardianName(student.guardianName || "");
    setGuardianPhone(student.guardianPhone || "");
    setPhone(student.phone || "");
    setIdNumber(student.idNumber || "");
    setNationality(student.nationality || "");
    setOffice(student.office || "");
    setCenter(student.center || "");
    setSocialStatus(student.socialStatus || "");
    setHealthStatus(student.healthStatus || "");
    setMemorizationDirection(student.memorizationDirection as "Forward" | "Backward");
    setCurrentSurahNumber(student.currentSurahNumber.toString());
    setCurrentVerse(student.currentVerse.toString());
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data: CreateStudentDto = {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || undefined,
        guardianName: guardianName || undefined,
        guardianPhone: guardianPhone || undefined,
        phone: phone || undefined,
        idNumber: idNumber || undefined,
        nationality: nationality || undefined,
        office: office || undefined,
        center: center || undefined,
        socialStatus: socialStatus || undefined,
        healthStatus: healthStatus || undefined,
        memorizationDirection,
        currentSurahNumber: parseInt(currentSurahNumber),
        currentVerse: parseInt(currentVerse),
        halaqaId: selectedHalaqa ? parseInt(selectedHalaqa) : undefined,
        teacherId: selectedTeacher ? parseInt(selectedTeacher) : undefined,
      };

      if (editingStudent) {
        const updateData: UpdateStudentDto = {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth || undefined,
          guardianName: guardianName || undefined,
          guardianPhone: guardianPhone || undefined,
          phone: phone || undefined,
          idNumber: idNumber || undefined,
          nationality: nationality || undefined,
          office: office || undefined,
          center: center || undefined,
          socialStatus: socialStatus || undefined,
          healthStatus: healthStatus || undefined,
        };
        await studentApi.update(editingStudent.id, updateData);
        toast.success("تم تحديث بيانات الطالب بنجاح");
      } else {
        await studentApi.create(data);
        toast.success("تم إضافة الطالب بنجاح");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error);
      const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      let errorMessage = "حدث خطأ أثناء حفظ بيانات الطالب";

      if (axiosError.response?.data) {
        const data = axiosError.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {
          const allErrors = Object.values(data.errors).flat();
          if (allErrors.length > 0) {
            errorMessage = allErrors.join("، ");
          }
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 of the add flow: check whether a student with this ID already exists
  const handleLookup = async () => {
    if (idNumber.length < 10) {
      toast.error("يرجى إدخال رقم هوية صحيح (10 أرقام)");
      return;
    }
    setLookupLoading(true);
    try {
      const response = await studentApi.lookupByIdNumber(idNumber);
      // Student already exists → go to the assign-to-halaqa step
      setExistingStudent(response.data);
      setSelectedHalaqa("");
      setSelectedTeacher("");
      setAddStep("existing");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        // No match → continue to the new-student form (ID stays pre-filled)
        setAddStep("new");
      } else {
        console.error("Error looking up student:", error);
        toast.error("حدث خطأ أثناء التحقق من رقم الهوية");
      }
    } finally {
      setLookupLoading(false);
    }
  };

  // Assign an already-existing student (found by ID) to a halaqa/teacher
  const handleAssignExisting = async () => {
    if (!existingStudent || !selectedHalaqa || !selectedTeacher) return;
    setIsSubmitting(true);
    try {
      await studentApi.assign({
        studentId: existingStudent.id,
        halaqaId: parseInt(selectedHalaqa),
        teacherId: parseInt(selectedTeacher),
      });
      toast.success("تم تعيين الطالب في الحلقة بنجاح");
      setIsDialogOpen(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      console.error("Error assigning existing student:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || "حدث خطأ أثناء تعيين الطالب");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;

    try {
      await studentApi.delete(studentToDelete.id);
      toast.success("تم حذف الطالب بنجاح");
      fetchStudents();
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("حدث خطأ أثناء حذف الطالب");
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMMM yyyy", { locale: ar });
  };

  const hasActiveFilters = localSearch !== "" || filterHalaqa !== "all" || filterTeacher !== "all";

  return (
    <div className="space-y-6">
      {/* Add Button */}
      {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
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
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة طالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  {editingStudent
                    ? "تعديل بيانات الطالب"
                    : addStep === "existing"
                    ? "الطالب مسجّل مسبقاً"
                    : "إضافة طالب جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingStudent
                    ? "قم بتحديث بيانات الطالب ثم احفظ التغييرات"
                    : addStep === "id"
                    ? "أدخل رقم هوية الطالب"
                    : addStep === "existing"
                    ? "هذا الطالب موجود بالفعل — يمكنك تعيينه في إحدى الحلقات مباشرة"
                    : "أدخل بيانات الطالب الجديد"}
                </DialogDescription>
              </DialogHeader>

              {/* Step 1: enter the ID number and check for an existing record */}
              {!editingStudent && addStep === "id" && (
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="lookupId" className="flex items-center gap-1">
                      رقم هوية الطالب
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lookupId"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleLookup();
                          }
                        }}
                        placeholder="١٠ أرقام"
                        dir="ltr"
                        className="pr-10 text-left"
                        maxLength={10}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      رقم الهوية مكوّن من ١٠ أرقام
                    </p>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                    <Button
                      type="button"
                      onClick={handleLookup}
                      disabled={lookupLoading || idNumber.length < 10}
                    >
                      {lookupLoading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جارٍ التحقق...
                        </>
                      ) : (
                        "تحقّق ومتابعة"
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {/* Step 2a: an existing student matched the ID → assign to a halaqa */}
              {!editingStudent && addStep === "existing" && existingStudent && (
                <div className="space-y-5 py-4">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <UserCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{existingStudent.fullName}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {existingStudent.idNumber}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {existingStudent.currentHalaqa && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{existingStudent.currentHalaqa}</span>
                        </div>
                      )}
                      {existingStudent.guardianName && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <UserCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{existingStudent.guardianName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>التعيين في الحلقة</span>
                    </div>
                    <div className="space-y-2">
                      <Label>الحلقة</Label>
                      <SearchableSelect
                        className="w-full"
                        options={halaqat}
                        value={selectedHalaqa}
                        onValueChange={setSelectedHalaqa}
                        placeholder="اختر الحلقة"
                        searchPlaceholder="ابحث عن حلقة..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المعلم</Label>
                      <Select
                        value={selectedTeacher}
                        onValueChange={setSelectedTeacher}
                        disabled={!selectedHalaqa}
                      >
                        <SelectTrigger className={!selectedHalaqa ? "opacity-60" : ""}>
                          <SelectValue placeholder={selectedHalaqa ? "اختر المعلم" : "اختر الحلقة أولاً"} />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setExistingStudent(null);
                        setAddStep("id");
                      }}
                      disabled={isSubmitting}
                    >
                      رجوع
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAssignExisting}
                      disabled={isSubmitting || !selectedHalaqa || !selectedTeacher}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جارٍ الإضافة...
                        </>
                      ) : (
                        "إضافة إلى الحلقة"
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {/* Step 2b: no match (or editing) → full student form */}
              {(editingStudent || addStep === "new") && (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
                  {/* Student Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>معلومات الطالب</span>
                    </div>
                    <div className="space-y-3 pr-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="flex items-center gap-1">
                            الاسم الأول
                            <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="مثال: أحمد"
                              required
                              className="pr-10"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="flex items-center gap-1">
                            اسم العائلة
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="مثال: العلي"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">تاريخ الميلاد</Label>
                          <div className="relative">
                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              id="dateOfBirth"
                              type="date"
                              value={dateOfBirth}
                              onChange={(e) => setDateOfBirth(e.target.value)}
                              className="pr-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="idNumber">رقم الهوية</Label>
                          <div className="relative">
                            <IdCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="idNumber"
                              value={idNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setIdNumber(value);
                              }}
                              placeholder=""
                              dir="ltr"
                              className="pr-10 text-left"
                              maxLength={10}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">رقم هاتف الطالب</Label>
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(formatSaudiPhoneNumber(e.target.value))}
                            placeholder="+966 5X XXX XXXX"
                            dir="ltr"
                            className="pr-10 text-left"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <IdCard className="h-4 w-4" />
                      <span>معلومات إضافية</span>
                    </div>
                    <div className="space-y-3 pr-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="nationality">الجنسية</Label>
                          <Input
                            id="nationality"
                            value={nationality}
                            onChange={(e) => setNationality(e.target.value)}
                            placeholder="مثال: سعودي"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="office">المكتب / القسم</Label>
                          <Input
                            id="office"
                            value={office}
                            onChange={(e) => setOffice(e.target.value)}
                            placeholder="مثال: القسم الرجالي"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="center">المجمع / المركز</Label>
                        <Input
                          id="center"
                          value={center}
                          onChange={(e) => setCenter(e.target.value)}
                          placeholder="اسم المجمع أو المركز"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="socialStatus">الحالة الاجتماعية</Label>
                          <Input
                            id="socialStatus"
                            value={socialStatus}
                            onChange={(e) => setSocialStatus(e.target.value)}
                            placeholder="مثال: طبيعي / محتاج"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="healthStatus">الحالة الصحية</Label>
                          <Input
                            id="healthStatus"
                            value={healthStatus}
                            onChange={(e) => setHealthStatus(e.target.value)}
                            placeholder="مثال: سليم"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guardian Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <UserCircle className="h-4 w-4" />
                      <span>معلومات ولي الأمر</span>
                    </div>
                    <div className="space-y-3 pr-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="guardianName">اسم ولي الأمر</Label>
                          <div className="relative">
                            <UserCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="guardianName"
                              value={guardianName}
                              onChange={(e) => setGuardianName(e.target.value)}
                              placeholder="مثال: محمد العلي"
                              className="pr-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guardianPhone">هاتف ولي الأمر</Label>
                          <div className="relative">
                            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="guardianPhone"
                              value={guardianPhone}
                              onChange={(e) => setGuardianPhone(formatSaudiPhoneNumber(e.target.value))}
                              placeholder="+966 5X XXX XXXX"
                              dir="ltr"
                              className="pr-10 text-left"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Memorization Settings Section - Only for new students */}
                  {!editingStudent && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>إعدادات الحفظ</span>
                      </div>
                      <div className="space-y-3 pr-6">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            اتجاه الحفظ
                          </Label>
                          <Select
                            value={memorizationDirection}
                            onValueChange={(v) => setMemorizationDirection(v as "Forward" | "Backward")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Forward">
                                <span className="flex items-center gap-2">من الفاتحة إلى الناس</span>
                              </SelectItem>
                              <SelectItem value="Backward">
                                <span className="flex items-center gap-2">من الناس إلى الفاتحة</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Halaqa Assignment Section - Only for new students */}
                  {!editingStudent && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        <span>التعيين في الحلقة</span>
                      </div>
                      <div className="space-y-3 pr-6">
                        <div className="space-y-2">
                          <Label htmlFor="halaqa">الحلقة</Label>
                          <SearchableSelect
                            className="w-full"
                            options={halaqat}
                            value={selectedHalaqa}
                            onValueChange={setSelectedHalaqa}
                            placeholder="اختر الحلقة (اختياري)"
                            searchPlaceholder="ابحث عن حلقة..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teacher">المعلم</Label>
                          <Select
                            value={selectedTeacher}
                            onValueChange={setSelectedTeacher}
                            disabled={!selectedHalaqa}
                          >
                            <SelectTrigger className={!selectedHalaqa ? "opacity-60" : ""}>
                              <SelectValue placeholder={selectedHalaqa ? "اختر المعلم" : "اختر الحلقة أولاً"} />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                  {teacher.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!selectedHalaqa && (
                            <p className="text-xs text-muted-foreground">
                              يجب اختيار الحلقة أولاً لعرض المعلمين المتاحين
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                  {!editingStudent ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddStep("id")}
                      disabled={isSubmitting}
                    >
                      رجوع
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                      disabled={isSubmitting}
                    >
                      إلغاء
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جارٍ الحفظ...
                      </>
                    ) : editingStudent ? (
                      "تحديث البيانات"
                    ) : (
                      "إضافة الطالب"
                    )}
                  </Button>
                </DialogFooter>
              </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Search and Filters */}
      <FilterBar
        searchTerm={localSearch}
        onSearchChange={(value) => {
          setLocalSearch(value);
          setPage(1);
        }}
        searchPlaceholder="البحث بالاسم أو رقم ولي الأمر..."
        halaqat={halaqat}
        filterHalaqa={filterHalaqa}
        onFilterHalaqaChange={(v) => {
          setFilterHalaqa(v);
          setPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={(v) => {
          setSortBy(v);
          setPage(1);
        }}
        sortByOptions={[
          { value: "name", label: "الاسم" },
          { value: "juz", label: "الأجزاء المحفوظة" },
          { value: "createdAt", label: "تاريخ التسجيل" },
        ]}
        sortOrder={sortOrder}
        onSortOrderChange={(v) => {
          setSortOrder(v);
          setPage(1);
        }}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>قائمة الطلاب</span>
            <Badge variant="secondary">{totalCount} طالب</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <div className="relative">
              {isFetching && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className={cn("transition-opacity", isFetching && "pointer-events-none opacity-50")}>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">لا يوجد طلاب</div>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                        navigatingTo === student.id.toString() && "opacity-70"
                      )}
                      onClick={() => handleNavigate(student.id)}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {navigatingTo === student.id.toString() ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          student.fullName.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{student.fullName}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {student.currentHalaqa && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <BookOpen className="h-2.5 w-2.5" />
                              {student.currentHalaqa}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            {student.juzMemorized.toFixed(1)} جزء
                          </Badge>
                        </div>
                        {student.teacherName && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            {student.teacherName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(student.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openManageAssignments(student); }}>
                                <BookOpen className="h-4 w-4 ml-2" />
                                حلقاته
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(student); }}>
                                <Edit className="h-4 w-4 ml-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); openDeleteDialog(student); }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>تاريخ الميلاد</TableHead>
                      <TableHead>ولي الأمر</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>الأجزاء المحفوظة</TableHead>
                      <TableHead>الحلقة</TableHead>
                      <TableHead>المعلم</TableHead>
                      {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
                        <TableHead>إجراءات</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          لا يوجد طلاب
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => (
                        <TableRow
                          key={student.id}
                          className={`cursor-pointer hover:bg-muted/50 ${navigatingTo === student.id.toString() ? "opacity-70" : ""}`}
                          onClick={() => handleNavigate(student.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {navigatingTo === student.id.toString() && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              {student.fullName}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(student.dateOfBirth)}</TableCell>
                          <TableCell>{student.guardianName || "-"}</TableCell>
                          <TableCell>{student.guardianPhone || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{student.juzMemorized.toFixed(1)} جزء</Badge>
                          </TableCell>
                          <TableCell>{student.currentHalaqa || "-"}</TableCell>
                          <TableCell>{student.teacherName || "-"}</TableCell>
                          {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate(student.id);
                                  }}
                                >
                                  <Eye className="h-4 w-4 ml-1" />
                                  تفاصيل
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openManageAssignments(student);
                                  }}
                                >
                                  حلقاته
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(student);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDialog(student);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                onPageChange={setPage}
              />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Assignments Dialog */}
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
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => openDeleteAssignmentDialog(assignment)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                    options={halaqat}
                    value={assignHalaqa}
                    onValueChange={setAssignHalaqa}
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
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.fullName}
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

      {/* Delete Student Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الطالب &quot;{studentToDelete?.fullName}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
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
