const { getLocations } = require('../repositories/location-repository');
const { AppError } = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Service function to fetch locations with pagination, sorting, and business logic.
 * @param {Object} options - Query parameters
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Number of results per page
 * @param {string} [options.sortBy='name'] - Column to sort by
 * @param {string} [options.sortOrder='ASC'] - Sorting order (ASC/DESC)
 * @returns {Promise<{ data: Array, pagination: Object }>} Processed locations with pagination
 */
const fetchAllLocations = async ({ page, limit, sortBy, sortOrder }) => {
  try {
    // Ensure pagination values are positive integers
    page = Number(page);
    limit = Number(limit);
    if (page < 1 || limit < 1) {
      throw new AppError('Page and limit must be positive integers.');
    }

    // Fetch data from repository
    const { data, pagination } = await getLocations({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Apply business logic (e.g., flagging high-fee warehouses)
    const processedData = data.map((location) => ({
      ...location,
      is_high_fee_warehouse: location.warehouse_fee > 500, // Example: Mark as high-fee if over $500
    }));

    return {
      locations: processedData,
      pagination,
    };
  } catch (error) {
    logError('Error fetching locations in service:', error);
    throw new AppError(
      error.message || 'Failed to fetch locations',
      error.statusCode || 500,
      error
    );
  }
};

module.exports = {
  fetchAllLocations,
};
