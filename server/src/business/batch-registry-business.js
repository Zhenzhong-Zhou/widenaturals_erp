const {
  getBatchRegistryById,
} = require('../repositories/batch-registry-repository');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

/**
 * Validates that a given batch_registry ID exists and matches the specified batch type.
 *
 * - Reads a single row from `batch_registry` by ID.
 * - Ensures the type matches expected ('product' or 'packaging_material').
 * - This is a pure validation step — it does NOT lock or mutate data.
 * - Row locking is NOT required as batch registry records are expected to be immutable.
 *
 * @param {'product' | 'packaging_material'} expectedType - The expected batch type.
 * @param {string} batchRegistryId - UUID of the row in batch_registry.
 * @param {object} client - pg client/pool instance.
 *
 * @throws {AppError} If not found or mismatched type.
 */
const validateBatchRegistryEntryById = async (
  expectedType,
  batchRegistryId,
  client
) => {
  try {
    const row = await getBatchRegistryById(batchRegistryId, client);

    if (!row) {
      throw AppError.notFoundError(
        `No batch registry found with ID: ${batchRegistryId}`
      );
    }

    if (row.batch_type !== expectedType) {
      throw AppError.validationError(
        `Batch type mismatch: expected "${expectedType}", found "${row.batch_type}" for ID "${batchRegistryId}"`
      );
    }
  } catch (err) {
    logSystemException(err, 'Batch registry validation failed', {
      context: 'batch-registry-business/validateBatchRegistryEntryById',
      batchRegistryId,
      expectedType,
    });

    throw AppError.businessError('Batch validation failed', {
      details: { batchRegistryId, expectedType, error: err.message },
    });
  }
};

module.exports = {
  validateBatchRegistryEntryById,
};
