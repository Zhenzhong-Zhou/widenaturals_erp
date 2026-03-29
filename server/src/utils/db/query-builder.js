/**
 * @file format-bulk-update-query.js
 * @description Builds a parameterised PostgreSQL bulk-update query using a VALUES list.
 *
 * Design:
 * - Uses FROM (VALUES ...) AS data(...) for multi-row updates in a single query
 * - All user-supplied values go through parameterised placeholders — never interpolated
 * - Table and column identifiers are quoted via `q()` to prevent SQL injection
 * - Composite keys are UUID-stride-split — not regex-split — for correctness with N where columns
 * - Immutable: input data is never mutated
 *
 * Dependencies:
 * - q(), qualify(), validateSqlIdentifiers() from ./sql-ident
 */

const { UUID_RE } = require('../id-utils');
const { q } = require('../sql-ident');
const { validateSqlIdentifiers } = require('./sql-validation');

/**
 * Splits a composite data key back into its individual UUID parts.
 *
 * Keys are constructed by the caller as UUIDs concatenated with a '-' separator:
 *   "<uuid1>-<uuid2>"  →  ["<uuid1>", "<uuid2>"]
 *
 * Each UUID is exactly 36 characters (32 hex + 4 dashes). The split walks
 * the string in 36-char strides to avoid ambiguity from the shared '-' character.
 *
 * @param {string} compositeKey
 * @param {number} expectedParts - Must equal `whereColumns.length`.
 * @returns {string[]}
 * @throws {RangeError} If the extracted UUID count does not match `expectedParts`.
 */
const splitCompositeKey = (compositeKey, expectedParts) => {
  const parts = [];
  let cursor = 0;
  
  while (cursor < compositeKey.length) {
    const segment = compositeKey.slice(cursor, cursor + 36);
    if (!UUID_RE.test(segment)) break;
    parts.push(segment);
    // Advance past the UUID and its trailing '-' separator (absent on the last part)
    cursor += parts.length < expectedParts ? 37 : 36;
  }
  
  if (parts.length !== expectedParts) {
    throw new RangeError(
      `Composite key "${compositeKey}" yielded ${parts.length} UUID(s), expected ${expectedParts}`
    );
  }
  
  return parts;
};

/**
 * Extracts ordered column values for one data row.
 *
 * Supports a single-column shorthand where the caller passes a scalar value
 * directly instead of wrapping it in an object.
 * Missing keys default to `null`.
 *
 * @param {string[]} columns
 * @param {Object|*} rowData - Column-keyed object, or a scalar for single-column updates.
 * @returns {Array<*>}
 */
const extractRowValues = (columns, rowData) => {
  // Single-column shorthand: caller passes the value directly, not wrapped in an object
  if (columns.length === 1 && (rowData === null || typeof rowData !== 'object')) {
    return [rowData];
  }
  return columns.map((col) => (rowData != null && col in rowData ? rowData[col] : null));
};

/**
 * Generates a parameterised PostgreSQL bulk-update query using a VALUES list.
 *
 * SQL shape produced:
 * ```sql
 * UPDATE "table"
 * SET "col" = data.col, ..., updated_at = NOW(), updated_by = $1
 * FROM (VALUES
 *   ($2::uuid, $3::uuid, $4::integer),
 *   ...
 * ) AS data(warehouse_id, inventory_id, reserved_quantity)
 * WHERE "table".warehouse_id = data.warehouse_id AND ...
 * RETURNING "table".id;
 * ```
 *
 * Note: quoted identifiers (via `q()`) are used in UPDATE, SET, and WHERE clauses.
 * Column names in the VALUES alias and `data.col` references are unquoted — PostgreSQL
 * resolves alias column names case-insensitively and does not require quoting there.
 *
 * @param {string}   table        - Target table name. Validated and quoted via `q()`.
 * @param {string[]} columns      - Columns to update (e.g. `['available_quantity', 'status']`).
 *                                  Each is validated via `validateSqlIdentifiers`.
 * @param {string[]} whereColumns - Columns used to match rows (e.g. `['warehouse_id', 'inventory_id']`).
 *                                  Must correspond 1:1 with UUID segments in each composite key.
 * @param {Object}   data         - Map of composite UUID key → row values.
 *                                  Key format: UUIDs joined by '-', one per `whereColumn`.
 *                                  Value: `{ [col]: value }`, or a scalar for single-column updates.
 * @param {string}   userId       - UUID of the acting user; bound to `updated_by` as `$1`.
 * @param {Object}   [columnTypes={}] - SQL cast type per column (e.g. `{ status: 'text' }`).
 *                                      Unspecified columns default to `'text'`.
 *
 * @returns {{ baseQuery: string, params: Array<*> } | null}
 *   `null` if `data` is empty; otherwise the parameterised query and its bound values.
 *
 * @throws {AppError}   If any identifier fails `q()` or `validateSqlIdentifiers` validation.
 * @throws {RangeError} If a composite key cannot be split into `whereColumns.length` UUIDs.
 *
 * @example
 * const result = formatBulkUpdateQuery(
 *   'warehouse_inventory',
 *   ['reserved_quantity', 'available_quantity'],
 *   ['warehouse_id', 'inventory_id'],
 *   {
 *     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': {
 *       reserved_quantity: 2,
 *       available_quantity: 74,
 *     },
 *   },
 *   'cccccccc-cccc-cccc-cccc-cccccccccccc',
 *   { reserved_quantity: 'integer', available_quantity: 'integer' }
 * );
 */
const formatBulkUpdateQuery = (
  table,
  columns,
  whereColumns,
  data,
  userId,
  columnTypes = {}
) => {
  if (!Object.keys(data).length) return null;
  
  // Validate and quote all identifiers before touching any data
  const quotedTable = q(table);
  columns.forEach((col) => validateSqlIdentifiers({ col, tableAlias: table, context: 'formatBulkUpdateQuery/columns' }));
  whereColumns.forEach((col) => validateSqlIdentifiers({ col, tableAlias: table, context: 'formatBulkUpdateQuery/whereColumns' }));
  
  // $1 is always userId; data values start at $2
  const params = [userId];
  let indexCounter = 2;
  
  const valuesSql = Object.entries(data).map(([key, rowData]) => {
    const keyParts = splitCompositeKey(key, whereColumns.length);
    const rowValues = extractRowValues(columns, rowData);
    
    // Collect all values for this row: WHERE-key UUIDs first, then SET-column values
    const allValues = [...keyParts, ...rowValues];
    params.push(...allValues);
    
    // Build typed placeholders: WHERE cols always cast to uuid, SET cols to their declared type
    const typedPlaceholders = [
      ...keyParts.map(() => `$${indexCounter++}::uuid`),
      ...columns.map((col) => `$${indexCounter++}::${columnTypes[col] ?? 'text'}`),
    ];
    
    return `(${typedPlaceholders.join(', ')})`;
  });
  
  // Build SET clause: quoted column on the left, unquoted alias reference on the right
  const setClauses = columns
    .map((col) => `${q(col)} = data.${col}`)
    .join(',\n        ');
  
  // Alias column list for the VALUES CTE — unquoted, PostgreSQL resolves these by alias name
  const aliasColumns = [...whereColumns, ...columns].join(', ');
  
  // WHERE clause: qualified quoted column = unquoted alias reference
  const whereClause = whereColumns
    .map((col) => `${quotedTable}.${q(col)} = data.${col}`)
    .join(' AND ');
  
  const baseQuery = `
    UPDATE ${quotedTable}
    SET ${setClauses},
        updated_at = NOW(),
        updated_by = $1
    FROM (VALUES
      ${valuesSql.join(',\n      ')}
    ) AS data(${aliasColumns})
    WHERE ${whereClause}
    RETURNING ${quotedTable}.id;
  `.trim();
  
  return { baseQuery, params };
};

module.exports = {
  formatBulkUpdateQuery
};
