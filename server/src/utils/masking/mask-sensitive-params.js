/**
 * @file mask-sensitive-params.js
 * @description Safely masks sensitive data for logging.
 *
 * Responsibilities:
 * - Detect sensitive keys via `isSensitiveField`
 * - Mask sensitive values to prevent PII leakage
 * - Recursively traverse arrays and plain objects
 * - Handle circular references safely
 * - Enforce max recursion depth to prevent performance issues
 *
 * Design principles:
 * - Non-throwing (logging must never break execution)
 * - Immutable (returns new structures)
 * - Strict traversal (plain objects only)
 */

const { isSensitiveField } = require('./sensitive-fields');

// Compiled once at module load — avoids per-call regex instantiation
const BEARER_RE = /^Bearer\s.+$/i;
const JWT_RE    = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
const SECRET_RE = /^[A-Za-z0-9+/=_-]+$/;

/**
 * Returns true only for plain object literals (`{}`).
 * Rejects null, arrays, class instances, Maps, Sets, Dates, etc.
 *
 * @param {*} val
 * @returns {boolean}
 */
const isPlainObject = (val) =>
  val !== null &&
  typeof val === 'object' &&
  !Array.isArray(val) &&
  Object.getPrototypeOf(val) === Object.prototype;

/**
 * Masks sensitive primitive values using pattern-based heuristics.
 * Non-string values are returned as-is.
 *
 * Detected patterns (in priority order):
 * - Bearer tokens                         → '[REDACTED_TOKEN]'
 * - JWTs (3-part base64url)               → '[REDACTED_JWT]'
 * - High-entropy strings >32 chars        → '[REDACTED_SECRET]'
 *
 * @param {*} val
 * @returns {*} Original value or a '[REDACTED_*]' sentinel string.
 */
const maskPrimitive = (val) => {
  if (typeof val !== 'string')
    return val;
  if (BEARER_RE.test(val))
    return '[REDACTED_TOKEN]';
  if (JWT_RE.test(val))
    return '[REDACTED_JWT]';
  if (val.length > 32 && SECRET_RE.test(val))
    return '[REDACTED_SECRET]';
  return val;
};

/**
 * Recursively masks sensitive fields and primitives in a value.
 *
 * Behavior:
 * - Arrays: recursively processed
 * - Plain objects: keys checked via `isSensitiveField`; sensitive → '[REDACTED]'
 * - Primitives: passed through `maskPrimitive`
 * - Non-plain objects (Date, Buffer, etc.): treated as primitives
 *
 * Safety:
 * - Circular references  → '[Circular]'  (via WeakSet)
 * - Depth exceeded       → '[MaxDepth]'  (never throws)
 *
 * @param {*}      value
 * @param {Object} ctx
 * @param {number} ctx.depth
 * @param {number} ctx.maxDepth
 * @param {WeakSet<object>} ctx.seen
 * @returns {*}
 */
const deepMask = (value, ctx) => {
  const { depth, maxDepth, seen } = ctx;
  
  if (depth > maxDepth) return '[MaxDepth]';
  
  // Primitives and null — fast exit before object-specific checks
  if (value == null || typeof value !== 'object') return maskPrimitive(value);
  
  // Circular reference guard — must come before any recursion
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  
  // Arrays — preserve structure, recurse into each element
  if (Array.isArray(value)) {
    return value.map((el) => deepMask(el, { depth: depth + 1, maxDepth, seen }));
  }
  
  // Plain objects only — skips class instances, Maps, Sets, Dates, etc.
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) =>
        isSensitiveField(key)
          ? [key, '[REDACTED]']
          : [key, deepMask(val, { depth: depth + 1, maxDepth, seen })]
      )
    );
  }
  
  // Non-plain objects (class instances, Buffers, etc.)
  return maskPrimitive(value);
};

/**
 * Public entry point. Masks sensitive parameters for safe logging.
 *
 * @param {*}      params
 * @param {Object} [options]
 * @param {number} [options.maxDepth=6] - Max traversal depth before truncating with '[MaxDepth]'.
 * @returns {*} Masked copy of `params`. Never throws.
 */
const maskSensitiveParams = (params, options = {}) => {
  const { maxDepth = 6 } = options;
  return deepMask(params, { depth: 0, maxDepth, seen: new WeakSet() });
};

module.exports = {
  maskSensitiveParams,
};
