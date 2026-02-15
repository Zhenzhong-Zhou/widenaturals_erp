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
  Joi.string().uuid().trim().required().label(fieldName).messages({
    'string.base': '{{#label}} must be a string',
    'string.guid': '{{#label}} must be a valid UUID',
    'string.empty': '{{#label}} cannot be empty',
    'any.required': '{{#label}} is required',
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
  Joi.string()
    .uuid()
    .trim()
    .optional()
    .allow(null)
    .disallow('')
    .label(fieldName)
    .messages({
      'string.guid': '{{#label}} must be a valid UUID',
      'any.invalid': '{{#label}} cannot be an empty string',
    });

/**
 * Returns a Joi schema for validating either a string or array of UUIDs (v4).
 * Useful for flexible query filters that accept comma-separated or array input.
 */
const validateUUIDOrUUIDArrayOptional = (fieldName = 'IDs') =>
  Joi.alternatives()
    .try(
      Joi.string(),
      Joi.array().items(Joi.string().uuid({ version: 'uuidv4' }))
    )
    .optional()
    .label(fieldName);

/**
 * Generates a Joi schema for validating an array of UUID strings.
 *
 * This helper supports flexible options for required fields and empty array allowance.
 *
 * @param {string} [fieldName='IDs'] - Label used in error messages for the field.
 * @param {Object} [options={}] - Configuration options.
 * @param {boolean} [options.required=false] - Whether the array is required (defaults to optional).
 * @param {boolean} [options.allowEmpty=false] - Whether to allow empty arrays (default disallows empty arrays).
 *
 * @returns {Joi.ArraySchema} Joi validation schema for UUID array.
 *
 * @example
 * const schema = Joi.object({
 *   allocationIds: validateUUIDArray('Allocation IDs', { required: true }),
 * });
 */
const validateUUIDArray = (fieldName = 'IDs', options = {}) => {
  const { required = false, allowEmpty = false } = options;

  let schema = Joi.array()
    .items(Joi.string().uuid().trim().label('UUID'))
    .label(fieldName);

  if (required) schema = schema.required();
  else schema = schema.default([]);

  if (!allowEmpty) schema = schema.min(1);

  return schema.messages({
    'array.base': '{{#label}} must be an array',
    'any.required': '{{#label}} is required',
    'array.includes': '{{#label}} must contain valid UUIDs',
    'array.min': '{{#label}} must contain at least one UUID',
  });
};

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
  Joi.string().trim().max(max).optional().allow('', null).label(label);

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
 * Optional international phone number validator (E.164).
 *
 * Accepts:
 * - Valid E.164 phone numbers (e.g. "+1234567890")
 * - null (explicitly unset)
 * - empty string ("") for form compatibility
 *
 * Notes:
 * - Empty strings SHOULD be normalized to null before persistence
 * - This validator is transport-layer only and does not imply existence or ownership
 */
const optionalE164PhoneNumber = Joi.string()
  .pattern(/^\+?[1-9]\d{1,14}$/)
  .allow(null, '')
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
 * Joi schema for filtering by allocated date range.
 *
 * Includes:
 * - `allocatedAfter`: ISO date to filter records allocated on or after this date
 * - `allocatedBefore`: ISO date to filter records allocated on or before this date
 *
 * Accepts null or empty string values.
 *
 * @type {Joi.ObjectSchema}
 */
const allocatedDateRangeSchema = Joi.object({
  allocatedAfter: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Allocated After'),
  allocatedBefore: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Allocated Before'),
});

/**
 * Joi schema for filtering by aggregated allocated and created date ranges.
 *
 * Includes:
 * - `aggregatedAllocatedAfter`: filters `aa.allocated_at >=`
 * - `aggregatedAllocatedBefore`: filters `aa.allocated_at <=`
 * - `aggregatedCreatedAfter`: filters `aa.allocated_created_at >=`
 * - `aggregatedCreatedBefore`: filters `aa.allocated_created_at <=`
 *
 * Accepts null or empty string values.
 *
 * @type {Joi.ObjectSchema}
 */
const aggregatedDateRangeSchema = Joi.object({
  aggregatedAllocatedAfter: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Aggregated Allocated After'),

  aggregatedAllocatedBefore: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Aggregated Allocated Before'),

  aggregatedCreatedAfter: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Aggregated Created After'),

  aggregatedCreatedBefore: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Aggregated Created Before'),
});

/**
 * Joi schema for filtering by shipped date range.
 *
 * Includes:
 * - `shippedAfter`: ISO date to filter records shipped on or after this date
 * - `shippedBefore`: ISO date to filter records shipped on or before this date
 *
 * Accepts null or empty string values.
 *
 * @type {Joi.ObjectSchema}
 */
const shippedDateRangeSchema = Joi.object({
  shippedAfter: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Shipped After'),
  shippedBefore: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Shipped Before'),
});

/**
 * Joi schema for filtering compliance records by issued date range.
 *
 * Includes:
 * - `issuedAfter`: filters `cr.issued_date >=`
 * - `issuedBefore`: filters `cr.issued_date <=`
 *
 * Accepts null or empty string values.
 *
 * @type {Joi.ObjectSchema}
 */
const issuedDateRangeSchema = Joi.object({
  issuedAfter: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Issued After Date'),

  issuedBefore: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Issued Before Date'),
});

/**
 * Joi schema for filtering compliance records by expiry date range.
 *
 * Includes:
 * - `expiringAfter`: filters `cr.expiry_date >=`
 * - `expiringBefore`: filters `cr.expiry_date <=`
 *
 * Accepts null or empty string values.
 *
 * @type {Joi.ObjectSchema}
 */
const expiryDateRangeSchema = Joi.object({
  expiringAfter: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Expiry After Date'),

  expiringBefore: Joi.date()
    .iso()
    .optional()
    .allow(null, '')
    .label('Expiry Before Date'),
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
    .truthy('true', 'TRUE', '1', 1)
    .falsy('false', 'FALSE', '0', 0)
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

/**
 * Optional ISO-8601 date value.
 *
 * Accepts:
 * - Valid ISO-8601 date strings (e.g. "2026-01-12", "2026-01-12T10:30:00Z")
 * - undefined (parameter omitted)
 *
 * Notes:
 * - Intended for transport-layer validation only
 * - Absence of the value implies no date constraint
 */
const optionalIsoDate = (label = 'Date') =>
  Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': `${label} must be a valid date`,
      'date.iso': `${label} must be in ISO-8601 format`,
    });

/**
 * Required ISO-8601 date value.
 *
 * Accepts:
 * - Valid ISO-8601 date strings only
 *
 * Rejects:
 * - null
 * - empty string
 * - invalid formats
 */
const requiredIsoDate = () =>
  Joi.date().iso().required().messages({
    'any.required': 'Date is required',
    'date.base': 'Date must be a valid ISO-8601 value',
    'date.format': 'Date must be in ISO-8601 format',
  });

module.exports = {
  validateEmail,
  validateUUID,
  validateOptionalUUID,
  validateUUIDOrUUIDArrayOptional,
  validateUUIDArray,
  validatePositiveInteger,
  validateString,
  validatePhoneNumber,
  optionalE164PhoneNumber,
  validateOrderNumber,
  safeString,
  allowedSortOrders,
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema,
  updatedDateRangeSchema,
  statusDateRangeSchema,
  allocatedDateRangeSchema,
  aggregatedDateRangeSchema,
  shippedDateRangeSchema,
  issuedDateRangeSchema,
  expiryDateRangeSchema,
  createBooleanFlag,
  validateKeyword,
  validateOptionalString,
  createArraySchema,
  optionalIsoDate,
  requiredIsoDate,
};
