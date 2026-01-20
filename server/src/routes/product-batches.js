const express = require('express');
const { authorize } = require('../middlewares/authorize');
const {
  PRODUCT_BATCH,
} = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const {
  productBatchQuerySchema,
} = require('../validators/product-batch-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const { getPaginatedProductBatchesController } = require('../controllers/product-batch-controller');

const router = express.Router();

/**
 * GET /product-batches
 *
 * Fetch a paginated list of PRODUCT batch records.
 *
 * Responsibilities by layer:
 *
 * - **Route Middleware**:
 *   - Enforces module-level access control (`PRODUCT_BATCH.VIEW`)
 *   - Normalizes query parameters (pagination, sorting, filters)
 *   - Sanitizes free-text inputs
 *   - Validates query shape and types (schema-level only)
 *
 * - **Controller**:
 *   - Coordinates request lifecycle, logging, and tracing
 *   - Delegates visibility resolution and pagination to the service layer
 *
 * - **Service / Business Layer**:
 *   - Evaluates product batch visibility rules
 *   - Applies visibility constraints to filters (fail-closed)
 *   - Executes paginated product batch queries
 *   - Delegates data normalization to the transformer layer
 *
 * Query behavior:
 * - `statusIds`, `skuIds`, `productIds`, `manufacturerIds`
 *   → normalized as UUID arrays
 *
 * - `lotNumber`
 *   → explicit lot filter (ILIKE)
 *
 * - Date filters
 *   → expiry / manufacture / received / created ranges
 *
 * - Pagination & sorting
 *   → normalized and SQL-safe via upstream middleware
 *
 * - `keyword`
 *   → free-text search
 *   → eligible fields determined by ACL (NOT client input)
 *
 * This route does NOT:
 * - Perform business logic
 * - Enforce row-level visibility
 * - Shape response data
 * - Decide keyword search scope
 */
router.get(
  '/',
  authorize([PRODUCT_BATCH.VIEW_LIST]),
  createQueryNormalizationMiddleware(
    'productBatchSortMap',
    [
      // array-style filters
      'statusIds',
      'skuIds',
      'productIds',
      'manufacturerIds',
    ],
    [], // boolean filters (none client-controlled)
    productBatchQuerySchema, // query schema
    {},
    [], // option-level booleans
    []  // option-level strings
  ),
  sanitizeFields(['keyword', 'lotNumber']),
  validate(productBatchQuerySchema, 'query', {
    allowUnknown: true,
  }),
  getPaginatedProductBatchesController
);

module.exports = router;
