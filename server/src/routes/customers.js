const express = require('express');
const {
  createCustomerController,
  getCustomersController,
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

router.get('/', getCustomersController);

router.get('/dropdown', getCustomersDropdownController);

router.get('/:id', getCustomerByIdController);

module.exports = router;
