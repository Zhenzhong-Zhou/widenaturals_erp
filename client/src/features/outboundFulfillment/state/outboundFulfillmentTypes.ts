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
