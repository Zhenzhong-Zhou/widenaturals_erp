const Joi = require('joi');

/**
 * Joi schema for password validation.
 */
const validatePasswordSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid user ID format.',
    'any.required': 'User ID is required.',
  }),
  newPassword: Joi.string()
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
    }),
});

module.exports = validatePasswordSchema;
