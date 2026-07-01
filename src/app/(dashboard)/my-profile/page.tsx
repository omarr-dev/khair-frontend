"use client";

import { useEffect, useState } from "react";
import { studentPortalApi } from "@/services";
import { extractErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, Users, Target } from "lucide-react";
import type { StudentDetail } from "@/types/student";

export default function MyProfilePage() {
  const [profile, setProfile] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    studentPortalApi
      .getMyProfile()
      .then((res) => {
        if (active) setProfile(res.data);
      })
      .catch((err) => {
        if (active) toast.error(extractErrorMessage(err, "تعذر تحميل الملف"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  const target = profile.target;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">ملفي</h1>

      {/* Identity */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">
              {profile.fullName?.charAt(0) || "ط"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-lg font-bold">{profile.fullName}</p>
            {profile.idNumber && (
              <p className="text-sm text-muted-foreground">رقم الهوية: {profile.idNumber}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Halaqa & teacher */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" /> الحلقة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row label="الحلقة" value={profile.currentHalaqa} />
          <Row label="المعلم" value={profile.teacherName} icon={<Users className="h-4 w-4" />} />
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">البيانات الشخصية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row label="رقم الجوال" value={profile.phone} />
          <Row label="ولي الأمر" value={profile.guardianName} />
          <Row label="جوال ولي الأمر" value={profile.guardianPhone} />
          <Row label="الجنسية" value={profile.nationality} />
        </CardContent>
      </Card>

      {/* Current targets (read-only) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" /> الأهداف اليومية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {target &&
          (target.memorizationLinesTarget ||
            target.revisionPagesTarget ||
            target.consolidationPagesTarget) ? (
            <div className="grid grid-cols-3 gap-3 text-center">
              <TargetCell label="حفظ" value={target.memorizationLinesTarget} unit="سطر" />
              <TargetCell label="مراجعة" value={target.revisionPagesTarget} unit="صفحة" />
              <TargetCell label="تثبيت" value={target.consolidationPagesTarget} unit="صفحة" />
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              لم يتم تحديد أهداف بعد.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-0">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function TargetCell({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number | null;
  unit: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xl font-bold tabular-nums">{value ?? 0}</p>
      <p className="text-[11px] text-muted-foreground">
        {label} · {unit}
      </p>
    </div>
  );
}
