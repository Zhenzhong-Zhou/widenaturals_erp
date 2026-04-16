/**
 * @file object-utils.js
 * @description General-purpose object transformation utilities.
 *
 * Three levels of cleaning are provided, each suited to a different use case:
 *
 *   - cleanObject       — shallow strip of null/undefined values. Used in most
 *                          transformers where the object shape is flat and
 *                          intentional (e.g. status objects, customer summaries).
 *
 *   - deepCleanObject   — recursive strip of null/undefined values and empty
 *                          plain objects. Does NOT recurse into arrays.
 *
 *   - cleanOrNull       — deep-cleans an object and collapses to null when the
 *                          result is empty. Used for conditional nested structures
 *                          where an entire subtree should vanish when all leaf
 *                          values are null (e.g. productInfo / packagingInfo in
 *                          warehouse inventory).
 *
 * All functions are pure — inputs are never mutated.
 *
 * Exports:
 *   - cleanObject
 *   - deepCleanObject
 *   - cleanOrNull
 */

'use strict';

/**
 * Remove keys whose values are `null` or `undefined` from an object.
 *
 * This utility preserves the original object shape and key types,
 * returning a shallow copy with only defined values.
 *
 * Notes:
 * - Only top-level properties are inspected (no deep traversal).
 * - Keys with falsy values such as `0`, `false`, or `''` are preserved.
 * - The returned object has the same type as the input object.
 *
 * @template T
 * @param {T} obj - The source object.
 * @returns {T} A new object with `null` and `undefined` keys removed.
 */
const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined)
  );
};

/**
 * Checks whether a value is a plain object (not null, not an array,
 * not a Date or other built-in).
 *
 * Internal helper — not exported.
 *
 * @param {*} value
 * @returns {boolean}
 */
const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

/**
 * Recursively removes null, undefined, and empty plain-object values.
 *
 * Does NOT recurse into arrays — array elements pass through as-is.
 * Returns a new object; the input is not mutated.
 *
 * @param {Object} obj
 * @returns {Object}
 */
const deepCleanObject = (obj) => {
  if (!isPlainObject(obj)) return obj;
  
  const cleanedEntries = Object.entries(obj)
    .map(([key, value]) => [
      key,
      isPlainObject(value) ? deepCleanObject(value) : value,
    ])
    .filter(([_, value]) => {
      if (value === null || value === undefined) return false;
      if (isPlainObject(value) && Object.keys(value).length === 0) return false;
      return true;
    });
  
  return Object.fromEntries(cleanedEntries);
};

/**
 * Deep-cleans an object and returns null if the result is empty.
 *
 * Useful for conditional nested structures where an entire subtree should
 * collapse to null when all leaf values are null (e.g., productInfo when
 * batchType is packaging_material).
 *
 * @param {Object} obj
 * @returns {Object|null}
 */
const cleanOrNull = (obj) => {
  const cleaned = deepCleanObject(obj);
  return Object.keys(cleaned).length > 0 ? cleaned : null;
};

module.exports = {
  cleanObject,
  deepCleanObject,
  cleanOrNull,
};
