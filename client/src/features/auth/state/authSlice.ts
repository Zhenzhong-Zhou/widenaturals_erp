import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the shape of your state
interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string } | null; // Replace with your user model
  accessToken: string | null; // Access token stored as a string
  loginError: string | null;
  loading: boolean;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  loginError: null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Handle login initiation
    loginStart(state) {
      state.loading = true;
      state.loginError = null;
    },
    // Handle successful login
    loginSuccess(
      state,
      action: PayloadAction<{ user: AuthState['user']; accessToken: string }>
    ) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.loading = false;
    },
    // Handle login failure
    loginFailure(state, action: PayloadAction<string>) {
      state.isAuthenticated = false;
      state.loginError = action.payload;
      state.loading = false;
    },
    // Handle logout
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
