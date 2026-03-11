/**
 * Transform database result rows into a minimal key-only response.
 *
 * This utility is commonly used after insert, update, or delete operations
 * where the API only needs to confirm which records were affected.
 *
 * Example:
 *
 * Input:
 * [
 *   { id: "uuid-1", name: "A" },
 *   { id: "uuid-2", name: "B" }
 * ]
 *
 * transformKeyOnlyResult(records, "id")
 *
 * Output:
 * [
 *   { id: "uuid-1" },
 *   { id: "uuid-2" }
 * ]
 *
 * @param {Array<Object>} records - Database query result rows
 * @param {string} [key='id'] - Field name to extract from each record
 * @returns {Array<Object>} Array of objects containing only the selected key
 */
const transformKeyOnlyResult = (records = [], key = 'id') => {
  // Guard against invalid inputs
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }
  
  return records.map((record) => ({
    // Dynamic property name allows reuse for different primary keys
    [key]: record[key]
  }));
};

/**
 * Transform database rows into an ID-only response.
 *
 * This is a convenience wrapper around `transformKeyOnlyResult`
 * for the most common case where the primary key column is `id`.
 *
 * Example:
 *
 * Input:
 * [
 *   { id: "uuid-1", name: "A" },
 *   { id: "uuid-2", name: "B" }
 * ]
 *
 * transformIdOnlyResult(records)
 *
 * Output:
 * [
 *   { id: "uuid-1" },
 *   { id: "uuid-2" }
 * ]
 *
 * @param {Array<Object>} records - Database query result rows
 * @returns {Array<{id: string}>} Minimal response payload
 */
const transformIdOnlyResult = (records = []) =>
  transformKeyOnlyResult(records, 'id');

module.exports = {
  transformIdOnlyResult,
  transformKeyOnlyResult
};
