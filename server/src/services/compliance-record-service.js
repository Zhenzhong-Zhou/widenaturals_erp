/**
 * @file compliance-record-service.js
 * @description Business logic for compliance record retrieval.
 *
 * Exports:
 *   - fetchPaginatedComplianceRecordsService – paginated compliance records with filtering and sorting
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers (repository) are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  getPaginatedComplianceRecords,
}                                        = require('../repositories/compliance-record-repository');
const {
  transformPaginatedComplianceRecordResults,
}                                        = require('../transformers/compliance-record-transformer');
const AppError                           = require('../utils/AppError');

/**
 * Fetches paginated compliance records with optional filtering and sorting.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]           - Field filters to apply.
 * @param {number}        [options.page=1]               - Page number (1-based).
 * @param {number}        [options.limit=10]             - Records per page.
 * @param {string}        [options.sortBy='createdAt']   - Sort field key (validated against sort map).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<PaginatedResult<Object>>} Transformed compliance records and pagination metadata.
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedComplianceRecordsService = async ({
                                                        filters   = {},
                                                        page      = 1,
                                                        limit     = 10,
                                                        sortBy    = 'createdAt',
                                                        sortOrder = 'DESC',
                                                      }) => {
  try {
    const rawResult = await getPaginatedComplianceRecords({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    return transformPaginatedComplianceRecordResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch compliance records.', {
      meta: { error: error.message },
    });
  }
};

module.exports = {
  fetchPaginatedComplianceRecordsService,
};
