import type { ApiSuccessResponse, AsyncState } from '@shared-types/api';

/**
 * Parameters extracted from the URL path for allocation requests.
 * Typically used in a route like `/inventory-allocations/allocate/:orderId`.
 */
export interface AllocateInventoryParams {
  /** UUID of the order to allocate inventory for (from `req.params`) */
  orderId: string;
}

/**
 * Enum-like strategy options for how inventory should be allocated.
 * Accepts known strategies or future custom ones.
 */
export type AllocationStrategy =
  | 'fifo'   // First-In-First-Out
  | 'fefo'   // First-Expiry-First-Out
  | 'lifo'   // Last-In-First-Out
  | 'custom' // Manually prioritized
  | string;  // Future custom strategy fallback

/**
 * Request body payload sent during inventory allocation.
 */
export interface AllocateInventoryBody {
  /** Allocation strategy to use (optional, defaults server-side) */
  strategy?: AllocationStrategy;
  
  /** Warehouse to constrain allocation scope to (optional UUID) */
  warehouseId?: string;
}

/**
 * Core response payload from the allocation API.
 * Returned in the `.data` field of the standard `ApiSuccessResponse`.
 */
export interface AllocateInventoryData {
  /** UUID of the order that was allocated */
  orderId: string;
  
  /** Array of UUIDs representing the inventory records allocated */
  allocationIds: string[];
}

/**
 * Full response structure for a successful allocation request.
 * Wraps the `AllocateInventoryData` in a standard success format.
 */
export type AllocateInventoryResponse = ApiSuccessResponse<AllocateInventoryData>;

/**
 * Redux state shape for tracking the async allocation process.
 * Includes loading state, error message, and response data.
 */
export type AllocateInventoryState = AsyncState<AllocateInventoryData | null>;

/**
 * Request body to review specific allocation records for an order.
 */
export interface AllocationReviewRequest {
  /** Allocation UUIDs to review */
  allocationIds: string[];
}

/** Minimal salesperson info shown in the review header. */
export interface SalespersonSummary {
  /** Salesperson user ID (UUID) */
  id: string;
  /** Display name, e.g., "Root Admin" */
  fullName: string;
}

/** Minimal user info for audit fields (createdBy/updatedBy). */
export interface UserSummary {
  /** User ID (UUID) or null if unknown */
  id: string | null;
  /** Display name; may be "—" when unknown */
  fullName: string;
}

/** Minimal order status summary. */
export interface OrderStatusSummary {
  /** Order status ID (UUID) */
  id: string;
  
  /** Human-readable name (e.g., "Pending", "Confirmed") */
  name: string;
  
  /** Internal status code (e.g., "ORDER_PENDING") */
  code: string;
}

/** Header-level metadata for the order being reviewed. */
export interface OrderHeaderReview {
  /** Human-readable order number/code */
  orderNumber: string;
  
  /** Optional free-form note; may be null or empty string */
  note: string | null;
  
  /** Creator user ID (UUID) */
  createdBy: string;
  
  /** Salesperson responsible for the order */
  salesperson: SalespersonSummary;
  
  /** Current status of the order */
  orderStatus: OrderStatusSummary;
}

/**
 * Order item status snapshot.
 * (Optional helper interface; not strictly required unless you want reuse.)
 */
export interface OrderItemStatus {
  /** Status ID (UUID) */
  statusId: string;
  /** Status label, e.g., "Fully Allocated" */
  statusName: string;
  /** ISO timestamp when the status was set */
  statusDate: string;
}

/** Per-item metadata for the reviewed order. */
export interface OrderItemReview extends OrderItemStatus {
  /** Order item ID (UUID) */
  id: string;
  
  /** Parent order ID (UUID) */
  orderId: string;
  
  /** Ordered quantity for this item */
  quantityOrdered: number;
  
  /** Current status ID (UUID) */
  statusId: string;
  
  /** Human-readable status name (e.g., "Fully Allocated") */
  statusName: string;
  
  /** ISO timestamp when the item status was last updated */
  statusDate: string;
}

/** Product/SKU summary used by allocation rows. */
export interface ProductSummary {
  /** Product ID (UUID) */
  product_id: string;
  /** SKU ID (UUID) */
  sku_id: string;
  /** SKU code displayed to users */
  skuCode: string;
  /** UPC/EAN or internal barcode */
  barcode: string;
  /** Display name, e.g., "NMN 6000 - CA" */
  displayName: string;
}

/** Optional snapshot of packaging material used in the allocation (if applicable). */
export interface PackagingMaterialSnapshot {
  /** Packaging material ID (UUID) */
  id: string;
  
  /** Internal code for the packaging material (e.g., "CAP-WHITE-90MM") */
  code: string;
  
  /** Human-readable label (e.g., "White Cap - 90mm") */
  label: string;
}

/** Current warehouse inventory snapshot at time of review. */
export interface WarehouseInventorySummary {
  /** Warehouse inventory record ID (UUID) */
  id: string;
  
  /** On-hand quantity currently available in the warehouse */
  warehouseQuantity: number;
  
  /** Quantity already reserved across all orders */
  reservedQuantity: number;
  
  /** Human-readable inventory status (e.g., "In Stock", "Damaged") */
  statusName: string;
  
  /** ISO timestamp when the inventory status was last updated */
  statusDate: string;
}

/** Batch summary for the allocation (product or packaging material). */
export interface BatchReview {
  /**
   * Batch type. Server currently returns "product".
   * Keep `| string` to future-proof if new types are introduced.
   */
  type: 'product' | 'packaging_material' | string;
  
  /** Lot number for product batch (if applicable) */
  productLotNumber?: string;
  /** Expiry date (ISO) for product batch (if applicable) */
  productExpiryDate?: string;
  /** Inbound date (ISO) for product batch (if applicable) */
  productInboundDate?: string;
}

/** One allocation row linking an order item to a batch with quantities. */
export interface AllocationReviewItem {
  /** Allocation record ID (UUID) */
  allocationId: string;
  
  /** Linked order item ID (UUID) */
  orderItemId: string;
  
  /** Linked transfer order item ID (if applicable; may be null) */
  transferOrderItemId: string | null;
  
  /** Batch ID (UUID) used for this allocation */
  batchId: string;
  
  /** Quantity allocated from this batch to the order item */
  allocatedQuantity: number;
  
  /** Allocation status ID (UUID) */
  allocationStatusId: string;
  
  /** Human-readable status label, e.g., "Partially Allocated" */
  allocationStatusName: string;
  
  /** Status code used internally (e.g., "ALLOCATED_PARTIAL") */
  allocationStatusCode: string;
  
  /** ISO timestamp of when this allocation was created */
  createdAt: string;
  
  /** ISO timestamp of last update to this allocation */
  updatedAt: string;
  
  /** Audit: who created the allocation (may be system or user) */
  createdBy: UserSummary;
  
  /** Audit: who last updated the allocation (may be null/system) */
  updatedBy: UserSummary;
  
  /** Snapshot of the order item associated with this allocation */
  orderItem: OrderItemReview;
  
  /** Snapshot of the product or SKU associated with this allocation */
  product: ProductSummary;
  
  /**
   * Optional snapshot of packaging material info (if this is a packaging allocation).
   * Null if not applicable.
   */
  packagingMaterial?: PackagingMaterialSnapshot | null;
  
  /** Snapshot of current warehouse inventory levels at allocation time */
  warehouseInventory: WarehouseInventorySummary;
  
  /** Batch metadata (product or packaging) used for this allocation */
  batch: BatchReview;
}

/** The main data payload returned by the review endpoint. */
export interface InventoryAllocationReviewData {
  /** Order header metadata */
  header: OrderHeaderReview;
  /** Allocation rows included in the review */
  items: AllocationReviewItem[];
}

/** Generic API success wrapper (assumes your shared type exists). */
export type InventoryAllocationReviewResponse =
  ApiSuccessResponse<InventoryAllocationReviewData>;

/**
 * State shape for inventory allocation review slice.
 *
 * Combines generic async state fields (data, loading, error) with
 * additional metadata specific to the inventory allocation review feature.
 */
export type InventoryAllocationReviewState =
  AsyncState<InventoryAllocationReviewData | null> & {
  /**
   * Human-readable message returned from the backend (e.g., success message).
   * Useful for displaying toasts, alerts, or UI status.
   */
  message: string | null;
  
  /**
   * Timestamp (in milliseconds since epoch) of the last successful fetch.
   * Useful for caching, freshness checks, or display purposes.
   */
  lastFetchedAt: number | null;
};
