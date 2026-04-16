/**
 * @file batch-registry-service.js
 * @description Business logic for batch registry retrieval and mutation.
 *
 * Exports:
 *   - fetchPaginatedBatchRegistryService  – paginated batch registry with visibility scoping
 *   - updateBatchRegistryNoteService      – updates a batch registry note with activity log
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers (repository, business, cache) are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  evaluateBatchRegistryVisibility,
  applyBatchRegistryVisibilityRules,
  sliceBatchRegistryRow,
} = require('../business/batch-registry-business');
const {
  getPaginatedBatchRegistry,
  updateBatchRegistryNoteById,
  getBatchRegistryById,
} = require('../repositories/batch-registry-repository');
const {
  transformPaginatedBatchRegistryResults,
} = require('../transformers/batch-registry-transformer');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../database/db');
const {
  getBatchActivityTypeId,
} = require('../cache/batch-activity-type-cache');
const {
  buildBatchMetadataUpdateActivityRow,
} = require('../business/batches/batch-activity-builder');
const {
  insertBatchActivityLogsBulk,
} = require('../repositories/batch-activity-log-repository');
const {
  transformIdOnlyResult,
} = require('../transformers/common/id-result-transformer');

/**
 * Fetches paginated batch registry records scoped to the requesting user's visibility.
 *
 * Resolves the user's access scope, applies visibility rules to filters, queries
 * the registry, applies row-level slicing, and transforms results for UI consumption.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]            - Field filters to apply.
 * @param {number}        [options.page=1]                - Page number (1-based).
 * @param {number}        [options.limit=20]              - Records per page.
 * @param {string}        [options.sortBy='registeredAt'] - Sort field key (validated against sort map).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']      - Sort direction.
 * @param {Object}        options.user                    - Authenticated user (requires `id` and `role`).
 *
 * @returns {Promise<{ data: Array<Object>, pagination: Object }>} Transformed records and pagination metadata.
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedBatchRegistryService = async ({
  filters = {},
  page = 1,
  limit = 20,
  sortBy = 'registeredAt',
  sortOrder = 'DESC',
  user,
}) => {
  try {
    // 1. Resolve batch registry visibility scope for this user.
    const access = await evaluateBatchRegistryVisibility(user);

    // 2. Apply visibility / scope rules to filters (CRITICAL — must run before query).
    const adjustedFilters = applyBatchRegistryVisibilityRules(filters, access);

    // 3. Query raw batch registry rows.
    const rawResult = await getPaginatedBatchRegistry({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // 4. Return empty shape immediately — no records to process.
    if (!rawResult || rawResult.data.length === 0) {
      return {
        data: [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }

    // 5. Apply row-level field slicing based on resolved access scope.
    const visibleRows = rawResult.data
      .map((row) => sliceBatchRegistryRow(row, access))
      .filter(Boolean);

    // 6. Transform for UI consumption.
    return transformPaginatedBatchRegistryResults({
      ...rawResult,
      data: visibleRows,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError(
      'Unable to retrieve batch records at this time.',
      {
        meta: { error: error.message },
      }
    );
  }
};

/**
 * Updates the note field on a batch registry record and writes an activity log entry.
 *
 * Skips the update entirely if the note value has not changed.
 * Wraps the update and activity log insert in a single transaction for atomicity.
 *
 * @param {string|number} id    - Batch registry record ID.
 * @param {string|null}   note  - New note value (null to clear).
 * @param {Object}        user  - Authenticated user (requires `id`).
 *
 * @returns {Promise<{ id: string|number }>} Transformed ID-only result of the updated record.
 *
 * @throws {AppError} `notFoundError`  – batch registry record does not exist.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateBatchRegistryNoteService = async (id, note, user) => {
  return withTransaction(async (client) => {
    try {
      // 1. Load current registry state.
      const registry = await getBatchRegistryById(id, client);

      if (!registry) {
        throw AppError.notFoundError('Batch registry not found.');
      }

      const previousNote = registry.note ?? null;

      // Skip update if value did not change.
      if (previousNote === (note ?? null)) {
        return transformIdOnlyResult([registry])[0];
      }

      // 2. Persist updated note.
      const updated = await updateBatchRegistryNoteById(
        { id, note, updatedBy: user.id },
        client
      );

      // 3. Build metadata activity log entry.
      const activityTypeId = getBatchActivityTypeId('BATCH_METADATA_UPDATED');

      const activityRow = buildBatchMetadataUpdateActivityRow({
        batchRegistryId: id,
        batchType: registry.batch_type,
        activityTypeId,
        previousValues: { note: previousNote },
        updates: { note },
        actorId: user.id,
      });

      // 4. Persist activity log atomically within the same transaction.
      await insertBatchActivityLogsBulk([activityRow], client);

      // 5. Transform and return ID-only response payload.
      return transformIdOnlyResult([updated])[0];
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw AppError.serviceError('Unable to update batch registry note.', {
        meta: { error: error.message },
      });
    }
  });
};

module.exports = {
  fetchPaginatedBatchRegistryService,
  updateBatchRegistryNoteService,
};
