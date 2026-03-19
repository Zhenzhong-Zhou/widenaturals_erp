/**
 * @file logger-helper.js
 * @description Centralized logging utility for structured, safe, and consistent logging.
 *
 * Responsibilities:
 * - Normalize log payloads (message + metadata)
 * - Handle AppError, native Error, and plain messages
 * - Enrich logs with request/system context
 * - Sanitize + limit metadata (single pipeline)
 * - Delegate final output to infra logger
 *
 * Architecture:
 * - logWithLevel → core emitter (fast, no business logic)
 * - logError     → centralized error intelligence
 * - wrappers     → thin convenience helpers
 *
 * Design Principles:
 * - Single responsibility per function
 * - Zero circular dependency risk (lazy logger load)
 * - Safe-by-default logging (no unsafe objects / oversized payloads)
 */

const { LOG_LEVELS } = require('./constants/log-constants');
const { sanitizeMessage } = require('./sanitize-message');
const AppError = require('./AppError');
const { extractRequestContext } = require('./request-context');
const { sanitizeAndLimitMeta } = require('./logging/sanitize-meta');

let logger;

/**
 * Lazy-load logger instance to avoid circular dependency.
 * @returns {import('winston').Logger}
 */
const getLogger = () => {
  if (!logger) {
    logger = require('./logger');
  }
  return logger;
};

/**
 * Maps log level → business severity.
 * Used for observability systems (Datadog, ELK, etc.)
 */
const SEVERITY_MAP = {
  fatal: 'critical',
  error: 'high',
  warn: 'medium',
  info: 'low',
  debug: 'low',
};

/**
 * Safely stringify objects (handles circular refs).
 *
 * NOTE:
 * Only used when message is not a string.
 *
 * @param {any} value
 * @returns {string}
 */
const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return '[Unserializable message]';
  }
};

/**
 * Core logging engine (transport bridge).
 *
 * Responsibilities:
 * - Validate level
 * - Normalize message
 * - Sanitize + limit metadata (single pipeline)
 * - Emit final payload to Winston
 *
 * @param {string} level
 * @param {string|Object} message
 * @param {Object} meta
 * @param {boolean} sanitizeMessageFlag
 */
const logWithLevel = (level, message, meta = {}, sanitizeMessageFlag = false) => {
  // Enforce valid level (fail-safe)
  if (!LOG_LEVELS.includes(level)) {
    level = 'error';
  }
  
  // Remove reserved fields (prevent conflicts)
  const { severity: _ignored, ...cleanMeta } = meta || {};
  
  // Single pipeline (fast + predictable)
  const safeMeta = sanitizeAndLimitMeta(cleanMeta);
  
  // Normalize message (cheap path first)
  let normalizedMessage;
  if (typeof message === 'string') {
    normalizedMessage = sanitizeMessageFlag
      ? sanitizeMessage(message)
      : message;
  } else {
    normalizedMessage = safeStringify(message);
  }
  
  const payload = {
    level,
    severity: SEVERITY_MAP[level] || 'low',
    message: normalizedMessage,
    meta: safeMeta,
  };
  
  // Optional debug visibility (dev only)
  if (process.env.DEBUG_LOGS === 'true') {
    console.debug('[Logger Payload]', safeStringify(payload));
  }
  
  // Transport (isolated)
  try {
    getLogger().log(payload);
  } catch (err) {
    // Never throw from logger
    console.error('[Logger Fallback]', {
      error: err.message,
      payload,
    });
  }
};

/**
 * Centralized error logger.
 *
 * Handles:
 * - AppError → structured + rich metadata
 * - Error → normalized safe structure
 * - string → fallback
 *
 * @param {string|Error|AppError} errOrMessage
 * @param {Object|null} req
 * @param {Object} meta
 */
const logError = (errOrMessage, req = null, meta = {}) => {
  const requestContext = extractRequestContext(req);
  
  let message = 'An unknown error occurred';
  let logLevel = 'error';
  let finalMeta;
  
  const { overrideMessage, ...cleanMeta } = meta || {};
  
  // =========================
  // AppError (rich domain error)
  // =========================
  if (errOrMessage instanceof AppError) {
    message = overrideMessage || errOrMessage.message || message;
    logLevel = errOrMessage.logLevel || logLevel;
    
    finalMeta = errOrMessage.toLog({
      ...requestContext,
      ...cleanMeta,
    });
  }
    
    // =========================
    // Native Error
  // =========================
  else if (errOrMessage instanceof Error) {
    message = overrideMessage || errOrMessage.message || message;
    
    finalMeta = {
      ...requestContext,
      ...cleanMeta,
      errorName: errOrMessage.name,
      errorMessage: errOrMessage.message,
      ...(process.env.NODE_ENV !== 'production'
        ? { stack: errOrMessage.stack }
        : {}),
    };
  }
    
    // =========================
    // Plain message fallback
  // =========================
  else {
    message = overrideMessage || String(errOrMessage);
    
    finalMeta = {
      ...requestContext,
      ...cleanMeta,
    };
  }
  
  logWithLevel(logLevel, message, finalMeta);
};

// ============================================================
// Thin wrappers (no logic)
// ============================================================

/**
 * Attach request context to metadata.
 */
const withContext = (req, meta) => ({
  ...extractRequestContext(req),
  ...meta,
});

const logInfo = (message, req = null, meta = {}) =>
  logWithLevel('info', message, withContext(req, meta));

const logWarn = (message, req = null, meta = {}) =>
  logWithLevel('warn', message, withContext(req, meta));

const logDebug = (message, req = null, meta = {}) =>
  logWithLevel('debug', message, withContext(req, meta));

const logFatal = (message, req = null, meta = {}) =>
  logWithLevel('fatal', message, withContext(req, meta));

module.exports = {
  logInfo,
  logWarn,
  logDebug,
  logFatal,
  logError,
  logWithLevel,
};
