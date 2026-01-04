const { getStatusIdByName } = require('../repositories/status-repository');
const { logError, logInfo } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { checkProductExists } = require('../repositories/product-repository');

/**
 * Validates the existence of a status by name.
 * @param {string} statusName - The name of the status.
 * @returns {Promise<uuid>} - The status ID if valid.
 * @throws {AppError} - If the status does not exist or database operation fails.
 */
const validateStatus = async (statusName) => {
  try {
    const statusId = await getStatusIdByName(statusName);
    if (!statusId) {
      throw AppError.validationError(`Invalid status: "${statusName}"`, {
        details: { statusName },
      });
    }
    return statusId;
  } catch (error) {
    logError(`Error validating status by name "${statusName}":`, {
      error: error.message,
      stack: error.stack,
    });
    throw error instanceof AppError
      ? error
      : AppError.databaseError('Failed to validate status', {
          details: { statusName },
        });
  }
};

/**
 * Validates the existence of a product based on provided filters.
 *
 * @param {Object} filters - The conditions to check for product existence.
 * @param {Object} options - Additional options to control validation behavior.
 * @param {boolean} [options.throwIfExists=false] - If `true`, throws an error if the product exists.
 * @param {string} [options.errorMessage] - Custom error message to override the default.
 *
 * @throws {AppError} - Throws if validation fails.
 */
const validateProductExistence = async (
  filters,
  options = { throwIfExists: false }
) => {
  const exists = await checkProductExists(filters);

  logInfo('Product existence validation', {
    filters,
    throwIfExists: options.throwIfExists,
    exists,
  });

  if (options.throwIfExists && exists) {
    const message =
      options.errorMessage ||
      'A product with the provided details already exists.';
    throw AppError.validationError(message, { filters });
  }

  if (!options.throwIfExists && !exists) {
    const message =
      options.errorMessage || 'No product found with the provided details.';
    throw AppError.notFoundError(message, { filters });
  }
};

module.exports = {
  validateStatus,
  validateProductExistence,
};
