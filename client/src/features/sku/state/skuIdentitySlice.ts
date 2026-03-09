import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  UpdateSkuIdentityState,
  UpdateSkuIdentityResponse,
} from '@features/sku/state/skuTypes';
import { updateSkuIdentityThunk } from '@features/sku/state/skuThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: UpdateSkuIdentityState = {
  data: null,
  loading: false,
  error: null,
};

export const skuIdentitySlice = createSlice({
  name: 'skuIdentity',
  initialState,
  reducers: {
    resetSkuIdentity: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateSkuIdentityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateSkuIdentityThunk.fulfilled,
        (state, action: PayloadAction<UpdateSkuIdentityResponse>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )
      .addCase(updateSkuIdentityThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to update SKU identity.');
      });
  },
});

export const { resetSkuIdentity } = skuIdentitySlice.actions;

export default skuIdentitySlice.reducer;
