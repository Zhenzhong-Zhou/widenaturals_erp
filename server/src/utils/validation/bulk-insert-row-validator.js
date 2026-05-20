/**
 * @file bulk-insert-row-validator.js
 * @description
 * Row structure validation for bulk insert operations.
 *
 * Validates that every row in a bulk insert payload has the expected column
 * count before the SQL query is constructed. This catches structural mismatches
 * early and prevents malformed parameterized queries from reaching the database.
 */

'use strict';

const AppError = require('../AppError');

/**
 * Validates that every row in a bulk insert array matches the expected column count.
 *
 * Throws on the first invalid row found, including its index and actual length
 * to aid debugging. Intended to run before query construction so structural
 * mismatches never reach the database.
 *
 * @param {Array<Array<*>>} rows - Array of bulk insert value rows to validate.
 * @param {number} expectedColumnCount - Required number of values in each row.
 * @returns {void}
 * @throws {AppError} ValidationError if rows is invalid or any row has the wrong shape.
 */
const validateBulkInsertRows = (rows, expectedColumnCount) => {
  if (!Array.isArray(rows)) {
    throw AppError.validationError(
      `validateBulkInsertRows: rows must be an array, got ${typeof rows}`
    );
  }
  
  if (!Number.isInteger(expectedColumnCount) || expectedColumnCount <= 0) {
    throw AppError.validationError(
      `validateBulkInsertRows: expectedColumnCount must be a positive integer, got ${expectedColumnCount}`
    );
  }
  
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
