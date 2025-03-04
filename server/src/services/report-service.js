const { getAdjustmentReport } = require('../repositories/report-repository');
const { exportToCSV, exportToPDF, exportToPlainText } = require('../utils/export-utils');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

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
      if (!isExport) {
        return {
          success: true,
          data: [],
          pagination: { page: 0, limit: 0, totalRecords: 0, totalPages: 0 },
          message: 'No adjustment records found for the given criteria.',
        };
      }
      
      // Handle empty file exports
      const emptyMessage = 'No data available for export.';
      let fileBuffer;
      let contentType;
      let fileName;
      
      switch (exportFormat.toLowerCase()) {
        case 'csv':
          fileBuffer = Buffer.from(emptyMessage, 'utf-8');
          contentType = 'text/csv';
          fileName = 'empty_adjustment_report.csv';
          break;
        case 'pdf':
          fileBuffer = await exportToPDF([], { landscape: true }); // Empty PDF
          contentType = 'application/pdf';
          fileName = 'empty_adjustment_report.pdf';
          break;
        case 'txt':
          fileBuffer = Buffer.from(emptyMessage, 'utf-8');
          contentType = 'text/plain';
          fileName = 'empty_adjustment_report.txt';
          break;
        default:
          throw new AppError.validationError('Invalid export format. Use "csv", "pdf", or "txt".');
      }
      
      return { fileBuffer, contentType, fileName };
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
    let fileBuffer;
    let contentType;
    let fileName;
    
    switch (exportFormat.toLowerCase()) {
      case 'csv':
        fileBuffer = exportToCSV(data);
        contentType = 'text/csv';
        fileName = 'adjustment_report.csv';
        break;
      case 'pdf':
        fileBuffer = await exportToPDF(data, { landscape: true }); // PDF function should return a Buffer
        contentType = 'application/pdf';
        fileName = 'adjustment_report.pdf';
        break;
      case 'txt':
        fileBuffer = exportToPlainText(data);
        contentType = 'text/plain';
        fileName = 'adjustment_report.txt';
        break;
      default:
        throw new AppError.validationError('Invalid export format. Use "csv", "pdf", or "txt".');
    }
    
    return { fileBuffer, contentType, fileName };
  } catch (error) {
    logError('Failed to fetch adjustment report', error);
    throw new AppError.databaseError('Failed to fetch adjustment report', error);
  }
};

module.exports = {
  fetchAdjustmentReport
};
