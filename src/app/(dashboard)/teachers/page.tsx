"use client";

import { useState, useEffect } from "react";
import { teachersApi } from "@/lib/api";
import { Teacher } from "@/types/teacher";
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
import { UserPlus, Edit, Trash2, Users, BookOpen, Award, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const { user } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [qualification, setQualification] = useState("");

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersApi.getAll();
      setTeachers(response.data as Teacher[]);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      // Use mock data for demo
      setTeachers([
        {
          id: 1,
          userId: 2,
          fullName: "محمد المعلم",
          email: "teacher1@khair.com",
          phoneNumber: "0502345678",
          qualification: "إجازة في القرآن الكريم",
          joinDate: new Date().toISOString(),
          halaqatCount: 1,
          studentsCount: 15,
        },
        {
          id: 2,
          userId: 3,
          fullName: "عبدالله المعلم",
          email: "teacher2@khair.com",
          phoneNumber: "0503456789",
          qualification: "بكالوريوس دراسات إسلامية",
          joinDate: new Date().toISOString(),
          halaqatCount: 1,
          studentsCount: 12,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhoneNumber("");
    setQualification("");
    setEditingTeacher(null);
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEmail(teacher.email);
    setFullName(teacher.fullName);
    setPhoneNumber(teacher.phoneNumber || "");
    setQualification(teacher.qualification || "");
    setPassword("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement create/update API call
    setIsDialogOpen(false);
    resetForm();
    fetchTeachers();
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المعلم؟")) {
      // TODO: Implement delete API call
      fetchTeachers();
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMMM yyyy", { locale: ar });
  };

  // Stats
  const totalStudents = teachers.reduce((sum, t) => sum + t.studentsCount, 0);
  const totalHalaqat = teachers.reduce((sum, t) => sum + t.halaqatCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المعلمين</h1>
        {user?.role === "Supervisor" && (
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTeacher ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}
                </DialogTitle>
                <DialogDescription>
                  أدخل بيانات المعلم ثم اضغط حفظ
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسم المعلم"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@khair.com"
                      required
                      disabled={!!editingTeacher}
                    />
                  </div>
                  {!editingTeacher && (
                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="أدخل كلمة مرور قوية"
                        required={!editingTeacher}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualification">المؤهل</Label>
                    <Input
                      id="qualification"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="مثال: إجازة في القرآن الكريم"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingTeacher ? "تحديث" : "إضافة المعلم"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المعلمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحلقات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHalaqat}</div>
          </CardContent>
        </Card>
      </div>

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
                  {user?.role === "Supervisor" && (
                    <div className="flex gap-1">
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
                        onClick={() => handleDelete(teacher.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{teacher.email}</span>
                </div>
                {teacher.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span dir="ltr">{teacher.phoneNumber}</span>
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
    </div>
  );
}
