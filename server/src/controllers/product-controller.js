const wrapAsync = require('../utils/wrap-async');
const {
  fetchAllProducts,
  fetchProductDetails,
  fetchProductDropdownList, fetchAvailableProductsForDropdown,
} = require('../services/product-service');
const { logInfo, logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { fetchWarehouseDropdownList } = require('../services/warehouse-service');

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
      name,
    };

    if (paginationParams.page < 1 || paginationParams.limit < 1) {
      return next(
        AppError.validationError('Page and limit must be positive integers.')
      );
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

const getProductsDropdownListController = wrapAsync(async (req, res, next) => {
  const { warehouseId } = req.params;
  try {
    const products = await fetchProductDropdownList(warehouseId);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

/**
 * Controller to fetch products for dropdown.
 * Filters by active status and supports search by product name, SKU, or barcode.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
const getProductsForDropdownController = wrapAsync(async (req, res, next) => {
  try {
    const { search = null, limit = 100 } = req.query;
    
    // Fetch products with optional search term and limit
    const products = await fetchAvailableProductsForDropdown(search, parseInt(limit, 10));
    
    // Send the response
    res.status(200).json(products);
  } catch (error) {
    next(error); // Passes error to error-handling middleware
  }
});

module.exports = {
  getProductsController,
  getProductDetailsByIdController,
  getProductsDropdownListController,
  getProductsForDropdownController,
};
