const AppError = require('../AppError');

/**
 * List of retryable error codes (Node.js + PostgreSQL).
 *
 * Includes:
 * - Network/connection errors (Node.js)
 * - Transient database errors (PostgreSQL)
 */
const RETRYABLE_CODES = new Set([
  // Node.js / network
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',

  // PostgreSQL transient errors
  '57P01', // admin shutdown
  '40001', // serialization failure
  '53300', // too many connections
  '55P03', // lock not available
]);

/**
 * Determines whether an error is retryable.
 *
 * Retryable errors are typically transient and may succeed
 * if the operation is attempted again.
 *
 * Supports both:
 * - Raw errors (pg / Node.js)
 * - Normalized AppError instances
 *
 * @param {Error & { code?: string }} error
 * @returns {boolean}
 */
const isRetryableDbError = (error) => {
  if (!error || typeof error !== 'object') return false;

  //--------------------------------------------------
  // Extract error code safely
  //--------------------------------------------------
  const code =
    error instanceof AppError
      ? error.code // assumes AppError preserves original code
      : error.code;

  if (!code) return false;

  //--------------------------------------------------
  // Check retryable codes
  //--------------------------------------------------
  return RETRYABLE_CODES.has(code);
};

const RETRYABLE_HTTP_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
]);

const isRetryableHttpError = (error) => {
  if (!error || typeof error !== 'object') return false;

  // Network-level errors
  if (RETRYABLE_HTTP_CODES.has(error.code)) return true;

  // Fetch response errors (optional)
  if (error.response) {
    const status = error.response.status;
    return status >= 500; // retry 5xx
  }

  return false;
};

module.exports = {
  isRetryableDbError,
  isRetryableHttpError,
};
