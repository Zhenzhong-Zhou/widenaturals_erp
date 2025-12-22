import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  BulkSkuImageUploadResponse,
  SkuImageUploadState,
  uploadSkuImagesThunk
} from '@features/skuImage/state';

const initialState: SkuImageUploadState = {
  data: null,     // entire BulkSkuImageUploadResponse
  loading: false,
  error: null,
  results: null,  // per-SKU results array
  stats: null     // BatchProcessStats
};

export const skuImageUploadSlice = createSlice({
  name: 'skuImageUpload',
  initialState,
  reducers: {
    /**
     * Reset state back to initial status
     */
    resetSkuImageUpload: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Pending → start loading, reset data
      .addCase(uploadSkuImagesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        
        state.data = null;
        state.results = null;
        state.stats = null;
      })
      
      // Fulfilled → store full response, plus unpack `results` & `stats`
      .addCase(uploadSkuImagesThunk.fulfilled, (state, action: PayloadAction<BulkSkuImageUploadResponse>) => {
        const payload = action.payload;
        
        state.loading = false;
        state.error = null;
        state.data = payload;
        
        // Unstack structured fields for UI convenience
        state.results = payload.data ?? null;
        state.stats = payload.stats ?? null;
      })
      
      // Rejected → store error message
      .addCase(uploadSkuImagesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ?? 'Failed to upload SKU images.';
      });
  }
});

export const { resetSkuImageUpload } = skuImageUploadSlice.actions;

export default skuImageUploadSlice.reducer;
