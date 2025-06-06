const Joi = require('joi');
const AppError = require('../utils/AppError');
const { validateEmail, validatePhoneNumber } = require('./general-validators');

/**
 * Joi schema for customer validation.
 */
const customerSchema = Joi.object({
  firstname: Joi.string().min(2).max(50).trim().required().messages({
    'string.min': 'Firstname must be at least 2 characters long',
    'string.max': 'Firstname must not exceed 50 characters',
    'any.required': 'Firstname is required',
  }),

  lastname: Joi.string().min(2).max(50).trim().required().messages({
    'string.min': 'Lastname must be at least 2 characters long',
    'string.max': 'Lastname must not exceed 50 characters',
    'any.required': 'Lastname is required',
  }),

  email: validateEmail,

  phone_number: validatePhoneNumber,

  // Structured Address Fields
  address_line1: Joi.string().max(255).required().messages({
    'any.required': 'Address Line 1 is required',
  }),
  address_line2: Joi.string().max(255).allow('', null),
  city: Joi.string().max(100).required().messages({
    'any.required': 'City is required',
  }),
  state: Joi.string().max(100).required().messages({
    'any.required': 'State/Province is required',
  }),
  postal_code: Joi.string().max(20).required().messages({
    'any.required': 'Postal Code is required',
  }),
  country: Joi.string().max(100).required().messages({
    'any.required': 'Country is required',
  }),
  region: Joi.string().max(100).allow('', null),

  note: Joi.string().max(500).allow('').optional(),
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
    throw AppError.validationError('Customer validation failed', {
      details: error.details.map((err) => err.message),
    });
  }

  return value; // Return validated data
};

module.exports = { validateCustomer, customerSchema };
