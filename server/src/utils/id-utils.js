const { randomUUID } = require('crypto');

/**
 * Generates a custom trace ID based on a timestamp and a UUID-derived random suffix.
 *
 * Format: `${prefix}-YYYYMMDDHHMMSS-<8-char-random>`, e.g., `trace-20240509-abcdef12`
 *
 * @param {string} [prefix='trace'] - Optional prefix for the trace ID (e.g., 'tx', 'job', 'event').
 * @returns {string} - A unique trace ID string.
 *
 * @example
 * generateTraceId(); // → trace-20240509123000-abc123ef
 * generateTraceId('tx'); // → tx-20240509123000-abc123ef
 */
const generateTraceId = (prefix = 'trace') => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14); // YYYYMMDDHHMMSS
  const random = randomUUID().replace(/-/g, '').substring(0, 8); // 8-char alphanumeric
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Checks if a value is a valid UUID (Universally Unique Identifier).
 * @param {any} value - The field value to check.
 * @returns {boolean} - True if the value is a UUID.
 */
const isUUID = (value) => {
  if (typeof value !== 'string') return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

module.exports = {
  generateTraceId,
  isUUID,
};
