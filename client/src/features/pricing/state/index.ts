import pricingsReducer from './pricingSlice';
import pricingReducer from './pricingDetailSlice';
import pricingValueReducer from './pricingValueSlice';

export const pricingReducers = {
  pricings: pricingsReducer,
  pricing: pricingReducer,
  pricingValue: pricingValueReducer,
};

// Optional: Export thunks, selectors, types
export * from './pricingSelectors';
export * from './pricingDetailSelectors';
export * from './pricingValueSelectors';
export * from './pricingThunks';
export * from './pricingTypes';