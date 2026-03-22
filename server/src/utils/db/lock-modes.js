/**
 * @file lock-modes.js
 * @description PostgreSQL row-level lock mode constants and lookup set.
 *
 * Reference: https://www.postgresql.org/docs/current/explicit-locking.html
 */

/**
 * Canonical SQL strings for each PostgreSQL row-level lock mode.
 *
 * Use these named constants when constructing SELECT ... FOR <mode> queries
 * instead of inline strings — ensures consistency and catches typos at
 * reference time rather than at query execution.
 *
 * Frozen to prevent accidental mutation of the source-of-truth values.
 *
 * @enum {string}
 * @readonly
 */
const LOCK_MODES = Object.freeze({
  UPDATE:        'FOR UPDATE',
  NO_KEY_UPDATE: 'FOR NO KEY UPDATE',
  SHARE:         'FOR SHARE',
  KEY_SHARE:     'FOR KEY SHARE',
});

/**
 * Set of all valid lock mode SQL strings, derived from `LOCK_MODES`.
 *
 * Use for O(1) validation of caller-supplied lock mode strings.
 * Derived once at module load — callers should import this rather than
 * constructing their own Set from `LOCK_MODES` values.
 *
 * @type {Set<string>}
 */
const LOCK_MODE_SET = new Set(Object.values(LOCK_MODES));

module.exports = {
  LOCK_MODES,
  LOCK_MODE_SET,
};
