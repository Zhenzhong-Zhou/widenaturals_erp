const { getStatusId } = require('../config/status-cache');
const { fetchPaginatedActiveSkusWithProductCards, getSkuDetailsWithPricingAndMeta } = require('../repositories/sku-repository');
const { transformSkuProductCardList, transformSkuDetailsWithMeta } = require('../transformers/sku-transformer');
const AppError = require('../utils/AppError');
const { logError, logInfo } = require('../utils/logger-helper');
const { sanitizeSortBy } = require('../utils/sort-utils');
const { getAllowedStatusIdsForUser, getAllowedPricingTypesForUser } = require('../business/sku-business');
const { logSystemException } = require('../utils/system-logger');

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
    
    logInfo('Fetching paginated SKU product cards from DB', null, {
      context: 'fetchPaginatedSkuProductCardsService',
      page,
      limit,
      sortBy: sanitizedSortBy,
      sortOrder,
      filters,
      productStatusId,
    });
    
    const { data, totalRecords, totalPages } = await fetchPaginatedActiveSkusWithProductCards({
      page,
      limit,
      sortBy: sanitizedSortBy,
      sortOrder,
      productStatusId,
      filters,
    });
    
    const transformed = transformSkuProductCardList(data);
    
    logInfo('Successfully fetched SKU product cards', null, {
      context: 'fetchPaginatedSkuProductCardsService',
      returnedRecords: transformed.length,
      totalRecords,
      totalPages,
    });
    
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
    logError('Failed to fetch SKU product cards', null, {
      context: 'fetchPaginatedSkuProductCardsService',
      errorMessage: error.message,
    });
    throw AppError.serviceError('Failed to fetch active SKU product cards');
  }
};

/**
 * Service function that fetches a SKU with status and pricing visibility rules applied.
 *
 * @param {object} user - Authenticated user
 * @param {string} skuId - SKU ID to fetch
 * @returns {Promise<object>} Transformed SKU detail for frontend
 */
const getSkuDetailsForUserService = async (user, skuId) => {
  try {
    const allowedStatusIds = await getAllowedStatusIdsForUser(user);
    const allowedPricingTypes = await getAllowedPricingTypesForUser(user);

    const row = await getSkuDetailsWithPricingAndMeta(skuId, {
      allowedStatusIds,
      allowedPricingTypes,
    });

    return transformSkuDetailsWithMeta(row);
  } catch (err) {
    logSystemException('Failed to fetch SKU details for user', {
      context: 'getSkuDetailsForUserService',
      skuId,
      userId: user?.id,
      error: err,
    });

    throw AppError.serviceError(err, 'Could not retrieve SKU details'); // Or rethrow if already wrapped
  }
};

module.exports = {
  fetchPaginatedSkuProductCardsService,
  getSkuDetailsForUserService,
};
