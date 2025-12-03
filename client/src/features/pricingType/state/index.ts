import pricingTypesReducer from './pricingTypeSlice';
import pricingTypeMetadataReducer from './pricingTypeMetadataSlice';

export const pricingTypeReducers = {
  pricingTypes: pricingTypesReducer,
  pricingTypeMetadata: pricingTypeMetadataReducer,
};

// Optionally export thunks, selectors, and types
export * from './pricingTypeSelectors';
export * from './pricingTypeMetadataSelectors';
export * from './pricingTypeThunks';
export * from './pricingTypeTypes';
