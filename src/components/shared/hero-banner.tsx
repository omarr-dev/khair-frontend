"use client";

import { cn } from "@/lib/utils";

interface HeroBannerProps {
  /** Optional background image URL from backend */
  imageUrl?: string;
  className?: string;
}

/**
 * Hero banner component displaying a motivational Arabic poem
 * Designed to support future backend image integration
 */
export function HeroBanner({ imageUrl, className }: HeroBannerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        // Background with gradient or image
        imageUrl ? "" : "bg-gradient-to-br from-primary/5 via-background to-secondary/10",
        // Border styling
        "border border-primary/10",
        // Padding
        "p-6 sm:p-8 md:p-10",
        className
      )}
      style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-right decorative corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
        {/* Bottom-left decorative corner */}
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/5 to-transparent rounded-tr-full" />
      </div>

      {/* Content overlay for when image is present */}
      {imageUrl && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      )}

      {/* Poem content */}
      <div className="relative z-10 text-center space-y-4">
        {/* First verse */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-12 text-base sm:text-lg md:text-xl text-foreground/90 font-arabic leading-relaxed">
          <span className="text-foreground/80">طوبى لمن حفظ الكتاب بصدره</span>
          <span className="hidden sm:block text-primary/30">✦</span>
          <span className="text-foreground/80">فبدا وضيئاً كالنجوم تألقا</span>
        </div>

        {/* Second verse */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-12 text-base sm:text-lg md:text-xl text-foreground/90 font-arabic leading-relaxed">
          <span className="text-foreground/80">الله أكبر يا لها من نعمة</span>
          <span className="hidden sm:block text-primary/30">✦</span>
          <span className="text-foreground/80">لما يقال إقرأ فرتّل وارتقى</span>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}
