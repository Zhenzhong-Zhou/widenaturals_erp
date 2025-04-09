import csrfReducer from './csrfSlice';

export const csrfReducers = {
  csrf: csrfReducer,
};

// Optional: export thunks, selectors, types
export * from './csrfSlice'; // if it contains actions
export * from './csrfSelector';
