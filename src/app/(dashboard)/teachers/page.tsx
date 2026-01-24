"use client";

import { useState, useEffect } from "react";
import { teachersApi, halaqatApi } from "@/services";
import { PaginatedResponse, TeacherFilterParams } from "@/types/api";
import { Teacher, TeacherHalaqa } from "@/types/teacher";
import { Halaqa } from "@/types/halaqa";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSaudiPhoneNumber } from "@/lib/phone-formatter";
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
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

// Debounce hook
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

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isHalaqaDialogOpen, setIsHalaqaDialogOpen] = useState(false);
  const [selectedTeacherForHalaqa, setSelectedTeacherForHalaqa] = useState<Teacher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isViewHalaqatDialogOpen, setIsViewHalaqatDialogOpen] = useState(false);
  const [selectedTeacherForView, setSelectedTeacherForView] = useState<Teacher | null>(null);
  const [teacherHalaqat, setTeacherHalaqat] = useState<TeacherHalaqa[]>([]);
  const [isRemoveHalaqaDialogOpen, setIsRemoveHalaqaDialogOpen] = useState(false);
  const [halaqaToRemove, setHalaqaToRemove] = useState<TeacherHalaqa | null>(null);
  const { user } = useAuth();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHalaqa, setFilterHalaqa] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounceValue(searchTerm, 300);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [qualification, setQualification] = useState("");
  const [selectedHalaqa, setSelectedHalaqa] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHalaqat();
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [page, debouncedSearch, filterHalaqa, sortBy, sortOrder]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);

      const params: TeacherFilterParams = {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        halaqaId: filterHalaqa !== "all" ? parseInt(filterHalaqa) : undefined,
        sortBy: sortBy as 'name' | 'studentsCount' | 'halaqatCount' | 'joinDate',
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const response = await teachersApi.getPaginated(params);
      setTeachers(response.data.items);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("حدث خطأ أثناء تحميل المعلمين");
    } finally {
      setLoading(false);
    }
  };

  const fetchHalaqat = async () => {
    try {
      const response = await halaqatApi.getAll();
      setHalaqat(response.data);
    } catch (error) {
      console.error("Error fetching halaqat:", error);
    }
  };

  const resetForm = () => {
    setFullName("");
    setPhoneNumber("");
    setEmail("");
    setIdNumber("");
    setQualification("");
    setEditingTeacher(null);
    setValidationErrors({});
  };

  const resetHalaqaForm = () => {
    setSelectedHalaqa("");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterHalaqa("all");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
  };

  const openHalaqaDialog = (teacher: Teacher) => {
    setSelectedTeacherForHalaqa(teacher);
    setIsHalaqaDialogOpen(true);
  };

  const openViewHalaqatDialog = async (teacher: Teacher) => {
    setSelectedTeacherForView(teacher);
    try {
      const response = await teachersApi.getHalaqat(teacher.id);
      setTeacherHalaqat(response.data);
      setIsViewHalaqatDialogOpen(true);
    } catch (error) {
      console.error("Error fetching teacher halaqat:", error);
      toast.error("حدث خطأ أثناء جلب حلقات المعلم");
    }
  };

  const openRemoveHalaqaDialog = (halaqa: TeacherHalaqa) => {
    setHalaqaToRemove(halaqa);
    setIsRemoveHalaqaDialogOpen(true);
  };

  const handleRemoveFromHalaqa = async () => {
    if (!selectedTeacherForView || !halaqaToRemove) return;

    try {
      await teachersApi.removeFromHalaqa(selectedTeacherForView.id, halaqaToRemove.halaqaId);
      toast.success("تم إزالة المعلم من الحلقة بنجاح");
      setIsRemoveHalaqaDialogOpen(false);
      setHalaqaToRemove(null);
      const response = await teachersApi.getHalaqat(selectedTeacherForView.id);
      setTeacherHalaqat(response.data);
      fetchTeachers();
    } catch (error) {
      console.error("Error removing teacher from halaqa:", error);
      toast.error("حدث خطأ أثناء إزالة المعلم من الحلقة");
    }
  };

  const handleAssignToHalaqa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForHalaqa || !selectedHalaqa) return;

    try {
      await teachersApi.assignToHalaqa(
        selectedTeacherForHalaqa.id,
        parseInt(selectedHalaqa)
      );
      toast.success("تم تعيين المعلم في الحلقة بنجاح");
      setIsHalaqaDialogOpen(false);
      resetHalaqaForm();
      fetchTeachers();
    } catch (error: any) {
      console.error("Error assigning teacher to halaqa:", error);
      const errorMessage = error.response?.data?.message || "حدث خطأ أثناء تعيين المعلم";
      toast.error(errorMessage);
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
        });
        toast.success("تم تحديث بيانات المعلم بنجاح");
      } else {
        await teachersApi.create({
          phoneNumber,
          fullName,
          email: email || undefined,
          idNumber: idNumber || undefined,
          qualification: qualification || undefined,
        });
        toast.success("تم إضافة المعلم بنجاح");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchTeachers();
    } catch (error: any) {
      console.error("Error saving teacher:", error);
      
      const responseData = error.response?.data;
      const statusCode = error.response?.status;
      
      // Handle validation errors (field-level)
      if (statusCode === 400 && responseData?.errors) {
        setValidationErrors(responseData.errors);
        toast.error("يرجى التأكد من صحة البيانات المدخلة");
        return;
      }
      
      // Handle specific error messages from backend
      if (statusCode === 400 && responseData?.message) {
        const message = responseData.message;
        
        // Duplicate phone number error
        if (message.includes("مستخدم بالفعل") || message.includes("already")) {
          setValidationErrors({ PhoneNumber: ["رقم الجوال مسجل مسبقاً لمعلم آخر. يرجى استخدام رقم مختلف."] });
          toast.error("رقم الجوال مسجل مسبقاً", {
            description: "هذا الرقم مستخدم بالفعل لمعلم آخر في النظام",
          });
          return;
        }
        
        // Invalid phone number format
        if (message.includes("رقم الجوال يجب") || message.includes("سعودي")) {
          setValidationErrors({ PhoneNumber: [message] });
          toast.error("رقم الجوال غير صالح", {
            description: message,
          });
          return;
        }
        
        // Generic message error
        toast.error(message);
        return;
      }
      
      // Fallback error
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

  // Pagination handlers
  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المعلمين</h1>
        {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
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
                <DialogDescription>
                  {editingTeacher 
                    ? "قم بتعديل البيانات المطلوبة ثم اضغط تحديث"
                    : "أدخل بيانات المعلم الجديد. الحقول المميزة بـ (*) مطلوبة"
                  }
                </DialogDescription>
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
                            className={`pr-10 ${validationErrors.FullName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
                              // Only allow numbers
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setIdNumber(value);
                              if (validationErrors.IdNumber) {
                                setValidationErrors({ ...validationErrors, IdNumber: [] });
                              }
                            }}
                            placeholder="10 أرقام تبدأ بـ 1 أو 2"
                            dir="ltr"
                            className={`pr-10 text-left ${validationErrors.IdNumber ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
                            className={`pr-10 text-left ${validationErrors.PhoneNumber ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
                            className={`pr-10 text-left ${validationErrors.Email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
                        <Label htmlFor="qualification">المؤهل العلمي / الإجازة</Label>
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
                            className={`pr-10 ${validationErrors.Qualification ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المعلمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحلقات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{halaqat.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pr-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 ml-2" />
                فلترة
              </Button>
              {(searchTerm || filterHalaqa !== "all") && (
                <Button variant="ghost" onClick={resetFilters}>
                  <X className="h-4 w-4 ml-2" />
                  مسح
                </Button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>الحلقة</Label>
                  <Select
                    value={filterHalaqa}
                    onValueChange={(v) => {
                      setFilterHalaqa(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحلقات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحلقات</SelectItem>
                      {halaqat.map((halaqa) => (
                        <SelectItem key={halaqa.id} value={halaqa.id.toString()}>
                          {halaqa.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ترتيب حسب</Label>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => {
                      setSortBy(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">الاسم</SelectItem>
                      <SelectItem value="studentsCount">عدد الطلاب</SelectItem>
                      <SelectItem value="halaqatCount">عدد الحلقات</SelectItem>
                      <SelectItem value="joinDate">تاريخ الانضمام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>اتجاه الترتيب</Label>
                  <Select
                    value={sortOrder}
                    onValueChange={(v) => {
                      setSortOrder(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">تصاعدي</SelectItem>
                      <SelectItem value="desc">تنازلي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teachers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    <div className="text-sm text-muted-foreground mt-1">
                      انضم في {formatDate(teacher.joinDate)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openViewHalaqatDialog(teacher)}
                      title="عرض الحلقات"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openHalaqaDialog(teacher)}
                          title="إضافة حلقة"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(teacher)}
                        >
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            عرض {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalCount)} من {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={page === 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              صفحة {page} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Assign to Halaqa Dialog */}
      <Dialog open={isHalaqaDialogOpen} onOpenChange={(open) => {
        setIsHalaqaDialogOpen(open);
        if (!open) resetHalaqaForm();
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              تعيين المعلم في حلقة: {selectedTeacherForHalaqa?.fullName}
            </DialogTitle>
            <DialogDescription>
              اختر الحلقة التي تريد تعيين المعلم فيها
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignToHalaqa}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="halaqa">الحلقة</Label>
                <Select value={selectedHalaqa} onValueChange={setSelectedHalaqa}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحلقة" />
                  </SelectTrigger>
                  <SelectContent>
                    {halaqat.map((halaqa) => (
                      <SelectItem key={halaqa.id} value={halaqa.id.toString()}>
                        {halaqa.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!selectedHalaqa}>
                تعيين المعلم
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المعلم &quot;{teacherToDelete?.fullName}&quot;؟
              لا يمكن التراجع عن هذا الإجراء.
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

      {/* View Teacher's Halaqat Dialog */}
      <Dialog open={isViewHalaqatDialogOpen} onOpenChange={setIsViewHalaqatDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              حلقات المعلم: {selectedTeacherForView?.fullName}
            </DialogTitle>
            <DialogDescription>
              قائمة الحلقات المعينة للمعلم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {teacherHalaqat.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد حلقات معينة
              </p>
            ) : (
              teacherHalaqat.map((halaqa) => (
                <div
                  key={halaqa.halaqaId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{halaqa.halaqaName}</p>
                    <p className="text-sm text-muted-foreground">
                      تاريخ التعيين: {format(new Date(halaqa.assignedDate), "dd MMMM yyyy", { locale: ar })}
                    </p>
                    {halaqa.isPrimary && (
                      <Badge variant="default" className="mt-1">
                        معلم أساسي
                      </Badge>
                    )}
                  </div>
                  {(user?.role === "Supervisor" || user?.role === "HalaqaSupervisor") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => openRemoveHalaqaDialog(halaqa)}
                      title="إزالة من الحلقة"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove from Halaqa Confirmation Dialog */}
      <AlertDialog open={isRemoveHalaqaDialogOpen} onOpenChange={setIsRemoveHalaqaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الإزالة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إزالة المعلم &quot;{selectedTeacherForView?.fullName}&quot; من حلقة &quot;{halaqaToRemove?.halaqaName}&quot;؟
              لا يمكن التراجع عن هذا الإجراء.
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
