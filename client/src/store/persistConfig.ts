import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './rootReducer';

// Persistence configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['session'],
};

// Apply persistence to the root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export default persistedReducer;
