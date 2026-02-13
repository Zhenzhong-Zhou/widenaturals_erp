const { parseUserAgent } = require('./user-agent-utils');

/**
 * Extracts and normalizes the client IP address from an Express request.
 *
 * Transport-layer utility:
 * - Relies on Express `trust proxy` configuration
 * - Uses req.ip (proxy-aware when trust proxy is enabled)
 * - Normalizes IPv6-mapped IPv4 addresses
 * - Returns null if unavailable
 *
 * IMPORTANT:
 * - Requires `app.set('trust proxy', 1)` when behind a reverse proxy.
 * - Does NOT manually parse x-forwarded-for headers.
 *
 * @param {import('express').Request} req
 * @returns {string|null} Normalized client IP address
 */
const getClientIp = (req) => {
  if (!req) return null;
  
  let ip = req.ip || null;
  if (!ip) return null;
  
  // Normalize IPv6-mapped IPv4 (::ffff:127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip;
};

/**
 * Extracts normalized request metadata for authentication and session logging.
 *
 * Transport-layer utility:
 * - Aggregates client IP, user agent, and device ID
 * - Applies basic validation to device ID
 * - Derives a human-readable note from parsed user-agent data
 * - Does NOT perform authentication or persistence
 *
 * Intended for:
 * - Login flows
 * - Token issuance
 * - Session creation
 * - Audit logging
 *
 * @param {import('express').Request} req
 *
 * @returns {{
 *   ipAddress: string|null,
 *   userAgent: string|null,
 *   deviceId: string|null,
 *   note: string|null
 * }}
 */
const extractRequestContext = (req) => {
  if (!req) {
    return {
      ipAddress: null,
      userAgent: null,
      deviceId: null,
      note: null,
    };
  }
  
  const ipAddress = getClientIp(req);
  
  const userAgent = req.get('user-agent') || null;
  
  const rawDeviceId = req.get('x-device-id');
  const deviceId =
    typeof rawDeviceId === 'string' &&
    rawDeviceId.length >= 16 &&
    rawDeviceId.length <= 128
      ? rawDeviceId
      : null;
  
  const uaInfo = userAgent ? parseUserAgent(userAgent) : null;
  
  const note = uaInfo
    ? `${uaInfo.os || 'Device'} (${uaInfo.browser || 'browser'})`
    : null;
  
  return {
    ipAddress,
    userAgent,
    deviceId,
    note,
  };
};

module.exports = {
  getClientIp,
  extractRequestContext,
};
