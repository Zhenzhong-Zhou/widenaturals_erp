const sanitizeHtml = require('sanitize-html');

/**
 * Recursively sanitize an object, array, or string input.
 *
 * @param {object|array|string} input - The data to sanitize.
 * @param {object} [options={}] - Custom sanitization options.
 * @returns {object|array|string} - The sanitized data.
 */
const customSanitization = (input, options = {}) => {
  const defaultOptions = {
    allowedTags: [], // No HTML allowed
    allowedAttributes: {}, // No attributes allowed
  };
  const finalOptions = { ...defaultOptions, ...options };

  if (input === null || input === undefined) {
    return input; // Return as is for null or undefined
  }

  if (typeof input === 'string') {
    return sanitizeHtml(input, finalOptions);
  }

  if (Array.isArray(input)) {
    return input.map((item) => customSanitization(item, finalOptions));
  }

  if (typeof input === 'object') {
    const sanitizedObject = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitizedObject[key] = customSanitization(input[key], finalOptions);
      }
    }
    return sanitizedObject;
  }

  return input; // Return non-string, non-object, and non-array values as is
};

module.exports = customSanitization;
