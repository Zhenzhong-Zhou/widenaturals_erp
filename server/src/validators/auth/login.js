const Joi = require('joi');
const { passwordForLogin } = require('./password-login');

/**
 * Schema for user login requests.
 *
 * This schema validates the input required to authenticate a user.
 * It ensures the presence of an email address and an opaque password
 * value without enforcing password complexity rules.
 *
 * Security model:
 * - Password complexity is intentionally NOT enforced at login time.
 * - Password policy enforcement occurs only during password creation
 *   or password change flows.
 *
 * Intended usage:
 * - Login endpoints that authenticate user credentials.
 *
 * Notes:
 * - This schema MUST NOT be reused for password reset or change flows.
 * - Credential verification and lockout logic are handled at the service layer.
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: passwordForLogin,
}).required();

module.exports = {
  loginSchema,
};
