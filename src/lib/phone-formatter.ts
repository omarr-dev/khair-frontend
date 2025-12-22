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
  // Remove all non-digit characters except +
  let formattedValue = value.replace(/[^\d+]/g, "");

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
