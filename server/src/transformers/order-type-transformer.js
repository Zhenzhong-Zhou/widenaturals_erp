const { getFullName } = require('../utils/name-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');
const { canViewOrderTypeCode } = require('../business/order-type-business');

/**
 * Transforms a raw `order_types` SQL row into a clean, client-facing object.
 *
 * This function:
 * - Renames and formats snake_case fields to camelCase.
 * - Combines first and last name fields into full names.
 * - Conditionally includes `code` if the requesting user has permission.
 * - Removes any null or undefined properties using `cleanObject`.
 *
 * @param {Object} row - Raw database row from the `order_types` SQL query.
 * @param {Object} user - The user requesting the data (used to check field-level access).
 * @returns {Object|null} A clean, transformed order type object or null if input is invalid.
 *
 * @example
 * transformOrderTypeRow({
 *   id: 'abc',
 *   name: 'Sales Order',
 *   category: 'sales',
 *   requires_payment: true,
 *   created_by_firstname: 'John',
 *   created_by_lastname: 'Doe',
 *   ...
 * }, currentUser);
 * // => {
 * //   id: 'abc',
 * //   name: 'Sales Order',
 * //   category: 'sales',
 * //   requiresPayment: true,
 * //   createdBy: 'John Doe',
 * //   ...
 * // }
 */
const transformOrderTypeRow = async (row, user) => {
  if (!row) return null;
  
  const result = {
    id: row.id,
    name: row.name,
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
  
  if (await canViewOrderTypeCode(user)) {
    result.code = row.code;
  }
  
  return cleanObject(result);
};

/**
 * Applies transformation to a paginated list of order types.
 * Conditionally includes fields like `code` based on user permission.
 *
 * @param {Object} paginatedResult - Raw-paginated query result.
 * @param {Object} user - The user requesting the data.
 * @returns {Object} Transformed result with pagination or loadMore structure.
 */
const transformPaginatedOrderTypes = (paginatedResult, user) => {
  return transformPaginatedResult(paginatedResult, (row) => transformOrderTypeRow(row, user));
};

module.exports = {
  transformPaginatedOrderTypes,
};
