/**
 * @file inventory-activity-log-controller.js
 * @description
 * Express controllers for inventory activity log endpoints.
 *
 * Exports:
 *  - getPaginatedActivityLogController
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedActivityLogService,
} = require('../services/inventory-activity-log-service');

const getPaginatedActivityLogController = wrapAsyncHandler(async (req, res) => {
  const { warehouseId } = req.params;
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  const user = req.auth.user;

  const { data, pagination } = await fetchPaginatedActivityLogService({
    filters: { ...filters, warehouseId },
    page,
    limit,
    sortBy,
    sortOrder,
    user,
  });

  res.status(200).json({
    success: true,
    message: 'Inventory activity log retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

module.exports = {
  getPaginatedActivityLogController,
};
