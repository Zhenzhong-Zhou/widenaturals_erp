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
export const sanitizeString = (value?: string | null): string =>
  (value ?? '').trim();

/**
 * Normalizes a value for use in query/filter objects.
 *
 * Converts empty string ("") and null → undefined,
 * allowing utilities like `cleanObject()` or query builders
 * to automatically drop meaningless filter parameters.
 *
 * Use cases:
 *  - Constructing API filter objects
 *  - Preparing query params before serializing to URL
 *  - Avoiding `""` or `null` values being sent to backend
 *
 * @example
 * normalize("")       // → undefined
 * normalize(null)     // → undefined
 * normalize("CA")     // → "CA"
 * normalize(25)       // → 25
 *
 * @param v - any value coming from form/UI
 * @returns normalized value or `undefined`
 */
export const normalize = (v: any) => (v === null || v === '' ? undefined : v);
