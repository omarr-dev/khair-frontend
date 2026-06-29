"use client";

import { ProtectedRoute } from "@/components/shared/protected-route";
import { ThemeToggle } from "@/components/providers";
import {
  AppSidebar,
  AppSidebarLayout,
  AppSidebarProvider,
  AppSidebarTrigger,
} from "@/components/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppSidebarProvider>
        <AppSidebar />
        <AppSidebarLayout>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
            <AppSidebarTrigger />
            <div className="mr-auto">
              <ThemeToggle />
            </div>
          </header>
          <main className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">{children}</main>
        </AppSidebarLayout>
      </AppSidebarProvider>
    </ProtectedRoute>
  );
}
