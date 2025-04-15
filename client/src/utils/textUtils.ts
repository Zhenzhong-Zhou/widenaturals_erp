import {
  parsePhoneNumberFromString,
  AsYouType,
  type CountryCode,
} from 'libphonenumber-js';
import type { ShippingInformation } from '@features/order';

/**
 * Formats a given string into human-readable Title Case.
 * - Handles snake_case, kebab-case, and camelCase formats.
 * - Replaces underscores and hyphens with spaces.
 * - Adds spaces between camelCase words.
 * - Capitalizes the first letter of each word.
 *
 * @param text - The input string to format.
 * @returns A formatted Title Case string, or 'Unknown' if input is null or undefined.
 * Examples:
 *  - "lot_number" → "Lot Number"
 *  - "lotNumber" → "Lot Number"
 *  - "LOT-number" → "Lot Number"
 */
export const formatLabel = (text: string | null | undefined): string => {
  if (!text) return 'Unknown';

  return text
    .replace(/[_-]/g, ' ') // snake_case or kebab-case to space
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase to space
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
  value: string | number,
  currencySymbol: string = '$'
): string => {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return `${currencySymbol}0.00`;
  return `${currencySymbol}${number.toFixed(2)}`;
};

/**
 * Converts a string to uppercase.
 * @param str - The string to convert.
 * @returns The uppercase version of the string.
 */
export const toUpperCase = (str: string): string => {
  return str.toUpperCase();
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
 * Formats a shipping address into a display-friendly structure.
 * - For North America, combines street address + city/state/postal into one 'Address' field.
 * - For other regions, keeps Address and Location separate.
 *
 * @param {ShippingInformation | null} shippingInfo
 * @returns {Record<string, string>}
 */
export const formatShippingAddress = (
  shippingInfo?: ShippingInformation | null
): Record<string, string> => {
  if (!shippingInfo) {
    return {
      Address: 'N/A',
      Country: 'N/A',
      Region: 'N/A',
    };
  }

  const {
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country,
    shipping_region,
  } = shippingInfo;

  const isNorthAmerica = ['Canada', 'United States', 'USA', 'US'].includes(
    (shipping_country || '').trim()
  );

  const addressParts = [shipping_address_line1, shipping_address_line2].filter(
    Boolean
  );
  const locationParts = isNorthAmerica
    ? [shipping_city, shipping_state, shipping_postal_code]
    : [shipping_city, shipping_region];

  const fullAddress =
    [...addressParts, ...locationParts].filter(Boolean).join(', ') || 'N/A';

  return {
    Address: fullAddress,
    Country: shipping_country || 'N/A',
    Region: shipping_region || 'N/A',
  };
};
