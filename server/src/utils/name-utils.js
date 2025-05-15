const { format } = require('date-fns-tz');

/**
 * Returns a full name from first and last name components.
 * Gracefully handles missing or null inputs.
 *
 * @param {string|null|undefined} first - First name
 * @param {string|null|undefined} last - Last name
 * @returns {string} Full name string (e.g. "Jane Doe")
 */
const getFullName = (first, last) => {
  const full = [first, last]
    .map((s) => (s ? String(s).trim() : ''))
    .filter(Boolean)
    .join(' ');
  return full || '—';
};

/**
 * Generate a timestamped filename.
 *
 * @param {string} baseName - Base name without extension, e.g., 'pricing_export.csv'
 * @param {string} [timeZone='America/Los_Angeles']
 * @returns {string} e.g., 'pricing_export_20250515_213045.csv'
 */
const generateTimestampedFilename = (baseName, timeZone = 'America/Los_Angeles') => {
  const [name, ext] = baseName.split('.');
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss', { timeZone });
  return `${name}_${timestamp}.${ext}`;
};

module.exports = {
  getFullName,
  generateTimestampedFilename,
};
