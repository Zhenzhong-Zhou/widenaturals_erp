/**
 * @file AppError.js
 * @description Custom error class for structured error creation.
 */

class AppError extends Error {
  constructor(message, status = 500, options = {}) {
    super(message);
    this.status = status;
    this.type = options.type || 'Unexpected'; // Default type
    this.isExpected = options.isExpected || false; // Expected by default
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
