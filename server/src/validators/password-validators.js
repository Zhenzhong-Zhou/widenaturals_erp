const Joi = require('joi');

// Define password policy regex pattern and error messages
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=(?:.*[!@#$%^&*\\-]){2,})(?=.{8,64})(?!.*(.)\1{2}).*$/;
const PASSWORD_ERROR_MESSAGE =
  'Password must include at least one uppercase letter, one lowercase letter, one number, and at least two special characters. It must be between 8 and 64 characters long with no more than two consecutive repeating characters.';

// Base password validation
const basePasswordValidation = Joi.string()
  .pattern(PASSWORD_REGEX)
  .required()
  .messages({
    'string.pattern.base': PASSWORD_ERROR_MESSAGE,
    'any.required': 'Password is required.',
  });

// Full password validation schema
const validatePasswordSchema = Joi.object({
  currentPassword: basePasswordValidation,
  newPassword: basePasswordValidation.invalid(Joi.ref('currentPassword')).messages({
    'any.invalid': 'New password cannot be the same as the current password.',
  }),
});

module.exports = {
  basePasswordValidation,
  validatePasswordSchema,
};
