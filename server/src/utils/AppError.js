/**
 * @file AppError.js
 * @description Centralized structured error class for the application.
 */

const { ERROR_TYPES, ERROR_CODES } = require('./constants/error-constants');
const { LOG_LEVELS } = require('./logging/log-constants');

// O(1) lookup for log level validation
const LOG_LEVEL_SET = new Set(LOG_LEVELS);

class AppError extends Error {
  status;
  type;
  isExpected;
  code;
  logLevel;
  context;
  meta;
  details;
  exposeDetails;
  
  /**
   * Represents a structured application error.
   *
   * Centralized error abstraction used across all layers:
   * controller → service → repository → transformer.
   *
   * Responsibilities:
   * - Standardize API error responses (client-safe)
   * - Provide structured logging payloads (internal)
   * - Enforce consistent error taxonomy (type + code)
   * - Prevent sensitive data leakage via sanitization
   *
   * Core Design Principles:
   * - Separation of concerns:
   *   - `toJSON()` → client-safe response
   *   - `toLog()` → full internal logging payload
   * - Explicit classification:
   *   - `isExpected` distinguishes business vs system failures
   * - Controlled exposure:
   *   - `details` may be hidden in production unless explicitly allowed
   *
   * Usage Guidelines:
   * - Always throw AppError in application logic
   * - Prefer static factory methods for consistency
   * - Use:
   *   - `details` → client-safe structured data
   *   - `meta` → internal debugging/logging context
   * - Avoid placing sensitive data in `details`
   *
   * Lifecycle:
   * throw → error middleware → logger (toLog) → API response (toJSON)
   *
   * @param {string} message - Human-readable error message.
   * @param {number} [status=500] - HTTP status code.
   * @param {object} [options={}] - Additional error configuration.
   * @param {string} [options.type] - Error type (from ERROR_TYPES).
   * @param {string} [options.code] - Error code (from ERROR_CODES).
   * @param {boolean} [options.isExpected=false] - Whether error is expected.
   * @param {string} [options.logLevel='error'] - Log severity.
   * @param {string|null} [options.context=null] - Logical execution context.
   * @param {object} [options.meta] - Internal logging metadata.
   * @param {object} [options.details] - Client-safe structured details.
   * @param {boolean} [options.exposeDetails=false] - Force expose details in production.
   */
  constructor(message, status = 500, options = {}) {
    super(message);
    
    this.name = 'AppError';
    
    // Ensure valid HTTP status code
    this.status = status >= 100 && status < 600 ? status : 500;
    
    this.type = options.type || ERROR_TYPES.GENERAL;
    this.isExpected = options.isExpected ?? false;
    this.code = options.code || ERROR_CODES.GENERAL;
    
    // O(1) validation using Set instead of Array.includes()
    this.logLevel = LOG_LEVEL_SET.has(options.logLevel)
      ? options.logLevel
      : 'error';
    
    this.context = options.context || null;
    
    // Lazy sanitization: only sanitize when data exists
    this.meta = options.meta || {};
    this.details =
      options.details !== undefined ? options.details : null;
    
    this.exposeDetails = options.exposeDetails ?? false;
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Serializes the error into a client-safe response format.
   *
   * Intended for API responses:
   * - Includes only safe, non-sensitive fields
   * - Conditionally includes `details`
   * - Excludes internal metadata and stack trace
   *
   * @returns {object} Serialized error object for API response
   */
  toJSON() {
    return {
      message: this.message,
      status: this.status,
      type: this.type,
      code: this.code,
      isExpected: this.isExpected,
      ...(this.details && (this.exposeDetails || process.env.NODE_ENV !== 'production')
        ? { details: this.details }
        : {}),
    };
  }
  
  /**
   * Serializes the error into a structured internal logging payload.
   *
   * Unlike `toJSON()`, this method is for internal observability and should
   * not depend on client exposure rules. It always includes sanitized `details`
   * and `meta`, and includes stack trace outside production.
   *
   * @param {object} [extraContext={}] - Additional log metadata to merge
   * @returns {object} Structured log payload
   */
  toLog(extraContext = {}) {
    return {
      message: this.message,
      status: this.status,
      type: this.type,
      code: this.code,
      isExpected: this.isExpected,
      context: this.context,
      logLevel: this.logLevel,
      meta: this.meta,
      details: this.details,
      ...(process.env.NODE_ENV !== 'production'
        ? { stack: this.stack }
        : {}),
      ...extraContext,
    };
  }
  
  /**
   * Merges base error configuration with caller-provided overrides.
   *
   * Notes:
   * - `meta !== undefined` preserves intentional `null`
   * - `details !== undefined` preserves explicit null if caller passes it
   *
   * @param {object} base - Base error configuration
   * @param {object} [options={}] - Caller overrides
   * @returns {object} Final merged options object
   */
  static buildOptions(base, options = {}) {
    const {
      details,
      meta,
      context,
      ...overrides
    } = options;
    
    return {
      ...base,
      context,
      ...(meta !== undefined && { meta }),
      ...(details !== undefined && { details }),
      ...overrides,
    };
  }
  
  // =========================
  // Authentication & Authorization Errors
  // =========================
  
  /**
   * Generic authentication failure.
   */
  static authenticationError(message, options = {}) {
    return new AppError(
      message,
      401,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.AUTHENTICATION,
          code: ERROR_CODES.AUTHENTICATION,
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * The Account is locked (e.g., due to failed login attempts).
   */
  static accountLockedError(message, options = {}) {
    return new AppError(
      message,
      403,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.ACCOUNT_LOCKED,
          code: ERROR_CODES.ACCOUNT_LOCKED,
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * Authorization failure (e.g., missing permission).
   */
  static authorizationError(message, options = {}) {
    return new AppError(
      message,
      403,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.AUTHORIZATION,
          code: ERROR_CODES.AUTHORIZATION,
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * User session has expired (e.g., due to inactivity).
   */
  static sessionExpiredError(message, options = {}) {
    return new AppError(
      message,
      401,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.SESSION_EXPIRED,
          code: ERROR_CODES.SESSION_EXPIRED,
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * Access token is expired and cannot be used.
   */
  static accessTokenExpiredError(message, options = {}) {
    return new AppError(
      message,
      401,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.ACCESS_TOKEN_EXPIRED,
          code: ERROR_CODES.ACCESS_TOKEN_EXPIRED,
          isExpected: true,
        },
        options
      )
    );
  }

  /**
   * Access token is missing or invalid.
   */
  static accessTokenError(message, options = {}) {
    return new AppError(
      message,
      401,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.ACCESS_TOKEN,
          code: ERROR_CODES.ACCESS_TOKEN_INVALID,
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * Refresh token has expired.
   */
  static refreshTokenExpiredError(message, options = {}) {
    return new AppError(
      message,
      401,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.REFRESH_TOKEN_EXPIRED,
          code: ERROR_CODES.REFRESH_TOKEN_EXPIRED,
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * Refresh token is missing or invalid.
   */
  static refreshTokenError(message, options = {}) {
    return new AppError(
      message,
      401,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.REFRESH_TOKEN,
          code: ERROR_CODES.REFRESH_TOKEN_INVALID,
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * The Token has been revoked or blocklisted.
   */
  static tokenRevokedError(message, options = {}) {
    return new AppError(
      message,
      401,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.TOKEN_REVOKED,
          code: ERROR_CODES.TOKEN_REVOKED,
          isExpected: true,
        },
        options
      )
    );
  }
  
  // =========================
  // Validation & Input Errors
  // =========================
  
  /**
   * Input failed validation schema or logic.
   */
  static validationError(message, options = {}) {
    return new AppError(
      message,
      400,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.VALIDATION,
          code: ERROR_CODES.VALIDATION,
          isExpected: true,
          exposeDetails: true,
        },
        options
      )
    );
  }
  
  /**
   * Sanitization failure (e.g., unsafe input).
   */
  static sanitizationError(message, options = {}) {
    return new AppError(
      message,
      422,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.SANITIZATION,
          code: ERROR_CODES.SANITIZATION,
          isExpected: true,
        },
        options
      )
    );
  }
  
  // =========================
  // Security Errors
  // =========================
  
  /**
   * CSRF token error or violation.
   */
  static csrfError(message, options = {}) {
    return new AppError(
      message,
      403,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.CSRF,
          code: ERROR_CODES.CSRF,
          logLevel: 'warn',
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * CORS origin not allowed or misconfigured.
   */
  static corsError(message, options = {}) {
    return new AppError(
      message,
      403,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.CORS,
          code: ERROR_CODES.CORS,
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * Helmet security middleware failure.
   */
  static helmetError(message, options = {}) {
    return new AppError(
      message,
      500,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.HELMET,
          code: ERROR_CODES.HELMET,
          logLevel: 'error',
          isExpected: false,
        },
        options
      )
    );
  }
  
  /**
   * Too many requests — rate limit exceeded.
   */
  static rateLimitError(message, options = {}) {
    return new AppError(
      message,
      429,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.RATE_LIMIT,
          code: ERROR_CODES.RATE_LIMIT,
          logLevel: 'warn',
          isExpected: true,
        },
        options
      )
    );
  }
  
  // =========================
  // Business & Application Errors
  // =========================
  
  /**
   * Business rule violation (e.g., invalid status transition).
   */
  static businessError(message, options = {}) {
    return new AppError(
      message,
      400,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.BUSINESS,
          code: ERROR_CODES.BUSINESS,
          logLevel: 'warn',
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * Service layer failure.
   * Used when business logic execution fails unexpectedly.
   */
  static serviceError(message, options = {}) {
    return new AppError(
      message,
      500,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.SERVICE,
          code: ERROR_CODES.SERVICE,
          logLevel: 'error',
          isExpected: false,
        },
        options
      )
    );
  }
  
  /**
   * External service failure.
   * Used when a dependent third-party or external system fails to respond correctly.
   *
   * Typical scenarios:
   * - Payment gateway errors (e.g., Stripe, PayPal)
   * - Cloud storage failures (e.g., S3 upload/download issues)
   * - External API timeouts or invalid responses
   * - Upstream service returning 5xx errors
   *
   * Characteristics:
   * - Indicates a failure outside the application boundary
   * - Usually transient and may succeed on retry
   * - Should be monitored and alerted for reliability tracking
   *
   * @param {string} message - Human-readable error message describing the failure.
   * @param {object} [options={}] - Additional metadata or overrides.
   * @param {object} [options.meta] - Optional structured metadata (e.g., serviceName, endpoint).
   * @param {string} [options.context] - Logical context or source of the error.
   * @param {object} [options.details] - Optional additional error details (not exposed by default).
   * @returns {AppError} Structured external service error instance.
   *
   * @example
   * throw AppError.externalServiceError('Failed to upload file to S3', {
   *   meta: { serviceName: 'S3', bucket: 'user-uploads' },
   * });
   */
  static externalServiceError(message, options = {}) {
    return new AppError(
      message,
      502,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.EXTERNAL_SERVICE,
          code: ERROR_CODES.EXTERNAL_SERVICE,
          logLevel: 'error',
          isExpected: false,
        },
        options
      )
    );
  }
  
  /**
   * Controller misuse or request handling error.
   * Indicates improper usage of request/response lifecycle.
   */
  static controllerError(message, options = {}) {
    return new AppError(
      message,
      400,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.CONTROLLER,
          code: ERROR_CODES.CONTROLLER,
          logLevel: 'warn',
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * Transformer or DTO conversion failure.
   */
  static transformerError(message, options = {}) {
    return new AppError(
      message,
      500,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.TRANSFORMER,
          code: ERROR_CODES.TRANSFORMER,
          logLevel: 'error',
          isExpected: false,
        },
        options
      )
    );
  }
  
  // =========================
  // Infrastructure Errors
  // =========================
  
  /**
   * Cryptographic or hashing failure.
   * Typically triggered by bcrypt or token hashing operations.
   */
  static hashError(message, options = {}) {
    return new AppError(
      message,
      500,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.HASH,
          code: ERROR_CODES.HASH,
          logLevel: 'error',
          isExpected: false,
        },
        options
      )
    );
  }
  
  /**
   * Failure in database query or connection.
   */
  static databaseError(message, options = {}) {
    return new AppError(
      message,
      500,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.DATABASE,
          code: ERROR_CODES.DATABASE,
          logLevel: 'error',
          isExpected: false,
        },
        options
      )
    );
  }
  
  /**
   * File upload failure (e.g., size limit, file type).
   */
  static fileUploadError(message, options = {}) {
    return new AppError(
      message,
      400,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.FILE_UPLOAD,
          code: ERROR_CODES.FILE_UPLOAD,
          isExpected: true,
        },
        options
      )
    );
  }
  
  /**
   * File system–related error (e.g., read/write/delete failure).
   */
  static fileSystemError(message, options = {}) {
    return new AppError(
      message,
      500,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.FILE_SYSTEM,
          code: ERROR_CODES.FILE_SYSTEM,
          isExpected: false,
        },
        options
      )
    );
  }
  
  /**
   * Health check or dependency failure.
   */
  static healthCheckError(message, options = {}) {
    return new AppError(
      message,
      503,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.HEALTH_CHECK,
          code: ERROR_CODES.HEALTH_CHECK,
          logLevel: 'warn',
          isExpected: false,
        },
        options
      )
    );
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
    return new AppError(
      message,
      500,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.INITIALIZATION,
          code: ERROR_CODES.INITIALIZATION,
          logLevel: 'error',
          isExpected: false,
        },
        options
      )
    );
  }
  
  // =========================
  // Resource Errors
  // =========================

  /**
   * Requested resource not found.
   */
  static notFoundError(message, options = {}) {
    return new AppError(
      message,
      404,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.NOT_FOUND,
          code: ERROR_CODES.NOT_FOUND,
          isExpected: true,
        },
        options
      )
    );
  }

  /**
   * Conflict occurred (e.g., unique constraint violation).
   */
  static conflictError(message, options = {}) {
    return new AppError(
      message,
      409,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.CONFLICT,
          code: ERROR_CODES.CONFLICT,
          isExpected: true,
        },
        options
      )
    );
  }
  
  // =========================
  // Fallback Error
  // =========================

  /**
   * Fallback general error (unexpected exception).
   */
  static generalError(message, options = {}) {
    return new AppError(
      message,
      500,
      AppError.buildOptions(
        {
          type: ERROR_TYPES.GENERAL,
          code: ERROR_CODES.GENERAL,
          logLevel: 'error',
          isExpected: false,
        },
        options
      )
    );
  }
}

module.exports = AppError;
