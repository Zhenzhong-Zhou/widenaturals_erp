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
 * Reusable safe string validator
 *
 * Allows letters, numbers, spaces, hyphens. Use for fields like country, city, etc.
 *
 * @param {string} label - The name of the field for error messages.
 * @param {number} max - Max length of the string (default 100).
 * @returns {Joi.StringSchema}
 */
const safeString = (label, max = 100) =>
  Joi.string()
    .max(max)
    .pattern(/^[\w\s\-]+$/)
    .message(`${label} contains invalid characters`);

module.exports = {
  validateEmail,
  validateUUID,
  validateString,
  validatePhoneNumber,
  validateOrderNumber,
  safeString,
};
