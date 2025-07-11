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
const { allowedSortOrders, safeString } = require('./general-validators');

/**
 * Joi schema for validating order type query parameters.
 *
 * Fields:
 * - page: Integer, page number (default: 1)
 * - limit: Integer, records per page (default: 10, max: 100)
 * - sortBy: Field to sort by (default: 'name')
 * - sortOrder: ASC or DESC (default: ASC)
 * - name: Partial match on order type name
 * - code: Partial match on internal code (internal use only)
 * - category: Filter by category (e.g., 'sales', 'purchase')
 * - statusId: UUID of status (optional)
 * - requiresPayment: Boolean filter (optional)
 * - createdBy / updatedBy: UUIDs of user who created/updated the record
 * - keyword: Fuzzy match across name, code, and description
 * - createdAfter / createdBefore: ISO date range for creation
 * - updatedAfter / updatedBefore: ISO date range for updates
 */
const orderTypeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  
  sortBy: Joi.string().trim().default('name'),
  sortOrder: Joi.string().uppercase().valid(...allowedSortOrders).default('ASC').label('Sort Order'),
  
  // Filters
  name: safeString('Name').allow('', null),
  code:safeString('Code').allow('', null).optional(),
  category: safeString('Category').allow('', null),
  statusId: Joi.string().guid({ version: 'uuidv4' }).allow('', null).optional(),
  requiresPayment: Joi.boolean().truthy('true').falsy('false').optional(),
  
  createdBy:Joi.string().guid({ version: 'uuidv4' }).allow('', null).optional(),
  updatedBy: Joi.string().guid({ version: 'uuidv4' }).allow('', null).optional(),
  keyword: Joi.string().max(100).allow('', null),
  
  createdAfter: Joi.date().iso().allow('', null).optional(),
  createdBefore: Joi.date().iso().allow('', null).optional(),
  updatedAfter: Joi.date().iso().allow('', null).optional(),
  updatedBefore: Joi.date().iso().allow('', null).optional(),
});

module.exports = { orderTypeQuerySchema };
