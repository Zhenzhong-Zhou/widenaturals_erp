const { getStatusId } = require('../config/status-cache');
const { fetchPaginatedActiveSkusWithProductCards } = require('../repositories/sku-repository');
const { transformSkuProductCardList } = require('../transformers/sku-transformer');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { sanitizeSortBy } = require('../utils/sort-utils');

/**
 * Service to fetch a paginated list of active SKU product cards.
 *
 * Filters by active product and active SKU status.
 * Supports filtering by brand, category, market region, size label, and keyword.
 * Accepts optional sorting.
 *
 * @param {Object} options - Pagination, sorting, and filter options.
 * @param {number} options.page - Current page number (1-based).
 * @param {number} options.limit - Number of results per page.
 * @param {string} [options.sortBy] - Comma-separated sort keys (e.g., "name,created_at").
 * @param {string} [options.sortOrder='DESC'] - Sort direction ('ASC' or 'DESC').
 * @param {Object} [options.filters] - Optional filters (brand, category, marketRegion, sizeLabel, keyword).
 * @returns {Promise<Object>} Paginated and transformed SKU product card results:
 * {
 *   data: Array<TransformedSkuCard>,
 *   pagination: { page: number, limit: number, totalRecords: number, totalPages: number }
 * }
 */
const fetchPaginatedSkuProductCardsService = async ({
                                                      page = 1,
                                                      limit = 10,
                                                      sortBy = 'name,created_at',
                                                      sortOrder = 'DESC',
                                                      filters = {},
                                                    }) => {
  try {
    // Fetch the active status ID
    const productStatusId = getStatusId('product_active');
    
    const sanitizedSortBy = sanitizeSortBy(sortBy, 'skuProductCards');
    
    const { data, totalRecords, totalPages } = await fetchPaginatedActiveSkusWithProductCards({
      page,
      limit,
      sortBy: sanitizedSortBy,
      sortOrder,
      productStatusId,
      filters,
    });
    
    const transformed = transformSkuProductCardList(data);
    
    return {
      data: transformed,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
      },
    };
  } catch (error) {
    logError('Error fetching active SKUs with product cards');
    throw AppError.serviceError('Failed to fetch active SKU product cards');
  }
};

module.exports = {
  fetchPaginatedSkuProductCardsService,
};
