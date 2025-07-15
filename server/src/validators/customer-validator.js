const Joi = require('joi');
const {
  validateEmail,
  validatePhoneNumber,
  validateString,
  createBooleanFlag,
  paginationSchema,
  createSortSchema,
  validateOptionalUUID,
  validateKeyword,
  createArraySchema,
  createdDateRangeSchema,
  statusDateRangeSchema,
} = require('./general-validators');

/**
 * Joi schema for customer validation.
 */
const customerSchema = Joi.object({
  firstname: validateString('Firstname', 2, 50),
  lastname: validateString('Lastname', 2, 50),
  email: validateEmail,
  phone_number: validatePhoneNumber,
  note: Joi.string().max(500).allow('').optional(),
});

/**
 * Joi schema for validating an array of customers.
 */
const customerArraySchema = createArraySchema(customerSchema, 1, 'Customer list');

/**
 * Joi schema for base customer filtering fields.
 *
 * These fields are commonly used across customer-related list or search endpoints.
 * Includes support for basic filters like a region, country, and metadata such as creator or keyword.
 *
 * - `region`: Optional string representing a region filter (e.g., 'North America')
 * - `country`: Optional string representing a country code or name
 * - `createdBy`: Optional UUID of the user who created the customer
 * - `keyword`: Optional string used for searching by name, email, etc.
 * - `onlyWithAddress`: Optional boolean (truthy/falsy) indicating if only customers with addresses should be included
 *
 * Typically combined with pagination, sorting, and date filters using `.concat(...)`.
 *
 * @type {Joi.ObjectSchema}
 */
const baseCustomerFields = Joi.object({
  region: Joi.string().optional().allow(null),
  country: Joi.string().optional().allow(null),
  createdBy: validateOptionalUUID('Created By'),
  keyword: validateKeyword('Customer keyword'),
  onlyWithAddress: createBooleanFlag('onlyWithAddress'),
});

/**
 * Joi schema for validating customer list query parameters.
 *
 * This schema supports:
 * - Pagination (page, limit)
 * - Sorting (sortBy, sortOrder) — sortBy is logical and mapped in the backend
 * - Date range filtering (createdAfter, createdBefore, statusDateAfter, statusDateBefore)
 * - Basic customer filters (region, country, createdBy, keyword, onlyWithAddress)
 *
 * This schema is composed of reusable base validators:
 * - `paginationSchema` (page, limit)
 * - `createSortSchema('created_at')` (sortBy, sortOrder)
 * - `dateRangeSchema` (date-based filters)
 * - `baseCustomerFields` (domain-specific filters)
 *
 * @example Query Parameters
 * ?page=2&limit=20&sortBy=createdAt&sortOrder=DESC&region=NA&createdAfter=2024-01-01
 *
 * @type {Joi.ObjectSchema}
 */
const customerFilterSchema = paginationSchema
  .concat(createSortSchema('created_at'))
  .concat(createdDateRangeSchema)
  .concat(statusDateRangeSchema)
  .concat(baseCustomerFields);

module.exports = {
  customerArraySchema,
  customerFilterSchema,
};
