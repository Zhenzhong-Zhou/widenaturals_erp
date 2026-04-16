/**
 * @file bom-items.js
 * @description BOM item detail routes.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 */

'use strict';

const express            = require('express');
const { authorize }      = require('../middlewares/authorize');
const validate           = require('../middlewares/validate');
const PERMISSION_KEYS        = require('../utils/constants/domain/permission-keys');
const { bomIdParamSchema } = require('../validators/bom-validators');
const {
  getBomMaterialSupplyDetailsController,
} = require('../controllers/bom-item-controller');

const router = express.Router();

/**
 * @route GET /bom-items/:bomId/material-supply
 * @description Material supply availability details for a specific BOM,
 * including stock levels and sourcing breakdown per component.
 * @access protected
 * @permission BOMS.VIEW_BOM_DETAILS
 */
router.get(
  '/:bomId/material-supply',
  authorize([PERMISSION_KEYS.BOMS.VIEW_BOM_DETAILS]),
  validate(bomIdParamSchema, 'params'),
  getBomMaterialSupplyDetailsController
);

module.exports = router;
