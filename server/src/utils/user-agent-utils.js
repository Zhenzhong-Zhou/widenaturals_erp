const UAParser = require('ua-parser-js');

const normalizeDeviceType = (type) => {
  if (!type) return 'desktop';
  if (type === 'mobile' || type === 'tablet') return type;
  return 'other';
};

const truncate = (value, max = 64) =>
  typeof value === 'string' ? value.slice(0, max) : null;

/**
 * Parses a User-Agent string into normalized, human-readable device metadata.
 *
 * PURPOSE:
 * - Converts a raw User-Agent string into structured information suitable
 *   for display, logging, and administrative UX.
 * - Provides a best-effort description of the client device, OS, and browser.
 *
 * DESIGN PRINCIPLES:
 * - Display-only: the parsed result MUST NOT be used for authentication,
 *   authorization, or device identity.
 * - Defensive defaults: missing or unknown fields are safely normalized.
 * - Privacy-safe: no fingerprinting, no persistence, no inference of identity.
 *
 * NORMALIZATION:
 * - Device types are normalized to: 'desktop', 'mobile', 'tablet', or 'other'.
 * - All string values are truncated to a safe maximum length to prevent
 *   log pollution, UI overflow, or database issues.
 *
 * FAILURE BEHAVIOR:
 * - If the User-Agent is missing or empty, the function returns null.
 * - The function does not throw; unexpected formats are handled gracefully
 *   by returning normalized fallback values.
 *
 * SECURITY NOTES:
 * - User-Agent strings are unreliable, mutable, and easily spoofed.
 * - This utility MUST NOT be treated as a source of truth for device identity.
 * - Device identity is handled separately via a client-generated device ID.
 *
 * @param {string | null} userAgent - Raw User-Agent header value
 * @returns {{
 *   deviceType: 'desktop' | 'mobile' | 'tablet' | 'other',
 *   deviceModel: string | null,
 *   os: string | null,
 *   browser: string | null
 * } | null}
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return null;

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    deviceType: normalizeDeviceType(result.device.type),
    deviceModel: truncate(result.device.model),
    os: truncate(
      result.os.name
        ? `${result.os.name} ${result.os.version || ''}`.trim()
        : null
    ),
    browser: truncate(
      result.browser.name
        ? `${result.browser.name} ${result.browser.version || ''}`.trim()
        : null
    ),
  };
};

module.exports = {
  parseUserAgent,
};
