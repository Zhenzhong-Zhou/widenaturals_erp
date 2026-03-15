const {
  evaluateBatchRegistryVisibility,
  applyBatchRegistryVisibilityRules,
  sliceBatchRegistryRow,
} = require('../business/batch-registry-business');
const {
  getPaginatedBatchRegistry,
  updateBatchRegistryNoteById, getBatchRegistryById,
} = require('../repositories/batch-registry-repository');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');
const {
  transformPaginatedBatchRegistryResults,
} = require('../transformers/batch-registry-transformer');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../database/db');
const { getBatchActivityTypeId } = require('../cache/batch-activity-type-cache');
const { buildBatchMetadataUpdateActivityRow } = require('../business/batches/batch-activity-builder');
const { insertBatchActivityLogsBulk } = require('../repositories/batch-activity-log-repository');
const { transformIdOnlyResult } = require('../transformers/common/id-result-transformer');

/**
 * Service: Fetch paginated batch registry records for UI consumption.
 *
 * Responsibilities:
 * - Resolve batch visibility scope for the requesting user
 * - Translate business / ACL decisions into repository-consumable filters
 * - Orchestrate paginated batch registry queries
 * - Optionally enforce defensive row-level visibility (non-broadening)
 * - Normalize empty result sets
 * - Transform flat batch rows into UI-ready shapes
 * - Emit structured success and failure logs
 *
 * Visibility enforcement model:
 * - Repository-level filtering is the PRIMARY enforcement mechanism
 * - Service-level filter adjustment expresses business intent (scope, mode)
 * - Per-row filtering is DEFENSIVE only (never expands visibility)
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Normalized pre-business filters
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {Object} options.user - Authenticated requester context
 *
 * @returns {Promise<{ data: Object[], pagination: Object }>}
 */
const fetchPaginatedBatchRegistryService = async ({
  filters = {},
  page = 1,
  limit = 20,
  user,
}) => {
  const context = 'batch-registry-service/fetchPaginatedBatchRegistryService';

  try {
    // ---------------------------------------------------------
    // Step 0 — Resolve batch registry visibility scope
    // ---------------------------------------------------------
    const access = await evaluateBatchRegistryVisibility(user);

    // ---------------------------------------------------------
    // Step 1 — Apply visibility / scope rules (CRITICAL)
    // ---------------------------------------------------------
    const adjustedFilters = applyBatchRegistryVisibilityRules(filters, access);

    // ---------------------------------------------------------
    // Step 2 — Query raw batch registry rows
    // ---------------------------------------------------------
    const rawResult = await getPaginatedBatchRegistry({
      filters: adjustedFilters,
      page,
      limit,
    });

    // ---------------------------------------------------------
    // Step 3 — Handle empty result
    // ---------------------------------------------------------
    if (!rawResult || rawResult.data.length === 0) {
      logSystemInfo('No batch registry records found', {
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
    // Step 4 — Defensive row-level slicing (minimal)
    // ---------------------------------------------------------
    const visibleRows = rawResult.data
      .map((row) => sliceBatchRegistryRow(row, access))
      .filter(Boolean);

    // ---------------------------------------------------------
    // Step 5 — Transform for UI consumption
    // ---------------------------------------------------------
    const result = await transformPaginatedBatchRegistryResults({
      ...rawResult,
      data: visibleRows,
    });

    // ---------------------------------------------------------
    // Step 6 — Log success
    // ---------------------------------------------------------
    logSystemInfo('Paginated batch registry fetched', {
      context,
      filters: adjustedFilters,
      pagination: result.pagination,
      count: result.data?.length,
    });

    return result;
  } catch (error) {
    // ---------------------------------------------------------
    // Step 7 — Log + rethrow
    // ---------------------------------------------------------
    logSystemException(error, 'Failed to fetch batch registry', {
      context,
      filters,
      pagination: { page, limit },
      userId: user?.id,
    });

    throw AppError.serviceError(
      'Unable to retrieve batch records at this time.',
      { context }
    );
  }
};

/**
 * Update the note of a batch registry record.
 *
 * This service:
 * 1. Validates input
 * 2. Loads the existing batch registry entry
 * 3. Updates the note field
 * 4. Records a metadata update activity log
 *
 * All operations are executed within a database transaction to
 * ensure consistency between the registry update and activity log.
 *
 * @param {string} id
 * UUID of the batch_registry record.
 *
 * @param {string|null|undefined} note
 * New note value to store.
 *
 * @param {{ id: string }} user
 * Authenticated user performing the update.
 *
 * @returns {Promise<{ id: string }>}
 * Identifier of the updated registry record.
 *
 * @throws {AppError}
 * - validationError if inputs are invalid
 * - notFoundError if the registry does not exist
 * - databaseError if the update fails
 */
const updateBatchRegistryNoteService = async (
  id,
  note,
  user,
) => {
  return withTransaction(async (client) => {
    const context = 'batch-registry-service/updateBatchRegistryNoteService';
    
    try {
      //------------------------------------------------------------
      // 1. Load current registry state
      //------------------------------------------------------------
      const registry = await getBatchRegistryById(id, client);
      
      if (!registry) {
        throw AppError.notFoundError(
          'Batch registry not found.',
          { context, id }
        );
      }
      
      const previousNote = registry.note ?? null;
      
      //------------------------------------------------------------
      // Skip update if value did not change
      //------------------------------------------------------------
      if (previousNote === (note ?? null)) {
        return transformIdOnlyResult([registry])[0];
      }
      
      //------------------------------------------------------------
      // 2. Update registry
      //------------------------------------------------------------
      const updated = await updateBatchRegistryNoteById(
        {
          id,
          note,
          updatedBy: user.id,
        },
        client
      );
      
      //------------------------------------------------------------
      // 3. Build metadata activity log
      //------------------------------------------------------------
      const activityTypeId =
        getBatchActivityTypeId('BATCH_METADATA_UPDATED');
      
      const activityRow = buildBatchMetadataUpdateActivityRow({
        batchRegistryId: id,
        batchType: registry.batch_type,
        activityTypeId,
        previousValues: { note: previousNote },
        updates: { note },
        actorId: user.id,
      });
      
      //------------------------------------------------------------
      // 4. Persist activity log
      //------------------------------------------------------------
      await insertBatchActivityLogsBulk([activityRow], client);
      
      //------------------------------------------------------------
      // 5. Transform response payload
      //------------------------------------------------------------
      const transformedResult =
        transformIdOnlyResult([updated]);
      
      //------------------------------------------------------------
      // 6. Structured success log
      //------------------------------------------------------------
      logSystemInfo(
        'Batch registry note updated successfully',
        {
          context,
          batchRegistryId: id,
        }
      );
      
      return transformedResult[0];
    } catch (error) {
      //------------------------------------------------------------
      // Error logging
      //------------------------------------------------------------
      logSystemException(
        error,
        'Failed to update batch registry note',
        {
          context,
          batchRegistryId: id,
        }
      );
      
      if (error instanceof AppError) throw error;
      
      //------------------------------------------------------------
      // Normalize unexpected errors
      //------------------------------------------------------------
      throw AppError.databaseError(
        'Failed to update batch registry note.',
        {
          cause: error,
          context,
        }
      );
    }
  });
};

module.exports = {
  fetchPaginatedBatchRegistryService,
  updateBatchRegistryNoteService,
};
