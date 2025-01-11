const customSanitization = require('../utils/custom-sanitization');
const sanitizeRichText = require('../utils/sanitize-html');
const AppError = require('../utils/app-error');
const { logError } = require('../utils/logger-helper');

/**
 * Middleware to sanitize all inputs (body, query, and params).
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = customSanitization(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = customSanitization(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = customSanitization(req.params);
    }
    
    next();
  } catch (error) {
    logError('Input sanitization failed:', {
      method: req.method,
      route: req.originalUrl,
      error: error.message,
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
      fields.forEach((field) => {
        if (req.body[field]) {
          req.body[field] = isRichText
            ? sanitizeRichText(req.body[field])
            : customSanitization(req.body[field]);
        }
      });
      
      next();
    } catch (error) {
      logError('Field sanitization failed:', {
        method: req.method,
        route: req.originalUrl,
        fields,
        error: error.message,
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
