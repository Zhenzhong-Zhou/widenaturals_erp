import { combineReducers } from '@reduxjs/toolkit';
import { PayloadAction } from '@reduxjs/toolkit';
import sessionReducer from '../features/session/state/sessionSlice.ts';
import csrfReducer from '../features/csrf/state/csrfSlice';
import { PURGE } from 'redux-persist';

// Combine reducers
const appReducer = combineReducers({
  session: sessionReducer,
  csrf: csrfReducer,
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
  if (action.type === PURGE) {
    // Reset the entire state
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
