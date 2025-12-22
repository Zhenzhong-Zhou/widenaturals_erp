const express = require('express');
const { authorize } = require('../middlewares/authorize');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const { orderTypeQuerySchema } = require('../validators/order-type-validators');
const {
  getPaginatedOrderTypesController,
} = require('../controllers/order-type-controller');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');

const router = express.Router();

/**
 * GET /order-types
 *
 * Fetches paginated order type records with optional filters, sorting, and pagination.
 * Normalization and sanitization are handled via middleware.
 *
 * Requires `view_order_type` permission.
 *
 * Query Parameters (normalized and sanitized automatically):
 * - page (integer, optional): Page number (default: 1)
 * - limit (integer, optional): Number of records per page (default: 10, max: 100)
 * - sortBy (string, optional): Field to sort by (default: 'name'). Must match allowed fields for the module.
 * - sortOrder (string, optional): Sorting order ('ASC' or 'DESC', default: 'ASC')
 * - name (string, optional): Filter by partial match on name
 * - code (string, optional): Filter by partial match on code (requires permission)
 * - category (string, optional): Filter by category (e.g., 'sales', 'purchase')
 * - statusId (UUID, optional): Filter by status ID
 * - requiresPayment (boolean, optional): Filter by whether payment is required
 * - createdBy (UUID, optional): Filter by creator user ID
 * - updatedBy (UUID, optional): Filter by updater user ID
 * - keyword (string, optional): Keyword search across name and code
 * - createdAfter (ISO 8601 date string, optional): Filter records created on or after this date
 * - createdBefore (ISO 8601 date string, optional): Filter records created on or before this date
 * - updatedAfter (ISO 8601 date string, optional): Filter records updated on or after this date
 * - updatedBefore (ISO 8601 date string, optional): Filter records updated on or before this date
 *
 * Middleware Applied:
 * - Authorization: Ensures the user has `view_order_type` permission
 * - Query Normalization: Normalizes filters, pagination, and sorting parameters
 * - Input Sanitization: Sanitizes query inputs for safety
 * - Validation: Ensures valid schema for query parameters
 *
 * Response: 200 OK
 * {
 *   success: true,
 *   message: "Order types retrieved successfully.",
 *   data: [ { ...order type fields... } ],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }
 */
router.get(
  '/',
  authorize(['view_order_type']),
  createQueryNormalizationMiddleware(
    'orderTypeSortMap',
    ['statusId', 'createdBy', 'updatedBy'],
    [],
    orderTypeQuerySchema
  ),
  sanitizeFields(['name', 'code', 'category', 'keyword']),
  validate(
    orderTypeQuerySchema,
    'query',
    { convert: true },
    'Invalid query parameters.'
  ),
  getPaginatedOrderTypesController
);

module.exports = router;
