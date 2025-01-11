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
  
  static validationError(message, options = {}) {
    return new AppError(message, 400, {
      type: 'ValidationError',
      code: 'VALIDATION_ERROR', // Default error code for validation errors
      isExpected: true, // Mark as an expected error
      ...options,
    });
  }
  
  /**
   * Static factory method for health-check errors.
   * @param {string} message - Error message.
   * @param {object} options - Additional error options.
   * @returns {AppError}
   */
  static healthCheckError(message, options = {}) {
    return new AppError(message, 503, {
      type: 'HealthCheckError',
      logLevel: 'warn',
      ...options,
    });
  }
  
  /**
   * Serialize error for structured API responses.
   * Includes optional debug info in non-production environments.
   */
  toJSON() {
    const serialized = {
      message: this.message,
      status: this.status,
      type: this.type,
      code: this.code,
      isExpected: this.isExpected,
    };
    
    if (process.env.NODE_ENV !== 'production') {
      serialized.stack = this.stack; // Include stack trace for non-production environments
    }
    
    return serialized;
  }
}

module.exports = AppError;
