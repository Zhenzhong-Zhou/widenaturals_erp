import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import type {
  GetSkuListResponse,
  SkuListItem,
  SkuListState,
} from '@features/sku/state/skuTypes';
import { fetchPaginatedSkusThunk } from '@features/sku/state/skuThunks';

// ---------------------------
// Initial State
// ---------------------------
const initialState: SkuListState = createInitialPaginatedState<SkuListItem>();

// ---------------------------
// Slice
// ---------------------------
const paginatedSkusSlice = createSlice({
  name: 'paginatedSkus',
  initialState,
  reducers: {
    /**
     * Reset the entire paginated SKU state back to clean initial
     * (e.g., when leaving SKU page)
     */
    resetPaginatedSkusState: () => initialState,
  },

  // ---------------------------
  // Extra reducers (pending / fulfilled / rejected)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedSkusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // ---- fulfilled ----
      .addCase(
        fetchPaginatedSkusThunk.fulfilled,
        (state, action: PayloadAction<GetSkuListResponse>) => {
          const payload = action.payload;

          state.loading = false;
          state.data = payload.data;

          state.pagination = {
            page: payload.pagination.page,
            limit: payload.pagination.limit,
            totalRecords: payload.pagination.totalRecords,
            totalPages: payload.pagination.totalPages,
          };
        }
      )

      // ---- rejected ----
      .addCase(fetchPaginatedSkusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || 'Failed to fetch SKUs.';
      });
  },
});

export const { resetPaginatedSkusState } = paginatedSkusSlice.actions;

export default paginatedSkusSlice.reducer;
