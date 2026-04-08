/**
 * @file transfer-order-item-repository.js
 * @description Database access layer for transfer order records.
 *
 * Exports:
 *  - skuHasActiveTransfers — existence check for active transfers on a SKU
 */

'use strict';

const { existsQuery } = require('./utils/repository-helper');
const { SKU_HAS_ACTIVE_TRANSFERS_QUERY } = require('./queries/transfer-order-item-queries');

// ─── Active Transfer Check ────────────────────────────────────────────────────

/**
 * Returns true if the SKU has any transfer order items in an active status.
 *
 * @param {string}                  skuId                 - UUID of the SKU to check.
 * @param {string[]}                activeTransferStatusIds - Active status UUIDs to match against.
 * @param {import('pg').PoolClient} [client]              - Optional transaction client.
 *
 * @returns {Promise<boolean>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const skuHasActiveTransfers = async (skuId, activeTransferStatusIds, client = null) => {
  const context = 'transfer-repository/skuHasActiveTransfers';
  
  return existsQuery(
    SKU_HAS_ACTIVE_TRANSFERS_QUERY,
    [skuId, activeTransferStatusIds],
    context,
    'Failed to check SKU active transfer dependency',
    client
  );
};

module.exports = {
  skuHasActiveTransfers,
};
