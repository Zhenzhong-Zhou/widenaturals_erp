import { AppDispatch, RootState } from '../../../store/store';
import { loginSuccess, logout } from './authSlice.ts';
import { refreshToken } from '../../../services/authenticateService.ts';

export const refreshTokenThunk = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    const tokens = await refreshToken(); // Call the standalone function
    const { user } = getState().auth; // Preserve user state if available
    
    dispatch(
      loginSuccess({
        user,
        tokens,
      })
    );
  } catch (error) {
    console.error('Token refresh failed:', error);
    dispatch(logout()); // Logout if the token refresh fails
  }
};
