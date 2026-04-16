/**
 * @file sanitize-message.js
 * @description Sanitizes unstructured log messages to prevent leakage of sensitive data.
 *
 * Responsibilities:
 * - Mask key-value secrets (password, token variants)
 * - Mask Bearer tokens and JWTs
 * - Partially mask email addresses
 * - Optionally mask IPv4 addresses
 *
 * IMPORTANT:
 * - This function is ONLY for string messages (logs, errors, console output)
 * - Do NOT use for objects → use maskSensitiveParams instead
 *
 * Design Principles:
 * - Pattern-based masking (regex)
 * - Low false positives
 * - No mutation of non-string inputs
 * - Safe fallback behavior
 *
 * @param {string} message - The original message to sanitize
 * @param {boolean} [maskIp=false] - Whether to mask IPv4 addresses
 * @returns {string} Sanitized message
 */
const sanitizeMessage = (message, maskIp = false) => {
  if (!message || typeof message !== 'string') return message;

  let sanitized = message;

  // =========================
  // Key-value secrets
  // e.g. password=xxx, token: xxx, access_token=xxx
  // =========================
  if (/(password|token)/i.test(sanitized)) {
    sanitized = sanitized
      .replace(/(password\s*[:=]\s*)["']?[^"'\s]+["']?/gi, '$1****')
      .replace(
        /((access_?|refresh_?|auth_?)?token\s*[:=]\s*)["']?[^"'\s]+["']?/gi,
        '$1****'
      );
  }

  // =========================
  // Bearer tokens
  // =========================
  if (/Bearer\s+/i.test(sanitized)) {
    sanitized = sanitized.replace(
      /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
      'Bearer ****'
    );
  }

  // =========================
  // JWT tokens (3-part structure)
  // =========================
  if (sanitized.includes('.')) {
    sanitized = sanitized.replace(
      /\b[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g,
      '***JWT***'
    );
  }

  // =========================
  // Emails (partial masking for debugging usefulness)
  // =========================
  if (sanitized.includes('@')) {
    sanitized = sanitized.replace(
      /\b([A-Za-z0-9._%+-]{2})[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,
      '$1***@$2'
    );
  }

  // =========================
  // IP masking (optional)
  // =========================
  if (maskIp && /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(sanitized)) {
    sanitized = sanitized.replace(
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      '***.***.***.***'
    );
  }

  return sanitized;
};

module.exports = {
  sanitizeMessage,
};
