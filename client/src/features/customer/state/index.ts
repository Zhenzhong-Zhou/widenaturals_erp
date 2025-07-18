import customerCreateReducer from './customerCreateSlice';
import paginatedCustomersReducer from './paginatedCustomersSlice';

export const customerReducers = {
  customerCreate: customerCreateReducer,
  paginatedCustomers: paginatedCustomersReducer,
};

// Optional: export selectors, thunks, and types
export * from './customerCreateSelectors';
export * from './paginatedCustomersSelectors';
export * from './customerThunks';
export * from './customerTypes';
