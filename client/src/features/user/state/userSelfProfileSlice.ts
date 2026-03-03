import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { UserProfileResponse, UserSelfProfileState } from '@features/user';
import { fetchUserSelfProfileThunk } from '@features/user';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: UserSelfProfileState = {
  data: null,
  loading: false,
  error: null,
};

/**
 * Redux slice for the authenticated user's own profile.
 *
 * Characteristics:
 * - Stores only the currently authenticated user's profile
 * - Error state is string-based (UI-friendly, no diagnostics)
 * - Used by self-profile pages and account views
 *
 * This slice must never be used to store profiles of other users.
 */
const userSelfProfileSlice = createSlice({
  name: 'userSelfProfile',
  initialState,
  reducers: {
    resetUserSelfProfile: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserSelfProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserSelfProfileThunk.fulfilled,
        (state, action: PayloadAction<UserProfileResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
        }
      )
      .addCase(fetchUserSelfProfileThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to load user profile.');
      })
  },
});

export const { resetUserSelfProfile } = userSelfProfileSlice.actions;
export default userSelfProfileSlice.reducer;
