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
  
  // Inline status fields (or extend OrderItemStatus above)
  statusId: string;
  statusName: string;
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

/** Current warehouse inventory snapshot at time of review. */
export interface WarehouseInventorySummary {
  /** Warehouse inventory record ID (UUID) */
  id: string;
  /** On-hand quantity in the warehouse */
  warehouseQuantity: number;
  /** Currently reserved quantity (all orders) */
  reservedQuantity: number;
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
  /** Batch ID (UUID) used for this allocation */
  batchId: string;
  /** Quantity allocated from this batch to the item */
  allocatedQuantity: number;
  
  /** Allocation status ID (UUID) */
  statusId: string;
  /** Allocation creation timestamp (ISO) */
  createdAt: string;
  
  /** Audit: who created the allocation */
  createdBy: UserSummary;
  /** Audit: who last updated the allocation (maybe unknown) */
  updatedBy: UserSummary;
  
  /** Snapshot of the order item */
  orderItem: OrderItemReview;
  /** Snapshot of the product/SKU */
  product: ProductSummary;
  /** Snapshot of warehouse inventory quantities */
  warehouseInventory: WarehouseInventorySummary;
  /** Snapshot of the batch used in the allocation */
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
