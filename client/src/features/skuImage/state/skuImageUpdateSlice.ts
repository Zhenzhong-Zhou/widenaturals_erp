import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  BulkSkuImageUpdateResponse,
  SkuImageUpdateState,
} from '@features/skuImage/state';
import { updateSkuImagesThunk } from '@features/skuImage/state';

const initialState: SkuImageUpdateState = {
  data: null, // entire BulkSkuImageUpdateResponse
  loading: false,
  error: null,
  results: null, // per-SKU update results array
  stats: null, // BatchProcessStats
};

export const skuImageUpdateSlice = createSlice({
  name: 'skuImageUpdate',
  initialState,
  reducers: {
    /**
     * Reset state back to initial status
     */
    resetSkuImageUpdate: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Pending → start loading, reset previous results
      .addCase(updateSkuImagesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        
        state.data = null;
        state.results = null;
        state.stats = null;
      })
      
      // Fulfilled → store full response + unpack convenience fields
      .addCase(
        updateSkuImagesThunk.fulfilled,
        (state, action: PayloadAction<BulkSkuImageUpdateResponse>) => {
          const payload = action.payload;
          
          state.loading = false;
          state.error = null;
          state.data = payload;
          
          state.results = payload.data ?? null;
          state.stats = payload.stats ?? null;
        }
      )
      
      // Rejected → structured UI error payload
      .addCase(updateSkuImagesThunk.rejected, (state, action) => {
        state.loading = false;
        
        state.error =
          action.payload?.message ??
          'Failed to update SKU images.';
      });
  },
});

export const { resetSkuImageUpdate } = skuImageUpdateSlice.actions;

export default skuImageUpdateSlice.reducer;
