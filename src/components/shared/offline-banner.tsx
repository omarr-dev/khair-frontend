"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-white py-2 px-4 animate-in slide-in-from-top-2 duration-300">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
        <WifiOff className="h-4 w-4" />
        <span className="font-medium">لا يوجد اتصال بالإنترنت</span>
        <span className="text-white/80">• يرجى التحقق من اتصالك</span>
      </div>
    </div>
  );
}
