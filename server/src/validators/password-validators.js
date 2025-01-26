const Joi = require('joi');

/**
 * Password regex pattern.
 * - At least one uppercase letter.
 * - At least one lowercase letter.
 * - At least one number.
 * - At least two special characters.
 * - Minimum 8 characters, maximum 64 characters.
 * - No more than two consecutive repeating characters.
 */
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=(?:.*[!@#$%^&*\\-]){2,})(?=.{8,64})(?!.*(.)\1{2}).*$/;

/**
 * Base password validation schema.
 */
const basePasswordValidation = Joi.string().pattern(PASSWORD_PATTERN).messages({
  'string.pattern.base':
    'Password must include at least one uppercase letter, one lowercase letter, one number, and at least two special characters. Minimum length: 8, and no more than two consecutive repeating characters.',
  'string.min': 'Password must be at least 8 characters long.',
  'string.max': 'Password must be at most 64 characters long.',
  'any.required': 'Password is required.',
});

/**
 * Full password validation schema for updating passwords.
 */
const validatePasswordSchema = Joi.object({
  currentPassword: basePasswordValidation.required().messages({
    'any.required': 'Current password is required.',
  }),
  newPassword: basePasswordValidation
    .invalid(Joi.ref('currentPassword'))
    .required()
    .messages({
      'any.invalid': 'New password cannot be the same as the current password.',
    }),
});

module.exports = {
  basePasswordValidation,
  validatePasswordSchema,
};
