/**
 * Removes all keys from an object whose values are `null` or `undefined`.
 *
 * This is useful for cleaning up transformed data structures before sending
 * them to the client or storing them, especially when you want to omit
 * irrelevant or empty fields based on type (e.g., product vs. material).
 *
 * @param {Object} obj - The object to clean.
 * @returns {Object} A new object with only defined, non-null values.
 */
const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined)
  );
};

/**
 * Normalizes a value into an array of trimmed strings.
 * Accepts comma-separated strings or arrays. Returns undefined if input is falsy.
 *
 * @param {string|string[]|undefined|null} value
 * @returns {string[]|undefined}
 */
const normalizeParamArray = (value) => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return value.split(',').map((v) => v.trim()).filter(Boolean);
};

module.exports = {
  cleanObject,
  normalizeParamArray,
};
