import { AppDispatch, RootState } from '../../../store/store';
import { loginSuccess, logout } from './authSlice.ts';
import { authService } from '../../../services';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const loginThunk = createAsyncThunk(
  'session/login',
  async ({ email, password }: { email: string; password: string }, { dispatch }) => {
    try {
      const response = await authService.login(email, password); // Call login service
      console.log(response)
      const { user, accessToken } = response;
      dispatch(loginSuccess({ user, accessToken })); // Update Redux state
      return response; // Optionally return response for further use
    } catch (error) {
      throw error; // Let the component handle errors
    }
  }
);

export const refreshTokenThunk = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    // Call the refresh endpoint to get a new access token
    const { accessToken } = await authService.refreshToken();
    
    const { user } = getState().auth; // Preserve the user state
    
    dispatch(
      loginSuccess({
        user,
        accessToken,
      })
    );
  } catch (error) {
    console.error('Token refresh failed:', error);
    dispatch(logout()); // Logout if the token refresh fails
  }
};
