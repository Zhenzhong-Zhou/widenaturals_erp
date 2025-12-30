import {
  loginFailure,
  loginStart,
  loginSuccess,
  logout,
  updateAccessToken,
} from '@features/session/state/sessionSlice';
import { sessionService } from '@services/sessionService';
import { csrfService } from '@services/csrfService';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppError, ErrorType, handleError } from '@utils/error';
import { updateCsrfToken } from '@features/csrf/state/csrfSlice';
import { persistor } from '@store/store';

export const loginThunk = createAsyncThunk(
  'session/login',
  async (
    credentials: { email: string; password: string },
    { dispatch, rejectWithValue }
  ) => {
    dispatch(loginStart()); // Dispatch loginStart action
    try {
      const response = await sessionService.login(
        credentials.email,
        credentials.password
      ); // Call login service

      dispatch(
        loginSuccess({
          user: response.user,
          accessToken: response.accessToken,
          lastLogin: response.lastLogin,
          message: 'Login successful',
        })
      );
      return response; // Return the response for further handling
    } catch (error) {
      const errorMessage =
        error instanceof AppError ? error.message : 'Login failed';
      dispatch(loginFailure(errorMessage)); // Dispatch loginFailure action
      return rejectWithValue(errorMessage);
    }
  }
);

/* =========================================================
 * Refresh Access Token Thunk
 * ======================================================= */

/**
 * Refreshes the user's access token and synchronizes CSRF state.
 *
 * Responsibilities:
 * - Invoke refresh-token service
 * - Update access token in Redux
 * - Fetch & update CSRF token
 *
 * Error handling:
 * - Authentication failures trigger logout
 * - All errors are normalized as AppError
 * - UI receives a simple rejection message
 */
export const refreshTokenThunk = createAsyncThunk<
  { accessToken: string; csrfToken: string },
  void,
  { rejectValue: string }
>('session/refreshToken', async (_, { dispatch, rejectWithValue }) => {
  try {
    /* ----------------------------------
     * 1. Refresh access token
     * ---------------------------------- */
    const { accessToken } = await sessionService.refreshToken();
    
    dispatch(updateAccessToken(accessToken));
    
    /* ----------------------------------
     * 2. Refresh CSRF token
     * ---------------------------------- */
    const csrfToken = await csrfService.fetchCsrfToken();
    
    if (!csrfToken) {
      throw AppError.server(
        'Failed to refresh CSRF token'
      );
    }
    
    dispatch(updateCsrfToken(csrfToken));
    
    return { accessToken, csrfToken };
  } catch (error: unknown) {
    const appError =
      error instanceof AppError
        ? error
        : AppError.unknown(
          'Token refresh failed',
          error
        );
    
    /* ----------------------------------
     * Authentication failures → logout
     * ---------------------------------- */
    if (appError.type === ErrorType.Authentication) {
      dispatch(logoutThunk());
    } else {
      handleError(appError);
      dispatch(logoutThunk());
    }
    
    return rejectWithValue('Token refresh failed');
  }
});

export const logoutThunk = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>('session/logout', async (_, { dispatch, rejectWithValue }) => {
  try {
    // Call the logout API
    await sessionService.logout();

    // Dispatch the logout action to clear Redux state
    dispatch(logout());

    // Clear persisted state
    await persistor.purge();

    // Explicitly return a success message
    return 'Logout successful';
  } catch (error) {
    console.error('Logout failed:', error);

    // Handle the error case by returning a rejected value
    return rejectWithValue('Failed to log out. Please try again.');
  }
});
