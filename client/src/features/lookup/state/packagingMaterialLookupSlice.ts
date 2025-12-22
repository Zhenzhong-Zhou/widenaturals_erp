import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  PackagingMaterialOnlyLookupItem,
  PackagingMaterialLookupResponse,
  PackagingMaterialLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import {
  fetchPackagingMaterialLookupThunk,
} from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

const initialState: PackagingMaterialLookupState =
  createInitialOffsetPaginatedState<PackagingMaterialOnlyLookupItem>();

const packagingMaterialLookupSlice = createSlice({
  name: 'packagingMaterialLookup',
  initialState,
  reducers: {
    /**
     * Resets the packaging-material lookup state to its initial defaults.
     * Rebuild from factory to avoid sharing object references.
     */
    resetPackagingMaterialLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<PackagingMaterialOnlyLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPackagingMaterialLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPackagingMaterialLookupThunk.fulfilled,
        (state, action: PayloadAction<PackagingMaterialLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchPackagingMaterialLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          'Failed to fetch packaging material lookup';
      });
  },
});

export const { resetPackagingMaterialLookup } =
  packagingMaterialLookupSlice.actions;
export default packagingMaterialLookupSlice.reducer;
