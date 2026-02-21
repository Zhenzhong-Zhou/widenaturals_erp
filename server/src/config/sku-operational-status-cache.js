/**
 * @file sku-operational-status-cache.js
 *
 * Handles operational status ID caching for SKU availability logic.
 */

const AppError = require('../utils/AppError');
const { getOrderStatusesByCodes } = require('../repositories/order-status-repository');
const { getInventoryAllocationStatusesByCodes } = require('../repositories/inventory-allocation-status-repository');
const { getTransferItemStatusesByCodes } = require('../repositories/transfer-order-item-status-repository');
const {
  logSystemInfo,
  logSystemException,
} = require('../utils/system-logger');

// ---------------------------------------------
// Cache Holder
// ---------------------------------------------
let SKU_OPERATIONAL_STATUS_IDS = null;

// ---------------------------------------------
// Operational Status Code Definitions
// ---------------------------------------------
const SKU_ACTIVE_ORDER_CODES = [
  'ORDER_PENDING',
  'ORDER_EDITED',
  'ORDER_AWAITING_REVIEW',
  'ORDER_CONFIRMED',
  'ORDER_ALLOCATING',
  'ORDER_PARTIALLY_ALLOCATED',
  'ORDER_ALLOCATED',
  'ORDER_BACKORDERED',
  'ORDER_PROCESSING',
  'ORDER_PARTIALLY_FULFILLED',
  'ORDER_SHIPPED',
  'ORDER_OUT_FOR_DELIVERY',
  'RETURN_REQUESTED'
];

const SKU_ACTIVE_ALLOCATION_CODES = [
  'ALLOC_PENDING',
  'ALLOC_CONFIRMED',
  'ALLOC_PARTIAL',
  'ALLOC_FULFILLING'
];

const SKU_ACTIVE_TRANSFER_ITEM_CODES = [
  'TRANSFER_ITEM_PENDING',
  'TRANSFER_ITEM_ALLOCATED'
];

/**
 * Initializes the SKU operational status ID cache at application boot.
 *
 * This cache groups status UUIDs that represent "operational" states
 * affecting SKU availability across:
 *
 * - Orders
 * - Inventory Allocations
 * - Transfer Items
 *
 * These statuses are used by availability and business logic
 * to determine whether a SKU is considered operationally active.
 *
 * Behavior:
 * - Fetches status rows by predefined status codes.
 * - Validates that all required codes exist (fails fast if missing).
 * - Caches resolved UUIDs in memory for fast lookup.
 *
 * Must be executed during application startup before
 * any SKU availability logic is invoked.
 *
 * @param {import('pg').PoolClient|null} [client]
 *   Optional PostgreSQL client for boot-time transactional context.
 *
 * @throws {AppError.validationError}
 *   If required status seeds are missing.
 */
const initSkuOperationalStatusCache = async (client = null) => {
  const context = 'sku-operational-status-cache/initSkuOperationalStatusCache';
  
  try {
    const [orderStatuses, allocationStatuses, transferStatuses] =
      await Promise.all([
        getOrderStatusesByCodes(
          SKU_ACTIVE_ORDER_CODES,
          client
        ),
        getInventoryAllocationStatusesByCodes(
          SKU_ACTIVE_ALLOCATION_CODES,
          client
        ),
        getTransferItemStatusesByCodes(
          SKU_ACTIVE_TRANSFER_ITEM_CODES,
          client
        ),
      ]);
    
    // Safety check
    if (
      orderStatuses.length !== SKU_ACTIVE_ORDER_CODES.length ||
      allocationStatuses.length !== SKU_ACTIVE_ALLOCATION_CODES.length ||
      transferStatuses.length !== SKU_ACTIVE_TRANSFER_ITEM_CODES.length
    ) {
      throw AppError.validationError(
        'Operational status cache initialization failed. Some required status codes are missing.'
      );
    }
    
    SKU_OPERATIONAL_STATUS_IDS = {
      order: orderStatuses.map(s => s.id),
      allocation: allocationStatuses.map(s => s.id),
      transfer: transferStatuses.map(s => s.id),
    };
    
    logSystemInfo('SKU operational status cache initialized', {
      context,
      orderCount: SKU_OPERATIONAL_STATUS_IDS.order.length,
      allocationCount: SKU_OPERATIONAL_STATUS_IDS.allocation.length,
      transferCount: SKU_OPERATIONAL_STATUS_IDS.transfer.length,
    });
    
  } catch (error) {
    logSystemException(
      error,
      'Failed to initialize SKU operational status cache',
      { context }
    );
    throw error;
  }
};

/**
 * Returns cached operational status UUID groups.
 *
 * Used by SKU availability and business logic layers.
 *
 * @returns {{
 *   order: string[],
 *   allocation: string[],
 *   transfer: string[]
 * }}
 *
 * @throws {AppError.validationError}
 *   If the operational status cache has not been initialized.
 */
const getSkuOperationalStatusIds = () => {
  if (!SKU_OPERATIONAL_STATUS_IDS) {
    throw AppError.validationError(
      'SKU operational status cache not initialized.'
    );
  }
  return SKU_OPERATIONAL_STATUS_IDS;
};

module.exports = {
  initSkuOperationalStatusCache,
  getSkuOperationalStatusIds,
};
