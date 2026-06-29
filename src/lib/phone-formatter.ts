/**
 * Formats a phone number input value to Saudi Arabia format (+966)
 *
 * @param value - The input value to format
 * @returns The formatted phone number string
 *
 * @example
 * formatSaudiPhoneNumber("5XXXXXXXX") // returns "+9665XXXXXXXX"
 * formatSaudiPhoneNumber("05XXXXXXXX") // returns "+9665XXXXXXXX"
 * formatSaudiPhoneNumber("") // returns ""
 */
export function formatSaudiPhoneNumber(value: string): string {
  // Convert Arabic-Indic digits (٠-٩) to Western Arabic numerals (0-9)
  const arabicToEnglishMap: { [key: string]: string } = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  let convertedValue = value.split('').map(char => arabicToEnglishMap[char] || char).join('');
  
  // Remove all non-digit characters except +
  let formattedValue = convertedValue.replace(/[^\d+]/g, "");

  // If the field is empty or only contains invalid prefixes of +966, allow it to be empty
  if (formattedValue === "" || formattedValue === "+" || formattedValue === "+9" || formattedValue === "+96") {
    return "";
  }

  // Auto-format with +966
  if (!formattedValue.startsWith("+966")) {
    if (formattedValue.startsWith("966")) {
      formattedValue = "+" + formattedValue;
    } else if (formattedValue.startsWith("0")) {
      formattedValue = "+966" + formattedValue.substring(1);
    } else if (formattedValue.startsWith("5")) {
      formattedValue = "+966" + formattedValue;
    } else if (formattedValue.length > 0 && !formattedValue.startsWith("+")) {
      formattedValue = "+966" + formattedValue;
    }
  }

  // Limit length to +966 + 9 digits = 13 characters
  if (formattedValue.length > 13) {
    formattedValue = formattedValue.substring(0, 13);
  }

  return formattedValue;
}

/**
 * Formats a login identifier that can be EITHER a Saudi phone number OR a
 * National ID / Iqama number, using the local format people actually type.
 *
 * Saudi National IDs start with 1, Iqama (residency) numbers start with 2,
 * and are 10 digits -> kept as raw digits.
 *
 * Phone numbers are shown in the familiar local grouping "050 000 0000"
 * (10 digits starting with 0). Anything pasted in international form
 * (+966 / 966 / leading 5) is converted back to the local 05X form so the
 * user always sees the number the way they know it. The backend strips the
 * spaces and normalizes to +966 on its side.
 *
 * Used on the login screen, where imported teachers sign in with their ID
 * until they set a real phone number.
 */
const ARABIC_TO_ENGLISH: { [key: string]: string } = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

/** Convert Arabic-Indic digits to Western and keep digits only. */
function toEnglishDigits(value: string): string {
  return value
    .split('')
    .map((c) => ARABIC_TO_ENGLISH[c] ?? c)
    .join('')
    .replace(/[^\d]/g, '');
}

/**
 * Reduce any Saudi mobile input to the local 10-digit form "05XXXXXXXX".
 * Accepts local (05…), bare (5…), and international (+966…/966…/00966…).
 * Returns digits only (no spaces). Empty string if nothing usable.
 */
function toLocalSaudiDigits(value: string): string {
  let digits = toEnglishDigits(value);
  if (digits.startsWith("00966")) digits = "0" + digits.substring(5);
  else if (digits.startsWith("966")) digits = "0" + digits.substring(3);
  else if (digits.startsWith("5")) digits = "0" + digits;
  return digits.substring(0, 10);
}

/**
 * Format a Saudi mobile number for display in the local grouped form
 * "050 000 0000". Accepts every input form (05…, 5…, +966…, 966…, 00966…)
 * and always shows the number the way Saudis read it. The backend strips the
 * spaces and normalizes to +966 on its side.
 */
export function formatSaudiMobile(value: string): string {
  const digits = toLocalSaudiDigits(value);
  if (!digits) return "";

  const parts: string[] = [digits.substring(0, 3)];
  if (digits.length > 3) parts.push(digits.substring(3, 6));
  if (digits.length > 6) parts.push(digits.substring(6, 10));
  return parts.join(" ");
}

/** True when the value is a valid Saudi mobile number in any accepted form. */
export function isValidSaudiMobile(value: string): boolean {
  const local = toLocalSaudiDigits(value);
  const validPrefixes = ["50", "51", "52", "53", "54", "55", "56", "57", "58", "59"];
  return /^05[0-9]{8}$/.test(local) && validPrefixes.includes(local.substring(1, 3));
}

export function formatPhoneOrNationalId(value: string): string {
  let digits = toEnglishDigits(value);

  // National ID (1...) or Iqama (2...) -> keep raw digits, max 10
  if (/^[12]/.test(digits)) {
    return digits.substring(0, 10);
  }

  // Normalize any international form to the local 05X form
  if (digits.startsWith("966")) {
    digits = "0" + digits.substring(3);
  } else if (digits.startsWith("5")) {
    digits = "0" + digits;
  }

  // Keep a local Saudi mobile number: 10 digits (05X XXX XXXX)
  digits = digits.substring(0, 10);

  // Group as "050 000 0000" while typing
  const parts: string[] = [digits.substring(0, 3)];
  if (digits.length > 3) parts.push(digits.substring(3, 6));
  if (digits.length > 6) parts.push(digits.substring(6, 10));

  return parts.join(" ");
}
