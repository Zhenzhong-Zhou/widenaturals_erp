import { PURGE } from 'redux-persist';

// For redux-persist (clearing persisted state)
export const clearReduxState = () => ({
  type: PURGE,
  key: 'root', // Ensure this matches your redux-persist configuration key
});
