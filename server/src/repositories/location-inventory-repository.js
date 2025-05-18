const {
  query,
  paginateResults,
  retry,
  bulkInsert,
  lockRow,
  formatBulkUpdateQuery,
} = require('../database/db');
const AppError = require('../utils/AppError');
const {
  logSystemException,
  logSystemInfo
} = require('../utils/system-logger');
const { logInfo, logError, logWarn } = require('../utils/logger-helper');
const { buildLocationInventoryWhereClause } = require('../utils/sql/build-location-inventory-filters');

/**
 * Fetches high-level location inventory records with support for:
 * pagination, dynamic filters, and sorting.
 *
 * Handles both product-based and packaging material–based inventory entries.
 * Applies system-defined filters (e.g., non-zero quantity) and user-provided filters
 * such as SKU, lot number, product/material name, dates, and status.
 *
 * @param {Object} options - Query parameters
 * @param {number} [options.page=1] - Current page number (1-based)
 * @param {number} [options.limit=10] - Number of records per page
 * @param {Object} [options.filters={}] - Filtering options
 * @param {string} [options.sortBy='createdAt'] - Field key to sort by (mapped internally to SQL column)
 * @param {string} [options.sortOrder='DESC'] - Sorting order: ASC or DESC
 *
 * @returns {Promise<{ data: Array<Object>, pagination: { page: number, limit: number, totalRecords: number, totalPages: number } }>}
 * Returns paginated inventory rows and metadata.
 */
const getHighLevelLocationInventorySummary = async ({
                                                      page = 1,
                                                      limit = 10,
                                                      filters = {},
                                                      sortBy = 'expiryDate',
                                                      sortOrder = 'DESC',
                                                    } = {}) => {
  const joins = [
    'LEFT JOIN locations l ON li.location_id = l.id',
    'LEFT JOIN batch_registry br ON li.batch_id = br.id',
    'LEFT JOIN product_batches pb ON br.product_batch_id = pb.id',
    'LEFT JOIN skus s ON pb.sku_id = s.id',
    'LEFT JOIN products p ON s.product_id = p.id',
    'LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id',
    'LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id',
    'LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id',
  ];
  
  const { whereClause, params } = buildLocationInventoryWhereClause(filters);
  
  const tableName = 'location_inventory li';
  
  const queryText = `
    SELECT
      CASE
        WHEN br.batch_type = 'product' THEN s.id
        WHEN br.batch_type = 'packaging_material' THEN pm.id
        ELSE NULL
      END AS item_id,
      br.batch_type AS item_type,
      CASE
        WHEN br.batch_type = 'product' THEN s.country_code
        ELSE NULL
      END AS country_code,
      CASE
        WHEN br.batch_type = 'product' THEN s.size_label
        ELSE NULL
      END AS size_label,
      CASE
        WHEN br.batch_type = 'product' THEN p.name
        ELSE NULL
      END AS product_name,
      CASE
        WHEN br.batch_type = 'packaging_material' THEN pmb.material_snapshot_name
        ELSE NULL
      END AS material_name,
      COUNT(DISTINCT li.batch_id) AS total_lots,
      SUM(li.location_quantity) AS total_quantity,
      SUM(li.location_quantity - li.reserved_quantity) AS available_quantity,
      SUM(li.reserved_quantity) AS reserved_quantity,
      MIN(
        CASE
          WHEN br.batch_type = 'product' THEN pb.manufacture_date
          WHEN br.batch_type = 'packaging_material' THEN pmb.manufacture_date
          ELSE NULL
        END
      ) AS earliest_manufacture_date,
      MIN(
        CASE
          WHEN br.batch_type = 'product' THEN pb.expiry_date
          WHEN br.batch_type = 'packaging_material' THEN pmb.expiry_date
          ELSE NULL
        END
      ) AS nearest_expiry_date,
      MAX(li.created_at) AS created_at
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
    GROUP BY
      br.batch_type,
      s.id, p.id,
      pm.id, pmb.material_snapshot_name
  `;
  
  try {
    logSystemInfo('Fetching location inventory summary', {
      context: 'location-inventory-repository/getHighLevelLocationInventorySummary',
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    return await paginateResults({
      dataQuery: queryText,
      params,
      page,
      limit,
      meta: {
        context: 'location-inventory-repository/getHighLevelLocationInventorySummary',
        filters,
      },
    });
  } catch (error) {
    logSystemException(error, 'Error fetching location inventory summary', {
      context: 'location-inventory-repository/getHighLevelLocationInventorySummary',
      filters,
    });
    throw AppError.databaseError('Failed to fetch location inventory summary');
  }
};

/**
 * Fetches the inventory ID associated with a given product ID.
 *
 * @param {string} productId - The unique identifier of the product.
 * @param {string} [identifier] - An optional identifier for additional filtering.
 * @param {object} client - The database client instance.
 * @returns {Promise<string|null>} - Returns the inventory ID if found, otherwise null.
 */
const getInventoryId = async (productId, identifier, client) => {
  let queryText;
  let params = [];

  if (productId) {
    queryText = `
      SELECT id AS inventory_id
      FROM inventory
      WHERE product_id = $1
      LIMIT 1;
    `;
    params = [productId];
  } else if (identifier) {
    queryText = `
      SELECT id AS inventory_id
      FROM inventory
      WHERE identifier = $1
      LIMIT 1;
    `;
    params = [identifier];
  } else {
    return null; // No valid input provided
  }

  try {
    const { rows } = await query(queryText, params, client);
    return rows.length > 0 ? rows[0].inventory_id : null;
  } catch (error) {
    logError('Error fetching inventory ID:', error);
    throw AppError.databaseError('Database query failed');
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
    SELECT id, location_id, product_id, identifier
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
    productIds.size > 0 ? Array.from(productIds) : null, // Ensure it does not pass an empty array
  ];

  try {
    const { rows } = await query(queryText, params);
    return rows;
  } catch (error) {
    logError('Error checking inventory existence:', error);
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
const checkAndLockInventory = async (client, inventoryItems, lockMode) => {
  if (!inventoryItems || inventoryItems.length === 0) return [];

  // Step 1: Check existing inventory
  const existingInventory = await checkInventoryExists(inventoryItems);

  if (existingInventory.length === 0) {
    logWarn('No existing inventory records found. Proceeding with inserts.');
    return [];
  }

  logInfo(`Locking ${existingInventory.length} existing inventory records...`);

  // Step 2: Lock existing rows
  const lockedRecords = [];
  for (const item of existingInventory) {
    const table = 'inventory'; // Inventory table
    let inventoryId = null;

    if (item.product_id) {
      // Use product_id directly to find inventory
      inventoryId = item.id;
    } else if (item.identifier) {
      inventoryId = item.id;
    }

    // Ensure inventoryId is valid before proceeding
    if (!inventoryId) {
      logError(`Invalid inventory ID for item:`, item);
      continue; // Skip if inventoryId is still null
    }

    // Now lock the row using inventoryId
    try {
      const lockedRow = await lockRow(client, table, inventoryId, lockMode);
      lockedRecords.push(lockedRow.id);
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
 * @param {Object} client - Database transaction object.
 * @param {Array<Object>} productEntries - Array of inventory objects containing `product_id` and other relevant fields.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of inserted inventory records.
 */
const insertProducts = async (client, productEntries) => {
  if (!Array.isArray(productEntries) || productEntries.length === 0) return [];

  const columns = [
    'product_id',
    'location_id',
    'item_type',
    'identifier',
    'quantity',
    'inbound_date',
    'status_id',
    'status_date',
    'created_at',
    'created_by',
    'updated_at',
    'updated_by',
    'last_update',
  ];

  // Prepare rows for insertion
  const rows = productEntries.map(
    ({ product_id, location_id, item_type, status_id, userId }) => [
      product_id,
      location_id,
      item_type,
      null,
      0,
      new Date(),
      status_id,
      new Date(),
      new Date(),
      userId,
      null,
      null,
      null,
    ]
  );

  try {
    // Step 1: Insert into inventory table (Ignore if conflict exists)
    return (
      (await bulkInsert(
        'inventory',
        columns,
        rows,
        ['location_id', 'product_id'], // Conflict columns
        [] // DO NOTHING on conflict
      )) || []
    );
  } catch (error) {
    logError('Error inserting product inventory records:', error);
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
  if (!Array.isArray(otherEntries) || otherEntries.length === 0) return [];

  const columns = [
    'product_id',
    'location_id',
    'item_type',
    'identifier',
    'quantity',
    'inbound_date',
    'status_id',
    'status_date',
    'created_at',
    'created_by',
    'updated_at',
    'updated_by',
    'last_update',
  ];

  const rows = otherEntries.map(
    ({ location_id, type, identifier, status_id, userId }) => [
      null,
      location_id,
      type,
      identifier,
      0,
      new Date(),
      status_id,
      new Date(),
      new Date(),
      userId,
      null,
      null,
      null,
    ]
  );

  try {
    return (
      (await bulkInsert(
        'inventory',
        columns,
        rows,
        ['location_id', 'identifier'], // Conflict columns for non-product items
        [] // DO NOTHING on conflict
      )) || []
    );
  } catch (error) {
    logError('Error inserting non-product inventory records:', error);
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
  if (!Array.isArray(inventoryData) || inventoryData.length === 0) {
    logError('No inventory data to insert.');
    return {
      success: false,
      message: 'No inventory data provided.',
      inventoryRecords: [],
    };
  }

  try {
    // Step 1: Separate Products & Other Inventory Types
    const productEntries = inventoryData
      .filter((item) => item.type === 'product' && item.product_id)
      .map((e) => ({ ...e, item_type: 'product' }));

    const otherEntries = inventoryData
      .filter((item) => item.type !== 'product' && item.identifier)
      .map((e) => ({ ...e, item_type: e.type }));

    // Step 2: Insert New Inventory Records
    const productResults =
      productEntries.length > 0
        ? await retry(() => insertProducts(client, productEntries), 3, 1000)
        : [];

    const otherTypeResults =
      otherEntries.length > 0
        ? await retry(() => insertNonProducts(client, otherEntries), 3, 1000)
        : [];

    // Step 3: Ensure inventoryRecords is always an array
    const inventoryRecords = [...productResults, ...otherTypeResults];

    return { success: true, inventoryRecords };
  } catch (error) {
    logError('Error inserting inventory records:', error);
    return {
      success: false,
      message: 'Failed to insert inventory records',
      error: error.message,
      inventoryRecords: [],
    };
  }
};

/**
 * Retrieves product IDs and identifiers based on an array of inventory IDs.
 *
 * @param {object} client - The database client instance.
 * @param {Array<{id: string}>} newInventoryIds - An array of objects containing inventory IDs.
 * @returns {Promise<Array<{id: string, product_id: string, identifier: string | null}>>}
 *          - Returns an array of inventory records with `id`, `product_id`, and `identifier`, or an empty array if no records are found.
 * @throws {AppError} - Throws an error if the database query fails.
 */
const getProductIdOrIdentifierByInventoryIds = async (
  client,
  newInventoryIds
) => {
  if (!Array.isArray(newInventoryIds) || newInventoryIds.length === 0)
    return [];

  const flatIds = newInventoryIds.map((obj) => obj.id);

  if (flatIds.length === 0) return []; // No valid UUIDs found

  const queryText = `
    SELECT id , product_id, identifier
    FROM inventory
    WHERE id = ANY($1);
  `;

  try {
    const { rows } = await client.query(queryText, [flatIds]);
    return rows;
  } catch (error) {
    logError('Error fetching inventory IDs:', error);
    throw AppError.databaseError(
      'Database query failed to fetch inventory IDs'
    );
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
  const columnTypes = {
    quantity: 'integer',
  };

  const { baseQuery, params } = await formatBulkUpdateQuery(
    'inventory',
    ['quantity'],
    ['id'],
    inventoryUpdates,
    userId,
    columnTypes
  );

  if (baseQuery) {
    return await retry(
      async () => {
        const { rows } = await query(baseQuery, params, client);

        return rows; // Return the updated inventory IDs
      },
      3, // Retry up to 3 times
      1000 // Initial delay of 1 second (exponential backoff applied)
    );
  }

  return []; // Return an empty array if no updates were made
};

module.exports = {
  getHighLevelLocationInventorySummary,
  getInventoryId,
  checkInventoryExists,
  checkAndLockInventory,
  insertInventoryRecords,
  getProductIdOrIdentifierByInventoryIds,
  updateInventoryQuantity,
};
