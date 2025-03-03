const { fetchAllLocations } = require('../services/location-service');
const wrapAsync = require('../utils/wrap-async');

const getAllLocationsController = wrapAsync(async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    const { locations, pagination } = await fetchAllLocations({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      message: 'Locations fetched successfully',
      locations,
      pagination,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getAllLocationsController,
};
