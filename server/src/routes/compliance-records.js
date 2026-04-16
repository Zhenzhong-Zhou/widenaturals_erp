/**
 * @file compliance-records.js
 * @description Compliance record paginated query routes.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS                        = require('../utils/constants/domain/permission-keys');
const {
  getPaginatedComplianceRecordsSchema,
} = require('../validators/compliance-record-validators');
const {
  getPaginatedComplianceRecordsController,
} = require('../controllers/compliance-record-controller');

const router = express.Router();

/**
 * @route GET /compliance-records
 * @description Paginated compliance records with optional filters, sorting, and date ranges.
 * Filters: statusIds, productIds, skuIds, createdAfter, createdBefore,
 *          issuedAfter, issuedBefore, expiryAfter, expiryBefore.
 * Sorting: sortBy, sortOrder (uses complianceRecordSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.COMPLIANCE_RECORDS.VIEW_LIST
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.COMPLIANCE_RECORDS.VIEW_LIST]),
  validate(getPaginatedComplianceRecordsSchema, 'query'),
  createQueryNormalizationMiddleware(
    'complianceRecordSortMap',              // moduleKey — drives allowed sortBy fields
    ['statusIds', 'productIds', 'skuIds'],  // arrayKeys — normalized as UUID arrays
    [],                                     // booleanKeys — none client-controlled
    getPaginatedComplianceRecordsSchema     // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedComplianceRecordsController
);

module.exports = router;
