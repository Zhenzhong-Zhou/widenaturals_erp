import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import {
  fetchPaginatedLocationThunk,
} from '@features/location';
import type {
  PaginatedLocationState,
  FlattenedLocationListRecord,
  PaginatedLocationListUiResponse,
} from '@features/location';

/* ============================================================
   Initial State
   ============================================================ */

/**
 * Initial paginated state for locations.
 *
 * Uses flattened UI-ready row model.
 */
const initialState: PaginatedLocationState =
  createInitialPaginatedState<FlattenedLocationListRecord>();

/* ============================================================
   Slice
   ============================================================ */

const paginatedLocationsSlice = createSlice({
  name: 'paginatedLocations',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated location state
     * back to its initial configuration.
     *
     * Typically used when:
     * - Leaving the location page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedLocations: () => initialState,
  },
  
  /* ============================================================
     Async lifecycle handling
     ============================================================ */
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedLocationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(
        fetchPaginatedLocationThunk.fulfilled,
        (
          state,
          action: PayloadAction<PaginatedLocationListUiResponse>
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
      .addCase(fetchPaginatedLocationThunk.rejected, (state, action) => {
        state.loading = false;
        
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch location records.';
      });
  },
});

export const {
  resetPaginatedLocations,
} = paginatedLocationsSlice.actions;

export default paginatedLocationsSlice.reducer;
