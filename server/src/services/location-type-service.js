/**
 * @file location-type-service.js
 * @description Business logic for location type retrieval.
 *
 * Exports:
 *   - fetchPaginatedLocationTypesService  – paginated location types with filtering and sorting
 *   - fetchLocationTypeDetailsService     – single location type detail by ID
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers (repository) are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  getPaginatedLocationTypes,
  getLocationTypeById,
}                                           = require('../repositories/location-type-repository');
const {
  transformPaginatedLocationTypeResults,
  transformLocationTypeDetail,
}                                           = require('../transformers/location-type-transformer');
const AppError                              = require('../utils/AppError');

const CONTEXT = 'location-type-service';

/**
 * Fetches paginated location type records with optional filtering and sorting.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]           - Field filters to apply.
 * @param {number}        [options.page=1]               - Page number (1-based).
 * @param {number}        [options.limit=10]             - Records per page.
 * @param {string}        [options.sortBy='createdAt']   - Sort field key (validated against sort map).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<PaginatedResult<LocationTypeRow>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedLocationTypesService = async ({
                                                    filters   = {},
                                                    page      = 1,
                                                    limit     = 10,
                                                    sortBy    = 'createdAt',
                                                    sortOrder = 'DESC',
                                                  }) => {
  const context = `${CONTEXT}/fetchPaginatedLocationTypesService`;
  
  try {
    const rawResult = await getPaginatedLocationTypes({ filters, page, limit, sortBy, sortOrder });
    return transformPaginatedLocationTypeResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch location types.', {
      context,
      meta: { error: error.message }
    });
  }
};

/**
 * Fetches a single location type record by ID.
 *
 * @param {string} locationTypeId - UUID of the location type to retrieve.
 *
 * @returns {Promise<LocationTypeRecord>} Transformed location type detail.
 *
 * @throws {AppError} `notFoundError`  – no location type found for the given ID.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchLocationTypeDetailsService = async (locationTypeId) => {
  const context = `${CONTEXT}/fetchLocationTypeDetailsService`;
  
  try {
    const rawLocationType = await getLocationTypeById(locationTypeId);
    
    if (!rawLocationType) {
      throw AppError.notFoundError('Location type not found.');
    }
    
    return transformLocationTypeDetail(rawLocationType);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch location type details.', {
      context,
      meta: { error: error.message }
    });
  }
};

module.exports = {
  fetchPaginatedLocationTypesService,
  fetchLocationTypeDetailsService,
};
