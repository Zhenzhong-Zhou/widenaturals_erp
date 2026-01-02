/**
 * @typedef {Object} NormalizedStatus
 * @property {string|null} id
 * @property {string|null} name
 * @property {string|null} date
 */

/**
 * Normalize status-related fields from a data row into a consistent object shape.
 *
 * Purpose:
 * - Provide a stable `{ id, name, date }` status object regardless of
 *   underlying column naming conventions.
 * - Centralize status extraction logic for reuse across transformers.
 *
 * Characteristics:
 * - Stateless and side effect free
 * - Does NOT enforce business rules or validate status values
 * - Safely handles missing or partial data
 *
 * @param {Object} row - Source record containing status fields
 * @param {Object} [map] - Optional column mapping overrides
 * @param {string} [map.id='status_id'] - Column name for status identifier
 * @param {string} [map.name='status_name'] - Column name for status label
 * @param {string} [map.date='status_date'] - Column name for status timestamp
 *
 * @returns {{ id: string|null, name: string|null, date: string|null } | null}
 */
const makeStatus = (
  row,
  map = {
    id: 'status_id',
    name: 'status_name',
    date: 'status_date',
  }
) => {
  if (!row) return null;

  return {
    id: row[map.id] ?? null,
    name: row[map.name] ?? null,
    date: row[map.date] ?? null,
  };
};

module.exports = {
  makeStatus,
};
