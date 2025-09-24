import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  InitiateFulfillmentRequest,
  InitiateFulfillmentResponse, OutboundFulfillmentQuery, PaginatedOutboundFulfillmentResponse,
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
