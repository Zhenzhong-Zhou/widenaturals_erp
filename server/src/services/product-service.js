const { getProducts } = require('../repositories/product-repository');
const { logInfo, logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Service to fetch all products with pagination and filtering.
 * @param {Object} params - The query parameters.
 * @param {number} [params.page=1] - The page number for pagination.
 * @param {number} [params.limit=10] - The number of items per page.
 * @param {string} [params.category] - The category to filter products.
 * @param {string} [params.name] - The product name to filter products.
 * @returns {Promise<Object>} - The paginated list of products and metadata.
 */
const fetchAllProducts = async ({ page = 1, limit = 10, category, name }) => {
  try {
    // Validate and sanitize inputs
    if (!Number.isInteger(page) || page < 1) {
      throw new AppError.validationError('Page must be a positive integer.', 400);
    }
    if (!Number.isInteger(limit) || limit < 1) {
      throw new AppError.validationError('Limit must be a positive integer.', 400);
    }
    
    // Construct filters dynamically
    const filters = {};
    if (category) filters.category = category.trim();
    if (name) filters.name = name.trim();
    
    logInfo('Fetching products', { page, limit, filters });
    
    // Call the repository layer, which handles pagination and retry
    const { data, pagination } = await getProducts({ page, limit, filters });
    
    logInfo('Products fetched successfully', {
      resultCount: data.length,
      pagination,
    });
    
    return {
      data,
      pagination, // Already calculated in the repository layer
    };
  } catch (error) {
    logError('Error in fetchAllProducts', {
      message: error.message,
      stack: error.stack,
    });
    throw AppError.serviceError('Failed to fetch products', {
      originalError: error.message,
    });
  }
};

module.exports = {
  fetchAllProducts,
};
