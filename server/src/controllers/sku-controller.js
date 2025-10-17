const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedSkuProductCardsService,
  getSkuDetailsForUserService, getSkuBomCompositionService,
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
 * Controller: Fetch BOM composition and estimated cost summary for a given SKU.
 *
 * Route: GET /api/boms/by-sku/:skuId
 *
 * Responsibilities:
 *  - Validate SKU ID (middleware or Joi schema)
 *  - Call service to fetch structured BOM composition
 *  - Return standardized JSON response with summary
 *  - Handle and log errors consistently
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 *
 * @example
 * // Request
 * GET /api/boms/by-sku/374cfaad-a0ca-44dc-bfdd-19478c21f899
 *
 * // Response
 * {
 *   "success": true,
 *   "message": "Fetched BOM composition successfully.",
 *   "data": {
 *     "header": {...},
 *     "details": [...],
 *     "summary": {...}
 *   }
 * }
 */
const getSkuBomCompositionController = wrapAsync(async (req, res) => {
  const { skuId } = req.params;
  
  
  // Step 1. Defensive check (middleware handles Joi validation, but extra guard for safety)
  if (!skuId) {
    throw AppError.validationError('SKU ID is required', {
      context: 'sku-controller/getSkuBomCompositionController',
    });
  }
  
  // Step 2. Call service layer
  const result = await getSkuBomCompositionService(skuId);
  
  // Step 3. Log success (trace level)
  logInfo('Fetched SKU BOM composition successfully', req, {
    context: 'sku-controller/getSkuBomCompositionController',
    skuId,
    totalItems: result?.details?.length || 0,
    estimatedCost: result?.summary?.totalEstimatedCost || 0,
  });
  
  // Step 4. Return standardized API response
  return res.status(200).json({
    success: true,
    message: 'Fetched BOM composition successfully.',
    data: result,
  });
});

module.exports = {
  getActiveSkuProductCardsController,
  getSkuDetailsController,
  getSkuBomCompositionController,
};
