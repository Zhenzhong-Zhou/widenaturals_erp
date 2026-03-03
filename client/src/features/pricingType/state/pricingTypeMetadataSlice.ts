import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchPricingTypeMetadataThunk } from './pricingTypeThunks';
import type {
  PricingTypeMetadata,
  PricingTypeMetadataState
} from './pricingTypeTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: PricingTypeMetadataState = {
  data: null,
  loading: false,
  error: null,
};

const pricingTypeMetadataSlice = createSlice({
  name: 'pricingTypeMetadata',
  initialState,
  reducers: {
    resetPricingTypeMetadata: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingTypeMetadataThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingTypeMetadataThunk.fulfilled,
        (state, action: PayloadAction<PricingTypeMetadata>) => {
          state.data = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchPricingTypeMetadataThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch pricing type metadata.');
      });
  },
});

export const { resetPricingTypeMetadata } = pricingTypeMetadataSlice.actions;

export default pricingTypeMetadataSlice.reducer;
