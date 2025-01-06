const Joi = require('joi');
const validatePassword = require('../validators/password-validators'); // Reuse the password validator

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
  // Reuse the password validation logic
  password: validatePassword,
  // Validate first name with custom length and error messages
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters.',
    'string.max': 'First name must be at most 50 characters.',
    'any.required': 'First name is required.',
  }),
  // Validate last name with custom length and error messages
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters.',
    'string.max': 'Last name must be at most 50 characters.',
    'any.required': 'Last name is required.',
  }),
  // Restrict role to specific allowed values
  role: Joi.string().valid('admin', 'super_admin').required().messages({
    'any.only': 'Invalid role. Only "admin" or "super_admin" roles are allowed.',
    'any.required': 'Role is required.',
  }),
});

module.exports = adminSchema;
