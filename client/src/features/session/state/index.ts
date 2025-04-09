import sessionReducer from './sessionSlice';

export const sessionReducers = {
  session: sessionReducer,
};

// Optionally export thunks, selectors, and types
export * from './sessionThunks';
export * from './sessionSelectors';
