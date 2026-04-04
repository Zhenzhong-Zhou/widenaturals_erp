/**
 * @file token-types.js
 * @description JSDoc type definitions for the token domain.
 */

'use strict';

// ---------------------------------------------------------------------------
// Row types (raw database shapes)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} TokenRow
 * @property {string} id
 * @property {string} user_id
 * @property {string | null} session_id
 * @property {string} token_type
 * @property {string} issued_at
 * @property {string} expires_at
 * @property {boolean} is_revoked
 */
