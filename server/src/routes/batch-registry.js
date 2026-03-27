/**
 * @file batch-registry.js
 * @description Batch registry query and note update routes.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization for the paginated list is handled by
 * `createQueryNormalizationMiddleware`.
 */

'use strict';

const express = require('express');
const { authorize }                      = require('../middlewares/authorize');
const { BATCH_REGISTRY }                 = require('../utils/constants/domain/permissions');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const {
  batchRegistryQuerySchema,
  batchRegistryIdParamSchema,
  updateBatchRegistryNoteSchema,
} = require('../validators/batch-registry-validators');
const {
  getPaginatedBatchRegistryController,
  updateBatchRegistryNoteController,
} = require('../controllers/batch-registry-controller');

const router = express.Router();

/**
 * @route GET /batch-registry
 * @description Paginated batch registry records with optional filters, sorting,
 * and keyword search. Supports both product and packaging material batch types.
 * Filters: batchType, statusIds, skuIds, productIds, manufacturerIds,
 *          packagingMaterialIds, supplierIds, keyword.
 * Sorting: sortBy, sortOrder (uses batchRegistrySortMap).
 * @access protected
 * @permission BATCH_REGISTRY.VIEW_LIST
 */
router.get(
  '/',
  authorize([BATCH_REGISTRY.VIEW_LIST]),
  validate(batchRegistryQuerySchema, 'query', {
    allowUnknown: true, // downstream middleware normalizes unknown keys before business layer
  }),
  createQueryNormalizationMiddleware(
    'batchRegistrySortMap', // moduleKey — drives allowed sortBy fields
    [                       // arrayKeys — normalized as UUID arrays
      'statusIds',
      'skuIds',
      'productIds',
      'manufacturerIds',
      'packagingMaterialIds',
      'supplierIds',
    ],
    [],                      // booleanKeys — none client-controlled
    batchRegistryQuerySchema,           // filterKeysOrSchema — extracts filter keys from schema
    {},                    // options factoryOption — none
    [],                 // option-level booleans — none
    []                   // option-level strings — none
  ),
  getPaginatedBatchRegistryController
);

/**
 * @route PATCH /batch-registry/:batchRegistryId/note
 * @description Update or clear the note on a batch registry record.
 * The note may be a non-empty string, an empty string, or null to clear it.
 * @access protected
 * @permission BATCH_REGISTRY.UPDATE_NOTE
 */
router.patch(
  '/:batchRegistryId/note',
  authorize([BATCH_REGISTRY.UPDATE_NOTE]),
  validate(batchRegistryIdParamSchema, 'params'),
  validate(updateBatchRegistryNoteSchema, 'body'),
  updateBatchRegistryNoteController
);

module.exports = router;
