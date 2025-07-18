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

module.exports = {
  deduplicateByCompositeKey,
};
