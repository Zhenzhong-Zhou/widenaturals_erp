/**
 * @file id-result-transformer.js
 * @description Utility transformers for extracting a single key from DB result rows.
 *
 * Exports:
 *   - transformKeyOnlyResult – extracts a named key from each record in an array
 *   - transformIdOnlyResult  – shorthand for extracting `id` from each record
 *
 * Distinct from `transformRows` / `transformPageResult` — those handle full row
 * reshaping. These handle the narrow case of returning only a single field per row,
 * typically used for returning inserted/updated record IDs to callers.
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

/**
 * Extracts a single named key from each record in an array.
 *
 * Returns an empty array if the input is not a valid non-empty array.
 * Uses a computed property name so the output key matches the extracted key.
 *
 * @param {Array<Object>} [records=[]] - Array of DB result rows.
 * @param {string}        [key='id']  - The property name to extract from each row.
 * @returns {Array<{ [key: string]: unknown }>}
 *
 * @example
 * transformKeyOnlyResult([{ id: '1', name: 'foo' }], 'id')
 * // → [{ id: '1' }]
 */
const transformKeyOnlyResult = (records = [], key = 'id') => {
  if (!Array.isArray(records) || records.length === 0) return [];
  return records.map((record) => ({ [key]: record[key] }));
};

/**
 * Extracts only the `id` field from each record in an array.
 *
 * Shorthand for `transformKeyOnlyResult(records, 'id')`.
 * Typically used to return inserted or updated record IDs to service callers.
 *
 * @param {Array<Object>} [records=[]] - Array of DB result rows.
 * @returns {Array<{ id: unknown }>}
 *
 * @example
 * transformIdOnlyResult([{ id: 'abc', name: 'foo' }])
 * // → [{ id: 'abc' }]
 */
const transformIdOnlyResult = (records = []) =>
  transformKeyOnlyResult(records, 'id');

module.exports = {
  transformKeyOnlyResult,
  transformIdOnlyResult,
};
