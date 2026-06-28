"use client";

import { useEffect, useState } from "react";
import { teacherAttendanceApi } from "@/services";
import {
  TeacherSelfAttendanceStatus,
  TeacherSelfHalaqaAttendance,
} from "@/types/teacher-attendance";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { CalendarCheck, CheckCircle2, Clock, LogOut, XCircle } from "lucide-react";

/** Formats a "HH:mm:ss" time string to 12-hour "h:mm ص/م" for display. */
function formatTime(time?: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour24 = parseInt(h, 10);
  if (Number.isNaN(hour24)) return time;
  const period = hour24 >= 12 ? "م" : "ص";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${m} ${period}`;
}

/** Seconds elapsed since a "HH:mm:ss" time today (never negative). */
function elapsedSeconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  const start = new Date();
  start.setHours(h || 0, m || 0, s || 0, 0);
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
}

/** Formats a seconds count as "HH:mm:ss". */
function formatDuration(total: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Live timer counting up (h:m:s) from a "HH:mm:ss" check-in time. */
function ElapsedTimer({ since }: { since: string }) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(since));

  useEffect(() => {
    setSeconds(elapsedSeconds(since));
    const id = setInterval(() => setSeconds(elapsedSeconds(since)), 1000);
    return () => clearInterval(id);
  }, [since]);

  return <span className="tabular-nums">{formatDuration(seconds)}</span>;
}

/**
 * Self attendance card for teachers. Attendance is recorded per halaqa, so a
 * teacher with more than one halaqa today checks in / out each one separately.
 * Hidden when the teacher has no halaqa scheduled today.
 */
export function TeacherCheckInCard() {
  const [status, setStatus] = useState<TeacherSelfAttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  // halaqaId currently submitting a check-in or check-out request
  const [busyHalaqaId, setBusyHalaqaId] = useState<number | null>(null);

  const refresh = async () => {
    const res = await teacherAttendanceApi.getMyStatus();
    setStatus(res.data);
  };

  useEffect(() => {
    refresh()
      .catch(() => {
        // Silent: the card simply won't render if status can't be loaded
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async (halaqaId: number) => {
    setBusyHalaqaId(halaqaId);
    try {
      const res = await teacherAttendanceApi.checkIn(halaqaId);
      await refresh();
      toast.success(res.data.message || "تم تسجيل حضورك بنجاح");
    } catch (error) {
      toast.error(extractErrorMessage(error, "تعذّر تسجيل الحضور"));
    } finally {
      setBusyHalaqaId(null);
    }
  };

  const handleCheckOut = async (halaqaId: number) => {
    setBusyHalaqaId(halaqaId);
    try {
      const res = await teacherAttendanceApi.checkOut(halaqaId);
      await refresh();
      toast.success(res.data.message || "تم تسجيل انصرافك بنجاح");
    } catch (error) {
      toast.error(extractErrorMessage(error, "تعذّر تسجيل الانصراف"));
    } finally {
      setBusyHalaqaId(null);
    }
  };

  // Don't show anything while loading, on error, or when nothing is scheduled today
  if (loading || !status || !status.hasActiveHalaqaToday) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-gradient-to-l from-primary/5 to-primary/10 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-primary/10">
        <CalendarCheck className="h-5 w-5 text-primary shrink-0" />
        <p className="font-semibold">تسجيل الحضور — {status.dayName}</p>
      </div>
      <div className="divide-y divide-border/60">
        {status.halaqat.map((h) => (
          <HalaqaRow
            key={h.halaqaId}
            halaqa={h}
            busy={busyHalaqaId === h.halaqaId}
            onCheckIn={() => handleCheckIn(h.halaqaId)}
            onCheckOut={() => handleCheckOut(h.halaqaId)}
          />
        ))}
      </div>
    </div>
  );
}

// The API serializes the status enum as a string ("Absent"); accept the numeric
// form too in case the serialization ever changes.
const isAbsent = (status: unknown) => status === 1 || status === "Absent";

/** A single halaqa row with its own check-in / check-out state. */
function HalaqaRow({
  halaqa,
  busy,
  onCheckIn,
  onCheckOut,
}: {
  halaqa: TeacherSelfHalaqaAttendance;
  busy: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-[140px]">
        <p className="font-semibold">{halaqa.halaqaName}</p>
        {halaqa.timeSlot && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {halaqa.timeSlot}
          </p>
        )}
      </div>

      {halaqa.checkedOut ? (
        // Done: checked in and out
        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {formatTime(halaqa.checkInTime) || "—"} ← {formatTime(halaqa.checkOutTime) || "—"}
        </span>
      ) : halaqa.checkedIn ? (
        // Checked in, awaiting departure
        <div className="flex items-center gap-2">
          <span className="flex flex-col text-sm text-emerald-700 dark:text-emerald-400">
            <span>حضرت {formatTime(halaqa.checkInTime)}</span>
            {halaqa.checkInTime && (
              <span className="flex items-center gap-1 font-medium">
                <Clock className="h-3.5 w-3.5" />
                <ElapsedTimer since={halaqa.checkInTime} />
              </span>
            )}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={onCheckOut}
            loading={busy}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400"
          >
            <LogOut className="ml-1 h-4 w-4" />
            انصراف
          </Button>
        </div>
      ) : isAbsent(halaqa.status) ? (
        // Supervisor marked the teacher absent for this halaqa
        <span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <XCircle className="h-4 w-4" />
          غائب
        </span>
      ) : (
        // Not recorded yet
        <Button size="sm" onClick={onCheckIn} loading={busy}>
          حاضر
        </Button>
      )}
    </div>
  );
}
