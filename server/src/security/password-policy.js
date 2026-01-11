const AppError = require('../utils/AppError');

/**
 * Central password security policy.
 *
 * This file is the SINGLE SOURCE OF TRUTH for:
 * - Password complexity rules
 * - Regex definition
 * - Human-readable error messages
 *
 * Used by:
 * - Joi schemas (API validation)
 * - Service / business validation
 * - Root admin bootstrap
 */
const PASSWORD_POLICY = {
  REGEX:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=(?:.*[!@#$%^&*\-]){2,})(?=.{8,64})(?!.*(.)\1{2}).*$/,
  
  ERROR_MESSAGE:
    'Password must include at least one uppercase letter, one lowercase letter, one number, and at least two special characters. It must be 8–64 characters long and must not contain more than two consecutive repeating characters.',
};

/**
 * Validates password strength according to security policy.
 *
 * @param {string} password
 * @throws {AppError} If password does not meet requirements
 */
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    throw AppError.validationError('Password is required.');
  }
  
  if (!PASSWORD_POLICY.REGEX.test(password)) {
    throw AppError.validationError(PASSWORD_POLICY.ERROR_MESSAGE);
  }
};

module.exports = {
  PASSWORD_POLICY,
  validatePasswordStrength,
};
