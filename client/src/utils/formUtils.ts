/**
 * Normalizes a date input value to ensure it's a valid `string` or `Date`.
 *
 * This function is useful when working with form libraries (like React Hook Form)
 * that might store uncontrolled or inconsistent types for date values (e.g., `undefined`, `null`, boolean).
 *
 * @param value - The value to normalize (can be any type).
 * @returns The original value if it's a `string` or `Date`; otherwise, `null`.
 */
export const normalizeDateValue = (value: unknown): string | Date | null => {
  return typeof value === 'string' || value instanceof Date ? value : null;
};
