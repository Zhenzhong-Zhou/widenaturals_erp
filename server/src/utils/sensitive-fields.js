/**
 * @file sensitive-fields.js
 * @description Defines sensitive field patterns for log sanitization.
 *
 * Responsibilities:
 * - Provide a centralized list of sensitive keys
 * - Support fast lookup (Set-based)
 * - Enable partial matching (e.g., "user_password", "authToken")
 *
 * Design:
 * - Use Set for exact matches (O(1))
 * - Use keyword list for partial matching
 * - All keys normalized to lowercase
 */

// ============================================================
// Exact sensitive keys (fast lookup)
// ============================================================

const SENSITIVE_FIELDS = new Set([
  'password',
  'secret',
  'token',
  'apikey',
  'authorization',
  'email',
  'ssn',
  'creditcard',
]);

// ============================================================
// Partial match patterns (for flexible detection)
// ============================================================

const SENSITIVE_KEYWORDS = [
  'password',
  'secret',
  'token',
  'auth',
  'key',
  'credential',
  'card',
  'ssn',
];

// ============================================================
// Utility: check if field is sensitive
// ============================================================

/**
 * Determines whether a given key should be treated as sensitive.
 *
 * @param {string} key
 * @returns {boolean}
 */
const isSensitiveField = (key) => {
  if (!key || typeof key !== 'string') return false;
  
  const normalizedKey = key.toLowerCase();
  
  // Exact match (fast path)
  if (SENSITIVE_FIELDS.has(normalizedKey)) {
    return true;
  }
  
  // Partial match (fallback)
  return SENSITIVE_KEYWORDS.some((keyword) =>
    normalizedKey.includes(keyword)
  );
};

module.exports = {
  SENSITIVE_FIELDS,
  SENSITIVE_KEYWORDS,
  isSensitiveField,
};
