"use client";

import { useEffect, useState } from "react";
import { teacherAttendanceApi } from "@/services";
import { TeacherSelfAttendanceStatus } from "@/types/teacher-attendance";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { CalendarCheck, CheckCircle2 } from "lucide-react";

/**
 * Self check-in card for teachers. Lets a teacher mark themselves present
 * for the day. Hidden when the teacher has no halaqa scheduled today.
 */
export function TeacherCheckInCard() {
  const [status, setStatus] = useState<TeacherSelfAttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    teacherAttendanceApi
      .getMyStatus()
      .then((res) => setStatus(res.data))
      .catch(() => {
        // Silent: the card simply won't render if status can't be loaded
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const res = await teacherAttendanceApi.checkIn();
      setStatus((prev) => (prev ? { ...prev, checkedIn: true } : prev));
      toast.success(res.data.message || "تم تسجيل حضورك بنجاح");
    } catch (error) {
      toast.error(extractErrorMessage(error, "تعذّر تسجيل الحضور"));
    } finally {
      setSubmitting(false);
    }
  };

  // Don't show anything while loading, on error, or when nothing is scheduled today
  if (loading || !status || !status.hasActiveHalaqaToday) return null;

  if (status.checkedIn) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg animate-in fade-in slide-in-from-top-4">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
          تم تسجيل حضورك اليوم
        </span>
        <span className="text-sm text-emerald-600/80 dark:text-emerald-400/70">
          {status.dayName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-l from-primary/5 to-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-4">
      <CalendarCheck className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">تسجيل الحضور</p>
        <p className="text-sm text-muted-foreground">
          سجّل حضورك لهذا اليوم ({status.dayName})
        </p>
      </div>
      <Button onClick={handleCheckIn} loading={submitting}>
        تسجيل حضوري
      </Button>
    </div>
  );
}
