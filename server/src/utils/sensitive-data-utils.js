/**
 * Masks sensitive information like emails or API keys.
 * @param {string} data - The data to mask.
 * @param {string} type - The type of data (e.g., 'email', 'apiKey').
 * @returns {string} - The masked data.
 */
const maskSensitiveInfo = (data, type) => {
  if (type === 'email') {
    return data.replace(/(.{2})(.*)(?=@)/, (match, p1, p2) => `${p1}***`);
  }
  if (type === 'apiKey') {
    return data.slice(0, 4) + '****' + data.slice(-4);
  }
  if (type === 'userId') {
    return data.slice(0, 2) + '***' + data.slice(-2);
  }
  return data; // Default: return unmodified data
};

/**
 * Sanitizes sensitive data from messages or payloads.
 * Includes optional masking for IP addresses.
 *
 * @param {string} message - The original message to sanitize.
 * @param {boolean} [maskIp=false] - Whether to mask IP addresses.
 * @returns {string} - Sanitized message with sensitive data masked.
 */
const sanitizeMessage = (message, maskIp = false) => {
  if (!message) return message;

  let sanitizedMessage = message
    // Mask passwords (e.g., password=1234)
    .replace(/password=[^& ]+/g, 'password=****')
    // Mask tokens (e.g., token=abcd1234)
    .replace(/token=[^& ]+/g, 'token=****')
    // Mask email addresses (e.g., user@example.com)
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'EMAIL')
    // Mask phone numbers (e.g., 123-456-7890, (123) 456-7890)
    .replace(
      /(?:\+\d{1,3}[- ]?)?(?:\(\d{1,4}\)|\d{1,4})[- ]?\d{1,4}[- ]?\d{1,4}[- ]?\d{1,9}/g,
      'PHONE_NUMBER'
    );

  // Conditionally mask IP addresses (e.g., 192.168.1.1)
  if (maskIp) {
    sanitizedMessage = sanitizedMessage.replace(
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      'IP_ADDRESS'
    );
  }

  return sanitizedMessage;
};

module.exports = { maskSensitiveInfo, sanitizeMessage };
