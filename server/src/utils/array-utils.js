/**
 * @file array-utils.js
 * @description Generic array manipulation utilities.
 *
 * Exports:
 *   - deduplicateByCompositeKey – deduplicates records by a composite key with optional merge
 *   - compact                   – removes null and undefined values from an array
 *   - uniq                      – removes duplicate primitive values from an array
 *   - uniqCompact               – removes duplicates and nulls in one pass
 *   - uniqUuids                 – normalises and deduplicates UUID strings
 *   - deduplicatePairs          – deduplicates objects by a computed key selector
 *   - normalizeToArray          – coerces a value to an array
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

/**
 * Deduplicates an array of records by a composite key derived from `keyFields`.
 *
 * On first encounter of a key the record is stored as-is.
 * On subsequent encounters:
 *   - If `mergeFn` is provided it is called with `(existing, duplicate)` to merge in-place.
 *   - If `mergeFn` is not provided a plain `Error` is thrown — callers must decide
 *     how to handle duplicates before reaching this utility.
 *
 * @param {Array<Object>}                              records    - Records to deduplicate.
 * @param {string[]}                                   keyFields  - Field names to build the composite key from.
 * @param {((existing: Object, duplicate: Object) => void)|null} [mergeFn=null] - Optional merge function.
 * @returns {Array<Object>} Deduplicated records.
 * @throws {Error} If a duplicate key is encountered without a `mergeFn`.
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
 * Removes `null` and `undefined` values from an array.
 *
 * Treats a `null` or `undefined` input as an empty array.
 *
 * @template T
 * @param {(T | null | undefined)[] | null | undefined} arr
 * @returns {T[]}
 */
const compact = (arr) =>
  (arr ?? []).filter((v) => v !== null && v !== undefined);

/**
 * Removes duplicate primitive values from an array preserving first occurrence.
 *
 * Treats a `null` or `undefined` input as an empty array.
 *
 * @template T
 * @param {T[] | null | undefined} arr
 * @returns {T[]}
 */
const uniq = (arr) => Array.from(new Set(arr ?? []));

/**
 * Removes duplicates and null/undefined values from an array in one pass.
 *
 * Equivalent to `uniq(compact(arr))` but avoids the intermediate array.
 *
 * @template T
 * @param {(T | null | undefined)[] | null | undefined} arr
 * @returns {T[]}
 */
const uniqCompact = (arr) => Array.from(new Set(compact(arr)));

/**
 * Normalises and deduplicates an array of UUID strings.
 *
 * Each value is coerced to a trimmed lowercase string before deduplication,
 * ensuring UUIDs differing only in case or whitespace are treated as equal.
 * Null and undefined values are filtered out before normalisation.
 *
 * @param {(string | null | undefined)[] | null | undefined} arr
 * @returns {string[]}
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
 * Deduplicates an array of objects by a computed key selector.
 *
 * When multiple items share the same key, the **last** occurrence wins
 * (Map constructor behaviour — later entries overwrite earlier ones).
 * Returns an empty array if the input is not a valid non-empty array.
 *
 * @template T
 * @param {T[]}               list        - Items to deduplicate.
 * @param {(item: T) => string} keySelector - Function that derives a string key from each item.
 * @returns {T[]}
 */
const deduplicatePairs = (list, keySelector) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  return Array.from(
    new Map(list.map((item) => [keySelector(item), item])).values()
  );
};

/**
 * Coerces a value into an array.
 *
 * - Arrays are returned as-is.
 * - `null` and `undefined` return an empty array.
 * - All other values are wrapped in a single-element array.
 *
 * @template T
 * @param {T | T[] | null | undefined} value
 * @returns {T[]}
 */
const normalizeToArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null)         return [];
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
