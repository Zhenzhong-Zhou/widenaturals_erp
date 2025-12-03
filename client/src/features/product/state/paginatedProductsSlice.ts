import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import type {
  ProductListItem,
  ProductListResponse,
  ProductListState,
} from '@features/product/state/productTypes';
import { fetchPaginatedProductsThunk } from '@features/product/state/productThunks';

// ---------------------------
// Initial State
// ---------------------------
const initialState: ProductListState =
  createInitialPaginatedState<ProductListItem>();

// ---------------------------
// Slice
// ---------------------------
const paginatedProductsSlice = createSlice({
  name: 'paginatedProducts',
  initialState,
  reducers: {
    /**
     * Reset the entire paginated Product state back to a clean initial snapshot.
     * Useful when navigating away from the product list page to avoid stale data.
     */
    resetPaginatedProductsState: () => initialState,
  },

  // ---------------------------
  // Extra Reducers (pending / fulfilled / rejected)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedProductsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // ---- fulfilled ----
      .addCase(
        fetchPaginatedProductsThunk.fulfilled,
        (state, action: PayloadAction<ProductListResponse>) => {
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
      .addCase(fetchPaginatedProductsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          action.error?.message ||
          'Failed to fetch products.';
      });
  },
});

export const { resetPaginatedProductsState } = paginatedProductsSlice.actions;

export default paginatedProductsSlice.reducer;
