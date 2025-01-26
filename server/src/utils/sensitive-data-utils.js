/**
 * Masks sensitive information based on type.
 *
 * @param {string} data - The data to mask.
 * @param {string} type - The type of data (e.g., 'email', 'apiKey', 'uuid').
 * @returns {string} - The masked data.
 */
const maskSensitiveInfo = (data, type) => {
  if (!data || typeof data !== 'string') return data;

  switch (type) {
    case 'email':
      return data.replace(/(.{2})(.*)(?=@)/, (match, p1) => `${p1}***`);
    case 'apiKey':
      return data.slice(0, 4) + '****' + data.slice(-4);
    case 'uuid':
      return data.slice(0, 8) + '-****-****-' + data.slice(-4);
    default:
      return data; // Default: return unmodified data
  }
};

/**
 * Masks table names for logging or debugging purposes.
 *
 * @param {string} tableName - The table name to mask.
 * @returns {string} - The masked table name.
 */
const maskTableName = (tableName) => {
  if (!tableName || typeof tableName !== 'string') return tableName;
  return tableName.slice(0, 2) + '***'; // Example: 'users' -> 'us***'
};

const maskingRules = {
  users: {
    email: (data) => data.replace(/(.{2})(.*)(?=@)/, (match, p1) => `${p1}***`),
    user_id: (data) => data.slice(0, 8) + '-****-****-' + data.slice(-4),
  },
  user_auth: {
    user_id: (data) => data.slice(0, 8) + '-****-****-' + data.slice(-4),
    password_hash: () => '****',
  },
  orders: {
    order_id: (data) => data.slice(0, 4) + '****' + data.slice(-4),
  },
};

/**
 * Masks data based on table and field rules.
 *
 * @param {string} table - The table name.
 * @param {string} field - The field to mask (`id`, `email`, etc.).
 * @param {string} data - The data to mask.
 * @returns {string} - The masked data.
 */
const maskField = (table, field, data) => {
  if (!table || !field || !data) return data; // Return unmodified if no masking is needed

  const tableRules = maskingRules[table];
  if (tableRules && tableRules[field]) {
    return tableRules[field](data); // Apply field-specific masking rule
  }

  return data; // Return unmodified if no rule exists
};

const maskRow = (table, row) => {
  const maskedRow = {};
  for (const column in row) {
    maskedRow[column] = maskField(table, column, row[column]);
  }
  return maskedRow;
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
  if (!message || typeof message !== 'string') return message;

  return message
    // Mask passwords (e.g., password=1234 or "password": "1234")
    .replace(/(password\s*[:=]\s*)["']?\S+["']?/gi, '$1****')
    // Mask tokens (e.g., token=abcd1234 or "token": "abcd1234")
    .replace(/(token\s*[:=]\s*)["']?\S+["']?/gi, '$1****')
    // Mask email addresses (e.g., user@example.com)
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***')
    // Optionally mask IP addresses
    .replace(maskIp ? /\b(?:\d{1,3}\.){3}\d{1,3}\b/g : /(?:)/g, '***.***.***.***');
};

/**
 * Sanitizes Joi validation errors to return user-friendly and secure responses.
 *
 * @param {object} error - Joi validation error object.
 * @returns {Array} - Sanitized array of error details.
 */
const sanitizeValidationError = (error) => {
  return error.details.map((detail) => ({
    message: detail.message, // High-level error message
    path: detail.path.join('.'), // Simplified path for readability
  }));
};

module.exports = {
  maskSensitiveInfo,
  maskTableName,
  maskField,
  maskRow,
  sanitizeMessage,
  sanitizeValidationError,
};
