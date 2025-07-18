const { paginateQuery, query } = require('../../database/db');
const AppError = require('../../utils/AppError');
const {
  logSystemInfo,
  logSystemException
} = require('../../utils/system-logger');
const { buildInventoryLogWhereClause } = require('../../utils/sql/build-inventory-log-filters');

/**
 * Fetches detailed inventory activity logs with full relational context.
 *
 * Joins data from inventory actions, orders, product batches, packaging material batches,
 * warehouse/location inventory, status, users, and reference metadata.
 *
 * Supports:
 * - Pagination (page, limit)
 * - Sorting (sortBy mapped via a module-level sort map, and sortOrder)
 * - Optional filtering (e.g., date range, warehouse ID, SKU, product, batch type)
 *
 * Common use cases include:
 * - Inventory adjustments (e.g., damaged, discarded, transferred)
 * - Order-driven movements (e.g., allocations, outbound shipments, completions)
 * - Warehouse and location-level audit trails
 *
 * @param {Object} options - Query options.
 * @param {Object} [options.filters={}] - Dynamic filters used to build WHERE clause.
 * @param {number} [options.page=1] - Page number for paginated results.
 * @param {number} [options.limit=20] - Number of records per page.
 * @param {string} [options.sortBy='action_timestamp'] - Logical sort key (resolved via a sort map).
 * @param {string} [options.sortOrder='DESC'] - Sort direction, either 'ASC' or 'DESC'.
 *
 * @returns {Promise<Object>} Paginated inventory activity log records with relational metadata.
 *
 * @throws {AppError.databaseError} If the database query fails.
 */
const getInventoryActivityLogs = async ({
                                          filters = {},
                                          page = 1,
                                          limit = 20,
                                          sortBy = 'action_timestamp',
                                          sortOrder = 'DESC',
                                        }) => {
  const { whereClause, params } = buildInventoryLogWhereClause(filters);
  
  const tableName = 'inventory_activity_log AS ial';
  
  const joins = [
    'LEFT JOIN inventory_action_types AS iat ON ial.inventory_action_type_id = iat.id',
    'LEFT JOIN lot_adjustment_types AS lat ON ial.adjustment_type_id = lat.id',
    'LEFT JOIN inventory_status AS ist ON ial.status_id = ist.id',
    'LEFT JOIN users AS u ON ial.performed_by = u.id',
    'LEFT JOIN orders AS o ON ial.order_id = o.id',
    'LEFT JOIN order_status AS os ON o.order_status_id = os.id',
    'LEFT JOIN order_types AS ot ON o.order_type_id = ot.id',
    'LEFT JOIN warehouse_inventory AS wi ON ial.warehouse_inventory_id = wi.id',
    'LEFT JOIN location_inventory AS li ON ial.location_inventory_id = li.id',
    'LEFT JOIN warehouses AS wh ON wi.warehouse_id = wh.id',
    'LEFT JOIN locations AS loc ON li.location_id = loc.id',
    'LEFT JOIN batch_registry AS br ON br.id = COALESCE(wi.batch_id, li.batch_id)',
    'LEFT JOIN product_batches AS pb ON pb.id = br.product_batch_id',
    'LEFT JOIN skus AS s ON s.id = pb.sku_id',
    'LEFT JOIN products AS p ON p.id = s.product_id',
    'LEFT JOIN packaging_material_batches AS pmb ON pmb.id = br.packaging_material_batch_id',
    'LEFT JOIN packaging_material_suppliers AS pms ON pms.id = pmb.packaging_material_supplier_id',
    'LEFT JOIN packaging_materials AS pm ON pm.id = pms.packaging_material_id',
  ];
  
  const baseQueryText = `
    SELECT
      ial.id,
      ial.action_timestamp,
      ial.previous_quantity,
      ial.quantity_change,
      ial.new_quantity,
      ial.comments,
      ial.metadata,
      ial.source_type,
      ial.source_ref_id,
      iat.name AS action_type,
      lat.name AS adjustment_type,
      ist.name AS status_name,
      u.firstname || ' ' || u.lastname AS performed_by,
      o.order_number,
      ot.name AS order_type,
      os.name AS order_status,
      br.batch_type,
      s.sku AS sku_code,
      s.size_label,
      s.country_code AS country_code,
      p.name AS product_name,
      p.brand AS product_brand,
      pb.lot_number AS product_lot_number,
      pb.expiry_date AS product_expiry_date,
      pmb.lot_number AS material_lot_number,
      pmb.expiry_date AS material_expiry_date,
      pmb.material_snapshot_name,
      pm.code AS material_code,
      wh.name AS warehouse_name,
      loc.name AS location_name
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;
  
  try {
    logSystemInfo('Executing inventory activity log report query', {
      context: 'inventory-activity-report/getInventoryActivityLogs',
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    });
    
    return await paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText: baseQueryText,
      params,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  } catch (error) {
    logSystemException(error, 'Error during inventory activity log report query', {
      context: 'inventory-activity-report/getInventoryActivityLogs',
    });
    throw AppError.databaseError('Unable to fetch inventory activity logs');
  }
};

/**
 * Fetches the most recent inventory activity logs, limited to a specified number.
 *
 * Intended for users with base-level permissions who are not authorized to view full history.
 * This function bypasses complex filtering to ensure access restrictions are enforced.
 *
 * @param {Object} params - Parameters object
 * @param {number} [params.limit=10] - Maximum number of recent logs to return
 * @returns {Promise<Array>} Array of the latest inventory activity log entries
 */
const getLatestFilteredInventoryActivityLogs = async ({ limit = 10 }) => {
  
  const joins = [
    'LEFT JOIN inventory_action_types AS iat ON ial.inventory_action_type_id = iat.id',
    'LEFT JOIN lot_adjustment_types AS lat ON ial.adjustment_type_id = lat.id',
    'LEFT JOIN inventory_status AS ist ON ial.status_id = ist.id',
    'LEFT JOIN users AS u ON ial.performed_by = u.id',
    'LEFT JOIN orders AS o ON ial.order_id = o.id',
    'LEFT JOIN order_status AS os ON o.order_status_id = os.id',
    'LEFT JOIN order_types AS ot ON o.order_type_id = ot.id',
    'LEFT JOIN warehouse_inventory AS wi ON ial.warehouse_inventory_id = wi.id',
    'LEFT JOIN location_inventory AS li ON ial.location_inventory_id = li.id',
    'LEFT JOIN warehouses AS wh ON wi.warehouse_id = wh.id',
    'LEFT JOIN locations AS loc ON li.location_id = loc.id',
    'LEFT JOIN batch_registry AS br ON br.id = COALESCE(wi.batch_id, li.batch_id)',
    'LEFT JOIN product_batches AS pb ON pb.id = br.product_batch_id',
    'LEFT JOIN skus AS s ON s.id = pb.sku_id',
    'LEFT JOIN products AS p ON p.id = s.product_id',
    'LEFT JOIN packaging_material_batches AS pmb ON pmb.id = br.packaging_material_batch_id',
    'LEFT JOIN packaging_material_suppliers AS pms ON pms.id = pmb.packaging_material_supplier_id',
    'LEFT JOIN packaging_materials AS pm ON pm.id = pms.packaging_material_id',
  ];
  
  const queryText = `
    WITH latest_10 AS (
      SELECT * FROM inventory_activity_log
      ORDER BY action_timestamp DESC
      LIMIT $1
    )
    SELECT
      ial.id,
      ial.action_timestamp,
      ial.previous_quantity,
      ial.quantity_change,
      ial.new_quantity,
      ial.comments,
      ial.metadata,
      ial.source_type,
      ial.source_ref_id,
      iat.name AS action_type,
      lat.name AS adjustment_type,
      ist.name AS status_name,
      u.firstname || ' ' || u.lastname AS performed_by,
      o.order_number,
      ot.name AS order_type,
      os.name AS order_status,
      br.batch_type,
      s.sku AS sku_code,
      s.size_label,
      s.country_code AS country_code,
      p.name AS product_name,
      p.brand AS product_brand,
      pb.lot_number AS product_lot_number,
      pb.expiry_date AS product_expiry_date,
      pmb.lot_number AS material_lot_number,
      pmb.expiry_date AS material_expiry_date,
      pmb.material_snapshot_name,
      pmb.quantity AS material_quantity,
      pm.code AS material_code,
      wh.name AS warehouse_name,
      loc.name AS location_name
    FROM latest_10 AS ial
    ${joins.join('\n')}
  `;
  
  try {
    logSystemInfo('Executing limited inventory activity log query for base-permission user', {
      context: 'inventory-activity-report/getLatestFilteredInventoryActivityLogs',
      limit,
    });
    
    const result = await query(queryText, [limit]);
    return result.rows;
  } catch (error) {
    logSystemException(error, 'Error fetching latest filtered inventory activity logs', {
      context: 'inventory-activity-report/getLatestFilteredInventoryActivityLogs',
    });
    throw AppError.databaseError('Unable to fetch latest filtered inventory activity logs.');
  }
};

/**
 * Fetch distinct SKU IDs from inventory activity logs linked to given product IDs.
 * Traverses: inventory_activity_log → warehouse/location inventory → batch_registry → product_batches → skus → products
 *
 * @param {string[]} productIds - Array of product UUIDs
 * @returns {Promise<string[]>} - Array of matching SKU IDs
 */
const getSkuIdsByProductIds = async (productIds = []) => {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  
  const placeholders = productIds.map((_, i) => `$${i + 1}`).join(', ');
  
  const sql = `
    SELECT s.id AS sku_id
    FROM inventory_activity_log AS ial
    LEFT JOIN warehouse_inventory AS wi ON ial.warehouse_inventory_id = wi.id
    LEFT JOIN location_inventory AS li ON ial.location_inventory_id = li.id
    LEFT JOIN batch_registry AS br ON br.id = COALESCE(wi.batch_id, li.batch_id)
    LEFT JOIN product_batches AS pb ON pb.id = br.product_batch_id
    LEFT JOIN skus AS s ON s.id = pb.sku_id
    LEFT JOIN products AS p ON p.id = s.product_id
    WHERE p.id IN (${placeholders})
      AND s.id IS NOT NULL
    GROUP BY s.id
  `;
  
  try {
    const result = await query(sql, productIds);
    return result.rows.map(row => row.sku_id);
  } catch (error) {
    logSystemException( error, 'Failed to get SKU IDs by product IDs', {
      context: 'inventory-activity-report/getSkuIdsByProductIds',
      productIds,
    });
    throw AppError.databaseError('Unable to resolve SKU access by product.');
  }
};

/**
 * Fetch distinct batch IDs from inventory activity logs linked to either product IDs or packaging material batch IDs.
 *
 * If `productIds` are provided, traverses:
 *   inventory_activity_log → warehouse/location inventory → batch_registry → product_batches → skus → products
 *
 * If `packagingMaterialBatchIds` are provided, use:
 *   inventory_activity_log → warehouse/location inventory → batch_registry → packaging_material_batches
 *
 * @param {Object} params
 * @param {string[]} [params.productIds] - Array of product UUIDs
 * @param {string[]} [params.packagingMaterialBatchIds] - Array of packaging material batch UUIDs
 * @returns {Promise<string[]>} - Array of matching batch IDs
 */
const getBatchIdsBySourceIds = async ({ productIds = [], packagingMaterialBatchIds = [] } = {}) => {
  if (!Array.isArray(productIds) || !Array.isArray(packagingMaterialBatchIds)) {
    throw AppError.validationError('Invalid input: expected arrays for IDs.');
  }
  
  const filters = [];
  const params = [];
  let paramIndex = 1;
  
  if (productIds.length > 0) {
    filters.push(`p.id IN (${productIds.map(() => `$${paramIndex++}`).join(', ')})`);
    params.push(...productIds);
  }
  
  if (packagingMaterialBatchIds.length > 0) {
    filters.push(`pmb.id IN (${packagingMaterialBatchIds.map(() => `$${paramIndex++}`).join(', ')})`);
    params.push(...packagingMaterialBatchIds);
  }
  
  if (filters.length === 0) return [];
  
  const sql = `
    SELECT br.id AS batch_id
    FROM inventory_activity_log AS ial
    LEFT JOIN warehouse_inventory AS wi ON ial.warehouse_inventory_id = wi.id
    LEFT JOIN location_inventory AS li ON ial.location_inventory_id = li.id
    LEFT JOIN batch_registry AS br ON br.id = COALESCE(wi.batch_id, li.batch_id)
    LEFT JOIN product_batches AS pb ON pb.id = br.product_batch_id
    LEFT JOIN skus AS s ON s.id = pb.sku_id
    LEFT JOIN products AS p ON p.id = s.product_id
    LEFT JOIN packaging_material_batches AS pmb ON pmb.id = br.packaging_material_batch_id
    WHERE (${filters.join(' OR ')})
      AND br.id IS NOT NULL
    GROUP BY br.id
  `;
  
  try {
    const result = await query(sql, params);
    return result.rows.map(row => row.batch_id);
  } catch (error) {
    logSystemException(error, 'Failed to get batch IDs by source IDs', {
      context: 'inventory-activity-report/getBatchIdsBySourceIds',
      productIds,
      packagingMaterialBatchIds,
    });
    throw AppError.databaseError('Unable to resolve batch access by source.');
  }
};

module.exports = {
  getInventoryActivityLogs,
  getLatestFilteredInventoryActivityLogs,
  getSkuIdsByProductIds,
  getBatchIdsBySourceIds,
};
