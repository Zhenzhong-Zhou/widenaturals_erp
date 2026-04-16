/**
 * @file pricing-group-controller.js
 * @description HTTP request handlers for pricing group records.
 *
 * Handles paginated pricing group list and single record retrieval.
 * Controllers never log — traceId injection and error logging are owned by middleware.
 *
 * Exports:
 *  - getPaginatedPricingGroupsController — paginated pricing group list
 *  - getPricingGroupByIdController       — single pricing group detail by ID
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedPricingGroupsService,
  fetchPricingGroupByIdService,
} = require('../services/pricing-group-service');

/**
 * GET /pricing-groups
 * Fetches a paginated list of pricing groups.
 *
 * @param {Object} req.normalizedQuery - { page, limit, sortBy, sortOrder, filters }
 * @param {Object} req.auth.user       - Authenticated user object.
 */
const getPaginatedPricingGroupsController = wrapAsyncHandler(
  async (req, res) => {
    const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

    const { data, pagination } = await fetchPaginatedPricingGroupsService({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
      user: req.auth.user,
    });

    res.status(200).json({
      success: true,
      message: 'Pricing groups retrieved successfully.',
      data,
      pagination,
      traceId: req.traceId,
    });
  }
);

/**
 * GET /pricing-groups/:pricingGroupId
 * Fetches a single pricing group by ID.
 *
 * @param {string} req.params.pricingGroupId - UUID of the pricing group.
 */
const getPricingGroupByIdController = wrapAsyncHandler(async (req, res) => {
  const { pricingGroupId } = req.params;

  const data = await fetchPricingGroupByIdService(pricingGroupId);

  res.status(200).json({
    success: true,
    message: 'Pricing group retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

module.exports = {
  getPaginatedPricingGroupsController,
  getPricingGroupByIdController,
};
