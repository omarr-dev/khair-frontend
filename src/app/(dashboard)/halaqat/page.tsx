"use client";

import { useState, useEffect } from "react";
import { halaqatApi } from "@/lib/api";
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
import { Plus, Edit, Trash2, Users, UserCheck, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function HalaqatPage() {
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHalaqa, setEditingHalaqa] = useState<Halaqa | null>(null);
  const { user } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  useEffect(() => {
    fetchHalaqat();
  }, []);

  const fetchHalaqat = async () => {
    try {
      setLoading(true);
      const response = await halaqatApi.getAll();
      setHalaqat(response.data);
    } catch (error) {
      console.error("Error fetching halaqat:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setLocation("");
    setTimeSlot("");
    setEditingHalaqa(null);
  };

  const openEditDialog = (halaqa: Halaqa) => {
    setEditingHalaqa(halaqa);
    setName(halaqa.name);
    setDescription(halaqa.description || "");
    setLocation(halaqa.location || "");
    setTimeSlot(halaqa.timeSlot || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement create/update API call
    setIsDialogOpen(false);
    resetForm();
    fetchHalaqat();
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الحلقة؟")) {
      // TODO: Implement delete API call
      fetchHalaqat();
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMMM yyyy", { locale: ar });
  };

  // Stats
  const totalStudents = halaqat.reduce((sum, h) => sum + h.studentCount, 0);
  const totalTeachers = halaqat.reduce((sum, h) => sum + h.teacherCount, 0);
  const activeHalaqat = halaqat.filter((h) => h.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الحلقات</h1>
        {user?.role === "Supervisor" && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة حلقة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingHalaqa ? "تعديل الحلقة" : "إضافة حلقة جديدة"}
                </DialogTitle>
                <DialogDescription>
                  أدخل بيانات الحلقة ثم اضغط حفظ
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الحلقة</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: حلقة الفجر"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="وصف مختصر للحلقة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">المكان</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="مثال: المسجد الكبير"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeSlot">الوقت</Label>
                    <Input
                      id="timeSlot"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      placeholder="مثال: 5:30 - 7:00 صباحاً"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingHalaqa ? "تحديث" : "حفظ"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحلقات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{halaqat.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحلقات النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeHalaqat}</div>
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
            <CardTitle className="text-sm font-medium">إجمالي المعلمين</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Halaqat Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الحلقات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الحلقة</TableHead>
                  <TableHead>المكان</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>عدد الطلاب</TableHead>
                  <TableHead>عدد المعلمين</TableHead>
                  <TableHead>الحالة</TableHead>
                  {user?.role === "Supervisor" && <TableHead>إجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {halaqat.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      لا توجد حلقات
                    </TableCell>
                  </TableRow>
                ) : (
                  halaqat.map((halaqa) => (
                    <TableRow key={halaqa.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{halaqa.name}</div>
                          {halaqa.description && (
                            <div className="text-sm text-muted-foreground">
                              {halaqa.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {halaqa.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {halaqa.location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {halaqa.timeSlot && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {halaqa.timeSlot}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 ml-1" />
                          {halaqa.studentCount} طالب
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <UserCheck className="h-3 w-3 ml-1" />
                          {halaqa.teacherCount} معلم
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={halaqa.isActive ? "default" : "destructive"}
                        >
                          {halaqa.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      {user?.role === "Supervisor" && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(halaqa)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(halaqa.id)}
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
