/**
 * @file validation-utils.js
 * @description Utilities for handling and sanitizing validation errors.
 */

/**
 * Sanitizes Joi validation errors into a safe, client-friendly format.
 *
 * Responsibilities:
 * - Normalize Joi error structure into a predictable API format
 * - Prevent leaking internal schema details or raw values
 * - Ensure safe handling of unexpected or malformed error objects
 *
 * Design:
 * - Defensive programming (safe fallbacks)
 * - Non-throwing (never crashes the request lifecycle)
 * - Minimal transformation for performance
 *
 * @param {import('joi').ValidationError | null | undefined} error
 * @returns {Array<{ message: string, path: string }>}
 */
const sanitizeValidationError = (error) => {
  if (!error || !Array.isArray(error.details)) {
    return [];
  }
  
  return error.details.map((detail) => {
    // =========================
    // Normalize message
    // =========================
    let message =
      typeof detail.message === 'string'
        ? detail.message.replace(/["']/g, '') // remove quotes for cleaner UX
        : 'Invalid value';
    
    // =========================
    // Normalize path
    // =========================
    let path = 'unknown';
    
    if (Array.isArray(detail.path) && detail.path.length > 0) {
      path = detail.path.join('.');
    }
    
    return { message, path };
  });
};

module.exports = {
  sanitizeValidationError,
};
