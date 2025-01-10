/**
 * @file loggerHelper.js
 * @description Utility functions for centralized logging and sensitive data sanitization.
 */
const { sanitizeMessage } = require('./sensitive-data-utils');
const AppError = require('./app-error');

let logger; // Lazy-loaded logger instance

const getLogger = () => {
  if (!logger) {
    logger = require('./logger'); // Lazy import
  }
  return logger;
};

/**
 * Centralized logger function with log level control.
 * Includes optional sanitization of messages and contextual metadata.
 *
 * @param {string} level - The log level (e.g., 'info', 'error', 'debug', 'warn', 'fatal').
 * @param {string} message - The log message to record.
 * @param {Object} [req=null] - Optional Express request object for contextual data.
 * @param {Object} [meta={}] - Additional metadata to include in the log.
 * @param {boolean} [sanitize=false] - Whether to sanitize the message.
 * @param {boolean} [maskIp=false] - Whether to mask IP addresses in the message.
 */
const logWithLevel = (
  level,
  message,
  req = null,
  meta = {},
  sanitize = false,
  maskIp = false
) => {
  const sanitizedMessage = sanitize
    ? sanitizeMessage(message, maskIp)
    : message;

  // Construct context data from request object or use provided metadata
  const context = req
    ? {
      method: req.method || 'N/A',
      url: req.originalUrl || 'N/A',
      ip: maskIp ? '***.***.***.***' : req.ip || 'N/A',
      userAgent: req.headers?.['user-agent'] || 'N/A',
      ...meta,
    }
    : meta;
  
  getLogger().log({ level, message: sanitizedMessage, ...context });
};

/**
 * Logs informational messages.
 * Adds request-related details if provided.
 *
 * @param {string} message - The informational message to log.
 * @param {Object} [req=null] - Optional Express request object for context.
 * @param {Object} [meta={}] - Additional metadata to include in the log.
 */
const logInfo = (message, req = null, meta = {}) => {
  logWithLevel('info', message, req, meta);
};

/**
 * Logs debug messages.
 * Useful for tracing application behavior in development.
 *
 * @param {string} message - The debug message to log.
 * @param {Object} [req=null] - Optional Express request object for context.
 * @param {Object} [meta={}] - Additional metadata to include in the log.
 */
const logDebug = (message, req = null, meta = {}) => {
  logWithLevel('debug', message, req, meta);
};

/**
 * Logs warning messages.
 * Highlights non-critical issues or potential problems.
 *
 * @param {string} message - The warning message to log.
 * @param {Object} [req=null] - Optional Express request object for context.
 * @param {Object} [meta={}] - Additional metadata to include in the log.
 */
const logWarn = (message, req = null, meta = {}) => {
  logWithLevel('warn', message, req, meta);
};

/**
 * Logs fatal error messages.
 * Represents critical issues requiring immediate attention.
 *
 * @param {string} message - The fatal error message to log.
 * @param {Object} [req=null] - Optional Express request object for context.
 * @param {Object} [meta={}] - Additional metadata to include in the log.
 */
const logFatal = (message, req = null, meta = {}) => {
  logWithLevel('fatal', message, req, meta);
};

/**
 * Logs error messages conditionally based on the environment.
 * Supports both error objects and string messages.
 * Includes stack trace in development and sanitized messages in production.
 *
 * @param {string|Error} errOrMessage - The error object or message to log.
 * @param {Object} [req=null] - Optional Express request object for context.
 * @param {Object} [meta={}] - Additional metadata to include in the log.
 */
const logError = (errOrMessage, req = null, meta = {}) => {
  let message, stack, logLevel, errorMeta;
  
  if (errOrMessage instanceof AppError) {
    // Handle AppError
    message = errOrMessage.message || 'An unknown error occurred';
    stack = process.env.NODE_ENV !== 'production' ? errOrMessage.stack : undefined;
    logLevel = errOrMessage.logLevel || 'error';
    errorMeta = {
      status: errOrMessage.status,
      type: errOrMessage.type,
      code: errOrMessage.code,
      isExpected: errOrMessage.isExpected,
    };
  } else if (errOrMessage instanceof Error) {
    // Handle standard Error
    message = errOrMessage.message || 'An unknown error occurred';
    stack = process.env.NODE_ENV !== 'production' ? errOrMessage.stack : undefined;
    logLevel = 'error';
    errorMeta = {};
  } else {
    // Handle string messages
    message = errOrMessage;
    stack = undefined;
    logLevel = 'error';
    errorMeta = {};
  }
  
  // Merge additional metadata
  const combinedMeta = { ...errorMeta, ...meta, stack };
  
  // Log the error with the appropriate level
  logWithLevel(logLevel, message, req, combinedMeta, true);
};

module.exports = {
  logInfo,
  logDebug,
  logWarn,
  logFatal,
  logError,
  logWithLevel,
  sanitizeMessage,
};
