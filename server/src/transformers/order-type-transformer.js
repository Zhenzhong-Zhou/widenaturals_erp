const { cleanObject } = require('../utils/object-utils');
const { transformPageResult } = require('../utils/transformer-utils');
const { makeStatus } = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');

/**
 * Transforms a raw `order_types` SQL row into a clean, client-facing object.
 *
 * Responsibilities:
 * - Converts `snake_case` fields to `camelCase`.
 * - Converts `created_by_*` and `updated_by_*` into full name strings.
 * - Does **not** check permissions here — assumes filtering was already applied.
 * - Removes any `null` or `undefined` values using `cleanObject()`.
 *
 * @param {Object} row - Raw database row from the `order_types` table.
 * @returns {Object|null} A clean, transformed order type object or `null` if row is invalid.
 *
 * @example
 * transformOrderTypeRow({
 *   id: 'abc',
 *   name: 'Work Order',
 *   category: 'work',
 *   requires_payment: false,
 *   code: 'WO',
 *   created_by_firstname: 'John',
 *   created_by_lastname: 'Doe'
 * });
 * // => {
 * //   id: 'abc',
 * //   name: 'Work Order',
 * //   category: 'work',
 * //   requiresPayment: false,
 * //   code: 'WO',
 * //   createdBy: 'John Doe'
 * // }
 */
const transformOrderTypeRow = (row) => {
  if (!row) return null;

  const result = {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    requiresPayment: row.requires_payment,
    status: makeStatus(row),
    audit: compactAudit(makeAudit(row)),
  };

  return cleanObject(result);
};

/**
 * Applies transformation to a paginated list of order type records.
 *
 * Each row is transformed using `transformOrderTypeRow`.
 * This should be used after filtering rows based on user permissions.
 *
 * @param {Object} paginatedResult - Paginated query result containing `data` and `pagination`.
 * @returns {Promise<PaginatedResult<T>>}
 *
 * @example
 * const transformed = await transformPaginatedOrderTypes(filteredResult);
 */
const transformPaginatedOrderTypes = async (paginatedResult) => {
  return transformPageResult(paginatedResult, transformOrderTypeRow);
};

module.exports = {
  transformPaginatedOrderTypes,
};
