const Joi = require('joi');
const { DEFAULT_MIN_LENGTH } = require('../utils/constants/general/min-limits');
const { DEFAULT_MAX_LENGTH } = require('../utils/constants/general/max-limits');

/**
 * Validates that the input is a valid email address.
 */
const validateEmail = Joi.string().email().required().messages({
  'string.email': 'Invalid email format',
  'any.required': 'Email is required',
});

/**
 * Returns a Joi schema that validates a required UUID string.
 *
 * This helper allows dynamic labeling of the field name for cleaner,
 * reusable, and context-aware error messages.
 *
 * Commonly used to validate UUIDs such as
 * - customerId
 * - userId
 * - orderId
 *
 * @param {string} [fieldName='id'] - The name of the field to label in validation messages.
 * @returns {Joi.StringSchema} Joi validation schema for a required UUID string.
 *
 * @example
 * const schema = validateUUID('customerId');
 * const { error } = schema.validate('abc123'); // returns validation error
 */
const validateUUID = (fieldName = 'id') =>
  Joi.string().uuid().required().label(fieldName).messages({
    'string.guid': '{{#label}} must be a valid UUID',
    'any.required': '{{#label}} is required',
    'string.empty': '{{#label}} cannot be empty',
  });

/**
 * Returns a Joi schema for an optional UUID string.
 *
 * - Accepts UUID format (any version)
 * - Allows `null` and empty strings
 * - Attaches a custom label for better error messages
 * - Provides meaningful validation messages for user feedback
 *
 * @param {string} [fieldName='id'] - Label name used in validation messages
 * @returns {Joi.StringSchema} Joi schema for optional UUID validation
 *
 * @example
 * const schema = Joi.object({
 *   orderId: validateOptionalUUID('Order ID')
 * });
 */
const validateOptionalUUID = (fieldName = 'id') =>
  Joi.string().uuid().optional().allow(null).disallow('').label(fieldName).messages({
    'string.guid': '{{#label}} must be a valid UUID',
    'any.invalid': '{{#label}} cannot be an empty string',
  });

/**
 * Returns a Joi schema for validating either a string or array of UUIDs (v4).
 * Useful for flexible query filters that accept comma-separated or array input.
 */
const validateUUIDArray = (fieldName = 'IDs') =>
  Joi.alternatives()
    .try(
      Joi.string(),
      Joi.array().items(Joi.string().uuid({ version: 'uuidv4' }))
    )
    .optional()
    .label(fieldName);

/**
 * Returns a Joi schema for pagination integers with optional default.
 */
const validatePositiveInteger = (defaultValue = undefined) =>
  Joi.number().integer().min(1).default(defaultValue);

/**
 * Creates a reusable Joi string validator with trimming, length constraints, and custom error messages.
 *
 * This validator:
 * - Ensures the field is non-empty string
 * - Trims leading/trailing whitespace
 * - Enforces minimum and maximum length
 * - Provides custom error messages using the given `fieldName`
 *
 * Intended for required fields like names, titles, labels, etc.
 *
 * @param {string} fieldName - The display name of the field (used in error messages).
 * @param {number} [minLength=DEFAULT_MIN_LENGTH] - Minimum number of characters required.
 * @param {number} [maxLength=DEFAULT_MAX_LENGTH] - Maximum number of characters allowed.
 * @returns {Joi.StringSchema} Joi schema for a required trimmed string with custom messages.
 */
const validateString = (
  fieldName,
  minLength = DEFAULT_MIN_LENGTH,
  maxLength = DEFAULT_MAX_LENGTH
) =>
  Joi.string()
    .trim()
    .min(minLength)
    .max(maxLength)
    .required()
    .messages({
      'string.base': `${fieldName} must be a string`,
      'string.min': `${fieldName} must be at least ${minLength} characters`,
      'string.max': `${fieldName} must be at most ${maxLength} characters`,
      'any.required': `${fieldName} is required`,
    });

/**
 * Validates an optional trimmed string with max length and optional label.
 */
const validateOptionalString = (label = '', max = 255) =>
  Joi.string().trim().max(max).allow('', null).label(label);

/**
 * Joi schema to validate a phone number in E.164 international format.
 *
 * - Allows optional leading '+' (e.g., "+14155552671")
 * - Requires country code followed by 1 to 14 digits
 * - Does not allow spaces, dashes, or formatting characters
 *
 * Example of valid input: "+1234567890", "14155552671"
 *
 * @type {Joi.StringSchema}
 */
const validatePhoneNumber = Joi.string()
  .pattern(/^\+?[1-9]\d{1,14}$/) // Matches E.164 international format
  .messages({
    'string.pattern.base':
      'Phone number must be in international format (e.g., +1234567890)',
  });

/**
 * Reusable Joi validator for order numbers.
 */
const validateOrderNumber = Joi.string()
  .pattern(/^[A-Z]{2}-[A-Z]{2,}-\d{14}-[a-f0-9]{8}-[a-f0-9]{10}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid order number format.',
    'any.required': 'Order number is required.',
  });

/**
 * Reusable safe string validator for form or query inputs.
 *
 * Validates a trimmed string with optional or nullable value.
 * Accepts alphanumeric characters, spaces, and hyphens only.
 *
 * Intended for controlled inputs like city, country, region, label, etc.
 *
 * @param {string} label - Field name for error message context.
 * @param {number} [max=100] - Maximum character length allowed.
 * @returns {Joi.StringSchema} Joi schema enforcing format and safety constraints.
 */
const safeString = (label, max = 100) =>
  Joi.string()
    .trim()
    .max(max)
    .optional()
    .allow('', null)
    .pattern(/^[\w\s\-]+$/)
    .label(label)
    .messages({
      'string.pattern.base': `${label} contains invalid characters`,
    });

/**
 * Allowed values for sortOrder in address queries.
 * Standard SQL sorting directions: ASC (ascending) or DESC (descending).
 */
const allowedSortOrders = ['ASC', 'DESC', ''];

/**
 * Joi schema for basic pagination controls.
 *
 * - `page`: Page number must be an integer >= 1. Default to 1.
 * - `limit`: Number of items per page. Must be between 1 and 100. Defaults to 10.
 *
 * Commonly used in paginated list endpoints.
 *
 * @type {Joi.ObjectSchema}
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

/**
 * Creates a Joi schema for sorting options.
 *
 * - `sortBy`: A string representing the logical sort field. Trimmed and defaults to `defaultSortBy`.
 * - `sortOrder`: Must be either 'ASC' or 'DESC'. Defaults to 'DESC'.
 *
 * @param {string} [defaultSortBy='created_at'] - The default sort key to apply when none is provided.
 * @returns {Joi.ObjectSchema} Joi object schema for sort configuration.
 */
const createSortSchema = (defaultSortBy = 'created_at') =>
  Joi.object({
    sortBy: Joi.string().trim().default(defaultSortBy),
    sortOrder: Joi.string()
      .uppercase()
      .valid(...allowedSortOrders)
      .default('DESC'),
  });

/**
 * Joi schema for filtering by creation date range.
 *
 * Includes:
 * - `createdAfter`: ISO date to filter records created on or after this date
 * - `createdBefore`: ISO date to filter records created on or before this date
 *
 * Accepts null or empty string values.
 *
 * @type {Joi.ObjectSchema}
 */
const createdDateRangeSchema = Joi.object({
  createdAfter: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Created After'),
  createdBefore: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Created Before'),
});

/**
 * Joi schema for filtering by last updated date range.
 *
 * Includes:
 * - `updatedAfter`: ISO date to filter records updated on or after this date
 * - `updatedBefore`: ISO date to filter records updated on or before this date
 *
 * Accepts null or empty string values.
 *
 * @type {Joi.ObjectSchema}
 */
const updatedDateRangeSchema = Joi.object({
  updatedAfter: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Updated After'),
  updatedBefore: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Updated Before'),
});

/**
 * Joi schema for filtering by status change date range.
 *
 * Includes:
 * - `statusDateAfter`: ISO date to filter records whose status changed on or after this date
 * - `statusDateBefore`: ISO date to filter records whose status changed on or before this date
 *
 * Accepts null or empty string values.
 *
 * @type {Joi.ObjectSchema}
 */
const statusDateRangeSchema = Joi.object({
  statusDateAfter: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Status Date After'),
  statusDateBefore: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Status Date Before'),
});

/**
 * Creates a Joi schema for a boolean query parameter that accepts flexible truthy/falsy values.
 *
 * - Accepts true/false, or strings like 'true'/'false'
 * - Allows null or undefined for optional filtering
 * - Attaches a label for error message clarity
 *
 * @param {string} fieldName - The name of the boolean field (used as label in validation errors).
 * @returns {Joi.BooleanSchema} Joi boolean schema with truthy/falsy handling.
 */
const createBooleanFlag = (fieldName) =>
  Joi.boolean()
    .truthy('true')
    .falsy('false')
    .optional()
    .allow(null)
    .label(fieldName);

/**
 * Creates a Joi string validator for keyword-style text filters.
 *
 * - Trims leading/trailing whitespace
 * - Optional and nullable by default
 * - Enforces a max length (default: 100 characters)
 *
 * Use for search filters like name, email, or general free-text queries.
 *
 * @param {string} [label='keyword'] - Field label for error messages.
 * @param {number} [max=100] - Maximum character length allowed.
 * @returns {Joi.StringSchema} Joi schema for optional, safe keyword input
 */
const validateKeyword = (label = 'keyword', max = 100) =>
  Joi.string().trim().max(max).optional().allow(null, '').label(label);

/**
 * Creates a reusable Joi array schema for validating lists of items.
 *
 * @param {Joi.Schema} itemSchema - The Joi schema to apply to each array item.
 * @param {number} [minItems=1] - Minimum number of items required in the array.
 * @param {string} [label='Items'] - Label for error messages.
 * @returns {Joi.ArraySchema} Joi schema for validating an array of items.
 */
const createArraySchema = (itemSchema, minItems = 1, label = 'Items') =>
  Joi.array()
    .items(itemSchema)
    .min(minItems)
    .required()
    .label(label)
    .messages({
      'array.base': `${label} must be an array`,
      'array.min': `${label} must contain at least ${minItems} item(s)`,
      'any.required': `${label} is required`,
    });

module.exports = {
  validateEmail,
  validateUUID,
  validateOptionalUUID,
  validateUUIDArray,
  validatePositiveInteger,
  validateString,
  validatePhoneNumber,
  validateOrderNumber,
  safeString,
  allowedSortOrders,
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema,
  updatedDateRangeSchema,
  statusDateRangeSchema,
  createBooleanFlag,
  validateKeyword,
  validateOptionalString,
  createArraySchema,
};
