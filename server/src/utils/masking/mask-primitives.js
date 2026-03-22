/**
 * @file mask-primitives.js
 * @description Fine-grained masking functions for individual value types.
 *
 * Each function is a pure transformer: given a value, returns a masked copy.
 * Non-string / null inputs are returned as-is to allow safe use in
 * higher-order contexts (e.g. as a map callback) without throwing.
 *
 * Used by mask-sensitive-params.js for string-level detection and masking.
 */

// Compiled once at module load — avoids per-call regex instantiation
const EMAIL_MASK_RE = /(?<=.{2})([^@]+)(?=@)/;

/**
 * Partially masks an email address, preserving the first 2 characters
 * of the local part and the full domain.
 *
 * @example
 * maskEmail('john.doe@example.com') // 'jo***@example.com'
 * maskEmail('ab@example.com')       // 'ab***@example.com'
 *
 * @param {*} val
 * @returns {*} Masked email string, or the original value if not a non-empty string.
 */
const maskEmail = (val) => {
  if (val == null || typeof val !== 'string') return val;
  return val.replace(EMAIL_MASK_RE, '***');
};

/**
 * Masks the middle segments of a UUID, preserving the first 8 and last 4 characters.
 * Output format: `xxxxxxxx-****-****-****-xxxx`
 *
 * @example
 * maskUUID('550e8400-e29b-41d4-a716-446655440000') // '550e8400-****-****-****-0000'
 *
 * @param {*} val
 * @returns {*} Masked UUID string, or the original value if not a non-empty string.
 */
const maskUUID = (val) => {
  if (val == null || typeof val !== 'string') return val;
  return `${val.slice(0, 8)}-****-****-****-${val.slice(-4)}`;
};

/**
 * Masks the middle portion of a generic ID string, preserving the first
 * and last 4 characters.
 *
 * @example
 * maskId('abc123xyz789') // 'abc1****x789'
 *
 * @param {*} val
 * @returns {*} Masked ID string, or the original value if not a non-empty string.
 */
const maskId = (val) => {
  if (val == null || typeof val !== 'string') return val;
  return `${val.slice(0, 4)}****${val.slice(-4)}`;
};

/**
 * Masks a table name (or array of table names) for safe logging,
 * preserving the first 2 characters of the table segment.
 *
 * Handles both plain table names and schema-qualified names (`schema.table`).
 * Non-string, non-array inputs are returned as-is.
 *
 * @example
 * maskTableName('warehouse_inventory')         // 'wa***'
 * maskTableName('public.warehouse_inventory')  // 'public.wa***'
 * maskTableName(['orders', 'public.products']) // ['or***', 'public.pr***']
 *
 * @param {string | string[] | *} input
 * @returns {string | string[] | *} Masked table name(s), or original value if not a string/array.
 */
const maskTableName = (input) => {
  if (input == null) return input;
  
  if (Array.isArray(input)) {
    return input.map(maskTableName);
  }
  
  if (typeof input === 'string') {
    const dotIndex = input.indexOf('.');
    
    if (dotIndex === -1) {
      // Unqualified table name — mask all but first 2 chars
      return input.length <= 2 ? '***' : `${input.slice(0, 2)}***`;
    }
    
    // Schema-qualified: preserve schema, mask table name
    const schema = input.slice(0, dotIndex);
    const table  = input.slice(dotIndex + 1);
    return `${schema}.${table.length <= 2 ? '***' : `${table.slice(0, 2)}***`}`;
  }
  
  // Non-string, non-array — passthrough intentionally (safe for map callbacks)
  return input;
};

/**
 * Fully redacts a value regardless of its content.
 * Accepts and ignores its argument so it can be used as a drop-in
 * map/replace callback alongside the other maskers.
 *
 * @example
 * maskFull('secret-token') // '[REDACTED]'
 * ['a', 'b'].map(maskFull) // ['[REDACTED]', '[REDACTED]']
 *
 * @param {*} _val - Accepted but not used.
 * @returns {string} Always `'[REDACTED]'`.
 */
const maskFull = (_val) => '[REDACTED]';

module.exports = {
  maskEmail,
  maskUUID,
  maskId,
  maskTableName,
  maskFull,
};
