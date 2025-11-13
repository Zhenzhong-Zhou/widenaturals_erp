const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedSkuProductCardsService,
  getSkuDetailsForUserService, createSkusService,
} = require('../services/sku-service');
const { logInfo } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Controller for fetching a paginated list of active SKU product cards.
 * Applies filters on active product and SKU status.
 *
 * Accepts optional query parameters:
 * - page (default: 1)
 * - limit (default: 10)
 * - sortBy (default: 'p.name, p.created_at')
 * - sortOrder (default: 'DESC')
 * - brand, category, marketRegion, sizeLabel, keyword (as filters)
 *
 * Returns a structured paginated response with product and SKU details,
 * pricing (MSRP), compliance info, and primary image.
 */
const getActiveSkuProductCardsController = wrapAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'name, created_at',
    sortOrder = 'DESC',
    brand,
    category,
    marketRegion,
    sizeLabel,
    keyword,
  } = req.query;

  const filters = { brand, category, marketRegion, sizeLabel, keyword };

  logInfo('Fetching active SKU product cards', req, {
    context: 'sku-controller/getActiveSkuProductCardsController',
    query: { page, limit, sortBy, sortOrder, filters },
  });

  const result = await fetchPaginatedSkuProductCardsService({
    page: Number(page),
    limit: Number(limit),
    sortBy,
    sortOrder,
    filters,
  });

  const { data, pagination } = result;

  logInfo('Fetched active SKU product cards successfully', req, {
    context: 'sku-controller/getActiveSkuProductCardsController',
    resultCount: data.length,
    pagination,
  });

  res.status(200).json({
    success: true,
    message: 'Fetched active SKU product cards successfully',
    data,
    pagination,
  });
});

/**
 * GET /skus/:skuId
 * Returns detailed SKU information for the authenticated user, with pricing and status filtering applied.
 */
const getSkuDetailsController = wrapAsync(async (req, res) => {
  const { skuId } = req.params;
  const user = req.user;

  if (!skuId) {
    throw AppError.validationError('SKU ID is required');
  }

  const data = await getSkuDetailsForUserService(user, skuId);

  logInfo('SKU details retrieved successfully', req, {
    context: 'sku-controller/getSkuDetailsController',
    userId: user.id,
    skuId,
  });

  res.status(200).json({
    success: true,
    message: 'SKU details retrieved successfully.',
    data,
  });
});

/**
 * @async
 * @function
 * @description
 * Controller for handling **bulk SKU creation** requests.
 *
 * Orchestrates the flow between request validation, business logic execution,
 * and API response formatting. This controller operates only on validated input
 * and delegates all domain logic to the service and business layers.
 *
 * Responsibilities:
 *  - Extract validated SKU array from `req.body.skus`
 *  - Retrieve authenticated user from `req.user`
 *  - Log request lifecycle and metrics
 *  - Delegate SKU creation to `createSkusService`
 *  - Return standardized success response with creation results
 *
 * Not responsible for:
 *  - Joi validation (handled in route middleware)
 *  - Authorization (handled in route middleware)
 *  - Business rules, DB locking, or SKU code generation
 *    → These are implemented in the service + business layers.
 *
 * @param {Request} req - Express request object (validated payload + user context)
 * @param {Response} res - Express response object
 *
 * @returns {JSON} 201 Created with:
 *    - success flag
 *    - message
 *    - stats (inputCount, createdCount, elapsedMs)
 *    - data (array of created SKU records)
 */
const createSkusController = wrapAsync(async (req, res) => {
  const context = 'sku-controller/createSkusController';
  const startTime = Date.now();
  const traceId = `create-sku-${Date.now().toString(36)}`;
  
  const { skus } = req.body; // validated by Joi prior to controller
  const user = req.user;     // set by auth middleware
  
  if (!Array.isArray(skus) || skus.length === 0) {
    throw AppError.validationError('No SKUs provided.', { context, traceId });
  }
  
  logInfo('Starting bulk SKU creation request', req, {
    context,
    traceId,
    userId: user.id,
    count: skus.length,
  });
  
  // --- Execute business logic through service layer ---
  const result = await createSkusService(skus, user);
  
  const elapsedMs = Date.now() - startTime;
  
  logInfo('Bulk SKU creation completed', req, {
    context,
    traceId,
    inputCount: skus.length,
    createdCount: result.length,
    elapsedMs,
  });
  
  res.status(201).json({
    success: true,
    message: 'SKUs created successfully.',
    stats: {
      inputCount: skus.length,
      createdCount: result.length,
      elapsedMs,
    },
    data: result,
  });
});

module.exports = {
  getActiveSkuProductCardsController,
  getSkuDetailsController,
  createSkusController,
};
