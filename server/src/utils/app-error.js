/**
 * @file AppError.js
 * @description Custom error class for structured error creation.
 */

class AppError extends Error {
  /**
   * Creates an instance of AppError.
   * @param {string} message - Error message.
   * @param {number} [status=500] - HTTP status code (default is 500).
   * @param {object} [options={}] - Additional error options.
   */
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
      serialized.stack = this.stack;
    }
    
    return serialized;
  }
  
  // Common Errors
  static authorizationError(message, options = {}) {
    return new AppError(message, 403, { type: 'AuthorizationError', code: 'AUTHORIZATION_ERROR', isExpected: true, ...options });
  }
  
  static authenticationError(message, options = {}) {
    return new AppError(message, 401, { type: 'AuthenticationError', code: 'AUTHENTICATION_ERROR', isExpected: true, ...options });
  }
  
  static validationError(message, options = {}) {
    return new AppError(message, 400, { type: 'ValidationError', code: 'VALIDATION_ERROR', isExpected: true, ...options });
  }
  
  static hashError(message, options = {}) {
    return new AppError(message, 429, { type: 'HashError', code: 'HASH_ERROR', logLevel: 'error', isExpected: false, ...options });
  }
  
  static rateLimitError(message, options = {}) {
    return new AppError(message, 429, { type: 'RateLimitError', code: 'RATE_LIMIT_EXCEEDED', logLevel: 'warn', isExpected: true, ...options });
  }
  
  // Security and Input Errors
  static csrfError(message, options = {}) {
    return new AppError(message, 403, { type: 'CSRFError', code: 'CSRF_ERROR', isExpected: true, logLevel: 'warn', ...options });
  }
  
  static corsError(message, options = {}) {
    return new AppError(message, 403, { type: 'CORSError', code: 'CORS_ERROR', isExpected: true, ...options });
  }
  
  static helmetError(message, options = {}) {
    return new AppError(message, 500, { type: 'HelmetError', code: 'HELMET_ERROR', logLevel: 'error', ...options });
  }
  
  static sanitizationError(message, options = {}) {
    return new AppError(message, 422, { type: 'SanitizationError', code: 'SANITIZATION_ERROR', isExpected: true, ...options });
  }
  
  // Domain-Specific Errors
  static serviceError(message, options = {}) {
    return new AppError(message, 500, { type: 'ServiceError', code: 'SERVICE_ERROR', logLevel: 'error', isExpected: false, ...options });
  }
  
  static databaseError(message, options = {}) {
    return new AppError(message, 500, { type: 'DatabaseError', code: 'DATABASE_ERROR', logLevel: 'error', isExpected: false, ...options });
  }
  
  // Specialized Errors
  static fileUploadError(message, options = {}) {
    return new AppError(message, 400, { type: 'FileUploadError', code: 'FILE_UPLOAD_ERROR', isExpected: true, ...options });
  }
  
  static healthCheckError(message, options = {}) {
    return new AppError(message, 503, { type: 'HealthCheckError', code: 'HEALTH_CHECK_FAILURE', logLevel: 'warn', ...options });
  }
  
  // General Errors
  static notFoundError(message, options = {}) {
    return new AppError(message, 404, { type: 'NotFoundError', code: 'RESOURCE_NOT_FOUND', isExpected: true, ...options });
  }
  
  static generalError(message, options = {}) {
    return new AppError(message, 500, { type: 'GeneralError', code: 'GENERAL_ERROR', isExpected: false, ...options });
  }
}

module.exports = AppError;
