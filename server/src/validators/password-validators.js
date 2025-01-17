const Joi = require('joi');

/**
 * Joi schema for password validation, including currentPassword.
 */
const validatePasswordSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid user ID format.',
    'any.required': 'User ID is required.',
  }),
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required.',
    }),
  newPassword: Joi.string()
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,64}$'
      )
    )
    .invalid(Joi.ref('currentPassword')) // Ensure newPassword is not the same as currentPassword
    .required()
    .messages({
      'string.pattern.base':
        'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character. Minimum length: 8.',
      'any.required': 'New password is required.',
      'any.invalid': 'New password cannot be the same as the current password.',
    }),
});

module.exports = validatePasswordSchema;
