import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchPricingTypeMetadataThunk } from './pricingTypeThunks';
import type { PricingTypeMetadata } from './pricingTypeTypes';

export interface PricingTypeMetadataState {
  data: PricingTypeMetadata | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PricingTypeMetadataState = {
  data: null,
  isLoading: false,
  error: null,
};

const pricingTypeMetadataSlice = createSlice({
  name: 'pricingTypeMetadata',
  initialState,
  reducers: {
    resetPricingTypeMetadata: (state) => {
      state.data = null;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingTypeMetadataThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingTypeMetadataThunk.fulfilled,
        (state, action: PayloadAction<PricingTypeMetadata>) => {
          state.data = action.payload;
          state.isLoading = false;
        }
      )
      .addCase(
        fetchPricingTypeMetadataThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload || 'Failed to fetch pricing type metadata.';
        }
      );
  },
});

export const { resetPricingTypeMetadata } = pricingTypeMetadataSlice.actions;

export default pricingTypeMetadataSlice.reducer;
