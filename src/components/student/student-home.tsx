"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers";
import { studentPortalApi } from "@/services";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AchievementBar } from "@/components/shared/achievement-bar";
import { BookMarked, Flame, CalendarCheck, Trophy, ArrowLeft } from "lucide-react";
import type { StudentDetail, TargetAchievement, MyRank } from "@/types/student";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function StatCard({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <Card className={href ? "transition-colors hover:bg-accent/50" : undefined}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold">{value}</p>
          {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        {href && <ArrowLeft className="mr-auto h-4 w-4 shrink-0 text-muted-foreground" />}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function StudentHome() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentDetail | null>(null);
  const [today, setToday] = useState<TargetAchievement | null>(null);
  const [rank, setRank] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const t = todayStr();
        const [profileRes, historyRes, rankRes] = await Promise.all([
          studentPortalApi.getMyProfile(),
          studentPortalApi.getMyAchievementHistory(t, t),
          studentPortalApi.getMyRank(),
        ]);
        if (!active) return;
        setProfile(profileRes.data);
        setToday(historyRes.data?.dailyAchievements?.[0] ?? null);
        setRank(rankRes.data);
      } catch (err) {
        if (active) toast.error(extractErrorMessage(err, "تعذر تحميل البيانات"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  const position = profile?.currentSurahName
    ? `${profile.currentSurahName} — آية ${profile.currentVerse}`
    : `سورة ${profile?.currentSurahNumber ?? "-"}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Greeting */}
      <div className="rounded-2xl bg-gradient-to-l from-primary/10 to-primary/5 p-5">
        <p className="text-sm text-muted-foreground">السلام عليكم</p>
        <h1 className="text-2xl font-bold">{user?.fullName}</h1>
        {profile?.currentHalaqa && (
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.currentHalaqa}
            {profile.teacherName ? ` · ${profile.teacherName}` : ""}
          </p>
        )}
      </div>

      {/* Today's achievement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">إنجاز اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          {today ? (
            <AchievementBar
              memorization={{ achieved: today.memorizationLinesAchieved, target: today.memorizationLinesTarget }}
              revision={{ achieved: today.revisionPagesAchieved, target: today.revisionPagesTarget }}
              consolidation={{ achieved: today.consolidationPagesAchieved, target: today.consolidationPagesTarget }}
            />
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              لا يوجد هدف محدد لهذا اليوم بعد.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<BookMarked className="h-5 w-5" />}
          label="موضعي الحالي"
          value={position}
          hint={`${profile?.juzMemorized ?? 0} جزء محفوظ`}
          href="/my-progress"
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="سلسلة الإنجاز"
          value={`${rank?.currentStreak ?? 0} يوم`}
          hint={rank?.longestStreak ? `الأطول: ${rank.longestStreak} يوم` : undefined}
          href="/my-achievements"
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="نسبة الحضور"
          value={`${Math.round(profile?.stats.attendanceRate ?? 0)}%`}
          hint={`حاضر ${profile?.stats.presentDays ?? 0} يوم`}
          href="/my-attendance"
        />
      </div>

      {rank?.rank != null && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="h-5 w-5 text-amber-500" />
            <p className="text-sm">
              ترتيبك في {rank.halaqaName ?? "حلقتك"}:{" "}
              <span className="font-bold">{rank.rank}</span>
              {rank.totalInScope ? ` من ${rank.totalInScope}` : ""}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
