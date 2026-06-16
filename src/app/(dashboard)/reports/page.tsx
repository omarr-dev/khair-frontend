"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { statisticsApi, halaqatApi, exportApi, teachersApi } from "@/services";
import { ReportStats } from "@/types/statistics";
import { Lookup } from "@/types/api";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { useAuth } from "@/components/providers";
import { roleUtils } from "@/types/auth";
import { DateRangePicker, DateRange } from "@/components/shared";
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
  UserCheck,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

// Type for date range options
type DateRangeOption = "week" | "month" | "custom";

export default function ReportsPage() {
  const { user } = useAuth();
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("week");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [selectedHalaqa, setSelectedHalaqa] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [halaqat, setHalaqat] = useState<Lookup[]>([]);
  const [teachers, setTeachers] = useState<Lookup[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const isSupervisor = roleUtils.hasAnySupervisorRole(user?.role);

  useEffect(() => {
    fetchHalaqat();
  }, []);

  // Teachers are scoped to the selected halaqa — only load them once a halaqa is chosen
  useEffect(() => {
    if (!isSupervisor || selectedHalaqa === "all") {
      setTeachers([]);
      return;
    }
    fetchTeachers(parseInt(selectedHalaqa));
  }, [isSupervisor, selectedHalaqa]);

  useEffect(() => {
    // Only fetch if not custom, or if custom and dates are set
    if (dateRangeOption !== "custom" || customDateRange) {
      fetchReportData();
    }
  }, [dateRangeOption, selectedHalaqa, selectedTeacher, customDateRange]);

  const fetchHalaqat = async () => {
    try {
      const response = await halaqatApi.getLookup();
      setHalaqat(response.data);
    } catch (error) {
      console.error("Error fetching halaqat:", error);
    }
  };

  const fetchTeachers = async (halaqaId: number) => {
    try {
      const response = await teachersApi.getLookup(halaqaId);
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const halaqaId = selectedHalaqa !== "all" ? parseInt(selectedHalaqa) : undefined;
      const teacherId = selectedTeacher !== "all" ? parseInt(selectedTeacher) : undefined;

      // Build params based on date range option
      const params = {
        dateRange: dateRangeOption,
        halaqaId,
        teacherId,
        fromDate: dateRangeOption === "custom" && customDateRange
          ? format(customDateRange.from, "yyyy-MM-dd")
          : undefined,
        toDate: dateRangeOption === "custom" && customDateRange
          ? format(customDateRange.to, "yyyy-MM-dd")
          : undefined,
      };

      const response = await statisticsApi.getReportStats(params);
      setReportStats(response.data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle date range option change
  const handleDateRangeOptionChange = (value: DateRangeOption) => {
    setDateRangeOption(value);
    // Clear custom range when switching to preset
    if (value !== "custom") {
      setCustomDateRange(undefined);
    }
  };

  // Handle custom date range selection
  const handleCustomDateRangeChange = (range: DateRange) => {
    setCustomDateRange(range);
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

  // Get date range for exports
  const getDateRange = useMemo(() => {
    return () => {
      // If custom date range is set, use it
      if (dateRangeOption === "custom" && customDateRange) {
        return {
          fromDate: format(customDateRange.from, "yyyy-MM-dd"),
          toDate: format(customDateRange.to, "yyyy-MM-dd"),
        };
      }
      
      const toDate = new Date().toISOString().split('T')[0];
      let fromDate: string;
      
      switch (dateRangeOption) {
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
  }, [dateRangeOption, customDateRange]);

  const handleExportStudents = async () => {
    if (!isSupervisor) return;

    setExporting(true);
    try {
      const halaqaId = selectedHalaqa !== "all" ? parseInt(selectedHalaqa) : undefined;
      const teacherId = selectedTeacher !== "all" ? parseInt(selectedTeacher) : undefined;
      const response = await exportApi.exportStudents(halaqaId, teacherId);
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
      const teacherId = selectedTeacher !== "all" ? parseInt(selectedTeacher) : undefined;
      const response = await exportApi.exportAttendance(fromDate, toDate, halaqaId, teacherId);
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
      const halaqaId = selectedHalaqa !== "all" ? parseInt(selectedHalaqa) : undefined;
      const response = await exportApi.exportHalaqaPerformance(fromDate, toDate, halaqaId);
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
      const halaqaId = selectedHalaqa !== "all" ? parseInt(selectedHalaqa) : undefined;
      const teacherId = selectedTeacher !== "all" ? parseInt(selectedTeacher) : undefined;
      const response = await exportApi.exportTeacherPerformance(fromDate, toDate, halaqaId, teacherId);
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
      const { fromDate, toDate } = getDateRange();
      const halaqaId = selectedHalaqa !== "all" ? parseInt(selectedHalaqa) : undefined;
      const teacherId = selectedTeacher !== "all" ? parseInt(selectedTeacher) : undefined;
      const response = await exportApi.exportTeacherAttendance(fromDate, toDate, halaqaId, teacherId);
      downloadFile(response.data as Blob, `teacher_attendance_${fromDate}_to_${toDate}.xlsx`);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>الفترة الزمنية</Label>
              <Select 
                value={dateRangeOption} 
                onValueChange={(value: DateRangeOption) => handleDateRangeOptionChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="custom">فترة محددة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range Picker - Only show when custom is selected */}
            {dateRangeOption === "custom" && (
              <div className="space-y-2">
                <Label>اختر الفترة</Label>
                <DateRangePicker
                  value={customDateRange}
                  onChange={handleCustomDateRangeChange}
                  maxDate={new Date()}
                  maxRangeDays={365}
                  placeholder="اختر تاريخ البداية والنهاية"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>الحلقة</Label>
              <SearchableSelect
                className="w-full"
                options={halaqat}
                value={selectedHalaqa}
                onValueChange={(v) => {
                  setSelectedHalaqa(v);
                  // Teacher is scoped to the halaqa — clear it when the halaqa changes
                  setSelectedTeacher("all");
                }}
                allLabel="جميع الحلقات"
                searchPlaceholder="ابحث عن حلقة..."
              />
            </div>

            {isSupervisor && selectedHalaqa !== "all" && (
              <div className="space-y-2">
                <Label>المعلم</Label>
                <SearchableSelect
                  className="w-full"
                  options={teachers}
                  value={selectedTeacher}
                  onValueChange={setSelectedTeacher}
                  allLabel="جميع المعلمين"
                  searchPlaceholder="ابحث عن معلم..."
                />
              </div>
            )}
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
