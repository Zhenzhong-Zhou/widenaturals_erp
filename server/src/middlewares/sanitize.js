const customSanitization = require('../utils/custom-sanitization');
const sanitizeRichText = require('../utils/sanitize-html');

/**
 * Middleware to sanitize inputs.
 */
const sanitizeInput = (req, res, next) => {
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
};

/**
 * Middleware to sanitize specific fields.
 */
const sanitizeDescription = (req, res, next) => {
  if (req.body.description) {
    req.body.description = sanitizeRichText(req.body.description);
  }
  next();
};

module.exports = { sanitizeInput, sanitizeDescription };
