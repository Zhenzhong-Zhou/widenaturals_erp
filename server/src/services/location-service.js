const {
  getPaginatedLocations,
} = require('../repositories/location-repository');
const {
  transformPaginatedLocationResults,
} = require('../transformers/location-transformer');
const {
  logSystemInfo,
  logSystemException,
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Service: Fetch Paginated Locations
 *
 * Provides a service-level abstraction over repository queries for locations.
 * Handles pagination, filtering, transformation, and structured logging.
 *
 * ─────────────────────────────────────────────────────────────
 * Flow
 * ─────────────────────────────────────────────────────────────
 * 1. Delegates to `getPaginatedLocations` in repository layer.
 * 2. If no results:
 *    - Logs informational event
 *    - Returns normalized empty result set.
 * 3. If results exist:
 *    - Transforms raw SQL rows into API-ready DTO objects.
 *    - Logs success with metadata.
 * 4. On error:
 *    - Logs structured exception.
 *    - Throws service-level AppError.
 *
 * ─────────────────────────────────────────────────────────────
 * Intended Usage
 * ─────────────────────────────────────────────────────────────
 * - Location list page
 * - Admin dashboards
 * - Expandable table rows (summary metadata only)
 *
 * Heavy detail fields should be retrieved via:
 *   `fetchLocationByIdService`
 *
 * ─────────────────────────────────────────────────────────────
 * @param {Object} options
 * @param {Object} [options.filters={}] - Location filter criteria
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
const fetchPaginatedLocationsService = async ({
                                                filters = {},
                                                page = 1,
                                                limit = 10,
                                                sortBy = 'created_at',
                                                sortOrder = 'DESC',
                                              }) => {
  const context = 'location-service/fetchPaginatedLocationsService';
  
  try {
    // ----------------------------------------------------------
    // Step 1: Query raw paginated rows
    // ----------------------------------------------------------
    const rawResult = await getPaginatedLocations({
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
      logSystemInfo('No locations found', {
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
    const result = transformPaginatedLocationResults(rawResult);
    
    // ----------------------------------------------------------
    // Step 4: Log success
    // ----------------------------------------------------------
    logSystemInfo('Fetched paginated location records successfully', {
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
      'Failed to fetch paginated location records',
      {
        context,
        filters,
        pagination: { page, limit },
        sort: { sortBy, sortOrder },
      }
    );
    
    throw AppError.serviceError(
      'Could not fetch locations. Please try again later.',
      {
        context,
        details: error.message,
      }
    );
  }
};

module.exports = {
  fetchPaginatedLocationsService,
};
