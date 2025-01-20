import { loginFailure, loginStart, loginSuccess, logout, updateAccessToken } from './sessionSlice.ts';
import { sessionService } from '../../../services';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppError, ErrorType } from '@utils/AppError.tsx';
import { handleError } from '@utils/errorUtils.ts';

export const loginThunk = createAsyncThunk(
  'session/login',
  async (credentials: { email: string; password: string }, { dispatch, rejectWithValue }) => {
    dispatch(loginStart()); // Dispatch loginStart action
    try {
      const response = await sessionService.login(credentials.email, credentials.password); // Call login service
      
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
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch(loginFailure(errorMessage)); // Dispatch loginFailure action
      return rejectWithValue(errorMessage);
    }
  }
);

// Define the refreshTokenThunk with createAsyncThunk
export const refreshTokenThunk = createAsyncThunk<string, void>(
  'session/refreshToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Call the refresh token service
      const { accessToken } = await sessionService.refreshToken();
      
      // Dispatch the updated access token to the Redux state
      dispatch(updateAccessToken(accessToken));
      
      // Return the new access token
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Handle specific error cases
      if (error instanceof AppError && error.type === ErrorType.GlobalError) {
        dispatch(logout()); // Perform logout if token refresh fails
      } else {
        handleError(error); // Log and handle unexpected errors
        dispatch(logout()); // Fallback to logout
      }
      
      // Reject the thunk with an error message
      return rejectWithValue('Token refresh failed');
    }
  }
);
