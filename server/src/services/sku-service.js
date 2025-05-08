const { getStatusId } = require('../config/status-cache');
const { fetchPaginatedActiveSkusWithProductCards } = require('../repositories/sku-repository');
const { transformSkuProductCardList } = require('../transformers/sku-transformer');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Service to fetch a paginated list of active SKU product cards.
 *
 * Filters by active product and active SKU status.
 * Includes brand/category filters, region, size label, search keyword, and optional sorting.
 *
 * @param {Object} options - Query and filter options.
 * @param {number} options.page - Page number (1-based).
 * @param {number} options.limit - Items per page.
 * @param {string} [options.sortBy='p.name, p.created_at'] - Field(s) to sort by.
 * @param {string} [options.sortOrder='DESC'] - Sort direction ('ASC' or 'DESC').
 * @param {Object} [options.filters] - Optional filters (brand, category, marketRegion, sizeLabel, keyword).
 * @returns {Promise<Object>} Paginated and transformed SKU product card results:
 * {
 *   data: Array<TransformedSkuCard>,
 *   pagination: { page, limit, totalRecords, totalPages }
 * }
 */
const fetchPaginatedSkuProductCardsService = async ({
                                                      page = 1,
                                                      limit = 10,
                                                      sortBy = 'p.name, p.created_at',
                                                      sortOrder = 'DESC',
                                                      filters = {},
                                                    }) => {
  try {
    // Fetch the active status ID
    const productStatusId = getStatusId('product_active');
    
    const { data, totalRecords, totalPages } = await fetchPaginatedActiveSkusWithProductCards({
      page,
      limit,
      sortBy,
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
