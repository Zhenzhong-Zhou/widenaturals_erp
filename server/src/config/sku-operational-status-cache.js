/**
 * @file sku-operational-status-cache.js
 * @description In-memory cache for SKU operational status IDs.
 *
 * Resolves status UUIDs by their well-known string codes at boot time and
 * stores them grouped by domain (orders, allocations, transfer items).
 * Downstream availability logic reads from this cache instead of querying
 * the database on every request.
 *
 * Lifecycle:
 *   - `initSkuOperationalStatusCache` must be called once during startup.
 *   - `getSkuOperationalStatusIds` is safe to call any time after that.
 */

'use strict';

const AppError = require('../utils/AppError');
const {
  getOrderStatusesByCodes,
} = require('../repositories/order-status-repository');
const {
  getInventoryAllocationStatusesByCodes,
} = require('../repositories/inventory-allocation-status-repository');
const {
  getTransferItemStatusesByCodes,
} = require('../repositories/transfer-order-item-status-repository');
const {
  logSystemInfo,
  logSystemException,
} = require('../utils/logging/system-logger');

const CONTEXT = 'sku-operational-status-cache';

// -----------------------------------------------------------------------------
// Cache state
// -----------------------------------------------------------------------------

/** @type {{ order: string[], allocation: string[], transfer: string[] } | null} */
let SKU_OPERATIONAL_STATUS_IDS = null;

// -----------------------------------------------------------------------------
// Operational status code definitions
//
// These are the well-known string codes seeded into the database.
// Any code listed here must exist in the DB — a missing code is treated as a
// misconfigured seed, not a query error, and will abort startup.
// -----------------------------------------------------------------------------

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
  'RETURN_REQUESTED',
];

const SKU_ACTIVE_ALLOCATION_CODES = [
  'ALLOC_PENDING',
  'ALLOC_CONFIRMED',
  'ALLOC_PARTIAL',
  'ALLOC_FULFILLING',
];

const SKU_ACTIVE_TRANSFER_ITEM_CODES = [
  'TRANSFER_ITEM_PENDING',
  'TRANSFER_ITEM_ALLOCATED',
];

// -----------------------------------------------------------------------------
// Initializer
// -----------------------------------------------------------------------------

/**
 * Loads and caches SKU operational status IDs at application startup.
 *
 * Fetches status rows for each domain in parallel, validates that every
 * required code was found, then stores the resolved UUIDs grouped by domain.
 *
 * Must be called once during startup before any SKU availability logic runs.
 * Subsequent calls are safe but will re-fetch and overwrite the cache.
 *
 * @async
 * @param {import('pg').PoolClient|null} [client=null]
 *   Optional PostgreSQL client. Pass a transactional client when calling
 *   during a boot-time transaction; omit to use the default pool.
 * @returns {Promise<void>}
 * @throws {AppError} If any required status codes are absent from the database,
 *   indicating a missing or incomplete seed. Also, re-throws any unexpected
 *   query errors after logging them.
 */
const initSkuOperationalStatusCache = async (client = null) => {
  try {
    // Fetch all three domains in parallel — they have no dependency on each other.
    const [orderStatuses, allocationStatuses, transferStatuses] =
      await Promise.all([
        getOrderStatusesByCodes(SKU_ACTIVE_ORDER_CODES, client),
        getInventoryAllocationStatusesByCodes(
          SKU_ACTIVE_ALLOCATION_CODES,
          client
        ),
        getTransferItemStatusesByCodes(SKU_ACTIVE_TRANSFER_ITEM_CODES, client),
      ]);

    // If the DB returned fewer rows than codes requested, at least one code is
    // missing from the seed data. Treat this as a fatal misconfiguration rather
    // than a partial success — availability logic depends on the full set.
    if (
      orderStatuses.length !== SKU_ACTIVE_ORDER_CODES.length ||
      allocationStatuses.length !== SKU_ACTIVE_ALLOCATION_CODES.length ||
      transferStatuses.length !== SKU_ACTIVE_TRANSFER_ITEM_CODES.length
    ) {
      throw AppError.validationError(
        'SKU operational status cache initialization failed: one or more required status codes are missing from the database. Check that all seed data has been applied.'
      );
    }

    SKU_OPERATIONAL_STATUS_IDS = {
      order: orderStatuses.map((s) => s.id),
      allocation: allocationStatuses.map((s) => s.id),
      transfer: transferStatuses.map((s) => s.id),
    };

    logSystemInfo('SKU operational status cache initialized', {
      context: CONTEXT,
      orderCount: SKU_OPERATIONAL_STATUS_IDS.order.length,
      allocationCount: SKU_OPERATIONAL_STATUS_IDS.allocation.length,
      transferCount: SKU_OPERATIONAL_STATUS_IDS.transfer.length,
    });
  } catch (error) {
    logSystemException(
      error,
      'Failed to initialize SKU operational status cache',
      {
        context: CONTEXT,
      }
    );
    throw error;
  }
};

// -----------------------------------------------------------------------------
// Accessor
// -----------------------------------------------------------------------------

/**
 * Returns the cached SKU operational status IDs grouped by domain.
 *
 * Each group contains the UUIDs of statuses that represent an "active"
 * operational state for that domain. Availability logic uses these to
 * determine whether a SKU is tied up in an in-progress order, allocation,
 * or transfer.
 *
 * @returns {{ order: string[], allocation: string[], transfer: string[] }}
 * @throws {AppError} If called before `initSkuOperationalStatusCache` has
 *   completed successfully.
 */
const getSkuOperationalStatusIds = () => {
  if (!SKU_OPERATIONAL_STATUS_IDS) {
    throw AppError.validationError(
      'SKU operational status cache has not been initialized. ' +
        'Ensure initSkuOperationalStatusCache() is called during startup.'
    );
  }

  return SKU_OPERATIONAL_STATUS_IDS;
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
  initSkuOperationalStatusCache,
  getSkuOperationalStatusIds,
};
