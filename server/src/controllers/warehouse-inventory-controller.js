/**
 * @file warehouse-inventory-controller.js
 * @description
 * Express controllers for warehouse inventory endpoints.
 *
 * Exports:
 *  - getPaginatedWarehouseInventoryController
 *  - createWarehouseInventoryController
 *  - adjustWarehouseInventoryQuantityController
 *  - updateWarehouseInventoryStatusController
 *  - updateWarehouseInventoryMetadataController
 *  - recordWarehouseInventoryOutboundController
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedWarehouseInventoryService,
  createWarehouseInventoryService, adjustWarehouseInventoryQuantityService, updateWarehouseInventoryStatusService,
  updateWarehouseInventoryMetadataService, recordWarehouseInventoryOutboundService,
} = require('../services/warehouse-inventory-service');

// ── List ─────────────────────────────────────────────────

const getPaginatedWarehouseInventoryController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  const { warehouseId } = req.params;
  const user = req.auth.user;
  
  const { items, pagination } = await fetchPaginatedWarehouseInventoryService({
    filters: { ...filters, warehouseId },
    page,
    limit,
    sortBy,
    sortOrder,
    user,
  });
  
  res.status(200).json({
    success:    true,
    message:    'Warehouse inventory retrieved successfully.',
    payload:    { items, pagination },
    traceId:    req.traceId,
  });
});

// ── Create (inbound) ────────────────────────────────────────────────

const createWarehouseInventoryController = wrapAsyncHandler(async (req, res) => {
  const { warehouseId } = req.params;
  const { records }     = req.body;
  const user            = req.auth.user;
  
  const result = await createWarehouseInventoryService({
    warehouseId,
    records,
    user,
  });
  
  res.status(201).json({
    success: true,
    message: 'Warehouse inventory records created successfully.',
    payload: result,
    traceId: req.traceId,
  });
});

// ── Adjust quantities ───────────────────────────────────────────────

const adjustWarehouseInventoryQuantityController = wrapAsyncHandler(async (req, res) => {
  const { warehouseId } = req.params;
  const { updates }     = req.body;
  const user            = req.auth.user;
  
  const result = await adjustWarehouseInventoryQuantityService({
    warehouseId,
    updates,
    user,
  });
  
  res.status(200).json({
    success: true,
    message: 'Warehouse inventory quantities adjusted successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ── Update status ───────────────────────────────────────────────────

const updateWarehouseInventoryStatusController = wrapAsyncHandler(async (req, res) => {
  const { warehouseId } = req.params;
  const { updates }     = req.body;
  const user            = req.auth.user;
  
  const result = await updateWarehouseInventoryStatusService({
    warehouseId,
    updates,
    user,
  });
  
  res.status(200).json({
    success: true,
    message: 'Warehouse inventory status updated successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ── Update metadata ─────────────────────────────────────────────────

const updateWarehouseInventoryMetadataController = wrapAsyncHandler(async (req, res) => {
  const { warehouseId, inventoryId } = req.params;
  const user                         = req.auth.user;
  
  const result = await updateWarehouseInventoryMetadataService({
    warehouseId,
    id: inventoryId,
    fields: req.body,
    user,
  });
  
  res.status(200).json({
    success: true,
    message: 'Warehouse inventory metadata updated successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ── Record outbound ─────────────────────────────────────────────────

const recordWarehouseInventoryOutboundController = wrapAsyncHandler(async (req, res) => {
  const { warehouseId } = req.params;
  const { updates }     = req.body;
  const user            = req.auth.user;
  
  const result = await recordWarehouseInventoryOutboundService({
    warehouseId,
    updates,
    user,
  });
  
  res.status(200).json({
    success: true,
    message: 'Warehouse inventory outbound recorded successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

module.exports = {
  getPaginatedWarehouseInventoryController,
  createWarehouseInventoryController,
  adjustWarehouseInventoryQuantityController,
  updateWarehouseInventoryStatusController,
  updateWarehouseInventoryMetadataController,
  recordWarehouseInventoryOutboundController,
};
