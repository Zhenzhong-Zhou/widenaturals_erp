const AppError = require('../AppError');
const { ERROR_TYPES, ERROR_CODES } = require('../constants/error-constants');

/**
 * Normalizes any error into a consistent AppError instance.
 *
 * Guarantees:
 * - All errors conform to AppError structure
 * - Existing AppErrors are enriched in-place (no re-instantiation)
 * - Metadata is sanitized and bounded for safe logging
 * - Unknown errors are safely wrapped without leaking sensitive data
 *
 * Design:
 * - Single normalization entry point across all layers
 * - Logging-safe by default (bounded meta)
 * - Debug-safe via optional `exposeDetails`
 *
 * @param {Error|AppError} error
 * @param {Object} [options]
 * @param {string} [options.message]
 * @param {string} [options.type]
 * @param {string} [options.code]
 * @param {number} [options.status]
 * @param {boolean} [options.isExpected]
 * @param {string} [options.logLevel]
 * @param {string} [options.context]
 * @param {Object} [options.meta]
 * @param {Object} [options.details]
 * @param {boolean} [options.exposeDetails=false]
 *
 * @returns {AppError}
 */
const normalizeAppError = (
  error,
  {
    message = 'Internal error. Please try again later.',
    type = ERROR_TYPES.INTERNAL,
    code = ERROR_CODES.INTERNAL,
    status = 500,
    isExpected = false,
    logLevel = 'error',
    context,
    meta = {},
    details = {},
    exposeDetails = false,
  } = {}
) => {
  //------------------------------------------------------------
  // Case 1: Already AppError → enrich IN PLACE
  //------------------------------------------------------------
  if (error instanceof AppError) {
    // Preserve original context if already set
    if (!error.context && context) {
      error.context = context;
    }
    
    // Always sanitize + bound meta
    error.meta = {
      ...(error.meta || {}),
      ...(meta || {}),
    };
    
    // Details: only sanitize if exposed
    if (exposeDetails) {
      error.details = {
        ...(error.details || {}),
        ...(details || {}),
      };
      error.exposeDetails = true;
    }
    
    return error;
  }
  
  //------------------------------------------------------------
  // Case 2: Unknown error → wrap into AppError
  //------------------------------------------------------------
  return new AppError(message, status, {
    type,
    code,
    isExpected,
    logLevel,
    context,
    
    // Always safe for logs
    meta: {
      originalErrorMessage: error?.message,
      originalErrorName: error?.name,
      ...(meta || {}),
    },
    
    // Only include details when explicitly allowed
    ...(exposeDetails && {
      details: details || {},
      exposeDetails: true,
    }),
  });
};

module.exports = {
  normalizeAppError,
};
