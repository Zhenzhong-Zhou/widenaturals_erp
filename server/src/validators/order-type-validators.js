/**
 * @fileoverview
 * Joi validation schema for handling query parameters related to order type operations.
 *
 * This module supports validation and normalization of query strings for use in:
 * - Listing and searching order types (e.g., in paginated endpoints)
 * - Filtering by attributes like name, code, category, status, and timestamps
 * - Enforcing pagination and sorting constraints
 *
 * Used by the route controller for GET /order-types.
 *
 * Example usage: * page=2&limit=20&sortBy=name&sortOrder=ASC&category=sales&requiresPayment=true
 */

const Joi = require('joi');
const {
  safeString,
  validateOptionalUUID,
  validateKeyword,
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema,
  updatedDateRangeSchema,
  createBooleanFlag,
} = require('./general-validators');

/**
 * Joi schema for filtering order types.
 *
 * Includes optional filters for:
 * - name, code, category: Partial string matches
 * - statusId: UUID of associated status
 * - requiresPayment: Boolean flag (true/false)
 * - createdBy / updatedBy: UUIDs of the creating or updating user
 * - keyword: General fuzzy match across fields
 *
 * All fields are optional and support null or empty string where applicable.
 *
 * Typically used for query validation in paginated list endpoints.
 */
const orderTypeFiltersSchema = Joi.object({
  name: safeString('Name').allow('', null),
  code: safeString('Code').allow('', null),
  category: safeString('Category').allow('', null),
  statusId: validateOptionalUUID('Status ID'),
  requiresPayment: createBooleanFlag('Requires Payment'),
  createdBy: validateOptionalUUID('Created By'),
  updatedBy: validateOptionalUUID('Updated By'),
  keyword: validateKeyword('Keyword'),
});

/**
 * Joi schema for validating order type query parameters.
 *
 * Validates and normalizes:
 * - Pagination (page, limit)
 * - Sorting (sortBy, sortOrder)
 * - Filters (name, code, category, statusId, requiresPayment, user IDs, keyword)
 * - Date ranges (createdAfter/Before, updatedAfter/Before)
 *
 * Example: `?page=1&limit=10&sortBy=name&sortOrder=DESC&keyword=sale`
 */
const orderTypeQuerySchema = paginationSchema
  .concat(createSortSchema('name')) // default sort by name
  .concat(orderTypeFiltersSchema)
  .concat(createdDateRangeSchema)
  .concat(updatedDateRangeSchema);

module.exports = {
  orderTypeQuerySchema,
};
