/**
 * @fileoverview
 * Routes for BOM (Bill of Materials) operations
 *
 * Includes endpoints for:
 *  - Fetching BOM material supply details with suppliers and batches
 *  - (Future) Creating, updating, or listing BOM definitions
 */

const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const { bomIdParamSchema } = require('../validators/bom-validators');
const validate = require('../middlewares/validate');
const {
  getBomMaterialSupplyDetailsController,
} = require('../controllers/bom-item-controller');

const router = express.Router();

/**
 * @route GET /api/boms/:bomId/material-supply
 * @description
 * Fetch full BOM material supply details — including linked parts,
 * packaging materials, suppliers, batches, and calculated cost summary.
 *
 * Requirements:
 *  - Authenticated session
 *  - Permission: VIEW_BOM_DETAILS
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "BOM Material Supply Details fetched successfully.",
 *   "data": {
 *     "summary": { ... },
 *     "details": [ ... ]
 *   }
 * }
 *
 * Example:
 * GET /api/bom-items/fefec9a0-0165-4246-acd3-9af4f8781475/material-supply
 */
router.get(
  '/:bomId/material-supply',
  authorize(PERMISSIONS.BOMS.VIEW_BOM_DETAILS),
  validate(bomIdParamSchema, 'params'),
  getBomMaterialSupplyDetailsController
);

module.exports = router;
