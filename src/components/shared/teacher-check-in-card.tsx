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

/** Formats a "HH:mm:ss" time string to "HH:mm" for display. */
function formatTime(time?: string | null): string {
  return time ? time.slice(0, 5) : "";
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

const ABSENT = 1;

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
          <span className="text-sm text-emerald-700 dark:text-emerald-400">
            حضرت {formatTime(halaqa.checkInTime)}
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
      ) : halaqa.status === ABSENT ? (
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
