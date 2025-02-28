const { retry, query } = require('../database/db');
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
  
  const baseQuery = `
    WITH adjustment_data AS (
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
    )
    SELECT * FROM adjustment_data
    WHERE
        local_adjustment_date >=
        CASE
        WHEN $2 = 'daily' THEN (CURRENT_DATE AT TIME ZONE $1) -- Start of day
        WHEN $2 = 'weekly' THEN ((CURRENT_DATE - INTERVAL '7 days') AT TIME ZONE $1)
        WHEN $2 = 'monthly' THEN ((CURRENT_DATE - INTERVAL '30 days') AT TIME ZONE $1)
        WHEN $2 = 'yearly' THEN ((CURRENT_DATE - INTERVAL '1 year') AT TIME ZONE $1)
        ELSE COALESCE($3::TIMESTAMP, CURRENT_DATE::TIMESTAMP) AT TIME ZONE $1
    END
    AND local_adjustment_date <
    CASE
        WHEN $2 IN ('daily', 'weekly', 'monthly', 'yearly') THEN ((CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE $1) -- End of day
        ELSE COALESCE($4::TIMESTAMP, (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP) AT TIME ZONE $1
    END
    AND (COALESCE($5, warehouse_id) = warehouse_id)
    AND (COALESCE($6, inventory_id) = inventory_id)
    ORDER BY ${sortBy} ${sortOrder}
  `;
  
  let queryText;
  let params = [userTimezone, reportType, startDate, endDate, warehouseId, inventoryId];
  
  if (!isExport) {
    queryText = `${baseQuery} LIMIT $7 OFFSET $8`;
    params.push(limit, offset);
  } else {
    queryText = baseQuery; // No limit & offset for export
  }
  
  console.log(queryText, params);
  
  try {
    return await retry(async () => {
      const { rows } = await query(queryText, params);
      console.log(rows);
      return rows;
    }, 3, 1000); // Retry up to 3 times with a 1-second delay
  } catch (error) {
    logError('Error fetching adjustment report:', error);
    throw new AppError.databaseError('Database query failed');
  }
};


module.exports = {
  getAdjustmentReport,
};
