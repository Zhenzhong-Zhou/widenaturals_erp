/**
 * @file sanitize-meta.js
 * @description High-performance, single-pass metadata sanitizer for logging.
 *
 * RESPONSIBILITIES:
 * - Prevent circular references
 * - Limit object depth, keys, and array length
 * - Normalize special types (Error, Date, Buffer, BigInt)
 * - Truncate large strings
 * - Remove unsafe objects (req/res/streams)
 *
 * DESIGN PRINCIPLES:
 * - Single traversal (O(N))
 * - No JSON.stringify (avoid CPU overhead)
 * - Conservative unsafe detection (avoid data loss)
 * - Safe for high-throughput logging (ERP scale)
 *
 * USAGE:
 * - Always run before sending meta to logger transport
 */

const http = require('http');
const { isSensitiveField } = require('../masking/sensitive-fields');

// =========================
// Configuration
// =========================
const MAX_DEPTH = 5;
const MAX_KEYS = 50;
const MAX_ARRAY_LENGTH = 50;
const MAX_STRING_LENGTH = 500;

// =========================
// Utility helpers
// =========================

/**
 * Truncate long strings to prevent log bloat.
 *
 * @param {string} str
 * @returns {string}
 */
const truncateString = (str) => {
  if (typeof str !== 'string') return str;
  if (str.length <= MAX_STRING_LENGTH) return str;
  
  return `${str.slice(0, MAX_STRING_LENGTH)}...[truncated]`;
};

// =========================
// Unsafe object detection
// =========================

/**
 * Determines whether a value is unsafe for logging.
 *
 * BLOCKS:
 * - Express request/response
 * - Streams / sockets
 * - Functions / Promises
 *
 * DESIGN:
 * - Explicit detection (avoid false positives)
 * - Avoid Node private internals (unstable)
 *
 * @param {*} value
 * @returns {boolean}
 */
const isUnsafeObject = (value) => {
  if (!value || typeof value !== 'object') return false;
  
  // Functions & Promises
  if (typeof value === 'function') return true;
  if (value instanceof Promise) return true;
  
  // Express / HTTP objects
  if (
    value instanceof http.IncomingMessage ||
    value instanceof http.ServerResponse
  ) {
    return true;
  }
  
  // Stream detection (safe pattern)
  if (
    typeof value.pipe === 'function' &&
    typeof value.on === 'function'
  ) {
    return true;
  }
  
  // Low-level sockets (constructor-based detection)
  const name = value.constructor?.name;
  return name === 'Socket' || name === 'TLSSocket';
};

// =========================
// Main sanitizer
// =========================

/**
 * Sanitizes metadata for safe logging.
 *
 * Guarantees:
 * - No circular references
 * - No unsafe objects
 * - Bounded object size
 * - JSON-safe output
 *
 * @param {any} input - Raw metadata input
 * @param {number} [depth=0] - Current recursion depth
 * @param {WeakSet<object>} [seen=new WeakSet()] - Circular reference tracker
 * @returns {any} Sanitized, log-safe metadata
 */
const sanitizeAndLimitMeta = (
  input,
  depth = 0,
  seen = new WeakSet()
) => {
  // =========================
  // Primitive handling (fast path)
  // =========================
  if (input === null || typeof input !== 'object') {
    if (typeof input === 'bigint') return input.toString(); // JSON-safe
    if (typeof input === 'string') return truncateString(input);
    return input;
  }
  
  // =========================
  // Circular reference protection
  // =========================
  if (seen.has(input)) return '[Circular]';
  seen.add(input);
  
  // =========================
  // Depth limiting
  // =========================
  if (depth >= MAX_DEPTH) {
    return '[MaxDepthExceeded]';
  }
  
  // =========================
  // Special object normalization
  // =========================
  if (input instanceof Date) {
    return input.toISOString();
  }
  
  if (input instanceof Error) {
    return {
      name: input.name,
      message: truncateString(input.message),
      ...(process.env.NODE_ENV !== 'production' && {
        stack: truncateString(input.stack),
      }),
    };
  }
  
  if (Buffer.isBuffer(input)) {
    return `[Buffer length=${input.length}]`;
  }
  
  // =========================
  // Unsafe object filtering
  // =========================
  if (isUnsafeObject(input)) {
    return `[Unsafe:${input.constructor?.name || 'Object'}]`;
  }
  
  // =========================
  // Array handling
  // =========================
  if (Array.isArray(input)) {
    const limited = input.slice(0, MAX_ARRAY_LENGTH);
    
    const result = limited
      .map((v) => sanitizeAndLimitMeta(v, depth + 1, seen))
      .filter((v) => v !== null && v !== undefined);
    
    // Indicate truncation
    if (input.length > MAX_ARRAY_LENGTH) {
      result.push(`[+${input.length - MAX_ARRAY_LENGTH} more items]`);
    }
    
    return result;
  }
  
  // =========================
  // Object handling
  // =========================
  const keys = Object.keys(input);
  const limitedKeys = keys.slice(0, MAX_KEYS);
  
  const result = {};
  
  for (const key of limitedKeys) {
    const value = input[key];
    
    // Skip null/undefined early (perf optimization)
    if (value === null || value === undefined) continue;
    
    // Key-level masking (LAST LINE DEFENSE)
    if (isSensitiveField(key)) {
      result[key] = '[REDACTED]';
      continue;
    }
    
    result[key] = sanitizeAndLimitMeta(value, depth + 1, seen);
  }
  
  // Indicate truncated keys
  if (keys.length > MAX_KEYS) {
    result.__truncatedKeys = `[+${keys.length - MAX_KEYS} more keys]`;
  }
  
  return result;
};

module.exports = {
  sanitizeAndLimitMeta,
};
