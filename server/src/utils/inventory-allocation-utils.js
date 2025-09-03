/**
 * Deduplicates warehouse and batch ID combinations from a list of allocation records.
 *
 * This function ensures that only unique (warehouse_id, batch_id) pairs are returned,
 * which is useful for row-level locking or bulk updates where duplicate locks would be redundant.
 *
 * @param {Array<{ warehouse_id: string, batch_id: string }>} allocationDetails - The allocation records to deduplicate.
 * @returns {Array<{ warehouse_id: string, batch_id: string }>} Unique (warehouse_id, batch_id) pairs.
 *
 * @example
 * const input = [
 *   { warehouse_id: 'w1', batch_id: 'b1' },
 *   { warehouse_id: 'w1', batch_id: 'b1' },
 *   { warehouse_id: 'w2', batch_id: 'b2' },
 * ];
 * const result = dedupeWarehouseBatchKeys(input);
 * // => [{ warehouse_id: 'w1', batch_id: 'b1' }, { warehouse_id: 'w2', batch_id: 'b2' }]
 */
const dedupeWarehouseBatchKeys = (allocationDetails) => {
  const keySet = new Set();
  const uniqueKeys = [];
  
  for (const { warehouse_id, batch_id } of allocationDetails) {
    const key = `${warehouse_id}::${batch_id}`;
    if (!keySet.has(key)) {
      keySet.add(key);
      uniqueKeys.push({ warehouse_id, batch_id });
    }
  }
  
  return uniqueKeys;
};

module.exports = {
  dedupeWarehouseBatchKeys,
};
