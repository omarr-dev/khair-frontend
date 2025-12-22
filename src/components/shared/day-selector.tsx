"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DaySelectorProps {
  selectedDays?: string; // "0,1,3,4" format
  onChange: (days: string) => void;
  disabled?: boolean;
}

const DAYS = [
  { value: 0, label: "الأحد", shortLabel: "ح" },
  { value: 1, label: "الإثنين", shortLabel: "ن" },
  { value: 2, label: "الثلاثاء", shortLabel: "ث" },
  { value: 3, label: "الأربعاء", shortLabel: "ع" },
  { value: 4, label: "الخميس", shortLabel: "خ" },
  { value: 5, label: "الجمعة", shortLabel: "ج" },
  { value: 6, label: "السبت", shortLabel: "س" },
];

export function DaySelector({ selectedDays, onChange, disabled }: DaySelectorProps) {
  const selectedDaysArray = selectedDays
    ? selectedDays.split(",").map(Number).filter(n => !isNaN(n))
    : [];

  const toggleDay = (day: number) => {
    if (disabled) return;

    let newDays: number[];
    if (selectedDaysArray.includes(day)) {
      newDays = selectedDaysArray.filter((d) => d !== day);
    } else {
      newDays = [...selectedDaysArray, day].sort((a, b) => a - b);
    }

    onChange(newDays.join(","));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day) => {
          const isSelected = selectedDaysArray.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all",
                "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-background",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={day.label}
              aria-pressed={isSelected}
            >
              <span className="text-xs font-medium hidden sm:block">{day.shortLabel}</span>
              <span className="text-[10px] sm:hidden">{day.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {selectedDaysArray.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center text-sm text-muted-foreground">
          <span>الأيام المحددة:</span>
          {selectedDaysArray.map((dayValue) => {
            const day = DAYS.find((d) => d.value === dayValue);
            return day ? (
              <Badge key={dayValue} variant="secondary" className="text-xs">
                {day.label}
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

export function formatActiveDays(activeDays?: string): string {
  if (!activeDays) return "غير محدد";

  const selectedDaysArray = activeDays.split(",").map(Number).filter(n => !isNaN(n));
  if (selectedDaysArray.length === 0) return "غير محدد";

  const dayLabels = selectedDaysArray
    .map((dayValue) => DAYS.find((d) => d.value === dayValue)?.shortLabel)
    .filter(Boolean);

  return dayLabels.join(" - ");
}
