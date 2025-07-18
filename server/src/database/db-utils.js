const AppError = require('../utils/AppError');

/**
 * Validates that each row in a bulk insert dataset:
 * - Is an array
 * - Has the expected number of columns
 *
 * Throws an AppError if validation fails.
 *
 * @param {Array<Array>} rows - The bulk insert row data to validate.
 * @param {number} expectedColumnCount - The expected number of columns per row.
 * @throws {AppError} - If any row is invalid.
 */
const validateBulkInsertRows = (rows, expectedColumnCount) => {
  const invalidIndex = rows.findIndex(
    (row) => !Array.isArray(row) || row.length !== expectedColumnCount
  );
  
  if (invalidIndex !== -1) {
    const actualLength = Array.isArray(rows[invalidIndex])
      ? rows[invalidIndex].length
      : 'non-array';
    
    throw AppError.validationError(
      `Invalid data: Row ${invalidIndex} contains ${actualLength} values, but expected ${expectedColumnCount}`
    );
  }
};

module.exports = {
  validateBulkInsertRows
};
