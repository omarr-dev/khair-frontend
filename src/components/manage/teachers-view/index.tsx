"use client";

import { useState, useEffect, useCallback } from "react";
import { teachersApi } from "@/services";
import { TeacherFilterParams } from "@/types/api";
import { Teacher, TeacherHalaqa } from "@/types/teacher";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSaudiPhoneNumber } from "@/lib/phone-formatter";
import { cn } from "@/lib/utils";
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
  UserPlus,
  Edit,
  Trash2,
  Users,
  BookOpen,
  Award,
  Phone,
  Mail,
  IdCard,
  Plus,
  List,
  X,
  Loader2,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useManage } from "../manage-context";
import { FilterBar } from "../shared/filter-bar";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Pagination } from "../shared/pagination";

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function TeachersView() {
  const { halaqat, globalSearch } = useManage();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true); // first load only — list placeholder
  const [isFetching, setIsFetching] = useState(false); // refetch (search/filter) — dim in place
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isManageHalaqatDialogOpen, setIsManageHalaqatDialogOpen] = useState(false);
  const [selectedTeacherForHalaqat, setSelectedTeacherForHalaqat] = useState<Teacher | null>(null);
  const [teacherHalaqat, setTeacherHalaqat] = useState<TeacherHalaqa[]>([]);
  const [isLoadingHalaqat, setIsLoadingHalaqat] = useState(false);
  const [isRemoveHalaqaDialogOpen, setIsRemoveHalaqaDialogOpen] = useState(false);
  const [halaqaToRemove, setHalaqaToRemove] = useState<TeacherHalaqa | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const { user } = useAuth();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [localSearch, setLocalSearch] = useState("");
  const [filterHalaqa, setFilterHalaqa] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  // Combined search
  const effectiveSearch = globalSearch || localSearch;
  const debouncedSearch = useDebounceValue(effectiveSearch, 300);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [qualification, setQualification] = useState("");
  const [nationality, setNationality] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [contractType, setContractType] = useState("");
  const [payrollGroup, setPayrollGroup] = useState("");
  const [selectedHalaqa, setSelectedHalaqa] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      setIsFetching(true);

      const params: TeacherFilterParams = {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        halaqaId: filterHalaqa !== "all" ? parseInt(filterHalaqa) : undefined,
        sortBy: sortBy as "name" | "studentsCount" | "halaqatCount" | "joinDate",
        sortOrder: sortOrder as "asc" | "desc",
      };

      const response = await teachersApi.getPaginated(params);
      setTeachers(response.data.items);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("حدث خطأ أثناء تحميل المعلمين");
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filterHalaqa, sortBy, sortOrder]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const resetForm = () => {
    setFullName("");
    setPhoneNumber("");
    setEmail("");
    setIdNumber("");
    setQualification("");
    setNationality("");
    setJobTitle("");
    setContractType("");
    setPayrollGroup("");
    setEditingTeacher(null);
    setValidationErrors({});
  };

  const resetHalaqaForm = () => {
    setSelectedHalaqa("");
  };

  const resetFilters = () => {
    setLocalSearch("");
    setFilterHalaqa("all");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
  };

  const openManageHalaqatDialog = async (teacher: Teacher) => {
    setSelectedTeacherForHalaqat(teacher);
    setIsManageHalaqatDialogOpen(true);
    setIsLoadingHalaqat(true);
    try {
      const response = await teachersApi.getHalaqat(teacher.id);
      setTeacherHalaqat(response.data);
    } catch (error) {
      console.error("Error fetching teacher halaqat:", error);
      toast.error("حدث خطأ أثناء جلب حلقات المعلم");
    } finally {
      setIsLoadingHalaqat(false);
    }
  };

  const closeManageHalaqatDialog = () => {
    setIsManageHalaqatDialogOpen(false);
    setSelectedTeacherForHalaqat(null);
    setTeacherHalaqat([]);
    resetHalaqaForm();
  };

  const openRemoveHalaqaDialog = (halaqa: TeacherHalaqa) => {
    setHalaqaToRemove(halaqa);
    setIsRemoveHalaqaDialogOpen(true);
  };

  const handleRemoveFromHalaqa = async () => {
    if (!selectedTeacherForHalaqat || !halaqaToRemove) return;

    try {
      await teachersApi.removeFromHalaqa(selectedTeacherForHalaqat.id, halaqaToRemove.halaqaId);
      toast.success("تم إزالة المعلم من الحلقة بنجاح");
      setIsRemoveHalaqaDialogOpen(false);
      setHalaqaToRemove(null);
      const response = await teachersApi.getHalaqat(selectedTeacherForHalaqat.id);
      setTeacherHalaqat(response.data);
      fetchTeachers();
    } catch (error) {
      console.error("Error removing teacher from halaqa:", error);
      toast.error("حدث خطأ أثناء إزالة المعلم من الحلقة");
    }
  };

  const handleAssignToHalaqa = async () => {
    if (!selectedTeacherForHalaqat || !selectedHalaqa) return;

    setIsAssigning(true);
    try {
      await teachersApi.assignToHalaqa(selectedTeacherForHalaqat.id, parseInt(selectedHalaqa));
      toast.success("تم تعيين المعلم في الحلقة بنجاح");
      resetHalaqaForm();
      const response = await teachersApi.getHalaqat(selectedTeacherForHalaqat.id);
      setTeacherHalaqat(response.data);
      fetchTeachers();
    } catch (error: unknown) {
      console.error("Error assigning teacher to halaqa:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || "حدث خطأ أثناء تعيين المعلم";
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatSaudiPhoneNumber(e.target.value);
    setPhoneNumber(formattedValue);
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFullName(teacher.fullName);
    setPhoneNumber(teacher.phoneNumber || "");
    setEmail(teacher.email || "");
    setIdNumber(teacher.idNumber || "");
    setQualification(teacher.qualification || "");
    setNationality(teacher.nationality || "");
    setJobTitle(teacher.jobTitle || "");
    setContractType(teacher.contractType || "");
    setPayrollGroup(teacher.payrollGroup || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTeacher) {
        await teachersApi.update(editingTeacher.id, {
          fullName,
          phoneNumber: phoneNumber || undefined,
          email: email || undefined,
          idNumber: idNumber || undefined,
          qualification: qualification || undefined,
          nationality: nationality || undefined,
          jobTitle: jobTitle || undefined,
          contractType: contractType || undefined,
          payrollGroup: payrollGroup || undefined,
        });
        toast.success("تم تحديث بيانات المعلم بنجاح");
      } else {
        await teachersApi.create({
          phoneNumber,
          fullName,
          email: email || undefined,
          idNumber: idNumber || undefined,
          qualification: qualification || undefined,
          nationality: nationality || undefined,
          jobTitle: jobTitle || undefined,
          contractType: contractType || undefined,
          payrollGroup: payrollGroup || undefined,
        });
        toast.success("تم إضافة المعلم بنجاح");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchTeachers();
    } catch (error: unknown) {
      console.error("Error saving teacher:", error);

      const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> }; status?: number } };
      const responseData = axiosError.response?.data;
      const statusCode = axiosError.response?.status;

      if (statusCode === 400 && responseData?.errors) {
        setValidationErrors(responseData.errors);
        toast.error("يرجى التأكد من صحة البيانات المدخلة");
        return;
      }

      if (statusCode === 400 && responseData?.message) {
        const message = responseData.message;

        if (message.includes("مستخدم بالفعل") || message.includes("already")) {
          setValidationErrors({ PhoneNumber: ["رقم الجوال مسجل مسبقاً لمعلم آخر. يرجى استخدام رقم مختلف."] });
          toast.error("رقم الجوال مسجل مسبقاً", {
            description: "هذا الرقم مستخدم بالفعل لمعلم آخر في النظام",
          });
          return;
        }

        if (message.includes("رقم الجوال يجب") || message.includes("سعودي")) {
          setValidationErrors({ PhoneNumber: [message] });
          toast.error("رقم الجوال غير صالح", { description: message });
          return;
        }

        toast.error(message);
        return;
      }

      toast.error("حدث خطأ أثناء حفظ بيانات المعلم", {
        description: "يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;

    try {
      await teachersApi.delete(teacherToDelete.id);
      toast.success("تم حذف المعلم بنجاح");
      fetchTeachers();
      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("حدث خطأ أثناء حذف المعلم");
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMMM yyyy", { locale: ar });
  };

  const hasActiveFilters = localSearch !== "" || filterHalaqa !== "all";

  return (
    <div className="space-y-6">
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
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة معلم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  {editingTeacher ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
                  {/* Basic Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>المعلومات الأساسية</span>
                    </div>
                    <div className="space-y-3 pr-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-1">
                          الاسم الكامل
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => {
                              setFullName(e.target.value);
                              if (validationErrors.FullName) {
                                setValidationErrors({ ...validationErrors, FullName: [] });
                              }
                            }}
                            placeholder="مثال: أحمد محمد العلي"
                            required
                            className={`pr-10 ${validationErrors.FullName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            autoFocus
                          />
                        </div>
                        {validationErrors.FullName && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {validationErrors.FullName[0]}
                          </p>
                        )}
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
                              if (validationErrors.IdNumber) {
                                setValidationErrors({ ...validationErrors, IdNumber: [] });
                              }
                            }}
                            placeholder=""
                            dir="ltr"
                            className={`pr-10 text-left ${validationErrors.IdNumber ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            maxLength={10}
                          />
                        </div>
                        {validationErrors.IdNumber && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {validationErrors.IdNumber[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>معلومات التواصل</span>
                    </div>
                    <div className="space-y-3 pr-6">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                          رقم الجوال
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => {
                              handlePhoneNumberChange(e);
                              if (validationErrors.PhoneNumber) {
                                setValidationErrors({ ...validationErrors, PhoneNumber: [] });
                              }
                            }}
                            placeholder="+966 5X XXX XXXX"
                            required
                            dir="ltr"
                            className={`pr-10 text-left ${validationErrors.PhoneNumber ? "border-destructive focus-visible:ring-destructive" : ""}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          سيتم استخدام هذا الرقم لتسجيل دخول المعلم
                        </p>
                        {validationErrors.PhoneNumber && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {validationErrors.PhoneNumber[0]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (validationErrors.Email) {
                                setValidationErrors({ ...validationErrors, Email: [] });
                              }
                            }}
                            placeholder="example@email.com"
                            dir="ltr"
                            className={`pr-10 text-left ${validationErrors.Email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                          />
                        </div>
                        {validationErrors.Email && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {validationErrors.Email[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Qualification Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>المؤهلات</span>
                    </div>
                    <div className="space-y-3 pr-6">
                      <div className="space-y-2">
                        <Label htmlFor="qualification">المؤهل</Label>
                        <div className="relative">
                          <Award className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="qualification"
                            value={qualification}
                            onChange={(e) => {
                              setQualification(e.target.value);
                              if (validationErrors.Qualification) {
                                setValidationErrors({ ...validationErrors, Qualification: [] });
                              }
                            }}
                            placeholder="مثال: إجازة في القراءات العشر"
                            className={`pr-10 ${validationErrors.Qualification ? "border-destructive focus-visible:ring-destructive" : ""}`}
                          />
                        </div>
                        {validationErrors.Qualification && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {validationErrors.Qualification[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Administrative Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <IdCard className="h-4 w-4" />
                      <span>معلومات إدارية</span>
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
                          <Label htmlFor="jobTitle">المسمى الوظيفي</Label>
                          <Input
                            id="jobTitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="مثال: معلم"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="contractType">نوع العقد</Label>
                          <Input
                            id="contractType"
                            value={contractType}
                            onChange={(e) => setContractType(e.target.value)}
                            placeholder="مثال: متعاون"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payrollGroup">المسير</Label>
                          <Input
                            id="payrollGroup"
                            value={payrollGroup}
                            onChange={(e) => setPayrollGroup(e.target.value)}
                            placeholder="اسم المسير / القطاع"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جارٍ الحفظ...
                      </>
                    ) : editingTeacher ? (
                      "تحديث البيانات"
                    ) : (
                      "إضافة المعلم"
                    )}
                  </Button>
                </DialogFooter>
              </form>
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
        searchPlaceholder="البحث بالاسم أو رقم الهاتف..."
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
          { value: "studentsCount", label: "عدد الطلاب" },
          { value: "halaqatCount", label: "عدد الحلقات" },
          { value: "joinDate", label: "تاريخ الانضمام" },
        ]}
        sortOrder={sortOrder}
        onSortOrderChange={(v) => {
          setSortOrder(v);
          setPage(1);
        }}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Teachers Grid */}
      <div className="relative">
        {isFetching && !loading && (
          <div className="absolute inset-0 z-10 flex items-start justify-center pt-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div
          className={cn(
            "grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-opacity",
            isFetching && !loading && "pointer-events-none opacity-50"
          )}
        >
        {loading ? (
          <div className="col-span-full text-center py-8">جاري التحميل...</div>
        ) : teachers.length === 0 ? (
          <div className="col-span-full text-center py-8">لا يوجد معلمين</div>
        ) : (
          teachers.map((teacher) => (
            <Card key={teacher.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{teacher.fullName}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">انضم في {formatDate(teacher.joinDate)}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openManageHalaqatDialog(teacher)} title="إدارة الحلقات">
                      <List className="h-4 w-4" />
                    </Button>
                    {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(teacher)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => openDeleteDialog(teacher)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {teacher.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span dir="ltr">{teacher.email}</span>
                  </div>
                )}
                {teacher.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span dir="ltr">{teacher.phoneNumber}</span>
                  </div>
                )}
                {teacher.idNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <span dir="ltr">{teacher.idNumber}</span>
                  </div>
                )}
                {teacher.qualification && (
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span>{teacher.qualification}</span>
                  </div>
                )}
                {teacher.jobTitle && (
                  <div className="flex items-center gap-2 text-sm">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <span>{teacher.jobTitle}</span>
                  </div>
                )}
                {teacher.nationality && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>الجنسية: {teacher.nationality}</span>
                  </div>
                )}
                {teacher.contractType && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>نوع العقد: {teacher.contractType}</span>
                  </div>
                )}
                {teacher.payrollGroup && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>المسير: {teacher.payrollGroup}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Badge variant="secondary">
                    <BookOpen className="h-3 w-3 ml-1" />
                    {teacher.halaqatCount} حلقة
                  </Badge>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 ml-1" />
                    {teacher.studentsCount} طالب
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        </div>
      </div>

      {/* Pagination */}
      <Pagination page={page} pageSize={pageSize} totalCount={totalCount} totalPages={totalPages} onPageChange={setPage} />

      {/* Combined Manage Halaqat Dialog */}
      <Dialog
        open={isManageHalaqatDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeManageHalaqatDialog();
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              إدارة حلقات المعلم
            </DialogTitle>
            <DialogDescription>{selectedTeacherForHalaqat?.fullName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Halaqat Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <List className="h-4 w-4 text-muted-foreground" />
                  الحلقات الحالية
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {teacherHalaqat.length} حلقة
                </Badge>
              </div>

              <div className="border rounded-lg divide-y max-h-[250px] overflow-y-auto">
                {isLoadingHalaqat ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="mr-2 text-sm text-muted-foreground">جاري التحميل...</span>
                  </div>
                ) : teacherHalaqat.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">لا توجد حلقات معينة</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">قم بإضافة حلقة من القائمة أدناه</p>
                  </div>
                ) : (
                  teacherHalaqat.map((halaqa) => (
                    <div
                      key={halaqa.halaqaId}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{halaqa.halaqaName}</p>
                          <p className="text-xs text-muted-foreground">
                            منذ {format(new Date(halaqa.assignedDate), "dd MMMM yyyy", { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {halaqa.isPrimary && (
                          <Badge variant="default" className="text-xs">
                            أساسي
                          </Badge>
                        )}
                        {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openRemoveHalaqaDialog(halaqa)}
                            title="إزالة من الحلقة"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add New Halaqa Section */}
            {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  إضافة حلقة جديدة
                </h4>

                <div className="flex gap-2">
                  <SearchableSelect
                    className="flex-1"
                    options={halaqat.filter(
                      (h) => !teacherHalaqat.some((th) => th.halaqaId === h.id)
                    )}
                    value={selectedHalaqa}
                    onValueChange={setSelectedHalaqa}
                    placeholder="اختر حلقة لإضافتها..."
                    searchPlaceholder="ابحث عن حلقة..."
                    emptyText="تم تعيين جميع الحلقات"
                  />
                  <Button onClick={handleAssignToHalaqa} disabled={!selectedHalaqa || isAssigning} className="shrink-0">
                    {isAssigning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 ml-1" />
                        إضافة
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={closeManageHalaqatDialog}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المعلم &quot;{teacherToDelete?.fullName}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
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

      {/* Remove from Halaqa Confirmation Dialog */}
      <AlertDialog open={isRemoveHalaqaDialogOpen} onOpenChange={setIsRemoveHalaqaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الإزالة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إزالة المعلم &quot;{selectedTeacherForHalaqat?.fullName}&quot; من حلقة &quot;
              {halaqaToRemove?.halaqaName}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromHalaqa}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              إزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
