const { getInventories, insertInventoryRecords, updateInventoryQuantity } = require('../repositories/inventory-repository');
const AppError = require('../utils/AppError');
const { logError, logInfo } = require('../utils/logger-helper');
const { getWarehouseLotStatus } = require('../repositories/warehouse-lot-status-repository');
const { withTransaction } = require('../database/db');
const { insertWarehouseInventoryRecords, updateWarehouseInventoryQuantity, getRecentInsertWarehouseInventoryRecords } = require('../repositories/warehouse-inventory-repository');
const { geLocationIdByWarehouseId } = require('../repositories/warehouse-repository');
const { insertWarehouseInventoryLots } = require('../repositories/warehouse-inventory-lot-repository');

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
      
      const warehouseIds = [...new Set(inventoryData.map((item) => item.warehouse_id))].filter(Boolean); // Ensure no null values
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
      
      const formattedInventoryData = {
        products,
        otherTypes
      };
      
      const { success, inventoryRecords } = await insertInventoryRecords(trx, formattedInventoryData);
      
      // Step 2: Map `inventory_id` for Warehouse Inventory Lots
      const warehouseLots = [...products, ...otherTypes].map((item, index) => {
        const matchingInventory = inventoryRecords[index]; // Match by index instead of find()
        
        if (!matchingInventory || !matchingInventory.id) {
          logError(`Missing inventory_id for item:`, item);
          throw new AppError(`Missing inventory_id for item: ${JSON.stringify(item)}`);
        }
        
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
      
      // Aggregate total quantity per inventory_id
      const inventoryUpdates = warehouseLots.reduce((acc, { inventory_id, quantity }) => {
        acc[inventory_id] = (acc[inventory_id] || 0) + quantity;
        return acc;
      }, {});
      
      // Aggregate available quantity per warehouse_id & inventory_id
      const warehouseUpdates = warehouseLots.reduce((acc, { warehouse_id, inventory_id, quantity }) => {
        const key = `${warehouse_id}-${inventory_id}`;
        acc[key] = (acc[key] || 0) + quantity;
        return acc;
      }, {});
      
      // Update inventory first
      await updateInventoryQuantity(trx, inventoryUpdates, userId);
      
      // Update warehouse inventory next
      await updateWarehouseInventoryQuantity(trx, warehouseUpdates, userId);
      
      return {
        success,
        message: "Inventory records successfully created.",
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
