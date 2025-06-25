const express = require('express');
const {
  createCustomerController,
  getPaginatedCustomersController,
  getCustomersDropdownController,
  getCustomerByIdController,
} = require('../controllers/customer-controller');
const authorize = require('../middlewares/authorize');
const { sanitizeInput } = require('../middlewares/sanitize');

const router = express.Router();

/**
 * @route   POST /add-new-customers
 * @access  protected
 * @desc    Create one or more customer records.
 *          Accepts a JSON array of customer objects (single or bulk).
 *          Requires authentication and 'create_customer' permission.
 *
 * @body    {Array<Object>} customers - Customer objects to be created.
 * @returns {201} On success, returns created customer(s) with metadata.
 */
router.post(
  '/add-new-customers',
  authorize(['create_customer']),
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
 * - sortBy (string): Field to sort by (mapped in customerSortMap)
 * - sortOrder (string): 'ASC' or 'DESC' (default: 'DESC')
 * - isArchived (boolean): true/false
 * - region, country, createdBy, keyword, createdAfter, etc.
 *
 * Authorization:
 * - Requires `view_customer` permission
 *
 * Middleware:
 * - authorize
 * - sanitizeInput
 */
router.get(
  '/',
  authorize(['view_customer']),
  sanitizeInput,
  getPaginatedCustomersController
);

router.get('/dropdown', getCustomersDropdownController);

router.get('/:id', getCustomerByIdController);

module.exports = router;
