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
