import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SkuDetails } from './skuTypes';
import { fetchSkuDetailsThunk } from './skuThunks';

interface SkuDetailsState {
  data: SkuDetails | null;
  loading: boolean;
  error: string | null;
}

const initialState: SkuDetailsState = {
  data: null,
  loading: false,
  error: null,
};

const skuDetailsSlice = createSlice({
  name: 'skuDetails',
  initialState,
  reducers: {
    clearSkuDetails: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkuDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSkuDetailsThunk.fulfilled,
        (state, action: PayloadAction<SkuDetails>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchSkuDetailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to fetch SKU details.';
      });
  },
});

export const { clearSkuDetails } = skuDetailsSlice.actions;

export default skuDetailsSlice.reducer;
