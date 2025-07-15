const Joi = require('joi');
const {
  validateEmail,
  validatePhoneNumber,
  safeString,
  validateOptionalUUID,
  validateOptionalString,
  validateString,
  createArraySchema,
  validateKeyword,
  paginationSchema,
  createSortSchema,
  updatedDateRangeSchema,
  createdDateRangeSchema
} = require('./general-validators');

/**
 * Joi schema for validating a customer address.
 *
 * Includes fields for name, contact, address lines, region, and notes.
 * Supports optional fields and default values (e.g., country = Canada).
 *
 * Used for both individual address creation and bulk upload contexts.
 *
 * @type {Joi.ObjectSchema}
 */
const addressSchema = Joi.object({
  customer_id: validateOptionalUUID('Customer ID'),
  
  full_name: validateOptionalString('Full name', 150),
  
  phone: validatePhoneNumber,
  email: validateEmail,
  label: validateOptionalString('Label', 50),
  
  address_line1: validateString('Address line 1', 10, 255),
  address_line2: validateOptionalString('Address line 2', 255),
  
  city: validateString('City', 2, 100),
  state: validateOptionalString('State', 100),
  
  postal_code: validateString('Postal code', 3, 20),
  
  country: Joi.string().trim().max(100).default('Canada').required(),
  
  region: validateOptionalString('Region', 100),
  note: validateOptionalString('Note', 500),
});

/**
 * Joi schema for validating an array of addresses.
 */
const addressArraySchema = createArraySchema(addressSchema, 1, 'Address list');

/**
 * Joi schema for validating address-related filter fields.
 *
 * Used to filter address records based on country, city, region, associated customer, and metadata.
 *
 * Fields:
 * - `country` (string|null): Country name; trimmed; allows empty or null
 * - `city` (string|null): City name; trimmed; allows empty or null
 * - `region` (string|null): Region name; trimmed; allows empty or null
 * - `customerId` (UUID|string|null): Associated customer ID; must be a UUID; allows empty or null
 * - `createdBy` (UUID|string|null): ID of the user who created the address; allows empty or null
 * - `updatedBy` (UUID|string|null): ID of the user who last updated the address; allows empty or null
 * - `keyword` (string|null): Optional keyword for fuzzy search; trimmed; allows null
 *
 * @type {Joi.ObjectSchema}
 */
const addressFiltersSchema = Joi.object({
  country: safeString('Country').allow('', null),
  city: safeString('City').allow('', null),
  region: safeString('Region').allow('', null),
  customerId: validateOptionalUUID('Customer ID').allow('', null),
  createdBy: validateOptionalUUID('Created By').allow('', null),
  updatedBy: validateOptionalUUID('Updated By').allow('', null),
  keyword: validateKeyword('Keyword'),
});

/**
 * Joi schema for validating address query parameters.
 *
 * Combines multiple reusable schema fragments for modular validation:
 * - `paginationSchema`: Validates `page` and `limit` (min 1, max 100)
 * - `createSortSchema`: Validates `sortBy` and `sortOrder` (default: `created_at`, `DESC`)
 * - `createdDateRangeSchema`: Validates optional `createdAfter` and `createdBefore` ISO date filters
 * - `updatedDateRangeSchema`: Validates optional `updatedAfter` and `updatedBefore` ISO date filters
 * - `addressFiltersSchema`: Validates location and metadata fields like `country`, `city`, `region`,
 *    `customerId`, `createdBy`, `updatedBy`, and a generic `keyword` field
 *
 * This schema is used for GET /addresses queries and ensures normalized, safe input.
 *
 * Example usage:
 *   /addresses?page=1&limit=20&sortBy=created_at&sortOrder=ASC&country=Canada&keyword=Toronto
 *
 * @type {Joi.ObjectSchema}
 */
const addressQuerySchema = paginationSchema
  .concat(createSortSchema('created_at'))
  .concat(createdDateRangeSchema)
  .concat(updatedDateRangeSchema)
  .concat(addressFiltersSchema);

module.exports = {
  addressArraySchema,
  addressQuerySchema,
};
