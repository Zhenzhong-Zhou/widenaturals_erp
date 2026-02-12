/**
 * @file loggerHelper.js
 * @description Centralized logging utility with contextual metadata and sensitive data sanitization.
 */

const { sanitizeMessage } = require('./sensitive-data-utils');
const AppError = require('./AppError');
const { getClientIp } = require('./request-context');

let logger; // Lazy-loaded logger instance

const getLogger = () => {
  if (!logger) {
    logger = require('./logger'); // Lazy import
  }
  return logger;
};

/**
 * Extracts standardized request metadata from an Express `req` object.
 *
 * This helper is used to enrich log entries with request-level context such as
 * HTTP method, URL, IP address, user agent, and timestamp. If no `req` object
 * is provided (e.g., in system-level logs), it returns only the current timestamp.
 *
 * @param {import('express').Request|null} req - The Express request object, or `null` for system logs.
 * @returns {Object} An object containing contextual metadata:
 *   - method: HTTP method (e.g., 'GET', 'POST') or 'N/A'
 *   - url: Request URL or 'N/A'
 *   - ip: Client IP address or 'N/A'
 *   - userAgent: User-Agent header or 'N/A'
 *   - timestamp: ISO-formatted timestamp
 *
 * @example
 * const meta = extractRequestMeta(req);
 * logInfo('User login attempt', req, meta);
 */
const extractRequestMeta = (req) => {
  const timestamp = new Date().toISOString();

  if (!req) return { timestamp };

  return {
    method: req.method || 'N/A',
    url: req.originalUrl || req.url || 'N/A',
    ip: getClientIp(req),
    userAgent: req.get('user-agent') || null,
    referer: req.get('referer') || null,
    timestamp: new Date().toISOString(),
    traceId: req.traceId || 'unknown',
  };
};

/**
 * Centralized logging function with dynamic log levels and optional sanitization.
 *
 * @param {string} level - Log level (e.g., 'info', 'warn', 'error', 'debug').
 * @param {string} message - Log a message.
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
  const context = extractRequestMeta(req);

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
  let message = 'An unknown error occurred';
  let logLevel = 'error';
  let finalMeta = { ...meta };

  if (errOrMessage instanceof AppError) {
    message = errOrMessage.message || message;
    logLevel = errOrMessage.logLevel || logLevel;

    finalMeta = {
      ...errOrMessage.toLog(req), // includes stack, request info, etc.
      ...meta, // allows overrides
    };
  } else if (errOrMessage instanceof Error) {
    message = errOrMessage.message || message;
    finalMeta = {
      ...extractRequestMeta(req),
      ...meta,
      ...(process.env.NODE_ENV !== 'production'
        ? { stack: errOrMessage.stack }
        : {}),
    };
  } else if (typeof errOrMessage === 'string') {
    message = errOrMessage;
    finalMeta = {
      ...extractRequestMeta(req),
      ...meta,
    };
  }

  logWithLevel(logLevel, message, null, finalMeta); // `req` context already extracted
};

/**
 * Generates standardized metadata for system-level log entries.
 *
 * This function is intended for use in non-request-driven contexts such as
 * background jobs, database tasks, startup scripts, or system health checks.
 * It returns a consistent object structure to ensure uniform logging and
 * easier downstream processing in log aggregators.
 *
 * @returns {Object} System-level log metadata including context, timestamp, process ID, and host.
 *
 * @example
 * logInfo('Backup completed successfully', null, createSystemMeta());
 */
const createSystemMeta = () => ({
  context: 'system',
  ip: null,
  method: null,
  url: null,
  userAgent: null,
  timestamp: new Date().toISOString(),
  pid: process.pid,
  host: require('os').hostname(),
  traceId: global.traceId ?? 'system-startup',
});

module.exports = {
  logInfo,
  logDebug,
  logWarn,
  logFatal,
  logError,
  logWithLevel,
  createSystemMeta,
};
