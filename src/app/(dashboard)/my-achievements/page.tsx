"use client";

import { useEffect, useState } from "react";
import { studentPortalApi } from "@/services";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Flame, Trophy, Medal, CheckCircle2, Lock } from "lucide-react";
import { toDateStr } from "@/lib/student-format";
import type { MyRank, AchievementHistory } from "@/types/student";

const MILESTONES = [3, 7, 14, 30, 60, 100];

export default function MyAchievementsPage() {
  const [rank, setRank] = useState<MyRank | null>(null);
  const [history, setHistory] = useState<AchievementHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 89); // last 90 days
        const [rankRes, historyRes] = await Promise.all([
          studentPortalApi.getMyRank(),
          studentPortalApi.getMyAchievementHistory(toDateStr(start), toDateStr(end)),
        ]);
        if (!active) return;
        setRank(rankRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        if (active) toast.error(extractErrorMessage(err, "تعذر تحميل الإنجازات"));
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
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const currentStreak = rank?.currentStreak ?? 0;
  const longestStreak = rank?.longestStreak ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">إنجازاتي</h1>

      {/* Streaks */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <BigStat
          icon={<Flame className="h-6 w-6 text-orange-500" />}
          value={`${currentStreak}`}
          unit="يوم"
          label="السلسلة الحالية"
          active={rank?.isStreakActive}
        />
        <BigStat
          icon={<Medal className="h-6 w-6 text-amber-500" />}
          value={`${longestStreak}`}
          unit="يوم"
          label="أطول سلسلة"
        />
        <BigStat
          icon={<Trophy className="h-6 w-6 text-primary" />}
          value={rank?.rank != null ? `${rank.rank}` : "-"}
          unit={rank?.totalInScope ? `من ${rank.totalInScope}` : ""}
          label={`الترتيب في ${rank?.halaqaName ?? "الحلقة"}`}
        />
      </div>

      {/* 90-day summary */}
      {history && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">آخر ٩٠ يوماً</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Mini label="أيام تحقق الهدف" value={history.totalDaysTargetMet} />
            <Mini label="أيام بها نشاط" value={history.totalDaysActive} />
            <Mini label="أفضل سلسلة بالفترة" value={history.bestStreak} />
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">أوسمة السلسلة</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {MILESTONES.map((m) => {
            const unlocked = longestStreak >= m;
            return (
              <div
                key={m}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 text-center",
                  unlocked
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                    : "border-dashed bg-muted/30 opacity-70"
                )}
                title={unlocked ? `تم تحقيق ${m} يوم` : `يُفتح عند ${m} يوم متتالٍ`}
              >
                {unlocked ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={cn("text-sm font-bold", unlocked && "text-emerald-700 dark:text-emerald-400")}>
                  {m}
                </span>
                <span className="text-[10px] text-muted-foreground">يوم</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function BigStat({
  icon,
  value,
  unit,
  label,
  active,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-5 text-center">
        {icon}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tabular-nums">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
        {active && (
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            نشطة الآن 🔥
          </span>
        )}
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
