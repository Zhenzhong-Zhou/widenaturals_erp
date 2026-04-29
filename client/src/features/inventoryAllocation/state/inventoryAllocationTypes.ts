import type {
  ApiSuccessResponse,
  AsyncState,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';

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
  | 'fifo' // First-In-First-Out
  | 'fefo' // First-Expiry-First-Out
  | 'lifo' // Last-In-First-Out
  | 'custom' // Manually prioritized
  | string; // Future custom strategy fallback

/**
 * Request body payload used to initiate automatic inventory allocation.
 *
 * This payload configures how the server should attempt to allocate
 * inventory batches for all items within an order.
 */
export interface AllocateInventoryBody {
  /**
   * Allocation strategy used to select inventory batches.
   *
   * - `fefo` → First Expiry, First Out (default)
   * - `fifo` → First In, First Out
   *
   * If omitted, the server applies its default strategy.
   */
  strategy?: AllocationStrategy;

  /**
   * Warehouse identifier used to restrict allocation scope.
   *
   * When provided, only inventory located in this warehouse
   * will be considered during allocation.
   *
   * If omitted, the server may determine the warehouse automatically
   * or return a validation error depending on system configuration.
   */
  warehouseId?: string;

  /**
   * Allows allocation to proceed even if the full requested quantity
   * cannot be satisfied.
   *
   * Behavior:
   * - `false` (default): the server throws an `INSUFFICIENT_INVENTORY`
   *   validation error if the requested quantity cannot be fully allocated.
   *
   * - `true`: the server allocates all available inventory batches
   *   and leaves the remaining quantity unallocated.
   *
   * This flag is typically used during a **second allocation attempt**
   * after the UI prompts the user to confirm partial allocation.
   */
  allowPartial?: boolean;
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
export type AllocateInventoryResponse =
  ApiSuccessResponse<AllocateInventoryData>;

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

  /**
   * Internal status code used for program logic (e.g., "ORDER_ALLOCATED", "ALLOC_CONFIRMED").
   * Not intended for direct display in the UI.
   */
  statusCode: string;

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
export type BatchReview =
  | ProductBatchReview
  | PackagingMaterialBatchReview
  | { type: string };

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
  product: ProductSummary | null;

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

/**
 * API success response for inventory allocation review requests.
 *
 * Wraps allocation review data using the standard success response contract.
 */
export type InventoryAllocationReviewApiResponse =
  ApiSuccessResponse<InventoryAllocationReviewData>;

/**
 * Flattened order-level metadata for an inventory allocation review.
 *
 * Derived from the order domain model and normalized for UI consumption.
 */
export interface FlattenedAllocationOrderHeader {
  orderNumber: string;
  note: string | null;
  createdBy: string;
  orderStatus: string;
  orderStatusCode: string;
  orderStatusId: string;
  salespersonId: string;
  salespersonName: string;
}

/**
 * Flattened allocation item used in inventory allocation review screens.
 *
 * Combines allocation, order item, product / packaging material,
 * batch, and warehouse inventory data into a single UI-friendly structure.
 *
 * All nested domain objects are resolved and normalized at the
 * transformer layer.
 */
export interface FlattenedAllocationReviewItem {
  allocationId: string;
  allocationStatus: string;
  allocationStatusCode: string;
  allocatedQuantity: number;
  createdAt: string;
  updatedAt: string;

  orderItemId: string;
  orderId: string;
  orderItemStatusName: string;
  orderItemStatusCode: string;
  orderItemStatusDate: string;
  quantityOrdered: number;

  skuCode: string | null;
  barcode: string | null;
  productName: string | null;

  packagingMaterialCode: string | null;
  packagingMaterialLabel: string | null;

  batchLotNumber: string | null;
  batchExpiryDate: string | null;
  manufactureDate: string | null;
  batchType: 'product' | 'packaging_material' | 'unknown';

  createdByName: string;
  updatedByName: string;

  warehouseInventoryList: {
    id: string;
    warehouseQuantity: number;
    reservedQuantity: number;
    statusName: string;
    statusDate: string;
    warehouseName: string;
    inboundDate: string;
  }[];
}

/**
 * Payload structure for inventory allocation review data.
 *
 * Includes order-level metadata and a list of flattened allocation items.
 */
export interface InventoryAllocationReviewListData {
  header: FlattenedAllocationOrderHeader;
  items: FlattenedAllocationReviewItem[];
}

/**
 * Thunk and UI response for inventory allocation review requests.
 *
 * Contains flattened, UI-ready allocation review data returned
 * from the backend.
 */
export type InventoryAllocationReviewResponse =
  ApiSuccessResponse<InventoryAllocationReviewListData>;

/**
 * Redux state shape for the inventory allocation review feature.
 *
 * Extends the generic async state with additional metadata
 * specific to allocation review behavior.
 */
export type InventoryAllocationReviewState =
  AsyncState<InventoryAllocationReviewListData | null> & {
    /**
     * Human-readable message returned from the backend (e.g. success message).
     * Used for UI notifications such as toasts or alerts.
     */
    message: string | null;

    /**
     * Timestamp (milliseconds since epoch) of the last successful fetch.
     * Used for caching, freshness checks, or display.
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

/** Order status within an inventory allocation summary. */
export interface InventoryAllocationOrderStatus {
  /** Display name of the order status. */
  name: string | null;
  /** Machine-readable status code. */
  code: string | null;
}

/** Customer info within an inventory allocation summary. */
export interface InventoryAllocationCustomer {
  /** Customer type: 'individual' or 'company'. */
  type: string | null;
  /** Customer first name. */
  firstname: string | null;
  /** Customer last name. */
  lastname: string | null;
  /** Company name (null for individual customers). */
  companyName: string | null;
  /** Resolved display name based on customer type. */
  customerName: string | null;
}

/** Payment status within an inventory allocation summary. */
export interface InventoryAllocationPaymentStatus {
  /** Display name of the payment status. */
  name: string | null;
  /** Machine-readable payment status code. */
  code: string | null;
}

/** User identity summary for created/updated by fields. */
export interface InventoryAllocationUserSummary {
  /** User first name. */
  firstname: string | null;
  /** User last name. */
  lastname: string | null;
  /** Resolved full name. */
  fullName: string | null;
}

/** Item count breakdown for an allocation. */
export interface InventoryAllocationItemCount {
  /** Total order items. */
  total: number;
  /** Items with inventory allocated. */
  allocated: number;
}

/** Warehouses involved in an allocation. */
export interface InventoryAllocationWarehouses {
  /** UUIDs of warehouses used. */
  ids: string[];
  /** Comma-separated warehouse names. */
  names: string;
}

/** Aggregate allocation status across all items in an order. */
export interface InventoryAllocationStatus {
  /** Distinct status codes across allocations. */
  codes: string[];
  /** Comma-separated status names. */
  names: string;
  /** Rolled-up summary status (e.g. 'fully_allocated', 'partial', 'pending'). */
  summary: AllocationSummaryStatus;
}

/** Full inventory allocation summary record as returned by the paginated list API. */
export interface InventoryAllocationSummary {
  /** Order UUID. */
  orderId: string;
  /** Human-readable order number. */
  orderNumber: string;
  /** Order type (e.g. 'wholesale', 'retail'). */
  orderType: string | null;
  /** Order category. */
  orderCategory: string | null;
  
  /** Current order status. */
  orderStatus: InventoryAllocationOrderStatus;
  
  /** Customer associated with the order. */
  customer: InventoryAllocationCustomer;
  
  /** Payment method used. */
  paymentMethod: string | null;
  /** Current payment status. */
  paymentStatus: InventoryAllocationPaymentStatus;
  /** Delivery method. */
  deliveryMethod: string | null;
  
  /** User who created the order. */
  orderCreatedBy: InventoryAllocationUserSummary;
  /** User who last updated the order. */
  orderUpdatedBy: InventoryAllocationUserSummary;
  
  /** Item count breakdown. */
  itemCount: InventoryAllocationItemCount;
  
  /** Warehouses involved in the allocation. */
  warehouses: InventoryAllocationWarehouses;
  
  /** Aggregate allocation status. */
  allocationStatus: InventoryAllocationStatus;
  
  /** UUIDs of individual allocation records. */
  allocationIds: string[];
  
  /** Timestamp of the most recent allocation action. */
  allocatedAt: string | null;
  /** Timestamp when the allocation was first created. */
  allocatedCreatedAt: string | null;
}

/** Paginated API response for inventory allocations. */
export type PaginatedInventoryAllocationApiResponse =
  PaginatedResponse<InventoryAllocationSummary>;

/**
 * Flattened, UI-ready inventory allocation summary row.
 *
 * Produced at the thunk ingestion boundary and stored in Redux
 * for paginated lists, tables, and dashboards.
 */
export interface FlattenedInventoryAllocationSummary {
  // --- Order ---
  orderId: string;
  orderNumber: string;
  orderType: string | null;
  orderCategory: string | null;
  
  // --- Order status ---
  orderStatusName: string | null;
  orderStatusCode: string | null;
  
  // --- Customer ---
  customerType: string | null;
  customerFirstname: string | null;
  customerLastname: string | null;
  customerCompanyName: string | null;
  customerName: string | null;
  
  // --- Payment ---
  paymentMethod: string | null;
  paymentStatusName: string | null;
  paymentStatusCode: string | null;
  
  // --- Delivery ---
  deliveryMethod: string | null;
  
  // --- Audit ---
  orderCreatedByFirstname: string | null;
  orderCreatedByLastname: string | null;
  orderCreatedBy: string | null;
  
  orderUpdatedByFirstname: string | null;
  orderUpdatedByLastname: string | null;
  orderUpdatedBy: string | null;
  
  // --- Item counts ---
  totalItemCount: number;
  allocatedItemCount: number;
  
  // --- Warehouses ---
  warehouseIds: string[];
  warehouseNames: string;
  
  // --- Allocation status ---
  allocationStatusCodes: string[];
  allocationStatusNames: string;
  allocationSummaryStatus: AllocationSummaryStatus;
  
  // --- Allocation metadata ---
  allocationIds: string[];
  allocatedAt: string | null;
  allocatedCreatedAt: string | null;
}

/** Paginated UI response for the inventory allocation list page. */
export type PaginatedInventoryAllocationListUiResponse =
  PaginatedResponse<FlattenedInventoryAllocationSummary>;

/** Filters available for querying the inventory allocation list. */
export interface InventoryAllocationFilters {
  // --- Allocation-level ---
  /** Filter by allocation status UUIDs. */
  statusIds?: string[];
  /** Filter by warehouse UUIDs. */
  warehouseIds?: string[];
  /** Filter by batch UUIDs. */
  batchIds?: string[];
  /** Filter by user who created the allocation (UUID). */
  allocationCreatedBy?: string;
  
  // --- Order-level ---
  /** Filter by order number (partial match). */
  orderNumber?: string;
  /** Filter by order status UUID. */
  orderStatusId?: string;
  /** Filter by order type UUID. */
  orderTypeId?: string;
  /** Filter by user who created the order (UUID). */
  orderCreatedBy?: string;
  
  // --- Sales order-level ---
  /** Filter by payment status UUID. */
  paymentStatusId?: string;
  
  // --- Date range (aggregated allocated_at) ---
  /** Filter allocations on or after this date (ISO string). */
  aggregatedAllocatedAfter?: string;
  /** Filter allocations on or before this date (ISO string). */
  aggregatedAllocatedBefore?: string;
  
  // --- Date range (aggregated created_at) ---
  /** Filter allocation creation on or after this date (ISO string). */
  aggregatedCreatedAfter?: string;
  /** Filter allocation creation on or before this date (ISO string). */
  aggregatedCreatedBefore?: string;
  
  // --- Search ---
  /** Fuzzy keyword search across order number, SKU, product name, or customer. */
  keyword?: string;
}

/** Full query parameter shape for the inventory allocation list endpoint. */
export interface InventoryAllocationQueryParams extends PaginationParams, SortConfig {
  filters?: InventoryAllocationFilters;
}

/** Valid sort field keys for the inventory allocation list. */
export type InventoryAllocationSortField =
// Allocation-level
  | 'allocationStatus'
  | 'allocationStatuses'
  | 'allocatedAt'
  | 'allocatedCreatedAt'
  | 'warehouseNames'
  | 'allocatedItems'
  
  // Order-level
  | 'orderNumber'
  | 'orderDate'
  | 'orderType'
  | 'orderStatus'
  
  // Customer
  | 'customerName'
  | 'customerFirstname'
  | 'customerLastname'
  | 'customerCompanyName'
  
  // Payment
  | 'paymentMethod'
  | 'paymentStatus'
  | 'deliveryMethod'
  
  // Audit
  | 'createdByFirstname'
  | 'createdByLastname'
  | 'updatedByFirstname'
  | 'updatedByLastname'
  
  // Item counts
  | 'totalItems'
  
  // Fallback
  | 'defaultNaturalSort';

/** Redux state shape for the inventory allocation list slice. */
export type InventoryAllocationListState =
  ReduxPaginatedState<FlattenedInventoryAllocationSummary>;

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
export type InventoryAllocationConfirmationState =
  AsyncState<InventoryAllocationConfirmationResponse | null>;
