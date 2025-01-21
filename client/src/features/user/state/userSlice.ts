import { createSlice } from '@reduxjs/toolkit';
import { fetchUserProfileThunk } from './userThunks.ts';
import { UserProfile, UserResponse } from './userTypes.ts';

// Define the UserState interface
interface UserState {
  response: UserResponse | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  response: null,
  loading: false,
  error: null,
};

// Create userSlice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    resetUserState: (state) => {
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

export const { resetUserState, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;
