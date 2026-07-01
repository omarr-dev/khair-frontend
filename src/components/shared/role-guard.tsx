"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { TenantLoadingScreen } from "@/components/shared/tenant-loading-screen";

// Student self-service routes (read-only portal). Students may also use the shared /home.
const STUDENT_ROUTES = ["/my-progress", "/my-attendance", "/my-achievements", "/my-profile"];
const STUDENT_ALLOWED = ["/home", ...STUDENT_ROUTES];

const matches = (path: string, routes: string[]) =>
  routes.some((r) => path === r || path.startsWith(r + "/"));

/**
 * Keeps roles on their own routes even against manual URL entry:
 * - Students may only visit /home and the student pages.
 * - Non-students are kept out of the student pages.
 * Anything off-limits redirects to /home. Decided synchronously so the wrong
 * page never renders (which would otherwise fire API calls that 403).
 */
export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const blocked = useMemo(() => {
    if (!user) return false;
    const path = pathname ?? "";
    return user.role === "Student"
      ? !matches(path, STUDENT_ALLOWED)
      : matches(path, STUDENT_ROUTES);
  }, [user, pathname]);

  useEffect(() => {
    if (!loading && blocked) {
      router.replace("/home");
    }
  }, [blocked, loading, router]);

  if (blocked) {
    return <TenantLoadingScreen message="جاري التحويل..." />;
  }

  return <>{children}</>;
}
