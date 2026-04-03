/**
 * @file location-service.js
 * @description Business logic for location retrieval.
 *
 * Exports:
 *   - fetchPaginatedLocationsService – paginated location records with filtering and sorting
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers (repository) are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { getPaginatedLocations }              = require('../repositories/location-repository');
const { transformPaginatedLocationResults }  = require('../transformers/location-transformer');
const AppError                               = require('../utils/AppError');

const CONTEXT = 'location-service';

/**
 * Fetches paginated location records with optional filtering and sorting.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]           - Field filters to apply.
 * @param {number}        [options.page=1]               - Page number (1-based).
 * @param {number}        [options.limit=10]             - Records per page.
 * @param {string}        [options.sortBy='createdAt']   - Sort field key (validated against sort map).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<PaginatedResult<LocationRow>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedLocationsService = async ({
                                                filters   = {},
                                                page      = 1,
                                                limit     = 10,
                                                sortBy    = 'createdAt',
                                                sortOrder = 'DESC',
                                              }) => {
  const context = `${CONTEXT}/fetchPaginatedLocationsService`;
  
  try {
    const rawResult = await getPaginatedLocations({ filters, page, limit, sortBy, sortOrder });
    return transformPaginatedLocationResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch locations.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  fetchPaginatedLocationsService,
};
