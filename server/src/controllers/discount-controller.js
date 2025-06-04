const wrapAsync = require('../utils/wrap-async');
const { fetchAvailableDiscounts } = require('../services/discount-service');

const getDiscountsForDropdownController = wrapAsync(async (req, res, next) => {
  try {
    const discounts = await fetchAvailableDiscounts();
    res.json(discounts);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getDiscountsForDropdownController,
};
