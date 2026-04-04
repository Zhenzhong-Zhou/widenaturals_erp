/**
 * @file auth-types.js
 * @description JSDoc typedef definitions for authentication and session context.
 *
 * Centralizes identity shapes attached to requests during JWT verification so
 * they can be referenced across middleware, services, and business logic without
 * duplication.
 */

'use strict';

/**
 * @typedef {Object} AuthUser
 * @property {string} id   - UUID of the authenticated user.
 * @property {string} role - Role assigned to the user (e.g. `'admin'`, `'viewer'`).
 */

/**
 * Minimal actor shape for system-initiated actions (bootstrap, cron, scripts).
 * Not a real authenticated user — no role or session.
 *
 * @typedef {{
 *   id:           string,
 *   isBootstrap?: boolean,
 *   isRoot?:      boolean,
 *   isSystem?:    boolean,
 * }} SystemActor
 */

/**
 * @typedef {Object} AuthContext
 * @property {AuthUser} user      - Authenticated user identity extracted from the JWT payload.
 * @property {string}   sessionId - Active session ID associated with the token.
 */
