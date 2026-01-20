"use client";

import { useState, useEffect, useCallback } from "react";
import { studentApi } from "@/services";
import { StudentTarget, SetStudentTargetDto } from "@/types/student";
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
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  GraduationCap,
  RefreshCw,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { convertArabicToEnglish } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/error-handler";

interface StudentTargetDialogProps {
  studentId: number;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTargetsUpdated?: () => void;
}

export function StudentTargetDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
  onTargetsUpdated,
}: StudentTargetDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targetData, setTargetData] = useState<StudentTarget | null>(null);
  
  const [memorizationTarget, setMemorizationTarget] = useState("");
  const [revisionTarget, setRevisionTarget] = useState("");
  const [consolidationTarget, setConsolidationTarget] = useState("");

  const fetchTarget = useCallback(async () => {
    if (!open || !studentId) return;
    
    setLoading(true);
    setTargetData(null);
    setMemorizationTarget("");
    setRevisionTarget("");
    setConsolidationTarget("");

    try {
      const response = await studentApi.getTarget(studentId);
      const target = response.data;
      setTargetData(target);
      
      if (target) {
        setMemorizationTarget(target.memorizationLinesTarget?.toString() || "");
        setRevisionTarget(target.revisionPagesTarget?.toString() || "");
        setConsolidationTarget(target.consolidationPagesTarget?.toString() || "");
      }
    } catch {
      // No target set - that's okay
    } finally {
      setLoading(false);
    }
  }, [studentId, open]);

  useEffect(() => {
    if (open) {
      fetchTarget();
    }
  }, [open, fetchTarget]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: SetStudentTargetDto = {
        memorizationLinesTarget: memorizationTarget ? parseInt(memorizationTarget) : null,
        revisionPagesTarget: revisionTarget ? parseInt(revisionTarget) : null,
        consolidationPagesTarget: consolidationTarget ? parseInt(consolidationTarget) : null,
      };
      
      await studentApi.setTarget(studentId, data);
      toast.success("تم حفظ الأهداف بنجاح");
      
      if (onTargetsUpdated) {
        onTargetsUpdated();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving targets:", error);
      const message = extractErrorMessage(error, "حدث خطأ أثناء حفظ الأهداف");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      const data: SetStudentTargetDto = {
        memorizationLinesTarget: null,
        revisionPagesTarget: null,
        consolidationPagesTarget: null,
      };
      
      await studentApi.setTarget(studentId, data);
      toast.success("تم إزالة الأهداف");
      
      if (onTargetsUpdated) {
        onTargetsUpdated();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error removing targets:", error);
      const message = extractErrorMessage(error, "حدث خطأ أثناء إزالة الأهداف");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            أهداف الطالب - {studentName}
          </DialogTitle>
          <DialogDescription>
            حدد الأهداف اليومية للطالب. اتركها فارغة إذا لم تكن تستخدم نظام الأهداف.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Memorization Target */}
            <div className="space-y-2 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                <Label className="text-emerald-700 dark:text-emerald-300 font-medium">
                  أسطر الحفظ اليومي
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={memorizationTarget}
                  onChange={(e) => setMemorizationTarget(convertArabicToEnglish(e.target.value))}
                  placeholder="عدد الأسطر"
                  className="text-center"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">سطر</span>
              </div>
            </div>

            {/* Revision Target */}
            <div className="space-y-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <Label className="text-blue-700 dark:text-blue-300 font-medium">
                  صفحات المراجعة اليومية
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={revisionTarget}
                  onChange={(e) => setRevisionTarget(convertArabicToEnglish(e.target.value))}
                  placeholder="عدد الصفحات"
                  className="text-center"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">صفحة</span>
              </div>
            </div>

            {/* Consolidation Target */}
            <div className="space-y-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-600" />
                <Label className="text-amber-700 dark:text-amber-300 font-medium">
                  صفحات التثبيت اليومية
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={consolidationTarget}
                  onChange={(e) => setConsolidationTarget(convertArabicToEnglish(e.target.value))}
                  placeholder="عدد الصفحات"
                  className="text-center"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">صفحة</span>
              </div>
            </div>

            {targetData && (
              <p className="text-xs text-muted-foreground text-center">
                آخر تحديث: {new Date(targetData.updatedAt).toLocaleDateString('ar-SA')}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {targetData && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              إزالة الأهداف
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="flex-1"
            >
              حفظ الأهداف
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
