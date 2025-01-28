const { getProducts, getProductDetailsById } = require('../repositories/product-repository');
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
const fetchAllProducts = async ({ page, limit, category, name }) => {
  try {
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

/**
 * Service to fetch detailed product information by ID.
 * Validates the input and retrieves product details from the repository layer.
 *
 * @param {string} id - The ID of the product to fetch
 * @returns {Promise<object>} - Returns the product details if found
 * @throws {AppError} - Throws a validation or internal server error if the operation fails
 */
const fetchProductDetails = async (id) => {
  try {
    // Fetch product details from the repository
    const product = await getProductDetailsById(id);
    
    return product;
  } catch (error) {
    logError('Error in service layer:', error.message);
    
    // Wrap and rethrow error for consistent error handling
    throw AppError.serviceError('Error fetching product details');
  }
};

module.exports = {
  fetchAllProducts,
  fetchProductDetails
};
