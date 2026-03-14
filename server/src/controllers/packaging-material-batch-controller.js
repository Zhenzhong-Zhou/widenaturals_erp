const wrapAsync = require('../utils/wrap-async');
const AppError = require('../utils/AppError');
const { logInfo } = require('../utils/logger-helper');
const {
  fetchPaginatedPackagingMaterialBatchesService,
  createPackagingMaterialBatchesService,
  editPackagingMaterialBatchMetadataService,
  updatePackagingMaterialBatchStatusService,
  receivePackagingMaterialBatchService,
  releasePackagingMaterialBatchService,
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
    const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

    // Authenticated requester
    const user = req.auth.user;

    if (!user) {
      throw AppError.authorizationError('Authenticated user missing');
    }

    // Trace identifier for cross-layer correlation
    const traceId = `packaging-material-batch-${Date.now().toString(36)}`;

    // -------------------------------------------------
    // 2. Incoming request log
    // -------------------------------------------------
    logInfo('Incoming request: fetch packaging material batches', req, {
      context,
      traceId,
      userId: user.id,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      filters,
    });

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
    logInfo('Completed fetch packaging material batches', req, {
      context,
      traceId,
      pagination,
      sorting: { sortBy, sortOrder },
      count: data.length,
      elapsedMs,
    });

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

/**
 * Handles bulk creation of packaging material batches.
 *
 * Responsibilities:
 * - Validate incoming request payload structure
 * - Log request lifecycle events
 * - Delegate batch creation to the service layer
 * - Return structured API response
 *
 * Notes:
 * - Primary validation is handled by Joi middleware.
 * - This controller performs a defensive check to ensure
 *   the request payload contains a valid array.
 * - Business logic and database operations are handled
 *   by `createPackagingMaterialBatchesService`.
 *
 * @route POST /packaging-material-batches
 *
 * @param {import('express').Request} req
 * Express request object.
 *
 * @param {Object} req.body
 * Request body validated by Joi middleware.
 *
 * @param {Array<Object>} req.body.packagingMaterialBatches
 * List of packaging material batch objects to create.
 *
 * @param {Object} req.auth
 * Authentication metadata injected by auth middleware.
 *
 * @param {Object} req.auth.user
 * Authenticated user performing the operation.
 *
 * @param {import('express').Response} res
 * Express response object.
 *
 * @returns {Promise<void>}
 *
 * @throws {AppError}
 * If the request payload is invalid or batch creation fails.
 */
const createPackagingMaterialBatchesController = wrapAsync(async (req, res) => {
  const context =
    'packaging-material-batch-controller/createPackagingMaterialBatchesController';
  
  // Track request start time for performance monitoring
  const startTime = Date.now();
  
  // Generate lightweight trace ID for debugging
  const traceId = `create-packaging-batch-${Date.now().toString(36)}`;
  
  const { packagingMaterialBatches } = req.body;
  const user = req.auth.user;
  
  //------------------------------------------------------------
  // Defensive payload validation
  // (Joi should already validate this)
  //------------------------------------------------------------
  if (
    !Array.isArray(packagingMaterialBatches) ||
    packagingMaterialBatches.length === 0
  ) {
    throw AppError.validationError(
      'No packaging material batches provided.',
      { context, traceId }
    );
  }
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  logInfo('Starting bulk packaging material batch creation request', req, {
    context,
    traceId,
    userId: user.id,
    batchCount: packagingMaterialBatches.length,
  });
  
  //------------------------------------------------------------
  // Delegate creation to service layer
  //------------------------------------------------------------
  const result = await createPackagingMaterialBatchesService(
    packagingMaterialBatches,
    user
  );
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  logInfo('Bulk packaging material batch creation completed', req, {
    context,
    traceId,
    inputCount: packagingMaterialBatches.length,
    createdCount: result.length,
    elapsedMs,
  });
  
  //------------------------------------------------------------
  // Return structured API response
  //------------------------------------------------------------
  res.status(201).json({
    success: true,
    message: 'Packaging material batches created successfully.',
    stats: {
      inputCount: packagingMaterialBatches.length,
      createdCount: result.length,
      elapsedMs,
    },
    data: result,
  });
});

/**
 * Controller for editing packaging material batch metadata.
 *
 * This endpoint allows authorized users to update editable metadata
 * fields of a packaging material batch. Validation is performed by
 * the Joi middleware before the controller executes.
 *
 * Responsibilities:
 * - initiate structured request logging
 * - call the service layer to perform the batch update
 * - return a standardized API response
 *
 * Lifecycle and permission enforcement are handled in the
 * business/service layers.
 *
 * Route:
 * PATCH /packaging-material-batches/:batchId/metadata
 *
 * Middleware requirements:
 * - authorize()
 * - validate(editPackagingMaterialBatchMetadataSchema)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 *
 * @returns {Promise<void>}
 */
const editPackagingMaterialBatchMetadataController = wrapAsync(
  async (req, res) => {
    const context =
      'packaging-material-batch-controller/editPackagingMaterialBatchMetadataController';
    const startTime = Date.now();
    
    // Unique trace identifier for log correlation
    const traceId = `update-packaging-batch-${Date.now().toString(36)}`;
    
    //------------------------------------------------------------
    // Extract request data
    //------------------------------------------------------------
    const { batchId } = req.params;
    
    // Payload already validated by Joi middleware
    const updates = req.body;
    const user = req.auth?.user;
    
    //------------------------------------------------------------
    // Log request start
    //------------------------------------------------------------
    logInfo(
      'Starting packaging material batch metadata update request',
      req,
      {
        context,
        traceId,
        userId: user.id,
        batchId,
      }
    );
    
    //------------------------------------------------------------
    // Execute service layer
    //------------------------------------------------------------
    const result =
      await editPackagingMaterialBatchMetadataService(
        batchId,
        updates,
        user
      );
    
    //------------------------------------------------------------
    // Log completion
    //------------------------------------------------------------
    const elapsedMs = Date.now() - startTime;
    
    logInfo(
      'Packaging material batch metadata update completed',
      req,
      {
        context,
        traceId,
        batchId,
        elapsedMs,
      }
    );
    
    //------------------------------------------------------------
    // Send response
    //------------------------------------------------------------
    res.status(200).json({
      success: true,
      message: 'Packaging material batch updated successfully.',
      stats: {
        batchId,
        elapsedMs,
      },
      data: result,
    });
  }
);

/**
 * Controller for updating the lifecycle status of a packaging material batch.
 *
 * This endpoint allows authorized users to transition a packaging batch
 * to a different lifecycle status (e.g. pending → received).
 *
 * Responsibilities:
 * - Perform minimal safety validation
 * - Log request start and completion
 * - Delegate lifecycle logic to the service layer
 * - Return a standardized API response
 *
 * Lifecycle validation and automation (timestamps, actors, etc.)
 * are handled in the service/business layer.
 *
 * Route example:
 * PATCH /api/packaging-material-batches/:batchId/status
 *
 * Request body:
 * {
 *   "status_id": "uuid",
 *   "notes": "optional note"
 * }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 *
 * @returns {Promise<void>}
 */
const updatePackagingMaterialBatchStatusController = wrapAsync(async (req, res) => {
  const context =
    'packaging-material-batch-controller/updatePackagingMaterialBatchStatusController';
  
  const startTime = Date.now();
  const traceId = `update-packaging-batch-status-${Date.now().toString(36)}`;
  
  //------------------------------------------------------------
  // Extract request data
  //------------------------------------------------------------
  
  const { batchId } = req.params;
  const { status_id, notes } = req.body;
  const user = req.auth?.user;
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  
  logInfo('Starting packaging material batch status update request', req, {
    context,
    traceId,
    userId: user.id,
    batchId,
    statusId: status_id,
  });
  
  //------------------------------------------------------------
  // Delegate lifecycle update to service layer
  //------------------------------------------------------------
  
  const result = await updatePackagingMaterialBatchStatusService(
    batchId,
    status_id,
    notes,
    user
  );
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  
  logInfo('Packaging material batch status update completed', req, {
    context,
    traceId,
    batchId,
    statusId: status_id,
    elapsedMs,
  });
  
  //------------------------------------------------------------
  // Send standardized response
  //------------------------------------------------------------
  
  res.status(200).json({
    success: true,
    message: 'Packaging material batch status updated successfully.',
    stats: {
      batchId,
      elapsedMs,
    },
    data: result,
  });
});

/**
 * Controller for marking a packaging material batch as received.
 *
 * This endpoint represents the warehouse intake step when
 * packaging materials arrive from a supplier.
 *
 * Responsibilities:
 * - Log lifecycle event start and completion
 * - Delegate receive logic to the service layer
 *
 * The service layer will handle lifecycle validation,
 * timestamp automation, and inventory updates.
 *
 * Route example:
 * PATCH /api/packaging-material-batches/:batchId/receive
 *
 * Request body:
 * {
 *   "received_at": "optional ISO timestamp",
 *   "notes": "optional note"
 * }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 *
 * @returns {Promise<void>}
 */
const receivePackagingMaterialBatchController = wrapAsync(async (req, res) => {
  const context =
    'packaging-material-batch-controller/receivePackagingMaterialBatchController';
  
  const startTime = Date.now();
  const traceId = `receive-packaging-batch-${Date.now().toString(36)}`;
  
  //------------------------------------------------------------
  // Extract request data
  //------------------------------------------------------------
  
  const { batchId } = req.params;
  const { received_at, notes } = req.body;
  const user = req.auth?.user;
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  
  logInfo('Starting packaging material batch receive request', req, {
    context,
    traceId,
    userId: user.id,
    batchId,
  });
  
  //------------------------------------------------------------
  // Execute service layer
  //------------------------------------------------------------
  
  const result = await receivePackagingMaterialBatchService(
    batchId,
    received_at,
    notes,
    user
  );
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  
  logInfo('Packaging material batch received successfully', req, {
    context,
    traceId,
    batchId,
    elapsedMs,
  });
  
  //------------------------------------------------------------
  // Send response
  //------------------------------------------------------------
  
  res.status(200).json({
    success: true,
    message: 'Packaging material batch marked as received.',
    stats: {
      batchId,
      elapsedMs,
    },
    data: result,
  });
});

/**
 * Controller for releasing a packaging material batch for operational use.
 *
 * This endpoint indicates that a packaging batch has passed
 * quality inspection and is approved for manufacturing or packaging use.
 *
 * Responsibilities:
 * - Log release lifecycle event
 * - Delegate release logic to the service layer
 *
 * Route example:
 * PATCH /api/packaging-material-batches/:batchId/release
 *
 * Request body:
 * {
 *   "supplier_id": "uuid",
 *   "notes": "optional QA note"
 * }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 *
 * @returns {Promise<void>}
 */
const releasePackagingMaterialBatchController = wrapAsync(async (req, res) => {
  const context =
    'packaging-material-batch-controller/releasePackagingMaterialBatchController';
  
  const startTime = Date.now();
  const traceId = `release-packaging-batch-${Date.now().toString(36)}`;
  
  //------------------------------------------------------------
  // Extract request data
  //------------------------------------------------------------
  
  const { batchId } = req.params;
  const { supplier_id, notes } = req.body;
  const user = req.auth?.user;
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  
  logInfo('Starting packaging material batch release request', req, {
    context,
    traceId,
    userId: user.id,
    batchId,
    supplierId: supplier_id,
  });
  
  //------------------------------------------------------------
  // Execute service layer
  //------------------------------------------------------------
  
  const result = await releasePackagingMaterialBatchService(
    batchId,
    supplier_id,
    notes,
    user
  );
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  
  logInfo('Packaging material batch release completed', req, {
    context,
    traceId,
    batchId,
    supplierId: supplier_id,
    elapsedMs,
  });
  
  //------------------------------------------------------------
  // Send response
  //------------------------------------------------------------
  
  res.status(200).json({
    success: true,
    message: 'Packaging material batch released successfully.',
    stats: {
      batchId,
      elapsedMs,
    },
    data: result,
  });
});

module.exports = {
  getPaginatedPackagingMaterialBatchesController,
  createPackagingMaterialBatchesController,
  editPackagingMaterialBatchMetadataController,
  updatePackagingMaterialBatchStatusController,
  receivePackagingMaterialBatchController,
  releasePackagingMaterialBatchController,
};
