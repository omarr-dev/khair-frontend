"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Users, UserCheck } from "lucide-react";
import { useManage } from "./manage-context";

export function UnifiedStatsHeader() {
  const { totalHalaqat, activeHalaqat, totalStudents, totalTeachers } = useManage();

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الحلقات</CardTitle>
          <div className="rounded-lg bg-blue-500/10 p-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHalaqat}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الحلقات النشطة</CardTitle>
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeHalaqat}</div>
          <p className="text-xs text-muted-foreground mt-1">من {totalHalaqat}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
          <div className="rounded-lg bg-violet-500/10 p-2">
            <Users className="h-4 w-4 text-violet-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي المعلمين</CardTitle>
          <div className="rounded-lg bg-amber-500/10 p-2">
            <UserCheck className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTeachers}</div>
        </CardContent>
      </Card>
    </div>
  );
}
