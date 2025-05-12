const wrapAsync = require('../utils/wrap-async');
const {
  fetchProductDropdownList,
  fetchAvailableProductsForDropdown,
} = require('../services/product-service');

const getProductsDropdownListController = wrapAsync(async (req, res, next) => {
  const { warehouseId } = req.params;
  try {
    const products = await fetchProductDropdownList(warehouseId);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

/**
 * Controller to fetch products for dropdown.
 * Filters by active status and supports search by product name, SKU, or barcode.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
const getProductsForDropdownController = wrapAsync(async (req, res, next) => {
  try {
    const { search = null, limit = 100 } = req.query;

    // Fetch products with optional search term and limit
    const products = await fetchAvailableProductsForDropdown(
      search,
      parseInt(limit, 10)
    );

    // Send the response
    res.status(200).json(products);
  } catch (error) {
    next(error); // Passes error to error-handling middleware
  }
});

module.exports = {
  getProductsDropdownListController,
  getProductsForDropdownController,
};
