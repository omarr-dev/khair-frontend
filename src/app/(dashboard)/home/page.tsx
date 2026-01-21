"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { statisticsApi } from "@/services";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import {
  DashboardStats,
  SupervisorDashboard,
  HalaqaRanking,
  AtRiskStudent
} from "@/types/statistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotivationCard } from "@/components/shared/motivation-card";
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
  ArrowDown,
  ChevronLeft,
  Loader2,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [supervisorDashboard, setSupervisorDashboard] = useState<SupervisorDashboard | null>(null);
  const [topHalaqat, setTopHalaqat] = useState<HalaqaRanking[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const isSupervisor = user?.role === "Supervisor" || user?.role === "HalaqaSupervisor";

  const handleNavigate = (path: string) => {
    setNavigatingTo(path);
    router.push(path);
  };

  useEffect(() => {
    if (isSupervisor) {
      fetchSupervisorData();
    } else {
      fetchTeacherData();
    }
  }, [isSupervisor]);

  const fetchTeacherData = async () => {
    try {
      const [statsRes, topHalaqatRes, atRiskRes] = await Promise.all([
        statisticsApi.getDashboardStats(),
        statisticsApi.getTopHalaqat(),
        statisticsApi.getMyAtRiskStudents(5),
      ]);
      setStats(statsRes.data);
      setTopHalaqat(topHalaqatRes.data);
      setAtRiskStudents(atRiskRes.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء تحميل البيانات");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisorData = async () => {
    try {
      const dashboardRes = await statisticsApi.getSupervisorDashboard();
      setSupervisorDashboard(dashboardRes.data);
    } catch (error) {
      console.error("Error fetching supervisor dashboard:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء تحميل لوحة التحكم");
      toast.error(errorMessage);
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
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2">حيَّاك الله، {user?.fullName.split(' ')[0]}</h1>
          <p className="text-muted-foreground">
            لوحة التحكم - نظرة شاملة على أداء الحلقات
          </p>
        </div>

        {/* Motivation Card with System-wide Stats */}
        <MotivationCard />

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card
            className={`cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${navigatingTo === '/halaqat' ? 'opacity-70' : ''}`}
            onClick={() => handleNavigate('/halaqat')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحلقات</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                {navigatingTo === '/halaqat' ? (
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4 text-blue-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supervisorDashboard.totalHalaqat}</div>
              <p className="text-xs text-muted-foreground">حلقة نشطة</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${navigatingTo === '/students' ? 'opacity-70' : ''}`}
            onClick={() => handleNavigate('/students')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الطلاب</CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                {navigatingTo === '/students' ? (
                  <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                ) : (
                  <Users className="h-4 w-4 text-green-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supervisorDashboard.totalStudents}</div>
              <p className="text-xs text-muted-foreground">إجمالي الطلاب</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${navigatingTo === '/teachers' ? 'opacity-70' : ''}`}
            onClick={() => handleNavigate('/teachers')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المعلمين</CardTitle>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                {navigatingTo === '/teachers' ? (
                  <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supervisorDashboard.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">إجمالي المعلمين</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-md transition-shadow ${supervisorDashboard.studentsAtRisk > 0 ? "border-red-200 dark:border-red-900" : ""}`}
            onClick={() => {
              const atRiskSection = document.getElementById('at-risk-students');
              if (atRiskSection) {
                atRiskSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
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

        {/* Rankings Row */}
        <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Halaqat */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  أفضل الحلقات أداءً
                </CardTitle>
                <p className="text-xs text-muted-foreground font-normal">
                  المعادلة: حضور 60% + مقدار التسميع 40% • آخر أسبوع 📊
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/halaqat')} loading={navigatingTo === '/halaqat'}>
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
                      <p className="font-medium">{halaqa.name}</p>
                      <p className="font-bold text-primary text-lg">{halaqa.score}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Teachers */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                أفضل المعلمين أداءً
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => handleNavigate('/teachers')} loading={navigatingTo === '/teachers'}>
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
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
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
          <Card id="at-risk-students" className="border-red-200 dark:border-red-900">
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
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-[1.01]"
                    onClick={() => handleNavigate(`/my-students/${student.id}`)}
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

  // Teacher Dashboard (enhanced)
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

  // Motivational Poem Component (same as before)
  const MotivationalPoem = () => (
    <div className="py-3 px-4 rounded-lg bg-muted/50">
      <div className="flex justify-center gap-8 sm:gap-16 text-sm sm:text-base text-muted-foreground font-arabic">
        <span>طوبى لمن حفظ الكتاب بصدره</span>
        <span>فبدا وضيئاً كالنجوم تألقا</span>
      </div>
      <div className="flex justify-center gap-8 sm:gap-16 text-sm sm:text-base text-muted-foreground font-arabic">
        <span>الله أكبر يا لها من نعمة</span>
        <span>لما يقال إقرأ فرتّل وارتقى</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">حيَّاك الله، {user?.fullName.split(' ')[0]}</h1>

      </div>

      {/* Motivation Card with Stats */}
      <MotivationCard />

      {/* 2. Quick Access to My Students */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-md transition-all hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">طلابي</h3>
                <p className="text-muted-foreground text-sm">
                  إدارة الطلاب وتسجيل التقدم اليومي
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => handleNavigate('/my-students')}
              className="gap-2"
              loading={navigatingTo === '/my-students'}
            >
              الذهاب للطلاب
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Top 5 Halaqat */}
      <Card className="hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              أفضل الحلقات أداءً
            </CardTitle>
            <p className="text-xs text-muted-foreground font-normal">
              المعادلة: حضور 60% + مقدار التسميع 40% • آخر أسبوع 📊
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topHalaqat.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا توجد بيانات</p>
            ) : (
              topHalaqat.map((halaqa, index) => (
                <div key={halaqa.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{halaqa.name}</p>
                  <p className="font-bold text-primary text-lg">{halaqa.score}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Students Alert (shows only if there are at-risk students) */}
      {atRiskStudents.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              طلاب يحتاجون متابعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-[1.01]"
                  onClick={() => handleNavigate(`/my-students/${student.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{student.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.halaqaName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
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
