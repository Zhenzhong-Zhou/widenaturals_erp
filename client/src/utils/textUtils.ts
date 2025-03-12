/**
 * Capitalizes the first letter of each word in a given text.
 * @param text - The string to format.
 * @returns The formatted string or 'Unknown' if null/undefined.
 */
export const capitalizeFirstLetter = (
  text: string | null | undefined
): string => {
  if (!text) return 'Unknown';

  return text
    .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
    .toLowerCase() // Convert everything to lowercase first
    .split(' ') // Split into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
    .join(' '); // Join back into a sentence
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
