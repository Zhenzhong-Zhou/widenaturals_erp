const { existsQuery } = require('./utils/repository-helper');

/**
 * Checks whether a SKU is involved in any active transfer order items.
 *
 * An active transfer is defined as a transfer_order_item record whose
 * status_id matches one of the provided operational transfer status UUIDs.
 *
 * This function is used by business-layer guards to prevent
 * SKU archival or deletion when active transfers exist.
 *
 * Relationships:
 *   transfer_order_items → batch_registry → product_batches → SKU
 *
 * @param {string} skuId - UUID of the SKU.
 * @param {string[]} activeTransferStatusIds
 *   Array of transfer status UUIDs considered "active".
 * @param {import('pg').PoolClient|null} [client]
 *   Optional transactional client.
 *
 * @returns {Promise<boolean>}
 *   Returns true if at least one active transfer references the SKU,
 *   false otherwise.
 *
 * @throws {AppError.databaseError}
 *   If the database query fails.
 */
const skuHasActiveTransfers = async (
  skuId,
  activeTransferStatusIds,
  client = null
) => {
  const context = 'transfer-repository/skuHasActiveTransfers';
  
  const queryText = `
    SELECT 1
    FROM transfer_order_items toi
    JOIN batch_registry br
      ON toi.batch_id = br.id
    JOIN product_batches pb
      ON br.product_batch_id = pb.id
    WHERE pb.sku_id = $1
      AND toi.status_id = ANY($2::uuid[])
    LIMIT 1
  `;
  
  return existsQuery(
    queryText,
    [skuId, activeTransferStatusIds],
    context,
    'Failed to check SKU active transfer dependency',
    client
  );
};

module.exports = {
  skuHasActiveTransfers,
};
