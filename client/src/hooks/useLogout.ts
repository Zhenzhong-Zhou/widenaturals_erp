import { useAppDispatch } from '../store/storeHooks.ts';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../utils/tokenManager.ts'; // Utility for clearing cookies
import { logoutThunk } from '../features/session/state/sessionThunks.ts'; // Thunk for backend logout
import { clearReduxState } from '../store/clearReduxState.ts'; // Redux-persist clear action

const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const logout = async () => {
    console.log('Logout initiated'); // Debugging
    
    try {
      // 1. Call logoutThunk to perform API logout
     await dispatch(logoutThunk()).unwrap();
      
      // 2. Clear cookies
      clearTokens();
      console.log('Cookies cleared'); // Debugging
      
      // 3. Clear localStorage
      localStorage.clear();
      
      // 4. Clear sessionStorage
      sessionStorage.clear();
      console.log('Storage cleared'); // Debugging
      
      // 5. Clear Redux store (if using redux-persist)
      dispatch(clearReduxState());
      console.log('Redux state cleared'); // Debugging
      
      // 6. Redirect to login page
      navigate('/login');
      console.log('Navigated to /login'); // Debugging
    } catch (error) {
      console.error('Error during logout:', error);
      // Optionally, display an error notification to the user
    }
  };
  
  return { logout };
};

export default useLogout;
