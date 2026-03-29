/**
 * @file bulk-input-validator.js
 * @description
 * Shared validation utility for bulk input arrays.
 *
 * Enforces non-empty and maximum size constraints for bulk insert
 * operations across services. Throws structured AppErrors on failure
 * so the global error handler can respond without any additional
 * handling in the caller.
 */

'use strict';

const AppError = require('../AppError');

/**
 * Validates that a bulk input array is non-empty and within the allowed size limit.
 *
 * Throws a structured ValidationError on failure — callers do not need
 * to catch or wrap; the global error handler owns the response.
 *
 * @param {Array} items - The array of items to validate
 * @param {number} maxLimit - Maximum allowed array length
 * @param {string} [itemType='items'] - Item label used in error messages (e.g. 'customers', 'addresses')
 * @throws {AppError} ValidationError if the array is empty or exceeds maxLimit
 */
const validateBulkInputSize = (items, maxLimit, itemType = 'items') => {
  if (!Array.isArray(items) || items.length === 0) {
    throw AppError.validationError(`${itemType} list is empty.`);
  }
  
  if (items.length > maxLimit) {
    throw AppError.validationError(
      `Cannot insert more than ${maxLimit} ${itemType} at once.`
    );
  }
};

module.exports = {
  validateBulkInputSize,
};
