/**
 * @file product-controller.js
 * @module controllers/product-controller
 *
 * @description
 * Controllers for the Product resource.
 *
 * Routes:
 *   GET   /api/v1/products                    → getPaginatedProductsController
 *   POST  /api/v1/products                    → createProductsController
 *   GET   /api/v1/products/:productId         → getProductDetailsController
 *   PATCH /api/v1/products/:productId/status  → updateProductStatusController
 *   PATCH /api/v1/products/:productId/info    → updateProductInfoController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId) are emitted
 *   automatically by the global request-logger middleware via res.on('finish').
 *   productId is present in the URL — no controller-level logging needed.
 *
 * Validation:
 *   All input validation (productId, statusId, body shape, array checks) is
 *   handled by Joi middleware upstream. Controllers never validate or coerce input.
 *
 * Empty results:
 *   An empty result set is a valid 200 response — the service returns
 *   { data: [], pagination } naturally. No special branch is needed here.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedProductsService,
  fetchProductDetailsService,
  updateProductStatusService,
  updateProductInfoService,
  createProductsService,
} = require('../services/product-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/products
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated product records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_PRODUCTS permission.
 */
const getPaginatedProductsController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  const { data, pagination } = await fetchPaginatedProductsService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success:   true,
    message:   'Products retrieved successfully.',
    data,
    pagination,
    traceId:   req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/products
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates one or more products.
 *
 * Accepts a JSON array in req.body.products.
 * Requires: auth middleware, Joi body validation, CREATE_PRODUCTS permission.
 */
const createProductsController = wrapAsyncHandler(async (req, res) => {
  const { products } = req.body;
  const user         = req.auth.user;
  
  const result = await createProductsService(products, user);
  
  res.status(201).json({
    success: true,
    message: 'Products created successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/products/:productId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves full details for a specific product.
 *
 * Not-found case is handled by the service layer via AppError.notFound().
 * Requires: auth middleware, VIEW_PRODUCTS permission.
 */
const getProductDetailsController = wrapAsyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  const data = await fetchProductDetailsService(productId);
  
  res.status(200).json({
    success: true,
    message: 'Product details retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/products/:productId/status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the status of a specific product.
 *
 * Requires: auth middleware, Joi body validation, UPDATE_PRODUCT_STATUS permission.
 */
const updateProductStatusController = wrapAsyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { statusId }  = req.body;
  const user          = req.auth.user;
  
  const result = await updateProductStatusService({ productId, statusId, user });
  
  res.status(200).json({
    success: true,
    message: 'Product status updated successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/products/:productId/info
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates information fields on a specific product.
 *
 * Requires: auth middleware, Joi body validation, UPDATE_PRODUCT_INFO permission.
 */
const updateProductInfoController = wrapAsyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user          = req.auth.user;
  
  const result = await updateProductInfoService({ productId, updates: req.body, user });
  
  res.status(200).json({
    success: true,
    message: 'Product information updated successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedProductsController,
  createProductsController,
  getProductDetailsController,
  updateProductStatusController,
  updateProductInfoController,
};
