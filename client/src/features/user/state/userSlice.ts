import { createSlice } from '@reduxjs/toolkit';
import { fetchUserProfileThunk } from './userThunks.ts';
import { UserProfile } from './userTypes.ts';

// Define the UserState interface
interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

// Create userSlice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
    },
    updateUserProfile: (state, action) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfileThunk.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An unexpected error occurred';
      });
  },
});

export const { resetUserState, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;
