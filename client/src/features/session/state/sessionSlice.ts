import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SessionState {
  isAuthenticated: boolean;
  user: { id: string; name: string } | null; // User details
  accessToken: string | null; // Access token
  lastLogin: string | null; // Last login timestamp
  message: string | null; // Success or error messages
  loginError: string | null; // Error message for login failures
  loading: boolean; // Loading state
}

const initialState: SessionState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  lastLogin: null,
  message: null,
  loginError: null,
  loading: false,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.loginError = null;
      state.message = null;
    },
    loginSuccess(
      state,
      action: PayloadAction<{
        user: SessionState['user'];
        accessToken: string;
        lastLogin: string;
        message: string;
      }>
    ) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.lastLogin = action.payload.lastLogin;
      state.message = action.payload.message;
      state.loading = false;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isAuthenticated = false;
      state.loginError = action.payload;
      state.loading = false;
    },
    logout(state) {
      Object.assign(state, initialState); // Resets state to initial
    },
    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    sessionExpired(state) {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.message = 'Session has expired. Please log in again.';
    },
    setMessage(state, action: PayloadAction<string | null>) {
      state.message = action.payload;
    },
    refreshTokenFailure(state, action: PayloadAction<string>) {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.loginError = action.payload;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateAccessToken,
  sessionExpired,
  setMessage,
  refreshTokenFailure,
} = sessionSlice.actions;

export default sessionSlice.reducer;
