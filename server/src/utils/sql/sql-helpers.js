/**
 * Safely computes the minimum UUID value for a given column using text casting.
 *
 * PostgreSQL does not support MIN() directly on UUIDs, so this helper casts the UUID
 * to text for aggregation and then casts the result back to UUID.
 *
 * @param {string} tableAlias - The SQL alias for the table (e.g., 's' or 'p').
 * @param {string} column - The name of the UUID column (e.g., 'status_id').
 * @param {string} alias - The desired alias for the resulting field (e.g., 'sku_status_id').
 * @returns {string} A SQL-safe string for use in SELECT queries: MIN(alias.column::text)::uuid AS alias
 *
 * @example
 * // Usage in SELECT fields
 * const field = minUuid('s', 'status_id', 'sku_status_id');
 * // Result: "MIN(s.status_id::text)::uuid AS sku_status_id"
 */
const minUuid = (tableAlias, column, alias) =>
  `MIN(${tableAlias}.${column}::text)::uuid AS ${alias}`;

module.exports = {
  minUuid,
};
