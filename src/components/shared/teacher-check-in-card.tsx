"use client";

import { useEffect, useState } from "react";
import { teacherAttendanceApi } from "@/services";
import { TeacherSelfAttendanceStatus } from "@/types/teacher-attendance";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { CalendarCheck, CheckCircle2, LogOut } from "lucide-react";

/** Formats a "HH:mm:ss" time string to "HH:mm" for display. */
function formatTime(time?: string | null): string {
  return time ? time.slice(0, 5) : "";
}

/** Formats a duration in seconds to "HH:MM:SS". */
function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * Live elapsed time since check-in, updated every second.
 * Returns null until both the date and check-in time are available.
 */
function useElapsedSince(date?: string, checkInTime?: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!date || !checkInTime) return null;
  const start = new Date(`${date}T${checkInTime}`).getTime();
  if (Number.isNaN(start)) return null;
  return (now - start) / 1000;
}

/**
 * Self attendance card for teachers. Lets a teacher mark their arrival
 * (check-in) and then their departure (check-out) for the day.
 * Hidden when the teacher has no halaqa scheduled today.
 */
export function TeacherCheckInCard() {
  const [status, setStatus] = useState<TeacherSelfAttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingOut, setSubmittingOut] = useState(false);

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
      // Refresh to pick up the recorded arrival time
      const refreshed = await teacherAttendanceApi.getMyStatus();
      setStatus(refreshed.data);
      toast.success(res.data.message || "تم تسجيل حضورك بنجاح");
    } catch (error) {
      toast.error(extractErrorMessage(error, "تعذّر تسجيل الحضور"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmittingOut(true);
    try {
      const res = await teacherAttendanceApi.checkOut();
      const refreshed = await teacherAttendanceApi.getMyStatus();
      setStatus(refreshed.data);
      toast.success(res.data.message || "تم تسجيل انصرافك بنجاح");
    } catch (error) {
      toast.error(extractErrorMessage(error, "تعذّر تسجيل الانصراف"));
    } finally {
      setSubmittingOut(false);
    }
  };

  // Don't show anything while loading, on error, or when nothing is scheduled today
  if (loading || !status || !status.hasActiveHalaqaToday) return null;

  // Fully done: checked in AND checked out
  if (status.checkedIn && status.checkedOut) {
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg animate-in fade-in slide-in-from-top-4">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
          تم تسجيل حضورك وانصرافك اليوم
        </span>
        <span className="text-sm text-emerald-600/80 dark:text-emerald-400/70">
          الحضور: {formatTime(status.checkInTime) || "—"} • الانصراف:{" "}
          {formatTime(status.checkOutTime) || "—"}
        </span>
      </div>
    );
  }

  // Checked in, awaiting departure
  if (status.checkedIn) {
    return <CheckedInCard status={status} onCheckOut={handleCheckOut} submitting={submittingOut} />;
  }

  // Not yet checked in
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

/** Checked-in (awaiting departure) state, with a live elapsed timer since arrival. */
function CheckedInCard({
  status,
  onCheckOut,
  submitting,
}: {
  status: TeacherSelfAttendanceStatus;
  onCheckOut: () => void;
  submitting: boolean;
}) {
  const elapsed = useElapsedSince(status.date, status.checkInTime);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg animate-in fade-in slide-in-from-top-4">
      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <div className="flex-1 min-w-[150px]">
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
          تم تسجيل حضورك اليوم
        </p>
        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/70">
          {status.checkInTime
            ? `وقت الحضور: ${formatTime(status.checkInTime)}`
            : status.dayName}
        </p>
      </div>
      {elapsed !== null && (
        <div className="flex flex-col items-center px-3 py-1 rounded-md bg-emerald-100/70 dark:bg-emerald-900/30">
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70">
            مدة الحضور
          </span>
          <span className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatDuration(elapsed)}
          </span>
        </div>
      )}
      <Button
        variant="outline"
        onClick={onCheckOut}
        loading={submitting}
        className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400"
      >
        <LogOut className="ml-2 h-4 w-4" />
        تسجيل الانصراف
      </Button>
    </div>
  );
}
