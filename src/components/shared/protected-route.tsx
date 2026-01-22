"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { TenantLoadingScreen } from "@/components/shared/tenant-loading-screen";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <TenantLoadingScreen message="جاري التحميل..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
