const wrapAsync = require('../utils/wrap-async');
const AppError = require('../utils/AppError');
const { logInfo } = require('../utils/logger-helper');
const { fetchPaginatedBatchRegistryService } = require('../services/batch-registry-service');

/**
 * Controller: Fetch paginated batch registry records.
 *
 * Responsibilities:
 * - Extract normalized and validated query parameters from middleware
 * - Log request metadata and execution timing
 * - Delegate pagination, visibility enforcement, and transformation
 *   to the batch registry service layer
 * - Return a standardized paginated API response with trace metadata
 *
 * Notes:
 * - Route-level authorization ensures module access (e.g. VIEW_BATCH_REGISTRY)
 * - Batch visibility (product vs packaging) is enforced in business/service layers
 * - Sorting columns are assumed SQL-safe (resolved upstream)
 * - Controller performs NO business logic or ACL evaluation
 */
const getPaginatedBatchRegistryController = wrapAsync(async (req, res) => {
  const context =
    'batch-registry-controller/getPaginatedBatchRegistryController';
  const startTime = Date.now();
  
  // -------------------------------
  // 1. Extract normalized query params
  // -------------------------------
  // Parameters are normalized and schema-validated by upstream middleware
  const { page, limit, sortBy, sortOrder, filters } =
    req.normalizedQuery;
  
  // Authenticated requester (populated by auth middleware)
  const user = req.user;
  
  if (!user) {
    throw AppError.authorizationError('Authenticated user missing');
  }
  
  // Trace identifier for correlating logs across controller,
  // service, and repository layers
  const traceId = `batch-registry-${Date.now().toString(36)}`;
  
  // -------------------------------
  // 2. Incoming request log
  // -------------------------------
  logInfo('Incoming request: fetch batch registry', req, {
    context,
    traceId,
    userId: user.id,
    pagination: { page, limit },
    sorting: { sortBy, sortOrder },
    filters,
  });
  
  // -------------------------------
  // 3. Execute service layer
  // -------------------------------
  // Visibility enforcement, keyword permissions,
  // and transformation occur in the service layer
  const { data, pagination } =
    await fetchPaginatedBatchRegistryService({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
      user,
    });
  
  const elapsedMs = Date.now() - startTime;
  
  // -------------------------------
  // 4. Completion log
  // -------------------------------
  logInfo('Completed fetch batch registry', req, {
    context,
    traceId,
    pagination,
    sorting: { sortBy, sortOrder },
    count: data.length,
    elapsedMs,
  });
  
  // -------------------------------
  // 5. Send response
  // -------------------------------
  res.status(200).json({
    success: true,
    message: 'Batch registry retrieved successfully.',
    data,
    pagination,
    traceId,
  });
});

module.exports = {
  getPaginatedBatchRegistryController,
};
