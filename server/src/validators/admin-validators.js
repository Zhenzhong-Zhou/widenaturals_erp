const Joi = require('joi');
const { basePasswordValidation } = require('../validators/password-validators');
const {
  MIN_FIRSTNAME,
  MIN_LASTNAME,
} = require('../utils/constants/general/min-limits');
const {
  MAX_FIRSTNAME,
  MAX_LASTNAME,
  MAX_JOB_TITLE,
  MAX_NOTE,
} = require('../utils/constants/general/max-limits');

/**
 * Joi schema for admin creation validation.
 * Ensures all required fields are present and meet specific criteria.
 */
const adminSchema = Joi.object({
  // Validate email with a clear error message
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format.',
    'any.required': 'Email is required.',
  }),

  // Reuse basePasswordValidation for password validation
  password: basePasswordValidation.required(),

  // Validate first name with custom length and error messages
  firstname: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': `First name must be at least ${MIN_FIRSTNAME} characters.`,
      'string.max': `First name must be at most ${MAX_FIRSTNAME} characters.`,
      'any.required': 'First name is required.',
    }),

  // Validate last name with custom length and error messages
  lastname: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': `Last name must be at least ${MIN_LASTNAME} characters.`,
      'string.max': `Last name must be at most ${MAX_LASTNAME} characters.`,
      'any.required': 'Last name is required.',
    }),

  // Restrict role to specific allowed values
  role: Joi.string().valid('admin', 'super_admin').required().messages({
    'any.only':
      'Invalid role. Only "admin" or "super_admin" roles are allowed.',
    'any.required': 'Role is required.',
  }),

  // Optional phone number validation
  phoneNumber: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .allow(null)
    .messages({
      'string.pattern.base':
        'Phone number must be a valid international format (10-15 digits).',
    }),

  // Optional job title validation
  jobTitle: Joi.string()
    .max(100)
    .allow(null)
    .messages({
      'string.max': `Job title must be at most ${MAX_JOB_TITLE} characters.`,
    }),

  // Optional note validation
  note: Joi.string()
    .max(500)
    .allow(null)
    .messages({
      'string.max': `Note must be at most ${MAX_NOTE} characters.`,
    }),

  // Optional status ID validation
  status: Joi.string()
    .valid('active', 'inactive', 'suspended')
    .required()
    .messages({
      'any.only':
        'Invalid status. Allowed values: "active", "inactive", "suspended".',
      'any.required': 'Status is required.',
    }),

  createdBy: Joi.string().uuid().allow(null).messages({
    'string.guid': 'Created by must be a valid UUID.',
  }),
});

module.exports = adminSchema;
