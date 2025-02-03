const wrapAsync = require('../utils/wrap-async');
const { fetchAllProducts, fetchProductDetails } = require('../services/product-service');
const { logInfo, logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

// Controller to handle the GET /products request
const getProductsController = wrapAsync(async (req, res, next) => {
  // Extract and validate query parameters
  let { page = 1, limit = 10, category, name } = req.query;
  
  try {
    // Validate inputs
    const paginationParams = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      category,
      name
    };
    
    if (paginationParams.page < 1 || paginationParams.limit < 1) {
      return next(AppError.validationError('Page and limit must be positive integers.'));
    }
    
    // Call the service layer
    const products = await fetchAllProducts(paginationParams);
    
    // Log the successful response
    logInfo('Products fetched successfully', {
      page,
      limit,
      category,
      name,
      resultCount: products.data.length,
    });
    
    // Send the response back to the client
    res.status(200).json({
      success: true,
      data: products.data,
      pagination: products.pagination,
    });
  } catch (error) {
    // Add context and log the error
    logError('Error fetching products', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      method: req.method,
      route: req.originalUrl,
      userAgent: req.headers['user-agent'],
    });
    
    next(
      AppError.serviceError('Failed to fetch products', {
        originalError: error.message,
      })
    );
  }
});

/**
 * Controller to fetch product details by ID.
 * Validates the product ID and fetches product details using the service layer.
 * Returns the product details if found, or an appropriate error response.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - The ID of the product to fetch
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {Promise<void>} - Returns JSON response or passes error to the next middleware
 */
const getProductDetailsByIdController = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Validate the product ID
  if (!id || typeof id !== 'string') {
    return next(AppError.validationError('Invalid product ID'));
  }
  
  try {
    // Fetch product details from the service
    const product = await fetchProductDetails(id);
    
    // Return product details
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    logError('Error fetching product details:', error.message);
    
    // Pass the error to centralized error handling
    next(error);
  }
});

module.exports = { getProductsController, getProductDetailsByIdController };
