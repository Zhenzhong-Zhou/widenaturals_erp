const wrapAsync = require('../utils/wrap-async');
const { fetchInventoryActivityLogsService } = require('../services/report-service');

/**
 * Controller: Handle request to get an inventory activity logs report
 *
 * This controller:
 * - Extracts query parameters and pagination options
 * - Uses the authenticated user to apply access control
 * - Calls the service layer to fetch and transform logs
 * - Returns the transformed data in a standard response format
 *
 * @route GET /reports/inventory-activity
 * @param {Request} req - Express request object (with user, query filters, page, and limit)
 * @param {Response} res - Express response object
 */
const getInventoryActivityLogsController = wrapAsync(async (req, res) => {
  const filters = {
    warehouseIds: req.query.warehouseIds ? [].concat(req.query.warehouseIds) : undefined,
    locationIds: req.query.locationIds ? [].concat(req.query.locationIds) : undefined,
    productIds: req.query.productIds ? [].concat(req.query.productIds) : undefined,
    skuIds: req.query.skuIds ? [].concat(req.query.skuIds) : undefined,
    actionTypeIds: req.query.actionTypeIds ? [].concat(req.query.actionTypeIds) : undefined,
    orderId: req.query.orderId ?? null,
    statusId: req.query.statusId ?? null,
    adjustmentTypeId: req.query.adjustmentTypeId ?? null,
    performedBy: req.query.performedBy ?? null,
    sourceType: req.query.sourceType ?? null,
    batchType: req.query.batchType ?? null,
    fromDate: req.query.fromDate ?? null,
    toDate: req.query.toDate ?? null,
  };
  
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const user = req.user;
  
  const result = await fetchInventoryActivityLogsService({ filters, page, limit }, user);
  
  res.status(200).json({
    success: true,
    message: 'Inventory activity logs fetched successfully',
    data: result,
  });
});

module.exports = {
  getInventoryActivityLogsController,
};
