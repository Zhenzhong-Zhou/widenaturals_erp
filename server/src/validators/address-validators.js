const Joi = require('joi');
const { validateEmail, validatePhoneNumber, safeString } = require('./general-validators');

/**
 * Joi schema for address validation.
 */
const addressSchema = Joi.object({
  customer_id: Joi.string()
    .uuid({ version: 'uuidv4' })
    .allow(null)
    .optional(),
  full_name: Joi.string().max(150).trim().allow('', null),
  phone: validatePhoneNumber,
  email: validateEmail,
  label: Joi.string().max(50).trim().allow('', null),
  address_line1: Joi.string().max(255).trim().required().messages({
    'any.required': 'Address line 1 is required',
  }),
  address_line2: Joi.string().max(255).trim().allow('', null),
  city: Joi.string().max(100).trim().required().messages({
    'any.required': 'City is required',
  }),
  state: Joi.string().max(100).trim().allow('', null),
  postal_code: Joi.string().max(20).trim().required().messages({
    'any.required': 'Postal code is required',
  }),
  country: Joi.string().max(100).trim().default('Canada').required(),
  region: Joi.string().max(100).trim().allow('', null),
  note: Joi.string().max(500).trim().allow('', null),
});

/**
 * Joi schema for validating an array of addresses.
 */
const addressArraySchema = Joi.array().items(addressSchema).min(1).required();

/**
 * Allowed values for sortOrder in address queries.
 * Standard SQL sorting directions: ASC (ascending) or DESC (descending).
 */
const allowedSortOrders = ['ASC', 'DESC'];

/**
 * Joi schema for validating address query parameters (pagination, sorting, filters).
 *
 * Validates and normalizes query params used for listing/searching addresses, including
 * - Pagination (page, limit)
 * - Sorting (sortBy, sortOrder)
 * - Filters (region, country, city, customerId, createdBy, updatedBy, keyword, date ranges)
 *
 * Example valid query: * page=2&limit=20&sortBy=created_at&sortOrder=ASC&region=North&customerId=uuid...
 */
const addressQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().trim().default('created_at'),
  sortOrder: Joi.string().uppercase().valid(...allowedSortOrders).default('DESC'),
  country: safeString('Country'),
  city: safeString('City'),
  region: safeString('Region'),
  customerId: Joi.string().guid({ version: 'uuidv4' }),
  createdBy: Joi.string().guid({ version: 'uuidv4' }),
  updatedBy: Joi.string().guid({ version: 'uuidv4' }),
  keyword: Joi.string().max(100),
  createdAfter: Joi.date().iso(),
  createdBefore: Joi.date().iso(),
  updatedAfter: Joi.date().iso(),
  updatedBefore: Joi.date().iso(),
});

module.exports = {
  addressArraySchema,
  addressQuerySchema,
};
