import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  UserProfileResponse,
  UserViewedProfileState,
} from '@features/user';
import { fetchUserViewedProfileThunk } from '@features/user';

const initialState: UserViewedProfileState = {
  data: null,
  loading: false,
  error: null,
  viewedUserId: null,
};

/**
 * Redux slice for viewing another user's profile (e.g. HR/Admin).
 *
 * Characteristics:
 * - Stores a permission-sliced profile for a target user
 * - Tracks `viewedUserId` to prevent stale data reuse
 * - Error state is string-based (simple UI messaging)
 *
 * This slice is route-driven and distinct from the self profile.
 */
const userViewedProfileSlice = createSlice({
  name: 'userViewedProfile',
  initialState,
  reducers: {
    resetUserViewedProfile: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserViewedProfileThunk.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // Track the currently viewed user to avoid stale profile reuse
        state.viewedUserId = action.meta.arg;
      })
      .addCase(
        fetchUserViewedProfileThunk.fulfilled,
        (state, action: PayloadAction<UserProfileResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
        }
      )
      .addCase(fetchUserViewedProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load user profile.';
      });
  },
});

export const { resetUserViewedProfile } = userViewedProfileSlice.actions;

export default userViewedProfileSlice.reducer;
