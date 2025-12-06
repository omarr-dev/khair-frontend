"use client";

import { useState, useEffect } from "react";
import { progressApi, studentApi, halaqatApi } from "@/lib/api";
import { Student } from "@/types/student";
import { ProgressRecord, DailyProgressSummary, Halaqa, CreateProgressRecord } from "@/types/progress";
import { surahs } from "@/lib/quran-data";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar, BookOpen, Users, GraduationCap, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function ProgressPage() {
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [todayProgress, setTodayProgress] = useState<DailyProgressSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // Form state
  const [selectedHalaqa, setSelectedHalaqa] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [progressType, setProgressType] = useState<string>("0"); // 0: Memorization
  const [selectedSurah, setSelectedSurah] = useState<string>("");
  const [fromVerse, setFromVerse] = useState<string>("");
  const [toVerse, setToVerse] = useState<string>("");
  const [quality, setQuality] = useState<string>("0"); // 0: Excellent
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    fetchHalaqat();
    fetchTodayProgress();
  }, []);

  useEffect(() => {
    if (selectedHalaqa) {
      fetchStudentsByHalaqa(selectedHalaqa);
    }
  }, [selectedHalaqa]);

  const fetchHalaqat = async () => {
    try {
      const response = await halaqatApi.getAll();
      setHalaqat(response.data);
    } catch (error) {
      console.error("Error fetching halaqat:", error);
    }
  };

  const fetchStudentsByHalaqa = async (halaqaId: string) => {
    try {
      const response = await studentApi.getByHalaqa(parseInt(halaqaId));
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchTodayProgress = async () => {
    try {
      const response = await progressApi.getTodayProgress();
      setTodayProgress(response.data);
    } catch (error) {
      console.error("Error fetching today's progress:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedSurahData = surahs.find(s => s.name === selectedSurah);
      
      const data: CreateProgressRecord = {
        studentId: parseInt(selectedStudent),
        teacherId: user?.teacherId || 1, // TODO: Get actual teacher ID
        halaqaId: parseInt(selectedHalaqa),
        date: new Date().toISOString(),
        type: parseInt(progressType) as 0 | 1,
        surahName: selectedSurah,
        fromVerse: parseInt(fromVerse),
        toVerse: parseInt(toVerse),
        quality: parseInt(quality) as 0 | 1 | 2 | 3,
        notes: notes || undefined,
      };

      await progressApi.create(data);
      
      // Reset form
      setSelectedStudent("");
      setFromVerse("");
      setToVerse("");
      setNotes("");
      
      // Refresh today's progress
      fetchTodayProgress();
    } catch (error) {
      console.error("Error creating progress record:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
      try {
        await progressApi.delete(id);
        fetchTodayProgress();
      } catch (error) {
        console.error("Error deleting progress record:", error);
      }
    }
  };

  const getQualityBadge = (quality: string) => {
    const variants = {
      "ممتاز": "default",
      "جيد جداً": "secondary",
      "جيد": "outline",
      "مقبول": "destructive",
    } as const;
    
    return (
      <Badge variant={variants[quality as keyof typeof variants] || "default"}>
        {quality}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المتابعة اليومية</h1>
        <div className="text-sm text-muted-foreground">
          <Calendar className="inline-block ml-2 h-4 w-4" />
          {format(new Date(), "dd MMMM yyyy", { locale: ar })}
        </div>
      </div>

      {/* Progress Form */}
      <Card>
        <CardHeader>
          <CardTitle>تسجيل التقدم</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="student">الطالب</Label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                  disabled={!selectedHalaqa}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">نوع التسميع</Label>
                <Select value={progressType} onValueChange={setProgressType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">حفظ جديد</SelectItem>
                    <SelectItem value="1">مراجعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="surah">السورة</Label>
                <Select value={selectedSurah} onValueChange={setSelectedSurah}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السورة" />
                  </SelectTrigger>
                  <SelectContent>
                    {surahs.map((surah) => (
                      <SelectItem key={surah.id} value={surah.name}>
                        {surah.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromVerse">من الآية</Label>
                <Input
                  id="fromVerse"
                  type="number"
                  min="1"
                  value={fromVerse}
                  onChange={(e) => setFromVerse(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toVerse">إلى الآية</Label>
                <Input
                  id="toVerse"
                  type="number"
                  min="1"
                  value={toVerse}
                  onChange={(e) => setToVerse(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality">التقييم</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">ممتاز</SelectItem>
                    <SelectItem value="1">جيد جداً</SelectItem>
                    <SelectItem value="2">جيد</SelectItem>
                    <SelectItem value="3">مقبول</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية..."
              />
            </div>

            <Button type="submit" disabled={loading || !selectedStudent}>
              {loading ? "جاري الحفظ..." : "حفظ التقدم"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      {todayProgress && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حفظ جديد</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayProgress.totalMemorization}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مراجعة</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayProgress.totalRevision}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد الطلاب</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayProgress.uniqueStudents}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Records */}
      {todayProgress && todayProgress.records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>سجلات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>الحلقة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>السورة</TableHead>
                  <TableHead>الآيات</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead>المعلم</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayProgress.records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell>{record.halaqaName}</TableCell>
                    <TableCell>
                      <Badge variant={record.type === "حفظ جديد" ? "default" : "secondary"}>
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.surahName}</TableCell>
                    <TableCell>{record.fromVerse} - {record.toVerse}</TableCell>
                    <TableCell>{getQualityBadge(record.quality)}</TableCell>
                    <TableCell>{record.teacherName}</TableCell>
                    <TableCell>
                      {user?.role === "Supervisor" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
