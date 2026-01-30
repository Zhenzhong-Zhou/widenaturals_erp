import type {
  ApiSuccessResponse,
  AsyncState,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';

/**
 * Request body payload for initiating outbound fulfillment.
 *
 * This object is sent in the POST body and contains
 * allocation references and optional notes.
 */
export interface InitiateFulfillmentBody {
  /**
   * Allocation identifiers to be included in this fulfillment.
   */
  allocations: {
    ids: string[];
  };

  /**
   * Optional free-form notes about the fulfillment itself.
   * Often used for system-generated or user-provided context.
   */
  fulfillmentNotes?: string;

  /**
   * Optional notes for shipment preparation or handling.
   * Can include delivery instructions or system-generated context.
   */
  shipmentNotes?: string;

  /**
   * Optional reference or comment for the shipment batch.
   * Defaults may be neutral (e.g. "No batch notes provided.")
   * if not explicitly provided by the user.
   */
  shipmentBatchNote?: string;
}

/**
 * Full request wrapper for initiating outbound fulfillment.
 *
 * The `orderId` is passed as a **path parameter** in the API route,
 * while the `body` contains the actual POST request payload.
 */
export interface InitiateFulfillmentRequest {
  /**
   * The order to initiate fulfillment for.
   * This is passed in the URL path param (`/orders/:orderId/...`).
   */
  orderId: string;

  /**
   * The request body containing allocations and notes.
   */
  body: InitiateFulfillmentBody;
}

/**
 * Response payload data shape for fulfillment initiation.
 */
export interface InitiateFulfillmentData {
  orderId: string;
  orderStatus: {
    id: string;
    updatedAt: string; // ISO datetime string
  };
  shipment: {
    id: string;
    batchId: string;
  };
  fulfillment: {
    id: string;
    statusId: string;
  };
  statusUpdates: {
    updatedOrderItemStatusIds: string[];
  };
}

/**
 * Full API response type for fulfillment initiation.
 */
export type InitiateFulfillmentResponse =
  ApiSuccessResponse<InitiateFulfillmentData>;

/**
 * Outbound fulfillment initiation state.
 * Uses AsyncState with InitiateFulfillmentData as the payload type.
 */
export type InitiateOutboundFulfillmentState =
  AsyncState<InitiateFulfillmentData | null>;

/**
 * Shipment-level and order-level filters for outbound fulfillment queries.
 */
export interface OutboundFulfillmentFilters {
  // Shipment-level
  statusIds?: string[];
  warehouseIds?: string[];
  deliveryMethodIds?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAfter?: string; // ISO date string
  createdBefore?: string; // ISO date string
  shippedAfter?: string; // ISO date string
  shippedBefore?: string; // ISO date string

  // Order-level
  orderId?: string;
  orderNumber?: string;

  // Keyword fuzzy match
  keyword?: string;
}

/**
 * Available sort keys for outbound shipments.
 * Derived from outboundShipmentSortMap (server).
 */
export type OutboundFulfillmentSortKey =
  | 'shipmentStatus'
  | 'shipmentStatusCode'
  | 'shippedAt'
  | 'expectedDeliveryDate'
  | 'createdAt'
  | 'updatedAt'
  | 'orderNumber'
  | 'warehouseName'
  | 'deliveryMethod'
  | 'trackingNumber'
  | 'createdByFirstName'
  | 'createdByLastName'
  | 'updatedByFirstName'
  | 'updatedByLastName';

/**
 * Query request params for outbound fulfillment fetch.
 * Extends shared pagination and sorting config.
 */
export interface OutboundFulfillmentQuery extends PaginationParams, SortConfig {
  /**
   * Outbound fulfillment–specific filters (shipment-level, order-level, etc.)
   */
  filters?: OutboundFulfillmentFilters;
}

/**
 * Transformed outbound shipment record from API.
 */
export interface OutboundShipmentRecord {
  shipmentId: string;
  order: {
    id: string;
    number: string;
  };
  warehouse: {
    id: string;
    name: string | null;
  };
  deliveryMethod: {
    id: string;
    name: string;
  } | null;
  trackingNumber: {
    id: string;
    number: string;
  } | null;
  status: {
    id: string;
    code: string;
    name: string;
  };
  dates: {
    shippedAt: string | null;
    expectedDelivery: string | null;
  };
  notes: string | null;
  shipmentDetails: Record<string, any> | null;
  audit: {
    createdAt: string;
    createdBy: {
      id: string;
      fullName: string;
    };
    updatedAt: string | null;
    updatedBy: {
      id: string | null;
      fullName: string;
    };
  };
}

/**
 * Paginated response for outbound fulfillment shipments.
 */
export type PaginatedOutboundFulfillmentApiResponse =
  PaginatedResponse<OutboundShipmentRecord>;

/**
 * Flattened outbound shipment record for UI consumption.
 * Derived from OutboundShipmentRecord.
 *
 * Rules:
 * - No nested objects
 * - No optional object access in UI
 * - Stable, table-friendly fields
 */
export interface FlattenedOutboundShipmentRow {
  /** Shipment */
  shipmentId: string;
  
  /** Order */
  orderId: string;
  orderNumber: string;
  
  /** Warehouse */
  warehouseId: string;
  warehouseName: string | null;
  
  /** Delivery method */
  deliveryMethodId: string | null;
  deliveryMethodName: string | null;
  
  /** Tracking */
  trackingId: string | null;
  trackingNumber: string | null;
  
  /** Status */
  statusId: string;
  statusCode: string;
  statusName: string;
  
  /** Dates */
  shippedAt: string | null;
  expectedDelivery: string | null;
  
  /** Notes & metadata */
  notes: string | null;
  shipmentDetails: Record<string, any> | null;
  
  /** Audit */
  createdAt: string;
  createdById: string;
  createdByName: string;
  updatedAt: string | null;
  updatedById: string | null;
  updatedByName: string;
}

/**
 * Paginated UI response for outbound fulfillment shipments.
 *
 * Represents a UI-ready paginated payload where each item is a
 * flattened outbound shipment row (no nested domain objects).
 * Intended to be returned from thunks/services after transformation.
 */
export type PaginatedOutboundFulfillmentsResponse =
  PaginatedResponse<FlattenedOutboundShipmentRow>;

/**
 * Redux state for the outbound fulfillment list view.
 *
 * Extends the generic `ReduxPaginatedState` using
 * `FlattenedOutboundShipmentRow` as the row type.
 *
 * Notes:
 * - Stores UI-normalized (flattened) shipment rows only
 * - Raw API shipment records should never be stored in this state
 */
export type PaginatedOutboundFulfillmentsState =
  ReduxPaginatedState<FlattenedOutboundShipmentRow>;

/** Shipment details response (data property) */
export interface ShipmentDetails {
  shipment: ShipmentHeader;
  fulfillments: Fulfillment[];
}

/** Shipment header info */
export interface ShipmentHeader {
  shipmentId: string;
  orderId: string;
  warehouse: {
    id: string;
    name: string;
  };
  deliveryMethod: DeliveryMethod | null;
  status: {
    id: string;
    code: string;
    name: string;
  };
  shippedAt: string | null;
  expectedDeliveryDate: string | null;
  notes: string | null;
  details: string | null;
  tracking: TrackingInfo | null;
  audit: AuditInfo;
}

/** Delivery method */
export interface DeliveryMethod {
  id: string;
  name: string;
  isPickup: boolean;
  estimatedTime: string | { days: number; hours?: number } | null;
}

/** Tracking info (nullable in your response) */
export interface TrackingInfo {
  id: string;
  number: string;
  carrier: string;
  serviceName: string;
  bolNumber: string | null;
  freightType: string | null;
  notes: string | null;
  shippedDate: string | null;
  status: {
    id: string;
    name: string;
  };
}

/** Fulfillment info */
export interface Fulfillment {
  fulfillmentId: string;
  quantityFulfilled: number;
  fulfilledAt: string | null;
  notes: string | null;
  status: {
    id: string;
    code: string;
    name: string;
  };
  audit: FulfillmentAuditInfo;
  orderItem: OrderItem | null;
  batches: ShipmentBatch[];
}

/** Fulfillment-level audit */
export interface FulfillmentAuditInfo extends AuditInfo {
  fulfilledBy: {
    id: string;
    name: string;
  } | null;
}

/** Generic audit info */
export interface AuditInfo {
  createdAt: string | null;
  createdBy: {
    id: string | null;
    name: string;
  } | null;
  updatedAt: string | null;
  updatedBy: {
    id: string | null;
    name: string;
  } | null;
}

/** Order item (either product SKU or packaging material) */
export type OrderItem = {
  id: string;
  quantityOrdered: number;
} & (
  | { sku: SkuInfo; packagingMaterial?: never }
  | { packagingMaterial: PackagingMaterialInfo; sku?: never }
);

/** SKU + Product metadata */
export interface SkuInfo {
  id: string;
  code: string;
  barcode: string;
  sizeLabel: string;
  region: string;
  product: {
    id: string;
    name: string;
    category: string;
  };
}

/** Packaging material metadata */
export interface PackagingMaterialInfo {
  id: string;
  code: string;
  label: string;
}

/** Batch info */
export interface ShipmentBatch {
  shipmentBatchId: string;
  quantityShipped: number;
  notes: string | null;
  audit: AuditInfo;
  batchRegistryId: string;
  batchType: 'product' | 'packaging_material';
  lotNumber: string | null;
  expiryDate: string | null;
}

/**
 * Raw API response type for fetching shipment details.
 *
 * Returned by:
 *   GET /api/v1/outbound-shipments/:shipmentId/details
 *
 * Layer:
 * - API / service layer only
 *
 * Notes:
 * - This type represents the backend response shape exactly
 * - It should NOT be consumed directly by UI components
 * - Thunks are responsible for transforming this payload into
 *   flattened, UI-ready structures before storing in Redux
 */
export type ShipmentDetailsApiResponse =
  ApiSuccessResponse<ShipmentDetails>;

/**
 * UI-ready shipment details after flattening.
 *
 * This is the shape stored in Redux and consumed by components.
 */
export interface ShipmentDetailsUiData {
  shipment: FlattenedShipmentHeader | null;
  fulfillments: FlattenedFulfillmentRow[];
}

/**
 * Thunk response type for fetching shipment details.
 *
 * Wraps flattened shipment data in the standard API success envelope.
 */
export type FetchShipmentDetailsUiResponse =
  ApiSuccessResponse<ShipmentDetailsUiData>;


/**
 * Redux state slice for storing detailed outbound shipment information.
 *
 * This leverages the generic `AsyncState<T>` pattern, where:
 * - `data` holds the fetched `ShipmentDetailsUiData` object (or null if not loaded)
 * - `loading` indicates whether a fetch request is in progress
 * - `error` contains any error message from a failed fetch
 *
 * Used in combination with `fetchOutboundShipmentDetailsThunk`
 * to manage the lifecycle of fetching a single shipment’s details.
 */
export type OutboundShipmentDetailsState = AsyncState<ShipmentDetailsUiData | null>;

/**
 * Represents a **flattened outbound shipment header** for display and data binding.
 *
 * Combines key shipment-level attributes, including:
 *  - Warehouse and delivery method information
 *  - Shipment status and scheduling fields
 *  - Audit metadata (created/updated by users)
 *  - Tracking details (carrier, service, BOL, freight type)
 *
 * Used primarily for:
 *  - Outbound shipment detail views
 *  - Table header summaries and metadata sections
 */
/**
 * Represents a **flattened outbound shipment header** for display and data binding.
 *
 * Combines key shipment-level attributes, including:
 *  - Warehouse and delivery method information
 *  - Shipment status and scheduling fields
 *  - Audit metadata (created/updated by users)
 *  - Tracking details (carrier, service, BOL, freight type)
 *
 * Used primarily for:
 *  - Outbound shipment detail views
 *  - Table header summaries and metadata sections
 */
export interface FlattenedShipmentHeader {
  shipmentId: string;
  orderId: string;
  warehouseId: string | null;
  warehouseName: string | null;

  /** Delivery method information */
  deliveryMethodId: string | null;
  deliveryMethodName: string | null;
  deliveryMethodIsPickup: boolean | null;
  deliveryMethodEstimatedTime: string | null;

  /** Shipment status */
  statusId: string | null;
  statusCode: string | null;
  statusName: string | null;

  /** Scheduling and notes */
  shippedAt: string | null;
  expectedDeliveryDate: string | null;
  notes: string | null;
  details: string | null;

  /** Audit info */
  createdAt: string | null;
  createdByName: string | null;
  updatedAt: string | null;
  updatedByName: string | null;

  /** Tracking info */
  trackingId: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingService: string | null;
  trackingBolNumber: string | null;
  trackingFreightType: string | null;
  trackingNotes: string | null;
  trackingShippedDate: string | null;
  trackingStatusId: string | null;
  trackingStatusName: string | null;
}

/** Batch-only type for the mini table */
export interface FlattenedBatchRow {
  shipmentBatchId: string;
  batchRegistryId: string | null;
  batchType: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  quantityShipped: number | null;
  notes: string | null;
  createdAt: string | null;
  createdByName: string | null;
  snapshotName?: string | null;
  receivedLabelName?: string | null;
}

/**
 * Represents a **flattened outbound fulfillment record** for display in
 * the Outbound Fulfillment Table.
 *
 * Each record corresponds to a single `order_fulfillment` entry, enriched with:
 *  - **Audit info** (created, updated, fulfilled users & timestamps)
 *  - **Item details** (either product SKU or packaging material)
 *  - **Batch list** (array of shipped batch entries linked to this fulfillment)
 *
 * This flattened structure is optimized for table rendering and UI display —
 * providing a single row per fulfillment with nested batch data.
 */
export interface FlattenedFulfillmentRow {
  fulfillmentId: string;
  fulfillmentStatusCode: string | null;
  fulfillmentStatusName: string | null;
  quantityFulfilled: number | null;
  fulfilledAt: string | null;
  fulfillmentNote: string | null;

  // audit
  createdAt: string | null;
  createdByName: string | null;
  updatedAt: string | null;
  updatedByName: string | null;
  fulfilledByName: string | null;

  // item details
  orderItemId: string | null;
  orderItemQuantity: number | null;
  productName?: string | null;
  skuCode?: string | null;
  barcode?: string | null;
  category?: string | null;
  region?: string | null;
  sizeLabel?: string | null;
  packagingMaterialCode?: string | null;
  packagingMaterialLabel?: string | null;

  // Batch info is now a sub-array of batch rows
  batches: FlattenedBatchRow[];
}

/**
 * Represents the request payload for confirming an outbound fulfillment.
 *
 * This object is sent to the backend endpoint:
 *   POST /orders/:orderId/fulfillment/confirm
 *
 * The confirmation process finalizes the outbound workflow by updating statuses
 * across order, shipment, and fulfillment entities, and by applying related
 * inventory adjustments and audit logs.
 */
export interface ConfirmOutboundFulfillmentRequest {
  /**
   * The unique ID of the order being confirmed.
   * Provided as a path parameter in the API route.
   */
  orderId: string;

  /**
   * Target order status code.
   * Example: "ORDER_FULFILLED", "ORDER_PROCESSING"
   */
  orderStatus: string;

  /**
   * Target allocation status code.
   * Example: "ALLOC_COMPLETED", "ALLOC_FULFILLED"
   */
  allocationStatus?: string;

  /**
   * Target shipment status code.
   * Example: "SHIPMENT_READY", "SHIPMENT_IN_PROGRESS", "SHIPMENT_FULFILLED"
   */
  shipmentStatus: string;

  /**
   * Target fulfillment status code.
   * Example: "FULFILLMENT_PACKED", "FULFILLMENT_COMPLETED"
   */
  fulfillmentStatus: string;
}

/**
 * Represents the request body for confirming an outbound fulfillment.
 *
 * This type excludes the `orderId` field from {@link ConfirmOutboundFulfillmentRequest},
 * since the `orderId` is passed as a path parameter in the API route:
 *
 *   POST /orders/:orderId/fulfillment/confirm
 *
 * The body contains only the status transition fields that determine how
 * the outbound fulfillment and related entities (allocation, shipment, and order)
 * should be updated on confirmation.
 *
 * @example
 * const body: ConfirmOutboundFulfillmentBody = {
 *   orderStatus: 'ORDER_FULFILLED',
 *   allocationStatus: 'ALLOC_COMPLETED',
 *   shipmentStatus: 'SHIPMENT_READY',
 *   fulfillmentStatus: 'FULFILLMENT_PACKED',
 * };
 */
export type ConfirmOutboundFulfillmentBody = Omit<
  ConfirmOutboundFulfillmentRequest,
  'orderId'
>;

/**
 * Represents the full response returned after confirming an outbound fulfillment.
 * Extends the generic ApiSuccessResponse<T> for consistency across all API responses.
 */
export type ConfirmOutboundFulfillmentResponse =
  ApiSuccessResponse<ConfirmOutboundFulfillmentResult>;

/**
 * Root result object for confirmed outbound fulfillment.
 */
export interface ConfirmOutboundFulfillmentResult {
  order: ConfirmedOrderMeta;
  shipment: ConfirmedShipmentMeta;
  fulfillments: ConfirmedFulfillmentMeta[];
  inventory: ConfirmedInventoryMeta;
  statuses: ConfirmedStatusesGroup;
  logs: ConfirmedActivityLogMeta;
}

/** Basic order info */
export interface ConfirmedOrderMeta {
  id: string;
  number: string;
}

/** Shipment info with status linkage */
export interface ConfirmedShipmentMeta {
  id: string;
  statuses: string[]; // Usually shipment status record IDs or UUIDs
}

/** Individual fulfillment status summary */
export interface ConfirmedFulfillmentMeta {
  id: string;
  statusId: string;
}

/** Inventory update results */
export interface ConfirmedInventoryMeta {
  updatedWarehouseIds: { id: string }[];
}

/** Group of all updated statuses */
export interface ConfirmedStatusesGroup {
  order: {
    id: string;
    order_status_id: string;
    status_date: string;
  };
  orderItems: {
    id: string;
    status_id: string;
    status_date: string;
  }[];
  allocations: string[];
  fulfillments: string[];
  shipments: string[];
}

/** Inserted activity and audit logs summary */
export interface ConfirmedActivityLogMeta {
  insertedActivityCount: number;
  insertedAuditCount: number;
  warehouseAuditCount: number;
  locationAuditCount: number;
  activityLogIds: string[];
}

/**
 * Represents the Redux async state for confirming an outbound fulfillment.
 *
 * This slice state is updated by the `confirmOutboundFulfillmentThunk`
 * and contains the latest confirmation data, loading state, and error info.
 */
export interface ConfirmOutboundFulfillmentState extends AsyncState<ConfirmOutboundFulfillmentResult | null> {
  /**
   * Timestamp of the last successful confirmation.
   * Useful for caching, UI refreshes, or audit display.
   */
  lastConfirmedAt?: string | null;
}

/**
 * Request body for completing a manual outbound fulfillment.
 *
 * This schema is used in manual workflows such as in-store pickup or personal delivery,
 * where no logistics carrier or allocation process is involved.
 *
 * It specifies the final status codes for the order, shipment, and fulfillment entities.
 */
export interface CompleteManualFulfillmentBody {
  /** Final order status code (e.g., "ORDER_DELIVERED") */
  orderStatus: string;

  /** Final shipment status code (e.g., "SHIPMENT_COMPLETED") */
  shipmentStatus: string;

  /** Final fulfillment status code (e.g., "FULFILLMENT_COMPLETED") */
  fulfillmentStatus: string;
}

/**
 * Parameters for completing a manual outbound fulfillment.
 *
 * This interface wraps the shipment ID (used in the URL path) and the
 * request body (containing new status codes) required to finalize a
 * manual fulfillment operation.
 *
 * Used in workflows such as in-store pickup or personal delivery where
 * allocation logic is skipped.
 */
export interface CompleteManualFulfillmentParams {
  /** Shipment ID used as a path parameter (e.g. "9cd7e960-985b-4f4e-9f68-1782535f5d18") */
  shipmentId: string;

  /** Request body containing target status codes for order, shipment, and fulfillment */
  body: CompleteManualFulfillmentBody;
}

/**
 * Represents the response payload returned from a successful manual fulfillment completion.
 */
export interface ManualFulfillmentResult {
  /** Updated order status data */
  order: {
    id: string;
    statusId: string;
    statusDate: string; // ISO timestamp
  };

  /** Updated order items (each item with its new status) */
  items: Array<{
    id: string;
    statusId: string;
    statusDate: string; // ISO timestamp
  }>;

  /** Fulfillment records involved in the manual process */
  fulfillments: Array<{
    id: string;
  }>;

  /** Shipment records updated as part of the manual fulfillment */
  shipment: Array<{
    id: string;
  }>;

  /** Summary counts of affected records */
  summary: {
    orderItemsCount: number;
    fulfillmentsCount: number;
    shipmentCount: number;
  };

  /** Metadata indicating when the update occurred */
  meta: {
    updatedAt: string; // ISO timestamp
  };
}

/**
 * Standardized API success response type for manual fulfillment completion.
 */
export type CompleteManualFulfillmentResponse =
  ApiSuccessResponse<ManualFulfillmentResult>;

/**
 * Slice state for tracking manual fulfillment completion.
 */
export type CompleteManualFulfillmentSliceState =
  AsyncState<CompleteManualFulfillmentResponse | null>;
