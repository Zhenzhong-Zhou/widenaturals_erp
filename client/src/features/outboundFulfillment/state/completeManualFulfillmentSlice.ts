import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CompleteManualFulfillmentResponse,
  CompleteManualFulfillmentSliceState,
} from '@features/outboundFulfillment/state/outboundFulfillmentTypes';
import { completeManualFulfillmentThunk } from '@features/outboundFulfillment/state/outboundFulfillmentThunks';

/**
 * Initial state.
 */
const initialState: CompleteManualFulfillmentSliceState = {
  data: null,
  loading: false,
  error: null,
};

export const completeManualFulfillmentSlice = createSlice({
  name: 'completeManualFulfillment',
  initialState,
  reducers: {
    resetCompleteManualFulfillment: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(completeManualFulfillmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        completeManualFulfillmentThunk.fulfilled,
        (state, action: PayloadAction<CompleteManualFulfillmentResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )
      .addCase(completeManualFulfillmentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to complete manual fulfillment.';
      });
  },
});

export const { resetCompleteManualFulfillment } = completeManualFulfillmentSlice.actions;

export default completeManualFulfillmentSlice.reducer;
