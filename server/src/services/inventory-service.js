const { getInventories, insertInventoryRecords, updateInventoryQuantity } = require('../repositories/inventory-repository');
const AppError = require('../utils/AppError');
const { logError, logInfo } = require('../utils/logger-helper');
const { getWarehouseLotStatus } = require('../repositories/warehouse-lot-status-repository');
const { withTransaction } = require('../database/db');
const { insertWarehouseInventoryRecords, updateWarehouseInventoryQuantity, getRecentInsertWarehouseInventoryRecords } = require('../repositories/warehouse-inventory-repository');
const { geLocationIdByWarehouseId } = require('../repositories/warehouse-repository');
const { insertWarehouseInventoryLots } = require('../repositories/warehouse-inventory-lot-repository');
const { bulkInsertInventoryActivityLogs } = require('../repositories/inventory-activity-log-repository');
const { getActionTypeId } = require('../repositories/inventory-action-type-repository');
const { bulkInsertInventoryHistory } = require('../repositories/inventory-history-repository');
const { getWarehouseLotAdjustmentType } = require('../repositories/lot-adjustment-type-repository');
const { generateChecksum } = require('../utils/crypto-utils');

/**
 * Fetch all inventory records with pagination, sorting, and business logic.
 * @param {Object} options - Query parameters.
 * @param {number} options.page - Page number.
 * @param {number} options.limit - Records per page.
 * @param {string} [options.sortBy='created_at'] - Column to sort by.
 * @param {string} [options.sortOrder='ASC'] - Sorting order.
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
const fetchAllInventories = async ({ page, limit, sortBy, sortOrder }) => {
  try {
    logInfo(
      `Fetching inventory data: page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`
    );

    // Fetch inventory records from repository
    const { data, pagination } = await getInventories({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Business Logic: Mark expired items
    const processedData = data.map((item) => ({
      ...item,
      is_expired: item.expiry_date && new Date(item.expiry_date) < new Date(), // If expiry_date is in the past, mark as expired
      warehouse_fee: parseFloat(item.warehouse_fee) || 0, // Ensure warehouse_fee is always a number
    }));

    return { processedData, pagination };
  } catch (error) {
    logError('Error fetching inventory:', error);
    throw new AppError('Failed to fetch inventory', 500);
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
      throw new AppError("Invalid inventory data. Expected a non-empty array.");
    }
    
    return await withTransaction(async (trx) => {
      const { id: status_id } = await getWarehouseLotStatus(null, { name: "in_stock" });
      
      const warehouseIds = [...new Set(inventoryData.map((item) => item.warehouse_id))].filter(Boolean);
      const warehouseLocations = await geLocationIdByWarehouseId(trx, warehouseIds);
      
      const products = [];
      const otherTypes = [];
      
      for (const data of inventoryData) {
        const { type, identifier, product_id, warehouse_id, quantity, lot_number, expiry_date, manufacture_date } = data;
        const location_id = warehouseLocations[warehouse_id];
        
        if (!location_id) {
          throw new AppError(`Warehouse ID ${warehouse_id} does not have a valid location.`);
        }
        
        if (!type || !warehouse_id || !quantity || !status_id) {
          throw new AppError("Missing required fields in inventory record.");
        }
        
        if (type === "product") {
          if (!product_id) throw new AppError.validationError("Product must have a product_id.");
          products.push({ product_id, warehouse_id, location_id, quantity, lot_number, expiry_date, manufacture_date, status_id, userId });
        } else {
          if (!identifier) throw new AppError.validationError("Non-product items must have an identifier.");
          otherTypes.push({ identifier, type, warehouse_id, location_id, quantity, lot_number, expiry_date, manufacture_date, status_id, userId });
        }
      }
      
      const formattedInventoryData = { products, otherTypes };
      
      // Step 1: Insert Inventory Records
      const { success, inventoryRecords } = await insertInventoryRecords(trx, formattedInventoryData);
      
      // Step 2: Insert Warehouse Inventory Lots
      const warehouseLots = [...products, ...otherTypes].map((item, index) => {
        const matchingInventory = inventoryRecords[index];
        
        if (!matchingInventory || !matchingInventory.id) {
          logError(`Missing inventory_id for item:`, item);
          throw new AppError(`Missing inventory_id for item: ${JSON.stringify(item)}`);
        }
        
        return {
          warehouse_id: item.warehouse_id,
          inventory_id: matchingInventory.id,
          lot_number: item.lot_number || null,
          quantity: item.quantity,
          expiry_date: item.expiry_date || null,
          manufacture_date: item.manufacture_date || null,
          status_id: item.status_id,
          created_by: userId,
        };
      });
      
      const warehouseInventoryRecords = await insertWarehouseInventoryRecords(trx, warehouseLots);
      const warehouseLotsInventoryRecords = await insertWarehouseInventoryLots(trx, warehouseLots);
      
      const insert_action_type_id = await getActionTypeId(trx, 'manual_stock_insert');
      const { id: insert_adjustment_type_id } = await getWarehouseLotAdjustmentType(trx, { name: 'manual_stock_insert' });
      
      // **Step 3: Insert Activity Logs for Inventory Creation**
      const activityLogs = warehouseLots.map(({ inventory_id, warehouse_id, status_id, quantity }) => {
        if (quantity === undefined || quantity === null || isNaN(quantity)) {
          logError(`Invalid quantity value for inventory_id: ${inventory_id}, setting default to 0`);
          quantity = 0; // Ensure a valid number
        }
        
        return {
          inventory_id,
          warehouse_id,
          lot_id: null, // Explicitly setting to NULL
          inventory_action_type_id: insert_action_type_id,
          previous_quantity: 0, // New inventory, so previous quantity is 0
          quantity_change: Number(quantity) || 0,
          new_quantity: Number(quantity) || 0,
          status_id,
          adjustment_type_id: insert_adjustment_type_id,
          order_id: null,
          user_id: userId,
          timestamp: new Date(),
          comments: "New inventory record created",
        };
      });
      
      await bulkInsertInventoryActivityLogs(activityLogs, trx);
      
      // **Step 4: Insert Inventory History for Creation**
      const inventoryHistoryLogs = warehouseLots.map(item => ({
        inventory_id: item.inventory_id,
        inventory_action_type_id: insert_action_type_id,
        previous_quantity: 0,
        quantity_change: Number(item.quantity) || 0,
        new_quantity: item.quantity,
        status_id,
        source_action_id: item.updated_by || userId,
        comments: "Inventory added manually",
        checksum: generateChecksum(
          item.inventory_id,
          insert_action_type_id,
          0, // Previous quantity is 0 for new entries
          Number(item.quantity) || 0,
          item.quantity,
          item.updated_by || userId,
          "Inventory added manually"
        ),
        metadata: {},
        created_by: userId,
      }));
      
      await bulkInsertInventoryHistory(inventoryHistoryLogs, trx);
      
      // Step 5: Aggregate total quantity per inventory_id
      const inventoryUpdates = warehouseLots.reduce((acc, { inventory_id, quantity }) => {
        acc[inventory_id] = (acc[inventory_id] || 0) + quantity;
        return acc;
      }, {});
      
      // Step 6: Aggregate available quantity per warehouse_id & inventory_id
      const warehouseUpdates = warehouseLots.reduce((acc, { warehouse_id, inventory_id, quantity }) => {
        const key = `${warehouse_id}-${inventory_id}`;
        acc[key] = (acc[key] || 0) + quantity;
        return acc;
      }, {});
      
      // Step 7: Update Inventory Quantities
      await updateInventoryQuantity(trx, inventoryUpdates, userId);
      
      // Step 8: Update Warehouse Inventory Quantities
      await updateWarehouseInventoryQuantity(trx, warehouseUpdates, userId);
      
      const inventoryToWarehouseMap = warehouseLots.reduce((map, item) => {
        map[item.inventory_id] = item.warehouse_id;
        return map;
      }, {});
      
      const update_action_type_id = await getActionTypeId(trx, 'manual_stock_insert_update');
      const { id: update_adjustment_type_id } = await getWarehouseLotAdjustmentType(trx, { name: 'manual_stock_update' });
      
      // **Step 9: Insert Activity Logs for Inventory Updates**
      const updateLogs = Object.entries(inventoryUpdates).map(([inventory_id, new_quantity]) => ({
        inventory_id,
        warehouse_id: inventoryToWarehouseMap[inventory_id],
        lot_id: null, // Not needed for inventory-level update
        inventory_action_type_id: update_action_type_id,
        previous_quantity: 0,
        quantity_change: new_quantity,
        new_quantity,
        status_id,
        adjustment_type_id: update_adjustment_type_id,
        order_id: null,
        user_id: userId,
        comments: "Inventory quantity updated",
      }));
      
      await bulkInsertInventoryActivityLogs(updateLogs, trx);
      
      // **Step 10: Insert Inventory History for Updates**
      const updateHistoryLogs = Object.entries(inventoryUpdates).map(([inventory_id, new_quantity]) => ({
        inventory_id,
        inventory_action_type_id: update_action_type_id,
        previous_quantity: 0, // Could be fetched if needed
        quantity_change: new_quantity,
        new_quantity,
        status_id,
        source_action_id: userId,
        comments: "Inventory quantity updated",
        checksum: generateChecksum(
          inventory_id,
          update_action_type_id,
          0, // Previous quantity is 0 for new entries
          Number(new_quantity) || 0,
          new_quantity,
          userId,
          "Inventory added manually"
        ),
        metadata: {},
        created_by: userId,
      }));
      
      await bulkInsertInventoryHistory(updateHistoryLogs, trx);
      
      return {
        success,
        message: "Inventory records successfully created, updated, and logged.",
        data: { inventoryRecords, warehouseInventoryRecords, warehouseLotsInventoryRecords },
      };
    });
  } catch (error) {
    logError("Error in inventory service:", error.message);
    return { success: false, error: error.message };
  }
};

const fetchRecentInsertWarehouseInventoryRecords = async (warehouseLotIds) => {
  if (!Array.isArray(warehouseLotIds) || warehouseLotIds.length === 0) {
    throw new Error("No warehouse lot IDs provided.");
  }
  
  // Extract UUIDs from objects if they exist
  const lotIds = warehouseLotIds.map(item => item.id);
  
  // Fetch inventory records from the repository
  return await getRecentInsertWarehouseInventoryRecords(lotIds);
};

module.exports = {
  fetchAllInventories,
  createInventoryRecords,
  fetchRecentInsertWarehouseInventoryRecords,
};
