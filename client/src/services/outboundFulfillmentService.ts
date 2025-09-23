import type {
  InitiateFulfillmentBody,
  InitiateFulfillmentRequest,
  InitiateFulfillmentResponse,
} from '@features/outboundFulfillment/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { postRequest } from '@utils/apiRequest';

/**
 * Initiates outbound fulfillment for a specific order.
 *
 * This service function calls the backend API to create and link a new outbound
 * shipment and fulfillment record to the given `orderId`. It consumes a list of
 * allocation IDs and optional notes for fulfillment, shipment, and shipment batch.
 *
 * The backend endpoint requires:
 * - `orderId` as a path parameter
 * - `allocations` object with an array of allocation IDs
 * - Optional notes (`fulfillmentNotes`, `shipmentNotes`, `shipmentBatchNote`)
 *
 * On success, the response includes the full API envelope, containing:
 * - `success`: boolean indicating operation success
 * - `message`: a status message from the backend
 * - `data`: payload with created shipment and fulfillment IDs, updated order status,
 *   and related status updates for order items
 *
 * Intended to be called within Redux thunks or directly in services that need
 * to start the fulfillment lifecycle for an order.
 *
 * @async
 * @function
 * @param {InitiateFulfillmentRequest} request - Request body containing the orderId,
 *        allocation IDs, and optional notes.
 * @returns {Promise<InitiateFulfillmentResponse>} - Full API response containing
 *          outbound fulfillment initiation details.
 *
 * @throws {Error} If the request fails (e.g., network issue, server error).
 *
 * @example
 * const request: InitiateFulfillmentRequest = {
 *   orderId: '939b06e5-0dd1-4ed5-85cf-1aee4642292e',
 *   allocations: {
 *     ids: [
 *       '2edacd88-03c5-4ac2-831f-ccaba25c0ecc',
 *       '6682815d-362f-41ed-a1f3-bbbcc1bde74f',
 *     ],
 *   },
 *   fulfillmentNotes: 'Pack carefully',
 *   shipmentNotes: 'Ship via express',
 *   shipmentBatchNote: 'Batch priority A',
 * };
 *
 * const response = await initiateOutboundFulfillment(request);
 * if (response.success) {
 *   console.log('Fulfillment created:', response.data.fulfillment.id);
 *   console.log('Shipment ID:', response.data.shipment.id);
 * }
 */
const initiateOutboundFulfillment = async (
  request: InitiateFulfillmentRequest
): Promise<InitiateFulfillmentResponse> => {
  const url = API_ENDPOINTS.OUTBOUND_FULFILLMENTS.INITIATE_FULFILLMENT(request.orderId);
  
  try {
    return await postRequest<InitiateFulfillmentBody, InitiateFulfillmentResponse>(url, request.body);
  } catch (error) {
    console.error('Failed to initiate outbound fulfillment', { request, error });
    throw error;
  }
};

export const outboundFulfillmentService = {
  initiateOutboundFulfillment,
};
