"use client";

import { useState, useEffect } from "react";
import { statisticsApi, halaqatApi, exportApi } from "@/services";
import { ReportStats } from "@/types/statistics";
import { Halaqa } from "@/types/halaqa";
import { useAuth } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Download,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  Award,
  Loader2,
  FileSpreadsheet,
  UserCheck,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");
  const [selectedHalaqa, setSelectedHalaqa] = useState<string>("all");
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const isSupervisor = user?.role === "Supervisor";

  useEffect(() => {
    fetchHalaqat();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedHalaqa]);

  const fetchHalaqat = async () => {
    try {
      const response = await halaqatApi.getAll();
      setHalaqat(response.data);
    } catch (error) {
      console.error("Error fetching halaqat:", error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const halaqaId = selectedHalaqa !== "all" ? parseInt(selectedHalaqa) : undefined;
      const response = await statisticsApi.getReportStats(dateRange, halaqaId);
      setReportStats(response.data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (data: Blob, filename: string) => {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getDateRange = () => {
    const toDate = new Date().toISOString().split('T')[0];
    let fromDate: string;
    
    switch (dateRange) {
      case "week":
        fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case "month":
        fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    return { fromDate, toDate };
  };

  const handleExportStudents = async () => {
    if (!isSupervisor) return;
    
    setExporting(true);
    try {
      const halaqaId = selectedHalaqa !== "all" ? parseInt(selectedHalaqa) : undefined;
      const response = await exportApi.exportStudents(halaqaId);
      downloadFile(response.data as Blob, `students_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("تم تصدير الطلاب بنجاح");
    } catch (error) {
      console.error("Error exporting students:", error);
      toast.error("حدث خطأ أثناء تصدير الطلاب");
    } finally {
      setExporting(false);
    }
  };

  const handleExportTeachers = async () => {
    if (!isSupervisor) return;
    
    setExporting(true);
    try {
      const halaqaId = selectedHalaqa !== "all" ? parseInt(selectedHalaqa) : undefined;
      const response = await exportApi.exportTeachers(halaqaId);
      downloadFile(response.data as Blob, `teachers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("تم تصدير المعلمين بنجاح");
    } catch (error) {
      console.error("Error exporting teachers:", error);
      toast.error("حدث خطأ أثناء تصدير المعلمين");
    } finally {
      setExporting(false);
    }
  };

  const handleExportAttendance = async () => {
    if (!isSupervisor) return;
    
    setExporting(true);
    try {
      const { fromDate, toDate } = getDateRange();
      const halaqaId = selectedHalaqa !== "all" ? parseInt(selectedHalaqa) : undefined;
      const response = await exportApi.exportAttendance(fromDate, toDate, halaqaId);
      downloadFile(response.data as Blob, `attendance_${fromDate}_to_${toDate}.xlsx`);
      toast.success("تم تصدير تقرير الحضور بنجاح");
    } catch (error) {
      console.error("Error exporting attendance:", error);
      toast.error("حدث خطأ أثناء تصدير تقرير الحضور");
    } finally {
      setExporting(false);
    }
  };

  const handleExportHalaqaPerformance = async () => {
    if (!isSupervisor) return;
    
    setExporting(true);
    try {
      const { fromDate, toDate } = getDateRange();
      const response = await exportApi.exportHalaqaPerformance(fromDate, toDate);
      downloadFile(response.data as Blob, `halaqa_performance_${fromDate}_to_${toDate}.xlsx`);
      toast.success("تم تصدير تقرير أداء الحلقات بنجاح");
    } catch (error) {
      console.error("Error exporting halaqa performance:", error);
      toast.error("حدث خطأ أثناء تصدير تقرير أداء الحلقات");
    } finally {
      setExporting(false);
    }
  };

  const handleExportTeacherPerformance = async () => {
    if (!isSupervisor) return;
    
    setExporting(true);
    try {
      const { fromDate, toDate } = getDateRange();
      const response = await exportApi.exportTeacherPerformance(fromDate, toDate);
      downloadFile(response.data as Blob, `teacher_performance_${fromDate}_to_${toDate}.xlsx`);
      toast.success("تم تصدير تقرير أداء المعلمين بنجاح");
    } catch (error) {
      console.error("Error exporting teacher performance:", error);
      toast.error("حدث خطأ أثناء تصدير تقرير أداء المعلمين");
    } finally {
      setExporting(false);
    }
  };

  const handleExportTeacherAttendance = async () => {
    if (!isSupervisor) return;
    
    setExporting(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const response = await exportApi.exportTeacherAttendance(year, month);
      downloadFile(response.data as Blob, `teacher_attendance_${year}_${month.toString().padStart(2, '0')}.xlsx`);
      toast.success("تم تصدير تقرير حضور المعلمين بنجاح");
    } catch (error) {
      console.error("Error exporting teacher attendance:", error);
      toast.error("حدث خطأ أثناء تصدير تقرير حضور المعلمين");
    } finally {
      setExporting(false);
    }
  };

  const stats = reportStats ? [
    {
      title: "إجمالي الطلاب",
      value: reportStats.totalStudents.toString(),
      change: "+5.2%",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "متوسط الحضور",
      value: `${reportStats.averageAttendance}%`,
      change: "+2.1%",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "حفظ جديد هذا الأسبوع",
      value: reportStats.weeklyMemorization.toString(),
      change: "+8.3%",
      icon: BookOpen,
      color: "text-purple-600",
    },
    {
      title: "متوسط الجودة",
      value: reportStats.averageQuality.toFixed(1),
      change: "+0.3",
      icon: Award,
      color: "text-yellow-600",
    },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
        {isSupervisor && (
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="ml-2 h-4 w-4" />
                تصدير البيانات
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>تصدير البيانات إلى Excel</DialogTitle>
                <DialogDescription>
                  اختر نوع التقرير الذي تريد تصديره
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={handleExportStudents}
                  disabled={exporting}
                >
                  <Users className="ml-3 h-5 w-5 text-blue-600" />
                  <div className="text-right">
                    <p className="font-medium">قائمة الطلاب</p>
                    <p className="text-sm text-muted-foreground">
                      تصدير جميع بيانات الطلاب
                    </p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={handleExportTeachers}
                  disabled={exporting}
                >
                  <UserCheck className="ml-3 h-5 w-5 text-green-600" />
                  <div className="text-right">
                    <p className="font-medium">قائمة المعلمين</p>
                    <p className="text-sm text-muted-foreground">
                      تصدير جميع بيانات المعلمين
                    </p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={handleExportAttendance}
                  disabled={exporting}
                >
                  <ClipboardList className="ml-3 h-5 w-5 text-orange-600" />
                  <div className="text-right">
                    <p className="font-medium">تقرير الحضور</p>
                    <p className="text-sm text-muted-foreground">
                      سجل الحضور للفترة المحددة
                    </p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={handleExportHalaqaPerformance}
                  disabled={exporting}
                >
                  <BookOpen className="ml-3 h-5 w-5 text-purple-600" />
                  <div className="text-right">
                    <p className="font-medium">أداء الحلقات</p>
                    <p className="text-sm text-muted-foreground">
                      تقرير أداء كل حلقة
                    </p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={handleExportTeacherPerformance}
                  disabled={exporting}
                >
                  <BarChart3 className="ml-3 h-5 w-5 text-cyan-600" />
                  <div className="text-right">
                    <p className="font-medium">أداء المعلمين</p>
                    <p className="text-sm text-muted-foreground">
                      تقرير أداء كل معلم
                    </p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={handleExportTeacherAttendance}
                  disabled={exporting}
                >
                  <Calendar className="ml-3 h-5 w-5 text-rose-600" />
                  <div className="text-right">
                    <p className="font-medium">حضور المعلمين الشهري</p>
                    <p className="text-sm text-muted-foreground">
                      تقرير حضور وغياب المعلمين
                    </p>
                  </div>
                </Button>
              </div>
              {exporting && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  <span>جاري التصدير...</span>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الفترة الزمنية</Label>
              <Select value={dateRange} onValueChange={(value: "week" | "month" | "all") => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="all">الكل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الحلقة</Label>
              <Select value={selectedHalaqa} onValueChange={setSelectedHalaqa}>
                <SelectTrigger>
                  <SelectValue />
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
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 ml-1 text-green-500" />
                {stat.change} مقارنة بالفترة السابقة
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {reportStats && (
        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="progress">التقدم</TabsTrigger>
            <TabsTrigger value="attendance">الحضور</TabsTrigger>
            <TabsTrigger value="performance">الأداء</TabsTrigger>
            <TabsTrigger value="quality">الجودة</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>التقدم اليومي</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportStats.progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="memorization" fill="#3B82F6" name="حفظ جديد" />
                    <Bar dataKey="revision" fill="#10B981" name="مراجعة" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>معدل الحضور اليومي</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportStats.attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="نسبة الحضور"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>أفضل الطلاب أداءً</CardTitle>
              </CardHeader>
              <CardContent>
                {reportStats.topStudents.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportStats.topStudents} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="progress" fill="#3B82F6" name="عدد الأنشطة" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد بيانات للعرض
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>توزيع جودة الحفظ</CardTitle>
              </CardHeader>
              <CardContent>
                {reportStats.qualityDistribution.some(q => q.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportStats.qualityDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportStats.qualityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد بيانات للعرض
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
