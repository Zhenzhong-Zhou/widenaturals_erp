const Joi = require('joi');
const { passwordWithPolicy } = require('./password-policy');

/**
 * Schema for authenticated password change.
 *
 * This schema validates input for users who are already authenticated
 * and are attempting to change their account password.
 *
 * Guarantees:
 * - Both `currentPassword` and `newPassword` must satisfy the system
 *   password policy.
 * - The new password must differ from the current password.
 *
 * Intended usage:
 * - Authenticated password change endpoints.
 * - Account security and credential-rotation flows.
 *
 * Notes:
 * - This schema MUST NOT be used for login validation.
 * - Password policy enforcement is delegated to `passwordWithPolicy`.
 */
const changePasswordSchema = Joi.object({
  currentPassword: passwordWithPolicy,
  newPassword: passwordWithPolicy.invalid(Joi.ref('currentPassword')).messages({
    'any.invalid': 'New password cannot be the same as the current password.',
  }),
}).required();

module.exports = {
  changePasswordSchema,
};
