const express = require('express');
const { getBatchRegistryDropdownController } = require('../controllers/dropdown-controller');
const authorize = require('../middlewares/authorize');
const { sanitizeInput } = require('../middlewares/sanitize');

const router = express.Router();

/**
 * @route GET /dropdown/batch-registry
 * @desc Fetch dropdown options for batch registry records.
 *       Supports filters like batch type and exclusion criteria, with pagination.
 *       Used to populate batch selection menus in inventory forms.
 * @access Protected
 * @permission Requires 'view_batch_registry_dropdown' and 'access_inventory_utilities'
 */
router.get(
  '/batch-registry',
  authorize([
    'view_batch_registry_dropdown',
    'access_inventory_utilities'
  ]),
  sanitizeInput,
  getBatchRegistryDropdownController
);

module.exports = router;
