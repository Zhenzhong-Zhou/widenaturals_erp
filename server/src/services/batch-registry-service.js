const {
  evaluateBatchRegistryVisibility,
  applyBatchRegistryVisibilityRules,
  sliceBatchRegistryRow,
} = require('../business/batch-registry-business');
const {
  getPaginatedBatchRegistry,
} = require('../repositories/batch-registry-repository');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const {
  transformPaginatedBatchRegistryResults,
} = require('../transformers/batch-registry-transformer');
const AppError = require('../utils/AppError');

/**
 * Service: Fetch paginated batch registry records for UI consumption.
 *
 * Responsibilities:
 * - Resolve batch visibility scope for the requesting user
 * - Translate business / ACL decisions into repository-consumable filters
 * - Orchestrate paginated batch registry queries
 * - Optionally enforce defensive row-level visibility (non-broadening)
 * - Normalize empty result sets
 * - Transform flat batch rows into UI-ready shapes
 * - Emit structured success and failure logs
 *
 * Visibility enforcement model:
 * - Repository-level filtering is the PRIMARY enforcement mechanism
 * - Service-level filter adjustment expresses business intent (scope, mode)
 * - Per-row filtering is DEFENSIVE only (never expands visibility)
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Normalized pre-business filters
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {Object} options.user - Authenticated requester context
 *
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
const fetchPaginatedBatchRegistryService = async ({
  filters = {},
  page = 1,
  limit = 20,
  user,
}) => {
  const context = 'batch-registry-service/fetchPaginatedBatchRegistryService';

  try {
    // ---------------------------------------------------------
    // Step 0 — Resolve batch registry visibility scope
    // ---------------------------------------------------------
    const access = await evaluateBatchRegistryVisibility(user);

    // ---------------------------------------------------------
    // Step 1 — Apply visibility / scope rules (CRITICAL)
    // ---------------------------------------------------------
    const adjustedFilters = applyBatchRegistryVisibilityRules(filters, access);

    // ---------------------------------------------------------
    // Step 2 — Query raw batch registry rows
    // ---------------------------------------------------------
    const rawResult = await getPaginatedBatchRegistry({
      filters: adjustedFilters,
      page,
      limit,
    });

    // ---------------------------------------------------------
    // Step 3 — Handle empty result
    // ---------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No batch registry records found', {
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
    // Step 4 — Defensive row-level slicing (minimal)
    // ---------------------------------------------------------
    const visibleRows = rawResult.data
      .map((row) => sliceBatchRegistryRow(row, access))
      .filter(Boolean);

    // ---------------------------------------------------------
    // Step 5 — Transform for UI consumption
    // ---------------------------------------------------------
    const result = transformPaginatedBatchRegistryResults({
      ...rawResult,
      data: visibleRows,
    });

    // ---------------------------------------------------------
    // Step 6 — Log success
    // ---------------------------------------------------------
    logSystemInfo('Paginated batch registry fetched', {
      context,
      filters: adjustedFilters,
      pagination: result.pagination,
      count: result.data?.length,
    });

    return result;
  } catch (error) {
    // ---------------------------------------------------------
    // Step 7 — Log + rethrow
    // ---------------------------------------------------------
    logSystemException(error, 'Failed to fetch batch registry', {
      context,
      filters,
      pagination: { page, limit },
      userId: user?.id,
    });

    throw AppError.serviceError(
      'Unable to retrieve batch records at this time.',
      { context }
    );
  }
};

module.exports = {
  fetchPaginatedBatchRegistryService,
};
