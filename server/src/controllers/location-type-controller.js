const wrapAsync = require('../utils/wrap-async');
const { fetchAllLocationTypes, fetchLocationTypeDetailByTypeId } = require('../services/location-type-service');

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

const getLocationTypeDetailController = wrapAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query;
    
    const { locationTypeDetail, pagination } = await fetchLocationTypeDetailByTypeId({
      id,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sortBy,
      sortOrder,
    });
    
    res.status(200).json({
      success: true,
      message: 'Location type details fetched successfully',
      locationTypeDetail,
      pagination,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getLocationTypesController,
  getLocationTypeDetailController,
};
