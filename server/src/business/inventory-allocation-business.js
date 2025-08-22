/**
 * @typedef {Object} Batch
 * @property {string} batch_id
 * @property {number} warehouse_quantity
 * @property {number} reserved_quantity
 * @property {string|Date} expiry_date
 * @property {any} [key] - Additional metadata like sku_id, warehouse_id, etc.
 */

/**
 * @typedef {Batch & { allocated_quantity: number }} AllocatedBatch
 */

/**
 * Allocates inventory batches for each order item using the specified strategy (FEFO or FIFO).
 *
 * This function applies pure domain logic only — it performs no database operations or logging.
 * It maps each order item to a set of batches from the given input, choosing those that best fulfill
 * the requested quantity using the chosen strategy (default: FEFO).
 *
 * @param {Array<{
 *   order_item_id: string,
 *   sku_id?: string | null,
 *   packaging_material_id?: string | null,
 *   quantity_ordered: number
 * }>} orderItems - List of order items needing allocation.
 *
 * @param {Array<{
 *   batch_id: string,
 *   warehouse_id: string,
 *   warehouse_quantity: number,
 *   reserved_quantity?: number,
 *   expiry_date?: string | Date,
 *   inbound_date?: string | Date,
 *   sku_id?: string | null,
 *   packaging_material_id?: string | null
 * }>} batches - All available batches with relevant metadata.
 *
 * @param {'fefo' | 'fifo'} [strategy='fefo'] - Allocation strategy:
 *   - 'fefo': First Expiry, First Out
 *   - 'fifo': First Inbound, First Out
 *
 * @returns {Array<{
 *   order_item_id: string,
 *   sku_id: string | null,
 *   packaging_material_id: string | null,
 *   quantity_ordered: number,
 *   allocated: {
 *     allocatedBatches: Array<Object>,
 *     allocatedTotal: number,
 *     remaining: number,
 *     fulfilled: boolean
 *   }
 * }>} Allocation result for each order item.
 */
const allocateBatchesForOrderItems = (orderItems, batches, strategy = 'fefo') => {
  // Build indexes to avoid N×M filtering
  const bySku = new Map();
  const byMat = new Map();
  
  for (const b of batches || []) {
    if (b && b.sku_id) {
      if (!bySku.has(b.sku_id)) bySku.set(b.sku_id, []);
      bySku.get(b.sku_id).push(b);
    }
    if (b && b.packaging_material_id) {
      if (!byMat.has(b.packaging_material_id)) byMat.set(b.packaging_material_id, []);
      byMat.get(b.packaging_material_id).push(b);
    }
  }
  
  return (orderItems || []).map((item) => {
    const { order_item_id, sku_id, packaging_material_id, quantity_ordered } = item;
    
    const candidates = sku_id
      ? (bySku.get(sku_id) || [])
      : packaging_material_id
        ? (byMat.get(packaging_material_id) || [])
        : [];
    
    const { allocatedBatches, allocatedTotal, remaining, fulfilled } =
      allocateBatchesByStrategy(candidates, quantity_ordered, { strategy });
    
    return {
      order_item_id,
      sku_id: sku_id ?? null,
      packaging_material_id: packaging_material_id ?? null,
      quantity_ordered,
      allocated: { allocatedBatches, allocatedTotal, remaining, fulfilled },
    };
  });
};

/**
 * Allocate inventory from batches using a strategy (FEFO/FIFO), accumulating across batches.
 *
 * Strategy:
 *  - 'fefo' => sort by expiry_date ASC
 *  - 'fifo' => sort by inbound_date ASC
 *
 * Edge cases handled:
 *  - Uses available = warehouse_quantity - reserved_quantity (clamped at 0)
 *  - Skips batches with no availability
 *  - Can optionally exclude expired batches
 *  - Returns meta: total allocated, remaining, fulfilled flag
 *
 * @param {Array<Object>} batches - Each batch should include:
 *   - warehouse_quantity: number
 *   - reserved_quantity?: number
 *   - expiry_date?: string|Date   (for FEFO)
 *   - inbound_date?: string|Date  (for FIFO)
 *   - other identifying fields (batch_id, warehouse_id, sku_id / packaging_material_id)
 * @param {number} requiredQuantity - Quantity requested
 * @param {Object} [options]
 * @param {'fefo'|'fifo'} [options.strategy='fefo']
 * @param {boolean} [options.excludeExpired=false] - If true, drop batches with expiry_date < now (FEFO only)
 * @param {Date} [options.now=new Date()] - Reference time for expiry checks
 * @returns {{
 *   allocatedBatches: Array<Object>, // original batch fields + allocated_quantity
 *   allocatedTotal: number,
 *   remaining: number,
 *   fulfilled: boolean
 * }}
 */
const allocateBatchesByStrategy = (
  batches,
  requiredQuantity,
  { strategy = 'fefo', excludeExpired = false, now = new Date() } = {}
) => {
  if (!Array.isArray(batches) || requiredQuantity <= 0) {
    return { allocatedBatches: [], allocatedTotal: 0, remaining: Math.max(0, requiredQuantity || 0), fulfilled: false };
  }
  
  const sortField = strategy === 'fifo' ? 'inbound_date' : 'expiry_date';
  
  // Normalize/prepare list
  let candidates = batches
    .map(b => {
      const reserved = Math.max(0, Number(b.reserved_quantity || 0));
      const qty = Math.max(0, Number(b.warehouse_quantity || 0) - reserved);
      return { ...b, _available: qty };
    })
    .filter(b => b._available > 0);
  
  // Optional: exclude expired for FEFO
  if (excludeExpired && sortField === 'expiry_date') {
    candidates = candidates.filter(b => b.expiry_date && new Date(b.expiry_date) >= now);
  }
  
  // Sort by strategy field; push records with missing sortField to the end
  candidates.sort((a, b) => {
    const da = a[sortField] ? new Date(a[sortField]).getTime() : Number.POSITIVE_INFINITY;
    const db = b[sortField] ? new Date(b[sortField]).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });
  
  const allocatedBatches = [];
  let accumulated = 0;
  
  for (const batch of candidates) {
    if (accumulated >= requiredQuantity) break;
    const needed = requiredQuantity - accumulated;
    const take = Math.min(batch._available, needed);
    if (take <= 0) continue;
    
    // Emit allocation row
    allocatedBatches.push({
      ...batch,
      allocated_quantity: take,
    });
    
    accumulated += take;
  }
  
  const allocatedTotal = accumulated;
  const remaining = Math.max(0, requiredQuantity - allocatedTotal);
  const fulfilled = remaining === 0;
  
  return { allocatedBatches, allocatedTotal, remaining, fulfilled };
};

module.exports = {
  allocateBatchesForOrderItems,
  allocateBatchesByStrategy,
};
