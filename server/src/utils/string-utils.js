const { isUUID } = require('./id-utils');
const AppError = require('./AppError');

/**
 * Converts a key name to a more readable column name.
 * - Removes underscores (`_`)
 * - Capitalizes the first letter of each word
 * @param {string} key - The field name from JSON data.
 * @returns {string} - Formatted column name.
 */
const formatHeader = (key) => {
  return key
    .split('_') // Split by underscore
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
    .join(' '); // Rejoin as a readable string
};

/**
 * Processes headers by:
 * - Removing `id` and UUID fields.
 * - Formatting headers (capitalize, remove underscores).
 * - Creating a mapping between formatted headers and original keys.
 *
 * @param {Array<Object>} data - Array of objects to process.
 * @returns {{formattedHeaders: string[], columnMap: Object}} - Formatted headers and key mapping.
 */
const processHeaders = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw AppError.validationError('Data is empty or invalid'); // Throw an error instead of returning 'No data available'
  }

  const columnMap = Object.keys(data[0])
    .filter((key) => !isUUID(data[0][key]) && key !== 'id') // Remove ID and UUID fields
    .reduce((acc, key) => {
      acc[formatHeader(key)] = key; // Map formatted header -> original key
      return acc;
    }, {});

  return {
    formattedHeaders: Object.keys(columnMap), // Get formatted column names
    columnMap, // Mapping of formatted headers to original keys
  };
};

/**
 * Converts a formatted column name back to the original object key.
 * - Converts to lowercase
 * - Replaces spaces with underscores
 * @param {string} formattedHeader - The formatted column name.
 * @returns {string} - Original key name.
 */
const convertToKey = (formattedHeader) => {
  return formattedHeader.toLowerCase().replace(/\s+/g, '_'); // Convert back to original format
};

/**
 * Formats discount value based on its type.
 *
 * @param {string|null} discountType - The type of discount (PERCENTAGE or FIXED_AMOUNT).
 * @param {number|null} discountValue - The value of the discount.
 * @returns {string} - Formatted discount value.
 */
const formatDiscount = (discountType, discountValue) => {
  if (!discountType || discountValue === null || discountValue === undefined)
    return 'N/A';

  if (discountType === 'PERCENTAGE')
    return `${Number(discountValue).toFixed(2)}%`;
  if (discountType === 'FIXED_AMOUNT')
    return `$${Number(discountValue).toFixed(2)}`;

  return 'N/A';
};

module.exports = {
  formatHeader,
  processHeaders,
  convertToKey,
  formatDiscount,
};
