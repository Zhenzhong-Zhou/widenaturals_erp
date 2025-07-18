const {
  sanitizeRequestBody,
  sanitizeQueryParams,
  sanitizeParams,
} = require('../utils/sanitization-utils');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Middleware to sanitize all inputs (body, query, and params).
 */
const sanitizeInput = (req, res, next) => {
  try {
    sanitizeRequestBody(req, Object.keys(req.body || {}));
    sanitizeQueryParams(req);
    sanitizeParams(req);
    next();
  } catch (error) {
    logError(error, req, {
      context: 'input-sanitizer',
      stage: 'sanitization',
    });

    next(
      AppError.sanitizationError('Input sanitization failed.', {
        details: error.message,
      })
    );
  }
};

/**
 * Middleware to sanitize specific fields dynamically.
 * Supports sanitizing rich text or custom fields based on the configuration.
 *
 * @param {Array<string>} fields - List of fields to sanitize.
 * @param {boolean} [isRichText=false] - Whether the fields contain rich text (HTML).
 */
const sanitizeFields = (fields, isRichText = false) => {
  return (req, res, next) => {
    try {
      sanitizeRequestBody(req, fields, isRichText);

      next();
    } catch (error) {
      logError(error, req, {
        context: 'field-sanitizer',
        fields,
        isRichText,
      });

      next(
        AppError.sanitizationError('Field sanitization failed.', {
          details: error.message,
        })
      );
    }
  };
};

module.exports = { sanitizeInput, sanitizeFields };
