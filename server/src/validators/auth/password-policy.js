const Joi = require('joi');
const { PASSWORD_POLICY } = require('../../security/password-policy');

/**
 * Enforces the system password policy.
 *
 * Used for:
 * - Password creation
 * - Password reset
 * - Password change
 *
 * Note:
 * - Enforces the active system password policy defined in `PASSWORD_POLICY`.
 * - Requires a non-empty value.
 * - Must NOT be used for login validation.
 */
const passwordWithPolicy = Joi.string()
  .pattern(PASSWORD_POLICY.REGEX)
  .required()
  .messages({
    'string.pattern.base': PASSWORD_POLICY.ERROR_MESSAGE,
    'any.required': 'Password is required.',
  });

module.exports = {
  passwordWithPolicy,
};
