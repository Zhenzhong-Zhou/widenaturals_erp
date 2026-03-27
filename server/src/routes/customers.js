/**
 * @file customers.js
 * @description Customer creation and paginated query routes.
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
const {
  customerArraySchema,
  customerFilterSchema,
} = require('../validators/customer-validator');
const {
  createCustomerController,
  getPaginatedCustomersController,
} = require('../controllers/customer-controller');

const router = express.Router();

/**
 * @route POST /customers/add-new-customers
 * @description Create one or more customer records. Accepts a JSON array for
 * single or bulk insertion.
 * @access protected
 * @permission CUSTOMERS.CREATE
 */
router.post(
  '/add-new-customers',
  authorize([PERMISSIONS.CUSTOMERS.CREATE]),
  validate(customerArraySchema, 'body'),
  createCustomerController
);

/**
 * @route GET /customers
 * @description Paginated customer records with optional filters, sorting, and keyword search.
 * Filters: keyword, region, country, city, createdBy, updatedBy,
 *          createdAfter, createdBefore, updatedAfter, updatedBefore, onlyWithAddress.
 * Sorting: sortBy, sortOrder (uses customerSortMap).
 * @access protected
 * @permission CUSTOMERS.VIEW
 */
router.get(
  '/',
  authorize([PERMISSIONS.CUSTOMERS.VIEW]),
  validate(
    customerFilterSchema,
    'query',
    { convert: true },
    'Invalid query parameters.'
  ),
  createQueryNormalizationMiddleware(
    'customerSortMap',           // moduleKey — drives allowed sortBy fields
    ['createdBy', 'updatedBy'],  // arrayKeys — normalized as UUID arrays
    ['onlyWithAddress'],         // booleanKeys — normalized to true/false
    customerFilterSchema         // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedCustomersController
);

module.exports = router;
