const sanitizeRichText = require('./sanitize-html');
const customSanitization = require('./custom-sanitization');

/**
 * Sanitizes plain text fields from req.body and stores the result in req.sanitizedBody.
 */
const sanitizeRequestBody = (req, fields, isRichText = false) => {
  req.sanitizedBody = req.sanitizedBody || {};
  
  fields.forEach((field) => {
    if (req.body && req.body[field]) {
      req.sanitizedBody[field] = isRichText
        ? sanitizeRichText(req.body[field])
        : customSanitization(req.body[field]);
    }
  });
};

/**
 * Sanitizes all query parameters and stores them in req.sanitizedQuery.
 */
const sanitizeQueryParams = (req) => {
  req.sanitizedQuery = customSanitization(req.query);
};

/**
 * Sanitizes all URL parameters and stores them in req.sanitizedParams.
 */
const sanitizeParams = (req) => {
  req.sanitizedParams = customSanitization(req.params);
};

module.exports = {
  sanitizeRequestBody,
  sanitizeQueryParams,
  sanitizeParams,
};
