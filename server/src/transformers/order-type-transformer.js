const { getFullName } = require('../utils/name-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

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
    description: row.description,
    statusId: row.status_id,
    statusName: row.status_name,
    statusDate: row.status_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: getFullName(row.created_by_firstname, row.created_by_lastname),
    updatedBy: getFullName(row.updated_by_firstname, row.updated_by_lastname),
  };
  
  return cleanObject(result);
};

/**
 * Applies transformation to a paginated list of order type records.
 *
 * This function maps each row through `transformOrderTypeRow`.
 * Use this after filtering the rows by user permission.
 *
 * @param {Object} paginatedResult - Paginated result object with `data: Array<Object>`
 * @returns {Object} Transformed paginated result (e.g., with `data`, `totalCount`, etc.)
 *
 * @example
 * const transformed = transformPaginatedOrderTypes(filteredResult);
 */
const transformPaginatedOrderTypes = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, (row) => transformOrderTypeRow(row));
};

module.exports = {
  transformPaginatedOrderTypes,
};
