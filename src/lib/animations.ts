/**
 * Reusable animation and transition utility classes
 * These can be used with the `cn()` utility for composing Tailwind classes
 */

export const animations = {
  // Card hover effects
  cardHover:
    "transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",

  // Button press effect
  buttonPress: "transition-transform duration-150 active:scale-95",

  // Fade in animation
  fadeIn: "animate-in fade-in duration-300",

  // Slide in from bottom
  slideInBottom: "animate-in slide-in-from-bottom-4 duration-300",

  // Slide in from top
  slideInTop: "animate-in slide-in-from-top-4 duration-300",

  // Expand/collapse for accordions and dropdowns
  expand:
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",

  // Skeleton loading pulse
  pulse: "animate-pulse",

  // Spinning loader
  spin: "animate-spin",

  // Bounce effect
  bounce: "animate-bounce",
} as const;

export const transitions = {
  // Fast transition for immediate feedback
  fast: "transition-all duration-150 ease-out",

  // Normal transition for most interactions
  normal: "transition-all duration-200 ease-in-out",

  // Slow transition for larger movements
  slow: "transition-all duration-300 ease-in-out",

  // Color transitions only (for theme changes)
  colors:
    "transition-colors duration-200 ease-in-out",

  // Transform transitions only
  transform: "transition-transform duration-200 ease-out",
} as const;

export const focusRing = {
  // Standard focus ring
  default: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

  // Primary color focus ring
  primary: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",

  // No ring offset (for compact elements)
  compact: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
} as const;

export const hover = {
  // Standard hover overlay
  overlay: "relative after:absolute after:inset-0 after:bg-black/5 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-200",

  // Lift effect on hover
  lift: "hover:-translate-y-0.5 transition-transform duration-200",

  // Glow effect
  glow: "hover:shadow-lg transition-shadow duration-200",

  // Scale up slightly
  scale: "hover:scale-105 transition-transform duration-200",
} as const;
