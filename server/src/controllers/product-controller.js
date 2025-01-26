const wrapAsync = require('../utils/wrap-async');
const { fetchAllProducts } = require('../services/product-service');

// Controller to handle the GET /products request
const getProductsController = wrapAsync(async (req, res, next) => {
  try {
    // Extract and validate query parameters
    let { page = 1, limit = 10, category, name } = req.query;
    
    // Ensure page and limit are positive integers
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and limit must be positive integers.',
      });
    }
    
    // Call the service layer
    const products = await fetchAllProducts({ page, limit, category, name });
    
    // Send the response back to the client
    res.status(200).json({
      success: true,
      data: products.data,
      pagination: products.pagination,
    });
  } catch (error) {
    // Add context to the error
    error.context = {
      ip: req.ip,
      method: req.method,
      route: req.originalUrl,
      userAgent: req.headers['user-agent'],
    };
    next(error); // Pass errors to the error handling middleware
  }
});

module.exports = { getProductsController };
