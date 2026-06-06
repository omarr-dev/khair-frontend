"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { statisticsApi, halaqatApi, teachersApi } from "@/services";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import {
  DailyAchievementStats,
  StreakLeaderboard,
  TargetAdoptionOverview,
  AtRiskStudent,
} from "@/types/statistics";
import { Halaqa } from "@/types/halaqa";
import { Teacher } from "@/types/teacher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HeroBanner, TeacherCheckInCard } from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Eye,
  ArrowDown,
  Flame,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronLeft,
} from "lucide-react";

// Convert numbers to Arabic numerals
function toArabicNumerals(num: number): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((digit) => {
      if (digit >= "0" && digit <= "9") {
        return arabicNumerals[parseInt(digit)];
      }
      return digit;
    })
    .join("");
}

// Format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Get today and 7 days ago dates
function getDateRange(period: "today" | "week") {
  const today = new Date();
  const toDate = formatDate(today);

  if (period === "today") {
    return { fromDate: toDate, toDate };
  }

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  return { fromDate: formatDate(weekAgo), toDate };
}

type DatePeriod = "today" | "week";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // State for data
  const [dailyAchievement, setDailyAchievement] =
    useState<DailyAchievementStats | null>(null);
  const [streakLeaderboard, setStreakLeaderboard] =
    useState<StreakLeaderboard | null>(null);
  const [targetAdoption, setTargetAdoption] =
    useState<TargetAdoptionOverview | null>(null);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Loading states
  const [loadingAchievement, setLoadingAchievement] = useState(true);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [loadingAdoption, setLoadingAdoption] = useState(true);
  const [loadingAtRisk, setLoadingAtRisk] = useState(true);

  // Filters
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("today");
  const [selectedHalaqaId, setSelectedHalaqaId] = useState<number | undefined>(
    undefined
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>(
    undefined
  );

  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const isSupervisor =
    user?.role === "Supervisor" || user?.role === "HalaqaSupervisor";

  const handleNavigate = (path: string) => {
    setNavigatingTo(path);
    router.push(path);
  };

  // Fetch halaqat and teachers for filter (supervisors only)
  useEffect(() => {
    if (isSupervisor) {
      halaqatApi
        .getAll()
        .then((res) => setHalaqat(res.data))
        .catch(console.error);
      teachersApi
        .getAll()
        .then((res) => setTeachers(res.data))
        .catch(console.error);
    }
  }, [isSupervisor]);

  // Fetch daily achievement
  useEffect(() => {
    const fetchAchievement = async () => {
      setLoadingAchievement(true);
      try {
        const { fromDate, toDate } = getDateRange(datePeriod);
        const response = await statisticsApi.getDailyAchievement({
          fromDate,
          toDate,
          halaqaId: selectedHalaqaId,
          teacherId: selectedTeacherId,
        });
        setDailyAchievement(response.data);
      } catch (error) {
        console.error("Error fetching daily achievement:", error);
        toast.error(extractErrorMessage(error, "حدث خطأ أثناء تحميل الإنجازات"));
      } finally {
        setLoadingAchievement(false);
      }
    };
    fetchAchievement();
  }, [datePeriod, selectedHalaqaId, selectedTeacherId]);

  // Fetch streak leaderboard
  useEffect(() => {
    const fetchStreak = async () => {
      setLoadingStreak(true);
      try {
        const response = await statisticsApi.getStreakLeaderboard({
          limit: 5,
          halaqaId: selectedHalaqaId,
          teacherId: selectedTeacherId,
        });
        setStreakLeaderboard(response.data);
      } catch (error) {
        console.error("Error fetching streak leaderboard:", error);
        toast.error(extractErrorMessage(error, "حدث خطأ أثناء تحميل السلاسل"));
      } finally {
        setLoadingStreak(false);
      }
    };
    fetchStreak();
  }, [selectedHalaqaId, selectedTeacherId]);

  // Fetch target adoption
  useEffect(() => {
    const fetchAdoption = async () => {
      setLoadingAdoption(true);
      try {
        const response = await statisticsApi.getTargetAdoptionOverview({
          halaqaId: selectedHalaqaId,
          teacherId: selectedTeacherId,
        });
        setTargetAdoption(response.data);
      } catch (error) {
        console.error("Error fetching target adoption:", error);
        toast.error(extractErrorMessage(error, "حدث خطأ أثناء تحميل الأهداف"));
      } finally {
        setLoadingAdoption(false);
      }
    };
    fetchAdoption();
  }, [selectedHalaqaId, selectedTeacherId]);

  // Fetch at-risk students
  useEffect(() => {
    const fetchAtRisk = async () => {
      setLoadingAtRisk(true);
      try {
        const response = await statisticsApi.getMyAtRiskStudents(5);
        setAtRiskStudents(response.data);
      } catch (error) {
        console.error("Error fetching at-risk students:", error);
        toast.error(
          extractErrorMessage(error, "حدث خطأ أثناء تحميل الطلاب المعرضين")
        );
      } finally {
        setLoadingAtRisk(false);
      }
    };
    fetchAtRisk();
  }, []);

  return (
    <div className="space-y-6">
      {/* Simple Welcome Message */}
      {user && (
        <h1 className="text-2xl font-bold">
        حيّاك الله، {user.fullName.split(" ")[0]}
        </h1>
      )}

      {/* Hero Banner with Poem */}
      <HeroBanner className="animate-in fade-in slide-in-from-top-4 duration-500" />

      {/* Self check-in (Teachers only) */}
      {user?.role === "Teacher" && <TeacherCheckInCard />}

      {/* Quick Access to My Students - Compact (Teachers only) */}
      {user?.role === "Teacher" && (
        <div
          onClick={() => handleNavigate("/my-students")}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-l from-primary/5 to-primary/10 border border-primary/20 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-sm group animate-in fade-in slide-in-from-top-4"
        >
          <Users className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold">طلابي</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground flex-1">
            عرض جميع الطلاب المسجلين معك
          </span>
          <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      )}

      {/* Filters for Supervisors */}
      {isSupervisor && (halaqat.length > 0 || teachers.length > 0) && (
        <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Halaqa Filter */}
          {halaqat.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">الحلقة:</span>
              <Select
                value={selectedHalaqaId?.toString() ?? "all"}
                onValueChange={(v) =>
                  setSelectedHalaqaId(v === "all" ? undefined : parseInt(v))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="جميع الحلقات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحلقات</SelectItem>
                  {halaqat.map((h) => (
                    <SelectItem key={h.id} value={h.id.toString()}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Teacher Filter */}
          {teachers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">المعلم:</span>
              <Select
                value={selectedTeacherId?.toString() ?? "all"}
                onValueChange={(v) =>
                  setSelectedTeacherId(v === "all" ? undefined : parseInt(v))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="جميع المعلمين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعلمين</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Main Grid - 2 columns on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Achievement Card */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                إنجاز اليوم
              </CardTitle>
              {/* Date Period Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={datePeriod === "today" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setDatePeriod("today")}
                >
                  اليوم
                </Button>
                <Button
                  variant={datePeriod === "week" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setDatePeriod("week")}
                >
                  آخر ٧ أيام
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingAchievement ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : dailyAchievement ? (
              <>
                {/* Achievement Metrics */}
                <div className="space-y-3">
                  {/* Memorization */}
                  <AchievementBar
                    label="حفظ"
                    achieved={dailyAchievement.memorization.achieved}
                    target={dailyAchievement.memorization.target}
                    percentage={dailyAchievement.memorization.percentage}
                    unit={dailyAchievement.memorization.unit}
                    color="emerald"
                  />
                  {/* Revision */}
                  <AchievementBar
                    label="مراجعة"
                    achieved={dailyAchievement.revision.achieved}
                    target={dailyAchievement.revision.target}
                    percentage={dailyAchievement.revision.percentage}
                    unit={dailyAchievement.revision.unit}
                    color="blue"
                  />
                  {/* Consolidation */}
                  <AchievementBar
                    label="تثبيت"
                    achieved={dailyAchievement.consolidation.achieved}
                    target={dailyAchievement.consolidation.target}
                    percentage={dailyAchievement.consolidation.percentage}
                    unit={dailyAchievement.consolidation.unit}
                    color="violet"
                  />
                </div>

                {/* Week Summary - only show for week view */}
                {datePeriod === "week" && dailyAchievement.weekSummary && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        أيام تحقيق الهدف
                      </span>
                      <span className="text-sm font-medium">
                        {toArabicNumerals(
                          dailyAchievement.weekSummary.daysTargetMet
                        )}{" "}
                        /{" "}
                        {toArabicNumerals(
                          dailyAchievement.weekSummary.totalDays
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {dailyAchievement.weekSummary.days.map((day, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            day.targetMet
                              ? "bg-emerald-100 dark:bg-emerald-900/30"
                              : "bg-red-100 dark:bg-red-900/30"
                          )}
                          title={`${new Date(day.date).toLocaleDateString(
                            "ar-SA",
                            { weekday: "short" }
                          )}: ${day.percentage.toFixed(0)}%`}
                        >
                          {day.targetMet ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Students info */}
                <div className="flex items-center justify-between pt-3 border-t text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {toArabicNumerals(dailyAchievement.totalStudents)} طالب
                  </span>
                  <span>
                    {toArabicNumerals(dailyAchievement.studentsWithTargets)}{" "}
                    لديهم أهداف
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streak Leaderboard Card */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              أطول سلاسل الإنجاز
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStreak ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : streakLeaderboard && streakLeaderboard.students.length > 0 ? (
              <div className="space-y-2">
                {streakLeaderboard.students.map((student, index) => (
                  <div
                    key={student.studentId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    {/* Rank */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        index === 0
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : index === 1
                          ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          : index === 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {toArabicNumerals(student.rank)}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {student.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.halaqaName}
                      </p>
                    </div>

                    {/* Streak Count */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Flame
                        className={cn(
                          "h-4 w-4",
                          student.isStreakActive
                            ? "text-orange-500"
                            : "text-gray-400"
                        )}
                      />
                      <span
                        className={cn(
                          "font-bold",
                          student.isStreakActive
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-gray-500"
                        )}
                      >
                        {toArabicNumerals(student.currentStreak)}
                      </span>
                      <span className="text-xs text-muted-foreground">يوم</span>
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="flex items-center justify-between pt-3 border-t text-sm text-muted-foreground">
                  <span>
                    {toArabicNumerals(streakLeaderboard.studentsWithActiveStreaks)}{" "}
                    طالب لديهم سلاسل نشطة
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Adoption Overview Card */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-500" />
              تغطية نظام الأهداف
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAdoption ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Skeleton className="h-32 w-32 rounded-full" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ) : targetAdoption ? (
              <div className="space-y-4">
                {/* Circular Progress */}
                <div className="flex justify-center">
                  <CircularProgress
                    percentage={targetAdoption.coveragePercentage}
                    size={140}
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {toArabicNumerals(targetAdoption.studentsWithTargets)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      طالب لديهم أهداف
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {toArabicNumerals(targetAdoption.totalStudents)}
                    </p>
                    <p className="text-xs text-muted-foreground">إجمالي الطلاب</p>
                  </div>
                </div>

                {/* Weekly Change & Activation Rate */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {targetAdoption.weeklyChangePercentage >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        targetAdoption.weeklyChangePercentage >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {targetAdoption.weeklyChangePercentage >= 0 ? "+" : ""}
                      {toArabicNumerals(
                        Math.round(targetAdoption.weeklyChangePercentage)
                      )}
                      %
                    </span>
                    <span className="text-xs text-muted-foreground">
                      هذا الأسبوع
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">نسبة التفعيل: </span>
                    <span className="font-medium">
                      {toArabicNumerals(Math.round(targetAdoption.activationRate))}
                      %
                    </span>
                  </div>
                </div>

                {/* Coverage Summary */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">الحلقات: </span>
                    <span className="font-medium">
                      {toArabicNumerals(
                        targetAdoption.halaqaCoverage.halaqatWithTargets
                      )}{" "}
                      /{" "}
                      {toArabicNumerals(
                        targetAdoption.halaqaCoverage.totalHalaqat
                      )}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">المعلمين: </span>
                    <span className="font-medium">
                      {toArabicNumerals(
                        targetAdoption.teacherCoverage.teachersWithTargets
                      )}{" "}
                      /{" "}
                      {toArabicNumerals(
                        targetAdoption.teacherCoverage.totalTeachers
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        {/* At-Risk Students Card */}
        <Card
          className={cn(
            "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300",
            atRiskStudents.length > 0 && "border-red-200 dark:border-red-900/50"
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle
              className={cn(
                "flex items-center gap-2 text-lg",
                atRiskStudents.length > 0 && "text-red-600 dark:text-red-400"
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  atRiskStudents.length > 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                )}
              />
              طلاب يحتاجون متابعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAtRisk ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : atRiskStudents.length > 0 ? (
              <div className="space-y-2">
                {atRiskStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-[1.01]"
                    onClick={() => handleNavigate(`/my-students/${student.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.halaqaName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {/* Show consecutive absences count */}
                      <Badge variant="destructive" className="text-xs">
                        {toArabicNumerals(student.consecutiveAbsences)} غياب
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        loading={navigatingTo === `/my-students/${student.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  جميع الطلاب بخير، لا يوجد طلاب يحتاجون متابعة
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Achievement Bar Component
interface AchievementBarProps {
  label: string;
  achieved: number;
  target: number;
  percentage: number;
  unit: string;
  color: "emerald" | "blue" | "violet";
}

function AchievementBar({
  label,
  achieved,
  target,
  percentage,
  unit,
  color,
}: AchievementBarProps) {
  const colorClasses = {
    emerald: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      fill: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      fill: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
    },
    violet: {
      bg: "bg-violet-100 dark:bg-violet-900/30",
      fill: "bg-violet-500",
      text: "text-violet-600 dark:text-violet-400",
    },
  };

  const colors = colorClasses[color];
  const clampedPercentage = Math.min(percentage, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn("font-bold", colors.text)}>
          {toArabicNumerals(Math.round(percentage))}%
        </span>
      </div>
      <div className={cn("h-3 rounded-full overflow-hidden", colors.bg)}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            colors.fill
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {toArabicNumerals(Math.round(achieved))} / {toArabicNumerals(Math.round(target))}{" "}
          {unit}
        </span>
        {percentage >= 100 && (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            تم التحقيق
          </span>
        )}
      </div>
    </div>
  );
}

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  size?: number;
}

function CircularProgress({ percentage, size = 120 }: CircularProgressProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset =
    circumference - (clampedPercentage / 100) * circumference;

  const getColor = () => {
    if (clampedPercentage >= 80) return "text-emerald-500";
    if (clampedPercentage >= 50) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={cn("transition-all duration-500", getColor())}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", getColor())}>
          {toArabicNumerals(Math.round(clampedPercentage))}%
        </span>
        <span className="text-xs text-muted-foreground">نسبة التغطية</span>
      </div>
    </div>
  );
}
