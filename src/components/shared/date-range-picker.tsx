"use client";

import { useState, useCallback, useMemo } from "react";
import { format, isAfter, isBefore, startOfDay, subDays, subMonths, isValid, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Constants for validation
const MAX_DATE_RANGE_DAYS = 365; // Maximum range span
const MIN_DATE = new Date(2020, 0, 1); // Earliest allowed date

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangePickerProps {
  /** Current date range value */
  value?: DateRange;
  /** Callback when date range changes */
  onChange: (range: DateRange) => void;
  /** Minimum allowed date (defaults to 2020-01-01) */
  minDate?: Date;
  /** Maximum allowed date (defaults to today) */
  maxDate?: Date;
  /** Maximum number of days allowed in range (defaults to 365) */
  maxRangeDays?: number;
  /** Placeholder text when no range is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Label for the trigger button */
  triggerLabel?: string;
}

// Preset options for quick selection
interface PresetOption {
  label: string;
  getValue: () => DateRange;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    label: "آخر 7 أيام",
    getValue: () => ({
      from: subDays(startOfDay(new Date()), 7),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "آخر 14 يوم",
    getValue: () => ({
      from: subDays(startOfDay(new Date()), 14),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "آخر 30 يوم",
    getValue: () => ({
      from: subDays(startOfDay(new Date()), 30),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "آخر 3 أشهر",
    getValue: () => ({
      from: subMonths(startOfDay(new Date()), 3),
      to: startOfDay(new Date()),
    }),
  },
  {
    label: "آخر 6 أشهر",
    getValue: () => ({
      from: subMonths(startOfDay(new Date()), 6),
      to: startOfDay(new Date()),
    }),
  },
];

// Simple calendar component
function SimpleCalendar({
  selectedDate,
  onSelect,
  minDate,
  maxDate,
  highlightRange,
}: {
  selectedDate?: Date;
  onSelect: (date: Date) => void;
  minDate: Date;
  maxDate: Date;
  highlightRange?: { from?: Date; to?: Date };
}) {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startWeekDay = firstDay.getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startWeekDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysCount; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [viewDate]);

  const weekDays = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(minDate)) || isAfter(date, startOfDay(maxDate));
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isDateInRange = (date: Date) => {
    if (!highlightRange?.from || !highlightRange?.to) return false;
    return (
      (isAfter(date, highlightRange.from) || isSameDay(date, highlightRange.from)) &&
      (isBefore(date, highlightRange.to) || isSameDay(date, highlightRange.to))
    );
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  return (
    <div className="p-2">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm">
          {format(viewDate, "MMMM yyyy", { locale: ar })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-8 w-8" />;
          }

          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const inRange = isDateInRange(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              className={cn(
                "h-8 w-8 text-sm rounded-md transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                selected && "bg-primary text-primary-foreground hover:bg-primary/90",
                inRange && !selected && "bg-primary/10"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({
  value,
  onChange,
  minDate = MIN_DATE,
  maxDate = new Date(),
  maxRangeDays = MAX_DATE_RANGE_DAYS,
  placeholder = "اختر الفترة الزمنية",
  disabled = false,
  className,
  triggerLabel,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | undefined>(value?.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(value?.to);
  const [error, setError] = useState<string>("");

  // Format date for input field (YYYY-MM-DD)
  const formatForInput = (date?: Date) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  // Validate the date range
  const validateRange = useCallback((from?: Date, to?: Date): string => {
    if (!from || !to) return "";
    
    if (isAfter(from, to)) {
      return "تاريخ البداية يجب أن يكون قبل تاريخ النهاية";
    }
    
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxRangeDays) {
      return `الفترة الزمنية لا يمكن أن تتجاوز ${maxRangeDays} يوم`;
    }
    
    if (isBefore(from, minDate)) {
      return `تاريخ البداية لا يمكن أن يكون قبل ${format(minDate, "yyyy-MM-dd")}`;
    }
    
    if (isAfter(to, maxDate)) {
      return `تاريخ النهاية لا يمكن أن يكون بعد ${format(maxDate, "yyyy-MM-dd")}`;
    }
    
    return "";
  }, [maxRangeDays, minDate, maxDate]);

  // Handle from date change
  const handleFromChange = (date: Date) => {
    setTempFrom(date);
    setError(validateRange(date, tempTo));
  };

  // Handle to date change
  const handleToChange = (date: Date) => {
    setTempTo(date);
    setError(validateRange(tempFrom, date));
  };

  // Handle input change for from date
  const handleFromInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (!dateStr) {
      setTempFrom(undefined);
      return;
    }
    
    const date = parseISO(dateStr);
    if (isValid(date)) {
      handleFromChange(date);
    }
  };

  // Handle input change for to date
  const handleToInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (!dateStr) {
      setTempTo(undefined);
      return;
    }
    
    const date = parseISO(dateStr);
    if (isValid(date)) {
      handleToChange(date);
    }
  };

  // Apply preset
  const applyPreset = (preset: PresetOption) => {
    const range = preset.getValue();
    setTempFrom(range.from);
    setTempTo(range.to);
    setError("");
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!tempFrom || !tempTo) {
      setError("يرجى اختيار تاريخ البداية والنهاية");
      return;
    }
    
    const validationError = validateRange(tempFrom, tempTo);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onChange({ from: tempFrom, to: tempTo });
    setIsOpen(false);
  };

  // Reset and close
  const handleCancel = () => {
    setTempFrom(value?.from);
    setTempTo(value?.to);
    setError("");
    setIsOpen(false);
  };

  // Format display value
  const displayValue = useMemo(() => {
    if (!value?.from || !value?.to) return placeholder;
    return `${format(value.from, "d MMM yyyy", { locale: ar })} - ${format(value.to, "d MMM yyyy", { locale: ar })}`;
  }, [value, placeholder]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCancel();
      else setIsOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-right font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Calendar className="ml-2 h-4 w-4" />
          {triggerLabel || displayValue}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>اختيار فترة زمنية محددة</DialogTitle>
          <DialogDescription>
            اختر تاريخ البداية والنهاية للفترة المطلوبة
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESET_OPTIONS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date">من تاريخ</Label>
              <Input
                id="from-date"
                type="date"
                value={formatForInput(tempFrom)}
                onChange={handleFromInputChange}
                max={formatForInput(maxDate)}
                min={formatForInput(minDate)}
                className="text-right"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">إلى تاريخ</Label>
              <Input
                id="to-date"
                type="date"
                value={formatForInput(tempTo)}
                onChange={handleToInputChange}
                max={formatForInput(maxDate)}
                min={formatForInput(minDate)}
                className="text-right"
                dir="ltr"
              />
            </div>
          </div>

          {/* Calendars */}
          <div className="grid grid-cols-2 gap-4 border rounded-lg p-2">
            <div>
              <p className="text-sm font-medium text-center mb-2">تاريخ البداية</p>
              <SimpleCalendar
                selectedDate={tempFrom}
                onSelect={handleFromChange}
                minDate={minDate}
                maxDate={tempTo || maxDate}
                highlightRange={{ from: tempFrom, to: tempTo }}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-center mb-2">تاريخ النهاية</p>
              <SimpleCalendar
                selectedDate={tempTo}
                onSelect={handleToChange}
                minDate={tempFrom || minDate}
                maxDate={maxDate}
                highlightRange={{ from: tempFrom, to: tempTo }}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            إلغاء
          </Button>
          <Button onClick={handleConfirm} disabled={!tempFrom || !tempTo || !!error}>
            تأكيد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
