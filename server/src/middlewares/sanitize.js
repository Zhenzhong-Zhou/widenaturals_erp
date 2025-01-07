const customSanitization = require('../utils/custom-sanitization');
const sanitizeRichText = require('../utils/sanitize-html');
const AppError = require('../utils/app-error');

/**
 * Middleware to sanitize inputs.
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
    next(new AppError('Input sanitization failed', 400, { type: 'SanitizationError', details: error.message }));
  }
};

/**
 * Middleware to sanitize specific fields.
 */
const sanitizeDescription = (req, res, next) => {
  try {
    if (req.body.description) {
      req.body.description = sanitizeRichText(req.body.description);
    }
    next();
  } catch (error) {
    next(new AppError('Description sanitization failed', 400, { type: 'SanitizationError', details: error.message }));
  }
};

module.exports = { sanitizeInput, sanitizeDescription };
