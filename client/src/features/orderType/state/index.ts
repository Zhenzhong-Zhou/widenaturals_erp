import orderTypesReducer from './orderTypeSlice';

export const orderTypeReducers = {
  orderTypes: orderTypesReducer,
};

// Optional: export thunks, selectors, and types
export * from './orderTypeSelectors';
export * from './orderTypeThunks';
export * from './orderTypeTypes';
