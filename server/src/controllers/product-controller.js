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
  fetchPaginatedProductsService,
  fetchProductDetailsService,
  updateProductStatusService, updateProductInfoService, createProductsService,
} = require('../services/product-service');
const { logInfo } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

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

/**
 * Controller: Update Product Information
 *
 * Handles HTTP requests for updating product metadata fields
 * (excluding status). Delegates business logic to the service layer
 * and ensures consistent API response formatting.
 *
 * ### Behavior
 * - Parses `productId` from request params.
 * - Validates and forwards update payload to service.
 * - Returns a standardized success JSON response.
 * - Relies on global error middleware for exception handling.
 *
 * @route PUT /api/products/:productId/info
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 *
 * @returns {Promise<void>}
 */
const updateProductInfoController = wrapAsync(async (req, res) => {
  const { productId } = req.params;
  const updates = req.body;
  const user = req.user; // injected by auth middleware
  
  // Basic input validation
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required productId parameter.',
    });
  }
  
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Invalid request payload.',
    });
  }
  
  // Delegate to service
  const result = await updateProductInfoService({ productId, updates, user });
  
  // Success response
  return res.status(200).json({
    success: true,
    message: 'Product information updated successfully.',
    data: result, // { id }
  });
});

/**
 * @async
 * @function
 * @description
 * Handles bulk product creation requests.
 *
 * Responsibilities:
 *  - Extracts validated product input from `req.body.products`
 *  - Delegates creation logic to `createProductsService`
 *  - Emits structured logs for auditing and diagnostics
 *  - Returns standardized API response with statistics and inserted records
 *
 * Notes:
 *  - Joi validation (shape, types) and authorization must occur in middleware.
 *  - This controller intentionally contains no DB logic or business rules.
 */
const createProductsController = wrapAsync(async (req, res) => {
  const context = 'product-controller/createProductsController';
  const startTime = Date.now();
  const traceId = `create-products-${Date.now().toString(36)}`;
  
  const { products } = req.body;   // validated by Joi beforehand
  const user = req.user;           // populated by auth middleware
  
  if (!Array.isArray(products) || products.length === 0) {
    throw AppError.validationError('No products provided.', { context, traceId });
  }
  
  logInfo('Starting bulk product creation request', req, {
    context,
    traceId,
    userId: user.id,
    productCount: products.length,
  });
  
  // -------------------------------
  // 1. Execute service layer logic
  // -------------------------------
  const inserted = await createProductsService(products, user);
  
  const elapsedMs = Date.now() - startTime;
  
  logInfo('Bulk product creation completed', req, {
    context,
    traceId,
    inputCount: products.length,
    insertedCount: inserted.length,
    elapsedMs,
  });
  
  // -------------------------------
  // 2. Send response
  // -------------------------------
  res.status(201).json({
    success: true,
    message: 'Products created successfully.',
    stats: {
      inputCount: products.length,
      createdCount: inserted.length,
      elapsedMs,
    },
    data: inserted,
  });
});

module.exports = {
  getPaginatedProductsController,
  getProductDetailsController,
  updateProductStatusController,
  updateProductInfoController,
  createProductsController,
};
