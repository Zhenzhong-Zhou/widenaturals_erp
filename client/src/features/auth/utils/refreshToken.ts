import axios from 'axios';
import { AppDispatch, RootState } from '../../../store/store.ts';
import { loginStart, loginSuccess, loginFailure, logout } from '../state/authSlice.ts';

export const refreshToken = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  const { tokens } = getState().auth;
  
  if (!tokens?.refreshToken) {
    dispatch(logout());
    return;
  }
  
  try {
    dispatch(loginStart());
    const response = await axios.post('/auth/refresh', {
      refreshToken: tokens.refreshToken,
    });
    
    dispatch(
      loginSuccess({
        user: response.data.user,
        tokens: {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
      })
    );
  } catch (error: any) {
    dispatch(loginFailure(error.message || 'Failed to refresh token'));
  }
};
