const {
  getLocationTypes,
  getLocationDetailById,
} = require('../repositories/location-type-repository');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Fetches paginated location types.
 *
 * @param {Object} options - Query options.
 * @param {number} [options.page=1] - Page number for pagination.
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy='name'] - Column to sort by.
 * @param {string} [options.sortOrder='ASC'] - Sort order ('ASC' or 'DESC').
 * @returns {Promise<Object>} - Paginated list of location types.
 */
const fetchAllLocationTypes = async ({
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'ASC',
}) => {
  try {
    logInfo(
      `Fetching location types: Page ${page}, Limit ${limit}, SortBy ${sortBy}, SortOrder ${sortOrder}`
    );

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      throw AppError.validationError('Invalid pagination parameters');
    }

    // Fetch from repository
    return await getLocationTypes({ page, limit, sortBy, sortOrder });
  } catch (error) {
    logError('Error in getLocationTypes service:', error);
    throw AppError.databaseError('Failed to retrieve location types', 500, error);
  }
};

/**
 * Service function to fetch location type details by ID.
 *
 * This function:
 * - Validates input parameters.
 * - Calls the repository to fetch data.
 * - Applies business logic such as role-based access checks.
 * - Returns a structured response.
 *
 * @async
 * @function fetchLocationTypeDetailByTypeId
 * @param {Object} params - Query parameters.
 * @param {string} params.id - The UUID of the location type to fetch.
 * @param {number} [params.page=1] - The page number for paginated location results.
 * @param {number} [params.limit=10] - The number of locations per page.
 * @param {string} [params.sortBy='created_at'] - Column name to sort the results.
 * @param {string} [params.sortOrder='ASC'] - Sort order (`ASC` or `DESC`).
 * @returns {Promise<Object>} - A Promise resolving to an object containing location type details.
 * @throws {AppError} - Throws an error if validation fails or data is not found.
 */
const fetchLocationTypeDetailByTypeId = async ({
  id,
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  try {
    // Validate Required Parameters
    if (!id) {
      throw AppError.validationError('Location type ID is required');
    }

    // Fetch Data from Repository
    const locationTypeData = await getLocationDetailById({
      id,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Handle Not Found Case
    if (!locationTypeData) {
      throw AppError.notFoundError('Location type not found');
    }

    // Process Locations (Add Business Logic)
    if (locationTypeData.locations) {
      locationTypeData.locations = locationTypeData.locations.map(
        (location) => ({
          ...location,
          is_warehouse: location.warehouse_fee > 0, // Mark warehouse locations
        })
      );
    }

    // Extract Location Type Details Pagination from Response
    const locationTypeDetail = locationTypeData.data[0];
    const { pagination } = locationTypeData;

    // Construct Final Response
    return {
      locationTypeDetail,
      pagination,
    };
  } catch (error) {
    logError('Error in fetchLocationTypeDetailByTypeId service:', error);
    throw AppError.serviceError(
      error.message || 'Internal Server Error',
      error
    );
  }
};

module.exports = {
  fetchAllLocationTypes,
  fetchLocationTypeDetailByTypeId,
};
