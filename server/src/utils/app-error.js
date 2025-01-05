/**
 * @file AppError.js
 * @description Custom error class for structured error creation.
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Used to differentiate operational vs. programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
