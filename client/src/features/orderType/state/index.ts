import paginatedOrderTypesReducer from './paginatedOrderTypesSlice';

export const orderTypeReducers = {
  paginatedOrderTypes: paginatedOrderTypesReducer,
};

// Optional: export thunks, selectors, and types
export * from './paginatedOrderTypesSelectors.ts';
export * from './orderTypeThunks';
export * from './orderTypeTypes';
