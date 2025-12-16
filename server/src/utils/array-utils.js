/**
 * @fileoverview
 * Shared array and collection utilities.
 * Contains pure helper functions for deduplication, merging, and normalization.
 * All functions here must remain side-effect-free and framework-agnostic.
 */

/**
 * Deduplicates an array of records by a composite key formed from specified fields.
 * Allows merging logic to be applied to duplicate via an optional mergeFn.
 *
 * @param {Array<Object>} records - Array of objects to deduplicate.
 * @param {string[]} keyFields - List of field names to construct the composite key.
 * @param {Function|null} mergeFn - Optional function to merge two records with the same key.
 *        Receives (existingRecord, newRecord) as arguments and should mutate the existing one.
 *
 * @returns {Array<Object>} - Deduplicated array of records.
 *
 * @example
 * const result = deduplicateByCompositeKey(records, ['location_id', 'batch_id'], (a, b) => {
 *   a.location_quantity += b.location_quantity ?? 0;
 * });
 */
const deduplicateByCompositeKey = (records, keyFields = [], mergeFn = null) => {
  const map = new Map();

  for (const r of records) {
    const key = keyFields.map((k) => r[k]).join('::');
    if (!map.has(key)) {
      map.set(key, { ...r });
    } else if (mergeFn) {
      mergeFn(map.get(key), r);
    } else {
      throw new Error(`Duplicate key encountered without mergeFn: ${key}`);
    }
  }

  return Array.from(map.values());
};

/**
 * Remove only null/undefined from an array.
 */
const compact = (arr) =>
  (arr ?? []).filter((v) => v !== null && v !== undefined);

/**
 * Unique while preserving order.
 */
const uniq = (arr) => Array.from(new Set(arr ?? []));

/**
 * Compact + unique (common case).
 */
const uniqCompact = (arr) => Array.from(new Set(compact(arr)));

/**
 * UUID-friendly: trim, lowercase, drop null/undefined, then unique.
 */
const uniqUuids = (arr) =>
  Array.from(
    new Set(
      (arr ?? [])
        .filter((v) => v !== null && v !== undefined)
        .map((s) => String(s).trim().toLowerCase())
    )
  );

/**
 * @function
 * @description
 * Deduplicates an array of pair-like objects based on a composite key
 * (e.g., brandCode + categoryCode).
 *
 * Returns a new array containing only one entry per unique key.
 *
 * @template T
 * @param {Array<T>} list - Input array of objects to deduplicate.
 * @param {(item: T) => string} keySelector - Function that returns a unique key string for each item.
 * @returns {Array<T>} Deduplicated array of objects.
 *
 * @example
 * const pairs = [
 *   { brandCode: 'CH', categoryCode: 'HN' },
 *   { brandCode: 'CH', categoryCode: 'HN' },
 *   { brandCode: 'PG', categoryCode: 'NM' },
 * ];
 *
 * const uniquePairs = deduplicatePairs(pairs, (p) => `${p.brandCode}-${p.categoryCode}`);
 * // → [{ brandCode: 'CH', categoryCode: 'HN' }, { brandCode: 'PG', categoryCode: 'NM' }]
 */
const deduplicatePairs = (list, keySelector) => {
  if (!Array.isArray(list) || list.length === 0) return [];

  // Use a Map for O(1) lookups and maintain last occurrence of each unique key
  return Array.from(
    new Map(list.map((item) => [keySelector(item), item])).values()
  );
};

/**
 * Normalize an unknown input into a safe array.
 *
 * This utility is designed for untrusted inputs (e.g. HTTP request
 * parameters, body fields, or middleware-injected values) that may be:
 *
 * - an array
 * - a single value
 * - null / undefined
 *
 * It guarantees the return value is always an array, preventing
 * type confusion and unsafe `.length` or iteration access.
 *
 * @template T
 * @param {T | T[] | null | undefined} value
 *   The input value to normalize.
 *
 * @returns {T[]}
 *   - Returns the original array if already an array
 *   - Wraps a single value into an array
 *   - Returns an empty array for null/undefined
 *
 * @example
 * normalizeToArray('a');            // ['a']
 * normalizeToArray(['a', 'b']);     // ['a', 'b']
 * normalizeToArray(undefined);      // []
 * normalizeToArray(null);           // []
 */
const normalizeToArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};

module.exports = {
  deduplicateByCompositeKey,
  compact,
  uniq,
  uniqCompact,
  uniqUuids,
  deduplicatePairs,
  normalizeToArray,
};
