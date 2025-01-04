/**
 * @file loggerHelper.js
 * @description Utility functions for centralized logging and sensitive data sanitization.
 */

const logger = require('./logger');

/**
 * Sanitizes sensitive data from messages or payloads.
 * Includes optional masking for IP addresses.
 *
 * @param {string} message - The original message to sanitize.
 * @param {boolean} [maskIp=false] - Whether to mask IP addresses.
 * @returns {string} - Sanitized message with sensitive data masked.
 */
const sanitizeMessage = (message, maskIp = false) => {
  if (!message) return message;
  
  let sanitizedMessage = message
    // Mask passwords (e.g., password=1234)
    .replace(/password=[^& ]+/g, 'password=****')
    // Mask tokens (e.g., token=abcd1234)
    .replace(/token=[^& ]+/g, 'token=****')
    // Mask email addresses (e.g., user@example.com)
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'EMAIL')
    // Mask phone numbers (e.g., 123-456-7890, (123) 456-7890)
    .replace(/(?:\+\d{1,3}[- ]?)?(?:\(\d{1,4}\)|\d{1,4})[- ]?\d{1,4}[- ]?\d{1,4}[- ]?\d{1,9}/g, 'PHONE_NUMBER');
  
  // Conditionally mask IP addresses (e.g., 192.168.1.1)
  if (maskIp) {
    sanitizedMessage = sanitizedMessage.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'IP_ADDRESS');
  }
  
  return sanitizedMessage;
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
const logWithLevel = (level, message, req = null, meta = {}, sanitize = false, maskIp = false) => {
  const sanitizedMessage = sanitize ? sanitizeMessage(message, maskIp) : message;
  
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
  
  // Log the message with context
  logger.log({ level, message: sanitizedMessage, ...context });
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
 * Includes stack trace in development and sanitized messages in production.
 *
 * @param {Error} err - The error object to log.
 * @param {Object} [req=null] - Optional Express request object for context.
 * @param {Object} [meta={}] - Additional metadata to include in the log.
 */
const logError = (err, req = null, meta = {}) => {
  const message = err.message || 'An unknown error occurred';
  
  logWithLevel(
    'error',
    message,
    req,
    { stack: process.env.NODE_ENV === 'production' ? undefined : err.stack, ...meta },
    true // Always sanitize error messages
  );
};

module.exports = { logInfo, logDebug, logWarn, logFatal, logError, logWithLevel, sanitizeMessage };
