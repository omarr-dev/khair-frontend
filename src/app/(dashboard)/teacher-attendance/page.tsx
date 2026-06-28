"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { teacherAttendanceApi, exportApi } from "@/services";
import {
  TodayTeacherAttendanceResponse,
  TeacherAttendanceEntry,
  MonthlyAttendanceReport,
  HalaqaTeachersAttendance,
  TeacherWithAttendance
} from "@/types/teacher-attendance";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Check, X, Clock, Save, Users, AlertTriangle, CalendarDays, Download, Calendar, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

type AttendanceStatus = 0 | 1 | 2; // 0: Present, 1: Absent, 2: Late

interface AttendanceState {
  status: AttendanceStatus | null; // null = not recorded yet (supervisor hasn't chosen)
  notes?: string;
  checkInTime?: string;  // "HH:mm"
  checkOutTime?: string; // "HH:mm"
}

/** Normalize a "HH:mm:ss" (or "HH:mm") API time to the "HH:mm" used by <input type="time">. */
const toTimeInput = (time?: string | null): string => (time ? time.slice(0, 5) : "");

/**
 * Normalize an attendance status from the API into the numeric code (0/1/2) the
 * page is built around. The backend serializes the enum as a string
 * ("Present"/"Absent"/"Late") via JsonStringEnumConverter, so coerce both the
 * string and (defensively) the numeric forms; null/unknown → null (not recorded).
 */
const toStatusCode = (status: unknown): AttendanceStatus | null => {
  switch (status) {
    case 0:
    case "Present":
      return 0;
    case 1:
    case "Absent":
      return 1;
    case 2:
    case "Late":
      return 2;
    default:
      return null;
  }
};

/** Worked hours between two "HH:mm" strings, or null when incomplete/invalid. */
const computeHours = (inT?: string, outT?: string): number | null => {
  if (!inT || !outT) return null;
  const [ih, im] = inT.split(":").map(Number);
  const [oh, om] = outT.split(":").map(Number);
  const diff = oh * 60 + om - (ih * 60 + im);
  return diff > 0 ? Math.round((diff / 60) * 10) / 10 : null;
};

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const getStatusBadge = (status: AttendanceStatus | null) => {
  switch (status) {
    case 0:
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">حاضر</Badge>;
    case 1:
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">غائب</Badge>;
    case 2:
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">متأخر</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">لم يُسجّل</Badge>;
  }
};

type StatusChangeHandler = (teacherId: number, halaqaId: number, status: AttendanceStatus) => void;
type TimeChangeHandler = (
  teacherId: number,
  halaqaId: number,
  field: "checkInTime" | "checkOutTime",
  value: string,
) => void;

interface TeacherRowProps {
  teacher: TeacherWithAttendance;
  halaqaId: number;
  state: AttendanceState | undefined;
  onStatusChange: StatusChangeHandler;
  onTimeChange: TimeChangeHandler;
}

/**
 * One teacher's attendance row. Memoized so that editing a single teacher only
 * re-renders that row — not all rows on the page. This relies on the parent
 * keeping `state` object identity stable for untouched teachers and passing
 * referentially-stable handlers.
 */
const TeacherRow = memo(function TeacherRow({
  teacher,
  halaqaId,
  state,
  onStatusChange,
  onTimeChange,
}: TeacherRowProps) {
  const status: AttendanceStatus | null = state?.status ?? null;
  const timesDisabled = status === 1 || status === null; // absent or not recorded
  const hours = computeHours(state?.checkInTime, state?.checkOutTime);

  return (
    <TableRow>
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
          onClick={() => onStatusChange(teacher.teacherId, halaqaId, 0)}
          className={`h-10 w-10 p-0 ${status === 0 ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
        >
          <Check className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant={status === 1 ? "destructive" : "outline"}
          size="sm"
          onClick={() => onStatusChange(teacher.teacherId, halaqaId, 1)}
          className="h-10 w-10 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant={status === 2 ? "secondary" : "outline"}
          size="sm"
          onClick={() => onStatusChange(teacher.teacherId, halaqaId, 2)}
          className={`h-10 w-10 p-0 ${status === 2 ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
        >
          <Clock className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="text-center">{getStatusBadge(status)}</TableCell>
      <TableCell className="text-center">
        <input
          type="time"
          value={state?.checkInTime ?? ""}
          disabled={timesDisabled}
          onChange={(e) => onTimeChange(teacher.teacherId, halaqaId, "checkInTime", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </TableCell>
      <TableCell className="text-center">
        <input
          type="time"
          value={state?.checkOutTime ?? ""}
          disabled={timesDisabled}
          onChange={(e) => onTimeChange(teacher.teacherId, halaqaId, "checkOutTime", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </TableCell>
      <TableCell className="text-center font-medium text-muted-foreground">
        {hours !== null ? `${hours} س` : "—"}
      </TableCell>
    </TableRow>
  );
});

interface HalaqaCardProps {
  halaqa: HalaqaTeachersAttendance;
  attendanceData: Map<string, AttendanceState>;
  onStatusChange: StatusChangeHandler;
  onTimeChange: TimeChangeHandler;
}

/** One halaqa card with its teacher table. */
const HalaqaCard = memo(function HalaqaCard({
  halaqa,
  attendanceData,
  onStatusChange,
  onTimeChange,
}: HalaqaCardProps) {
  return (
    <Card className={!halaqa.isActiveToday ? "opacity-60" : ""}>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">المعلم</TableHead>
                  <TableHead className="text-center">حاضر</TableHead>
                  <TableHead className="text-center">غائب</TableHead>
                  <TableHead className="text-center">متأخر</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">وقت الحضور</TableHead>
                  <TableHead className="text-center">وقت الانصراف</TableHead>
                  <TableHead className="text-center">الساعات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {halaqa.teachers.map((teacher) => (
                  <TeacherRow
                    key={`${teacher.teacherId}-${halaqa.halaqaId}`}
                    teacher={teacher}
                    halaqaId={halaqa.halaqaId}
                    state={attendanceData.get(`${teacher.teacherId}-${halaqa.halaqaId}`)}
                    onStatusChange={onStatusChange}
                    onTimeChange={onTimeChange}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default function TeacherAttendancePage() {
  const [activeTab, setActiveTab] = useState("daily");
  
  // Daily state
  const [data, setData] = useState<TodayTeacherAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceState>>(new Map());
  const [halaqaSearch, setHalaqaSearch] = useState(""); // client-side filter over the loaded halaqat

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
              status: toStatusCode(teacher.status), // keep saved status; leave unset when no record yet
              notes: teacher.notes,
              checkInTime: toTimeInput(teacher.checkInTime),
              checkOutTime: toTimeInput(teacher.checkOutTime),
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

  // Functional updates keep these handlers referentially stable across renders, which is what
  // lets the memoized TeacherRow skip re-rendering untouched rows. `new Map(prev)` preserves the
  // object identity of every entry except the one we replace, so only the edited row's `state`
  // prop changes.
  const handleAttendanceChange = useCallback(
    (teacherId: number, halaqaId: number, status: AttendanceStatus) => {
      const key = `${teacherId}-${halaqaId}`;
      setAttendanceData((prev) => {
        const newData = new Map(prev);
        const current = newData.get(key) || { status: null };
        // Times only make sense for present/late; clear them when marking absent.
        if (status === 1) {
          newData.set(key, { ...current, status, checkInTime: "", checkOutTime: "" });
        } else {
          newData.set(key, { ...current, status });
        }
        return newData;
      });
    },
    [],
  );

  const handleTimeChange = useCallback(
    (
      teacherId: number,
      halaqaId: number,
      field: "checkInTime" | "checkOutTime",
      value: string,
    ) => {
      const key = `${teacherId}-${halaqaId}`;
      setAttendanceData((prev) => {
        const newData = new Map(prev);
        const current = newData.get(key) || { status: null };
        newData.set(key, { ...current, [field]: value });
        return newData;
      });
    },
    [],
  );

  const handleSaveAttendance = async () => {
    if (!data) return;

    setSaving(true);
    try {
      const attendance: TeacherAttendanceEntry[] = [];
      let invalidTime = "";

      data.halaqat.forEach((halaqa) => {
        if (halaqa.isActiveToday) {
          halaqa.teachers.forEach((teacher) => {
            const key = `${teacher.teacherId}-${halaqa.halaqaId}`;
            const state = attendanceData.get(key);
            // Only include if state exists and status is a valid number
            if (state && typeof state.status === 'number') {
              // Times only apply to present/late records
              const withTimes = state.status !== 1;
              const checkInTime = withTimes ? state.checkInTime || null : null;
              const checkOutTime = withTimes ? state.checkOutTime || null : null;

              if (checkInTime && checkOutTime && checkOutTime <= checkInTime) {
                invalidTime = teacher.teacherName;
              }

              attendance.push({
                teacherId: teacher.teacherId,
                halaqaId: halaqa.halaqaId,
                status: state.status,
                checkInTime,
                checkOutTime,
                notes: state.notes,
              });
            }
          });
        }
      });

      if (invalidTime) {
        toast.error(`وقت الانصراف يجب أن يكون بعد وقت الحضور (${invalidTime})`);
        return;
      }

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

  // Daily statistics — recomputed only when the data or recorded attendance changes.
  // Always derived from the FULL halaqat list (not the filtered view) so the totals stay correct.
  const stats = useMemo(() => {
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

    const unrecorded = total - present - absent - late;
    return { total, present, absent, late, unrecorded };
  }, [data, attendanceData]);

  // Client-side filter: only changes WHAT IS RENDERED, never the underlying data or edits.
  // Filtering here (instead of refetching a server-side slice) means unsaved attendance survives.
  const visibleHalaqat = useMemo(() => {
    const all = data?.halaqat ?? [];
    const q = halaqaSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (h) =>
        h.halaqaName.toLowerCase().includes(q) ||
        (h.location?.toLowerCase().includes(q) ?? false),
    );
  }, [data, halaqaSearch]);

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
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                اليوم: {data?.dayName} - {data?.date ? new Date(data.date).toLocaleDateString('ar-SA') : ''}
              </p>
              {stats.unrecorded > 0 && (
                <p className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {stats.unrecorded} معلم لم يُسجّل حضوره بعد
                </p>
              )}
            </div>
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

          {/* Halaqa search filter */}
          {data && data.halaqat.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={halaqaSearch}
                  onChange={(e) => setHalaqaSearch(e.target.value)}
                  placeholder="بحث باسم الحلقة أو الموقع..."
                  className="pr-9"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                عرض {visibleHalaqat.length} من {data.halaqat.length} حلقة
              </p>
            </div>
          )}

          {/* Halaqat with Teachers */}
          <div className="space-y-6">
            {visibleHalaqat.map((halaqa) => (
              <HalaqaCard
                key={halaqa.halaqaId}
                halaqa={halaqa}
                attendanceData={attendanceData}
                onStatusChange={handleAttendanceChange}
                onTimeChange={handleTimeChange}
              />
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

          {data && data.halaqat.length > 0 && visibleHalaqat.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">لا توجد حلقات مطابقة للبحث</p>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الساعات</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {(monthlyData.totalHours ?? 0).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">ساعة عمل مسجّلة</p>
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
                            <TableHead className="text-center">إجمالي الساعات</TableHead>
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
                                <span className="font-medium text-blue-600">
                                  {(teacher.totalHours ?? 0).toFixed(1)} س
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





