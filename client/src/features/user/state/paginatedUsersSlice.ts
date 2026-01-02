import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import {
  PaginatedUsersState,
  PaginatedUserCardListResponse,
  PaginatedUserListResponse,
  UserCardView,
  UserListView,
  fetchPaginatedUsersThunk,
} from '@features/user/state';

// ---------------------------
// Initial State
// ---------------------------
const initialState: PaginatedUsersState = createInitialPaginatedState<
  UserCardView | UserListView
>();

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
      .addCase(
        fetchPaginatedUsersThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            PaginatedUserCardListResponse | PaginatedUserListResponse
          >
        ) => {
          const payload = action.payload;

          state.loading = false;
          state.data = payload.data; // UserCardView[] or UserListView[]

          state.pagination = {
            page: payload.pagination.page,
            limit: payload.pagination.limit,
            totalRecords: payload.pagination.totalRecords,
            totalPages: payload.pagination.totalPages,
          };
        }
      )

      // ---- rejected ----
      .addCase(fetchPaginatedUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch users.';
      });
  },
});

export const { resetPaginatedUsers } = paginatedUsersSlice.actions;
export default paginatedUsersSlice.reducer;
