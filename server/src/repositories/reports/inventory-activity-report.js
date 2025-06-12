const { paginateQuery } = require('../../database/db');
const AppError = require('../../utils/AppError');
const {
  logSystemInfo,
  logSystemError
} = require('../../utils/system-logger');
const { buildInventoryLogWhereClause } = require('../../utils/sql/build-inventory-log-filters');

/**
 * Fetches detailed inventory activity logs with full relational context.
 *
 * Joins data from inventory actions, orders, product batches, packaging material batches,
 * warehouse/location inventory, status, users, and reference metadata.
 *
 * Supports pagination, sorting, and optional filtering (to be injected dynamically).
 *
 * Example usage includes generating reports for:
 * - Inventory adjustments (damage, loss, transfers)
 * - Order-related inventory movements (allocation, outbound, completion)
 * - Warehouse and location-level tracking
 *
 * @function getInventoryActivityLogs
 * @param {Object} options - Query options.
 * @param {Object} [options.filters={}] - Optional filters for building dynamic WHERE clause (e.g., date range, warehouse ID, SKU).
 * @param {number} [options.page=1] - Page number for pagination.
 * @param {number} [options.limit=20] - Number of records per page.
 * @param {string} [options.sortBy='ial.action_timestamp'] - Column to sort by.
 * @param {string} [options.sortOrder='desc'] - Sort direction ('asc' or 'desc').
 * @returns {Promise<Object>} Paginated inventory activity results with joined metadata.
 *
 * @throws {AppError} If the query fails or result formatting encounters an error.
 */
const getInventoryActivityLogs = async ({
                                          filters = {},
                                          page = 1,
                                          limit = 20,
                                          sortBy = 'ial.action_timestamp',
                                          sortOrder = 'desc',
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
    'LEFT JOIN packaging_material_batches AS pmb ON pmb.id = br.packaging_material_batch_id'
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
      s.market_region,
      p.name AS product_name,
      p.brand AS product_brand,
      p.category AS product_category,
      pmb.lot_number AS material_lot_number,
      pmb.material_snapshot_name,
      pmb.received_label_name,
      pmb.quantity AS material_quantity,
      pmb.unit AS material_unit,
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
    logSystemError('Error during inventory activity log report query', {
      context: 'inventory-activity-report/getInventoryActivityLogs',
      error,
    });
    throw AppError.databaseError('Unable to fetch inventory activity logs');
  }
};

module.exports = {
  getInventoryActivityLogs,
};
