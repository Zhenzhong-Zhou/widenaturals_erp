/**
 * @file transfer-queries.js
 * @description SQL query constants for transfer-repository.js.
 *
 * Exports:
 *  - SKU_HAS_ACTIVE_TRANSFERS_QUERY — existence check for active transfers on a SKU
 */

'use strict';

// $1: sku_id (UUID), $2: active transfer status ids (uuid[])
const SKU_HAS_ACTIVE_TRANSFERS_QUERY = `
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

module.exports = {
  SKU_HAS_ACTIVE_TRANSFERS_QUERY,
};
