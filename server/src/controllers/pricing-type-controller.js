/**
 * @file pricing-type-controller.js
 * @description HTTP request handlers for pricing type records.
 *
 * Handles paginated pricing type list and single record retrieval.
 * Controllers never log — traceId injection and error logging are owned by middleware.
 *
 * Exports:
 *  - getPaginatedPricingTypesController — paginated pricing type list
 *  - getPricingTypeByIdController       — single pricing type detail by ID
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedPricingTypesService,
  fetchPricingTypeByIdService,
} = require('../services/pricing-type-service');

/**
 * GET /pricing-types
 * Fetches a paginated list of pricing types.
 *
 * @param {Object} req.normalizedQuery - { page, limit, sortBy, sortOrder, filters }
 */
const getPaginatedPricingTypesController = wrapAsyncHandler(
  async (req, res) => {
    const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

    const { data, pagination } = await fetchPaginatedPricingTypesService({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
      user: req.auth.user,
    });

    res.status(200).json({
      success: true,
      message: 'Pricing types retrieved successfully.',
      data,
      pagination,
      traceId: req.traceId,
    });
  }
);

/**
 * GET /pricing-types/:pricingTypeId
 * Fetches a single pricing type by ID.
 *
 * @param {string} req.params.pricingTypeId - UUID of the pricing type.
 */
const getPricingTypeByIdController = wrapAsyncHandler(async (req, res) => {
  const { pricingTypeId } = req.params;

  const data = await fetchPricingTypeByIdService(pricingTypeId);

  res.status(200).json({
    success: true,
    message: 'Pricing type retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

module.exports = {
  getPaginatedPricingTypesController,
  getPricingTypeByIdController,
};
