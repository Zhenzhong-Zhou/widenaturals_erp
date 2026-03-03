import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  InitiateFulfillmentResponse,
  InitiateOutboundFulfillmentState,
} from '@features/outboundFulfillment/state/outboundFulfillmentTypes';
import { initiateOutboundFulfillmentThunk } from '@features/outboundFulfillment/state/outboundFulfillmentThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: InitiateOutboundFulfillmentState = {
  loading: false,
  error: null,
  data: null,
};

export const initiateOutboundFulfillmentSlice = createSlice({
  name: 'initiateOutboundFulfillment',
  initialState,
  reducers: {
    resetInitiateOutboundFulfillment: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiateOutboundFulfillmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        initiateOutboundFulfillmentThunk.fulfilled,
        (state, action: PayloadAction<InitiateFulfillmentResponse>) => {
          state.loading = false;
          state.error = null;
          state.data = action.payload.data;
        }
      )
      .addCase(initiateOutboundFulfillmentThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to initiate outbound fulfillment.'
        );
      });
  },
});

export const { resetInitiateOutboundFulfillment } =
  initiateOutboundFulfillmentSlice.actions;

export default initiateOutboundFulfillmentSlice.reducer;
