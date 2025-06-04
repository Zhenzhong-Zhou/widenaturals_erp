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
    this.details = options.details || null;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error for structured API responses.
   * Includes optional debug info in non-production environments.
   */
  toJSON() {
    return {
      message: this.message,
      status: this.status,
      type: this.type,
      code: this.code,
      isExpected: this.isExpected,
      details: this.details,
    };
  }

  /**
   * Serialize error for structured logging.
   * Includes additional context like stack trace.
   */
  toLog(req = null) {
    return {
      ...this.toJSON(),
      logLevel: this.logLevel,
      stack: process.env.NODE_ENV !== 'production' ? this.stack : undefined,
      method: req?.method || 'Unknown',
      route: req?.originalUrl || 'Unknown',
      userAgent: req?.headers?.['user-agent'] || 'Unknown',
      ip: req?.ip || 'Unknown',
      timestamp: new Date().toISOString(),
    };
  }
  
  // =========================
  // Common Errors
  // =========================
  
  /**
   * Authorization failure (e.g., missing permission).
   */
  static authorizationError(message, options = {}) {
    return new AppError(message, 403, {
      type: 'AuthorizationError',
      code: 'AUTHORIZATION_ERROR',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * The Account is locked (e.g., due to failed login attempts).
   */
  static accountLockedError(message, options = {}) {
    return new AppError(message, 403, {
      type: 'AccountLockedError',
      code: 'ACCOUNT_LOCKED',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * User session has expired (e.g., due to inactivity).
   */
  static sessionExpiredError(message, options = {}) {
    return new AppError(message, 401, {
      type: 'SessionExpiredError',
      code: 'SESSION_EXPIRED',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Access token is expired and cannot be used.
   */
  static accessTokenExpiredError(message, options = {}) {
    return new AppError(message, 401, {
      type: 'AccessTokenExpiredError',
      code: 'ACCESS_TOKEN_EXPIRED',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Access token is missing or invalid.
   */
  static accessTokenError(message, options = {}) {
    return new AppError(message, 401, {
      type: 'AccessTokenError',
      code: 'ACCESS_TOKEN_MISSING',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Refresh token has expired.
   */
  static refreshTokenExpiredError(message, options = {}) {
    return new AppError(message, 401, {
      type: 'RefreshTokenExpiredError',
      code: 'REFRESH_TOKEN_EXPIRED',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Refresh token is missing or invalid.
   */
  static refreshTokenError(message, options = {}) {
    return new AppError(message, 401, {
      type: 'RefreshTokenError',
      code: 'REFRESH_TOKEN_MISSING',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * The Token has been revoked or blocklisted.
   */
  static tokenRevokedError(message, options = {}) {
    return new AppError(message, 401, {
      type: 'TokenRevokedError',
      code: 'TOKEN_REVOKED',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Generic authentication failure.
   */
  static authenticationError(message, options = {}) {
    return new AppError(message, 401, {
      type: 'AuthenticationError',
      code: 'AUTHENTICATION_ERROR',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Input failed validation schema or logic.
   */
  static validationError(message, options = {}) {
    return new AppError(message, 400, {
      type: 'ValidationError',
      code: 'VALIDATION_ERROR',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Hashing or cryptographic error (e.g., bcrypt failure).
   */
  static hashError(message, options = {}) {
    return new AppError(message, 429, {
      type: 'HashError',
      code: 'HASH_ERROR',
      logLevel: 'error',
      isExpected: false,
      ...options,
    });
  }
  
  /**
   * Too many requests — rate limit exceeded.
   */
  static rateLimitError(message, options = {}) {
    return new AppError(message, 429, {
      type: 'RateLimitError',
      code: 'RATE_LIMIT_EXCEEDED',
      logLevel: 'warn',
      isExpected: true,
      ...options,
    });
  }
  
  // =========================
  // Security and Input Errors
  // =========================
  
  /**
   * CSRF token error or violation.
   */
  static csrfError(message, options = {}) {
    return new AppError(message, 403, {
      type: 'CSRFError',
      code: 'CSRF_ERROR',
      isExpected: true,
      logLevel: 'warn',
      ...options,
    });
  }
  
  /**
   * CORS origin not allowed or misconfigured.
   */
  static corsError(message, options = {}) {
    return new AppError(message, 403, {
      type: 'CORSError',
      code: 'CORS_ERROR',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Helmet security middleware failure.
   */
  static helmetError(message, options = {}) {
    return new AppError(message, 500, {
      type: 'HelmetError',
      code: 'HELMET_ERROR',
      logLevel: 'error',
      ...options,
    });
  }
  
  /**
   * Sanitization failure (e.g., unsafe input).
   */
  static sanitizationError(message, options = {}) {
    return new AppError(message, 422, {
      type: 'SanitizationError',
      code: 'SANITIZATION_ERROR',
      isExpected: true,
      ...options,
    });
  }
  
  // =========================
  // Domain-Specific Errors
  // =========================
  
  /**
   * Failure in application service layer.
   */
  static serviceError(message, options = {}) {
    return new AppError(message, 500, {
      type: 'ServiceError',
      code: 'SERVICE_ERROR',
      logLevel: 'error',
      isExpected: false,
      ...options,
    });
  }
  
  /**
   * Failure in database query or connection.
   */
  static databaseError(message, options = {}) {
    return new AppError(message, 500, {
      type: 'DatabaseError',
      code: 'DATABASE_ERROR',
      logLevel: 'error',
      isExpected: false,
      ...options,
    });
  }
  
  /**
   * Business rule violation (e.g., invalid status transition).
   */
  static businessError(message, options = {}) {
    return new AppError(message, 400, {
      type: 'BusinessLogicError',
      code: 'BUSINESS_LOGIC_ERROR',
      logLevel: 'warn',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Controller-level error (e.g., misuse of request/response).
   */
  static controllerError(message, options = {}) {
    return new AppError(message, 400, {
      type: 'ControllerError',
      code: 'CONTROLLER_ERROR',
      logLevel: 'warn',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Transformer or DTO conversion failure.
   */
  static transformerError(message, options = {}) {
    return new AppError(message, 500, {
      type: 'TransformerError',
      code: 'TRANSFORMER_ERROR',
      logLevel: 'error',
      isExpected: false,
      ...options,
    });
  }
  
  // =========================
  // Specialized Errors
  // =========================
  
  /**
   * File upload failure (e.g., size limit, file type).
   */
  static fileUploadError(message, options = {}) {
    return new AppError(message, 400, {
      type: 'FileUploadError',
      code: 'FILE_UPLOAD_ERROR',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Health check or dependency failure.
   */
  static healthCheckError(message, options = {}) {
    return new AppError(message, 503, {
      type: 'HealthCheckError',
      code: 'HEALTH_CHECK_FAILURE',
      logLevel: 'warn',
      ...options,
    });
  }
  
  // =========================
  // General Errors
  // =========================
  
  /**
   * Requested resource not found.
   */
  static notFoundError(message, options = {}) {
    return new AppError(message, 404, {
      type: 'NotFoundError',
      code: 'RESOURCE_NOT_FOUND',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Conflict occurred (e.g., unique constraint violation).
   */
  static conflictError(message, options = {}) {
    return new AppError(message, 409, {
      type: 'ConflictError',
      code: 'CONFLICT_ERROR',
      isExpected: true,
      ...options,
    });
  }
  
  /**
   * Initialization failure — used when a critical system part fails to initialize.
   * Commonly thrown during application startup, preloading, or dependency setup.
   *
   * @param {string} message - The error message.
   * @param {object} [options={}] - Additional metadata or overrides.
   * @returns {AppError} - Structured initialization error.
   *
   * @example
   * throw AppError.initializationError('Status map failed to load from cache');
   */
  static initializationError(message, options = {}) {
    return new AppError(message, 500, {
      type: 'InitializationError',
      code: 'INIT_FAILURE',
      logLevel: 'error',
      isExpected: false,
      ...options,
    });
  }
  
  /**
   * Fallback general error (unexpected exception).
   */
  static generalError(message, options = {}) {
    return new AppError(message, 500, {
      type: 'GeneralError',
      code: 'GENERAL_ERROR',
      isExpected: false,
      ...options,
    });
  }
}

module.exports = AppError;
