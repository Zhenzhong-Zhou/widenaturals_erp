import type { ApiSuccessResponse, AsyncState } from '@shared-types/api';

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
