"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Users,
  UserCheck,
  BookOpen,
  TrendingUp,
  Calendar,
  GraduationCap,
  Home,
  CalendarCheck,
  ChartBar,
  LogOut,
} from "lucide-react";

const menuItems = [
  { title: "الرئيسية", href: "/", icon: Home },
  { title: "الحلقات", href: "/halaqat", icon: BookOpen },
  { title: "المعلمين", href: "/teachers", icon: UserCheck },
  { title: "الطلاب", href: "/students", icon: Users },
  { title: "المتابعة اليومية", href: "/progress", icon: GraduationCap },
  { title: "الحضور", href: "/attendance", icon: CalendarCheck },
  { title: "التقارير", href: "/reports", icon: ChartBar },
];

export default function HomePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">جمعية خير</h1>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const stats = [
    {
      title: "الحلقات",
      value: "15",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "الطلاب",
      value: "320",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "المعلمين",
      value: "25",
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "نسبة الحضور",
      value: "94%",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const todayStats = [
    { label: "حفظ جديد", value: 45, icon: GraduationCap },
    { label: "مراجعة", value: 120, icon: BookOpen },
    { label: "حضور اليوم", value: 298, icon: Calendar },
  ];

  return (
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
                        {user?.fullName?.charAt(0)}
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
          <div className="p-6">
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  أهلاً {user?.fullName}
                </h1>
                <p className="text-muted-foreground">
                  {user?.role === "Supervisor" 
                    ? "مرحباً بك في لوحة التحكم الخاصة بالمشرفين"
                    : "مرحباً بك في لوحة التحكم الخاصة بالمعلمين"}
                </p>
              </div>

              {/* Statistics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        مقارنة بالشهر الماضي
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Today's Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>نشاط اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {todayStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center space-x-4 space-x-reverse"
                      >
                        <div className="p-2 bg-muted rounded-lg">
                          <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>أحدث النشاطات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium">
                          أحمد محمد - حفظ سورة البقرة (الآيات 1-20)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          حلقة الفجر • منذ 5 دقائق
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium">
                          فاطمة علي - أتمت حفظ جزء عم
                        </p>
                        <p className="text-sm text-muted-foreground">
                          حلقة العصر • منذ 15 دقيقة
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium">
                          خالد أحمد - مراجعة سورة الكهف
                        </p>
                        <p className="text-sm text-muted-foreground">
                          حلقة المغرب • منذ 30 دقيقة
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
