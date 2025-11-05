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
  fetchPaginatedProductsService, fetchProductDetailsService, updateProductStatusService,
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

/**
 * Controller: Fetch Product Details
 *
 * Handles GET requests for `/api/products/:productId`.
 * Retrieves a single product record including its status and audit information.
 *
 * ### Flow
 * 1. Extracts `productId` from `req.params` (validated by Joi middleware).
 * 2. Delegates to `fetchProductDetailsService` for business logic and data retrieval.
 * 3. Returns a standardized JSON response `{ success, message, data }`.
 * 4. Handles not-found and unexpected errors through centralized error middleware.
 * 5. Logs all key events using structured logging (`logInfo`, `logError`).
 *
 * ### Example Request
 * GET /api/products/8d5b7e4f-9231-4b0f-83d1-6c8e3b03b8f2
 *
 * ### Example Response
 * ```json
 * {
 *   "success": true,
 *   "message": "Product details fetched successfully.",
 *   "data": {
 *     "id": "uuid",
 *     "name": "Omega-3 Fish Oil",
 *     "brand": "Canaherb",
 *     "category": "Herbal Natural",
 *     "status": { "id": "uuid", "code": "ACTIVE", "name": "Active" },
 *     "audit": {
 *       "createdAt": "2025-11-03T20:10:00.000Z",
 *       "createdBy": { "id": "uuid", "fullName": "John Smith" },
 *       "updatedAt": "2025-11-03T21:00:00.000Z",
 *       "updatedBy": { "id": "uuid", "fullName": "Jane Lee" }
 *     }
 *   }
 * }
 * ```
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getProductDetailsController = wrapAsync(async (req, res) => {
  const logContext = 'products-controller/getProductDetailsController';
  const { productId } = req.params;
  
  // Step 1: Fetch product detail via service layer
  const product = await fetchProductDetailsService(productId);
  
  // Step 2: Log success
  logInfo('Fetched product detail successfully', req, {
    context: logContext,
    productId,
  });
  
  // Step 3: Return standardized response
  res.status(200).json({
    success: true,
    message: 'Product details fetched successfully.',
    data: product,
  });
});

/**
 * Controller: Update Product Status
 *
 * Handles PATCH requests to update a product’s status.
 * Provides structured logging, validation, and standardized JSON response.
 *
 * ### Flow
 * 1. Extract `productId` from route params and `statusId` from request body.
 * 2. Validate inputs (handled by middleware and fallback guards).
 * 3. Delegate to `updateProductStatusService` for transactional execution.
 * 4. Return standardized JSON response with result metadata.
 * 5. Log key events for traceability and audit.
 *
 * ### Example Request
 * PATCH /api/v1/products/:productId/status
 * {
 *   "statusId": "uuid-of-new-status"
 * }
 *
 * ### Example Response
 * {
 *   "success": true,
 *   "message": "Product status updated successfully.",
 *   "data": { "id": "uuid-of-product" }
 * }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateProductStatusController = wrapAsync(async (req, res) => {
  const logContext = 'products-controller/updateProductStatusController';
  
  // Step 1: Extract and validate inputs
  const { productId } = req.params;
  const { statusId } = req.body;
  const user = req.user;
  
  // Step 2: Execute service
  const result = await updateProductStatusService({ productId, statusId, user });
  
  // Step 3: Log and respond
  logInfo('Product status updated successfully', req, {
    context: logContext,
    productId,
    statusId,
    userId: user.id,
  });
  
  res.status(200).json({
    success: true,
    message: 'Product status updated successfully.',
    data: result, // { id: '...' }
  });
});

module.exports = {
  getProductsDropdownListController,
  getProductsForDropdownController,
  getPaginatedProductsController,
  getProductDetailsController,
  updateProductStatusController,
};
