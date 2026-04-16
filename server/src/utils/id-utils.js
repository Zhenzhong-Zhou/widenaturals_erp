/**
 * @file id-utils.js
 * @description
 * Identity and trace ID utilities.
 *
 * Provides UUID validation and trace ID generation for request tracing,
 * transaction tracking, and job correlation across the application.
 */

'use strict';

const { randomUUID } = require('crypto');

// Compiled once at module load — reused across all isUUID calls
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Generates a unique trace ID with an optional prefix and embedded timestamp.
 *
 * Format: `{prefix}-{YYYYMMDDHHMMSS}-{8-char-random}`
 * Example: `trace-20240509123000-abc123ef`, `tx-20240509123000-abc123ef`
 *
 * Suitable for HTTP request tracing, DB transaction IDs, and background jobs.
 * Pass a contextual prefix to distinguish trace ID origin in logs.
 *
 * @param {string} [prefix='trace'] - Prefix identifying the trace context (e.g. 'tx', 'job', 'req')
 * @returns {string} Unique trace ID string
 */
const generateTraceId = (prefix = 'trace') => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14); // YYYYMMDDHHMMSS
  const random = randomUUID().replace(/-/g, '').substring(0, 8);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Returns true if the value is a valid RFC 4122 UUID string.
 *
 * @param {*} value
 * @returns {boolean}
 */
const isUUID = (value) => {
  if (typeof value !== 'string') return false;
  return UUID_RE.test(value);
};

module.exports = {
  generateTraceId,
  isUUID,
  UUID_RE,
};
