import type {
  CompleteManualFulfillmentBody,
  CompleteManualFulfillmentParams,
  CompleteManualFulfillmentResponse,
  ConfirmOutboundFulfillmentBody,
  ConfirmOutboundFulfillmentRequest,
  ConfirmOutboundFulfillmentResponse,
  InitiateFulfillmentBody,
  InitiateFulfillmentRequest,
  InitiateFulfillmentResponse,
  OutboundFulfillmentQuery,
  PaginatedOutboundFulfillmentResponse,
  ShipmentDetailsResponse,
} from '@features/outboundFulfillment/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, postRequest } from '@utils/http';
import { buildQueryString } from '@utils/buildQueryString';

/* =========================================================
 * Fulfillment lifecycle
 * ======================================================= */

/**
 * Initiates outbound fulfillment for an order.
 *
 * Creates shipment + fulfillment records linked to the order.
 * WRITE operation (non-idempotent).
 */
const initiateOutboundFulfillment = (
  request: InitiateFulfillmentRequest
): Promise<InitiateFulfillmentResponse> => {
  const url =
    API_ENDPOINTS.OUTBOUND_FULFILLMENTS.INITIATE_FULFILLMENT(request.orderId);
  
  return postRequest<InitiateFulfillmentBody, InitiateFulfillmentResponse>(
    url,
    request.body
  );
};

/**
 * Fetch paginated outbound fulfillment (shipment) records.
 *
 * READ-only, idempotent, safe to retry.
 */
const fetchPaginatedOutboundFulfillment = (
  params: OutboundFulfillmentQuery = {}
): Promise<PaginatedOutboundFulfillmentResponse> => {
  const { filters = {}, ...rest } = params;
  
  const queryString = buildQueryString({
    ...rest,
    ...filters,
  });
  
  return getRequest<PaginatedOutboundFulfillmentResponse>(
    `${API_ENDPOINTS.OUTBOUND_FULFILLMENTS.ALL_RECORDS}${queryString}`,
    { policy: 'READ' }
  );
};

/**
 * Fetch detailed shipment + fulfillment information by shipment ID.
 *
 * READ-only operation.
 */
const fetchOutboundShipmentDetails = (
  shipmentId: string
): Promise<ShipmentDetailsResponse> => {
  const url =
    API_ENDPOINTS.OUTBOUND_FULFILLMENTS.OUTBOUND_SHIPMENT_DETAILS(shipmentId);
  
  return getRequest<ShipmentDetailsResponse>(url, { policy: 'READ' });
};

/**
 * Confirms outbound fulfillment for an order.
 *
 * Finalizes fulfillment, shipment, order, inventory, and logs.
 * WRITE operation.
 */
const confirmOutboundFulfillment = (
  request: ConfirmOutboundFulfillmentRequest
): Promise<ConfirmOutboundFulfillmentResponse> => {
  const { orderId, ...body } = request;
  const url =
    API_ENDPOINTS.OUTBOUND_FULFILLMENTS.CONFIRM_FULFILLMENT(orderId);
  
  return postRequest<
    ConfirmOutboundFulfillmentBody,
    ConfirmOutboundFulfillmentResponse
  >(url, body);
};

/**
 * Completes a manual outbound fulfillment.
 *
 * Used for in-store pickup or non-carrier flows.
 * WRITE operation.
 */
const completeManualFulfillment = (
  params: CompleteManualFulfillmentParams
): Promise<CompleteManualFulfillmentResponse> => {
  const { shipmentId, body } = params;
  const url =
    API_ENDPOINTS.OUTBOUND_FULFILLMENTS.COMPLETE_MANUAL_FULFILLMENT(shipmentId);
  
  return postRequest<
    CompleteManualFulfillmentBody,
    CompleteManualFulfillmentResponse
  >(url, body);
};

/* =========================================================
 * Public API
 * ======================================================= */

export const outboundFulfillmentService = {
  initiateOutboundFulfillment,
  fetchPaginatedOutboundFulfillment,
  fetchOutboundShipmentDetails,
  confirmOutboundFulfillment,
  completeManualFulfillment,
};
