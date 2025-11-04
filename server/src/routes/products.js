const express = require('express');
const {
  getProductsDropdownListController,
  getProductsForDropdownController,
  getPaginatedProductsController,
  getProductDetailsController,
} = require('../controllers/product-controller');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  productQuerySchema,
  productIdParamSchema
} = require('../validators/product-validators');

const router = express.Router();

router.get(
  '/dropdown/warehouse/:warehouseId',
  getProductsDropdownListController
);

router.get('/dropdown/orders', getProductsForDropdownController);

/**
 * Route: GET /api/v1/products
 *
 * Retrieves a paginated, filterable, and sortable list of products.
 *
 * ### Middleware Pipeline
 * 1. **authorize([PERMISSIONS.PRODUCTS.VIEW])**
 *    - Ensures the requesting user has permission to view product records.
 * 2. **createQueryNormalizationMiddleware('productSortMap')**
 *    - Normalizes and validates sorting, pagination, and filtering parameters.
 *    - Uses `productSortMap` to safely map `sortBy` keys → SQL columns.
 * 3. **sanitizeFields(['keyword'])**
 *    - Strips unsafe HTML and sanitizes text fields (e.g. keyword search input).
 * 4. **validate(productQuerySchema, 'query')**
 *    - Validates all query parameters against the Joi `productQuerySchema`.
 * 5. **getPaginatedProductsController**
 *    - Delegates to the service layer for fetching, transforming, and returning paginated products.
 *
 * ### Query Parameters
 * | Name | Type | Default | Description |
 * |------|------|----------|--------------|
 * | `page` | number | 1 | Current page number |
 * | `limit` | number | 10 | Number of records per page |
 * | `sortBy` | string | `'created_at'` | Sort column (validated against `productSortMap`) |
 * | `sortOrder` | `'ASC' \| 'DESC'` | `'DESC'` | Sort direction |
 * | `keyword` | string | — | Fuzzy match on name, brand, category, status |
 * | `brand` | string | — | Filter by product brand (partial match) |
 * | `category` | string | — | Filter by product category |
 * | `series` | string | — | Filter by product series |
 * | `statusIds[]` | string[] (UUID) | — | Filter by one or more status IDs |
 * | `createdBy` / `updatedBy` | string (UUID) | — | Filter by creator/updater |
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
 *       "status": { "id": "uuid", "name": "Active" },
 *       "createdAt": "2025-11-03T20:20:00.000Z",
 *       "updatedAt": "2025-11-03T21:00:00.000Z"
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
 * ### Permissions
 * - Requires: `PERMISSIONS.PRODUCTS.VIEW`
 *
 * ### Errors
 * - `403 Forbidden` → Missing or insufficient permissions
 * - `400 Bad Request` → Invalid query parameters
 * - `500 Internal Server Error` → Unexpected database or service failure
 */
router.get(
  '/',
  authorize([PERMISSIONS.PRODUCTS.VIEW]),
  createQueryNormalizationMiddleware(
    'productSortMap',
    [], // array filters
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

module.exports = router;
