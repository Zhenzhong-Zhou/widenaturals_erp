import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CompleteManualFulfillmentParams,
  CompleteManualFulfillmentResponse,
  ConfirmOutboundFulfillmentRequest,
  ConfirmOutboundFulfillmentResponse,
  InitiateFulfillmentRequest,
  InitiateFulfillmentResponse,
  OutboundFulfillmentQuery,
  PaginatedOutboundFulfillmentResponse,
  ShipmentDetailsResponse,
} from '@features/outboundFulfillment/state/outboundFulfillmentTypes';
import { outboundFulfillmentService } from '@services/outboundFulfillmentService';

/**
 * Async thunk to initiate outbound fulfillment for a specific order.
 *
 * This thunk:
 *  - Calls the `outboundFulfillmentService.initiateOutboundFulfillment` service
 *  - Dispatches `pending`, `fulfilled`, and `rejected` lifecycle actions
 *  - Passes through a typed `InitiateFulfillmentResponse` on success
 *  - Provides a `rejectValue` string on failure, using backend error messages when available
 *
 * Expected argument: `InitiateFulfillmentRequest`
 * Example:
 *   {
 *     orderId: 'a1f4e409-e7f8-4005-abf0-e98028bdace7', // path param
 *     body: {
 *       allocations: { ids: ['uuid-1', 'uuid-2'] },
 *       fulfillmentNotes: 'Triggered from Allocation Review',
 *       shipmentNotes: 'Handle with care',
 *       shipmentBatchNote: 'Batch ref ABC-123'
 *     }
 *   }
 *
 * Usage:
 *   dispatch(initiateOutboundFulfillmentThunk(requestData));
 *
 * Select results via slice selectors:
 *   - `loading`: boolean
 *   - `error`: string | null
 *   - `data`: InitiateFulfillmentData[] | null
 */
export const initiateOutboundFulfillmentThunk = createAsyncThunk<
  InitiateFulfillmentResponse, // return type
  InitiateFulfillmentRequest,  // argument type
  {
    rejectValue: string;       // optional error type
  }
>(
  'outboundFulfillments/initiate',
  async (request: InitiateFulfillmentRequest, { rejectWithValue }) => {
    try {
      return await outboundFulfillmentService.initiateOutboundFulfillment(request);
    } catch (error: any) {
      console.error('Thunk error: initiateOutboundFulfillment', error);
      
      // Use backend-provided message if available
      const message =
        error?.response?.data?.message || error.message || 'Failed to initiate outbound fulfillment';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to fetch a paginated list of outbound fulfillment (shipment) records.
 *
 * ### Behavior
 * - Dispatches lifecycle actions automatically:
 *   - `pending`   → sets `loading = true`, clears previous errors
 *   - `fulfilled` → stores API response (data + pagination) in the slice
 *   - `rejected`  → captures error message in the slice
 *
 * ### Usage
 * ```ts
 * const query: OutboundFulfillmentQuery = {
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'DESC',
 *   filters: { statusIds: ['uuid-status'] },
 * };
 *
 * dispatch(fetchPaginatedOutboundFulfillmentThunk(query));
 * ```
 *
 * ### Returns
 * - On success: `PaginatedOutboundFulfillmentResponse`
 *   - `data`: Array of outbound shipment records
 *   - `pagination`: Metadata (`page`, `limit`, `totalRecords`, `totalPages`)
 * - On failure: rejects with a string error message (from backend or fallback)
 *
 * @param {OutboundFulfillmentQuery} queryParams
 *   Pagination, sorting, and filtering options
 *
 * @returns {Promise<PaginatedOutboundFulfillmentResponse>}
 *
 * @throws {string} rejectValue with error message when API call fails
 */
export const fetchPaginatedOutboundFulfillmentThunk = createAsyncThunk<
  PaginatedOutboundFulfillmentResponse, // return type
  OutboundFulfillmentQuery,             // argument type
  { rejectValue: string }               // error type
>(
  'outboundFulfillment/fetchPaginated',
  async (queryParams, { rejectWithValue }) => {
    try {
      return await outboundFulfillmentService.fetchPaginatedOutboundFulfillment(queryParams);
    } catch (error: any) {
      console.error('Thunk error: fetchPaginatedOutboundFulfillment', error);
      
      // Use backend-provided message if available
      const message =
        error?.response?.data?.message ||
        error.message ||
        'Failed to fetch outbound fulfillments';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk: Fetch outbound shipment details by ID.
 *
 * Dispatches pending/fulfilled/rejected actions automatically.
 *
 * @param {string} shipmentId - The UUID of the outbound shipment
 * @returns {Promise<ShipmentDetailsResponse>} Shipment details response
 *
 * @example
 * dispatch(fetchOutboundShipmentDetailsThunk("844f3d53-a102-46aa-8644-90b3a3b35fd7"));
 */
export const fetchOutboundShipmentDetailsThunk = createAsyncThunk<
  ShipmentDetailsResponse, // return type
  string,                  // argument type
  { rejectValue: string }  // optional reject payload
>(
  'outboundShipments/fetchDetails',
  async (shipmentId, { rejectWithValue }) => {
    try {
      return await outboundFulfillmentService.fetchOutboundShipmentDetails(shipmentId);
    } catch (error: any) {
      console.error('Thunk error (fetchOutboundShipmentDetails):', error);
      return rejectWithValue(error.message || 'Failed to fetch shipment details');
    }
  }
);

/**
 * Thunk: confirmOutboundFulfillmentThunk
 *
 * Dispatches an async request to confirm an outbound fulfillment for a specific order.
 * This triggers backend validation and finalization of inventory, fulfillment, shipment,
 * and order statuses.
 *
 * Use this thunk after an outbound fulfillment has been initiated and allocations are complete.
 *
 * Flow:
 *  1. Dispatches loading state.
 *  2. Calls the backend API via `confirmOutboundFulfillment`.
 *  3. On success, updates state with new fulfillment confirmation data.
 *  4. On failure, dispatches rejected action with normalized error message.
 */
export const confirmOutboundFulfillmentThunk = createAsyncThunk<
  ConfirmOutboundFulfillmentResponse, // Return type on success
  ConfirmOutboundFulfillmentRequest,  // Argument type
  { rejectValue: string }             // Rejected error payload
>(
  'outboundFulfillment/confirmOutboundFulfillment',
  async (request, { rejectWithValue }) => {
    try {
      return await outboundFulfillmentService.confirmOutboundFulfillment(request);
    } catch (error: any) {
      console.error('Failed to confirm outbound fulfillment:', error);
      
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to confirm outbound fulfillment. Please try again later.';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk to complete a manual outbound fulfillment (e.g., in-store pickup or personal delivery).
 *
 * This thunk dispatches an asynchronous request to finalize a manual fulfillment by:
 * - Calling the backend API to update shipment, fulfillment, and order statuses
 * - Handling success or failure for downstream UI reactions (e.g., toast, redirect, reload)
 *
 * Backend Endpoint:
 *   POST /outbound-fulfillments/manual/:shipmentId/complete
 *
 * Requirements:
 * - `shipmentId` (path param): ID of the shipment being fulfilled manually.
 * - `body` (request payload):
 *   - `orderStatus`: Final order status (e.g., "ORDER_DELIVERED")
 *   - `shipmentStatus`: Final shipment status (e.g., "SHIPMENT_COMPLETED")
 *   - `fulfillmentStatus`: Final fulfillment status (e.g., "FULFILLMENT_COMPLETED")
 *
 * Redux Usage:
 * ```ts
 * dispatch(completeManualFulfillmentThunk({
 *   shipmentId: '9cd7e960-985b-4f4e-9f68-1782535f5d18',
 *   body: {
 *     orderStatus: 'ORDER_DELIVERED',
 *     shipmentStatus: 'SHIPMENT_COMPLETED',
 *     fulfillmentStatus: 'FULFILLMENT_COMPLETED',
 *   }
 * }));
 * ```
 *
 * @param {CompleteManualFulfillmentParams} params - Object containing the shipment ID and status payload.
 * @returns {Promise<CompleteManualFulfillmentResponse>} - Fulfillment result data on success.
 * @throws {string} Rejected value with an error message on failure.
 */
export const completeManualFulfillmentThunk = createAsyncThunk<
  CompleteManualFulfillmentResponse,
  CompleteManualFulfillmentParams,
  { rejectValue: string }
>(
  'outboundFulfillments/completeManual',
  async (params, { rejectWithValue }) => {
    try {
      return await outboundFulfillmentService.completeManualFulfillment(params);
    } catch (error: any) {
      return rejectWithValue(error?.message ?? 'Manual fulfillment failed.');
    }
  }
);
