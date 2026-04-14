/**
 * @file warehouse-inventory-controller.js
 * @description
 * Express controllers for warehouse inventory endpoints.
 *
 * Exports:
 *  - getPaginatedWarehouseInventoryController
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedWarehouseInventoryService,
} = require('../services/warehouse-inventory-service');
const { logInfo } = require('../utils/logging/logger-helper');
const AppError = require('../utils/AppError');
const {
  createInventoryRecordService,
  adjustInventoryQuantitiesService,
} = require('../services/inventory-service');

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

/**
 * Controller to handle the creation of inventory records for both warehouse and location.
 *
 * - Accepts a bulk array of records (max 20).
 * - Validates batch references before insertion.
 * - Inserts records into warehouse and location inventory tables.
 * - Logs inventory activity for traceability.
 * - Returns enriched inserted records.
 */
const createWarehouseInventoryRecordController = wrapAsyncHandler(
  async (req, res, next) => {
    const records = req.body?.records;

    if (!records || !Array.isArray(records)) {
      return next(
        AppError.validationError(
          'Request body must include a valid "records" array.'
        )
      );
    }

    const user_id = req.auth.user?.id;
    if (!user_id) {
      return next(AppError.validationError('Missing authenticated user.'));
    }

    logInfo('Creating inventory records', req, {
      context:
        'warehouse-inventory-controller/createWarehouseInventoryRecordController',
      recordCount: records.length,
      requestedBy: user_id,
      requestId: req.id,
      traceId: req.traceId,
    });

    const result = await createInventoryRecordService(records, user_id);

    res.status(201).json({
      success: true,
      message:
        'Successfully created warehouse and/or location inventory records',
      data: result,
    });
  }
);

/**
 * Controller for adjusting warehouse and/or location inventory quantities.
 *
 * Expects a JSON body containing an array of update records.
 * Each record must include:
 *  - batch_type: 'product' | 'packaging_material'
 *  - batch_id: string
 *  - quantity: number
 *  - warehouse_id or location_id: string
 *  - inventory_action_type_id: string
 *  - adjustment_type_id: string (optional)
 *  - comments: string (optional)
 *  - meta: object (optional)
 *
 * Performs:
 *  - Validation of batch registry entries
 *  - Deduplication of updates by composite keys
 *  - Status determination (in_stock / out_of_stock)
 *  - Inventory updates and audit logging
 */
const adjustInventoryQuantitiesController = wrapAsyncHandler(
  async (req, res, next) => {
    const updates = req.body?.updates;
    const lock = req.body?.lock !== false; // defaults to true if undefined
    const user_id = req.auth.user?.id;

    if (!Array.isArray(updates) || updates.length === 0 || !user_id) {
      return next(AppError.validationError('Missing or invalid input data.'));
    }

    const result = await adjustInventoryQuantitiesService(
      updates,
      user_id,
      lock
    );

    logInfo('Inventory adjustment completed successfully.', req, {
      context:
        'warehouse-inventory-controller/adjustInventoryQuantitiesController',
      user_id,
      lock,
      updated_record_count: updates.length,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Inventory quantities adjusted successfully.',
      data: result,
    });
  }
);

module.exports = {
  getPaginatedWarehouseInventoryController,
  createWarehouseInventoryRecordController,
  adjustInventoryQuantitiesController,
};
