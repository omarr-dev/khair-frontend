"use client";

import { useState, useEffect } from "react";
import { studentApi } from "@/services";
import { Student, CreateStudentDto, UpdateStudentDto } from "@/types/student";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/components/shared/searchable-select";
import {
  UserPlus,
  UserCheck,
  User,
  Phone,
  IdCard,
  Calendar,
  UserCircle,
  GraduationCap,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { formatSaudiPhoneNumber } from "@/lib/phone-formatter";
import { extractErrorMessage } from "@/lib/error-handler";

interface StudentManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "add" runs the ID-first flow; "edit" opens the profile form for an existing student */
  mode: "add" | "edit";
  /** The student being edited (required for mode === "edit") */
  student?: Student | null;
  /** Current teacher's id — new/assigned students are attached to this teacher */
  teacherId: number;
  /** The teacher's own halaqat, for the assignment picker */
  halaqaOptions: SearchableSelectOption[];
  onSuccess: () => void;
}

export function StudentManageDialog({
  open,
  onOpenChange,
  mode,
  student,
  teacherId,
  halaqaOptions,
  onSuccess,
}: StudentManageDialogProps) {
  // "id" = enter ID, "existing" = match found (assign), "new" = fill new-student form
  const [step, setStep] = useState<"id" | "existing" | "new">("id");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [existingStudent, setExistingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [office, setOffice] = useState("");
  const [center, setCenter] = useState("");
  const [socialStatus, setSocialStatus] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [memorizationDirection, setMemorizationDirection] = useState<"Forward" | "Backward">("Forward");
  const [selectedHalaqa, setSelectedHalaqa] = useState("");

  // (Re)initialise the dialog whenever it opens
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && student) {
      setStep("new");
      setFirstName(student.firstName);
      setLastName(student.lastName);
      setDateOfBirth(student.dateOfBirth || "");
      setIdNumber(student.idNumber || "");
      setPhone(student.phone || "");
      setNationality(student.nationality || "");
      setOffice(student.office || "");
      setCenter(student.center || "");
      setSocialStatus(student.socialStatus || "");
      setHealthStatus(student.healthStatus || "");
      setGuardianName(student.guardianName || "");
      setGuardianPhone(student.guardianPhone || "");
    } else {
      setStep("id");
      setExistingStudent(null);
      setFirstName("");
      setLastName("");
      setDateOfBirth("");
      setIdNumber("");
      setPhone("");
      setNationality("");
      setOffice("");
      setCenter("");
      setSocialStatus("");
      setHealthStatus("");
      setGuardianName("");
      setGuardianPhone("");
      setMemorizationDirection("Forward");
      // Pre-select the teacher's halaqa if they only have one
      setSelectedHalaqa(halaqaOptions.length === 1 ? halaqaOptions[0].id.toString() : "");
    }
  }, [open, mode, student, halaqaOptions]);

  const isEditing = mode === "edit";

  // Step 1: check whether a student with this ID already exists
  const handleLookup = async () => {
    if (idNumber.length < 10) {
      toast.error("يرجى إدخال رقم هوية صحيح (10 أرقام)");
      return;
    }
    setLookupLoading(true);
    try {
      const response = await studentApi.lookupByIdNumber(idNumber);
      setExistingStudent(response.data);
      setStep("existing");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        setStep("new");
      } else {
        toast.error("حدث خطأ أثناء التحقق من رقم الهوية");
      }
    } finally {
      setLookupLoading(false);
    }
  };

  // Assign an already-existing student to the teacher's halaqa
  const handleAssignExisting = async () => {
    if (!existingStudent || !selectedHalaqa) return;
    setIsSubmitting(true);
    try {
      await studentApi.assign({
        studentId: existingStudent.id,
        halaqaId: parseInt(selectedHalaqa),
        teacherId,
      });
      toast.success("تم إضافة الطالب إلى حلقتك بنجاح");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(extractErrorMessage(error, "حدث خطأ أثناء إضافة الطالب"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a new student (add) or update an existing one (edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !selectedHalaqa) {
      toast.error("يرجى اختيار الحلقة");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing && student) {
        const data: UpdateStudentDto = {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth || undefined,
          guardianName: guardianName || undefined,
          guardianPhone: guardianPhone || undefined,
          phone: phone || undefined,
          idNumber: idNumber || undefined,
          nationality: nationality || undefined,
          office: office || undefined,
          center: center || undefined,
          socialStatus: socialStatus || undefined,
          healthStatus: healthStatus || undefined,
        };
        await studentApi.update(student.id, data);
        toast.success("تم تحديث بيانات الطالب بنجاح");
      } else {
        const data: CreateStudentDto = {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth || undefined,
          guardianName: guardianName || undefined,
          guardianPhone: guardianPhone || undefined,
          phone: phone || undefined,
          idNumber: idNumber || undefined,
          nationality: nationality || undefined,
          office: office || undefined,
          center: center || undefined,
          socialStatus: socialStatus || undefined,
          healthStatus: healthStatus || undefined,
          memorizationDirection,
          currentSurahNumber: 1,
          currentVerse: 0,
          halaqaId: parseInt(selectedHalaqa),
          teacherId,
        };
        await studentApi.create(data);
        toast.success("تم إضافة الطالب بنجاح");
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(extractErrorMessage(error, "حدث خطأ أثناء حفظ بيانات الطالب"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            {isEditing
              ? "تعديل بيانات الطالب"
              : step === "existing"
              ? "الطالب مسجّل مسبقاً"
              : "إضافة طالب جديد"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "قم بتحديث بيانات الطالب ثم احفظ التغييرات"
              : step === "id"
              ? "أدخل رقم هوية الطالب للتحقق إن كان مسجّلاً في النظام مسبقاً"
              : step === "existing"
              ? "هذا الطالب موجود بالفعل — يمكنك إضافته إلى حلقتك مباشرة"
              : "أدخل بيانات الطالب الجديد"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: enter the ID number */}
        {!isEditing && step === "id" && (
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="lookupId" className="flex items-center gap-1">
                رقم هوية الطالب
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lookupId"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLookup();
                    }
                  }}
                  placeholder="١٠ أرقام"
                  dir="ltr"
                  className="pr-10 text-left"
                  maxLength={10}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                نتحقق أولاً من رقم الهوية لتجنّب تكرار تسجيل الطالب
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => setStep("new")} disabled={lookupLoading}>
                إضافة بدون رقم هوية
              </Button>
              <Button type="button" onClick={handleLookup} disabled={lookupLoading || idNumber.length < 10}>
                {lookupLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ التحقق...
                  </>
                ) : (
                  "تحقّق ومتابعة"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2a: an existing student matched the ID → add to teacher's halaqa */}
        {!isEditing && step === "existing" && existingStudent && (
          <div className="space-y-5 py-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{existingStudent.fullName}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {existingStudent.idNumber}
                  </p>
                </div>
              </div>
              {existingStudent.currentHalaqa && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">الحلقة الحالية: {existingStudent.currentHalaqa}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>أضِف إلى حلقتك</Label>
              <SearchableSelect
                className="w-full"
                options={halaqaOptions}
                value={selectedHalaqa}
                onValueChange={setSelectedHalaqa}
                placeholder="اختر الحلقة"
                searchPlaceholder="ابحث عن حلقة..."
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setExistingStudent(null);
                  setStep("id");
                }}
                disabled={isSubmitting}
              >
                رجوع
              </Button>
              <Button type="button" onClick={handleAssignExisting} disabled={isSubmitting || !selectedHalaqa}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ الإضافة...
                  </>
                ) : (
                  "إضافة إلى حلقتي"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2b: new-student form (or edit form) */}
        {(isEditing || step === "new") && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
              {/* Student info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>معلومات الطالب</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-1">
                      الاسم الأول<span className="text-destructive">*</span>
                    </Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="مثال: أحمد" required autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center gap-1">
                      اسم العائلة<span className="text-destructive">*</span>
                    </Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="مثال: العلي" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dob">تاريخ الميلاد</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="pr-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNum">رقم الهوية</Label>
                    <div className="relative">
                      <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="idNum" value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} dir="ltr" className="pr-10 text-left" maxLength={10} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم هاتف الطالب</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" value={phone} onChange={(e) => setPhone(formatSaudiPhoneNumber(e.target.value))} placeholder="+966 5X XXX XXXX" dir="ltr" className="pr-10 text-left" />
                  </div>
                </div>
              </div>

              {/* Additional info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <IdCard className="h-4 w-4" />
                  <span>معلومات إضافية</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="nat">الجنسية</Label>
                    <Input id="nat" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="مثال: سعودي" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="office">المكتب / القسم</Label>
                    <Input id="office" value={office} onChange={(e) => setOffice(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="center">المجمع / المركز</Label>
                  <Input id="center" value={center} onChange={(e) => setCenter(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="social">الحالة الاجتماعية</Label>
                    <Input id="social" value={socialStatus} onChange={(e) => setSocialStatus(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="health">الحالة الصحية</Label>
                    <Input id="health" value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Guardian info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <UserCircle className="h-4 w-4" />
                  <span>معلومات ولي الأمر</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gName">اسم ولي الأمر</Label>
                    <Input id="gName" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="مثال: محمد العلي" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gPhone">هاتف ولي الأمر</Label>
                    <Input id="gPhone" value={guardianPhone} onChange={(e) => setGuardianPhone(formatSaudiPhoneNumber(e.target.value))} placeholder="+966 5X XXX XXXX" dir="ltr" className="text-left" />
                  </div>
                </div>
              </div>

              {/* New-student only: direction + halaqa */}
              {!isEditing && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <ArrowUpDown className="h-4 w-4" />
                      <span>اتجاه الحفظ</span>
                    </div>
                    <Select value={memorizationDirection} onValueChange={(v) => setMemorizationDirection(v as "Forward" | "Backward")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Forward">من الفاتحة إلى الناس</SelectItem>
                        <SelectItem value="Backward">من الناس إلى الفاتحة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>الحلقة</span>
                    </div>
                    <SearchableSelect
                      className="w-full"
                      options={halaqaOptions}
                      value={selectedHalaqa}
                      onValueChange={setSelectedHalaqa}
                      placeholder="اختر الحلقة"
                      searchPlaceholder="ابحث عن حلقة..."
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
              {!isEditing ? (
                <Button type="button" variant="outline" onClick={() => setStep("id")} disabled={isSubmitting}>
                  رجوع
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  إلغاء
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ الحفظ...
                  </>
                ) : isEditing ? (
                  "تحديث البيانات"
                ) : (
                  "إضافة الطالب"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
