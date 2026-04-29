/**
 * @file sku-controller.js
 * @module controllers/sku-controller
 *
 * @description
 * Controllers for the SKU resource.
 *
 * Routes:
 *   GET   /api/v1/skus/product-cards          → getPaginatedSkuProductCardsController
 *   GET   /api/v1/skus                         → getPaginatedSkusController
 *   POST  /api/v1/skus                         → createSkusController
 *   GET   /api/v1/skus/:skuId                  → getSkuDetailsController
 *   PATCH /api/v1/skus/:skuId/metadata         → updateSkuMetadataController
 *   PATCH /api/v1/skus/:skuId/status           → updateSkuStatusController
 *   PATCH /api/v1/skus/:skuId/dimensions       → updateSkuDimensionsController
 *   PATCH /api/v1/skus/:skuId/identity         → updateSkuIdentityController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId) are emitted
 *   automatically by the global request-logger middleware via res.on('finish').
 *   skuId is present in the URL — no controller-level logging needed.
 *
 * Validation:
 *   All input validation (skuId, statusId, body shape, array checks) is
 *   handled by Joi middleware upstream. Controllers never validate or coerce input.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedSkuProductCardsService,
  createSkusService,
  updateSkuMetadataService,
  updateSkuStatusService,
  updateSkuDimensionsService,
  updateSkuIdentityService,
  fetchPaginatedSkusService,
  fetchSkuDetailsService,
} = require('../services/sku-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/skus/product-cards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated SKU product cards with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_SKU_PRODUCT_CARDS permission.
 */
const getPaginatedSkuProductCardsController = wrapAsyncHandler(
  async (req, res) => {
    const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
    const user = req.auth.user;

    const { data, pagination } = await fetchPaginatedSkuProductCardsService({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
      user,
    });

    res.status(200).json({
      success: true,
      message: 'SKU product cards retrieved successfully.',
      data,
      pagination,
      traceId: req.traceId,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/skus
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated SKU records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_SKUS permission.
 */
const getPaginatedSkusController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

  const { data, pagination } = await fetchPaginatedSkusService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  res.status(200).json({
    success: true,
    message: 'SKUs retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/skus
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates one or more SKU records.
 *
 * Accepts a JSON array in req.body.skus.
 * Requires: auth middleware, Joi body validation, CREATE_SKUS permission.
 */
const createSkusController = wrapAsyncHandler(async (req, res) => {
  const { skus } = req.body;
  const user = req.auth.user;

  const result = await createSkusService(skus, user);

  res.status(201).json({
    success: true,
    message: 'SKUs created successfully.',
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/skus/:skuId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves full details for a specific SKU.
 *
 * Not-found case is handled by the service layer via AppError.notFound().
 * Requires: auth middleware, VIEW_SKUS permission.
 */
const getSkuDetailsController = wrapAsyncHandler(async (req, res) => {
  const { skuId } = req.params;
  const user = req.auth.user;

  const data = await fetchSkuDetailsService(skuId, user);

  res.status(200).json({
    success: true,
    message: 'SKU details retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/skus/:skuId/metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates metadata fields on a specific SKU.
 *
 * Requires: auth middleware, Joi body validation, UPDATE_SKU_METADATA permission.
 */
const updateSkuMetadataController = wrapAsyncHandler(async (req, res) => {
  const { skuId } = req.params;
  const user = req.auth.user;

  const result = await updateSkuMetadataService({
    skuId,
    payload: req.body,
    user,
  });

  res.status(200).json({
    success: true,
    message: 'SKU metadata updated successfully.',
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/skus/:skuId/status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the status of a specific SKU.
 *
 * Requires: auth middleware, Joi body validation, UPDATE_SKU_STATUS permission.
 */
const updateSkuStatusController = wrapAsyncHandler(async (req, res) => {
  const { skuId } = req.params;
  const { statusId } = req.body;
  const user = req.auth.user;

  const result = await updateSkuStatusService({ skuId, statusId, user });

  res.status(200).json({
    success: true,
    message: 'SKU status updated successfully.',
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/skus/:skuId/dimensions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates dimension fields on a specific SKU.
 *
 * Requires: auth middleware, Joi body validation, UPDATE_SKU_DIMENSIONS permission.
 */
const updateSkuDimensionsController = wrapAsyncHandler(async (req, res) => {
  const { skuId } = req.params;
  const user = req.auth.user;

  const result = await updateSkuDimensionsService({
    skuId,
    payload: req.body,
    user,
  });

  res.status(200).json({
    success: true,
    message: 'SKU dimensions updated successfully.',
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/skus/:skuId/identity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates identity fields on a specific SKU.
 *
 * Requires: auth middleware, Joi body validation, UPDATE_SKU_IDENTITY permission.
 */
const updateSkuIdentityController = wrapAsyncHandler(async (req, res) => {
  const { skuId } = req.params;
  const user = req.auth.user;

  const result = await updateSkuIdentityService({
    skuId,
    payload: req.body,
    user,
  });

  res.status(200).json({
    success: true,
    message: 'SKU identity updated successfully.',
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedSkuProductCardsController,
  getPaginatedSkusController,
  createSkusController,
  getSkuDetailsController,
  updateSkuMetadataController,
  updateSkuStatusController,
  updateSkuDimensionsController,
  updateSkuIdentityController,
};
