const { getWarehouseLotAdjustmentTypes } = require('../repositories/lot-adjustment-type-repository');

/**
 * Fetch warehouse lot adjustment types.
 * Applies business rules before returning to controller.
 * @returns {Promise<Array<{ id: string, name: string }>>}
 */
const fetchWarehouseLotAdjustmentTypes = async () => {
  const adjustmentTypes = await getWarehouseLotAdjustmentTypes();
  console.log(adjustmentTypes);
  if (!adjustmentTypes.length) {
    throw new Error('No active warehouse lot adjustment types found.');
  }
  
  return adjustmentTypes;
};

module.exports = {
  fetchWarehouseLotAdjustmentTypes,
};
