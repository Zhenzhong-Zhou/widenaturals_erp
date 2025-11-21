/**
 * @fileoverview
 * SKU API Routes — ERP Product Management Module
 *
 * These routes handle SKU retrieval, product card listing, and
 * associated BOM (Bill of Materials) composition fetching.
 *
 * Includes:
 *   - Active SKU product cards
 *   - Detailed SKU information
 *   - Active BOM composition with estimated cost
 */

const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const {
  getPaginatedSkuProductCardsController,
  getPaginatedSkusController,
  getSkuDetailsController,
  createSkusController,
  updateSkuStatusController,
} = require('../controllers/sku-controller');
const validate = require('../middlewares/validate');
const {
  getPaginatedSkuProductCardsSchema,
  createSkuBulkSchema,
  skuIdParamSchema,
  updateSkuStatusSchema,
  skuQuerySchema,
} = require('../validators/sku-validators');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { sanitizeFields } = require('../middlewares/sanitize');

const router = express.Router();

/**
 * ---------------------------------------------------------------------
 * GET /api/v1/skus/cards
 * ---------------------------------------------------------------------
 * @summary Fetch a paginated list of SKU product cards.
 * @description
 * Returns lightweight SKU “product card” entries optimized for grid/list views.
 * Each card includes:
 *  - Product fields: name, brand, category, series
 *  - SKU fields: SKU code, barcode, size label, market region
 *  - Compliance: e.g., NPN document number
 *  - Pricing: latest MSRP (location = Office)
 *  - Primary image metadata: image_url, alt_text
 *
 * Access Control:
 *  - Visibility rules (active-only, inactive allowed, etc.) are applied
 *    automatically based on the requesting user's permissions.
 *  - Filters are transparently adjusted using ACL before the DB query.
 *
 * Query Capabilities:
 *  - Pagination: `page`, `limit`
 *  - Sorting: via `skuProductCards` sort map (validated by middleware)
 *  - Filtering:
 *      - productName, brand, category
 *      - sku, skuIds[], sizeLabel, marketRegion
 *      - complianceId
 *      - keyword (multi-field fuzzy search)
 *
 * @access Protected
 *
 * @returns {200} Paginated list of SKU product cards
 * @returns {400} Validation error (invalid query parameters)
 * @returns {403} Forbidden (insufficient permissions)
 */
router.get(
  '/cards',
  authorize([PERMISSIONS.SKUS.VIEW_CARDS]),
  createQueryNormalizationMiddleware(
    'skuProductCards',                // sort map name
    ['skuIds'], // array-based filter fields
    [],                               // numeric fields
    getPaginatedSkuProductCardsSchema
  ),
  sanitizeFields([
    'keyword',
    'productName',
    'sku',
    'brand',
    'category',
  ]),
  validate(getPaginatedSkuProductCardsSchema, 'query'),
  getPaginatedSkuProductCardsController
);

/**
 * GET /api/v1/skus
 *
 * Retrieves a paginated, filterable, sortable list of SKU records.
 *
 * ### Middleware stack:
 * - `authorize` → Ensures the user has SKUS.VIEW_LIST permission
 *
 * - `createQueryNormalizationMiddleware` →
 *     Normalizes sort keys and array-based filters using:
 *     - Sort map: `skuSortMap`
 *     - Array fields: `statusIds`, `productIds`
 *       (expand here if more array filters are added)
 *
 * - `sanitizeFields` →
 *     Sanitizes potentially unsafe or user-typed string fields:
 *     - `keyword`, `productName`, `sku`
 *
 * - `validate` →
 *     Validates normalized query parameters using `skuQuerySchema`
 *
 *
 * ### Query Parameters (normalized & validated):
 * - Pagination:
 *     - `page`, `limit`
 *
 * - Sorting:
 *     - `sortBy`, `sortOrder` (validated against `skuSortMap`)
 *
 * - SKU-level filters:
 *     - `statusIds[]`
 *     - `productIds[]`
 *     - `sku` (ILIKE)
 *     - `barcode`
 *     - `sizeLabel`
 *     - `marketRegion`
 *     - `countryCode`
 *     - creation/updated date ranges
 *     - createdBy, updatedBy
 *
 * - Product-level filters:
 *     - `productName`
 *     - `brand`
 *     - `category`
 *
 * - Keyword search:
 *     - fuzzy match across SKU, product name, brand, category
 *
 *
 * ### Response (200 OK):
 * {
 *   "success": true,
 *   "message": "SKUs retrieved successfully.",
 *   "data": [...],
 *   "pagination": { "page", "limit", "totalRecords", "totalPages" }
 * }
 *
 * @access Protected
 */
router.get(
  '/',
  authorize([PERMISSIONS.SKUS.VIEW_LIST]),
  createQueryNormalizationMiddleware(
    'skuSortMap',                 // Name of sort map
    ['statusIds', 'productIds'],  // Array-based filter fields
    [],                           // Reserved: fields that require numeric normalization (none for SKUs)
    skuQuerySchema                // Joi schema for validation
  ),
  sanitizeFields([
    'keyword',
    'productName',
    'sku',
    'brand',
    'category',
  ]),
  validate(skuQuerySchema, 'query'),
  getPaginatedSkusController
);

/**
 * Route: GET /skus/:skuId/details
 *
 * Retrieves a fully enriched SKU detail payload including:
 * - SKU base attributes
 * - Product metadata
 * - Images (permission-aware)
 * - Pricing records (permission-aware)
 * - Compliance records (permission-aware)
 *
 * Middleware Chain:
 * 1. authorize([PERMISSIONS.SKUS.VIEW_DETAILS])
 *      - Ensures the authenticated user has the required permission to
 *        view SKU details. Does NOT determine what fields they can view—
 *        the service layer handles fine-grained access control.
 *
 * 2. validate(skuIdParamSchema, 'params')
 *      - Ensures `skuId` is a valid UUID before reaching the controller.
 *        Prevents useless database queries and improves error clarity.
 *
 * 3. fetchSkuDetailsController
 *      - Executes the full business logic:
 *          → fetchSkuDetailsService()
 *          → slices pricing/images/compliance based on user permissions
 *          → transforms output via transformSkuDetail()
 *      - Returns consistent API response shape with traceId.
 *
 * Permissions:
 *   - Requires SKUS.VIEW_DETAILS
 *
 * Errors:
 *   - 400 if skuId invalid
 *   - 403 if user lacks permission
 *   - 404 if SKU does not exist
 *   - 500 for unexpected server errors (captured by global error handler)
 */
router.get(
  '/:skuId/details',
  authorize([PERMISSIONS.SKUS.VIEW_DETAILS]),
  validate(skuIdParamSchema, 'params'),
  getSkuDetailsController
);

/**
 * @route POST /skus/create
 * @group SKUs
 * @permission SKUS.CREATE
 *
 * @description
 * Bulk SKU creation endpoint.
 * Accepts an array of SKU definitions and generates SKU codes,
 * enforces business rules, locks related products, performs duplicate
 * checks, and inserts all SKUs in a single transactional operation.
 *
 * Request body must match `createSkuBulkSchema`, which validates:
 *   - product_id (UUID)
 *   - brand_code / category_code / variant_code / region_code
 *   - optional metadata (barcode, size_label, description, dimensions, etc.)
 *
 * Middlewares:
 *   1. authorize([SKUS.CREATE])
 *        - Ensures caller has permission to create SKUs.
 *
 *   2. validate(createSkuBulkSchema, 'body')
 *        - Ensures payload structure and values are valid before passing
 *          request to controller.
 *
 *   3. createSkusController
 *        - Executes bulk creation using service + business logic layers.
 *        - Handles logging, error wrapping, and API response formatting.
 *
 * Expected JSON payload (example):
 * {
 *   "skus": [
 *     {
 *       "product_id": "uuid",
 *       "brand_code": "CH",
 *       "category_code": "HN",
 *       "variant_code": "200",
 *       "region_code": "CA",
 *       "barcode": "628693253017",
 *       "size_label": "60 Capsules",
 *       "description": "Hair Nutrition CA",
 *       "length_cm": 5.2,
 *       "width_cm": 5.0,
 *       "height_cm": 10.0,
 *       "weight_g": 150
 *     }
 *   ]
 * }
 *
 * Success Response:
 *   - HTTP 201
 *   - JSON body containing normalized and enriched SKU records.
 */
router.post(
  '/create',
  authorize([PERMISSIONS.SKUS.CREATE]),
  validate(createSkuBulkSchema, 'body'),
  createSkusController
);

/**
 * @route PATCH /api/v1/skus/:skuId/status
 * @description
 * Updates the status of a specific SKU.
 *
 * ### Purpose
 * - Allows authorized users to change a SKU’s lifecycle state
 *   (e.g., `PENDING` → `ACTIVE`, `ACTIVE` → `INACTIVE`, or `ACTIVE` → `DISCONTINUED`).
 * - Ensures transactional integrity with row locking, audit updates, and
 *   business-rule enforcement through `updateSkuStatusService`.
 *
 * ### Middleware Flow
 * 1. **authorize([PERMISSIONS.SKUS.UPDATE_STATUS])**
 *    - Ensures the user has permission to modify SKU status.
 *
 * 2. **validate(skuIdParamSchema, 'params')**
 *    - Verifies the `skuId` path parameter is a valid UUID.
 *
 * 3. **validate(updateSkuStatusSchema, 'body')**
 *    - Validates request body (requires a valid `statusId` UUID).
 *
 * 4. **updateSkuStatusController**
 *    - Executes the transactional update and returns a standardized response.
 *
 *
 * ### Request
 * **Path params:**
 * - `skuId` → UUID of the SKU to update
 *
 * **Body:**
 * ```json
 * {
 *   "statusId": "uuid-of-new-status"
 * }
 * ```
 *
 *
 * ### Response
 * **200 OK**
 * ```json
 * {
 *   "success": true,
 *   "message": "SKU status updated successfully.",
 *   "data": { "id": "uuid-of-sku" }
 * }
 * ```
 *
 * ### Error Responses
 * - `400 Bad Request` → Invalid skuId or statusId
 * - `403 Forbidden` → Missing `SKUS.UPDATE_STATUS` permission
 * - `404 Not Found` → SKU or status not found
 * - `409 Conflict` → Invalid status transition (business rule violation)
 *
 * @access Protected
 * @permission SKUS.UPDATE_STATUS
 */
router.patch(
  '/:skuId/status',
  authorize([PERMISSIONS.SKUS.UPDATE_STATUS]),
  validate(skuIdParamSchema, 'params'),
  validate(updateSkuStatusSchema, 'body'),
  updateSkuStatusController
);

module.exports = router;
