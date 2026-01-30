import { createSlice } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import type {
  PaginatedUsersState,
  FlattenedUserRecord,
} from '@features/user/state';
import { fetchPaginatedUsersThunk } from '@features/user/state';

// ---------------------------
// Initial State
// ---------------------------
const initialState: PaginatedUsersState =
  createInitialPaginatedState<FlattenedUserRecord>();

// ---------------------------
// Slice
// ---------------------------
const paginatedUsersSlice = createSlice({
  name: 'paginatedUsers',
  initialState,
  
  reducers: {
    /**
     * Reset the entire paginated users state back to its
     * initial, empty configuration.
     *
     * Typically used when:
     * - Leaving the users page
     * - Switching modules
     * - Performing a full filter reset
     */
    resetPaginatedUsers: () => initialState,
  },
  
  // ---------------------------
  // Extra reducers (async thunk lifecycle)
  // ---------------------------
  extraReducers: (builder) => {
    builder
      // ---- pending ----
      .addCase(fetchPaginatedUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // ---- fulfilled ----
      .addCase(fetchPaginatedUsersThunk.fulfilled, (state, action) => {
        const { data, pagination } = action.payload;
        
        state.loading = false;
        state.data = data; // FlattenedUserRecord[]
        state.pagination = pagination;
        state.error = null;
      })
      
      // ---- rejected ----
      .addCase(fetchPaginatedUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ??
          action.error.message ??
          'Failed to fetch users.';
      });
  },
});

export const { resetPaginatedUsers } = paginatedUsersSlice.actions;
export default paginatedUsersSlice.reducer;
