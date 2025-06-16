const wrapAsync = require('../utils/wrap-async');
const { fetchInventoryActivityLogsService } = require('../services/report-service');
const { normalizeParamArray } = require('../utils/object-utils');

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
    warehouseIds: normalizeParamArray(req.query.warehouseIds),
    locationIds: normalizeParamArray(req.query.locationIds),
    productIds: normalizeParamArray(req.query.productIds),
    skuIds: normalizeParamArray(req.query.skuIds),
    batchIds: normalizeParamArray(req.query.batchIds),
    actionTypeIds: normalizeParamArray(req.query.actionTypeIds),
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
  
  const { data, pagination } = await fetchInventoryActivityLogsService({ filters, page, limit }, user);
  
  res.status(200).json({
    success: true,
    message: 'Inventory activity logs fetched successfully',
    data,
    pagination,
  });
});

module.exports = {
  getInventoryActivityLogsController,
};
