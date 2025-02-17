const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

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
 * Checks if any product_id or identifier exists for the given location_id.
 * @param {Array} inventoryItems - List of inventory objects [{ location_id, product_id, identifier }]
 * @returns {Promise<Array>} - List of existing items [{ location_id, product_id, identifier }]
 */
const checkInventoryExists = async (inventoryItems) => {
  if (!inventoryItems || inventoryItems.length === 0) return [];
  
  // Extract unique location_id + product_id / identifier combinations
  const values = [];
  const conditions = inventoryItems.map(({ location_id, product_id, identifier }) => {
    values.push(location_id);
    if (product_id) {
      values.push(product_id);
      return `(location_id = $${values.length - 1} AND product_id = $${values.length})`;
    } else {
      values.push(identifier);
      return `(location_id = $${values.length - 1} AND identifier = $${values.length})`;
    }
  });
  
  const queryText = `
    SELECT location_id, product_id, identifier
    FROM inventory
    WHERE ${conditions.join(" OR ")}
  `;
  
  try {
    const { rows } = await query(queryText, values);
    return rows; // ✅ Return all existing inventory records
  } catch (error) {
    logError("🚨 Error checking inventory existence:", error);
    throw error;
  }
};

/**
 * Inserts inventory records with `product_id` (Products).
 * @param {Array} productEntries - List of inventory objects with `product_id`
 * @returns {Promise<Array>} - List of inserted product records
 */
const insertProducts = async (productEntries) => {
  if (!productEntries.length) return [];
  
  const productPlaceholders = productEntries
    .map((_, index) => `(
      $${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, NULL,
      $${index * 6 + 4}, NOW(), $${index * 6 + 5}, NOW(), NOW(), $${index * 6 + 6}, NULL, NULL, NULL
    )`)
    .join(",");
  
  const productQuery = `
    INSERT INTO inventory (
      product_id, location_id, item_type, identifier, quantity, inbound_date,
      status_id, status_date, created_at, created_by, updated_at, updated_by, last_update
    )
    VALUES
      ${productPlaceholders}
    ON CONFLICT (location_id, product_id) DO NOTHING
    RETURNING id, product_id, identifier, quantity, status_id, created_at;
  `;
  
  const productValues = productEntries.flatMap(({ product_id, location_id, type, quantity, status_id, created_by }) => [
    product_id, location_id, type, quantity, status_id, created_by
  ]);
  
  console.log("🟢 productValues:", productValues);
  
  try {
    const { rows } = await query(productQuery, productValues);
    return rows;
  } catch (error) {
    logError("🚨 Error inserting product inventory records:", error);
    throw error;
  }
};

/**
 * Inserts inventory records without `product_id` (Non-Products: raw materials, packaging, samples, etc.).
 * @param {Array} otherEntries - List of inventory objects without `product_id`
 * @returns {Promise<Array>} - List of inserted non-product records
 */
const insertNonProducts = async (otherEntries) => {
  if (!otherEntries.length) return [];
  
  const otherPlaceholders = otherEntries
    .map((_, index) => `(
      NULL, $${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3},
      $${index * 6 + 4}, NOW(), $${index * 6 + 5}, NOW(), NOW(), $${index * 6 + 6}, NULL, NULL, NULL
    )`)
    .join(",");
  
  const otherQuery = `
    INSERT INTO inventory (
      product_id, location_id, item_type, identifier, quantity, inbound_date,
      status_id, status_date, created_at, created_by, updated_at, updated_by, last_update
    )
    VALUES
      ${otherPlaceholders}
    ON CONFLICT (location_id, identifier) DO NOTHING
    RETURNING id, product_id, identifier, quantity, status_id, created_at;
  `;
  
  const otherValues = otherEntries.flatMap(({ location_id, type, identifier, quantity, status_id, created_by }) => [
    location_id, type, identifier, quantity, status_id, created_by
  ]);
  
  console.log("🟢 otherValues:", otherValues);
  
  try {
    const { rows } = await query(otherQuery, otherValues);
    return rows;
  } catch (error) {
    logError("🚨 Error inserting non-product inventory records:", error);
    throw error;
  }
};

/**
 * Main function to check for existing inventory and insert new records.
 * @param {Array} inventoryData - List of inventory objects [{ location_id, product_id, identifier, quantity, status_id, created_by }]
 * @returns {Promise<Object>} - Response with inserted records
 */
const insertInventoryRecords = async (inventoryData) => {
  if (!inventoryData || (Array.isArray(inventoryData) && inventoryData.length === 0)) {
    logError("❌ No inventory data to insert.");
    return { success: false, message: "No inventory data provided." };
  }
  
  // Ensure inventoryData is always an array
  const inventoryArray = Array.isArray(inventoryData) ? inventoryData : [inventoryData];
  
  // ✅ Step 1: Check Existing Inventory
  const existingItems = await checkInventoryExists(inventoryArray);
  console.log("🔍 Existing Inventory:", existingItems);
  
  // ✅ Step 2: Filter Out Existing Items Before Insert
  const newItems = inventoryArray.filter(
    ({ location_id, product_id, identifier }) =>
      !existingItems.some(
        (item) =>
          item.location_id === location_id &&
          (
            (product_id !== null && item.product_id === product_id) ||
            (identifier !== null && item.identifier === identifier)
          )
      )
  );
  
  if (newItems.length === 0) {
    console.log("⚠️ No new inventory to insert, all items already exist.");
    return { success: false, message: "No new records to insert." };
  }
  
  // ✅ Step 3: Separate Products & Other Types
  const productEntries = newItems.filter(e => e.product_id);
  const otherEntries = newItems.filter(e => !e.product_id && e.identifier);
  
  // ✅ Step 4: Insert Products & Other Types
  const productResults = await insertProducts(productEntries);
  const otherTypeResults = await insertNonProducts(otherEntries);
  
  return {
    success: true,
    inserted_records: [...productResults, ...otherTypeResults],
  };
};

module.exports = {
  getInventories,
  getInventoryIdByProductId,
  insertInventoryRecords,
};
