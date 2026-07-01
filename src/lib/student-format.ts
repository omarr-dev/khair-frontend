// Small display helpers shared across the student portal pages.

/** Progress record quality → Arabic label + color classes. Handles English enum names and raw Arabic. */
export function qualityLabel(quality?: string): { text: string; className: string } {
  switch (quality) {
    case "Excellent":
    case "ممتاز":
      return { text: "ممتاز", className: "text-emerald-600 dark:text-emerald-400" };
    case "VeryGood":
    case "جيد جداً":
      return { text: "جيد جداً", className: "text-blue-600 dark:text-blue-400" };
    case "Good":
    case "جيد":
      return { text: "جيد", className: "text-amber-600 dark:text-amber-400" };
    case "Acceptable":
    case "مقبول":
      return { text: "مقبول", className: "text-orange-600 dark:text-orange-400" };
    default:
      return { text: quality ?? "-", className: "text-muted-foreground" };
  }
}

/** Progress type (Memorization/Revision/Consolidation) → Arabic label. */
export function progressTypeLabel(type?: string): string {
  switch (type) {
    case "Memorization":
    case "حفظ":
      return "حفظ";
    case "Revision":
    case "مراجعة":
      return "مراجعة";
    case "Consolidation":
    case "تثبيت":
      return "تثبيت";
    default:
      return type ?? "-";
  }
}

/** YYYY-MM-DD for a Date (local components). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** First and last day (YYYY-MM-DD) of the month containing `d`. */
export function monthRange(d: Date): { start: string; end: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toDateStr(start), end: toDateStr(end) };
}

/** Format an ISO date string as a short Arabic date. */
export function formatArabicDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      day: "numeric",
      month: "long",
      weekday: "short",
    });
  } catch {
    return iso.slice(0, 10);
  }
}
