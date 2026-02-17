import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchPaginatedLocationTypeThunk } from '@features/locationType';
import type {
  PaginatedLocationTypeState,
  FlattenedLocationTypeRecord,
  PaginatedLocationTypeListUiResponse,
} from '@features/locationType';

/* ============================================================
   Initial State
   ============================================================ */

/**
 * Initial paginated state for location types.
 *
 * Uses flattened UI-ready row model.
 */
const initialState: PaginatedLocationTypeState =
  createInitialPaginatedState<FlattenedLocationTypeRecord>();

/* ============================================================
   Slice
   ============================================================ */

const paginatedLocationTypesSlice = createSlice({
  name: 'paginatedLocationTypes',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated location type state
     * back to its initial configuration.
     *
     * Typically used when:
     * - Leaving the location type page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedLocationTypes: () => initialState,
  },
  
  /* ============================================================
     Async lifecycle handling
     ============================================================ */
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedLocationTypeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedLocationTypeThunk.fulfilled,
        (
          state,
          action: PayloadAction<PaginatedLocationTypeListUiResponse>
        ) => {
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
      .addCase(fetchPaginatedLocationTypeThunk.rejected, (state, action) => {
        state.loading = false;
        
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch location type records.';
      });
  },
});

export const { resetPaginatedLocationTypes } =
  paginatedLocationTypesSlice.actions;

export default paginatedLocationTypesSlice.reducer;
