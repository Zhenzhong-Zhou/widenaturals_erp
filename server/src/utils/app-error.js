/**
 * @file AppError.js
 * @description Custom error class for structured error creation.
 */

class AppError extends Error {
  constructor(message, status = 500, options = {}) {
    super(message);
    
    this.status = status >= 100 && status < 600 ? status : 500; // Validate status code
    this.type = options.type || 'Unexpected'; // Error type, e.g., "Validation", "Authorization"
    this.isExpected = options.isExpected || false; // Flag for expected errors
    this.code = options.code || 'UNKNOWN_ERROR'; // Custom error code
    this.logLevel = options.logLevel || 'error'; // Log level (info, warn, error)
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Serialize error for structured API responses.
   */
  toJSON() {
    return {
      message: this.message,
      status: this.status,
      type: this.type,
      code: this.code,
      isExpected: this.isExpected,
    };
  }
}

module.exports = AppError;
