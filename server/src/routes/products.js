const express = require('express');
const {
  getPaginatedProductsController,
  getProductDetailsController,
  updateProductStatusController,
  updateProductInfoController,
  createProductsController,
} = require('../controllers/product-controller');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  productQuerySchema,
  productIdParamSchema,
  productUpdateSchema,
  createProductBulkSchema, updateProductStatusSchema
} = require('../validators/product-validators');

const router = express.Router();

/**
 * Route: GET /api/v1/products
 *
 * Retrieves a paginated, filterable, and sortable list of products.
 *
 * ### Middleware Pipeline
 *
 * 1. **authorize([PERMISSIONS.PRODUCTS.VIEW])**
 *    - Ensures the requesting user has permission to view product records.
 *
 * 2. **createQueryNormalizationMiddleware('productSortMap', ['statusIds'])**
 *    - Normalizes pagination, sorting, and filtering parameters into predictable formats.
 *    - Uses `productSortMap` to safely map `sortBy` values → SQL columns.
 *    - Converts specified fields (e.g., `statusIds`) into normalized arrays.
 *      This allows clients to pass:
 *         - `?statusIds=uuid1,uuid2`
 *         - `?statusIds[]=uuid1&statusIds[]=uuid2`
 *         - `?statusIds=uuid1&statusIds=uuid2`
 *      All formats become a consistent `string[]` before validation.
 *
 * 3. **sanitizeFields(['keyword'])**
 *    - Strips unsafe HTML and sanitizes user input for keyword-based search.
 *
 * 4. **validate(productQuerySchema, 'query')**
 *    - Validates all query parameters using the Joi `productQuerySchema`.
 *
 * 5. **getPaginatedProductsController**
 *    - Delegates to the service layer to fetch, normalize, and return paginated products.
 *
 * ---
 *
 * ### Query Parameters
 * | Name | Type | Default | Description |
 * |------|------|----------|--------------|
 * | `page` | number | 1 | Current page number |
 * | `limit` | number | 10 | Number of results per page |
 * | `sortBy` | string | `'created_at'` | Sort field (validated using `productSortMap`) |
 * | `sortOrder` | `'ASC' \| 'DESC'` | `'DESC'` | Sort direction |
 * | `keyword` | string | — | Fuzzy search on product name, brand, category, and status |
 * | `brand` | string | — | Filter by brand |
 * | `category` | string | — | Filter by category |
 * | `series` | string | — | Filter by series |
 * | `statusIds[]` | string[] (UUID) | — | One or more status IDs (array normalized by middleware) |
 * | `createdBy` / `updatedBy` | string (UUID) | — | Filter by creator or last updater |
 *
 * ---
 *
 * ### Response
 * ```json
 * {
 *   "success": true,
 *   "message": "Products fetched successfully.",
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "Product Name",
 *       "brand": "Canaherb",
 *       "category": "Herbal Natural",
 *       "status": { "id": "uuid", "name": "Inactive", "date": "2025-11-03T20:20:00.000Z" },
 *       "audit": {
 *         "createdAt": "2025-11-03T20:20:00.000Z",
 *         "createdBy": {
 *           "id": "uuid",
 *           "firstname": "Root",
 *           "lastname": "Admin"
 *         },
 *         "updatedAt": "2025-11-03T21:00:00.000Z",
 *         "updatedBy": {
 *           "id": "uuid",
 *           "firstname": "Jane",
 *           "lastname": "Doe"
 *         }
 *       }
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10,
 *     "totalRecords": 42,
 *     "totalPages": 5
 *   }
 * }
 * ```
 *
 * ---
 *
 * ### Permissions
 * - Requires: `PERMISSIONS.PRODUCTS.VIEW`
 *
 * ### Error Responses
 * - `403 Forbidden` → Missing or insufficient permissions
 * - `400 Bad Request` → Invalid query parameters
 * - `500 Internal Server Error` → Unexpected service or database failure
 */
router.get(
  '/',
  authorize([PERMISSIONS.PRODUCTS.VIEW]),
  createQueryNormalizationMiddleware(
    'productSortMap',
    ['statusIds'], // array filters
    [],
    productQuerySchema
  ),
  sanitizeFields(['keyword']),
  validate(productQuerySchema, 'query'),
  getPaginatedProductsController
);

/**
 * Route: GET /api/v1/products/:productId/details
 *
 * Retrieves full product details, including status and audit information.
 *
 * ### Middleware Pipeline
 * 1. **authorize([PERMISSIONS.PRODUCTS.VIEW])**
 *    - Ensures the requesting user has permission to view product records.
 * 2. **validate(productIdParamSchema, 'params')**
 *    - Validates the `productId` route parameter as a required UUID.
 * 3. **getProductDetailsController**
 *    - Delegates to the service layer to fetch and transform the product record.
 *    - Returns a standardized JSON response with the full product detail object.
 *
 * ### Path Parameters
 * | Name | Type | Description |
 * |------|------|--------------|
 * | `productId` | string (UUID) | Unique identifier of the product to retrieve |
 *
 * ### Example Request
 * ```http
 * GET /api/v1/products/8d5b7e4f-9231-4b0f-83d1-6c8e3b03b8f2/details HTTP/1.1
 * Authorization: Bearer <token>
 * ```
 *
 * ### Example Response
 * ```json
 * {
 *   "success": true,
 *   "message": "Product details fetched successfully.",
 *   "data": {
 *     "id": "8d5b7e4f-9231-4b0f-83d1-6c8e3b03b8f2",
 *     "name": "Omega-3 Fish Oil",
 *     "series": "HN",
 *     "brand": "Canaherb",
 *     "category": "Herbal Natural",
 *     "description": "Supports healthy immune system.",
 *     "status": {
 *       "id": "uuid",
 *       "code": "ACTIVE",
 *       "name": "Active",
 *       "date": "2025-11-03T20:10:00.000Z"
 *     },
 *     "audit": {
 *       "createdAt": "2025-11-03T20:18:00.000Z",
 *       "createdBy": { "id": "uuid", "fullName": "John Smith" },
 *       "updatedAt": "2025-11-03T21:00:00.000Z",
 *       "updatedBy": { "id": "uuid", "fullName": "Jane Lee" }
 *     }
 *   }
 * }
 * ```
 *
 * ### Permissions
 * - Requires: `PERMISSIONS.PRODUCTS.VIEW`
 *
 * ### Errors
 * - `400 Bad Request` → Invalid or missing productId
 * - `403 Forbidden` → User lacks permission to view products
 * - `404 Not Found` → Product does not exist
 * - `500 Internal Server Error` → Unexpected database or service error
 */
router.get(
  '/:productId/details',
  authorize([PERMISSIONS.PRODUCTS.VIEW]),
  validate(productIdParamSchema, 'params'),
  getProductDetailsController
);

/**
 * @route PATCH /api/v1/products/:productId/status
 * @description
 * Updates the status of a specific product.
 *
 * ### Purpose
 * - Allows authorized users to change a product’s lifecycle state
 *   (e.g., from `ACTIVE` → `INACTIVE`, or `PENDING` → `ACTIVE`).
 * - Ensures transactional integrity, row locking, and business rule validation
 *   through the `updateProductStatusService`.
 *
 * ### Middleware Flow
 * 1. **authorize([PERMISSIONS.PRODUCTS.UPDATE_STATUS])**
 *    - Restricts access to users with `PRODUCTS.UPDATE_STATUS` permission.
 * 2. **validate(productIdParamSchema, 'params')**
 *    - Ensures the `productId` in the URL path is a valid UUID.
 * 3. **validate(updateProductStatusSchema, 'body')**
 *    - Validates request body fields (requires a valid `statusId` UUID).
 * 4. **updateProductStatusController**
 *    - Executes the service, logs results, and returns a standardized JSON response.
 *
 * ### Request
 * **Path params:**
 * - `productId` → UUID of the product to update
 *
 * **Body:**
 * ```json
 * {
 *   "statusId": "uuid-of-new-status"
 * }
 * ```
 *
 * ### Response
 * **200 OK**
 * ```json
 * {
 *   "success": true,
 *   "message": "Product status updated successfully.",
 *   "data": { "id": "uuid-of-product" }
 * }
 * ```
 *
 * **Error Responses**
 * - `400 Bad Request` → Invalid productId or statusId
 * - `403 Forbidden` → Missing `UPDATE_STATUS` permission
 * - `404 Not Found` → Product or status not found
 * - `409 Conflict` → Invalid status transition (business rule violation)
 *
 * @access Protected
 * @permission PRODUCTS.UPDATE_STATUS
 */
router.patch(
  '/:productId/status',
  authorize([PERMISSIONS.PRODUCTS.UPDATE_STATUS]),
  validate(productIdParamSchema, 'params'),
  validate(updateProductStatusSchema, 'body'),
  updateProductStatusController
);

/**
 * @route PUT /api/v1/products/:productId/info
 * @description
 * Updates general product information (e.g., name, series, brand, category, description)
 * without modifying its status. This endpoint is used by internal admin or ERP interfaces
 * to manage product metadata safely.
 *
 * ### Authorization
 * - Requires the `PRODUCTS.UPDATE_INFO` permission.
 * - Only authenticated and authorized users can perform this operation.
 *
 * ### Validation
 * - `productId` (path param): Must be a valid UUID.
 * - Request body must include **at least one** editable field (name, series, brand, category, description).
 * - All string fields are automatically trimmed and sanitized.
 *
 * ### Middleware Stack
 * 1. `authorize([PERMISSIONS.PRODUCTS.UPDATE_INFO])` — Enforces role-based access control.
 * 2. `sanitizeFields(['description'])` — Removes harmful HTML/JS from the `description` field.
 * 3. `validate(productIdParamSchema, 'params')` — Ensures valid product UUID.
 * 4. `validate(productUpdateSchema, 'body')` — Validates the update payload shape.
 * 5. `updateProductInfoController` — Handles business logic and response.
 *
 * ### Example Request
 * ```json
 * PUT /api/products/6b3f412b-9528-41f3-9d83-9b9b0d8b540b/info
 * {
 *   "name": "NMN 3000",
 *   "brand": "Canaherb",
 *   "description": "Updated product description."
 * }
 * ```
 *
 * ### Example Response
 * ```json
 * {
 *   "success": true,
 *   "message": "Product information updated successfully.",
 *   "data": { "id": "6b3f412b-9528-41f3-9d83-9b9b0d8b540b", "success": true }
 * }
 * ```
 */
router.put(
  '/:productId/info',
  authorize([PERMISSIONS.PRODUCTS.UPDATE_INFO]),
  sanitizeFields(['description']),
  validate(productIdParamSchema, 'params'),
  validate(productUpdateSchema, 'body'),
  updateProductInfoController
);

/**
 * @route POST /products/create
 * @summary Bulk-create product records
 * @description
 * Creates multiple products within a **single atomic database transaction**.
 *
 * This endpoint is intended for:
 *   - Initial product catalog setup
 *   - Admin/ERP bulk import workflows
 *   - Automated integrations that need to register multiple products at once
 *
 * Request Body:
 *   {
 *     "products": [
 *       {
 *         "name": "Immune Support",
 *         "series": "Core Health",
 *         "brand": "Canaherb",
 *         "category": "Herbal Natural",
 *         "description": "Immune formula..."
 *       },
 *       ...
 *     ]
 *   }
 *
 * Pipeline:
 *   1. **Authorization**
 *        - Requires `PRODUCTS.CREATE` permission.
 *        - User object is attached to `req.user`.
 *
 *   2. **Field Sanitization**
 *        - Optional sanitization for specific free-text fields (e.g., description).
 *
 *   3. **Joi Validation**
 *        - Validates shape, required fields, and TitleCase/ALLCAPS brand/category rules.
 *        - Ensures array size constraints (1–200 items).
 *
 *   4. **Controller Execution**
 *        - Delegates to `createProductsController`.
 *        - Controller triggers the service layer → business rules → repository layer.
 *        - Runs inside a DB transaction to prevent partial inserts.
 *
 * Responses:
 *   201 Created
 *     {
 *       "success": true,
 *       "message": "Products created successfully.",
 *       "stats": {
 *         "inputCount": 5,
 *         "createdCount": 5,
 *         "elapsedMs": 42
 *       },
 *       "data": [ ...inserted product rows... ]
 *     }
 *
 * Error Responses:
 *   400 ValidationError – Invalid structure or product fields
 *   403 Forbidden – Missing permission
 *   409 Conflict – Duplicate product name/brand/category
 *   500 DatabaseError – Unexpected error during transaction
 */
router.post(
  '/create',
  authorize([PERMISSIONS.PRODUCTS.CREATE]),
  sanitizeFields(['description']),
  validate(createProductBulkSchema, 'body'),
  createProductsController
);

module.exports = router;
