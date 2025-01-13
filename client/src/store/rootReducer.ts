import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/state/authSlice';

// Combine reducers
const appReducer = combineReducers({
  auth: authReducer,
});

// Root reducer with logout handling
const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: any) => {
  if (action.type === 'auth/logout') {
    // Reset all state on logout
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
