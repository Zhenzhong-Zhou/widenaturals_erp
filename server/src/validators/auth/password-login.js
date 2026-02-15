const Joi = require('joi');

/**
 * Opaque password input validation for login.
 *
 * This validator intentionally performs minimal checks and does NOT
 * enforce the system password policy.
 *
 * Purpose:
 * - Accepts any reasonable password input for authentication attempts.
 * - Avoids rejecting valid legacy or externally-generated passwords.
 *
 * Used for:
 * - User login endpoints only.
 *
 * Security notes:
 * - Password strength is enforced only at password creation or change time.
 * - This validator MUST NOT be reused for password reset or change flows.
 */
const passwordForLogin = Joi.string().min(8).max(128).required().messages({
  'string.min': 'Password is required.',
  'any.required': 'Password is required.',
});

module.exports = {
  passwordForLogin,
};
