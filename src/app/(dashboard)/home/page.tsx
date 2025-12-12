"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  statisticsApi, 
  DashboardStats, 
  SupervisorDashboard, 
  AttendanceTrend,
  ProgressTrend
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  BookOpen,
  TrendingUp,
  Calendar,
  GraduationCap,
  AlertTriangle,
  Trophy,
  Eye,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [supervisorDashboard, setSupervisorDashboard] = useState<SupervisorDashboard | null>(null);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([]);
  const [progressTrends, setProgressTrends] = useState<ProgressTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const isSupervisor = user?.role === "Supervisor";

  useEffect(() => {
    if (isSupervisor) {
      fetchSupervisorData();
    } else {
      fetchTeacherData();
    }
  }, [isSupervisor]);

  const fetchTeacherData = async () => {
    try {
      const response = await statisticsApi.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisorData = async () => {
    try {
      const [dashboardRes, attendanceRes, progressRes] = await Promise.all([
        statisticsApi.getSupervisorDashboard(),
        statisticsApi.getAttendanceTrends(14),
        statisticsApi.getProgressTrends(14),
      ]);
      setSupervisorDashboard(dashboardRes.data);
      setAttendanceTrends(attendanceRes.data);
      setProgressTrends(progressRes.data);
    } catch (error) {
      console.error("Error fetching supervisor dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Supervisor Dashboard
  if (isSupervisor && supervisorDashboard) {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">أهلاً {user?.fullName}</h1>
          <p className="text-muted-foreground">
            لوحة تحكم المشرف - نظرة شاملة على أداء الحلقات
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحلقات</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supervisorDashboard.totalHalaqat}</div>
              <p className="text-xs text-muted-foreground">حلقة نشطة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الطلاب</CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supervisorDashboard.totalStudents}</div>
              <p className="text-xs text-muted-foreground">إجمالي الطلاب</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نسبة الحضور اليوم</CardTitle>
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supervisorDashboard.todayAttendanceRate}%</div>
              <p className="text-xs text-muted-foreground">من الطلاب المسجلين</p>
            </CardContent>
          </Card>

          <Card className={supervisorDashboard.studentsAtRisk > 0 ? "border-red-200 dark:border-red-900" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلاب يحتاجون متابعة</CardTitle>
              <div className={`p-2 rounded-lg ${supervisorDashboard.studentsAtRisk > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-900/30"}`}>
                <AlertTriangle className={`h-4 w-4 ${supervisorDashboard.studentsAtRisk > 0 ? "text-red-600" : "text-gray-600"}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${supervisorDashboard.studentsAtRisk > 0 ? "text-red-600" : ""}`}>
                {supervisorDashboard.studentsAtRisk}
              </div>
              <p className="text-xs text-muted-foreground">حضور منخفض أو توقف</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              نشاط اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">حفظ جديد</p>
                  <p className="text-2xl font-bold">{supervisorDashboard.todayMemorization}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="p-2 bg-secondary rounded-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">مراجعة</p>
                  <p className="text-2xl font-bold">{supervisorDashboard.todayRevision}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="p-2 bg-muted rounded-lg">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">المعلمين</p>
                  <p className="text-2xl font-bold">{supervisorDashboard.totalTeachers}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attendance Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>اتجاه الحضور (آخر 14 يوم)</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={attendanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'نسبة الحضور']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('ar-SA')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="نسبة الحضور"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>التقدم اليومي (آخر 14 يوم)</CardTitle>
            </CardHeader>
            <CardContent>
              {progressTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={progressTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => new Date(label).toLocaleDateString('ar-SA')}
                    />
                    <Legend />
                    <Bar dataKey="memorization" fill="#3B82F6" name="حفظ جديد" />
                    <Bar dataKey="revision" fill="#10B981" name="مراجعة" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rankings Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Halaqat */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                أفضل الحلقات أداءً
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/halaqat')}>
                عرض الكل
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supervisorDashboard.topHalaqat.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">لا توجد بيانات</p>
                ) : (
                  supervisorDashboard.topHalaqat.map((halaqa, index) => (
                    <div key={halaqa.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-200 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{halaqa.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {halaqa.studentCount} طالب • {halaqa.teacherCount} معلم
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-primary">{halaqa.attendanceRate}%</p>
                        <p className="text-xs text-muted-foreground">{halaqa.weeklyProgress} تسميع</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Teachers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                أفضل المعلمين أداءً
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/teachers')}>
                عرض الكل
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supervisorDashboard.topTeachers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">لا توجد بيانات</p>
                ) : (
                  supervisorDashboard.topTeachers.map((teacher, index) => (
                    <div key={teacher.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-200 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{teacher.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {teacher.studentCount} طالب
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-primary">{teacher.studentAttendanceRate}%</p>
                        <p className="text-xs text-muted-foreground">{teacher.weeklyProgress} تسميع</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* At-Risk Students */}
        {supervisorDashboard.atRiskStudents.length > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                طلاب يحتاجون متابعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supervisorDashboard.atRiskStudents.slice(0, 5).map((student) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                    onClick={() => router.push(`/my-students/${student.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.halaqaName} • {student.teacherName}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {student.attendanceRate < 70 && (
                        <Badge variant="destructive" className="gap-1">
                          <ArrowDown className="h-3 w-3" />
                          {student.attendanceRate}% حضور
                        </Badge>
                      )}
                      {student.consecutiveAbsences >= 3 && (
                        <Badge variant="destructive">
                          {student.consecutiveAbsences} غياب متتالي
                        </Badge>
                      )}
                      {student.daysSinceLastProgress >= 7 && (
                        <Badge variant="secondary">
                          {student.daysSinceLastProgress} يوم بدون تسميع
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Teacher Dashboard (original)
  const statCards = stats ? [
    {
      title: "الحلقات",
      value: stats.totalHalaqat.toString(),
      subtitle: `${stats.activeHalaqat} نشطة`,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "الطلاب",
      value: stats.totalStudents.toString(),
      subtitle: "إجمالي الطلاب",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "المعلمين",
      value: stats.totalTeachers.toString(),
      subtitle: "إجمالي المعلمين",
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "نسبة الحضور",
      value: `${stats.averageAttendanceRate}%`,
      subtitle: "اليوم",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ] : [];

  const todayStats = stats ? [
    { label: "حفظ جديد", value: stats.todayMemorization, icon: GraduationCap },
    { label: "مراجعة", value: stats.todayRevision, icon: BookOpen },
    { label: "حضور اليوم", value: stats.todayAttendance, icon: Calendar },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">أهلاً {user?.fullName}</h1>
        <p className="text-muted-foreground">
          مرحباً بك في لوحة التحكم الخاصة بالمعلمين
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle>نشاط اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {todayStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center space-x-4 space-x-reverse"
              >
                <div className="p-2 bg-muted rounded-lg">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>نصائح سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium">
                  📖 تأكد من تسجيل التقدم اليومي لجميع الطلاب
                </p>
                <p className="text-sm text-muted-foreground">
                  التسجيل المنتظم يساعد في متابعة تقدم الطلاب
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium">
                  ✅ لا تنس تسجيل الحضور في بداية كل حلقة
                </p>
                <p className="text-sm text-muted-foreground">
                  الحضور المنتظم مؤشر مهم على التزام الطلاب
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium">
                  📊 راجع التقارير أسبوعياً لتحليل الأداء
                </p>
                <p className="text-sm text-muted-foreground">
                  التقارير تساعد في تحديد نقاط القوة والضعف
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
