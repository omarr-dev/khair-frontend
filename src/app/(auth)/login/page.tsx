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
import { formatPhoneOrNationalId } from "@/lib/phone-formatter";
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
    const formattedValue = formatPhoneOrNationalId(e.target.value);
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
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-base">رقم الجوال أو رقم الهوية</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+966 5XXXXXXXX أو رقم الهوية"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                required
                disabled={loading}
                className="text-right h-12 text-lg"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                المعلّم الذي لم يُسجّل رقم جواله بعد يسجّل الدخول برقم الهوية.
              </p>
            </div>
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

