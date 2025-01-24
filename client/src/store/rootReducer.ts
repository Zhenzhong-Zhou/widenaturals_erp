import { combineReducers } from '@reduxjs/toolkit';
import { PayloadAction } from '@reduxjs/toolkit';
import healthReducer from '../features/health/state/healthStatusSlice.ts';
import csrfReducer from '../features/csrf/state/csrfSlice';
import sessionReducer from '../features/session/state/sessionSlice.ts';
import userProfileReducer from '../features/user/state/userProfileSlice.ts';
import resetPasswordReducer from '../features/resetPassword/state/resetPasswordSlice.ts';
import usersReducer from '../features/user/state/userSlice.ts';
import permissionsReducer from '../features/authorize/state/permissionSlice.ts';

// Combine reducers
const appReducer = combineReducers({
  health: healthReducer,
  csrf: csrfReducer,
  session: sessionReducer,
  userProfile: userProfileReducer,
  resetPassword: resetPasswordReducer,
  users: usersReducer,
  permissions: permissionsReducer,
});

// Root reducer with logout handling
const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: PayloadAction<any>
) => {
  if (action.type === 'auth/logout') {
    console.info('Resetting state on logout...');
    // Reset the entire state except for specific slices, if needed
    state = undefined;
  }

  return appReducer(state, action);
};

export default rootReducer;
