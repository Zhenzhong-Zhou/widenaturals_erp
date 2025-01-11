const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize specific fields for rich text (e.g., descriptions, notes).
 *
 * @param {string} input - The field to sanitize.
 * @param {object} [options={}] - Custom sanitization options.
 * @returns {string} - The sanitized HTML string.
 */
const sanitizeRichText = (input, options = {}) => {
  const defaultOptions = {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'p', 'br'],
    allowedAttributes: {
      a: ['href', 'target'],
    },
    allowedSchemes: ['http', 'https'],
  };

  const finalOptions = { ...defaultOptions, ...options };

  if (!input || typeof input !== 'string') {
    return ''; // Return an empty string for invalid input
  }

  return sanitizeHtml(input, finalOptions);
};

module.exports = sanitizeRichText;
