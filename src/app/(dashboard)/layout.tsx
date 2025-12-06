"use client";

import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  Users,
  UserCheck,
  BookOpen,
  CalendarCheck,
  ChartBar,
  GraduationCap,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { title: "الرئيسية", href: "/", icon: Home },
  { title: "الحلقات", href: "/halaqat", icon: BookOpen },
  { title: "المعلمين", href: "/teachers", icon: UserCheck },
  { title: "الطلاب", href: "/students", icon: Users },
  { title: "المتابعة اليومية", href: "/progress", icon: GraduationCap },
  { title: "الحضور", href: "/attendance", icon: CalendarCheck },
  { title: "التقارير", href: "/reports", icon: ChartBar },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold">جمعية خير</h2>
                  <p className="text-xs text-muted-foreground">
                    نظام إدارة الحلقات
                  </p>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="ml-2" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <div className="flex items-center justify-between px-4 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 w-full justify-start"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">
                          {user?.fullName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user?.role === "Supervisor" ? "مشرف" : "معلم"}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="ml-2 h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SidebarFooter>
          </Sidebar>
          <main className="flex-1 overflow-auto">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
              <SidebarTrigger />
              <div className="mr-auto">
                <ThemeToggle />
              </div>
            </header>
            <div className="p-6">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
