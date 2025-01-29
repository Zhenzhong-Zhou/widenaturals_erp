const { getAllPriceTypes } = require('../repositories/price-type-repository');
const { logInfo, logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Service to fetch all price types with pagination and optional filtering.
 * @param {Object} params - Query parameters for pagination and filtering.
 * @param {number} [params.page=1] - The page number for pagination.
 * @param {number} [params.limit=10] - The number of items per page.
 * @param {string} [params.name] - Optional filter for price type name.
 * @param {string} [params.status] - Optional filter for status.
 * @returns {Promise<Object>} - The paginated list of price types and metadata.
 */
const fetchAllPriceTypes = async ({ page = 1, limit = 10, name, status }) => {
  try {
    // Construct filters dynamically
    const filters = {};
    if (name) filters.name = name.trim();
    if (status) filters.status = status.trim();
    
    logInfo('Fetching price types', { page, limit, filters });
    
    // Call the repository layer, which handles pagination
    const { data, pagination } = await getAllPriceTypes({ page, limit, filters });
    
    logInfo('Price types fetched successfully', {
      resultCount: data.length,
      pagination,
    });
    
    return {
      data,
      pagination,
    };
  } catch (error) {
    logError('Error in fetchAllPriceTypes', {
      message: error.message,
      stack: error.stack,
    });
    
    throw new AppError('Failed to fetch price types', 500, {
      originalError: error.message,
    });
  }
};

module.exports = {
  fetchAllPriceTypes,
};
