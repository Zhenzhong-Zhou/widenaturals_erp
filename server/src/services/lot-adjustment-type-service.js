const {
  getWarehouseLotAdjustmentTypesForDropdown,
} = require('../repositories/lot-adjustment-type-repository');
const AppError = require('../utils/AppError');

/**
 * Fetch warehouse lot adjustment types for dropdown.
 * Applies business rules before returning to the controller.
 * @returns {Promise<Array<{ id: string, name: string }>>}
 */
const fetchWarehouseLotAdjustmentTypesForDropDown = async () => {
  const adjustmentTypes = await getWarehouseLotAdjustmentTypesForDropdown();

  if (!adjustmentTypes.length) {
    throw AppError.notFoundError(
      'No available warehouse lot adjustment types for selection.'
    );
  }

  return adjustmentTypes;
};

module.exports = {
  fetchWarehouseLotAdjustmentTypesForDropDown,
};
