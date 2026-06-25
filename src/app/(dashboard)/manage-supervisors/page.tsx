"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { roleUtils } from "@/types/auth";
import { SupervisorsView } from "@/components/manage/supervisors-view";
import { TenantLoadingScreen } from "@/components/shared/tenant-loading-screen";

export default function ManageSupervisorsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Full Supervisors only — redirect everyone else away.
  const isSupervisor = roleUtils.isSupervisor(user?.role);

  useEffect(() => {
    if (!loading && !isSupervisor) {
      router.replace("/home");
    }
  }, [loading, isSupervisor, router]);

  if (loading || !isSupervisor) {
    return <TenantLoadingScreen message="جاري التحميل..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">مشرفو الحلقات</h1>
        <p className="text-muted-foreground mt-1">
          إضافة مشرفي الحلقات وتعديل بياناتهم وتعيينهم على الحلقات
        </p>
      </div>

      <SupervisorsView />
    </div>
  );
}
