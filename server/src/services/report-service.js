const { getAdjustmentReport, getInventoryActivityLogs, getInventoryHistory } = require('../repositories/report-repository');
const { generateEmptyExport, exportData } = require('../utils/export-utils');
const AppError = require('../utils/AppError');
const { logError, logWarn } = require('../utils/logger-helper');
const { validateChecksum } = require('../utils/crypto-utils');

/**
 * Fetch adjustment report with optional export support.
 * @param {Object} params - Request parameters.
 * @param {string} params.reportType - 'daily', 'weekly', 'monthly', 'yearly', or 'custom'.
 * @param {string} params.userTimezone - User's timezone.
 * @param {string} [params.startDate] - Custom start date (optional).
 * @param {string} [params.endDate] - Custom end date (optional).
 * @param {string} [params.warehouseId] - Warehouse ID (optional).
 * @param {string} [params.warehouseInventoryLotId] - The ID of the specific warehouse inventory lot (optional).
 * @param {number} [params.page] - Page number for pagination (optional).
 * @param {number} [params.limit] - Items per page (optional).
 * @param {string} [params.sortBy] - Sort column (optional).
 * @param {string} [params.sortOrder] - Sorting order (ASC/DESC) (optional).
 * @param {string} [params.exportFormat] - 'csv', 'pdf', or 'txt' for export (optional).
 * @returns {Promise<Object|Buffer>} - JSON response for paginated data or file buffer for export.
 */
const fetchAdjustmentReport = async ({
  reportType = null,
  userTimezone = 'UTC',
  startDate = null,
  endDate = null,
  warehouseId = null,
  warehouseInventoryLotId = null,
  page = 1,
  limit = 50,
  sortBy = 'local_adjustment_date',
  sortOrder = 'DESC',
  exportFormat = null, // Export format: 'csv', 'pdf', 'txt'
}) => {
  try {
    const isExport = !!exportFormat; // If exportFormat is provided, fetch all data

    // Fetch report from repository (paginated or full)
    const reportData = await getAdjustmentReport({
      reportType,
      userTimezone,
      startDate,
      endDate,
      warehouseId,
      warehouseInventoryLotId,
      page,
      limit,
      sortBy,
      sortOrder,
      isExport,
    });

    const { data, pagination } = reportData;

    // Handle No Data Case
    if (!data || data.length === 0) {
      logWarn('No adjustment records found for the given criteria.');
      
      if (!isExport) {
        return {
          success: true,
          data: [],
          pagination: { page: 0, limit: 0, totalRecords: 0, totalPages: 0 },
          message: 'No adjustment records found for the given criteria.',
        };
      }
      
      return generateEmptyExport(exportFormat, 'adjustment_report');
    }
    
    if (!isExport) {
      // Return JSON response for paginated data
      return {
        success: true,
        data,
        pagination,
      };
    }
    
    // Handle Export (Regular Data)
    return await exportData({
      data,
      exportFormat,
      filename: 'adjustment_report',
      title: 'Adjustment Report',
    });
  } catch (error) {
    logError('Failed to fetch adjustment report', error);
    throw new AppError.databaseError(
      'Failed to fetch adjustment report',
      error
    );
  }
};

/**
 * Fetches inventory logs with business logic validation.
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
 * @returns {Promise<Object>} - Returns paginated results and total count.
 */
const fetchInventoryActivityLogs = async ({
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
                                  exportFormat = null
                                }) => {
  // Ensure `page` and `limit` are valid numbers
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100); // Limit max 100 records per page
  
  const isExport = !!exportFormat; // If exportFormat is provided, fetch all data
  
  // Fetch inventory logs from repository
  const logs = await getInventoryActivityLogs({
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
    timezone,
    page: pageNumber,
    limit: limitNumber,
    sortBy,
    sortOrder,
    isExport,
  });
  
  const { data, pagination } = logs;
  
  // Handle No Data Case
  if (!logs || data.length === 0) {
    logWarn('No inventory logs found for the given filters.');
    
    if (isExport) {
      return generateEmptyExport(exportFormat, 'empty_inventory_activity_logs');
    }
    
    return {
      success: true,
      data: [],
      pagination: { page: 0, limit: 0, totalRecords: 0, totalPages: 0 },
      message: 'No adjustment records found for the given criteria.',
    };
  }
  
  // Export Handling
  if (isExport) {
    return await exportData({
      data,
      exportFormat,
      filename: 'inventory_logs',
      title: 'Inventory Logs',
    });
  }
  
  // Return paginated data
  return {
    data,
    pagination: isExport
      ? null
      : {
        page: pageNumber,
        limit: limitNumber,
        totalRecords: pagination.totalRecords,
        totalPages: pagination.totalPages,
      },
  };
};

/**
 * Fetch inventory history with checksum validation.
 * Ensures data integrity and logs violations if found.
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Validated inventory history records with pagination
 */
const fetchInventoryHistoryWithValidation = async ({
                                                     inventoryId,
                                                     actionTypeId,
                                                     statusId,
                                                     userId,
                                                     startDate,
                                                     endDate,
                                                     reportType,
                                                     timezone = 'UTC',
                                                     sortBy = 'timestamp',
                                                     sortOrder = 'DESC',
                                                     page = 1,
                                                     limit = 50,
                                                     exportFormat = null
                                                   }) => {
  try {
    // Ensure `page` and `limit` are valid numbers
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 1, 1), 100); // Limit max 100 records per page
    
    // Determine if export mode is enabled
    const isExport = Boolean(exportFormat);
    
    // Fetch records from repository
    const { data, pagination } = await getInventoryHistory({
      inventoryId,
      actionTypeId,
      statusId,
      userId,
      startDate,
      endDate,
      reportType,
      timezone,
      sortBy,
      sortOrder,
      page: pageNumber,
      limit: limitNumber,
      isExport
    });
    
    // Handle No Data Case
    if (!data || data.length === 0) {
      logWarn('No inventory history found for the given filters.');
      
      if (isExport) {
        return generateEmptyExport(exportFormat, 'empty_inventory_history');
      }
      
      return {
        success: true,
        data: [],
        pagination: { page: 0, limit: 0, totalRecords: 0, totalPages: 0 },
        message: 'No inventory history records found for the given criteria.',
      };
    }
    
    // Validate checksum for each record and log mismatches
    for (const record of data) {
      if (!validateChecksum(record)) {
        logError(`⚠ Data Integrity Violation: Inventory log ${record.id} checksum mismatch!`);
        // Optional: Store this in an audit log
      }
    }
    
    // Transform Data: Remove `checksum`**
    const transformedData = data.map(({ checksum, ...record }) => record);
    
    // Export Handling
    if (isExport) {
      return await exportData({
        data: transformedData,
        exportFormat,
        filename: 'inventory_history',
        title: 'Inventory History',
      });
    }
    
    // Return paginated data
    return {
      success: true,
      data: transformedData,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalRecords: pagination?.totalRecords || 0,
        totalPages: pagination?.totalPages || 0,
      },
    };
  } catch (error) {
    logError('Error fetching inventory history:', error);
    throw new AppError.serviceError('Failed to fetch inventory history', error);
  }
};

module.exports = {
  fetchAdjustmentReport,
  fetchInventoryActivityLogs,
  fetchInventoryHistoryWithValidation,
};
