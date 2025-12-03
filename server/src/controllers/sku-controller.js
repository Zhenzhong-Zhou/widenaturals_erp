const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedSkuProductCardsService,
  createSkusService,
  updateSkuStatusService,
  fetchPaginatedSkusService,
  fetchSkuDetailsService,
} = require('../services/sku-service');
const { logInfo } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Controller: getSkuProductCardsController
 *
 * Fetch paginated SKU product cards for catalog/grid display.
 *
 * Responsibilities:
 *  - Read normalized + validated query parameters
 *  - Forward query parameters to service
 *  - Attach user for ACL evaluation (service handles visibility rules)
 *  - Return paginated list of SKU product-card results
 *
 * Query Parameters (after normalization middleware):
 *   - page: number (default 1)
 *   - limit: number (default 10)
 *   - sortBy: resolved & sanitized column key
 *   - sortOrder: 'ASC' | 'DESC'
 *   - filters: {
 *       productName?,
 *       brand?,
 *       category?,
 *       sku?,
 *       skuIds?,
 *       sizeLabel?,
 *       marketRegion?,
 *       complianceId?,
 *       keyword?
 *     }
 *
 * Response:
 *   {
 *     success: true,
 *     message: string,
 *     data: Array<ProductCard>,
 *     pagination: { page, limit, totalRecords, totalPages }
 *   }
 */
const getPaginatedSkuProductCardsController = wrapAsync(async (req, res) => {
  const context = 'sku-controller/getPaginatedSkuProductCardsController';

  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  const user = req.user;

  logInfo('Fetching SKU product cards', req, {
    context,
    query: { page, limit, sortBy, sortOrder, filters },
  });

  // Service applies:
  //  - ACL visibility rules
  //  - Pagination
  //  - Repository query
  //  - Transformation
  const result = await fetchPaginatedSkuProductCardsService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
    user,
  });

  const { data, pagination } = result;

  logInfo('Fetched SKU product cards successfully', req, {
    context,
    resultCount: data.length,
    pagination,
  });

  return res.status(200).json({
    success: true,
    message: 'Fetched SKU product cards successfully',
    data,
    pagination,
  });
});

/**
 * Controller: Fetch Paginated SKUs
 *
 * Handles GET /skus with filtering, sorting, and pagination.
 *
 * Responsibilities:
 *  - Extracts query parameters (filters, pagination, sorting)
 *  - Delegates heavy logic to service layer: fetchPaginatedSkusService
 *  - Emits structured system logs
 *  - Returns standardized API response with pagination metadata
 *
 * Notes:
 *  - Validation (query schema) should be applied using route middleware.
 *  - Controller contains no DB logic — all business rules remain in services.
 */
const getPaginatedSkusController = wrapAsync(async (req, res) => {
  const context = 'sku-controller/getPaginatedSkusController';
  const startTime = Date.now();

  // -------------------------------
  // 1. Extract request params
  // -------------------------------
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

  logInfo('Starting paginated SKU list request', req, {
    context,
    filters,
    pagination: { page, limit },
    sort: { sortBy, sortOrder },
  });

  // -------------------------------
  // 2. Execute service logic
  // -------------------------------
  const { data, pagination } = await fetchPaginatedSkusService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  const elapsedMs = Date.now() - startTime;

  logInfo('Fetched paginated SKU list successfully', req, {
    context,
    filters,
    pagination,
    sort: { sortBy, sortOrder },
    elapsedMs,
  });

  // -------------------------------
  // 3. Send API response
  // -------------------------------
  res.status(200).json({
    success: true,
    message: 'SKUs fetched successfully.',
    data,
    pagination,
  });
});

/**
 * Controller: Fetch SKU Details
 *
 * GET /skus/:skuId/details
 *
 * Returns a comprehensive SKU detail payload containing:
 * - SKU base info (name, barcode, dimensions, status, audit)
 * - Product information (brand, series, category)
 * - SKU images (respecting image permissions)
 * - Pricing records (filtered by pricing permissions)
 * - Compliance records (filtered by compliance permissions)
 *
 * All access control, slicing, and data shaping is handled inside
 * `fetchSkuDetailsService` to keep the controller thin and consistent.
 *
 * This controller simply:
 *  1. Validates input
 *  2. Logs request metadata
 *  3. Delegates work to the service layer
 *  4. Returns final transformed response
 */
const getSkuDetailsController = wrapAsync(async (req, res) => {
  const context = 'sku-controller/fetchSkuDetailsController';

  // Extract SKU ID from params
  const { skuId } = req.params;

  // Authenticated user context (set by verifyToken + verifySession)
  const user = req.user;

  // Unique trace for monitoring distributed logs
  const traceId = `sku-detail-${Date.now().toString(36)}`;

  // -----------------------------
  // 1. Incoming request log
  // -----------------------------
  logInfo('Incoming request: fetch SKU details', req, {
    context,
    traceId,
    skuId,
    userId: user?.id,
  });

  // -----------------------------
  // 2. Execute business/service layer
  // -----------------------------
  const skuDetail = await fetchSkuDetailsService(skuId, user);

  // -----------------------------
  // 3. Send response
  // -----------------------------
  res.status(200).json({
    success: true,
    message: 'SKU details retrieved successfully.',
    skuId,
    data: skuDetail,
    traceId,
  });
});

/**
 * @async
 * @function
 * @description
 * Controller for handling **bulk SKU creation** requests.
 *
 * Orchestrates the flow between request validation, business logic execution,
 * and API response formatting. This controller operates only on validated input
 * and delegates all domain logic to the service and business layers.
 *
 * Responsibilities:
 *  - Extract validated SKU array from `req.body.skus`
 *  - Retrieve authenticated user from `req.user`
 *  - Log request lifecycle and metrics
 *  - Delegate SKU creation to `createSkusService`
 *  - Return standardized success response with creation results
 *
 * Not responsible for:
 *  - Joi validation (handled in route middleware)
 *  - Authorization (handled in route middleware)
 *  - Business rules, DB locking, or SKU code generation
 *    → These are implemented in the service + business layers.
 *
 * @param {Request} req - Express request object (validated payload + user context)
 * @param {Response} res - Express response object
 *
 * @returns {JSON} 201 Created with:
 *    - success flag
 *    - message
 *    - stats (inputCount, createdCount, elapsedMs)
 *    - data (array of created SKU records)
 */
const createSkusController = wrapAsync(async (req, res) => {
  const context = 'sku-controller/createSkusController';
  const startTime = Date.now();
  const traceId = `create-sku-${Date.now().toString(36)}`;

  const { skus } = req.body; // validated by Joi prior to controller
  const user = req.user; // set by auth middleware

  if (!Array.isArray(skus) || skus.length === 0) {
    throw AppError.validationError('No SKUs provided.', { context, traceId });
  }

  logInfo('Starting bulk SKU creation request', req, {
    context,
    traceId,
    userId: user.id,
    count: skus.length,
  });

  // --- Execute business logic through service layer ---
  const result = await createSkusService(skus, user);

  const elapsedMs = Date.now() - startTime;

  logInfo('Bulk SKU creation completed', req, {
    context,
    traceId,
    inputCount: skus.length,
    createdCount: result.length,
    elapsedMs,
  });

  res.status(201).json({
    success: true,
    message: 'SKUs created successfully.',
    stats: {
      inputCount: skus.length,
      createdCount: result.length,
      elapsedMs,
    },
    data: result,
  });
});

/**
 * Controller: Update SKU Status
 *
 * Handles PATCH requests to update a SKU’s status.
 * Provides structured logging, validation, and standardized JSON response.
 *
 * ### Flow
 * 1. Extract `skuId` from route params and `statusId` from request body.
 * 2. Validate input (handled via Joi + parameter guards).
 * 3. Delegate to `updateSkuStatusService` for transactional update.
 * 4. Respond with standardized API payload.
 * 5. Emit structured logs for traceability and auditing.
 *
 * ### Example Request
 * PATCH /api/v1/skus/:skuId/status
 * {
 *   "statusId": "uuid-of-new-status"
 * }
 *
 * ### Example Response
 * {
 *   "success": true,
 *   "message": "SKU status updated successfully.",
 *   "data": { "id": "uuid-of-sku" }
 * }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateSkuStatusController = wrapAsync(async (req, res) => {
  const context = 'sku-controller/updateSkuStatusController';

  // -------------------------------------------------
  // 1. Extract and validate inputs
  // -------------------------------------------------
  const { skuId } = req.params;
  const { statusId } = req.body;
  const user = req.user;

  // -------------------------------------------------
  // 2. Execute business logic (transactional)
  // -------------------------------------------------
  const result = await updateSkuStatusService({
    skuId,
    statusId,
    user,
  });

  // -------------------------------------------------
  // 3. Logging + response
  // -------------------------------------------------
  logInfo('SKU status updated successfully', req, {
    context,
    skuId,
    statusId,
    userId: user.id,
  });

  res.status(200).json({
    success: true,
    message: 'SKU status updated successfully.',
    data: result, // { id: "..." }
  });
});

module.exports = {
  getPaginatedSkuProductCardsController,
  getPaginatedSkusController,
  getSkuDetailsController,
  createSkusController,
  updateSkuStatusController,
};
