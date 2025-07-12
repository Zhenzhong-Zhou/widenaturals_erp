const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedOrderTypesService,
} = require('../services/order-type-service');

/**
 * Controller for fetching paginated order type records.
 *
 * Normalizes pagination and sorting parameters,
 * passes filters and user info to the service layer,
 * and returns the result in a standard API response format.
 *
 * @route GET /order-types
 * @queryparam {number} [page=1] - Page number (1-based).
 * @queryparam {number} [limit=10] - Number of records per page.
 * @queryparam {string} [sortBy='name'] - Field to sort by.
 * @queryparam {'ASC'|'DESC'} [sortOrder='ASC'] - Sort direction.
 * @queryparam {string} [name] - Optional filter: fuzzy match on name.
 * @queryparam {string} [code] - Optional filter: fuzzy match on code (internal use).
 * @queryparam {string} [category] - Optional filter: order type category.
 * @queryparam {string} [statusId] - Optional filter: status ID.
 * @queryparam {boolean} [requiresPayment] - Optional filter: whether payment is required.
 * @queryparam {string} [createdBy] - Optional filter: creator user ID.
 * @queryparam {string} [updatedBy] - Optional filter: updater user ID.
 * @queryparam {string} [keyword] - Optional filter: fuzzy match across name, code, description.
 *
 * @returns {200} JSON API success response with paginated order type data.
 *
 * @throws {AppError} On service failure (handled by wrapAsync).
 */
const getPaginatedOrderTypesController = wrapAsync(async (req, res) => {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
  } = req.normalizedQuery;
  
  const { data, pagination } = await fetchPaginatedOrderTypesService({
    user: req.user,
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  res.status(200).json({
    success: true,
    message: 'Order types retrieved successfully.',
    data,
    pagination,
  });
});

module.exports = {
  getPaginatedOrderTypesController,
};
