/**
 * Checks if a value is a valid date.
 * @param {any} value - The field value to check.
 * @returns {boolean} - True if the value is a valid date.
 */
const isValidDate = (value) => {
  if (value instanceof Date) return true;
  if (typeof value !== 'string') return false;
  
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * Format date to `YYYY-MM-DD HH:mm PST` format.
 * @param {string|Date} dateString - The date string or Date object.
 * @param {string} timezoneLabel - The timezone label to append (e.g., "PST").
 * @returns {string} - Formatted date string.
 */
const formatDate = (dateString, timezoneLabel) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${timezoneLabel}`;
};

/**
 * Detects the correct format for different data types.
 * @param {any} value - The field value to check.
 * @param {string} timezone - The timezone label for date formatting.
 * @returns {string} - Formatted value.
 */
const formatValue = (value, timezone) => {
  if (isValidDate(value)) return formatDate(value, timezone); // Format only if it's a valid date
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'; // Convert booleans to readable values
  if (typeof value === 'number') return value.toLocaleString(); // Format numbers with commas
  return value; // Keep all other values as is
};

module.exports = {
  isValidDate,
  formatDate,
  formatValue,
}
