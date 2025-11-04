/**
 * @fileoverview
 * Controller: Products
 *
 * Handles HTTP requests for product listing and detail endpoints.
 * Delegates business logic to service layer functions and ensures
 * consistent API responses with structured pagination metadata.
 */

const wrapAsync = require('../utils/wrap-async');
const {
  fetchProductDropdownList,
  fetchAvailableProductsForDropdown,
  fetchPaginatedProductsService,
} = require('../services/product-service');
const { logInfo } = require('../utils/logger-helper');

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
    const products = await fetchAvailableProductsForDropdown(
      search,
      parseInt(limit, 10)
    );

    // Send the response
    res.status(200).json(products);
  } catch (error) {
    next(error); // Passes error to error-handling middleware
  }
});

/**
 * Controller: Fetch Paginated Products
 *
 * Handles GET requests for `/api/products` with optional filters, sorting, and pagination.
 *
 * ### Flow
 * 1. Extract normalized query parameters from `req.normalizedQuery`
 *    (populated by prior middleware, e.g., query normalization).
 * 2. Delegate to `fetchPaginatedProductsService` for business logic and DB access.
 * 3. Return standardized JSON response `{ success, data, pagination }`.
 * 4. Log key events using structured logs (`logInfo`, `logError`).
 *
 * ### Example Request
 * GET /api/products?page=1&limit=10&sortBy=created_at&sortOrder=DESC&keyword=Immune
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getPaginatedProductsController = wrapAsync(async (req, res) => {
  const logContext = 'products-controller/getPaginatedProductsController';
  
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery ?? {
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
    filters: {},
  };
  
  // Step 1: Delegate to service layer
  const result = await fetchPaginatedProductsService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  const { data, pagination } = result ?? { data: [], pagination: { page, limit, totalRecords: 0, totalPages: 0 } };
  
  // Step 2: Handle no data
  if (!data || data.length === 0) {
    logInfo('No products found for current query', req, {
      context: logContext,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    res.status(200).json({
      success: true,
      message: 'No products found for the given criteria.',
      data: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: 0,
        totalPages: 0,
      },
    });
  }
  
  // Step 3: Return success response
  logInfo('Fetched paginated products successfully', req, {
    context: logContext,
    filters,
    pagination,
    sorting: { sortBy, sortOrder },
  });
  
  res.status(200).json({
    success: true,
    message: 'Products fetched successfully.',
    data,
    pagination,
  });
});

module.exports = {
  getProductsDropdownListController,
  getProductsForDropdownController,
  getPaginatedProductsController,
};
