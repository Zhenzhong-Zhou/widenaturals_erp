const {
  getHighLevelLocationInventorySummary,
  insertInventoryRecords,
  updateInventoryQuantity,
  checkInventoryExists,
  getProductIdOrIdentifierByInventoryIds,
} = require('../repositories/location-inventory-repository');
const AppError = require('../utils/AppError');
const { logError, logInfo, logWarn } = require('../utils/logger-helper');
const {
  getWarehouseLotStatus,
} = require('../repositories/warehouse-lot-status-repository');
const { withTransaction, retry } = require('../database/db');
const {
  insertWarehouseInventoryRecords,
  updateWarehouseInventoryQuantity,
  getRecentInsertWarehouseInventoryRecords,
  checkWarehouseInventoryBulk,
} = require('../repositories/warehouse-inventory-repository');
const {
  geLocationIdByWarehouseId,
} = require('../repositories/warehouse-repository');
const {
  insertWarehouseInventoryLots,
  checkWarehouseInventoryLotExists,
} = require('../repositories/warehouse-inventory-lot-repository');
const {
  bulkInsertInventoryActivityLogs,
} = require('../repositories/inventory-activity-log-repository');
const {
  getActionTypeId,
} = require('../repositories/inventory-action-type-repository');
const {
  bulkInsertInventoryHistory,
} = require('../repositories/inventory-history-repository');
const {
  getWarehouseLotAdjustmentType,
} = require('../repositories/lot-adjustment-type-repository');
const { generateChecksum } = require('../utils/crypto-utils');
const {
  transformPaginatedLocationInventorySummaryResult,
} = require('../transformers/location-inventory-transformer');
const { canViewInventorySummary } = require('../business/warehouse-inventory-business');
const {
  transformWarehouseInventoryRecords,
} = require('../transformers/warehouse-inventory-transformer');
const { sanitizeSortBy, sanitizeSortOrder } = require('../utils/sort-utils');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');

/**
 * Fetches paginated location inventory summary records with filters, sorting, and
 * derived inventory logic.
 *
 * Designed for displaying high-level inventory data (products or packaging materials)
 * from the `location_inventory` table, including
 * - Structured product/material metadata
 * - Derived inventory health flags (e.g., isExpired, isLowStock)
 * - Quantity and date normalization
 *
 * @param {Object} options - Query parameters
 * @param {number} options.page - Current page number (1-based)
 * @param {number} options.limit - Number of records per page
 * @param {Object} options.filters - Inventory filters (e.g., productName, lotNumber, locationId)
 * @param {string} [options.sortBy='createdAt'] - Logical sort key (mapped internally to SQL columns)
 * @param {string} [options.sortOrder='ASC'] - Sort direction: 'ASC' or 'DESC'
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} Transformed summary inventory result
 */
const fetchLocationInventorySummaryService = async ({ page, limit, filters, sortBy, sortOrder }) => {
  try {
    logSystemInfo('Fetching location inventory summary', {
      context: 'location-inventory-service/fetchLocationInventorySummary',
      page,
      limit,
      filters,
      sortBy,
      sortOrder,
    });
    
    const sortByClause = sanitizeSortBy(sortBy || 'createdAt', 'locationInventorySummary');
    const sortOrderClause = sanitizeSortOrder(sortOrder);
    
    const rawResult = await getHighLevelLocationInventorySummary({
      page,
      limit,
      filters,
      sortBy: sortByClause,
      sortOrder: sortOrderClause,
    });
    
    return transformPaginatedLocationInventorySummaryResult(rawResult);
  } catch (error) {
    logSystemException(error, 'Error fetching location inventory summary', {
      context: 'location-inventory-service/fetchLocationInventorySummary',
      page,
      limit,
      filters,
      sortBy,
      sortOrder,
    });
    
    throw AppError.serviceError('Failed to fetch location inventory summary');
  }
};

/**
 * Creates multiple inventory records and adds warehouse tracking.
 *
 * @param {Array<Object>} inventoryData - List of inventory objects to be created.
 * @param {string} inventoryData[].location_id - The ID of the inventory location.
 * @param {string|null} [inventoryData[].product_id] - The optional product ID (UUID).
 * @param {string|null} [inventoryData[].identifier] - The optional inventory identifier.
 * @param {number} inventoryData[].quantity - The quantity of the inventory item.
 * @param {string} userId - The ID of the user performing the action.
 * @returns {Promise<Object>} - A promise resolving to the result of the operation.
 */
const createInventoryRecords = async (inventoryData, userId) => {
  try {
    if (!Array.isArray(inventoryData) || inventoryData.length === 0) {
      throw AppError.validationError(
        'Invalid inventory data. Expected a non-empty array.'
      );
    }

    return await withTransaction(async (client) => {
      const { id: status_id } = await getWarehouseLotStatus(client, {
        name: 'in_stock',
      });

      // Step 1: Extract warehouse-related IDs
      const warehouseIds = [
        ...new Set(inventoryData.map((item) => item.warehouse_id)),
      ].filter(Boolean);
      const warehouseLocations = await geLocationIdByWarehouseId(
        client,
        warehouseIds
      );

      // Step 2: Separate products and non-products
      const products = [];
      const otherTypes = [];
      let warehouseLotsInventoryRecords = [];

      for (const data of inventoryData) {
        const {
          type,
          identifier,
          product_id,
          warehouse_id,
          quantity,
          reserved_quantity,
          lot_number,
          expiry_date,
          manufacture_date,
        } = data;
        const location_id = warehouseLocations[warehouse_id];

        if (!location_id) {
          throw AppError.validationError(
            `Warehouse ID ${warehouse_id} does not have a valid location.`
          );
        }

        if (
          !type ||
          !warehouse_id ||
          !quantity ||
          reserved_quantity === null ||
          !status_id ||
          !lot_number
        ) {
          throw AppError.validationError(
            'Missing required fields in inventory record.'
          );
        }

        if (type === 'product') {
          if (!product_id)
            throw AppError.validationError('Product must have a product_id.');
          if (!expiry_date)
            throw AppError.validationError('Product must have an expiry_date.');
          if (!manufacture_date)
            throw AppError.validationError(
              'Product must have a manufacture_date.'
            );
          products.push({
            type,
            product_id,
            warehouse_id,
            location_id,
            quantity,
            reserved_quantity,
            lot_number,
            expiry_date,
            manufacture_date,
            status_id,
            userId,
          });
        } else {
          if (!identifier)
            throw AppError.validationError(
              'Non-product items must have an identifier.'
            );
          otherTypes.push({
            type,
            identifier,
            warehouse_id,
            location_id,
            quantity,
            reserved_quantity,
            lot_number,
            expiry_date,
            manufacture_date,
            status_id,
            userId,
          });
        }
      }

      const formattedInventoryData = { products, otherTypes };
      let flatInventory = [
        ...(formattedInventoryData.products || []),
        ...(formattedInventoryData.otherTypes || []),
      ].map((item) => ({
        ...item,
        reserved_quantity: item.reserved_quantity ?? 0,
      }));

      // Step 3: Fetch Inventory IDs for Existing Items
      let inventoryIds =
        (await retry(() => checkInventoryExists(flatInventory), 3, 1000)) || [];

      // Step 4: Insert Missing Inventory Records
      const newInventoryItems = flatInventory.filter(
        (item) =>
          !inventoryIds.some(
            (existing) =>
              existing.product_id === (item.product_id || item.identifier)
          )
      );

      if (newInventoryItems.length > 0) {
        const { success, inventoryRecords } = await insertInventoryRecords(
          client,
          newInventoryItems
        );
        if (!success || !Array.isArray(inventoryRecords)) {
          throw AppError.validationError(
            'Failed to insert inventory records or returned data is invalid.'
          );
        }

        const retrieveRecords = await getProductIdOrIdentifierByInventoryIds(
          client,
          inventoryRecords
        );

        // Merge inserted inventory IDs with existing ones
        inventoryIds = [
          ...inventoryIds,
          ...retrieveRecords.map((record) => ({
            id: record.id,
            product_id: record.product_id || null,
            identifier: record.identifier || null,
          })),
        ];
      }

      // Step 5: Map inventory IDs to flatInventory
      const inventoryMap = {};
      inventoryIds.forEach(({ id, product_id, identifier }) => {
        if (product_id) inventoryMap[product_id] = id;
        if (identifier) inventoryMap[identifier] = id;
      });

      flatInventory.forEach((item) => {
        // Get the corresponding inventory ID from the map
        const mappedId =
          inventoryMap[item.product_id] || inventoryMap[item.identifier];

        if (mappedId) {
          item.inventory_id = mappedId;
        } else {
          logWarn(
            `Warning: No matching inventory_id found for product_id: ${item.product_id}, identifier: ${item.identifier}`
          );
        }
      });

      // Step 6: Check and Insert Warehouse Inventory
      const existingWarehouseInventoryItems = await checkWarehouseInventoryBulk(
        client,
        warehouseIds,
        flatInventory.map((i) => i.inventory_id)
      );

      const newWarehouseInventoryItems = flatInventory.filter(
        (item) =>
          !existingWarehouseInventoryItems.some(
            (existing) =>
              existing.warehouse_id === item.warehouse_id &&
              existing.inventory_id === item.inventory_id
          )
      );

      if (newWarehouseInventoryItems.length > 0) {
        const warehouseInventoryRecords = newWarehouseInventoryItems.map(
          (item) => ({
            warehouse_id: item.warehouse_id,
            inventory_id: item.inventory_id,
            reserved_quantity: 0,
            available_quantity: item.quantity,
            warehouse_fee: 0,
            status_id: status_id,
            created_by: userId,
          })
        );

        await insertWarehouseInventoryRecords(
          client,
          warehouseInventoryRecords
        );
      }

      // Step 7: Check and Insert Warehouse Inventory Lots
      const existingWarehouseInventoryLotItems =
        await checkWarehouseInventoryLotExists(
          client,
          warehouseIds,
          inventoryIds.map((i) => i.id),
          flatInventory
        );
      const newLots = flatInventory.filter(
        (item) =>
          !existingWarehouseInventoryLotItems.some(
            (existing) =>
              existing.warehouse_id === item.warehouse_id &&
              existing.inventory_id === item.inventory_id &&
              existing.lot_number === item.lot_number &&
              existing.manufacture_date === item.manufacture_date &&
              existing.expiry_date === item.expiry_date
          )
      );

      if (newLots.length > 0) {
        const warehouseLots = newLots.map((item) => ({
          warehouse_id: item.warehouse_id,
          inventory_id: item.inventory_id,
          lot_number: item.lot_number || null,
          quantity: item.quantity,
          reserved_quantity: item.reserved_quantity ?? 0,
          expiry_date: item.expiry_date || null,
          manufacture_date: item.manufacture_date || null,
          status_id: item.status_id,
          created_by: userId,
        }));

        warehouseLotsInventoryRecords = await insertWarehouseInventoryLots(
          client,
          warehouseLots
        );
      }
      const { id: warehouse_inventory_lot_id } =
        warehouseLotsInventoryRecords[0];

      const insert_action_type_id = await getActionTypeId(
        client,
        'manual_stock_insert'
      );
      const { id: insert_adjustment_type_id } =
        await getWarehouseLotAdjustmentType(client, {
          name: 'manual_stock_insert',
        });

      // Step 3: Insert Activity Logs for Inventory Creation
      const activityLogs = newLots.map(
        ({ inventory_id, warehouse_id, quantity }) => ({
          inventory_id,
          warehouse_id,
          lot_id: warehouse_inventory_lot_id,
          inventory_action_type_id: insert_action_type_id,
          previous_quantity: 0,
          quantity_change: Number(quantity) || 0,
          new_quantity: Number(quantity) || 0,
          status_id,
          adjustment_type_id: insert_adjustment_type_id,
          order_id: null,
          user_id: userId,
          timestamp: new Date(),
          comments: 'New inventory record created',
        })
      );

      await bulkInsertInventoryActivityLogs(activityLogs, client);

      // Step 4: Insert Inventory History for Creation
      const inventoryHistoryLogs = newLots.map((item) => ({
        inventory_id: item.inventory_id,
        inventory_action_type_id: insert_action_type_id,
        previous_quantity: 0,
        quantity_change: Number(item.quantity) || 0,
        new_quantity: item.quantity,
        status_id,
        source_action_id: item.updated_by || userId,
        comments: 'Inventory added manually',
        checksum: generateChecksum(
          item.inventory_id,
          insert_action_type_id,
          0,
          Number(item.quantity) || 0,
          item.quantity,
          item.updated_by || userId,
          'Inventory added manually'
        ),
        metadata: {},
        created_by: userId,
      }));

      await bulkInsertInventoryHistory(inventoryHistoryLogs, client);

      // Step 5: Aggregate total quantity per inventory_id
      const inventoryUpdates = newLots.reduce(
        (acc, { inventory_id, quantity, reserved_quantity }) => {
          acc[inventory_id] = {
            quantity: (acc[inventory_id]?.quantity || 0) + (quantity ?? 0),
            reserved_quantity:
              (acc[inventory_id]?.reserved_quantity || 0) +
              (reserved_quantity ?? 0),
          };
          return acc;
        },
        {}
      );

      // Step 6: Aggregate available quantity per warehouse_id & inventory_id
      const warehouseUpdates = newLots.reduce(
        (acc, { warehouse_id, inventory_id, quantity, reserved_quantity }) => {
          const key = `${warehouse_id}-${inventory_id}`;
          acc[key] = {
            available_quantity: (acc[key]?.available_quantity || 0) + quantity,
            reserved_quantity:
              (acc[key]?.reserved_quantity || 0) + (reserved_quantity ?? 0),
          };
          return acc;
        },
        {}
      );

      // Step 7: Update Inventory Quantities
      await updateInventoryQuantity(client, inventoryUpdates, userId);

      // Step 8: Update Warehouse Inventory Quantities
      await updateWarehouseInventoryQuantity(client, warehouseUpdates, userId);
      const inventoryToWarehouseMap = newLots.reduce((map, item) => {
        map[item.inventory_id] = item.warehouse_id;
        return map;
      }, {});

      const update_action_type_id = await getActionTypeId(
        client,
        'manual_stock_insert_update'
      );
      const { id: update_adjustment_type_id } =
        await getWarehouseLotAdjustmentType(client, {
          name: 'manual_stock_update',
        });

      // Step 9: Insert Activity Logs for Inventory Updates
      const updateLogs = Object.entries(inventoryUpdates).map(
        ([inventory_id, update]) => {
          const { quantity, reserved_quantity } = update;
          return {
            inventory_id,
            warehouse_id: inventoryToWarehouseMap[inventory_id],
            lot_id: warehouse_inventory_lot_id,
            inventory_action_type_id: update_action_type_id,
            previous_quantity: 0,
            quantity_change: quantity,
            new_quantity: quantity,
            status_id,
            adjustment_type_id: update_adjustment_type_id,
            order_id: null,
            user_id: userId,
            comments:
              reserved_quantity > 0
                ? `Inventory quantity updated with reserved quantity: ${reserved_quantity}`
                : 'Inventory quantity updated',
          };
        }
      );

      await bulkInsertInventoryActivityLogs(updateLogs, client);

      // Step 10: Insert Inventory History for Updates
      const updateHistoryLogs = Object.entries(inventoryUpdates).map(
        ([inventory_id, update]) => {
          const { quantity, reserved_quantity } = update;

          const comment =
            reserved_quantity > 0
              ? `Inventory updated with reserved quantity: ${reserved_quantity}`
              : 'Inventory quantity updated';

          return {
            inventory_id,
            inventory_action_type_id: update_action_type_id,
            previous_quantity: 0, // You can replace this if needed
            quantity_change: quantity,
            new_quantity: quantity,
            status_id,
            source_action_id: userId,
            comments: comment,
            checksum: generateChecksum(
              inventory_id,
              update_action_type_id,
              0, // previous_quantity
              quantity,
              quantity,
              userId,
              comment
            ),
            metadata: {},
            created_by: userId,
          };
        }
      );

      await bulkInsertInventoryHistory(updateHistoryLogs, client);

      return {
        success: true,
        message: 'Inventory records successfully created, updated, and logged.',
        data: { warehouseLotsInventoryRecords },
      };
    });
  } catch (error) {
    logError('Error in inventory service:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Fetches and transforms recently inserted warehouse inventory records by lot IDs.
 *
 * @param {Array<{id: string}>} warehouseLotIds - Array of lot objects containing `id` fields (UUIDs).
 * @returns {Promise<Array>} - Transformed inventory records grouped by warehouse.
 * @throws {AppError} - If input is invalid or database query fails.
 */
const fetchRecentInsertWarehouseInventoryRecords = async (warehouseLotIds) => {
  if (!Array.isArray(warehouseLotIds) || warehouseLotIds.length === 0) {
    throw AppError.validationError('No warehouse lot IDs provided.');
  }

  // Extract UUIDs from objects
  const lotIds = warehouseLotIds.map((item) => item.id);

  // Fetch raw data from the database
  const rawRecords = await getRecentInsertWarehouseInventoryRecords(lotIds);

  // Transform the result into a structured response
  return transformWarehouseInventoryRecords(rawRecords);
};

module.exports = {
  fetchLocationInventorySummaryService,
  createInventoryRecords,
  fetchRecentInsertWarehouseInventoryRecords,
};
