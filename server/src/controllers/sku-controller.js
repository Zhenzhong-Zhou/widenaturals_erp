const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedSkuProductCardsService,
  getSkuDetailsForUserService,
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
    context: 'sku-controller',
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
    context: 'sku-controller',
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
    context: 'sku-controller',
    userId: user.id,
    skuId,
  });

  res.status(200).json({
    success: true,
    message: 'SKU details retrieved successfully.',
    data,
  });
});

module.exports = {
  getActiveSkuProductCardsController,
  getSkuDetailsController,
};
