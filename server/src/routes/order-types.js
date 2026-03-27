/**
 * @file order-types.js
 * @description Order type paginated query routes.
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
const { orderTypeQuerySchema }           = require('../validators/order-type-validators');
const {
  getPaginatedOrderTypesController,
} = require('../controllers/order-type-controller');

const router = express.Router();

/**
 * @route GET /order-types
 * @description Paginated order type records with optional filters and sorting.
 * Filters: statusId, createdBy, updatedBy.
 * Sorting: sortBy, sortOrder (uses orderTypeSortMap).
 * @access protected
 * @permission ORDER_TYPES.VIEW
 */
router.get(
  '/',
  authorize([PERMISSIONS.ORDER_TYPES.VIEW]),
  validate(
    orderTypeQuerySchema,
    'query',
    { convert: true },
    'Invalid query parameters.'
  ),
  createQueryNormalizationMiddleware(
    'orderTypeSortMap',                        // moduleKey — drives allowed sortBy fields
    ['statusId', 'createdBy', 'updatedBy'],    // arrayKeys — normalized as UUID arrays
    [],                                        // booleanKeys — none client-controlled
    orderTypeQuerySchema                       // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedOrderTypesController
);

module.exports = router;
