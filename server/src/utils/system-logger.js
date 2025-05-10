const { logInfo, logWarn, logError, logDebug, logFatal } = require('./logger-helper');
const { createSystemMeta } = require('./logger-helper');

/**
 * Logs a critical error when an expected environment variable is missing.
 * Designed for use during startup or configuration validation stages.
 *
 * This function uses structured system-level metadata and includes the variable
 * name, error message, stack trace (only in non-production), and a startup context.
 *
 * @param {string} varName - The name of the missing environment variable.
 * @param {Error} err - The error object describing the failure.
 *
 * @example
 * if (!process.env.DB_URL) {
 *   const error = new Error('DB_URL is required but not set');
 *   logMissingEnvVar('DB_URL', error);
 *   process.exit(1);
 * }
 */
const logMissingEnvVar = (varName, err) => {
  logError(`Missing environment variable: ${varName}`, null, {
    ...createSystemMeta(),
    errorMessage: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    severity: 'critical',
    context: 'startup',
    variable: varName,
  });
};

/**
 * Logs a system-level info message.
 * @param {string} message
 * @param {Object} [extraMeta={}]
 */
const logSystemInfo = (message, extraMeta = {}) => {
  logInfo(message, null, { ...createSystemMeta(), ...extraMeta });
};

/**
 * Logs a system-level warning.
 * @param {string} message
 * @param {Object} [extraMeta={}]
 */
const logSystemWarn = (message, extraMeta = {}) => {
  logWarn(message, null, { ...createSystemMeta(), ...extraMeta });
};

/**
 * Logs a system-level error.
 * @param {string} message
 * @param {Object} [extraMeta={}]
 */
const logSystemError = (message, extraMeta = {}) => {
  logError(message, null, { ...createSystemMeta(), ...extraMeta });
};

/**
 * Logs a fatal system-level event with standardized system metadata.
 *
 * Intended for use in critical, non-recoverable situations such as startup failure,
 * shutdown failure, or corrupted state, especially when no exception object is involved.
 *
 * @param {string} message - A descriptive message for the fatal event.
 * @param {Object} [extraMeta={}] - Optional additional structured metadata.
 *
 * @example
 * logSystemFatal('Failed to bind to port. Shutting down.', { port: 3000 });
 */
const logSystemFatal = (message, extraMeta = {}) => {
  logFatal(message, null, { ...createSystemMeta(), ...extraMeta });
};

/**
 * Logs a caught exception with system-level context and stack trace.
 *
 * @param {Error} error - The error object to extract message/stack from.
 * @param {string} message - A descriptive log message.
 * @param {Object} [extraMeta={}] - Optional structured metadata.
 */
const logSystemException = (error, message, extraMeta = {}) => {
  logSystemError(message, {
    errorMessage: error.message,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    ...extraMeta,
  });
};

/**
 * Logs a system-level debug message.
 * @param {string} message
 * @param {Object} [extraMeta={}]
 */
const logSystemDebug = (message, extraMeta = {}) => {
  logDebug(message, null, { ...createSystemMeta(), ...extraMeta });
};

/**
 * Logs a fatal system exception with full error details and stack trace.
 *
 * This is used for logging unrecoverable errors where an `Error` object is present,
 * such as during application initialization, shutdown failure, or infrastructure-level
 * crashes. It includes the error message and stack (if not in production).
 *
 * @param {Error} error - The caught error object.
 * @param {string} message - A descriptive message of what failed.
 * @param {Object} [extraMeta={}] - Optional structured metadata like context, severity, etc.
 *
 * @example
 * try {
 *   await startServer();
 * } catch (error) {
 *   logSystemCrash(error, 'Server failed to start', { context: 'startup' });
 * }
 */
const logSystemCrash = (error, message, extraMeta = {}) => {
  logSystemFatal(message, {
    errorMessage: error.message,
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    ...extraMeta,
  });
};

module.exports = {
  logMissingEnvVar,
  logSystemInfo,
  logSystemWarn,
  logSystemError,
  logSystemFatal,
  logSystemException,
  logSystemDebug,
  logSystemCrash,
};
