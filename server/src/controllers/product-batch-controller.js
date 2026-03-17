const { wrapAsyncHandler } = require('../middlewares/async-handler');
const AppError = require('../utils/AppError');
const { logInfo } = require('../utils/logger-helper');
const {
  fetchPaginatedProductBatchesService,
  createProductBatchesService,
  editProductBatchMetadataService,
  updateProductBatchStatusService,
  receiveProductBatchService,
  releaseProductBatchService,
} = require('../services/product-batch-service');

/**
 * Controller: Fetch paginated product batch records.
 *
 * Responsibilities:
 * - Extract normalized and validated query parameters from middleware
 * - Log request metadata and execution timing
 * - Delegate pagination, visibility enforcement, and transformation
 *   to the product batch service layer
 * - Return a standardized paginated API response with trace metadata
 *
 * Notes:
 * - Route-level authorization ensures module access (e.g. VIEW_PRODUCT_BATCHES)
 * - Product batch visibility and manufacturer exposure are enforced upstream
 * - Sorting columns are assumed SQL-safe (resolved upstream)
 * - Controller performs NO business logic or ACL evaluation
 */
const getPaginatedProductBatchesController = wrapAsyncHandler(async (req, res) => {
  const context =
    'product-batch-controller/getPaginatedProductBatchesController';
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
  const traceId = `product-batch-${Date.now().toString(36)}`;

  // -------------------------------------------------
  // 2. Incoming request log
  // -------------------------------------------------
  logInfo('Incoming request: fetch product batches', req, {
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
  const { data, pagination } = await fetchPaginatedProductBatchesService({
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
  logInfo('Completed fetch product batches', req, {
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
    message: 'Product batches retrieved successfully.',
    data,
    pagination,
    traceId,
  });
});

/**
 * Handles bulk creation of product batches.
 *
 * Responsibilities:
 * - Validate request payload structure
 * - Log request lifecycle information
 * - Delegate batch creation to the service layer
 * - Return structured API response
 *
 * Notes:
 * - Input payload validation is primarily handled by Joi middleware.
 * - This controller performs a defensive check to ensure the payload
 *   still contains a valid batch array.
 * - Business logic and database operations are delegated to the
 *   `createProductBatchesService`.
 *
 * @route POST /product-batches
 *
 * @param {import('express').Request} req
 * Express request object.
 *
 * @param {Object} req.body
 * Request body validated by Joi middleware.
 *
 * @param {Array<Object>} req.body.productBatches
 * List of product batch objects to create.
 *
 * @param {Object} req.auth
 * Authenticated request metadata.
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
 * If the payload is invalid or batch creation fails.
 */
const createProductBatchesController = wrapAsyncHandler(async (req, res) => {
  const context = 'product-batch-controller/createProductBatchesController';
  
  // Track request start time for performance logging
  const startTime = Date.now();
  
  // Lightweight request trace identifier for debugging
  const traceId = `create-product-batch-${Date.now().toString(36)}`;
  
  const { productBatches } = req.body;
  const user = req.auth.user;
  
  //------------------------------------------------------------
  // Defensive payload validation (Joi should already enforce this)
  //------------------------------------------------------------
  if (!Array.isArray(productBatches) || productBatches.length === 0) {
    throw AppError.validationError('No product batches provided.', {
      context,
      traceId,
    });
  }
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  logInfo('Starting bulk product batch creation request', req, {
    context,
    traceId,
    userId: user.id,
    batchCount: productBatches.length,
  });
  
  //------------------------------------------------------------
  // Delegate creation to service layer
  //------------------------------------------------------------
  const result = await createProductBatchesService(productBatches, user);
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  logInfo('Bulk product batch creation completed', req, {
    context,
    traceId,
    inputCount: productBatches.length,
    createdCount: result.length,
    elapsedMs,
  });
  
  //------------------------------------------------------------
  // Send structured API response
  //------------------------------------------------------------
  res.status(201).json({
    success: true,
    message: 'Product batches created successfully.',
    stats: {
      inputCount: productBatches.length,
      createdCount: result.length,
      elapsedMs,
    },
    data: result,
  });
});

/**
 * Controller for editing product batch metadata.
 *
 * This endpoint allows authorized users to update editable metadata
 * fields of a product batch. Request body validation is handled by
 * Joi middleware before the controller executes.
 *
 * Responsibilities:
 * - write structured request logs
 * - call the service layer to perform the metadata update
 * - return a standardized success response
 *
 * Business rules such as lifecycle checks, permission enforcement,
 * and field filtering are handled in the service/business layers.
 *
 * Route:
 * PATCH /product-batches/:batchId/metadata
 *
 * Middleware requirements:
 * - authorize(...)
 * - validate(editProductBatchMetadataSchema, 'body')
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const editProductBatchMetadataController = wrapAsyncHandler(async (req, res) => {
  const context =
    'product-batch-controller/editProductBatchMetadataController';
  const startTime = Date.now();
  const traceId = `update-product-batch-${Date.now().toString(36)}`;
  
  //------------------------------------------------------------
  // Extract request data
  //------------------------------------------------------------
  const { batchId } = req.params;
  
  // Already validated by Joi middleware
  const updates = req.body;
  const user = req.auth?.user;
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  logInfo('Starting product batch metadata update request', req, {
    context,
    traceId,
    userId: user.id,
    batchId,
  });
  
  //------------------------------------------------------------
  // Execute service layer
  //------------------------------------------------------------
  const result = await editProductBatchMetadataService(
    batchId,
    updates,
    user
  );
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  logInfo('Product batch metadata update completed', req, {
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
    message: 'Product batch updated successfully.',
    stats: {
      batchId,
      elapsedMs,
    },
    data: result,
  });
});

/**
 * Controller for updating the lifecycle status of a product batch.
 *
 * This endpoint allows authorized users to transition a batch
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
 * PATCH /api/product-batches/:batchId/status
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
const updateProductBatchStatusController = wrapAsyncHandler(async (req, res) => {
  const context =
    'product-batch-controller/updateProductBatchStatusController';
  
  const startTime = Date.now();
  const traceId = `update-product-batch-status-${Date.now().toString(36)}`;
  
  //------------------------------------------------------------
  // Extract request data
  //------------------------------------------------------------
  
  const { batchId } = req.params;
  const { status_id, notes } = req.body;
  const user = req.auth?.user;
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  
  logInfo('Starting product batch status update request', req, {
    context,
    traceId,
    userId: user.id,
    batchId,
    statusId: status_id,
  });
  
  //------------------------------------------------------------
  // Delegate lifecycle update to service layer
  //------------------------------------------------------------
  
  const result = await updateProductBatchStatusService(
    batchId,
    status_id,
    notes,
    user
  );
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  
  logInfo('Product batch status update completed', req, {
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
    message: 'Product batch status updated successfully.',
    stats: {
      batchId,
      elapsedMs,
    },
    data: result,
  });
});

/**
 * Controller for marking a product batch as received.
 *
 * This endpoint represents the warehouse intake step when
 * goods arrive from the manufacturer or supplier.
 *
 * Responsibilities:
 * - Log lifecycle event start and completion
 * - Delegate receive logic to the service layer
 *
 * The service layer will handle lifecycle validation,
 * timestamp automation, and inventory updates.
 *
 * Route example:
 * PATCH /api/product-batches/:batchId/receive
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
const receiveProductBatchController = wrapAsyncHandler(async (req, res) => {
  const context =
    'product-batch-controller/receiveProductBatchController';
  
  const startTime = Date.now();
  const traceId = `receive-product-batch-${Date.now().toString(36)}`;
  
  //------------------------------------------------------------
  // Extract request data
  //------------------------------------------------------------
  
  const { batchId } = req.params;
  const { received_at, notes } = req.body;
  const user = req.auth?.user;
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  
  logInfo('Starting product batch receive request', req, {
    context,
    traceId,
    userId: user.id,
    batchId,
  });

  //------------------------------------------------------------
  // Execute service layer
  // This applies lifecycle automation and updates batch status
  //------------------------------------------------------------
  
  const result = await receiveProductBatchService(
    batchId,
    received_at,
    notes,
    user
  );
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  
  logInfo('Product batch received successfully', req, {
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
    message: 'Product batch marked as received.',
    stats: {
      batchId,
      elapsedMs,
    },
    data: result,
  });
});

/**
 * Controller for releasing a product batch for operational use.
 *
 * This endpoint indicates that a batch has passed quality
 * inspection and is approved for distribution, fulfillment,
 * or manufacturing operations.
 *
 * Responsibilities:
 * - Log release lifecycle event
 * - Delegate release logic to the service layer
 *
 * Route example:
 * PATCH /api/product-batches/:batchId/release
 *
 * Request body:
 * {
 *   "manufacturer_id": "uuid",
 *   "notes": "optional QA note"
 * }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 *
 * @returns {Promise<void>}
 */
const releaseProductBatchController = wrapAsyncHandler(async (req, res) => {
  const context =
    'product-batch-controller/releaseProductBatchController';
  
  const startTime = Date.now();
  const traceId = `release-product-batch-${Date.now().toString(36)}`;
  
  //------------------------------------------------------------
  // Extract request data
  //------------------------------------------------------------
  
  const { batchId } = req.params;
  const { manufacturer_id, notes } = req.body;
  const user = req.auth?.user;
  
  //------------------------------------------------------------
  // Log request start
  //------------------------------------------------------------
  
  logInfo('Starting product batch release request', req, {
    context,
    traceId,
    userId: user.id,
    batchId,
    manufacturerId: manufacturer_id,
  });
  
  //------------------------------------------------------------
  // Execute service layer
  //------------------------------------------------------------
  
  const result = await releaseProductBatchService(
    batchId,
    manufacturer_id,
    notes,
    user
  );
  
  const elapsedMs = Date.now() - startTime;
  
  //------------------------------------------------------------
  // Log completion
  //------------------------------------------------------------
  
  logInfo('Product batch release completed', req, {
    context,
    traceId,
    batchId,
    manufacturerId: manufacturer_id,
    elapsedMs,
  });
  
  //------------------------------------------------------------
  // Send response
  //------------------------------------------------------------
  
  res.status(200).json({
    success: true,
    message: 'Product batch released successfully.',
    stats: {
      batchId,
      elapsedMs,
    },
    data: result,
  });
});

module.exports = {
  getPaginatedProductBatchesController,
  createProductBatchesController,
  editProductBatchMetadataController,
  updateProductBatchStatusController,
  receiveProductBatchController,
  releaseProductBatchController,
};
