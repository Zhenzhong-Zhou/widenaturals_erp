const express = require('express');
const {
  createCustomerController,
  getPaginatedCustomersController,
} = require('../controllers/customer-controller');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  customerArraySchema,
  customerFilterSchema,
} = require('../validators/customer-validator');
const { sanitizeFields } = require('../middlewares/sanitize');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');

const router = express.Router();

/**
 * @route   POST /add-new-customers
 * @access  Protected
 * @permission create_customer
 *
 * @desc    Creates one or more customer records.
 *          Accepts a JSON array of customer objects (bulk or single insert).
 *          Requires authentication and the `create_customer` permission.
 *
 * Middleware:
 * - authorize: Ensures the user has 'create_customer' permission
 * - sanitizeFields: Cleans free-text fields like 'note' to prevent XSS
 * - validate: Validates each customer object against `customerArraySchema`
 *
 * Request Body:
 * - Array of customer objects with fields like firstname, lastname, email, phone_number, region, note, etc.
 *
 * @returns {201} Created customer records with metadata
 * @returns {400} Validation error (invalid customer object)
 * @returns {403} Authorization error (permission denied)
 */
router.post(
  '/add-new-customers',
  authorize(['create_customer']),
  sanitizeFields(['note']),
  validate(customerArraySchema, 'body'),
  createCustomerController
);

/**
 * @route   GET /customers
 * @access  Protected
 * @permission view_customer
 *
 * @desc    Fetches a paginated list of customers with filtering and sorting support.
 *
 * Middleware:
 * - authorize: Ensures the user has 'view_customer' permission
 * - createQueryNormalizationMiddleware:
 *     - Normalizes array fields like 'createdBy', 'updatedBy'
 *     - Converts string booleans like 'true'/'false' into real booleans (e.g., onlyWithAddress)
 *     - Resolves sortBy keys via 'customerSortMap'
 * - sanitizeFields: Cleans string inputs (e.g., 'keyword', 'region', 'country')
 * - validate: Validates query parameters against `customerFilterSchema`
 *
 * Query Parameters:
 * - page (number, default: 1)
 * - limit (number, default: 10, max: 100)
 * - sortBy (string, default: 'created_at')
 * - sortOrder (string: 'ASC' | 'DESC', default: 'DESC')
 * - region (string|null)
 * - country (string|null)
 * - createdBy (UUID|null)
 * - keyword (string|null) — partial match on name, email, or phone
 * - createdAfter (ISO date|string|null)
 * - createdBefore (ISO date|string|null)
 * - statusDateAfter (ISO date|string|null)
 * - statusDateBefore (ISO date|string|null)
 * - onlyWithAddress (boolean|null)
 *
 * @returns {200} Paginated list of customers with metadata
 * @returns {400} Invalid query parameters
 * @returns {403} Authorization error (permission denied)
 */
router.get(
  '/',
  authorize(['view_customer']),
  createQueryNormalizationMiddleware(
    'customerSortMap', // sort map module
    ['createdBy', 'updatedBy'], // array keys
    ['onlyWithAddress'], // boolean keys
    customerFilterSchema
  ),
  sanitizeFields(['keyword', 'region', 'country']),
  validate(
    customerFilterSchema,
    'query',
    { convert: true },
    'Invalid query parameters.'
  ),
  getPaginatedCustomersController
);

module.exports = router;
