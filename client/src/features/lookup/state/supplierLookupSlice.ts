import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  SupplierLookupItem,
  SupplierLookupResponse,
  SupplierLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchSupplierLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

// -----------------------------
// Initial State
// -----------------------------
const initialState: SupplierLookupState =
  createInitialOffsetPaginatedState<SupplierLookupItem>();

// -----------------------------
// Slice
// -----------------------------
const supplierLookupSlice = createSlice({
  name: 'supplierLookup',
  initialState,
  reducers: {
    /**
     * Reset Supplier lookup to clean initial pagination state.
     */
    resetSupplierLookup: (state) => {
      Object.assign(
        state,
        createInitialOffsetPaginatedState<SupplierLookupItem>()
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupplierLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSupplierLookupThunk.fulfilled,
        (state, action: PayloadAction<SupplierLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchSupplierLookupThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to fetch supplier lookup'
        );
      });
  },
});

// -----------------------------
// Exports
// -----------------------------
export const { resetSupplierLookup } = supplierLookupSlice.actions;

export default supplierLookupSlice.reducer;
