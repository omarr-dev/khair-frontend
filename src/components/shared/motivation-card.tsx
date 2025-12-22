"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { statisticsApi } from "@/services";
import { SystemWideStats } from "@/types/statistics";
import { BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Convert numbers to Arabic numerals
function toArabicNumerals(num: number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(digit => {
    if (digit >= '0' && digit <= '9') {
      return arabicNumerals[parseInt(digit)];
    }
    return digit;
  }).join('');
}

// Motivational Poem Component
function MotivationalPoem() {
  return (
    <div className="text-center space-y-2 py-4">
      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-12 text-sm sm:text-base text-foreground/80 font-arabic leading-relaxed">
        <span>طوبى لمن حفظ الكتاب بصدره</span>
        <span>فبدا وضيئاً كالنجوم تألقا</span>
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-12 text-sm sm:text-base text-foreground/80 font-arabic leading-relaxed">
        <span>الله أكبر يا لها من نعمة</span>
        <span>لما يقال إقرأ فرتّل وارتقى</span>
      </div>
    </div>
  );
}

interface StatBoxProps {
  icon: React.ElementType;
  value: number | null;
  label: string;
  iconColor: string;
  iconBgColor: string;
  loading?: boolean;
}

function StatBox({ icon: Icon, value, label, iconColor, iconBgColor, loading = false }: StatBoxProps) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className={cn("p-3 rounded-full", iconBgColor)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="text-3xl sm:text-4xl font-bold text-foreground min-h-[44px] flex items-center justify-center">
        {loading || value === null ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          toArabicNumerals(value)
        )}
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground leading-tight max-w-[140px]">
        {label}
      </p>
    </div>
  );
}

export function MotivationCard() {
  const [stats, setStats] = useState<SystemWideStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "week">("week");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await statisticsApi.getSystemWideStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching system-wide stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10 border-primary/20">
      <CardContent className="p-4 sm:p-6">
        {/* Motivational Poem */}
        <MotivationalPoem />

        {/* Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs text-muted-foreground">الإنجاز</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Tabs for Today/Week */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "today" | "week")}
          className="w-full"
        >
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-[200px] grid-cols-2">
              <TabsTrigger value="week">هذا الأسبوع</TabsTrigger>
              <TabsTrigger value="today">اليوم</TabsTrigger>
            </TabsList>
          </div>

          {/* Today's Stats - Centered side by side */}
          <TabsContent value="today" className="mt-0">
            <div className="flex flex-row items-start justify-center gap-8 sm:gap-16 md:gap-24">
              <StatBox
                icon={BookOpen}
                value={stats?.todayVersesMemorized ?? null}
                label="آية تم حفظها اليوم"
                iconColor="text-emerald-600"
                iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
                loading={loading}
              />
              <StatBox
                icon={Users}
                value={stats?.todayStudentsActive ?? null}
                label="طالب يتعلمون كتاب الله"
                iconColor="text-violet-600"
                iconBgColor="bg-violet-100 dark:bg-violet-900/30"
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* Week's Stats - Centered side by side */}
          <TabsContent value="week" className="mt-0">
            <div className="flex flex-row items-start justify-center gap-8 sm:gap-16 md:gap-24">
              <StatBox
                icon={BookOpen}
                value={stats?.weekVersesMemorized ?? null}
                label="آية تم حفظها هذا الأسبوع"
                iconColor="text-emerald-600"
                iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
                loading={loading}
              />
              <StatBox
                icon={Users}
                value={stats?.weekStudentsActive ?? null}
                label="طالب يتعلمون كتاب الله"
                iconColor="text-violet-600"
                iconBgColor="bg-violet-100 dark:bg-violet-900/30"
                loading={loading}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
