const {
  evaluateProductBatchVisibility,
  applyProductBatchVisibilityRules,
  evaluateProductBatchAccessControl,
  filterUpdatableProductBatchFields,
} = require('../business/product-batch-business');
const {
  getPaginatedProductBatches,
  insertProductBatchesBulk,
  updateProductBatch,
  getProductBatchById,
} = require('../repositories/product-batch-repository');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');
const {
  transformPaginatedProductBatchResults,
  transformProductBatchRecords,
} = require('../transformers/product-batch-transformer');
const AppError = require('../utils/AppError');
const { withTransaction, lockRows } = require('../database/db');
const { validateRequiredFields } = require('../utils/validation/validation-utils');
const { getStatusId } = require('../config/status-cache');
const {
  registerBatchWorkflow,
  updateBatchWorkflow,
} = require('../business/batches/batch-workflow');
const { getBatchActivityType } = require('../business/batches/batch-activity-resolvers');
const { getBatchActivityTypeId } = require('../cache/batch-activity-type-cache');
const {
  PRODUCT_BATCH_EDIT_RULES,
  PRODUCT_BATCH_STATUS_TRANSITIONS
} = require('../utils/constants/domain/product-batch-constants');
const { transformIdOnlyResult } = require('../transformers/common/id-result-transformer');

/**
 * Service: Fetch paginated product batch records for UI consumption.
 *
 * Responsibilities:
 * - Resolve product batch visibility for the requesting user
 * - Translate ACL decisions into repository-consumable filters
 * - Execute paginated product batch queries
 * - Normalize empty result sets
 * - Transform flat product batch rows into UI-ready shapes
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
const fetchPaginatedProductBatchesService = async ({
  filters = {},
  page = 1,
  limit = 20,
  user,
}) => {
  const context = 'product-batch-service/fetchPaginatedProductBatchesService';

  try {
    // ---------------------------------------------------------
    // Step 0 — Resolve product batch visibility
    // ---------------------------------------------------------
    const access = await evaluateProductBatchVisibility(user);

    // ---------------------------------------------------------
    // Step 1 — Apply visibility / scope rules (CRITICAL)
    // ---------------------------------------------------------
    const adjustedFilters = applyProductBatchVisibilityRules(filters, access);

    // ---------------------------------------------------------
    // Step 2 — Query raw product batch rows
    // ---------------------------------------------------------
    const rawResult = await getPaginatedProductBatches({
      filters: adjustedFilters,
      page,
      limit,
    });

    // ---------------------------------------------------------
    // Step 3 — Handle empty result
    // ---------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No product batches found', {
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
    const result = await transformPaginatedProductBatchResults(
      rawResult,
      access
    );

    // ---------------------------------------------------------
    // Step 5 — Log success
    // ---------------------------------------------------------
    logSystemInfo('Paginated product batches fetched', {
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
    logSystemException(error, 'Failed to fetch product batches', {
      context,
      filters,
      pagination: { page, limit },
      userId: user?.id,
    });

    throw AppError.serviceError(
      'Unable to retrieve product batches at this time.',
      { context }
    );
  }
};

/**
 * Create product batches and register them within the ERP system.
 *
 * This service performs the full workflow required to create product
 * batches while maintaining transactional consistency and auditability.
 *
 * Workflow:
 * 1. Validate input payload structure and required fields.
 * 2. Lock related SKU records to prevent concurrent batch creation.
 * 3. Lock referenced manufacturers to ensure foreign key integrity.
 * 4. Normalize batch records and apply default status values.
 * 5. Insert batch records in bulk.
 * 6. Register batches in the batch registry.
 * 7. Create batch activity logs.
 * 8. Transform database rows into API response format.
 *
 * Concurrency Protection:
 * - SKU rows are locked to prevent concurrent batch creation
 *   against the same SKU.
 * - Manufacturer rows are locked to guarantee referential integrity
 *   during batch creation.
 *
 * Performance Characteristics:
 * - Bulk inserts minimize database round trips.
 * - Entire workflow runs inside a single database transaction.
 * - Designed for efficient batch imports.
 *
 * Data Integrity Guarantees:
 * - Validates all referenced SKUs and manufacturers exist.
 * - Ensures each batch is registered and audit logged.
 * - Guarantees atomicity across batch, registry, and activity tables.
 *
 * @async
 *
 * @param {Array<Object>} productBatches
 * Product batch payloads to create.
 *
 * @param {Object} user
 * Authenticated user performing the operation.
 *
 * @param {string} user.id
 * User identifier used for audit tracking.
 *
 * @returns {Promise<Array<Object>>}
 * Transformed product batch records suitable for API responses.
 */
const createProductBatchesService = async (productBatches, user) => {
  return withTransaction(async (client) => {
    const context = 'product-batch-service/createProductBatchesService';
    const actorId = user?.id;
    
    try {
      // ------------------------------------------------------------
      // 1. Validate input
      // ------------------------------------------------------------
      if (!Array.isArray(productBatches) || productBatches.length === 0) {
        throw AppError.validationError('No product batches provided.', {
          details: context,
        });
      }
      
      validateRequiredFields(
        productBatches,
        [
          'lot_number',
          'sku_id',
          'manufacture_date',
          'expiry_date',
          'initial_quantity',
        ],
        context
      );
      
      // ------------------------------------------------------------
      // 2. Lock related SKUs to prevent concurrent batch creation
      // ------------------------------------------------------------
      const uniqueSkuIds = [...new Set(productBatches.map((b) => b.sku_id))];
      
      const lockedSkus = await lockRows(
        client,
        'skus',
        uniqueSkuIds,
        'FOR UPDATE',
        { context }
      );

      // Ensure all referenced SKUs exist and were successfully locked
      if (!lockedSkus || lockedSkus.length !== uniqueSkuIds.length) {
        throw AppError.notFoundError('Some SKUs could not be locked.', {
          context,
        });
      }

      // Lock referenced manufacturers to preserve foreign key integrity
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

      // Ensure all referenced manufacturers exist and were successfully locked
      if (
        !lockedManufacturers ||
        lockedManufacturers.length !== uniqueManufacturerIds.length
      ) {
        throw AppError.notFoundError(
          'Some manufacturers could not be locked.',
          { context }
        );
      }
      
      // ------------------------------------------------------------
      // 3. Prepare batch records
      // ------------------------------------------------------------
      const pendingStatusId = getStatusId('batch_pending');
      
      const preparedBatches = productBatches.map((batch) => ({
        ...batch,
        status_id: pendingStatusId,
        created_by: actorId,
      }));
      
      // Resolve activity type once
      const batchCreatedActivityTypeId = getBatchActivityTypeId('BATCH_CREATED');
      
      // ------------------------------------------------------------
      // 4. Create batches + registry + activity logs
      // ------------------------------------------------------------
      const insertedBatches = await registerBatchWorkflow({
        batchType: 'product',
        batches: preparedBatches,
        insertBatchFn: insertProductBatchesBulk,
        batchCreatedActivityTypeId,
        actorId,
        client,
      });
      
      // ------------------------------------------------------------
      // 5. Transform response
      // ------------------------------------------------------------
      const transformed = transformProductBatchRecords(insertedBatches);
      
      // ------------------------------------------------------------
      // 6. System audit log
      // ------------------------------------------------------------
      logSystemInfo('Product batch creation completed', {
        context,
        totalInput: productBatches.length,
        insertedCount: insertedBatches.length,
      });
      
      return transformed;
    } catch (error) {
      logSystemException(error, 'Failed to create product batches', {
        context,
      });
      
      throw AppError.databaseError('Failed to create product batches.', {
        cause: error,
        context,
      });
    }
  });
};

/**
 * Service for editing product batch metadata.
 *
 * This service executes the shared batch update workflow inside a
 * database transaction and ensures that:
 *
 * - lifecycle rules are enforced by the shared batch workflow
 * - metadata updates follow permission rules
 * - lifecycle status transitions are validated
 * - batch activity logs are generated and persisted
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
 * Product batch identifier.
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
const editProductBatchMetadataService = async (
  batchId,
  updates,
  user
) => {
  return withTransaction(async (client) => {
    const context =
      'product-batch-service/editProductBatchMetadataService';
    
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
          { context }
        );
      }
      
      //------------------------------------------------------------
      // 2. Execute batch workflow
      //------------------------------------------------------------
      const updatedBatch = await updateBatchWorkflow({
        batchId,
        updates,
        user,
        client,
        
        // repository functions
        getBatchFn: getProductBatchById,
        updateBatchFn: updateProductBatch,
        
        // lifecycle configuration
        editRules: PRODUCT_BATCH_EDIT_RULES,
        statusTransitions: PRODUCT_BATCH_STATUS_TRANSITIONS,
        
        // batch domain type
        batchType: 'product',
        
        // activity resolver
        activityTypeResolver: getBatchActivityType,
        
        // permission & filtering
        evaluateAccessControlFn: evaluateProductBatchAccessControl,
        filterUpdatableFieldsFn: filterUpdatableProductBatchFields,
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
        'Product batch metadata updated successfully',
        {
          context,
          batchId,
        }
      );
      
      return transformedResult[0];
    } catch (error) {
      //------------------------------------------------------------
      // Error logging
      //------------------------------------------------------------
      logSystemException(
        error,
        'Failed to update product batch metadata',
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
        'Failed to update product batch metadata.',
        {
          cause: error,
          context,
        }
      );
    }
  });
};

/**
 * Updates the lifecycle status of a product batch.
 *
 * This service delegates the update to
 * {@link editProductBatchMetadataService} so that all batch
 * modifications pass through the shared batch workflow engine.
 *
 * The workflow engine centrally handles:
 *
 * - lifecycle transition validation
 * - permission checks
 * - activity log generation
 * - transactional database updates
 *
 * By routing status changes through the metadata update workflow,
 * all lifecycle transitions remain consistent across the batch domain.
 *
 * @async
 *
 * @param {string} batchId
 * Identifier of the product batch to update.
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
const updateProductBatchStatusService = async (
  batchId,
  statusId,
  notes,
  user
) => {
  const context =
    'product-batch-service/updateProductBatchStatusService';
  
  //------------------------------------------------------------
  // Validate required inputs
  //------------------------------------------------------------
  if (!batchId) {
    throw AppError.validationError(
      'batchId is required.',
      { context }
    );
  }
  
  if (!statusId) {
    throw AppError.validationError(
      'statusId is required.',
      { context }
    );
  }
  
  //------------------------------------------------------------
  // Delegate lifecycle update to shared metadata workflow
  //------------------------------------------------------------
  return editProductBatchMetadataService(
    batchId,
    {
      status_id: statusId,
      notes: notes ?? null
    },
    user
  );
};

/**
 * Marks a product batch as received by the warehouse.
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
 * Product batch identifier.
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
const receiveProductBatchService = async (
  batchId,
  received_at,
  notes,
  user
) => {
  const context =
    'product-batch-service/receiveProductBatchService';
  
  //------------------------------------------------------------
  // Validate required inputs
  //------------------------------------------------------------
  if (!batchId) {
    throw AppError.validationError(
      'batchId is required.',
      { context }
    );
  }
  
  //------------------------------------------------------------
  // Resolve lifecycle status identifier
  //------------------------------------------------------------
  const receivedStatusId = getStatusId('batch_received');
  
  //------------------------------------------------------------
  // Delegate update to metadata workflow
  //------------------------------------------------------------
  return editProductBatchMetadataService(
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
 * Releases a product batch for operational use.
 *
 * This lifecycle transition represents QA approval,
 * allowing the batch to be used in manufacturing
 * or distribution workflows.
 *
 * The release operation records:
 * - QA approver
 * - manufacturer responsible for release
 * - optional QA notes
 *
 * @async
 *
 * @param {string} batchId
 * Product batch identifier.
 *
 * @param {string} manufacturerId
 * Manufacturer responsible for release approval.
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
const releaseProductBatchService = async (
  batchId,
  manufacturerId,
  notes,
  user
) => {
  const context =
    'product-batch-service/releaseProductBatchService';
  
  //------------------------------------------------------------
  // Validate required inputs
  //------------------------------------------------------------
  if (!batchId) {
    throw AppError.validationError(
      'batchId is required.',
      { context }
    );
  }
  
  if (!manufacturerId) {
    throw AppError.validationError(
      'manufacturerId is required.',
      { context }
    );
  }
  
  //------------------------------------------------------------
  // Resolve lifecycle status identifier
  //------------------------------------------------------------
  const releasedStatusId = getStatusId('batch_released');
  
  //------------------------------------------------------------
  // Delegate update to metadata workflow
  //------------------------------------------------------------
  return editProductBatchMetadataService(
    batchId,
    {
      status_id: releasedStatusId,
      released_by: user.id,
      released_by_manufacturer_id: manufacturerId,
      notes: notes ?? null
    },
    user
  );
};

module.exports = {
  fetchPaginatedProductBatchesService,
  createProductBatchesService,
  editProductBatchMetadataService,
  updateProductBatchStatusService,
  receiveProductBatchService,
  releaseProductBatchService,
};
