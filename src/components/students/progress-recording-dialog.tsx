"use client";

import { useState, useEffect, useCallback } from "react";
import { progressApi } from "@/services";
import { CreateProgressRecord } from "@/types/progress";
import { surahs } from "@/lib/quran-data";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  BookOpen,
  GraduationCap,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/error-handler";

interface ProgressRecordingDialogProps {
  studentId: number;
  studentName: string;
  halaqaId: number;
  currentSurahNumber: number;
  currentVerse: number;
  memorizationDirection: "Forward" | "Backward";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProgressRecorded?: () => void;
}

export function ProgressRecordingDialog({
  studentId,
  studentName,
  halaqaId,
  currentSurahNumber,
  currentVerse,
  memorizationDirection,
  open,
  onOpenChange,
  onProgressRecorded,
}: ProgressRecordingDialogProps) {
  const { user } = useAuth();
  
  const [progressType, setProgressType] = useState<"0" | "1" | "2">("0");
  const [selectedSurah, setSelectedSurah] = useState("");
  const [toSurah, setToSurah] = useState("");
  const [fromVerse, setFromVerse] = useState("");
  const [toVerse, setToVerse] = useState("");
  const [quality, setQuality] = useState<"0" | "1" | "2" | "3">("0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingProgressData, setLoadingProgressData] = useState(false);
  // Save the initial values when dialog opens to prevent losing them when switching types
  const [savedCurrentVerse, setSavedCurrentVerse] = useState<number>(currentVerse);
  const [savedCurrentSurahNumber, setSavedCurrentSurahNumber] = useState<number>(currentSurahNumber);

  // Helper function to get surah name by number
  const getSurahName = (number: number) => {
    const surah = surahs.find((s) => s.id === number);
    return surah?.name || "غير محدد";
  };

  // Helper function to get filtered surahs for "To Surah" based on direction
  const getFilteredToSurahs = () => {
    if (!selectedSurah) return surahs;
    
    const fromSurahIndex = surahs.findIndex(s => s.name === selectedSurah);
    if (fromSurahIndex === -1) return surahs;

    if (memorizationDirection === "Forward") {
      // Forward: show surahs >= selected surah
      return surahs.filter((_, index) => index >= fromSurahIndex);
    } else {
      // Backward: show surahs <= selected surah
      return surahs.filter((_, index) => index <= fromSurahIndex);
    }
  };

  // Load progress data by type
  const loadProgressByType = useCallback(async (type: "0" | "1" | "2") => {
    if (type === "0") {
      // For new memorization: start from saved position + 1
      const currentSurah = surahs.find((s) => s.id === savedCurrentSurahNumber);
      if (currentSurah) {
        setSelectedSurah(currentSurah.name);
        setToSurah(currentSurah.name); // Default to same surah
        const startVerse = savedCurrentVerse + 1;
        setFromVerse(startVerse.toString());
      }
      setLoadingProgressData(false);
    } else {
      // For revision (1) or consolidation (2): get last progress of this type
      setLoadingProgressData(true);
      try {
        const response = await progressApi.getLastByType(studentId, parseInt(type) as 0 | 1 | 2);
        const lastProgress = response.data;
        
        if (lastProgress) {
          const lastSurah = surahs.find(s => s.name === lastProgress.surahName);
          
          if (lastSurah) {
            const nextVerse = lastProgress.toVerse + 1;
            
            if (nextVerse <= lastSurah.versesCount) {
              // Continue in same surah
              setSelectedSurah(lastProgress.surahName);
              setToSurah(lastProgress.toSurahName || lastProgress.surahName);
              setFromVerse(nextVerse.toString());
              setToVerse("");
            } else {
              // Move to next surah based on memorization direction
              const currentSurahIndex = surahs.findIndex(s => s.name === lastProgress.surahName);
              
              if (memorizationDirection === "Forward") {
                // Forward: move to next surah (index + 1)
                if (currentSurahIndex < surahs.length - 1) {
                  const nextSurah = surahs[currentSurahIndex + 1];
                  setSelectedSurah(nextSurah.name);
                  setToSurah(nextSurah.name);
                  setFromVerse("1");
                  setToVerse("");
                } else {
                  // Reached end, wrap to beginning
                  const firstSurah = surahs[0];
                  setSelectedSurah(firstSurah.name);
                  setToSurah(firstSurah.name);
                  setFromVerse("1");
                  setToVerse("");
                }
              } else {
                // Backward: move to previous surah (index - 1)
                if (currentSurahIndex > 0) {
                  const previousSurah = surahs[currentSurahIndex - 1];
                  setSelectedSurah(previousSurah.name);
                  setToSurah(previousSurah.name);
                  setFromVerse("1");
                  setToVerse("");
                } else {
                  // Reached beginning, wrap to end
                  const lastSurah = surahs[surahs.length - 1];
                  setSelectedSurah(lastSurah.name);
                  setToSurah(lastSurah.name);
                  setFromVerse("1");
                  setToVerse("");
                }
              }
            }
          } else {
            // If surah not found, start from beginning based on direction
            const startSurah = memorizationDirection === "Forward" ? surahs[0] : surahs[surahs.length - 1];
            setSelectedSurah(startSurah.name);
            setToSurah(startSurah.name);
            setFromVerse("1");
            setToVerse("");
          }
        } else {
          // No previous progress, start from beginning based on direction
          const startSurah = memorizationDirection === "Forward" ? surahs[0] : surahs[surahs.length - 1];
          setSelectedSurah(startSurah.name);
          setToSurah(startSurah.name);
          setFromVerse("1");
          setToVerse("");
        }
      } catch {
        // On error, start from beginning based on direction
        const startSurah = memorizationDirection === "Forward" ? surahs[0] : surahs[surahs.length - 1];
        setSelectedSurah(startSurah.name);
        setToSurah(startSurah.name);
        setFromVerse("1");
        setToVerse("");
      } finally {
        setLoadingProgressData(false);
      }
    }
  }, [studentId, savedCurrentSurahNumber, savedCurrentVerse, memorizationDirection]);

  // Initialize form when dialog opens - save current values first
  useEffect(() => {
    if (open) {
      // Save current values when dialog opens
      setSavedCurrentVerse(currentVerse);
      setSavedCurrentSurahNumber(currentSurahNumber);
      setProgressType("0");
      setQuality("0");
      setNotes("");
      setToVerse("");
    }
  }, [open, currentVerse, currentSurahNumber]);

  // Load progress data when progressType changes (and dialog is open)
  useEffect(() => {
    if (open && savedCurrentSurahNumber > 0) {
      loadProgressByType(progressType);
    }
  }, [progressType, open, savedCurrentSurahNumber, loadProgressByType]);

  // Clear toVerse when fromVerse changes if toVerse is now invalid (same surah only)
  useEffect(() => {
    if (selectedSurah && toSurah && selectedSurah === toSurah && fromVerse && toVerse) {
      if (parseInt(toVerse) < parseInt(fromVerse)) {
        setToVerse("");
      }
    }
  }, [fromVerse, toVerse, selectedSurah, toSurah]);

  // Update toSurah when selectedSurah changes (if toSurah is not set or invalid)
  useEffect(() => {
    if (selectedSurah && !toSurah) {
      setToSurah(selectedSurah);
    }
  }, [selectedSurah, toSurah]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For teachers, use teacherId. For supervisors, use their user id
    const recorderId = user?.teacherId || user?.id;
    if (!recorderId) {
      toast.error("لا يمكن تحديد هوية المستخدم. يرجى تسجيل الخروج والدخول مرة أخرى.");
      return;
    }

    if (!halaqaId) {
      toast.error("الطالب غير مسجل في حلقة نشطة");
      return;
    }

    setSubmitting(true);

    try {
      const data: CreateProgressRecord = {
        studentId,
        teacherId: recorderId,
        halaqaId,
        date: new Date().toISOString(),
        type: parseInt(progressType) as 0 | 1 | 2,
        surahName: selectedSurah,
        toSurahName: toSurah !== selectedSurah ? toSurah : undefined,
        fromVerse: parseInt(fromVerse),
        toVerse: parseInt(toVerse),
        quality: parseInt(quality) as 0 | 1 | 2 | 3,
        notes: notes || undefined,
      };

      await progressApi.create(data);
      toast.success("تم حفظ التسميع بنجاح");

      // Reset form and close dialog
      onOpenChange(false);
      setSelectedSurah("");
      setFromVerse("");
      setToVerse("");
      setNotes("");

      // Notify parent
      onProgressRecorded?.();
    } catch (error: unknown) {
      console.error("Error creating progress:", error);
      const errorMessage = extractErrorMessage(error, "حدث خطأ أثناء حفظ التسميع");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
          
            تسجيل تسميع - {studentName}
          </DialogTitle>
          <DialogDescription>
            الموقع الحالي: {getSurahName(currentSurahNumber)}
            {currentVerse ? ` آية ${currentVerse}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>نوع التسميع</Label>
            <div className="flex rounded-lg border bg-muted p-1 gap-1">
              {[
                { value: "0" as const, label: "حفظ جديد", icon: GraduationCap },
                { value: "1" as const, label: "مراجعة", icon: RefreshCw },
                { value: "2" as const, label: "تثبيت", icon: BookOpen },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setProgressType(type.value);
                  }}
                  disabled={loadingProgressData}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    progressType === type.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                    loadingProgressData && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </button>
              ))}
            </div>
            {loadingProgressData && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                جاري تحميل البيانات...
              </p>
            )}
          </div>

          {/* Row 1: From Surah and From Verse */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>من سورة</Label>
              <Select 
                value={selectedSurah} 
                onValueChange={(value) => {
                  setSelectedSurah(value);
                  if (!toSurah) setToSurah(value);
                }} 
                disabled={progressType === "0" || loadingProgressData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر السورة" />
                </SelectTrigger>
                <SelectContent>
                  {progressType === "0" ? (
                    selectedSurah && (
                      <SelectItem value={selectedSurah}>
                        {selectedSurah}
                      </SelectItem>
                    )
                  ) : (
                    surahs.map((surah) => (
                      <SelectItem key={surah.id} value={surah.name}>
                        {surah.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>من آية</Label>
              <Select 
                value={fromVerse} 
                onValueChange={setFromVerse} 
                disabled={progressType === "0" || loadingProgressData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الآية" />
                </SelectTrigger>
                <SelectContent>
                  {progressType === "0" ? (
                    fromVerse && (
                      <SelectItem value={fromVerse}>
                        {fromVerse}
                      </SelectItem>
                    )
                  ) : (
                    selectedSurah && Array.from(
                      { length: surahs.find(s => s.name === selectedSurah)?.versesCount || 0 },
                      (_, i) => i + 1
                    ).map((verse) => (
                      <SelectItem key={verse} value={verse.toString()}>
                        {verse}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: To Surah and To Verse */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>إلى سورة</Label>
              <Select 
                value={toSurah} 
                onValueChange={setToSurah}
                disabled={!selectedSurah || loadingProgressData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="نفس السورة" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredToSurahs().map((surah) => (
                    <SelectItem key={surah.id} value={surah.name}>
                      {surah.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>إلى آية</Label>
              <Select 
                value={toVerse} 
                onValueChange={setToVerse} 
                disabled={!toSurah}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الآية" />
                </SelectTrigger>
                <SelectContent>
                  {toSurah && (() => {
                    const toSurahInfo = surahs.find(s => s.name === toSurah);
                    if (!toSurahInfo) return null;
                    
                    // If same surah, start from fromVerse
                    const startVerse = (toSurah === selectedSurah && fromVerse) 
                      ? parseInt(fromVerse) 
                      : 1;
                    
                    return Array.from(
                      { length: toSurahInfo.versesCount - startVerse + 1 },
                      (_, i) => startVerse + i
                    ).map((verse) => (
                      <SelectItem key={verse} value={verse.toString()}>
                        {verse}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>التقييم</Label>
            <Select value={quality} onValueChange={(v) => setQuality(v as "0" | "1" | "2" | "3")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">ممتاز</SelectItem>
                <SelectItem value="1">جيد جداً</SelectItem>
                <SelectItem value="2">جيد</SelectItem>
                <SelectItem value="3">مقبول</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          {/* Validation messages */}
          {(() => {
            const hasEmptyFields = !selectedSurah || !toSurah || !fromVerse || !toVerse;
            const sameSurah = selectedSurah && toSurah && selectedSurah === toSurah;
            const invalidVerseRange = sameSurah && fromVerse && toVerse && parseInt(toVerse) < parseInt(fromVerse);
            
            if (hasEmptyFields || invalidVerseRange) {
              return (
                <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-500 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    {!selectedSurah && <p>يرجى اختيار السورة</p>}
                    {selectedSurah && !fromVerse && <p>يرجى تحديد آية البداية</p>}
                    {selectedSurah && fromVerse && !toSurah && <p>يرجى اختيار السورة النهائية</p>}
                    {selectedSurah && fromVerse && toSurah && !toVerse && <p>يرجى تحديد آية النهاية</p>}
                    {invalidVerseRange && <p>في نفس السورة، يجب أن تكون "إلى آية" أكبر من أو تساوي "من آية"</p>}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={(() => {
                const hasEmptyFields = !selectedSurah || !toSurah || !fromVerse || !toVerse;
                const sameSurah = selectedSurah && toSurah && selectedSurah === toSurah;
                const invalidVerseRange = sameSurah && fromVerse && toVerse && parseInt(toVerse) < parseInt(fromVerse);
                return Boolean(hasEmptyFields || invalidVerseRange);
              })()}
              loading={submitting}
              className="bg-gradient-to-l from-black to-gray-900 hover:from-gray-800 hover:to-black"
            >
              حفظ التسميع
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
