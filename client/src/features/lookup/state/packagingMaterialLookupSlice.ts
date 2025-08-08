import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type PackagingMaterialOnlyLookupItem,
  type PackagingMaterialLookupResponse,
  type PackagingMaterialLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchPackagingMaterialLookupThunk } from './lookupThunks';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

const initialState: PackagingMaterialLookupState =
  createInitialPaginatedLookupState<PackagingMaterialOnlyLookupItem>();

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
        createInitialPaginatedLookupState<PackagingMaterialOnlyLookupItem>()
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

export const { resetPackagingMaterialLookup } = packagingMaterialLookupSlice.actions;
export default packagingMaterialLookupSlice.reducer;
