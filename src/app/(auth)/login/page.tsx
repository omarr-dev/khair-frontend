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
import { formatSaudiPhoneNumber } from "@/lib/phone-formatter";
import { extractErrorMessage } from "@/lib/error-handler";
import { Loader2 } from "lucide-react";
import { TenantLoadingScreen } from "@/components/shared/tenant-loading-screen";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(phoneNumber);
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
    const formattedValue = formatSaudiPhoneNumber(e.target.value);
    setPhoneNumber(formattedValue);
    if (error) setError(""); // Clear error when user starts typing
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-3 sm:p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 left-10 sm:left-20 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-primary/10 relative z-10 backdrop-blur-sm bg-background/95 my-auto">
        <CardHeader className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 pt-4 sm:pt-6">
          {/* Organization Logo - Dynamic based on tenant */}
          <div className="flex justify-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
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

          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {displayName}
          </CardTitle>
          <CardDescription className="text-center text-base sm:text-lg font-medium">
            نظام إدارة الحلقات القرآنية
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4 sm:pb-6 px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm sm:text-base">رقم الجوال</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+966 5XXXXXXXX"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                required
                disabled={loading}
                className="text-right h-11 sm:h-12 text-base sm:text-lg"
                dir="ltr"
              />
            </div>
            {error && (
              <div className="text-xs sm:text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/30 p-2 sm:p-3 rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full shadow-lg hover:shadow-xl transition-all duration-200 h-11 sm:h-12"
              disabled={loading}
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs sm:text-sm text-muted-foreground border-t pt-4 sm:pt-6 pb-4 sm:pb-6 flex-col gap-2 sm:gap-3">
          <p>مرحباً بك في نظام إدارة الحلقات القرآنية</p>

        </CardFooter>
      </Card>
    </div>
  );
}

