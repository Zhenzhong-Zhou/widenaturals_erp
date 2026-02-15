const {
  evaluateProductBatchVisibility,
  applyProductBatchVisibilityRules,
} = require('../business/product-batch-business');
const {
  getPaginatedProductBatches,
} = require('../repositories/product-batch-repository');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const {
  transformPaginatedProductBatchResults,
} = require('../transformers/product-batch-transformer');
const AppError = require('../utils/AppError');

/**
 * Service: Fetch paginated product batch records for UI consumption.
 *
 * Responsibilities:
 * - Resolve product batch visibility for the requesting user
 * - Translate ACL decisions into repository-consumable filters
 * - Execute paginated product batch queries
 * - Normalize empty result sets
 * - Transform flat product batch rows into UI-ready shapes
 * - Emit structured success and failure logs
 *
 * Visibility enforcement model:
 * - Repository-level filtering is the PRIMARY enforcement mechanism
 * - Service-level filter adjustment expresses business intent
 * - No row-level slicing is required (non-polymorphic domain)
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Normalized pre-business filters
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {Object} options.user - Authenticated requester context
 *
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
const fetchPaginatedProductBatchesService = async ({
  filters = {},
  page = 1,
  limit = 20,
  user,
}) => {
  const context = 'product-batch-service/fetchPaginatedProductBatchesService';

  try {
    // ---------------------------------------------------------
    // Step 0 — Resolve product batch visibility
    // ---------------------------------------------------------
    const access = await evaluateProductBatchVisibility(user);

    // ---------------------------------------------------------
    // Step 1 — Apply visibility / scope rules (CRITICAL)
    // ---------------------------------------------------------
    const adjustedFilters = applyProductBatchVisibilityRules(filters, access);

    // ---------------------------------------------------------
    // Step 2 — Query raw product batch rows
    // ---------------------------------------------------------
    const rawResult = await getPaginatedProductBatches({
      filters: adjustedFilters,
      page,
      limit,
    });

    // ---------------------------------------------------------
    // Step 3 — Handle empty result
    // ---------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No product batches found', {
        context,
        filters: adjustedFilters,
        pagination: { page, limit },
      });

      return {
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }

    // ---------------------------------------------------------
    // Step 4 — Transform for UI consumption
    // ---------------------------------------------------------
    const result = await transformPaginatedProductBatchResults(
      rawResult,
      access
    );

    // ---------------------------------------------------------
    // Step 5 — Log success
    // ---------------------------------------------------------
    logSystemInfo('Paginated product batches fetched', {
      context,
      filters: adjustedFilters,
      pagination: result.pagination,
      count: result.data?.length,
    });

    return result;
  } catch (error) {
    // ---------------------------------------------------------
    // Step 6 — Log + rethrow
    // ---------------------------------------------------------
    logSystemException(error, 'Failed to fetch product batches', {
      context,
      filters,
      pagination: { page, limit },
      userId: user?.id,
    });

    throw AppError.serviceError(
      'Unable to retrieve product batches at this time.',
      { context }
    );
  }
};

module.exports = {
  fetchPaginatedProductBatchesService,
};
