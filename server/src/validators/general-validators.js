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
 * Validates that the input is a valid UUID.
 */
const validateUUID = Joi.string().uuid().required().messages({
  'string.guid': 'Invalid UUID format',
  'any.required': 'ID is required',
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

module.exports = {
  validateEmail,
  validateUUID,
  validateString,
};
