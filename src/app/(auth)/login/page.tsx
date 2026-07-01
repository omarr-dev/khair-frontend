"use client";

import { ThemeToggle, useAuth, useTenant } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  formatPhoneOrNationalId,
  formatNationalId,
  isValidNationalId,
} from "@/lib/phone-formatter";
import { extractErrorMessage } from "@/lib/error-handler";
import { GraduationCap, User as UserIcon } from "lucide-react";
import { TenantLoadingScreen } from "@/components/shared/tenant-loading-screen";

type LoginMode = "teacher" | "student";

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("teacher");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, studentLogin } = useAuth();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();

  const isStudent = mode === "student";

  const switchMode = (next: LoginMode) => {
    if (next === mode) return;
    setMode(next);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isStudent && !isValidNationalId(nationalId)) {
      setError("رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2");
      return;
    }

    setLoading(true);
    try {
      if (isStudent) {
        await studentLogin(nationalId);
      } else {
        await login(phoneNumber);
      }
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, "فشل تسجيل الدخول");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneOrNationalId(e.target.value);
    setPhoneNumber(formattedValue);
    if (error) setError(""); // Clear error when user starts typing
  };

  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNationalId(formatNationalId(e.target.value));
    if (error) setError("");
  };

  // Show loading state while tenant is being resolved
  if (tenantLoading) {
    return <TenantLoadingScreen message="جاري تحميل بيانات الجمعية..." showName={false} />;
  }

  // Show error if tenant resolution failed
  if (tenantError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-background to-red-50/30 p-4">
        <Card className="w-full max-w-md shadow-2xl border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">خطأ</CardTitle>
            <CardDescription className="text-red-500">
              {tenantError}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              يرجى التأكد من صحة عنوان الجمعية أو المحاولة مرة أخرى لاحقاً.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get display values - use tenant data if available, otherwise use defaults
  const displayName = tenant?.displayName || tenant?.name || "نظام الحلقات";
  const logoUrl = tenant?.logoUrl || "/شعار الجمعية (1).png";

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-primary/10 relative z-10 backdrop-blur-sm bg-background/95">
        <CardHeader className="space-y-4 pb-6">
          {/* Organization Logo - Dynamic based on tenant */}
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <Image
                src={logoUrl}
                alt={`شعار ${displayName}`}
                fill
                className="object-contain"
                priority
                unoptimized={logoUrl.startsWith('http')} // Allow external URLs
              />
            </div>
          </div>

          <CardTitle className="text-4xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {displayName}
          </CardTitle>
          <CardDescription className="text-center text-lg font-medium">
            نظام إدارة الحلقات القرآنية
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account type toggle: Teacher / Student */}
            <div
              role="tablist"
              aria-label="نوع الحساب"
              className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isStudent}
                onClick={() => switchMode("teacher")}
                disabled={loading}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !isStudent
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserIcon className="h-4 w-4" aria-hidden="true" />
                معلم
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isStudent}
                onClick={() => switchMode("student")}
                disabled={loading}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isStudent
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                طالب
              </button>
            </div>

            {isStudent ? (
              <div className="space-y-2">
                <Label htmlFor="nationalId" className="text-base">رقم الهوية الوطنية</Label>
                <Input
                  id="nationalId"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="1XXXXXXXXX"
                  value={nationalId}
                  onChange={handleNationalIdChange}
                  required
                  disabled={loading}
                  maxLength={10}
                  className="text-center h-12 text-lg tracking-wider"
                  dir="ltr"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-base">رقم الجوال أو رقم الهوية</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="050 000 0000"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  required
                  disabled={loading}
                  maxLength={12}
                  className="text-center h-12 text-lg tracking-wider"
                  dir="ltr"
                />
              </div>
            )}
            {error && (
              <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
              size="lg"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground border-t pt-6 flex-col gap-3">
          <p>مرحباً بك في نظام إدارة الحلقات القرآنية</p>

        </CardFooter>
      </Card>
    </div>
  );
}

