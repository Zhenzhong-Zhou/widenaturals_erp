/**
 * Removes all undefined, null, or empty string properties from an object.
 *
 * Useful for cleaning filter objects or API payloads before sending them to the backend.
 *
 * @template T
 * @param {T} obj - The object to clean
 * @returns {Partial<T>} - A new object with only defined, non-empty values
 */
export const cleanObject = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  ) as Partial<T>;
};
