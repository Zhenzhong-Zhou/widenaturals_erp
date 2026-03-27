/**
 * @file locations.js
 * @description Location paginated query routes.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSIONS                        = require('../utils/constants/domain/permissions');
const { locationQuerySchema }            = require('../validators/location-validators');
const {
  getPaginatedLocationsController,
} = require('../controllers/location-controller');

const router = express.Router();

/**
 * @route GET /locations
 * @description Paginated location records with optional filters, sorting, and archive visibility.
 * Filters: statusIds, locationTypeIds, includeArchived.
 * Sorting: sortBy, sortOrder (uses locationSortMap).
 * @access protected
 * @permission LOCATIONS.VIEW
 */
router.get(
  '/',
  authorize([PERMISSIONS.LOCATIONS.VIEW]),
  validate(locationQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'locationSortMap',                   // moduleKey — drives allowed sortBy fields
    ['statusIds', 'locationTypeIds'],    // arrayKeys — normalized as UUID arrays
    ['includeArchived'],                 // booleanKeys — normalized to true/false
    locationQuerySchema                  // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedLocationsController
);

module.exports = router;
