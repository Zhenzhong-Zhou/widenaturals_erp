const {
  getPaginatedLocationTypes,
  getLocationTypeById,
} = require('../repositories/location-type-repository');
const {
  transformPaginatedLocationTypeResults,
  transformLocationTypeDetail,
} = require('../transformers/location-type-transformer');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Service: Fetch Paginated Location Types
 *
 * Provides a service-level abstraction over repository queries
 * for location type configuration entities.
 *
 * ─────────────────────────────────────────────────────────────
 * Flow
 * ─────────────────────────────────────────────────────────────
 * 1. Delegates to `getPaginatedLocationTypes` (repository layer).
 * 2. If no results:
 *    - Logs informational event
 *    - Returns normalized empty result set.
 * 3. If results exist:
 *    - Transforms raw SQL rows into API-ready DTO objects.
 *    - Logs structured success metadata.
 * 4. On error:
 *    - Logs structured exception.
 *    - Throws service-level AppError.
 *
 * ─────────────────────────────────────────────────────────────
 * Intended Usage
 * ─────────────────────────────────────────────────────────────
 * - Admin configuration pages
 * - Settings modules
 * - Lookup management UI
 *
 * NOTE:
 * For single-record detail retrieval, use:
 *   `fetchLocationTypeByIdService`
 *
 * ─────────────────────────────────────────────────────────────
 * @param {Object} options
 * @param {Object} [options.filters={}] - Location type filter criteria
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Page size
 * @param {string} [options.sortBy='created_at'] - Sort column (validated upstream)
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction
 *
 * @returns {Promise<{
 *   data: any[];
 *   pagination: {
 *     page: number;
 *     limit: number;
 *     totalRecords: number;
 *     totalPages: number;
 *   };
 * }>}
 *
 * @throws {AppError}
 */
const fetchPaginatedLocationTypesService = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'created_at',
  sortOrder = 'DESC',
}) => {
  const context = 'location-type-service/fetchPaginatedLocationTypesService';

  try {
    // ----------------------------------------------------------
    // Step 1: Query raw paginated rows
    // ----------------------------------------------------------
    const rawResult = await getPaginatedLocationTypes({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // ----------------------------------------------------------
    // Step 2: Handle empty result
    // ----------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No location types found', {
        context,
        filters,
        pagination: { page, limit },
        sort: { sortBy, sortOrder },
      });

      return {
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }

    // ----------------------------------------------------------
    // Step 3: Transform SQL rows → API DTO
    // ----------------------------------------------------------
    const result = transformPaginatedLocationTypeResults(rawResult);

    // ----------------------------------------------------------
    // Step 4: Log success
    // ----------------------------------------------------------
    logSystemInfo('Fetched paginated location type records successfully', {
      context,
      filters,
      pagination: result.pagination,
      sort: { sortBy, sortOrder },
    });

    return result;
  } catch (error) {
    // ----------------------------------------------------------
    // Step 5: Log exception and rethrow
    // ----------------------------------------------------------
    logSystemException(
      error,
      'Failed to fetch paginated location type records',
      {
        context,
        filters,
        pagination: { page, limit },
        sort: { sortBy, sortOrder },
      }
    );

    throw AppError.serviceError(
      'Could not fetch location types. Please try again later.',
      {
        context,
        details: error.message,
      }
    );
  }
};

/**
 * Service: Fetch Location Type Details by ID
 *
 * Provides a service-level abstraction for fetching a single
 * location type configuration record from the repository,
 * including status and audit information.
 *
 * ─────────────────────────────────────────────────────────────
 * Flow
 * ─────────────────────────────────────────────────────────────
 * 1. Delegates to `getLocationTypeById` in the repository layer.
 * 2. If no record is found:
 *    - Logs an informational event.
 *    - Throws an AppError.notFoundError for clean controller handling.
 * 3. If found:
 *    - Transforms raw SQL row via `transformLocationTypeDetail`
 *      into an API-ready object.
 *    - Logs a successful fetch event.
 * 4. On error:
 *    - Logs structured exception.
 *    - Wraps and throws service-level AppError.
 *
 * ─────────────────────────────────────────────────────────────
 * @param {string} locationTypeId - UUID of the location type.
 *
 * @returns {Promise<object>} Clean, transformed location type detail object.
 *
 * @throws {AppError.notFoundError}
 *   If the location type does not exist.
 *
 * @throws {AppError.serviceError}
 *   If an unexpected failure occurs.
 *
 * @example
 * const locationType =
 *   await fetchLocationTypeDetailsService('uuid-value');
 * console.log(locationType.status.name); // "Active"
 */
const fetchLocationTypeDetailsService = async (locationTypeId) => {
  const logContext = 'location-type-service/fetchLocationTypeDetailsService';

  try {
    // ----------------------------------------------------------
    // Step 1: Fetch raw row from repository
    // ----------------------------------------------------------
    const rawLocationType = await getLocationTypeById(locationTypeId);

    // ----------------------------------------------------------
    // Step 2: Handle not found
    // ----------------------------------------------------------
    if (!rawLocationType) {
      logSystemInfo('No location type found for given ID', {
        context: logContext,
        locationTypeId,
      });

      throw AppError.notFoundError('Location type not found', {
        context: logContext,
        locationTypeId,
      });
    }

    // ----------------------------------------------------------
    // Step 3: Transform to API-ready format
    // ----------------------------------------------------------
    const locationType = transformLocationTypeDetail(rawLocationType);

    // ----------------------------------------------------------
    // Step 4: Log success
    // ----------------------------------------------------------
    logSystemInfo('Fetched location type detail successfully', {
      context: logContext,
      locationTypeId,
    });

    return locationType;
  } catch (error) {
    // ----------------------------------------------------------
    // Step 5: Log exception and wrap as service error
    // ----------------------------------------------------------
    logSystemException(error, 'Failed to fetch location type detail', {
      context: logContext,
      locationTypeId,
      error: error.message,
    });

    throw AppError.serviceError(
      'Could not fetch location type details. Please try again later.',
      {
        context: logContext,
        locationTypeId,
        details: error.message,
      }
    );
  }
};

module.exports = {
  fetchPaginatedLocationTypesService,
  fetchLocationTypeDetailsService,
};
