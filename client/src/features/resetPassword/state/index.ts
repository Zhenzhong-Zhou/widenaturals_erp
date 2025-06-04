import resetPasswordReducer from './resetPasswordSlice';

export const resetPasswordReducers = {
  resetPassword: resetPasswordReducer,
};

// Optionally export selectors, thunks, and types here
export * from './resetPasswordSelectors';
export * from './resetPasswordThunk';
export * from './resetPasswordTypes';
