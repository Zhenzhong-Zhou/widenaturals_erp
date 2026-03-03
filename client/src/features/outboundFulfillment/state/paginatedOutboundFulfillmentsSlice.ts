import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  PaginatedOutboundFulfillmentsState,
  PaginatedOutboundFulfillmentsResponse,
  FlattenedOutboundShipmentRow,
} from '@features/outboundFulfillment/state';
import { fetchPaginatedOutboundFulfillmentThunk } from './outboundFulfillmentThunks';
import { createInitialPaginatedState } from '@store/pagination';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: PaginatedOutboundFulfillmentsState =
  createInitialPaginatedState<FlattenedOutboundShipmentRow>();

/**
 * Slice to manage state for paginated outbound fulfillments.
 */
const paginatedOutboundFulfillmentsSlice = createSlice({
  name: 'paginatedOutboundFulfillments',
  initialState,
  reducers: {
    resetPaginatedOutboundFulfillments: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedOutboundFulfillmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPaginatedOutboundFulfillmentThunk.fulfilled,
        (
          state,
          action: PayloadAction<PaginatedOutboundFulfillmentsResponse>
        ) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchPaginatedOutboundFulfillmentThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to fetch paginated outbound fulfillments.'
        );
      });
  },
});

export const { resetPaginatedOutboundFulfillments } =
  paginatedOutboundFulfillmentsSlice.actions;

export default paginatedOutboundFulfillmentsSlice.reducer;
