import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createInitialPaginatedState } from '@store/pagination';
import type { GetSkuProductCardsResponse, SkuProductCard, SkuProductCardsState } from '@features/sku/state/skuTypes';
import { fetchPaginatedSkuProductCardsThunk } from '@features/sku/state/skuThunks';

/**
 * Initial paginated state for SKU product cards.
 *
 * Includes:
 * - data
 * - pagination (page, limit, totalPages, totalRecords)
 * - loading
 * - error
 * - params (last-used query params for UI persistence)
 */
const initialState: SkuProductCardsState = createInitialPaginatedState<SkuProductCard>();

export const skuProductCardsSlice = createSlice({
  name: "skuProductCards",
  initialState,
  
  reducers: {
    /**
     * Fully resets the slice to its initial state.
     *
     * Useful when:
     * - leaving the SKU module
     * - switching user accounts
     * - clearing UI state
     */
    resetSkuProductCards: () => initialState,
  },
  
  extraReducers: (builder) => {
    builder
      // -------------------------------------------------------
      // FETCH → PENDING
      // -------------------------------------------------------
      .addCase(fetchPaginatedSkuProductCardsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // -------------------------------------------------------
      // FETCH → SUCCESS
      // -------------------------------------------------------
      .addCase(
        fetchPaginatedSkuProductCardsThunk.fulfilled,
        (state, action: PayloadAction<GetSkuProductCardsResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
          console.log( state.data);
          state.pagination = action.payload.pagination;
        }
      )
      
      // -------------------------------------------------------
      // FETCH → FAILURE
      // -------------------------------------------------------
      .addCase(fetchPaginatedSkuProductCardsThunk.rejected, (state, action) => {
        state.loading = false;
        
        // Prefer backend-provided message if any exists
        state.error =
          (action.payload as any)?.message ||
          action.error?.message ||
          "Failed to fetch SKU product cards.";
      });
  },
});

export const {
  resetSkuProductCards,
} = skuProductCardsSlice.actions;

export default skuProductCardsSlice.reducer;
