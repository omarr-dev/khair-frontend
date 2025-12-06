"use client";

import { useState, useEffect } from "react";
import { studentApi, halaqatApi } from "@/lib/api";
import { Student, CreateStudentDto } from "@/types/student";
import { Halaqa } from "@/types/progress";
import { useAuth } from "@/lib/auth-context";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus, Edit, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { user } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [juzMemorized, setJuzMemorized] = useState("0");
  const [selectedHalaqa, setSelectedHalaqa] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchHalaqat();
  }, []);

  const fetchStudents = async (search?: string) => {
    try {
      setLoading(true);
      const response = await studentApi.getAll(search);
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      // Use mock data for demo
      setStudents([
        {
          id: 1,
          firstName: "أحمد",
          lastName: "محمد",
          fullName: "أحمد محمد",
          dateOfBirth: "2010-05-15",
          guardianName: "محمد أحمد",
          guardianPhone: "0504567890",
          juzMemorized: 5,
          currentHalaqa: "حلقة الفجر",
          teacherName: "محمد المعلم",
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          firstName: "فاطمة",
          lastName: "علي",
          fullName: "فاطمة علي",
          dateOfBirth: "2011-03-20",
          guardianName: "علي عبدالله",
          guardianPhone: "0505678901",
          juzMemorized: 3,
          currentHalaqa: "حلقة العصر",
          teacherName: "عبدالله المعلم",
          createdAt: new Date().toISOString(),
        },
      ]);
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
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setGuardianName("");
    setGuardianPhone("");
    setJuzMemorized("0");
    setSelectedHalaqa("");
    setEditingStudent(null);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setDateOfBirth(student.dateOfBirth || "");
    setGuardianName(student.guardianName || "");
    setGuardianPhone(student.guardianPhone || "");
    setJuzMemorized(student.juzMemorized.toString());
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
        juzMemorized: parseInt(juzMemorized),
        halaqaId: selectedHalaqa ? parseInt(selectedHalaqa) : undefined,
      };

      if (editingStudent) {
        await studentApi.update(editingStudent.id, data);
      } else {
        await studentApi.create(data);
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchStudents(searchTerm);
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(searchTerm);
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
      try {
        await studentApi.delete(id);
        fetchStudents(searchTerm);
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMMM yyyy", { locale: ar });
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
                <div className="grid gap-4 py-4">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="juzMemorized">الأجزاء المحفوظة</Label>
                      <Input
                        id="juzMemorized"
                        type="number"
                        min="0"
                        max="30"
                        value={juzMemorized}
                        onChange={(e) => setJuzMemorized(e.target.value)}
                      />
                    </div>
                    {!editingStudent && (
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
                    )}
                  </div>
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
          <div className="text-2xl font-bold">{students.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Input
              placeholder="البحث بالاسم أو رقم ولي الأمر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              <Search className="ml-2 h-4 w-4" />
              بحث
            </Button>
          </form>

          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
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
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.fullName}
                      </TableCell>
                      <TableCell>{formatDate(student.dateOfBirth)}</TableCell>
                      <TableCell>{student.guardianName || "-"}</TableCell>
                      <TableCell>{student.guardianPhone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {student.juzMemorized} جزء
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
                              onClick={() => openEditDialog(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(student.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
