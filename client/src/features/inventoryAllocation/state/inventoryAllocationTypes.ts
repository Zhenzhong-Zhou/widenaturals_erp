import type {
  ApiSuccessResponse,
  AsyncState,
  PaginatedResponse,
  PaginationParams, ReduxPaginatedState,
  SortConfig,
} from '@shared-types/api';

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
 * Request body used to review inventory allocation records for a specific order.
 * Includes optional warehouse filters and specific allocation IDs to target.
 */
export interface AllocationReviewRequest {
  /** Filter allocations by these warehouse IDs (optional or empty for all) */
  warehouseIds: string[];
  
  /** Specific allocation UUIDs to review (optional or empty to review all for the order) */
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
  productId: string;
  /** SKU ID (UUID) */
  skuId: string;
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

/**
 * Snapshot of a specific warehouse's inventory state at the time of allocation review.
 */
export interface WarehouseInventorySummary {
  /** Unique ID of the warehouse inventory record (UUID) */
  id: string;
  
  /** Name of the warehouse (e.g., "WIDE Naturals Inc.") */
  warehouseName: string;
  
  /** Quantity physically on hand in this warehouse */
  warehouseQuantity: number;
  
  /** Quantity currently reserved across all orders */
  reservedQuantity: number;
  
  /** Human-readable inventory status (e.g., "In Stock", "Damaged", "Reserved") */
  statusName: string;
  
  /** ISO 8601 timestamp when the inventory status was last updated */
  statusDate: string;
  
  /** ISO 8601 timestamp indicating when the inventory was received (inbound) */
  inboundDate: string;
}

/** Shared base fields for all batch types */
export interface BaseBatchReview {
  /** Batch type (discriminator) */
  type: string;
  
  /** Shared lot number */
  lotNumber: string;
  
  /** Shared expiry date */
  expiryDate: string;
  
  /** Shared manufacture date */
  manufactureDate: string;
}

/** Product batch structure */
export interface ProductBatchReview extends BaseBatchReview {
  type: 'product';
}

/** Packaging material batch structure */
export interface PackagingMaterialBatchReview extends BaseBatchReview {
  type: 'packaging_material';
  
  /** Label of the packaging material at the time of snapshot */
  snapshotName: string;
}

/** Discriminated union */
export type BatchReview = ProductBatchReview | PackagingMaterialBatchReview;

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
  
  /** Audit: who created the allocation (maybe system or user) */
  createdBy: UserSummary;
  
  /** Audit: who last updated the allocation (maybe null/system) */
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
  
  /** List of relevant warehouse inventory records linked to this allocation (e.g., for showing status, quantity, reserved, etc.) */
  warehouseInventoryList: WarehouseInventorySummary[];
  
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

/**
 * High-level allocation summary status derived from raw allocation codes.
 */
export type AllocationSummaryStatus =
  | 'Failed'
  | 'Fully Allocated'
  | 'Partially Allocated'
  | 'Pending Allocation'
  | 'Unknown';

/**
 * Transformed and structured inventory allocation summary record,
 * typically used for paginated views or dashboards.
 */
export interface InventoryAllocationSummary {
  /** UUID of the order */
  orderId: string;
  
  /** Human-readable order number (e.g., SO-...) */
  orderNumber: string;
  
  /** Name of the order type (e.g., "Standard Sales Order") */
  orderType: string | null;
  
  /**
   * Code of the order category (e.g., "sales", "transfer", "purchase"). Nullable if not categorized.
   */
  orderCategory: string | null;
  
  /** Order status details */
  orderStatus: {
    name: string;
    code: string;
  };
  
  /** Customer info */
  customer: {
    fullName: string;
  };
  
  /** Payment method used (e.g., "Credit Card") */
  paymentMethod: string | null;
  
  /** Payment status (e.g., "Paid", "Unpaid") */
  paymentStatus: string | null;
  
  /** Name of the delivery method (e.g., "Standard", "Express"). Nullable if not set. */
  deliveryMethod: string | null;
  
  /** ISO timestamp of when the order was originally created. */
  orderCreatedAt: string;
  
  /** Full name of the user who created the order. */
  orderCreatedBy: string;
  
  /** ISO timestamp of the most recent update to the order. */
  orderUpdatedAt: string;
  
  /** Full name of the user who last updated the order. */
  orderUpdatedBy: string;
  
  /** Number of items in the order vs allocated */
  itemCount: {
    total: number;
    allocated: number;
  };
  
  /** Warehouses involved in this allocation */
  warehouses: {
    ids: string[];
    names: string;
  };
  
  /** Allocation status metadata */
  allocationStatus: {
    codes: string[]; // e.g., ['ALLOC_CONFIRMED']
    names: string;   // e.g., 'confirmed, pending'
    summary: AllocationSummaryStatus;
  };
  
  /** All inventory allocation IDs linked to this order */
  allocationIds: string[];
  
  /** Timestamp of the most recent allocation (UTC ISO string). Nullable if no allocations exist. */
  allocatedAt: string | null;
  
  /** Timestamp of the first allocation creation (UTC ISO string). Nullable if no allocations exist. */
  allocatedCreatedAt: string | null;
}

/**
 * Standard paginated response for inventory allocation listings.
 */
export type InventoryAllocationResponse = PaginatedResponse<InventoryAllocationSummary>;

/**
 * Filters used when fetching paginated inventory allocations.
 * Aligned with backend filtering schema.
 */
export interface InventoryAllocationFilters {
  // Allocation-level
  statusIds?: string[];
  warehouseIds?: string[];
  batchIds?: string[];
  allocationCreatedBy?: string;
  
  // Order-level
  orderNumber?: string;
  orderStatusId?: string;
  orderTypeId?: string;
  orderCreatedBy?: string;
  
  // Sales order-level
  paymentStatusId?: string;
  
  // --- Date range filters (aggregated MIN(ia.allocated_at)) ---
  aggregatedAllocatedAfter?: string;  // filters `aa.allocated_at >=`
  aggregatedAllocatedBefore?: string; // filters `aa.allocated_at <=`
  
  // --- Date range filters (aggregated MIN(ia.created_at)) ---
  aggregatedCreatedAfter?: string;  // filters `aa.allocated_created_at >=`
  aggregatedCreatedBefore?: string; // filters `aa.allocated_created_at <=`
  
  // Global fuzzy keyword search
  keyword?: string;
}

/**
 * Params for fetching paginated inventory allocation results.
 */
export interface FetchPaginatedInventoryAllocationsParams
  extends PaginationParams,
    SortConfig {
  filters?: InventoryAllocationFilters;
}

/**
 * Sortable field keys for inventory allocations.
 * Must match keys defined in backend sort map.
 */
export type InventoryAllocationSortField =
  // Allocation-level summary fields (FROM alloc_agg aa)
  | 'allocationStatus'
  | 'allocationStatusCodes'
  | 'allocationStatuses'
  | 'allocatedAt'
  | 'allocatedCreatedAt'
  
  // Warehouse display info
  | 'warehouseNames'
  
  // Order-level fields (FROM orders o)
  | 'orderNumber'
  | 'orderDate'
  | 'orderType'
  | 'orderStatus'
  | 'orderStatusDate'
  
  // Customer
  | 'customerName'
  | 'customerFirstName'
  | 'customerLastName'
  
  // Payment-related
  | 'paymentMethod'
  | 'paymentStatus'
  | 'deliveryMethod'
  
  // Audit fields
  | 'orderCreatedAt'
  | 'orderCreatedByFirstName'
  | 'orderCreatedByLastName'
  | 'orderUpdatedAt'
  | 'orderUpdatedByFirstName'
  | 'orderUpdatedByLastName'
  
  // Item counts
  | 'totalItems'
  | 'allocatedItems'
  
  // Fallback
  | 'defaultNaturalSort';

/**
 * Redux state slice for paginated inventory allocations.
 */
export type PaginatedInventoryAllocationState = ReduxPaginatedState<InventoryAllocationSummary>;

/** Represents the allocation status update for a single order item */
export interface AllocationItemStatusUpdate {
  /** UUID of the order item */
  orderItemId: string;
  
  /** Updated status code (e.g., "ORDER_ALLOCATED") */
  newStatus: string;
  
  /** Whether this item is now fully allocated */
  isFullyAllocated: boolean;
}

/** Payload returned from the inventory allocation confirmation endpoint */
export interface InventoryAllocationConfirmationPayload {
  /** UUID of the order that was confirmed */
  orderId: string;
  
  /** UUIDs of the confirmed allocation records */
  allocationIds: string[];
  
  /** UUIDs of the updated warehouse inventory records */
  updatedWarehouseInventoryIds: string[];
  
  /** UUIDs of the generated activity logs */
  logIds: { id: string }[];
  
  /** Whether the full order is now fully allocated */
  fullyAllocated: boolean;
  
  /** Updated statuses for individual order items */
  updatedItemStatuses: AllocationItemStatusUpdate[];
}

/** Standard API response wrapper for confirming inventory allocations */
export type InventoryAllocationConfirmationResponse =
  ApiSuccessResponse<InventoryAllocationConfirmationPayload>;

/**
 * State for tracking the result of an inventory allocation confirmation request.
 *
 * This state includes the full API response from the confirmation endpoint,
 * including success status, server message, and the confirmed allocation payload.
 * It follows the standardized `AsyncState` structure with `loading`, `error`, and `data`.
 *
 * @example
 * {
 *   loading: false,
 *   error: null,
 *   data: {
 *     success: true,
 *     message: "Inventory allocation confirmed successfully",
 *     data: {
 *       orderId: "...",
 *       allocationIds: [...],
 *       updatedWarehouseInventoryIds: [...],
 *       ...
 *     }
 *   }
 * }
 */
export type InventoryAllocationConfirmationState = AsyncState<InventoryAllocationConfirmationResponse | null>;
