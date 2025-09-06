import {
  parsePhoneNumberFromString,
  AsYouType,
  type CountryCode,
} from 'libphonenumber-js';

/**
 * Formats nullable or undefined values into fallback strings.
 *
 * @param value - The original value to format.
 * @param fallback - The fallback string to return for nullish values. Default is 'N/A'.
 * @param emptyStringFallback - Optional fallback if the value is an empty string.
 * @returns {string} A formatted string or the original value.
 */
export const formatNullable = (
  value: any,
  fallback: string = 'N/A',
  emptyStringFallback?: string
): string => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return emptyStringFallback ?? fallback;
  }

  return String(value);
};

interface FormatLabelOptions {
  /** If true, hyphens (`-`) will be preserved instead of replaced with spaces */
  preserveHyphen?: boolean;
  
  /** If true, middle dots (e.g. `·•‧⋅∙`) will be preserved instead of replaced with spaces */
  preserveDot?: boolean;
}

/**
 * Formats a given string into a human-readable Title Case label.
 *
 * ### Transformations:
 * - Replaces underscores (`_`) with spaces.
 * - Replaces hyphens (`-`) with spaces unless `preserveHyphen` is true.
 * - Replaces middle dots (`·•‧⋅∙`) with spaces unless `preserveDot` is true.
 * - Inserts spaces between camelCase words.
 * - Convert the result to Title Case (first letter of each word capitalized).
 *
 * ### Examples:
 * ```ts
 * formatLabel("lot_number")                    // → "Lot Number"
 * formatLabel("lotNumber")                    // → "Lot Number"
 * formatLabel("LOT-number")                   // → "Lot Number"
 * formatLabel("order·type", { preserveDot: true }) // → "Order·type"
 * formatLabel("custom-label", { preserveHyphen: true }) // → "Custom-label"
 * ```
 *
 * @param text - The raw input string to format.
 * @param options - Optional flags to preserve specific characters.
 * @returns A formatted string in Title Case, or `'Unknown'` if input is null, undefined, or empty.
 */
export const formatLabel = (
  text: string | null | undefined,
  options: FormatLabelOptions = {}
): string => {
  if (text === null || text === undefined || text === '') return 'Unknown';
  
  let label = String(text); // ensures label is a string
  
  if (!options.preserveHyphen) {
    label = label.replace(/-/g, ' ');
  }
  
  if (!options.preserveDot) {
    label = label.replace(/[·•‧⋅∙]/g, ' ');
  }
  
  // Always normalize underscores and camelCase spacing
  label = label
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  
  return label
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a number as a currency string.
 * @param value - The number or string to format.
 * @param currencySymbol - The currency symbol to prepend (default: "$").
 * @returns A formatted currency string.
 */
export const formatCurrency = (
  value: string | number | null,
  currencySymbol: string = '$'
): string => {
  if (value === null || value === undefined) {
    return `${currencySymbol}0.00`;
  }

  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return `${currencySymbol}0.00`;

  return `${currencySymbol}${number.toFixed(2)}`;
};

/**
 * Converts a string to uppercase.
 * @param str - The string to convert.
 * @returns The uppercase version of the string.
 */
export const toUpperCase = (str: string | null | undefined): string => {
  return str ? str.toUpperCase() : '-';
};

/**
 * Formats a phone number dynamically by detecting its country.
 *
 * @param phoneNumber - The raw phone number from the database.
 * @param defaultCountry - Fallback country code if detection fails (default: "CA").
 * @returns Formatted phone number or fallback message.
 */
export const formatPhoneNumber = (
  phoneNumber: string | null,
  defaultCountry: CountryCode = 'CA'
): string => {
  if (!phoneNumber) return 'N/A';

  // Normalize: remove all non-numeric except leading +
  const normalized = phoneNumber.trim().replace(/[^\d+]/g, '');

  const parsedPhone = parsePhoneNumberFromString(normalized);

  if (parsedPhone && parsedPhone.isValid()) {
    return parsedPhone.formatInternational(); // e.g. +1 234 567 8901
  }

  try {
    // Fallback with AsYouType (doesn't validate but formats nicely)
    const typed = new AsYouType(defaultCountry).input(normalized);
    return typed || normalized;
  } catch {
    return normalized;
  }
};

/**
 * Formats a number (or numeric string) to 3 decimal places.
 *
 * - Accepts string, number, null, or undefined.
 * - If the input is not a valid number, returns a fallback (default: '—').
 * - Ensures consistent precision for unit prices, exchange rates, etc.
 *
 * @param {string | number | null | undefined} value - The input value to format.
 * @param {string} [fallback='—'] - The fallback string to return for invalid input.
 * @returns {string} Formatted string with 3 decimal places, or fallback.
 *
 * @example
 * formatToThreeDecimal(1.23456);        // "1.235"
 * formatToThreeDecimal('0.1');          // "0.100"
 * formatToThreeDecimal(null);           // "—"
 * formatToThreeDecimal('invalid');      // "—"
 */
export const formatToThreeDecimal = (
  value: string | number | null | undefined,
  fallback: string = '—'
): string => {
  const num =
    typeof value === 'string' ? parseFloat(value.trim()) : value;
  
  if (typeof num !== 'number' || !isFinite(num)) return fallback;
  
  return num.toFixed(3);
};
