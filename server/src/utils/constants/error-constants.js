/**
 * @file error-constants.js
 * @description
 * Centralized definitions for application error taxonomy.
 *
 * This module defines a multi-layer error classification system:
 *
 * 1. ERROR_TYPES (Category Layer)
 *    - High-level classification of errors
 *    - Used for logging, grouping, and observability
 *    - Examples: ValidationError, DatabaseError, AuthorizationError
 *
 * 2. ERROR_CODES (Domain Layer)
 *    - Application-level, stable error codes
 *    - Used for frontend handling and API responses
 *    - Examples: VALIDATION_ERROR, RESOURCE_NOT_FOUND
 *
 * 3. POSTGRES_ERROR_CODES (Infrastructure Layer)
 *    - Raw database error codes returned by PostgreSQL
 *    - Used internally for mapping DB errors
 *
 * 4. DB_ERROR_CODES (Application DB Mapping Layer)
 *    - Normalized database error identifiers
 *    - Maps raw DB errors to application-readable codes
 *
 * Architecture Flow:
 *
 * PostgreSQL Error → POSTGRES_ERROR_CODES
 *                  → DB_ERROR_CODES
 *                  → ERROR_CODES + ERROR_TYPES
 *                  → AppError → API Response / Logs
 *
 * Design Principles:
 * - All errors must use predefined constants (no magic strings)
 * - ERROR_CODES must be stable for frontend compatibility
 * - ERROR_TYPES are used for categorization and logging
 * - Database errors must be normalized before exposure
 *
 * Example:
 *
 * if (err.code === POSTGRES_ERROR_CODES.UNIQUE_VIOLATION) {
 *   throw AppError.conflictError('Duplicate record', {
 *     code: ERROR_CODES.CONFLICT,
 *   });
 * }
 */

// =========================
// Error Types (HIGH LEVEL)
// =========================

// High-level error categories used for classification and logging
const ERROR_TYPES = {
  AUTHORIZATION: 'AuthorizationError',
  ACCOUNT_LOCKED: 'AccountLockedError',
  SESSION_EXPIRED: 'SessionExpiredError',
  ACCESS_TOKEN_EXPIRED: 'AccessTokenExpiredError',
  ACCESS_TOKEN: 'AccessTokenError',
  REFRESH_TOKEN_EXPIRED: 'RefreshTokenExpiredError',
  REFRESH_TOKEN: 'RefreshTokenError',
  TOKEN_REVOKED: 'TokenRevokedError',
  AUTHENTICATION: 'AuthenticationError',
  VALIDATION: 'ValidationError',
  HASH: 'HashError',
  RATE_LIMIT: 'RateLimitError',
  CSRF: 'CSRFError',
  CORS: 'CORSError',
  HELMET: 'HelmetError',
  SANITIZATION: 'SanitizationError',
  SERVICE: 'ServiceError',
  EXTERNAL_SERVICE: 'ExternalServiceError',
  DATABASE: 'DatabaseError',
  BUSINESS: 'BusinessLogicError',
  CONTROLLER: 'ControllerError',
  TRANSFORMER: 'TransformerError',
  FILE_UPLOAD: 'FileUploadError',
  FILE_SYSTEM: 'FileSystemError',
  HEALTH_CHECK: 'HealthCheckError',
  NOT_FOUND: 'NotFoundError',
  CONFLICT: 'ConflictError',
  INITIALIZATION: 'InitializationError',
  GENERAL: 'GeneralError',
  INTERNAL: 'InternalError',
  SYSTEM: 'SystemError',
};

// =========================
// Error Codes (DOMAIN LEVEL)
// =========================

// Stable application error codes used in API responses
const ERROR_CODES = {
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  ACCESS_TOKEN_EXPIRED: 'ACCESS_TOKEN_EXPIRED',
  ACCESS_TOKEN_MISSING: 'ACCESS_TOKEN_MISSING',
  ACCESS_TOKEN_INVALID: 'ACCESS_TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_MISSING: 'REFRESH_TOKEN_MISSING',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  HASH: 'HASH_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  CSRF: 'CSRF_ERROR',
  CORS: 'CORS_ERROR',
  HELMET: 'HELMET_ERROR',
  SANITIZATION: 'SANITIZATION_ERROR',
  SERVICE: 'SERVICE_ERROR',
  EXTERNAL_SERVICE: 'EXTERNAL_SERVICE_ERROR',
  DATABASE: 'DATABASE_ERROR',
  BUSINESS: 'BUSINESS_LOGIC_ERROR',
  CONTROLLER: 'CONTROLLER_ERROR',
  TRANSFORMER: 'TRANSFORMER_ERROR',
  FILE_UPLOAD: 'FILE_UPLOAD_ERROR',
  FILE_SYSTEM: 'FILE_SYSTEM_ERROR',
  HEALTH_CHECK: 'HEALTH_CHECK_FAILURE',
  NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT_ERROR',
  INITIALIZATION: 'INIT_FAILURE',
  GENERAL: 'GENERAL_ERROR',
  INTERNAL: 'INTERNAL_ERROR',
  PROCESS_EXECUTION_FAILED: 'PROCESS_EXECUTION_FAILED',
  PROCESS_SPAWN_FAILED: 'PROCESS_SPAWN_FAILED',
  PROCESS_TIMEOUT: 'PROCESS_TIMEOUT',
  SYSTEM: 'SYSTEM_ERROR',
  BACKUP_FAILED: 'BACKUP_FAILED',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
};

// =========================
// Postgres Error Codes (INFRA LEVEL)
// =========================

// Raw PostgreSQL error codes (infra-level, do not expose directly)
const POSTGRES_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  VALUE_TOO_LONG: '22001',
  INVALID_INPUT_FORMAT: '22P02',
  SERIALIZATION_FAILURE: '40001',
  DEADLOCK_DETECTED: '40P01',
};

// =========================
// App DB Error Mapping Codes (APP LEVEL)
// =========================

// Normalized database error codes used within application logic
const DB_ERROR_CODES = {
  UNIQUE_VIOLATION: 'UNIQUE_VIOLATION',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  NOT_NULL_VIOLATION: 'NOT_NULL_VIOLATION',
  VALUE_TOO_LONG: 'VALUE_TOO_LONG',
  INVALID_INPUT_FORMAT: 'INVALID_INPUT_FORMAT',
  SERIALIZATION_FAILURE: 'SERIALIZATION_FAILURE',
  DEADLOCK_DETECTED: 'DEADLOCK_DETECTED',
  UNKNOWN_DB_ERROR: 'UNKNOWN_DB_ERROR',
};

module.exports = {
  ERROR_TYPES,
  ERROR_CODES,
  POSTGRES_ERROR_CODES,
  DB_ERROR_CODES,
};
