import pricingTypesReducer from './pricingTypeSlice';
import pricingTypeMetadataReducer from './pricingTypeMetadataSlice.ts';
import pricingTypeDropdownReducer from './pricingTypeDropdownSlice';

export const pricingTypeReducers = {
  pricingTypes: pricingTypesReducer,
  pricingTypeMetadata: pricingTypeMetadataReducer,
  pricingTypeDropdown: pricingTypeDropdownReducer,
};

// Optionally export thunks, selectors, and types
export * from './pricingTypeSelectors';
export * from './pricingTypeMetadataSelectors';
export * from './pricingTypeDropdownSelectors';
export * from './pricingTypeThunks';
export * from './pricingTypeTypes';
