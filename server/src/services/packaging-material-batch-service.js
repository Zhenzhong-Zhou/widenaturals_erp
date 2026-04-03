/**
 * @file packaging-material-batch-service.js
 * @description Business logic for packaging material batch lifecycle operations.
 *
 * Exports:
 *   - fetchPaginatedPackagingMaterialBatchesService  – paginated batch list with visibility scoping
 *   - createPackagingMaterialBatchesService          – bulk batch creation with registry and activity logs
 *   - editPackagingMaterialBatchMetadataService      – shared metadata update workflow
 *   - updatePackagingMaterialBatchStatusService      – status-only update (delegates to metadata workflow)
 *   - receivePackagingMaterialBatchService           – marks batch as received (delegates to metadata workflow)
 *   - releasePackagingMaterialBatchService           – marks batch as released (delegates to metadata workflow)
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  evaluatePackagingMaterialBatchVisibility,
  applyPackagingMaterialBatchVisibilityRules,
  evaluatePackagingMaterialBatchAccessControl,
  filterUpdatablePackagingMaterialBatchFields,
}                                            = require('../business/packaging-material-batch-business');
const {
  getPaginatedPackagingMaterialBatches,
  insertPackagingMaterialBatchesBulk,
  getPackagingMaterialBatchById,
  updatePackagingMaterialBatch,
}                                            = require('../repositories/packaging-material-batch-repository');
const {
  transformPaginatedPackagingMaterialBatchResults,
  transformPackagingMaterialBatchRecords,
}                                            = require('../transformers/packaging-material-batch-transformer');
const AppError                               = require('../utils/AppError');
const { withTransaction, lockRows }          = require('../database/db');
const { validateRequiredFields }             = require('../utils/validation/validate-required-fields');
const { getStatusId }                        = require('../config/status-cache');
const { registerBatchWorkflow, updateBatchWorkflow } = require('../business/batches/batch-workflow');
const { getBatchActivityTypeId }             = require('../cache/batch-activity-type-cache');
const {
  PACKAGING_BATCH_EDIT_RULES,
  PACKAGING_BATCH_STATUS_TRANSITIONS,
}                                            = require('../utils/constants/domain/packaging-material-batch-constants');
const { getBatchActivityType }               = require('../business/batches/batch-activity-resolvers');
const { transformIdOnlyResult }              = require('../transformers/common/id-result-transformer');

const CONTEXT = 'packaging-material-batch-service';

/**
 * Fetches paginated packaging material batches scoped to the user's visibility.
 *
 * @param {Object}  options
 * @param {Object}  [options.filters={}]  - Field filters to apply.
 * @param {number}  [options.page=1]      - Page number (1-based).
 * @param {number}  [options.limit=20]    - Records per page.
 * @param {Object}  options.user          - Authenticated user.
 * @returns {Promise<PaginatedResult<Object>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedPackagingMaterialBatchesService = async ({
                                                               filters = {},
                                                               page    = 1,
                                                               limit   = 20,
                                                               user,
                                                             }) => {
  const context = `${CONTEXT}/fetchPaginatedPackagingMaterialBatchesService`;
  
  try {
    // 1. Resolve visibility access control scope.
    const access = await evaluatePackagingMaterialBatchVisibility(user);
    
    // 2. Apply visibility rules to filters (CRITICAL — must run before query).
    const adjustedFilters = applyPackagingMaterialBatchVisibilityRules(filters, access);
    
    // 3. Query raw paginated rows.
    const rawResult = await getPaginatedPackagingMaterialBatches({
      filters: adjustedFilters,
      page,
      limit,
    });
    
    // 4. Return empty shape immediately — no records to process.
    if (!rawResult || rawResult.data.length === 0) {
      return {
        data:       [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }
    
    // 5. Transform for UI consumption.
    return transformPaginatedPackagingMaterialBatchResults(rawResult, access);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to retrieve packaging material batches.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Creates packaging material batches in bulk with registry entries and activity logs.
 *
 * Validates input, locks supplier rows, prepares batch records, and delegates
 * to the shared batch registration workflow.
 *
 * @param {Array<Object>} packagingMaterialBatches - Batch input objects.
 * @param {Object}        user                     - Authenticated user.
 * @returns {Promise<PackagingMaterialBatchInsertRecord[]>}
 *
 * @throws {AppError} `validationError`  – missing required fields or empty input.
 * @throws {AppError} `notFoundError`    – supplier rows could not be locked.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const createPackagingMaterialBatchesService = async (packagingMaterialBatches, user) => {
  const context = `${CONTEXT}/createPackagingMaterialBatchesService`;
  
  return withTransaction(async (client) => {
    try {
      // 1. Validate input array.
      if (!Array.isArray(packagingMaterialBatches) || packagingMaterialBatches.length === 0) {
        throw AppError.validationError('No packaging material batches provided.');
      }
      
      validateRequiredFields(
        packagingMaterialBatches,
        ['lot_number', 'packaging_material_supplier_id', 'manufacture_date', 'expiry_date', 'quantity'],
        context
      );
      
      // 2. Lock supplier rows to prevent concurrent batch creation.
      const uniqueSupplierIds = [
        ...new Set(
          packagingMaterialBatches
            .map((b) => b.packaging_material_supplier_id)
            .filter(Boolean)
        ),
      ];
      
      const lockedSuppliers = await lockRows(
        client,
        'packaging_material_suppliers',
        uniqueSupplierIds,
        'FOR UPDATE',
        { context }
      );
      
      if (!lockedSuppliers || lockedSuppliers.length !== uniqueSupplierIds.length) {
        throw AppError.notFoundError('Some packaging material suppliers could not be locked.');
      }
      
      // 3. Prepare batch records with status and actor.
      const pendingStatusId = getStatusId('batch_pending');
      const actorId         = user?.id;
      
      const preparedBatches = packagingMaterialBatches.map((batch) => ({
        ...batch,
        status_id:  pendingStatusId,
        created_by: actorId,
      }));
      
      // 4. Resolve activity type and run batch registration workflow.
      const batchCreatedActivityTypeId = getBatchActivityTypeId('BATCH_CREATED');
      
      const insertedBatches = await registerBatchWorkflow({
        batchType:                'packaging_material',
        batches:                  preparedBatches,
        insertBatchFn:            insertPackagingMaterialBatchesBulk,
        batchCreatedActivityTypeId,
        actorId,
        client,
      });
      
      // 5. Transform and return insert results.
      return transformPackagingMaterialBatchRecords(insertedBatches);
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw AppError.serviceError('Unable to create packaging material batches.', {
        meta: { error: error.message, context },
      });
    }
  });
};

/**
 * Updates packaging material batch metadata using the shared batch update workflow.
 *
 * Used directly for metadata edits and indirectly by status/receive/release operations.
 *
 * @param {string}      batchId          - UUID of the batch to update.
 * @param {Object}      updates          - Fields to update.
 * @param {Object}      user             - Authenticated user.
 * @param {string|null} [overrideContext] - Optional context override from delegating functions.
 * @returns {Promise<{ id: string }>}
 *
 * @throws {AppError} `validationError`  – invalid updates payload.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const editPackagingMaterialBatchMetadataService = async (
  batchId,
  updates,
  user,
  overrideContext
) => {
  const context = overrideContext ?? `${CONTEXT}/editPackagingMaterialBatchMetadataService`;
  
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
        getBatchFn:               getPackagingMaterialBatchById,
        updateBatchFn:            updatePackagingMaterialBatch,
        editRules:                PACKAGING_BATCH_EDIT_RULES,
        statusTransitions:        PACKAGING_BATCH_STATUS_TRANSITIONS,
        batchType:                'packaging_material',
        activityTypeResolver:     getBatchActivityType,
        evaluateAccessControlFn:  evaluatePackagingMaterialBatchAccessControl,
        filterUpdatableFieldsFn:  filterUpdatablePackagingMaterialBatchFields,
      });
      
      // 3. Transform and return ID-only result.
      return transformIdOnlyResult([updatedBatch])[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw AppError.serviceError('Unable to update packaging material batch metadata.', {
        meta: { error: error.message, context },
      });
    }
  });
};

/**
 * Updates the status of a packaging material batch.
 *
 * Delegates to `editPackagingMaterialBatchMetadataService`.
 *
 * @param {string}      batchId   - UUID of the batch to update.
 * @param {string}      statusId  - New status UUID.
 * @param {string|null} notes     - Optional notes.
 * @param {Object}      user      - Authenticated user.
 * @returns {Promise<{ id: string }>}
 */
const updatePackagingMaterialBatchStatusService = async (batchId, statusId, notes, user) =>
  editPackagingMaterialBatchMetadataService(
    batchId,
    { status_id: statusId, notes: notes ?? null },
    user,
    `${CONTEXT}/updatePackagingMaterialBatchStatusService`
  );

/**
 * Marks a packaging material batch as received.
 *
 * Delegates to `editPackagingMaterialBatchMetadataService`.
 *
 * @param {string}      batchId     - UUID of the batch to update.
 * @param {string|null} received_at - Timestamp of receipt.
 * @param {string|null} notes       - Optional notes.
 * @param {Object}      user        - Authenticated user.
 * @returns {Promise<{ id: string }>}
 */
const receivePackagingMaterialBatchService = async (batchId, received_at, notes, user) =>
  editPackagingMaterialBatchMetadataService(
    batchId,
    {
      status_id:   getStatusId('batch_received'),
      received_at: received_at ?? null,
      received_by: user.id,
      notes:       notes ?? null,
    },
    user,
    `${CONTEXT}/receivePackagingMaterialBatchService`
  );

/**
 * Marks a packaging material batch as released.
 *
 * Delegates to `editPackagingMaterialBatchMetadataService`.
 *
 * @param {string}      batchId     - UUID of the batch to update.
 * @param {string}      supplierId  - UUID of the releasing supplier.
 * @param {string|null} notes       - Optional notes.
 * @param {Object}      user        - Authenticated user.
 * @returns {Promise<{ id: string }>}
 */
const releasePackagingMaterialBatchService = async (batchId, supplierId, notes, user) =>
  editPackagingMaterialBatchMetadataService(
    batchId,
    {
      status_id:               getStatusId('batch_released'),
      released_by:             user.id,
      released_by_supplier_id: supplierId,
      notes:                   notes ?? null,
    },
    user,
    `${CONTEXT}/releasePackagingMaterialBatchService`
  );

module.exports = {
  fetchPaginatedPackagingMaterialBatchesService,
  createPackagingMaterialBatchesService,
  editPackagingMaterialBatchMetadataService,
  updatePackagingMaterialBatchStatusService,
  receivePackagingMaterialBatchService,
  releasePackagingMaterialBatchService,
};
