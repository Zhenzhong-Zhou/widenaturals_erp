const {
  getInventories,
  insertInventoryRecords,
  updateInventoryQuantity,
  checkInventoryExists,
  getProductIdOrIdentifierByInventoryIds, getPaginatedInventorySummary,
} = require('../repositories/inventory-repository');
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
const { transformPaginatedInventorySummary, transformPaginatedInventoryRecords } = require('../transformers/inventory-transformer');
const { canViewInventorySummary } = require('../business/inventory-business');
const { transformWarehouseInventoryRecords } = require('../transformers/warehouse-inventory-transformer');

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
    const rawResult = await getInventories({
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    return transformPaginatedInventoryRecords(rawResult);
  } catch (error) {
    logError('Error fetching inventory:', error);
    throw AppError.serviceError('Failed to fetch inventory');
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

        if (!type || !warehouse_id || !quantity || reserved_quantity === null || !status_id || !lot_number) {
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
      ];

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
          reserved_quantity: item.reserved_quantity || 0,
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
        (acc, { inventory_id, quantity }) => {
          acc[inventory_id] = (acc[inventory_id] || 0) + quantity;
          return acc;
        },
        {}
      );

      // Step 6: Aggregate available quantity per warehouse_id & inventory_id
      const warehouseUpdates = newLots.reduce(
        (acc, { warehouse_id, inventory_id, quantity }) => {
          const key = `${warehouse_id}-${inventory_id}`;
          acc[key] = (acc[key] || 0) + quantity;
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
        ([inventory_id, new_quantity]) => ({
          inventory_id,
          warehouse_id: inventoryToWarehouseMap[inventory_id],
          lot_id: warehouse_inventory_lot_id,
          inventory_action_type_id: update_action_type_id,
          previous_quantity: 0,
          quantity_change: new_quantity,
          new_quantity,
          status_id,
          adjustment_type_id: update_adjustment_type_id,
          order_id: null,
          user_id: userId,
          comments: 'Inventory quantity updated',
        })
      );

      await bulkInsertInventoryActivityLogs(updateLogs, client);

      // Step 10: Insert Inventory History for Updates
      const updateHistoryLogs = Object.entries(inventoryUpdates).map(
        ([inventory_id, new_quantity]) => ({
          inventory_id,
          inventory_action_type_id: update_action_type_id,
          previous_quantity: 0, // Could be fetched if needed
          quantity_change: new_quantity,
          new_quantity,
          status_id,
          source_action_id: userId,
          comments: 'Inventory quantity updated',
          checksum: generateChecksum(
            inventory_id,
            update_action_type_id,
            0, // Previous quantity is 0 for new entries
            Number(new_quantity) || 0,
            new_quantity,
            userId,
            'Inventory added manually'
          ),
          metadata: {},
          created_by: userId,
        })
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

/**
 * Fetches and processes paginated inventory summary after permission check.
 *
 * @param {object} options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Page size
 * @param {object} options.user - Authenticated user object
 * @returns {Promise<object>} - Transformed and business-validated result
 */
const fetchPaginatedInventorySummary = async ({ page = 1, limit = 20, user }) => {
  if (!user) {
    throw AppError.authenticationError('User is not authenticated.');
  }
  const isAllowed = await canViewInventorySummary(user);
  if (!isAllowed) {
    throw AppError.authorizationError('You do not have permission to view inventory summary.');
  }
  
  if (page < 1 || limit < 1) {
    throw AppError.validationError('Invalid pagination parameters.');
  }
  
  const rawResult = await getPaginatedInventorySummary({ page, limit });
  
  return transformPaginatedInventorySummary(rawResult);
};

module.exports = {
  fetchAllInventories,
  createInventoryRecords,
  fetchRecentInsertWarehouseInventoryRecords,
  fetchPaginatedInventorySummary,
};
