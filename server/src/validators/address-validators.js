const Joi = require('joi');
const {
  validateEmail,
  validatePhoneNumber,
  safeString, allowedSortOrders
} = require('./general-validators');

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
  sortOrder: Joi.string().uppercase().valid(...allowedSortOrders).default('').label('Sort Order'),
  
  // Filters
  country: safeString('Country').allow('', null),
  city: safeString('City').allow('', null),
  region: safeString('Region').allow('', null),
  customerId: Joi.string().guid({ version: 'uuidv4' }).allow('', null),
  createdBy: Joi.string().guid({ version: 'uuidv4' }).allow('', null),
  updatedBy: Joi.string().guid({ version: 'uuidv4' }).allow('', null),
  keyword: Joi.string().max(100).allow('', null),
  createdAfter: Joi.date().iso().allow(null, ''),
  createdBefore: Joi.date().iso().allow(null, ''),
  updatedAfter: Joi.date().iso().allow(null, ''),
  updatedBefore: Joi.date().iso().allow(null, ''),
});

module.exports = {
  addressArraySchema,
  addressQuerySchema,
};
