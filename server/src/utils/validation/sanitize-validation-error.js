/**
 * @file sanitize-validation-error.js
 * @description Utilities for sanitizing Joi validation errors into a safe,
 * client-friendly format before they are attached to an AppError.
 */

'use strict';

/**
 * Transforms a Joi `ValidationError` into a flat array of `{ message, path }`
 * objects safe to include in an API error response.
 *
 * Responsibilities:
 *   - Strip internal Joi details (raw values, context flags) from the output
 *   - Normalize the path array into a dot-notation string
 *   - Remove surrounding quotes from Joi messages for cleaner UX
 *   - Return an empty array for null, undefined, or malformed input
 *     so callers never need to guard against a thrown error here
 *
 * Design:
 *   - Non-throwing — safe to call in any error-handling context
 *   - No external dependencies
 *   - O(n) where n = number of validation error details
 *
 * @param {import('joi').ValidationError | null | undefined} error
 *   The Joi ValidationError to sanitize. Gracefully handles falsy input.
 * @returns {Array<{ message: string, path: string }>}
 *   Sanitized error detail objects, or an empty array if input is invalid.
 *
 * @example
 * // Joi produces: [{ message: '"name" is required', path: ['name'] }]
 * sanitizeValidationError(joiError);
 * // Returns:     [{ message: 'name is required', path: 'name' }]
 */
const sanitizeValidationError = (error) => {
  if (!error || !Array.isArray(error.details)) {
    return [];
  }
  
  return error.details.map((detail) => {
    // Strip surrounding quotes Joi adds around field names (e.g. "name" → name).
    const message =
      typeof detail.message === 'string'
        ? detail.message.replace(/["']/g, '')
        : 'Invalid value';
    
    // Flatten the path array to dot notation (e.g. ['address', 'city'] → 'address.city').
    const path =
      Array.isArray(detail.path) && detail.path.length > 0
        ? detail.path.join('.')
        : 'unknown';
    
    return { message, path };
  });
};

module.exports = {
  sanitizeValidationError
};
