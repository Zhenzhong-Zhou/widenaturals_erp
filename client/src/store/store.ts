import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import persistedReducer from './persistConfig'; // Move persistence logic to a separate file

const isDevelopment = import.meta.env.NODE_ENV === 'development';

// Configure the store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for redux-persist
    }),
  devTools: isDevelopment,
});

// Create the persistor for Redux persist
export const persistor = persistStore(store);

// Export centralized types for state and dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
