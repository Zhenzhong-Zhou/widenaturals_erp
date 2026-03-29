/**
 * @file request-context.js
 * @module utils/logging/request-context
 *
 * @description
 * Transport-layer utilities for extracting normalized request metadata.
 *
 * Used by:
 *   - The global request-logger middleware (finish / close handlers)
 *   - Any logger helper that needs a consistent metadata shape
 *
 * Responsibilities:
 *   - Produce a consistent, never-partial metadata object for every log entry
 *   - Safely extract headers, auth, and query params without throwing
 *   - Avoid heavy computation (UA parsing is guarded by length check)
 *
 * Guarantees:
 *   - Read-only — never mutates req
 *   - Safe for both Express and non-Express contexts (e.g. scripts, cron jobs)
 *   - Designed for logging and auditing, NOT authentication or authorization
 *
 * Adding userId here (rather than per-controller) means every authenticated
 * route gets it automatically in the finish log with zero controller boilerplate.
 */

'use strict';

const { parseUserAgent } = require('./user-agent-utils');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum and maximum accepted lengths for the x-device-id header value. */
const DEVICE_ID_MIN_LENGTH = 16;
const DEVICE_ID_MAX_LENGTH = 128;

/**
 * Maximum user-agent string length to bother parsing.
 * Strings longer than this are almost certainly malformed or adversarial.
 */
const USER_AGENT_PARSE_LIMIT = 512;

// ─────────────────────────────────────────────────────────────────────────────
// getClientIp
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts and normalizes the client IP address from an Express request.
 *
 * Behavior:
 *   - Uses Express `req.ip` (proxy-aware when `trust proxy` is enabled)
 *   - Normalizes IPv6-mapped IPv4 addresses (::ffff:127.0.0.1 → 127.0.0.1)
 *   - Returns `undefined` if the value is missing or not a string
 *
 * @important Requires `app.set('trust proxy', 1)` when running behind a proxy.
 * Does NOT manually parse `x-forwarded-for` — that is Express's responsibility.
 *
 * @param {import('express').Request} req - Express request object.
 * @returns {string|undefined} Normalized IPv4/IPv6 address, or `undefined`.
 *
 * @example
 * getClientIp(req) // '127.0.0.1'
 */
const getClientIp = (req) => {
  if (!req || typeof req !== 'object') return undefined;
  
  const ip = req.ip;
  if (!ip || typeof ip !== 'string') return undefined;
  
  // Normalize IPv6-mapped IPv4 addresses (e.g. '::ffff:127.0.0.1' → '127.0.0.1')
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  
  return ip;
};

// ─────────────────────────────────────────────────────────────────────────────
// extractRequestContext
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts normalized request metadata for structured logging and auditing.
 *
 * Covers transport, identity, and pagination context so that individual
 * controllers do not need to repeat this boilerplate in their own log calls.
 *
 * Fields sourced from:
 *   - attachTraceId middleware → `req.traceId`
 *   - Auth middleware          → `req.auth.user.id`  (userId)
 *   - Query normalizer         → `req.normalizedQuery` (pagination/sorting/filters)
 *   - Express internals        → method, route, ip
 *   - Request headers          → user-agent, x-device-id
 *
 * @param {import('express').Request | object} req - Express request (or any object).
 *
 * @returns {{
 *   traceId:           string,
 *   method?:           string,
 *   route?:            string,
 *   ipAddress?:        string,
 *   userAgent?:        string,
 *   parsedUserAgent?:  string,
 *   deviceId?:         string,
 *   userId?:           string,
 *   pagination?:       { page: string, limit: string },
 *   sorting?:          { sortBy: string, sortOrder: string },
 *   filters?:          Record<string, unknown>,
 * }}
 */
const extractRequestContext = (req) => {
  // ── Safe default ────────────────────────────────────────────────────────
  // Non-request callers (cron jobs, scripts) still get a consistent shape.
  if (!req || typeof req !== 'object') {
    return { traceId: 'system' };
  }
  
  // Used to decide whether to use req.get() (Express) or req.headers directly
  const isExpressRequest = typeof req.get === 'function';
  
  // ── traceId ─────────────────────────────────────────────────────────────
  // Set by attachTraceId middleware; fall back to 'system' for non-HTTP callers.
  const traceId =
    typeof req.traceId === 'string' ? req.traceId : 'system';
  
  // ── Method and route ────────────────────────────────────────────────────
  const method =
    typeof req.method === 'string' ? req.method : undefined;
  
  // Combine baseUrl + path to get the full matched route (e.g. /api/v1/users/123)
  const route =
    typeof req.baseUrl === 'string' && typeof req.path === 'string'
      ? req.baseUrl + req.path
      : undefined;
  
  // ── Header helper ───────────────────────────────────────────────────────
  // req.get() is preferred on Express (handles header name case-insensitivity).
  const getHeader = (name) =>
    isExpressRequest
      ? req.get(name)
      : req.headers?.[name.toLowerCase()];
  
  // ── User-Agent ──────────────────────────────────────────────────────────
  const userAgent = getHeader('user-agent') || undefined;
  
  // Lazy UA parsing — skip if missing or suspiciously long (adversarial input)
  let parsedUserAgent;
  if (userAgent && userAgent.length < USER_AGENT_PARSE_LIMIT) {
    const uaInfo = parseUserAgent(userAgent);
    if (uaInfo) {
      // Human-readable summary: "macOS (Chrome)" — useful for support triage
      parsedUserAgent = `${uaInfo.os || 'Device'} (${uaInfo.browser || 'browser'})`;
    }
  }
  
  // ── Device ID ───────────────────────────────────────────────────────────
  const rawDeviceId = getHeader('x-device-id');
  
  // Enforce length bounds to reject malformed or padded values
  const deviceId =
    typeof rawDeviceId === 'string' &&
    rawDeviceId.length >= DEVICE_ID_MIN_LENGTH &&
    rawDeviceId.length <= DEVICE_ID_MAX_LENGTH
      ? rawDeviceId
      : undefined;
  
  // ── IP address ──────────────────────────────────────────────────────────
  const ipAddress = getClientIp(req);
  
  // ── userId ──────────────────────────────────────────────────────────────
  // Sourced from auth middleware. Optional — unauthenticated routes won't have it.
  // Adding here avoids repeating `userId: user.id` in every controller log call.
  const userId = req.auth?.user?.id ?? undefined;
  
  // ── Pagination and sorting ──────────────────────────────────────────────
  // Sourced from query-normalizer middleware. Only present on paginated routes.
  let pagination;
  let sorting;
  let filters;
  
  if (req.normalizedQuery && typeof req.normalizedQuery === 'object') {
    const { page, limit, sortBy, sortOrder, filters: rawFilters } = req.normalizedQuery;
    
    if (page != null && limit != null) {
      pagination = {
        page:  String(page),
        limit: String(limit),
      };
    }
    
    if (sortBy != null && sortOrder != null) {
      sorting = {
        sortBy:    String(sortBy),
        // sortOrder is always 'asc' | 'desc' — safe to log as-is
        sortOrder: String(sortOrder),
      };
    }
    
    // Log filter keys and values. Values are assumed enum-safe (validated upstream).
    // If filters ever contain free-text user input, log keys only to avoid PII leakage:
    //   filters = rawFilters ? Object.fromEntries(Object.keys(rawFilters).map(k => [k, '[redacted]'])) : undefined;
    if (rawFilters && typeof rawFilters === 'object' && Object.keys(rawFilters).length > 0) {
      filters = rawFilters;
    }
  }
  
  // ── Assemble and return ─────────────────────────────────────────────────
  // All optional fields are explicitly set to `undefined` rather than omitted
  // via conditional spreading, so the shape is always predictable for log parsers.
  return {
    traceId,
    method,
    route,
    ipAddress,
    userAgent,
    parsedUserAgent,
    deviceId,
    userId,
    pagination,
    sorting,
    filters,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getClientIp,
  extractRequestContext,
};
