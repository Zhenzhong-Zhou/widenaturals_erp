const wrapAsync = require('../utils/wrap-async');
const { fetchPaginatedSkuProductCardsService } = require('../services/sku-service');

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
    sortBy = 'p.name, p.created_at',
    sortOrder = 'DESC',
    brand,
    category,
    marketRegion,
    sizeLabel,
    keyword,
  } = req.query;
  
  const result = await fetchPaginatedSkuProductCardsService({
    page: Number(page),
    limit: Number(limit),
    sortBy,
    sortOrder,
    filters: { brand, category, marketRegion, sizeLabel, keyword },
  });
  
  const { data, pagination } = result;
  
  res.status(200).json({
    success: true,
    message: 'Fetched active SKU product cards successfully',
    data,
    pagination,
  });
});

module.exports = {
  getActiveSkuProductCardsController,
};
