import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  OutboundShipmentDetailsState,
  FetchShipmentDetailsUiResponse,
} from './outboundFulfillmentTypes';
import { fetchOutboundShipmentDetailsThunk } from '@features/outboundFulfillment/state/outboundFulfillmentThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: OutboundShipmentDetailsState = {
  loading: false,
  error: null,
  data: null,
};

const outboundShipmentDetailsSlice = createSlice({
  name: 'outboundShipmentDetails',
  initialState,
  reducers: {
    /**
     * Reset the shipment details state back to initial values.
     * Useful when leaving a details page or on logout.
     */
    resetOutboundShipmentDetails: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOutboundShipmentDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchOutboundShipmentDetailsThunk.fulfilled,
        (state, action: PayloadAction<FetchShipmentDetailsUiResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
        }
      )
      .addCase(fetchOutboundShipmentDetailsThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to fetch shipment details.'
        );
      });
  },
});

export const { resetOutboundShipmentDetails } =
  outboundShipmentDetailsSlice.actions;

export default outboundShipmentDetailsSlice.reducer;
