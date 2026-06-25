/**
 * Normalize Arabic text so search/compare ignores the variations users don't
 * type consistently: diacritics (تشكيل), tatweel (ـ), and letter forms
 * (أإآ→ا, ى→ي, ة→ه, ؤ→و, ئ→ي). Also lowercases and collapses whitespace so
 * mixed Arabic/Latin terms match too.
 */
export function normalizeArabic(value: string): string {
  return value
    .replace(/[ً-ْٰـ]/g, "") // tashkeel + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}
