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
  label = label.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');

  return label
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a numeric value as a currency string.
 *
 * Supports both direct currency symbols (e.g. "$", "HK$") and ISO currency codes
 * (e.g. "USD", "CAD", "CNY"). When an ISO code is provided, the value is formatted
 * using the browser's `Intl.NumberFormat` for locale-aware display.
 *
 * @param value - The numeric value to format (number or string).
 * @param currency - Currency symbol or ISO code (default: "$").
 * @param locale - Locale identifier used for formatting when a currency code is provided (default: "en-US").
 * @param decimals - Number of decimal places to display (default: 2).
 * @returns A formatted currency string (e.g. "$12.34", "HK$0.0356", "¥1,234.50").
 */
export const formatCurrency = (
  value: string | number | null,
  currency: string = '$',
  locale: string = 'en-US',
  decimals: number = 2
): string => {
  if (value === null || value === undefined) {
    return `${currency}0.00`;
  }

  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return `${currency}0.00`;

  // If user passed ISO code like "USD", "CNY", "CAD", use Intl.NumberFormat
  if (currency.length === 3 && /^[A-Z]{3}$/.test(currency)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  }

  // Otherwise assume it's a symbol like "$", "HK$", etc.
  return `${currency}${number.toFixed(decimals)}`;
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
  const num = typeof value === 'string' ? parseFloat(value.trim()) : value;

  if (typeof num !== 'number' || !isFinite(num)) return fallback;

  return num.toFixed(3);
};

/**
 * Truncate a string to a maximum length, adding an ellipsis ("…") if it exceeds the limit.
 *
 * @example
 * truncateText("Hello world", 5) // → "Hello…"
 *
 * @param text - The input string to truncate.
 * @param maxLength - Maximum allowed length before truncation.
 * @param ellipsis - Optional custom ellipsis string (default "…").
 * @returns The truncated string.
 */
export const truncateText = (
  text: string | null | undefined,
  maxLength: number = 50,
  ellipsis: string = '…'
): string => {
  if (!text) return ''; // gracefully handle null/undefined
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + ellipsis;
};

/**
 * Convert a numeric size into a human-friendly string,
 * automatically scaling through units (B → KB → MB → GB → TB).
 *
 * The function:
 * - Accepts a starting unit ("B", "KB", or "MB")
 * - Auto-upgrades units while value >= 1024
 * - Uses up to 1 decimal place (e.g., "1.5 MB")
 * - Returns "—" for nullish or invalid values
 *
 * ### Examples
 * ```
 * formatSize(11, "KB")        // "11 KB"
 * formatSize(2048, "KB")      // "2 MB"
 * formatSize(1536, "KB")      // "1.5 MB"
 * formatSize(1500000, "B")    // "1.4 MB"
 * formatSize(null)            // "—"
 * ```
 *
 * @param value - The numeric value to format (base 1024)
 * @param startUnit - The unit the input value is currently in
 * @returns Human-readable string with scaled unit, or "—" for invalid input
 */
export const formatSize = (
  value?: number | null,
  startUnit: 'B' | 'KB' | 'MB' = 'B'
): string => {
  if (value == null || isNaN(value)) return '—';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = units.indexOf(startUnit);
  if (index === -1) index = 0; // fallback to B

  let size = value;

  // Auto-upgrade units as long as size exceeds threshold
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }

  // Use integer if clean, or one decimal if fractional
  const formatted = Number.isInteger(size) ? size.toString() : size.toFixed(1);

  return `${formatted} ${units[index]}`;
};

/**
 * Formats a compliance record into a single readable string.
 *
 * Rules:
 *   - Both type and number → `"NPN 80111230"`
 *   - Only type → `"NPN"`
 *   - Only number → `"80111230"`
 *   - Neither present → `"N/A"`
 *
 * Useful for SKU/Product catalog cards, tables, and detail panels where a
 * compact compliance label is needed.
 */
export const formatCompliance = (
  type?: string | null,
  number?: string | null
): string => {
  if (!type && !number) return 'N/A';

  if (type && number) return `${type} ${number}`;
  if (type) return type;

  return number ?? 'N/A';
};
