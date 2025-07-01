const AppError = require('../utils/AppError');
const { checkRecordExists } = require('../database/db');

/**
 * Validates if an ID exists in the given table.
 *
 * @param {string} table - Table name to query
 * @param {string} id - ID to validate
 * @param {object} client - Optional pg client/transaction
 * @param {string} label - Optional label for error messages (e.g., "Order Type")
 * @returns {Promise<void>}
 * @throws {AppError} - If ID is missing or not found
 */
const validateIdExists = async (table, id, client = null, label = 'Record') => {
  if (!id) {
    throw AppError.validationError(`Missing ID for ${label}`);
  }
  
  const exists = await checkRecordExists(table, { id }, client);
  if (!exists) {
    throw AppError.notFoundError(`${label} ID not found: ${id}`);
  }
};

module.exports = {
  validateIdExists,
};
