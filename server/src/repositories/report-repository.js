const { retry, query, paginateQuery } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { toLog } = require('../utils/AppError');

/**
 * Fetches inventory adjustment reports dynamically based on filters.
 * @param {Object} params - Query parameters.
 * @param {string} params.reportType - 'daily', 'weekly', 'monthly', 'yearly', or 'custom'.
 * @param {string} params.userTimezone - Timezone for conversion.
 * @param {string} [params.startDate] - Start date for custom range (optional).
 * @param {string} [params.endDate] - End date for custom range (optional).
 * @param {string} [params.warehouseId] - Warehouse ID for filtering (optional).
 * @param {string} [params.inventoryId] - Inventory ID for filtering (optional).
 * @param {string} [params.warehouseInventoryLotId] - The ID of the specific lot in a warehouse's inventory (optional).
 * @returns {Promise<Array>} - List of adjustment records.
 */
const getAdjustmentReport = async ({
  reportType = null,
  userTimezone = 'UTC',
  startDate = null,
  endDate = null,
  warehouseId = null,
  inventoryId = null,
  warehouseInventoryLotId = null,
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
      wa.adjustment_date AT TIME ZONE $1 AS local_adjustment_date,
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      wil.id AS warehouse_inventory_lot_id,
      wil.inventory_id AS inventory_id,
      wil.lot_number AS lot_number,
      COALESCE(p.product_name, i.identifier, 'Unknown Item') AS item_name,
      wil.expiry_date AS expiry_date,
      wil.manufacture_date AS manufacture_date,
      wa.previous_quantity,
      wa.adjusted_quantity,
      wa.new_quantity,
      lat.name AS adjustment_type,
      ws.name AS status,
      COALESCE(u.firstname, 'System') || ' ' || COALESCE(u.lastname, 'Action') AS adjusted_by,
      wa.comments
    FROM warehouse_lot_adjustments wa
    JOIN warehouse_inventory_lots wil ON wa.warehouse_inventory_lot_id = wil.id
    JOIN warehouses w ON wil.warehouse_id = w.id
    JOIN inventory i ON wil.inventory_id = i.id
    LEFT JOIN products p ON i.product_id = p.id
    JOIN lot_adjustment_types lat ON wa.adjustment_type_id = lat.id
    LEFT JOIN users u ON wa.adjusted_by = u.id
    LEFT JOIN warehouse_lot_status ws ON wa.status_id = ws.id
    WHERE wa.adjustment_date AT TIME ZONE 'UTC' AT TIME ZONE $1 >=
      CASE
        WHEN $2::TEXT = 'weekly' THEN (CURRENT_DATE - INTERVAL '7 days') AT TIME ZONE $1
        WHEN $2::TEXT = 'monthly' THEN (CURRENT_DATE - INTERVAL '30 days') AT TIME ZONE $1
        WHEN $2::TEXT = 'yearly' THEN (CURRENT_DATE - INTERVAL '1 year') AT TIME ZONE $1
        ELSE COALESCE($3::TIMESTAMP, CURRENT_DATE::TIMESTAMP) AT TIME ZONE $1
      END
      AND wa.adjustment_date AT TIME ZONE 'UTC' AT TIME ZONE $1 <
      CASE
        WHEN $2::TEXT IN ('weekly', 'monthly', 'yearly') THEN (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE $1
        ELSE COALESCE($4::TIMESTAMP, (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP) AT TIME ZONE $1
      END
      AND ($5::UUID IS NULL OR wil.warehouse_id = $5::UUID)
      AND ($6::UUID IS NULL OR wil.inventory_id = $6::UUID)
      AND ($7::UUID IS NULL OR wa.warehouse_inventory_lot_id = $7::UUID)
  `;

  // Count Query (for pagination)
  const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS adjustment_data;`;

  const params = [
    userTimezone,
    reportType,
    startDate,
    endDate,
    warehouseId,
    inventoryId,
    warehouseInventoryLotId,
  ];

  try {
    let totalRecords = 0;

    // Fetch Count (only if pagination is required)
    if (!isExport) {
      const countResult = await query(countQuery, params);
      totalRecords = parseInt(countResult.rows[0]?.total || 0, 10);
    }

    // Append Pagination if NOT Exporting
    const finalQuery = isExport
      ? baseQuery
      : `${baseQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT $8 OFFSET $9`;
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

/**
 * Fetches paginated inventory activity logs with filtering, sorting, and time zone conversion.
 * Separates count query for better performance.
 *
 * @param {Object} params - Query parameters for filtering and pagination.
 * @param {string|null} params.inventoryId - Filter by inventory ID.
 * @param {string|null} params.warehouseId - Filter by warehouse ID.
 * @param {string|null} params.lotId - Filter by lot ID.
 * @param {string|null} params.orderId - Filter by order ID.
 * @param {string|null} params.actionTypeId - Filter by inventory action type ID.
 * @param {string|null} params.statusId - Filter by inventory status ID.
 * @param {string|null} params.userId - Filter by user ID.
 * @param {string|null} params.startDate - Start date for filtering by timestamp.
 * @param {string|null} params.endDate - End date for filtering by timestamp.
 * @param {string} params.reportType - 'daily', 'weekly', 'monthly', 'yearly', or 'custom'.
 * @param {string} [params.timezone='UTC'] - Frontend-provided time zone for displaying timestamps.
 * @param {number} [params.page=1] - Current page number for pagination.
 * @param {number} [params.limit=50] - Number of records per page.
 * @param {string} [params.sortBy='timestamp'] - Column to sort by.
 * @param {string} [params.sortOrder='DESC'] - Sorting order ('ASC' or 'DESC').
 * @param {boolean} [params.isExport=false] - If true, fetches all data without pagination.
 * @returns {Promise<Object>} - Returns paginated results and total count.
 */
const getInventoryActivityLogs = async ({
                                          inventoryId,
                                          warehouseId,
                                          lotId,
                                          orderId,
                                          actionTypeId,
                                          statusId,
                                          userId,
                                          startDate,
                                          endDate,
                                          reportType,
                                          timezone = 'UTC',
                                          page = 1,
                                          limit = 50,
                                          sortBy = 'timestamp',
                                          sortOrder = 'DESC',
                                          isExport = false
                                        }) => {
  // Calculate pagination offset
  const offset = (page - 1) * limit;
  
  // Base Query (Filtered Data)
  const baseQuery = `
    SELECT
        ial.id AS log_id,
        i.product_id,
        COALESCE(p.product_name, i.identifier, 'Unknown Item') AS item_name,
        ial.inventory_id,
        w.id AS warehouse_id,
        w.name AS warehouse_name,
        wil.id AS warehouse_inventory_lot_id,
        wil.lot_number,
        wil.expiry_date AS expiry_date,
        wil.manufacture_date AS manufacture_date,
        ia.name AS action_type,
        ial.quantity_change,
        ial.previous_quantity,
        ial.new_quantity,
        ws.name AS status,
        lat.name AS adjustment_type,
        o.id AS order_id,
        COALESCE(u.firstname, 'System') || ' ' || COALESCE(u.lastname, 'Action') AS user_name,
        (ial.timestamp AT TIME ZONE 'UTC') AT TIME ZONE $1 AS local_timestamp,
        ial.comments,
        ial.metadata
    FROM inventory_activity_log AS ial
    LEFT JOIN inventory AS i ON ial.inventory_id = i.id
    LEFT JOIN products AS p ON i.product_id = p.id
    LEFT JOIN warehouses AS w ON ial.warehouse_id = w.id
    LEFT JOIN warehouse_inventory_lots AS wil ON ial.lot_id = wil.id
    LEFT JOIN inventory_action_types AS ia ON ial.inventory_action_type_id = ia.id
    LEFT JOIN warehouse_lot_status AS ws ON ial.status_id = ws.id
    LEFT JOIN lot_adjustment_types AS lat ON ial.adjustment_type_id = lat.id
    LEFT JOIN orders AS o ON ial.order_id = o.id
    LEFT JOIN users AS u ON ial.user_id = u.id
    WHERE
        ($2::UUID IS NULL OR ial.inventory_id = $2::UUID)
        AND ($3::UUID IS NULL OR ial.warehouse_id = $3::UUID)
        AND ($4::UUID IS NULL OR ial.lot_id = $4::UUID)
        AND ($5::UUID IS NULL OR ial.order_id = $5::UUID)
        AND ($6::UUID IS NULL OR ial.inventory_action_type_id = $6::UUID)
        AND ($7::UUID IS NULL OR ial.status_id = $7::UUID)
        AND ($8::UUID IS NULL OR ial.user_id = $8::UUID)
        AND (
            (
                ($9::TIMESTAMP IS NOT NULL AND $10::TIMESTAMP IS NOT NULL)
                AND (ial.timestamp AT TIME ZONE 'UTC')
                    BETWEEN COALESCE($9::TIMESTAMP, '-infinity'::TIMESTAMP)
                    AND COALESCE($10::TIMESTAMP, 'infinity'::TIMESTAMP)
            )
            OR ($9 IS NULL AND $10 IS NULL)
            OR (
              ($11::TEXT = 'weekly' AND ial.timestamp >= NOW() - INTERVAL '7 days')
              OR ($11::TEXT = 'monthly' AND ial.timestamp >= DATE_TRUNC('month', NOW()))
              OR ($11::TEXT = 'yearly' AND ial.timestamp >= DATE_TRUNC('year', NOW()))
          )
        )
  `;
  
  // Bind parameters
  const bindings = [
    timezone, // $1
    inventoryId || null, // $2
    warehouseId || null, // $3
    lotId || null, // $4
    orderId || null, // $5
    actionTypeId || null, // $6
    statusId || null, // $7
    userId || null, // $8
    startDate ? new Date(startDate).toISOString() : null, // $9
    endDate ? new Date(endDate).toISOString() : null, // $10
    reportType ?? null // $11
  ];
  
  let totalRecords = 0;
  
  // Fetch Total Count (Only When Paginating)
  if (!isExport) {
    const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS filtered_data;`;
    const countResult = await query(countQuery, bindings);
    totalRecords = parseInt(countResult.rows[0]?.total || 0, 10);
  }
  
  // Append Pagination if NOT Exporting
  if (!isExport) {
    bindings.push(limit, offset); // $12, $13
  }
  
  // Final paginated query
  const paginatedQuery = isExport
    ? `${baseQuery} ORDER BY ${sortBy} ${sortOrder};`
    : `${baseQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT $12 OFFSET $13;`;
  
  try {
    // Execute final query
    const { rows } = await query(paginatedQuery, bindings);
    
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
    logError('Error fetching paginated inventory logs:', error);
    throw new AppError.databaseError('An error occurred while retrieving inventory logs. Please try again later.');
  }
};

/**
 * Fetch inventory history with optional filters, sorting, and pagination
 *
 * @param {Object} params - Query parameters
 * @param {string|null} [params.inventoryId] - Filter by inventory ID
 * @param {string|null} [params.actionTypeId] - Filter by inventory action type ID
 * @param {string|null} [params.statusId] - Filter by status ID
 * @param {string|null} [params.userId] - Filter by user ID
 * @param {string|null} [params.startDate] - Start date for filtering
 * @param {string|null} [params.endDate] - End date for filtering
 * @param {string|null} [params.reportType] - Report type (weekly, monthly, yearly)
 * @param {string} [params.timezone='UTC'] - Timezone for timestamp conversion
 * @param {string} [params.sortBy='timestamp'] - Column to sort by
 * @param {string} [params.sortOrder='DESC'] - Sorting order (ASC or DESC)
 * @param {number} [params.page=1] - Page number for pagination
 * @param {number} [params.limit=50] - Number of records per page
 * @param {boolean} [params.isExport=false] - Whether exporting data (no pagination)
 *
 * @returns {Promise<Object>} - Paginated inventory history records and metadata
 */
const getInventoryHistory = async ({
                                     inventoryId = null,
                                     actionTypeId = null,
                                     statusId = null,
                                     userId = null,
                                     startDate = null,
                                     endDate = null,
                                     reportType = null, // 'weekly', 'monthly', 'yearly'
                                     timezone = 'UTC',
                                     sortBy = 'timestamp',
                                     sortOrder = 'DESC',
                                     page = 1,
                                     limit = 50,
                                     isExport = false
                                   }) => {
  const offset = (page - 1) * limit;
  
  const baseQuery = `
    SELECT
        ih.id AS log_id,
        ih.inventory_id,
        i.product_id,
        COALESCE(p.product_name, i.identifier, 'Unknown Item') AS item_name,
        ih.inventory_action_type_id,
        ia.name AS action_type,
        ih.previous_quantity,
        ih.quantity_change,
        ih.new_quantity,
        ih.status_id,
        ws.name AS status,
        ih.status_date,
        ih.timestamp AT TIME ZONE $1 AS adjusted_timestamp, -- Convert timestamp to specified timezone
        ih.source_action_id,
        COALESCE(u.firstname, 'System') || ' ' || COALESCE(u.lastname, 'Action') AS source_user,
        ih.comments,
        ih.checksum,
        ih.metadata,
        ih.created_at,
        ih.created_by,
        COALESCE(u1.firstname, 'System') || ' ' || COALESCE(u1.lastname, 'Action') AS created_by
    FROM inventory_history ih
    LEFT JOIN inventory AS i ON ih.inventory_id = i.id
    LEFT JOIN products AS p ON i.product_id = p.id
    LEFT JOIN inventory_action_types AS ia ON ih.inventory_action_type_id = ia.id
    LEFT JOIN warehouse_lot_status AS ws ON ih.status_id = ws.id
    LEFT JOIN users AS u ON ih.source_action_id = u.id
    LEFT JOIN users AS u1 ON ih.created_by = u1.id
    WHERE
        ($2::UUID IS NULL OR ih.inventory_id = $2)
        AND ($3::UUID IS NULL OR ih.inventory_action_type_id = $3)
        AND ($4::UUID IS NULL OR ih.status_id = $4)
        AND ($5::UUID IS NULL OR ih.source_action_id = $5)
        AND (
            ($6::TIMESTAMP IS NULL AND $7::TIMESTAMP IS NULL)
            OR (ih.timestamp AT TIME ZONE 'UTC' BETWEEN COALESCE($6, '-infinity') AND COALESCE($7, 'infinity'))
            OR ($8 = 'weekly' AND ih.timestamp >= NOW() - INTERVAL '7 days')
            OR ($8 = 'monthly' AND ih.timestamp >= DATE_TRUNC('month', NOW()))
            OR ($8 = 'yearly' AND ih.timestamp >= DATE_TRUNC('year', NOW()))
        )
    ORDER BY
        CASE
            WHEN $9 = 'timestamp' THEN ih.timestamp
        END ${sortOrder},

        CASE
            WHEN $9 = 'new_quantity' THEN ih.new_quantity
            WHEN $9 = 'previous_quantity' THEN ih.previous_quantity
        END ${sortOrder}
  `;
  
  let totalRecords = 0;
  
  // Correct parameter binding for main query
  const queryValues = [
    timezone,        // $1
    inventoryId,     // $2
    actionTypeId,    // $3
    statusId,        // $4
    userId,          // $5
    startDate,       // $6
    endDate,         // $7
    reportType,      // $8
    sortBy,          // $9
  ];
  
  // Fetch total count (Only when paginating)
  if (!isExport) {
    const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS filtered_data;`;
    
    // Remove limit/offset from count query
    const countValues = queryValues.slice(0, 9); // Only use the first 9 parameters
    
    try {
      const countResult = await query(countQuery, countValues);
      totalRecords = parseInt(countResult.rows[0]?.total || 0, 10);
    } catch (error) {
      logError('Error fetching inventory history count:', error);
      throw AppError.databaseError('Error fetching inventory history count.');
    }
  }
  
  // Append Pagination if NOT Exporting
  if (!isExport) {
    queryValues.push(limit, offset); // $10, $11
  }
  
  // Execute correct query
  const finalQuery = isExport ? baseQuery : `${baseQuery} LIMIT $10 OFFSET $11`;
  
  try {
    const { rows } = await query(finalQuery, queryValues);
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
    logError('Error fetching inventory history:', error);
    throw AppError.databaseError('Error fetching inventory history.');
  }
};

module.exports = {
  getAdjustmentReport,
  getInventoryActivityLogs,
  getInventoryHistory,
};
