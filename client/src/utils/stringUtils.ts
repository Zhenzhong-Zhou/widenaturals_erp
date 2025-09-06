/**
 * Safely trims a string, returning an empty string if the input is null or undefined.
 *
 * @param value - The input string to sanitize.
 * @returns A trimmed string, or an empty string if the input was nullish.
 *
 * @example
 * sanitizeString('  hello ') // → 'hello'
 * sanitizeString(undefined)  // → ''
 * sanitizeString(null)       // → ''
 */
export const sanitizeString = (value?: string | null): string => (value ?? '').trim();
