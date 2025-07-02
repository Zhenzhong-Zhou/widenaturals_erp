const Joi = require('joi');
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
  
  region: Joi.string().max(100).allow('', null),

  note: Joi.string().max(500).allow('').optional(),
});

/**
 * Joi schema for validating an array of customers.
 */
const customerArraySchema = Joi.array().items(customerSchema).min(1).required();

module.exports = customerArraySchema;
