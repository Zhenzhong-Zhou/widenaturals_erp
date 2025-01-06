const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize specific fields for rich text (e.g., descriptions, notes).
 *
 * @param {string} input - The field to sanitize.
 * @returns {string} - The sanitized HTML string.
 */
const sanitizeRichText = (input) => {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'p', 'br'],
    allowedAttributes: {
      a: ['href', 'target'],
    },
    allowedSchemes: ['http', 'https'],
  });
};

module.exports = sanitizeRichText;
