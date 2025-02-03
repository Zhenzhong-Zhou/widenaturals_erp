/**
 * @file loggerHelper.js
 * @description Centralized logging utility with contextual metadata and sensitive data sanitization.
 */

const { sanitizeMessage } = require('./sensitive-data-utils');
const AppError = require('./AppError');

let logger; // Lazy-loaded logger instance

const getLogger = () => {
  if (!logger) {
    logger = require('./logger'); // Lazy import
  }
  return logger;
};

/**
 * Centralized logging function with dynamic log levels and optional sanitization.
 *
 * @param {string} level - Log level (e.g., 'info', 'warn', 'error', 'debug').
 * @param {string} message - Log message.
 * @param {Object} [req=null] - Optional Express request object for context.
 * @param {Object} [meta={}] - Additional metadata.
 * @param {boolean} [sanitize=false] - Whether to sanitize the message.
 */
const logWithLevel = (
  level,
  message,
  req = null,
  meta = {},
  sanitize = false
) => {
  // Sanitize the message if requested
  const sanitizedMessage =
    sanitize && typeof message === 'string'
      ? sanitizeMessage(message)
      : typeof message === 'string'
        ? message
        : JSON.stringify(message);
  
  // Safely extract context from the request object if available
  const context = req
    ? {
      method: req?.method || 'N/A',
      url: req?.originalUrl || req?.url || 'N/A',
      ip: req?.ip || 'N/A',
      userAgent: req?.headers?.['user-agent'] || 'N/A',
      timestamp: new Date().toISOString(),
    }
    : {
      timestamp: new Date().toISOString(),
    };
  
  // Combine context and meta into a single `meta` object
  const logPayload = {
    level,
    message: sanitizedMessage,
    meta: {
      ...context,
      ...meta,
    },
  };
  
  // Debug final payload (useful for development)
  if (process.env.NODE_ENV !== 'production') {
    console.debug('Final Log Payload:', JSON.stringify(logPayload, null, 2));
  }
  
  // Log the structured message
  getLogger().log(logPayload);
};

// Individual log level wrappers
const logInfo = (message, req = null, meta = {}) =>
  logWithLevel('info', message, req, meta);
const logDebug = (message, req = null, meta = {}) =>
  logWithLevel('debug', message, req, meta);
const logWarn = (message, req = null, meta = {}) =>
  logWithLevel('warn', message, req, meta);
const logFatal = (message, req = null, meta = {}) =>
  logWithLevel('fatal', message, req, meta);

/**
 * Logs error messages with support for `Error` and `AppError` types.
 *
 * @param {string|Error|AppError} errOrMessage - The error object or message to log.
 * @param {Object} [req=null] - Optional Express request object for context.
 * @param {Object} [meta={}] - Additional metadata.
 */
const logError = (errOrMessage, req = null, meta = {}) => {
  let message, stack, logLevel, errorMeta;

  if (errOrMessage instanceof AppError) {
    message = errOrMessage.message || 'An unknown error occurred';
    stack =
      process.env.NODE_ENV !== 'production' ? errOrMessage.stack : undefined;
    logLevel = errOrMessage.logLevel || 'error';
    errorMeta = {
      status: errOrMessage.status,
      type: errOrMessage.type,
      code: errOrMessage.code,
      isExpected: errOrMessage.isExpected,
      details: errOrMessage.details || null,
    };
  } else if (errOrMessage instanceof Error) {
    message = errOrMessage.message || 'An unknown error occurred';
    stack =
      process.env.NODE_ENV !== 'production' ? errOrMessage.stack : undefined;
    logLevel = 'error';
    errorMeta = {};
  } else {
    message = errOrMessage;
    stack = undefined;
    logLevel = 'error';
    errorMeta = {};
  }

  // Extract metadata from the request object
  const reqMeta = req
    ? {
        method: req?.method || 'Unknown',
        route: req?.originalUrl || req?.url || 'Unknown',
        userAgent: req?.headers?.['user-agent'] || 'Unknown',
        ip: req?.ip || 'Unknown',
        timestamp: new Date().toISOString(),
      }
    : {};

  // Merge all metadata
  const combinedMeta = { ...errorMeta, ...meta, ...reqMeta, stack };

  // Pass to the logging function
  logWithLevel(logLevel, message, null, combinedMeta);
};

module.exports = {
  logInfo,
  logDebug,
  logWarn,
  logFatal,
  logError,
  logWithLevel,
};
