const { query, paginateQuery, retry, bulkInsert, lockRow, withTransaction, formatBulkUpdateQuery } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError, logWarn } = require('../utils/logger-helper');
const { insertWarehouseInventoryLots } = require('./warehouse-inventory-lot-repository');

/**
 * Fetch all inventory items with pagination & sorting.
 * @param {Object} options - Query parameters
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Number of results per page
 * @param {string} [options.sortBy='name'] - Column to sort by
 * @param {string} [options.sortOrder='ASC'] - Sorting order (ASC/DESC)
 * @returns {Promise<{ data: Array, pagination: Object }>} Inventory data with pagination info
 */
const getInventories = async ({
                                page = 1,
                                limit = 10,
                                sortBy,
                                sortOrder,
                              } = {}) => {
  const validSortColumns = [
    'product_name',       // Sort by product name
    'location_name',      // Sort by location name
    'item_type',          // Sort by item type
    'lot_number',         // Sort by lot number (for batch tracking)
    'available_quantity', // Sort by available quantity
    'reserved_quantity',  // Sort by reserved quantity
    'warehouse_fee',      // Sort by storage fee
    'status_id',          // Sort by warehouse lot status
    'status_date',        // Sort by last status update
    'inbound_date',       // Sort by when the item was received
    'outbound_date',      // Sort by when the item was shipped out
    'last_update',        // Sort by the last modified date
    'created_at',         // Sort by record creation time
    'updated_at',         // Sort by record last updated time
  ];
  
  let defaultSortBy = 'location_id, created_at';
  
  if (!validSortColumns.includes(sortBy)) {
    sortBy = defaultSortBy;
  }
  
  const tableName = 'inventory i';
  
  const joins = [
    'LEFT JOIN products p ON i.product_id = p.id',
    'LEFT JOIN locations l ON i.location_id = l.id',
    'LEFT JOIN users u1 ON i.created_by = u1.id',
    'LEFT JOIN users u2 ON i.updated_by = u2.id',
    'LEFT JOIN warehouse_inventory wi ON i.id = wi.inventory_id',
    'LEFT JOIN warehouses w ON wi.warehouse_id = w.id',
    'LEFT JOIN warehouse_inventory_lots wil ON wi.warehouse_id = wil.warehouse_id AND i.id = wil.inventory_id',
    'LEFT JOIN warehouse_lot_status wls ON wil.status_id = wls.id'
  ];
  
  const whereClause = '1=1';
  
  const text = `
    SELECT
      i.id AS inventory_id,
      i.product_id,
      p.product_name AS product_name,
      i.location_id,
      l.name AS location_name,
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      i.item_type,
      i.identifier,
      i.inbound_date,
      i.outbound_date,
      i.last_update,
      wls.id AS status_id,
      wls.name AS status_name,
      i.status_date,
      i.created_at,
      i.updated_at,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by,
      wi.warehouse_fee,
      wi.reserved_quantity,
      wi.available_quantity,
      COUNT(DISTINCT wil.id) AS total_lots,
      COALESCE(SUM(wil.quantity), 0) AS total_lot_quantity,
      MIN(wil.manufacture_date) AS earliest_manufacture_date,
      MIN(wil.expiry_date) AS nearest_expiry_date
    FROM ${tableName}
    ${joins.join(' ')}
    GROUP BY
      i.id, p.product_name, l.name, wls.id, wls.name,
      u1.firstname, u1.lastname, u2.firstname, u2.lastname,
      wi.warehouse_fee, wi.reserved_quantity, wi.available_quantity, w.id, w.name
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: text,
        params: [],
        page,
        limit,
        sortBy: `i.${sortBy}`,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching inventories:', error);
    throw new AppError('Failed to fetch inventories');
  }
};

/**
 * Fetch inventory ID using product ID.
 * @param {string} productId - The ID of the product.
 * @returns {Promise<string|null>} - The inventory ID if found, otherwise null.
 */
const getInventoryIdByProductId = async (productId) => {
  const text = `
    SELECT id AS inventory_id
    FROM inventory
    WHERE product_id = $1
    LIMIT 1;
  `;

  try {
    const { rows } = await query(text, [productId]);
    return rows.length > 0 ? rows[0].inventory_id : null;
  } catch (error) {
    logError('Error fetching inventory ID:', error);
    throw AppError('Database query failed');
  }
};

/**
 * Checks if any inventory items exist for the given location(s), based on product_id or identifier.
 *
 * @param {Array<Object>} inventoryItems - List of inventory objects containing location_id, product_id, and/or identifier.
 * @param {string} inventoryItems[].location_id - The ID of the inventory location.
 * @param {string|null} [inventoryItems[].product_id] - The optional product ID (UUID).
 * @param {string|null} [inventoryItems[].identifier] - The optional inventory identifier.
 * @returns {Promise<Array<Object>>} - List of existing inventory records with location_id, product_id, and identifier.
 */
const checkInventoryExists = async (inventoryItems) => {
  if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) return [];
  
  let locationIds = new Set();
  let productIds = new Set();
  let identifiers = new Set();
  
  inventoryItems.forEach(({ location_id, product_id, identifier }) => {
    if (location_id) locationIds.add(location_id);
    if (product_id) productIds.add(product_id);
    if (identifier) identifiers.add(identifier);
  });
  
  if (locationIds.size === 0) return []; // Ensure at least one location_id exists
  
  let queryText = `
    SELECT location_id, product_id, identifier
    FROM inventory
    WHERE location_id = ANY($1::uuid[])
    AND (
      (CARDINALITY($2::text[]) > 0 AND identifier = ANY($2::text[]))
      OR ($3::uuid[] IS NOT NULL AND CARDINALITY($3::uuid[]) > 0 AND product_id = ANY($3::uuid[]))
    )
  `;
  
  let params = [
    Array.from(locationIds),
    identifiers.size > 0 ? Array.from(identifiers) : [],
    productIds.size > 0 ? Array.from(productIds) : null // Ensure it does not pass an empty array
  ];
  
  try {
    const { rows } = await query(queryText, params);
    return rows;
  } catch (error) {
    logError("Error checking inventory existence:", error);
    throw error;
  }
};

/**
 * Checks and locks inventory rows if they exist.
 * @param {Object} client - Database client (transaction connection).
 * @param {Array} inventoryItems - List of inventory objects [{ location_id, product_id, identifier }]
 * @param {String} lockMode - Lock mode ('FOR UPDATE', 'FOR SHARE', etc.)
 * @returns {Promise<Array>} - List of locked inventory rows
 */
const checkAndLockInventory = async (client, inventoryItems, lockMode = 'FOR UPDATE') => {
  if (!inventoryItems || inventoryItems.length === 0) return [];
  
  // Step 1: Check existing inventory
  const existingInventory = await checkInventoryExists(inventoryItems);
  
  if (existingInventory.length === 0) {
    logWarn("No existing inventory records found. Proceeding with inserts.");
    return [];
  }
  
  logInfo(`Locking ${existingInventory.length} existing inventory records...`);
  
  // Step 2: Lock existing rows
  const lockedRecords = [];
  for (const item of existingInventory) {
    const table = "inventory"; // Inventory table
    let inventoryId;
    
    // Fetch `inventory_id` if only `identifier` is available
    if (!item.product_id) {
      try {
        const queryText = `SELECT id FROM inventory WHERE identifier = $1 LIMIT 1 FOR UPDATE SKIP LOCKED;`;
        const { rows } = await client.query(queryText, [item.identifier]);
        if (rows.length > 0) {
          inventoryId = rows[0].id;
        } else {
          logError(`No inventory record found for identifier: ${item.identifier}`);
          continue; // Skip this record if no matching inventory_id is found
        }
      } catch (error) {
        logError(`Error fetching inventory ID:`, error);
        throw error;
      }
    } else {
      inventoryId = item.product_id; // Assume product_id is the inventory_id
    }
    
    // Now lock the row using inventoryId
    try {
      const lockedRow = await lockRow(client, table, inventoryId, lockMode);
      lockedRecords.push(lockedRow);
    } catch (error) {
      logError(`Failed to lock row in inventory:`, error);
      throw error;
    }
  }
  
  return lockedRecords;
};

/**
 * Inserts inventory records associated with a `product_id` from the `Products` table.
 *
 * @param {Object} trx - Database transaction object.
 * @param {Array<Object>} productEntries - Array of inventory objects containing `product_id` and other relevant fields.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of inserted inventory records.
 */
const insertProducts = async (trx, productEntries) => {
  if (!productEntries.length) return [];
  
  const columns = [
    "product_id", "location_id", "item_type", "identifier", "quantity", "inbound_date",
    "status_id", "status_date", "created_at", "created_by", "updated_at", "updated_by", "last_update"
  ];
  
  // Set `quantity = 0`, since actual quantity comes from `warehouse_inventory_lots`
  const rows = productEntries.map(({ product_id, location_id, item_type, status_id, userId }) => [
    product_id, location_id, item_type, null, 0, new Date(),
    status_id, new Date(), new Date(), userId, null, null, null
  ]);
  
  try {
    // Insert into inventory
    return await bulkInsert(
      "inventory",
      columns,
      rows,
      ["location_id", "product_id"], // Conflict columns
      [] // DO NOTHING on conflict
    ) || [];
  } catch (error) {
    logError("Error inserting product inventory records:", error);
    throw error;
  }
};

/**
 * Inserts inventory records that do not have a `product_id`, such as raw materials, packaging, samples, and other non-product items.
 *
 * @param {Object} trx - Database transaction object.
 * @param {Array<Object>} otherEntries - Array of inventory objects that do not include a `product_id`.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of inserted non-product inventory records.
 */
const insertNonProducts = async (trx, otherEntries) => {
  if (!otherEntries.length) return [];
  
  const columns = [
    "product_id", "location_id", "item_type", "identifier", "quantity", "inbound_date",
    "status_id", "status_date", "created_at", "created_by", "updated_at", "updated_by", "last_update"
  ];
  
  const rows = otherEntries.map(({ location_id, type, identifier, status_id, userId }) => [
    null, location_id, type, identifier, 0, new Date(),
    status_id, new Date(), new Date(), userId, null, null, null
  ]);
  
  try {
    return await bulkInsert(
      "inventory",
      columns,
      rows,
      ["location_id", "identifier"], // Conflict columns for non-product items
      [] // DO NOTHING on conflict
    ) || [];
  } catch (error) {
    logError("Error inserting non-product inventory records:", error);
    throw error;
  }
};

/**
 * Inserts inventory records with row-level locking and database transactions to ensure data consistency.
 *
 * @param {Object} client - Database client or transaction object for executing queries.
 * @param {Array<Object>} inventoryData - Array of inventory objects containing:
 *   - `location_id` (UUID): The location where the inventory is stored.
 *   - `product_id` (UUID | null): The associated product ID, or null for non-product inventory.
 *   - `identifier` (String): Unique identifier for the inventory item.
 *   - `quantity` (Integer): The number of units available.
 * @returns {Promise<Object>} - A promise resolving to an object containing the inserted inventory records.
 */
const insertInventoryRecords = async (client, inventoryData) => {
  if (!inventoryData || typeof inventoryData !== "object") {
    logError("No inventory data to insert.");
    return { success: false, message: "No inventory data provided." };
  }
  
  // Flatten `products` and `otherTypes` into a single array
  const flatInventory = [...(inventoryData.products || []), ...(inventoryData.otherTypes || [])];
  
  if (!Array.isArray(flatInventory) || flatInventory.length === 0) {
    logWarn("No valid inventory data to insert.");
    return { success: false, message: "No valid inventory records provided." };
  }
  
  try {
    // Step 1: Check & Lock Existing Inventory (With Retry)
    const existingItems = await retry(
      () => checkAndLockInventory(client, flatInventory, "FOR UPDATE"),
      3, // Retries up to 3 times
      1000 // Initial delay of 1s, with exponential backoff
    );
    
    // Step 2: Filter Out Existing Items Before Insert
    const newItems = flatInventory.filter(({ location_id, product_id, identifier }) =>
      !existingItems.some(
        (item) =>
          item.location_id === location_id &&
          ((product_id && item.product_id === product_id && item.type === "product") ||
            (identifier && item.identifier === identifier && item.type !== "product"))
      )
    );
    
    if (newItems.length === 0) {
      logWarn("No new inventory to insert, all items already exist.");
      return { success: false, message: "No new records to insert." };
    }
    
    // Step 3: Separate Products & Other Types
    const productEntries = newItems
      .filter(e => e.product_id)
      .map(e => ({ ...e, item_type: "product" })) || [];
    
    const otherEntries = newItems
      .filter(e => !e.product_id && e.identifier)
      .map(e => ({ ...e, item_type: e.type })) || [];
    
    // Step 4: Insert Products & Other Types with Retry and Transaction
    const productResults = productEntries.length > 0
      ? await retry(() => insertProducts(client, productEntries), 3, 1000)
      : [];
    
    const otherTypeResults = otherEntries.length > 0
      ? await retry(() => insertNonProducts(client, otherEntries), 3, 1000)
      : [];
    
    return {
      success: true,
      inventoryRecords: [...productResults, ...otherTypeResults],
    };
  } catch (error) {
    logError("Error inserting inventory records:", error);
    return { success: false, message: "Failed to insert inventory records", error: error.message };
  }
};

/**
 * Updates the quantity of multiple inventory records in bulk using transactions.
 *
 * @param {Object} client - Database transaction object used to execute queries.
 * @param {Object} inventoryUpdates - An object mapping `inventory_id` (UUID) to the new quantity.
 *   Example: `{ "168bdc32-18a3-40f9-87c5-1ad77ad2258a": 6, "a430cacf-d7b5-4915-a01a-aa1715476300": 40 }`
 * @param {string} userId - The UUID of the user performing the update (stored in `updated_by`).
 * @returns {Promise<void>} - Resolves when the update operation completes successfully.
 *
 * @throws {Error} - Throws an error if the update query fails.
 */
const updateInventoryQuantity = async (client, inventoryUpdates, userId) => {
  const { baseQuery, params } = await formatBulkUpdateQuery(
    "inventory",
    ["quantity"],
    ["id"],
    inventoryUpdates,
    userId
  );
  
  if (baseQuery) {
    return await retry(
      async () => {
        const { rows } = client ?
          await query(baseQuery, params) :
          await client.query(baseQuery, params);
        return rows; // Return the updated inventory IDs
      },
      3, // Retry up to 3 times
      1000 // Initial delay of 1 second (exponential backoff applied)
    );
  }
  
  return []; // Return empty array if no updates were made
};

module.exports = {
  getInventories,
  getInventoryIdByProductId,
  insertInventoryRecords,
  updateInventoryQuantity,
};
