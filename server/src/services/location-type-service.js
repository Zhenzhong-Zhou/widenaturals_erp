const { getLocationTypes } = require('../repositories/location-type-repository');
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
const fetchAllLocationTypes = async ({ page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC' }) => {
  try {
    logInfo(`Fetching location types: Page ${page}, Limit ${limit}, SortBy ${sortBy}, SortOrder ${sortOrder}`);
    
    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      throw new AppError('Invalid pagination parameters', 400);
    }
    
    // Fetch from repository
    return await getLocationTypes({ page, limit, sortBy, sortOrder });
  } catch (error) {
    logError('Error in getLocationTypes service:', error);
    throw new AppError('Failed to retrieve location types', 500, error);
  }
};

module.exports = {
  fetchAllLocationTypes,
};
