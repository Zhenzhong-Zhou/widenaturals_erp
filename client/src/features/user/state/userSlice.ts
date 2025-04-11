import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchUsersThunk, type PaginationInfo, type User, type UsersState } from '@features/user';

const initialState: UsersState = {
  users: {
    data: [], // User list
    pagination: { limit: 10, page: 1, totalPages: 0, totalRecords: 0 }, // Default pagination
  },
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsers: (state) => {
      state.users = {
        data: [],
        pagination: { limit: 10, page: 1, totalPages: 0, totalRecords: 0 },
      }; // Reset to initial structure
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUsersThunk.fulfilled,
        (
          state,
          action: PayloadAction<{ data: User[]; pagination: PaginationInfo }>
        ) => {
          state.loading = false;
          state.users = action.payload; // Expecting both data and pagination
        }
      )
      .addCase(fetchUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      });
  },
});

export const { clearUsers } = userSlice.actions;
export default userSlice.reducer;
