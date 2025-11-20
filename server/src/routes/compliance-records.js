const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { getPaginatedComplianceRecordsSchema } = require('../validators/compliance-record-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const { getPaginatedComplianceRecordsController } = require('../controllers/compliance-record-controller');

const router = express.Router();

/**
 * Route: GET /api/v1/compliance-records
 *
 * Fetch paginated, sortable, and filterable compliance records.
 *
 * Middlewares included:
 *
 * 1. authorize()
 *    - Ensures the authenticated user has permission to view compliance records.
 *
 * 2. createQueryNormalizationMiddleware()
 *    - Applies sort map resolution (maps logical sort keys → SQL-safe columns)
 *    - Normalizes array-based filters (statusIds, productIds, skuIds)
 *    - Normalizes date range fields (created/updated/issued/expiry)
 *    - Validates input against the Joi schema
 *    - Hydrates req.normalizedQuery for controller consumption
 *
 * 3. sanitizeFields()
 *    - Removes unsafe characters from fuzzy-search fields
 *
 * 4. getPaginatedComplianceRecordsController
 *    - Executes service layer
 *    - Returns final API response
 */
router.get(
  '/',
  authorize([PERMISSIONS.COMPLIANCE_RECORDS.VIEW_LIST]),
  createQueryNormalizationMiddleware(
    'complianceRecordSortMap',                 // Name of sort map
    ['statusIds', 'productIds', 'skuIds'],  // Array-based filter fields
    [],                           // Reserved: fields that require numeric normalization (none for SKUs)
    getPaginatedComplianceRecordsSchema                // Joi schema for validation
  ),
  sanitizeFields([
    'keyword',
    'productName',
    'sku',
    'brand',
    'category',
  ]),
  validate(getPaginatedComplianceRecordsSchema, 'query'),
  getPaginatedComplianceRecordsController
);

module.exports = router;
