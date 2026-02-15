const express = require('express');
const { authorize } = require('../middlewares/authorize');
const { BATCH_REGISTRY } = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const {
  batchRegistryQuerySchema,
} = require('../validators/batch-registry-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  getPaginatedBatchRegistryController,
} = require('../controllers/batch-registry-controller');

const router = express.Router();

/**
 * GET /batch-registry
 *
 * Fetch a paginated list of batch registry records with optional
 * filtering, sorting, and keyword search.
 *
 * Responsibilities by layer:
 *
 * - **Route Middleware**:
 *   - Enforces module-level access control (`BATCH_REGISTRY.VIEW`)
 *   - Normalizes query parameters (pagination, sorting, filters, options)
 *   - Sanitizes free-text inputs
 *   - Validates query shape and types (schema-level only)
 *
 * - **Controller**:
 *   - Coordinates request lifecycle, logging, and tracing
 *   - Delegates visibility resolution and pagination to the service layer
 *
 * - **Service / Business Layer**:
 *   - Evaluates batch visibility rules (product vs packaging)
 *   - Applies visibility constraints to filters (fail-closed)
 *   - Executes paginated batch registry queries
 *   - Applies defensive row slicing (non-broadening)
 *   - Delegates data normalization to the transformer layer
 *
 * Query behavior:
 * - `batchType`
 *   → optional client hint (`product` | `packaging_material`)
 *   → intersected with visibility rules in business layer
 *
 * - `statusIds`, `skuIds`, `productIds`, `manufacturerIds`,
 *   `packagingMaterialIds`, `supplierIds`
 *   → normalized as UUID arrays
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
 * - Enforce visibility rules directly
 * - Shape response data
 * - Decide keyword search scope
 */
router.get(
  '/',
  authorize([BATCH_REGISTRY.VIEW_LIST]),
  createQueryNormalizationMiddleware(
    'batchRegistrySortMap',
    [
      // array-style filters
      'statusIds',
      'skuIds',
      'productIds',
      'manufacturerIds',
      'packagingMaterialIds',
      'supplierIds',
    ],
    [], // boolean filters (none client-controlled)
    batchRegistryQuerySchema, // query schema
    {},
    [], // option-level booleans (none)
    [] // option-level strings (none; no UI viewMode here)
  ),
  sanitizeFields(['keyword']),
  validate(batchRegistryQuerySchema, 'query', {
    allowUnknown: true,
  }),
  getPaginatedBatchRegistryController
);

module.exports = router;
