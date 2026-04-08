/**
 * @file pricing-controller.js
 * @description HTTP request handlers for pricing records.
 *
 * Handles SKU-level pricing queries, full dataset export, and SKU pricing lookup.
 * Controllers never log — traceId injection and error logging are owned by middleware.
 *
 * Exports:
 *  - getPaginatedPricingSkusController — paginated SKU list for a pricing group
 *  - exportPricingRecordsController    — full export as CSV or XLSX
 *  - getPricingBySkuIdController       — all pricing groups a SKU belongs to
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedPricingSkusService,
  exportPricingRecordsService,
  fetchPricingBySkuIdService,
} = require('../services/pricing-service');
const { exportData } = require('../utils/export-utils');

// ─── Pricing SKUs ─────────────────────────────────────────────────────────────

/**
 * GET /pricing-groups/:pricingGroupId/skus
 * Fetches a paginated list of SKUs assigned to a pricing group.
 *
 * @param {string} req.params.pricingGroupId        - UUID of the pricing group.
 * @param {Object} req.normalizedQuery              - { page, limit, sortBy, sortOrder, filters }
 * @param {Object} req.user                         - Authenticated user object.
 */
const getPaginatedPricingSkusController = wrapAsyncHandler(async (req, res) => {
  const { pricingGroupId }                          = req.params;
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  const user = req.auth.user;
  
  const { data, pagination } = await fetchPaginatedPricingSkusService({
    pricingGroupId,
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
    user,
  });
  
  res.status(200).json({
    success:    true,
    message:    'Pricing SKUs retrieved successfully.',
    data,
    pagination,
    traceId:    req.traceId,
  });
});

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * GET /pricing/export
 * Exports all pricing records matching the given filters as CSV or XLSX.
 *
 * @param {Object} req.normalizedQuery              - { filters }
 * @param {string} req.query.exportFormat           - 'csv' | 'xlsx'
 * @param {Object} req.user                         - Authenticated user object.
 */
const exportPricingRecordsController = wrapAsyncHandler(async (req, res) => {
  const { filters }      = req.normalizedQuery;
  const { exportFormat } = req.query;
  const user = req.auth.user;
  
  const exportRows = await exportPricingRecordsService({
    filters,
    user,
  });
  
  const { fileBuffer, contentType, filename } = await exportData({
    data:         exportRows,
    exportFormat,
    filename:     'pricing_export',
    title:        'Pricing Export',
  });
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(fileBuffer);
});

// ─── By SKU ───────────────────────────────────────────────────────────────────

/**
 * GET /skus/:skuId/pricing
 * Fetches all pricing groups a SKU belongs to.
 *
 * @param {string} req.params.skuId - UUID of the SKU.
 */
const getPricingBySkuIdController = wrapAsyncHandler(async (req, res) => {
  const { skuId } = req.params;
  
  const data = await fetchPricingBySkuIdService(skuId);
  
  res.status(200).json({
    success: true,
    message: 'Pricing retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

module.exports = {
  getPaginatedPricingSkusController,
  exportPricingRecordsController,
  getPricingBySkuIdController,
};
