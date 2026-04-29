/**
 * @file location-types.js
 * @description Location type paginated query and detail routes.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const {
  locationTypeQuerySchema,
  locationTypeIdParamSchema,
} = require('../validators/location-type-validators');
const {
  getPaginatedLocationTypesController,
  getLocationTypeDetailsController,
} = require('../controllers/location-type-controller');

const router = express.Router();

/**
 * @route GET /location-types
 * @description Paginated location type records with optional filters and sorting.
 * Filters: statusIds.
 * Sorting: sortBy, sortOrder (uses locationTypeSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.LOCATION_TYPES.VIEW
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.LOCATION_TYPES.VIEW]),
  validate(locationTypeQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'locationTypeSortMap', // moduleKey — drives allowed sortBy fields
    ['statusIds'], // arrayKeys — normalized as UUID arrays
    [], // booleanKeys — none client-controlled
    locationTypeQuerySchema // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedLocationTypesController
);

/**
 * @route GET /location-types/:locationTypeId/details
 * @description Full detail record for a single location type by ID.
 * @access protected
 * @permission PERMISSION_KEYS.LOCATION_TYPES.VIEW_DETAILS
 */
router.get(
  '/:locationTypeId/details',
  authorize([PERMISSION_KEYS.LOCATION_TYPES.VIEW_DETAILS]),
  validate(locationTypeIdParamSchema, 'params'),
  getLocationTypeDetailsController
);

module.exports = router;
