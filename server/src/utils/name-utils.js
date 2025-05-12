/**
 * Returns a full name from first and last name components.
 * Gracefully handles missing or null inputs.
 *
 * @param {string|null|undefined} first - First name
 * @param {string|null|undefined} last - Last name
 * @returns {string} Full name string (e.g. "Jane Doe")
 */
const getFullName = (first, last) =>
  [first, last].map((s) => (s ? String(s).trim() : '')).filter(Boolean).join(' ');

module.exports = { getFullName };
