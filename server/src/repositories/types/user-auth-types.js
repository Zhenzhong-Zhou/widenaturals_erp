/**
 * @typedef {object} UserAuthMetadata
 * @property {{ password_hash: string, changed_at: string }[]} [password_history]
 */

'use strict';

/**
 * @typedef {object} UserAuthRow
 * @property {string} user_id
 * @property {string} email
 * @property {string} role_id
 * @property {string} auth_id
 * @property {string | null} password_hash
 * @property {string | null} last_login
 * @property {number} attempts
 * @property {number} failed_attempts
 * @property {string | null} lockout_time
 * @property {UserAuthMetadata | null} metadata
 */
