const sanitizeHtml = require('sanitize-html');

/**
 * Recursively sanitize an object or array.
 *
 * @param {object|array|string} input - The data to sanitize.
 * @returns {object|array|string} - The sanitized data.
 */
const customSanitization = (input) => {
  if (typeof input === 'string') {
    return sanitizeHtml(input, {
      allowedTags: [], // No HTML allowed
      allowedAttributes: {}, // No attributes allowed
    });
  }
  
  if (Array.isArray(input)) {
    return input.map((item) => customSanitization(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitizedObject = {};
    for (const key in input) {
      sanitizedObject[key] = customSanitization(input[key]);
    }
    return sanitizedObject;
  }
  
  return input; // Return non-string values as is
};

module.exports = customSanitization;
