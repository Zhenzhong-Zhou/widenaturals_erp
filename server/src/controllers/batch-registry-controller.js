const { wrapAsyncHandler } = require('../middlewares/async-handler');
const AppError = require('../utils/AppError');
const { logInfo } = require('../utils/logger-helper');
const {
  fetchPaginatedBatchRegistryService,
  updateBatchRegistryNoteService,
} = require('../services/batch-registry-service');

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
const getPaginatedBatchRegistryController = wrapAsyncHandler(async (req, res) => {
  const context =
    'batch-registry-controller/getPaginatedBatchRegistryController';
  const startTime = Date.now();

  // -------------------------------
  // 1. Extract normalized query params
  // -------------------------------
  // Parameters are normalized and schema-validated by upstream middleware
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

  // Authenticated requester (populated by auth middleware)
  const user = req.auth.user;

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
  const { data, pagination } = await fetchPaginatedBatchRegistryService({
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

/**
 * Controller: Update Batch Registry Note
 *
 * Updates the note field associated with a batch registry record.
 * This endpoint is typically used to add operational remarks,
 * QA comments, or investigation notes related to a batch lifecycle.
 *
 * The note field is optional and may be:
 * - a trimmed string
 * - an empty string to clear the note
 * - null to remove the existing note
 *
 * Request validation is handled upstream by Joi middleware before
 * the controller executes.
 *
 * Authorization:
 * Requires the `BATCH_REGISTRY.UPDATE_NOTE` permission.
 *
 * Logging:
 * The controller records request start and completion events with
 * a generated trace ID to support observability, debugging, and
 * audit tracing.
 *
 * Route:
 * PATCH /api/v1/batch-registries/:batchRegistryId/note
 *
 * Path Parameters:
 * @param {string} batchRegistryId
 * UUID of the batch registry record whose note should be updated.
 *
 * Request Body:
 * @param {string|null} note
 * Optional note text describing batch-related remarks or comments.
 * The value is trimmed and limited to the configured maximum length.
 *
 * Response:
 * @returns {Object} JSON response containing:
 * - success: boolean indicating operation result
 * - message: human-readable success message
 * - stats: request execution metadata (batchRegistryId, elapsedMs)
 * - data: updated batch registry record identifier
 *
 * Example Request:
 * PATCH /api/v1/batch-registries/5e5b6a7c-9c8e-4c5b-bd11-9c7dcb45a201/note
 *
 * {
 *   "note": "Supplier confirmed packaging material batch passed QA inspection."
 * }
 */
const updateBatchRegistryNoteController = wrapAsyncHandler(async (req, res) => {
  const context =
    'batch-registry-controller/updateBatchRegistryNoteController';
  
  const startTime = Date.now();
  const traceId = `update-batch-registry-note-${Date.now().toString(36)}`;
  
  //------------------------------------------------------------
  // Extract request data
  //------------------------------------------------------------
  const { batchRegistryId } = req.params;
  
  // Joi validation already ensures correct payload
  const { note } = req.body;
  
  const user = req.auth?.user;
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  logInfo('Starting batch registry note update request', req, {
    context,
    traceId,
    userId: user.id,
    batchRegistryId,
  });
  
  //------------------------------------------------------------
  // Execute service layer
  //------------------------------------------------------------
  const result = await updateBatchRegistryNoteService(
    batchRegistryId,
    note,
    user,
  );
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  logInfo('Batch registry note update completed', req, {
    context,
    traceId,
    batchRegistryId,
    elapsedMs,
  });
  
  //------------------------------------------------------------
  // Send response
  //------------------------------------------------------------
  res.status(200).json({
    success: true,
    message: 'Batch registry note updated successfully.',
    stats: {
      batchRegistryId,
      elapsedMs,
    },
    data: result,
  });
});

module.exports = {
  getPaginatedBatchRegistryController,
  updateBatchRegistryNoteController,
};
