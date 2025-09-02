const { bulkInsert, query } = require('../database/db');
const { logSystemException, logSystemInfo, logSystemWarn } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Bulk inserts inventory allocation records into the `inventory_allocations` table.
 *
 * This function transforms a list of allocation objects into a tabular row format
 * and performs a batched insert using a shared `bulkInsert` utility. It supports
 * conflict resolution based on specified unique keys and applies update strategies
 * (e.g., overwriting or updating timestamps).
 *
 * @param {Array<Object>} allocations - List of allocation objects, where each item includes:
 *   - {string} order_item_id
 *   - {string|null} transfer_order_item_id
 *   - {string} warehouse_id
 *   - {string} batch_id
 *   - {number} allocated_quantity
 *   - {string} status_id
 *   - {string|Date|null} allocated_at
 *   - {string|null} created_by
 *   - {string|null} updated_by
 *   - {string|Date|null} updated_at
 *
 * @param {import('pg').PoolClient} client - PG client instance for transactional execution.
 *
 * @returns {Promise<Array>} - Result of the `bulkInsert` operation (inserted/updated rows).
 *
 * @throws {AppError} - Throws a database error if the insert fails.
 *
 * @example
 * await insertInventoryAllocationsBulk([
 *   {
 *     order_item_id: 'abc-123',
 *     transfer_order_item_id: null,
 *     warehouse_id: 'wh-001',
 *     batch_id: 'batch-456',
 *     allocated_quantity: 10,
 *     status_id: 'allocated',
 *     allocated_at: new Date(),
 *     created_by: 'user-001',
 *     updated_by: 'user-001',
 *     updated_at: new Date()
 *   }
 * ], dbClient);
 */
const insertInventoryAllocationsBulk = async (allocations, client) => {
  const rows = allocations.map((item) => [
    item.order_item_id ?? null,
    item.transfer_order_item_id ?? null,
    item.warehouse_id,
    item.batch_id,
    item.allocated_quantity,
    item.status_id,
    item.allocated_at ?? null,
    item.created_by ?? null,
    item.updated_by ?? null,
    item.updated_at ?? null,
  ]);
  
  const columns = [
    'order_item_id',
    'transfer_order_item_id',
    'warehouse_id',
    'batch_id',
    'allocated_quantity',
    'status_id',
    'allocated_at',
    'created_by',
    'updated_by',
    'updated_at',
  ];
  
  const conflictColumns = ['target_item_id', 'batch_id', 'warehouse_id'];
  
  const updateStrategies = {
    allocated_quantity: 'overwrite',
    status_id: 'overwrite',
    allocated_at: 'now',
    updated_by: 'overwrite',
    updated_at: 'now',
  };
  
  try {
   return await bulkInsert(
      'inventory_allocations',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { context: 'inventory-allocation-repository/insertInventoryAllocationsBulk' }
    );
  } catch (error) {
    logSystemException(error, 'Failed to bulk insert inventory allocations', {
      context: 'inventory-allocation-repository/insertInventoryAllocationsBulk',
      data: allocations,
    });
    
    throw AppError.databaseError('Unable to insert inventory allocations in bulk.');
  }
};

/**
 * Validates whether the provided allocation IDs are associated with a specific order.
 *
 * For each allocationId in the input array, this function checks if it belongs to an
 * order_item linked to the specified orderId. Any allocation ID that does not match
 * the given order is returned as a "mismatched" ID.
 *
 * If any mismatches are found, a warning is logged for traceability. If the database query
 * fails, a structured system exception is logged and a database error is thrown.
 *
 * @async
 * @param {string} orderId - UUID of the order to validate allocations against.
 * @param {string[]} allocationIds - List of allocation UUIDs to be checked.
 * @param {object} client - Database client instance (e.g., from a transaction).
 * @returns {Promise<string[]>} - List of allocation IDs not associated with the order.
 * @throws {AppError} - Throws AppError.databaseError on query failure.
 */
const getMismatchedAllocationIds = async (orderId, allocationIds, client) => {
  if (!allocationIds?.length) return [];
  
  const sql = `
    WITH input_ids AS (
      SELECT unnest($2::uuid[]) AS id
    ),
    valid_allocations AS (
      SELECT ia.id
      FROM inventory_allocations ia
      JOIN order_items oi ON ia.order_item_id = oi.id
      WHERE oi.order_id = $1
        AND ia.id = ANY($2::uuid[])
    )
    SELECT i.id
    FROM input_ids i
    LEFT JOIN valid_allocations v ON v.id = i.id
    WHERE v.id IS NULL;
  `;
  
  try {
    const { rows } = await query(sql, [orderId, allocationIds], client);
    
    if (rows.length > 0) {
      logSystemWarn('Mismatched allocation IDs detected', {
        context: 'inventory-allocations-repository/getMismatchedAllocationIds',
        orderId,
        mismatches: rows.map(r => r.id),
      });
    }
    
    return rows.map(r => r.id); // return mismatches
  } catch (error) {
    logSystemException(error, 'Failed to check mismatched allocation IDs', {
      context: 'inventory-allocations-repository/getMismatchedAllocationIds',
      orderId,
      allocationIds,
    });
    throw AppError.databaseError('Error validating allocation IDs');
  }
};

/**
 * Retrieves detailed review data for one or more inventory allocations within a specific order.
 *
 * For the given `orderId`, this function returns all matching allocation records enriched with:
 * - Allocation metadata (status, quantities, batch ID)
 * - Related order item and SKU/product information
 * - Associated warehouse inventory and batch data
 * - Packaging material details (if applicable)
 * - Order and user information for traceability
 *
 * If `allocationIds` is empty, all allocations for the order will be returned.
 * Logs detailed system info when allocations are retrieved or missing.
 * Logs and throws a database error if the query fails.
 *
 * @async
 * @param {string} orderId - UUID of the order whose allocations are being reviewed.
 * @param {string[]} allocationIds - Array of allocation UUIDs to include (empty array = fetch all).
 * @param {object} client - PostgreSQL database client (transaction-aware).
 * @returns {Promise<object[] | null>} - Array of enriched allocation rows, or `null` if none found.
 * @throws {AppError} - Throws `AppError.databaseError` on query failure.
 */
const getInventoryAllocationReview = async (orderId, allocationIds, client) => {
  const sql = `
    WITH input_ids AS (
      SELECT $2::uuid[] AS allocation_ids
    ),
    selected_allocations AS (
      SELECT ia.*
      FROM inventory_allocations ia
      JOIN order_items oi ON ia.order_item_id = oi.id
      JOIN input_ids i ON TRUE
      WHERE
        oi.order_id = $1
        AND (
          array_length(i.allocation_ids, 1) = 0
          OR ia.id = ANY(i.allocation_ids)
        )
    )
    SELECT
      ia.id AS allocation_id,
      ia.order_item_id,
      ia.transfer_order_item_id,
      ia.batch_id,
      ia.allocated_quantity,
      ia.status_id AS allocation_status_id,
      s_alloc_status.name AS allocation_status_name,
      s_alloc_status.code AS allocation_status_code,
      ia.created_at AS allocation_created_at,
      ia.updated_at AS allocation_updated_at,
      ia.created_by AS allocation_created_by,
      ucb.firstname AS allocation_created_by_firstname,
      ucb.lastname  AS allocation_created_by_lastname,
      ia.updated_by AS allocation_updated_by,
      uub.firstname AS allocation_updated_by_firstname,
      uub.lastname  AS allocation_updated_by_lastname,
      oi.id AS order_item_id,
      oi.order_id,
      oi.quantity_ordered,
      oi.status_id AS item_status_id,
      ios.name AS item_status_name,
      oi.status_date AS item_status_date,
      oi.sku_id,
      s.sku,
      s.barcode,
      s.country_code,
      s.size_label,
      p.id AS product_id,
      p.name AS product_name,
      p.brand,
      p.category,
      oi.packaging_material_id,
      pkg.code AS packaging_material_code,
      pkg.name AS packaging_material_name,
      pkg.color AS packaging_material_color,
      pkg.size AS packaging_material_size,
      pkg.unit AS packaging_material_unit,
      pkg.length_cm AS packaging_material_length_cm,
      pkg.width_cm AS packaging_material_width_cm,
      pkg.height_cm AS packaging_material_height_cm,
      o.order_number,
      o.note AS order_note,
      o.order_type_id,
      ot.name AS order_type_name,
      o.order_status_id,
      os.name AS order_status_name,
      os.code AS order_code,
      o.created_by AS salesperson_id,
      u.firstname AS salesperson_firstname,
      u.lastname  AS salesperson_lastname,
      wi.id AS warehouse_inventory_id,
      wi.warehouse_quantity,
      wi.reserved_quantity,
      br.batch_type,
      pb.lot_number AS product_lot_number,
      pb.expiry_date AS product_expiry_date,
      wi.inbound_date AS product_inbound_date,
      pmb.lot_number AS material_lot_number,
      pmb.expiry_date AS material_expiry_date,
      pmb.material_snapshot_name AS material_name
    FROM selected_allocations ia
    JOIN order_items oi ON ia.order_item_id = oi.id
    JOIN orders o ON oi.order_id = o.id
    JOIN users u ON o.created_by = u.id
    LEFT JOIN users ucb ON ia.created_by = ucb.id
    LEFT JOIN users uub ON ia.updated_by = uub.id
    LEFT JOIN inventory_allocation_status s_alloc_status ON ia.status_id = s_alloc_status.id
    LEFT JOIN order_status ios ON ios.id = oi.status_id
    LEFT JOIN skus s ON oi.sku_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN packaging_materials pkg ON oi.packaging_material_id = pkg.id
    LEFT JOIN order_types ot ON o.order_type_id = ot.id
    LEFT JOIN order_status os ON o.order_status_id = os.id
    JOIN batch_registry br ON ia.batch_id = br.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN warehouse_inventory wi ON wi.batch_id = br.id;
  `;
  
  try {
    const { rows } = await query(sql, [orderId, allocationIds], client);
    
    if (rows.length === 0) {
      logSystemInfo('No allocations found for review', {
        context: 'inventory-allocations-repository/getInventoryAllocationReview',
        orderId,
        allocationIds,
      });
      return null;
    }
    
    logSystemInfo('Fetched allocation review successfully', {
      context: 'inventory-allocations-repository/getInventoryAllocationReview',
      orderId,
      allocationCount: rows.length,
    });
    
    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch allocation review', {
      context: 'inventory-allocations-repository/getInventoryAllocationReview',
      orderId,
      allocationIds,
    });
    
    throw AppError.databaseError(
      'Error occurred while retrieving inventory allocation review'
    );
  }
};

module.exports = {
  insertInventoryAllocationsBulk,
  getMismatchedAllocationIds,
  getInventoryAllocationReview,
};
