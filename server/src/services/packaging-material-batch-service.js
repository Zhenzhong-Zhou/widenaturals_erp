const {
  evaluatePackagingMaterialBatchVisibility,
  applyPackagingMaterialBatchVisibilityRules,
} = require('../business/packaging-material-batch-business');
const {
  getPaginatedPackagingMaterialBatches,
} = require('../repositories/packaging-material-batch-repository');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const {
  transformPaginatedPackagingMaterialBatchResults,
} = require('../transformers/packaging-material-batch-transformer');
const AppError = require('../utils/AppError');

/**
 * Service: Fetch paginated packaging material batch records for UI consumption.
 *
 * Responsibilities:
 * - Resolve packaging material batch visibility for the requesting user
 * - Translate ACL decisions into repository-consumable filters
 * - Execute paginated packaging material batch queries
 * - Normalize empty result sets
 * - Transform flat PMB rows into UI-ready shapes
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
const fetchPaginatedPackagingMaterialBatchesService = async ({
  filters = {},
  page = 1,
  limit = 20,
  user,
}) => {
  const context =
    'packaging-material-batch-service/fetchPaginatedPackagingMaterialBatchesService';

  try {
    // ---------------------------------------------------------
    // Step 0 — Resolve PMB visibility
    // ---------------------------------------------------------
    const access = await evaluatePackagingMaterialBatchVisibility(user);

    // ---------------------------------------------------------
    // Step 1 — Apply visibility / scope rules (CRITICAL)
    // ---------------------------------------------------------
    const adjustedFilters = applyPackagingMaterialBatchVisibilityRules(
      filters,
      access
    );

    // ---------------------------------------------------------
    // Step 2 — Query raw PMB rows
    // ---------------------------------------------------------
    const rawResult = await getPaginatedPackagingMaterialBatches({
      filters: adjustedFilters,
      page,
      limit,
    });

    // ---------------------------------------------------------
    // Step 3 — Handle empty result
    // ---------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No packaging material batches found', {
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
    const result = await transformPaginatedPackagingMaterialBatchResults(
      rawResult,
      access
    );

    // ---------------------------------------------------------
    // Step 5 — Log success
    // ---------------------------------------------------------
    logSystemInfo('Paginated packaging material batches fetched', {
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
    logSystemException(error, 'Failed to fetch packaging material batches', {
      context,
      filters,
      pagination: { page, limit },
      userId: user?.id,
    });

    throw AppError.serviceError(
      'Unable to retrieve packaging material batches at this time.',
      { context }
    );
  }
};

module.exports = {
  fetchPaginatedPackagingMaterialBatchesService,
};
