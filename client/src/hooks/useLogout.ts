import { useDispatch } from 'react-redux';
import { clearReduxState } from '../store/clearReduxState.ts';
import { useNavigate } from 'react-router-dom';

const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const logout = () => {
    console.log('Logout initiated'); // Debugging
    // 1. Clear cookies
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.split("=");
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    console.log('Cookies cleared'); // Debugging
    
    
    // 2. Clear localStorage
    localStorage.clear();
    
    // 3. Clear sessionStorage
    sessionStorage.clear();
    console.log('Storage cleared'); // Debugging
    
    // 4. Clear Redux store (if using redux-persist)
    dispatch(clearReduxState()); // Action to clear Redux state if using redux-persist
    console.log('Redux state cleared'); // Debugging
    
    // 5. Redirect to login page
    navigate('/login');
    console.log('Navigating to /login'); // Debugging
  };
  
  return { logout };
};

export default useLogout;
