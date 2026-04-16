/**
 * @file bulk-insert-row-validator.js
 * @description
 * Row structure validation for bulk insert operations.
 *
 * Validates that every row in a bulk insert payload has the correct
 * column count before the query is constructed. Catches structural
 * mismatches early to avoid malformed parameterized queries.
 */

'use strict';

const AppError = require('../AppError');

/**
 * Validates that every row in a bulk insert array matches the expected column count.
 *
 * Throws on the first invalid row found, including its index and actual
 * length to aid debugging. Intended to run before query construction
 * so structural mismatches never reach the database.
 *
 * @param {Array<Array>} rows - Array of value arrays to validate
 * @param {number} expectedColumnCount - Required length for each row
 * @throws {AppError} ValidationError if any row is not an array or has wrong length
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
      `Invalid data: row ${invalidIndex} contains ${actualLength} values but expected ${expectedColumnCount}`
    );
  }
};

module.exports = {
  validateBulkInsertRows,
};
