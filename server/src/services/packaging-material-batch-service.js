const {
  evaluatePackagingMaterialBatchVisibility,
  applyPackagingMaterialBatchVisibilityRules,
  evaluatePackagingMaterialBatchAccessControl,
  filterUpdatablePackagingMaterialBatchFields,
} = require('../business/packaging-material-batch-business');
const {
  getPaginatedPackagingMaterialBatches,
  insertPackagingMaterialBatchesBulk,
  getPackagingMaterialBatchById,
  updatePackagingMaterialBatch,
} = require('../repositories/packaging-material-batch-repository');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');
const {
  transformPaginatedPackagingMaterialBatchResults,
  transformPackagingMaterialBatchRecords,
} = require('../transformers/packaging-material-batch-transformer');
const AppError = require('../utils/AppError');
const { withTransaction, lockRows } = require('../database/db');
const { validateRequiredFields } = require('../utils/validation/validation-utils');
const { getStatusId } = require('../config/status-cache');
const {
  registerBatchWorkflow,
  updateBatchWorkflow
} = require('../business/batches/batch-workflow');
const { getBatchActivityTypeId } = require('../cache/batch-activity-type-cache');
const {
  PACKAGING_BATCH_EDIT_RULES,
  PACKAGING_BATCH_STATUS_TRANSITIONS
} = require('../utils/constants/domain/packaging-material-batch-constants');
const { getBatchActivityType } = require('../business/batches/batch-activity-resolvers');
const { transformIdOnlyResult } = require('../transformers/common/id-result-transformer');

/**
 * Service: Fetch paginated packaging material batch records for UI consumption.
 *
 * Responsibilities:
 * - Resolve packaging material batch visibility for the requesting user
 * - Translate ACL decisions into repository-consumable filters
 * - Execute paginated packaging material batch queries
 * - Normalize empty result sets
 * - Transform flat PMB rows into UI-ready shapes
 * - Emit structured success and failure logs
 *
 * Visibility enforcement model:
 * - Repository-level filtering is the PRIMARY enforcement mechanism
 * - Service-level filter adjustment expresses business intent
 * - No row-level slicing is required (non-polymorphic domain)
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Normalized pre-business filters
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {Object} options.user - Authenticated requester context
 *
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
const fetchPaginatedPackagingMaterialBatchesService = async ({
  filters = {},
  page = 1,
  limit = 20,
  user,
}) => {
  const context =
    'packaging-material-batch-service/fetchPaginatedPackagingMaterialBatchesService';

  try {
    // ---------------------------------------------------------
    // Step 0 — Resolve PMB visibility
    // ---------------------------------------------------------
    const access = await evaluatePackagingMaterialBatchVisibility(user);

    // ---------------------------------------------------------
    // Step 1 — Apply visibility / scope rules (CRITICAL)
    // ---------------------------------------------------------
    const adjustedFilters = applyPackagingMaterialBatchVisibilityRules(
      filters,
      access
    );

    // ---------------------------------------------------------
    // Step 2 — Query raw PMB rows
    // ---------------------------------------------------------
    const rawResult = await getPaginatedPackagingMaterialBatches({
      filters: adjustedFilters,
      page,
      limit,
    });

    // ---------------------------------------------------------
    // Step 3 — Handle empty result
    // ---------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No packaging material batches found', {
        context,
        filters: adjustedFilters,
        pagination: { page, limit },
      });

      return {
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }

    // ---------------------------------------------------------
    // Step 4 — Transform for UI consumption
    // ---------------------------------------------------------
    const result = await transformPaginatedPackagingMaterialBatchResults(
      rawResult,
      access
    );

    // ---------------------------------------------------------
    // Step 5 — Log success
    // ---------------------------------------------------------
    logSystemInfo('Paginated packaging material batches fetched', {
      context,
      filters: adjustedFilters,
      pagination: result.pagination,
      count: result.data?.length,
    });

    return result;
  } catch (error) {
    // ---------------------------------------------------------
    // Step 6 — Log + rethrow
    // ---------------------------------------------------------
    logSystemException(error, 'Failed to fetch packaging material batches', {
      context,
      filters,
      pagination: { page, limit },
      userId: user?.id,
    });

    throw AppError.serviceError(
      'Unable to retrieve packaging material batches at this time.',
      { context }
    );
  }
};

/**
 * Create packaging material batches and register them within the ERP system.
 *
 * This service orchestrates the complete lifecycle required to create
 * packaging material batches, ensuring transactional integrity and
 * full audit traceability.
 *
 * Workflow:
 * 1. Validate input payload structure and required fields.
 * 2. Lock related packaging material supplier records to prevent
 *    concurrent batch creation conflicts.
 * 3. Normalize batch records and apply default status values.
 * 4. Insert batch records in bulk.
 * 5. Register batches in the batch registry.
 * 6. Create batch activity logs for audit tracking.
 * 7. Transform database rows into API response format.
 *
 * Concurrency Protection:
 * - Supplier rows are locked using `SELECT ... FOR UPDATE` to ensure
 *   batches referencing the same supplier cannot be created concurrently.
 *
 * Performance Characteristics:
 * - Uses bulk insert operations to minimize database round trips.
 * - Executes the entire workflow inside a single transaction.
 * - Designed to efficiently process large batch imports.
 *
 * Data Integrity Guarantees:
 * - Ensures all referenced suppliers exist before insertion.
 * - Ensures every batch is registered and logged.
 * - Maintains atomic consistency across all related tables.
 *
 * @async
 *
 * @param {Array<Object>} packagingMaterialBatches
 * Packaging material batch payloads to create.
 *
 * @param {Object} user
 * Authenticated user performing the operation.
 *
 * @param {string} user.id
 * User identifier used for audit and ownership tracking.
 *
 * @returns {Promise<Array<Object>>}
 * Transformed packaging material batch records for API response.
 */
const createPackagingMaterialBatchesService = async (
  packagingMaterialBatches,
  user
) => {
  return withTransaction(async (client) => {
    const context =
      'packaging-material-batch-service/createPackagingMaterialBatchesService';
    
    const actorId = user?.id;
    
    try {
      // ------------------------------------------------------------
      // 1. Validate input
      // ------------------------------------------------------------
      if (
        !Array.isArray(packagingMaterialBatches) ||
        packagingMaterialBatches.length === 0
      ) {
        throw AppError.validationError(
          'No packaging material batches provided.',
          { details: context }
        );
      }
      
      validateRequiredFields(
        packagingMaterialBatches,
        [
          'lot_number',
          'packaging_material_supplier_id',
          'manufacture_date',
          'expiry_date',
          'quantity',
        ],
        context
      );
      
      // ------------------------------------------------------------
      // 2. Lock related packaging material supplier rows
      // ------------------------------------------------------------
      // Extract unique supplier ids referenced by incoming batches
      // Filtering null prevents invalid locking queries.
      const uniquePackagingMaterialSupplierIds = [
        ...new Set(
          packagingMaterialBatches
            .map(b => b.packaging_material_supplier_id)
            .filter(Boolean)
        )
      ];

      // Lock supplier rows to prevent concurrent batch creation
      const lockedSuppliers = await lockRows(
        client,
        'packaging_material_suppliers',
        uniquePackagingMaterialSupplierIds,
        'FOR UPDATE',
        { context }
      );

      // Verify all suppliers exist
      if (!lockedSuppliers || lockedSuppliers.length !== uniquePackagingMaterialSupplierIds.length) {
        throw AppError.notFoundError(
          'Some packaging material suppliers could not be locked.',
          { context }
        );
      }
      
      // ------------------------------------------------------------
      // 3. Prepare batch records
      // ------------------------------------------------------------
      const pendingStatusId = getStatusId('batch_pending');
      
      const preparedBatches = packagingMaterialBatches.map((batch) => ({
        ...batch,
        status_id: pendingStatusId,
        created_by: actorId,
      }));
      
      // Resolve activity type once
      const batchCreatedActivityTypeId =
        getBatchActivityTypeId('BATCH_CREATED');
      
      // ------------------------------------------------------------
      // 4. Create batches + registry + activity logs
      // ------------------------------------------------------------
      const insertedBatches = await registerBatchWorkflow({
        batchType: 'packaging_material',
        batches: preparedBatches,
        insertBatchFn: insertPackagingMaterialBatchesBulk,
        batchCreatedActivityTypeId,
        actorId,
        client,
      });
      
      // ------------------------------------------------------------
      // 5. Transform response
      // ------------------------------------------------------------
      const transformed =
        transformPackagingMaterialBatchRecords(insertedBatches);
      
      // ------------------------------------------------------------
      // 6. System audit log
      // ------------------------------------------------------------
      logSystemInfo('Packaging material batch creation completed', {
        context,
        totalInput: packagingMaterialBatches.length,
        insertedCount: insertedBatches.length,
      });
      
      return transformed;
    } catch (error) {
      logSystemException(
        error,
        'Failed to create packaging material batches',
        { context }
      );
      
      throw AppError.databaseError(
        'Failed to create packaging material batches.',
        {
          cause: error,
          context,
        }
      );
    }
  });
};

/**
 * Service for editing packaging material batch metadata.
 *
 * This service executes the shared batch update workflow inside a
 * database transaction and ensures that:
 *
 * - lifecycle rules are enforced by the shared batch workflow
 * - metadata updates follow permission restrictions
 * - lifecycle status transitions are validated
 * - batch activity logs are generated and persisted for auditing
 *
 * Responsibilities:
 * - validate service inputs
 * - open a database transaction
 * - execute the shared batch workflow
 * - transform the response payload
 * - record structured system logs
 *
 * @async
 *
 * @param {string} batchId
 * Packaging material batch identifier.
 *
 * @param {Object} updates
 * Partial fields to update on the batch.
 *
 * @param {{ id: string }} user
 * Authenticated user performing the operation.
 *
 * @returns {Promise<{ id: string }>}
 * Identifier of the updated batch.
 */
const editPackagingMaterialBatchMetadataService = async (
  batchId,
  updates,
  user
) => {
  return withTransaction(async (client) => {
    const context =
      'packaging-material-batch-service/editPackagingMaterialBatchMetadataService';
    
    try {
      //------------------------------------------------------------
      // 1. Validate service inputs
      //------------------------------------------------------------
      if (!batchId) {
        throw AppError.validationError(
          'batchId is required.',
          { context }
        );
      }
      
      if (!updates || typeof updates !== 'object') {
        throw AppError.validationError(
          'Invalid updates payload.',
          {
            details: {
              context
            }
          }
        );
      }
      
      //------------------------------------------------------------
      // 2. Execute shared batch workflow
      //------------------------------------------------------------
      const updatedBatch = await updateBatchWorkflow({
        batchId,
        updates,
        user,
        client,
        
        // repository access
        getBatchFn: getPackagingMaterialBatchById,
        updateBatchFn: updatePackagingMaterialBatch,
        
        // lifecycle configuration
        editRules: PACKAGING_BATCH_EDIT_RULES,
        statusTransitions: PACKAGING_BATCH_STATUS_TRANSITIONS,
        
        // domain type for activity logging
        batchType: 'packaging_material',
        
        // activity type resolver
        activityTypeResolver: getBatchActivityType,
        
        // permission evaluation
        evaluateAccessControlFn: evaluatePackagingMaterialBatchAccessControl,
        
        // lifecycle + permission filtering
        filterUpdatableFieldsFn: filterUpdatablePackagingMaterialBatchFields,
      });
      
      //------------------------------------------------------------
      // 3. Transform response payload
      //------------------------------------------------------------
      const transformedResult =
        transformIdOnlyResult([updatedBatch]);
      
      //------------------------------------------------------------
      // 4. Structured system log
      //------------------------------------------------------------
      logSystemInfo(
        'Packaging material batch metadata updated successfully',
        {
          context,
          batchId,
        }
      );
      return transformedResult[0];
    } catch (error) {
      //------------------------------------------------------------
      // Log unexpected errors
      //------------------------------------------------------------
      logSystemException(
        error,
        'Failed to update packaging material batch metadata',
        {
          context,
          batchId,
        }
      );
      
      if (error instanceof AppError) throw error;
      
      //------------------------------------------------------------
      // Normalize unexpected errors
      //------------------------------------------------------------
      throw AppError.databaseError(
        'Failed to update packaging material batch metadata.',
        {
          cause: error,
          context,
        }
      );
    }
  });
};

/**
 * Updates the lifecycle status of a packaging material batch.
 *
 * This service delegates the update to
 * {@link editPackagingMaterialBatchMetadataService} so that all
 * packaging batch modifications pass through the shared batch
 * workflow engine.
 *
 * The workflow engine centrally handles:
 *
 * - lifecycle transition validation
 * - permission checks
 * - activity log generation
 * - transactional database updates
 *
 * Routing lifecycle changes through the metadata workflow ensures
 * consistent status handling across packaging material batches.
 *
 * @async
 *
 * @param {string} batchId
 * Identifier of the packaging material batch to update.
 *
 * @param {string} statusId
 * Target lifecycle status identifier.
 *
 * @param {string|null} [notes]
 * Optional notes describing the status change.
 *
 * @param {{ id: string }} user
 * Authenticated user performing the operation.
 *
 * @returns {Promise<{ id: string }>}
 * Identifier of the updated batch.
 */
const updatePackagingMaterialBatchStatusService = async (
  batchId,
  statusId,
  notes,
  user
) => {
  //------------------------------------------------------------
  // Delegate lifecycle update to shared metadata workflow
  //------------------------------------------------------------
  return editPackagingMaterialBatchMetadataService(
    batchId,
    {
      status_id: statusId,
      notes: notes ?? null
    },
    user
  );
};

/**
 * Marks a packaging material batch as received by the warehouse.
 *
 * This lifecycle transition records warehouse intake
 * information and moves the batch to the "received" status.
 *
 * The shared metadata service performs:
 * - lifecycle validation
 * - permission enforcement
 * - activity logging
 * - transactional updates
 *
 * @async
 *
 * @param {string} batchId
 * Packaging material batch identifier.
 *
 * @param {string|Date|null} received_at
 * Timestamp indicating when the batch was received.
 *
 * @param {string|null} [notes]
 * Optional intake notes.
 *
 * @param {{ id: string }} user
 * Authenticated user performing the operation.
 *
 * @returns {Promise<{ id: string }>}
 * Identifier of the updated batch.
 */
const receivePackagingMaterialBatchService = async (
  batchId,
  received_at,
  notes,
  user
) => {
  //------------------------------------------------------------
  // Resolve lifecycle status identifier
  //------------------------------------------------------------
  const receivedStatusId = getStatusId('batch_received');
  
  //------------------------------------------------------------
  // Delegate update to metadata workflow
  //------------------------------------------------------------
  return editPackagingMaterialBatchMetadataService(
    batchId,
    {
      status_id: receivedStatusId,
      received_at: received_at ?? null,
      received_by: user.id,
      notes: notes ?? null
    },
    user
  );
};

/**
 * Releases a packaging material batch for operational use.
 *
 * This lifecycle transition indicates that the packaging
 * materials have passed inspection and are approved for
 * manufacturing or packaging operations.
 *
 * The release operation records:
 * - QA approver
 * - supplier responsible for the batch
 * - optional QA notes
 *
 * @async
 *
 * @param {string} batchId
 * Packaging material batch identifier.
 *
 * @param {string} supplierId
 * Supplier responsible for the released batch.
 *
 * @param {string|null} [notes]
 * Optional QA release notes.
 *
 * @param {{ id: string }} user
 * Authenticated user performing the operation.
 *
 * @returns {Promise<{ id: string }>}
 * Identifier of the updated batch.
 */
const releasePackagingMaterialBatchService = async (
  batchId,
  supplierId,
  notes,
  user
) => {
  //------------------------------------------------------------
  // Resolve lifecycle status identifier
  //------------------------------------------------------------
  const releasedStatusId = getStatusId('batch_released');
  
  //------------------------------------------------------------
  // Delegate update to metadata workflow
  //------------------------------------------------------------
  return editPackagingMaterialBatchMetadataService(
    batchId,
    {
      status_id: releasedStatusId,
      released_by: user.id,
      released_by_supplier_id: supplierId,
      notes: notes ?? null
    },
    user
  );
};

module.exports = {
  fetchPaginatedPackagingMaterialBatchesService,
  createPackagingMaterialBatchesService,
  editPackagingMaterialBatchMetadataService,
  updatePackagingMaterialBatchStatusService,
  receivePackagingMaterialBatchService,
  releasePackagingMaterialBatchService,
};
