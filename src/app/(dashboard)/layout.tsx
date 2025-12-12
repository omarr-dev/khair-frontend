"use client";

import { ProtectedRoute } from "@/components/shared/protected-route";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  AppSidebar,
  AppSidebarLayout,
  AppSidebarProvider,
  AppSidebarTrigger,
} from "@/components/ui/app-sidebar";

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
          <main className="p-6">{children}</main>
        </AppSidebarLayout>
      </AppSidebarProvider>
    </ProtectedRoute>
  );
}
