import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  PaginatedOutboundFulfillmentsState,
  PaginatedOutboundFulfillmentResponse,
} from '@features/outboundFulfillment/state';
import { fetchPaginatedOutboundFulfillmentThunk } from './outboundFulfillmentThunks';

const initialState: PaginatedOutboundFulfillmentsState = {
  loading: false,
  error: null,
  data: [],
  pagination: null,
};

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
          action: PayloadAction<PaginatedOutboundFulfillmentResponse>
        ) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(
        fetchPaginatedOutboundFulfillmentThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            (action.payload as string) ||
            'Failed to fetch paginated outbound fulfillments';
        }
      );
  },
});

export const { resetPaginatedOutboundFulfillments } =
  paginatedOutboundFulfillmentsSlice.actions;

export default paginatedOutboundFulfillmentsSlice.reducer;
