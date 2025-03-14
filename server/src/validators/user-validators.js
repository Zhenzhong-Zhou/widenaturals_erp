const Joi = require('joi');
const { validateEmail, validateString } = require('./general-validators');
const {
  MIN_PASSWORD,
  MIN_FIRSTNAME,
  MIN_LASTNAME,
} = require('../utils/constants/general/min-limits');
const {
  MAX_FIRSTNAME,
  MAX_LASTNAME,
} = require('../utils/constants/general/max-limits');

const userSchema = Joi.object({
  email: validateEmail,
  password: Joi.string()
    .min(MIN_PASSWORD)
    .regex(/[!@#$%^&*]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must include at least one special character',
      'any.required': 'Password is required',
    }),
  firstName: validateString('First Name', MIN_FIRSTNAME, MAX_FIRSTNAME),
  lastName: validateString('Last Name', MIN_LASTNAME, MAX_LASTNAME),
  roleId: Joi.string().uuid().required().messages({
    'string.guid': 'Role ID must be a valid UUID',
    'any.required': 'Role ID is required',
  }),
});

module.exports = userSchema;
