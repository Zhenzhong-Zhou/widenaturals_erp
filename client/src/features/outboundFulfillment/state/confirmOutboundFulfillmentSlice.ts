import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ConfirmOutboundFulfillmentResponse,
  ConfirmOutboundFulfillmentState,
} from '../state/outboundFulfillmentTypes';
import { confirmOutboundFulfillmentThunk } from './outboundFulfillmentThunks';

/**
 * Initial state for outbound fulfillment confirmation flow.
 */
const initialState: ConfirmOutboundFulfillmentState = {
  data: null,
  loading: false,
  error: null,
  lastConfirmedAt: null,
};

/**
 * Slice: confirmOutboundFulfillmentSlice
 *
 * Manages async state for confirming an outbound fulfillment, including:
 * - API request lifecycle (pending, fulfilled, rejected)
 * - Result data and timestamp
 * - Error handling and state reset
 */
export const confirmOutboundFulfillmentSlice = createSlice({
  name: 'confirmOutboundFulfillment',
  initialState,
  reducers: {
    /**
     * Reset the confirmation state to its initial values.
     * Useful when navigating away from a details page or starting a new confirmation.
     */
    resetConfirmationState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.lastConfirmedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(confirmOutboundFulfillmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmOutboundFulfillmentThunk.fulfilled, (state, action: PayloadAction<ConfirmOutboundFulfillmentResponse>) => {
        state.loading = false;
        state.data = action.payload.data;
        state.lastConfirmedAt = new Date().toISOString();
      })
      .addCase(confirmOutboundFulfillmentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || 'Failed to confirm outbound fulfillment';
      });
  },
});

// Export reducer and reset action for use in components
export const { resetConfirmationState } = confirmOutboundFulfillmentSlice.actions;

// Export reducer for store registration
export default confirmOutboundFulfillmentSlice.reducer;
