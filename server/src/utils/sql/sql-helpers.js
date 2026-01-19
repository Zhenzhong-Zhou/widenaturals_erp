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

/**
 * @function
 * @description
 * Safely appends a case-insensitive (ILIKE) filter to a SQL WHERE clause builder.
 *
 * This helper:
 *  - Enforces consistent ILIKE syntax across all filter builders
 *  - Prevents duplicated logic (DRY)
 *  - Safely increments parameter placeholders (`$1`, `$2`, ...)
 *  - Skips empty/undefined/null values automatically
 *
 * @param {string[]} conditions
 *   Mutable array of SQL condition strings (e.g., "p.name ILIKE $1").
 *
 * @param {Array<*>} params
 *   Mutable array of parameter values corresponding to conditions.
 *
 * @param {number} idx
 *   Current parameter placeholder index. Will be incremented if a filter is applied.
 *
 * @param {string|undefined|null} value
 *   The raw filter input. If falsy, no condition is added.
 *
 * @param {string} field
 *   Fully-qualified SQL column name (e.g., "p.name", "s.market_region").
 *
 * @returns {number}
 *   The next available SQL parameter index.
 *
 * @example
 *   let idx = 1;
 *   idx = addIlikeFilter(conditions, params, idx, filters.brand, 'p.brand');
 *   // adds:  "p.brand ILIKE $1"
 *   // params: ["%CANAHERB%"]
 *   // idx -> 2
 *
 * @note
 *   - Automatically wraps the value with "%" wildcards.
 *   - Prevents SQL injection by always using parameterized values.
 *   - Use this only for STRING ILIKE filters.
 */
const addIlikeFilter = (conditions, params, idx, value, field) => {
  if (!value) return idx;

  conditions.push(`${field} ILIKE $${idx}`);
  params.push(`%${value}%`);

  return idx + 1;
};

/**
 * Add permission-aware keyword ILIKE conditions as a grouped OR clause.
 *
 * Responsibility:
 * - Append a single grouped `(field ILIKE $n OR ...)` condition
 * - Bind ONE SQL parameter for the keyword
 * - Fail closed when no searchable fields are permitted
 *
 * Behavior:
 * - Uses a single placeholder index for all OR conditions
 * - Pushes exactly ONE parameter to `params`
 * - Advances the parameter index by exactly ONE
 *
 * Fail-closed semantics:
 * - If `keyword` is falsy OR `fields` is empty,
 *   an impossible condition (`1 = 0`) is appended
 *   to guarantee zero results.
 *
 * IMPORTANT:
 * - This function MUTATES `conditions` and `params`
 * - This function OWNS placeholder index advancement
 * - Callers MUST NOT increment `idx` again
 *
 * @param {string[]} conditions
 *   Mutable array of SQL WHERE clause fragments
 *
 * @param {any[]} params
 *   Mutable array of bound SQL parameters
 *
 * @param {number} idx
 *   Current positional parameter index
 *
 * @param {string} keyword
 *   Raw keyword value (will be wrapped in `%…%`)
 *
 * @param {string[]} fields
 *   List of SQL field expressions eligible for keyword search
 *
 * @returns {number}
 *   The next available SQL parameter index
 */
const addKeywordIlikeGroup = (conditions, params, idx, keyword, fields) => {
  if (!keyword || !Array.isArray(fields) || fields.length === 0) {
    // Fail closed: no searchable fields permitted
    conditions.push('1 = 0');
    return idx;
  }
  
  const orConditions = fields.map(
    (field) => `${field} ILIKE $${idx}`
  );
  
  conditions.push(`(${orConditions.join(' OR ')})`);
  params.push(`%${keyword}%`);
  
  return idx + 1;
};

module.exports = {
  minUuid,
  addIlikeFilter,
  addKeywordIlikeGroup,
};
