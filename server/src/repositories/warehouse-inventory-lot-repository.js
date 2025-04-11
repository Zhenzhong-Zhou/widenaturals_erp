const {
  query,
  withTransaction,
  lockRow,
  bulkInsert,
  retry,
  getStatusValue,
} = require('../database/db');
const AppError = require('../utils/AppError');
const { logError, logWarn, logInfo } = require('../utils/logger-helper');
const {
  bulkInsertInventoryActivityLogs,
} = require('./inventory-activity-log-repository');
const { getActionTypeId } = require('./inventory-action-type-repository');
const {
  bulkInsertInventoryHistory,
} = require('./inventory-history-repository');
const { getWarehouseLotStatus } = require('./warehouse-lot-status-repository');
const { generateChecksum } = require('../utils/crypto-utils');
const {
  getWarehouseLotAdjustmentType,
} = require('./lot-adjustment-type-repository');
const {
  bulkInsertWarehouseLotAdjustments,
} = require('./warehouse-lot-adjustment-repository');

/**
 * Checks if a lot exists in the warehouse inventory and locks it for update.
 * @param {string} warehouse_inventory_id - The ID of the warehouse inventory lot.
 * @param {boolean} lockForUpdate - Whether to apply FOR UPDATE locking (default: false)
 * @param client
 * @returns {Promise<Object>} - Lot details including quantity, status_id, manufacture_date, expiry_date
 * @throws {Error} If the lot is not found
 */
const checkLotExists = async (
  warehouse_inventory_id,
  lockForUpdate = false,
  client
) => {
  try {
    if (lockForUpdate) {
      // Use lockRow for safe row locking
      return await lockRow(
        client,
        'warehouse_inventory_lots',
        warehouse_inventory_id,
        'FOR UPDATE'
      );
    }

    // Fetch without locking
    const text = `
      SELECT id, warehouse_id, product_id, lot_number, quantity, reserved_qty, status_id, manufacture_date, expiry_date
      FROM warehouse_inventory_lots
      WHERE id = $1
    `;
    const { rows } = await query(text, [warehouse_inventory_id], client);

    if (!rows.length)
      throw AppError.notFoundError(
        `Lot with ID ${warehouse_inventory_id} not found.`
      );

    return rows[0];
  } catch (error) {
    throw AppError.databaseError(
      `Error checking warehouse lot: ${error.message}`
    );
  }
};

/**
 * Adjusts warehouse inventory based on lot adjustments.
 * @param {Array} records - List of inventory adjustments.
 * @param {String} user_id - The user making the adjustment.
 * @returns {Promise<Array>} - List of adjusted records.
 */
const adjustWarehouseInventoryLots = async (records, user_id) => {
  return withTransaction(async (client) => {
    const adjustedRecords = [];

    // Prepare batch insert arrays
    const warehouseLotAdjustments = [];
    const inventoryActivityLogs = [];
    const inventoryHistoryLogs = [];

    for (const record of records) {
      const {
        warehouse_inventory_id,
        adjustment_type_id,
        adjusted_quantity,
        comments,
        order_id,
      } = record;

      // Lock the existing lot and get details
      const existingLot = await checkLotExists(
        warehouse_inventory_id,
        true,
        client
      );
      const {
        warehouse_id,
        inventory_id,
        lot_number,
        quantity: previous_quantity,
        reserved_quantity,
        status_id,
      } = existingLot;
      const statusName = await getWarehouseLotStatus(client, { id: status_id });

      const new_quantity = previous_quantity + adjusted_quantity;
      if (new_quantity < 0) {
        throw AppError.validationError(
          `Stock adjustment for lot ${lot_number} would result in negative stock.`
        );
      }

      // Fetch warehouse inventory reserved and available quantities
      const { rows: warehouseInventoryRows } = await client.query(
        `
        SELECT reserved_quantity, available_quantity
        FROM warehouse_inventory
        WHERE warehouse_id = $1 AND inventory_id = $2 FOR UPDATE`,
        [warehouse_id, inventory_id]
      );

      if (!warehouseInventoryRows.length) {
        throw AppError.notFoundError(
          `Warehouse inventory record not found for warehouse ${warehouse_id} and inventory ${inventory_id}`
        );
      }

      let { available_quantity } = warehouseInventoryRows[0];

      // Prevent over-adjustment: available_quantity should NEVER go below 0
      let updated_available_quantity = available_quantity + adjusted_quantity;
      if (updated_available_quantity < 0) {
        throw AppError.validationError(
          `Adjustment not allowed: Available stock cannot be negative. Current available: ${available_quantity}, Adjustment: ${adjusted_quantity}`
        );
      }

      // Update warehouse inventory quantities (reserved_quantity remains unchanged)
      await client.query(
        `
        UPDATE warehouse_inventory
        SET available_quantity = GREATEST(0, $1),
            updated_at = NOW(),
            updated_by = $2
        WHERE warehouse_id = $3 AND inventory_id = $4`,
        [updated_available_quantity, user_id, warehouse_id, inventory_id]
      );

      // Restrict Adjustments Based on Lot Status
      if (
        ['shipped', 'expired', 'sold_out'].includes(statusName) ||
        (statusName === 'out_of_stock' && adjusted_quantity < 0)
      ) {
        throw AppError.validationError(
          `Cannot adjust quantity for ${statusName} lots.`
        );
      }

      // Determine New Status for Warehouse Lot
      let new_status_id = status_id;
      const totalEffectiveStock = new_quantity + (reserved_quantity ?? 0);
      if (totalEffectiveStock === 0) {
        const { id } = await getWarehouseLotStatus(client, {
          name: 'out_of_stock',
        });
        new_status_id = id;
      } else if (totalEffectiveStock > 0 && statusName !== 'in_stock') {
        const { id } = await getWarehouseLotStatus(client, {
          name: 'in_stock',
        });
        new_status_id = id;
      }

      // Update Warehouse Inventory Lot
      await client.query(
        `
        UPDATE warehouse_inventory_lots
        SET quantity = $1,
            status_id = $2,
            updated_at = NOW(),
            updated_by = $3
        WHERE id = $4`,
        [new_quantity, new_status_id, user_id, warehouse_inventory_id]
      );

      // Determine Warehouse Inventory Status Based on Lot Availability
      const { rows: warehouseStatusRows } = await client.query(
        `
        SELECT
          COALESCE(SUM(wil.quantity), 0) AS total_lot_quantity,
          COALESCE(SUM(wil.reserved_quantity), 0) AS total_lot_reserved
        FROM warehouse_inventory wi
        LEFT JOIN warehouse_inventory_lots wil
          ON wi.warehouse_id = wil.warehouse_id
          AND wi.inventory_id = wil.inventory_id
        WHERE wi.inventory_id = $1
        GROUP BY wi.inventory_id`,
        [inventory_id]
      );

      let warehouse_total_stock =
        warehouseStatusRows[0]?.total_lot_quantity || 0;
      let warehouse_total_reserved =
        warehouseStatusRows[0]?.total_lot_reserved || 0;

      let warehouse_new_status =
        warehouse_total_stock === 0 && warehouse_total_reserved === 0
          ? await getWarehouseLotStatus(client, { name: 'out_of_stock' })
          : await getWarehouseLotStatus(client, { name: 'in_stock' });

      // Update Warehouse Inventory Status
      await client.query(
        `
        UPDATE warehouse_inventory
        SET status_id = $1, last_update = NOW(), updated_at = NOW(), updated_by = $2
        WHERE warehouse_id = $3 AND inventory_id = $4`,
        [warehouse_new_status.id, user_id, warehouse_id, inventory_id]
      );

      // Determine Global Inventory Status
      const { rows: inventoryStatusRows } = await client.query(
        `
        SELECT SUM(available_quantity) AS total_available, SUM(reserved_quantity) AS total_reserved
        FROM warehouse_inventory WHERE inventory_id = $1`,
        [inventory_id]
      );

      let inventory_total_available =
        inventoryStatusRows[0]?.total_available || 0;
      let inventory_total_reserved =
        inventoryStatusRows[0]?.total_reserved || 0;

      let inventory_new_status =
        inventory_total_available === 0 && inventory_total_reserved === 0
          ? await getWarehouseLotStatus(client, { name: 'out_of_stock' })
          : await getWarehouseLotStatus(client, { name: 'in_stock' });

      // Update Inventory Status
      await client.query(
        `
        UPDATE inventory
        SET status_id = $1, last_update = NOW(), updated_at = NOW(), updated_by = $2
        WHERE id = $3`,
        [inventory_new_status.id, user_id, inventory_id]
      );

      // Log Adjustments
      adjustedRecords.push({
        warehouse_inventory_id,
        warehouse_id,
        inventory_id,
        lot_number,
        new_quantity,
      });

      const actionType = 'manual_adjustment';
      const actionTypeId = await getActionTypeId(client, actionType);

      const adjustmentType = await getWarehouseLotAdjustmentType(client, {
        id: adjustment_type_id,
      });

      // Ensure the adjustment type exists and check the type name
      if (!adjustmentType) {
        logWarn(
          `Skipping adjustment: Type ID ${adjustment_type_id} not found.`
        );
        continue; // Skip this entry if the adjustment type is not valid
      }

      // Define valid adjustment types that should be recorded
      const validAdjustmentTypes = [
        'damaged',
        'lost',
        'defective',
        'expired',
        'stolen',
        'recalled',
        'adjustment',
        'reclassified',
        'conversion',
      ];

      // Check if adjustment type requires logging
      if (validAdjustmentTypes.includes(adjustmentType.name.toLowerCase())) {
        warehouseLotAdjustments.push({
          warehouse_inventory_id,
          adjustment_type_id,
          previous_quantity,
          adjusted_quantity,
          new_quantity,
          status_id: new_status_id,
          adjusted_by: user_id,
          adjustment_date: new Date(),
          comments: comments || null,
        });
      } else {
        logInfo(
          `Skipping adjustment: Type "${adjustmentType.name}" does not require logging.`
        );
      }

      inventoryActivityLogs.push({
        inventory_id,
        warehouse_id,
        lot_id: warehouse_inventory_id,
        inventory_action_type_id: actionTypeId,
        previous_quantity: previous_quantity ?? 0,
        quantity_change: adjusted_quantity ?? 0,
        new_quantity: new_quantity ?? 0,
        status_id: new_status_id,
        adjustment_type_id: adjustment_type_id || null,
        order_id: order_id || null,
        user_id,
        timestamp: new Date(), // Automatically add timestamp
        comments: comments || null,
      });

      const checksum = generateChecksum(
        inventory_id,
        actionTypeId,
        previous_quantity,
        adjusted_quantity,
        new_quantity,
        new_status_id,
        user_id,
        comments
      );

      inventoryHistoryLogs.push({
        inventory_id,
        inventory_action_type_id: actionTypeId,
        previous_quantity: previous_quantity ?? 0,
        quantity_change: adjusted_quantity ?? 0,
        new_quantity: new_quantity ?? 0,
        status_id: new_status_id,
        status_date: new Date(), // Automatically set timestamp
        source_action_id: user_id,
        comments: comments || null,
        checksum: checksum || null,
        metadata: {}, // Empty object instead of '{}'
        created_at: new Date(),
        created_by: user_id,
      });
    }

    // Bulk Inserts
    if (warehouseLotAdjustments.length > 0) {
      await bulkInsertWarehouseLotAdjustments(warehouseLotAdjustments, client);
    }

    if (inventoryActivityLogs.length > 0) {
      await bulkInsertInventoryActivityLogs(inventoryActivityLogs, client);
    }

    if (inventoryHistoryLogs.length > 0) {
      await bulkInsertInventoryHistory(inventoryHistoryLogs, client);
    }

    return adjustedRecords;
  });
};

/**
 * Checks the existence of inventory lots in specified warehouses based on various criteria.
 *
 * @param {object} client - The database client instance.
 * @param {string[]} warehouseIds - An array of warehouse IDs.
 * @param {Array<{ inventory_id: string }>} inventoryData - An array of objects containing inventory IDs.
 * @param {Array<{
 *   lot_number: string,
 *   manufacture_date: string | null,
 *   expiry_date: string | null,
 *   type: string
 * }>} lotDetailsArray - An array of objects containing lot details.
 * @returns {Promise<Array<{
 *   warehouse_id: string,
 *   inventory_id: string,
 *   lot_number: string,
 *   manufacture_date: string | null,
 *   expiry_date: string | null,
 *   id: string
 * }>>} - Returns an array of warehouse inventory lot records matching the criteria, or an empty array if none are found.
 * @throws {AppError} - Throws an error if the database query fails.
 */
const checkWarehouseInventoryLotExists = async (
  client,
  warehouseIds,
  inventoryData,
  lotDetailsArray
) => {
  if (
    !Array.isArray(warehouseIds) ||
    warehouseIds.length === 0 ||
    !Array.isArray(inventoryData) ||
    inventoryData.length === 0 ||
    !Array.isArray(lotDetailsArray) ||
    lotDetailsArray.length === 0
  ) {
    return [];
  }

  // Extract inventory IDs from inventoryData objects
  const inventoryIds = inventoryData
    .map(({ inventory_id }) => inventory_id)
    .filter(Boolean);

  // Extract lot details
  const lotNumbers = lotDetailsArray
    .map((lot) => lot.lot_number)
    .filter(Boolean);
  const manufactureDates = lotDetailsArray
    .map((lot) => lot.manufacture_date)
    .filter(Boolean);
  const expiryDates = lotDetailsArray
    .map((lot) => lot.expiry_date)
    .filter(Boolean);
  const itemTypes = lotDetailsArray.map((lot) => lot.type).filter(Boolean);

  const queryText = `
    SELECT warehouse_id, inventory_id, lot_number, manufacture_date, expiry_date, id
    FROM warehouse_inventory_lots
    WHERE warehouse_id = ANY($1::uuid[])
    AND inventory_id = ANY($2::uuid[])
    AND lot_number = ANY($3::text[])
    AND (
      (inventory_id IS NOT NULL AND 'product' = ANY($6::text[])
        AND (array_length($4::date[], 1) IS NULL OR manufacture_date = ANY($4::date[]))
        AND (array_length($5::date[], 1) IS NULL OR expiry_date = ANY($5::date[]))
      )
      OR (inventory_id IS NOT NULL AND 'product' != ANY($6::text[]))
    );
  `;

  const params = [
    warehouseIds,
    inventoryIds,
    lotNumbers.length > 0 ? lotNumbers : null,
    manufactureDates.length > 0 ? manufactureDates : null,
    expiryDates.length > 0 ? expiryDates : null,
    itemTypes.length > 0 ? itemTypes : null,
  ];

  try {
    const { rows } = await client.query(queryText, params);
    return rows;
  } catch (error) {
    logError('Error checking warehouse inventory lots:', error);
    throw AppError.databaseError('Database query failed');
  }
};

/**
 * Inserts warehouse inventory lot records in bulk with conflict handling and retry mechanism.
 *
 *  @param {import("pg").PoolClient} client - The PostgreSQL client instance (transaction).
 * @param {Array<Object>} warehouseLots - The list of warehouse lot entries to insert.
 * @param {string} warehouseLots[].warehouse_id - The ID of the warehouse.
 * @param {string} warehouseLots[].inventory_id - The ID of the inventory item.
 * @param {string} warehouseLots[].lot_number - The lot number for tracking.
 * @param {number} warehouseLots[].quantity - The quantity associated with the lot.
 * @param {Date|null} [warehouseLots[].expiry_date] - The expiration date of the lot (nullable).
 * @param {Date|null} [warehouseLots[].manufacture_date] - The manufacturing date of the lot (nullable).
 * @param {string} warehouseLots[].status_id - The status ID of the lot.
 * @param {string} warehouseLots[].created_by - The user ID of the creator.
 *
 * @returns {Promise<Array<Object>>} - Resolves with the inserted warehouse inventory lot records.
 * @throws {Error} - Throws an error if the bulk insert fails after retries.
 */
const insertWarehouseInventoryLots = async (client, warehouseLots) => {
  if (!Array.isArray(warehouseLots) || warehouseLots.length === 0) {
    return [];
  }

  try {
    const columns = [
      'warehouse_id',
      'inventory_id',
      'lot_number',
      'quantity',
      'reserved_quantity',
      'expiry_date',
      'manufacture_date',
      'outbound_date',
      'status_id',
      'created_by',
      'updated_at',
      'updated_by',
    ];

    const rows = warehouseLots.map(
      ({
        warehouse_id,
        inventory_id,
        lot_number,
        quantity,
        reserved_quantity,
        expiry_date,
        manufacture_date,
        status_id,
        created_by,
      }) => [
        warehouse_id,
        inventory_id,
        lot_number,
        quantity,
        reserved_quantity,
        expiry_date,
        manufacture_date,
        null,
        status_id,
        created_by,
        null,
        null,
      ]
    );

    // Step 1: Bulk Insert with Retry and Conflict Handling
    return await retry(
      () =>
        bulkInsert(
          'warehouse_inventory_lots',
          columns,
          rows,
          ['warehouse_id', 'inventory_id', 'lot_number'], // Conflict columns
          [], // DO NOTHING on conflict
          client
        ),
      3, // Retries up to 3 times
      1000 // Initial delay of 1s, with exponential backoff
    );
  } catch (error) {
    logError('Error inserting warehouse inventory lots:', error);
    throw AppError.databaseError('Failed to insert warehouse inventory lots.', {
      details: { error: error.message, warehouseLots },
    });
  }
};

const updateStatus = async () => {
  const text = `
  WITH inventory_status_update AS (
      SELECT
        i.id AS inventory_id,
        COALESCE(
          (
            SELECT wls.id FROM warehouse_inventory_lots wil
            JOIN warehouse_lot_status wls ON wil.status_id = wls.id
            WHERE wil.inventory_id = i.id
            ORDER BY
              CASE
                WHEN wls.name = 'expired' THEN 1
                WHEN wls.name = 'suspended' THEN 2
                WHEN wls.name = 'unavailable' THEN 3
                WHEN wls.name = 'in_stock' THEN 4  -- Ensure in_stock gets selected if no other higher-priority status
                ELSE 5
              END
            LIMIT 1
          ),
          (
            SELECT wls.id FROM warehouse_inventory_lots wil
            JOIN warehouse_lot_status wls ON wil.status_id = wls.id
            WHERE wil.inventory_id = i.id AND wls.name = 'in_stock'
            LIMIT 1
          ),
          (
            SELECT wls.id FROM warehouse_lot_status wls WHERE wls.name = 'unassigned' LIMIT 1
          )
        ) AS correct_status_id
      FROM inventory i
    )
    UPDATE inventory i
    SET status_id = isu.correct_status_id
    FROM inventory_status_update isu
    WHERE i.id = isu.inventory_id;
    `;
};

/**
 * Retrieves the most suitable inventory lot for allocation based on the chosen strategy (FIFO or FEFO).
 *
 * @param {string} productId - The ID of the product to allocate.
 * @param {string} warehouseId - The ID of the warehouse to check.
 * @param {number} quantityNeeded - The required quantity to allocate.
 * @param {'FIFO' | 'FEFO'} [strategy='FEFO'] - The allocation strategy:
 *        - 'FIFO': First In, First Out (based on inbound_date)
 *        - 'FEFO': First Expired, First Out (based on expiry_date)
 * @param {import('pg').PoolClient} [client] - Optional PostgreSQL client for transactional execution.
 * @returns {Promise<object | null>} The best available lot for allocation, or null if none found.
 */
const getAvailableLotForAllocation = async (
  productId,
  warehouseId,
  quantityNeeded,
  strategy = 'FEFO',
  client
) => {
  const orderBy =
    strategy === 'FEFO' ? 'wil.expiry_date ASC' : 'wil.inbound_date ASC';

  const sql = `
    SELECT wil.*
    FROM warehouse_inventory_lots wil
    JOIN inventory i ON wil.inventory_id = i.id
    JOIN products p ON i.product_id = p.id
    JOIN warehouses w ON wil.warehouse_id = w.id
    WHERE i.product_id = $1
      AND wil.warehouse_id = $2
      AND (wil.quantity - COALESCE(wil.reserved_quantity, 0)) >= $3
      AND wil.status_id = (
        SELECT id FROM warehouse_lot_status WHERE LOWER(name) = 'in_stock' LIMIT 1
      )
      AND p.status_id = (
        SELECT id FROM status WHERE LOWER(name) = 'active' LIMIT 1
      )
      AND w.status_id = (
        SELECT id FROM status WHERE LOWER(name) = 'active' LIMIT 1
      )
    ORDER BY ${orderBy}
    LIMIT 1;
  `;

  try {
    const result = await retry(() =>
      query(sql, [productId, warehouseId, quantityNeeded], client)
    );
    return result.rows[0] || null;
  } catch (error) {
    logError('Error fetching available lot for allocation:', error);
    throw AppError.databaseError(
      'Failed to fetch available lot for allocation'
    );
  }
};

/**
 * Updates quantity for a warehouse inventory lot.
 *
 * @param {Object} params
 * @param {string} params.lotId - ID of the warehouse_inventory_lot.
 * @param {number} params.quantityDelta - Positive (add) or negative (subtract) value to update quantity.
 * @param {number} [reservedDelta] - Change in reserved quantity
 * @param {string} [params.statusName] - New status name (e.g., 'allocated', 'fulfilled', 'returned') if needed.
 * @param {string} params.userId - User performing the update.
 * @param {*} client - PostgreSQL client (transactional).
 * @returns {Promise<object>} Updated lot record.
 */
const updateWarehouseInventoryLotQuantity = async (
  { lotId, quantityDelta = 0, reservedDelta = 0, statusName = null, userId },
  client
) => {
  if (
    !lotId ||
    typeof quantityDelta !== 'number' ||
    typeof reservedDelta !== 'number'
  ) {
    throw AppError.validationError(
      'lotId, quantityDelta, and reservedDelta must be provided and valid numbers'
    );
  }

  try {
    // Step 1: Resolve status_id if statusName is provided
    let statusId = null;
    if (statusName) {
      statusId = await getStatusValue(
        {
          table: 'warehouse_lot_status',
          where: { name: statusName },
          select: 'id',
        },
        client
      );

      if (!statusId) {
        throw AppError.validationError(
          `Invalid warehouse lot status name: ${statusName}`
        );
      }
    }

    // Step 2: Build dynamic SQL query
    const updateFields = [
      'quantity = quantity + $2',
      'reserved_quantity = reserved_quantity + $3',
      'updated_by = $4',
      'updated_at = NOW()',
    ];

    const values = [lotId, quantityDelta, reservedDelta, userId];

    if (statusId) {
      updateFields.splice(2, 0, 'status_id = $5', 'status_date = NOW()');
      values.push(statusId);
    }

    const updateQuery = `
      UPDATE warehouse_inventory_lots
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;

    const result = await query(updateQuery, values, client);

    if (!result.rows.length) {
      throw AppError.notFoundError(`Lot not found for ID: ${lotId}`);
    }

    return result.rows[0];
  } catch (error) {
    logError(
      'Error updating warehouse_inventory_lot quantity and reserved_quantity:',
      error
    );
    throw AppError.databaseError(
      'Failed to update inventory lot quantity or reservation'
    );
  }
};

module.exports = {
  adjustWarehouseInventoryLots,
  checkWarehouseInventoryLotExists,
  insertWarehouseInventoryLots,
  getAvailableLotForAllocation,
  updateWarehouseInventoryLotQuantity,
};
