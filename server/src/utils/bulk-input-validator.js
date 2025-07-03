const AppError = require('../utils/AppError');
const { logSystemError, logSystemInfo } = require('../utils/logger-helper');

/**
 * Validates bulk input array size and non-empty condition.
 *
 * @param {Array} items - The array of items to validate.
 * @param {number} maxLimit - Maximum allowed size.
 * @param {string} context - String for logging context (e.g. 'customer-service/createCustomersService').
 * @param {string} [itemType='items'] - The type of items for error messages (e.g. 'customers', 'addresses').
 * @throws {AppError} If validation fails.
 */
const validateBulkInputSize = (items, maxLimit, context, itemType = 'items') => {
  if (!Array.isArray(items) || items.length === 0) {
    logSystemError(`${itemType} preparation failed: Empty array received`, { context });
    throw AppError.validationError(`${itemType} list is empty.`);
  }
  
  if (items.length > maxLimit) {
    logSystemInfo(`Bulk ${itemType} insert limit exceeded: attempted ${items.length}, max ${maxLimit}`, {
      context,
    });
    throw AppError.validationError(`Cannot insert more than ${maxLimit} ${itemType} at once.`);
  }
};

module.exports = {
  validateBulkInputSize
};
