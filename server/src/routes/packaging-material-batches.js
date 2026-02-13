const express = require('express');
const { authorize } = require('../middlewares/authorize');
const {
  PACKAGING_BATCH,
} = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const {
  packagingMaterialBatchQuerySchema,
} = require('../validators/packaging-material-batch-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  getPaginatedPackagingMaterialBatchesController,
} = require('../controllers/packaging-material-batch-controller');

const router = express.Router();

/**
 * GET /packaging-material-batches
 *
 * Fetch a paginated list of PACKAGING MATERIAL batch records.
 *
 * Responsibilities by layer:
 *
 * - **Route Middleware**:
 *   - Enforces module-level access control (`PACKAGING_BATCH.VIEW_LIST`)
 *   - Normalizes query parameters (pagination, sorting, filters)
 *   - Sanitizes free-text inputs
 *   - Validates query shape and types (schema-level only)
 *
 * - **Controller**:
 *   - Coordinates request lifecycle, logging, and tracing
 *   - Delegates visibility resolution and pagination to the service layer
 *
 * - **Service / Business Layer**:
 *   - Evaluates packaging material batch visibility rules
 *   - Applies visibility constraints to filters (fail-closed)
 *   - Executes paginated PMB queries
 *   - Delegates data normalization to the transformer layer
 *
 * Query behavior:
 * - `statusIds`, `packagingMaterialIds`, `supplierIds`
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
  authorize([PACKAGING_BATCH.VIEW_LIST]),
  createQueryNormalizationMiddleware(
    'packagingMaterialBatchSortMap',
    [
      // array-style filters
      'statusIds',
      'packagingMaterialIds',
      'supplierIds',
    ],
    [], // boolean filters (none client-controlled)
    packagingMaterialBatchQuerySchema, // query schema
    {},
    [], // option-level booleans
    []  // option-level strings
  ),
  sanitizeFields(['keyword', 'lotNumber']),
  validate(packagingMaterialBatchQuerySchema, 'query', {
    allowUnknown: true,
  }),
  getPaginatedPackagingMaterialBatchesController
);

module.exports = router;
