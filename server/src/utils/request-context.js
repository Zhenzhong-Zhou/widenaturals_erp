/**
 * @file request-context.js
 * @description Transport-layer utilities for extracting normalized request metadata.
 */

const { parseUserAgent } = require('./user-agent-utils');

/**
 * Extracts and normalizes the client IP address from an Express request.
 *
 * Behavior:
 * - Uses Express `req.ip` (proxy-aware if `trust proxy` is enabled)
 * - Normalizes IPv6-mapped IPv4 (::ffff:127.0.0.1 → 127.0.0.1)
 * - Returns `undefined` if unavailable
 *
 * IMPORTANT:
 * - Requires `app.set('trust proxy', 1)` behind proxies
 * - Does NOT manually parse `x-forwarded-for`
 *
 * @param {import('express').Request} req
 * @returns {string|undefined}
 */
const getClientIp = (req) => {
  if (!req || typeof req !== 'object') return undefined;
  
  let ip = req.ip;
  if (!ip || typeof ip !== 'string') return undefined;
  
  // Normalize IPv6-mapped IPv4 (::ffff:127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  
  return ip;
};

/**
 * Extracts normalized request metadata for logging and auditing.
 *
 * Responsibilities:
 * - Provide consistent metadata shape (never partial objects)
 * - Safely extract headers and request properties
 * - Avoid heavy computation unless necessary
 *
 * Notes:
 * - This function is read-only (does NOT mutate req)
 * - Safe for both Express and non-Express contexts
 * - Designed for logging, NOT authentication
 *
 * @param {import('express').Request | any} req
 *
 * @returns {{
 *   traceId: string,
 *   method?: string,
 *   route?: string,
 *   ipAddress?: string,
 *   userAgent?: string,
 *   deviceId?: string,
 *   note?: string,
 *   query?: Record<string, string>
 * }}
 */
const extractRequestContext = (req) => {
  // =========================
  // Safe default (consistent shape)
  // =========================
  if (!req || typeof req !== 'object') {
    return {
      traceId: 'system',
    };
  }
  
  const isExpressRequest = typeof req.get === 'function';
  
  // =========================
  // Basic fields
  // =========================
  const traceId =
    typeof req.traceId === 'string' ? req.traceId : 'system';
  
  const method =
    typeof req.method === 'string' ? req.method : undefined;
  
  const route =
    typeof req.baseUrl === 'string' && typeof req.path === 'string'
      ? req.baseUrl + req.path
      : undefined;
  
  // =========================
  // Headers (safe access)
  // =========================
  const getHeader = (name) =>
    isExpressRequest
      ? req.get(name)
      : req.headers?.[name.toLowerCase()];
  
  const userAgent = getHeader('user-agent') || undefined;
  const rawDeviceId = getHeader('x-device-id');
  
  // =========================
  // Device ID validation
  // =========================
  const deviceId =
    typeof rawDeviceId === 'string' &&
    rawDeviceId.length >= 16 &&
    rawDeviceId.length <= 128
      ? rawDeviceId
      : undefined;
  
  // =========================
  // IP extraction
  // =========================
  const ipAddress = getClientIp(req);
  
  // =========================
  // Lazy UA parsing (avoid cost)
  // =========================
  let note;
  if (userAgent && userAgent.length < 512) {
    const uaInfo = parseUserAgent(userAgent);
    if (uaInfo) {
      note = `${uaInfo.os || 'Device'} (${uaInfo.browser || 'browser'})`;
    }
  }
  
  // =========================
  // Whitelisted query params
  // =========================
  let query;
  if (req.query && typeof req.query === 'object') {
    const safeQuery = {};
    
    if (req.query.page != null) {
      safeQuery.page = String(req.query.page);
    }
    
    if (req.query.limit != null) {
      safeQuery.limit = String(req.query.limit);
    }
    
    if (Object.keys(safeQuery).length > 0) {
      query = safeQuery;
    }
  }
  
  return {
    traceId,
    method,
    route,
    ipAddress,
    userAgent,
    deviceId,
    note,
    ...(query ? { query } : {}),
  };
};

module.exports = {
  getClientIp,
  extractRequestContext,
};
