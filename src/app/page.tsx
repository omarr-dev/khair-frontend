"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { TenantLoadingScreen } from "@/components/shared/tenant-loading-screen";

export default function RootPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // Redirect to home page - which uses (dashboard) layout
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, isAuthenticated, router]);

  return <TenantLoadingScreen message="جاري التحميل..." />;
}
