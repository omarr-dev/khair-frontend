"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  BookOpen,
  TrendingUp,
  Calendar,
  GraduationCap,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

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
  );
}
