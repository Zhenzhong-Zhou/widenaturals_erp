/**
 * Removes all `undefined`, `null`, or empty string properties from an object,
 * with optional support for excluding specific keys from the result.
 *
 * Useful for cleaning filter objects or API payloads before sending them to the backend.
 *
 * @template T
 * @param {T} obj - The object to clean.
 * @param {(keyof T)[]} [excludeKeys=[]] - Optional array of object keys to exclude from the cleaned result.
 * @returns {Partial<T>} A new object with only defined, non-empty values and without the excluded keys.
 */
export const cleanObject = <T extends object>(
  obj: T,
  excludeKeys: (keyof T)[] = []
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) =>
        !(excludeKeys as string[]).includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ''
    )
  ) as Partial<T>;
};

/**
 * Returns the first non-null, non-undefined value from a list of fallback options.
 *
 * Useful for displaying fallback values in the UI when multiple sources
 * might contain null or undefined values.
 *
 * @template T - The expected return type.
 * @param {...(T | null | undefined)[]} values - List of values to evaluate.
 * @returns {T | '—'} - The first valid value found, or `'—'` if all are null/undefined.
 *
 * @example
 * getFallbackValue(user.name, user.username, 'Anonymous'); // returns first non-null value
 *
 * @example
 * getFallbackValue(null, undefined); // returns '—'
 */
export const getFallbackValue = <T>(...values: (T | null | undefined)[]): T | '—' => {
  for (const value of values) {
    if (value !== null && value !== undefined) return value;
  }
  return '—';
};
