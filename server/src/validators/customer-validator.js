const Joi = require('joi');
const AppError = require('../utils/AppError');
const { validateEmail } = require('./general-validators');

/**
 * Joi schema for customer validation.
 */
const customerSchema = Joi.object({
  firstname: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.min': 'Firstname must be at least 2 characters long',
      'string.max': 'Firstname must not exceed 50 characters',
      'any.required': 'Firstname is required',
    }),
  
  lastname: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.min': 'Lastname must be at least 2 characters long',
      'string.max': 'Lastname must not exceed 50 characters',
      'any.required': 'Lastname is required',
    }),
  
  email: validateEmail,
  
  phone_number: Joi.string()
    .pattern(/^\(\d{3}\)-\d{3}-\d{4}$/) // Format: (123)-456-7890
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must follow the format (123)-456-7890',
    }),
  
  address: Joi.string().max(255).optional(),
  
  note: Joi.string().max(500).optional(),
});

/**
 * Validates customer data using Joi.
 * @param {Object} customerData - The customer data to validate.
 * @throws {AppError} Throws an error if validation fails.
 */
const validateCustomer = (customerData) => {
  const { error, value } = customerSchema.validate(customerData, {
    abortEarly: false, // Show all errors, not just the first one
  });
  
  if (error) {
    throw new AppError('Customer validation failed', 400, {
      type: 'ValidationError',
      code: 'VALIDATION_ERROR',
      isExpected: true,
      details: error.details.map((err) => err.message),
    });
  }
  
  return value; // Return validated data
};

module.exports = { validateCustomer, customerSchema };
