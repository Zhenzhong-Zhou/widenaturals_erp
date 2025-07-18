const express = require('express');
const { createOrderController } = require('../controllers/order-controller');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const salesOrderSchema = require('../validators/sales-order-validators');
const { sanitizeInput } = require('../middlewares/sanitize');
const AppError = require('../utils/AppError');

const router = express.Router();

/**
 * Maps order categories to their corresponding Joi validation schemas.
 *
 * This map enables dynamic selection of validation logic based on the `category`
 * provided in the route parameter (e.g., /create/:category).
 *
 * Supported keys:
 * - `sales`: Sales order schema.
 * - `purchase`: Purchase order schema (to be added).
 * - `transfer`: Transfer order schema (to be added).
 *
 * Example usage:
 * const schema = schemaMap[category.toLowerCase()];
 * if (!schema) throw AppError.validationError('Unsupported order category');
 */
const schemaMap = {
  sales: salesOrderSchema,
  // purchase: purchaseOrderSchema,
  // transfer: transferOrderSchema
};

/**
 * POST /create/:category
 *
 * Creates a new order within the specified category.
 *
 * Route parameters:
 * - `category` (string, required): The category of the order (e.g., sales, purchase, transfer).
 *
 * Request body:
 * - JSON payload containing order details and related fields, including:
 *   - `orderTypeCode` (string, required): The specific order type code (e.g., SALES_STD, PUR_ORDER) to look up and validate.
 *   - Additional order details depending on the category:
 *     - `sales`: Requires customer info, tax rate, delivery method, etc.
 *     - `purchase`: Requires supplier info, etc. (if applicable)
 *     - `transfer`: Requires source/target location info, etc. (if applicable)
 *
 * Auth:
 * - Requires authenticated user.
 * - Requires `create_orders` permission at the route level.
 * - Additional dynamic permission checks may apply in business logic
 *   (e.g., `create_sales`, `create_purchase`, `create_transfer`).
 *
 * Middleware:
 * - `authorize(['create_orders'])`: Basic permission check.
 * - Dynamic validation middleware: Applies the appropriate Joi schema based on `category`.
 * - `sanitizeInput`: Cleans the incoming data to protect against injection and malformed input.
 *
 * Business logic:
 * - Looks up `orderTypeCode` in the database and verifies that it belongs to the specified `category`.
 * - Injects `order_type_id` and other validated fields into the request for DB insertion.
 *
 * Response:
 * - 201 Created with order summary if successful.
 * - 400 Bad Request on validation error.
 * - 403 Forbidden on permission failure.
 * - 404 Not Found if `orderTypeCode` is invalid or does not match the category.
 * - 500 Internal Server Error on server failure.
 *
 * Example:
 * POST /create/sales
 * {
 *   "customer_id": "...",
 *   "order_items": [ ... ]
 * }
 */
router.post(
  '/create/:category',
  authorize(['create_orders']),
  (req, res, next) => {
    const category = req.params.category.toLowerCase();
    const schema = schemaMap[category];
    if (!schema) {
      return next(
        AppError.validationError(`Unsupported order category: ${category}`)
      );
    }
    return validate(schema, 'body')(req, res, next);
  },
  sanitizeInput,
  createOrderController
);

module.exports = router;
