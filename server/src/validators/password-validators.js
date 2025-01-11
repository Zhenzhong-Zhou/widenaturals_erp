const Joi = require('joi');

// Define password validation schema
const validatePassword = Joi.string()
  .pattern(
    new RegExp(
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,64}$'
    )
  )
  .required()
  .messages({
    'string.pattern.base':
      'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character. Minimum length: 8.',
    'any.required': 'Password is required.',
  });

module.exports = validatePassword;
