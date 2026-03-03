import { createSlice } from '@reduxjs/toolkit';
import type {
  SkuImageUploadState,
} from '@features/skuImage/state';
import { uploadSkuImagesThunk } from '@features/skuImage/state';
import { applyBatchSuccess } from '@features/shared/batch/batchReducerUtils';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: SkuImageUploadState = {
  data: null,
  loading: false,
  error: null,
  results: null,
  stats: null,
};

export const skuImageUploadSlice = createSlice({
  name: 'skuImageUpload',
  initialState,
  reducers: {
    /**
     * Reset state back to initial status
     */
    resetSkuImageUpload: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // --------------------------------------------
      // Pending → start loading, reset previous data
      // --------------------------------------------
      .addCase(uploadSkuImagesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
        state.results = null;
        state.stats = null;
      })
      
      // --------------------------------------------
      // Fulfilled → standardized batch success
      // --------------------------------------------
      .addCase(uploadSkuImagesThunk.fulfilled, (state, action) => {
        applyBatchSuccess(state, action.payload);
      })
      
      // --------------------------------------------
      // Rejected → store user-facing error
      // --------------------------------------------
      .addCase(uploadSkuImagesThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to upload SKU images.'
        );
      });
  },
});

export const { resetSkuImageUpload } = skuImageUploadSlice.actions;
export default skuImageUploadSlice.reducer;
