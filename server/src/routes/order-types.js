const express = require('express');
const authorize = require('../middlewares/authorize');
const { sanitizeInput } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const { orderTypeQuerySchema } = require('../validators/order-type-validators');
const {
  getPaginatedOrderTypesController,
} = require('../controllers/order-type-controller');

const router = express.Router();

/**
 * GET /order-types
 *
 * Fetches paginated order type records with optional filters and sorting.
 *
 * Requires `view_order_type` permission.
 *
 * Query parameters:
 * - page (integer, optional): Page number (default 1)
 * - limit (integer, optional): Number of records per page (default 10, max 100)
 * - sortBy (string, optional): Field to sort by (default 'name'). Must be one of the allowed sort fields.
 * - sortOrder (string, optional): Sorting order (ASC or DESC, default ASC)
 * - name (string, optional): Filter by partial match on name
 * - code (string, optional): Filter by partial match on code (internal use)
 * - category (string, optional): Filter by category (e.g., 'sales', 'purchase')
 * - statusId (UUID, optional): Filter by status ID
 * - requiresPayment (boolean, optional): Filter by whether payment is required
 * - createdBy (UUID, optional): Filter by creator user ID
 * - updatedBy (UUID, optional): Filter by updater user ID
 * - keyword (string, optional): Filter across name, code, and description (max 100 chars)
 * - createdAfter (ISO date, optional): Filter records created on or after this date
 * - createdBefore (ISO date, optional): Filter records created on or before this date
 * - updatedAfter (ISO date, optional): Filter records updated on or after this date
 * - updatedBefore (ISO date, optional): Filter records updated on or before this date
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
  // authorize(['view_order_type']),
  authorize(['view_prices']),
  sanitizeInput,
  validate(
    orderTypeQuerySchema,
    'query',
    { stripUnknown: true, convert: true },
    'Invalid query parameters.'
  ),
  getPaginatedOrderTypesController
);

module.exports = router;
