"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";

export default function RootPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // Redirect to home page - which uses (dashboard) layout
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-3xl mb-4">
          خ
        </div>
        <h1 className="text-2xl font-bold mb-2">جمعية خير</h1>
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}
