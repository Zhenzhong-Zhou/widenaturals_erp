import customersCreateReducer from './customerCreateSlice';
import customersReducer from './customerSlice';
import customerDetailReducer from './customerDetailSlice';
import customerDropdownReducer from './customerDropdownSlice';

export const customerReducers = {
  customersCreate: customersCreateReducer,
  customers: customersReducer,
  customerDetail: customerDetailReducer,
  customerDropdown: customerDropdownReducer,
};

// Optional: export selectors, thunks, and types
export * from './customerSelectors';
export * from './customerThunks';
export * from './customerTypes';