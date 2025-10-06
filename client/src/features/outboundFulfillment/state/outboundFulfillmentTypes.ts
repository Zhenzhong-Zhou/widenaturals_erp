import type {
  ApiSuccessResponse,
  AsyncState, PaginatedResponse,
  PaginationParams, ReduxPaginatedState,
  SortConfig,
} from '@shared-types/api';

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
export type InitiateFulfillmentResponse = ApiSuccessResponse<InitiateFulfillmentData>;

/**
 * Outbound fulfillment initiation state.
 * Uses AsyncState with InitiateFulfillmentData as the payload type.
 */
export type InitiateOutboundFulfillmentState = AsyncState<InitiateFulfillmentData | null>;

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
export interface OutboundFulfillmentQuery
  extends PaginationParams, SortConfig {
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
export type PaginatedOutboundFulfillmentResponse =
  PaginatedResponse<OutboundShipmentRecord>;

/**
 * Outbound fulfillment list state.
 * Extends generic ReduxPaginatedState with OutboundShipmentRecord type.
 */
export type PaginatedOutboundFulfillmentsState = ReduxPaginatedState<OutboundShipmentRecord>;

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
  batchType: "product" | "packaging_material";
  lotNumber: string | null;
  expiryDate: string | null;
}

/**
 * API response type for fetching shipment details
 * via GET /api/v1/outbound-shipments/:shipmentId/details
 */
export type ShipmentDetailsResponse = ApiSuccessResponse<ShipmentDetails>;

/**
 * Redux state slice for storing detailed outbound shipment information.
 *
 * This leverages the generic `AsyncState<T>` pattern, where:
 * - `data` holds the fetched `ShipmentDetails` object (or null if not loaded)
 * - `loading` indicates whether a fetch request is in progress
 * - `error` contains any error message from a failed fetch
 *
 * Used in combination with `fetchOutboundShipmentDetailsThunk`
 * to manage the lifecycle of fetching a single shipment’s details.
 */
export type OutboundShipmentDetailsState = AsyncState<ShipmentDetails | null>;

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
