"use client";

import { useTenant } from "@/components/providers";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TenantLoadingScreenProps {
  /**
   * Loading message to display
   * @default "جاري التحميل..."
   */
  message?: string;
  
  /**
   * Whether to show full screen (centered) or inline
   * @default true
   */
  fullScreen?: boolean;
  
  /**
   * Custom className for the container
   */
  className?: string;
  
  /**
   * Size of the logo
   * @default "lg"
   */
  logoSize?: "sm" | "md" | "lg" | "xl";
  
  /**
   * Whether to show the organization name
   * @default true
   */
  showName?: boolean;
}

/**
 * Tenant-aware loading screen component
 * Automatically uses tenant branding (logo, name, colors) when available
 */
export function TenantLoadingScreen({
  message = "جاري التحميل...",
  fullScreen = true,
  className,
  logoSize = "lg",
  showName = true,
}: TenantLoadingScreenProps) {
  const { tenant } = useTenant();

  // Get tenant branding with fallbacks
  const displayName = tenant?.displayName || tenant?.name || "نظام الحلقات";
  const logoUrl = tenant?.logoUrl || "/شعار الجمعية (1).png";
  const hasCustomLogo = tenant?.logoUrl;

  // Logo size classes
  const logoSizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
    xl: "h-24 w-24",
  };

  // If no custom logo, show a styled initial
  const showInitial = !hasCustomLogo;
  const initial = displayName.charAt(0);

  const content = (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Logo or Initial */}
      <div className="relative">
        {hasCustomLogo ? (
          <div className={cn("relative", logoSizeClasses[logoSize])}>
            <Image
              src={logoUrl}
              alt={`شعار ${displayName}`}
              fill
              className="object-contain animate-pulse"
              priority
              unoptimized={logoUrl.startsWith("http")}
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold animate-pulse",
              logoSizeClasses[logoSize],
              logoSize === "sm" ? "text-xl" : "",
              logoSize === "md" ? "text-2xl" : "",
              logoSize === "lg" ? "text-3xl" : "",
              logoSize === "xl" ? "text-4xl" : ""
            )}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Spinner */}
      <Loader2 className="h-8 w-8 animate-spin text-primary" />

      {/* Organization Name */}
      {showName && (
        <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
      )}

      {/* Loading Message */}
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Simple inline loading spinner with tenant colors
 */
export function TenantLoadingSpinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
    />
  );
}
