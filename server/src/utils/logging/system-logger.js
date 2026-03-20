/**
 * @file system-logger.js
 * @description System-level logging wrappers.
 *
 * Responsibilities:
 * - Provide consistent logging for system-level events (startup, cron, infra)
 * - Ensure all logs are tagged with system context
 * - Delegate ALL error normalization to logError
 *
 * Design Principles:
 * - Thin wrappers ONLY (no logic duplication)
 * - Always inject system context (traceId: 'system')
 * - Never pass req (system ≠ request lifecycle)
 */

const {
  logInfo,
  logWarn,
  logError,
  logDebug,
  logFatal,
} = require('./logger-helper');

/**
 * Injects system-level context into metadata.
 *
 * Ensures:
 * - traceId is always "system"
 * - layer is clearly identifiable
 *
 * @param {Object} meta
 * @returns {Object}
 */
const withSystemContext = (meta = {}) => ({
  traceId: 'system',
  layer: 'system',
  ...meta,
});

/**
 * Logs missing environment variable (startup-critical).
 *
 * @param {string} varName
 * @param {Error} err
 */
const logMissingEnvVar = (varName, err) => {
  logError(err, null, withSystemContext({
    overrideMessage: `Missing environment variable: ${varName}`,
    context: 'startup',
    variable: varName,
  }));
};

/**
 * Logs system-level informational message.
 *
 * @param {string} message
 * @param {Object} meta
 */
const logSystemInfo = (message, meta = {}) => {
  logInfo(message, null, withSystemContext(meta));
};

/**
 * Logs system-level warning.
 *
 * @param {string} message
 * @param {Object} meta
 */
const logSystemWarn = (message, meta = {}) => {
  logWarn(message, null, withSystemContext(meta));
};

/**
 * Logs system-level error (non-exception).
 *
 * @param {string} message
 * @param {Object} meta
 */
const logSystemError = (message, meta = {}) => {
  logError(message, null, withSystemContext(meta));
};

/**
 * Logs system-level fatal message (no Error object).
 *
 * NOTE:
 * Use logSystemCrash if you have an Error object.
 *
 * @param {string} message
 * @param {Object} meta
 */
const logSystemFatal = (message, meta = {}) => {
  logFatal(message, null, withSystemContext(meta));
};

/**
 * Logs system exception with Error object.
 *
 * Delegates normalization to logError.
 *
 * @param {Error} error
 * @param {string} message
 * @param {Object} meta
 */
const logSystemException = (error, message, meta = {}) => {
  logError(error, null, withSystemContext({
    overrideMessage: message,
    ...meta,
  }));
};

/**
 * Logs system debug message (development / diagnostics).
 *
 * @param {string} message
 * @param {Object} meta
 */
const logSystemDebug = (message, meta = {}) => {
  logDebug(message, null, withSystemContext(meta));
};

/**
 * Logs system crash (fatal + Error object).
 *
 * Highest severity system event.
 *
 * @param {Error} error
 * @param {string} message
 * @param {Object} meta
 */
const logSystemCrash = (error, message, meta = {}) => {
  logError(error, null, withSystemContext({
    overrideMessage: message,
    crash: true,
    ...meta,
  }));
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
