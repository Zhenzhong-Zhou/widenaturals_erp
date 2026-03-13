const wrapAsync = require('../utils/wrap-async');
const AppError = require('../utils/AppError');
const { logInfo } = require('../utils/logger-helper');
const {
  fetchPaginatedPackagingMaterialBatchesService,
  createPackagingMaterialBatchesService,
  editPackagingMaterialBatchMetadataService,
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

const createPackagingMaterialBatchesController = wrapAsync(async (req, res) => {
  const context =
    'packaging-material-batch-controller/createPackagingMaterialBatchesController';
  const startTime = Date.now();
  const traceId = `create-packaging-batch-${Date.now().toString(36)}`;
  
  const { packagingMaterialBatches } = req.body; // validated by Joi
  const user = req.auth.user;
  
  if (
    !Array.isArray(packagingMaterialBatches) ||
    packagingMaterialBatches.length === 0
  ) {
    throw AppError.validationError(
      'No packaging material batches provided.',
      { context, traceId }
    );
  }
  
  logInfo('Starting bulk packaging material batch creation request', req, {
    context,
    traceId,
    userId: user.id,
    count: packagingMaterialBatches.length,
  });
  
  // --- Execute service layer ---
  const result = await createPackagingMaterialBatchesService(
    packagingMaterialBatches,
    user
  );
  
  const elapsedMs = Date.now() - startTime;
  
  logInfo('Bulk packaging material batch creation completed', req, {
    context,
    traceId,
    inputCount: packagingMaterialBatches.length,
    createdCount: result.length,
    elapsedMs,
  });
  
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
 * - validate route parameters
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
    // Basic request validation
    //------------------------------------------------------------
    if (!batchId) {
      throw AppError.validationError('batchId is required.', {
        context,
        traceId,
      });
    }
    
    if (!user?.id) {
      throw AppError.authenticationError(
        'Authenticated user required.',
        { context, traceId }
      );
    }
    
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

module.exports = {
  getPaginatedPackagingMaterialBatchesController,
  createPackagingMaterialBatchesController,
  editPackagingMaterialBatchMetadataController,
};
