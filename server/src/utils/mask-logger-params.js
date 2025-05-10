const SENSITIVE_KEYWORDS = require('./sensitive-keywords');

/**
 * Masks sensitive parameters for logging.
 * Handles arrays and key-value objects.
 *
 * @param {Array|Object} params
 * @returns {Array|Object}
 */
const maskSensitiveParams = (params) => {
  if (!params) return params;
  
  return Array.isArray(params)
    ? params.map(maskValue)
    : Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        isSensitiveKey(key) ? '[REDACTED]' : maskValue(value),
      ])
    );
};

const isSensitiveKey = (key) =>
  SENSITIVE_KEYWORDS.some((kw) => key.toLowerCase().includes(kw));

const maskValue = (val) => {
  if (typeof val === 'string') {
    if (val.includes('@')) return '[REDACTED_EMAIL]';
    if (/^Bearer\s.+$/i.test(val)) return '[REDACTED_TOKEN]';
    if (SENSITIVE_KEYWORDS.some((kw) => val.toLowerCase().includes(kw)))
      return '[REDACTED]';
  }
  return val;
};

module.exports = {
  maskSensitiveParams,
};
