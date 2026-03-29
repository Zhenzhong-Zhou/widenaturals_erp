/**
 * @file batch-registry-controller.js
 * @module controllers/batch-registry-controller
 *
 * @description
 * Controllers for the Batch Registry resource.
 *
 * Routes:
 *   GET   /api/v1/batch-registries                        → getPaginatedBatchRegistryController
 *   PATCH /api/v1/batch-registries/:batchRegistryId/note  → updateBatchRegistryNoteController
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId, pagination,
 *   sorting, filters) are emitted automatically by the global request-logger
 *   middleware via res.on('finish'). Controllers only log when they carry
 *   resource-specific context the middleware cannot infer (e.g. batchRegistryId).
 *
 * Controllers perform NO business logic, NO ACL evaluation, and NO direct
 * database access — all of that lives in the service layer.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const { logInfo } = require('../utils/logging/logger-helper');
const {
  fetchPaginatedBatchRegistryService,
  updateBatchRegistryNoteService,
} = require('../services/batch-registry-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/batch-registries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches paginated batch registry records.
 *
 * No controller-level logging — the global finish log already captures
 * userId, pagination, sorting, filters, statusCode, and durationMs.
 *
 * Requires: auth middleware, query normalizer, VIEW_BATCH_REGISTRY permission.
 */
const getPaginatedBatchRegistryController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  const user = req.auth?.user;

  const { data, pagination } = await fetchPaginatedBatchRegistryService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
    user,
  });
  
  res.status(200).json({
    success: true,
    message: 'Batch registry retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/batch-registries/:batchRegistryId/note
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the note field of a batch registry record.
 *
 * note accepts: non-empty string | "" (clears note) | null (removes note)
 *
 * Logged at controller level because batchRegistryId is resource-specific
 * context the global middleware cannot infer from the request alone.
 *
 * Requires: auth middleware, Joi body validation, BATCH_REGISTRY.UPDATE_NOTE permission.
 */
const updateBatchRegistryNoteController = wrapAsyncHandler(async (req, res) => {
  const context = 'batch-registry-controller/updateBatchRegistryNoteController';
  
  const { batchRegistryId } = req.params;
  const { note } = req.body;
  
  const user = req.auth?.user;
  
  logInfo('Updating batch registry note', req, {
    context,
    batchRegistryId,
  });
  
  const result = await updateBatchRegistryNoteService(batchRegistryId, note, user);
  
  res.status(200).json({
    success: true,
    message: 'Batch registry note updated successfully.',
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedBatchRegistryController,
  updateBatchRegistryNoteController,
};
