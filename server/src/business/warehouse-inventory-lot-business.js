const {
  getAvailableInventoryLots,
} = require('../repositories/warehouse-inventory-lot-repository');
const {
  transformInventoryLots,
} = require('../transformers/warehouse-inventory-lot-transformer');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Business logic: Get available inventory lots for a given inventory item and warehouse.
 *
 * @param {Object} params
 * @param {string} params.inventoryId - Inventory ID to fetch lots for.
 * @param {string} [params.warehouseId] - Optional warehouse ID to narrow the search.
 * @param {'FEFO' | 'FIFO'} [params.strategy='FEFO'] - Allocation strategy.
 * @param {import('pg').PoolClient} [params.client] - Optional transaction client.
 * @returns {Promise<Array>} Transformed, filtered lots ready for client usage.
 */
const getAvailableInventoryLotsForClient = async ({
                                                    inventoryId,
                                                    warehouseId = null,
                                                    strategy = 'FEFO',
                                                    client,
                                                  }) => {
  try {
    const normalizedInventoryId = inventoryId?.trim();
    const normalizedStrategy = strategy?.toUpperCase();
    
    if (!normalizedInventoryId) {
      throw AppError.validationError('Inventory ID is required.');
    }
    
    if (!['FIFO', 'FEFO'].includes(normalizedStrategy)) {
      throw AppError.validationError(`Invalid allocation strategy: ${strategy}`);
    }
    
    const rawLots = await getAvailableInventoryLots(
      normalizedInventoryId,
      warehouseId,
      normalizedStrategy,
      client
    );
    
    if (!rawLots || rawLots.length === 0) {
      return [];
    }
    
    const transformedLots = transformInventoryLots(rawLots);
    
    // Optional filtering logic
    // const validLots = transformedLots.filter(lot => !lot.isNearExpiry);
    
    return transformedLots;
  } catch (error) {
    logError('Error in getAvailableInventoryLotsForClient:', error);
    throw AppError.businessError('Failed to retrieve available inventory lots');
  }
};

module.exports = {
  getAvailableInventoryLotsForClient,
};
