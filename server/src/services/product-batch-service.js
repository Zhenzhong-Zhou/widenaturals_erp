/**
 * @file product-batch-service.js
 * @description Business logic for product batch lifecycle operations.
 *
 * Exports:
 *   - fetchPaginatedProductBatchesService  – paginated batch list with visibility scoping
 *   - createProductBatchesService          – bulk batch creation with registry and activity logs
 *   - editProductBatchMetadataService      – shared metadata update workflow
 *   - updateProductBatchStatusService      – status-only update (delegates to metadata workflow)
 *   - receiveProductBatchService           – marks batch as received (delegates to metadata workflow)
 *   - releaseProductBatchService           – marks batch as released (delegates to metadata workflow)
 *   - fetchProductBatchDetailsService      – single batch detail by ID
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  evaluateProductBatchVisibility,
  applyProductBatchVisibilityRules,
  evaluateProductBatchAccessControl,
  filterUpdatableProductBatchFields,
}                                            = require('../business/product-batch-business');
const {
  getPaginatedProductBatches,
  insertProductBatchesBulk,
  updateProductBatch,
  getProductBatchById,
  getProductBatchDetailsById,
}                                            = require('../repositories/product-batch-repository');
const {
  transformPaginatedProductBatchResults,
  transformProductBatchRecords,
  transformProductBatchDetail,
}                                            = require('../transformers/product-batch-transformer');
const AppError                               = require('../utils/AppError');
const { withTransaction }          = require('../database/db');
const { lockRows } = require('../utils/db/lock-modes');
const { validateRequiredFields }             = require('../utils/validation/validate-required-fields');
const { getStatusId }                        = require('../config/status-cache');
const { registerBatchWorkflow, updateBatchWorkflow } = require('../business/batches/batch-workflow');
const { getBatchActivityType }               = require('../business/batches/batch-activity-resolvers');
const { getBatchActivityTypeId }             = require('../cache/batch-activity-type-cache');
const {
  PRODUCT_BATCH_EDIT_RULES,
  PRODUCT_BATCH_STATUS_TRANSITIONS,
}                                            = require('../utils/constants/domain/product-batch-constants');
const { transformIdOnlyResult }              = require('../transformers/common/id-result-transformer');

const CONTEXT = 'product-batch-service';

/**
 * Fetches paginated product batches scoped to the user's visibility.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]          - Field filters to apply.
 * @param {number}        [options.page=1]              - Page number (1-based).
 * @param {number}        [options.limit=20]            - Records per page.
 * @param {string}        [options.sortBy='expiryDate'] - Sort field key.
 * @param {'ASC'|'DESC'}  [options.sortOrder='ASC']     - Sort direction.
 * @param {Object}        options.user                  - Authenticated user.
 * @returns {Promise<PaginatedResult<Object>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedProductBatchesService = async ({
                                                     filters   = {},
                                                     page      = 1,
                                                     limit     = 20,
                                                     sortBy    = 'expiryDate',
                                                     sortOrder = 'ASC',
                                                     user,
                                                   }) => {
  const context = `${CONTEXT}/fetchPaginatedProductBatchesService`;
  
  try {
    // 1. Resolve visibility access control scope.
    const access = await evaluateProductBatchVisibility(user);
    
    // 2. Apply visibility rules to filters (CRITICAL — must run before query).
    const adjustedFilters = applyProductBatchVisibilityRules(filters, access);
    
    // 3. Query raw paginated rows.
    const rawResult = await getPaginatedProductBatches({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // 4. Return empty shape immediately — no records to process.
    if (!rawResult || rawResult.data.length === 0) {
      return {
        data:       [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }
    
    // 5. Transform for UI consumption.
    return transformPaginatedProductBatchResults(rawResult, access);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to retrieve product batches.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Creates product batches in bulk with registry entries and activity logs.
 *
 * Validates input, locks SKU and manufacturer rows, prepares batch records,
 * and delegates to the shared batch registration workflow.
 *
 * @param {Array<Object>} productBatches - Batch input objects.
 * @param {Object}        user           - Authenticated user.
 * @returns {Promise<ProductBatchInsertRecord[]>}
 *
 * @throws {AppError} `validationError`  – missing required fields or empty input.
 * @throws {AppError} `notFoundError`    – SKU or manufacturer rows could not be locked.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const createProductBatchesService = async (productBatches, user) => {
  const context = `${CONTEXT}/createProductBatchesService`;
  
  return withTransaction(async (client) => {
    try {
      // 1. Validate input array.
      if (!Array.isArray(productBatches) || productBatches.length === 0) {
        throw AppError.validationError('No product batches provided.');
      }
      
      validateRequiredFields(
        productBatches,
        ['lot_number', 'sku_id', 'manufacture_date', 'expiry_date', 'initial_quantity'],
        context
      );
      
      // 2. Lock SKU rows to prevent concurrent batch creation.
      const uniqueSkuIds = [...new Set(productBatches.map((b) => b.sku_id))];
      
      const lockedSkus = await lockRows(client, 'skus', uniqueSkuIds, 'FOR UPDATE', { context });
      
      if (!lockedSkus || lockedSkus.length !== uniqueSkuIds.length) {
        throw AppError.notFoundError('Some SKUs could not be locked.');
      }
      
      // 3. Lock manufacturer rows to preserve foreign key integrity.
      const uniqueManufacturerIds = [
        ...new Set(productBatches.map((b) => b.manufacturer_id).filter(Boolean)),
      ];
      
      const lockedManufacturers = await lockRows(
        client,
        'manufacturers',
        uniqueManufacturerIds,
        'FOR UPDATE',
        { context }
      );
      
      if (!lockedManufacturers || lockedManufacturers.length !== uniqueManufacturerIds.length) {
        throw AppError.notFoundError('Some manufacturers could not be locked.');
      }
      
      // 4. Prepare batch records with status and actor.
      const pendingStatusId = getStatusId('batch_pending');
      const actorId         = user?.id;
      
      const preparedBatches = productBatches.map((batch) => ({
        ...batch,
        status_id:  pendingStatusId,
        created_by: actorId,
      }));
      
      // 5. Resolve activity type and run batch registration workflow.
      const batchCreatedActivityTypeId = getBatchActivityTypeId('BATCH_CREATED');
      
      const insertedBatches = await registerBatchWorkflow({
        batchType:                'product',
        batches:                  preparedBatches,
        insertBatchFn:            insertProductBatchesBulk,
        batchCreatedActivityTypeId,
        actorId,
        client,
      });
      
      // 6. Transform and return insert results.
      return transformProductBatchRecords(insertedBatches);
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw AppError.serviceError('Unable to create product batches.', {
        meta: { error: error.message, context },
      });
    }
  });
};

/**
 * Updates product batch metadata using the shared batch update workflow.
 *
 * Used directly for metadata edits and indirectly by status/receive/release operations.
 *
 * @param {string}      batchId          - UUID of the batch to update.
 * @param {Object}      updates          - Fields to update.
 * @param {Object}      user             - Authenticated user.
 * @param {string|null} [contextOverride] - Optional context override from delegating functions.
 * @returns {Promise<{ id: string }>}
 *
 * @throws {AppError} `validationError`  – invalid updates payload.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const editProductBatchMetadataService = async (batchId, updates, user, contextOverride) => {
  const context = contextOverride ?? `${CONTEXT}/editProductBatchMetadataService`;
  
  return withTransaction(async (client) => {
    try {
      // 1. Validate updates payload.
      if (!updates || typeof updates !== 'object') {
        throw AppError.validationError('Invalid updates payload.');
      }
      
      // 2. Execute shared batch update workflow.
      const updatedBatch = await updateBatchWorkflow({
        batchId,
        updates,
        user,
        client,
        getBatchFn:               getProductBatchById,
        updateBatchFn:            updateProductBatch,
        editRules:                PRODUCT_BATCH_EDIT_RULES,
        statusTransitions:        PRODUCT_BATCH_STATUS_TRANSITIONS,
        batchType:                'product',
        activityTypeResolver:     getBatchActivityType,
        evaluateAccessControlFn:  evaluateProductBatchAccessControl,
        filterUpdatableFieldsFn:  filterUpdatableProductBatchFields,
      });
      
      // 3. Transform and return ID-only result.
      return transformIdOnlyResult([updatedBatch])[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw AppError.serviceError('Unable to update product batch metadata.', {
        meta: { error: error.message, context },
      });
    }
  });
};

/**
 * Updates the status of a product batch.
 *
 * @param {string}      batchId   - UUID of the batch to update.
 * @param {string}      statusId  - New status UUID.
 * @param {string|null} notes     - Optional notes.
 * @param {Object}      user      - Authenticated user.
 * @returns {Promise<{ id: string }>}
 */
const updateProductBatchStatusService = async (batchId, statusId, notes, user) =>
  editProductBatchMetadataService(
    batchId,
    { status_id: statusId, notes: notes ?? null },
    user,
    `${CONTEXT}/updateProductBatchStatusService`
  );

/**
 * Marks a product batch as received.
 *
 * @param {string}      batchId     - UUID of the batch to update.
 * @param {string|null} received_at - Timestamp of receipt.
 * @param {string|null} notes       - Optional notes.
 * @param {Object}      user        - Authenticated user.
 * @returns {Promise<{ id: string }>}
 */
const receiveProductBatchService = async (batchId, received_at, notes, user) =>
  editProductBatchMetadataService(
    batchId,
    {
      status_id:   getStatusId('batch_received'),
      received_at: received_at ?? null,
      received_by: user.id,
      notes:       notes ?? null,
    },
    user,
    `${CONTEXT}/receiveProductBatchService`
  );

/**
 * Marks a product batch as released.
 *
 * @param {string}      batchId        - UUID of the batch to update.
 * @param {string}      manufacturerId - UUID of the releasing manufacturer.
 * @param {string|null} notes          - Optional notes.
 * @param {Object}      user           - Authenticated user.
 * @returns {Promise<{ id: string }>}
 */
const releaseProductBatchService = async (batchId, manufacturerId, notes, user) =>
  editProductBatchMetadataService(
    batchId,
    {
      status_id:                    getStatusId('batch_released'),
      released_by:                  user.id,
      released_by_manufacturer_id:  manufacturerId,
      notes:                        notes ?? null,
    },
    user,
    `${CONTEXT}/releaseProductBatchService`
  );

/**
 * Fetches full product batch detail by ID.
 *
 * @param {string} batchId - UUID of the batch to retrieve.
 * @returns {Promise<Object>} Transformed product batch detail.
 *
 * @throws {AppError} `notFoundError` – batch does not exist.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchProductBatchDetailsService = async (batchId) => {
  const context = `${CONTEXT}/fetchProductBatchDetailsService`;
  
  try {
    const rawBatch = await getProductBatchDetailsById(batchId);
    
    if (!rawBatch) {
      throw AppError.notFoundError('Product batch not found.');
    }
    
    return transformProductBatchDetail(rawBatch);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch product batch details.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  fetchPaginatedProductBatchesService,
  createProductBatchesService,
  editProductBatchMetadataService,
  updateProductBatchStatusService,
  receiveProductBatchService,
  releaseProductBatchService,
  fetchProductBatchDetailsService,
};
