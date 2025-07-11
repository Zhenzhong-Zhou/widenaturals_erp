const Joi = require('joi');
const { validateEmail, validatePhoneNumber, allowedSortOrders } = require('./general-validators');

/**
 * Joi schema for customer validation.
 */
const customerSchema = Joi.object({
  firstname: Joi.string().min(2).max(50).trim().required().messages({
    'string.min': 'Firstname must be at least 2 characters long',
    'string.max': 'Firstname must not exceed 50 characters',
    'any.required': 'Firstname is required',
  }),

  lastname: Joi.string().min(2).max(50).trim().required().messages({
    'string.min': 'Lastname must be at least 2 characters long',
    'string.max': 'Lastname must not exceed 50 characters',
    'any.required': 'Lastname is required',
  }),

  email: validateEmail,

  phone_number: validatePhoneNumber,
  
  region: Joi.string().max(100).allow('', null),

  note: Joi.string().max(500).allow('').optional(),
});

/**
 * Joi schema for validating an array of customers.
 */
const customerArraySchema = Joi.array().items(customerSchema).min(1).required();

/**
 * Joi schema for validating customer list query parameters.
 *
 * This schema supports pagination, sorting, and advanced filtering.
 * It includes:
 * - Pagination: page number and result limit
 * - Sorting: by field and sort order
 * - Filtering: by region, country, creator, keyword, created/updated dates, and address presence
 *
 * @property {number} page - Page number (min 1, default: 1)
 * @property {number} limit - Items per page (min 1, max 100, default: 10)
 * @property {string} sortBy - Field to sort by (default: 'created_at')
 * @property {string} sortOrder - Sort direction ('ASC' or 'DESC', default: 'DESC')
 * @property {string|null} region - Optional region filter
 * @property {string|null} country - Optional country filter
 * @property {string|null} createdBy - Optional UUID of the creator
 * @property {string|null} keyword - Optional keyword (name, email, etc.)
 * @property {string|null} createdAfter - ISO date string for filtering created after
 * @property {string|null} createdBefore - ISO date string for filtering created before
 * @property {string|null} statusDateAfter - ISO date string for filtering status change after
 * @property {string|null} statusDateBefore - ISO date string for filtering status change before
 * @property {boolean|null} onlyWithAddress - Whether to include only customers with addresses (accepts 'true'/'false' as strings)
 */
const customerFilterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().trim().default('created_at'),
  sortOrder: Joi.string().uppercase().valid(...allowedSortOrders).default('DESC'),
  
  region: Joi.string().optional().allow(null),
  country: Joi.string().optional().allow(null),
  createdBy: Joi.string().uuid().optional().allow(null),
  keyword: Joi.string().trim().optional().allow(null),
  createdAfter: Joi.date().iso().optional().allow(null),
  createdBefore: Joi.date().iso().optional().allow(null),
  statusDateAfter: Joi.date().iso().optional().allow(null),
  statusDateBefore: Joi.date().iso().optional().allow(null),
  
  onlyWithAddress: Joi.boolean().truthy('true').falsy('false').optional().allow(null),
});

module.exports = {
  customerArraySchema,
  customerFilterSchema,
};
