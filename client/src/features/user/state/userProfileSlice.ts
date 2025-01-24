import { createSlice } from '@reduxjs/toolkit';
import { fetchUserProfileThunk } from './userThunks.ts';
import { UserProfile, UserProfileResponse } from './userTypes.ts';

// Define the UserState interface
interface UserProfileState {
  response: UserProfileResponse | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserProfileState = {
  response: null,
  loading: false,
  error: null,
};

// Create userProfileSlice
const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    resetUserProfileState: (state) => {
      state.response = null;
      state.loading = false;
      state.error = null;
    },
    updateUserProfile: (state, action: { payload: Partial<UserProfile> }) => {
      if (state.response && state.response.data) {
        state.response.data = { ...state.response.data, ...action.payload };
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
        state.response = action.payload; // Full UserResponse
        state.loading = false;
      })
      .addCase(fetchUserProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An unexpected error occurred';
      });
  },
});

export const { resetUserProfileState, updateUserProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;
