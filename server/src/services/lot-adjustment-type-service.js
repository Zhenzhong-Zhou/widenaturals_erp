const {
  getWarehouseLotAdjustmentTypesForDropdown,
} = require('../repositories/lot-adjustment-type-repository');

/**
 * Fetch warehouse lot adjustment types for dropdown.
 * Applies business rules before returning to the controller.
 * @returns {Promise<Array<{ id: string, name: string }>>}
 */
const fetchWarehouseLotAdjustmentTypesForDropDown = async () => {
  const adjustmentTypes = await getWarehouseLotAdjustmentTypesForDropdown();

  if (!adjustmentTypes.length) {
    throw new Error(
      'No available warehouse lot adjustment types for selection.'
    );
  }

  return adjustmentTypes;
};

module.exports = {
  fetchWarehouseLotAdjustmentTypesForDropDown,
};
