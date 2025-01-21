import { useAppDispatch } from '../store/storeHooks';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../utils/tokenManager';
import { logoutThunk } from '../features/session/state/sessionThunks';
import { clearReduxState } from '../store/clearReduxState';
import { useCallback } from 'react';

/**
 * Custom hook for user logout.
 */
const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const logout = useCallback(async () => {
    try {
      console.log('Logout initiated');
      
      // Perform API logout
      await dispatch(logoutThunk()).unwrap();
      
      // Clear client-side data
      clearTokens();
      localStorage.clear();
      sessionStorage.clear();
      dispatch(clearReduxState());
      
      console.log('Client data cleared. Redirecting to /login');
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [dispatch, navigate]);
  
  return { logout };
};

export default useLogout;
