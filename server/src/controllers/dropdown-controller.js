const wrapAsync = require('../utils/wrap-async');
const { fetchBatchRegistryDropdownService } = require('../services/dropdown-service');
const { logInfo } = require('../utils/logger-helper');

/**
 * Controller to handle dropdown fetch requests for batch registry.
 * Supports query params for filtering, pagination, and exclusion logic.
 *
 * @route GET /api/batch-registry/dropdown
 * @query {string} [batchType] - 'product' or 'packaging_material'
 * @query {string} [excludeFrom] - 'warehouse_only' | 'location_only' | 'any_inventory'
 * @query {number} [limit=50] - Pagination limit
 * @query {number} [offset=0] - Pagination offset
 */
const getBatchRegistryDropdownController = wrapAsync(async (req, res) => {
  logInfo('Incoming request for batch registry dropdown', req, {
    context: 'dropdown-controller/getBatchRegistryDropdown',
    metadata: {
      query: req.query,
      user: req.user?.id, // if applicable
      ip: req.ip,
    },
  });
  
  const {
    batchType,
    excludeFrom,
    limit = 50,
    offset = 0,
  } = req.query;
  
  const filters = {};
  
  if (batchType) filters.batchType = batchType;
  if (excludeFrom) filters.excludeFrom = excludeFrom;
  
  const numericLimit = Number(limit);
  const numericOffset = Number(offset);
  
  const dropdownResult = await fetchBatchRegistryDropdownService({
    filters,
    limit: numericLimit,
    offset: numericOffset,
  });
  
  const { items, hasMore } = dropdownResult;
  
  res.status(200).json({
    success: true,
    message: `Successfully retrieved batch registry dropdown`,
    items,
    limit: numericLimit,
    offset: numericOffset,
    hasMore,
  });
});

module.exports = {
  getBatchRegistryDropdownController,
};
