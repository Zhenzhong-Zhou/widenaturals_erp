const { fetchAdjustmentReport, fetchInventoryActivityLogs, fetchInventoryHistoryWithValidation } = require('../services/report-service');
const wrapAsync = require('../utils/wrap-async');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Controller to fetch inventory adjustment reports.
 */
const getAdjustmentReportController = wrapAsync(async (req, res, next) => {
  try {
    const {
      reportType,
      userTimezone,
      startDate,
      endDate,
      warehouseId,
      inventoryId,
      warehouseInventoryLotId,
      page,
      limit,
      exportFormat,
    } = req.query;

    // Fetch the report (conversion is now handled inside `fetchAdjustmentReport`)
    const result = await fetchAdjustmentReport({
      reportType,
      userTimezone,
      startDate,
      endDate,
      warehouseId,
      inventoryId,
      warehouseInventoryLotId,
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      exportFormat,
    });

    if (!exportFormat) {
      // Normal JSON response
      return res.json({
        success: true,
        message: 'Adjustment report fetched successfully',
        ...result,
      });
    }

    // Handle file exports (CSV, PDF, TXT)
    const { fileBuffer, contentType, fileName } = result;

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', contentType);

    return res.send(fileBuffer); // Send file content
  } catch (error) {
    next(error);
  }
});

/**
 * Controller to fetch and export inventory logs.
 *
 * Supports paginated JSON responses and exports in CSV, PDF, and TXT formats.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - Sends JSON response or file export.
 */
const getInventoryActivityLogsController = wrapAsync(async (req, res) => {
  const {
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
    userTimezone = 'UTC',
    page = 1,
    limit = 50,
    sortBy = 'timestamp',
    sortOrder = 'DESC',
    exportFormat
  } = req.query;
  
  // Fetch inventory logs from service
  const logsResponse = await fetchInventoryActivityLogs({
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
    userTimezone,
    page,
    limit,
    sortBy,
    sortOrder,
    exportFormat,
  });
  
  // If export format is requested, return file
  if (exportFormat) {
    res.setHeader('Content-Disposition', `attachment; filename="${logsResponse.fileName}"`);
    res.setHeader('Content-Type', logsResponse.contentType);
    return res.send(logsResponse.fileBuffer);
  }
  
  return res.json({
    success: true,
    message: 'Inventory activity logs fetched successfully',
    ...logsResponse,
  });
});

/**
 * Controller to fetch inventory history with optional export
 */
const getInventoryHistoryController = wrapAsync(async (req, res, next) => {
  const {
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
    exportFormat = null,
  } = req.query;
  
  const records = await fetchInventoryHistoryWithValidation({
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
    page,
    limit,
    exportFormat
  });
  
  // Handle export file response
  if (exportFormat) {
    if (!records?.fileBuffer) {
      return AppError.validationError('Failed to generate export file');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${records.fileName}"`);
    res.setHeader('Content-Type', records.contentType);
    return res.send(records.fileBuffer);
  }
  
  // Handle JSON response
  res.json({
    success: true,
    message: 'Inventory history fetched successfully',
    ...records,
  });
});

module.exports = {
  getAdjustmentReportController,
  getInventoryActivityLogsController,
  getInventoryHistoryController,
};
