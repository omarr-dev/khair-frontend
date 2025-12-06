"use client";

import { useState, useEffect } from "react";
import { attendanceApi, halaqatApi, studentApi } from "@/lib/api";
import { Halaqa } from "@/types/progress";
import { AttendanceSummary, StudentAttendance } from "@/types/attendance";
import { Student } from "@/types/student";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Check, X, Clock, Save } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

type AttendanceStatus = 0 | 1 | 2; // 0: Present, 1: Absent, 2: Late

export default function AttendancePage() {
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [selectedHalaqa, setSelectedHalaqa] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [attendanceData, setAttendanceData] = useState<Map<number, StudentAttendance>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchHalaqat();
  }, []);

  useEffect(() => {
    if (selectedHalaqa && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedHalaqa, selectedDate]);

  const fetchHalaqat = async () => {
    try {
      const response = await halaqatApi.getAll();
      setHalaqat(response.data);
      if (response.data.length > 0) {
        setSelectedHalaqa(response.data[0].id.toString());
      }
    } catch (error) {
      console.error("Error fetching halaqat:", error);
    }
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      // Fetch students in the halaqa
      const studentsResponse = await studentApi.getByHalaqa(parseInt(selectedHalaqa));
      setStudents(studentsResponse.data);

      // Fetch attendance for the selected date
      const attendanceResponse = await attendanceApi.getByDate(
        parseInt(selectedHalaqa),
        selectedDate
      );
      setAttendanceSummary(attendanceResponse.data);

      // Initialize attendance data
      const newAttendanceData = new Map<number, StudentAttendance>();
      
      attendanceResponse.data.records.forEach((record) => {
        const status = 
          record.status === "حاضر" ? 0 : 
          record.status === "غائب" ? 1 : 
          record.status === "متأخر" ? 2 : 1;
          
        newAttendanceData.set(record.studentId, {
          studentId: record.studentId,
          status: status as AttendanceStatus,
          notes: record.notes
        });
      });

      // Add students without attendance records (default to absent)
      studentsResponse.data.forEach((student) => {
        if (!newAttendanceData.has(student.id)) {
          newAttendanceData.set(student.id, {
            studentId: student.id,
            status: 1, // Absent by default
            notes: undefined
          });
        }
      });

      setAttendanceData(newAttendanceData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: number, status: AttendanceStatus) => {
    const newData = new Map(attendanceData);
    const current = newData.get(studentId) || { studentId, status: 1, notes: undefined };
    newData.set(studentId, { ...current, status });
    setAttendanceData(newData);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const bulkData = {
        halaqaId: parseInt(selectedHalaqa),
        date: selectedDate,
        attendance: Array.from(attendanceData.values())
      };

      await attendanceApi.createBulk(bulkData);
      
      // Refresh attendance data
      await fetchStudentsAndAttendance();
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 0: // Present
        return <Check className="h-4 w-4 text-green-600" />;
      case 1: // Absent
        return <X className="h-4 w-4 text-red-600" />;
      case 2: // Late
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 0:
        return <Badge className="bg-green-100 text-green-800">حاضر</Badge>;
      case 1:
        return <Badge className="bg-red-100 text-red-800">غائب</Badge>;
      case 2:
        return <Badge className="bg-yellow-100 text-yellow-800">متأخر</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">تسجيل الحضور</h1>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الحلقة</label>
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
              <label className="text-sm font-medium">التاريخ</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSaveAttendance}
                disabled={!selectedHalaqa || !selectedDate || saving}
                className="w-full"
              >
                <Save className="ml-2 h-4 w-4" />
                {saving ? "جاري الحفظ..." : "حفظ الحضور"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      {attendanceSummary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceSummary.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{attendanceSummary.present}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الغياب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نسبة الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceSummary.attendanceRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead className="text-center">حاضر</TableHead>
                  <TableHead className="text-center">غائب</TableHead>
                  <TableHead className="text-center">متأخر</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      لا يوجد طلاب في هذه الحلقة
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    const attendance = attendanceData.get(student.id);
                    const status = attendance?.status ?? 1;
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.fullName}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={status === 0 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, 0)}
                            className="w-12 h-12"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={status === 1 ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, 1)}
                            className="w-12 h-12"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={status === 2 ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, 2)}
                            className="w-12 h-12"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(status)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
