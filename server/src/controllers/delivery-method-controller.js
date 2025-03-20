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
    const includePickup = req.query.includePickup === 'true'; // Check if pickup methods should be included
    const deliveryMethods = await fetchAvailableMethodsForDropdown(includePickup);
    res.status(200).json(deliveryMethods);
  } catch (error) {
    next(error); // Passes error to error-handling middleware
  }
});

module.exports = {
  getDeliveryMethodsForDropdownController,
};
