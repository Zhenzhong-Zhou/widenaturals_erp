import customerCreateReducer from './customerCreateSlice';

export const customerReducers = {
  customerCreate: customerCreateReducer,
};

// Optional: export selectors, thunks, and types
// export * from './customerSelectors';
export * from './customerThunks';
export * from './customerTypes';
