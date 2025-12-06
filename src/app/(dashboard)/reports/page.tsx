"use client";

import { useState, useEffect } from "react";
import { progressApi, attendanceApi, studentApi, halaqatApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Award
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ar } from "date-fns/locale";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");
  const [selectedHalaqa, setSelectedHalaqa] = useState<string>("all");
  const [halaqat, setHalaqat] = useState<any[]>([]);
  
  // Chart data states
  const [progressData, setProgressData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
  const [qualityDistribution, setQualityDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchHalaqat();
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
    // Mock data for demonstration
    // In a real application, these would be actual API calls
    
    // Progress over time
    const mockProgressData = [
      { date: "الأحد", memorization: 45, revision: 120 },
      { date: "الاثنين", memorization: 52, revision: 115 },
      { date: "الثلاثاء", memorization: 48, revision: 125 },
      { date: "الأربعاء", memorization: 58, revision: 110 },
      { date: "الخميس", memorization: 55, revision: 118 },
      { date: "الجمعة", memorization: 0, revision: 0 },
      { date: "السبت", memorization: 42, revision: 122 },
    ];
    setProgressData(mockProgressData);

    // Attendance trends
    const mockAttendanceData = [
      { date: "الأحد", rate: 92 },
      { date: "الاثنين", rate: 88 },
      { date: "الثلاثاء", rate: 95 },
      { date: "الأربعاء", rate: 91 },
      { date: "الخميس", rate: 89 },
      { date: "الجمعة", rate: 0 },
      { date: "السبت", rate: 94 },
    ];
    setAttendanceData(mockAttendanceData);

    // Top performing students
    const mockStudentPerformance = [
      { name: "أحمد محمد", progress: 85, quality: 4.8 },
      { name: "فاطمة علي", progress: 78, quality: 4.5 },
      { name: "خالد أحمد", progress: 72, quality: 4.2 },
      { name: "عائشة سالم", progress: 68, quality: 4.0 },
      { name: "عمر يوسف", progress: 65, quality: 3.8 },
    ];
    setStudentPerformance(mockStudentPerformance);

    // Quality distribution
    const mockQualityData = [
      { name: "ممتاز", value: 45, color: "#10B981" },
      { name: "جيد جداً", value: 30, color: "#3B82F6" },
      { name: "جيد", value: 20, color: "#F59E0B" },
      { name: "مقبول", value: 5, color: "#EF4444" },
    ];
    setQualityDistribution(mockQualityData);
  };

  const handleExport = (type: "pdf" | "excel") => {
    // Implement export functionality
    console.log(`Exporting as ${type}...`);
  };

  const stats = [
    {
      title: "إجمالي الطلاب",
      value: "320",
      change: "+5.2%",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "متوسط الحضور",
      value: "91%",
      change: "+2.1%",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "حفظ جديد هذا الأسبوع",
      value: "300",
      change: "+8.3%",
      icon: BookOpen,
      color: "text-purple-600",
    },
    {
      title: "متوسط الجودة",
      value: "4.5",
      change: "+0.3",
      icon: Award,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
        <div className="flex gap-2">
          <Button onClick={() => handleExport("excel")} variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير Excel
          </Button>
          <Button onClick={() => handleExport("pdf")}>
            <Download className="ml-2 h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الفترة الزمنية</label>
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
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
              <label className="text-sm font-medium">الحلقة</label>
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
                <BarChart data={progressData}>
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
                <LineChart data={attendanceData}>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="progress" fill="#3B82F6" name="التقدم (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>توزيع جودة الحفظ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={qualityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {qualityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
