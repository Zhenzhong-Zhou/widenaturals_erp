const { fetchAdjustmentReport } = require('../services/report-service');
const wrapAsync = require('../utils/wrap-async');

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
      page,
      limit,
      exportFormat,
    } = req.query;
    
    const result = await fetchAdjustmentReport({
      reportType,
      userTimezone,
      startDate,
      endDate,
      warehouseId,
      inventoryId,
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
    
    // Handle file exports
    const { fileBuffer, contentType, fileName } = result;
    
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', contentType);
    
    return res.send(fileBuffer); // Send file content
    
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getAdjustmentReportController,
};
