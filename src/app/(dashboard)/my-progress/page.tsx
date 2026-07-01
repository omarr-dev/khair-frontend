"use client";

import { useEffect, useState } from "react";
import { studentPortalApi } from "@/services";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AchievementCalendar } from "@/components/shared/achievement-calendar";
import { BookMarked } from "lucide-react";
import { qualityLabel, progressTypeLabel, monthRange, formatArabicDate } from "@/lib/student-format";
import type { StudentDetail, StudentProgressRecord, TargetAchievement } from "@/types/student";

export default function MyProgressPage() {
  const [profile, setProfile] = useState<StudentDetail | null>(null);
  const [records, setRecords] = useState<StudentProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar month state (defaults to current month)
  const [month, setMonth] = useState(() => new Date());
  const [monthDays, setMonthDays] = useState<TargetAchievement[]>([]);
  const [calLoading, setCalLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [profileRes, progressRes] = await Promise.all([
          studentPortalApi.getMyProfile(),
          studentPortalApi.getMyProgress(),
        ]);
        if (!active) return;
        setProfile(profileRes.data);
        setRecords(progressRes.data ?? []);
      } catch (err) {
        if (active) toast.error(extractErrorMessage(err, "تعذر تحميل التقدم"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setCalLoading(true);
    const { start, end } = monthRange(month);
    studentPortalApi
      .getMyAchievementHistory(start, end)
      .then((res) => {
        if (active) setMonthDays(res.data?.dailyAchievements ?? []);
      })
      .catch(() => {
        if (active) setMonthDays([]);
      })
      .finally(() => {
        if (active) setCalLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const stats = profile?.stats;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">حفظي</h1>

      {/* Current position */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">موضعي الحالي</p>
            <p className="text-lg font-bold">
              {profile?.currentSurahName
                ? `${profile.currentSurahName} — آية ${profile.currentVerse}`
                : `سورة ${profile?.currentSurahNumber ?? "-"}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {profile?.juzMemorized ?? 0} جزء محفوظ ·{" "}
              {profile?.memorizationDirection === "Backward" ? "من الناس" : "من الفاتحة"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Totals label="آيات محفوظة" value={stats?.totalVersesMemorized ?? 0} />
        <Totals label="آيات مراجعة" value={stats?.totalVersesRevised ?? 0} />
        <Totals label="عدد التسميعات" value={stats?.totalProgressRecords ?? 0} />
        <Totals label="متوسط الجودة" value={stats?.averageQualityText || "-"} />
      </div>

      {/* Calendar */}
      <AchievementCalendar
        monthDate={month}
        achievements={monthDays}
        onMonthChange={setMonth}
        loading={calLoading}
      />

      {/* Recitation records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">آخر التسميعات</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">لا توجد سجلات بعد.</p>
          ) : (
            <ul className="divide-y">
              {records.map((r) => {
                const q = qualityLabel(r.quality);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {progressTypeLabel(r.type)} · {r.surahName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        آية {r.fromVerse}–{r.toVerse} · {r.numberLines} سطر · {formatArabicDate(r.date)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${q.className}`}>{q.text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Totals({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
