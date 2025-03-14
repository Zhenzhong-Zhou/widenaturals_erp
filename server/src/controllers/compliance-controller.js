const { fetchAllCompliances } = require('../services/compliance-service');
const wrapAsync = require('../utils/wrap-async');

/**
 * Controller to handle fetching all compliance records.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next function.
 */
const fetchAllCompliancesController = wrapAsync(async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    // Convert query params to numbers where needed
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    // Call service function to fetch compliances
    const response = await fetchAllCompliances(
      pageNumber,
      limitNumber,
      sortBy,
      sortOrder
    );

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  fetchAllCompliancesController,
};
