"use client";

import { useState, useEffect, useCallback } from "react";
import { teacherAttendanceApi, exportApi } from "@/services";
import { 
  TodayTeacherAttendanceResponse, 
  TeacherAttendanceEntry,
  MonthlyAttendanceReport 
} from "@/types/teacher-attendance";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Clock, Save, Users, AlertTriangle, CalendarDays, Download, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

type AttendanceStatus = 0 | 1 | 2; // 0: Present, 1: Absent, 2: Late

interface AttendanceState {
  status: AttendanceStatus;
  notes?: string;
}

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function TeacherAttendancePage() {
  const [activeTab, setActiveTab] = useState("daily");
  
  // Daily state
  const [data, setData] = useState<TodayTeacherAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceState>>(new Map());
  
  // Monthly state
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceReport | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [exporting, setExporting] = useState(false);
  
  const { user } = useAuth();

  // Generate years array (current year and 2 years back)
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  const fetchDailyData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teacherAttendanceApi.getToday();
      setData(response.data);

      // Initialize attendance data from response
      const newAttendanceData = new Map<string, AttendanceState>();
      response.data.halaqat.forEach((halaqa) => {
        if (halaqa.isActiveToday) {
          halaqa.teachers.forEach((teacher) => {
            const key = `${teacher.teacherId}-${halaqa.halaqaId}`;
            newAttendanceData.set(key, {
              status: teacher.status !== undefined ? teacher.status : 1,
              notes: teacher.notes,
            });
          });
        }
      });
      setAttendanceData(newAttendanceData);
    } catch (error) {
      console.error("Error fetching teacher attendance:", error);
      toast.error("حدث خطأ أثناء جلب بيانات الحضور");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyData = useCallback(async () => {
    try {
      setMonthlyLoading(true);
      const response = await teacherAttendanceApi.getMonthlyReport(selectedYear, selectedMonth);
      setMonthlyData(response.data);
    } catch (error) {
      console.error("Error fetching monthly report:", error);
      toast.error("حدث خطأ أثناء جلب التقرير الشهري");
    } finally {
      setMonthlyLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  useEffect(() => {
    if (activeTab === "monthly") {
      fetchMonthlyData();
    }
  }, [activeTab, fetchMonthlyData]);

  const handleAttendanceChange = (teacherId: number, halaqaId: number, status: AttendanceStatus) => {
    const key = `${teacherId}-${halaqaId}`;
    const newData = new Map(attendanceData);
    const current = newData.get(key) || { status: 1 };
    newData.set(key, { ...current, status });
    setAttendanceData(newData);
  };

  const handleSaveAttendance = async () => {
    if (!data) return;

    setSaving(true);
    try {
      const attendance: TeacherAttendanceEntry[] = [];
      
      data.halaqat.forEach((halaqa) => {
        if (halaqa.isActiveToday) {
          halaqa.teachers.forEach((teacher) => {
            const key = `${teacher.teacherId}-${halaqa.halaqaId}`;
            const state = attendanceData.get(key);
            // Only include if state exists and status is a valid number
            if (state && typeof state.status === 'number') {
              attendance.push({
                teacherId: teacher.teacherId,
                halaqaId: halaqa.halaqaId,
                status: state.status,
                notes: state.notes,
              });
            }
          });
        }
      });

      if (attendance.length === 0) {
        toast.warning("لم يتم تحديد حضور أي معلم");
        return;
      }

      await teacherAttendanceApi.saveBulk({ attendance });
      toast.success("تم حفظ حضور المعلمين بنجاح");
      await fetchDailyData();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("حدث خطأ أثناء حفظ الحضور");
    } finally {
      setSaving(false);
    }
  };

  const handleExportMonthly = async () => {
    setExporting(true);
    try {
      const fromDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const toDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      
      const response = await exportApi.exportTeacherAttendance(fromDate, toDate);
      const url = window.URL.createObjectURL(response.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teacher_attendance_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("تم تصدير التقرير بنجاح");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("حدث خطأ أثناء تصدير التقرير");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 0:
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">حاضر</Badge>;
      case 1:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">غائب</Badge>;
      case 2:
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">متأخر</Badge>;
    }
  };

  // Calculate daily statistics
  const calculateStats = () => {
    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;

    data?.halaqat.forEach((halaqa) => {
      if (halaqa.isActiveToday) {
        halaqa.teachers.forEach((teacher) => {
          total++;
          const key = `${teacher.teacherId}-${halaqa.halaqaId}`;
          const state = attendanceData.get(key);
          if (state) {
            switch (state.status) {
              case 0:
                present++;
                break;
              case 1:
                absent++;
                break;
              case 2:
                late++;
                break;
            }
          }
        });
      }
    });

    return { total, present, absent, late };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "Supervisor" && user?.role !== "HalaqaSupervisor") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <p className="text-muted-foreground">هذه الصفحة متاحة للمشرفين فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">حضور المعلمين</h1>
          <p className="text-muted-foreground mt-1">تسجيل ومتابعة حضور المعلمين</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            اليومي
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            الشهري
          </TabsTrigger>
        </TabsList>

        {/* Daily Tab Content */}
        <TabsContent value="daily" className="space-y-6">
          {/* Daily Header with Save Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              اليوم: {data?.dayName} - {data?.date ? new Date(data.date).toLocaleDateString('ar-SA') : ''}
            </p>
            <Button
              onClick={handleSaveAttendance}
              disabled={saving || !data}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Save className="ml-2 h-5 w-5" />
              {saving ? "جاري الحفظ..." : "حفظ الحضور"}
            </Button>
          </div>

          {/* Daily Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المعلمين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">في الحلقات النشطة اليوم</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الحضور</CardTitle>
                <Check className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{stats.present}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}% من الإجمالي
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الغياب</CardTitle>
                <X className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}% من الإجمالي
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المتأخرين</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{stats.late}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}% من الإجمالي
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Halaqat with Teachers */}
          <div className="space-y-6">
            {data?.halaqat.map((halaqa) => (
              <Card key={halaqa.halaqaId} className={!halaqa.isActiveToday ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{halaqa.halaqaName}</CardTitle>
                      {!halaqa.isActiveToday && (
                        <Badge variant="outline" className="text-muted-foreground">
                          غير نشطة اليوم
                        </Badge>
                      )}
                    </div>
                    {(halaqa.location || halaqa.timeSlot) && (
                      <div className="text-sm text-muted-foreground">
                        {halaqa.location && <span>{halaqa.location}</span>}
                        {halaqa.location && halaqa.timeSlot && <span> • </span>}
                        {halaqa.timeSlot && <span>{halaqa.timeSlot}</span>}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!halaqa.isActiveToday ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                      <p>هذه الحلقة غير نشطة اليوم</p>
                    </div>
                  ) : halaqa.teachers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      لا يوجد معلمين في هذه الحلقة
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">المعلم</TableHead>
                          <TableHead className="text-center w-[15%]">حاضر</TableHead>
                          <TableHead className="text-center w-[15%]">غائب</TableHead>
                          <TableHead className="text-center w-[15%]">متأخر</TableHead>
                          <TableHead className="text-center w-[15%]">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {halaqa.teachers.map((teacher) => {
                          const key = `${teacher.teacherId}-${halaqa.halaqaId}`;
                          const state = attendanceData.get(key);
                          const status = state?.status ?? 1;

                          return (
                            <TableRow key={key}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{teacher.teacherName}</p>
                                  {teacher.phoneNumber && (
                                    <p className="text-sm text-muted-foreground">{teacher.phoneNumber}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant={status === 0 ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleAttendanceChange(teacher.teacherId, halaqa.halaqaId, 0)}
                                  className={`h-10 w-10 p-0 ${status === 0 ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant={status === 1 ? "destructive" : "outline"}
                                  size="sm"
                                  onClick={() => handleAttendanceChange(teacher.teacherId, halaqa.halaqaId, 1)}
                                  className="h-10 w-10 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant={status === 2 ? "secondary" : "outline"}
                                  size="sm"
                                  onClick={() => handleAttendanceChange(teacher.teacherId, halaqa.halaqaId, 2)}
                                  className={`h-10 w-10 p-0 ${status === 2 ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">
                                {getStatusBadge(status)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {data?.halaqat.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">لا توجد حلقات</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Monthly Tab Content */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Month/Year Selector and Export Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">الشهر:</span>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARABIC_MONTHS.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">السنة:</span>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleExportMonthly}
              disabled={exporting || monthlyLoading}
              className="w-full sm:w-auto"
            >
              {exporting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="ml-2 h-4 w-4" />
              )}
              {exporting ? "جاري التصدير..." : "تصدير Excel"}
            </Button>
          </div>

          {monthlyLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">جاري تحميل التقرير...</p>
              </div>
            </div>
          ) : monthlyData ? (
            <>
              {/* Monthly Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">عدد المعلمين</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{monthlyData.totalTeachers}</div>
                    <p className="text-xs text-muted-foreground">في {monthlyData.monthName} {monthlyData.year}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي أيام الحضور</CardTitle>
                    <Check className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{monthlyData.totalPresentDays}</div>
                    <p className="text-xs text-muted-foreground">من {monthlyData.totalExpectedDays} يوم متوقع</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي أيام الغياب</CardTitle>
                    <X className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{monthlyData.totalAbsentDays}</div>
                    <p className="text-xs text-muted-foreground">
                      {monthlyData.totalExpectedDays > 0 
                        ? ((monthlyData.totalAbsentDays / monthlyData.totalExpectedDays) * 100).toFixed(1) 
                        : 0}% من الإجمالي
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">نسبة الحضور</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {monthlyData.totalExpectedDays > 0 
                        ? ((monthlyData.totalPresentDays / monthlyData.totalExpectedDays) * 100).toFixed(1) 
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">للشهر الحالي</p>
                  </CardContent>
                </Card>
              </div>

              {/* Teachers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل حضور المعلمين - {monthlyData.monthName} {monthlyData.year}</CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyData.teachers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد بيانات حضور لهذا الشهر</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%]">المعلم</TableHead>
                            <TableHead className="text-center">الأيام المتوقعة</TableHead>
                            <TableHead className="text-center">أيام الحضور</TableHead>
                            <TableHead className="text-center">أيام الغياب</TableHead>
                            <TableHead className="text-center">أيام التأخر</TableHead>
                            <TableHead className="text-center">نسبة الحضور</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyData.teachers.map((teacher) => (
                            <TableRow key={teacher.teacherId}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{teacher.teacherName}</p>
                                  {teacher.phoneNumber && (
                                    <p className="text-sm text-muted-foreground">{teacher.phoneNumber}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {teacher.expectedDays}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-emerald-600 font-medium">{teacher.presentDays}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-medium ${teacher.absentDays > 0 ? "text-red-600" : ""}`}>
                                  {teacher.absentDays}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-medium ${teacher.lateDays > 0 ? "text-amber-600" : ""}`}>
                                  {teacher.lateDays}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  className={
                                    teacher.attendanceRate >= 90 
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : teacher.attendanceRate >= 75
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  }
                                >
                                  {teacher.attendanceRate.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">اختر الشهر والسنة لعرض التقرير</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}





