const {
  evaluateProductBatchVisibility,
  applyProductBatchVisibilityRules,
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
  BATCH_EDIT_RULES,
  BATCH_STATUS_TRANSITIONS
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
 * @function createProductBatchesService
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
 * Adjust a product batch and record related batch activity.
 *
 * This service executes the batch update workflow inside a database
 * transaction and ensures that:
 *
 * - batch lifecycle rules are enforced
 * - metadata updates are applied safely
 * - status transitions are validated
 * - activity logs are recorded for auditing
 *
 * Responsibilities:
 * - Validate input parameters
 * - Open transaction boundary
 * - Execute the batch workflow
 * - Transform response payload
 * - Record structured system logs
 *
 * @async
 *
 * @param {string} batchId - Product batch identifier
 * @param {Object} updates - Fields to update
 * @param {string} actorId - User performing the adjustment
 *
 * @returns {Promise<{id: string}>} Updated batch identifier
 */
const productBatchAdjustService = async (
  batchId,
  updates,
  actorId
) => {
  return withTransaction(async (client) => {
    const context = 'product-batch-service/productBatchAdjustService';
    
    try {
      //------------------------------------------------------------
      // 1. Validate input
      //------------------------------------------------------------
      if (!batchId) {
        throw AppError.validationError('batchId is required.', { context });
      }
      
      if (!updates || typeof updates !== 'object') {
        throw AppError.validationError('Invalid updates payload.', { context });
      }
      
      if (!actorId) {
        throw AppError.validationError('actorId is required.', { context });
      }
      
      //------------------------------------------------------------
      // 2. Execute batch workflow
      //------------------------------------------------------------
      const updatedBatch = await updateBatchWorkflow({
        batchId,
        updates,
        actorId,
        client,
        getBatchFn: getProductBatchById,
        updateBatchFn: updateProductBatch,
        editRules: BATCH_EDIT_RULES,
        statusTransitions: BATCH_STATUS_TRANSITIONS,
        batchType: 'product',
        activityTypeResolver: getBatchActivityType
      });
      
      //------------------------------------------------------------
      // 3. Transform response
      //------------------------------------------------------------
      const transformedResult =
        transformIdOnlyResult([updatedBatch]);
      
      //------------------------------------------------------------
      // 4. System log
      //------------------------------------------------------------
      logSystemInfo('Product batch adjusted successfully', {
        context,
        batchId,
        actorId
      });
      
      return transformedResult[0];
    } catch (error) {
      logSystemException(error, 'Failed to adjust product batch', {
        context,
        batchId
      });
      
      if (error instanceof AppError) throw error;
      
      throw AppError.databaseError('Failed to adjust product batch.', {
        cause: error,
        context
      });
    }
  });
};

module.exports = {
  fetchPaginatedProductBatchesService,
  createProductBatchesService,
  productBatchAdjustService,
};
