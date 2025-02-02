const wrapAsync = require('../utils/wrap-async');
const { fetchAllLocationTypes } = require('../services/location-type-service');

const getLocationTypesController = wrapAsync(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC' } = req.query;
  
  const locationTypes = await fetchAllLocationTypes({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Location types fetched successfully',
    data: locationTypes,
  });
});

module.exports = {
  getLocationTypesController,
};
