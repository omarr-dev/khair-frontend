"use client";

import { ManageProvider, useManage } from "@/components/manage/manage-context";
import { UnifiedStatsHeader } from "@/components/manage/unified-stats-header";
import { GlobalSearch } from "@/components/manage/global-search";
import { StructureView } from "@/components/manage/structure-view";
import { StudentsView } from "@/components/manage/students-view";
import { TeachersView } from "@/components/manage/teachers-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { HalaqatPageSkeleton } from "@/components/shared/loading-states";
import { BookOpen, Users, UserCheck } from "lucide-react";

function HalaqatPageContent() {
  const { loading, totalHalaqat, totalStudents, totalTeachers } = useManage();

  if (loading) {
    return <HalaqatPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة الحلقات</h1>
        <p className="text-muted-foreground mt-1">عرض وإدارة الحلقات والمعلمين والطلاب</p>
      </div>

      <UnifiedStatsHeader />

      <GlobalSearch />

      <Tabs defaultValue="structure" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">الهيكل التنظيمي</span>
            <span className="sm:hidden">الهيكل</span>
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">{totalHalaqat}</Badge>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>الطلاب</span>
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">{totalStudents}</Badge>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span>المعلمين</span>
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">{totalTeachers}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="mt-6">
          <StructureView />
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <StudentsView />
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          <TeachersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function HalaqatPage() {
  return (
    <ManageProvider>
      <HalaqatPageContent />
    </ManageProvider>
  );
}
