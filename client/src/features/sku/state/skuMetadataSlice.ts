import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  UpdateSkuMetadataState,
  UpdateSkuMetadataResponse,
} from '@features/sku/state/skuTypes';
import { updateSkuMetadataThunk } from '@features/sku/state/skuThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: UpdateSkuMetadataState = {
  data: null,
  loading: false,
  error: null,
};

export const skuMetadataSlice = createSlice({
  name: 'skuMetadata',
  initialState,
  reducers: {
    resetSkuMetadata: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateSkuMetadataThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateSkuMetadataThunk.fulfilled,
        (state, action: PayloadAction<UpdateSkuMetadataResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )
      .addCase(updateSkuMetadataThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to update SKU metadata.');
      });
  },
});

export const { resetSkuMetadata } = skuMetadataSlice.actions;

export default skuMetadataSlice.reducer;
