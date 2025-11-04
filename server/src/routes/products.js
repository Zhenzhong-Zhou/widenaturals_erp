const express = require('express');
const {
  getProductsDropdownListController,
  getProductsForDropdownController,
  getPaginatedProductsController,
} = require('../controllers/product-controller');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const { productQuerySchema } = require('../validators/product-validators');

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

module.exports = router;
