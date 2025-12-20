"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { halaqatApi } from "@/services";
import { HalaqaHierarchy, TeacherInHalaqa, StudentInHalaqa } from "@/types/halaqa";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Search,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function HalaqatPage() {
  const router = useRouter();
  const [halaqat, setHalaqat] = useState<HalaqaHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHalaqa, setEditingHalaqa] = useState<HalaqaHierarchy | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [halaqaToDelete, setHalaqaToDelete] = useState<HalaqaHierarchy | null>(null);
  const { user } = useAuth();

  // Collapsed state for halaqat and teachers
  const [collapsedHalaqat, setCollapsedHalaqat] = useState<Set<number>>(new Set());
  const [collapsedTeachers, setCollapsedTeachers] = useState<Set<string>>(new Set());

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
      const response = await halaqatApi.getHierarchy();
      setHalaqat(response.data);
      // Start with all halaqat collapsed for better overview
      setCollapsedHalaqat(new Set(response.data.map(h => h.id)));
    } catch (error) {
      console.error("Error fetching halaqat:", error);
      toast.error("حدث خطأ أثناء تحميل الحلقات");
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

  const openEditDialog = (halaqa: HalaqaHierarchy) => {
    setEditingHalaqa(halaqa);
    setName(halaqa.name);
    setDescription(halaqa.description || "");
    setLocation(halaqa.location || "");
    setTimeSlot(halaqa.timeSlot || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHalaqa) {
        await halaqatApi.update(editingHalaqa.id, {
          name,
          description: description || undefined,
          location: location || undefined,
          timeSlot: timeSlot || undefined,
          isActive: editingHalaqa.isActive,
        });
        toast.success("تم تحديث الحلقة بنجاح");
      } else {
        await halaqatApi.create({
          name,
          description: description || undefined,
          location: location || undefined,
          timeSlot: timeSlot || undefined,
        });
        toast.success("تم إضافة الحلقة بنجاح");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchHalaqat();
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
      fetchHalaqat();
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

  // Filter halaqat based on search
  const filteredHalaqat = halaqat.filter((halaqa) => {
    const searchLower = searchTerm.toLowerCase();
    // Search in halaqa name
    if (halaqa.name.toLowerCase().includes(searchLower)) return true;
    // Search in teacher names
    if (halaqa.teachers.some(t => t.fullName.toLowerCase().includes(searchLower))) return true;
    // Search in student names
    if (halaqa.teachers.some(t => 
      t.students.some(s => s.fullName.toLowerCase().includes(searchLower))
    )) return true;
    return false;
  });

  // Stats
  const totalStudents = halaqat.reduce((sum, h) => sum + h.studentCount, 0);
  const totalTeachers = halaqat.reduce((sum, h) => sum + h.teacherCount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

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
            <BookOpen className="h-4 w-4 text-muted-foreground" />
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
            <div className="text-2xl font-bold text-green-600">
              {halaqat.filter(h => h.isActive).length}
            </div>
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث عن حلقة، معلم، أو طالب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Hierarchical Tree View */}
      <div className="space-y-4">
        {filteredHalaqat.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد حلقات"}
            </CardContent>
          </Card>
        ) : (
          filteredHalaqat.map((halaqa) => (
            <div key={halaqa.id} className="space-y-2">
              {/* Level 1: Halaqa Header */}
              <div
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                  "bg-primary/5 border-primary/20 hover:bg-primary/10"
                )}
                onClick={() => toggleHalaqa(halaqa.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{halaqa.name}</h2>
                      {!halaqa.isActive && (
                        <Badge variant="secondary">غير نشط</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {halaqa.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {halaqa.location}
                        </span>
                      )}
                      {halaqa.timeSlot && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {halaqa.timeSlot}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="gap-1">
                      <UserCheck className="h-3 w-3" />
                      {halaqa.teacherCount} معلم
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {halaqa.studentCount} طالب
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 mr-4">
                  {user?.role === "Supervisor" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(halaqa);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(halaqa);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {collapsedHalaqat.has(halaqa.id) ? (
                    <ChevronDown className="h-5 w-5 text-primary" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>

              {/* Level 2: Teachers (Nested under Halaqa) */}
              {!collapsedHalaqat.has(halaqa.id) && (
                <div className="space-y-2 pr-6">
                  {halaqa.teachers.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center bg-muted/50 rounded-lg mr-4">
                      لا يوجد معلمين في هذه الحلقة
                    </div>
                  ) : (
                    halaqa.teachers.map((teacher) => (
                      <div key={teacher.id} className="space-y-2">
                        {/* Teacher Header */}
                        <div
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors mr-4",
                            "bg-secondary/30 border-secondary/50 hover:bg-secondary/50"
                          )}
                          onClick={() => toggleTeacher(halaqa.id, teacher.id)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                              <UserCheck className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{teacher.fullName}</h3>
                              {teacher.phoneNumber && (
                                <p className="text-sm text-muted-foreground" dir="ltr">
                                  {teacher.phoneNumber}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="gap-1">
                              <Users className="h-3 w-3" />
                              {teacher.studentCount} طالب
                            </Badge>
                          </div>
                          <div className="mr-2">
                            {collapsedTeachers.has(`${halaqa.id}-${teacher.id}`) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </div>
                        </div>

                        {/* Level 3: Students (Nested under Teacher) */}
                        {!collapsedTeachers.has(`${halaqa.id}-${teacher.id}`) && (
                          <div className="space-y-1 pr-6 mr-4">
                            {teacher.students.length === 0 ? (
                              <div className="p-3 text-sm text-muted-foreground text-center bg-muted/30 rounded-lg mr-4">
                                لا يوجد طلاب مسجلين لهذا المعلم
                              </div>
                            ) : (
                              teacher.students.map((student) => (
                                <Card
                                  key={student.id}
                                  className="mr-4 cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => router.push(`/my-students/${student.id}`)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                          {student.fullName.charAt(0)}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{student.fullName}</span>
                                            <Badge
                                              variant={student.memorizationDirection === "Forward" ? "default" : "secondary"}
                                              className="text-xs"
                                            >
                                              {student.memorizationDirection === "Forward" ? (
                                                <ArrowDown className="h-2 w-2 ml-1" />
                                              ) : (
                                                <ArrowUp className="h-2 w-2 ml-1" />
                                              )}
                                              {student.memorizationDirection === "Forward" ? "من الفاتحة" : "من الناس"}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <BookOpen className="h-3 w-3" />
                                              {student.currentSurahName || "الفاتحة"}
                                              {student.currentVerse > 0 && ` - آية ${student.currentVerse}`}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <GraduationCap className="h-3 w-3" />
                                              {student.juzMemorized.toFixed(1)} جزء
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <Button size="sm" variant="ghost">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الحلقة &quot;{halaqaToDelete?.name}&quot;؟ 
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
    </div>
  );
}
