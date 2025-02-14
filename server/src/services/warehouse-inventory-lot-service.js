const { adjustWarehouseInventoryLots } = require('../repositories/warehouse-inventory-lot-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Adjusts warehouse inventory based on lot adjustments.
 * @param {Array} records - List of inventory adjustments.
 * @param {String} user_id - The user making the adjustment.
 * @returns {Promise<Object>} - Result of the inventory adjustment.
 */
const adjustWarehouseInventory = async (records, user_id) => {
  try {
    // Process inventory adjustments using the repository function
    const result = await adjustWarehouseInventoryLots(records, user_id);
    console.log(result);
    return { data: result };
  } catch (error) {
    console.error(error);
    logError('Error in adjustWarehouseInventory service:', error.message);
    throw new AppError(`Inventory adjustment failed: ${error.message}`);
  }
}

module.exports = {
  adjustWarehouseInventory,
};
