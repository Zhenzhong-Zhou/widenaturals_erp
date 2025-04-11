import pricingTypesReducer from './pricingTypeSlice';
import pricingTypeReducer from './pricingTypeDetailSlice';
import pricingTypeDropdownReducer from './pricingTypeDropdownSlice';

export const pricingTypeReducers = {
  pricingTypes: pricingTypesReducer,
  pricingType: pricingTypeReducer,
  pricingTypeDropdown: pricingTypeDropdownReducer,
};

// Optionally export thunks, selectors, and types
export * from './pricingTypeSelectors';
export * from './pricingTypeDetailSelectors';
export * from './pricingTypeDropdownSelectors';
export * from './pricingTypeThunks';
export * from './pricingTypeTypes';
