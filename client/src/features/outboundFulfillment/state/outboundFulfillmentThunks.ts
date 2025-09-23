import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  InitiateFulfillmentRequest,
  InitiateFulfillmentResponse,
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
