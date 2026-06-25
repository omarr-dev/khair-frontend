"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { supervisorsApi, halaqatApi } from "@/services";
import { HalaqaSupervisor } from "@/types/supervisor";
import { Lookup } from "@/types/api";
import { convertArabicToEnglish, cn } from "@/lib/utils";
import { formatSaudiMobile, isValidSaudiMobile } from "@/lib/phone-formatter";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserCog,
  UserPlus,
  Search,
  MoreVertical,
  Pencil,
  BookOpen,
  Power,
  Phone,
  Loader2,
  Check,
  Users,
  ShieldCheck,
} from "lucide-react";

/** Pull a backend Arabic error message off an axios error, with a fallback. */
function errorMessage(error: unknown, fallback: string): string {
  const data = (error as {
    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
  })?.response?.data;

  if (data?.message) return data.message;

  // ASP.NET model-validation responses use { errors: { Field: ["msg"] } }
  if (data?.errors) {
    const first = Object.values(data.errors).find((m) => m?.length)?.[0];
    if (first) return first;
  }

  return fallback;
}

export function SupervisorsView() {
  const [supervisors, setSupervisors] = useState<HalaqaSupervisor[]>([]);
  const [halaqat, setHalaqat] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create / edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HalaqaSupervisor | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Assignment dialog
  const [assignTargetId, setAssignTargetId] = useState<number | null>(null);
  const [halaqaSearch, setHalaqaSearch] = useState("");
  const [pendingHalaqaIds, setPendingHalaqaIds] = useState<Set<number>>(new Set());

  // Deactivate confirmation
  const [deleteTarget, setDeleteTarget] = useState<HalaqaSupervisor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [supRes, halRes] = await Promise.all([
        supervisorsApi.getAll(),
        halaqatApi.getLookup(),
      ]);
      setSupervisors(supRes.data);
      setHalaqat(halRes.data);
    } catch (error) {
      console.error("Error loading supervisors:", error);
      toast.error("حدث خطأ أثناء تحميل المشرفين");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadData();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const halaqaNameById = useMemo(() => {
    const map = new Map<number, string>();
    halaqat.forEach((h) => map.set(h.id, h.name));
    return map;
  }, [halaqat]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return supervisors;
    return supervisors.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.phoneNumber.toLowerCase().includes(q)
    );
  }, [supervisors, search]);

  const assignTarget = useMemo(
    () => supervisors.find((s) => s.id === assignTargetId) ?? null,
    [supervisors, assignTargetId]
  );

  const totalAssigned = useMemo(
    () => supervisors.filter((s) => s.supervisedHalaqaIds.length > 0).length,
    [supervisors]
  );

  // ---------- Create / edit ----------

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormPhone("");
    setFormOpen(true);
  };

  const openEdit = (s: HalaqaSupervisor) => {
    setEditing(s);
    setFormName(s.fullName);
    // Stored as +9665XXXXXXXX — show it in the local form the user expects.
    setFormPhone(formatSaudiMobile(s.phoneNumber));
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    const phone = convertArabicToEnglish(formPhone).trim();

    if (!name) {
      toast.error("الاسم الكامل مطلوب");
      return;
    }
    if (!phone) {
      toast.error("رقم الجوال مطلوب");
      return;
    }
    if (!isValidSaudiMobile(formPhone)) {
      toast.error("رقم الجوال يجب أن يكون رقم جوال سعودي صحيح (مثال: 0501234567)");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await supervisorsApi.update(editing.id, { fullName: name, phoneNumber: phone });
        toast.success("تم تحديث بيانات المشرف بنجاح");
      } else {
        await supervisorsApi.create({ fullName: name, phoneNumber: phone });
        toast.success("تم إضافة المشرف بنجاح");
      }
      setFormOpen(false);
      await loadData();
    } catch (error) {
      toast.error(errorMessage(error, "حدث خطأ أثناء حفظ البيانات"));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Assignments ----------

  const filteredHalaqat = useMemo(() => {
    const q = halaqaSearch.trim().toLowerCase();
    if (!q) return halaqat;
    return halaqat.filter((h) => h.name.toLowerCase().includes(q));
  }, [halaqat, halaqaSearch]);

  const toggleAssignment = async (halaqaId: number) => {
    if (!assignTarget) return;
    const isAssigned = assignTarget.supervisedHalaqaIds.includes(halaqaId);

    setPendingHalaqaIds((prev) => new Set(prev).add(halaqaId));
    try {
      if (isAssigned) {
        await supervisorsApi.removeFromHalaqa(halaqaId, assignTarget.id);
      } else {
        await supervisorsApi.assignToHalaqa(halaqaId, assignTarget.id);
      }
      // Update local state for the affected supervisor only
      setSupervisors((prev) =>
        prev.map((s) =>
          s.id === assignTarget.id
            ? {
                ...s,
                supervisedHalaqaIds: isAssigned
                  ? s.supervisedHalaqaIds.filter((id) => id !== halaqaId)
                  : [...s.supervisedHalaqaIds, halaqaId],
              }
            : s
        )
      );
    } catch (error) {
      toast.error(errorMessage(error, "حدث خطأ أثناء تحديث التعيين"));
    } finally {
      setPendingHalaqaIds((prev) => {
        const next = new Set(prev);
        next.delete(halaqaId);
        return next;
      });
    }
  };

  // ---------- Deactivate ----------

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supervisorsApi.deactivate(deleteTarget.id);
      toast.success("تم تعطيل المشرف بنجاح");
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      toast.error(errorMessage(error, "حدث خطأ أثناء تعطيل المشرف"));
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="إجمالي المشرفين" value={supervisors.length} />
        <StatCard icon={ShieldCheck} label="مشرفون معيّنون" value={totalAssigned} />
        <StatCard icon={BookOpen} label="إجمالي الحلقات" value={halaqat.length} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو رقم الجوال..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="ml-2 h-4 w-4" />
          إضافة مشرف حلقة
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={search ? "لا توجد نتائج" : "لا يوجد مشرفو حلقات"}
          description={
            search
              ? "جرّب تعديل كلمات البحث"
              : "ابدأ بإضافة مشرف حلقة جديد لتعيينه على الحلقات"
          }
          action={search ? undefined : { label: "إضافة مشرف حلقة", onClick: openCreate }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {s.fullName.charAt(0) || "م"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{s.fullName}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span dir="ltr">{s.phoneNumber}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {s.supervisedHalaqaIds.length === 0 ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        غير معيّن على أي حلقة
                      </Badge>
                    ) : (
                      s.supervisedHalaqaIds.map((id) => (
                        <Badge key={id} variant="secondary">
                          {halaqaNameById.get(id) ?? `حلقة #${id}`}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAssignTargetId(s.id);
                      setHalaqaSearch("");
                    }}
                  >
                    <BookOpen className="ml-2 h-4 w-4" />
                    الحلقات
                    <Badge variant="secondary" className="mr-2">
                      {s.supervisedHalaqaIds.length}
                    </Badge>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="إجراءات">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => openEdit(s)}>
                        <Pencil className="ml-2 h-4 w-4" />
                        تعديل البيانات
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Power className="ml-2 h-4 w-4" />
                        تعطيل المشرف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
              {editing ? "تعديل بيانات المشرف" : "إضافة مشرف حلقة جديد"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "تحديث اسم المشرف ورقم جواله"
                : "أدخل بيانات المشرف. يمكنك تعيينه على الحلقات بعد الإضافة"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-1">
                  الاسم الكامل
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: أحمد محمد العلي"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                  رقم الجوال
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  value={formPhone}
                  onChange={(e) => setFormPhone(formatSaudiMobile(e.target.value))}
                  placeholder="050 000 0000"
                  dir="ltr"
                  maxLength={12}
                  className="text-right"
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={submitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ الحفظ...
                  </>
                ) : editing ? (
                  "تحديث البيانات"
                ) : (
                  "إضافة المشرف"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign-to-halaqat dialog */}
      <Dialog
        open={assignTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setAssignTargetId(null);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              تعيين الحلقات
            </DialogTitle>
            <DialogDescription>
              {assignTarget
                ? `اختر الحلقات التي يشرف عليها ${assignTarget.fullName}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن حلقة..."
                value={halaqaSearch}
                onChange={(e) => setHalaqaSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
              {filteredHalaqat.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  لا توجد حلقات
                </p>
              ) : (
                filteredHalaqat.map((h) => {
                  const isAssigned =
                    assignTarget?.supervisedHalaqaIds.includes(h.id) ?? false;
                  const isPending = pendingHalaqaIds.has(h.id);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => toggleAssignment(h.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border p-3 text-sm transition-colors text-right",
                        isAssigned
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:bg-accent",
                        isPending && "opacity-60"
                      )}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        {h.name}
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border shrink-0",
                          isAssigned
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        )}
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isAssigned ? (
                          <Check className="h-3 w-3" />
                        ) : null}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setAssignTargetId(null)}>
              تم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تعطيل المشرف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تعطيل المشرف {deleteTarget?.fullName}؟ سيتم إلغاء جميع
              تعييناته على الحلقات ولن يتمكن من الدخول للنظام. يمكن إعادة تفعيله لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeactivate();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جارٍ التعطيل...
                </>
              ) : (
                "تعطيل"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-full bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
