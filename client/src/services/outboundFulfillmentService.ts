import type {
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
import { getRequest, postRequest } from '@utils/apiRequest';
import { buildQueryString } from '@utils/buildQueryString';

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

/**
 * Fetches a paginated list of outbound fulfillment (shipment) records from the API.
 *
 * This function supports:
 * - Pagination: `page`, `limit`
 * - Sorting: `sortBy`, `sortOrder`
 * - Filtering: via `filters` object (flattened into query params)
 *
 * ### How it Works
 * - Extracts `filters` from the provided params
 * - Flattens filters and other query parameters into a flat key-value object
 * - Converts the flat object into a query string via `buildQueryString`
 * - Sends a typed GET request to the `OUTBOUND_FULFILLMENT.ALL` endpoint
 * - Returns a structured, typed response
 *
 * ### Query Parameters
 * - Pagination: `page`, `limit`
 * - Sorting: `sortBy`, `sortOrder`
 * - Filters (flattened): `statusIds`, `warehouseIds`, `deliveryMethodIds`,
 *   `orderNumber`, `keyword`, etc.
 *
 * @param {OutboundFulfillmentQuery} params
 *   - Pagination: `page`, `limit`
 *   - Sorting: `sortBy`, `sortOrder`
 *   - Filtering: `filters` object with shipment/order-level filters
 *
 * @returns {Promise<PaginatedOutboundFulfillmentResponse>}
 *   A typed paginated response containing:
 *   - `data`: outbound shipment records
 *   - `pagination`: page info (`page`, `limit`, `totalRecords`, `totalPages`)
 *
 * @throws {Error} If the request fails or the API returns an error
 */
const fetchPaginatedOutboundFulfillment = async (
  params: OutboundFulfillmentQuery = {}
): Promise<PaginatedOutboundFulfillmentResponse> => {
  try {
    const { filters = {}, ...rest } = params;
    
    // Flatten nested filters into top-level query keys
    const flatParams = {
      ...rest,
      ...filters,
    };
    
    const queryString = buildQueryString(flatParams);
    const url = `${API_ENDPOINTS.OUTBOUND_FULFILLMENTS.ALL_RECORDS}${queryString}`;
    
    return await getRequest<PaginatedOutboundFulfillmentResponse>(url);
  } catch (error) {
    console.error('Failed to fetch outbound fulfillments:', error);
    throw error;
  }
};

/**
 * Fetches detailed outbound shipment information by shipment ID.
 *
 * ### How it Works
 * - Builds the endpoint URL using the provided `shipmentId`
 * - Sends a typed GET request to the API
 * - Returns structured shipment details including:
 *   - Shipment header (warehouse, status, notes, etc.)
 *   - Tracking information (carrier, tracking number, status, etc.)
 *   - Fulfillments (linked order items, SKUs, packaging materials)
 *   - Batches (per-fulfillment batch allocations, with lot/expiry info)
 *
 * @param {string} shipmentId - UUID of the shipment to fetch details for
 *
 * @returns {Promise<ShipmentDetailsResponse>}
 *   A typed response containing:
 *   - `shipment`: header-level info
 *   - `fulfillments`: fulfillment list with order items & batches
 *
 * @throws {Error} If the request fails or the API returns an error
 *
 * @example
 * const details = await fetchOutboundShipmentDetails("844f3d53-a102-46aa-8644-90b3a3b35fd7");
 * console.log(details.data.shipment.status.code); // e.g., "SHIPMENT_PENDING"
 */
export const fetchOutboundShipmentDetails = async (
  shipmentId: string
): Promise<ShipmentDetailsResponse> => {
  try {
    const url = API_ENDPOINTS.OUTBOUND_FULFILLMENTS.OUTBOUND_SHIPMENT_DETAILS(shipmentId);
    return await getRequest<ShipmentDetailsResponse>(url);
  } catch (error) {
    console.error(`Failed to fetch shipment details for ID=${shipmentId}:`, error);
    throw error;
  }
};

/**
 * Confirms an outbound fulfillment for a specific order.
 *
 * This service function finalizes the outbound fulfillment process by confirming
 * the associated fulfillment, shipment, and order statuses. It communicates with
 * the backend API endpoint:
 *
 *    POST /orders/:orderId/fulfillment/confirm
 *
 * Responsibilities:
 * - Validates and confirms that all related allocations, fulfillments, and shipments
 *   meet the business rules for confirmation.
 * - Applies final inventory adjustments (reduces stock, releases reserved quantities).
 * - Updates workflow statuses for order, order items, fulfillments, allocations, and shipment.
 * - Inserts audit and activity logs for traceability.
 *
 * The backend endpoint requires:
 * - `orderId` as a path parameter
 * - `orderStatus`, `shipmentStatus`, and `fulfillmentStatus` in the request body
 *   (e.g., `ORDER_FULFILLED`, `SHIPMENT_IN_PROGRESS`, `FULFILLMENT_PACKED`)
 *
 * On success, the response includes the full API envelope, containing:
 * - `success`: boolean indicating operation success
 * - `message`: backend confirmation message
 * - `data`: structured payload describing updated statuses, inventory adjustments,
 *   and inserted log metadata
 *
 * Intended to be called after fulfillment initiation, usually during a confirmation
 * or dispatch step in the outbound logistics workflow.
 *
 * @async
 * @function
 * @param {ConfirmOutboundFulfillmentRequest} request - Request payload including
 *        orderId, and new status codes for order, shipment, and fulfillment.
 * @returns {Promise<ConfirmOutboundFulfillmentResponse>} - Full API response with
 *          updated fulfillment confirmation results.
 *
 * @throws {Error} If the confirmation request fails (e.g., validation or server error).
 *
 * @example
 * const request: ConfirmOutboundFulfillmentRequest = {
 *   orderId: '939b06e5-0dd1-4ed5-85cf-1aee4642292e',
 *   orderStatus: 'ORDER_FULFILLED',
 *   shipmentStatus: 'SHIPMENT_IN_PROGRESS',
 *   fulfillmentStatus: 'FULFILLMENT_PACKED',
 * };
 *
 * const response = await confirmOutboundFulfillment(request);
 * if (response.success) {
 *   console.log('Outbound fulfillment confirmed:', response.data.statuses);
 *   console.log('Shipment updated:', response.data.shipment.id);
 * }
 */
export const confirmOutboundFulfillment = async (
  request: ConfirmOutboundFulfillmentRequest
): Promise<ConfirmOutboundFulfillmentResponse> => {
  const { orderId, ...body } = request;
  const url = API_ENDPOINTS.OUTBOUND_FULFILLMENTS.CONFIRM_FULFILLMENT(orderId);
  
  try {
    return await postRequest<
      ConfirmOutboundFulfillmentBody,
      ConfirmOutboundFulfillmentResponse
    >(url, body);
  } catch (error) {
    console.error('Failed to confirm outbound fulfillment', { body, error });
    throw error;
  }
};

export const outboundFulfillmentService = {
  initiateOutboundFulfillment,
  fetchPaginatedOutboundFulfillment,
  fetchOutboundShipmentDetails,
  confirmOutboundFulfillment,
};
