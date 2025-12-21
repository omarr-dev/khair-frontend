import { useEffect, useState } from "react";

// Breakpoints matching Tailwind defaults
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to get the current breakpoint
 * Returns the largest breakpoint that the screen size matches
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("2xl");

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width < BREAKPOINTS.sm) {
        setBreakpoint("sm");
      } else if (width < BREAKPOINTS.md) {
        setBreakpoint("sm");
      } else if (width < BREAKPOINTS.lg) {
        setBreakpoint("md");
      } else if (width < BREAKPOINTS.xl) {
        setBreakpoint("lg");
      } else if (width < BREAKPOINTS["2xl"]) {
        setBreakpoint("xl");
      } else {
        setBreakpoint("2xl");
      }
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);

    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Hook for custom media queries
 * @param query - Media query string (e.g., "(min-width: 768px)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const updateMatches = () => {
      setMatches(mediaQuery.matches);
    };

    updateMatches();
    mediaQuery.addEventListener("change", updateMatches);

    return () => mediaQuery.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}

/**
 * Helper hook to check if screen is mobile size
 * Mobile: < 768px
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

/**
 * Helper hook to check if screen is tablet size
 * Tablet: >= 768px and < 1024px
 */
export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  );
}

/**
 * Helper hook to check if screen is desktop size
 * Desktop: >= 1024px
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

/**
 * Utility to get responsive value based on current screen size
 * @param mobile - Value for mobile screens
 * @param tablet - Value for tablet screens (optional, defaults to desktop value)
 * @param desktop - Value for desktop screens
 */
export function useResponsiveValue<T>(
  mobile: T,
  tablet: T | undefined,
  desktop: T
): T {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) return mobile;
  if (isTablet) return tablet ?? desktop;
  return desktop;
}
