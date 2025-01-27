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

// Controller for fetching product details by ID
const getProductDetailsById = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const product = await fetchProductDetails(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    return res.status(500).json({ message: 'Error fetching product details' });
  }
});

module.exports = { getProductsController, getProductDetailsById };
