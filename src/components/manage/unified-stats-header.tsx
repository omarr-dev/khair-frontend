"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Users, UserCheck } from "lucide-react";
import { useManage } from "./manage-context";
import { cn } from "@/lib/utils";

interface UnifiedStatsHeaderProps {
  activeTab?: string;
  onCardClick?: (tab: string) => void;
}

export function UnifiedStatsHeader({ activeTab, onCardClick }: UnifiedStatsHeaderProps) {
  const { totalHalaqat, activeHalaqat, totalStudents, assignedTeachers, totalTeachers } = useManage();

  const cards = [
    {
      tab: "structure",
      title: "إجمالي الحلقات",
      value: totalHalaqat,
      icon: BookOpen,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-500/10",
      ringColor: "ring-blue-500/30",
      subtitle: null,
    },
    {
      tab: "structure",
      title: "الحلقات النشطة",
      value: activeHalaqat,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      ringColor: "ring-emerald-500/30",
      valueColor: "text-green-600",
      subtitle: `من ${totalHalaqat}`,
    },
    {
      tab: "students",
      title: "إجمالي الطلاب",
      value: totalStudents,
      icon: Users,
      iconColor: "text-violet-600",
      bgColor: "bg-violet-500/10",
      ringColor: "ring-violet-500/30",
      subtitle: null,
    },
    {
      tab: "teachers",
      title: "المعلمون في الحلقات",
      value: assignedTeachers,
      icon: UserCheck,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-500/10",
      ringColor: "ring-amber-500/30",
      subtitle: `من ${totalTeachers}`,
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeTab === card.tab;
        return (
          <Card
            key={card.title}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
              isActive && `ring-2 ${card.ringColor}`
            )}
            onClick={() => onCardClick?.(card.tab)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={cn("rounded-lg p-2", card.bgColor)}>
                <Icon className={cn("h-4 w-4", card.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", card.valueColor)}>{card.value}</div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
