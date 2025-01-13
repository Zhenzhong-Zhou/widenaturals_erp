import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the shape of your state
interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string } | null; // Replace with your user model
  tokens: { accessToken: string; refreshToken: string } | null;
  loginError: string | null;
  loading: boolean;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loginError: null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.loginError = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: AuthState['user']; tokens: AuthState['tokens'] }>) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.loading = false;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isAuthenticated = false;
      state.loginError = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.tokens = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
