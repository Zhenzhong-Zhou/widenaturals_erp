const wrapAsync = require('../utils/wrap-async');
const AppError = require('../utils/AppError');
const { logInfo } = require('../utils/logger-helper');
const {
  fetchPaginatedProductBatchesService,
  createProductBatchesService,
  editProductBatchMetadataService,
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
const getPaginatedProductBatchesController = wrapAsync(async (req, res) => {
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
const createProductBatchesController = wrapAsync(async (req, res) => {
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
 * - validate required route parameters
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
const editProductBatchMetadataController = wrapAsync(async (req, res) => {
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
      {
        context,
        traceId,
      }
    );
  }
  
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

module.exports = {
  getPaginatedProductBatchesController,
  createProductBatchesController,
  editProductBatchMetadataController,
};
