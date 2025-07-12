const express = require('express');
const {
  createCustomerController,
  getPaginatedCustomersController,
} = require('../controllers/customer-controller');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  customerArraySchema,
  customerFilterSchema
} = require('../validators/customer-validator');
const { sanitizeInput } = require('../middlewares/sanitize');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');

const router = express.Router();

/**
 * @route   POST /add-new-customers
 * @access  protected
 * @desc    Create one or more customer records.
 *          Accepts a JSON array of customer objects (single or bulk).
 *          Requires authentication and 'create_customer' permission.
 *
 * @body    {Array<Object>} body - Array of customer objects to be created.
 *
 * @returns {201} Created customer records with metadata
 * @returns {400} Validation error (invalid payload)
 * @returns {403} Authorization error (insufficient permission)
 */
router.post(
  '/add-new-customers',
  authorize(['create_customer']),
  validate(customerArraySchema, 'body'),
  sanitizeInput,
  createCustomerController
);

/**
 * GET /customers
 *
 * Fetches a paginated list of customers with optional filters and sorting.
 *
 * Query Parameters:
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 10, max: 100)
 * - sortBy (string): Field to sort by (default: 'created_at')
 * - sortOrder (string): 'ASC' or 'DESC'
 * - filters (object): Optional nested filter object. Supported fields:
 *   - region (string|null)
 *   - country (string|null)
 *   - createdBy (UUID|null)
 *   - keyword (string|null): Partial match on name, email, or phone
 *   - createdAfter (ISO date string|null): Filter by created_at >=
 *   - createdBefore (ISO date string|null): Filter by created_at <=
 *   - statusDateAfter (ISO date string|null): Filter by status_date >=
 *   - statusDateBefore (ISO date string|null): Filter by status_date <=
 *   - onlyWithAddress (boolean|null): true = only customers with addresses, false = only without
 *
 * Authorization:
 * - Requires `view_customer` permission
 *
 * Middleware:
 * - authorize
 * - sanitizeInput
 * - validate (query parameters using Joi schema)
 */
router.get(
  '/',
  authorize(['view_customer']),
  createQueryNormalizationMiddleware(
    ['createdBy', 'updatedBy'],         // array keys
    ['onlyWithAddress'],                // boolean keys
    'customerSortMap'                   // sort map module
  ),
  sanitizeInput,
  validate(
    customerFilterSchema,
    'query',
    { convert: true },
    'Invalid query parameters.'
  ),
  getPaginatedCustomersController
);

module.exports = router;
