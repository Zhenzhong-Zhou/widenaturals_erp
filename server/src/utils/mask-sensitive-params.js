/**
 * @file mask-sensitive-params.js
 * @description Masks sensitive data in parameters for safe logging.
 *
 * Responsibilities:
 * - Detect sensitive keys using centralized logic (isSensitiveField)
 * - Mask sensitive values safely (no PII leakage)
 * - Handle nested objects and arrays recursively
 * - Prevent crashes from unexpected input types
 *
 * Design:
 * - Uses centralized detection (sensitive-fields.js)
 * - Performs shallow + deep masking
 * - Avoids mutation (returns new object)
 */

const {
  isSensitiveField,
} = require('./sensitive-fields');

/**
 * Masks sensitive parameters for logging.
 *
 * Supports:
 * - Arrays
 * - Objects (nested)
 * - Primitive values
 *
 * @param {any} params
 * @returns {any}
 */
const maskSensitiveParams = (params) => {
  if (params === null || params === undefined) return params;
  
  return deepMask(params);
};

/**
 * Recursively masks values.
 *
 * @param {any} value
 * @returns {any}
 */
const deepMask = (value) => {
  // =========================
  // Array handling
  // =========================
  if (Array.isArray(value)) {
    return value.map(deepMask);
  }
  
  // =========================
  // Object handling
  // =========================
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => {
        // Mask entire field if sensitive
        if (isSensitiveField(key)) {
          return [key, '[REDACTED]'];
        }
        
        // Otherwise recurse
        return [key, deepMask(val)];
      })
    );
  }
  
  // =========================
  // Primitive handling
  // =========================
  return maskPrimitive(value);
};

/**
 * Masks primitive values (string-level detection).
 *
 * @param {any} val
 * @returns {any}
 */
const maskPrimitive = (val) => {
  if (typeof val !== 'string') return val;
  
  // =========================
  // Bearer token (high confidence)
  // =========================
  if (/^Bearer\s.+$/i.test(val)) {
    return '[REDACTED_TOKEN]';
  }
  
  // =========================
  // JWT (3-part base64)
  // =========================
  if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(val)) {
    return '[REDACTED_JWT]';
  }
  
  // =========================
  // Long high-entropy strings (API keys / hashes)
  // =========================
  if (val.length > 32 && /^[A-Za-z0-9+/=_-]+$/.test(val)) {
    return '[REDACTED_SECRET]';
  }
  
  return val;
};

module.exports = {
  maskSensitiveParams,
};
