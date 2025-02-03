/**
 * Capitalizes the first letter of a given text.
 * @param text - The string to capitalize.
 * @returns The string with the first letter capitalized or 'Unknown' if null/undefined.
 */
export const capitalizeFirstLetter = (text: string | null | undefined): string => {
  if (!text) return 'Unknown';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Formats a number as a currency string.
 * @param value - The number or string to format.
 * @param currencySymbol - The currency symbol to prepend (default: "$").
 * @returns A formatted currency string.
 */
export const formatCurrency = (value: string | number, currencySymbol: string = '$'): string => {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return `${currencySymbol}0.00`;
  return `${currencySymbol}${number.toFixed(2)}`;
};
