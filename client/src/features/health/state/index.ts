import healthReducer from './healthStatusSlice';

export const healthReducers = {
  health: healthReducer,
};

// Optionally export selectors, thunks, or types
export * from './healthStatusSelectors';
export * from './healthStatusThunk';
export * from './healthStatusState';
