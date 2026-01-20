const wrapAsync = require('../utils/wrap-async');
const AppError = require('../utils/AppError');
const { logInfo } = require('../utils/logger-helper');
const {
  fetchPaginatedPackagingMaterialBatchesService,
} = require('../services/packaging-material-batch-service');

/**
 * Controller: Fetch paginated packaging material batch records.
 *
 * Responsibilities:
 * - Extract normalized and validated query parameters from middleware
 * - Log request metadata and execution timing
 * - Delegate pagination, visibility enforcement, and transformation
 *   to the packaging material batch service layer
 * - Return a standardized paginated API response with trace metadata
 *
 * Notes:
 * - Route-level authorization ensures module access (e.g. VIEW_PACKAGING_BATCHES)
 * - Packaging batch visibility and supplier exposure are enforced upstream
 * - Sorting columns are assumed SQL-safe (resolved upstream)
 * - Controller performs NO business logic or ACL evaluation
 */
const getPaginatedPackagingMaterialBatchesController = wrapAsync(
  async (req, res) => {
    const context =
      'packaging-material-batch-controller/getPaginatedPackagingMaterialBatchesController';
    const startTime = Date.now();
    
    // -------------------------------------------------
    // 1. Extract normalized query params
    // -------------------------------------------------
    // Normalized and schema-validated by upstream middleware
    const { page, limit, sortBy, sortOrder, filters } =
      req.normalizedQuery;
    
    // Authenticated requester
    const user = req.user;
    
    if (!user) {
      throw AppError.authorizationError('Authenticated user missing');
    }
    
    // Trace identifier for cross-layer correlation
    const traceId = `packaging-material-batch-${Date.now().toString(36)}`;
    
    // -------------------------------------------------
    // 2. Incoming request log
    // -------------------------------------------------
    logInfo(
      'Incoming request: fetch packaging material batches',
      req,
      {
        context,
        traceId,
        userId: user.id,
        pagination: { page, limit },
        sorting: { sortBy, sortOrder },
        filters,
      }
    );
    
    // -------------------------------------------------
    // 3. Execute service layer
    // -------------------------------------------------
    // Visibility enforcement, filtering, and transformation
    // occur entirely within the service layer
    const { data, pagination } =
      await fetchPaginatedPackagingMaterialBatchesService({
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
        user,
      });
    
    const elapsedMs = Date.now() - startTime;
    
    // -------------------------------------------------
    // 4. Completion log
    // -------------------------------------------------
    logInfo(
      'Completed fetch packaging material batches',
      req,
      {
        context,
        traceId,
        pagination,
        sorting: { sortBy, sortOrder },
        count: data.length,
        elapsedMs,
      }
    );
    
    // -------------------------------------------------
    // 5. Send response
    // -------------------------------------------------
    res.status(200).json({
      success: true,
      message: 'Packaging material batches retrieved successfully.',
      data,
      pagination,
      traceId,
    });
  }
);

module.exports = {
  getPaginatedPackagingMaterialBatchesController,
};
