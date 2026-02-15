import { createSlice } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import type {
  FlattenedSkuRecord,
  SkuListState,
} from '@features/sku/state/skuTypes';
import { fetchPaginatedSkusThunk } from '@features/sku/state/skuThunks';

// ---------------------------
// Initial State
// ---------------------------
const initialState: SkuListState =
  createInitialPaginatedState<FlattenedSkuRecord>();

// ---------------------------
// Slice
// ---------------------------
const paginatedSkusSlice = createSlice({
  name: 'paginatedSkus',
  initialState,

  reducers: {
    /**
     * Reset the entire paginated SKU state back to its initial,
     * empty state (e.g. when leaving the SKU list page).
     */
    resetPaginatedSkus: () => initialState,
  },

  // ---------------------------
  // Extra reducers
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedSkusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // ---- fulfilled ----
      .addCase(fetchPaginatedSkusThunk.fulfilled, (state, action) => {
        const { data, pagination } = action.payload;

        state.loading = false;
        state.data = data;
        state.pagination = pagination;
        state.error = null;
      })

      // ---- rejected ----
      .addCase(fetchPaginatedSkusThunk.rejected, (state, action) => {
        state.loading = false;

        // rejectWithValue(UiErrorPayload) OR fallback error
        state.error =
          action.payload?.message ??
          action.error.message ??
          'Failed to fetch SKUs.';
      });
  },
});

export const { resetPaginatedSkus } = paginatedSkusSlice.actions;

export default paginatedSkusSlice.reducer;
