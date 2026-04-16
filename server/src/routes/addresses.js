/**
 * @file addresses.js
 * @description Address creation and paginated query routes.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express = require('express');
const {
  createAddressController,
  getPaginatedAddressesController,
} = require('../controllers/address-controller');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const {
  addressArraySchema,
  addressQuerySchema,
} = require('../validators/address-validators');

const router = express.Router();

/**
 * @route POST /addresses/add-new-addresses
 * @description Create one or more address records. Accepts a JSON array for single or bulk insertion.
 * @access protected
 * @permission PERMISSION_KEYS.ADDRESSES.CREATE
 */
router.post(
  '/add-new-addresses',
  authorize([PERMISSION_KEYS.ADDRESSES.CREATE]),
  validate(addressArraySchema, 'body'),
  createAddressController
);

/**
 * @route GET /addresses
 * @description Paginated address records with optional filters and sorting.
 * Filters: keyword, region, country, city, customerId, createdBy, updatedBy,
 *          createdAfter, createdBefore, updatedAfter, updatedBefore.
 * Sorting: sortBy, sortOrder (uses addressSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.ADDRESSES.VIEW
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.ADDRESSES.VIEW]),
  validate(
    addressQuerySchema,
    'query',
    { convert: true },
    'Invalid query parameters.'
  ),
  createQueryNormalizationMiddleware(
    'addressSortMap', // moduleKey — drives allowed sortBy fields via getSortMapForModule
    [], // arrayKeys
    [], // booleanKeys
    addressQuerySchema // filterKeysOrSchema — extracts filter keys from schema definition
  ),
  getPaginatedAddressesController
);

module.exports = router;
