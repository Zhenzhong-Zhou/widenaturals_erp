/**
 * Checks if a value is a valid UUID (Universally Unique Identifier).
 * @param {any} value - The field value to check.
 * @returns {boolean} - True if the value is a UUID.
 */
const isUUID = (value) => {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

module.exports = { isUUID };
