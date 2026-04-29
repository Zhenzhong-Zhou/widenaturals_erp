/**
 * @file inventory-allocation-types.js
 * @description JSDoc typedef declarations for the inventory allocation domain.
 *
 * These types are shared across:
 *   - inventory-allocation-business.js
 *   - inventory-allocation-service.js
 *   - inventory-allocation-transformer.js
 *
 * No runtime exports — import via:
 *   @typedef {import('./inventory-allocation-types').TypeName} TypeName
 */

'use strict';

/**
 * @typedef {object} InventoryAllocationVisibilityAcl
 * @property {boolean}        canViewAllWarehouses  - True if user has unrestricted warehouse visibility.
 * @property {string[]|null}  assignedWarehouseIds  - Warehouse UUIDs the user is assigned to, or null if unrestricted.
 */

/**
 * @typedef {object} AllocationVisibilityFilters
 * @property {string[]}  [warehouseIds]      - Warehouse UUIDs to filter by.
 * @property {boolean}   [forceEmptyResult]  - When true, the query should be short-circuited with an empty result.
 */

/**
 * @typedef {object} OrderItemDisplayMeta
 * @property {string|null}  sku_id                    - SKU UUID if the item is a product.
 * @property {string|null}  packaging_material_id     - Packaging material UUID if the item is a material.
 * @property {string|null}  sku_code                  - SKU code alias (used by allocation queries).
 * @property {string|null}  sku                       - SKU code alias (used by review queries).
 * @property {string|null}  material_code             - Packaging material code alias.
 * @property {string|null}  packaging_material_code   - Packaging material code alias (review queries).
 * @property {string|null}  material_name             - Packaging material name alias.
 * @property {string|null}  packaging_material_name   - Packaging material name alias (review queries).
 */

/**
 * @typedef {object} AllocatableBatch
 * @property {string}       warehouse_inventory_id   - warehouse_inventory row UUID.
 * @property {string}       batch_id                 - Batch registry UUID.
 * @property {string}       warehouse_id             - Warehouse UUID.
 * @property {string}       warehouse_name           - Warehouse display name.
 * @property {number}       warehouse_quantity        - Total quantity in warehouse.
 * @property {number}       reserved_quantity        - Currently reserved quantity.
 * @property {string|null}  expiry_date              - Batch expiry date (ISO string).
 * @property {string|null}  inbound_date             - Batch inbound date (ISO string).
 * @property {string|null}  lot_number               - Batch lot number.
 * @property {string}       batch_type               - Either `'product'` or `'packaging_material'`.
 * @property {string|null}  sku_id                   - SKU UUID (product batches only).
 * @property {string|null}  packaging_material_id    - Packaging material UUID (packaging batches only).
 */

/**
 * @typedef {AllocatableBatch & { _available: number, allocated_quantity: number }} AllocatedBatch
 */

/**
 * @typedef {object} AllocationResult
 * @property {string}           order_item_id           - Order item UUID.
 * @property {string|null}      sku_id                  - SKU UUID or null.
 * @property {string|null}      packaging_material_id   - Packaging material UUID or null.
 * @property {number}           quantity_ordered         - Total quantity requested.
 * @property {object}           allocated
 * @property {AllocatedBatch[]} allocated.allocatedBatches  - Batches selected for this item.
 * @property {number}           allocated.allocatedTotal     - Total quantity allocated.
 * @property {number}           allocated.remaining          - Quantity still unallocated.
 * @property {boolean}          allocated.fulfilled          - True if fully allocated.
 * @property {boolean}          allocated.partial            - True if partially allocated.
 */

/**
 * @typedef {object} AllocationStatusPerItem
 * @property {string}   orderItemId       - Order item UUID.
 * @property {number}   orderedQty        - Total quantity ordered.
 * @property {number}   allocatedQty      - Total quantity allocated.
 * @property {boolean}  isMatched         - True if allocatedQty === orderedQty.
 * @property {'ORDER_ALLOCATED'|'ORDER_PARTIALLY_ALLOCATED'|'ORDER_BACKORDERED'} allocationStatus
 */

/**
 * @typedef {object} WarehouseBatchUpdate
 * @property {string}  id                  - warehouse_inventory row UUID.
 * @property {string}  warehouse_id        - Warehouse UUID.
 * @property {string}  batch_id            - Batch UUID.
 * @property {number}  warehouse_quantity  - Unchanged total warehouse quantity.
 * @property {number}  reserved_quantity   - Updated reserved quantity after allocation.
 * @property {string}  status_id           - Resolved inventory status UUID.
 */

/**
 * @typedef {object} OrderAllocationResultInput
 * @property {string}                     orderId                - Order UUID.
 * @property {Array<{allocation_id:string}>} inventoryAllocations - Created/updated allocation records.
 * @property {Array<{id:string}>}         warehouseUpdateIds     - Affected warehouse_inventory row IDs.
 * @property {string[]}                   inventoryLogIds        - Activity log UUIDs from bulk insert.
 * @property {AllocationStatusPerItem[]}  allocationResults      - Per-item allocation outcome.
 */

/**
 * @typedef {object} OrderAllocationResult
 * @property {string}   orderId                       - Order UUID.
 * @property {string[]} allocationIds                 - Created/updated allocation UUIDs.
 * @property {string[]} updatedWarehouseInventoryIds  - Affected warehouse_inventory UUIDs.
 * @property {string[]} logIds                        - Activity log UUIDs.
 * @property {boolean}  fullyAllocated                - True if all items are fully allocated.
 * @property {Array<{orderItemId:string, newStatus:string, isFullyAllocated:boolean}>} updatedItemStatuses
 */
