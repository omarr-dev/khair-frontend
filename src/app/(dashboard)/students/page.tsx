"use client";

import { useState, useEffect, useCallback } from "react";
import { studentApi, halaqatApi, teachersApi } from "@/services";
import { PaginatedResponse, StudentFilterParams } from "@/types/api";
import { Student, CreateStudentDto, UpdateStudentDto, StudentAssignment } from "@/types/student";
import { Halaqa } from "@/types/halaqa";
import { Teacher } from "@/types/teacher";
import { useAuth } from "@/components/providers";
import { useDebounce } from "@/hooks";
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
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Users, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [managingStudent, setManagingStudent] = useState<Student | null>(null);
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleteAssignmentDialogOpen, setIsDeleteAssignmentDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<StudentAssignment | null>(null);
  const { user } = useAuth();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHalaqa, setFilterHalaqa] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [memorizationDirection, setMemorizationDirection] = useState<"Forward" | "Backward">("Forward");
  const [currentSurahNumber, setCurrentSurahNumber] = useState("1");
  const [currentVerse, setCurrentVerse] = useState("0");
  const [selectedHalaqa, setSelectedHalaqa] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  
  // Assignment form state
  const [assignHalaqa, setAssignHalaqa] = useState("");
  const [assignTeacher, setAssignTeacher] = useState("");

  useEffect(() => {
    fetchHalaqat();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, debouncedSearch, filterHalaqa, filterTeacher, sortBy, sortOrder]);

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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      const params: StudentFilterParams = {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        halaqaId: filterHalaqa !== "all" ? parseInt(filterHalaqa) : undefined,
        teacherId: filterTeacher !== "all" ? parseInt(filterTeacher) : undefined,
        sortBy: sortBy as 'name' | 'juz' | 'createdAt',
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const response = await studentApi.getPaginated(params);
      setStudents(response.data.items);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("حدث خطأ أثناء تحميل الطلاب");
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
    setMemorizationDirection("Forward");
    setCurrentSurahNumber("1");
    setCurrentVerse("0");
    setSelectedHalaqa("");
    setSelectedTeacher("");
    setEditingStudent(null);
  };

  const resetAssignmentForm = () => {
    setAssignHalaqa("");
    setAssignTeacher("");
  };

  const resetFilters = () => {
    setSearchTerm("");
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
    setMemorizationDirection(student.memorizationDirection as "Forward" | "Backward");
    setCurrentSurahNumber(student.currentSurahNumber.toString());
    setCurrentVerse(student.currentVerse.toString());
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: CreateStudentDto = {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || undefined,
        guardianName: guardianName || undefined,
        guardianPhone: guardianPhone || undefined,
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
      toast.error("حدث خطأ أثناء حفظ بيانات الطالب");
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

  // Pagination handlers
  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الطلاب</h1>
        {user?.role === "Supervisor" && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة طالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
                </DialogTitle>
                <DialogDescription>
                  أدخل بيانات الطالب ثم اضغط حفظ
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">الاسم الأول</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="أدخل الاسم الأول"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">اسم العائلة</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="أدخل اسم العائلة"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">تاريخ الميلاد</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianName">اسم ولي الأمر</Label>
                      <Input
                        id="guardianName"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="اسم ولي الأمر"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardianPhone">هاتف ولي الأمر</Label>
                      <Input
                        id="guardianPhone"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        placeholder="05xxxxxxxx"
                      />
                    </div>
                  </div>
                  {!editingStudent && (
                    <div className="space-y-2">
                      <Label>اتجاه الحفظ</Label>
                      <Select 
                        value={memorizationDirection} 
                        onValueChange={(v) => setMemorizationDirection(v as "Forward" | "Backward")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Forward">من الفاتحة إلى الناس</SelectItem>
                          <SelectItem value="Backward">من الناس إلى الفاتحة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {!editingStudent && (
                    <>
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
                      <div className="space-y-2">
                        <Label htmlFor="teacher">المعلم</Label>
                        <Select 
                          value={selectedTeacher} 
                          onValueChange={setSelectedTeacher}
                          disabled={!selectedHalaqa}
                        >
                          <SelectTrigger>
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
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingStudent ? "تحديث" : "إضافة الطالب"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCount}</div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو رقم ولي الأمر..."
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
              {(searchTerm || filterHalaqa !== "all" || filterTeacher !== "all") && (
                <Button variant="ghost" onClick={resetFilters}>
                  <X className="h-4 w-4 ml-2" />
                  مسح
                </Button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
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
                      <SelectItem value="juz">الأجزاء المحفوظة</SelectItem>
                      <SelectItem value="createdAt">تاريخ التسجيل</SelectItem>
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

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <>
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
                    {user?.role === "Supervisor" && <TableHead>إجراءات</TableHead>}
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
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/my-students/${student.id}`)}
                      >
                        <TableCell className="font-medium">
                          {student.fullName}
                        </TableCell>
                        <TableCell>{formatDate(student.dateOfBirth)}</TableCell>
                        <TableCell>{student.guardianName || "-"}</TableCell>
                        <TableCell>{student.guardianPhone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {student.juzMemorized.toFixed(1)} جزء
                          </Badge>
                        </TableCell>
                        <TableCell>{student.currentHalaqa || "-"}</TableCell>
                        <TableCell>{student.teacherName || "-"}</TableCell>
                        {user?.role === "Supervisor" && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/my-students/${student.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 ml-1" />
                                تفاصيل الطالب
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Manage Assignments Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              إدارة تعيينات الطالب: {managingStudent?.fullName}
            </DialogTitle>
            <DialogDescription>
              يمكنك إضافة أو حذف تعيينات الطالب في الحلقات
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Assignments */}
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
                        <p className="text-sm text-muted-foreground">
                          المعلم: {assignment.teacherName}
                        </p>
                        <Badge variant={assignment.isActive ? "default" : "secondary"} className="mt-1">
                          {assignment.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteAssignmentDialog(assignment)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Assignment */}
            <div>
              <h3 className="text-sm font-medium mb-2">إضافة تعيين جديد</h3>
              <form onSubmit={handleAddAssignment} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="assignHalaqa">الحلقة</Label>
                  <Select value={assignHalaqa} onValueChange={setAssignHalaqa}>
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
                <div className="space-y-2">
                  <Label htmlFor="assignTeacher">المعلم</Label>
                  <Select 
                    value={assignTeacher} 
                    onValueChange={setAssignTeacher}
                    disabled={!assignHalaqa}
                  >
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
              هل أنت متأكد من حذف الطالب &quot;{studentToDelete?.fullName}&quot;؟ 
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

      {/* Delete Assignment Confirmation Dialog */}
      <AlertDialog open={isDeleteAssignmentDialogOpen} onOpenChange={setIsDeleteAssignmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف التعيين</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف تعيين الطالب &quot;{managingStudent?.fullName}&quot; من حلقة &quot;{assignmentToDelete?.halaqaName}&quot;؟
              لا يمكن التراجع عن هذا الإجراء.
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
