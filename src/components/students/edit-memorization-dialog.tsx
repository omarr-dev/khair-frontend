"use client";

import { useState, useEffect } from "react";
import { studentApi } from "@/services";
import { UpdateMemorizationDto } from "@/types/student";
import { surahs } from "@/lib/quran-data";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowUp,
  ArrowDown,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-handler";

interface EditMemorizationDialogProps {
  studentId: number;
  studentName: string;
  currentDirection: "Forward" | "Backward";
  currentSurahNumber: number;
  currentVerse: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemorizationUpdated?: () => void;
}

export function EditMemorizationDialog({
  studentId,
  studentName,
  currentDirection,
  currentSurahNumber,
  currentVerse,
  open,
  onOpenChange,
  onMemorizationUpdated,
}: EditMemorizationDialogProps) {
  const [direction, setDirection] = useState<"Forward" | "Backward">(currentDirection);
  const [surah, setSurah] = useState(currentSurahNumber.toString());
  const [verse, setVerse] = useState(currentVerse.toString());
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens with current values
  useEffect(() => {
    if (open) {
      setDirection(currentDirection);
      setSurah(currentSurahNumber.toString());
      setVerse(currentVerse.toString());
    }
  }, [open, currentDirection, currentSurahNumber, currentVerse]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      const data: UpdateMemorizationDto = {
        memorizationDirection: direction,
        currentSurahNumber: parseInt(surah),
        currentVerse: parseInt(verse),
      };

      await studentApi.updateMemorization(studentId, data);
      toast.success("تم تحديث موضع الحفظ بنجاح");
      onOpenChange(false);
      onMemorizationUpdated?.();
    } catch (error) {
      console.error("Error updating memorization:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء تحديث موضع الحفظ");
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            تعديل موضع الحفظ - {studentName}
          </DialogTitle>
          <DialogDescription>
            قم بتحديد الاتجاه والموضع الحالي للحفظ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>اتجاه الحفظ</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as "Forward" | "Backward")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Forward">
                  <span className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4" />
                    من الفاتحة إلى الناس
                  </span>
                </SelectItem>
                <SelectItem value="Backward">
                  <span className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4" />
                    من الناس إلى الفاتحة
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>السورة الحالية</Label>
            <Select value={surah} onValueChange={setSurah}>
              <SelectTrigger>
                <SelectValue placeholder="اختر السورة" />
              </SelectTrigger>
              <SelectContent>
                {surahs.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>الآية الحالية</Label>
            <Select value={verse} onValueChange={setVerse} disabled={!surah}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الآية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 - لم يبدأ بعد</SelectItem>
                {surah && Array.from(
                  { length: surahs.find(s => s.id === parseInt(surah))?.versesCount || 0 },
                  (_, i) => i + 1
                ).map((v) => (
                  <SelectItem key={v} value={v.toString()}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              اختر 0 إذا لم يبدأ الطالب بهذه السورة بعد
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} loading={saving}>
            حفظ التغييرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
