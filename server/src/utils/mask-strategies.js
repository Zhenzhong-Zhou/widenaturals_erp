/**
 * Partial email masking
 */
const maskEmail = (val) => {
  if (!val || typeof val !== 'string') return val;
  return val.replace(/(.{2})(.*)(?=@)/, (_, p1) => `${p1}***`);
};

/**
 * UUID masking
 */
const maskUUID = (val) => {
  if (!val || typeof val !== 'string') return val;
  return `${val.slice(0, 8)}-****-****-${val.slice(-4)}`;
};

/**
 * ID masking (generic)
 */
const maskId = (val) => {
  if (!val || typeof val !== 'string') return val;
  return `${val.slice(0, 4)}****${val.slice(-4)}`;
};

/**
 * Masks table names for logging or debugging purposes.
 *
 * @param {string} tableName - The table name to mask.
 * @returns {string} - The masked table name.
 */
const maskTableName = (tableName) => {
  if (!tableName || typeof tableName !== 'string') return tableName;
  return tableName.slice(0, 2) + '***'; // Example: 'users' -> 'us***'
};

/**
 * Full redaction
 */
const maskFull = () => '[REDACTED]';

module.exports = {
  maskEmail,
  maskUUID,
  maskId,
  maskTableName,
  maskFull,
};
