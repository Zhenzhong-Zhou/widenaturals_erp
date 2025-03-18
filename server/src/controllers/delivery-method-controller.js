const wrapAsync = require('../utils/wrap-async');
const { fetchAvailableMethodsForDropdown } = require('../services/delivery-method-service');

/**
 * Controller to handle delivery method requests.
 * Fetches available delivery methods and sends a response.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
const getDeliveryMethodsForDropdownController = wrapAsync(async (req, res, next) => {
  try {
    const deliveryMethods = await fetchAvailableMethodsForDropdown();
    res.status(200).json({ success: true, data: deliveryMethods });
  } catch (error) {
    next(error); // Passes error to error-handling middleware
  }
});

module.exports = {
  getDeliveryMethodsForDropdownController,
};
