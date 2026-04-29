/**
 * @file warehouse-controller.js
 * @description Request handlers for warehouse endpoints.
 *
 * Controllers are intentionally thin — no logging, no business logic.
 * Auth, query normalisation, and permission checks are handled by middleware.
 *
 * Exports:
 *  - getPaginatedWarehousesController  — GET /warehouses
 *  - getWarehouseDetailController      — GET /warehouses/:warehouseId/details
 */

'use strict';

const { wrapAsyncHandler }                  = require('../middlewares/async-handler');
const {
  fetchPaginatedWarehousesService,
  fetchWarehouseDetailService,
} = require('../services/warehouse-service');

// ─── Paginated List ───────────────────────────────────────────────────────────

const getPaginatedWarehousesController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  const user = req.auth.user;
  
  const { data, pagination } = await fetchPaginatedWarehousesService(user, {
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Warehouses retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─── Detail ───────────────────────────────────────────────────────────────────

const getWarehouseDetailController = wrapAsyncHandler(async (req, res) => {
  const { warehouseId } = req.params;
  const user = req.auth.user;
  
  const result = await fetchWarehouseDetailService(user, warehouseId);
  
  res.status(200).json({
    success: true,
    message: 'Warehouse retrieved successfully.',
    data: result,
    traceId: req.traceId,
  });
});

module.exports = {
  getPaginatedWarehousesController,
  getWarehouseDetailController,
};
