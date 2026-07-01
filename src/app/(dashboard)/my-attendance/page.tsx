"use client";

import { useEffect, useState } from "react";
import { studentPortalApi } from "@/services";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceStats } from "@/components/shared/attendance-stats";
import { AttendanceBadge } from "@/components/shared/attendance-badge";
import { Clock } from "lucide-react";
import { formatArabicDate } from "@/lib/student-format";
import type { StudentDetail, StudentAttendanceRecord } from "@/types/student";

export default function MyAttendancePage() {
  const [profile, setProfile] = useState<StudentDetail | null>(null);
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [profileRes, attendanceRes] = await Promise.all([
          studentPortalApi.getMyProfile(),
          studentPortalApi.getMyAttendance(),
        ]);
        if (!active) return;
        setProfile(profileRes.data);
        setRecords(attendanceRes.data ?? []);
      } catch (err) {
        if (active) toast.error(extractErrorMessage(err, "تعذر تحميل الحضور"));
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
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const s = profile?.stats;
  const total = s?.totalClassDays ?? 0;
  const present = s?.presentDays ?? 0;
  const absent = s?.absentDays ?? 0;
  const late = s?.lateDays ?? 0;
  const notRecorded = Math.max(0, total - present - absent - late);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">حضوري</h1>

      {/* Summary */}
      <AttendanceStats
        label="إجمالي الأيام"
        total={total}
        present={present}
        absent={absent}
        notRecorded={notRecorded}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">
          نسبة الحضور {Math.round(s?.attendanceRate ?? 0)}%
        </Badge>
        {late > 0 && (
          <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <Clock className="h-3 w-3" /> متأخر {late}
          </Badge>
        )}
      </div>

      {/* Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">سجل الحضور</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">لا توجد سجلات بعد.</p>
          ) : (
            <ul className="divide-y">
              {records.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{formatArabicDate(r.date)}</p>
                    {r.halaqaName && (
                      <p className="text-[11px] text-muted-foreground">{r.halaqaName}</p>
                    )}
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Late" || status === "متأخر") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      >
        <Clock className="h-3 w-3" /> متأخر
      </Badge>
    );
  }
  if (status === "Present" || status === "حاضر") return <AttendanceBadge status="present" />;
  if (status === "Absent" || status === "غائب") return <AttendanceBadge status="absent" />;
  return <AttendanceBadge status="not_recorded" />;
}
