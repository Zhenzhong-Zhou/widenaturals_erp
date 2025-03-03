const { retry, query, paginateQuery } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Fetches inventory adjustment reports dynamically based on filters.
 * @param {Object} params - Query parameters.
 * @param {string} params.reportType - 'daily', 'weekly', 'monthly', 'yearly', or 'custom'.
 * @param {string} params.userTimezone - Timezone for conversion.
 * @param {string} [params.startDate] - Start date for custom range (optional).
 * @param {string} [params.endDate] - End date for custom range (optional).
 * @param {string} [params.warehouseId] - Warehouse ID for filtering (optional).
 * @param {string} [params.inventoryId] - Inventory ID for filtering (optional).
 * @returns {Promise<Array>} - List of adjustment records.
 */
const getAdjustmentReport = async ({
                                     reportType = 'daily',
                                     userTimezone = 'UTC',
                                     startDate = null,
                                     endDate = null,
                                     warehouseId = null,
                                     inventoryId = null,
                                     page = 1,
                                     limit = 50,
                                     sortBy = 'local_adjustment_date',
                                     sortOrder = 'DESC',
                                     isExport = false,
                                   }) => {
  const offset = (page - 1) * limit;
  
  // Construct the Base Query
  const baseQuery = `
    SELECT
      wa.adjustment_date AT TIME ZONE 'UTC' AT TIME ZONE $1 AS local_adjustment_date,
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      COALESCE(p.product_name, i.identifier, 'Unknown Item') AS item_name,
      i.id AS inventory_id,
      wa.previous_quantity,
      wa.adjusted_quantity,
      wa.new_quantity,
      lat.name AS adjustment_type,
      ws.name AS status,
      COALESCE(u.firstname, 'System') || ' ' || COALESCE(u.lastname, 'Action') AS adjusted_by,
      wa.comments
    FROM warehouse_lot_adjustments wa
    JOIN inventory i ON wa.inventory_id = i.id
    LEFT JOIN products p ON i.product_id = p.id
    JOIN warehouses w ON wa.warehouse_id = w.id
    JOIN lot_adjustment_types lat ON wa.adjustment_type_id = lat.id
    LEFT JOIN users u ON wa.adjusted_by = u.id
    LEFT JOIN warehouse_lot_status ws ON wa.status_id = ws.id
    WHERE wa.adjustment_date AT TIME ZONE 'UTC' AT TIME ZONE $1 >=
      CASE
        WHEN $2::TEXT = 'daily' THEN (CURRENT_DATE AT TIME ZONE $1)
        WHEN $2::TEXT = 'weekly' THEN (CURRENT_DATE - INTERVAL '7 days') AT TIME ZONE $1
        WHEN $2::TEXT = 'monthly' THEN (CURRENT_DATE - INTERVAL '30 days') AT TIME ZONE $1
        WHEN $2::TEXT = 'yearly' THEN (CURRENT_DATE - INTERVAL '1 year') AT TIME ZONE $1
        ELSE COALESCE($3::TIMESTAMP, CURRENT_DATE::TIMESTAMP) AT TIME ZONE $1
      END
      AND wa.adjustment_date AT TIME ZONE 'UTC' AT TIME ZONE $1 <
      CASE
        WHEN $2::TEXT IN ('daily', 'weekly', 'monthly', 'yearly') THEN (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE $1
        ELSE COALESCE($4::TIMESTAMP, (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP) AT TIME ZONE $1
      END
      AND ($5::UUID IS NULL OR wa.warehouse_id = $5::UUID)
      AND ($6::UUID IS NULL OR wa.inventory_id = $6::UUID)
  `;
  
  // Count Query (for pagination)
  const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS adjustment_data;`;
  
  const params = [userTimezone, reportType, startDate, endDate, warehouseId, inventoryId];
  
  try {
    let totalRecords = 0;
    
    // Fetch Count (only if pagination is required)
    if (!isExport) {
      const countResult = await query(countQuery, params);
      totalRecords = parseInt(countResult.rows[0]?.total || 0, 10);
    }
    
    // Append Pagination if NOT Exporting
    const finalQuery = isExport ? baseQuery : `${baseQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT $7 OFFSET $8`;
    if (!isExport) {
      params.push(limit, offset);
    }
    
    const { rows } = await query(finalQuery, params);
    
    return {
      data: rows,
      pagination: isExport
        ? null
        : {
          page,
          limit,
          totalRecords,
          totalPages: Math.ceil(totalRecords / limit),
        },
    };
  } catch (error) {
    logError('Error fetching adjustment report:', error);
    throw new AppError.databaseError('Database query failed');
  }
};

module.exports = {
  getAdjustmentReport,
};
