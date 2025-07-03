const Joi = require('joi');
const { validateEmail, validatePhoneNumber } = require('./general-validators');

/**
 * Joi schema for address validation.
 */
const addressSchema = Joi.object({
  customer_id: Joi.string()
    .uuid({ version: 'uuidv4' })
    .allow(null)
    .optional(),
  full_name: Joi.string().max(150).trim().allow('', null),
  phone: validatePhoneNumber,
  email: validateEmail,
  label: Joi.string().max(50).trim().allow('', null),
  address_line1: Joi.string().max(255).trim().required().messages({
    'any.required': 'Address line 1 is required',
  }),
  address_line2: Joi.string().max(255).trim().allow('', null),
  city: Joi.string().max(100).trim().required().messages({
    'any.required': 'City is required',
  }),
  state: Joi.string().max(100).trim().allow('', null),
  postal_code: Joi.string().max(20).trim().required().messages({
    'any.required': 'Postal code is required',
  }),
  country: Joi.string().max(100).trim().default('Canada').required(),
  region: Joi.string().max(100).trim().allow('', null),
  note: Joi.string().max(500).trim().allow('', null),
});

/**
 * Joi schema for validating an array of addresses.
 */
const addressArraySchema = Joi.array().items(addressSchema).min(1).required();

module.exports = {
  addressArraySchema,
};
