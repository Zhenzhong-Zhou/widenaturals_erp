const Joi = require('joi');
const { PASSWORD_POLICY } = require('../security/password-policy');

/**
 * Base password validation rule enforcing the system password policy.
 *
 * Policy guarantees:
 * - Matches `PASSWORD_POLICY.REGEX`
 * - Required (cannot be empty or undefined)
 *
 * Used for:
 * - User registration
 * - Password reset
 * - Password change flows
 *
 * Validation errors:
 * - `string.pattern.base` → password does not meet complexity requirements
 * - `any.required` → password is missing
 */
const basePasswordValidation = Joi.string()
  .pattern(PASSWORD_POLICY.REGEX)
  .required()
  .messages({
    'string.pattern.base': PASSWORD_POLICY.ERROR_MESSAGE,
    'any.required': 'Password is required.',
  });

/**
 * Schema for validating password change requests.
 *
 * Enforces:
 * - Current password must meet password policy
 * - New password must meet password policy
 * - New password MUST differ from current password
 *
 * Intended usage:
 * - Authenticated password change endpoints
 * - Account security flows
 *
 * Validation errors:
 * - `any.invalid` → new password matches current password
 */
const validatePasswordSchema = Joi.object({
  currentPassword: basePasswordValidation,
  newPassword: basePasswordValidation
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'any.invalid': 'New password cannot be the same as the current password.',
    }),
});

module.exports = {
  basePasswordValidation,
  validatePasswordSchema,
};
