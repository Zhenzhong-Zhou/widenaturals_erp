const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');
const { createAddressService, fetchPaginatedAddressesService } = require('../services/address-service');
const { normalizePaginationParams } = require('../utils/request-utils');

/**
 * Controller for creating one or more address records.
 *
 * Expects an array of address objects in the request body.
 * Logs the creation request with contextual metadata (record count, requester, trace ID).
 * Delegates to the service layer for actual creation.
 *
 * On success:
 * - Responds with 201 Created status and a success message.
 * - Returns created address data (single object or array depending on input size).
 *
 * @param req Express request containing the address data and authenticated user.
 * @param res Express response that returns the creation result.
 *
 * @returns {Promise<void>}
 * Sends the HTTP response with created data or lets wrapAsync handle errors.
 */
const createAddressController = wrapAsync(async (req, res) => {
  const addresses = req.body;
  const user = req.user;
  
  logInfo('Creating address record(s)', req, {
    context: 'address-controller/createAddressController',
    recordCount: addresses.length,
    requestedBy: user.id,
    requestId: req.id,
    traceId: req.traceId,
  });
  
  const result = await createAddressService(addresses, user);
  
  res.status(201).json({
    success: true,
    message:
      addresses.length > 1
        ? 'Bulk addresses created successfully.'
        : 'Address created successfully.',
    data: addresses.length > 1 ? result : result[0],
  });
});

/**
 * Controller for fetching paginated address records.
 *
 * Normalizes pagination and sorting parameters,
 * passes filters and user info to the service layer,
 * and returns the result in a standard API response format.
 *
 * @route GET /addresses
 * @queryparam {number} [page=1] - Page number (1-based).
 * @queryparam {number} [limit=10] - Number of records per page.
 * @queryparam {string} [sortBy='createdAt'] - Field to sort by.
 * @queryparam {'ASC'|'DESC'} [sortOrder='DESC'] - Sort direction.
 * @queryparam {string} [region] - Optional filter: region.
 * @queryparam {string} [country] - Optional filter: country.
 * @queryparam {string} [city] - Optional filter: city.
 * @queryparam {string} [customerId] - Optional filter: customer ID.
 * @queryparam {string} [createdBy] - Optional filter: creator user ID.
 * @queryparam {string} [updatedBy] - Optional filter: updater user ID.
 * @queryparam {string} [keyword] - Optional filter: search across recipient, label, email, phone, city.
 *
 * @returns {200} JSON API success response with paginated address data.
 *
 * @throws {AppError} On service failure (handled by wrapAsync).
 */
const getPaginatedAddressesController = wrapAsync(async (req, res) => {
  const { page, limit, sortOrder } = normalizePaginationParams(req.query);
  const { sortBy = 'createdAt', ...restQuery } = req.query;
  
  const filters = { ...restQuery };
  
  const { data, pagination } = await fetchPaginatedAddressesService({
    user: req.user,
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Addresses retrieved successfully.',
    data,
    pagination,
  });
});

module.exports = {
  createAddressController,
  getPaginatedAddressesController,
};
